import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USDCService } from '@/services/usdcService';
import { WalletService } from '@/services/walletService';

interface BalanceState {
	// USDC Balance
	usdcBalance: string;
	usdcLoading: boolean;
	usdcError: string | null;
	lastUsdcUpdate: number | null;

	// ETH Balance (for gas fees)
	ethBalance: string;
	ethLoading: boolean;
	ethError: string | null;
	lastEthUpdate: number | null;

	// Wallet Address
	walletAddress: string | null;

	// Actions
	fetchUsdcBalance: () => Promise<void>;
	fetchEthBalance: () => Promise<void>;
	fetchAllBalances: () => Promise<void>;
	refreshAllBalances: () => Promise<void>; // Force refresh (bypass cache)
	setUsdcBalance: (balance: string) => void;
	setEthBalance: (balance: string) => void;
	setWalletAddress: (address: string) => void;
	clearBalances: () => void;
	clearErrors: () => void;
}

// Cache duration in milliseconds (2 minutes)
const CACHE_DURATION = 2 * 60 * 1000;

export const useBalanceStore = create<BalanceState>()(
	persist(
		(set, get) => ({
			// Initial state
			usdcBalance: '0',
			usdcLoading: false,
			usdcError: null,
			lastUsdcUpdate: null,

			ethBalance: '0',
			ethLoading: false,
			ethError: null,
			lastEthUpdate: null,

			walletAddress: null,

			// Fetch USDC balance
			fetchUsdcBalance: async () => {
				const { lastUsdcUpdate, walletAddress } = get();
				const now = Date.now();

				// Check if we have cached data that's still valid
				if (
					lastUsdcUpdate &&
					now - lastUsdcUpdate < CACHE_DURATION &&
					!get().usdcLoading
				) {
					return; // Use cached data
				}

				set({ usdcLoading: true, usdcError: null });

				try {
					// Get wallet address if not already available
					let address = walletAddress;
					if (!address) {
						const accountInfo = await WalletService.getAccountInfo();
						address = accountInfo.address;
						set({ walletAddress: address });
					}

					const balance = await USDCService.getBalance(address);
					set({
						usdcBalance: balance,
						usdcLoading: false,
						lastUsdcUpdate: now,
						usdcError: null,
					});
				} catch (error) {
					console.error('Error fetching USDC balance:', error);
					set({
						usdcError: 'Failed to load USDC balance',
						usdcLoading: false,
					});
				}
			},

			// Fetch ETH balance
			fetchEthBalance: async () => {
				const { lastEthUpdate, walletAddress } = get();
				const now = Date.now();

				// Check if we have cached data that's still valid
				if (
					lastEthUpdate &&
					now - lastEthUpdate < CACHE_DURATION &&
					!get().ethLoading
				) {
					return; // Use cached data
				}

				set({ ethLoading: true, ethError: null });

				try {
					// Get wallet address if not already available
					let address = walletAddress;
					if (!address) {
						const accountInfo = await WalletService.getAccountInfo();
						address = accountInfo.address;
						set({ walletAddress: address });
					}

					const balance = await WalletService.getEthBalance(address);
					set({
						ethBalance: balance,
						ethLoading: false,
						lastEthUpdate: now,
						ethError: null,
					});
				} catch (error) {
					console.error('Error fetching ETH balance:', error);
					set({
						ethError: 'Failed to load ETH balance',
						ethLoading: false,
					});
				}
			},

			// Fetch all balances
			fetchAllBalances: async () => {
				const { lastUsdcUpdate, lastEthUpdate, walletAddress } = get();
				const now = Date.now();

				// Check if we have recent cached data
				const hasRecentUsdc =
					lastUsdcUpdate && now - lastUsdcUpdate < CACHE_DURATION;
				const hasRecentEth =
					lastEthUpdate && now - lastEthUpdate < CACHE_DURATION;

				if (hasRecentUsdc && hasRecentEth && walletAddress) {
					return; // Use cached data
				}

				set({
					usdcLoading: true,
					ethLoading: true,
					usdcError: null,
					ethError: null,
				});

				try {
					// Get wallet address if not already available
					let address = walletAddress;
					if (!address) {
						const accountInfo = await WalletService.getAccountInfo();
						address = accountInfo.address;
						set({ walletAddress: address });
					}

					// Fetch both balances in parallel
					const [usdcBalance, ethBalance] = await Promise.all([
						USDCService.getBalance(address),
						WalletService.getEthBalance(address),
					]);

					set({
						usdcBalance,
						ethBalance,
						usdcLoading: false,
						ethLoading: false,
						lastUsdcUpdate: now,
						lastEthUpdate: now,
						usdcError: null,
						ethError: null,
					});
				} catch (error) {
					console.error('Error fetching balances:', error);
					set({
						usdcError: 'Failed to load balances',
						ethError: 'Failed to load balances',
						usdcLoading: false,
						ethLoading: false,
					});
				}
			},

			// Set USDC balance manually
			setUsdcBalance: (balance: string) => {
				set({ usdcBalance: balance, lastUsdcUpdate: Date.now() });
			},

			// Set ETH balance manually
			setEthBalance: (balance: string) => {
				set({ ethBalance: balance, lastEthUpdate: Date.now() });
			},

			// Set wallet address
			setWalletAddress: (address: string) => {
				set({ walletAddress: address });
			},

			// Clear all balances (useful for logout)
			clearBalances: () => {
				set({
					usdcBalance: '0',
					ethBalance: '0',
					usdcLoading: false,
					ethLoading: false,
					usdcError: null,
					ethError: null,
					lastUsdcUpdate: null,
					lastEthUpdate: null,
					walletAddress: null,
				});
			},

			// Force refresh all balances (bypass cache)
			refreshAllBalances: async () => {
				set({
					usdcLoading: true,
					ethLoading: true,
					usdcError: null,
					ethError: null,
				});

				try {
					// Get wallet address if not already available
					let address = get().walletAddress;
					if (!address) {
						const accountInfo = await WalletService.getAccountInfo();
						address = accountInfo.address;
						set({ walletAddress: address });
					}

					// Fetch both balances in parallel
					const [usdcBalance, ethBalance] = await Promise.all([
						USDCService.getBalance(address),
						WalletService.getEthBalance(address),
					]);

					const now = Date.now();
					set({
						usdcBalance,
						ethBalance,
						usdcLoading: false,
						ethLoading: false,
						lastUsdcUpdate: now,
						lastEthUpdate: now,
						usdcError: null,
						ethError: null,
					});
				} catch (error) {
					console.error('Error refreshing balances:', error);
					set({
						usdcError: 'Failed to refresh balances',
						ethError: 'Failed to refresh balances',
						usdcLoading: false,
						ethLoading: false,
					});
				}
			},

			// Clear all errors
			clearErrors: () => {
				set({ usdcError: null, ethError: null });
			},
		}),
		{
			name: 'balance-storage',
			storage: createJSONStorage(() => AsyncStorage),
			// Only persist these fields
			partialize: (state) => ({
				usdcBalance: state.usdcBalance,
				ethBalance: state.ethBalance,
				walletAddress: state.walletAddress,
				lastUsdcUpdate: state.lastUsdcUpdate,
				lastEthUpdate: state.lastEthUpdate,
			}),
		}
	)
);
