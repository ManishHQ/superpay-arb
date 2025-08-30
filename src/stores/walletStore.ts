import { create } from 'zustand';
import { WalletService, WalletBalances } from '@/services/walletService';
import { publicClient } from '@/lib/client';

export interface WalletState {
  // Wallet connection state
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Wallet data
  address: string | null;
  shortAddress: string | null;
  balances: {
    eth: string;
    usdc: string;
  };
  
  // Internal state for debouncing
  lastFetchTime: number;
  pendingFetch: boolean;
  
  // Actions
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setWalletData: (address: string, balances: WalletBalances) => void;
  fetchBalances: (address: string, force?: boolean) => Promise<void>;
  reset: () => void;
}

const initialState = {
  isConnected: false,
  isLoading: false,
  error: null,
  address: null,
  shortAddress: null,
  balances: {
    eth: '0.0000',
    usdc: '0.00',
  },
  lastFetchTime: 0,
  pendingFetch: false,
};

export const useWalletStore = create<WalletState>((set, get) => ({
  ...initialState,

  setConnected: (connected: boolean) => set({ isConnected: connected }),
  
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  setError: (error: string | null) => set({ error }),
  
  setWalletData: (address: string, balances: WalletBalances) => set({
    address,
    shortAddress: balances.shortAddress,
    balances: {
      eth: balances.eth.formatted,
      usdc: balances.usdc.formatted,
    },
    isConnected: true,
    error: null,
  }),

  fetchBalances: async (address: string, force: boolean = false) => {
    const state = get();
    const now = Date.now();
    const minInterval = 10000; // Minimum 10 seconds between fetches
    
    // Debouncing: skip if recent fetch unless forced
    if (!force && state.pendingFetch) {
      console.log('[Store] Fetch already pending, skipping');
      return;
    }
    
    if (!force && (now - state.lastFetchTime) < minInterval) {
      console.log('[Store] Recent fetch detected, skipping');
      return;
    }

    if (!publicClient) {
      set({ error: 'Public client not available' });
      return;
    }

    set({ isLoading: true, error: null, pendingFetch: true });
    
    try {
      const walletService = new WalletService(publicClient);
      const balances = await walletService.getAllBalances(address as `0x${string}`);
      
      get().setWalletData(address, balances);
      set({ lastFetchTime: now });
      console.log('[Store] Balances fetched successfully:', balances);
    } catch (error) {
      console.error('[Store] Error fetching balances:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch balances',
      });
    } finally {
      set({ isLoading: false, pendingFetch: false });
    }
  },

  reset: () => set(initialState),
}));