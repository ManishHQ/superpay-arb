import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	Text,
	Modal,
	TouchableOpacity,
	StyleSheet,
	TextInput,
	Share,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useUserProfileStore } from '@/stores/userProfileStore';

interface QuickQRGeneratorProps {
	visible: boolean;
	onClose: () => void;
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 20,
	},
	modal: {
		backgroundColor: '#ffffff',
		borderRadius: 20,
		padding: 20,
		width: '100%',
		maxWidth: 380,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.25,
		shadowRadius: 20,
		elevation: 10,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%',
		marginBottom: 16,
	},
	title: {
		fontSize: 20,
		fontWeight: '700',
		color: '#111827',
	},
	closeButton: {
		padding: 4,
	},
	quickForm: {
		width: '100%',
		marginBottom: 16,
	},
	input: {
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 12,
		padding: 14,
		fontSize: 16,
		marginBottom: 10,
		backgroundColor: '#f9fafb',
	},
	currencyInput: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 12,
		backgroundColor: '#f9fafb',
		marginBottom: 10,
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
	generateButton: {
		backgroundColor: '#3b82f6',
		padding: 14,
		borderRadius: 12,
		alignItems: 'center',
		width: '100%',
	},
	generateButtonDisabled: {
		backgroundColor: '#d1d5db',
	},
	generateButtonText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '600',
	},
	qrSection: {
		alignItems: 'center',
		width: '100%',
	},
	qrContainer: {
		padding: 20,
		backgroundColor: '#ffffff',
		borderRadius: 16,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	qrInfo: {
		alignItems: 'center',
		marginBottom: 20,
	},
	qrAmount: {
		fontSize: 24,
		fontWeight: '800',
		color: '#111827',
		marginBottom: 4,
	},
	qrDescription: {
		fontSize: 14,
		color: '#6b7280',
		textAlign: 'center',
		marginBottom: 8,
	},
	qrInstructions: {
		fontSize: 12,
		color: '#9ca3af',
		textAlign: 'center',
	},
	qrButtons: {
		flexDirection: 'row',
		gap: 12,
		width: '100%',
		marginTop: 16,
	},
	qrButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 12,
		borderRadius: 12,
		gap: 6,
	},
	qrButtonPrimary: {
		backgroundColor: '#16a34a',
	},
	qrButtonSecondary: {
		backgroundColor: '#f3f4f6',
		borderWidth: 1,
		borderColor: '#d1d5db',
	},
	qrButtonText: {
		fontSize: 14,
		fontWeight: '600',
	},
	qrButtonTextPrimary: {
		color: '#ffffff',
	},
	qrButtonTextSecondary: {
		color: '#374151',
	},
});

export const QuickQRGenerator: React.FC<QuickQRGeneratorProps> = ({
	visible,
	onClose,
}) => {
	const { currentProfile } = useUserProfileStore();
	const [amount, setAmount] = useState('');
	const [description, setDescription] = useState('');
	const [qrData, setQrData] = useState<string | null>(null);

	const businessName =
		currentProfile?.business_name || currentProfile?.display_name || 'Business';

	const resetForm = () => {
		setAmount('');
		setDescription('');
		setQrData(null);
	};

	const generateQR = () => {
		if (!amount || parseFloat(amount) <= 0) {
			return;
		}

		const paymentRequest = {
			type: 'payment_request',
			amount: parseFloat(amount),
			currency: 'USD',
			description: description || 'Quick Payment',
			recipient: currentProfile?.wallet_address || currentProfile?.email || '',
			recipientName: businessName,
			businessId: currentProfile?.id || '',
			timestamp: Date.now(),
			requestId: `quick_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		};

		setQrData(JSON.stringify(paymentRequest));
	};

	const shareQR = async () => {
		if (!qrData) return;

		const paymentData = JSON.parse(qrData);
		const shareMessage = `💳 Quick Payment Request from ${businessName}\n\nAmount: $${paymentData.amount}\n${paymentData.description ? `For: ${paymentData.description}\n` : ''}\nScan the QR code to pay instantly!`;

		try {
			await Share.share({
				message: shareMessage,
				title: 'Payment QR Code',
			});
		} catch (error) {
			console.error('Error sharing QR:', error);
		}
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	const isFormValid = amount && parseFloat(amount) > 0;

	return (
		<Modal visible={visible} transparent animationType='fade'>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.overlay}
			>
				<View style={styles.modal}>
					<ScrollView
						contentContainerStyle={{ paddingBottom: 0 }}
						keyboardShouldPersistTaps='handled'
						showsVerticalScrollIndicator={false}
					>
						<View style={styles.header}>
							<Text style={styles.title}>Quick QR Payment</Text>
							<TouchableOpacity
								style={styles.closeButton}
								onPress={handleClose}
							>
								<Ionicons name='close' size={24} color='#6b7280' />
							</TouchableOpacity>
						</View>

						{!qrData ? (
							<>
								<View style={styles.quickForm}>
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

									<TextInput
										style={styles.input}
										value={description}
										onChangeText={setDescription}
										placeholder="What's this payment for? (optional)"
										returnKeyType='done'
									/>
								</View>

								<TouchableOpacity
									style={[
										styles.generateButton,
										!isFormValid && styles.generateButtonDisabled,
									]}
									onPress={generateQR}
									disabled={!isFormValid}
								>
									<Text style={styles.generateButtonText}>
										Generate QR Code
									</Text>
								</TouchableOpacity>
							</>
						) : (
							<View style={styles.qrSection}>
								<View style={styles.qrInfo}>
									<Text style={styles.qrAmount}>${amount}</Text>
									{description && (
										<Text style={styles.qrDescription}>{description}</Text>
									)}
									<Text style={styles.qrInstructions}>
										Show this QR code to customers for instant payment
									</Text>
								</View>

								<View style={styles.qrContainer}>
									<QRCode
										value={qrData}
										size={200}
										backgroundColor='#ffffff'
										color='#000000'
									/>
								</View>

								<View style={styles.qrButtons}>
									<TouchableOpacity
										style={[styles.qrButton, styles.qrButtonSecondary]}
										onPress={() => setQrData(null)}
									>
										<Ionicons name='pencil' size={16} color='#374151' />
										<Text
											style={[
												styles.qrButtonText,
												styles.qrButtonTextSecondary,
											]}
										>
											New QR
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[styles.qrButton, styles.qrButtonPrimary]}
										onPress={shareQR}
									>
										<Ionicons name='share' size={16} color='#ffffff' />
										<Text
											style={[styles.qrButtonText, styles.qrButtonTextPrimary]}
										>
											Share
										</Text>
									</TouchableOpacity>
								</View>
							</View>
						)}
					</ScrollView>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
};
