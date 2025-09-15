// Profile Manager for profile-related functionality
class ProfileManager {
    constructor() {
        this.userProfile = null;
    }

    checkExistingProfile() {
        console.log('🔍 Checking for existing profile...');
        try {
            const existingProfile = Utils.storage.get('userProfile');
            console.log('📦 Storage result:', existingProfile);
            if (existingProfile) {
                console.log('👤 Found existing profile:', existingProfile.username);
                this.userProfile = existingProfile;
                
                // Update the Profiles class instance
                if (window.Profiles) {
                    window.Profiles.currentProfile = existingProfile;
                    console.log('👤 Updated Profiles.currentProfile from storage:', window.Profiles.currentProfile);
                }
                
                if (window.UIManager) {
                    window.UIManager.showMainScreen();
                }
                Utils.showNotification('Welcome back!', 'success');
            } else {
                console.log('👤 No existing profile found, showing profile screen');
                if (window.UIManager) {
                    window.UIManager.showProfileScreen();
                }
            }
        } catch (error) {
            console.error('❌ Error checking profile:', error);
            console.log('👤 Error occurred, showing profile screen');
            if (window.UIManager) {
                window.UIManager.showProfileScreen();
            }
        }
    }

    async handleProfileSubmit(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            const interestsString = document.getElementById('interests').value;
            const profileData = {
                age: parseInt(document.getElementById('age').value),
                interests: interestsString,
                availability: document.getElementById('availability').value
            };

            // Validate profile data
            if (profileData.age < 13 || profileData.age > 99) {
                throw new Error('Age must be between 13 and 99');
            }

            if (!interestsString || interestsString.trim().length === 0) {
                throw new Error('Please enter at least one interest');
            }

            // Create profile using Profiles class
            if (window.Profiles) {
                const profile = await window.Profiles.createProfile(profileData);
                this.userProfile = profile;
                
                // Update the Profiles class instance
                if (window.Profiles) {
                    window.Profiles.currentProfile = profile;
                    console.log('👤 Updated Profiles.currentProfile:', window.Profiles.currentProfile);
                }
            } else {
                // Fallback: create profile manually
                const profile = {
                    id: Utils.generateId(),
                    username: Utils.generateUsername(),
                    age: profileData.age,
                    interests: profileData.interests.split(',').map(i => i.trim()).filter(i => i),
                    availability: profileData.availability,
                    createdAt: Date.now(),
                    reputation: 1000 // Starting ELO score
                };

                // Save profile
                Utils.storage.set('userProfile', profile);
                this.userProfile = profile;

                // Update the Profiles class instance
                if (window.Profiles) {
                    window.Profiles.currentProfile = profile;
                    console.log('👤 Updated Profiles.currentProfile:', window.Profiles.currentProfile);
                }
            }

            Utils.showNotification('Profile created successfully!', 'success');
            if (window.UIManager) {
                window.UIManager.showMainScreen();
            }

        } catch (error) {
            console.error('Profile creation error:', error);
            Utils.showNotification('Failed to create profile', 'error');
        }
    }

    getCurrentProfile() {
        return this.userProfile;
    }

    updateProfile(updates) {
        if (!this.userProfile) return;
        
        this.userProfile = { ...this.userProfile, ...updates };
        Utils.storage.set('userProfile', this.userProfile);
        
        // Update the Profiles class instance
        if (window.Profiles) {
            window.Profiles.currentProfile = this.userProfile;
        }
    }

    deleteProfile() {
        this.userProfile = null;
        Utils.storage.remove('userProfile');
        
        // Update the Profiles class instance
        if (window.Profiles) {
            window.Profiles.currentProfile = null;
        }
        
        if (window.UIManager) {
            window.UIManager.showProfileScreen();
        }
    }
}

// Create global instance
window.ProfileManager = new ProfileManager();
