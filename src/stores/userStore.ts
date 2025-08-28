import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService, type UserProfile } from '@/services';
import { DIDAuthService } from '@/services/didAuthService';

interface UserState {
	// User data
	user: UserProfile | null;
	isLoading: boolean;
	error: string | null;

	// Authentication
	isAuthenticated: boolean;
	token: string | null;

	// Actions
	fetchUserProfile: () => Promise<void>;
	setUser: (user: UserProfile) => void;
	setToken: (token: string) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	logout: () => Promise<void>;
	clearError: () => void;
	clearAuth: () => void;
}

export const useUserStore = create<UserState>()(
	persist(
		(set, get) => ({
			// Initial state
			user: null,
			isLoading: false,
			error: null,
			isAuthenticated: false,
			token: null,

			// Fetch user profile from API using DID token
			fetchUserProfile: async () => {
				console.log('🔍 [UserStore] Fetching user profile...');

				set({ isLoading: true, error: null });

				try {
					// Get DID token from DIDAuthService
					const authStatus = await DIDAuthService.getAuthStatus();

					if (!authStatus.isAuthenticated || !authStatus.didToken) {
						console.log('❌ [UserStore] Not authenticated with DID');
						set({
							error: 'Not authenticated',
							isLoading: false,
							isAuthenticated: false,
							user: null,
							token: null,
						});
						return;
					}

					console.log('✅ [UserStore] DID authenticated, fetching user...');
					const userProfile = await AuthService.getCurrentUser(
						authStatus.didToken
					);

					set({
						user: userProfile,
						isAuthenticated: true,
						isLoading: false,
						error: null,
						token: authStatus.didToken, // Store DID token
					});

					console.log(
						'✅ [UserStore] User profile loaded:',
						userProfile.firstName
					);
				} catch (error) {
					console.error('❌ [UserStore] Error fetching user profile:', error);
					set({
						error:
							error instanceof Error ? error.message : 'Failed to load profile',
						isLoading: false,
						isAuthenticated: false,
					});
				}
			},

			// Set user data
			setUser: (user: UserProfile) => {
				set({ user, isAuthenticated: true });
			},

			// Set authentication token
			setToken: (token: string) => {
				set({ token, isAuthenticated: true });
			},

			// Set loading state
			setLoading: (isLoading: boolean) => {
				set({ isLoading });
			},

			// Set error state
			setError: (error: string | null) => {
				set({ error });
			},

			// Clear error
			clearError: () => {
				set({ error: null });
			},

			// Clear authentication state
			clearAuth: () => {
				set({
					user: null,
					isAuthenticated: false,
					token: null,
					error: null,
				});
			},

			// Logout user (DID-based)
			logout: async () => {
				try {
					console.log('🚪 [UserStore] Logging out user...');

					// Logout from DID authentication
					await DIDAuthService.logout();

					// Clear all state
					set({
						user: null,
						isAuthenticated: false,
						token: null,
						error: null,
						isLoading: false,
					});

					// Clear AsyncStorage
					await AsyncStorage.removeItem('userToken');
					await AsyncStorage.removeItem('didToken');
					await AsyncStorage.removeItem('didTokenExpiry');

					console.log('✅ [UserStore] User logged out successfully');
				} catch (error) {
					console.error('❌ [UserStore] Logout error:', error);
				}
			},
		}),
		{
			name: 'user-storage',
			storage: createJSONStorage(() => AsyncStorage),
			// Only persist these fields
			partialize: (state) => ({
				user: state.user,
				token: state.token,
				isAuthenticated: state.isAuthenticated,
			}),
		}
	)
);
