import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	Modal,
	TouchableOpacity,
	StyleSheet,
	TextInput,
	Alert,
	ScrollView,
	ActivityIndicator,
	FlatList,
	Share,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { UserProfile } from '@/types/supabase';
import { debounce } from 'lodash';

interface PaymentRequestModalProps {
	visible: boolean;
	onClose: () => void;
	onRequestSent?: (requestData: PaymentRequestData) => void;
}

interface PaymentRequestData {
	id: string;
	amount: number;
	description: string;
	customer: SelectedCustomer;
	dueDate?: string;
	status: 'pending' | 'paid' | 'overdue' | 'cancelled';
	createdAt: Date;
}

interface SelectedCustomer {
	id: string;
	username: string;
	full_name: string;
	email?: string;
	wallet_address: string;
	avatar_url?: string;
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
		maxWidth: 500,
		maxHeight: '85%',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		color: '#111827',
	},
	closeButton: {
		padding: 4,
	},
	scrollContent: {
		flexGrow: 1,
	},
	section: {
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
		backgroundColor: '#f9fafb',
	},
	currencyInput: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 12,
		backgroundColor: '#f9fafb',
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
	textArea: {
		height: 80,
		textAlignVertical: 'top',
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 12,
		padding: 12,
		backgroundColor: '#f9fafb',
		marginBottom: 12,
	},
	searchInput: {
		flex: 1,
		fontSize: 16,
		marginLeft: 12,
	},
	searchResults: {
		maxHeight: 200,
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderRadius: 12,
		backgroundColor: '#ffffff',
		marginBottom: 12,
	},
	customerItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#f3f4f6',
	},
	customerAvatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: '#3b82f6',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 16,
	},
	customerAvatarText: {
		color: '#ffffff',
		fontSize: 18,
		fontWeight: '600',
	},
	customerInfo: {
		flex: 1,
	},
	customerName: {
		fontSize: 16,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 2,
	},
	customerUsername: {
		fontSize: 14,
		color: '#6b7280',
	},
	selectedCustomerCard: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		backgroundColor: '#f0f9ff',
		borderWidth: 2,
		borderColor: '#3b82f6',
		borderRadius: 12,
		marginBottom: 16,
	},
	removeButton: {
		backgroundColor: '#ef4444',
		borderRadius: 20,
		padding: 6,
	},
	dueDateContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	dueDateButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f3f4f6',
		padding: 12,
		borderRadius: 8,
		flex: 1,
		marginLeft: 12,
	},
	dueDateText: {
		marginLeft: 8,
		fontSize: 16,
		color: '#374151',
	},
	sendButton: {
		backgroundColor: '#16a34a',
		padding: 18,
		borderRadius: 12,
		alignItems: 'center',
		marginTop: 16,
	},
	sendButtonDisabled: {
		backgroundColor: '#d1d5db',
	},
	sendButtonText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '600',
	},
	sendButtonTextDisabled: {
		color: '#9ca3af',
	},
	helperText: {
		fontSize: 14,
		color: '#6b7280',
		marginTop: 8,
	},
	noResults: {
		padding: 16,
		textAlign: 'center',
		color: '#6b7280',
		fontStyle: 'italic',
	},
	qrSection: {
		alignItems: 'center',
		marginBottom: 24,
		padding: 24,
		backgroundColor: '#f9fafb',
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#e5e7eb',
	},
	qrTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 12,
		textAlign: 'center',
	},
	qrContainer: {
		padding: 16,
		backgroundColor: '#ffffff',
		borderRadius: 12,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	qrInstructions: {
		fontSize: 14,
		color: '#6b7280',
		textAlign: 'center',
		marginBottom: 16,
		lineHeight: 20,
	},
	qrButtons: {
		flexDirection: 'row',
		gap: 12,
		width: '100%',
	},
	qrButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 12,
		borderRadius: 8,
		gap: 6,
	},
	qrButtonPrimary: {
		backgroundColor: '#3b82f6',
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
	generateQRButton: {
		backgroundColor: '#16a34a',
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
		marginTop: 8,
	},
	generateQRButtonText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '600',
	},
});

