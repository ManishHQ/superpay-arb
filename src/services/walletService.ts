import { USDCService } from './usdcService';
import { RateLimitedRPCService } from './rpcService';
import { publicClient, dynamicClient } from '@/lib/client';
import { Wallet } from '@dynamic-labs/client';

export interface WalletBalances {
	eth: {
		raw: bigint;
		formatted: string;
	};
	usdc: {
		raw: bigint;
		formatted: string;
		decimals: number;
	};
	address: string;
	shortAddress: string;
}

export interface TransactionResult {
	hash: string;
	status: 'pending' | 'confirmed' | 'failed';
	blockNumber?: number;
	gasUsed?: bigint;
}

export class WalletService {
	private publicClient = publicClient;
	private usdcService: USDCService;
	private rpcService: RateLimitedRPCService;

	constructor() {
		this.publicClient = publicClient;
		this.usdcService = new USDCService(this.publicClient);
		this.rpcService = RateLimitedRPCService.getInstance(this.publicClient);
	}

	/**
	 * Get the primary connected wallet
	 */
	getPrimaryWallet(): Wallet | null {
		return dynamicClient.wallets.primary || null;
	}

	/**
	 * Get all connected wallets
	 */
	getAllWallets(): Wallet[] {
		return dynamicClient.wallets.userWallets;
	}

	/**
	 * Check if any wallet is connected
	 */
	isWalletConnected(): boolean {
		return dynamicClient.wallets.primary !== null;
	}

	/**
	 * Get the primary wallet address
	 */
	getPrimaryWalletAddress(): string | null {
		const primaryWallet = this.getPrimaryWallet();
		return primaryWallet?.address || null;
	}

	/**
	 * Get all balances for a wallet address
	 */
	async getAllBalances(address: `0x${string}`): Promise<WalletBalances> {
		try {
			// Fetch ETH and USDC balances in parallel
			const [ethBalance, usdcBalance] = await Promise.all([
				this.getETHBalance(address),
				this.usdcService.getBalance(address),
			]);

			return {
				eth: ethBalance,
				usdc: usdcBalance,
				address,
				shortAddress: this.formatAddress(address),
			};
		} catch (error) {
			console.error('Error fetching wallet balances:', error);
			throw new Error(`Failed to fetch wallet balances: ${error}`);
		}
	}

	/**
	 * Get ETH balance for an address
	 */
	private async getETHBalance(address: `0x${string}`): Promise<{
		raw: bigint;
		formatted: string;
	}> {
		try {
			const balance = await this.rpcService.execute(
				(client) => client.getBalance({ address }),
				`ETH balance for ${address}`
			);
			const formatted = this.formatETHBalance(balance);

			return {
				raw: balance,
				formatted,
			};
		} catch (error) {
			console.error('Error fetching ETH balance:', error);

			// Return zero balance instead of throwing to prevent UI crashes
			return {
				raw: 0n,
				formatted: '0.0000',
			};
		}
	}

	/**
	 * Send a transaction using Dynamic wallet
	 */
	async sendTransaction(
		to: `0x${string}`,
		value: bigint,
		data?: `0x${string}`
	): Promise<TransactionResult> {
		try {
			const primaryWallet = this.getPrimaryWallet();
			if (!primaryWallet) {
				throw new Error('No wallet connected');
			}

			// Create wallet client
			const walletClient = await dynamicClient.viem.createWalletClient({
				wallet: primaryWallet,
			});

			// Send transaction
			const hash = await walletClient.sendTransaction({
				to,
				value,
				data,
			});

			// Wait for transaction confirmation
			const receipt = await this.publicClient.waitForTransactionReceipt({
				hash,
			});

			return {
				hash,
				status: receipt.status === 'success' ? 'confirmed' : 'failed',
				blockNumber: Number(receipt.blockNumber),
				gasUsed: receipt.gasUsed,
			};
		} catch (error) {
			console.error('Error sending transaction:', error);
			throw new Error(`Failed to send transaction: ${error}`);
		}
	}

	/**
	 * Send ETH to an address
	 */
	async sendETH(to: `0x${string}`, amount: string): Promise<TransactionResult> {
		const value = this.parseEther(amount);
		return this.sendTransaction(to, value);
	}

	/**
	 * Get transaction status
	 */
	async getTransactionStatus(hash: `0x${string}`): Promise<{
		status: 'pending' | 'confirmed' | 'failed';
		blockNumber?: number;
		confirmations: number;
	}> {
		try {
			const receipt = await this.publicClient.getTransactionReceipt({ hash });

			if (!receipt) {
				return { status: 'pending', confirmations: 0 };
			}

			const latestBlock = await this.publicClient.getBlockNumber();
			const confirmations = Number(latestBlock - receipt.blockNumber);

			return {
				status: receipt.status === 'success' ? 'confirmed' : 'failed',
				blockNumber: Number(receipt.blockNumber),
				confirmations,
			};
		} catch (error) {
			console.error('Error getting transaction status:', error);
			throw new Error(`Failed to get transaction status: ${error}`);
		}
	}

	/**
	 * Parse ETH amount from string to bigint (wei)
	 */
	private parseEther(amount: string): bigint {
		const eth = parseFloat(amount);
		if (isNaN(eth) || eth < 0) {
			throw new Error('Invalid ETH amount');
		}
		return BigInt(Math.floor(eth * 1e18));
	}

	/**
	 * Format ETH balance from wei to ETH
	 */
	private formatETHBalance(balance: bigint): string {
		const eth = Number(balance) / 1e18;
		return eth.toFixed(4);
	}

	/**
	 * Format wallet address to short version
	 */
	private formatAddress(address: string): string {
		if (!address || address.length < 10) return address;
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}

	/**
	 * Get USDC service instance for direct access
	 */
	getUSDCService(): USDCService {
		return this.usdcService;
	}

	/**
	 * Validate if an address is valid
	 */
	static isValidAddress(address: string): boolean {
		return /^0x[a-fA-F0-9]{40}$/.test(address);
	}

	/**
	 * Get default balance structure for when wallet is not connected
	 */
	static getDefaultBalances(): {
		usdcBalance: string;
		ethBalance: string;
		walletAddress: string;
	} {
		return {
			usdcBalance: '0.00',
			ethBalance: '0.0000',
			walletAddress: 'Not connected',
		};
	}

	/**
	 * Get wallet connection status
	 */
	static getConnectionStatus(): {
		isConnected: boolean;
		address: string | null;
		shortAddress: string | null;
	} {
		const primaryWallet = dynamicClient.wallets.primary;
		return {
			isConnected: primaryWallet !== null,
			address: primaryWallet?.address || null,
			shortAddress: primaryWallet?.address
				? `${primaryWallet.address.slice(0, 6)}...${primaryWallet.address.slice(-4)}`
				: null,
		};
	}

	/**
	 * Disconnect the current wallet
	 */
	static disconnectWallet(): void {
		dynamicClient.auth.logout();
	}

	/**
	 * Get wallet metadata
	 */
	static getWalletMetadata(): {
		name: string;
		icon: string;
		connector: string;
	} | null {
		const primaryWallet = dynamicClient.wallets.primary;
		if (!primaryWallet) return null;

		return {
			name: primaryWallet.connector.name,
			icon: primaryWallet.connector.icon,
			connector: primaryWallet.connector.id,
		};
	}
}
