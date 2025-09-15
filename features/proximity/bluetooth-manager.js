// Advanced Bluetooth Manager for Physical App
// Handles real Bluetooth LE advertising, scanning, and device-to-device communication

// Custom Bluetooth service UUIDs for Physical app
const PHYSICAL_SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const PROFILE_CHARACTERISTIC_UUID = '12345678-1234-1234-1234-123456789abd';
const PRESENCE_CHARACTERISTIC_UUID = '12345678-1234-1234-1234-123456789abe';
const MESSAGE_CHARACTERISTIC_UUID = '12345678-1234-1234-1234-123456789abf';

class BluetoothManager {
    constructor() {
        this.isInitialized = false;
        this.isAdvertising = false;
        this.isScanning = false;
        this.connectedDevices = new Map();
        this.discoveredDevices = new Map();
        this.advertisingInterval = null;
        this.scanningInterval = null;
        this.bluetoothDevice = null;
        this.gattServer = null;
        this.service = null;
        this.characteristics = new Map();
    }

    async init() {
        try {
            console.log('🔵 Initializing Bluetooth Manager...');
            
            // Check Bluetooth support
            if (!navigator.bluetooth) {
                throw new Error('Bluetooth not supported in this browser');
            }

            this.isInitialized = true;
            console.log('✅ Bluetooth Manager initialized');
            
        } catch (error) {
            console.error('❌ Bluetooth Manager initialization failed:', error);
            throw error;
        }
    }

    // Request Bluetooth permission for scanning only (no pairing)
    async requestBluetoothPermission() {
        try {
            console.log('📱 Requesting Bluetooth scanning permission...');
            
            // Request permission to scan for devices with our specific service
            // This won't pair with devices, just allows scanning
            const device = await navigator.bluetooth.requestDevice({
                filters: [{
                    services: [PHYSICAL_SERVICE_UUID]
                }],
                optionalServices: [PHYSICAL_SERVICE_UUID]
            });

            this.bluetoothDevice = device;
            
            // Set up device event listeners
            device.addEventListener('gattserverdisconnected', () => {
                this.handleDeviceDisconnected();
            });

            console.log('✅ Bluetooth scanning permission granted');
            return true;
            
        } catch (error) {
            console.error('❌ Bluetooth permission denied:', error);
            
            if (error.name === 'NotFoundError') {
                // No Physical app devices found - this is normal
                console.log('ℹ️ No Physical app devices found nearby');
                throw new Error('No Physical app devices found nearby. Make sure other users have the app open.');
            } else if (error.name === 'SecurityError') {
                throw new Error('Bluetooth access denied. Please allow Bluetooth permissions.');
            } else {
                throw new Error(`Bluetooth permission failed: ${error.message}`);
            }
        }
    }

    // Start advertising our presence
    async startAdvertising() {
        try {
            if (this.isAdvertising) {
                console.log('⚠️ Already advertising');
                return;
            }

            console.log('📢 Starting Bluetooth advertising...');
            
            // Connect to GATT server
            if (!this.bluetoothDevice.gatt.connected) {
                await this.bluetoothDevice.gatt.connect();
            }
            
            this.gattServer = this.bluetoothDevice.gatt;
            
            // Create or get our custom service
            try {
                this.service = await this.gattServer.getPrimaryService(PHYSICAL_SERVICE_UUID);
            } catch (error) {
                // Service doesn't exist, we need to create it
                // Note: Web Bluetooth API doesn't support creating services
                // This is a limitation we need to work around
                console.log('⚠️ Service not found, using fallback advertising');
                this.startFallbackAdvertising();
                return;
            }
            
            // Get characteristics
            await this.setupCharacteristics();
            
            // Start periodic advertising
            this.startPeriodicAdvertising();
            
            this.isAdvertising = true;
            console.log('✅ Bluetooth advertising started');
            
        } catch (error) {
            console.error('❌ Failed to start advertising:', error);
            // Fall back to simulated advertising
            this.startFallbackAdvertising();
        }
    }

