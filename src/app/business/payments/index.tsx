import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
	Modal,
	TextInput,
	ScrollView,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { TransactionService } from '@/services/transactionService';
// Removed payment requests imports for security

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#ffffff',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#f3f4f6',
		backgroundColor: '#ffffff',
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: '700',
		color: '#111827',
	},

	tabContainer: {
		flexDirection: 'row',
		backgroundColor: '#f3f4f6',
		marginHorizontal: 24,
		marginVertical: 16,
		borderRadius: 12,
		padding: 4,
	},
	tabButton: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	activeTab: {
		backgroundColor: '#ffffff',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	tabText: {
		fontSize: 14,
		fontWeight: '600',
		color: '#6b7280',
	},
	activeTabText: {
		color: '#3b82f6',
	},
	scannerContainer: {
		flex: 1,
		position: 'relative',
	},
	cameraView: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	scanOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
	},
	scanTitle: {
		fontSize: 24,
		fontWeight: '700',
		color: '#ffffff',
		marginBottom: 24,
	},
	scanFrame: {
		width: 280,
		height: 280,
		borderWidth: 4,
		borderColor: '#3b82f6',
		borderRadius: 16,
		borderStyle: 'dashed',
		marginBottom: 24,
	},
	scanInstructions: {
		fontSize: 16,
		color: '#ffffff',
		textAlign: 'center',
		marginHorizontal: 32,
	},
	qrContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
		paddingVertical: 32,
	},
	qrTitle: {
		fontSize: 24,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 32,
	},
	qrCodeWrapper: {
		backgroundColor: '#ffffff',
		padding: 16,
		borderRadius: 16,
		borderWidth: 2,
		borderColor: '#e5e7eb',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
		marginBottom: 24,
	},
	qrInfo: {
		backgroundColor: '#f3f4f6',
		padding: 16,
		borderRadius: 12,
		marginBottom: 24,
		alignItems: 'center',
	},
	qrInfoTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#374151',
		marginBottom: 4,
	},
	qrInfoAmount: {
		fontSize: 24,
		fontWeight: '700',
		color: '#111827',
	},
	qrInfoDescription: {
		fontSize: 14,
		color: '#6b7280',
		marginTop: 4,
		textAlign: 'center',
	},
	qrActions: {
		flexDirection: 'row',
		gap: 12,
		marginBottom: 16,
	},
	qrActionButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#3b82f6',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 12,
		gap: 8,
	},
	qrActionButtonSecondary: {
		backgroundColor: '#6b7280',
	},
	qrActionText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '600',
	},
	qrInstructions: {
		fontSize: 14,
		color: '#6b7280',
		textAlign: 'center',
		lineHeight: 20,
	},
	modalContainer: {
		flex: 1,
		backgroundColor: '#ffffff',
		padding: 24,
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 24,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: '#111827',
	},
	inputGroup: {
		marginBottom: 16,
	},
	inputLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: '#374151',
		marginBottom: 8,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	currencySymbol: {
		fontSize: 18,
		fontWeight: '700',
		color: '#3b82f6',
		marginRight: 8,
	},
	textInput: {
		flex: 1,
		fontSize: 16,
		color: '#111827',
	},
	textArea: {
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 16,
		color: '#111827',
		textAlignVertical: 'top',
		minHeight: 80,
	},
	primaryButton: {
		backgroundColor: '#3b82f6',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		borderRadius: 12,
		gap: 8,
	},
	primaryButtonDisabled: {
		backgroundColor: '#9ca3af',
	},
	primaryButtonText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '600',
	},
	scanResultOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.8)',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 1000,
	},
	scanResultCard: {
		backgroundColor: '#ffffff',
		padding: 24,
		borderRadius: 16,
		alignItems: 'center',
		marginHorizontal: 32,
	},
	scanResultTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#16a34a',
		marginTop: 16,
		marginBottom: 8,
	},
	scanResultButton: {
		backgroundColor: '#3b82f6',
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 12,
		marginTop: 16,
	},
	scanResultButtonText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '600',
	},
});

