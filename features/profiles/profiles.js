// Anonymous profile system for Hookup P2P
class Profiles {
    constructor() {
        console.log('👤 Profiles constructor called');
        this.currentProfile = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('👤 Initializing profiles...');
            
            // Wait for encryption to be ready
            if (!window.Encryption || !window.Encryption.isReady()) {
                throw new Error('Encryption not ready');
            }

            // Load existing profile if available
            this.loadProfile();
            
            this.isInitialized = true;
            console.log('✅ Profiles initialized');
            
        } catch (error) {
            console.error('❌ Profiles initialization failed:', error);
            throw error;
        }
    }

    loadProfile() {
        const storedProfile = Utils.storage.get('userProfile');
        if (storedProfile) {
            this.currentProfile = storedProfile;
            console.log('📋 Loaded existing profile:', this.currentProfile.username);
        } else {
            console.log('📋 No stored profile found');
        }
    }

    async createProfile(profileData) {
        try {
            if (!this.isInitialized) {
                throw new Error('Profiles not initialized');
            }

            // Validate profile data
            this.validateProfileData(profileData);

            // Create age proof
            const ageProof = await window.Encryption.createAgeProof(profileData.age);

            // Create anonymous profile
            const profile = {
                id: Utils.generateId(),
                username: Utils.generateUsername(),
                age: profileData.age,
                ageProof: ageProof,
                interests: profileData.interests.split(',').map(i => i.trim()).filter(i => i),
                availability: profileData.availability,
                reputation: 1000, // Starting ELO score
                createdAt: Date.now(),
                lastSeen: Date.now(),
                publicKey: window.Encryption.getPublicKey(),
                isVerified: false
            };

            // Store profile
            Utils.storage.set('userProfile', profile);
            this.currentProfile = profile;

            console.log('✅ Profile created:', profile.username);
            return profile;

        } catch (error) {
            console.error('❌ Profile creation failed:', error);
            throw error;
        }
    }

    validateProfileData(data) {
        if (!data.age || !Utils.validateAge(data.age)) {
            throw new Error('Invalid age (must be 18-99)');
        }

        if (!data.interests || !Utils.validateInterests(data.interests)) {
            throw new Error('Invalid interests (must have 1-10 interests)');
        }

        if (!data.availability || !['now', 'tonight', 'weekend', 'flexible'].includes(data.availability)) {
            throw new Error('Invalid availability');
        }
    }

    getCurrentProfile() {
        return this.currentProfile;
    }

    async updateProfile(updates) {
        try {
            if (!this.currentProfile) {
                throw new Error('No profile to update');
            }

            // Validate updates
            if (updates.age && !Utils.validateAge(updates.age)) {
                throw new Error('Invalid age');
            }

            if (updates.interests && !Utils.validateInterests(updates.interests)) {
                throw new Error('Invalid interests');
            }

            // Update profile
            const updatedProfile = {
                ...this.currentProfile,
                ...updates,
                updatedAt: Date.now()
            };

            // If age changed, create new age proof
            if (updates.age) {
                updatedProfile.ageProof = await window.Encryption.createAgeProof(updates.age);
            }

            // Store updated profile
            Utils.storage.set('userProfile', updatedProfile);
            this.currentProfile = updatedProfile;

            console.log('✅ Profile updated');
            return updatedProfile;

        } catch (error) {
            console.error('❌ Profile update failed:', error);
            throw error;
        }
    }

    async updateLastSeen() {
        if (this.currentProfile) {
            this.currentProfile.lastSeen = Date.now();
            Utils.storage.set('userProfile', this.currentProfile);
        }
    }

    // Create a public profile for sharing (without sensitive data)
    getPublicProfile() {
        if (!this.currentProfile) {
            return null;
        }

        return {
            id: this.currentProfile.id,
            username: this.currentProfile.username,
            age: this.currentProfile.age,
            ageProof: this.currentProfile.ageProof,
            interests: this.currentProfile.interests,
            availability: this.currentProfile.availability,
            reputation: this.currentProfile.reputation,
            publicKey: this.currentProfile.publicKey,
            isVerified: this.currentProfile.isVerified,
            lastSeen: this.currentProfile.lastSeen
        };
    }

    // Verify another user's age proof
    async verifyAgeProof(ageProof) {
        try {
            if (!ageProof || !ageProof.commitment || !ageProof.proof) {
                return false;
            }

            // Verify the proof signature
            const proofData = `${ageProof.proof.value}-${ageProof.proof.min}-${ageProof.proof.max}-${ageProof.proof.timestamp}`;
            const isValid = await window.Encryption.verifySignature(
                proofData,
                ageProof.proof.signature,
                ageProof.proof.publicKey || 'system' // In a real implementation, this would be the system's public key
            );

            // Verify the commitment
            const expectedCommitment = await window.Encryption.hash(
                ageProof.proof.value.toString() + ageProof.salt
            );

            return isValid && expectedCommitment === ageProof.commitment;

        } catch (error) {
            console.error('❌ Age proof verification failed:', error);
            return false;
        }
    }

    // Calculate compatibility score with another user
    calculateCompatibility(otherProfile) {
        if (!this.currentProfile || !otherProfile) {
            return 0;
        }

        let score = 0;
        const maxScore = 100;

        // Age compatibility (closer ages = higher score)
        const ageDiff = Math.abs(this.currentProfile.age - otherProfile.age);
        const ageScore = Math.max(0, 20 - ageDiff);
        score += ageScore;

        // Interest compatibility
        const myInterests = new Set(this.currentProfile.interests);
        const theirInterests = new Set(otherProfile.interests);
        const commonInterests = [...myInterests].filter(x => theirInterests.has(x));
        const interestScore = (commonInterests.length / Math.max(myInterests.size, theirInterests.size)) * 30;
        score += interestScore;

        // Availability compatibility
        if (this.currentProfile.availability === otherProfile.availability) {
            score += 20;
        } else if (
            (this.currentProfile.availability === 'now' && otherProfile.availability === 'tonight') ||
            (this.currentProfile.availability === 'tonight' && otherProfile.availability === 'now')
        ) {
            score += 15;
        } else if (this.currentProfile.availability === 'flexible' || otherProfile.availability === 'flexible') {
            score += 10;
        }

        // Reputation bonus
        const reputationBonus = Math.min(20, otherProfile.reputation / 50);
        score += reputationBonus;

        return Math.min(maxScore, Math.round(score));
    }

    // Update reputation based on interaction
    async updateReputation(change, reason = 'interaction') {
        if (!this.currentProfile) {
            return;
        }

        const oldReputation = this.currentProfile.reputation;
        this.currentProfile.reputation = Math.max(0, Math.min(2000, oldReputation + change));

        // Store updated profile
        Utils.storage.set('userProfile', this.currentProfile);

        console.log(`📊 Reputation updated: ${oldReputation} → ${this.currentProfile.reputation} (${reason})`);

        // Emit event for UI updates
        Utils.events.emit('reputation-updated', {
            oldReputation,
            newReputation: this.currentProfile.reputation,
            change,
            reason
        });
    }

    // Get reputation tier
    getReputationTier() {
        if (!this.currentProfile) {
            return 'new';
        }

        const reputation = this.currentProfile.reputation;
        if (reputation >= 1500) return 'elite';
        if (reputation >= 1200) return 'excellent';
        if (reputation >= 1000) return 'good';
        if (reputation >= 800) return 'average';
        if (reputation >= 600) return 'below-average';
        return 'poor';
    }

    // Get reputation badge
    getReputationBadge() {
        const tier = this.getReputationTier();
        const badges = {
            'elite': '🏆',
            'excellent': '⭐',
            'good': '👍',
            'average': '👌',
            'below-average': '👎',
            'poor': '⚠️',
            'new': '🆕'
        };
        return badges[tier] || '❓';
    }

    // Delete profile
    async deleteProfile() {
        try {
            // Clear encryption keys
            window.Encryption.clear();
            
            // Remove profile from storage
            Utils.storage.remove('userProfile');
            
            // Clear current profile
            this.currentProfile = null;
            
            console.log('🗑️ Profile deleted');
            
        } catch (error) {
            console.error('❌ Profile deletion failed:', error);
            throw error;
        }
    }

    // Check if profile exists
    hasProfile() {
        console.log('🔍 Profiles.hasProfile() called - currentProfile:', this.currentProfile);
        return this.currentProfile !== null;
    }

    // Get profile statistics
    getProfileStats() {
        if (!this.currentProfile) {
            return null;
        }

        const now = Date.now();
        const created = new Date(this.currentProfile.createdAt);
        const lastSeen = new Date(this.currentProfile.lastSeen);
        
        return {
            daysActive: Math.floor((now - this.currentProfile.createdAt) / (1000 * 60 * 60 * 24)),
            hoursSinceLastSeen: Math.floor((now - this.currentProfile.lastSeen) / (1000 * 60 * 60)),
            reputation: this.currentProfile.reputation,
            reputationTier: this.getReputationTier(),
            reputationBadge: this.getReputationBadge(),
            isVerified: this.currentProfile.isVerified
        };
    }
}

// Create global instance
console.log('🌍 Creating global Profiles instance...');
window.Profiles = new Profiles();
console.log('🌍 Global Profiles instance created:', window.Profiles);
