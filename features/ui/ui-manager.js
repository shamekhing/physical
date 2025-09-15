// UI Manager for screen transitions and UI interactions
class UIManager {
    constructor() {
        this.currentScreen = 'loading';
        this.currentTooltip = null;
    }

    showScreen(screenName) {
        console.log(`🖥️ Switching to screen: ${screenName}`);
        
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
            console.log(`✅ Screen switched to: ${screenName}`);
        } else {
            console.error(`❌ Screen not found: ${screenName}-screen`);
        }
    }

    showProfileScreen() {
        this.showScreen('profile');
    }

    showProfileManagementScreen() {
        this.showScreen('profile-management');
        this.populateProfileInfo();
    }

    showProfileEditScreen() {
        this.showScreen('profile-edit');
        this.populateEditForm();
    }

    showMessagesDrawer() {
        const drawer = document.getElementById('messages-drawer');
        if (drawer) {
            drawer.classList.add('active');
            this.populateMessagesList();
        }
    }

    hideMessagesDrawer() {
        const drawer = document.getElementById('messages-drawer');
        if (drawer) {
            drawer.classList.remove('active');
        }
        
        // Make sure we're on the main screen showing discovery
        this.showMainScreen();
    }

    showMainScreen() {
        this.showScreen('main');
        // Show discovery section, hide chat (default view)
        const chatSection = document.getElementById('chat-section');
        const discoverySection = document.getElementById('discovery-section');
        if (chatSection) chatSection.style.display = 'none';
        if (discoverySection) discoverySection.style.display = 'block';
        
        // Don't reset proximity status - let it maintain its current state
        // Only update if proximity is not active
        if (!window.ProximityManager || !window.ProximityManager.getIsScanning()) {
            this.updateProximityStatus({
                isActive: false,
                message: 'Click the 📡 button to start scanning for nearby users'
            });
        }
    }

    showChatScreen(userId) {
        this.showScreen('main');
        // Hide discovery section, show chat
        const chatSection = document.getElementById('chat-section');
        const discoverySection = document.getElementById('discovery-section');
        if (chatSection) chatSection.style.display = 'block';
        if (discoverySection) discoverySection.style.display = 'none';
        
        // Update chat header with user info
        this.updateChatHeader(userId);
    }

    showDiscoveryScreen() {
        this.showScreen('main');
        // Show discovery section, hide chat
        const chatSection = document.getElementById('chat-section');
        const discoverySection = document.getElementById('discovery-section');
        if (chatSection) chatSection.style.display = 'none';
        if (discoverySection) discoverySection.style.display = 'block';
    }

    updateChatHeader(userId) {
        if (!window.Discovery) return;
        
        const user = window.Discovery.getUser(userId);
        if (user) {
            const chatUserName = document.getElementById('chat-user-name');
            const chatUserDistance = document.getElementById('chat-user-distance');
            
            if (chatUserName) chatUserName.textContent = user.username;
            if (chatUserDistance) chatUserDistance.textContent = `${Utils.formatDistance(user.distance)} away`;
        }
    }

    updateProximityStatus(status) {
        const statusText = document.querySelector('.status-text');
        const statusDot = document.querySelector('.status-dot');
        const proximityBtn = document.getElementById('proximity-toggle');
        
        if (statusText) {
            statusText.textContent = status.message;
        }
        
        if (statusDot) {
            statusDot.classList.toggle('active', status.isActive);
        }
        
        // Update proximity button appearance
        if (proximityBtn) {
            proximityBtn.classList.toggle('scanning', status.isActive);
            proximityBtn.setAttribute('data-tooltip', 
                status.isActive ? 'Stop Bluetooth scanning' : 'Start Bluetooth scanning to find nearby users'
            );
        }
    }

    scrollChatToBottom() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    addLoadingState(element) {
        element.classList.add('loading');
        element.disabled = true;
    }

    removeLoadingState(element) {
        element.classList.remove('loading');
        element.disabled = false;
    }

    // Tooltip functionality
    showTooltip(element, text) {
        // Remove existing tooltip
        this.hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: var(--surface-color);
            color: var(--text-color);
            padding: 8px 12px;
            border-radius: var(--border-radius);
            font-size: 0.85em;
            z-index: 10000;
            box-shadow: var(--shadow);
            border: 1px solid var(--border-color);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
        
        // Fade in
        setTimeout(() => tooltip.style.opacity = '1', 10);
        
        this.currentTooltip = tooltip;
    }

    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }

    setupTooltips() {
        // Enhanced tooltip functionality
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.getAttribute('data-tooltip'));
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    setupButtonLoadingStates() {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Add loading state for async operations
                if (button.id === 'proximity-toggle' || button.id === 'send-message') {
                    this.addLoadingState(button);
                    setTimeout(() => this.removeLoadingState(button), 2000);
                }
            });
        });
    }

    populateProfileInfo() {
        const profile = window.Profiles ? window.Profiles.getCurrentProfile() : null;
        const profileInfo = document.getElementById('profile-info');
        
        if (!profile || !profileInfo) return;

        const stats = window.Profiles.getProfileStats();
        const reputationBadge = window.Profiles.getReputationBadge();
        
        profileInfo.innerHTML = `
            <div class="profile-details">
                <div class="profile-field">
                    <label>Username:</label>
                    <span>${profile.username}</span>
                </div>
                <div class="profile-field">
                    <label>Age:</label>
                    <span>${profile.age}</span>
                </div>
                <div class="profile-field">
                    <label>Interests:</label>
                    <span>${Array.isArray(profile.interests) ? profile.interests.join(', ') : profile.interests}</span>
                </div>
                <div class="profile-field">
                    <label>Availability:</label>
                    <span>${profile.availability}</span>
                </div>
                <div class="profile-field">
                    <label>Reputation:</label>
                    <span>${reputationBadge} ${profile.reputation} (${stats.reputationTier})</span>
                </div>
                <div class="profile-field">
                    <label>Member since:</label>
                    <span>${new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="profile-field">
                    <label>Last seen:</label>
                    <span>${Utils.formatTime(profile.lastSeen)}</span>
                </div>
            </div>
        `;
    }

    populateEditForm() {
        const profile = window.Profiles ? window.Profiles.getCurrentProfile() : null;
        
        if (!profile) return;

        const ageInput = document.getElementById('edit-age');
        const interestsInput = document.getElementById('edit-interests');
        const availabilitySelect = document.getElementById('edit-availability');

        if (ageInput) ageInput.value = profile.age;
        if (interestsInput) interestsInput.value = Array.isArray(profile.interests) ? profile.interests.join(', ') : profile.interests;
        if (availabilitySelect) availabilitySelect.value = profile.availability;
    }

    populateMessagesList() {
        const messagesList = document.getElementById('messages-list');
        const noMessages = document.getElementById('no-messages');
        
        if (!messagesList || !noMessages) return;

        const likedUsers = Utils.storage.get('likedUsers') || [];
        
        if (likedUsers.length === 0) {
            messagesList.style.display = 'none';
            noMessages.style.display = 'flex';
            return;
        }

        messagesList.style.display = 'block';
        noMessages.style.display = 'none';

        messagesList.innerHTML = likedUsers.map(user => {
            // Get the last message for this user
            const conversations = Utils.storage.get('conversations') || {};
            const userMessages = conversations[user.id] || [];
            const lastMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
            
            return `
                <div class="message-conversation" data-user-id="${user.id}">
                    <div class="conversation-avatar">${this.getUserAvatar(user)}</div>
                    <div class="conversation-info">
                        <div class="conversation-name">${user.username}</div>
                        <div class="conversation-preview">
                            ${lastMessage ? lastMessage.text : 'Start a conversation...'}
                        </div>
                    </div>
                    <div class="conversation-meta">
                        <div class="conversation-time">${lastMessage ? Utils.formatTime(lastMessage.timestamp) : Utils.formatTime(user.likedAt)}</div>
                        <div class="conversation-status ${this.getUserStatus(user)}"></div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers for conversations
        messagesList.querySelectorAll('.message-conversation').forEach(conversation => {
            conversation.addEventListener('click', () => {
                const userId = conversation.dataset.userId;
                this.startChatWithUser(userId);
            });
        });
    }

    getUserAvatar(user) {
        const avatars = ['👤', '🧑', '👩', '🧑‍💼', '👩‍💼', '🧑‍🎨', '👩‍🎨', '🧑‍🔬', '👩‍🔬'];
        const hash = user.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        return avatars[hash % avatars.length];
    }

    getUserStatus(user) {
        // Simple status based on last seen time
        const now = Date.now();
        const lastSeen = user.lastSeen || user.likedAt;
        const timeDiff = now - lastSeen;
        
        if (timeDiff < 5 * 60 * 1000) { // 5 minutes
            return 'online';
        } else if (timeDiff < 30 * 60 * 1000) { // 30 minutes
            return 'away';
        } else {
            return 'offline';
        }
    }

    startChatWithUser(userId) {
        const likedUsers = Utils.storage.get('likedUsers') || [];
        const user = likedUsers.find(u => u.id === userId);
        
        if (user) {
            // Store the current chat user
            Utils.storage.set('currentChatUser', user);
            
            // Close the messages drawer
            this.hideMessagesDrawer();
            
            // Go back to main screen and show chat
            this.showMainScreen();
            
            // Small delay to let drawer close
            setTimeout(() => {
                this.showChatSection(user);
            }, 100);
        }
    }

    showChatSection(user) {
        // Hide discovery section and show chat section
        const discoverySection = document.getElementById('discovery-section');
        const chatSection = document.getElementById('chat-section');
        
        if (discoverySection) discoverySection.style.display = 'none';
        if (chatSection) {
            chatSection.style.display = 'flex';
            
            // Update chat header
            const chatUserName = document.getElementById('chat-user-name');
            const chatUserDistance = document.getElementById('chat-user-distance');
            
            if (chatUserName) chatUserName.textContent = user.username;
            if (chatUserDistance) chatUserDistance.textContent = Utils.formatDistance(user.distance) + ' away';
            
            // Clear and populate chat messages
            this.populateChatMessages(user);
        }
    }

    populateChatMessages(user) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        // Get conversation history for this user
        const conversations = Utils.storage.get('conversations') || {};
        const userMessages = conversations[user.id] || [];

        if (userMessages.length === 0) {
            chatMessages.innerHTML = `
                <div class="message system">
                    <div class="message-content">
                        <div class="message-text">Start your conversation with ${user.username}!</div>
                    </div>
                </div>
            `;
        } else {
            chatMessages.innerHTML = userMessages.map(msg => `
                <div class="message ${msg.sender === 'me' ? 'sent' : 'received'}">
                    <div class="message-content">
                        <div class="message-text">${msg.text}</div>
                        <div class="message-time">${Utils.formatTime(msg.timestamp)}</div>
                    </div>
                </div>
            `).join('');
        }

        // Scroll to bottom
        this.scrollChatToBottom();
    }
}

// Create global instance
window.UIManager = new UIManager();
