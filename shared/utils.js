// Utility functions for the Hookup P2P app

class Utils {
    // Generate a random ID
    static generateId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Generate a random username
    static generateUsername() {
        const adjectives = ['Cool', 'Mysterious', 'Fun', 'Wild', 'Chill', 'Bold', 'Sweet', 'Sharp'];
        const nouns = ['Tiger', 'Phoenix', 'Wolf', 'Eagle', 'Fox', 'Lion', 'Bear', 'Hawk'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 99) + 1;
        return `${adj}${noun}${num}`;
    }

    // Format distance for display
    static formatDistance(distance) {
        if (distance < 1) {
            return '< 1m';
        } else if (distance < 10) {
            return `${Math.round(distance)}m`;
        } else {
            return `${Math.round(distance)}m`;
        }
    }

    // Format timestamp for messages
    static formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Validate age (must be 18+)
    static validateAge(age) {
        const numAge = parseInt(age);
        return numAge >= 18 && numAge <= 99;
    }

    // Validate interests string
    static validateInterests(interests) {
        if (!interests || interests.trim().length === 0) {
            return false;
        }
        const interestList = interests.split(',').map(i => i.trim());
        return interestList.length >= 1 && interestList.length <= 10;
    }

    // Sanitize user input
    static sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        return input.trim().replace(/[<>]/g, '');
    }

    // Show notification
    static showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        // Set background color based on type
        const colors = {
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FF9800',
            error: '#F44336'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to DOM
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after duration
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // Show loading state
    static showLoading(element, text = 'Loading...') {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (!element) return;

        element.dataset.originalContent = element.innerHTML;
        element.innerHTML = `
            <div class="loading-inline">
                <div class="loading-spinner-small"></div>
                <span>${text}</span>
            </div>
        `;
        element.disabled = true;
    }

    // Hide loading state
    static hideLoading(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (!element) return;

        if (element.dataset.originalContent) {
            element.innerHTML = element.dataset.originalContent;
            delete element.dataset.originalContent;
        }
        element.disabled = false;
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Check if Bluetooth is supported
    static isBluetoothSupported() {
        return 'bluetooth' in navigator;
    }

    // Check if WebRTC is supported
    static isWebRTCSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    // Check if service worker is supported
    static isServiceWorkerSupported() {
        return 'serviceWorker' in navigator;
    }

    // Get device info
    static getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            bluetoothSupported: this.isBluetoothSupported(),
            webrtcSupported: this.isWebRTCSupported(),
            serviceWorkerSupported: this.isServiceWorkerSupported()
        };
    }

    // Local storage helpers
    static storage = {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Storage set error:', error);
                return false;
            }
        },

        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Storage get error:', error);
                return defaultValue;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Storage remove error:', error);
                return false;
            }
        },

        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('Storage clear error:', error);
                return false;
            }
        }
    };

    // Event emitter for app-wide events
    static events = {
        listeners: {},

        on(event, callback) {
            if (!this.listeners[event]) {
                this.listeners[event] = [];
            }
            this.listeners[event].push(callback);
        },

        off(event, callback) {
            if (!this.listeners[event]) return;
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        },

        emit(event, data) {
            if (!this.listeners[event]) return;
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Event callback error:', error);
                }
            });
        }
    };
}

// Add CSS for loading spinner
const style = document.createElement('style');
style.textContent = `
    .loading-inline {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .loading-spinner-small {
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);

// Export for use in other modules
window.Utils = Utils;
