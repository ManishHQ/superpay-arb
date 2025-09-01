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
	KeyboardAvoidingView,
	Platform,
	AppState,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useWalletStore } from '@/stores/walletStore';
import { useBalanceStore } from '@/stores/balanceStore';
import { TransactionService } from '@/services/transactionService';
import { WalletService } from '@/services/walletService';

export default function PaymentScreen() {
	const [mode, setMode] = useState<'scan' | 'qr'>('scan');
	const [permission, requestPermission] = useCameraPermissions();
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
	const [isScanning, setIsScanning] = useState(true);
	const [isCameraReady, setIsCameraReady] = useState(false); // Camera readiness state
	const [showTransactionCompleteModal, setShowTransactionCompleteModal] =
		useState(false);
	const [transactionHash, setTransactionHash] = useState<string | null>(null);
	const [completedTransaction, setCompletedTransaction] = useState<any>(null);

	const { currentProfile } = useUserProfileStore();
	const { address: walletAddress } = useWalletStore();
	const { fetchBalances, invalidateBalance, getBalance } = useBalanceStore();

	// Handle camera lifecycle when switching modes
	useEffect(() => {
		if (mode === 'qr') {
			// Stop camera immediately when switching to QR mode
			console.log('📷 Stopping camera - switching to QR mode');
			setIsScanning(false);
			setScanResult(null);
			setIsCameraReady(false); // Reset camera readiness
		} else if (mode === 'scan') {
			// When switching to scan mode, ensure clean state
			console.log('📷 Preparing scan mode');
			setScanResult(null);
			setIsCameraReady(false); // Reset camera readiness when switching to scan
			// Don't start scanning immediately - let button handler control this
		}
	}, [mode]);

	// Handle camera ready event
	const handleCameraReady = () => {
		console.log('📷 Camera is ready');
		setIsCameraReady(true);
	};

	// Handle screen focus - stop camera when screen is not focused
	useFocusEffect(
		React.useCallback(() => {
			console.log('📱 Screen focused');
			// Don't auto-start camera, let user control it with buttons
			return () => {
				console.log('📱 Screen unfocused - stopping camera');
				setIsScanning(false);
				setIsCameraReady(false); // Reset camera readiness when unfocused
			};
		}, [])
	);

	// Handle app state changes - stop camera when app goes to background
	useEffect(() => {
		const handleAppStateChange = (nextAppState: string) => {
			if (nextAppState === 'background' || nextAppState === 'inactive') {
				console.log('📱 App backgrounded - stopping camera');
				setIsScanning(false);
				setIsCameraReady(false); // Reset camera readiness when backgrounded
			}
		};

		const subscription = AppState.addEventListener(
			'change',
			handleAppStateChange
		);
		return () => subscription?.remove();
	}, []);

	// Helper function to close payment modal and reset scanning
	const closePaymentModal = () => {
		setShowPaymentModal(false);
		setPaymentData(null);
		setAmount('');
		setNote('');
		setScanResult(null);
		setIsScanning(true); // Re-enable scanning
	};

	// Generate default QR code (for receiving payments)
	const generateDefaultQR = () => {
		if (!currentProfile) {
			console.log('🔍 [Payment] Waiting for user profile...');
			return;
		}

		const userName =
			currentProfile.display_name || currentProfile.full_name || 'User';
		const userWallet = currentProfile.wallet_address || '0x1234...5678';

		const paymentRequest = {
			type: 'payment_request',
			amount: 0, // Default amount (user can specify)
			currency: 'USDC',
			description: `Payment to ${userName}`,
			recipient: userWallet,
			recipientName: userName,
			userId: currentProfile.id || '',
			timestamp: Date.now(),
			requestId: `default_${Date.now()}`,
		};

		setQrData(JSON.stringify(paymentRequest));
		console.log('✅ [Payment] Default QR code generated');
	};

	// Generate payment request QR code
	const generateRequestQR = () => {
		if (!currentProfile) {
			Alert.alert('Error', 'User profile not loaded');
			return;
		}

		if (!requestAmount || parseFloat(requestAmount) <= 0) {
			Alert.alert('Error', 'Please enter a valid amount');
			return;
		}

		const userName =
			currentProfile.display_name || currentProfile.full_name || 'User';
		const userWallet = currentProfile.wallet_address || '0x1234...5678';

		const paymentRequest = {
			type: 'payment_request',
			amount: parseFloat(requestAmount),
			currency: 'USDC',
			description: requestNote.trim() || `Payment request from ${userName}`,
			recipient: userWallet,
			recipientName: userName,
			userId: currentProfile.id || '',
			timestamp: Date.now(),
			requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
		};

		setQrData(JSON.stringify(paymentRequest));
		setShowRequestModal(false);

		Alert.alert(
			'Payment Request QR Generated',
			`Generated QR code requesting $${requestAmount} ${
				requestNote ? `for "${requestNote}"` : ''
			}`
		);
	};

	// Load default QR when switching to QR mode
	useEffect(() => {
		if (mode === 'qr' && currentProfile && !qrData) {
			generateDefaultQR();
		}
	}, [mode, currentProfile]);

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
			// Try to parse as payment request
			const paymentRequest = JSON.parse(result.data);

			if (paymentRequest && paymentRequest.type === 'payment_request') {
				console.log('✅ Valid payment request found:', paymentRequest);

				// Enhance payment data with business information if available
				const enhancedPaymentData = {
					...paymentRequest,
					businessName:
						paymentRequest.businessName || paymentRequest.business_name,
					recipientType:
						paymentRequest.businessName || paymentRequest.business_name
							? 'business'
							: 'user',
				};

				setPaymentData(enhancedPaymentData);

				// Handle zero amount - let user enter amount
				if (
					paymentRequest.amount === 0 ||
					parseFloat(paymentRequest.amount) === 0
				) {
					setAmount(''); // Clear amount so user can enter
				} else {
					setAmount(String(paymentRequest.amount || ''));
				}

				setNote(paymentRequest.description || '');
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

	const handlePayment = async () => {
		if (!amount || parseFloat(amount) <= 0) {
			Alert.alert('Error', 'Please enter a valid amount');
			return;
		}

		if (!currentProfile || !walletAddress || !paymentData) {
			Alert.alert('Error', 'Missing payment information');
			return;
		}

		// Validate recipient address
		if (!paymentData.recipient || !paymentData.recipient.startsWith('0x')) {
			Alert.alert('Error', 'Invalid recipient wallet address');
			return;
		}

		setIsProcessing(true);
		try {
			console.log('🚀 Processing USDC payment...');
			console.log('💰 Amount:', amount, 'USDC');
			console.log('📍 To:', paymentData.recipient);
			console.log('👤 From:', walletAddress);

			const walletService = new WalletService();
			const numericAmount = parseFloat(amount);

			if (isNaN(numericAmount) || numericAmount <= 0) {
				Alert.alert('Error', 'Please enter a valid amount');
				return;
			}

			// Get current USDC balance using the balance store
			const usdcBalance = walletAddress
				? getBalance(walletAddress, 'usdc')
				: null;
			const currentBalance = parseFloat(usdcBalance?.formatted || '0');

			if (numericAmount > currentBalance) {
				Alert.alert(
					'Insufficient Balance',
					`You don't have enough USDC to complete this transaction. You have ${currentBalance} USDC but need ${numericAmount} USDC.`
				);
				return;
			}

			// Send USDC using the USDCService
			const recipientAddress = paymentData.recipient as `0x${string}`;
			const usdcService = walletService.getUSDCService();
			const txResult = await usdcService.sendUSDC(recipientAddress, amount);

			if (txResult.status === 'confirmed') {
				console.log('🎉 USDC transfer confirmed!', txResult);

				// Create transaction record in database
				const transactionData = {
					to_user_id: paymentData.userId,
					amount: numericAmount,
					currency: 'USDC' as const,
					note: note.trim() || `Payment to ${paymentData.recipientName}`,
					transaction_hash: txResult.hash,
					block_number: txResult.blockNumber || 0,
					blockchain: 'arbitrum',
					network: 'sepolia',
					gas_fee: txResult.gasUsed
						? Number(txResult.gasUsed) * 0.000000001
						: undefined, // Convert wei to ETH
					gas_fee_currency: 'ETH',
					platform_fee: numericAmount * 0.001, // 0.1% platform fee
					platform_fee_currency: 'USDC',
					transaction_type: 'transfer' as const,
					category: 'other' as const,
					is_internal: false,
				};

				const transaction =
					await TransactionService.createTransaction(transactionData);

				// Store transaction details for the completion modal
				setTransactionHash(txResult.hash);
				setCompletedTransaction({
					...transaction,
					recipientName: paymentData.recipientName,
					recipientType: paymentData.businessName ? 'business' : 'user',
					businessName: paymentData.businessName,
					blockNumber: txResult.blockNumber || 0,
					gasUsed: txResult.gasUsed?.toString() || '0',
					effectiveGasPrice: '0', // We don't have this info from USDCService
				});

				// Close payment modal and show completion modal
				closePaymentModal();
				setShowTransactionCompleteModal(true);

				// Update wallet balance in background
				if (walletAddress) {
					invalidateBalance(walletAddress, 'usdc');
					setTimeout(() => fetchBalances(walletAddress, true), 2000);
				}

				console.log('🎉 Payment completed successfully!');
			} else {
				Alert.alert(
					'Transaction Failed',
					'The transaction could not be completed. Please try again.'
				);
				console.log('Transaction failed');
			}
		} catch (error) {
			console.error('❌ Error processing payment:', error);

			// Provide more specific error messages
			let errorMessage = 'Failed to process payment. Please try again.';

			if (error instanceof Error) {
				if (error.message.includes('Insufficient')) {
					errorMessage = error.message;
				} else if (error.message.includes('User rejected')) {
					errorMessage = 'Transaction was cancelled by user.';
				} else if (error.message.includes('network')) {
					errorMessage =
						'Network error. Please check your connection and try again.';
				} else if (error.message.includes('gas')) {
					errorMessage =
						'Transaction failed due to gas issues. Please try again.';
				} else {
					errorMessage = `Transaction failed: ${error.message}`;
				}
			}

			Alert.alert('Payment Failed', errorMessage);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={{ flex: 1 }}
		>
			<View className='flex-1 bg-white'>
				{/* Tab-like toggle */}
				<View className='flex-row w-full max-w-xs p-1 mx-auto mt-16 mb-8 bg-gray-100 rounded-full'>
					<TouchableOpacity
						className={`flex-1 items-center py-3 rounded-full ${
							mode === 'scan' ? 'bg-blue-600' : ''
						}`}
						onPress={() => {
							setMode('scan');
							setScanResult(null);
							// Small delay to ensure camera cleanup before starting
							setTimeout(() => setIsScanning(true), 100);
						}}
					>
						<Text
							className={`font-semibold ${
								mode === 'scan' ? 'text-white' : 'text-blue-600'
							}`}
						>
							Scan
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						className={`flex-1 items-center py-3 rounded-full ${
							mode === 'qr' ? 'bg-blue-600' : ''
						}`}
						onPress={() => setMode('qr')}
					>
						<Text
							className={`font-semibold ${
								mode === 'qr' ? 'text-white' : 'text-blue-600'
							}`}
						>
							My QR
						</Text>
					</TouchableOpacity>
				</View>

				{/* Main content */}
				{mode === 'scan' ? (
					<View className='relative flex-1'>
						{!scanResult && mode === 'scan' && permission?.granted && (
							<CameraView
								barcodeScannerSettings={{
									barcodeTypes: ['qr'],
								}}
								onBarcodeScanned={
									isScanning && isCameraReady ? handleQRCodeScanned : undefined
								}
								onCameraReady={handleCameraReady}
								style={{
									position: 'absolute',
									width: '100%',
									height: '100%',
									top: 0,
									left: 0,
									right: 0,
									bottom: 0,
								}}
								facing='back'
							/>
						)}

						{/* Permission Denied State */}
						{!scanResult &&
							mode === 'scan' &&
							permission &&
							!permission.granted && (
								<View className='absolute inset-0 items-center justify-center bg-black'>
									<Ionicons name='camera-outline' size={64} color='#ffffff' />
									<Text className='px-8 mt-4 text-center text-white'>
										Camera permission required to scan QR codes
									</Text>
									<TouchableOpacity
										className='px-4 py-2 mt-4 bg-blue-600 rounded-lg'
										onPress={requestPermission}
									>
										<Text className='font-semibold text-white'>
											Grant Permission
										</Text>
									</TouchableOpacity>
								</View>
							)}

						{scanResult && (
							<View className='absolute inset-0 z-30 items-center justify-center bg-black bg-opacity-50'>
								<View className='items-center p-6 bg-white rounded-lg'>
									<Ionicons name='checkmark-circle' size={80} color='#16a34a' />
									<Text className='mt-4 text-lg font-bold text-center text-green-600'>
										QR Code Scanned!
									</Text>
									<TouchableOpacity
										className='px-6 py-3 mt-6 bg-blue-600 rounded-full'
										onPress={() => {
											setScanResult(null);
											setIsScanning(true); // Re-enable scanning
										}}
									>
										<Text className='font-semibold text-white'>Scan Again</Text>
									</TouchableOpacity>
								</View>
							</View>
						)}

						{/* Camera Loading State */}
						{!scanResult &&
							mode === 'scan' &&
							permission?.granted &&
							!isCameraReady && (
								<View className='absolute inset-0 z-20 items-center justify-center bg-black'>
									<ActivityIndicator size='large' color='#ffffff' />
									<Text className='mt-4 text-white'>
										Initializing Camera...
									</Text>
								</View>
							)}

						{/* Scan Mode Overlay */}
						<View className='absolute inset-0 z-10 items-center justify-center'>
							<Text className='mb-6 text-2xl font-bold text-white'>
								Scan to Pay
							</Text>
							<View className='relative items-center justify-center mb-6 overflow-hidden w-72 h-72'>
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
										borderColor: isCameraReady ? '#4F46E5' : '#9CA3AF',
									}}
								/>
							</View>
							<Text className='z-20 text-base text-white'>
								{isCameraReady
									? 'Point your camera at a QR code to pay'
									: 'Preparing camera...'}
							</Text>
						</View>
					</View>
				) : (
					<ScrollView
						className='flex-1 bg-white'
						contentContainerStyle={{
							alignItems: 'center',
							justifyContent: 'center',
							paddingVertical: 20,
							paddingHorizontal: 24,
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
										const parsedData = JSON.parse(qrData);
										if (parsedData && parseFloat(parsedData.amount) > 0) {
											return (
												<View className='items-center p-4 rounded-lg bg-blue-50'>
													<Text className='text-sm font-medium text-blue-800'>
														Payment Request
													</Text>
													<Text className='text-2xl font-bold text-blue-900'>
														${parsedData.amount}
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
														General Payment QR
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
							{(() => {
								try {
									const parsedData = JSON.parse(qrData || '{}');
									return parsedData.amount > 0
										? 'Share this QR code to request the specific amount'
										: 'Let others scan this to pay you any amount';
								} catch {
									return 'Let others scan this to pay you any amount';
								}
							})()}
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
					<KeyboardAvoidingView
						behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
						style={{ flex: 1 }}
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
									<Text className='text-sm text-gray-600'>Paying to:</Text>
									<Text className='text-lg font-semibold'>
										{paymentData.businessName ||
											paymentData.recipientName ||
											'Unknown User'}
									</Text>
									{paymentData.businessName && (
										<View className='flex-row items-center mt-1'>
											<Ionicons name='business' size={14} color='#3B82F6' />
											<Text className='ml-1 text-sm font-medium text-blue-600'>
												Business
											</Text>
										</View>
									)}
									{paymentData.amount > 0 && (
										<Text className='text-sm text-blue-600'>
											Requested: ${paymentData.amount}
										</Text>
									)}
									{paymentData.description && (
										<Text className='mt-1 text-sm text-gray-600'>
											{paymentData.description}
										</Text>
									)}
								</View>
							)}

							<View className='mb-4'>
								<Text className='mb-2 text-sm font-medium text-gray-700'>
									Amount (USDC)
								</Text>
								<View className='flex-row items-center px-3 py-2 border border-gray-300 rounded-lg'>
									<Text className='mr-2 text-lg font-bold text-blue-600'>
										$
									</Text>
									<TextInput
										placeholder='0.00'
										value={amount}
										onChangeText={setAmount}
										keyboardType='decimal-pad'
										className='flex-1 text-lg'
										placeholderTextColor='#9CA3AF'
										editable={
											!(paymentData && parseFloat(paymentData.amount) > 0)
										}
									/>
								</View>
								{paymentData && parseFloat(paymentData.amount) > 0 && (
									<Text className='mt-1 text-xs text-blue-600'>
										Amount is set by the payment request
									</Text>
								)}
								{paymentData && parseFloat(paymentData.amount) === 0 && (
									<Text className='mt-1 text-xs text-green-600'>
										Enter the amount you want to pay
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
											Send ${amount || '0.00'} USDC
										</Text>
									</View>
								)}
							</TouchableOpacity>
						</View>
					</KeyboardAvoidingView>
				</Modal>

				{/* Request Amount Modal */}
				<Modal
					visible={showRequestModal}
					animationType='slide'
					presentationStyle='pageSheet'
					onRequestClose={() => setShowRequestModal(false)}
				>
					<KeyboardAvoidingView
						behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
						style={{ flex: 1 }}
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
									Create a QR code that requests a specific amount from anyone
									who scans it
								</Text>
							</View>

							<View className='mb-4'>
								<Text className='mb-2 text-sm font-medium text-gray-700'>
									Request Amount (USDC)
								</Text>
								<View className='flex-row items-center px-3 py-2 border border-gray-300 rounded-lg'>
									<Text className='mr-2 text-lg font-bold text-blue-600'>
										$
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
					</KeyboardAvoidingView>
				</Modal>

				{/* Transaction Complete Modal */}
				<Modal
					visible={showTransactionCompleteModal}
					animationType='slide'
					presentationStyle='pageSheet'
					onRequestClose={() => {
						setShowTransactionCompleteModal(false);
						router.replace('/(app)');
					}}
				>
					<View className='flex-1 p-6 bg-white'>
						<View className='items-center justify-center flex-1'>
							{/* Success Icon */}
							<View className='items-center justify-center w-24 h-24 mb-6 bg-green-100 rounded-full'>
								<Ionicons name='checkmark-circle' size={60} color='#10B981' />
							</View>

							{/* Success Message */}
							<Text className='mb-2 text-2xl font-bold text-center text-gray-900'>
								Payment Successful!
							</Text>

							{completedTransaction && (
								<Text className='mb-6 text-lg text-center text-gray-600'>
									Successfully sent ${completedTransaction.amount.toFixed(2)} to{' '}
									{completedTransaction.recipientType === 'business' &&
									completedTransaction.businessName
										? completedTransaction.businessName
										: completedTransaction.recipientName}
								</Text>
							)}

							{/* Transaction Details */}
							<View className='w-full p-4 mb-6 border border-gray-200 bg-gray-50 rounded-xl'>
								<Text className='mb-3 text-lg font-semibold text-gray-900'>
									Transaction Details
								</Text>

								{completedTransaction && (
									<>
										<View className='flex-row items-center justify-between mb-2'>
											<Text className='text-sm text-gray-600'>Amount:</Text>
											<Text className='text-sm font-medium text-gray-900'>
												${completedTransaction.amount.toFixed(2)} USDC
											</Text>
										</View>

										<View className='flex-row items-center justify-between mb-2'>
											<Text className='text-sm text-gray-600'>Recipient:</Text>
											<Text className='text-sm font-medium text-gray-900'>
												{completedTransaction.recipientType === 'business' &&
												completedTransaction.businessName
													? completedTransaction.businessName
													: completedTransaction.recipientName}
											</Text>
										</View>

										{completedTransaction.recipientType === 'business' &&
											completedTransaction.businessName && (
												<View className='flex-row items-center justify-between mb-2'>
													<Text className='text-sm text-gray-600'>
														Business:
													</Text>
													<Text className='text-sm font-medium text-blue-600'>
														{completedTransaction.businessName}
													</Text>
												</View>
											)}

										<View className='flex-row items-center justify-between mb-2'>
											<Text className='text-sm text-gray-600'>Gas Fee:</Text>
											<Text className='text-sm font-medium text-gray-900'>
												${completedTransaction.gas_fee?.toFixed(4)} ETH
											</Text>
										</View>

										{completedTransaction.platform_fee && (
											<View className='flex-row items-center justify-between mb-2'>
												<Text className='text-sm text-gray-600'>
													Platform Fee:
												</Text>
												<Text className='text-sm font-medium text-gray-900'>
													${completedTransaction.platform_fee.toFixed(4)} USDC
												</Text>
											</View>
										)}
									</>
								)}

								{transactionHash && (
									<View className='pt-3 mt-3 border-t border-gray-300'>
										<Text className='mb-1 text-sm text-gray-600'>
											Transaction Hash:
										</Text>
										<Text
											className='font-mono text-xs text-blue-600'
											numberOfLines={1}
										>
											{transactionHash}
										</Text>

										{completedTransaction?.blockNumber && (
											<>
												<Text className='mt-2 mb-1 text-sm text-gray-600'>
													Block Number:
												</Text>
												<Text className='font-mono text-xs text-gray-800'>
													{completedTransaction.blockNumber}
												</Text>
											</>
										)}

										{completedTransaction?.gasUsed && (
											<>
												<Text className='mt-2 mb-1 text-sm text-gray-600'>
													Gas Used:
												</Text>
												<Text className='font-mono text-xs text-gray-800'>
													{completedTransaction.gasUsed} units
												</Text>
											</>
										)}

										{completedTransaction?.effectiveGasPrice && (
											<>
												<Text className='mt-2 mb-1 text-sm text-gray-600'>
													Gas Price:
												</Text>
												<Text className='font-mono text-xs text-gray-800'>
													{parseFloat(
														completedTransaction.effectiveGasPrice
													).toFixed(8)}{' '}
													ETH/gas
												</Text>
											</>
										)}

										<Text className='mt-2 mb-1 text-sm text-gray-600'>
											Network:
										</Text>
										<Text className='font-mono text-xs text-gray-800'>
											Arbitrum Sepolia
										</Text>
									</View>
								)}
							</View>

							{/* Action Buttons */}
							<View className='w-full space-y-3'>
								<TouchableOpacity
									className='w-full p-4 bg-blue-600 rounded-lg'
									onPress={() => {
										setShowTransactionCompleteModal(false);
										router.replace('/(app)');
									}}
								>
									<Text className='text-lg font-semibold text-center text-white'>
										Go to Home
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									className='w-full p-4 border border-gray-300 rounded-lg'
									onPress={() => {
										setShowTransactionCompleteModal(false);
										router.push('/(app)/transactions');
									}}
								>
									<Text className='text-lg font-semibold text-center text-gray-700'>
										View All Transactions
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Modal>
			</View>
		</KeyboardAvoidingView>
	);
}
