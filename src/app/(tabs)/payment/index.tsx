import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	Alert,
	Modal,
	TextInput,
	ScrollView,
	ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { TransactionService } from '@/services/transactionService';
import { QRService, PaymentRequestData } from '@/services/qrService';
import { USDCService } from '@/services/usdcService';
import { DIDAuthService } from '@/services/didAuthService';
import { useBalanceStore } from '@/stores/balanceStore';
import { useUserStore } from '@/stores/userStore';
import QRCode from 'react-native-qrcode-svg';
import {
	ErrorBoundary,
	PaymentErrorFallback,
} from '@/components/ErrorBoundary';

// Type guard for USDC payment data
const isUSDCPaymentData = (data: any): data is PaymentRequestData => {
	return (
		data &&
		typeof data === 'object' &&
		'to' in data &&
		'token' in data &&
		'amount' in data
	);
};

export default function PaymentScreen() {
	const [mode, setMode] = useState<'scan' | 'qr'>('scan');
	const [permission, requestPermission] = useCameraPermissions();
	const [facing, setFacing] = useState<CameraType>('back');
	const [scanResult, setScanResult] = useState<string | null>(null);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [paymentData, setPaymentData] = useState<any>(null);
	const [amount, setAmount] = useState('');
	const [note, setNote] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);
	const [requestAmount, setRequestAmount] = useState('');
	const [requestNote, setRequestNote] = useState('');
	const [qrData, setQrData] = useState<string>('');
	const [showRequestModal, setShowRequestModal] = useState(false);
	const [isScanning, setIsScanning] = useState(true); // Flag to control scanning

	// Use stores - but don't load on mount
	const {
		usdcBalance,
		walletAddress,
		fetchAllBalances,
		refreshAllBalances,
		usdcLoading,
		ethLoading,
	} = useBalanceStore();

	const {
		user: currentUser,
		isLoading: userLoading,
		fetchUserProfile,
		isAuthenticated,
	} = useUserStore();

	// Only show loading if we're actually processing a payment
	const isLoadingWallet =
		isProcessing && (usdcLoading || ethLoading || userLoading);

	// Helper function to close payment modal and reset scanning
	const closePaymentModal = () => {
		setShowPaymentModal(false);
		setPaymentData(null);
		setAmount('');
		setNote('');
		setScanResult(null);
		setIsScanning(true); // Re-enable scanning
	};

	// Load user data only when needed (for QR generation)
	const loadUserDataIfNeeded = async () => {
		if (!currentUser && !userLoading) {
			try {
				await fetchUserProfile();
			} catch (error) {
				console.error('❌ [Payment] Error loading user data:', error);
			}
		}
	};

	// Load wallet data only when needed (for payments)
	const loadWalletDataIfNeeded = async () => {
		if (!walletAddress && !usdcLoading && !ethLoading) {
			try {
				await fetchAllBalances();
			} catch (error) {
				console.error('❌ [Payment] Error loading wallet data:', error);
			}
		}
	};

	// Generate default QR code (for receiving payments)
	const generateDefaultQR = (user?: any, address?: string) => {
		const userToUse = user || currentUser;
		const addressToUse = address || walletAddress;

		if (!addressToUse || !userToUse) {
			console.log(
				'🔍 [Payment] Waiting for user and wallet data to generate QR...'
			);
			return;
		}

		const qrPayload = QRService.generatePaymentRequest(
			addressToUse,
			'0', // Default amount (user can specify)
			`Payment to ${
				userToUse.firstName || userToUse.username || userToUse.email
			}`
		);
		setQrData(qrPayload);
		console.log('✅ [Payment] Default QR code generated');
	};

	// Generate payment request QR code
	const generateRequestQR = () => {
		if (!currentUser || !walletAddress) {
			Alert.alert('Error', 'User data or wallet not loaded');
			return;
		}

		if (!requestAmount || parseFloat(requestAmount) <= 0) {
			Alert.alert('Error', 'Please enter a valid amount');
			return;
		}

		const qrPayload = QRService.generatePaymentRequest(
			walletAddress,
			requestAmount,
			requestNote.trim() ||
				`Payment request from ${currentUser.firstName || currentUser.username}`
		);

		setQrData(qrPayload);
		setShowRequestModal(false);

		Alert.alert(
			'Payment Request QR Generated',
			`Generated QR code requesting ${requestAmount} MUSDC ${
				requestNote ? `for "${requestNote}"` : ''
			}`
		);
	};

	// Load data only when switching to QR mode
	useEffect(() => {
		if (mode === 'qr') {
			loadUserDataIfNeeded();
			loadWalletDataIfNeeded();
		}
	}, [mode]);

	// Regenerate QR when wallet address is loaded (only in QR mode)
	useEffect(() => {
		if (mode === 'qr' && currentUser && walletAddress && !qrData) {
			generateDefaultQR();
		}
	}, [currentUser, walletAddress, mode]);

	if (!permission) {
		return (
			<View className='items-center justify-center flex-1 bg-white'>
				<ActivityIndicator size='large' color='#4F46E5' />
				<Text className='mt-4 text-lg text-gray-600'>
					Requesting camera permission...
				</Text>
			</View>
		);
	}

	if (!permission.granted) {
		return (
			<View className='items-center justify-center flex-1 p-6 bg-white'>
				<Ionicons name='camera' size={64} color='#4F46E5' />
				<Text className='mt-4 text-xl font-bold text-center text-gray-800'>
					Camera Permission Required
				</Text>
				<Text className='mt-2 text-base text-center text-gray-600'>
					We need camera access to scan QR codes for payments
				</Text>
				<TouchableOpacity
					className='px-6 py-3 mt-6 bg-blue-600 rounded-lg'
					onPress={requestPermission}
				>
					<Text className='font-semibold text-white'>Grant Permission</Text>
				</TouchableOpacity>
			</View>
		);
	}

	const handleQRCodeScanned = async (result: any) => {
		// Prevent multiple scans
		if (!isScanning) {
			return;
		}

		console.log('🔍 QR Code scanned:', result.data);
		setIsScanning(false); // Stop further scanning
		setScanResult(result.data);

		try {
			// Try to parse as USDC payment request first
			const paymentRequest = QRService.parsePaymentRequest(result.data);

			if (paymentRequest) {
				console.log('✅ Valid USDC payment request found:', paymentRequest);

				// Validate the payment request
				const validation = QRService.validatePaymentRequest(paymentRequest);
				if (validation.isValid) {
					setPaymentData(paymentRequest);

					// Handle zero amount - let user enter amount
					if (
						paymentRequest.amount === '0' ||
						parseFloat(paymentRequest.amount) === 0
					) {
						setAmount(''); // Clear amount so user can enter
					} else {
						setAmount(paymentRequest.amount);
					}

					setNote(paymentRequest.description || '');
					setShowPaymentModal(true);
				} else {
					Alert.alert(
						'Invalid QR Code',
						validation.error || 'Invalid payment request'
					);
					// Re-enable scanning on error
					setIsScanning(true);
					setScanResult(null);
				}
				return;
			}

			// Fallback: try legacy format
			const legacyData = JSON.parse(result.data);
			if (legacyData.type === 'payment' && legacyData.userId) {
				setPaymentData(legacyData);
				setAmount(''); // Let user enter amount for legacy format
				setShowPaymentModal(true);
			} else if (
				legacyData.type === 'payment_request' &&
				legacyData.userId &&
				legacyData.amount
			) {
				setPaymentData(legacyData);
				setAmount(legacyData.amount.toString());
				setNote(legacyData.note || '');
				setShowPaymentModal(true);
			} else {
				Alert.alert('QR Code Scanned', `Unsupported format: ${result.data}`);
				// Re-enable scanning on error
				setIsScanning(true);
				setScanResult(null);
			}
		} catch (error) {
			console.error('❌ QR parsing error:', error);
			Alert.alert('Invalid QR Code', 'Could not parse QR code data');
			// Re-enable scanning on error
			setIsScanning(true);
			setScanResult(null);
		}
	};

	const handleAuthenticationError = async (error: string) => {
		console.log('🚨 [Payment] Handling DID authentication error:', error);

		DIDAuthService.showAuthError(
			error,
			async () => {
				// Retry - attempt to refresh DID token
				console.log('🔄 [Payment] Retrying DID authentication...');
				const refreshResult = await DIDAuthService.refreshToken();
				if (refreshResult.success) {
					Alert.alert(
						'Success',
						'Authentication restored! You can now try your transaction again.'
					);
				} else {
					Alert.alert(
						'Error',
						refreshResult.error ||
							'Could not restore authentication. Please log in again.'
					);
				}
			},
			() => {
				// Re-authenticate - redirect to login
				Alert.alert(
					'Re-login Required',
					'Please log out and log back in to continue with transactions.'
				);
			}
		);
	};

	const handlePayment = async () => {
		if (!amount || parseFloat(amount) <= 0) {
			Alert.alert('Error', 'Please enter a valid amount');
			return;
		}

		// Load wallet data if not already loaded
		if (!walletAddress || !usdcBalance) {
			try {
				await loadWalletDataIfNeeded();
			} catch (error) {
				Alert.alert(
					'Error',
					'Failed to load wallet information. Please try again.'
				);
				return;
			}
		}

		setIsProcessing(true);
		try {
			console.log('🚀 Processing payment...');

			let result;

			// Check if it's a USDC payment request (new format)
			if (isUSDCPaymentData(paymentData)) {
				console.log('💰 Processing USDC payment request');

				if (!walletAddress) {
					Alert.alert('Error', 'Wallet address not available');
					return;
				}

				// Create a copy of payment data with user-entered amount if original was zero
				const paymentDataToUse = { ...paymentData };
				if (parseFloat(paymentData.amount) === 0) {
					paymentDataToUse.amount = amount;
				}

				result = await TransactionService.executeQRPayment(
					paymentDataToUse as PaymentRequestData,
					walletAddress,
					usdcBalance
				);
			} else if (paymentData?.userId) {
				// Legacy format - need to get user wallet address
				console.log('🔄 Processing legacy payment format');
				Alert.alert(
					'Error',
					'Legacy payment format not supported. Please use a valid USDC payment QR code.'
				);
				return;
			} else {
				Alert.alert('Error', 'Invalid payment data');
				return;
			}

			if (result && result.success) {
				const recipientAddress = isUSDCPaymentData(paymentData)
					? paymentData.to
					: 'Unknown';
				const messages = TransactionService.getTransactionMessages(
					result,
					amount,
					recipientAddress,
					note
				);

				Alert.alert('Payment Successful!', messages.successMessage);

				// Refresh balances and reset form
				await refreshAllBalances();

				// Reset modal
				closePaymentModal();
			} else {
				// Check if it's an authentication error
				if (result.error && result.error.includes('Authentication')) {
					handleAuthenticationError(result.error);
				} else {
					Alert.alert(
						'Payment Failed',
						result.error || 'Unknown error occurred'
					);
				}
			}
		} catch (error) {
			console.error('❌ Error processing payment:', error);
			Alert.alert('Error', 'Failed to process payment. Please try again.');
		} finally {
			setIsProcessing(false);
		}
	};

	// Show authentication error if not authenticated
	if (!isAuthenticated || !currentUser) {
		return (
			<View className='items-center justify-center flex-1 p-6 bg-white'>
				<Ionicons name='warning' size={64} color='#F59E0B' />
				<Text className='mt-4 text-xl font-bold text-center text-gray-800'>
					Authentication Required
				</Text>
				<Text className='mt-2 text-base text-center text-gray-600'>
					Please log in to access payment features
				</Text>
				<TouchableOpacity
					className='px-6 py-3 mt-6 bg-blue-600 rounded-lg'
					onPress={() => fetchUserProfile()}
				>
					<Text className='font-semibold text-white'>Retry Login</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<ErrorBoundary fallback={PaymentErrorFallback}>
			<View className='relative items-center justify-center flex-1 bg-white'>
				{/* Wallet Info Header - only show when we have balance data */}
				{usdcBalance && (
					<View className='absolute z-10 top-12 left-4 right-4'>
						<View className='p-3 border border-gray-200 rounded-lg bg-white/90 backdrop-blur'>
							<Text className='mb-1 text-xs text-gray-500'>Your Balance</Text>
							<Text className='text-lg font-bold text-gray-800'>
								{usdcBalance} MUSDC
							</Text>
						</View>
					</View>
				)}

				{!scanResult && (
					<CameraView
						barcodeScannerSettings={{
							barcodeTypes: ['qr', 'code128'],
						}}
						onBarcodeScanned={isScanning ? handleQRCodeScanned : undefined}
						style={{
							position: 'absolute',
							width: '100%',
							height: '100%',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
						}}
						facing={facing}
					></CameraView>
				)}
				{scanResult && (
					<View className='absolute inset-0 z-30 items-center justify-center'>
						<Ionicons name='checkmark-circle' size={80} color='#16a34a' />
						<Text className='mt-4 text-lg font-bold text-center text-green-600 break-all'>
							{scanResult}
						</Text>
						<TouchableOpacity
							className='px-6 py-3 mt-6 rounded-full bg-primary-blue'
							onPress={() => {
								setScanResult(null);
								setIsScanning(true); // Re-enable scanning
							}}
						>
							<Text className='font-semibold text-white'>Scan Again</Text>
						</TouchableOpacity>
					</View>
				)}
				{/* Tab-like toggle */}
				<View className='flex-row w-full max-w-xs p-1 mx-auto mt-32 mb-8 bg-gray-100 rounded-full'>
					<TouchableOpacity
						className={`flex-1 items-center py-3 rounded-full ${
							mode === 'scan' ? 'bg-primary-blue' : ''
						}`}
						onPress={() => {
							setMode('scan');
							setScanResult(null);
							setIsScanning(true);
						}}
					>
						<Text
							className={`font-semibold ${
								mode === 'scan' ? 'text-white' : 'text-primary-blue'
							}`}
						>
							Scan
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						className={`flex-1 items-center py-3 rounded-full ${
							mode === 'qr' ? 'bg-primary-blue' : ''
						}`}
						onPress={() => setMode('qr')}
					>
						<Text
							className={`font-semibold ${
								mode === 'qr' ? 'text-white' : 'text-primary-blue'
							}`}
						>
							My QR
						</Text>
					</TouchableOpacity>
				</View>
				{/* Main content */}
				{mode === 'scan' ? (
					<View className='items-center justify-center flex-1 w-full'>
						<Text className='mb-6 text-2xl font-bold text-white'>
							Scan to Pay
						</Text>
						<View className='relative items-center justify-center mb-6 overflow-hidden w-72 h-72'>
							{/* CameraView fills the scan area */}
							{/* Overlay: darken everything except the scan area */}
							<View
								pointerEvents='none'
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									height: '100%',
									borderWidth: 4,
									borderRadius: 16,
									borderStyle: 'dashed',
									borderColor: '#4F46E5',
								}}
							/>
						</View>
						{/* Place any instructions or UI here */}
						<Text className='z-20 text-base text-gray-400'>
							Point your camera at a QR code to pay or request
						</Text>
					</View>
				) : (
					<ScrollView
						className='flex-1 w-full'
						contentContainerStyle={{
							alignItems: 'center',
							justifyContent: 'center',
							paddingVertical: 20,
						}}
					>
						<Text className='mb-6 text-2xl font-bold text-gray-800'>
							My QR Code
						</Text>

						{/* QR Code Display */}
						<View className='items-center justify-center mb-6 bg-white border-2 border-gray-200 shadow-lg w-72 h-72 rounded-2xl'>
							{qrData ? (
								<QRCode
									value={qrData}
									size={240}
									color='#000000'
									backgroundColor='#FFFFFF'
								/>
							) : (
								<View className='items-center'>
									<Ionicons name='qr-code' size={120} color='#4F46E5' />
									<Text className='mt-2 text-gray-500'>Loading QR...</Text>
								</View>
							)}
						</View>

						{/* QR Type Display */}
						{qrData && (
							<View className='mb-4'>
								{(() => {
									try {
										const parsedData = QRService.parsePaymentRequest(qrData);
										if (parsedData && parseFloat(parsedData.amount) > 0) {
											return (
												<View className='items-center p-4 rounded-lg bg-blue-50'>
													<Text className='text-sm font-medium text-blue-800'>
														USDC Payment Request
													</Text>
													<Text className='text-2xl font-bold text-blue-900'>
														{parsedData.amount} {parsedData.token}
													</Text>
													{parsedData.description && (
														<Text className='mt-1 text-sm text-blue-700'>
															{parsedData.description}
														</Text>
													)}
												</View>
											);
										} else {
											return (
												<View className='items-center p-3 rounded-lg bg-gray-50'>
													<Text className='text-sm text-gray-600'>
														General USDC Payment QR
													</Text>
													<Text className='text-xs text-gray-500'>
														Others can scan to pay you any amount
													</Text>
												</View>
											);
										}
									} catch {
										return (
											<View className='items-center p-3 rounded-lg bg-gray-50'>
												<Text className='text-sm text-gray-600'>
													Payment QR Code
												</Text>
											</View>
										);
									}
								})()}
							</View>
						)}

						{/* Action Buttons */}
						<View className='flex-row mb-4 space-x-4'>
							<TouchableOpacity
								className='flex-1 px-6 py-3 bg-blue-600 rounded-lg'
								onPress={() => setShowRequestModal(true)}
							>
								<View className='flex-row items-center justify-center'>
									<Ionicons name='receipt' size={20} color='white' />
									<Text className='ml-2 font-semibold text-white'>
										Request Amount
									</Text>
								</View>
							</TouchableOpacity>

							<TouchableOpacity
								className='flex-1 px-6 py-3 bg-gray-600 rounded-lg'
								onPress={() => generateDefaultQR()}
							>
								<View className='flex-row items-center justify-center'>
									<Ionicons name='refresh' size={20} color='white' />
									<Text className='ml-2 font-semibold text-white'>
										Reset QR
									</Text>
								</View>
							</TouchableOpacity>
						</View>

						<Text className='max-w-xs text-base text-center text-gray-500'>
							{JSON.parse(qrData || '{}').type === 'payment_request'
								? 'Share this QR code to request the specific amount'
								: 'Let others scan this to pay you any amount'}
						</Text>
					</ScrollView>
				)}

				{/* Payment Modal */}
				<Modal
					visible={showPaymentModal}
					animationType='slide'
					presentationStyle='pageSheet'
					onRequestClose={closePaymentModal}
				>
					<View className='flex-1 p-6 bg-white'>
						<View className='flex-row items-center justify-between mb-6'>
							<Text className='text-xl font-bold'>Make Payment</Text>
							<TouchableOpacity onPress={closePaymentModal}>
								<Ionicons name='close' size={24} color='#666' />
							</TouchableOpacity>
						</View>

						{paymentData && (
							<View className='p-4 mb-6 rounded-lg bg-gray-50'>
								<Text className='text-sm text-gray-600'>
									{isUSDCPaymentData(paymentData)
										? 'Paying to wallet:'
										: 'Paying to:'}
								</Text>
								{isUSDCPaymentData(paymentData) ? (
									<>
										<Text className='mb-2 font-mono text-sm text-gray-800'>
											{QRService.formatAddress(paymentData.to)}
										</Text>
										<Text className='text-lg font-semibold text-blue-600'>
											{paymentData.amount} {paymentData.token}
										</Text>
										{paymentData.description && (
											<Text className='mt-1 text-sm text-gray-600'>
												{paymentData.description}
											</Text>
										)}
									</>
								) : (
									<>
										<Text className='text-lg font-semibold'>
											{paymentData.userName || 'Unknown User'}
										</Text>
										{paymentData.amount && (
											<Text className='text-sm text-blue-600'>
												Requested: ${paymentData.amount}{' '}
												{paymentData.currency || 'USD'}
											</Text>
										)}
									</>
								)}
							</View>
						)}

						<View className='mb-4'>
							<Text className='mb-2 text-sm font-medium text-gray-700'>
								Amount (MUSDC)
							</Text>
							<View className='flex-row items-center px-3 py-2 border border-gray-300 rounded-lg'>
								<Text className='mr-2 text-lg font-bold text-blue-600'>
									MUSDC
								</Text>
								<TextInput
									placeholder='0.00'
									value={amount}
									onChangeText={setAmount}
									keyboardType='decimal-pad'
									className='flex-1 text-lg'
									placeholderTextColor='#9CA3AF'
									editable={
										!(
											isUSDCPaymentData(paymentData) &&
											parseFloat(paymentData.amount) > 0
										)
									} // Lock amount for USDC requests
								/>
							</View>
							{isUSDCPaymentData(paymentData) &&
								parseFloat(paymentData.amount) > 0 && (
									<Text className='mt-1 text-xs text-blue-600'>
										Amount is set by the payment request
									</Text>
								)}
							{isUSDCPaymentData(paymentData) &&
								parseFloat(paymentData.amount) === 0 && (
									<Text className='mt-1 text-xs text-green-600'>
										Enter the amount you want to pay
									</Text>
								)}
							{usdcBalance && (
								<Text className='mt-1 text-xs text-gray-500'>
									Available: {usdcBalance} MUSDC
								</Text>
							)}
						</View>

						<View className='mb-6'>
							<Text className='mb-2 text-sm font-medium text-gray-700'>
								Note (Optional)
							</Text>
							<TextInput
								placeholder='Add a note...'
								value={note}
								onChangeText={setNote}
								multiline
								numberOfLines={3}
								className='px-3 py-2 text-base border border-gray-300 rounded-lg'
								placeholderTextColor='#9CA3AF'
								textAlignVertical='top'
							/>
						</View>

						<TouchableOpacity
							className={`p-4 rounded-lg ${
								amount && !isProcessing ? 'bg-green-600' : 'bg-gray-400'
							}`}
							onPress={handlePayment}
							disabled={!amount || isProcessing}
						>
							{isProcessing ? (
								<View className='flex-row items-center justify-center'>
									<ActivityIndicator size='small' color='white' />
									<Text className='ml-2 font-semibold text-white'>
										Processing Payment...
									</Text>
								</View>
							) : (
								<View className='flex-row items-center justify-center'>
									<Ionicons name='card' size={20} color='white' />
									<Text className='ml-2 font-semibold text-white'>
										Send {amount || '0.00'} MUSDC
									</Text>
								</View>
							)}
						</TouchableOpacity>
					</View>
				</Modal>

				{/* Request Amount Modal */}
				<Modal
					visible={showRequestModal}
					animationType='slide'
					presentationStyle='pageSheet'
					onRequestClose={() => setShowRequestModal(false)}
				>
					<View className='flex-1 p-6 bg-white'>
						<View className='flex-row items-center justify-between mb-6'>
							<Text className='text-xl font-bold'>Request Payment</Text>
							<TouchableOpacity onPress={() => setShowRequestModal(false)}>
								<Ionicons name='close' size={24} color='#666' />
							</TouchableOpacity>
						</View>

						<View className='p-4 mb-6 rounded-lg bg-blue-50'>
							<Text className='text-sm text-blue-600'>Generate QR Code</Text>
							<Text className='text-base text-blue-800'>
								Create a QR code that requests a specific amount from anyone who
								scans it
							</Text>
						</View>

						<View className='mb-4'>
							<Text className='mb-2 text-sm font-medium text-gray-700'>
								Request Amount (MUSDC)
							</Text>
							<View className='flex-row items-center px-3 py-2 border border-gray-300 rounded-lg'>
								<Text className='mr-2 text-lg font-bold text-blue-600'>
									MUSDC
								</Text>
								<TextInput
									placeholder='0.00'
									value={requestAmount}
									onChangeText={setRequestAmount}
									keyboardType='decimal-pad'
									className='flex-1 text-lg'
									placeholderTextColor='#9CA3AF'
								/>
							</View>
						</View>

						<View className='mb-6'>
							<Text className='mb-2 text-sm font-medium text-gray-700'>
								Note (Optional)
							</Text>
							<TextInput
								placeholder='What is this request for?'
								value={requestNote}
								onChangeText={setRequestNote}
								multiline
								numberOfLines={3}
								className='px-3 py-2 text-base border border-gray-300 rounded-lg'
								placeholderTextColor='#9CA3AF'
								textAlignVertical='top'
							/>
						</View>

						<TouchableOpacity
							className={`p-4 rounded-lg ${
								requestAmount && parseFloat(requestAmount) > 0
									? 'bg-blue-600'
									: 'bg-gray-400'
							}`}
							onPress={generateRequestQR}
							disabled={!requestAmount || parseFloat(requestAmount) <= 0}
						>
							<View className='flex-row items-center justify-center'>
								<Ionicons name='qr-code' size={20} color='white' />
								<Text className='ml-2 font-semibold text-white'>
									Generate Request QR
								</Text>
							</View>
						</TouchableOpacity>

						<View className='items-center mt-6'>
							<Text className='text-sm text-center text-gray-500'>
								Others can scan the generated QR code to pay you the exact
								amount requested
							</Text>
						</View>
					</View>
				</Modal>
			</View>
		</ErrorBoundary>
	);
}
