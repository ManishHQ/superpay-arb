import { create } from 'zustand';
import { WalletService } from '@/services/walletService';

export interface WalletState {
	// Wallet connection state
	isConnected: boolean;

	// Wallet data
	address: string | null;
	shortAddress: string | null;

	// Wallet metadata
	walletName: string | null;
	walletIcon: string | null;
	connectorId: string | null;

	// Actions
	setWallet: (address: string) => void;
	setConnected: (connected: boolean) => void;
	updateWalletState: () => void;
	reset: () => void;
}

const initialState = {
	isConnected: false,
	address: null,
	shortAddress: null,
	walletName: null,
	walletIcon: null,
	connectorId: null,
};

export const useWalletStore = create<WalletState>((set, get) => ({
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

	updateWalletState: () => {
		const connectionStatus = WalletService.getConnectionStatus();
		const walletMetadata = WalletService.getWalletMetadata();

		set({
			isConnected: connectionStatus.isConnected,
			address: connectionStatus.address,
			shortAddress: connectionStatus.shortAddress,
			walletName: walletMetadata?.name || null,
			walletIcon: walletMetadata?.icon || null,
			connectorId: walletMetadata?.connector || null,
		});
	},

	reset: () => set(initialState),
}));
