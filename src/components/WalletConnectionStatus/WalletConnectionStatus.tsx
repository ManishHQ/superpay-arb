import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Wallet } from '@dynamic-labs/client';
import { walletService } from '../../services/walletService';
import { getNetworkName, isTestnet } from '../../utils/networkConfig';

interface WalletConnectionStatusProps {
	wallet: Wallet;
}

export const WalletConnectionStatus: React.FC<WalletConnectionStatusProps> = ({
	wallet,
}) => {
	const [isConnected, setIsConnected] = useState(false);
	const [networkInfo, setNetworkInfo] = useState<{
		chainId: number;
		blockNumber: string;
	} | null>(null);
	const [isChecking, setIsChecking] = useState(true);

	const checkConnection = async () => {
		try {
			setIsChecking(true);
			const [supported, info] = await Promise.all([
				walletService.isNetworkSupported(wallet),
				walletService.getNetworkInfo(wallet),
			]);

			setIsConnected(supported);
			setNetworkInfo(info);
		} catch (error) {
			console.error('Connection check failed:', error);
			setIsConnected(false);
			setNetworkInfo(null);
		} finally {
			setIsChecking(false);
		}
	};

	useEffect(() => {
		checkConnection();
	}, [wallet]);

	const handleRetry = () => {
		checkConnection();
	};

	const handleNetworkHelp = () => {
		Alert.alert(
			'Network Issues',
			"If you're experiencing connection issues:\n\n• Make sure you're connected to a supported network\n• Check your internet connection\n• Try switching to a different network in your wallet\n• Some networks may have temporary RPC issues",
			[
				{ text: 'OK' },
				{
					text: 'Retry',
					onPress: handleRetry,
				},
			]
		);
	};

	if (isChecking) {
		return (
			<View style={styles.container}>
				<View style={styles.statusContainer}>
					<View style={[styles.indicator, styles.checkingIndicator]} />
					<Text style={styles.statusText}>Checking network...</Text>
				</View>
			</View>
		);
	}

	if (!isConnected || !networkInfo) {
		return (
			<View style={styles.container}>
				<View style={styles.statusContainer}>
					<View style={[styles.indicator, styles.errorIndicator]} />
					<Text style={styles.errorText}>Network connection issues</Text>
					<TouchableOpacity
						style={styles.helpButton}
						onPress={handleNetworkHelp}
					>
						<Text style={styles.helpText}>?</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.statusContainer}>
				<View style={[styles.indicator, styles.connectedIndicator]} />
				<Text style={styles.networkText}>
					{getNetworkName(networkInfo.chainId)}
				</Text>
				{isTestnet(networkInfo.chainId) && (
					<Text style={styles.testnetBadge}>TESTNET</Text>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingVertical: 4,
	},
	statusContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	indicator: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	connectedIndicator: {
		backgroundColor: '#28a745',
	},
	errorIndicator: {
		backgroundColor: '#dc3545',
	},
	checkingIndicator: {
		backgroundColor: '#ffc107',
	},
	statusText: {
		fontSize: 12,
		color: '#666',
	},
	networkText: {
		fontSize: 12,
		color: '#333',
		fontWeight: '500',
	},
	errorText: {
		fontSize: 12,
		color: '#dc3545',
	},
	testnetBadge: {
		fontSize: 10,
		color: '#ff6b6b',
		backgroundColor: '#ffe0e0',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 8,
		fontWeight: '600',
	},
	helpButton: {
		width: 16,
		height: 16,
		borderRadius: 8,
		backgroundColor: '#007AFF',
		alignItems: 'center',
		justifyContent: 'center',
	},
	helpText: {
		fontSize: 10,
		color: '#fff',
		fontWeight: 'bold',
	},
});
