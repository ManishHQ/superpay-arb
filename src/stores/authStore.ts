import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService, MagicAuthService } from '@/services';
import { DIDAuthService } from '@/services/didAuthService';
import { useUserStore } from './userStore';
import { useBalanceStore } from './balanceStore';

interface AuthState {
	// Authentication state
	isAuthenticating: boolean;
	authError: string | null;

	// Actions
	loginWithMagicLink: (
		email: string
	) => Promise<{ success: boolean; needsOnboarding?: boolean }>;
	checkUserExists: (
		didToken: string
	) => Promise<{ exists: boolean; token?: string }>;
	completeOnboarding: (didToken: string, userData: any) => Promise<void>;
	logout: () => Promise<void>;
	clearAuthError: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
	// Initial state
	isAuthenticating: false,
	authError: null,

	// Login with Magic Link (DID-only)
	loginWithMagicLink: async (email: string) => {
		set({ isAuthenticating: true, authError: null });

		try {
			console.log('🔐 [AuthStore] Starting Magic login...');

			// Use DID-only authentication
			const result = await DIDAuthService.loginWithMagic(email);

			if (result.success && result.didToken) {
				console.log('✅ [AuthStore] DID authentication successful');

				// Check if user already exists in database
				console.log('🔍 [AuthStore] Checking if user exists with DID token...');
				const userCheck = await get().checkUserExists(result.didToken);
				console.log('🔍 [AuthStore] User check result:', {
					exists: userCheck.exists,
					hasToken: !!userCheck.token,
				});

				if (userCheck.exists) {
					console.log('✅ [AuthStore] User exists, storing DID token');
					// Store DID token as the auth token
					await AsyncStorage.setItem('userToken', result.didToken);
					useUserStore.getState().setToken(result.didToken);
					// User data will be fetched separately if needed

					set({ isAuthenticating: false });
					return { success: true };
				} else {
					console.log('👋 [AuthStore] New user, needs onboarding');
					// User doesn't exist, store DID token for onboarding
					await AsyncStorage.setItem('didToken', result.didToken);
					// Clear any old userToken
					await AsyncStorage.removeItem('userToken');

					set({ isAuthenticating: false });
					return { success: true, needsOnboarding: true };
				}
			} else {
				set({
					isAuthenticating: false,
					authError: result.error || 'Failed to authenticate',
				});
				return { success: false };
			}
		} catch (error) {
			console.error('Login error:', error);
			set({
				isAuthenticating: false,
				authError: error instanceof Error ? error.message : 'Login failed',
			});
			return { success: false };
		}
	},

	// Check if user exists and get user data
	checkUserExists: async (
		didToken: string
	): Promise<{
		exists: boolean;
		user?: any;
		token?: string;
		error?: string;
	}> => {
		try {
			console.log('🔄 Checking if user exists and getting user data...');
			const userCheck = await AuthService.checkUserExists(didToken);
			if (userCheck.exists) {
				console.log('✅ User exists, user data obtained');
			}
			return userCheck;
		} catch (error) {
			console.error('❌ User check error:', error);
			return {
				exists: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	},

	// Complete onboarding
	completeOnboarding: async (didToken: string, userData: any) => {
		set({ isAuthenticating: true, authError: null });

		try {
			// Create user profile with Magic auth
			const authResponse = await AuthService.magicAuth(didToken, userData);

			// Update profile with additional info
			await AuthService.updateProfile(authResponse.token, {
				firstName: userData.firstName,
				lastName: userData.lastName,
				bio: userData.bio,
				avatarUrl: userData.avatarUrl,
				settings: {
					notifications: true,
					darkMode: false,
				},
			});

			// Store backend token and set user data
			await AsyncStorage.setItem('userToken', authResponse.token);
			useUserStore.getState().setToken(authResponse.token);
			useUserStore.getState().setUser(authResponse.user);

			// Clean up DID token
			await AsyncStorage.removeItem('didToken');

			set({ isAuthenticating: false });
		} catch (error) {
			console.error('Onboarding completion error:', error);
			set({
				isAuthenticating: false,
				authError: error instanceof Error ? error.message : 'Onboarding failed',
			});
			throw error;
		}
	},

	// Logout
	logout: async () => {
		set({ isAuthenticating: true });

		try {
			// Logout from Magic SDK first
			try {
				await MagicAuthService.logout();
			} catch (magicError) {
				console.error('Magic logout error:', magicError);
				// Continue with local logout even if Magic logout fails
			}

			// Clear user store (this also clears AsyncStorage)
			await useUserStore.getState().logout();

			// Clear balance store
			useBalanceStore.getState().clearBalances();

			// Clear all authentication data (DID tokens only)
			await DIDAuthService.logout();

			// Clear auth store
			set({
				isAuthenticating: false,
				authError: null,
			});
		} catch (error) {
			console.error('Logout error:', error);
			set({ isAuthenticating: false });
		}
	},

	// Clear auth error
	clearAuthError: () => {
		set({ authError: null });
	},
}));
