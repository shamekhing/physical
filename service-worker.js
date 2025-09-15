// Service Worker for Physical App
const CACHE_NAME = 'physical-v2-silver-grey';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/shared/styles.css',
    '/shared/utils.js',
    '/features/encryption/encryption.js',
    '/features/profiles/profiles.js',
    '/features/profiles/profiles.css',
    '/features/proximity/proximity.js',
    '/features/proximity/proximity.css',
    '/features/discovery/discovery.js',
    '/features/discovery/discovery.css',
    '/features/messaging/messaging.js',
    '/features/messaging/messaging.css',
    '/app.js',
    '/assets/icon-192.png',
    '/assets/icon-512.png'
];

// Install event
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching app files...');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('✅ Service Worker installed');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Service Worker installation failed:', error);
            })
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip external requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    console.log('📦 Serving from cache:', event.request.url);
                    return response;
                }

                // Otherwise fetch from network
                console.log('🌐 Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache the response
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch((error) => {
                        console.error('❌ Fetch failed:', error);
                        
                        // Return offline page for navigation requests
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                        
                        throw error;
                    });
            })
    );
});

// Background sync for offline messages
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === 'message-sync') {
        event.waitUntil(syncOfflineMessages());
    }
});

// Push notification event
self.addEventListener('push', (event) => {
    console.log('📱 Push notification received');
    
        const options = {
            body: event.data ? event.data.text() : 'New message received',
            icon: '/assets/icon-192.png',
            badge: '/assets/icon-192.png',
            vibrate: [200, 100, 200],
            data: {
                url: '/'
            },
            actions: [
                {
                    action: 'open',
                    title: 'Open App',
                    icon: '/assets/icon-192.png'
                },
                {
                    action: 'close',
                    title: 'Close',
                    icon: '/assets/icon-192.png'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification('Physical', options)
        );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('👆 Notification clicked:', event.action);
    
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message event (communication with main thread)
self.addEventListener('message', (event) => {
    console.log('💬 Message received in service worker:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_MESSAGE') {
        cacheOfflineMessage(event.data.message);
    }
});

// Helper functions
async function syncOfflineMessages() {
    try {
        console.log('🔄 Syncing offline messages...');
        
        // Get offline messages from IndexedDB
        const offlineMessages = await getOfflineMessages();
        
        if (offlineMessages.length === 0) {
            console.log('📭 No offline messages to sync');
            return;
        }

        console.log(`📬 Syncing ${offlineMessages.length} offline messages`);
        
        // Process each offline message
        for (const message of offlineMessages) {
            try {
                await sendOfflineMessage(message);
                await removeOfflineMessage(message.id);
            } catch (error) {
                console.error('❌ Failed to sync message:', error);
            }
        }
        
        console.log('✅ Offline message sync completed');
        
    } catch (error) {
        console.error('❌ Offline message sync failed:', error);
    }
}

async function cacheOfflineMessage(message) {
    try {
        // Store message in IndexedDB for later sync
        const db = await openDB();
        const transaction = db.transaction(['offlineMessages'], 'readwrite');
        const store = transaction.objectStore('offlineMessages');
        
        await store.add({
            ...message,
            cachedAt: Date.now()
        });
        
        console.log('💾 Message cached offline:', message.id);
        
    } catch (error) {
        console.error('❌ Failed to cache offline message:', error);
    }
}

async function getOfflineMessages() {
    try {
        const db = await openDB();
        const transaction = db.transaction(['offlineMessages'], 'readonly');
        const store = transaction.objectStore('offlineMessages');
        
        return await store.getAll();
        
    } catch (error) {
        console.error('❌ Failed to get offline messages:', error);
        return [];
    }
}

async function removeOfflineMessage(messageId) {
    try {
        const db = await openDB();
        const transaction = db.transaction(['offlineMessages'], 'readwrite');
        const store = transaction.objectStore('offlineMessages');
        
        await store.delete(messageId);
        
    } catch (error) {
        console.error('❌ Failed to remove offline message:', error);
    }
}

async function sendOfflineMessage(message) {
    // This would integrate with the messaging system
    // For now, just log the message
    console.log('📤 Sending offline message:', message);
}

async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('HookupP2P', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create offline messages store
            if (!db.objectStoreNames.contains('offlineMessages')) {
                const store = db.createObjectStore('offlineMessages', { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

// Periodic cleanup
setInterval(() => {
    cleanupOldCache();
}, 24 * 60 * 60 * 1000); // Daily cleanup

async function cleanupOldCache() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const requests = await cache.keys();
        
        // Remove old cached items (older than 7 days)
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const dateHeader = response.headers.get('date');
                if (dateHeader) {
                    const responseDate = new Date(dateHeader).getTime();
                    if (responseDate < weekAgo) {
                        await cache.delete(request);
                        console.log('🗑️ Cleaned up old cache entry:', request.url);
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Cache cleanup failed:', error);
    }
}

console.log('🔧 Service Worker script loaded');
