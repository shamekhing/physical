// UI Manager for screen transitions and UI interactions
class UIManager {
    constructor() {
        this.currentScreen = 'loading';
        this.currentTooltip = null;
    }

    showScreen(screenName) {
        console.log(`🖥️ Switching to screen: ${screenName}`);
        
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
            console.log(`✅ Screen switched to: ${screenName}`);
        } else {
            console.error(`❌ Screen not found: ${screenName}-screen`);
        }
    }

    showProfileScreen() {
        this.showScreen('profile');
    }

    showMainScreen() {
        this.showScreen('main');
        // Show discovery section, hide chat (default view)
        const chatSection = document.getElementById('chat-section');
        const discoverySection = document.getElementById('discovery-section');
        if (chatSection) chatSection.style.display = 'none';
        if (discoverySection) discoverySection.style.display = 'block';
        
        // Update proximity status to show user needs to start scanning
        this.updateProximityStatus({
            isActive: false,
            message: 'Click the 📡 button to start scanning for nearby users'
        });
    }

    showChatScreen(userId) {
        this.showScreen('main');
        // Hide discovery section, show chat
        const chatSection = document.getElementById('chat-section');
        const discoverySection = document.getElementById('discovery-section');
        if (chatSection) chatSection.style.display = 'block';
        if (discoverySection) discoverySection.style.display = 'none';
        
        // Update chat header with user info
        this.updateChatHeader(userId);
    }

    showDiscoveryScreen() {
        this.showScreen('main');
        // Show discovery section, hide chat
        const chatSection = document.getElementById('chat-section');
        const discoverySection = document.getElementById('discovery-section');
        if (chatSection) chatSection.style.display = 'none';
        if (discoverySection) discoverySection.style.display = 'block';
    }

    updateChatHeader(userId) {
        if (!window.Discovery) return;
        
        const user = window.Discovery.getUser(userId);
        if (user) {
            const chatUserName = document.getElementById('chat-user-name');
            const chatUserDistance = document.getElementById('chat-user-distance');
            
            if (chatUserName) chatUserName.textContent = user.username;
            if (chatUserDistance) chatUserDistance.textContent = `${Utils.formatDistance(user.distance)} away`;
        }
    }

    updateProximityStatus(status) {
        const statusText = document.querySelector('.status-text');
        const statusDot = document.querySelector('.status-dot');
        const proximityBtn = document.getElementById('proximity-toggle');
        
        if (statusText) {
            statusText.textContent = status.message;
        }
        
        if (statusDot) {
            statusDot.classList.toggle('active', status.isActive);
        }
        
        // Update proximity button appearance
        if (proximityBtn) {
            proximityBtn.classList.toggle('scanning', status.isActive);
            proximityBtn.setAttribute('data-tooltip', 
                status.isActive ? 'Stop Bluetooth scanning' : 'Start Bluetooth scanning to find nearby users'
            );
        }
    }

    scrollChatToBottom() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    addLoadingState(element) {
        element.classList.add('loading');
        element.disabled = true;
    }

    removeLoadingState(element) {
        element.classList.remove('loading');
        element.disabled = false;
    }

    // Tooltip functionality
    showTooltip(element, text) {
        // Remove existing tooltip
        this.hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: var(--surface-color);
            color: var(--text-color);
            padding: 8px 12px;
            border-radius: var(--border-radius);
            font-size: 0.85em;
            z-index: 10000;
            box-shadow: var(--shadow);
            border: 1px solid var(--border-color);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
        
        // Fade in
        setTimeout(() => tooltip.style.opacity = '1', 10);
        
        this.currentTooltip = tooltip;
    }

    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }

    setupTooltips() {
        // Enhanced tooltip functionality
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.getAttribute('data-tooltip'));
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    setupButtonLoadingStates() {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Add loading state for async operations
                if (button.id === 'proximity-toggle' || button.id === 'send-message') {
                    this.addLoadingState(button);
                    setTimeout(() => this.removeLoadingState(button), 2000);
                }
            });
        });
    }
}

// Create global instance
window.UIManager = new UIManager();
