import { ethers } from 'ethers';
import { MagicService } from '@/hooks/magic';
import { Alert } from 'react-native';

export class WalletService {
	/** Get wallet address */
	static async getWalletAddress(): Promise<string> {
		try {
			console.log('🔍 [WalletService] Getting wallet address...');

			// First check if Magic is logged in
			const magic = MagicService.magic;
			console.log('🔍 [WalletService] Checking Magic login status...');

			const isLoggedIn = await magic.user.isLoggedIn();
			console.log(`🔍 [WalletService] Magic logged in: ${isLoggedIn}`);

			if (!isLoggedIn) {
				throw new Error('Magic user not logged in. Please authenticate first.');
			}

			console.log('🔗 [WalletService] Getting provider...');
			const provider = MagicService.provider;

			console.log('✍️  [WalletService] Getting signer from provider...');
			const signer = await provider.getSigner();

			console.log('📍 [WalletService] Getting address from signer...');
			const address = await signer.getAddress();

			console.log(`✅ [WalletService] Wallet address obtained: ${address}`);
			return address;
		} catch (error) {
			console.error('❌ [WalletService] Error getting wallet address:', error);
			console.error('❌ [WalletService] Error details:', {
				message: error instanceof Error ? error.message : 'Unknown error',
				code: (error as any)?.code,
				reason: (error as any)?.reason,
			});

			// Provide more helpful error messages
			if (error instanceof Error) {
				if (error.message.includes('eth_requestAccounts')) {
					throw new Error(
						'Failed to connect to wallet. Please check your Magic authentication and try again.'
					);
				} else if (error.message.includes('not logged in')) {
					throw new Error('Magic user not authenticated. Please log in again.');
				}
			}

			throw error;
		}
	}

	/** Get account address and balances */
	static async getAccountInfo() {
		try {
			const provider = MagicService.provider;
			const signer = await provider.getSigner();
			const address = await signer.getAddress();

			// Get ETH balance (for gas fees)
			const ethBalanceWei = await provider.getBalance(address);
			const ethBalanceFormatted = ethers.formatEther(ethBalanceWei);

			return {
				address,
				ethBalance: ethBalanceFormatted,
			};
		} catch (error) {
			console.error('Error getting account info:', error);
			throw error;
		}
	}

	/** Get ETH balance for address */
	static async getEthBalance(address: string) {
		try {
			const provider = MagicService.provider;
			const balanceWei = await provider.getBalance(address);
			return ethers.formatEther(balanceWei);
		} catch (error) {
			console.error('Error getting ETH balance:', error);
			throw error;
		}
	}

	/** Personal sign message */
	static async personalSign(message: string = 'SuperPay MockUSDC Transaction') {
		try {
			const provider = MagicService.provider;
			const signer = await provider.getSigner();
			const signature = await signer.signMessage(message);
			return signature;
		} catch (error) {
			console.error('Error signing message:', error);
			throw error;
		}
	}

	/** Show Magic wallet UI */
	static async showWallet() {
		try {
			const magic = MagicService.magic;
			await magic.wallet.showUI();
		} catch (error) {
			console.error('Error showing wallet:', error);
			throw error;
		}
	}

	/** Get wallet info */
	static async getWalletInfo() {
		try {
			const magic = MagicService.magic;
			const walletInfo = await magic.user.getInfo();
			return {
				walletType: walletInfo.walletType,
				email: walletInfo.email || 'N/A',
			};
		} catch (error) {
			console.error('Error getting wallet info:', error);
			throw error;
		}
	}

	/** Get user DID */
	static async getUserDID() {
		try {
			const magic = MagicService.magic;
			const userInfo = await magic.user.getInfo();

			// Try different possible DID properties
			const DID =
				(userInfo as any).did ||
				(userInfo as any).id ||
				(userInfo as any).publicAddress ||
				'DID not found';

			return DID;
		} catch (error) {
			console.error('Error getting user DID:', error);
			throw error;
		}
	}
}
