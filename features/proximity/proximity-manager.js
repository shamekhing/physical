// Proximity Manager for proximity scanning and status management
class ProximityManager {
    constructor() {
        this.isScanning = false;
    }

    async startProximityScanning() {
        if (window.Proximity) {
            try {
                console.log('🔍 Starting proximity scanning...');
                console.log('👤 Current profile:', window.ProfileManager ? window.ProfileManager.getCurrentProfile() : 'N/A');
                console.log('👤 window.Profiles exists:', !!window.Profiles);
                console.log('👤 window.Profiles.currentProfile:', window.Profiles ? window.Profiles.currentProfile : 'N/A');
                console.log('👤 Profiles.hasProfile():', window.Profiles ? window.Profiles.hasProfile() : 'Profiles not available');
                
                // Force update Profiles.currentProfile if we have a userProfile but Profiles doesn't
                const currentProfile = window.ProfileManager ? window.ProfileManager.getCurrentProfile() : null;
                if (currentProfile && window.Profiles && !window.Profiles.currentProfile) {
                    console.log('🔧 Fixing Profiles.currentProfile - setting from ProfileManager');
                    window.Profiles.currentProfile = currentProfile;
                    console.log('🔧 Profiles.currentProfile after fix:', window.Profiles.currentProfile);
                }
                
                // Update status to show scanning is starting
                this.updateProximityStatus({
                    isActive: false,
                    message: 'Requesting Bluetooth permission...'
                });
                
                await window.Proximity.startScanning();
                this.isScanning = true;
                
                // Update status to show scanning is active
                this.updateProximityStatus({
                    isActive: true,
                    message: 'Scanning for nearby users...'
                });
                
                Utils.showNotification('Started scanning for nearby users', 'success');
            } catch (error) {
                console.error('Failed to start proximity scanning:', error);
                
                // Update status to show error
                this.updateProximityStatus({
                    isActive: false,
                    message: 'Click 📡 to start scanning (Bluetooth required)'
                });
                
                if (error.name === 'SecurityError' || error.message.includes('user gesture')) {
                    Utils.showNotification('Please click the 📡 button to enable Bluetooth scanning', 'info');
                } else {
                    Utils.showNotification('Failed to start proximity scanning', 'error');
                }
            }
        }
    }

    async toggleProximityScanning() {
        if (window.Proximity) {
            try {
                if (this.isScanning) {
                    // Stop scanning
                    await window.Proximity.stopScanning();
                    this.isScanning = false;
                    this.updateProximityStatus({
                        isActive: false,
                        message: 'Click 📡 to start scanning for nearby users'
                    });
                    Utils.showNotification('Stopped scanning', 'info');
                } else {
                    // Start scanning (user gesture triggered)
                    await this.startProximityScanning();
                }
            } catch (error) {
                console.error('Failed to toggle proximity scanning:', error);
                this.updateProximityStatus({
                    isActive: false,
                    message: 'Click 📡 to start scanning (Bluetooth required)'
                });
                
                if (error.name === 'SecurityError' || error.message.includes('user gesture')) {
                    Utils.showNotification('Bluetooth permission denied or not available', 'error');
                } else {
                    Utils.showNotification('Failed to toggle proximity scanning', 'error');
                }
            }
        }
    }

    updateProximityRadius(radius) {
        if (window.Proximity) {
            window.Proximity.setRadius(parseInt(radius));
            Utils.showNotification(`Scanning radius set to ${radius}m`, 'info');
        }
    }

    updateProximityStatus(status) {
        if (window.UIManager) {
            window.UIManager.updateProximityStatus(status);
        }
    }

    getIsScanning() {
        return this.isScanning;
    }

    setIsScanning(scanning) {
        this.isScanning = scanning;
    }
}

// Create global instance
window.ProximityManager = new ProximityManager();
