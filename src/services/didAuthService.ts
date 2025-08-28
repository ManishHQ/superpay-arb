import AsyncStorage from '@react-native-async-storage/async-storage';
import { MagicAuthService } from './magicAuthService';
import { Alert } from 'react-native';

export interface DIDAuthResult {
	success: boolean;
	didToken?: string;
	error?: string;
}

export interface DIDAuthStatus {
	isAuthenticated: boolean;
	didToken?: string;
	error?: string;
}

/**
 * Simplified DID-only authentication service
 * Uses Magic DID tokens for both backend API calls and blockchain transactions
 */
export class DIDAuthService {
	private static readonly DID_TOKEN_KEY = 'userToken'; // Use same key for compatibility
	private static readonly DID_TOKEN_EXPIRY_KEY = 'didTokenExpiry';
	private static readonly TOKEN_EXPIRY_HOURS = 23; // Refresh before 24h expiry

	/**
	 * Get current authentication status with automatic refresh if needed
	 */
	static async getAuthStatus(): Promise<DIDAuthStatus> {
		try {
			console.log('🔍 [DIDAuth] Checking authentication status...');

			// First check stored DID token and refresh if needed
			const storedToken = await this.getStoredDIDToken();
			if (storedToken) {
				console.log(
					'✅ [DIDAuth] Found stored DID token, checking if refresh needed...'
				);

				// Check if token needs refresh
				const refreshCheck = await this.checkAndRefreshTokenIfNeeded();
				if (refreshCheck.success && refreshCheck.didToken) {
					console.log('✅ [DIDAuth] Token refreshed or still valid');
					return {
						isAuthenticated: true,
						didToken: refreshCheck.didToken,
					};
				} else {
					console.log('❌ [DIDAuth] Stored token refresh failed, clearing...');
					await this.clearStoredDIDToken();
				}
			}

			// Check if Magic is logged in and can provide fresh token
			console.log('🔍 [DIDAuth] Checking Magic login status...');
			const loginResult = await MagicAuthService.isLoggedIn();
			console.log('🔍 [DIDAuth] Magic login result:', loginResult);

			if (loginResult.success && loginResult.data?.isLoggedIn) {
				console.log(
					'✅ [DIDAuth] Magic is logged in, getting fresh DID token...'
				);

				const didResult = await MagicAuthService.getDidToken();
				console.log('🔍 [DIDAuth] DID token result:', {
					success: didResult.success,
					hasToken: !!didResult.data?.didToken,
					error: didResult.error,
				});

				if (didResult.success && didResult.data?.didToken) {
					await this.storeDIDToken(didResult.data.didToken);

					console.log('✅ [DIDAuth] Fresh DID token obtained and stored');
					return {
						isAuthenticated: true,
						didToken: didResult.data.didToken,
					};
				} else {
					console.log(
						'❌ [DIDAuth] Failed to get DID token from Magic:',
						didResult.error
					);
					return {
						isAuthenticated: false,
						error: `Failed to get DID token: ${didResult.error}`,
					};
				}
			} else {
				console.log('❌ [DIDAuth] Magic not logged in or login check failed');
				console.log('🔍 [DIDAuth] Login result details:', loginResult);
				return {
					isAuthenticated: false,
					error: loginResult.error || 'Magic not logged in',
				};
			}
		} catch (error) {
			console.error('❌ [DIDAuth] Error checking auth status:', error);
			return {
				isAuthenticated: false,
				error:
					error instanceof Error
						? error.message
						: 'Authentication check failed',
			};
		}
	}

	/**
	 * Ensure user is authenticated and return DID token
	 */
	static async ensureAuthenticated(): Promise<DIDAuthResult> {
		try {
			console.log('🔐 [DIDAuth] Ensuring authentication...');

			const status = await this.getAuthStatus();

			if (status.isAuthenticated && status.didToken) {
				console.log('✅ [DIDAuth] User is authenticated');
				return {
					success: true,
					didToken: status.didToken,
				};
			} else {
				console.log('❌ [DIDAuth] User not authenticated:', status.error);
				return {
					success: false,
					error: status.error || 'Authentication required',
				};
			}
		} catch (error) {
			console.error('❌ [DIDAuth] Error ensuring authentication:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Authentication failed',
			};
		}
	}

	/**
	 * Login with Magic and get DID token
	 */
	static async loginWithMagic(email: string): Promise<DIDAuthResult> {
		try {
			console.log('🔐 [DIDAuth] Logging in with Magic...');

			const result = await MagicAuthService.emailOTPSignIn(email);

			if (result.success && result.data?.didToken) {
				await this.storeDIDToken(result.data.didToken);

				console.log('✅ [DIDAuth] Login successful');
				return {
					success: true,
					didToken: result.data.didToken,
				};
			} else {
				console.log('❌ [DIDAuth] Login failed:', result.error);
				return {
					success: false,
					error: result.error || 'Login failed',
				};
			}
		} catch (error) {
			console.error('❌ [DIDAuth] Login error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Login failed',
			};
		}
	}

