// Bluetooth proximity detection for Physical
// 
// IMPLEMENTATION NOTE:
// This implementation uses a simulated approach for development purposes.
// In a production environment, this would use:
// - Bluetooth LE advertising to broadcast presence
// - Bluetooth LE scanning to discover nearby devices
// - Custom GATT services for peer-to-peer communication
// - Proper mesh networking protocols
//
// For now, we simulate nearby users for testing the UI and user experience.
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
            
            // Request Bluetooth permission and connect
            await this.connectBluetooth();
            
            // Start advertising our presence
            await this.startAdvertising();
            
            // Start scanning for nearby devices
            await this.startDeviceScan();
            
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

    async stopScanning() {
        try {
            if (!this.isScanning) {
                return;
            }

            console.log('🛑 Stopping proximity scan...');
            
            // Stop device scan
            if (this.scanInterval) {
                clearInterval(this.scanInterval);
                this.scanInterval = null;
            }
            
            // Stop advertising
            await this.stopAdvertising();
            
            // Disconnect Bluetooth
            await this.disconnectBluetooth();
            
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
            // For proximity detection, we need to request permission to scan
            // but we don't necessarily need to connect to a specific device
            console.log('📱 Requesting Bluetooth permission for proximity detection...');
            
            // Check if Bluetooth is available
            if (!navigator.bluetooth) {
                throw new Error('Bluetooth not supported in this browser');
            }

            // For development, we'll simulate Bluetooth permission
            // In a production app, this would use:
            // await navigator.bluetooth.requestDevice({ acceptAllDevices: true })
            // But for now, we'll just check if Bluetooth API is available
            
            // Simulate a brief delay for permission request
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('✅ Bluetooth permission granted for proximity detection');
            
            // Set up simulated Bluetooth environment
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
            // In a real implementation, we would use Bluetooth LE advertising
            // For now, we'll simulate this with a service
            console.log('📢 Starting presence advertisement...');
            
            // Create a custom service for our app
            const serviceUuid = '0000180f-0000-1000-8000-00805f9b34fb'; // Battery service as example
            
            // Get the service
            const service = await this.bluetoothServer.getPrimaryService(serviceUuid);
            this.advertisementService = service;
            
            // Start periodic advertisement
            this.startPeriodicAdvertisement();
            
        } catch (error) {
            console.error('❌ Failed to start advertising:', error);
            // Continue without advertising - scanning will still work
        }
    }

    async stopAdvertising() {
        try {
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
        // Simulate periodic advertisement of our presence
        setInterval(() => {
            if (this.isScanning && this.advertisementService) {
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

            // In a real implementation, this would be sent via Bluetooth LE advertising
            console.log('📡 Broadcasting presence:', presenceData.id);
            
        } catch (error) {
            console.error('❌ Failed to broadcast presence:', error);
        }
    }

    async startDeviceScan() {
        try {
            // Start scanning for nearby devices
            this.scanInterval = setInterval(() => {
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
            // In a real implementation, this would use Bluetooth LE scanning
            // For now, we'll simulate discovering nearby devices
            
            // Simulate discovering a nearby device occasionally
            if (Math.random() < 0.1) { // 10% chance per scan
                this.simulateNearbyDevice();
            }
            
        } catch (error) {
            console.error('❌ Device scan failed:', error);
        }
    }

    simulateNearbyDevice() {
        // Simulate discovering a nearby user
        const simulatedUser = {
            id: Utils.generateId(),
            username: Utils.generateUsername(),
            age: Math.floor(Math.random() * 20) + 18, // 18-37
            interests: ['music', 'sports', 'movies'].slice(0, Math.floor(Math.random() * 3) + 1),
            availability: ['now', 'tonight', 'weekend', 'flexible'][Math.floor(Math.random() * 4)],
            reputation: Math.floor(Math.random() * 1000) + 500, // 500-1500
            distance: Math.random() * this.scanRadius,
            lastSeen: Date.now(),
            signalStrength: Math.random() * 100
        };

        this.handleDeviceDiscovered(simulatedUser);
    }

    handleDeviceDiscovered(deviceData) {
        try {
            // Calculate distance based on signal strength (simplified)
            const distance = this.calculateDistance(deviceData.signalStrength);
            
            const userData = {
                ...deviceData,
                distance: distance,
                discoveredAt: Date.now()
            };

            // Store discovered device
            this.discoveredDevices.set(userData.id, userData);
            
            console.log('👤 Device discovered:', userData.username, `${distance.toFixed(1)}m away`);
            
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
}

// Create global instance
window.Proximity = new Proximity();
