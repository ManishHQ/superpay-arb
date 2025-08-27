import { create } from 'zustand';
import { UserProfile } from '@/types/supabase';
import { UserProfileService } from '@/services/userProfileService';

interface UserProfileState {
  currentProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentProfile: (profile: UserProfile | null) => void;
  loadProfile: (userId: string) => Promise<void>;
  loadProfileByWallet: (walletAddress: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
  searchUsers: (searchTerm: string) => Promise<UserProfile[]>;
  createOrUpdateProfileForWallet: (
    walletAddress: string,
    dynamicUserData?: {
      email?: string;
      firstName?: string;
      lastName?: string;
      fullName?: string;
      username?: string;
    }
  ) => Promise<void>;
  clearProfile: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUserProfileStore = create<UserProfileState>((set, get) => ({
  currentProfile: null,
  isLoading: false,
  error: null,

  setCurrentProfile: (profile) => set({ currentProfile: profile }),

  loadProfile: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await UserProfileService.getProfileById(userId);
      set({ currentProfile: profile, isLoading: false });
    } catch (error) {
      console.error('Error loading profile:', error);
      set({ 
        error: 'Failed to load profile', 
        isLoading: false 
      });
    }
  },

  loadProfileByWallet: async (walletAddress: string) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await UserProfileService.getProfileByWalletAddress(walletAddress);
      set({ currentProfile: profile, isLoading: false });
    } catch (error) {
      console.error('Error loading profile by wallet:', error);
      set({ 
        error: 'Failed to load profile', 
        isLoading: false 
      });
    }
  },

  updateProfile: async (userId: string, updates: Partial<UserProfile>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProfile = await UserProfileService.updateProfile(userId, updates);
      if (updatedProfile) {
        set({ currentProfile: updatedProfile });
      }
      set({ isLoading: false });
    } catch (error) {
      console.error('Error updating profile:', error);
      set({ 
        error: 'Failed to update profile', 
        isLoading: false 
      });
    }
  },

  searchUsers: async (searchTerm: string): Promise<UserProfile[]> => {
    try {
      return await UserProfileService.searchUsers(searchTerm);
    } catch (error) {
      console.error('Error searching users:', error);
      set({ error: 'Failed to search users' });
      return [];
    }
  },

  createOrUpdateProfileForWallet: async (walletAddress: string, dynamicUserData?) => {
    set({ isLoading: true, error: null });
    try {
      // First check if user exists
      let profile = await UserProfileService.getProfileByWalletAddress(walletAddress);
      
      if (profile) {
        // User exists, set profile and return
        set({ currentProfile: profile, isLoading: false });
        return;
      }
      
      // Check if server is reachable by testing a simple query
      try {
        await UserProfileService.isUsernameAvailable('test_connectivity');
      } catch (connectivityError: any) {
        // Server connectivity issue
        console.error('Server connectivity error:', connectivityError);
        set({ 
          error: 'We are experiencing some connection issues. Please try again later.', 
          isLoading: false 
        });
        return;
      }
      
      // Server is working but user doesn't exist - trigger onboarding
      // Only create profile if we have complete data from onboarding
      if (dynamicUserData?.fullName || (dynamicUserData?.firstName && dynamicUserData?.lastName)) {
        profile = await UserProfileService.getOrCreateProfileForWallet(
          walletAddress,
          dynamicUserData
        );
        set({ currentProfile: profile, isLoading: false });
      } else {
        // Need onboarding - set profile as null to trigger onboarding flow
        set({ currentProfile: null, isLoading: false, error: 'onboarding_required' });
      }
    } catch (error: any) {
      console.error('Error creating/updating profile for wallet:', error);
      
      // Handle specific error cases
      if (error?.code === 'PGRST116') {
        // User not found - need onboarding
        set({ 
          currentProfile: null,
          error: 'onboarding_required',
          isLoading: false 
        });
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        // Network/connectivity error
        set({ 
          error: 'We are experiencing some connection issues. Please try again later.', 
          isLoading: false 
        });
      } else {
        // Other errors
        set({ 
          error: 'Failed to load profile. Please try again.', 
          isLoading: false 
        });
      }
    }
  },

  clearProfile: () => set({ 
    currentProfile: null, 
    error: null 
  }),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setError: (error: string | null) => set({ error }),
}));