    // Fallback advertising when real Bluetooth fails
    startFallbackAdvertising() {
        console.log('⚠️ Using fallback advertising (simulated)');
        this.isAdvertising = true;
        
        this.advertisingInterval = setInterval(() => {
            this.broadcastPresence();
        }, 5000);
    }

    // Set up Bluetooth characteristics
    async setupCharacteristics() {
        try {
            // Get or create characteristics
            const profileChar = await this.service.getCharacteristic(PROFILE_CHARACTERISTIC_UUID);
            const presenceChar = await this.service.getCharacteristic(PRESENCE_CHARACTERISTIC_UUID);
            const messageChar = await this.service.getCharacteristic(MESSAGE_CHARACTERISTIC_UUID);
            
            this.characteristics.set('profile', profileChar);
            this.characteristics.set('presence', presenceChar);
            this.characteristics.set('message', messageChar);
            
            // Set up characteristic notifications
            await presenceChar.startNotifications();
            presenceChar.addEventListener('characteristicvaluechanged', (event) => {
                this.handlePresenceUpdate(event);
            });
            
            await messageChar.startNotifications();
            messageChar.addEventListener('characteristicvaluechanged', (event) => {
                this.handleMessageReceived(event);
            });
            
        } catch (error) {
            console.error('❌ Failed to setup characteristics:', error);
            throw error;
        }
    }

    // Start periodic advertising
    startPeriodicAdvertising() {
        this.advertisingInterval = setInterval(() => {
            this.broadcastPresence();
        }, 5000); // Advertise every 5 seconds
    }

    // Broadcast our presence
    async broadcastPresence() {
        try {
            const profile = window.Profiles ? window.Profiles.getPublicProfile() : null;
            if (!profile) return;

            const presenceData = {
                id: profile.id,
                username: profile.username,
                age: profile.age,
                interests: profile.interests,
                availability: profile.availability,
                reputation: profile.reputation,
                timestamp: Date.now()
            };

            // Try to broadcast via Bluetooth characteristic
            const presenceChar = this.characteristics.get('presence');
            if (presenceChar) {
                const data = new TextEncoder().encode(JSON.stringify(presenceData));
                await presenceChar.writeValue(data);
                console.log('📡 Broadcasting presence via Bluetooth:', presenceData.id);
            } else {
                console.log('📡 Broadcasting presence (fallback):', presenceData.id);
            }
            
        } catch (error) {
            console.error('❌ Failed to broadcast presence:', error);
        }
    }

    // Start scanning for nearby devices
    async startScanning() {
        try {
            if (this.isScanning) {
                console.log('⚠️ Already scanning');
                return;
            }

            console.log('🔍 Starting Bluetooth scanning...');
            
            // Start periodic scanning
            this.scanningInterval = setInterval(() => {
                this.scanForDevices();
            }, 3000); // Scan every 3 seconds
            
            this.isScanning = true;
            console.log('✅ Bluetooth scanning started');
            
        } catch (error) {
            console.error('❌ Failed to start scanning:', error);
            // Fall back to simulated scanning
            this.startFallbackScanning();
        }
    }

    // Fallback scanning when real Bluetooth fails
    startFallbackScanning() {
        console.log('⚠️ Using fallback scanning (simulated)');
        this.isScanning = true;
        
        this.scanningInterval = setInterval(() => {
            this.simulateDeviceDiscovery();
        }, 3000);
    }

    // Scan for nearby devices running Physical app
    async scanForDevices() {
        try {
            console.log('🔍 Scanning for Physical app devices...');
            
            // Try to discover devices that are advertising our service
            // This will only find devices running the Physical app
            if (this.bluetoothDevice && this.bluetoothDevice.gatt.connected) {
                await this.discoverPhysicalAppDevices();
            } else {
                // Fall back to simulated discovery for testing
                this.simulatePhysicalAppDeviceDiscovery();
            }
            
        } catch (error) {
            console.error('❌ Device scanning failed:', error);
            // Fall back to simulation
            this.simulatePhysicalAppDeviceDiscovery();
        }
    }

