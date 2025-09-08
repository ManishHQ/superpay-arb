import { client } from '../lib/client';
import { Wallet } from '@dynamic-labs/client';
import { formatEther, parseEther, isAddress } from 'viem';
import {
	mainnet,
	sepolia,
	polygon,
	arbitrum,
	optimism,
	seiTestnet,
} from 'viem/chains';

export interface Transaction {
	id: string;
	type: 'send' | 'receive';
	amount: string;
	to?: string;
	from?: string;
	hash?: string;
	timestamp: Date;
	status: 'pending' | 'confirmed' | 'failed';
	gasUsed?: string;
	gasPrice?: string;
}

export class WalletService {
	private static instance: WalletService;
	private transactions: Transaction[] = [];

	static getInstance(): WalletService {
		if (!WalletService.instance) {
			WalletService.instance = new WalletService();
		}
		return WalletService.instance;
	}

	async getBalance(wallet: Wallet): Promise<string> {
		try {
			const publicClient = client.viem.createPublicClient({
				chain: seiTestnet,
			});
			const balance = await publicClient.getBalance({
				address: wallet.address as `0x${string}`,
			});

			return formatEther(balance);
		} catch (error) {
			console.error('Error fetching balance:', error);
			return '0';
		}
	}

	async sendTransaction(
		wallet: Wallet,
		to: string,
		amount: string
	): Promise<Transaction> {
		try {
			console.log('🚀 Starting transaction:', {
				to,
				amount,
				from: wallet.address,
			});

			console.log(seiTestnet);

			if (!isAddress(to)) {
				throw new Error('Invalid recipient address');
			}

			// Create both public and wallet clients using Dynamic's Viem integration
			console.log('📡 Creating clients...');
			const publicClient = client.viem.createPublicClient({
				chain: seiTestnet,
			});
			const walletClient = await client.viem.createWalletClient({
				wallet,
			});
			console.log('✅ Clients created successfully');

			// Check if wallet is on correct network
			try {
				const walletChainId = await walletClient.getChainId();
				console.log('🌐 Wallet chain ID:', walletChainId);
				console.log('🎯 Expected chain ID:', seiTestnet.id);

				if (walletChainId !== seiTestnet.id) {
					console.warn(
						'⚠️ Network mismatch - wallet may need to switch networks'
					);
				}
			} catch (error) {
				console.warn('Could not verify wallet network:', error);
			}

			const amountWei = parseEther(amount);

			// Check balance before sending
			const balance = await publicClient.getBalance({
				address: wallet.address as `0x${string}`,
			});

			if (balance < amountWei) {
				throw new Error('Insufficient balance');
			}

			console.log('💰 Current balance:', formatEther(balance), 'SEI');
			console.log('💸 Amount to send:', formatEther(amountWei), 'SEI');

			// Estimate gas
			console.log('⛽ Estimating gas...');
			const gasEstimate = await publicClient.estimateGas({
				account: wallet.address as `0x${string}`,
				to: to as `0x${string}`,
				value: amountWei,
			});

			console.log('⛽ Gas estimate:', gasEstimate.toString(), 'units');

			// Send transaction with timeout
			console.log('Sending transaction...');
			const hash = await Promise.race([
				walletClient.sendTransaction({
					to: to as `0x${string}`,
					value: amountWei,
					gas: gasEstimate,
				}),
				new Promise<never>((_, reject) =>
					setTimeout(
						() =>
							reject(
								new Error(
									'Transaction timeout - please check your wallet for approval'
								)
							),
						30000
					)
				),
			]);

			console.log('Transaction hash:', hash);

			// Create transaction record
			const transaction: Transaction = {
				id: hash,
				type: 'send',
				amount,
				to,
				from: wallet.address,
				hash,
				timestamp: new Date(),
				status: 'pending',
			};

			// Add to local transaction history
			this.transactions.unshift(transaction);

			// Wait for transaction confirmation with timeout
			try {
				console.log('Waiting for transaction confirmation...');
				const receipt = await Promise.race([
					publicClient.waitForTransactionReceipt({ hash }),
					new Promise<never>((_, reject) =>
						setTimeout(() => reject(new Error('Confirmation timeout')), 60000)
					),
				]);

				transaction.status =
					receipt.status === 'success' ? 'confirmed' : 'failed';
				transaction.gasUsed = receipt.gasUsed.toString();
				console.log('Transaction confirmed:', transaction.status);
			} catch (error) {
				console.warn('Transaction confirmation failed:', error);
				transaction.status = 'pending'; // Keep as pending instead of failed
			}

			return transaction;
		} catch (error) {
			console.error('Error sending transaction:', error);
			throw error;
		}
	}

