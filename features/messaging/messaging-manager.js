// Messaging Manager for chat functionality
class MessagingManager {
    constructor() {
        this.currentChatUserId = null;
    }

    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        if (!messageInput || !messageInput.value.trim()) return;

        const messageText = messageInput.value.trim();
        const currentChatUser = Utils.storage.get('currentChatUser');
        
        if (!currentChatUser) {
            Utils.showNotification('No active chat', 'error');
            return;
        }

        try {
            // Create message object
            const message = {
                id: Utils.generateId(),
                text: messageText,
                sender: 'me',
                receiver: currentChatUser.id,
                timestamp: Date.now(),
                senderName: window.Profiles ? window.Profiles.getCurrentProfile().username : 'You'
            };

            // Store message in conversation history
            this.storeMessage(currentChatUser.id, message);

            // Add message to UI
            this.addMessageToUI(message);

            // Clear input
            messageInput.value = '';

            // Scroll to bottom
            if (window.UIManager) {
                window.UIManager.scrollChatToBottom();
            }

            // Simulate receiving a response (for demo purposes)
            setTimeout(() => {
                this.simulateResponse(currentChatUser);
            }, 1000 + Math.random() * 2000);

        } catch (error) {
            console.error('Failed to send message:', error);
            Utils.showNotification('Failed to send message', 'error');
        }
    }

    storeMessage(userId, message) {
        const conversations = Utils.storage.get('conversations') || {};
        if (!conversations[userId]) {
            conversations[userId] = [];
        }
        conversations[userId].push(message);
        Utils.storage.set('conversations', conversations);
    }

    addMessageToUI(message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender === 'me' ? 'sent' : 'received'}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${message.text}</div>
                <div class="message-time">${Utils.formatTime(message.timestamp)}</div>
            </div>
        `;

        chatMessages.appendChild(messageElement);
    }

    simulateResponse(user) {
        const responses = [
            "Hey! How are you doing?",
            "That's interesting! Tell me more.",
            "I'm doing great, thanks for asking!",
            "What are you up to today?",
            "I love that! We should hang out sometime.",
            "Sounds awesome! I'm free this weekend.",
            "Haha, that's funny! 😄",
            "I totally agree with you on that.",
            "That's so cool! I've never tried that before.",
            "Thanks for the message! How's your day going?"
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const responseMessage = {
            id: Utils.generateId(),
            text: randomResponse,
            sender: 'them',
            receiver: window.Profiles ? window.Profiles.getCurrentProfile().id : 'me',
            timestamp: Date.now(),
            senderName: user.username
        };

        this.storeMessage(user.id, responseMessage);
        this.addMessageToUI(responseMessage);

        if (window.UIManager) {
            window.UIManager.scrollChatToBottom();
        }
    }

    async startChat(userId) {
        if (window.Messaging) {
            try {
                await window.Messaging.startChat(userId);
                this.currentChatUserId = userId;
                
                if (window.UIManager) {
                    window.UIManager.showChatScreen(userId);
                }
                
                Utils.showNotification('Chat started', 'success');
            } catch (error) {
                console.error('Failed to start chat:', error);
                Utils.showNotification('Failed to start chat', 'error');
            }
        }
    }

    handleMessageReceived(message) {
        // Update UI if this is the active chat
        if (this.currentChatUserId === message.senderId) {
            // Message already displayed by Messaging class
        }
        
        // Show notification for new messages
        Utils.showNotification(`New message from ${message.senderName}`, 'info', 3000);
    }

    getCurrentChatUserId() {
        return this.currentChatUserId;
    }

    setCurrentChatUserId(userId) {
        this.currentChatUserId = userId;
    }
}

// Create global instance
window.MessagingManager = new MessagingManager();
