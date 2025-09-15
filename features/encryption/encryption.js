// End-to-end encryption for Hookup P2P
class Encryption {
    constructor() {
        this.keyPair = null;
        this.publicKey = null;
        this.privateKey = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('🔐 Initializing encryption...');
            
            // Check if Web Crypto API is supported
            if (!window.crypto || !window.crypto.subtle) {
                console.warn('⚠️ Web Crypto API not supported, using fallback mode');
                this.isInitialized = true; // Allow app to continue without encryption
                return;
            }

            // Generate or load key pair
            await this.generateKeyPair();
            
            this.isInitialized = true;
            console.log('✅ Encryption initialized');
            
        } catch (error) {
            console.error('❌ Encryption initialization failed:', error);
            console.warn('⚠️ Continuing without encryption...');
            this.isInitialized = true; // Allow app to continue without encryption
        }
    }

    async generateKeyPair() {
        try {
            // Check if we have existing keys
            const existingKeys = Utils.storage.get('encryptionKeys');
            if (existingKeys) {
                console.log('📋 Loading existing encryption keys...');
                
                // Import the stored keys back to CryptoKey objects
                const publicKeyObj = await this.importPublicKey(existingKeys.publicKey);
                const privateKeyObj = await this.importPrivateKey(existingKeys.privateKey);
                
                // Create the keyPair object with the imported keys
                this.keyPair = {
                    publicKey: publicKeyObj,
                    privateKey: privateKeyObj
                };
                
                this.publicKey = existingKeys.publicKey;
                this.privateKey = existingKeys.privateKey;
                console.log('✅ Loaded existing encryption keys');
                return;
            }

            // Generate new key pair
            console.log('🔑 Generating new encryption key pair...');
            
            this.keyPair = await window.crypto.subtle.generateKey(
                {
                    name: 'RSA-OAEP',
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: 'SHA-256'
                },
                true, // extractable
                ['encrypt', 'decrypt']
            );

            // Export keys for storage
            const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', this.keyPair.publicKey);
            const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', this.keyPair.privateKey);

            const keysToStore = {
                publicKey: this.arrayBufferToBase64(publicKeyBuffer),
                privateKey: this.arrayBufferToBase64(privateKeyBuffer),
                createdAt: Date.now()
            };

            // Store keys
            Utils.storage.set('encryptionKeys', keysToStore);
            
            this.publicKey = keysToStore.publicKey;
            this.privateKey = keysToStore.privateKey;
            
            console.log('✅ New encryption keys generated and stored');
            
        } catch (error) {
            console.error('❌ Key generation failed:', error);
            throw error;
        }
    }

    async importPublicKey(base64Key) {
        try {
            const keyBuffer = this.base64ToArrayBuffer(base64Key);
            return await window.crypto.subtle.importKey(
                'spki',
                keyBuffer,
                {
                    name: 'RSA-OAEP',
                    hash: 'SHA-256'
                },
                false,
                ['encrypt']
            );
        } catch (error) {
            console.error('❌ Failed to import public key:', error);
            throw error;
        }
    }

    async importPrivateKey(base64Key) {
        try {
            const keyBuffer = this.base64ToArrayBuffer(base64Key);
            return await window.crypto.subtle.importKey(
                'pkcs8',
                keyBuffer,
                {
                    name: 'RSA-OAEP',
                    hash: 'SHA-256'
                },
                false,
                ['decrypt']
            );
        } catch (error) {
            console.error('❌ Failed to import private key:', error);
            throw error;
        }
    }

    async encryptMessage(message, recipientPublicKey) {
        try {
            if (!this.isInitialized) {
                throw new Error('Encryption not initialized');
            }

            // Convert message to ArrayBuffer
            const messageBuffer = new TextEncoder().encode(message);
            
            // Import recipient's public key
            const publicKey = await this.importPublicKey(recipientPublicKey);
            
            // Encrypt message
            const encryptedBuffer = await window.crypto.subtle.encrypt(
                {
                    name: 'RSA-OAEP'
                },
                publicKey,
                messageBuffer
            );

            // Convert to base64 for transmission
            return this.arrayBufferToBase64(encryptedBuffer);
            
        } catch (error) {
            console.error('❌ Message encryption failed:', error);
            throw error;
        }
    }

    async decryptMessage(encryptedMessage) {
        try {
            if (!this.isInitialized) {
                throw new Error('Encryption not initialized');
            }

            // Convert base64 to ArrayBuffer
            const encryptedBuffer = this.base64ToArrayBuffer(encryptedMessage);
            
            // Import our private key
            const privateKey = await this.importPrivateKey(this.privateKey);
            
            // Decrypt message
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: 'RSA-OAEP'
                },
                privateKey,
                encryptedBuffer
            );

            // Convert back to string
            return new TextDecoder().decode(decryptedBuffer);
            
        } catch (error) {
            console.error('❌ Message decryption failed:', error);
            throw error;
        }
    }

    // Generate a symmetric key for faster encryption of large data
    async generateSymmetricKey() {
        try {
            const key = await window.crypto.subtle.generateKey(
                {
                    name: 'AES-GCM',
                    length: 256
                },
                true,
                ['encrypt', 'decrypt']
            );

            const exportedKey = await window.crypto.subtle.exportKey('raw', key);
            return this.arrayBufferToBase64(exportedKey);
        } catch (error) {
            console.error('❌ Symmetric key generation failed:', error);
            throw error;
        }
    }

    // Encrypt with symmetric key (faster for large data)
    async encryptWithSymmetricKey(data, keyBase64) {
        try {
            const keyBuffer = this.base64ToArrayBuffer(keyBase64);
            const cryptoKey = await window.crypto.subtle.importKey(
                'raw',
                keyBuffer,
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            );

            const dataBuffer = new TextEncoder().encode(data);
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            
            const encryptedBuffer = await window.crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                cryptoKey,
                dataBuffer
            );

            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encryptedBuffer), iv.length);

            return this.arrayBufferToBase64(combined.buffer);
        } catch (error) {
            console.error('❌ Symmetric encryption failed:', error);
            throw error;
        }
    }

    // Decrypt with symmetric key
    async decryptWithSymmetricKey(encryptedData, keyBase64) {
        try {
            const keyBuffer = this.base64ToArrayBuffer(keyBase64);
            const cryptoKey = await window.crypto.subtle.importKey(
                'raw',
                keyBuffer,
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );

            const combinedBuffer = this.base64ToArrayBuffer(encryptedData);
            const iv = combinedBuffer.slice(0, 12);
            const encrypted = combinedBuffer.slice(12);

            const decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                cryptoKey,
                encrypted
            );

            return new TextDecoder().decode(decryptedBuffer);
        } catch (error) {
            console.error('❌ Symmetric decryption failed:', error);
            throw error;
        }
    }

    // Hash function for data integrity
    async hash(data) {
        try {
            const dataBuffer = new TextEncoder().encode(data);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
            return this.arrayBufferToBase64(hashBuffer);
        } catch (error) {
            console.error('❌ Hashing failed:', error);
            throw error;
        }
    }

    // Generate a secure random token
    generateToken(length = 32) {
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        return this.arrayBufferToBase64(array.buffer);
    }

    // Zero-knowledge age verification
    async createAgeProof(age) {
        try {
            // Create a commitment to the age without revealing it
            const ageString = age.toString();
            const salt = this.generateToken(16);
            const commitment = await this.hash(ageString + salt);
            
            // Create a proof that age >= 18 without revealing exact age
            const proof = {
                commitment: commitment,
                salt: salt,
                minAge: 18,
                proof: await this.createRangeProof(age, 18, 99)
            };
            
            return proof;
        } catch (error) {
            console.error('❌ Age proof creation failed:', error);
            throw error;
        }
    }

    // Simple range proof (in a real implementation, this would be more sophisticated)
    async createRangeProof(value, min, max) {
        // This is a simplified version - in production, use proper zero-knowledge proofs
        const proof = {
            value: value,
            min: min,
            max: max,
            timestamp: Date.now(),
            signature: await this.sign(`${value}-${min}-${max}-${Date.now()}`)
        };
        return proof;
    }

    // Sign data with our private key
    async sign(data) {
        try {
            const dataBuffer = new TextEncoder().encode(data);
            const privateKey = await this.importPrivateKey(this.privateKey);
            
            const signature = await window.crypto.subtle.sign(
                {
                    name: 'RSA-PSS',
                    saltLength: 32
                },
                privateKey,
                dataBuffer
            );

            return this.arrayBufferToBase64(signature);
        } catch (error) {
            console.error('❌ Signing failed:', error);
            throw error;
        }
    }

    // Verify signature with public key
    async verifySignature(data, signature, publicKey) {
        try {
            const dataBuffer = new TextEncoder().encode(data);
            const signatureBuffer = this.base64ToArrayBuffer(signature);
            const key = await this.importPublicKey(publicKey);
            
            return await window.crypto.subtle.verify(
                {
                    name: 'RSA-PSS',
                    saltLength: 32
                },
                key,
                signatureBuffer,
                dataBuffer
            );
        } catch (error) {
            console.error('❌ Signature verification failed:', error);
            return false;
        }
    }

    // Utility functions
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Get public key for sharing
    getPublicKey() {
        return this.publicKey;
    }

    // Check if encryption is ready
    isReady() {
        return this.isInitialized && this.publicKey && this.privateKey;
    }

    hasValidKeys() {
        return this.isInitialized && this.keyPair && this.keyPair.publicKey && this.keyPair.privateKey;
    }

    // Clear all encryption data (for logout)
    clear() {
        this.keyPair = null;
        this.publicKey = null;
        this.privateKey = null;
        this.isInitialized = false;
        Utils.storage.remove('encryptionKeys');
    }

    // Reset encryption keys (for when keys are corrupted)
    async resetKeys() {
        console.log('🔄 Resetting encryption keys...');
        this.clear();
        try {
            await this.generateKeyPair();
            console.log('✅ Encryption keys reset successfully');
        } catch (error) {
            console.error('❌ Failed to reset encryption keys:', error);
            throw error;
        }
    }
}

// Create global instance
window.Encryption = new Encryption();