	async getTransactionHistory(wallet: Wallet): Promise<Transaction[]> {
		// In a real app, you'd fetch from a blockchain explorer API or indexer
		// For now, return local transactions
		return this.transactions.filter(
			(tx) => tx.from === wallet.address || tx.to === wallet.address
		);
	}

	async getTransactionStatus(hash: string, wallet: Wallet): Promise<string> {
		try {
			// Try to determine the correct chain based on wallet
			let chain = seiTestnet; // Default fallback

			const publicClient = client.viem.createPublicClient({
				chain: chain,
			});

			const receipt = await publicClient.getTransactionReceipt({
				hash: hash as `0x${string}`,
			});

			return receipt.status === 'success' ? 'confirmed' : 'failed';
		} catch (error) {
			// Transaction might still be pending
			return 'pending';
		}
	}

	validateAddress(address: string): boolean {
		return isAddress(address);
	}

	formatAmount(amount: string): string {
		try {
			const num = parseFloat(amount);
			if (isNaN(num)) return '0';
			return num.toFixed(6).replace(/\.?0+$/, '');
		} catch {
			return '0';
		}
	}

	// Utility to get network info using Dynamic's Viem integration
	async getNetworkInfo(wallet: Wallet) {
		try {
			// Try to determine the correct chain based on wallet
			let chain = seiTestnet; // Default fallback

			const publicClient = client.viem.createPublicClient({
				chain: chain,
			});

			// Get chain ID from the public client
			const chainId = await publicClient.getChainId();

			// Get latest block number
			let blockNumber = 'unknown';
			try {
				const blockNum = await publicClient.getBlockNumber();
				blockNumber = blockNum.toString();
			} catch (blockError) {
				console.warn('Failed to fetch block number:', blockError);
			}

			// Check wallet chain property for specific networks
			let name = 'Unknown Network';
			let shortName = 'UNKNOWN';

			if (wallet.chain === 'SEI' || wallet.chain === 'Sei') {
				name = 'Sei Pacific-1';
				shortName = 'SEI';
			} else if (wallet.chain === 'EVM') {
				// Use chain ID to determine EVM network
				switch (chainId) {
					case 1:
						name = 'Ethereum Mainnet';
						shortName = 'ETH';
						break;
					case 11155111:
						name = 'Sepolia Testnet';
						shortName = 'ETH';
						break;
					case 137:
						name = 'Polygon';
						shortName = 'MATIC';
						break;
					case 1328:
						name = 'Sei Testnet';
						shortName = 'SEI';
						break;
					default:
						name = `Chain ${chainId}`;
						shortName = 'ETH';
				}
			}

			return {
				chainId,
				blockNumber,
				name,
				shortName,
			};
		} catch (error) {
			console.error('Error fetching network info:', error);
			return null;
		}
	}

	// Check if wallet is connected to a supported network
	async isNetworkSupported(wallet: Wallet): Promise<boolean> {
		try {
			const networkInfo = await this.getNetworkInfo(wallet);
			if (!networkInfo) return false;

			// For now, we consider any network supported if we can get chainId
			return networkInfo.chainId > 0;
		} catch (error) {
			console.error('Error checking network support:', error);
			return false;
		}
	}
}

export const walletService = WalletService.getInstance();
