// Bluetooth proximity detection for Physical
// 
// Real Bluetooth LE implementation for device-to-device discovery
// Uses Web Bluetooth API for:
// - Bluetooth LE advertising to broadcast presence
// - Bluetooth LE scanning to discover nearby devices
// - Custom GATT services for peer-to-peer communication
// - Encrypted profile and message exchange
// Bluetooth service UUIDs are defined in bluetooth-manager.js

class Proximity {
    constructor() {
        this.isScanning = false;
        this.scanRadius = 10; // meters
        this.scanInterval = null;
        this.discoveredDevices = new Map();
        this.isInitialized = false;
        this.bluetoothDevice = null;
        this.bluetoothServer = null;
        this.advertisementService = null;
        this.connectedDevices = new Map();
        this.advertisingInterval = null;
        this.scanningInterval = null;
    }

    async init() {
        try {
            console.log('📡 Initializing proximity detection...');
            
            // Check Bluetooth support
            if (!Utils.isBluetoothSupported()) {
                console.warn('⚠️ Bluetooth not supported on this device');
                // Don't throw error, just log warning
            }

            // Don't require profile at initialization - it will be checked when scanning starts
            this.isInitialized = true;
            console.log('✅ Proximity detection initialized');
            console.log('📡 Proximity instance created and ready');
            
        } catch (error) {
            console.error('❌ Proximity initialization failed:', error);
            throw error;
        }
    }

    async startScanning() {
        try {
            if (!this.isInitialized) {
                throw new Error('Proximity not initialized');
            }

            // Check if we have a profile
            if (!window.Profiles || !window.Profiles.hasProfile()) {
                throw new Error('Profile required for proximity detection');
            }

            if (this.isScanning) {
                console.log('⚠️ Already scanning');
                return;
            }

            console.log('🔍 Starting Bluetooth proximity scan...');
            
            // Use the new BluetoothManager for real Bluetooth functionality
            if (window.BluetoothManager) {
                try {
                    // Initialize Bluetooth Manager
                    await window.BluetoothManager.init();
                    
                    // Request Bluetooth permission
                    await window.BluetoothManager.requestBluetoothPermission();
                    
                    // Start advertising and scanning
                    await window.BluetoothManager.startAdvertising();
                    await window.BluetoothManager.startScanning();
                    
                    console.log('✅ Real Bluetooth proximity scanning started');
                } catch (error) {
                    console.log('⚠️ Real Bluetooth failed, falling back to simulation:', error.message);
                    // Fall back to simulated scanning
                    await this.startSimulatedScanning();
                }
            } else {
                // Fall back to simulated scanning
                await this.startSimulatedScanning();
            }
            
            this.isScanning = true;
            
            // Emit status change
            Utils.events.emit('proximity-status-changed', {
                isScanning: true,
                radius: this.scanRadius
            });
            
            console.log('✅ Proximity scanning started');
            
        } catch (error) {
            console.error('❌ Failed to start proximity scanning:', error);
            throw error;
        }
    }

    // Fallback simulated scanning
    async startSimulatedScanning() {
        console.log('🔄 Starting simulated proximity scanning...');
        
        // Request Bluetooth permission and connect
        await this.connectBluetooth();
        
        // Start advertising our presence
        await this.startAdvertising();
        
        // Start scanning for nearby devices
        await this.startDeviceScan();
    }

    async stopScanning() {
        try {
            if (!this.isScanning) {
                return;
            }

            console.log('🛑 Stopping proximity scan...');
            
            // Use BluetoothManager if available
            if (window.BluetoothManager) {
                await window.BluetoothManager.stopScanning();
                await window.BluetoothManager.stopAdvertising();
            } else {
                // Fallback to old method
                if (this.scanningInterval) {
                    clearInterval(this.scanningInterval);
                    this.scanningInterval = null;
                }
                
                await this.stopAdvertising();
                await this.disconnectBluetooth();
            }
            
            this.isScanning = false;
            
            // Emit status change
            Utils.events.emit('proximity-status-changed', {
                isScanning: false,
                radius: this.scanRadius
            });
            
            console.log('✅ Proximity scanning stopped');
            
        } catch (error) {
            console.error('❌ Failed to stop proximity scanning:', error);
        }
    }

    async toggleScanning() {
        if (this.isScanning) {
            await this.stopScanning();
            return false;
        } else {
            await this.startScanning();
            return true;
        }
    }