	/**
	 * Check if stored token needs refresh and refresh if necessary
	 */
	static async checkAndRefreshTokenIfNeeded(): Promise<DIDAuthResult> {
		try {
			console.log('🔍 [DIDAuth] Checking if token needs refresh...');

			const storedToken = await this.getStoredDIDToken();
			if (!storedToken) {
				return {
					success: false,
					error: 'No stored token found',
				};
			}

			// Check token expiry
			const expiryTime = await AsyncStorage.getItem(this.DID_TOKEN_EXPIRY_KEY);
			if (expiryTime) {
				const expiryTimestamp = parseInt(expiryTime);
				const now = Date.now();
				const hoursUntilExpiry = (expiryTimestamp - now) / (1000 * 60 * 60);

				console.log(
					`⏰ [DIDAuth] Token expires in ${hoursUntilExpiry.toFixed(2)} hours`
				);

				// If token expires in less than 2 hours, refresh it
				if (hoursUntilExpiry < 2) {
					console.log('🔄 [DIDAuth] Token expires soon, refreshing...');
					return await this.refreshToken();
				}
			}

			// Token is still valid, return it
			return {
				success: true,
				didToken: storedToken,
			};
		} catch (error) {
			console.error('❌ [DIDAuth] Token refresh check error:', error);
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'Token refresh check failed',
			};
		}
	}

	/**
	 * Validate stored DID token with backend
	 */
	static async validateStoredToken(): Promise<DIDAuthResult> {
		try {
			console.log('🔍 [DIDAuth] Validating stored DID token...');

			const storedToken = await this.getStoredDIDToken();
			if (!storedToken) {
				return {
					success: false,
					error: 'No stored token found',
				};
			}

			// Try to validate the token by calling the backend
			try {
				const { AuthService } = await import('./authService');
				const currentUser = await AuthService.getCurrentUser(storedToken);

				console.log('✅ [DIDAuth] Stored token is valid for backend calls');
				return {
					success: true,
					didToken: storedToken,
				};
			} catch (backendError) {
				console.log(
					'❌ [DIDAuth] Stored token validation failed:',
					backendError
				);
				return {
					success: false,
					error: 'Stored token is invalid',
				};
			}
		} catch (error) {
			console.error('❌ [DIDAuth] Token validation error:', error);
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'Token validation failed',
			};
		}
	}

	/**
	 * Refresh DID token
	 */
	static async refreshToken(): Promise<DIDAuthResult> {
		try {
			console.log('🔄 [DIDAuth] Refreshing DID token...');

			// Clear old token first
			await this.clearStoredDIDToken();

			console.log('🔍 [DIDAuth] Checking Magic login for refresh...');
			const loginResult = await MagicAuthService.isLoggedIn();
			console.log('🔍 [DIDAuth] Magic login result for refresh:', loginResult);

			if (loginResult.success && loginResult.data?.isLoggedIn) {
				console.log('✅ [DIDAuth] Magic logged in, getting fresh token...');
				const didResult = await MagicAuthService.getDidToken();
				console.log('🔍 [DIDAuth] Fresh token result:', {
					success: didResult.success,
					hasToken: !!didResult.data?.didToken,
					error: didResult.error,
				});

				if (didResult.success && didResult.data?.didToken) {
					await this.storeDIDToken(didResult.data.didToken);

					console.log('✅ [DIDAuth] Token refreshed successfully');
					return {
						success: true,
						didToken: didResult.data.didToken,
					};
				} else {
					console.log(
						'❌ [DIDAuth] Failed to get fresh DID token:',
						didResult.error
					);
					return {
						success: false,
						error: `Failed to get fresh token: ${didResult.error}`,
					};
				}
			} else {
				console.log('❌ [DIDAuth] Magic not logged in for refresh');
				return {
					success: false,
					error: 'Magic not logged in - cannot refresh token',
				};
			}
		} catch (error) {
			console.error('❌ [DIDAuth] Refresh token error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Token refresh failed',
			};
		}
	}

	/**
	 * Logout and clear all authentication data
	 */
	static async logout(): Promise<void> {
		try {
			console.log('🚪 [DIDAuth] Logging out...');

			// Logout from Magic
			await MagicAuthService.logout();

			// Clear stored token
			await this.clearStoredDIDToken();

			console.log('✅ [DIDAuth] Logout successful');
		} catch (error) {
			console.error('❌ [DIDAuth] Logout error:', error);
		}
	}

	/**
	 * Store DID token with expiry
	 */
	private static async storeDIDToken(didToken: string): Promise<void> {
		try {
			const expiryTime = Date.now() + this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
			const expiryDate = new Date(expiryTime).toISOString();

			await AsyncStorage.setItem(this.DID_TOKEN_KEY, didToken);
			await AsyncStorage.setItem(
				this.DID_TOKEN_EXPIRY_KEY,
				expiryTime.toString()
			);

			console.log('🔐 [DIDAuth] DID token stored successfully');
			console.log(`📅 [DIDAuth] Token expires at: ${expiryDate}`);
			console.log(
				`🎫 [DIDAuth] Token preview: ${didToken.substring(0, 50)}...`
			);
		} catch (error) {
			console.error('❌ [DIDAuth] Failed to store DID token:', error);
		}
	}

	/**
	 * Get stored DID token if valid
	 */
	private static async getStoredDIDToken(): Promise<string | null> {
		try {
			const didToken = await AsyncStorage.getItem(this.DID_TOKEN_KEY);
			const expiryTimeStr = await AsyncStorage.getItem(
				this.DID_TOKEN_EXPIRY_KEY
			);

			if (!didToken || !expiryTimeStr) {
				console.log('📦 [DIDAuth] No stored DID token found');
				return null;
			}

			const expiryTime = parseInt(expiryTimeStr);
			const now = Date.now();
			const timeUntilExpiry = expiryTime - now;
			const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);

			console.log(
				`⏰ [DIDAuth] Token expires in ${hoursUntilExpiry.toFixed(2)} hours`
			);

			if (now >= expiryTime) {
				console.log('🕒 [DIDAuth] Stored DID token expired, removing');
				await this.clearStoredDIDToken();
				return null;
			}

			console.log('✅ [DIDAuth] Valid stored DID token found');
			return didToken;
		} catch (error) {
			console.error('❌ [DIDAuth] Failed to get stored DID token:', error);
			return null;
		}
	}

	/**
	 * Clear stored DID token
	 */
	private static async clearStoredDIDToken(): Promise<void> {
		try {
			console.log('🧹 [DIDAuth] Clearing stored DID token...');
			await AsyncStorage.removeItem(this.DID_TOKEN_KEY);
			await AsyncStorage.removeItem(this.DID_TOKEN_EXPIRY_KEY);
			console.log('✅ [DIDAuth] DID token cleared successfully');
		} catch (error) {
			console.error('❌ [DIDAuth] Failed to clear DID token:', error);
		}
	}

	/**
	 * Clear all stored DID tokens and related data
	 */
	static async clearAllStoredTokens(): Promise<void> {
		try {
			await AsyncStorage.removeItem(this.DID_TOKEN_KEY);
			await AsyncStorage.removeItem(this.DID_TOKEN_EXPIRY_KEY);
			await AsyncStorage.removeItem('userToken'); // Also clear userToken for compatibility
			console.log('🧹 [DIDAuth] All stored tokens cleared');
		} catch (error) {
			console.error('❌ [DIDAuth] Error clearing all tokens:', error);
		}
	}

	/**
	 * Show authentication error with retry option
	 */
	static showAuthError(
		error: string,
		onRetry?: () => void,
		onReLogin?: () => void
	): void {
		Alert.alert(
			'Authentication Required',
			`Authentication failed: ${error}\n\nPlease authenticate to continue.`,
			[
				{
					text: 'Cancel',
					style: 'cancel',
				},
				...(onRetry
					? [
							{
								text: 'Retry',
								onPress: onRetry,
							},
					  ]
					: []),
				{
					text: 'Login',
					onPress: onReLogin,
				},
			]
		);
	}

	/**
	 * Get DID token for API calls with enhanced validation
	 */
	static async getTokenForAPICall(): Promise<string | null> {
		console.log('🔐 [DIDAuth] Getting token for API call...');

		try {
			const status = await this.getAuthStatus();
			console.log('🔍 [DIDAuth] Auth status for API call:', {
				isAuthenticated: status.isAuthenticated,
				hasToken: !!status.didToken,
				tokenLength: status.didToken?.length,
				tokenPreview: status.didToken
					? `${status.didToken.substring(0, 100)}...`
					: 'null',
			});

			if (!status.isAuthenticated || !status.didToken) {
				console.log('❌ [DIDAuth] No valid token available for API call');
				return null;
			}

			// Additional validation: Check if Magic is still logged in
			console.log('🔍 [DIDAuth] Verifying Magic login status...');
			const { MagicAuthService } = await import('./magicAuthService');
			const magicStatus = await MagicAuthService.isLoggedIn();

			if (!magicStatus.success || !magicStatus.data?.isLoggedIn) {
				console.log(
					'❌ [DIDAuth] Magic is no longer logged in, clearing stored token'
				);
				await this.clearStoredDIDToken();
				return null;
			}

			console.log('✅ [DIDAuth] Token validated for API call');
			return status.didToken;
		} catch (error) {
			console.error('❌ [DIDAuth] Error getting token for API call:', error);
			return null;
		}
	}

	/**
	 * Force clear all authentication state (for debugging)
	 */
	static async forceClearState(): Promise<void> {
		try {
			console.log('🧹 [DIDAuth] Force clearing all authentication state...');
			await this.clearStoredDIDToken();
			await AsyncStorage.removeItem('userToken');
			await AsyncStorage.removeItem('didToken');
			console.log('✅ [DIDAuth] All authentication state cleared');
		} catch (error) {
			console.error('❌ [DIDAuth] Error clearing state:', error);
		}
	}
}
