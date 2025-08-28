import React, { useState } from 'react';
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

export default function PaymentScreen() {
	const [mode, setMode] = useState<'scan' | 'qr'>('scan');
	const [permission, requestPermission] = useCameraPermissions();
	const [facing, setFacing] = useState<CameraType>('back');
	const [scanResult, setScanResult] = useState<string | null>(null);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [amount, setAmount] = useState('');
	const [note, setNote] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);
	const [requestAmount, setRequestAmount] = useState('');
	const [requestNote, setRequestNote] = useState('');
	const [showRequestModal, setShowRequestModal] = useState(false);
	const [isScanning, setIsScanning] = useState(true);

	// Mock data
	const mockBalance = '1,234.56';
	const mockWalletAddress = '0x1234...5678';

	const closePaymentModal = () => {
		setShowPaymentModal(false);
		setAmount('');
		setNote('');
		setScanResult(null);
		setIsScanning(true);
	};

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
		if (!isScanning) return;

		console.log('QR Code scanned:', result.data);
		setIsScanning(false);
		setScanResult(result.data);

		// Move parsing logic to services
		setShowPaymentModal(true);
	};

	const handlePayment = async () => {
		if (!amount || parseFloat(amount) <= 0) {
			Alert.alert('Error', 'Please enter a valid amount');
			return;
		}

		setIsProcessing(true);
		try {
			// Move payment logic to services
			console.log('Processing payment:', { amount, note });

			// Simulate payment processing
			await new Promise((resolve) => setTimeout(resolve, 2000));

			Alert.alert('Payment Successful!', `Sent $${amount} successfully`);
			closePaymentModal();
		} catch (error) {
			console.error('Payment error:', error);
			Alert.alert('Error', 'Failed to process payment. Please try again.');
		} finally {
			setIsProcessing(false);
		}
	};

	const generateRequestQR = () => {
		if (!requestAmount || parseFloat(requestAmount) <= 0) {
			Alert.alert('Error', 'Please enter a valid amount');
			return;
		}

		// Move QR generation logic to services
		console.log('Generating QR for request:', { requestAmount, requestNote });
		setShowRequestModal(false);
		Alert.alert('QR Generated', `Generated request QR for $${requestAmount}`);
	};

	return (
		<View className='relative items-center justify-center flex-1 bg-white'>
			{/* Balance Header */}
			<View className='absolute z-10 top-12 left-4 right-4'>
				<View className='p-3 border border-gray-200 rounded-lg bg-white/90 backdrop-blur'>
					<Text className='mb-1 text-xs text-gray-500'>Your Balance</Text>
					<Text className='text-lg font-bold text-gray-800'>
						{mockBalance} USDC
					</Text>
				</View>
			</View>

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
				/>
			)}

			{scanResult && (
				<View className='absolute inset-0 z-30 items-center justify-center'>
					<Ionicons name='checkmark-circle' size={80} color='#16a34a' />
					<Text className='mt-4 text-lg font-bold text-center text-green-600 break-all'>
						QR Code Scanned
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
			)}

			{/* Mode Toggle */}
			<View className='flex-row w-full max-w-xs p-1 mx-auto mt-32 mb-8 bg-gray-100 rounded-full'>
				<TouchableOpacity
					className={`flex-1 items-center py-3 rounded-full ${
						mode === 'scan' ? 'bg-blue-600' : ''
					}`}
					onPress={() => {
						setMode('scan');
						setScanResult(null);
						setIsScanning(true);
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

			{/* Main Content */}
			{mode === 'scan' ? (
				<View className='items-center justify-center flex-1 w-full'>
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
						<Ionicons name='qr-code' size={120} color='#4F46E5' />
						<Text className='mt-2 text-gray-500'>Your QR Code</Text>
					</View>

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
							onPress={() => console.log('Reset QR')}
						>
							<View className='flex-row items-center justify-center'>
								<Ionicons name='refresh' size={20} color='white' />
								<Text className='ml-2 font-semibold text-white'>Reset QR</Text>
							</View>
						</TouchableOpacity>
					</View>

					<Text className='max-w-xs text-base text-center text-gray-500'>
						Let others scan this to pay you any amount
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

					<View className='p-4 mb-6 rounded-lg bg-gray-50'>
						<Text className='text-sm text-gray-600'>Paying to:</Text>
						<Text className='text-lg font-semibold'>Payment Recipient</Text>
					</View>

					<View className='mb-4'>
						<Text className='mb-2 text-sm font-medium text-gray-700'>
							Amount (USDC)
						</Text>
						<View className='flex-row items-center px-3 py-2 border border-gray-300 rounded-lg'>
							<Text className='mr-2 text-lg font-bold text-blue-600'>USDC</Text>
							<TextInput
								placeholder='0.00'
								value={amount}
								onChangeText={setAmount}
								keyboardType='decimal-pad'
								className='flex-1 text-lg'
								placeholderTextColor='#9CA3AF'
							/>
						</View>
						<Text className='mt-1 text-xs text-gray-500'>
							Available: {mockBalance} USDC
						</Text>
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
									Send {amount || '0.00'} USDC
								</Text>
							</View>
						)}
					</TouchableOpacity>
				</View>
			</Modal>

			{/* Request Modal */}
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
							Request Amount (USDC)
						</Text>
						<View className='flex-row items-center px-3 py-2 border border-gray-300 rounded-lg'>
							<Text className='mr-2 text-lg font-bold text-blue-600'>USDC</Text>
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
							Others can scan the generated QR code to pay you the exact amount
							requested
						</Text>
					</View>
				</View>
			</Modal>
		</View>
	);
}