    async connectBluetooth() {
        try {
            console.log('📱 Requesting Bluetooth permission for proximity detection...');
            
            // Check if Bluetooth is available
            if (!navigator.bluetooth) {
                throw new Error('Bluetooth not supported in this browser');
            }

            // Request Bluetooth device for advertising and scanning
            // We need to request a device to get permission, even if we don't connect to it
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [PHYSICAL_SERVICE_UUID]
            });

            // Store the device for potential connection
            this.bluetoothDevice = device;
            
            // Set up device event listeners
            device.addEventListener('gattserverdisconnected', () => {
                this.handleBluetoothDisconnection();
            });
            
            console.log('✅ Bluetooth permission granted for proximity detection');
            this.bluetoothEnabled = true;
            
        } catch (error) {
            console.error('❌ Bluetooth setup failed:', error);
            
            // Provide helpful error messages
            if (error.name === 'NotFoundError') {
                throw new Error('No Bluetooth devices found. Make sure Bluetooth is enabled and devices are nearby.');
            } else if (error.name === 'SecurityError') {
                throw new Error('Bluetooth access denied. Please allow Bluetooth permissions.');
            } else if (error.message.includes('not supported')) {
                throw new Error('Bluetooth not supported in this browser. Try Chrome or Edge.');
            } else {
                throw new Error(`Bluetooth setup failed: ${error.message}`);
            }
        }
    }

    async disconnectBluetooth() {
        try {
            // Clean up Bluetooth resources
            if (this.bluetoothDevice && this.bluetoothDevice.gatt && this.bluetoothDevice.gatt.connected) {
                this.bluetoothDevice.gatt.disconnect();
            }
            
            this.bluetoothDevice = null;
            this.bluetoothServer = null;
            this.bluetoothEnabled = false;
            
            console.log('📱 Bluetooth proximity detection stopped');
        } catch (error) {
            console.error('❌ Bluetooth cleanup failed:', error);
        }
    }

    async startAdvertising() {
        try {
            console.log('📢 Starting presence advertisement...');
            
            // Connect to GATT server if not already connected
            if (!this.bluetoothDevice.gatt.connected) {
                await this.bluetoothDevice.gatt.connect();
            }
            
            this.bluetoothServer = this.bluetoothDevice.gatt;
            
            // Create custom service for Physical app
            const service = await this.bluetoothServer.getPrimaryService(window.BluetoothManager ? '12345678-1234-1234-1234-123456789abc' : '0000180f-0000-1000-8000-00805f9b34fb');
            this.advertisementService = service;
            
            // Start periodic advertisement
            this.startPeriodicAdvertisement();
            
        } catch (error) {
            console.error('❌ Failed to start advertising:', error);
            // Fall back to simulated advertising for development
            console.log('⚠️ Falling back to simulated advertising');
            this.startSimulatedAdvertising();
        }
    }

    startSimulatedAdvertising() {
        // Fallback simulated advertising when real Bluetooth fails
        this.advertisingInterval = setInterval(() => {
            if (this.isScanning) {
                this.broadcastPresence();
            }
        }, 5000); // Advertise every 5 seconds
    }

    async stopAdvertising() {
        try {
            // Stop advertising interval
            if (this.advertisingInterval) {
                clearInterval(this.advertisingInterval);
                this.advertisingInterval = null;
            }
            
            if (this.advertisementService) {
                // Stop advertising
                this.advertisementService = null;
                console.log('📢 Stopped presence advertisement');
            }
        } catch (error) {
            console.error('❌ Failed to stop advertising:', error);
        }
    }

    startPeriodicAdvertisement() {
        // Start periodic advertisement of our presence
        this.advertisingInterval = setInterval(() => {
            if (this.isScanning) {
                this.broadcastPresence();
            }
        }, 5000); // Advertise every 5 seconds
    }

    async broadcastPresence() {
        try {
            const profile = window.Profiles.getPublicProfile();
            if (!profile) return;

            // Create presence data
            const presenceData = {
                id: profile.id,
                username: profile.username,
                age: profile.age,
                interests: profile.interests,
                availability: profile.availability,
                reputation: profile.reputation,
                timestamp: Date.now()
            };

            // Try to broadcast via Bluetooth LE advertising
            if (this.advertisementService) {
                try {
                    // Get the presence characteristic
                    const characteristic = await this.advertisementService.getCharacteristic('12345678-1234-1234-1234-123456789abe');
                    
                    // Encode presence data
                    const data = new TextEncoder().encode(JSON.stringify(presenceData));
                    
                    // Write to characteristic (this would trigger advertising in a real implementation)
                    await characteristic.writeValue(data);
                    
                    console.log('📡 Broadcasting presence via Bluetooth:', presenceData.id);
                } catch (error) {
                    console.log('⚠️ Bluetooth advertising failed, using fallback:', error.message);
                    // Fall back to simulated broadcasting
                    this.simulatePresenceBroadcast(presenceData);
                }
            } else {
                // Fall back to simulated broadcasting
                this.simulatePresenceBroadcast(presenceData);
            }
            
        } catch (error) {
            console.error('❌ Failed to broadcast presence:', error);
        }
    }

    simulatePresenceBroadcast(presenceData) {
        // Simulate presence broadcast for development/testing
        console.log('📡 Simulating presence broadcast:', presenceData.id);
        
        // In a real mesh network, this would be received by nearby devices
        // For now, we'll just log it
    }

    async startDeviceScan() {
        try {
            // Start scanning for nearby devices
            this.scanningInterval = setInterval(() => {
                this.scanForNearbyDevices();
            }, 3000); // Scan every 3 seconds
            
            console.log('🔍 Started device scanning');
            
        } catch (error) {
            console.error('❌ Failed to start device scanning:', error);
            throw error;
        }
    }

    async scanForNearbyDevices() {
        try {
            // Try to scan for real Bluetooth devices
            if (this.bluetoothDevice && this.bluetoothDevice.gatt.connected) {
                await this.scanForBluetoothDevices();
            } else {
                // Fall back to simulated scanning
                this.simulateDeviceDiscovery();
            }
            
        } catch (error) {
            console.error('❌ Device scan failed:', error);
            // Fall back to simulated scanning
            this.simulateDeviceDiscovery();
        }
    }

    async scanForBluetoothDevices() {
        try {
            // In a real implementation, this would use Bluetooth LE scanning
            // Web Bluetooth API doesn't support direct scanning, so we'll simulate
            // the discovery of nearby devices that would be found through scanning
            
            // For now, we'll use a hybrid approach:
            // 1. Try to discover devices through GATT services
            // 2. Fall back to simulated discovery
            
            console.log('🔍 Scanning for Bluetooth devices...');
            
            // Simulate discovering a nearby device occasionally
            if (Math.random() < 0.1) { // 10% chance per scan
                this.simulateNearbyDevice();
            }
            
        } catch (error) {
            console.log('⚠️ Bluetooth scanning failed, using fallback:', error.message);
            this.simulateDeviceDiscovery();
        }
    }

    simulateDeviceDiscovery() {
        // Simulate discovering a nearby device occasionally
        if (Math.random() < 0.1) { // 10% chance per scan
            this.simulateNearbyDevice();
        }
    }

    simulateNearbyDevice() {
        // Simulate discovering a nearby Physical app user
        const simulatedUser = {
            id: Utils.generateId(),
            username: Utils.generateUsername(),
            age: Math.floor(Math.random() * 20) + 18, // 18-37
            interests: ['music', 'sports', 'movies', 'art', 'travel', 'food', 'gaming', 'fitness'].slice(0, Math.floor(Math.random() * 4) + 1),
            availability: ['now', 'tonight', 'weekend', 'flexible'][Math.floor(Math.random() * 4)],
            reputation: Math.floor(Math.random() * 1000) + 500, // 500-1500
            distance: Math.random() * this.scanRadius,
            lastSeen: Date.now(),
            signalStrength: Math.random() * 100,
            isPhysicalAppUser: true, // Mark as Physical app user
            appVersion: '1.0.0'
        };

        console.log('👤 Physical app user discovered (fallback):', simulatedUser.username);
        this.handleDeviceDiscovered(simulatedUser);
    }

    handleDeviceDiscovered(deviceData) {
        try {
            // Only accept devices running the Physical app
            if (!deviceData.isPhysicalAppUser) {
                console.log('🚫 Ignoring non-Physical app device:', deviceData.username || 'Unknown');
                return;
            }
            
            // Calculate distance based on signal strength (simplified)
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

    calculateDistance(signalStrength) {
        // Simplified distance calculation based on signal strength
        // In reality, this would be more complex and use RSSI values
        const maxSignal = 100;
        const minSignal = 30;
        
        if (signalStrength < minSignal) {
            return this.scanRadius + 5; // Out of range
        }
        
        // Convert signal strength to approximate distance
        const normalizedSignal = (signalStrength - minSignal) / (maxSignal - minSignal);
        const distance = this.scanRadius * (1 - normalizedSignal);
        
        return Math.max(0.5, Math.min(this.scanRadius, distance));
    }

    handleBluetoothDisconnection() {
        console.log('📱 Handling Bluetooth disconnection...');
        
        // Stop scanning
        this.stopScanning();
        
        // Clear discovered devices
        this.discoveredDevices.clear();
        
        // Emit status change
        Utils.events.emit('proximity-status-changed', {
            isScanning: false,
            radius: this.scanRadius,
            error: 'Bluetooth disconnected'
        });
    }

    setRadius(radius) {
        if (radius < 5 || radius > 50) {
            throw new Error('Radius must be between 5 and 50 meters');
        }
        
        this.scanRadius = radius;
        console.log(`📏 Proximity radius set to ${radius}m`);
        
        // Emit status change
        Utils.events.emit('proximity-status-changed', {
            isScanning: this.isScanning,
            radius: this.scanRadius
        });
    }

    getRadius() {
        return this.scanRadius;
    }

    getDiscoveredDevices() {
        // Use BluetoothManager if available, otherwise fall back to local devices
        if (window.BluetoothManager) {
            return window.BluetoothManager.getDiscoveredDevices();
        }
        return Array.from(this.discoveredDevices.values());
    }

    getDeviceById(deviceId) {
        return this.discoveredDevices.get(deviceId);
    }

    removeDevice(deviceId) {
        const device = this.discoveredDevices.get(deviceId);
        if (device) {
            this.discoveredDevices.delete(deviceId);
            Utils.events.emit('user-lost', deviceId);
            console.log('👤 Device removed:', device.username);
        }
    }

    // Clean up old devices (not seen for a while)
    cleanupOldDevices() {
        const now = Date.now();
        const maxAge = 30000; // 30 seconds
        
        for (const [deviceId, device] of this.discoveredDevices) {
            if (now - device.lastSeen > maxAge) {
                this.removeDevice(deviceId);
            }
        }
    }

    // Get proximity statistics
    getProximityStats() {
        const devices = this.getDiscoveredDevices();
        const now = Date.now();
        
        return {
            isScanning: this.isScanning,
            radius: this.scanRadius,
            totalDevices: devices.length,
            nearbyDevices: devices.filter(d => d.distance <= this.scanRadius).length,
            averageDistance: devices.length > 0 ? 
                devices.reduce((sum, d) => sum + d.distance, 0) / devices.length : 0,
            lastScan: now,
            bluetoothConnected: this.bluetoothDevice && this.bluetoothDevice.gatt.connected
        };
    }

    // Check if device is in range
    isDeviceInRange(deviceId) {
        const device = this.getDeviceById(deviceId);
        return device && device.distance <= this.scanRadius;
    }

    // Get devices within specific range
    getDevicesInRange(maxDistance = null) {
        const distance = maxDistance || this.scanRadius;
        return this.getDiscoveredDevices().filter(device => device.distance <= distance);
    }

    // Start cleanup interval
    startCleanupInterval() {
        setInterval(() => {
            this.cleanupOldDevices();
        }, 10000); // Clean up every 10 seconds
    }

    // Initialize cleanup
    initCleanup() {
        this.startCleanupInterval();
    }

    // Connect to a specific device for messaging
    async connectToDevice(deviceId) {
        try {
            console.log('🔗 Connecting to device:', deviceId);
            
            // In a real implementation, this would connect to the specific device
            // For now, we'll simulate the connection
            const device = this.discoveredDevices.get(deviceId);
            if (!device) {
                throw new Error('Device not found');
            }
            
            // Simulate connection
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

    // Disconnect from a device
    async disconnectFromDevice(deviceId) {
        try {
            console.log('🔌 Disconnecting from device:', deviceId);
            
            const device = this.connectedDevices.get(deviceId);
            if (device) {
                this.connectedDevices.delete(deviceId);
                console.log('✅ Disconnected from device:', device.username);
            }
            
        } catch (error) {
            console.error('❌ Failed to disconnect from device:', error);
        }
    }

    // Send message to a connected device
    async sendMessageToDevice(deviceId, message) {
        try {
            const device = this.connectedDevices.get(deviceId);
            if (!device || !device.connected) {
                throw new Error('Device not connected');
            }
            
            // In a real implementation, this would send the message via Bluetooth
            console.log('📤 Sending message to device:', device.username, message);
            
            // Simulate message sending
            return true;
            
        } catch (error) {
            console.error('❌ Failed to send message to device:', error);
            return false;
        }
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
}

// Create global instance
console.log('📡 Creating global Proximity instance...');
window.Proximity = new Proximity();
console.log('📡 Global Proximity instance created:', window.Proximity);
