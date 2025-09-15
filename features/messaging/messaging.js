// P2P messaging system for Physical
class Messaging {
    constructor() {
        this.isInitialized = false;
        this.activeChats = new Map();
        this.messageHistory = new Map();
        this.currentChatUserId = null;
    }

    async init() {
        try {
            console.log('💬 Initializing messaging...');
            
            // Check dependencies
            if (!window.Encryption) {
                throw new Error('Encryption not ready');
            }

            // Set up event listeners
            this.setupEventListeners();
            
            // Load message history
            this.loadMessageHistory();
            
            this.isInitialized = true;
            console.log('✅ Messaging initialized');
            
        } catch (error) {
            console.error('❌ Messaging initialization failed:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Listen for user matches to auto-start chats
        Utils.events.on('user-matched', (user) => {
            this.handleUserMatched(user);
        });
    }

    async handleUserMatched(user) {
        try {
            // Auto-create chat for matched users
            await this.startChat(user.id);
            
            // Send welcome message
            const welcomeMessage = `Hey ${user.username}! We matched! 🎉`;
            await this.sendMessage(welcomeMessage, user.id);
            
        } catch (error) {
            console.error('❌ Failed to handle user match:', error);
        }
    }

    async startChat(userId) {
        try {
            if (!this.isInitialized) {
                throw new Error('Messaging not initialized');
            }

            const user = window.Discovery ? window.Discovery.getUser(userId) : null;
            if (!user) {
                throw new Error('User not found');
            }

            // Create chat if it doesn't exist
            if (!this.activeChats.has(userId)) {
                const chat = {
                    userId: userId,
                    username: user.username,
                    publicKey: user.publicKey,
                    createdAt: Date.now(),
                    lastMessageAt: Date.now()
                };
                
                this.activeChats.set(userId, chat);
                console.log(`💬 Chat started with: ${user.username}`);
            }

            // Set as current chat
            this.currentChatUserId = userId;
            
            // Load and display message history
            this.displayChatMessages(userId);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to start chat:', error);
            throw error;
        }
    }

    async sendMessage(messageText = null, targetUserId = null) {
        try {
            if (!this.isInitialized) {
                throw new Error('Messaging not initialized');
            }

            const userId = targetUserId || this.currentChatUserId;
            if (!userId) {
                throw new Error('No active chat');
            }

            // Get message from input if not provided
            let message = messageText;
            if (!message) {
                const messageInput = document.getElementById('message-input');
                if (!messageInput) {
                    throw new Error('Message input not found');
                }
                message = messageInput.value.trim();
                messageInput.value = '';
            }

            if (!message) {
                return;
            }

            // Check for IRC-style commands
            if (message.startsWith('/')) {
                await this.handleCommand(message, userId);
                return;
            }

            const chat = this.activeChats.get(userId);
            if (!chat) {
                throw new Error('Chat not found');
            }

            // Create message object
            const messageObj = {
                id: Utils.generateId(),
                text: message,
                senderId: window.Profiles ? window.Profiles.getCurrentProfile()?.id : 'unknown',
                senderName: window.Profiles ? window.Profiles.getCurrentProfile()?.username : 'You',
                recipientId: userId,
                timestamp: Date.now(),
                encrypted: false
            };

            // Encrypt message if possible
            if (chat.publicKey) {
                try {
                    messageObj.text = await window.Encryption.encryptMessage(message, chat.publicKey);
                    messageObj.encrypted = true;
                } catch (error) {
                    console.warn('⚠️ Failed to encrypt message, sending in plain text:', error);
                }
            }

            // Store message in history
            this.addMessageToHistory(userId, messageObj);

            // Display message in UI
            this.displayMessage(messageObj, true);

            // Simulate sending via P2P (in real implementation, this would use WebRTC)
            await this.simulateP2PSend(messageObj, userId);

            console.log(`💬 Message sent to ${chat.username}: ${message}`);
            
        } catch (error) {
            console.error('❌ Failed to send message:', error);
            Utils.showNotification('Failed to send message', 'error');
        }
    }

    async handleCommand(command, userId) {
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        
        switch (cmd) {
            case '/help':
                this.showCommandHelp();
                break;
                
            case '/clear':
                this.clearChatHistory(userId);
                break;
                
            case '/who':
                this.showNearbyUsers();
                break;
                
            case '/msg':
                if (parts.length >= 3) {
                    const targetUser = parts[1];
                    const message = parts.slice(2).join(' ');
                    await this.sendDirectMessage(targetUser, message);
                } else {
                    this.displaySystemMessage('Usage: /msg <username> <message>');
                }
                break;
                
            case '/hug':
                if (parts.length >= 2) {
                    const targetUser = parts[1];
                    await this.sendEmote('hug', targetUser, userId);
                } else {
                    await this.sendEmote('hug', null, userId);
                }
                break;
                
            case '/slap':
                if (parts.length >= 2) {
                    const targetUser = parts[1];
                    await this.sendEmote('slap', targetUser, userId);
                } else {
                    await this.sendEmote('slap', null, userId);
                }
                break;
                
            default:
                this.displaySystemMessage(`Unknown command: ${cmd}. Type /help for available commands.`);
        }
    }

    showCommandHelp() {
        const helpText = `
Available commands:
• /help - Show this help
• /clear - Clear chat history
• /who - List nearby users
• /msg <user> <message> - Send private message
• /hug <user> - Send hug emote
• /slap <user> - Send slap emote
        `.trim();
        
        this.displaySystemMessage(helpText);
    }

    clearChatHistory(userId) {
        this.messageHistory.delete(userId);
        this.saveMessageHistory();
        
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        
        this.displaySystemMessage('Chat history cleared');
    }

    showNearbyUsers() {
        if (!window.Discovery) {
            this.displaySystemMessage('Discovery not available');
            return;
        }
        
        const nearbyUsers = window.Discovery.getNearbyUsers();
        if (nearbyUsers.length === 0) {
            this.displaySystemMessage('No users nearby');
            return;
        }
        
        const userList = nearbyUsers.map(user => 
            `• ${user.username} (${Utils.formatDistance(user.distance)} away)`
        ).join('\n');
        
        this.displaySystemMessage(`Nearby users:\n${userList}`);
    }

    async sendDirectMessage(targetUsername, message) {
        // Find user by username
        const nearbyUsers = window.Discovery ? window.Discovery.getNearbyUsers() : [];
        const targetUser = nearbyUsers.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
        
        if (!targetUser) {
            this.displaySystemMessage(`User not found: ${targetUsername}`);
            return;
        }
        
        await this.sendMessage(`[DM] ${message}`, targetUser.id);
    }

    async sendEmote(emoteType, targetUsername, userId) {
        const emotes = {
            hug: '🤗',
            slap: '👋'
        };
        
        const emoteIcon = emotes[emoteType] || '❓';
        let message;
        
        if (targetUsername) {
            message = `${emoteIcon} *${emoteType}s ${targetUsername}*`;
        } else {
            const chat = this.activeChats.get(userId);
            const recipientName = chat ? chat.username : 'you';
            message = `${emoteIcon} *${emoteType}s ${recipientName}*`;
        }
        
        await this.sendMessage(message, userId);
    }

    async simulateP2PSend(message, userId) {
        // Simulate P2P message transmission delay
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        
        // Simulate occasional message delivery (for testing)
        if (Math.random() < 0.8) { // 80% delivery success
            // Simulate receiving a response after a delay
            setTimeout(() => {
                this.simulateReceivedMessage(userId);
            }, 1000 + Math.random() * 3000);
        }
    }

    simulateReceivedMessage(userId) {
        const chat = this.activeChats.get(userId);
        if (!chat) return;
        
        const responses = [
            "Hey there! 👋",
            "Thanks for the message!",
            "How's it going?",
            "Nice to meet you!",
            "What are you up to?",
            "Cool! Tell me more",
            "That sounds interesting",
            "Haha, funny! 😄"
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const receivedMessage = {
            id: Utils.generateId(),
            text: randomResponse,
            senderId: userId,
            senderName: chat.username,
            recipientId: window.Profiles ? window.Profiles.getCurrentProfile()?.id : 'me',
            timestamp: Date.now(),
            encrypted: false
        };
        
        // Only show if this is the active chat
        if (this.currentChatUserId === userId) {
            this.addMessageToHistory(userId, receivedMessage);
            this.displayMessage(receivedMessage, false);
            
            // Emit message received event
            Utils.events.emit('message-received', receivedMessage);
        }
    }

    displayMessage(message, isSent) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${Utils.sanitizeInput(message.text)}</div>
                <div class="message-time">${Utils.formatTime(message.timestamp)}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        if (window.UIManager) {
            window.UIManager.scrollChatToBottom();
        }
    }

    displaySystemMessage(text) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message system';
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${text.replace(/\n/g, '<br>')}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageElement);
        
        if (window.UIManager) {
            window.UIManager.scrollChatToBottom();
        }
    }

