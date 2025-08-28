import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Simple and reliable API configuration
 * Uses network IP for all platforms - emulators, simulators, and physical devices
 * This ensures consistent behavior across all environments
 */

// Use network IP for everything - this is the most reliable approach
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Log configuration for debugging
console.log('=== SIMPLIFIED API CONFIG ===');
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('📱 Platform:', Platform.OS);
console.log('📲 Is Physical Device (iOS):', Constants.platform?.ios?.isDevice);
console.log(
	'📲 Is Physical Device (Android):',
	Constants.platform?.android?.isDevice
);
console.log('💡 Using network IP for all platforms');
console.log('===============================');
