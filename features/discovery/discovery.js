// User discovery system for Hookup P2P
class Discovery {
    constructor() {
        this.nearbyUsers = new Map();
        this.isInitialized = false;
        this.discoveryInterval = null;
        this.compatibilityThreshold = 30; // Minimum compatibility score
    }

    async init() {
        try {
            console.log('🔍 Initializing user discovery...');
            
            // Wait for dependencies
            if (!window.Proximity || !window.Profiles) {
                throw new Error('Dependencies not ready');
            }

            // Set up event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ User discovery initialized');
            
        } catch (error) {
            console.error('❌ Discovery initialization failed:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Listen for proximity events
        Utils.events.on('user-discovered', (user) => this.handleUserDiscovered(user));
        Utils.events.on('user-lost', (userId) => this.handleUserLost(userId));
        Utils.events.on('proximity-status-changed', (status) => this.handleProximityStatusChange(status));
    }

    handleUserDiscovered(user) {
        try {
            // Validate user data
            if (!this.validateUserData(user)) {
                console.warn('⚠️ Invalid user data received:', user);
                return;
            }

            // Calculate compatibility
            const compatibility = this.calculateCompatibility(user);
            
            // Add compatibility score to user data
            const enrichedUser = {
                ...user,
                compatibility: compatibility,
                discoveredAt: Date.now(),
                lastSeen: Date.now()
            };

            // Store user
            this.nearbyUsers.set(user.id, enrichedUser);
            
            console.log(`👤 User discovered: ${user.username} (${compatibility}% compatible, ${user.distance.toFixed(1)}m away)`);
            
            // Emit discovery event
            Utils.events.emit('user-discovered-enriched', enrichedUser);
            
        } catch (error) {
            console.error('❌ Failed to handle user discovery:', error);
        }
    }

    handleUserLost(userId) {
        try {
            const user = this.nearbyUsers.get(userId);
            if (user) {
                this.nearbyUsers.delete(userId);
                console.log(`👤 User lost: ${user.username}`);
                
                // Emit user lost event
                Utils.events.emit('user-lost-enriched', userId);
            }
        } catch (error) {
            console.error('❌ Failed to handle user lost:', error);
        }
    }

    handleProximityStatusChange(status) {
        if (!status.isScanning) {
            // Clear all users when scanning stops
            this.nearbyUsers.clear();
            console.log('🧹 Cleared all users (scanning stopped)');
        }
    }

    validateUserData(user) {
        if (!user || typeof user !== 'object') {
            return false;
        }

        const requiredFields = ['id', 'username', 'age', 'interests', 'availability', 'distance'];
        for (const field of requiredFields) {
            if (!(field in user)) {
                return false;
            }
        }

        // Validate age
        if (!Utils.validateAge(user.age)) {
            return false;
        }

        // Validate interests
        if (!Array.isArray(user.interests) || user.interests.length === 0) {
            return false;
        }

        // Validate availability
        const validAvailability = ['now', 'tonight', 'weekend', 'flexible'];
        if (!validAvailability.includes(user.availability)) {
            return false;
        }

        // Validate distance
        if (typeof user.distance !== 'number' || user.distance < 0) {
            return false;
        }

        return true;
    }

    calculateCompatibility(user) {
        try {
            if (!window.Profiles || !window.Profiles.hasProfile()) {
                return 0;
            }

            const myProfile = window.Profiles.getCurrentProfile();
            if (!myProfile) {
                return 0;
            }

            // Create a temporary profile object for compatibility calculation
            const otherProfile = {
                age: user.age,
                interests: user.interests,
                availability: user.availability,
                reputation: user.reputation || 1000
            };

            return window.Profiles.calculateCompatibility(otherProfile);
            
        } catch (error) {
            console.error('❌ Failed to calculate compatibility:', error);
            return 0;
        }
    }

    getNearbyUsers() {
        return Array.from(this.nearbyUsers.values());
    }

    getUser(userId) {
        return this.nearbyUsers.get(userId);
    }

    getCompatibleUsers(minCompatibility = null) {
        const threshold = minCompatibility || this.compatibilityThreshold;
        return this.getNearbyUsers().filter(user => user.compatibility >= threshold);
    }

    getUsersByDistance(maxDistance = null) {
        const distance = maxDistance || (window.Proximity ? window.Proximity.getRadius() : 10);
        return this.getNearbyUsers()
            .filter(user => user.distance <= distance)
            .sort((a, b) => a.distance - b.distance);
    }

    getUsersByCompatibility() {
        return this.getNearbyUsers()
            .sort((a, b) => b.compatibility - a.compatibility);
    }

    // Like/pass functionality
    async likeUser(userId) {
        try {
            const user = this.getUser(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Store like locally
            const likes = Utils.storage.get('userLikes') || [];
            if (!likes.includes(userId)) {
                likes.push(userId);
                Utils.storage.set('userLikes', likes);
            }

            console.log(`💖 Liked user: ${user.username}`);
            
            // Check for mutual like (match)
            const mutualLike = this.checkMutualLike(userId);
            if (mutualLike) {
                await this.handleMatch(userId);
            }

            return true;
        } catch (error) {
            console.error('❌ Failed to like user:', error);
            return false;
        }
    }

    async passUser(userId) {
        try {
            const user = this.getUser(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Store pass locally
            const passes = Utils.storage.get('userPasses') || [];
            if (!passes.includes(userId)) {
                passes.push(userId);
                Utils.storage.set('userPasses', passes);
            }

            console.log(`👎 Passed user: ${user.username}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to pass user:', error);
            return false;
        }
    }

    checkMutualLike(userId) {
        // In a real implementation, this would check with the other user
        // For now, simulate a random chance of mutual like
        return Math.random() < 0.3; // 30% chance
    }

    async handleMatch(userId) {
        try {
            const user = this.getUser(userId);
            if (!user) return;

            // Store match
            const matches = Utils.storage.get('userMatches') || [];
            if (!matches.includes(userId)) {
                matches.push(userId);
                Utils.storage.set('userMatches', matches);
            }

            console.log(`🎉 Match with: ${user.username}`);
            
            // Show match notification
            Utils.showNotification(`🎉 It's a match with ${user.username}!`, 'success', 5000);
            
            // Emit match event
            Utils.events.emit('user-matched', user);

            // Auto-start chat
            if (window.DiscoveryManager) {
                await window.DiscoveryManager.startChat(userId);
            }
            
        } catch (error) {
            console.error('❌ Failed to handle match:', error);
        }
    }

    getUserLikes() {
        return Utils.storage.get('userLikes') || [];
    }

    getUserPasses() {
        return Utils.storage.get('userPasses') || [];
    }

    getUserMatches() {
        return Utils.storage.get('userMatches') || [];
    }

    hasLikedUser(userId) {
        return this.getUserLikes().includes(userId);
    }

    hasPassedUser(userId) {
        return this.getUserPasses().includes(userId);
    }

    hasMatchedUser(userId) {
        return this.getUserMatches().includes(userId);
    }

    // Filter out already interacted users
    getUnseenUsers() {
        const likes = this.getUserLikes();
        const passes = this.getUserPasses();
        const interacted = [...likes, ...passes];
        
        return this.getNearbyUsers().filter(user => !interacted.includes(user.id));
    }

    // Get discovery statistics
    getDiscoveryStats() {
        const users = this.getNearbyUsers();
        const compatible = this.getCompatibleUsers();
        const matches = this.getUserMatches();
        
        return {
            totalUsers: users.length,
            compatibleUsers: compatible.length,
            totalMatches: matches.length,
            averageCompatibility: users.length > 0 ? 
                users.reduce((sum, u) => sum + u.compatibility, 0) / users.length : 0,
            averageDistance: users.length > 0 ? 
                users.reduce((sum, u) => sum + u.distance, 0) / users.length : 0
        };
    }

    // Clear discovery data
    clearDiscoveryData() {
        this.nearbyUsers.clear();
        Utils.storage.remove('userLikes');
        Utils.storage.remove('userPasses');
        Utils.storage.remove('userMatches');
        console.log('🧹 Discovery data cleared');
    }
}

// Create global instance
window.Discovery = new Discovery();