export const PaymentRequestModal: React.FC<PaymentRequestModalProps> = ({
	visible,
	onClose,
	onRequestSent,
}) => {
	const { currentProfile, searchUsers } = useUserProfileStore();
	const [amount, setAmount] = useState('');
	const [description, setDescription] = useState('');
	const [selectedCustomer, setSelectedCustomer] =
		useState<SelectedCustomer | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [dueDate, setDueDate] = useState<Date | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [showQR, setShowQR] = useState(false);
	const [qrData, setQrData] = useState<string | null>(null);

	const businessName =
		currentProfile?.business_name || currentProfile?.display_name || 'Business';

	// Reset form when modal opens
	useEffect(() => {
		if (visible) {
			setAmount('');
			setDescription('');
			setSelectedCustomer(null);
			setSearchQuery('');
			setSearchResults([]);
			setDueDate(null);
			setIsLoading(false);
			setShowQR(false);
			setQrData(null);
		}
	}, [visible]);

	// Debounced search function
	const debouncedSearch = useCallback(
		debounce(async (query: string) => {
			if (query.trim().length < 3) {
				setSearchResults([]);
				setIsSearching(false);
				return;
			}

			setIsSearching(true);
			try {
				const results = await searchUsers(query.trim());
				setSearchResults(results || []);
			} catch (error) {
				console.error('Error searching customers:', error);
				setSearchResults([]);
			} finally {
				setIsSearching(false);
			}
		}, 300),
		[searchUsers]
	);

	// Handle search query changes
	useEffect(() => {
		if (searchQuery.trim().length >= 3) {
			debouncedSearch(searchQuery);
		} else {
			setSearchResults([]);
			setIsSearching(false);
		}
	}, [searchQuery, debouncedSearch]);

	const handleSelectCustomer = (user: UserProfile) => {
		const customer: SelectedCustomer = {
			id: user.id,
			username: user.username || 'unknown',
			full_name: user.full_name || 'Unknown Customer',
			email: user.email || undefined,
			wallet_address: user.wallet_address || '',
			avatar_url: user.avatar_url || undefined,
		};

		setSelectedCustomer(customer);
		setSearchQuery('');
		setSearchResults([]);
	};

	const handleRemoveCustomer = () => {
		setSelectedCustomer(null);
	};

	const generateQRCode = () => {
		if (!amount || !selectedCustomer || !description.trim()) {
			Alert.alert(
				'Missing Information',
				'Please fill in all required fields to generate QR code'
			);
			return;
		}

		const numericAmount = parseFloat(amount);
		if (isNaN(numericAmount) || numericAmount <= 0) {
			Alert.alert('Invalid Amount', 'Please enter a valid amount');
			return;
		}

		const paymentRequest = {
			type: 'payment_request',
			amount: numericAmount,
			currency: 'USD',
			description: description.trim(),
			recipient: currentProfile?.wallet_address || currentProfile?.email || '',
			recipientName: businessName,
			businessId: currentProfile?.id || '',
			timestamp: Date.now(),
			requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			dueDate: dueDate?.toISOString(),
		};

		setQrData(JSON.stringify(paymentRequest));
		setShowQR(true);
	};

	const shareQRCode = async () => {
		if (!qrData || !selectedCustomer) return;

		const paymentData = JSON.parse(qrData);
		const shareMessage = `Payment Request from ${businessName}\n\nAmount: $${paymentData.amount}\nDescription: ${paymentData.description}\n\nScan the QR code or tap the link to pay quickly and securely.`;

		try {
			await Share.share({
				message: shareMessage,
				title: 'Payment Request',
			});
		} catch (error) {
			console.error('Error sharing QR code:', error);
		}
	};

	const handleSendRequest = async () => {
		if (!amount || !selectedCustomer || !description.trim()) {
			Alert.alert('Missing Information', 'Please fill in all required fields');
			return;
		}

		const numericAmount = parseFloat(amount);
		if (isNaN(numericAmount) || numericAmount <= 0) {
			Alert.alert('Invalid Amount', 'Please enter a valid amount');
			return;
		}

		setIsLoading(true);

		try {
			const requestData: PaymentRequestData = {
				id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				amount: numericAmount,
				description: description.trim(),
				customer: selectedCustomer,
				dueDate: dueDate?.toISOString(),
				status: 'pending',
				createdAt: new Date(),
			};

			// Here you would typically send the request to your backend
			// For now, we'll simulate sending a notification
			await simulateSendRequest(requestData);

			onRequestSent?.(requestData);

			Alert.alert(
				'Payment Request Sent',
				`Payment request for $${numericAmount} has been sent to ${selectedCustomer.full_name}`,
				[{ text: 'OK', onPress: onClose }]
			);
		} catch (error) {
			console.error('Error sending payment request:', error);
			Alert.alert('Error', 'Failed to send payment request. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	// Simulate sending payment request (replace with actual API call)
	const simulateSendRequest = async (
		requestData: PaymentRequestData
	): Promise<void> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				console.log('Payment request sent:', requestData);
				// Here you would:
				// 1. Save to database
				// 2. Send push notification to customer
				// 3. Send email notification
				// 4. Update business dashboard
				resolve();
			}, 1500);
		});
	};

	const formatDueDate = (date: Date) => {
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	const isFormValid =
		amount && selectedCustomer && description.trim() && !isLoading;

	return (
		<Modal visible={visible} transparent animationType='fade'>
			<View style={styles.overlay}>
				<View style={styles.modal}>
					<KeyboardAvoidingView
						behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
						style={{ flex: 1 }}
					>
						<View style={styles.header}>
							<Text style={styles.title}>Request Payment</Text>
							<TouchableOpacity style={styles.closeButton} onPress={onClose}>
								<Ionicons name='close' size={24} color='#6b7280' />
							</TouchableOpacity>
						</View>

						<ScrollView
							contentContainerStyle={styles.scrollContent}
							showsVerticalScrollIndicator={false}
							keyboardShouldPersistTaps='handled'
						>
							{/* Amount Section */}
							<View style={styles.section}>
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
							</View>

							{/* Description Section */}
							<View style={styles.section}>
								<Text style={styles.label}>Description *</Text>
								<TextInput
									style={[styles.input, styles.textArea]}
									value={description}
									onChangeText={setDescription}
									placeholder='What is this payment for?'
									multiline
									numberOfLines={3}
									textAlignVertical='top'
								/>
							</View>

							{/* Customer Selection */}
							<View style={styles.section}>
								<Text style={styles.label}>Send To *</Text>

								{selectedCustomer ? (
									<View style={styles.selectedCustomerCard}>
										<View style={styles.customerAvatar}>
											<Text style={styles.customerAvatarText}>
												{selectedCustomer.full_name.charAt(0).toUpperCase()}
											</Text>
										</View>
										<View style={styles.customerInfo}>
											<Text style={styles.customerName}>
												{selectedCustomer.full_name}
											</Text>
											<Text style={styles.customerUsername}>
												@{selectedCustomer.username}
											</Text>
										</View>
										<TouchableOpacity
											style={styles.removeButton}
											onPress={handleRemoveCustomer}
										>
											<Ionicons name='close' size={16} color='#ffffff' />
										</TouchableOpacity>
									</View>
								) : (
									<>
										<View style={styles.searchContainer}>
											<Ionicons name='search' size={20} color='#9ca3af' />
											<TextInput
												style={styles.searchInput}
												placeholder='Search for customers...'
												value={searchQuery}
												onChangeText={setSearchQuery}
												returnKeyType='search'
											/>
											{isSearching && (
												<ActivityIndicator size='small' color='#6b7280' />
											)}
										</View>

										{searchResults.length > 0 && (
											<View style={styles.searchResults}>
												<FlatList
													data={searchResults}
													keyExtractor={(item) => item.id}
													renderItem={({ item }) => (
														<TouchableOpacity
															style={styles.customerItem}
															onPress={() => handleSelectCustomer(item)}
														>
															<View style={styles.customerAvatar}>
																<Text style={styles.customerAvatarText}>
																	{(item.full_name || 'C')
																		.charAt(0)
																		.toUpperCase()}
																</Text>
															</View>
															<View style={styles.customerInfo}>
																<Text style={styles.customerName}>
																	{item.full_name || 'Unknown Customer'}
																</Text>
																<Text style={styles.customerUsername}>
																	@{item.username}
																</Text>
															</View>
														</TouchableOpacity>
													)}
												/>
											</View>
										)}

										{searchQuery.length >= 3 &&
											searchResults.length === 0 &&
											!isSearching && (
												<Text style={styles.noResults}>No customers found</Text>
											)}
									</>
								)}

								<Text style={styles.helperText}>
									Search by name or username to find customers
								</Text>
							</View>

							{/* Due Date Section (Optional) */}
							<View style={styles.section}>
								<View style={styles.dueDateContainer}>
									<Text style={styles.label}>Due Date (Optional)</Text>
									<TouchableOpacity
										style={styles.dueDateButton}
										onPress={() => {
											// Here you would open a date picker
											// For now, set to 7 days from now
											const futureDate = new Date();
											futureDate.setDate(futureDate.getDate() + 7);
											setDueDate(futureDate);
										}}
									>
										<Ionicons name='calendar' size={20} color='#374151' />
										<Text style={styles.dueDateText}>
											{dueDate ? formatDueDate(dueDate) : 'Set due date'}
										</Text>
									</TouchableOpacity>
								</View>
								{dueDate && (
									<TouchableOpacity
										onPress={() => setDueDate(null)}
										style={{ marginTop: 8, alignSelf: 'flex-start' }}
									>
										<Text style={{ color: '#ef4444', fontSize: 14 }}>
											Clear due date
										</Text>
									</TouchableOpacity>
								)}
							</View>

							{/* QR Code Section */}
							{showQR && qrData ? (
								<View style={styles.qrSection}>
									<Text style={styles.qrTitle}>Payment Request QR Code</Text>
									<View style={styles.qrContainer}>
										<QRCode
											value={qrData}
											size={180}
											backgroundColor='#ffffff'
											color='#000000'
										/>
									</View>
									<Text style={styles.qrInstructions}>
										Customer can scan this QR code to view and pay the request
										instantly
									</Text>
									<View style={styles.qrButtons}>
										<TouchableOpacity
											style={[styles.qrButton, styles.qrButtonSecondary]}
											onPress={() => setShowQR(false)}
										>
											<Ionicons name='pencil' size={16} color='#374151' />
											<Text
												style={[
													styles.qrButtonText,
													styles.qrButtonTextSecondary,
												]}
											>
												Edit
											</Text>
										</TouchableOpacity>
										<TouchableOpacity
											style={[styles.qrButton, styles.qrButtonPrimary]}
											onPress={shareQRCode}
										>
											<Ionicons name='share' size={16} color='#ffffff' />
											<Text
												style={[
													styles.qrButtonText,
													styles.qrButtonTextPrimary,
												]}
											>
												Share
											</Text>
										</TouchableOpacity>
									</View>
								</View>
							) : isFormValid ? (
								<TouchableOpacity
									style={styles.generateQRButton}
									onPress={generateQRCode}
								>
									<Text style={styles.generateQRButtonText}>
										Generate QR Code
									</Text>
								</TouchableOpacity>
							) : null}

							{/* Send Button */}
							<TouchableOpacity
								style={[
									styles.sendButton,
									!isFormValid && styles.sendButtonDisabled,
								]}
								onPress={handleSendRequest}
								disabled={!isFormValid}
							>
								{isLoading ? (
									<ActivityIndicator color='#ffffff' />
								) : (
									<>
										<Text
											style={[
												styles.sendButtonText,
												!isFormValid && styles.sendButtonTextDisabled,
											]}
										>
											{showQR
												? 'Send Request & QR Code'
												: 'Send Payment Request'}
										</Text>
									</>
								)}
							</TouchableOpacity>
						</ScrollView>
					</KeyboardAvoidingView>
				</View>
			</View>
		</Modal>
	);
};