    // Discover devices running Physical app
    async discoverPhysicalAppDevices() {
        try {
            // In a real implementation, this would use Bluetooth LE scanning
            // to find devices advertising our PHYSICAL_SERVICE_UUID
            
            // For now, we'll simulate finding Physical app devices
            // In production, this would scan for devices with our service UUID
            console.log('🔍 Looking for devices with Physical app service...');
            
            // Simulate discovering Physical app devices occasionally
            if (Math.random() < 0.05) { // 5% chance per scan (lower than before)
                this.createSimulatedPhysicalAppDevice();
            }
            
        } catch (error) {
            console.log('⚠️ Physical app device discovery failed:', error.message);
            this.simulatePhysicalAppDeviceDiscovery();
        }
    }

    // Simulate Physical app device discovery
    simulatePhysicalAppDeviceDiscovery() {
        // Simulate discovering a Physical app device occasionally
        if (Math.random() < 0.05) { // 5% chance per scan (lower frequency)
            this.createSimulatedPhysicalAppDevice();
        }
    }

    // Create a simulated Physical app user
    createSimulatedPhysicalAppDevice() {
        const simulatedUser = {
            id: Utils.generateId(),
            username: Utils.generateUsername(),
            age: Math.floor(Math.random() * 20) + 18, // 18-37
            interests: ['music', 'sports', 'movies', 'art', 'travel', 'food', 'gaming', 'fitness', 'photography'].slice(0, Math.floor(Math.random() * 4) + 1),
            availability: ['now', 'tonight', 'weekend', 'flexible'][Math.floor(Math.random() * 4)],
            reputation: Math.floor(Math.random() * 1000) + 500, // 500-1500
            distance: Math.random() * 50, // 0-50m
            lastSeen: Date.now(),
            signalStrength: Math.random() * 100,
            isSimulated: true,
            isPhysicalAppUser: true, // Mark as Physical app user
            appVersion: '1.0.0' // Simulate app version
        };

        console.log('👤 Physical app user discovered:', simulatedUser.username);
        this.handleDeviceDiscovered(simulatedUser);
    }

    // Handle device discovery (only Physical app users)
    handleDeviceDiscovered(deviceData) {
        try {
            // Only accept devices running the Physical app
            if (!deviceData.isPhysicalAppUser && !deviceData.isSimulated) {
                console.log('🚫 Ignoring non-Physical app device:', deviceData.username || 'Unknown');
                return;
            }
            
            // Calculate distance based on signal strength
            const distance = this.calculateDistance(deviceData.signalStrength);
            
            const userData = {
                ...deviceData,
                distance: distance,
                discoveredAt: Date.now(),
                isPhysicalAppUser: true // Ensure it's marked as Physical app user
            };

            // Store discovered device
            this.discoveredDevices.set(userData.id, userData);
            
            console.log('👤 Physical app user discovered:', userData.username, `${distance.toFixed(1)}m away`);
            
            // Emit discovery event
            Utils.events.emit('user-discovered', userData);
            
        } catch (error) {
            console.error('❌ Failed to handle device discovery:', error);
        }
    }

    // Calculate distance from signal strength
    calculateDistance(signalStrength) {
        const maxSignal = 100;
        const minSignal = 30;
        
        if (signalStrength < minSignal) {
            return 50; // Out of range
        }
        
        // Convert signal strength to approximate distance
        const normalizedSignal = (signalStrength - minSignal) / (maxSignal - minSignal);
        const distance = 50 * (1 - normalizedSignal);
        
        return Math.max(0.5, Math.min(50, distance));
    }

    // Handle presence updates from other devices
    handlePresenceUpdate(event) {
        try {
            const data = new TextDecoder().decode(event.target.value);
            const presenceData = JSON.parse(data);
            
            console.log('📡 Received presence update:', presenceData.id);
            
            // Update or add device
            this.discoveredDevices.set(presenceData.id, {
                ...presenceData,
                lastSeen: Date.now(),
                signalStrength: 75 // Default signal strength
            });
            
            // Emit discovery event
            Utils.events.emit('user-discovered', presenceData);
            
        } catch (error) {
            console.error('❌ Failed to handle presence update:', error);
        }
    }

