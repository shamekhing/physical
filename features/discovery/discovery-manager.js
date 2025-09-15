// Discovery Manager for user discovery and matching functionality
class DiscoveryManager {
    constructor() {
        this.nearbyUsers = [];
    }

    updateNearbyUsersList() {
        if (!window.Discovery) return;
        
        const nearbyUsers = window.Discovery.getNearbyUsers();
        this.nearbyUsers = nearbyUsers;
        
        // Use SwipeManager to render cards
        if (window.SwipeManager) {
            window.SwipeManager.renderSwipeCards(nearbyUsers);
        }
    }

    handleUserDiscovered(user) {
        console.log('👤 User discovered:', user.username);
        this.updateNearbyUsersList();
    }

    handleUserLost(userId) {
        console.log('👤 User lost:', userId);
        this.updateNearbyUsersList();
    }

    async startChat(userId) {
        if (window.Messaging) {
            try {
                await window.Messaging.startChat(userId);
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

    getUser(userId) {
        if (!window.Discovery) return null;
        return window.Discovery.getUser(userId);
    }

    getNearbyUsers() {
        return this.nearbyUsers;
    }

    // Helper methods for user display
    getUserAvatar(user) {
        // Generate avatar based on user data
        const avatars = ['👤', '🧑', '👩', '🧑‍💼', '👩‍💼', '🧑‍🎨', '👩‍🎨', '🧑‍🔬', '👩‍🔬'];
        const hash = user.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        return avatars[hash % avatars.length];
    }

    getCompatibilityClass(compatibility) {
        if (compatibility >= 80) return 'excellent';
        if (compatibility >= 60) return 'good';
        if (compatibility >= 40) return 'fair';
        return 'poor';
    }

    formatAvailability(availability) {
        const availabilityMap = {
            'now': 'Available Now',
            'tonight': 'Tonight',
            'weekend': 'This Weekend',
            'flexible': 'Flexible'
        };
        return availabilityMap[availability] || availability;
    }
}

// Create global instance
window.DiscoveryManager = new DiscoveryManager();
