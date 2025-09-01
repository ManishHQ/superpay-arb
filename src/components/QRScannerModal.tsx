import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	Modal,
	TouchableOpacity,
	StyleSheet,
	Alert,
	Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface QRScannerModalProps {
	visible: boolean;
	onClose: () => void;
	onScan: (data: string) => void;
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000000',
	},
	header: {
		position: 'absolute',
		top: 50,
		left: 0,
		right: 0,
		zIndex: 1000,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 15,
	},
	headerButton: {
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		borderRadius: 25,
		padding: 12,
	},
	title: {
		color: '#ffffff',
		fontSize: 18,
		fontWeight: '600',
	},
	scanner: {
		flex: 1,
	},
	overlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
	},
	scanArea: {
		width: 250,
		height: 250,
		borderWidth: 2,
		borderColor: '#ffffff',
		borderRadius: 20,
		backgroundColor: 'transparent',
	},
	corners: {
		position: 'absolute',
		width: 250,
		height: 250,
	},
	corner: {
		position: 'absolute',
		width: 30,
		height: 30,
		borderColor: '#4f46e5',
		borderWidth: 3,
	},
	topLeft: {
		top: -2,
		left: -2,
		borderRightWidth: 0,
		borderBottomWidth: 0,
		borderTopLeftRadius: 20,
	},
	topRight: {
		top: -2,
		right: -2,
		borderLeftWidth: 0,
		borderBottomWidth: 0,
		borderTopRightRadius: 20,
	},
	bottomLeft: {
		bottom: -2,
		left: -2,
		borderRightWidth: 0,
		borderTopWidth: 0,
		borderBottomLeftRadius: 20,
	},
	bottomRight: {
		bottom: -2,
		right: -2,
		borderLeftWidth: 0,
		borderTopWidth: 0,
		borderBottomRightRadius: 20,
	},
	instructions: {
		position: 'absolute',
		bottom: 100,
		left: 20,
		right: 20,
		alignItems: 'center',
	},
	instructionText: {
		color: '#ffffff',
		fontSize: 16,
		textAlign: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		padding: 16,
		borderRadius: 12,
	},
	permissionContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#000000',
		paddingHorizontal: 40,
	},
	permissionText: {
		color: '#ffffff',
		fontSize: 18,
		textAlign: 'center',
		marginBottom: 20,
		lineHeight: 24,
	},
	permissionButton: {
		backgroundColor: '#4f46e5',
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 12,
		marginBottom: 12,
	},
	permissionButtonText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '600',
	},
	cancelButton: {
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 12,
	},
	cancelButtonText: {
		color: '#ffffff',
		fontSize: 16,
	},
});

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
	visible,
	onClose,
	onScan,
}) => {
	const [permission, requestPermission] = useCameraPermissions();
	const [scanned, setScanned] = useState(false);

	useEffect(() => {
		if (visible) {
			setScanned(false);
		}
	}, [visible]);

	const handleBarCodeScanned = ({
		data,
	}: {
		data: string;
	}) => {
		if (scanned) return;

		setScanned(true);

		try {
			// Try to parse as JSON (payment request)
			const paymentData = JSON.parse(data);
			if (paymentData.type === 'payment_request') {
				// Show preview of payment request before processing
				Alert.alert(
					'Payment Request Found',
					`Payment request from ${paymentData.recipientName || 'Business'}\n\nAmount: $${paymentData.amount}\nDescription: ${paymentData.description}\n\nWould you like to proceed with this payment?`,
					[
						{
							text: 'Cancel',
							style: 'cancel',
							onPress: () => setScanned(false), // Allow scanning again
						},
						{
							text: 'Pay Now',
							onPress: () => {
								onScan(data);
								onClose();
							},
						},
					]
				);
				return;
			}
		} catch (error) {
			// Not JSON, treat as plain text (e.g., wallet address)
		}

		// For non-payment request QR codes, still pass the data
		onScan(data);
		onClose();
	};

	const handleRequestPermission = async () => {
		await requestPermission();
	};

	if (permission === null) {
		return (
			<Modal visible={visible} transparent animationType='fade'>
				<View style={styles.permissionContainer}>
					<Text style={styles.permissionText}>
						Requesting camera permission...
					</Text>
				</View>
			</Modal>
		);
	}

	if (!permission?.granted) {
		return (
			<Modal visible={visible} transparent animationType='fade'>
				<View style={styles.permissionContainer}>
					<Ionicons
						name='camera'
						size={64}
						color='#ffffff'
						style={{ marginBottom: 20 }}
					/>
					<Text style={styles.permissionText}>
						Camera permission is required to scan QR codes for payments
					</Text>
					<TouchableOpacity
						style={styles.permissionButton}
						onPress={handleRequestPermission}
					>
						<Text style={styles.permissionButtonText}>Grant Permission</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.cancelButton} onPress={onClose}>
						<Text style={styles.cancelButtonText}>Cancel</Text>
					</TouchableOpacity>
				</View>
			</Modal>
		);
	}

	return (
		<Modal visible={visible} transparent animationType='fade'>
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity style={styles.headerButton} onPress={onClose}>
						<Ionicons name='arrow-back' size={24} color='#ffffff' />
					</TouchableOpacity>
					<Text style={styles.title}>Scan QR Code</Text>
					<View style={{ width: 48 }} />
				</View>

				<CameraView
					style={styles.scanner}
					facing="back"
					barcodeScannerSettings={{
						barcodeTypes: ['qr'],
					}}
					onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
				/>

				<View style={styles.overlay}>
					<View style={styles.scanArea}>
						<View style={styles.corners}>
							<View style={[styles.corner, styles.topLeft]} />
							<View style={[styles.corner, styles.topRight]} />
							<View style={[styles.corner, styles.bottomLeft]} />
							<View style={[styles.corner, styles.bottomRight]} />
						</View>
					</View>
				</View>

				<View style={styles.instructions}>
					<Text style={styles.instructionText}>
						Position the QR code within the frame to scan payment details
					</Text>
				</View>
			</View>
		</Modal>
	);
};
