import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { Wallet } from '@dynamic-labs/client';
import { walletService } from '../services/walletService';
import {
	getNetworkName,
	getNetworkSymbol,
	isTestnet,
} from '../utils/networkConfig';

interface WalletBalanceProps {
	wallet: Wallet;
	onRefresh?: () => void;
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({
	wallet,
	onRefresh,
}) => {
	const [balance, setBalance] = useState<string>('0');
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [networkInfo, setNetworkInfo] = useState<{
		chainId: number;
		blockNumber: string;
	} | null>(null);

	const fetchBalance = useCallback(async () => {
		try {
			setIsLoading(true);

			// Fetch balance and network info
			const [balanceResult, networkResult] = await Promise.all([
				walletService.getBalance(wallet),
				walletService.getNetworkInfo(wallet),
			]);

			setBalance(balanceResult);
			setNetworkInfo(networkResult);
		} catch (error) {
			console.error('Failed to fetch balance:', error);
			// Set default values on error
			setBalance('0');
			setNetworkInfo(null);
		} finally {
			setIsLoading(false);
		}
	}, [wallet]);

	const handleRefresh = useCallback(async () => {
		try {
			setIsRefreshing(true);
			await fetchBalance();
			onRefresh?.();
		} catch (error) {
			console.error('Failed to refresh balance:', error);
		} finally {
			setIsRefreshing(false);
		}
	}, [fetchBalance, onRefresh]);

	useEffect(() => {
		fetchBalance();
	}, [fetchBalance]);

	// Remove the old getChainName function - now using networkConfig

	const formatBalance = (balance: string): string => {
		const num = parseFloat(balance);
		if (num === 0) return '0.00';
		if (num < 0.0001) return '< 0.0001';
		if (num < 1) return num.toFixed(6).replace(/\.?0+$/, '');
		return num.toFixed(4).replace(/\.?0+$/, '');
	};

	if (isLoading) {
		return (
			<View style={styles.container}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size='large' color='#007AFF' />
					<Text style={styles.loadingText}>Loading balance...</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>Wallet Balance</Text>
				<TouchableOpacity
					style={styles.refreshButton}
					onPress={handleRefresh}
					disabled={isRefreshing}
				>
					{isRefreshing ? (
						<ActivityIndicator size='small' color='#007AFF' />
					) : (
						<Text style={styles.refreshText}>↻</Text>
					)}
				</TouchableOpacity>
			</View>

			<View style={styles.balanceContainer}>
				<Text style={styles.balanceAmount}>{formatBalance(balance)}</Text>
				<Text style={styles.balanceCurrency}>
					{networkInfo ? getNetworkSymbol(networkInfo.chainId) : 'ETH'}
				</Text>
			</View>

			<View style={styles.walletInfo}>
				<Text style={styles.walletAddress}>
					{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
				</Text>
				{networkInfo ? (
					<View style={styles.networkContainer}>
						<Text style={styles.networkInfo}>
							{getNetworkName(networkInfo.chainId)}
						</Text>
						{isTestnet(networkInfo.chainId) && (
							<Text style={styles.testnetBadge}>TESTNET</Text>
						)}
					</View>
				) : (
					<Text style={styles.networkError}>Network unavailable</Text>
				)}
			</View>

			<View style={styles.actions}>
				<TouchableOpacity style={styles.actionButton}>
					<Text style={styles.actionText}>📤 Send</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.actionButton}>
					<Text style={styles.actionText}>📥 Receive</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#fff',
		borderRadius: 16,
		padding: 20,
		margin: 16,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 5,
	},
	loadingContainer: {
		alignItems: 'center',
		paddingVertical: 40,
	},
	loadingText: {
		marginTop: 12,
		fontSize: 16,
		color: '#666',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
	},
	title: {
		fontSize: 18,
		fontWeight: '600',
		color: '#333',
	},
	refreshButton: {
		padding: 8,
		borderRadius: 20,
		backgroundColor: '#f0f0f0',
		minWidth: 36,
		alignItems: 'center',
	},
	refreshText: {
		fontSize: 18,
		color: '#007AFF',
	},
	balanceContainer: {
		alignItems: 'center',
		marginBottom: 20,
	},
	balanceAmount: {
		fontSize: 36,
		fontWeight: 'bold',
		color: '#333',
	},
	balanceCurrency: {
		fontSize: 16,
		color: '#666',
		marginTop: 4,
	},
	walletInfo: {
		alignItems: 'center',
		marginBottom: 24,
	},
	walletAddress: {
		fontSize: 14,
		color: '#666',
		fontFamily: 'monospace',
	},
	networkContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 4,
		gap: 8,
	},
	networkInfo: {
		fontSize: 12,
		color: '#999',
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
	networkError: {
		fontSize: 12,
		color: '#ff6b6b',
		marginTop: 4,
		fontStyle: 'italic',
	},
	actions: {
		flexDirection: 'row',
		justifyContent: 'space-around',
	},
	actionButton: {
		backgroundColor: '#007AFF',
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 25,
		minWidth: 100,
		alignItems: 'center',
	},
	actionText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '500',
	},
});
