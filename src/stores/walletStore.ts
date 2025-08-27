import { create } from 'zustand';

export interface WalletState {
  // Wallet connection state
  isConnected: boolean;
  
  // Wallet data
  address: string | null;
  shortAddress: string | null;
  
  // Actions
  setWallet: (address: string) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

const initialState = {
  isConnected: false,
  address: null,
  shortAddress: null,
};

export const useWalletStore = create<WalletState>((set) => ({
  ...initialState,

  setWallet: (address: string) => {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    set({
      address,
      shortAddress,
      isConnected: true,
    });
  },

  setConnected: (connected: boolean) => set({ isConnected: connected }),

  reset: () => set(initialState),
}));