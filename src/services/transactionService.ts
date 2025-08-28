import { ethers } from 'ethers';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USDCService } from './usdcService';
import { WalletService } from './walletService';
import { QRService, PaymentRequestData } from './qrService';
import { PaymentService, CreatePaymentRequest } from './paymentService';
import { AuthService } from './authService';
import { TransactionAuthService } from './transactionAuthService';
import { DIDAuthService } from './didAuthService';
import { MOCKUSDC_CONFIG } from '../constants/mUSDC';

export interface TransactionResult {
	success: boolean;
	txHash?: string;
	error?: string;
	receipt?: any;
	paymentId?: string;
	backendPayment?: any;
}

export class TransactionService {
	/** Ensure DID authentication before transaction */
	private static async ensureTransactionAuth(): Promise<{
		success: boolean;
		error?: string;
	}> {
		try {
			console.log('🔐 [TransactionService] Ensuring DID authentication...');

			// Add timeout for authentication check to prevent hanging
			const authTimeout = new Promise<never>((_, reject) => {
				setTimeout(() => {
					reject(
						new Error(
							'Authentication check timeout - please ensure app is in foreground'
						)
					);
				}, 10000); // 10 second timeout
			});

			// First try to get current auth status
			let authResult = await Promise.race([
				DIDAuthService.ensureAuthenticated(),
				authTimeout,
			]);

			// If authentication fails, try to refresh the token
			if (!authResult.success) {
				console.log(
					'🔄 [TransactionService] Authentication failed, attempting token refresh...'
				);

				try {
					const refreshResult = await Promise.race([
						DIDAuthService.refreshToken(),
						authTimeout,
					]);
					if (refreshResult.success && refreshResult.didToken) {
						console.log('✅ [TransactionService] Token refreshed successfully');
						authResult = refreshResult;
					} else {
						console.log(
							'❌ [TransactionService] Token refresh failed:',
							refreshResult.error
						);
					}
				} catch (refreshError) {
					console.log(
						'❌ [TransactionService] Token refresh error:',
						refreshError
					);

					// Check if it's a timeout error
					if (
						refreshError instanceof Error &&
						refreshError.message.includes('timeout')
					) {
						return {
							success: false,
							error:
								'Authentication timed out. Please ensure the app stays in foreground and try again.',
						};
					}
				}
			}

			if (!authResult.success) {
				console.error(
					'❌ [TransactionService] DID authentication failed after refresh attempt:',
					authResult.error
				);
				return {
					success: false,
					error: authResult.error || 'DID authentication failed',
				};
			}

			console.log('✅ [TransactionService] DID authentication verified');
			console.log(
				`🎫 [TransactionService] Using DID token: ${authResult.didToken?.substring(
					0,
					50
				)}...`
			);

			return { success: true };
		} catch (error) {
			console.error(
				'❌ [TransactionService] Error during authentication check:',
				error
			);

			// Check if it's a timeout error
			if (error instanceof Error && error.message.includes('timeout')) {
				return {
					success: false,
					error:
						'Authentication timed out. Please keep the app in foreground during payments.',
				};
			}

			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: 'Authentication check failed',
			};
		}
	}

	/** Find user by wallet address */
	private static async findUserByWalletAddress(
		walletAddress: string
	): Promise<any | null> {
		try {
			if (!walletAddress || !ethers.isAddress(walletAddress)) {
				console.log('Invalid wallet address provided');
				return null;
			}

			// Get current user's DID token for API calls
			const { DIDAuthService } = await import('./didAuthService');
			const didToken = await DIDAuthService.getTokenForAPICall();
			if (!didToken) {
				console.log('No DID auth token available for user search');
				return null;
			}

			// Search for user by wallet address with timeout
			const timeoutPromise = new Promise<never>((_, reject) => {
				setTimeout(() => reject(new Error('User search timeout')), 10000);
			});

			const searchPromise = AuthService.searchUsers(
				didToken,
				walletAddress,
				1,
				10
			);
			const result = await Promise.race([searchPromise, timeoutPromise]);

			// Find exact match for wallet address
			const user = result.users.find(
				(u) => u.walletAddress?.toLowerCase() === walletAddress.toLowerCase()
			);

			return user || null;
		} catch (error) {
			console.log(
				'Could not find user by wallet address:',
				(error as Error).message
			);
			return null;
		}
	}

	/** Create backend payment record */
	private static async createPaymentRecord(
		toAddress: string,
		amount: string,
		method: 'crypto' | 'qr',
		txHash?: string,
		note?: string,
		tags?: string[]
	): Promise<any | null> {
		try {
			// Find recipient user
			const recipientUser = await this.findUserByWalletAddress(toAddress);

			if (!recipientUser) {
				console.log(
					'Recipient not found in system, creating blockchain-only payment'
				);
				return null;
			}

			const paymentData: CreatePaymentRequest = {
				to: recipientUser._id,
				amount: parseFloat(amount),
				currency: MOCKUSDC_CONFIG.symbol,
				method: method,
				note: note || `${MOCKUSDC_CONFIG.symbol} transfer`,
				transactionHash: txHash,
				cryptoAddress: toAddress,
				tags: (tags as any) || ['personal'], // Default to personal tag if none provided
			};

			const payment = await PaymentService.createPayment(paymentData);
			console.log('✅ Backend payment record created:', payment.data._id);
			return payment.data;
		} catch (error) {
			console.error('Failed to create backend payment record:', error);
			return null;
		}
	}

	/** Execute a regular USDC transfer */
	static async executeTransfer(
		toAddress: string,
		amount: string,
		userAddress: string,
		usdcBalance: string,
		note?: string,
		tags?: string[]
	): Promise<TransactionResult> {
		try {
			console.log('🚀 Starting real fund transfer...');
			console.log(`💰 Amount: ${amount} ${MOCKUSDC_CONFIG.symbol}`);
			console.log(`📍 To: ${toAddress}`);
			console.log(`📝 Note: ${note || 'No note'}`);

			// Ensure Magic authentication before proceeding
			const authCheck = await this.ensureTransactionAuth();
			if (!authCheck.success) {
				return {
					success: false,
					error: authCheck.error || 'Authentication required for transactions',
				};
			}

			// Validation
			if (!toAddress || !ethers.isAddress(toAddress)) {
				return {
					success: false,
					error: 'Please enter a valid Ethereum address',
				};
			}

			if (!amount || parseFloat(amount) <= 0) {
				return { success: false, error: 'Please enter a valid amount' };
			}

			// Get fresh balance to ensure accuracy
			console.log('🔄 Refreshing USDC balance...');
			const freshBalance = await USDCService.getBalance(userAddress);

			// Debug balance comparison
			const amountFloat = parseFloat(amount);
			const balanceFloat = parseFloat(freshBalance);
			console.log('💰 Balance check:', {
				requestedAmount: amount,
				amountFloat,
				providedBalance: usdcBalance,
				freshBalance: freshBalance,
				balanceFloat,
				hasEnough: balanceFloat >= amountFloat,
			});

			if (amountFloat > balanceFloat) {
				return {
					success: false,
					error: `Insufficient ${MOCKUSDC_CONFIG.symbol} balance. You have ${freshBalance} but need ${amount}`,
				};
			}

			// Check gas availability
			console.log('⛽ Estimating gas costs...');
			const gasEstimate = await USDCService.estimateTransferGas(
				toAddress,
				amount
			);
			const ethBalance = await WalletService.getEthBalance(userAddress);
			const gasEstimateEth = ethers.formatEther(gasEstimate * 2000000000n);

			if (parseFloat(ethBalance) < parseFloat(gasEstimateEth)) {
				Alert.alert('Warning', 'You might not have enough ETH for gas fees');
			}

			// Execute the blockchain transfer
			console.log('🔗 Executing blockchain transaction...');
			const tx = await USDCService.transfer(toAddress, amount);
			console.log(`📦 Transaction submitted: ${tx.hash}`);

			// Wait for confirmation
			console.log('⏳ Waiting for confirmation...');
			const receipt = await tx.wait();
			console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);

			// Create backend payment record
			console.log('💾 Creating backend payment record...');
			const backendPayment = await this.createPaymentRecord(
				toAddress,
				amount,
				'crypto',
				tx.hash,
				note,
				tags
			);

			return {
				success: true,
				txHash: tx.hash,
				receipt: receipt,
				paymentId: backendPayment?._id,
				backendPayment: backendPayment,
			};
		} catch (error: any) {
			console.error('Transfer error:', error);

			let errorMessage = 'Transaction failed';
			if (error.code === 'INSUFFICIENT_FUNDS') {
				errorMessage = 'Insufficient funds for gas fees';
			} else if (error.code === 'USER_REJECTED') {
				errorMessage = 'Transaction was rejected';
			} else if (error.message) {
				errorMessage = error.message;
			}

			return { success: false, error: errorMessage };
		}
	}

	/** Execute a QR-based payment */
	static async executeQRPayment(
		paymentData: PaymentRequestData,
		userAddress: string,
		usdcBalance: string
	): Promise<TransactionResult> {
		try {
			console.log('🚀 Starting QR payment...');
			console.log(`💰 Amount: ${paymentData.amount} ${paymentData.token}`);
			console.log(`📍 To: ${paymentData.to}`);
			console.log(`📝 Description: ${paymentData.description}`);

			// Ensure Magic authentication before proceeding
			const authCheck = await this.ensureTransactionAuth();
			if (!authCheck.success) {
				return {
					success: false,
					error: authCheck.error || 'Authentication required for transactions',
				};
			}

			// Check network health before proceeding with payment
			console.log(
				'🌐 [TransactionService] Checking network health before payment...'
			);
			const networkHealth = await USDCService.checkNetworkHealth();
			if (!networkHealth.healthy) {
				console.error(
					'❌ [TransactionService] Network health check failed:',
					networkHealth.details
				);
				return {
					success: false,
					error: `Network connectivity issue: ${
						networkHealth.details.error || 'Unknown network error'
					}`,
				};
			}
			console.log('✅ [TransactionService] Network health check passed');

			// Validate payment data
			const validation = QRService.validatePaymentRequest(paymentData);
			if (!validation.isValid) {
				return { success: false, error: validation.error };
			}

			// Validate address
			if (!ethers.isAddress(paymentData.to)) {
				return {
					success: false,
					error: 'Invalid recipient address in QR code',
				};
			}

			// Check balance with debugging
			const amountFloat = parseFloat(paymentData.amount);
			const balanceFloat = parseFloat(usdcBalance);
			console.log('💰 QR Payment balance check:', {
				requestedAmount: paymentData.amount,
				amountFloat,
				currentBalance: usdcBalance,
				balanceFloat,
				hasEnough: balanceFloat >= amountFloat,
			});

			if (amountFloat > balanceFloat) {
				return {
					success: false,
					error: `Insufficient ${MOCKUSDC_CONFIG.symbol} balance. You have ${usdcBalance} but need ${paymentData.amount}`,
				};
			}

			// Check gas availability with detailed logging
			console.log('⛽ Estimating gas costs...');
			let gasEstimate;
			try {
				gasEstimate = await USDCService.estimateTransferGas(
					paymentData.to,
					paymentData.amount
				);
				console.log('✅ Gas estimate successful:', gasEstimate.toString());

				const ethBalance = await WalletService.getEthBalance(userAddress);
				console.log('💰 ETH balance for gas:', ethBalance);

				const gasEstimateEth = ethers.formatEther(gasEstimate * 2000000000n);
				console.log('⛽ Estimated gas cost in ETH:', gasEstimateEth);

				if (parseFloat(ethBalance) < parseFloat(gasEstimateEth)) {
					console.log('⚠️ Warning: Low ETH balance for gas fees');
					Alert.alert('Warning', 'You might not have enough ETH for gas fees');
				}
			} catch (gasError) {
				console.error('❌ Gas estimation failed:', gasError);
				return {
					success: false,
					error: `Gas estimation failed: ${
						gasError instanceof Error ? gasError.message : 'Unknown error'
					}`,
				};
			}

			// Execute the blockchain transfer with detailed logging
			console.log('🔗 Executing QR payment transaction...');
			console.log('📋 Transaction details:', {
				to: paymentData.to,
				amount: paymentData.amount,
				userAddress: userAddress,
				gasEstimate: gasEstimate?.toString(),
			});

			let tx;
			try {
				tx = await USDCService.transfer(paymentData.to, paymentData.amount);
				console.log(`📦 Transaction submitted successfully: ${tx.hash}`);
			} catch (transferError) {
				console.error('❌ Transfer execution failed:', transferError);
				return {
					success: false,
					error: `Transfer execution failed: ${
						transferError instanceof Error
							? transferError.message
							: 'Unknown error'
					}`,
				};
			}

			// Wait for confirmation
			console.log('⏳ Waiting for confirmation...');
			const receipt = await tx.wait();
			console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);

			// Create backend payment record
			console.log('💾 Creating backend payment record...');
			const backendPayment = await this.createPaymentRecord(
				paymentData.to,
				paymentData.amount,
				'qr',
				tx.hash,
				paymentData.description,
				['personal'] // Default tag for QR payments
			);

			return {
				success: true,
				txHash: tx.hash,
				receipt: receipt,
				paymentId: backendPayment?._id,
				backendPayment: backendPayment,
			};
		} catch (error: any) {
			console.error('QR Payment error:', error);

			let errorMessage = 'Payment failed';
			if (error.code === 'INSUFFICIENT_FUNDS') {
				errorMessage = 'Insufficient funds for gas fees';
			} else if (error.code === 'USER_REJECTED') {
				errorMessage = 'Transaction was rejected';
			} else if (error.message) {
				errorMessage = error.message;
			}

			return { success: false, error: errorMessage };
		}
	}

	/** Use faucet to get test tokens */
	static async useFaucet(userAddress: string): Promise<TransactionResult> {
		try {
			// Ensure Magic authentication before proceeding
			const authCheck = await this.ensureTransactionAuth();
			if (!authCheck.success) {
				return {
					success: false,
					error: authCheck.error || 'Authentication required for faucet',
				};
			}

			const tx = await USDCService.useFaucet();
			const receipt = await tx.wait();

			return {
				success: true,
				txHash: tx.hash,
				receipt: receipt,
			};
		} catch (error: any) {
			console.error('Faucet error:', error);

			let errorMessage = 'Faucet failed';
			if (error.message) {
				errorMessage = error.message;
			}

			return { success: false, error: errorMessage };
		}
	}

	/** Get transaction status messages */
	static getTransactionMessages(
		result: TransactionResult,
		amount: string,
		recipient: string,
		description?: string
	) {
		if (result.success) {
			const backendInfo = result.backendPayment
				? `\n📄 Payment ID: ${result.paymentId}`
				: '\n💡 Recipient not in system (blockchain only)';

			return {
				sentMessage: `Sending ${amount} ${
					MOCKUSDC_CONFIG.symbol
				} to ${QRService.formatAddress(recipient)}\n\nDescription: ${
					description || 'N/A'
				}\n\n📦 Tx: ${result.txHash}${backendInfo}`,
				successMessage: `✅ Sent ${amount} ${
					MOCKUSDC_CONFIG.symbol
				}!\n\nDescription: ${description || 'N/A'}\n🧊 Block: ${
					result.receipt?.blockNumber
				}\n📦 Hash: ${result.txHash}${backendInfo}`,
			};
		}

		return {
			errorMessage: result.error || 'Transaction failed',
		};
	}

	/** Get payment history from backend */
	static async getPaymentHistory(page = 1, limit = 10) {
		try {
			const payments = await PaymentService.getPayments(page, limit);
			return payments.data;
		} catch (error) {
			console.error('Failed to get payment history:', error);
			return { payments: [], pagination: { page, limit, total: 0, pages: 0 } };
		}
	}

	/** Get specific payment details */
	static async getPaymentDetails(paymentId: string) {
		try {
			const payment = await PaymentService.getPayment(paymentId);
			return payment.data;
		} catch (error) {
			console.error('Failed to get payment details:', error);
			return null;
		}
	}
}
