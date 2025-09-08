import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { Wallet } from '@dynamic-labs/client';
import { walletService, Transaction } from '../services/walletService';
import { client } from '../lib/client';
import { parseEther } from 'viem';
import { seiTestnet } from 'viem/chains';

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

	const handleSend = useCallback(async () => {
		if (!validateForm()) {
			return;
		}

		// Show confirmation dialog first, BEFORE setting loading state
		Alert.alert(
			'Confirm Transaction',
			`Send ${amount} ETH to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}?`,
			[
				{
					text: 'Cancel',
					style: 'cancel',
					onPress: () => {
						// Don't set loading state if cancelled
					},
				},
				{
					text: 'Send',
					style: 'default',
					onPress: async () => {
						try {
							setIsLoading(true);
							console.log('wallet: ', wallet);
							const walletClient = await client.viem.createWalletClient({
								chain: seiTestnet,
								wallet: client.wallets.primary!,
							});

							console.log('walletClient: ', walletClient);
							const amountWei = parseEther(amount);

							console.log('amountWei: ', amountWei);
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
						} catch (error) {
							console.error('Transaction failed:', error);
							Alert.alert(
								'Transaction Failed',
								error instanceof Error
									? error.message
									: 'Unknown error occurred',
								[{ text: 'OK' }]
							);
						} finally {
							setIsLoading(false);
						}
					},
				},
			],
			{ cancelable: true } // Allow dismissing by tapping outside
		);
	}, [
		validateForm,
		amount,
		recipientAddress,
		wallet,
		onTransactionComplete,
		onClose,
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
