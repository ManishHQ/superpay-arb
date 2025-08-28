import { MagicService } from '@/hooks/magic';
import { DeepLinkPage } from '@magic-sdk/react-native-expo';

export interface MagicAuthResult {
	success: boolean;
	data?: any;
	error?: string;
}

export class MagicAuthService {
	private static magic = MagicService.magic;

	/**
	 * Google OAuth sign in
	 */
	static async googleSignIn(): Promise<MagicAuthResult> {
		try {
			// @ts-ignore
			const result = await this.magic.oauth.loginWithPopup({
				provider: 'google',
				redirectURI: 'magicbarernexample://',
			});
			return {
				success: true,
				data: result,
			};
		} catch (error) {
			console.error('Google sign in error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Google sign in failed',
			};
		}
	}

	/**
	 * Apple OAuth sign in
	 */
	static async appleSignIn(): Promise<MagicAuthResult> {
		try {
			// @ts-ignore
			const result = await this.magic.oauth.loginWithPopup({
				provider: 'apple',
				redirectURI: 'magicbarernexample://',
			});
			return {
				success: true,
				data: result,
			};
		} catch (error) {
			console.error('Apple sign in error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Apple sign in failed',
			};
		}
	}

	/**
	 * Email OTP sign in
	 */
	static async emailOTPSignIn(email: string): Promise<MagicAuthResult> {
		try {
			console.log('Sending email OTP to', email);
			const didToken = await this.magic.auth.loginWithEmailOTP({ email });
			console.log('Did token:', didToken);
			return {
				success: true,
				data: { didToken },
			};
		} catch (error) {
			console.error('Email OTP sign in error:', error);
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'Email OTP sign in failed',
			};
		}
	}

	/**
	 * SMS sign in
	 */
	static async smsSignIn(phoneNumber: string): Promise<MagicAuthResult> {
		try {
			const didToken = await this.magic.auth.loginWithSMS({ phoneNumber });
			return {
				success: true,
				data: { didToken },
			};
		} catch (error) {
			console.error('SMS sign in error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'SMS sign in failed',
			};
		}
	}

	/**
	 * Get user info
	 */
	static async getUserInfo(): Promise<MagicAuthResult> {
		try {
			const userInfo = await this.magic.user.getInfo();
			return {
				success: true,
				data: userInfo,
			};
		} catch (error) {
			console.error('Get user info error:', error);
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'Failed to get user info',
			};
		}
	}

	/**
	 * Check if user is logged in
	 */
	static async isLoggedIn(): Promise<MagicAuthResult> {
		try {
			console.log('🔍 [MagicAuthService] Checking if user is logged in...');

			// Use Promise.race to add timeout and prevent hanging
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Timeout')), 5000); // 5 second timeout
			});

			console.log('🔍 [MagicAuthService] Calling magic.user.isLoggedIn()...');
			const loginCheckPromise = this.magic.user.isLoggedIn();

			const isLoggedIn = await Promise.race([
				loginCheckPromise,
				timeoutPromise,
			]);

			console.log(`✅ [MagicAuthService] User login status: ${isLoggedIn}`);
			return {
				success: true,
				data: { isLoggedIn },
			};
		} catch (error) {
			console.error('❌ [MagicAuthService] Check login status error:', error);

			// If it's a timeout or the promise is hanging, return false
			if (error instanceof Error && error.message === 'Timeout') {
				console.log('⏰ [MagicAuthService] Login check timed out, assuming not logged in');
				return {
					success: true,
					data: { isLoggedIn: false },
				};
			}

			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: 'Failed to check login status',
			};
		}
	}

	/**
	 * Logout user
	 */
	static async logout(): Promise<MagicAuthResult> {
		try {
			const isLoggedOut = await this.magic.user.logout();
			return {
				success: true,
				data: { isLoggedOut },
			};
		} catch (error) {
			console.error('Logout error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Logout failed',
			};
		}
	}

	/**
	 * Show Magic settings
	 */
	static async showSettings(
		page: DeepLinkPage = DeepLinkPage.Recovery
	): Promise<MagicAuthResult> {
		try {
			await this.magic.user.showSettings({ page });
			return {
				success: true,
				data: { message: 'Settings opened' },
			};
		} catch (error) {
			console.error('Show settings error:', error);
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'Failed to show settings',
			};
		}
	}

	/**
	 * Connect with UI
	 */
	static async connectWithUI(): Promise<MagicAuthResult> {
		try {
			const account = await this.magic.wallet.connectWithUI();
			return {
				success: true,
				data: { account },
			};
		} catch (error) {
			console.error('Connect with UI error:', error);
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'Failed to connect with UI',
			};
		}
	}

	/**
	 * Get DID token from user info
	 */
	static async getDIDFromUserInfo(): Promise<MagicAuthResult> {
		try {
			const userInfo = await this.magic.user.getInfo();
			const did =
				(userInfo as any).did || (userInfo as any).id || 'DID not found';
			return {
				success: true,
				data: { did },
			};
		} catch (error) {
			console.error('Get DID error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to get DID',
			};
		}
	}

	/**
	 * Get DID token directly from Magic
	 */
	static async getDidToken(): Promise<MagicAuthResult> {
		try {
			console.log('🎫 [MagicAuthService] Getting DID token from Magic...');
			const didToken = await this.magic.user.getIdToken();
			console.log(`✅ [MagicAuthService] DID token obtained successfully`);
			console.log(`🎫 [MagicAuthService] DID token preview: ${didToken.substring(0, 50)}...`);
			return {
				success: true,
				data: { didToken },
			};
		} catch (error) {
			console.error('❌ [MagicAuthService] Get DID token error:', error);
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'Failed to get DID token',
			};
		}
	}
}
