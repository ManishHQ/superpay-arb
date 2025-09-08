import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
	getNetworkName,
	isTestnet,
	getNetworkSymbol,
} from '../../utils/networkConfig';

interface NetworkStatusProps {
	chainId?: number;
	isConnected: boolean;
	onRetry?: () => void;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
	chainId,
	isConnected,
	onRetry,
}) => {
	if (isConnected && chainId) {
		return (
			<View style={styles.container}>
				<View style={styles.connectedContainer}>
					<View style={styles.statusIndicator} />
					<Text style={styles.networkName}>{getNetworkName(chainId)}</Text>
					{isTestnet(chainId) && (
						<Text style={styles.testnetBadge}>TESTNET</Text>
					)}
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.disconnectedContainer}>
				<View style={[styles.statusIndicator, styles.disconnectedIndicator]} />
				<Text style={styles.errorText}>Network unavailable</Text>
				{onRetry && (
					<TouchableOpacity style={styles.retryButton} onPress={onRetry}>
						<Text style={styles.retryText}>Retry</Text>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingVertical: 8,
	},
	connectedContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	disconnectedContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	statusIndicator: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#28a745',
	},
	disconnectedIndicator: {
		backgroundColor: '#dc3545',
	},
	networkName: {
		fontSize: 12,
		color: '#666',
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
	errorText: {
		fontSize: 12,
		color: '#dc3545',
	},
	retryButton: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		backgroundColor: '#f8f9fa',
		borderRadius: 6,
		borderWidth: 1,
		borderColor: '#dee2e6',
	},
	retryText: {
		fontSize: 10,
		color: '#007AFF',
		fontWeight: '500',
	},
});
