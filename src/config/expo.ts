// Expo Configuration
// Customize these settings for your development environment

export const expoConfig = {
	// Development server settings
	development: {
		// Local IP address for development (change this to your local IP)
		localIp: '192.168.1.100',
		// Default Expo development port
		port: '8081',
		// Local network URL
		get localUrl() {
			return `exp://${this.localIp}:${this.port}`;
		},
		// Localhost URL
		get localhostUrl() {
			return `exp://localhost:${this.port}`;
		},
	},

	// Production settings
	production: {
		// Your production Expo project URL (if you have one)
		projectUrl: 'exp://your-project-url',
		// Custom domain for production
		customDomain: 'your-domain.com',
		// Production port (usually different from development)
		port: '443',
	},

	// Network detection settings
	network: {
		// Enable automatic IP detection
		autoDetectIp: true,
		// Fallback IP addresses to try
		fallbackIps: ['192.168.1.100', '192.168.0.100', '10.0.0.100'],
		// Timeout for network detection (ms)
		detectionTimeout: 5000,
	},

	// QR Code settings
	qrCode: {
		// QR code size in pixels
		size: 200,
		// QR code colors
		colors: {
			foreground: '#1f2937',
			background: '#ffffff',
		},
	},

	// Instructions and help
	instructions: {
		// Show instructions by default
		showInstructions: true,
		// Show download links by default
		showDownloadLinks: true,
		// Custom instruction text
		customInstructions: [
			'Make sure your phone and computer are on the same network',
			"Download Expo Go from your device's app store",
			"Scan the QR code with Expo Go or your phone's camera",
		],
	},
};

// Helper function to get the best Expo URL for the current environment
export const getExpoUrl = (): string => {
	if (typeof window !== 'undefined') {
		const hostname = window.location.hostname;

		// For local development
		if (hostname === 'localhost' || hostname === '127.0.0.1') {
			return expoConfig.development.localUrl;
		}

		// For production or custom domains
		if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
			// You can customize this logic for production
			return `exp://${hostname}:${expoConfig.development.port}`;
		}
	}

	// Fallback
	return expoConfig.development.localUrl;
};

// Helper function to detect local IP address
export const detectLocalIp = async (): Promise<string> => {
	if (typeof window !== 'undefined') {
		try {
			// Try to get local IP using WebRTC (this is a common approach)
			const response = await fetch('https://api.ipify.org?format=json');
			const data = await response.json();

			// Note: This gets your public IP, not local IP
			// For local IP detection, you might need to use a different approach
			// or manually configure it in the config

			return expoConfig.development.localIp;
		} catch (error) {
			console.warn('Could not detect IP address, using fallback:', error);
			return expoConfig.development.localIp;
		}
	}

	return expoConfig.development.localIp;
};

export default expoConfig;
