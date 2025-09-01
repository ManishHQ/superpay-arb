import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Platform,
	Alert,
	TouchableOpacity,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { expoConfig, getExpoUrl } from '@/config/expo';

interface ExpoQRCodeProps {
	expoUrl?: string;
	className?: string;
	showInstructions?: boolean;
	showDownloadLinks?: boolean;
}

export default function ExpoQRCode({
	expoUrl,
	className,
	showInstructions = true,
	showDownloadLinks = true,
}: ExpoQRCodeProps) {
	const [currentExpoUrl, setCurrentExpoUrl] = useState<string>('');
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		detectExpoUrl();
	}, []);

	const detectExpoUrl = () => {
		if (Platform.OS === 'web') {
			try {
				// Check if we have a custom Expo URL from props
				if (expoUrl) {
					setCurrentExpoUrl(expoUrl);
				} else {
					// Use the configuration helper
					const url = getExpoUrl();
					setCurrentExpoUrl(url);
				}
			} catch (error) {
				console.error('Error detecting Expo URL:', error);
				// Fallback URL from config
				setCurrentExpoUrl(expoConfig.development.localUrl);
			}
		} else {
			// On mobile, use the provided URL or fallback from config
			setCurrentExpoUrl(expoUrl || expoConfig.development.localUrl);
		}

		setIsLoading(false);
	};

	const handleCopyUrl = () => {
		if (Platform.OS === 'web' && navigator.clipboard) {
			navigator.clipboard.writeText(currentExpoUrl);
			Alert.alert('Success', 'Expo URL copied to clipboard!');
		}
	};

	const handleOpenExpoGo = () => {
		// Try to open Expo Go directly
		if (Platform.OS === 'web') {
			window.open(currentExpoUrl, '_blank');
		}
	};

	if (isLoading) {
		return (
			<View style={styles.container} className={className}>
				<View style={styles.loadingContainer}>
					<Text style={styles.loadingText}>Detecting Expo URL...</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container} className={className}>
			{/* Description */}
			<Text style={styles.description}>
				Scan this QR code with your phone's camera or Expo Go app to open
				SuperPay
			</Text>

			{/* QR Code Container */}
			<View style={styles.qrContainer}>
				<View style={styles.qrWrapper}>
					<QRCode
						value={currentExpoUrl}
						size={expoConfig.qrCode.size}
						color={expoConfig.qrCode.colors.foreground}
						backgroundColor={expoConfig.qrCode.colors.background}
					/>
				</View>

				{/* Expo Go Logo */}
				<View style={styles.expoGoBadge}>
					<Text style={styles.expoGoText}>Expo Go</Text>
				</View>
			</View>

			{/* URL Display */}
			<View style={styles.urlContainer}>
				<Text style={styles.urlLabel}>Expo URL:</Text>
				<Text style={styles.urlText} numberOfLines={1} ellipsizeMode='middle'>
					{currentExpoUrl}
				</Text>
				<TouchableOpacity
					onPress={handleCopyUrl}
					style={styles.copyButton}
					className='web:bg-blue-100 web:hover:bg-blue-200 web:transition-colors'
				>
					<Ionicons name='copy-outline' size={16} color='#3b82f6' />
					<Text style={styles.copyButtonText}>Copy</Text>
				</TouchableOpacity>
			</View>

			{/* Quick Actions */}
			<View style={styles.quickActions}>
				<TouchableOpacity
					onPress={handleOpenExpoGo}
					style={styles.actionButton}
					className='web:bg-blue-500 web:hover:bg-blue-600 web:transition-colors'
				>
					<Ionicons name='open-outline' size={16} color='#ffffff' />
					<Text style={styles.actionButtonText}>Open in Expo Go</Text>
				</TouchableOpacity>
			</View>

			{/* Instructions */}
			{showInstructions && (
				<View style={styles.instructions}>
					<Text style={styles.instructionTitle}>How to use:</Text>
					<View style={styles.instructionStep}>
						<Text style={styles.stepNumber}>1</Text>
						<Text style={styles.stepText}>
							Download Expo Go from App Store or Google Play
						</Text>
					</View>
					<View style={styles.instructionStep}>
						<Text style={styles.stepNumber}>2</Text>
						<Text style={styles.stepText}>
							Open Expo Go and scan this QR code
						</Text>
					</View>
					<View style={styles.instructionStep}>
						<Text style={styles.stepNumber}>3</Text>
						<Text style={styles.stepText}>Your app will load instantly!</Text>
					</View>
				</View>
			)}

			{/* Download Links */}
			{showDownloadLinks && (
				<View style={styles.downloadLinks}>
					<Text style={styles.downloadTitle}>Download Expo Go:</Text>
					<View style={styles.linkContainer}>
						<Text style={styles.linkText}>iOS: </Text>
						<Text style={styles.linkUrl}>App Store</Text>
					</View>
					<View style={styles.linkContainer}>
						<Text style={styles.linkText}>Android: </Text>
						<Text style={styles.linkUrl}>Google Play</Text>
					</View>
				</View>
			)}

			{/* Network Info */}
			<View style={styles.networkInfo}>
				<Ionicons name='information-circle-outline' size={16} color='#6b7280' />
				<Text style={styles.networkInfoText}>
					Make sure your phone and computer are on the same network
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		padding: 20,
		backgroundColor: '#ffffff',
		borderRadius: 16,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	loadingContainer: {
		padding: 32,
		alignItems: 'center',
	},
	loadingText: {
		fontSize: 16,
		color: '#6b7280',
		marginTop: 16,
	},
	description: {
		fontSize: 16,
		color: '#6b7280',
		textAlign: 'center',
		marginBottom: 20,
		lineHeight: 24,
		maxWidth: 280,
	},
	qrContainer: {
		alignItems: 'center',
		marginBottom: 20,
	},
	qrWrapper: {
		padding: 12,
		backgroundColor: '#ffffff',
		borderRadius: 12,
		borderWidth: 2,
		borderColor: '#e5e7eb',
		marginBottom: 12,
	},
	expoGoBadge: {
		backgroundColor: '#3b82f6',
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 16,
	},
	expoGoText: {
		color: '#ffffff',
		fontSize: 12,
		fontWeight: '600',
	},
	urlContainer: {
		alignItems: 'center',
		marginBottom: 16,
		width: '100%',
		maxWidth: 280,
	},
	urlLabel: {
		fontSize: 13,
		fontWeight: '600',
		color: '#374151',
		marginBottom: 6,
	},
	urlText: {
		fontSize: 11,
		color: '#6b7280',
		fontFamily: 'monospace',
		backgroundColor: '#f3f4f6',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 6,
		marginBottom: 8,
		maxWidth: '100%',
	},
	copyButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 6,
		backgroundColor: '#f3f4f6',
	},
	copyButtonText: {
		fontSize: 11,
		color: '#3b82f6',
		fontWeight: '500',
		marginLeft: 4,
	},
	quickActions: {
		marginBottom: 20,
		width: '100%',
		maxWidth: 280,
	},
	actionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#3b82f6',
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 10,
		width: '100%',
	},
	actionButtonText: {
		color: '#ffffff',
		fontSize: 13,
		fontWeight: '600',
		marginLeft: 6,
	},
	instructions: {
		alignItems: 'flex-start',
		marginBottom: 20,
		width: '100%',
		maxWidth: 280,
	},
	instructionTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#1f2937',
		marginBottom: 12,
		textAlign: 'center',
		width: '100%',
	},
	instructionStep: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: 8,
		width: '100%',
	},
	stepNumber: {
		backgroundColor: '#3b82f6',
		color: '#ffffff',
		width: 20,
		height: 20,
		borderRadius: 10,
		textAlign: 'center',
		lineHeight: 20,
		fontSize: 12,
		fontWeight: 'bold',
		marginRight: 10,
		marginTop: 2,
	},
	stepText: {
		flex: 1,
		fontSize: 14,
		color: '#4b5563',
		lineHeight: 20,
	},
	downloadLinks: {
		alignItems: 'center',
		borderTopWidth: 1,
		borderTopColor: '#e5e7eb',
		paddingTop: 16,
		marginBottom: 16,
		width: '100%',
	},
	downloadTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#1f2937',
		marginBottom: 8,
	},
	linkContainer: {
		flexDirection: 'row',
		marginBottom: 4,
	},
	linkText: {
		fontSize: 12,
		color: '#6b7280',
	},
	linkUrl: {
		fontSize: 12,
		color: '#3b82f6',
		fontWeight: '500',
		textDecorationLine: 'underline',
	},
	networkInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f9fafb',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#e5e7eb',
	},
	networkInfoText: {
		fontSize: 12,
		color: '#6b7280',
		marginLeft: 6,
		textAlign: 'center',
		flex: 1,
	},
});
