import { dynamicClient } from '@/lib/client';
import { UserProfileService } from './userProfileService';
import { UserProfile } from '@/types/supabase';

export interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  username?: string;
  walletAddress?: string;
}

export interface OnboardingData {
  fullName: string;
  username: string;
  email: string;
  walletAddress: string;
  avatar_url?: string;
  role: 'person' | 'business';
  businessName?: string;
  businessType?: string;
  businessDescription?: string;
}

export class AuthService {
  /**
   * Check if user exists in database after successful authentication
   */
  static async checkUserExistsInDatabase(authUser: AuthUser): Promise<UserProfile | null> {
    try {
      // First try to find by wallet address if available
      if (authUser.walletAddress) {
        console.log('Checking database for wallet address:', authUser.walletAddress);
        const profileByWallet = await UserProfileService.getProfileByWalletAddress(authUser.walletAddress);
        if (profileByWallet) {
          console.log('Profile found in database:', profileByWallet);
          return profileByWallet;
        }
        console.log('No profile found for wallet address');
      }

      // Then try to find by email if available
      if (authUser.email) {
        // Note: We don't have a direct email lookup method, but we can check by username or ID
        // For now, we'll rely on wallet address as the primary identifier
      }

      return null;
    } catch (error) {
      console.error('Error checking if user exists in database:', error);
      // For connectivity/server errors, re-throw so we can handle them appropriately
      throw new Error(`Database connectivity error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract user information from Dynamic.xyz auth
   */
  static extractUserFromDynamic(auth?: any, wallets?: any): AuthUser | null {
    try {
      // Use passed parameters or try to get from dynamic client
      const authenticatedUser = auth?.authenticatedUser;
      const userWallets = wallets?.userWallets || [];

      if (!authenticatedUser) {
        console.log('No authenticated user found');
        return null;
      }

      // Get the primary wallet address
      const primaryWallet = userWallets?.[0];
      const walletAddress = primaryWallet?.address;

      const firstName = authenticatedUser.firstName || '';
      const lastName = authenticatedUser.lastName || '';
      const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || '';

      return {
        id: authenticatedUser.id || authenticatedUser.userId || '',
        email: authenticatedUser.email || '',
        firstName,
        lastName,
        fullName,
        username: authenticatedUser.username || authenticatedUser.alias || '',
        walletAddress: walletAddress || '',
      };
    } catch (error) {
      console.error('Error extracting user from Dynamic:', error);
      return null;
    }
  }

  /**
   * Create a new user profile during onboarding
   */
  static async createUserProfile(onboardingData: OnboardingData): Promise<UserProfile | null> {
    try {
      const profileData = {
        username: onboardingData.username,
        email: onboardingData.email,
        full_name: onboardingData.fullName,
        wallet_address: onboardingData.walletAddress,
        avatar_url: onboardingData.avatar_url || null,
        role: onboardingData.role,
        business_name: onboardingData.role === 'business' ? onboardingData.businessName || null : null,
        business_type: onboardingData.role === 'business' ? onboardingData.businessType || null : null,
        business_description: onboardingData.role === 'business' ? onboardingData.businessDescription || null : null,
      };

      return await UserProfileService.createProfile(profileData);
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  }

  /**
   * Handle complete authentication flow with database checks and onboarding
   */
  static async handleAuthenticationFlow(auth?: any, wallets?: any): Promise<{
    success: boolean;
    userProfile: UserProfile | null;
    needsOnboarding: boolean;
    error?: string;
  }> {
    console.log('=== Starting Authentication Flow ===');
    
    try {
      // Extract user info from Dynamic
      console.log('Extracting user from Dynamic...');
      const authUser = this.extractUserFromDynamic(auth, wallets);
      
      if (!authUser) {
        console.log('No authenticated user found from Dynamic');
        return {
          success: false,
          userProfile: null,
          needsOnboarding: false,
          error: 'No authenticated user found',
        };
      }

      console.log('Extracted user data:', authUser);

      // Check if user exists in database
      console.log('Checking if user exists in database...');
      const existingProfile = await this.checkUserExistsInDatabase(authUser);
      
      if (existingProfile) {
        // User exists, return profile
        console.log('User exists in database, authentication successful');
        return {
          success: true,
          userProfile: existingProfile,
          needsOnboarding: false,
        };
      }

      // User doesn't exist, needs onboarding
      console.log('User does NOT exist in database, needs onboarding');
      return {
        success: true,
        userProfile: null,
        needsOnboarding: true,
      };
    } catch (error) {
      console.error('Error in authentication flow:', error);
      return {
        success: false,
        userProfile: null,
        needsOnboarding: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate onboarding data
   */
  static validateOnboardingData(data: Partial<OnboardingData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic validations
    if (!data.fullName?.trim()) {
      errors.push('Full name is required');
    }

    if (!data.username?.trim()) {
      errors.push('Username is required');
    } else if (data.username.length < 3) {
      errors.push('Username must be at least 3 characters');
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }

    if (!data.email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Please enter a valid email address');
    }

    if (!data.walletAddress?.trim()) {
      errors.push('Wallet address is required');
    }

    if (!data.role) {
      errors.push('Account type is required');
    }

    // Business-specific validations
    if (data.role === 'business') {
      if (!data.businessName?.trim()) {
        errors.push('Business name is required for business accounts');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if username is available
   */
  static async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      return await UserProfileService.isUsernameAvailable(username);
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  }
}