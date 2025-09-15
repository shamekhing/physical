// Main application controller for Physical
class PhysicalApp {
    constructor() {
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('🚀 Initializing Physical App...');
            
            // Check browser compatibility
            this.checkCompatibility();
            
            // Register service worker
            await this.registerServiceWorker();
            
            // Initialize features
            await this.initializeFeatures();
            
            // Set up event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ App initialized successfully');
            
            // Check for existing profile (after initialization is complete)
            if (window.ProfileManager) {
                window.ProfileManager.checkExistingProfile();
            }
            
            // Aggressive fallback: force screen change after 2 seconds
            setTimeout(() => {
                console.log('🔍 Fallback timeout triggered');
                console.log('🔍 UIManager exists:', !!window.UIManager);
                console.log('🔍 Current screen:', window.UIManager ? window.UIManager.currentScreen : 'undefined');
                
                // Force screen change regardless of current state
                if (window.UIManager) {
                    if (window.Profiles && window.Profiles.hasProfile()) {
                        console.log('⚠️ Forcing main screen');
                        window.UIManager.showMainScreen();
                    } else {
                        console.log('⚠️ Forcing profile screen');
                        window.UIManager.showProfileScreen();
                    }
                } else {
                    console.error('❌ UIManager not available, trying direct DOM manipulation');
                    // Direct DOM manipulation as last resort
                    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
                    const profileScreen = document.getElementById('profile-screen');
                    if (profileScreen) {
                        profileScreen.classList.add('active');
                        console.log('✅ Direct DOM manipulation: profile screen shown');
                    }
                }
            }, 2000);
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            Utils.showNotification('App initialization failed', 'error');
        }
    }

    checkCompatibility() {
        const deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            bluetoothSupported: 'bluetooth' in navigator,
            webrtcSupported: 'RTCPeerConnection' in window,
            serviceWorkerSupported: 'serviceWorker' in navigator,
            cryptoSupported: 'crypto' in window && 'subtle' in window.crypto
        };
        
        console.log('📱 Device info:', deviceInfo);
        
        if (!deviceInfo.bluetoothSupported) {
            console.warn('⚠️ Bluetooth not supported');
        }
        
        if (!deviceInfo.webrtcSupported) {
            console.warn('⚠️ WebRTC not supported');
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                // Skip service worker registration for file:// protocol
                if (window.location.protocol === 'file:') {
                    console.log('⚠️ Service Worker not supported in file:// protocol - skipping');
                    return;
                }
                
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('✅ Service Worker registered:', registration);
            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
            }
        } else {
            console.log('⚠️ Service Worker not supported');
        }
    }

    async initializeFeatures() {
        console.log('🔧 Initializing features...');
        
        // Encryption (foundation for all secure communication)
        if (window.Encryption) {
            await window.Encryption.init();
            console.log('✅ Encryption initialized');
        }
        
        // Profiles (depends on encryption)
        if (window.Profiles) {
            await window.Profiles.init();
            console.log('✅ Profiles initialized');
        }
        
        // Proximity (depends on encryption)
        if (window.Proximity) {
            await window.Proximity.init();
            console.log('✅ Proximity initialized');
        }
        
        // Discovery (depends on proximity + profiles)
        if (window.Discovery) {
            await window.Discovery.init();
            console.log('✅ Discovery initialized');
        }
        
        // Messaging (depends on encryption + discovery)
        if (window.Messaging) {
            await window.Messaging.init();
            console.log('✅ Messaging initialized');
        }
    }

    setupEventListeners() {
        // Profile form submission
        const profileForm = document.getElementById('profile-form');
        if (profileForm && window.ProfileManager) {
            profileForm.addEventListener('submit', (e) => window.ProfileManager.handleProfileSubmit(e));
        }

        // Header controls
        const proximityToggle = document.getElementById('proximity-toggle');
        if (proximityToggle && window.ProximityManager) {
            proximityToggle.addEventListener('click', () => window.ProximityManager.toggleProximityScanning());
        }

        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn && window.UIManager) {
            profileBtn.addEventListener('click', () => {
                // Show profile management if profile exists, otherwise show creation screen
                if (window.Profiles && window.Profiles.hasProfile()) {
                    window.UIManager.showProfileManagementScreen();
                } else {
                    window.UIManager.showProfileScreen();
                }
            });
        }

        // Proximity radius change
        const proximityRadius = document.getElementById('proximity-radius');
        if (proximityRadius && window.ProximityManager) {
            proximityRadius.addEventListener('change', (e) => window.ProximityManager.updateProximityRadius(e.target.value));
        }

        // Chat controls
        const messageInput = document.getElementById('message-input');
        if (messageInput && window.MessagingManager) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    window.MessagingManager.sendMessage();
                }
            });
        }

        const sendMessageBtn = document.getElementById('send-message');
        if (sendMessageBtn && window.MessagingManager) {
            sendMessageBtn.addEventListener('click', () => window.MessagingManager.sendMessage());
        }

        const backToDiscovery = document.getElementById('back-to-discovery');
        if (backToDiscovery && window.UIManager) {
            backToDiscovery.addEventListener('click', () => window.UIManager.showDiscoveryScreen());
        }

        // App-wide event listeners
        Utils.events.on('user-discovered', (user) => {
            if (window.DiscoveryManager) {
                window.DiscoveryManager.handleUserDiscovered(user);
            }
        });
        
        Utils.events.on('user-lost', (userId) => {
            if (window.DiscoveryManager) {
                window.DiscoveryManager.handleUserLost(userId);
            }
        });
        
        Utils.events.on('message-received', (message) => {
            if (window.MessagingManager) {
                window.MessagingManager.handleMessageReceived(message);
            }
        });
        
        Utils.events.on('proximity-status-changed', (status) => {
            if (window.ProximityManager) {
                window.ProximityManager.updateProximityStatus(status);
            }
        });

        // Enhanced UI functionality
        if (window.UIManager) {
            window.UIManager.setupButtonLoadingStates();
            window.UIManager.setupTooltips();
        }
        
        if (window.SwipeManager) {
            window.SwipeManager.setupSwipeButtons();
        }

        // Profile management event listeners
        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn && window.UIManager) {
            editProfileBtn.addEventListener('click', () => window.UIManager.showProfileEditScreen());
        }

        const deleteProfileBtn = document.getElementById('delete-profile-btn');
        if (deleteProfileBtn && window.ProfileManager) {
            deleteProfileBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
                    await window.ProfileManager.deleteProfile();
                }
            });
        }

        const backToMainBtn = document.getElementById('back-to-main-btn');
        if (backToMainBtn && window.UIManager) {
            backToMainBtn.addEventListener('click', () => window.UIManager.showMainScreen());
        }

        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        if (cancelEditBtn && window.UIManager) {
            cancelEditBtn.addEventListener('click', () => window.UIManager.showProfileManagementScreen());
        }

        const profileEditForm = document.getElementById('profile-edit-form');
        if (profileEditForm && window.ProfileManager) {
            profileEditForm.addEventListener('submit', (e) => window.ProfileManager.handleProfileEditSubmit(e));
        }
    }

    // Delegate methods to appropriate managers
    async startProximityScanning() {
        if (window.ProximityManager) {
            await window.ProximityManager.startProximityScanning();
        }
    }

    async toggleProximityScanning() {
        if (window.ProximityManager) {
            await window.ProximityManager.toggleProximityScanning();
        }
    }

    updateProximityRadius(radius) {
        if (window.ProximityManager) {
            window.ProximityManager.updateProximityRadius(radius);
        }
    }

    updateNearbyUsersList() {
        if (window.DiscoveryManager) {
            window.DiscoveryManager.updateNearbyUsersList();
        }
    }

    async startChat(userId) {
        if (window.DiscoveryManager) {
            await window.DiscoveryManager.startChat(userId);
        }
    }

    handleUserDiscovered(user) {
        if (window.DiscoveryManager) {
            window.DiscoveryManager.handleUserDiscovered(user);
        }
    }

    handleUserLost(userId) {
        if (window.DiscoveryManager) {
            window.DiscoveryManager.handleUserLost(userId);
        }
    }

    handleMessageReceived(message) {
        if (window.MessagingManager) {
            window.MessagingManager.handleMessageReceived(message);
        }
    }

    updateProximityStatus(status) {
        if (window.ProximityManager) {
            window.ProximityManager.updateProximityStatus(status);
        }
    }

    showScreen(screenName) {
        if (window.UIManager) {
            window.UIManager.showScreen(screenName);
        }
    }

    showProfileScreen() {
        if (window.UIManager) {
            window.UIManager.showProfileScreen();
        }
    }

    showMainScreen() {
        if (window.UIManager) {
            window.UIManager.showMainScreen();
        }
    }

    showChatScreen(userId) {
        if (window.UIManager) {
            window.UIManager.showChatScreen(userId);
        }
    }

    showDiscoveryScreen() {
        if (window.UIManager) {
            window.UIManager.showDiscoveryScreen();
        }
    }

    sendMessage() {
        if (window.MessagingManager) {
            window.MessagingManager.sendMessage();
        }
    }
}

// Initialize app when script loads
const app = new PhysicalApp();

// Make app globally available for debugging
window.app = app;

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await app.init();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        Utils.showNotification('App initialization failed', 'error');
    }
});
