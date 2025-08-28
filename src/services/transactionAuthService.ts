import AsyncStorage from '@react-native-async-storage/async-storage';
import { MagicAuthService } from './magicAuthService';
import { Alert } from 'react-native';

export interface TransactionAuthResult {
	success: boolean;
	didToken?: string;
	error?: string;
}

export class TransactionAuthService {
	private static readonly DID_TOKEN_KEY = 'magicDidToken';
	private static readonly DID_TOKEN_EXPIRY_KEY = 'magicDidTokenExpiry';
	private static readonly TOKEN_EXPIRY_HOURS = 23; // Refresh before 24h expiry

	/**
	 * Store DID token with expiry
	 */
	private static async storeDIDToken(didToken: string): Promise<void> {
		try {
			const expiryTime = Date.now() + (this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
			const expiryDate = new Date(expiryTime).toISOString();
			
			await AsyncStorage.setItem(this.DID_TOKEN_KEY, didToken);
			await AsyncStorage.setItem(this.DID_TOKEN_EXPIRY_KEY, expiryTime.toString());
			
			console.log('🔐 DID token stored successfully');
			console.log(`📅 DID token expires at: ${expiryDate}`);
			console.log(`🎫 DID token preview: ${didToken.substring(0, 50)}...`);
		} catch (error) {
			console.error('❌ Failed to store DID token:', error);
		}
	}

	/**
	 * Get stored DID token if valid
	 */
	private static async getStoredDIDToken(): Promise<string | null> {
		try {
			console.log('🔍 Checking for stored DID token...');
			
			const didToken = await AsyncStorage.getItem(this.DID_TOKEN_KEY);
			const expiryTimeStr = await AsyncStorage.getItem(this.DID_TOKEN_EXPIRY_KEY);
			
			console.log(`📦 Stored DID token exists: ${!!didToken}`);
			console.log(`📦 Stored expiry exists: ${!!expiryTimeStr}`);
			
			if (!didToken || !expiryTimeStr) {
				console.log('❌ No stored DID token or expiry found');
				return null;
			}

			const expiryTime = parseInt(expiryTimeStr);
			const now = Date.now();
			const timeUntilExpiry = expiryTime - now;
			const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);
			
			console.log(`⏰ DID token expires in ${hoursUntilExpiry.toFixed(2)} hours`);
			
			if (now >= expiryTime) {
				console.log('🕒 Stored DID token expired, removing');
				await this.clearStoredDIDToken();
				return null;
			}

			console.log('✅ Valid DID token found in storage');
			console.log(`🎫 DID token preview: ${didToken.substring(0, 50)}...`);
			return didToken;
		} catch (error) {
			console.error('❌ Failed to get stored DID token:', error);
			return null;
		}
	}

	/**
	 * Clear stored DID token
	 */
	private static async clearStoredDIDToken(): Promise<void> {
		try {
			console.log('🧹 Clearing stored DID token...');
			await AsyncStorage.removeItem(this.DID_TOKEN_KEY);
			await AsyncStorage.removeItem(this.DID_TOKEN_EXPIRY_KEY);
			console.log('✅ DID token cleared successfully');
		} catch (error) {
			console.error('❌ Failed to clear DID token:', error);
		}
	}

