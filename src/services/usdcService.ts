import { MOCKUSDC_CONFIG } from '@/constants/mUSDC';
import { publicClient, dynamicClient } from '@/lib/client';
import { PublicClient, parseUnits, erc20Abi } from 'viem';
import { RateLimitedRPCService } from './rpcService';
import { Wallet } from '@dynamic-labs/client';

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
	{
		constant: false,
		inputs: [
			{ name: '_to', type: 'address' },
			{ name: '_value', type: 'uint256' },
		],
		name: 'transfer',
		outputs: [{ name: '', type: 'bool' }],
		type: 'function',
	},
	{
		constant: false,
		inputs: [
			{ name: '_spender', type: 'address' },
			{ name: '_value', type: 'uint256' },
		],
		name: 'approve',
		outputs: [{ name: '', type: 'bool' }],
		type: 'function',
	},
	{
		constant: true,
		inputs: [
			{ name: '_owner', type: 'address' },
			{ name: '_spender', type: 'address' },
		],
		name: 'allowance',
		outputs: [{ name: '', type: 'uint256' }],
		type: 'function',
	},
] as const;

export interface USDCTransactionResult {
	hash: string;
	status: 'pending' | 'confirmed' | 'failed';
	blockNumber?: number;
	gasUsed?: bigint;
}

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
	 * Get the primary connected wallet
	 */
	getPrimaryWallet(): Wallet | null {
		return dynamicClient.wallets.primary || null;
	}

	/**
	 * Check if any wallet is connected
	 */
	isWalletConnected(): boolean {
		return dynamicClient.wallets.primary !== null;
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
				(client) =>
					client.readContract({
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
	 * Get USDC balance for the connected wallet
	 */
	async getConnectedWalletBalance(): Promise<{
		raw: bigint;
		formatted: string;
		decimals: number;
	} | null> {
		const primaryWallet = this.getPrimaryWallet();
		if (!primaryWallet?.address) {
			return null;
		}

		return this.getBalance(primaryWallet.address as `0x${string}`);
	}

	/**
	 * Send USDC to an address using the connected wallet
	 */
	async sendUSDC(
		to: `0x${string}`,
		amount: string
	): Promise<USDCTransactionResult> {
		try {
			const primaryWallet = this.getPrimaryWallet();
			if (!primaryWallet) {
				throw new Error('No wallet connected');
			}

			// Create wallet client
			const walletClient = await dynamicClient.viem.createWalletClient({
				wallet: primaryWallet,
			});

			// Convert amount to USDC units (6 decimals)
			const amountInUnits = parseUnits(amount, 6);

			// Use writeContract for ERC-20 transfers (recommended approach)
			const hash = await walletClient.writeContract({
				address: this.contractAddress,
				abi: erc20Abi,
				functionName: 'transfer',
				args: [to, amountInUnits],
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
			console.error('Error sending USDC:', error);

			// Enhanced error handling based on Dynamic docs
			if (error instanceof Error) {
				if (error.message.includes('insufficient funds')) {
					throw new Error('Insufficient USDC balance');
				} else if (
					error.message.includes('user rejected') ||
					error.message.includes('User rejected')
				) {
					throw new Error('User rejected the transaction');
				} else if (error.message.includes('gas')) {
					throw new Error('Insufficient gas for transaction');
				}
			}

			throw new Error(`Failed to send USDC: ${error}`);
		}
	}

	/**
	 * Approve USDC spending for another contract (e.g., for swaps)
	 */
	async approveUSDC(
		spender: `0x${string}`,
		amount: string
	): Promise<USDCTransactionResult> {
		try {
			const primaryWallet = this.getPrimaryWallet();
			if (!primaryWallet) {
				throw new Error('No wallet connected');
			}

			// Create wallet client
			const walletClient = await dynamicClient.viem.createWalletClient({
				wallet: primaryWallet,
			});

			// Convert amount to USDC units (6 decimals)
			const amountInUnits = parseUnits(amount, 6);

			// Use writeContract for ERC-20 approvals (recommended approach)
			const hash = await walletClient.writeContract({
				address: this.contractAddress,
				abi: erc20Abi,
				functionName: 'approve',
				args: [spender, amountInUnits],
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
			console.error('Error approving USDC:', error);

			// Enhanced error handling based on Dynamic docs
			if (error instanceof Error) {
				if (error.message.includes('insufficient funds')) {
					throw new Error('Insufficient USDC balance');
				} else if (
					error.message.includes('user rejected') ||
					error.message.includes('User rejected')
				) {
					throw new Error('User rejected the transaction');
				} else if (error.message.includes('gas')) {
					throw new Error('Insufficient gas for transaction');
				}
			}

			throw new Error(`Failed to approve USDC: ${error}`);
		}
	}

	/**
	 * Check USDC allowance for a spender
	 */
	async getAllowance(
		owner: `0x${string}`,
		spender: `0x${string}`
	): Promise<{
		raw: bigint;
		formatted: string;
	}> {
		try {
			const allowance = await this.publicClient.readContract({
				address: this.contractAddress,
				abi: ERC20_ABI,
				functionName: 'allowance',
				args: [owner, spender],
			});

			return {
				raw: allowance as bigint,
				formatted: this.formatBalance(allowance as bigint),
			};
		} catch (error) {
			console.error('Error fetching USDC allowance:', error);
			return {
				raw: 0n,
				formatted: '0.00',
			};
		}
	}

	/**
	 * Get transaction status for a USDC transaction
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
	 * Encode transfer function call data
	 * @deprecated Use writeContract with erc20Abi instead
	 */
	private encodeTransferData(to: `0x${string}`, amount: bigint): `0x${string}` {
		// Function selector for transfer(address,uint256)
		const functionSelector = '0xa9059cbb';

		// Encode parameters: address (20 bytes) + uint256 (32 bytes)
		const toAddress = to.slice(2).padStart(64, '0'); // Remove 0x and pad to 64 chars
		const amountHex = amount.toString(16).padStart(64, '0');

		return `0x${functionSelector}${toAddress}${amountHex}` as `0x${string}`;
	}

	/**
	 * Encode approve function call data
	 * @deprecated Use writeContract with erc20Abi instead
	 */
	private encodeApproveData(
		spender: `0x${string}`,
		amount: bigint
	): `0x${string}` {
		// Function selector for approve(address,uint256)
		const functionSelector = '0x095ea7b3';

		// Encode parameters: address (20 bytes) + uint256 (32 bytes)
		const spenderAddress = spender.slice(2).padStart(64, '0'); // Remove 0x and pad to 64 chars
		const amountHex = amount.toString(16).padStart(64, '0');

		return `0x${functionSelector}${spenderAddress}${amountHex}` as `0x${string}`;
	}

	/**
	 * Parse USDC amount from string to bigint (with proper decimals)
	 */
	private parseUSDCAmount(amount: string): bigint {
		return parseUnits(amount, 6);
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

	/**
	 * Get USDC contract address
	 */
	getContractAddress(): string {
		return this.contractAddress;
	}

	/**
	 * Get default USDC balance structure for when wallet is not connected
	 */
	static getDefaultBalance(): {
		raw: bigint;
		formatted: string;
		decimals: number;
	} {
		return {
			raw: 0n,
			formatted: '0.00',
			decimals: MOCKUSDC_CONFIG.decimals,
		};
	}
}
