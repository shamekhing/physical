// Messaging Manager for chat functionality
class MessagingManager {
    constructor() {
        this.currentChatUserId = null;
    }

    async sendMessage() {
        if (window.Messaging) {
            await window.Messaging.sendMessage();
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
