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
                
                console.log('🔍 About to show main screen, UIManager exists:', !!window.UIManager);
                if (window.UIManager) {
                    window.UIManager.showMainScreen();
                    console.log('✅ Main screen shown');
                } else {
                    console.error('❌ UIManager not available!');
                }
                Utils.showNotification('Welcome back!', 'success');
            } else {
                console.log('👤 No existing profile found, showing profile screen');
                console.log('🔍 About to show profile screen, UIManager exists:', !!window.UIManager);
                if (window.UIManager) {
                    window.UIManager.showProfileScreen();
                    console.log('✅ Profile screen shown');
                } else {
                    console.error('❌ UIManager not available!');
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
            console.log('🔍 ProfileManager - Raw interests from form:', interestsString, 'Type:', typeof interestsString);
            
            const profileData = {
                age: parseInt(document.getElementById('age').value),
                interests: interestsString,
                availability: document.getElementById('availability').value
            };
            
            console.log('🔍 ProfileManager - Full profileData:', profileData);

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
                // Normalize interests to array format
                let interestsArray;
                if (Array.isArray(profileData.interests)) {
                    interestsArray = profileData.interests.filter(i => i && typeof i === 'string' && i.trim().length > 0);
                } else if (typeof profileData.interests === 'string') {
                    interestsArray = profileData.interests.split(',').map(i => i.trim()).filter(i => i);
                } else {
                    interestsArray = [];
                }

                // Fallback: create profile manually
                const profile = {
                    id: Utils.generateId(),
                    username: Utils.generateUsername(),
                    age: profileData.age,
                    interests: interestsArray,
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

    async deleteProfile() {
        try {
            if (window.Profiles) {
                await window.Profiles.deleteProfile();
            }
            
            this.userProfile = null;
            Utils.storage.remove('userProfile');
            
            Utils.showNotification('Profile deleted successfully', 'success');
            
            if (window.UIManager) {
                window.UIManager.showProfileScreen();
            }
        } catch (error) {
            console.error('❌ Profile deletion failed:', error);
            Utils.showNotification('Failed to delete profile', 'error');
        }
    }

    async updateProfile(updates) {
        try {
            console.log('🔍 ProfileManager.updateProfile called with:', updates);
            
            if (window.Profiles) {
                const updatedProfile = await window.Profiles.updateProfile(updates);
                this.userProfile = updatedProfile;
                Utils.showNotification('Profile updated successfully', 'success');
                return updatedProfile;
            } else {
                console.warn('⚠️ Profiles class not available, using fallback update');
                // Fallback update
                this.userProfile = { ...this.userProfile, ...updates };
                Utils.storage.set('userProfile', this.userProfile);
                Utils.showNotification('Profile updated successfully', 'success');
                return this.userProfile;
            }
        } catch (error) {
            console.error('❌ Profile update failed:', error);
            Utils.showNotification('Failed to update profile', 'error');
            throw error;
        }
    }

    async handleProfileEditSubmit(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            const interestsString = document.getElementById('edit-interests').value;
            
            const updates = {
                age: parseInt(document.getElementById('edit-age').value),
                interests: interestsString,
                availability: document.getElementById('edit-availability').value
            };

            // Validate updates
            if (updates.age < 13 || updates.age > 99) {
                throw new Error('Age must be between 13 and 99');
            }

            if (!interestsString || interestsString.trim().length === 0) {
                throw new Error('Please enter at least one interest');
            }

            await this.updateProfile(updates);
            
            if (window.UIManager) {
                window.UIManager.showProfileManagementScreen();
            }

        } catch (error) {
            console.error('Profile update error:', error);
            Utils.showNotification(error.message || 'Failed to update profile', 'error');
        }
    }
}

// Create global instance
window.ProfileManager = new ProfileManager();
