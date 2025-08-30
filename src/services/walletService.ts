import { PublicClient } from 'viem';
import { USDCService } from './usdcService';
import { RateLimitedRPCService } from './rpcService';

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

export class WalletService {
	private publicClient: PublicClient;
	private usdcService: USDCService;
	private rpcService: RateLimitedRPCService;

	constructor(publicClient: PublicClient) {
		this.publicClient = publicClient;
		this.usdcService = new USDCService(publicClient);
		this.rpcService = RateLimitedRPCService.getInstance(publicClient);
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
}