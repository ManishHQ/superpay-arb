import { supabase, supabaseAdmin } from '@/lib/supabase';
import { UserProfile, UserProfileInsert, UserProfileUpdate } from '@/types/supabase';

export class UserProfileService {
  /**
   * Create a new user profile
   */
  static async createProfile(profileData: UserProfileInsert): Promise<UserProfile | null> {
    try {
      // Try with admin client first if available (bypasses RLS)
      const client = supabaseAdmin || supabase;
      
      const { data, error } = await client
        .from('user_profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        
        // If it's an RLS error, provide helpful message
        if (error.code === '42501') {
          console.error('RLS Policy Error: Please set up proper RLS policies for user_profiles table');
          console.error('Run the SQL commands from supabase_rls_fix.sql file');
        }
        
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  }

  /**
   * Get user profile by ID
   */
  static async getProfileById(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  /**
   * Get user profile by username
   */
  static async getProfileByUsername(username: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        console.error('Error fetching profile by username:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile by username:', error);
      return null;
    }
  }

  /**
   * Get user profile by wallet address
   */
  static async getProfileByWalletAddress(walletAddress: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        // Handle "no rows found" as expected behavior, not an error
        if (error.code === 'PGRST116' || error.message.includes('0 rows')) {
          console.log('Profile not found for wallet address:', walletAddress);
          return null;
        }
        console.error('Error fetching profile by wallet address:', error);
        throw error; // Re-throw for actual errors
      }

      return data;
    } catch (error: any) {
      // Only log actual errors, not "user not found"
      if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
        return null;
      }
      console.error('Error fetching profile by wallet address:', error);
      throw error; // Re-throw for connectivity/server errors
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: UserProfileUpdate): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  }

  /**
   * Search users by username
   */
  static async searchUsers(searchTerm: string, limit: number = 10): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .rpc('search_users', { search_term: searchTerm })
        .limit(limit);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * Check if username is available
   */
  static async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (error) {
        console.error('Error checking username availability:', error);
        return false;
      }

      return !data; // Username is available if no data is returned
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  }


  /**
   * Get or create profile for wallet address
   * This is useful for Dynamic wallet integration
   */
  static async getOrCreateProfileForWallet(
    walletAddress: string,
    dynamicUserData?: {
      email?: string;
      firstName?: string;
      lastName?: string;
      fullName?: string;
      username?: string;
    }
  ): Promise<UserProfile | null> {
    try {
      // First try to find existing profile
      let profile = await this.getProfileByWalletAddress(walletAddress);
      
      if (profile) {
        return profile;
      }

      // If no profile exists and we have Dynamic user data, create one
      if (dynamicUserData) {
        const username = dynamicUserData.username || 
                        `user_${walletAddress.slice(-8)}` || 
                        `user_${Date.now()}`;

        const profileData: UserProfileInsert = {
          username,
          email: dynamicUserData.email || `${username}@wallet.local`,
          full_name: dynamicUserData.fullName || 
                    (dynamicUserData.firstName && dynamicUserData.lastName 
                      ? `${dynamicUserData.firstName} ${dynamicUserData.lastName}`
                      : dynamicUserData.firstName || dynamicUserData.lastName || username),
          wallet_address: walletAddress,
          role: 'person',
        };

        profile = await this.createProfile(profileData);
      }

      return profile;
    } catch (error) {
      console.error('Error getting or creating profile for wallet:', error);
      return null;
    }
  }
}