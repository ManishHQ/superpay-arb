import { MagicService } from '@/hooks/magic';
import { API_BASE_URL } from '@/config/api';

export interface UserProfile {
	id?: string;
	_id?: string;
	firstName: string;
	lastName: string;
	email: string;
	username?: string;
	phone?: string;
	walletAddress?: string;
	role: 'personal' | 'business';
	bio?: string;
	avatarUrl?: string;
	issuer?: string;
	isVerified?: boolean;
	createdAt?: string;
	updatedAt?: string;
	settings?: {
		notifications: boolean;
		darkMode: boolean;
	};
}

export interface AuthResponse {
	token: string;
	user: UserProfile;
}

export class AuthService {
	/**
	 * Create or update user profile with DID token
	 */
	static async createOrUpdateUser(
		didToken: string,
		userData: Partial<UserProfile>
	): Promise<UserProfile> {
		try {
			console.log('🔑 [AuthService] Creating/updating user with DID token');
			console.log('🌐 [AuthService] Using API URL:', API_BASE_URL);
			console.log('📄 [AuthService] DID token length:', didToken?.length);
			console.log(
				'🎫 [AuthService] DID token preview:',
				didToken.substring(0, 100)
			);
			console.log('👤 [AuthService] User data:', userData);

			const url = `${API_BASE_URL}/auth/magic-auth`;
			console.log('🔗 [AuthService] Full URL:', url);

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${didToken}`,
				},
				body: JSON.stringify({
					didToken: didToken, // Backend expects this in body
					firstName: userData.firstName,
					lastName: userData.lastName,
					role: userData.role || 'personal',
					phone: userData.phone,
					bio: userData.bio,
					avatarUrl: userData.avatarUrl,
					settings: userData.settings,
					username: userData.username,
				}),
			});

			console.log('📊 [AuthService] Auth response status:', response.status);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error('❌ [AuthService] Auth failed:', errorData);
				throw new Error(errorData.message || 'Authentication failed');
			}

			const result = await response.json();
			console.log('✅ [AuthService] User created/updated successfully');

			return result.user;
		} catch (error) {
			console.error('❌ [AuthService] Error:', error);
			throw error;
		}
	}

	/**
	 * Legacy method for backward compatibility
	 */
	static async magicAuth(
		didToken: string,
		userData: Partial<UserProfile>
	): Promise<AuthResponse> {
		const user = await this.createOrUpdateUser(didToken, userData);
		return {
			token: didToken, // DID token is the auth token
			user,
		};
	}

	/**
	 * Check if user exists (DID-only version)
	 */
	static async checkUserExists(
		didToken: string
	): Promise<{ exists: boolean; user?: UserProfile; token?: string }> {
		try {
			console.log('🔍 [AuthService] Checking if user exists with DID token...');

			// Try to get user with minimal data - if user exists, backend will return user info
			const user = await this.createOrUpdateUser(didToken, {});
			console.log('✅ [AuthService] User exists');

			return {
				exists: true,
				user: user,
				token: didToken, // DID token is the auth token
			};
		} catch (authError: any) {
			console.log(
				'❌ [AuthService] User check failed:',
				authError instanceof Error ? authError.message : 'Unknown error'
			);
			// If it fails due to missing user data, user doesn't exist
			if (
				authError.message.includes('required for new users') ||
				authError.message.includes('First name and last name')
			) {
				return { exists: false };
			}
			// Other errors, re-throw
			throw authError;
		}
	}

	/**
	 * Get current user profile (DID token) with automatic retry on token expiry
	 */
	static async getCurrentUser(
		didToken: string,
		retryCount: number = 0
	): Promise<UserProfile> {
		try {
			console.log('🔍 [AuthService] Getting current user with DID token...');
			console.log('🎫 [AuthService] DID token length:', didToken?.length);
			console.log(
				'🎫 [AuthService] DID token preview:',
				didToken ? `${didToken.substring(0, 100)}...` : 'null'
			);
			console.log('🌐 [AuthService] API_BASE_URL:', API_BASE_URL);
			console.log('🔄 [AuthService] Retry count:', retryCount);

			const url = `${API_BASE_URL}/auth/current-user`;
			console.log('🔗 [AuthService] Full request URL:', url);

			const headers = {
				Authorization: `Bearer ${didToken}`,
			};
			console.log('📋 [AuthService] Request headers:', headers);

			const response = await fetch(url, {
				method: 'GET',
				headers,
			});

			console.log('📊 [AuthService] Response status:', response.status);
			console.log(
				'📊 [AuthService] Response headers:',
				Object.fromEntries(response.headers.entries())
			);

			if (!response.ok) {
				console.error(
					'❌ [AuthService] Failed to get current user:',
					response.status
				);

				// Try to get response body for more details
				let errorBody = null;
				try {
					errorBody = await response.text();
					console.error('❌ [AuthService] Error response body:', errorBody);
				} catch (bodyError) {
					console.error(
						'❌ [AuthService] Could not read error response body:',
						bodyError
					);
				}

				// If it's a 401 (token expired) and we haven't retried yet, try to refresh token
				if (response.status === 401 && retryCount === 0) {
					console.log(
						'🔄 [AuthService] Token expired (401), attempting to refresh...'
					);

					const { DIDAuthService } = await import('./didAuthService');
					const refreshResult = await DIDAuthService.refreshToken();

					if (refreshResult.success && refreshResult.didToken) {
						console.log(
							'✅ [AuthService] Token refreshed, retrying getCurrentUser...'
						);
						return this.getCurrentUser(refreshResult.didToken, retryCount + 1);
					} else {
						console.error(
							'❌ [AuthService] Token refresh failed:',
							refreshResult.error
						);
						throw new Error(
							`Token expired and refresh failed: ${refreshResult.error}`
						);
					}
				}

				throw new Error(
					`Failed to get current user: ${response.status} - ${
						errorBody || response.statusText
					}`
				);
			}

			const res = await response.json();
			console.log('✅ [AuthService] Current user retrieved successfully');
			console.log('👤 [AuthService] User data:', res.data);
			return res.data;
		} catch (error) {
			console.error('❌ [AuthService] Get current user error:', error);
			console.error('❌ [AuthService] Error details:', {
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				name: error instanceof Error ? error.name : typeof error,
			});
			throw error;
		}
	}

	/**
	 * Create user profile
	 */
	static async createProfile(
		token: string,
		profileData: Partial<UserProfile> & { username: string }
	): Promise<UserProfile> {
		try {
			const response = await fetch(`${API_BASE_URL}/auth/magic-auth`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ didToken: token, ...profileData }),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to create profile');
			}

			return await response.json();
		} catch (error) {
			console.error('Create profile error:', error);
			throw error;
		}
	}

	/**
	 * Update user profile (JWT only)
	 */
	static async updateProfile(
		jwtToken: string,
		profileData: Partial<UserProfile>
	): Promise<UserProfile> {
		try {
			const response = await fetch(`${API_BASE_URL}/profile`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${jwtToken}`,
				},
				body: JSON.stringify(profileData),
			});

			if (!response.ok) {
				throw new Error('Failed to update profile');
			}

			const result = await response.json();
			return result.data;
		} catch (error) {
			console.error('Update profile error:', error);
			throw error;
		}
	}

	/**
	 * Get user profile (JWT only)
	 */
	static async getProfile(jwtToken: string): Promise<UserProfile> {
		try {
			const response = await fetch(`${API_BASE_URL}/profile`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${jwtToken}`,
				},
			});

			if (!response.ok) {
				throw new Error('Failed to get profile');
			}

			const result = await response.json();
			return result.data;
		} catch (error) {
			console.error('Get profile error:', error);
			throw error;
		}
	}

	/**
	 * Logout user
	 */
	static async logout(didToken: string): Promise<void> {
		try {
			const response = await fetch(`${API_BASE_URL}/auth/logout`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					didToken,
				}),
			});

			if (!response.ok) {
				throw new Error('Logout failed');
			}
		} catch (error) {
			console.error('Logout error:', error);
			throw error;
		}
	}

	/**
	 * Search users by email, phone, username, or name (DID token)
	 */
	static async searchUsers(
		didToken: string,
		query: string,
		page: number = 1,
		limit: number = 10
	): Promise<{ users: UserProfile[]; pagination: any }> {
		try {
			if (!query || query.trim().length < 2) {
				return {
					users: [],
					pagination: { page: 1, limit, total: 0, pages: 0 },
				};
			}

			console.log('🔍 [AuthService] Searching users with DID token...');
			console.log(
				'🎫 [AuthService] DID token preview:',
				didToken ? `${didToken.substring(0, 50)}...` : 'null'
			);
			console.log('🔍 [AuthService] Search query:', query);

			const response = await fetch(
				`${API_BASE_URL}/users/search/${encodeURIComponent(
					query
				)}?page=${page}&limit=${limit}`,
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${didToken}`,
					},
				}
			);

			console.log('📊 [AuthService] Search response status:', response.status);

			if (!response.ok) {
				if (response.status === 404) {
					// No users found
					return { users: [], pagination: { page, limit, total: 0, pages: 0 } };
				}
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to search users');
			}

			const result = await response.json();
			if (result.status === 'success' && result.data) {
				return {
					users: result.data.users || [],
					pagination: result.data.pagination || {
						page,
						limit,
						total: 0,
						pages: 0,
					},
				};
			}
			return { users: [], pagination: { page, limit, total: 0, pages: 0 } };
		} catch (error) {
			console.error('Search users error:', error);
			if (
				(error instanceof Error && error.message.includes('404')) ||
				(error instanceof Error && error.message.includes('not found'))
			) {
				return { users: [], pagination: { page, limit, total: 0, pages: 0 } };
			}
			throw error;
		}
	}

	/**
	 * Search single user by email, phone, or username (DID token) - Legacy method
	 */
	static async searchSingleUser(
		didToken: string,
		query: string
	): Promise<UserProfile | null> {
		try {
			const response = await fetch(
				`${API_BASE_URL}/users/${encodeURIComponent(query)}`,
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${didToken}`,
					},
				}
			);

			if (!response.ok) {
				if (response.status === 404) {
					return null;
				}
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to search user');
			}

			const result = await response.json();
			if (result.status === 'success' && result.data) {
				return result.data;
			}
			return null;
		} catch (error) {
			console.error('Search single user error:', error);
			if (
				(error instanceof Error && error.message.includes('404')) ||
				(error instanceof Error && error.message.includes('not found'))
			) {
				return null;
			}
			throw error;
		}
	}

	/**
	 * Create test user (development only)
	 */
	static async createTestUser(
		email: string,
		name: string
	): Promise<AuthResponse> {
		try {
			const response = await fetch(`${API_BASE_URL}/auth/create-test-user`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					name,
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to create test user');
			}

			return await response.json();
		} catch (error) {
			console.error('Create test user error:', error);
			throw error;
		}
	}

	/**
	 * Get DID token from Magic
	 */
	static async getDidToken(): Promise<string> {
		try {
			const magic = MagicService.magic;
			const didToken = await magic.user.getIdToken();
			if (!didToken) {
				throw new Error('No DID token received');
			}
			return didToken;
		} catch (error) {
			console.error('Get DID token error:', error);
			throw error;
		}
	}

	/**
	 * Check if user is logged in
	 */
	static async isLoggedIn(): Promise<boolean> {
		try {
			const magic = MagicService.magic;
			return await magic.user.isLoggedIn();
		} catch (error) {
			console.error('Check login status error:', error);
			return false;
		}
	}

	/**
	 * Get user info from Magic
	 */
	static async getUserInfo(): Promise<any> {
		try {
			const magic = MagicService.magic;
			return await magic.user.getInfo();
		} catch (error) {
			console.error('Get user info error:', error);
			throw error;
		}
	}
}