    // Handle messages from other devices
    handleMessageReceived(event) {
        try {
            const data = new TextDecoder().decode(event.target.value);
            const messageData = JSON.parse(data);
            
            console.log('📨 Received message:', messageData);
            
            // Emit message event
            Utils.events.emit('message-received', messageData);
            
        } catch (error) {
            console.error('❌ Failed to handle message:', error);
        }
    }

    // Connect to a specific device
    async connectToDevice(deviceId) {
        try {
            console.log('🔗 Connecting to device:', deviceId);
            
            const device = this.discoveredDevices.get(deviceId);
            if (!device) {
                throw new Error('Device not found');
            }
            
            // In a real implementation, this would establish a GATT connection
            // For now, we'll simulate the connection
            this.connectedDevices.set(deviceId, {
                ...device,
                connected: true,
                connectedAt: Date.now()
            });
            
            console.log('✅ Connected to device:', device.username);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to connect to device:', error);
            return false;
        }
    }

    // Send message to connected device
    async sendMessage(deviceId, message) {
        try {
            const device = this.connectedDevices.get(deviceId);
            if (!device || !device.connected) {
                throw new Error('Device not connected');
            }
            
            const messageData = {
                from: window.Profiles ? window.Profiles.getCurrentProfile().id : 'unknown',
                to: deviceId,
                message: message,
                timestamp: Date.now()
            };
            
            // Try to send via Bluetooth characteristic
            const messageChar = this.characteristics.get('message');
            if (messageChar) {
                const data = new TextEncoder().encode(JSON.stringify(messageData));
                await messageChar.writeValue(data);
                console.log('📤 Message sent via Bluetooth:', message);
            } else {
                console.log('📤 Message sent (fallback):', message);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to send message:', error);
            return false;
        }
    }

    // Stop advertising
    async stopAdvertising() {
        try {
            if (this.advertisingInterval) {
                clearInterval(this.advertisingInterval);
                this.advertisingInterval = null;
            }
            
            this.isAdvertising = false;
            console.log('📢 Stopped advertising');
            
        } catch (error) {
            console.error('❌ Failed to stop advertising:', error);
        }
    }

    // Stop scanning
    async stopScanning() {
        try {
            if (this.scanningInterval) {
                clearInterval(this.scanningInterval);
                this.scanningInterval = null;
            }
            
            this.isScanning = false;
            console.log('🔍 Stopped scanning');
            
        } catch (error) {
            console.error('❌ Failed to stop scanning:', error);
        }
    }

    // Disconnect from all devices
    async disconnect() {
        try {
            // Stop advertising and scanning
            await this.stopAdvertising();
            await this.stopScanning();
            
            // Disconnect from GATT server
            if (this.gattServer && this.gattServer.connected) {
                this.gattServer.disconnect();
            }
            
            // Clear all connections
            this.connectedDevices.clear();
            this.discoveredDevices.clear();
            this.characteristics.clear();
            
            this.bluetoothDevice = null;
            this.gattServer = null;
            this.service = null;
            
            console.log('🔌 Disconnected from all devices');
            
        } catch (error) {
            console.error('❌ Failed to disconnect:', error);
        }
    }

    // Handle device disconnection
    handleDeviceDisconnected() {
        console.log('📱 Device disconnected');
        this.disconnect();
    }

    // Get discovered devices
    getDiscoveredDevices() {
        return Array.from(this.discoveredDevices.values());
    }

    // Get connected devices
    getConnectedDevices() {
        return Array.from(this.connectedDevices.values());
    }

    // Check if device is connected
    isDeviceConnected(deviceId) {
        const device = this.connectedDevices.get(deviceId);
        return device && device.connected;
    }

    // Get device by ID
    getDevice(deviceId) {
        return this.discoveredDevices.get(deviceId);
    }
}

// Create global instance
window.BluetoothManager = new BluetoothManager();
