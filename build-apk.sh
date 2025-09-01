#!/bin/bash
# SuperPay APK Build Script

echo "🚀 Building SuperPay APK..."

# Build the APK with preview profile
echo "Starting EAS build..."
eas build --platform android --profile preview --non-interactive || {
    echo "❌ Build failed. Let's try with auto credentials generation..."
    echo "y" | eas build --platform android --profile preview
}

echo "✅ Build process completed!"
echo "📱 You can download your APK from the EAS dashboard:"
echo "   https://expo.dev/accounts/0xbeyond/projects/superpay/builds"