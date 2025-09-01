# Expo QR Code Setup Guide

This guide explains how to set up and use the Expo QR code feature in your SuperPay application, allowing users to scan a QR code and open your app directly in Expo Go.

## 🚀 Features

- **Dynamic QR Code Generation**: Automatically detects your development environment
- **Web Integration**: Accessible from your web app at `/expo-qr`
- **Copy URL**: Users can copy the Expo URL to clipboard
- **Direct Open**: One-click button to open in Expo Go
- **Responsive Design**: Works great on both mobile and web
- **Customizable**: Easy to configure for different environments

## 📱 How It Works

1. **User visits your web app** and navigates to the Expo QR page
2. **QR code is displayed** with your current Expo development URL
3. **User scans the QR code** with their phone's camera or Expo Go app
4. **App opens instantly** in Expo Go on their device

## 🛠️ Setup Instructions

### 1. Prerequisites

- Expo CLI installed globally: `npm install -g @expo/cli`
- Expo Go app installed on your mobile device
- Your development machine and phone on the same network

### 2. Configure Your Local IP

Edit `src/config/expo.ts` and update the local IP address:

```typescript
export const expoConfig = {
	development: {
		// Change this to your actual local IP address
		localIp: '192.168.1.100', // Your local IP here
		port: '8081',
		// ... rest of config
	},
	// ... rest of config
};
```

**To find your local IP address:**

**On macOS/Linux:**

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Windows:**

```bash
ipconfig | findstr "IPv4"
```

### 3. Start Your Expo Development Server

```bash
# Start the development server
yarn start

# Or if you want to specify a host
yarn start --host 192.168.1.100
```

### 4. Access the QR Code Page

Navigate to `/expo-qr` in your web app, or click the "📱 Open in Expo Go" link from your main pages.

## 🌐 Usage

### For Users

1. **Download Expo Go** from App Store or Google Play
2. **Visit your web app** and go to the Expo QR page
3. **Scan the QR code** with Expo Go or your phone's camera
4. **Your app opens** instantly in Expo Go

### For Developers

The QR code automatically detects your environment:

- **Local Development**: Uses your configured local IP
- **Production**: Uses your domain name
- **Custom URLs**: Pass custom URLs via props

## 🔧 Configuration Options

### Environment Variables

You can also configure via environment variables:

```bash
# .env.local
EXPO_LOCAL_IP=192.168.1.100
EXPO_PORT=8081
EXPO_PROJECT_URL=exp://your-project-url
```

### Component Props

```typescript
<ExpoQRCode
  expoUrl="exp://custom-url:8081"
  showInstructions={false}
  showDownloadLinks={false}
  className="custom-styles"
/>
```

### Configuration File

Edit `src/config/expo.ts` for advanced customization:

```typescript
export const expoConfig = {
	development: {
		localIp: 'your-ip-here',
		port: '8081',
	},
	qrCode: {
		size: 250,
		colors: {
			foreground: '#000000',
			background: '#ffffff',
		},
		errorCorrectionLevel: 'H', // Higher error correction
	},
	// ... more options
};
```

## 🚨 Troubleshooting

### Common Issues

1. **"Unable to connect" error**
   - Ensure your phone and computer are on the same network
   - Check your firewall settings
   - Verify the IP address in the config file

2. **QR code not scanning**
   - Make sure the QR code is clearly visible
   - Check that the URL is correct
   - Try copying the URL manually

3. **App not loading**
   - Restart your Expo development server
   - Clear Expo Go cache
   - Check the Metro bundler console for errors

### Network Configuration

**For corporate networks:**

- Ensure port 8081 is open
- Check if your network blocks certain IP ranges
- Consider using a mobile hotspot for testing

**For public WiFi:**

- Some public networks block device-to-device communication
- Use a mobile hotspot for reliable testing

## 📱 Production Deployment

### Expo Application Services (EAS)

For production builds, you can use EAS to create standalone apps:

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Build for production
eas build --platform all
```

### Custom Domains

Update your production configuration:

```typescript
export const expoConfig = {
	production: {
		projectUrl: 'exp://your-production-url',
		customDomain: 'yourdomain.com',
		port: '443',
	},
};
```

## 🔒 Security Considerations

- **Local Development Only**: The QR code feature is designed for development
- **Network Access**: Users on the same network can access your development server
- **Production**: Use proper authentication and security measures for production builds

## 📚 Additional Resources

- [Expo Go App](https://expo.dev/client)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native Web](https://necolas.github.io/react-native-web/)

## 🤝 Contributing

To improve the Expo QR code feature:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This feature is part of the SuperPay application and follows the same license terms.

---

**Happy coding! 🎉**

If you have any questions or run into issues, please check the troubleshooting section or open an issue in the repository.
