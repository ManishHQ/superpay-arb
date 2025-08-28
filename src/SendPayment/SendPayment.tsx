import React, { useState, useCallback, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Alert,
	ActivityIndicator,
	Modal,
	ScrollView,
	Platform,
} from 'react-native';
import { Wallet } from '@dynamic-labs/client';
import { walletService, Transaction } from '../services/walletService';
import { client } from '../lib/client';
import { parseEther } from 'viem';
import { seiTestnet } from 'viem/chains';

// Web polyfills
if (Platform.OS === 'web') {
	// Ensure global objects exist for web
	if (typeof global === 'undefined') {
		(window as any).global = window;
	}
	if (typeof process === 'undefined') {
		(window as any).process = { env: {} };
	}
}

interface SendPaymentProps {
	wallet: Wallet;
	visible: boolean;
	onClose: () => void;
	onTransactionComplete?: (transaction: Transaction) => void;
}

export const SendPayment: React.FC<SendPaymentProps> = ({
	wallet,
	visible,
	onClose,
	onTransactionComplete,
}) => {
	const [recipientAddress, setRecipientAddress] = useState('');
	const [amount, setAmount] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<{
		address?: string;
		amount?: string;
	}>({});
	const [walletReady, setWalletReady] = useState(false);

	// Check if wallet is ready for web
	useEffect(() => {
		if (Platform.OS === 'web') {
			const checkWallet = async () => {
				try {
					// Wait for client to be ready
					if (client.wallets.primary) {
						setWalletReady(true);
					} else {
						// Wait a bit for wallet to connect
						setTimeout(() => {
							if (client.wallets.primary) {
								setWalletReady(true);
							}
						}, 1000);
					}
				} catch (error) {
					console.error('Wallet check failed:', error);
				}
			};
			checkWallet();
		} else {
			setWalletReady(true);
		}
	}, [wallet]);

	const validateForm = useCallback(() => {
		const newErrors: { address?: string; amount?: string } = {};

		// Validate address
		if (!recipientAddress.trim()) {
			newErrors.address = 'Recipient address is required';
		} else if (!walletService.validateAddress(recipientAddress)) {
			newErrors.address = 'Invalid Ethereum address';
		} else if (
			recipientAddress.toLowerCase() === wallet.address.toLowerCase()
		) {
			newErrors.address = 'Cannot send to your own address';
		}

		// Validate amount
		if (!amount.trim()) {
			newErrors.amount = 'Amount is required';
		} else {
			const numAmount = parseFloat(amount);
			if (isNaN(numAmount) || numAmount <= 0) {
				newErrors.amount = 'Amount must be greater than 0';
			} else if (numAmount > 1000000) {
				newErrors.amount = 'Amount too large';
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}, [recipientAddress, amount, wallet.address]);

	// Web-compatible confirmation dialog
	const showConfirmationDialog = useCallback(
		(message: string): Promise<boolean> => {
			return new Promise((resolve) => {
				if (Platform.OS === 'web') {
					// Use browser's native confirm dialog for web
					const confirmed = window.confirm(message);
					resolve(confirmed);
				} else {
					// Use React Native Alert for mobile
					Alert.alert(
						'Confirm Transaction',
						message,
						[
							{
								text: 'Cancel',
								style: 'cancel',
								onPress: () => resolve(false),
							},
							{
								text: 'Send',
								style: 'default',
								onPress: () => resolve(true),
							},
						],
						{ cancelable: true }
					);
				}
			});
		},
		[]
	);

	// Web-compatible error alert
	const showErrorAlert = useCallback((title: string, message: string) => {
		if (Platform.OS === 'web') {
			// Use browser's native alert for web
			alert(`${title}: ${message}`);
		} else {
			// Use React Native Alert for mobile
			Alert.alert(title, message, [{ text: 'OK' }]);
		}
	}, []);

	const handleSend = useCallback(async () => {
		if (!validateForm()) {
			return;
		}

		// Check if wallet is properly connected
		if (!wallet || !wallet.address) {
			showErrorAlert('Wallet Error', 'Please connect your wallet first');
			return;
		}

		// Show confirmation dialog first, BEFORE setting loading state
		const message = `Send ${amount} ETH to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}?`;
		const confirmed = await showConfirmationDialog(message);

		if (!confirmed) {
			return;
		}

		try {
			setIsLoading(true);
			console.log('wallet: ', wallet);

			// Check if we're in web environment and handle accordingly
			if (Platform.OS === 'web') {
				// For web, ensure wallet is connected and ready
				if (!client.wallets.primary) {
					throw new Error(
						'No primary wallet found. Please connect your wallet.'
					);
				}
			}

			const walletClient = await client.viem.createWalletClient({
				chain: seiTestnet,
				wallet: client.wallets.primary!,
			});

			console.log('walletClient: ', walletClient);
			const amountWei = parseEther(amount);

			console.log('amountWei: ', amountWei);

			// Check if wallet client is properly initialized
			if (!walletClient) {
				throw new Error('Failed to initialize wallet client');
			}

			const transaction = await walletClient.sendTransaction({
				to: recipientAddress as `0x${string}`,
				value: amountWei,
			});

			console.log('Transaction: ', transaction);

			// Reset form
			setRecipientAddress('');
			setAmount('');
			setErrors({});
			onClose();

			// Show success message
			if (Platform.OS === 'web') {
				alert(`Transaction sent successfully! Hash: ${transaction}`);
			}
		} catch (error) {
			console.error('Transaction failed:', error);
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error occurred';
			showErrorAlert('Transaction Failed', errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [
		validateForm,
		amount,
		recipientAddress,
		wallet,
		onTransactionComplete,
		onClose,
		showConfirmationDialog,
		showErrorAlert,
	]);

	const handleClose = useCallback(() => {
		// Reset loading state and close
		setIsLoading(false);
		setRecipientAddress('');
		setAmount('');
		setErrors({});
		onClose();
	}, [onClose]);

	const pasteAddress = useCallback(() => {
		// In a real app, you'd use Clipboard.getString()
		// For now, just clear the error
		setErrors((prev) => ({ ...prev, address: undefined }));
	}, []);

	return (
		<Modal
			visible={visible}
			animationType='slide'
			presentationStyle='pageSheet'
		>
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity onPress={handleClose}>
						<Text style={styles.cancelButton}>Cancel</Text>
					</TouchableOpacity>
					<Text style={styles.title}>Send Payment</Text>
					<View style={styles.placeholder} />
				</View>

				<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
					<View style={styles.section}>
						<Text style={styles.label}>From</Text>
						<View style={styles.fromContainer}>
							<Text style={styles.fromAddress}>
								{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
							</Text>
						</View>
					</View>

					<View style={styles.section}>
						<Text style={styles.label}>To</Text>
						<View style={styles.inputContainer}>
							<TextInput
								style={[styles.input, errors.address && styles.inputError]}
								placeholder='0x... recipient address'
								value={recipientAddress}
								onChangeText={setRecipientAddress}
								autoCapitalize='none'
								autoCorrect={false}
								editable={!isLoading}
							/>
							<TouchableOpacity
								style={styles.pasteButton}
								onPress={pasteAddress}
								disabled={isLoading}
							>
								<Text style={styles.pasteText}>Paste</Text>
							</TouchableOpacity>
						</View>
						{errors.address && (
							<Text style={styles.errorText}>{errors.address}</Text>
						)}
					</View>

					<View style={styles.section}>
						<Text style={styles.label}>Amount</Text>
						<View style={styles.amountContainer}>
							<TextInput
								style={[styles.amountInput, errors.amount && styles.inputError]}
								placeholder='0.0'
								value={amount}
								onChangeText={setAmount}
								keyboardType='decimal-pad'
								editable={!isLoading}
							/>
							<Text style={styles.currency}>ETH</Text>
						</View>
						{errors.amount && (
							<Text style={styles.errorText}>{errors.amount}</Text>
						)}
					</View>

					<View style={styles.quickAmounts}>
						<Text style={styles.label}>Quick amounts</Text>
						<View style={styles.quickAmountButtons}>
							{['0.001', '0.01', '0.1', '1'].map((quickAmount) => (
								<TouchableOpacity
									key={quickAmount}
									style={styles.quickAmountButton}
									onPress={() => setAmount(quickAmount)}
									disabled={isLoading}
								>
									<Text style={styles.quickAmountText}>{quickAmount} ETH</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>
				</ScrollView>

				<View style={styles.footer}>
					<TouchableOpacity
						style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
						onPress={handleSend}
						disabled={isLoading}
					>
						{isLoading ? (
							<ActivityIndicator color='#fff' />
						) : (
							<Text style={styles.sendButtonText}>Send Payment</Text>
						)}
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	cancelButton: {
		fontSize: 16,
		color: '#007AFF',
	},
	title: {
		fontSize: 18,
		fontWeight: '600',
		color: '#333',
	},
	placeholder: {
		width: 50,
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
	},
	section: {
		marginTop: 24,
	},
	label: {
		fontSize: 16,
		fontWeight: '500',
		color: '#333',
		marginBottom: 8,
	},
	fromContainer: {
		backgroundColor: '#f8f8f8',
		padding: 16,
		borderRadius: 12,
	},
	fromAddress: {
		fontSize: 16,
		fontFamily: 'monospace',
		color: '#666',
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 12,
		backgroundColor: '#fff',
	},
	input: {
		flex: 1,
		padding: 16,
		fontSize: 16,
		fontFamily: 'monospace',
	},
	inputError: {
		borderColor: '#ff4444',
	},
	pasteButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		marginRight: 8,
		backgroundColor: '#f0f0f0',
		borderRadius: 8,
	},
	pasteText: {
		fontSize: 14,
		color: '#007AFF',
	},
	errorText: {
		fontSize: 14,
		color: '#ff4444',
		marginTop: 4,
	},
	amountContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 12,
		backgroundColor: '#fff',
	},
	amountInput: {
		flex: 1,
		padding: 16,
		fontSize: 24,
		fontWeight: '500',
	},
	currency: {
		fontSize: 16,
		color: '#666',
		paddingRight: 16,
	},
	quickAmounts: {
		marginTop: 24,
	},
	quickAmountButtons: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	quickAmountButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: '#f0f0f0',
		borderRadius: 20,
	},
	quickAmountText: {
		fontSize: 14,
		color: '#007AFF',
	},
	footer: {
		paddingHorizontal: 20,
		paddingBottom: 20,
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: '#eee',
	},
	sendButton: {
		backgroundColor: '#007AFF',
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: 'center',
	},
	sendButtonDisabled: {
		backgroundColor: '#ccc',
	},
	sendButtonText: {
		fontSize: 18,
		fontWeight: '600',
		color: '#fff',
	},
});