    displayChatMessages(userId) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        chatMessages.innerHTML = '';
        
        const messages = this.messageHistory.get(userId) || [];
        const myId = window.Profiles ? window.Profiles.getCurrentProfile()?.id : 'me';
        
        messages.forEach(message => {
            this.displayMessage(message, message.senderId === myId);
        });
    }

    addMessageToHistory(userId, message) {
        if (!this.messageHistory.has(userId)) {
            this.messageHistory.set(userId, []);
        }
        
        this.messageHistory.get(userId).push(message);
        this.saveMessageHistory();
    }

    loadMessageHistory() {
        const stored = Utils.storage.get('messageHistory');
        if (stored) {
            this.messageHistory = new Map(Object.entries(stored));
        }
    }

    saveMessageHistory() {
        const historyObj = Object.fromEntries(this.messageHistory);
        Utils.storage.set('messageHistory', historyObj);
    }

    getActiveChats() {
        return Array.from(this.activeChats.values());
    }

    getChatHistory(userId) {
        return this.messageHistory.get(userId) || [];
    }

    clearAllChats() {
        this.activeChats.clear();
        this.messageHistory.clear();
        this.currentChatUserId = null;
        this.saveMessageHistory();
        console.log('🧹 All chats cleared');
    }
}

// Create global instance
window.Messaging = new Messaging();
