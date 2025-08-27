import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { WalletService, WalletBalances } from '@/services/walletService';
import { publicClient } from '@/lib/client';

export interface TokenBalance {
  raw: bigint;
  formatted: string;
  lastUpdated: number;
  isStale: boolean;
}

export interface AddressBalances {
  eth: TokenBalance;
  usdc: TokenBalance;
  lastFetched: number;
  isLoading: boolean;
  error: string | null;
}

export interface BalanceState {
  // Address -> Balance mapping for caching
  balances: Record<string, AddressBalances>;
  
  // Global loading state
  isLoading: boolean;
  
  // Actions
  fetchBalances: (address: string, force?: boolean) => Promise<void>;
  invalidateBalance: (address: string, token?: 'eth' | 'usdc') => void;
  invalidateAll: () => void;
  getBalance: (address: string, token: 'eth' | 'usdc') => TokenBalance | null;
  isBalanceStale: (address: string, maxAgeMs?: number) => boolean;
  markAsStale: (address: string) => void;
}

const createDefaultTokenBalance = (): TokenBalance => ({
  raw: 0n,
  formatted: '0.00',
  lastUpdated: 0,
  isStale: true,
});

const createDefaultAddressBalances = (): AddressBalances => ({
  eth: { ...createDefaultTokenBalance(), formatted: '0.0000' },
  usdc: createDefaultTokenBalance(),
  lastFetched: 0,
  isLoading: false,
  error: null,
});

export const useBalanceStore = create<BalanceState>()(
  subscribeWithSelector((set, get) => ({
    balances: {},
    isLoading: false,

    fetchBalances: async (address: string, force: boolean = false) => {
      const state = get();
      const addressLower = address.toLowerCase();
      const existing = state.balances[addressLower];
      
      // Check if we need to fetch
      const isStale = get().isBalanceStale(address);
      if (!force && existing && !isStale && !existing.error) {
        console.log(`[BalanceStore] Using cached balance for ${address}`);
        return;
      }

      if (!publicClient) {
        console.error('[BalanceStore] No public client available');
        return;
      }

      // Set loading state
      set((state) => ({
        balances: {
          ...state.balances,
          [addressLower]: {
            ...state.balances[addressLower] || createDefaultAddressBalances(),
            isLoading: true,
            error: null,
          },
        },
        isLoading: true,
      }));

      try {
        console.log(`[BalanceStore] Fetching balances for ${address}`);
        const walletService = new WalletService(publicClient);
        const balances = await walletService.getAllBalances(address as `0x${string}`);
        
        const now = Date.now();
        
        set((state) => ({
          balances: {
            ...state.balances,
            [addressLower]: {
              eth: {
                raw: balances.eth.raw,
                formatted: balances.eth.formatted,
                lastUpdated: now,
                isStale: false,
              },
              usdc: {
                raw: balances.usdc.raw,
                formatted: balances.usdc.formatted,
                lastUpdated: now,
                isStale: false,
              },
              lastFetched: now,
              isLoading: false,
              error: null,
            },
          },
          isLoading: false,
        }));

        console.log(`[BalanceStore] Successfully fetched balances for ${address}`, balances);
      } catch (error) {
        console.error(`[BalanceStore] Error fetching balances for ${address}:`, error);
        
        set((state) => ({
          balances: {
            ...state.balances,
            [addressLower]: {
              ...state.balances[addressLower] || createDefaultAddressBalances(),
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch balances',
            },
          },
          isLoading: false,
        }));
      }
    },

    invalidateBalance: (address: string, token?: 'eth' | 'usdc') => {
      const addressLower = address.toLowerCase();
      
      set((state) => {
        const existing = state.balances[addressLower];
        if (!existing) return state;

        if (token) {
          // Invalidate specific token
          return {
            balances: {
              ...state.balances,
              [addressLower]: {
                ...existing,
                [token]: {
                  ...existing[token],
                  isStale: true,
                },
              },
            },
          };
        } else {
          // Invalidate all tokens for this address
          return {
            balances: {
              ...state.balances,
              [addressLower]: {
                ...existing,
                eth: { ...existing.eth, isStale: true },
                usdc: { ...existing.usdc, isStale: true },
              },
            },
          };
        }
      });
      
      console.log(`[BalanceStore] Invalidated ${token || 'all'} balance(s) for ${address}`);
    },

    invalidateAll: () => {
      set((state) => {
        const newBalances: Record<string, AddressBalances> = {};
        
        Object.keys(state.balances).forEach(address => {
          const existing = state.balances[address];
          newBalances[address] = {
            ...existing,
            eth: { ...existing.eth, isStale: true },
            usdc: { ...existing.usdc, isStale: true },
          };
        });

        return { balances: newBalances };
      });
      
      console.log('[BalanceStore] Invalidated all balances');
    },

    getBalance: (address: string, token: 'eth' | 'usdc') => {
      const addressLower = address.toLowerCase();
      const balances = get().balances[addressLower];
      return balances?.[token] || null;
    },

    isBalanceStale: (address: string, maxAgeMs: number = 60000) => { // Default 1 minute
      const addressLower = address.toLowerCase();
      const balances = get().balances[addressLower];
      
      if (!balances) return true;
      
      const now = Date.now();
      const ethStale = balances.eth.isStale || (now - balances.eth.lastUpdated) > maxAgeMs;
      const usdcStale = balances.usdc.isStale || (now - balances.usdc.lastUpdated) > maxAgeMs;
      
      return ethStale || usdcStale;
    },

    markAsStale: (address: string) => {
      get().invalidateBalance(address);
    },
  }))
);

// Event-driven balance invalidation hooks
export const useBalanceInvalidation = () => {
  const { invalidateBalance, invalidateAll } = useBalanceStore();

  return {
    // Invalidate balance after transaction
    onTransaction: (address: string) => {
      console.log('[BalanceStore] Transaction detected, invalidating balances');
      invalidateBalance(address);
    },
    
    // Invalidate all balances (e.g., network change)
    onNetworkChange: () => {
      console.log('[BalanceStore] Network change detected, invalidating all balances');
      invalidateAll();
    },
    
    // Invalidate when coming back from background
    onAppForeground: (address?: string) => {
      console.log('[BalanceStore] App came to foreground, marking balances as stale');
      if (address) {
        invalidateBalance(address);
      } else {
        invalidateAll();
      }
    },
  };
};