	/**
	 * Check if Magic is logged in and get fresh DID token if needed
	 */
	static async ensureMagicAuthentication(): Promise<TransactionAuthResult> {
		try {
			console.log('🔐 === STARTING MAGIC AUTHENTICATION CHECK ===');

			// First check if we have a valid stored DID token
			const storedDIDToken = await this.getStoredDIDToken();
			if (storedDIDToken) {
				console.log('🔍 Found stored DID token, verifying Magic login status...');
				// Verify Magic is still logged in with this token
				const loginCheck = await MagicAuthService.isLoggedIn();
				console.log('🔍 Magic isLoggedIn result:', loginCheck);
				
				if (loginCheck.success && loginCheck.data?.isLoggedIn) {
					console.log('✅ Magic still logged in with stored DID token');
					console.log('🔐 === AUTHENTICATION CHECK COMPLETE (USING STORED TOKEN) ===');
					return {
						success: true,
						didToken: storedDIDToken,
					};
				} else {
					console.log('❌ Magic login check failed, will get fresh token');
				}
			}

			// Check if Magic is logged in (might be logged in but we don't have stored token)
			console.log('🔄 Checking Magic login status for fresh token...');
			const loginCheck = await MagicAuthService.isLoggedIn();
			console.log('🔍 Magic login check result:', loginCheck);
			
			if (loginCheck.success && loginCheck.data?.isLoggedIn) {
				console.log('✅ Magic is logged in, getting fresh DID token');
				
				// Get fresh DID token
				console.log('🎫 Requesting fresh DID token from Magic...');
				const didResult = await MagicAuthService.getDidToken();
				console.log('🎫 DID token result:', { 
					success: didResult.success, 
					hasToken: !!didResult.data?.didToken,
					error: didResult.error 
				});
				
				if (didResult.success && didResult.data?.didToken) {
					// Store the fresh DID token
					await this.storeDIDToken(didResult.data.didToken);
					
					console.log('🔐 === AUTHENTICATION CHECK COMPLETE (FRESH TOKEN) ===');
					return {
						success: true,
						didToken: didResult.data.didToken,
					};
				} else {
					console.log('❌ Failed to get DID token from Magic');
					return {
						success: false,
						error: 'Failed to get DID token: ' + (didResult.error || 'Unknown error'),
					};
				}
			} else {
				// Magic is not logged in - user needs to re-authenticate
				console.log('❌ Magic not logged in, user needs to re-authenticate');
				console.log('🔐 === AUTHENTICATION CHECK FAILED ===');
				return {
					success: false,
					error: 'Magic session expired. Please log in again to perform transactions.',
				};
			}
		} catch (error) {
			console.error('❌ Error ensuring Magic authentication:', error);
			console.log('🔐 === AUTHENTICATION CHECK ERROR ===');
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Authentication check failed',
			};
		}
	}

	/**
	 * Force re-authentication with Magic
	 * This can be called when user wants to retry after session expiry
	 */
	static async forceReAuthentication(email?: string): Promise<TransactionAuthResult> {
		try {
			console.log('🔄 Force re-authenticating with Magic...');
			
			// Clear any stored tokens first
			await this.clearStoredDIDToken();

			if (email) {
				// Try email OTP
				const result = await MagicAuthService.emailOTPSignIn(email);
				if (result.success && result.data?.didToken) {
					await this.storeDIDToken(result.data.didToken);
					return {
						success: true,
						didToken: result.data.didToken,
					};
				} else {
					return {
						success: false,
						error: result.error || 'Re-authentication failed',
					};
				}
			} else {
				// Try connect with UI
				const connectResult = await MagicAuthService.connectWithUI();
				if (connectResult.success) {
					// After connecting, get DID token
					const didResult = await MagicAuthService.getDidToken();
					if (didResult.success && didResult.data?.didToken) {
						await this.storeDIDToken(didResult.data.didToken);
						return {
							success: true,
							didToken: didResult.data.didToken,
						};
					}
				}
				
				return {
					success: false,
					error: 'Re-authentication failed. Please try logging in again.',
				};
			}
		} catch (error) {
			console.error('Force re-authentication error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Re-authentication failed',
			};
		}
	}

	/**
	 * Show authentication error with retry option
	 */
	static showAuthenticationError(error: string, onRetry?: () => void): void {
		Alert.alert(
			'Authentication Required',
			`${error}\n\nTo continue with transactions, you need to re-authenticate with Magic.`,
			[
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: 'Retry',
					onPress: onRetry,
				},
			]
		);
	}

	/**
	 * Clear all authentication data (for logout)
	 */
	static async clearAuthenticationData(): Promise<void> {
		await this.clearStoredDIDToken();
		console.log('🧹 Cleared all transaction authentication data');
	}
}