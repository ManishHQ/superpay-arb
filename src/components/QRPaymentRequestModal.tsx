import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	Modal,
	TouchableOpacity,
	StyleSheet,
	TextInput,
	Alert,
	Share,
	ScrollView,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useUserProfileStore } from '@/stores/userProfileStore';

interface QRPaymentRequestModalProps {
	visible: boolean;
	onClose: () => void;
}

const styles = StyleSheet.create({
	overlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 1000,
	},
	modal: {
		backgroundColor: '#ffffff',
		borderRadius: 20,
		padding: 24,
		width: '90%',
		maxWidth: 400,
		maxHeight: '80%',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 24,
	},
	title: {
		fontSize: 20,
		fontWeight: '700',
		color: '#111827',
	},
	closeButton: {
		padding: 4,
	},
	form: {
		marginBottom: 24,
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
		color: '#374151',
		marginBottom: 8,
	},
	input: {
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 12,
		padding: 16,
		fontSize: 16,
		marginBottom: 16,
		backgroundColor: '#f9fafb',
	},
	currencyInput: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 12,
		backgroundColor: '#f9fafb',
		marginBottom: 16,
	},
	currencySymbol: {
		paddingLeft: 16,
		fontSize: 16,
		color: '#6b7280',
		fontWeight: '600',
	},
	amountInput: {
		flex: 1,
		padding: 16,
		fontSize: 16,
	},
	qrContainer: {
		alignItems: 'center',
		marginBottom: 24,
		padding: 20,
		backgroundColor: '#f9fafb',
		borderRadius: 16,
	},
	qrCode: {
		marginBottom: 16,
	},
	qrLabel: {
		fontSize: 14,
		color: '#6b7280',
		textAlign: 'center',
		marginBottom: 12,
	},
	paymentInfo: {
		backgroundColor: '#ffffff',
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#e5e7eb',
		marginBottom: 16,
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	infoLabel: {
		fontSize: 14,
		color: '#6b7280',
	},
	infoValue: {
		fontSize: 14,
		fontWeight: '600',
		color: '#111827',
	},
	buttons: {
		flexDirection: 'row',
		gap: 12,
	},
	button: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 16,
		borderRadius: 12,
		gap: 8,
	},
	primaryButton: {
		backgroundColor: '#2563eb',
	},
	secondaryButton: {
		backgroundColor: '#f3f4f6',
		borderWidth: 1,
		borderColor: '#d1d5db',
	},
	buttonText: {
		fontSize: 16,
		fontWeight: '600',
	},
	primaryButtonText: {
		color: '#ffffff',
	},
	secondaryButtonText: {
		color: '#374151',
	},
	generateButton: {
		backgroundColor: '#16a34a',
		padding: 16,
		borderRadius: 12,
		alignItems: 'center',
		marginTop: 8,
	},
	generateButtonText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '600',
	},
});

