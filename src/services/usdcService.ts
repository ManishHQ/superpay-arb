import { ethers } from 'ethers';
import { MagicService } from '@/hooks/magic';
import { MOCKUSDC_CONFIG } from '../constants/mUSDC';

// MockUSDC ABI
const MOCKUSDC_ABI = [
	'function balanceOf(address owner) view returns (uint256)',
	'function decimals() view returns (uint8)',
	'function symbol() view returns (string)',
	'function name() view returns (string)',
	'function transfer(address to, uint256 amount) returns (bool)',
	'function mint(address to, uint256 amount) returns (bool)',
	'function faucet(uint256 amount) returns (bool)',
	'function faucetStandard() returns (bool)',
	'function approve(address spender, uint256 amount) returns (bool)',
	'function allowance(address owner, address spender) view returns (uint256)',
	'event Transfer(address indexed from, address indexed to, uint256 value)',
];

export class USDCService {
	/** Get MockUSDC Contract Instance */
	static async getContract(withSigner = false) {
		try {
			console.log(
				`📄 [USDCService] Getting contract (withSigner: ${withSigner})...`
			);
			const provider = MagicService.provider;
			console.log('🔗 [USDCService] Provider obtained from Magic');

			if (withSigner) {
				console.log('✍️  [USDCService] Getting signer from provider...');

				// Add timeout for getSigner to prevent hanging
				const signerTimeout = new Promise<never>((_, reject) => {
					setTimeout(() => {
						reject(
							new Error(
								'Signer timeout - Magic connection may be lost. Please ensure app is in foreground.'
							)
						);
					}, 15000); // 15 second timeout for signer
				});

				const signer = await Promise.race([
					provider.getSigner(),
					signerTimeout,
				]);
				console.log('✅ [USDCService] Signer obtained successfully');

				const signerAddress = await signer.getAddress();
				console.log(`👤 [USDCService] Signer address: ${signerAddress}`);

				const contract = new ethers.Contract(
					MOCKUSDC_CONFIG.address,
					MOCKUSDC_ABI,
					signer
				);
				console.log(
					`📄 [USDCService] Contract created with signer at: ${MOCKUSDC_CONFIG.address}`
				);
				return contract;
			} else {
				const contract = new ethers.Contract(
					MOCKUSDC_CONFIG.address,
					MOCKUSDC_ABI,
					provider
				);
				console.log(
					`📄 [USDCService] Contract created with provider at: ${MOCKUSDC_CONFIG.address}`
				);
				return contract;
			}
		} catch (error) {
			console.error(
				'❌ [USDCService] Error creating MockUSDC contract:',
				error
			);
			console.error('❌ [USDCService] Error details:', {
				message: error instanceof Error ? error.message : 'Unknown error',
				code: (error as any)?.code,
				withSigner,
				contractAddress: MOCKUSDC_CONFIG.address,
			});
			throw error;
		}
	}

	/** Get USDC balance for address */
	static async getBalance(address: string) {
		try {
			console.log('📍 Getting USDC balance for address:', address);
			const contract = await this.getContract();
			const balanceRaw = await contract.balanceOf(address);
			const decimals = await contract.decimals();
			const balanceFormatted = ethers.formatUnits(balanceRaw, decimals);

			console.log('💰 USDC Balance details:', {
				address,
				balanceRaw: balanceRaw.toString(),
				decimals: decimals.toString(),
				balanceFormatted,
				balanceAsNumber: parseFloat(balanceFormatted),
			});

			return balanceFormatted;
		} catch (error) {
			console.error('Error getting USDC balance:', error);
			throw error;
		}
	}

	/** Get contract decimals */
	static async getDecimals() {
		try {
			const contract = await this.getContract();
			return await contract.decimals();
		} catch (error) {
			console.error('Error getting decimals:', error);
			throw error;
		}
	}

	/** Use faucet to get test tokens */
	static async useFaucet() {
		try {
			const contract = await this.getContract(true);
			const tx = await contract.faucetStandard();
			return tx;
		} catch (error) {
			console.error('Error using faucet:', error);
			throw error;
		}
	}

