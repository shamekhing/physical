// Swipe Manager for swipe-based discovery functionality
class SwipeManager {
    constructor() {
        this.currentCards = [];
    }

    renderSwipeCards(nearbyUsers) {
        const swipeStack = document.getElementById('swipe-stack');
        
        if (!swipeStack) return;

        if (nearbyUsers.length === 0) {
            swipeStack.innerHTML = '<div class="no-more-cards"><h3>No one nearby</h3><p>Keep scanning to find people in your area!</p></div>';
            return;
        }

        // Create swipe cards (show up to 3 at a time)
        const cardsToShow = nearbyUsers.slice(0, 3);
        this.currentCards = cardsToShow;
        
        swipeStack.innerHTML = cardsToShow.map((user, index) => `
            <div class="swipe-card" data-user-id="${user.id}" data-index="${index}">
                <div class="swipe-card-header">
                    <div class="swipe-card-avatar">${this.getUserAvatar(user)}</div>
                    <div class="swipe-card-name">${user.username}</div>
                    <div class="swipe-card-age">${user.age} years old</div>
                </div>
                <div class="swipe-card-body">
                    <div class="swipe-card-interests">
                        <h4>Interests</h4>
                        <div class="interest-tags">
                            ${user.interests.slice(0, 4).map(interest => 
                                `<span class="interest-tag">${interest}</span>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="swipe-card-distance">
                        <span class="distance-icon">📍</span>
                        ${Utils.formatDistance(user.distance)} away
                    </div>
                    <div class="swipe-card-availability">
                        <span class="availability-badge ${user.availability}">${this.formatAvailability(user.availability)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Set up swipe functionality
        this.setupSwipeFunctionality();
    }

    getUserAvatar(user) {
        // Generate avatar based on user data
        const avatars = ['👤', '🧑', '👩', '🧑‍💼', '👩‍💼', '🧑‍🎨', '👩‍🎨', '🧑‍🔬', '👩‍🔬'];
        const hash = user.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        return avatars[hash % avatars.length];
    }

    formatAvailability(availability) {
        const availabilityMap = {
            'now': 'Available Now',
            'tonight': 'Tonight',
            'weekend': 'This Weekend',
            'flexible': 'Flexible'
        };
        return availabilityMap[availability] || availability;
    }

    setupSwipeFunctionality() {
        const swipeCards = document.querySelectorAll('.swipe-card');
        
        swipeCards.forEach(card => {
            let startX = 0;
            let startY = 0;
            let currentX = 0;
            let currentY = 0;
            let isDragging = false;

            // Touch events
            card.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isDragging = true;
                card.classList.add('swiping');
            });

            card.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                
                currentX = e.touches[0].clientX;
                currentY = e.touches[0].clientY;
                
                const deltaX = currentX - startX;
                const deltaY = currentY - startY;
                const rotation = deltaX * 0.1;
                
                card.style.transform = `translateX(${deltaX}px) translateY(${deltaY}px) rotate(${rotation}deg)`;
                
                // Change opacity based on swipe distance
                const opacity = Math.max(0.3, 1 - Math.abs(deltaX) / 200);
                card.style.opacity = opacity;
            });

            card.addEventListener('touchend', (e) => {
                if (!isDragging) return;
                isDragging = false;
                card.classList.remove('swiping');
                
                const deltaX = currentX - startX;
                const threshold = 100;
                
                if (Math.abs(deltaX) > threshold) {
                    // Swipe detected
                    const userId = card.dataset.userId;
                    const direction = deltaX > 0 ? 'right' : 'left';
                    
                    this.handleSwipe(userId, direction);
                    this.animateCardOut(card, direction);
                } else {
                    // Snap back
                    card.style.transform = '';
                    card.style.opacity = '';
                }
            });

            // Mouse events for desktop
            card.addEventListener('mousedown', (e) => {
                startX = e.clientX;
                startY = e.clientY;
                isDragging = true;
                card.classList.add('swiping');
                e.preventDefault();
            });

            card.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                
                currentX = e.clientX;
                currentY = e.clientY;
                
                const deltaX = currentX - startX;
                const deltaY = currentY - startY;
                const rotation = deltaX * 0.1;
                
                card.style.transform = `translateX(${deltaX}px) translateY(${deltaY}px) rotate(${rotation}deg)`;
                
                const opacity = Math.max(0.3, 1 - Math.abs(deltaX) / 200);
                card.style.opacity = opacity;
            });

            card.addEventListener('mouseup', (e) => {
                if (!isDragging) return;
                isDragging = false;
                card.classList.remove('swiping');
                
                const deltaX = currentX - startX;
                const threshold = 100;
                
                if (Math.abs(deltaX) > threshold) {
                    const userId = card.dataset.userId;
                    const direction = deltaX > 0 ? 'right' : 'left';
                    
                    this.handleSwipe(userId, direction);
                    this.animateCardOut(card, direction);
                } else {
                    card.style.transform = '';
                    card.style.opacity = '';
                }
            });
        });
    }

    setupSwipeButtons() {
        const passBtn = document.getElementById('swipe-pass');
        const likeBtn = document.getElementById('swipe-like');

        if (passBtn) {
            passBtn.addEventListener('click', () => this.handleButtonSwipe('left'));
        }

        if (likeBtn) {
            likeBtn.addEventListener('click', () => this.handleButtonSwipe('right'));
        }
    }

    handleButtonSwipe(direction) {
        const topCard = document.querySelector('.swipe-card:last-child');
        if (topCard) {
            const userId = topCard.dataset.userId;
            this.handleSwipe(userId, direction);
            this.animateCardOut(topCard, direction);
        }
    }

    async handleSwipe(userId, direction) {
        try {
            if (direction === 'right') {
                // Like
                await window.Discovery.likeUser(userId);
                Utils.showNotification('Liked! 💖', 'success', 1000);
            } else {
                // Pass
                await window.Discovery.passUser(userId);
                Utils.showNotification('Passed 👎', 'info', 1000);
            }
            
            // Remove from current cards
            this.currentCards = this.currentCards.filter(user => user.id !== userId);
            
            // Update the display after a delay
            setTimeout(() => {
                if (window.DiscoveryManager) {
                    window.DiscoveryManager.updateNearbyUsersList();
                }
            }, 300);
            
        } catch (error) {
            console.error('Failed to handle swipe:', error);
            Utils.showNotification('Failed to process swipe', 'error');
        }
    }

    animateCardOut(card, direction) {
        const distance = window.innerWidth;
        const rotation = direction === 'right' ? 30 : -30;
        
        card.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        card.style.transform = `translateX(${direction === 'right' ? distance : -distance}px) rotate(${rotation}deg)`;
        card.style.opacity = '0';
        
        setTimeout(() => {
            if (card.parentNode) {
                card.parentNode.removeChild(card);
            }
        }, 300);
    }
}

// Create global instance
window.SwipeManager = new SwipeManager();
