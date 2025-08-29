import React, { useState, useEffect, useRef } from 'react';
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
import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { useUserProfileStore } from '@/stores/userProfileStore';

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
	const [isMounted, setIsMounted] = useState(true);
	const [cameraKey, setCameraKey] = useState(0);
	const [isCameraActive, setIsCameraActive] = useState(false);
	const [isScreenFocused, setIsScreenFocused] = useState(true);

	const { currentProfile } = useUserProfileStore();

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			setIsMounted(false);
			setIsCameraActive(false);
		};
	}, []);

	// Handle screen focus - kill camera when screen loses focus
	useFocusEffect(
		React.useCallback(() => {
			console.log('🎯 Payment screen focused');
			setIsScreenFocused(true);

			// Reset camera when screen is focused
			if (mode === 'scan') {
				resetCameraInstance();
			}

			return () => {
				console.log('🎯 Payment screen unfocused - killing camera');
				setIsScreenFocused(false);
				setIsCameraActive(false);
				setIsScanning(false);
			};
		}, [mode])
	);

	// Handle app state changes - pause camera when app goes to background
	useEffect(() => {
		const handleAppStateChange = (nextAppState: string) => {
			console.log('📱 App state changed:', nextAppState);

			if (nextAppState === 'background' || nextAppState === 'inactive') {
				console.log('📱 App backgrounded - pausing camera');
				setIsCameraActive(false);
				setIsScanning(false);
			} else if (
				nextAppState === 'active' &&
				isScreenFocused &&
				mode === 'scan'
			) {
				console.log('📱 App foregrounded - resuming camera');
				resetCameraInstance();
			}
		};

		const subscription = AppState.addEventListener(
			'change',
			handleAppStateChange
		);
		return () => subscription?.remove();
	}, [isScreenFocused, mode]);

	// Helper function to close payment modal and reset scanning
	const closePaymentModal = () => {
		if (!isMounted) return;

		setShowPaymentModal(false);
		setPaymentData(null);
		setAmount('');
		setNote('');
		setScanResult(null);
		setIsScanning(true);
	};

	// Helper function to reset camera instance
	const resetCameraInstance = () => {
		if (!isMounted || !isScreenFocused) return;

		console.log('📸 Resetting camera instance');

		// Kill current camera
		setIsCameraActive(false);
		setIsScanning(false);

		// Generate new camera key to force re-render
		setCameraKey((prev) => prev + 1);

		// Delay activation to ensure clean reset
		setTimeout(() => {
			if (isMounted && isScreenFocused && mode === 'scan') {
				console.log('📸 Activating fresh camera instance');
				setIsCameraActive(true);
				setIsScanning(true);
			}
		}, 200);
	};

	// Helper function to safely reset scan state
	const resetScanState = () => {
		if (!isMounted) return;

		console.log('🔄 Resetting scan state');
		setScanResult(null);
		setPaymentData(null);
		setAmount('');
		setNote('');
		setShowPaymentModal(false);

		// Reset camera if in scan mode
		if (mode === 'scan' && isScreenFocused) {
			resetCameraInstance();
		}
	};

	// Generate default QR code (for receiving payments)
	const generateDefaultQR = () => {
		if (!currentProfile || !isMounted) {
			console.log(
				'🔍 [Payment] Waiting for user profile or component unmounted...'
			);
			return;
		}

		const userName =
			currentProfile.display_name || currentProfile.full_name || 'User';
		const userWallet = currentProfile.wallet_address || '0x1234...5678';

		const paymentRequest = {
			type: 'payment_request',
			amount: 0, // Default amount (user can specify)
			currency: 'USD',
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
		if (!isMounted) return;

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
			currency: 'USD',
			description: requestNote.trim() || `Payment request from ${userName}`,
			recipient: userWallet,
			recipientName: userName,
			userId: currentProfile.id || '',
			timestamp: Date.now(),
			requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		};

		if (isMounted) {
			setQrData(JSON.stringify(paymentRequest));
			setShowRequestModal(false);

			Alert.alert(
				'Payment Request QR Generated',
				`Generated QR code requesting $${requestAmount} ${
					requestNote ? `for "${requestNote}"` : ''
				}`
			);
		}
	};

	// Handle mode changes and camera activation
	useEffect(() => {
		if (!isMounted || !isScreenFocused) return;

		if (mode === 'scan') {
			console.log('📸 Mode is scan - activating camera');
			// Delay camera activation slightly to ensure clean state
			const timer = setTimeout(() => {
				if (isMounted && isScreenFocused && mode === 'scan') {
					resetCameraInstance();
				}
			}, 100);
			return () => clearTimeout(timer);
		} else {
			console.log('📸 Mode is not scan - deactivating camera');
			setIsCameraActive(false);
			setIsScanning(false);
		}
	}, [mode, isMounted, isScreenFocused]);

	// Load default QR when switching to QR mode
	useEffect(() => {
		if (isMounted && mode === 'qr' && currentProfile && !qrData) {
			generateDefaultQR();
		}
	}, [mode, currentProfile, isMounted]);

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
		// Prevent multiple scans and check if component is still mounted
		if (!isScanning || !isMounted || !isCameraActive || !result?.data) {
			console.log('🔍 QR scan ignored - invalid state');
			return;
		}

		console.log('🔍 QR Code scanned:', result.data);

		// Temporarily pause camera to prevent multiple scans
		setIsCameraActive(false);

		// Safely update state
		if (isMounted) {
			setIsScanning(false);
			setScanResult(result.data);
		}

		try {
			// Try to parse as payment request
			const paymentRequest = JSON.parse(result.data);

			if (paymentRequest && paymentRequest.type === 'payment_request') {
				console.log('✅ Valid payment request found:', paymentRequest);

				if (!isMounted) return; // Check again before updating state

				setPaymentData(paymentRequest);

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
				if (isMounted) {
					Alert.alert('QR Code Scanned', `Unsupported format: ${result.data}`);
					// Re-enable scanning on error
					resetScanState();
				}
			}
		} catch (error) {
			console.error('❌ QR parsing error:', error);
			if (isMounted) {
				Alert.alert('Invalid QR Code', 'Could not parse QR code data');
				// Re-enable scanning on error
				resetScanState();
			}
		}
	};

	const handlePayment = async () => {
		if (!amount || parseFloat(amount) <= 0) {
			Alert.alert('Error', 'Please enter a valid amount');
			return;
		}

		setIsProcessing(true);
		try {
			console.log('🚀 Processing payment...');

			// Simulate payment processing
			await new Promise((resolve) => setTimeout(resolve, 2000));

			Alert.alert(
				'Payment Successful!',
				`Successfully sent $${amount} to ${paymentData?.recipientName || 'recipient'}`
			);

			// Reset modal
			closePaymentModal();
		} catch (error) {
			console.error('❌ Error processing payment:', error);
			Alert.alert('Error', 'Failed to process payment. Please try again.');
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
				<View className='flex-row w-full max-w-xs p-1 mx-auto bg-gray-100 rounded-full mt-16 mb-8'>
					<TouchableOpacity
						className={`flex-1 items-center py-3 rounded-full ${
							mode === 'scan' ? 'bg-blue-600' : ''
						}`}
						onPress={() => {
							if (isMounted && mode !== 'scan') {
								console.log('🔄 Switching to scan mode');
								setMode('scan');
								setIsCameraActive(false); // Kill current camera first
								resetScanState();
							}
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
						onPress={() => {
							if (isMounted && mode !== 'qr') {
								console.log('🔄 Switching to QR mode');
								setIsCameraActive(false); // Kill camera when switching to QR mode
								setIsScanning(false);
								setMode('qr');
								resetScanState();
							}
						}}
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
						{/* Camera View for Scan Mode */}
						{!scanResult && isCameraActive && (
							<CameraView
								key={`camera-${cameraKey}`} // Force re-render with new key
								barcodeScannerSettings={{
									barcodeTypes: ['qr'],
								}}
								onBarcodeScanned={
									isScanning && isCameraActive ? handleQRCodeScanned : undefined
								}
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

						{/* Camera Loading State */}
						{!scanResult && !isCameraActive && mode === 'scan' && (
							<View className='absolute inset-0 items-center justify-center bg-black'>
								<ActivityIndicator size='large' color='#ffffff' />
								<Text className='mt-4 text-white'>Initializing Camera...</Text>
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
											setIsScanning(true);
										}}
									>
										<Text className='font-semibold text-white'>Scan Again</Text>
									</TouchableOpacity>
								</View>
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
										borderColor: '#4F46E5',
									}}
								/>
							</View>
							<Text className='z-20 text-base text-white'>
								Point your camera at a QR code to pay
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
										{paymentData.recipientName || 'Unknown User'}
									</Text>
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
									Amount (USD)
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
											Send ${amount || '0.00'}
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
									Request Amount (USD)
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
			</View>
		</KeyboardAvoidingView>
	);
}