	/** Transfer USDC tokens */
	static async transfer(toAddress: string, amount: string) {
		try {
			console.log('🚀 [USDCService] Starting USDC transfer...');
			console.log(`📍 [USDCService] To: ${toAddress}`);
			console.log(`💰 [USDCService] Amount: ${amount}`);

			// Device-specific debugging
			console.log('📱 [USDCService] Device info:', {
				platform: require('react-native').Platform.OS,
				isSimulator: __DEV__,
				networkUrl: 'https://evm-rpc-testnet.sei-apis.com',
				chainId: 1328,
			});

			console.log('📄 [USDCService] Getting contract with signer...');
			const contract = await this.getContract(true);
			console.log('✅ [USDCService] Contract obtained successfully');

			// Verify signer is connected
			const signer = await contract.runner;
			if (signer && 'getAddress' in signer) {
				try {
					const signerAddress = await (signer as any).getAddress();
					console.log(`👤 [USDCService] Signer address: ${signerAddress}`);

					if ('isConnected' in signer) {
						const isConnected = await (signer as any).isConnected();
						console.log(`🔗 [USDCService] Signer connected: ${isConnected}`);
					}
				} catch (signerError) {
					console.log(
						'⚠️ [USDCService] Could not verify signer details:',
						signerError
					);
				}
			} else {
				console.log('⚠️ [USDCService] Signer verification not available');
			}

			console.log('🔢 [USDCService] Getting decimals...');
			const decimals = await contract.decimals();
			console.log(`🔢 [USDCService] Decimals: ${decimals}`);

			console.log('🧮 [USDCService] Parsing amount to wei...');
			const amountInWei = ethers.parseUnits(amount, decimals);
			console.log(`🧮 [USDCService] Amount in wei: ${amountInWei.toString()}`);

			// Estimate gas first with better error handling
			console.log('⛽ [USDCService] Estimating gas...');
			let gasEstimate;
			try {
				gasEstimate = await contract.transfer.estimateGas(
					toAddress,
					amountInWei
				);
				console.log(`⛽ [USDCService] Gas estimate: ${gasEstimate.toString()}`);
			} catch (gasError) {
				console.error('❌ [USDCService] Gas estimation failed:', gasError);
				// Try with a default gas limit for device-specific issues
				gasEstimate = 100000n; // Default gas limit
				console.log(
					`⛽ [USDCService] Using default gas limit: ${gasEstimate.toString()}`
				);
			}

			const gasLimit = (gasEstimate * 120n) / 100n;
			console.log(
				`⛽ [USDCService] Gas limit (with 20% buffer): ${gasLimit.toString()}`
			);

			// Execute transfer with timeout and retry logic
			console.log('📤 [USDCService] Executing transfer transaction...');
			let tx;

			// Create timeout promise to prevent hanging
			const createTimeoutPromise = (timeoutMs: number) => {
				return new Promise<never>((_, reject) => {
					setTimeout(() => {
						reject(
							new Error(
								`Transaction timeout after ${timeoutMs}ms. This may happen if the app is backgrounded or Magic loses connection.`
							)
						);
					}, timeoutMs);
				});
			};

			try {
				// Try transfer with 30 second timeout
				console.log('⏰ [USDCService] Setting 30s timeout for transaction...');
				tx = await Promise.race([
					contract.transfer(toAddress, amountInWei, {
						gasLimit: gasLimit,
					}),
					createTimeoutPromise(30000),
				]);
			} catch (transferError) {
				console.error(
					'❌ [USDCService] First transfer attempt failed:',
					transferError
				);

				// Check if it's a timeout error
				if (
					transferError instanceof Error &&
					transferError.message.includes('timeout')
				) {
					console.error(
						'⏰ [USDCService] Transaction timed out - likely due to app being backgrounded'
					);
					throw new Error(
						'Transaction timed out. Please ensure the app stays in foreground during payments and try again.'
					);
				}

				// Try with higher gas limit for device-specific issues
				console.log('🔄 [USDCService] Retrying with higher gas limit...');
				const higherGasLimit = (gasEstimate * 150n) / 100n;
				console.log(
					`⛽ [USDCService] Higher gas limit: ${higherGasLimit.toString()}`
				);

				// Retry with timeout
				console.log('⏰ [USDCService] Setting 30s timeout for retry...');
				tx = await Promise.race([
					contract.transfer(toAddress, amountInWei, {
						gasLimit: higherGasLimit,
					}),
					createTimeoutPromise(30000),
				]);
			}

			console.log(`✅ [USDCService] Transaction submitted successfully`);
			console.log(`📦 [USDCService] Transaction hash: ${tx.hash}`);
			console.log(
				`⛽ [USDCService] Gas limit used: ${tx.gasLimit?.toString()}`
			);
			console.log(`💰 [USDCService] Gas price: ${tx.gasPrice?.toString()}`);

			return tx;
		} catch (error) {
			console.error('❌ [USDCService] Error transferring USDC:', error);
			console.error('❌ [USDCService] Error details:', {
				message: error instanceof Error ? error.message : 'Unknown error',
				code: (error as any)?.code,
				reason: (error as any)?.reason,
				stack: error instanceof Error ? error.stack : undefined,
				errorType: error.constructor.name,
				hasMessage: !!(error as any)?.message,
				hasCode: !!(error as any)?.code,
			});

			// Device-specific error handling
			if (error instanceof Error) {
				if (
					error.message.includes('user rejected') ||
					error.message.includes('User rejected')
				) {
					throw new Error('Transaction was rejected by user');
				} else if (
					error.message.includes('insufficient funds') ||
					error.message.includes('Insufficient funds')
				) {
					throw new Error('Insufficient funds for transaction');
				} else if (
					error.message.includes('network') ||
					error.message.includes('Network')
				) {
					throw new Error('Network error - please check your connection');
				} else if (
					error.message.includes('timeout') ||
					error.message.includes('Timeout')
				) {
					throw new Error('Transaction timeout - please try again');
				}
			} else if (
				typeof error === 'object' &&
				error !== null &&
				'message' in error
			) {
				const errorObj = error as { message: string };
				if (
					errorObj.message.includes('user rejected') ||
					errorObj.message.includes('User rejected')
				) {
					throw new Error('Transaction was rejected by user');
				} else if (
					errorObj.message.includes('insufficient funds') ||
					errorObj.message.includes('Insufficient funds')
				) {
					throw new Error('Insufficient funds for transaction');
				} else if (
					errorObj.message.includes('network') ||
					errorObj.message.includes('Network')
				) {
					throw new Error('Network error - please check your connection');
				} else if (
					errorObj.message.includes('timeout') ||
					errorObj.message.includes('Timeout')
				) {
					throw new Error('Transaction timeout - please try again');
				}
			}

			throw error;
		}
	}