export const QRPaymentRequestModal: React.FC<QRPaymentRequestModalProps> = ({
	visible,
	onClose,
}) => {
	const { currentProfile } = useUserProfileStore();
	const [amount, setAmount] = useState('');
	const [description, setDescription] = useState('');
	const [recipientEmail, setRecipientEmail] = useState('');
	const [qrData, setQrData] = useState<string | null>(null);
	const [showQR, setShowQR] = useState(false);

	const businessName =
		currentProfile?.business_name || currentProfile?.display_name || 'Business';
	const businessEmail = currentProfile?.email || '';

	const resetForm = () => {
		setAmount('');
		setDescription('');
		setRecipientEmail('');
		setQrData(null);
		setShowQR(false);
	};

	const generateQRCode = () => {
		if (!amount || parseFloat(amount) <= 0) {
			Alert.alert('Error', 'Please enter a valid amount');
			return;
		}

		const paymentRequest = {
			type: 'payment_request',
			amount: parseFloat(amount),
			currency: 'USD',
			description: description || 'Payment Request',
			recipient: businessEmail,
			recipientName: businessName,
			timestamp: Date.now(),
			requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		};

		setQrData(JSON.stringify(paymentRequest));
		setShowQR(true);
	};

	const shareQRCode = async () => {
		if (!qrData) return;

		const paymentData = JSON.parse(qrData);
		const shareMessage = `Payment Request from ${businessName}\n\nAmount: $${paymentData.amount}\nDescription: ${paymentData.description}\n\nScan the QR code to pay quickly and securely.`;

		try {
			await Share.share({
				message: shareMessage,
				title: 'Payment Request',
			});
		} catch (error) {
			console.error('Error sharing:', error);
		}
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	useEffect(() => {
		if (!visible) {
			resetForm();
		}
	}, [visible]);

	return (
		<Modal visible={visible} transparent animationType='fade'>
			<View style={styles.overlay}>
				<View style={styles.modal}>
					<KeyboardAvoidingView
						behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
						style={{ flex: 1 }}
					>
						<ScrollView
							contentContainerStyle={{ flexGrow: 1 }}
							keyboardShouldPersistTaps='handled'
							showsVerticalScrollIndicator={false}
						>
							<View style={styles.header}>
								<Text style={styles.title}>Request Payment</Text>
								<TouchableOpacity
									style={styles.closeButton}
									onPress={handleClose}
								>
									<Ionicons name='close' size={24} color='#6b7280' />
								</TouchableOpacity>
							</View>

							{!showQR ? (
								<>
									<View style={styles.form}>
										<Text style={styles.label}>Amount *</Text>
										<View style={styles.currencyInput}>
											<Text style={styles.currencySymbol}>$</Text>
											<TextInput
												style={styles.amountInput}
												value={amount}
												onChangeText={setAmount}
												placeholder='0.00'
												keyboardType='numeric'
												returnKeyType='next'
											/>
										</View>

										<Text style={styles.label}>Description</Text>
										<TextInput
											style={styles.input}
											value={description}
											onChangeText={setDescription}
											placeholder='Payment for...'
											returnKeyType='next'
											multiline
											numberOfLines={2}
										/>

										<Text style={styles.label}>Customer Email (Optional)</Text>
										<TextInput
											style={styles.input}
											value={recipientEmail}
											onChangeText={setRecipientEmail}
											placeholder='customer@example.com'
											keyboardType='email-address'
											returnKeyType='done'
											autoCapitalize='none'
										/>
									</View>

									<TouchableOpacity
										style={styles.generateButton}
										onPress={generateQRCode}
									>
										<Text style={styles.generateButtonText}>
											Generate QR Code
										</Text>
									</TouchableOpacity>
								</>
							) : (
								<>
									<View style={styles.qrContainer}>
										<Text style={styles.qrLabel}>
											Customer can scan this QR code to pay
										</Text>
										<View style={styles.qrCode}>
											<QRCode
												value={qrData || ''}
												size={200}
												backgroundColor='#ffffff'
												color='#000000'
											/>
										</View>
									</View>

									<View style={styles.paymentInfo}>
										<View style={styles.infoRow}>
											<Text style={styles.infoLabel}>Amount:</Text>
											<Text style={styles.infoValue}>${amount}</Text>
										</View>
										<View style={styles.infoRow}>
											<Text style={styles.infoLabel}>Business:</Text>
											<Text style={styles.infoValue}>{businessName}</Text>
										</View>
										{description ? (
											<View style={styles.infoRow}>
												<Text style={styles.infoLabel}>Description:</Text>
												<Text style={styles.infoValue}>{description}</Text>
											</View>
										) : null}
									</View>

									<View style={styles.buttons}>
										<TouchableOpacity
											style={[styles.button, styles.secondaryButton]}
											onPress={() => setShowQR(false)}
										>
											<Ionicons name='pencil' size={20} color='#374151' />
											<Text
												style={[styles.buttonText, styles.secondaryButtonText]}
											>
												Edit
											</Text>
										</TouchableOpacity>
										<TouchableOpacity
											style={[styles.button, styles.primaryButton]}
											onPress={shareQRCode}
										>
											<Ionicons name='share' size={20} color='#ffffff' />
											<Text
												style={[styles.buttonText, styles.primaryButtonText]}
											>
												Share
											</Text>
										</TouchableOpacity>
									</View>
								</>
							)}
						</ScrollView>
					</KeyboardAvoidingView>
				</View>
			</View>
		</Modal>
	);
};
