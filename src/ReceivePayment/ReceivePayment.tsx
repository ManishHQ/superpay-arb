import React, { useState, useCallback } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Alert,
	Modal,
	Share,
	Dimensions,
} from 'react-native';
import { Wallet } from '@dynamic-labs/client';

interface ReceivePaymentProps {
	wallet: Wallet;
	visible: boolean;
	onClose: () => void;
}

export const ReceivePayment: React.FC<ReceivePaymentProps> = ({
	wallet,
	visible,
	onClose,
}) => {
	const [copied, setCopied] = useState(false);

	const copyToClipboard = useCallback(async () => {
		try {
			// In a real app, you'd use @react-native-clipboard/clipboard
			// For now, just show the address was "copied"
			setCopied(true);
			Alert.alert('Copied!', 'Wallet address copied to clipboard', [
				{ text: 'OK' },
			]);

			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
			Alert.alert('Error', 'Failed to copy address', [{ text: 'OK' }]);
		}
	}, []);

	const shareAddress = useCallback(async () => {
		try {
			await Share.share({
				message: `My Ethereum wallet address: ${wallet.address}`,
				title: 'My Wallet Address',
			});
		} catch (error) {
			console.error('Failed to share:', error);
		}
	}, [wallet.address]);

	const formatAddress = (address: string) => {
		const start = address.slice(0, 6);
		const end = address.slice(-4);
		return `${start}...${end}`;
	};

	// Simple QR code placeholder (in a real app, you'd use react-native-qrcode-svg)
	const QRCodePlaceholder = () => (
		<View style={styles.qrPlaceholder}>
			<View style={styles.qrGrid}>
				{Array.from({ length: 64 }).map((_, index) => (
					<View
						key={index}
						style={[styles.qrDot, Math.random() > 0.5 && styles.qrDotFilled]}
					/>
				))}
			</View>
		</View>
	);

	return (
		<Modal
			visible={visible}
			animationType='slide'
			presentationStyle='pageSheet'
		>
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity onPress={onClose}>
						<Text style={styles.closeButton}>Close</Text>
					</TouchableOpacity>
					<Text style={styles.title}>Receive Payment</Text>
					<View style={styles.placeholder} />
				</View>

				<View style={styles.content}>
					<View style={styles.qrSection}>
						<Text style={styles.sectionTitle}>Scan QR Code</Text>
						<QRCodePlaceholder />
						<Text style={styles.qrDescription}>
							Share this QR code for others to send you payments
						</Text>
					</View>

					<View style={styles.addressSection}>
						<Text style={styles.sectionTitle}>Wallet Address</Text>

						<View style={styles.addressContainer}>
							<View style={styles.addressBox}>
								<Text style={styles.addressText}>{wallet.address}</Text>
							</View>

							<View style={styles.addressActions}>
								<TouchableOpacity
									style={[
										styles.actionButton,
										copied && styles.actionButtonCopied,
									]}
									onPress={copyToClipboard}
								>
									<Text
										style={[
											styles.actionButtonText,
											copied && styles.actionButtonTextCopied,
										]}
									>
										{copied ? '✓ Copied' : '📋 Copy'}
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={styles.actionButton}
									onPress={shareAddress}
								>
									<Text style={styles.actionButtonText}>📤 Share</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>

					<View style={styles.infoSection}>
						<View style={styles.infoBox}>
							<Text style={styles.infoTitle}>⚠️ Important Notes</Text>
							<Text style={styles.infoText}>
								• Only send Ethereum (ETH) and ERC-20 tokens to this address
							</Text>
							<Text style={styles.infoText}>
								• Make sure you're on the correct network
							</Text>
							<Text style={styles.infoText}>
								• Double-check the address before sharing
							</Text>
							<Text style={styles.infoText}>
								• Transactions are irreversible
							</Text>
						</View>
					</View>
				</View>
			</View>
		</Modal>
	);
};

const { width } = Dimensions.get('window');

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
	closeButton: {
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
	qrSection: {
		alignItems: 'center',
		marginTop: 32,
		marginBottom: 40,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#333',
		marginBottom: 20,
	},
	qrPlaceholder: {
		width: 200,
		height: 200,
		backgroundColor: '#fff',
		borderRadius: 16,
		padding: 20,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 5,
		marginBottom: 16,
	},
	qrGrid: {
		flex: 1,
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	qrDot: {
		width: '12.5%',
		aspectRatio: 1,
		backgroundColor: '#f0f0f0',
		margin: 0.5,
	},
	qrDotFilled: {
		backgroundColor: '#000',
	},
	qrDescription: {
		fontSize: 14,
		color: '#666',
		textAlign: 'center',
		maxWidth: 250,
	},
	addressSection: {
		marginBottom: 32,
	},
	addressContainer: {
		gap: 16,
	},
	addressBox: {
		backgroundColor: '#f8f8f8',
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#eee',
	},
	addressText: {
		fontSize: 14,
		fontFamily: 'monospace',
		color: '#333',
		textAlign: 'center',
		lineHeight: 20,
	},
	addressActions: {
		flexDirection: 'row',
		gap: 12,
	},
	actionButton: {
		flex: 1,
		backgroundColor: '#007AFF',
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: 'center',
	},
	actionButtonCopied: {
		backgroundColor: '#28a745',
	},
	actionButtonText: {
		fontSize: 16,
		fontWeight: '500',
		color: '#fff',
	},
	actionButtonTextCopied: {
		color: '#fff',
	},
	infoSection: {
		marginTop: 'auto',
		marginBottom: 20,
	},
	infoBox: {
		backgroundColor: '#fff3cd',
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#ffeaa7',
	},
	infoTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#856404',
		marginBottom: 8,
	},
	infoText: {
		fontSize: 14,
		color: '#856404',
		lineHeight: 20,
		marginBottom: 4,
	},
});
