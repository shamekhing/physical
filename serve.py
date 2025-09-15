#!/usr/bin/env python3
"""
Simple HTTP server for Physical app development.
Serves the app with proper CORS headers and HTTPS support.
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        
        # Add no-cache headers for JavaScript files
        if self.path.endswith('.js') or self.path.endswith('.html'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def find_free_port(start_port=8000):
    """Find a free port starting from start_port"""
    import socket
    for port in range(start_port, start_port + 100):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            continue
    return None

def main():
    # Change to the directory containing this script
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Find a free port
    port = find_free_port(8000)
    if port is None:
        print("❌ Could not find a free port")
        sys.exit(1)
    
    # Create server
    with socketserver.TCPServer(("", port), CORSHTTPRequestHandler) as httpd:
        print(f"🚀 Physical app server starting...")
        print(f"📡 Server running at: http://localhost:{port}")
        print(f"📱 Open in browser: http://localhost:{port}")
        print(f"🔧 Press Ctrl+C to stop the server")
        print()
        print("📋 Features available:")
        print("  • Bluetooth proximity detection (simulated)")
        print("  • Swipe-based user discovery")
        print("  • End-to-end encrypted messaging")
        print("  • Anonymous profiles with age verification")
        print("  • PWA support with offline functionality")
        print()
        
        # Try to open browser automatically
        try:
            webbrowser.open(f'http://localhost:{port}')
            print("🌐 Browser opened automatically")
        except:
            print("⚠️  Please open http://localhost:{port} in your browser manually")
        
        print()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")
            sys.exit(0)

if __name__ == "__main__":
    main()