	/** Estimate gas for transfer */
	static async estimateTransferGas(toAddress: string, amount: string) {
		try {
			const contract = await this.getContract(true);
			const decimals = await contract.decimals();
			const amountInWei = ethers.parseUnits(amount, decimals);

			return await contract.transfer.estimateGas(toAddress, amountInWei);
		} catch (error) {
			console.error('Error estimating gas:', error);
			throw error;
		}
	}

	/** Check network connectivity and health */
	static async checkNetworkHealth(): Promise<{
		healthy: boolean;
		details: any;
	}> {
		try {
			console.log('🌐 [USDCService] Checking network health...');

			// Check if provider is responsive
			const provider = MagicService.provider;
			const network = await provider.getNetwork();
			console.log('🔗 [USDCService] Network info:', {
				chainId: network.chainId.toString(),
				name: network.name,
			});

			// Check latest block
			const latestBlock = await provider.getBlockNumber();
			console.log('📦 [USDCService] Latest block:', latestBlock.toString());

			// Check gas price
			const gasPrice = await provider.getFeeData();
			console.log('⛽ [USDCService] Gas price info:', {
				gasPrice: gasPrice.gasPrice?.toString(),
				maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
				maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString(),
			});

			return {
				healthy: true,
				details: {
					chainId: network.chainId.toString(),
					latestBlock: latestBlock.toString(),
					gasPrice: gasPrice.gasPrice?.toString(),
				},
			};
		} catch (error) {
			console.error('❌ [USDCService] Network health check failed:', error);
			return {
				healthy: false,
				details: {
					error: error instanceof Error ? error.message : 'Unknown error',
				},
			};
		}
	}
}
