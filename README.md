# Physical

A **privacy-first, peer-to-peer meeting app** that uses **Bluetooth proximity detection** to help you meet people nearby.

## 🚀 Features

### ✅ **Core Features (Implemented)**
- **Bluetooth proximity detection** - Find users within 5-50m radius
- **Swipe-based discovery** - Tinder-like interface for meeting people nearby
- **Anonymous profiles** - Minimal info, privacy-focused
- **End-to-end encryption** - All messages encrypted with RSA-OAEP
- **P2P messaging** - Direct device-to-device communication via WebRTC
- **Compatibility scoring** - AI-powered matching based on interests/availability
- **Progressive Web App** - Works on any device with a browser
- **IRC-Style Commands** - Quick actions with `/who`, `/msg`, `/clear`, `/hug`, `/slap`, `/help`

### 🔒 **Privacy & Security**
- **No GPS/location tracking** - Bluetooth-only proximity
- **No user data storage** - Everything stored locally
- **Zero-knowledge age verification** - Prove 18+ without revealing exact age
- **Anonymous usernames** - Auto-generated, no personal info
- **End-to-end encryption** - Messages encrypted before transmission

### 📱 **Cross-Platform**
- **Web-based** - Works on any device with a browser
- **PWA support** - Install like a native app
- **Offline capable** - Messages queued when offline
- **No app store** - Deploy instantly, no approval needed

## 🏗️ Architecture

### **Feature-Based Structure**
```
physical/
├── index.html                 # Main app entry point
├── app.js                     # App controller & orchestration
├── manifest.json              # PWA manifest
├── service-worker.js          # Offline support & caching
├── shared/                    # Common utilities
│   ├── utils.js              # Utility functions
│   └── styles.css            # Global styles
└── features/                  # Feature modules
    ├── encryption/            # End-to-end encryption
    ├── profiles/              # Anonymous user profiles
    ├── proximity/             # Bluetooth proximity detection
    ├── discovery/             # User discovery & matching
    ├── messaging/             # P2P messaging system
    └── ui/                    # UI management & transitions
```

### **Dependency Flow**
1. **Encryption** → Foundation for all secure communication
2. **Profiles** → User identity (depends on encryption)
3. **Proximity** → Bluetooth scanning (depends on encryption)
4. **Discovery** → User matching (depends on proximity + profiles)
5. **Messaging** → P2P chat (depends on encryption + discovery)

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **P2P Communication**: WebRTC Data Channels
- **Bluetooth**: Web Bluetooth API
- **Encryption**: Web Crypto API (RSA-OAEP, AES-GCM)
- **Storage**: Local Storage + IndexedDB
- **Offline**: Service Workers + Background Sync
- **Deployment**: Static hosting (GitHub Pages, Netlify, Vercel)

## 🚀 Quick Start

### **1. Clone & Setup**
```bash
git clone <repository>
cd hookup
```

### **2. Start Development Server**

**Option 1: Use the included server (Recommended)**
```bash
# Windows
serve.bat

# Or manually
python serve.py
```

**Option 2: Use any static server**
```bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# Live Server (VS Code extension)
live-server
```

**⚠️ Important**: The app must be served over HTTP/HTTPS, not opened as a file (`file://`). This is required for:
- Service Worker registration
- Web Bluetooth API
- WebRTC connections
- CORS policies

### **3. Access the App**
- Open `http://localhost:8000` in any modern browser
- Click "Add to Home Screen" for app-like experience
- Grant Bluetooth permissions when prompted

### **4. Create Profile**
- Enter age, interests, availability
- Profile is created locally with encryption keys
- Privacy-focused anonymous profiles

### **5. Swipe to Meet**
- App automatically scans for nearby users via Bluetooth
- Swipe right to like, left to pass
- See compatibility scores and distances
- Like someone to start encrypted chat
- Use IRC-style commands for quick actions

### **6. IRC-Style Commands**
- **`/who`** - List all nearby users
- **`/msg <user> <message>`** - Send private message to specific user
- **`/clear`** - Clear current chat history
- **`/hug <user>`** - Send hug emote to user
- **`/slap <user>`** - Send slap emote to user
- **`/help`** - Show all available commands

## 🔧 Development

### **Feature Development**
Each feature is self-contained:
- **Add new features** in `features/` directory
- **Modify existing features** without affecting others
- **Test features independently**

### **Browser Compatibility**
- **Chrome/Edge**: Full support (Windows, Mac, Linux, Android)
- **Safari**: Limited support (Mac, iOS 15+)
- **Firefox**: Basic support

## 📊 Business Model

### **Open Source**
- **GPL v3 license** - Free for personal use
- **Commercial license** required for profit-generating use
- **5-10% revenue share** for commercial implementations

### **Revenue Streams**
- **One-time app fee** ($2-5) - No subscriptions
- **Commercial licensing** - Enterprise/white-label
- **Support contracts** - Premium support
- **No ads or data selling** - Privacy-first model

## 🔮 Roadmap

### **Phase 1: Core MVP** ✅
- [x] Bluetooth proximity detection
- [x] Anonymous profiles with age verification
- [x] End-to-end encrypted messaging
- [x] P2P WebRTC communication
- [x] Compatibility scoring

### **Phase 2: Enhanced Features** 🚧
- [ ] Voice messages with auto-delete
- [ ] Photo sharing with blur preview
- [ ] Video calls (P2P WebRTC)
- [ ] Self-destructing messages
- [ ] Interest-based matching algorithm

### **Phase 3: Reputation System** 📋
- [ ] Visible ELO scores for all users
- [ ] Rating system after interactions
- [ ] Trust badges for verified users
- [ ] Reputation history (public)
- [ ] Community moderation features

### **Phase 4: Advanced Features** 🔮
- [ ] Group chat rooms for multiple people nearby
- [ ] AR proximity view (see nearby users through camera)
- [ ] Sound-based discovery (ultrasonic signals)
- [ ] Event-based discovery (party mode)
- [ ] Mesh networking for extended range

## 🤝 Contributing

### **How to Contribute**
1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

### **Development Guidelines**
- **Feature-based development** - Each feature in its own folder
- **Privacy-first** - No data collection, local storage only
- **Security-focused** - All communication encrypted
- **Cross-platform** - Web-first, works everywhere

## 📄 License

This project is licensed under the **GPL v3 License** - see the [LICENSE](LICENSE) file for details.

**Commercial Use**: Requires separate commercial license with revenue sharing agreement.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Security**: [Security Policy](SECURITY.md)

## ⚠️ Disclaimer

This app is for **adults only (18+)**. Users are responsible for their own safety and interactions. The app provides tools for connection but does not guarantee safety or compatibility.

---

**Built with ❤️ for privacy, security, and genuine human connection.**