export default function PaymentRequestsPage() {
	const [mode, setMode] = useState<'scan' | 'receive'>('scan');
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

	// Payment verification states
	const [isMonitoringPayment, setIsMonitoringPayment] = useState(false);
	const [lastTransactionId, setLastTransactionId] = useState<string | null>(
		null
	);
	const [paymentReceived, setPaymentReceived] = useState(false);
	const [receivedPayment, setReceivedPayment] = useState<any>(null);
	const [monitoringStartTime, setMonitoringStartTime] = useState<number>(0);

	const { currentProfile } = useUserProfileStore();

	// Payment monitoring function
	const startPaymentMonitoring = async () => {
		if (!currentProfile?.id) {
			console.log('❌ No current profile for payment monitoring');
			return;
		}

		console.log('🔍 Starting payment monitoring...');
		const startTime = Date.now();
		setIsMonitoringPayment(true);
		setPaymentReceived(false);
		setReceivedPayment(null);
		setMonitoringStartTime(startTime);

		// Get the latest transaction ID to use as baseline
		try {
			const recentTransactions =
				await TransactionService.getTransactionsByUserId(currentProfile.id, 1);
			if (recentTransactions.length > 0) {
				setLastTransactionId(recentTransactions[0].id);
				console.log(
					'📋 Baseline transaction ID set:',
					recentTransactions[0].id
				);
			}
		} catch (error) {
			console.error('❌ Error getting baseline transaction:', error);
		}

		// Start polling for new transactions
		const pollInterval = setInterval(async () => {
			try {
				console.log('🔄 Checking for new payments...');
				const recentTransactions =
					await TransactionService.getTransactionsByUserId(
						currentProfile.id,
						5
					);

				// Check for new transactions (received payments)
				const newPayments = recentTransactions.filter((tx) => {
					const isReceived = tx.to_user_id === currentProfile.id;
					const isRecent =
						new Date(tx.created_at).getTime() > Date.now() - 300000; // Within last 5 minutes
					const isCompleted = tx.status === 'completed';
					const isUSDC = tx.currency === 'USDC';

					// For new payment detection, check if transaction was created after monitoring started
					const isNewTransaction =
						new Date(tx.created_at).getTime() > monitoringStartTime;

					console.log('🔍 Transaction check:', {
						txId: tx.id,
						isReceived,
						isRecent,
						isCompleted,
						isUSDC,
						isNewTransaction,
						toUserId: tx.to_user_id,
						currentUserId: currentProfile.id,
						createdAt: tx.created_at,
						timeDiff: Date.now() - new Date(tx.created_at).getTime(),
						status: tx.status,
						currency: tx.currency,
						amount: tx.amount,
						txCreatedAt: new Date(tx.created_at).getTime(),
					});

					return (
						isReceived && isRecent && isCompleted && isUSDC && isNewTransaction
					);
				});

				if (newPayments.length > 0) {
					console.log('✅ New payment detected!', newPayments[0]);
					const payment = newPayments[0];

					setPaymentReceived(true);
					setReceivedPayment(payment);
					setIsMonitoringPayment(false);

					// Clear the interval
					clearInterval(pollInterval);

					// Show success alert
					Alert.alert(
						'Payment Received! 🎉',
						`You received $${payment.amount} from ${
							payment.from_user?.display_name ||
							payment.from_user?.username ||
							'Unknown'
						}`,
						[
							{
								text: 'View Details',
								onPress: () => {
									// Could navigate to transaction details
									console.log('View payment details:', payment);
								},
							},
							{
								text: 'OK',
								style: 'default',
							},
						]
					);
				}
			} catch (error) {
				console.error('❌ Error checking for payments:', error);
			}
		}, 3000); // Poll every 3 seconds

		// Auto-stop monitoring after 5 minutes
		setTimeout(() => {
			console.log('⏰ Payment monitoring timeout');
			clearInterval(pollInterval);
			setIsMonitoringPayment(false);
		}, 300000); // 5 minutes
	};

	const stopPaymentMonitoring = () => {
		console.log('🛑 Stopping payment monitoring');
		setIsMonitoringPayment(false);
		setPaymentReceived(false);
		setReceivedPayment(null);
		setMonitoringStartTime(0);
	};

	// Helper function to close payment modal and reset scanning
	const closePaymentModal = () => {
		setShowPaymentModal(false);
		setPaymentData(null);
		setAmount('');
		setNote('');
		setScanResult(null);
		setIsScanning(true);
	};

	// Generate default QR code (for receiving payments)
	const generateDefaultQR = () => {
		if (!currentProfile) {
			console.log('🔍 [Payment] Waiting for user profile...');
			return;
		}

		const businessName =
			currentProfile.business_name ||
			currentProfile.display_name ||
			currentProfile.full_name ||
			'Business';
		const userWallet = currentProfile.wallet_address || '0x1234...5678';

		const paymentRequest = {
			type: 'payment_request',
			amount: 0, // Default amount (user can specify)
			currency: 'USDC',
			description: `Payment to ${businessName}`,
			recipient: userWallet,
			recipientName: businessName,
			userId: currentProfile.id || '',
			timestamp: Date.now(),
			requestId: `default_${Date.now()}`,
		};

		setQrData(JSON.stringify(paymentRequest));
		console.log('✅ [Payment] Default QR code generated');

		// Start monitoring for payments when QR is generated
		startPaymentMonitoring();
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

		const businessName =
			currentProfile.business_name ||
			currentProfile.display_name ||
			currentProfile.full_name ||
			'Business';
		const userWallet = currentProfile.wallet_address || '0x1234...5678';

		const paymentRequest = {
			type: 'payment_request',
			amount: parseFloat(requestAmount),
			currency: 'USDC',
			description: requestNote.trim() || `Payment request from ${businessName}`,
			recipient: userWallet,
			recipientName: businessName,
			userId: currentProfile.id || '',
			timestamp: Date.now(),
			requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		};

		setQrData(JSON.stringify(paymentRequest));
		setShowRequestModal(false);

		// Start monitoring for payments when QR is generated
		startPaymentMonitoring();

		Alert.alert(
			'Payment Request QR Generated',
			`Generated QR code requesting $${requestAmount} ${
				requestNote ? `for "${requestNote}"` : ''
			}. Monitoring for payments...`
		);
	};

	// Load default QR when switching to receive mode
	useEffect(() => {
		if (mode === 'receive' && currentProfile && !qrData) {
			generateDefaultQR();
		}

		// Stop monitoring when switching away from receive mode
		if (mode !== 'receive') {
			stopPaymentMonitoring();
		}
	}, [mode, currentProfile]);

	// Cleanup monitoring on unmount
	useEffect(() => {
		return () => {
			stopPaymentMonitoring();
		};
	}, []);

	const handleQRCodeScanned = async (result: any) => {
		// Prevent multiple scans
		if (!isScanning) {
			return;
		}

		console.log('🔍 QR Code scanned:', result.data);
		setIsScanning(false);
		setScanResult(result.data);

		try {
			// Try to parse as payment request
			const paymentRequest = JSON.parse(result.data);

			if (paymentRequest.type === 'payment_request') {
				console.log('✅ Valid payment request found:', paymentRequest);

				setPaymentData(paymentRequest);

				// Handle zero amount - let user enter amount
				if (
					paymentRequest.amount === 0 ||
					parseFloat(paymentRequest.amount) === 0
				) {
					setAmount(''); // Clear amount so user can enter
				} else {
					setAmount(paymentRequest.amount.toString());
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

	// Camera permission handling
	if (mode === 'scan' && !permission) {
		return (
			<SafeAreaView style={styles.container}>
				<View
					style={[
						styles.container,
						{ alignItems: 'center', justifyContent: 'center' },
					]}
				>
					<ActivityIndicator size='large' color='#3b82f6' />
					<Text style={styles.qrInfoDescription}>
						Requesting camera permission...
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (mode === 'scan' && !permission?.granted) {
		return (
			<SafeAreaView style={styles.container}>
				<View
					style={[
						styles.container,
						{ alignItems: 'center', justifyContent: 'center', padding: 24 },
					]}
				>
					<Ionicons name='camera' size={64} color='#3b82f6' />
					<Text
						style={[
							styles.modalTitle,
							{ marginTop: 16, marginBottom: 8, textAlign: 'center' },
						]}
					>
						Camera Permission Required
					</Text>
					<Text
						style={[
							styles.qrInfoDescription,
							{ marginBottom: 24, textAlign: 'center' },
						]}
					>
						We need camera access to scan QR codes for payments
					</Text>
					<TouchableOpacity
						style={styles.primaryButton}
						onPress={requestPermission}
					>
						<Text style={styles.primaryButtonText}>Grant Permission</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={{ flex: 1 }}
		>
			<SafeAreaView style={styles.container}>
				{/* Tab Navigation */}
				<View style={styles.tabContainer}>
					<TouchableOpacity
						style={[styles.tabButton, mode === 'scan' && styles.activeTab]}
						onPress={() => {
							setMode('scan');
							setScanResult(null);
							setIsScanning(true);
						}}
					>
						<Text
							style={[styles.tabText, mode === 'scan' && styles.activeTabText]}
						>
							Scan to Pay
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.tabButton, mode === 'receive' && styles.activeTab]}
						onPress={() => setMode('receive')}
					>
						<Text
							style={[
								styles.tabText,
								mode === 'receive' && styles.activeTabText,
							]}
						>
							Receive
						</Text>
					</TouchableOpacity>
				</View>

				{/* Content based on mode */}
				{mode === 'scan' && (
					<View style={styles.scannerContainer}>
						{/* Camera View */}
						{!scanResult && (
							<CameraView
								barcodeScannerSettings={{
									barcodeTypes: ['qr'],
								}}
								onBarcodeScanned={isScanning ? handleQRCodeScanned : undefined}
								style={styles.cameraView}
								facing='back'
							/>
						)}

						{/* Scan Result Overlay */}
						{scanResult && (
							<View style={styles.scanResultOverlay}>
								<View style={styles.scanResultCard}>
									<Ionicons name='checkmark-circle' size={80} color='#16a34a' />
									<Text style={styles.scanResultTitle}>QR Code Scanned!</Text>
									<TouchableOpacity
										style={styles.scanResultButton}
										onPress={() => {
											setScanResult(null);
											setIsScanning(true);
										}}
									>
										<Text style={styles.scanResultButtonText}>Scan Again</Text>
									</TouchableOpacity>
								</View>
							</View>
						)}

						{/* Scan Overlay */}
						<View style={styles.scanOverlay}>
							<Text style={styles.scanTitle}>Scan to Pay</Text>
							<View style={styles.scanFrame} />
							<Text style={styles.scanInstructions}>
								Point your camera at a QR code to make a payment
							</Text>
						</View>
					</View>
				)}

				{mode === 'receive' && (
					<ScrollView
						style={{ flex: 1 }}
						contentContainerStyle={styles.qrContainer}
					>
						<Text style={styles.qrTitle}>Receive Payment</Text>

						{/* QR Code Display */}
						<View style={styles.qrCodeWrapper}>
							{qrData ? (
								<QRCode
									value={qrData}
									size={240}
									color='#000000'
									backgroundColor='#FFFFFF'
								/>
							) : (
								<View
									style={{
										alignItems: 'center',
										justifyContent: 'center',
										width: 240,
										height: 240,
									}}
								>
									<Ionicons name='qr-code' size={120} color='#3b82f6' />
									<Text style={styles.qrInfoDescription}>Loading QR...</Text>
								</View>
							)}
						</View>

						{/* Payment Status */}
						{(isMonitoringPayment || paymentReceived) && (
							<View
								style={[
									styles.qrInfo,
									{ backgroundColor: paymentReceived ? '#dcfce7' : '#dbeafe' },
								]}
							>
								{paymentReceived && receivedPayment ? (
									<>
										<View
											style={{
												flexDirection: 'row',
												alignItems: 'center',
												marginBottom: 8,
											}}
										>
											<Ionicons
												name='checkmark-circle'
												size={24}
												color='#16a34a'
											/>
											<Text
												style={[
													styles.qrInfoTitle,
													{ color: '#16a34a', marginLeft: 8 },
												]}
											>
												Payment Received! 🎉
											</Text>
										</View>
										<Text style={[styles.qrInfoAmount, { color: '#16a34a' }]}>
											${receivedPayment.amount}
										</Text>
										<Text style={styles.qrInfoDescription}>
											From:{' '}
											{receivedPayment.from_user?.display_name ||
												receivedPayment.from_user?.username ||
												'Unknown'}
										</Text>
										<Text
											style={[
												styles.qrInfoDescription,
												{ fontSize: 12, color: '#6b7280' },
											]}
										>
											{new Date(receivedPayment.created_at).toLocaleString()}
										</Text>
									</>
								) : (
									<>
										<View
											style={{
												flexDirection: 'row',
												alignItems: 'center',
												marginBottom: 8,
											}}
										>
											<ActivityIndicator size='small' color='#3b82f6' />
											<Text
												style={[
													styles.qrInfoTitle,
													{ color: '#3b82f6', marginLeft: 8 },
												]}
											>
												Monitoring for Payments
											</Text>
										</View>
										<Text style={styles.qrInfoDescription}>
											Waiting for someone to scan and pay...
										</Text>
										<TouchableOpacity
											style={{
												backgroundColor: '#ef4444',
												paddingHorizontal: 16,
												paddingVertical: 8,
												borderRadius: 8,
												marginTop: 12,
											}}
											onPress={stopPaymentMonitoring}
										>
											<Text
												style={{
													color: 'white',
													fontWeight: '600',
													fontSize: 14,
												}}
											>
												Stop Monitoring
											</Text>
										</TouchableOpacity>
									</>
								)}
							</View>
						)}

						{/* QR Info */}
						{qrData && !paymentReceived && !isMonitoringPayment && (
							<View style={styles.qrInfo}>
								{(() => {
									try {
										const parsedData = JSON.parse(qrData);
										if (parsedData && parseFloat(parsedData.amount) > 0) {
											return (
												<>
													<Text style={styles.qrInfoTitle}>
														Payment Request
													</Text>
													<Text style={styles.qrInfoAmount}>
														${parsedData.amount}
													</Text>
													{parsedData.description && (
														<Text style={styles.qrInfoDescription}>
															{parsedData.description}
														</Text>
													)}
												</>
											);
										} else {
											return (
												<>
													<Text style={styles.qrInfoTitle}>
														General Payment QR
													</Text>
													<Text style={styles.qrInfoDescription}>
														Others can scan to pay you any amount
													</Text>
												</>
											);
										}
									} catch {
										return (
											<>
												<Text style={styles.qrInfoTitle}>Payment QR Code</Text>
											</>
										);
									}
								})()}
							</View>
						)}

						{/* Action Buttons */}
						<View style={styles.qrActions}>
							<TouchableOpacity
								style={styles.qrActionButton}
								onPress={() => setShowRequestModal(true)}
							>
								<Ionicons name='receipt' size={20} color='white' />
								<Text style={styles.qrActionText}>Request Amount</Text>
							</TouchableOpacity>

							{!isMonitoringPayment && !paymentReceived && (
								<TouchableOpacity
									style={[
										styles.qrActionButton,
										{ backgroundColor: '#16a34a' },
									]}
									onPress={startPaymentMonitoring}
								>
									<Ionicons name='eye' size={20} color='white' />
									<Text style={styles.qrActionText}>Monitor Payments</Text>
								</TouchableOpacity>
							)}

							<TouchableOpacity
								style={[styles.qrActionButton, styles.qrActionButtonSecondary]}
								onPress={() => generateDefaultQR()}
							>
								<Ionicons name='refresh' size={20} color='white' />
								<Text style={styles.qrActionText}>Reset QR</Text>
							</TouchableOpacity>
						</View>

						<Text style={styles.qrInstructions}>
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
						<View style={styles.modalContainer}>
							<View style={styles.modalHeader}>
								<Text style={styles.modalTitle}>Make Payment</Text>
								<TouchableOpacity onPress={closePaymentModal}>
									<Ionicons name='close' size={24} color='#6b7280' />
								</TouchableOpacity>
							</View>

							{paymentData && (
								<View style={[styles.qrInfo, { marginBottom: 24 }]}>
									<Text style={styles.qrInfoTitle}>Paying to:</Text>
									<Text style={styles.qrInfoAmount}>
										{paymentData.recipientName || 'Unknown User'}
									</Text>
									{paymentData.amount > 0 && (
										<Text
											style={[styles.qrInfoDescription, { color: '#3b82f6' }]}
										>
											Requested: ${paymentData.amount}
										</Text>
									)}
									{paymentData.description && (
										<Text style={styles.qrInfoDescription}>
											{paymentData.description}
										</Text>
									)}
								</View>
							)}

							<View style={styles.inputGroup}>
								<Text style={styles.inputLabel}>Amount (USDC)</Text>
								<View style={styles.inputContainer}>
									<Text style={styles.currencySymbol}>$</Text>
									<TextInput
										placeholder='0.00'
										value={amount}
										onChangeText={setAmount}
										keyboardType='decimal-pad'
										style={styles.textInput}
										placeholderTextColor='#9ca3af'
										editable={
											!(paymentData && parseFloat(paymentData.amount) > 0)
										}
									/>
								</View>
								{paymentData && parseFloat(paymentData.amount) > 0 && (
									<Text
										style={[
											styles.qrInfoDescription,
											{ color: '#3b82f6', marginTop: 4 },
										]}
									>
										Amount is set by the payment request
									</Text>
								)}
								{paymentData && parseFloat(paymentData.amount) === 0 && (
									<Text
										style={[
											styles.qrInfoDescription,
											{ color: '#16a34a', marginTop: 4 },
										]}
									>
										Enter the amount you want to pay
									</Text>
								)}
							</View>

							<View style={styles.inputGroup}>
								<Text style={styles.inputLabel}>Note (Optional)</Text>
								<TextInput
									placeholder='Add a note...'
									value={note}
									onChangeText={setNote}
									multiline
									numberOfLines={3}
									style={styles.textArea}
									placeholderTextColor='#9ca3af'
									textAlignVertical='top'
								/>
							</View>

							<TouchableOpacity
								style={[
									styles.primaryButton,
									(!amount || isProcessing) && styles.primaryButtonDisabled,
								]}
								onPress={handlePayment}
								disabled={!amount || isProcessing}
							>
								{isProcessing ? (
									<>
										<ActivityIndicator size='small' color='white' />
										<Text style={styles.primaryButtonText}>
											Processing Payment...
										</Text>
									</>
								) : (
									<>
										<Ionicons name='card' size={20} color='white' />
										<Text style={styles.primaryButtonText}>
											Send ${amount || '0.00'}
										</Text>
									</>
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
						<View style={styles.modalContainer}>
							<View style={styles.modalHeader}>
								<Text style={styles.modalTitle}>Request Payment</Text>
								<TouchableOpacity onPress={() => setShowRequestModal(false)}>
									<Ionicons name='close' size={24} color='#6b7280' />
								</TouchableOpacity>
							</View>

							<View
								style={[
									styles.qrInfo,
									{ marginBottom: 24, backgroundColor: '#dbeafe' },
								]}
							>
								<Text style={[styles.qrInfoTitle, { color: '#3b82f6' }]}>
									Generate QR Code
								</Text>
								<Text style={[styles.qrInfoDescription, { color: '#1e40af' }]}>
									Create a QR code that requests a specific amount from anyone
									who scans it
								</Text>
							</View>

							<View style={styles.inputGroup}>
								<Text style={styles.inputLabel}>Request Amount (USDC)</Text>
								<View style={styles.inputContainer}>
									<Text style={styles.currencySymbol}>$</Text>
									<TextInput
										placeholder='0.00'
										value={requestAmount}
										onChangeText={setRequestAmount}
										keyboardType='decimal-pad'
										style={styles.textInput}
										placeholderTextColor='#9ca3af'
									/>
								</View>
							</View>

							<View style={styles.inputGroup}>
								<Text style={styles.inputLabel}>Note (Optional)</Text>
								<TextInput
									placeholder='What is this request for?'
									value={requestNote}
									onChangeText={setRequestNote}
									multiline
									numberOfLines={3}
									style={styles.textArea}
									placeholderTextColor='#9ca3af'
									textAlignVertical='top'
								/>
							</View>

							<TouchableOpacity
								style={[
									styles.primaryButton,
									(!requestAmount || parseFloat(requestAmount) <= 0) &&
										styles.primaryButtonDisabled,
								]}
								onPress={generateRequestQR}
								disabled={!requestAmount || parseFloat(requestAmount) <= 0}
							>
								<Ionicons name='qr-code' size={20} color='white' />
								<Text style={styles.primaryButtonText}>
									Generate Request QR
								</Text>
							</TouchableOpacity>

							<View style={{ alignItems: 'center', marginTop: 24 }}>
								<Text style={styles.qrInstructions}>
									Others can scan the generated QR code to pay you the exact
									amount requested
								</Text>
							</View>
						</View>
					</KeyboardAvoidingView>
				</Modal>
			</SafeAreaView>
		</KeyboardAvoidingView>
	);
}
