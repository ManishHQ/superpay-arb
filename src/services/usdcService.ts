import { MOCKUSDC_CONFIG } from '@/constants/mUSDC';
import { publicClient } from '@/lib/client';
import { PublicClient } from 'viem';
import { RateLimitedRPCService } from './rpcService';

// ERC20 ABI for balance and basic operations
const ERC20_ABI = [
	{
		constant: true,
		inputs: [{ name: '_owner', type: 'address' }],
		name: 'balanceOf',
		outputs: [{ name: 'balance', type: 'uint256' }],
		type: 'function',
	},
	{
		constant: true,
		inputs: [],
		name: 'decimals',
		outputs: [{ name: '', type: 'uint8' }],
		type: 'function',
	},
	{
		constant: true,
		inputs: [],
		name: 'symbol',
		outputs: [{ name: '', type: 'string' }],
		type: 'function',
	},
	{
		constant: true,
		inputs: [],
		name: 'name',
		outputs: [{ name: '', type: 'string' }],
		type: 'function',
	},
] as const;

export class USDCService {
	private publicClient: PublicClient;
	private contractAddress: `0x${string}`;
	private rpcService: RateLimitedRPCService;

	constructor(client?: PublicClient) {
		this.publicClient = client || publicClient;
		this.contractAddress = MOCKUSDC_CONFIG.address as `0x${string}`;
		this.rpcService = RateLimitedRPCService.getInstance(this.publicClient);
	}

	/**
	 * Get USDC balance for a given address
	 */
	async getBalance(address: `0x${string}`): Promise<{
		raw: bigint;
		formatted: string;
		decimals: number;
	}> {
		try {
			const balance = await this.rpcService.execute(
				(client) => client.readContract({
					address: this.contractAddress,
					abi: ERC20_ABI,
					functionName: 'balanceOf',
					args: [address],
				}),
				`USDC balance for ${address}`
			);

			const formattedBalance = this.formatBalance(balance as bigint);

			return {
				raw: balance as bigint,
				formatted: formattedBalance,
				decimals: MOCKUSDC_CONFIG.decimals,
			};
		} catch (error) {
			console.error('Error fetching USDC balance:', error);
			
			// Return zero balance instead of throwing to prevent UI crashes
			return {
				raw: 0n,
				formatted: '0.00',
				decimals: MOCKUSDC_CONFIG.decimals,
			};
		}
	}

	/**
	 * Format USDC balance from wei to human readable format
	 */
	private formatBalance(balance: bigint): string {
		const divisor = BigInt(10 ** MOCKUSDC_CONFIG.decimals);
		const wholePart = balance / divisor;
		const fractionalPart = balance % divisor;

		// Convert fractional part to string with proper decimal places
		const fractionalStr = fractionalPart
			.toString()
			.padStart(MOCKUSDC_CONFIG.decimals, '0');

		// Remove trailing zeros and ensure we have at least 2 decimal places
		const trimmedFractional = fractionalStr.replace(/0+$/, '').padEnd(2, '0');

		return `${wholePart}.${trimmedFractional}`;
	}

	/**
	 * Get token info (symbol, name, decimals)
	 */
	async getTokenInfo(): Promise<{
		symbol: string;
		name: string;
		decimals: number;
		address: string;
	}> {
		try {
			const [symbol, name, decimals] = await Promise.all([
				this.publicClient.readContract({
					address: this.contractAddress,
					abi: ERC20_ABI,
					functionName: 'symbol',
				}),
				this.publicClient.readContract({
					address: this.contractAddress,
					abi: ERC20_ABI,
					functionName: 'name',
				}),
				this.publicClient.readContract({
					address: this.contractAddress,
					abi: ERC20_ABI,
					functionName: 'decimals',
				}),
			]);

			return {
				symbol: symbol as string,
				name: name as string,
				decimals: decimals as number,
				address: this.contractAddress,
			};
		} catch (error) {
			console.error('Error fetching token info:', error);
			// Return default values if contract call fails
			return {
				symbol: MOCKUSDC_CONFIG.symbol,
				name: 'Mock USD Coin',
				decimals: MOCKUSDC_CONFIG.decimals,
				address: this.contractAddress,
			};
		}
	}

	/**
	 * Check if address is a valid Ethereum address
	 */
	static isValidAddress(address: string): boolean {
		return /^0x[a-fA-F0-9]{40}$/.test(address);
	}
}
