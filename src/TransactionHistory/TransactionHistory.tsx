import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
	Modal,
} from 'react-native';
import { Wallet } from '@dynamic-labs/client';
import { walletService, Transaction } from '../services/walletService';

interface TransactionHistoryProps {
	wallet: Wallet;
	visible: boolean;
	onClose: () => void;
}

interface TransactionItemProps {
	transaction: Transaction;
	walletAddress: string;
}

const TransactionItem: React.FC<TransactionItemProps> = ({
	transaction,
	walletAddress,
}) => {
	const isReceived =
		transaction.to?.toLowerCase() === walletAddress.toLowerCase();
	const isOutgoing = transaction.type === 'send';

	const formatAddress = (address?: string) => {
		if (!address) return 'Unknown';
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

	const formatAmount = (amount: string) => {
		const num = parseFloat(amount);
		return num.toFixed(6).replace(/\.?0+$/, '');
	};

	const formatDate = (date: Date) => {
		return (
			date.toLocaleDateString() +
			' ' +
			date.toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit',
			})
		);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'confirmed':
				return '#28a745';
			case 'pending':
				return '#ffc107';
			case 'failed':
				return '#dc3545';
			default:
				return '#6c757d';
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'confirmed':
				return '✓';
			case 'pending':
				return '⏳';
			case 'failed':
				return '✗';
			default:
				return '?';
		}
	};

	return (
		<View style={styles.transactionItem}>
			<View style={styles.transactionHeader}>
				<View style={styles.transactionTypeContainer}>
					<Text style={styles.transactionType}>
						{isOutgoing ? '📤 Sent' : '📥 Received'}
					</Text>
					<View
						style={[
							styles.statusBadge,
							{ backgroundColor: getStatusColor(transaction.status) },
						]}
					>
						<Text style={styles.statusText}>
							{getStatusIcon(transaction.status)} {transaction.status}
						</Text>
					</View>
				</View>
				<Text
					style={[
						styles.transactionAmount,
						isOutgoing ? styles.outgoingAmount : styles.incomingAmount,
					]}
				>
					{isOutgoing ? '-' : '+'}
					{formatAmount(transaction.amount)} ETH
				</Text>
			</View>

			<View style={styles.transactionDetails}>
				<Text style={styles.transactionAddress}>
					{isOutgoing ? 'To: ' : 'From: '}
					{formatAddress(isOutgoing ? transaction.to : transaction.from)}
				</Text>
				<Text style={styles.transactionDate}>
					{formatDate(transaction.timestamp)}
				</Text>
			</View>

			{transaction.hash && (
				<Text style={styles.transactionHash}>
					Hash: {formatAddress(transaction.hash)}
				</Text>
			)}

			{transaction.gasUsed && transaction.gasPrice && (
				<Text style={styles.gasInfo}>
					Gas: {transaction.gasUsed} @{' '}
					{parseFloat(transaction.gasPrice).toFixed(8)} ETH
				</Text>
			)}
		</View>
	);
};

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
	wallet,
	visible,
	onClose,
}) => {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');

	const loadTransactions = useCallback(async () => {
		try {
			setIsLoading(true);
			const txHistory = await walletService.getTransactionHistory(wallet);
			setTransactions(txHistory);
		} catch (error) {
			console.error('Failed to load transactions:', error);
		} finally {
			setIsLoading(false);
		}
	}, [wallet]);

	const handleRefresh = useCallback(async () => {
		try {
			setIsRefreshing(true);
			await loadTransactions();
		} catch (error) {
			console.error('Failed to refresh transactions:', error);
		} finally {
			setIsRefreshing(false);
		}
	}, [loadTransactions]);

	useEffect(() => {
		if (visible) {
			loadTransactions();
		}
	}, [visible, loadTransactions]);

	const filteredTransactions = transactions.filter((tx) => {
		if (filter === 'all') return true;
		if (filter === 'sent') return tx.type === 'send';
		if (filter === 'received') return tx.type === 'receive';
		return true;
	});

	const renderTransaction = ({ item }: { item: Transaction }) => (
		<TransactionItem transaction={item} walletAddress={wallet.address} />
	);

	const renderEmptyState = () => (
		<View style={styles.emptyState}>
			<Text style={styles.emptyStateTitle}>No Transactions</Text>
			<Text style={styles.emptyStateText}>
				Your transaction history will appear here once you start sending or
				receiving payments.
			</Text>
		</View>
	);

	const renderFilterButton = (
		filterType: 'all' | 'sent' | 'received',
		label: string
	) => (
		<TouchableOpacity
			style={[
				styles.filterButton,
				filter === filterType && styles.filterButtonActive,
			]}
			onPress={() => setFilter(filterType)}
		>
			<Text
				style={[
					styles.filterButtonText,
					filter === filterType && styles.filterButtonTextActive,
				]}
			>
				{label}
			</Text>
		</TouchableOpacity>
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
					<Text style={styles.title}>Transaction History</Text>
					<View style={styles.placeholder} />
				</View>

				<View style={styles.filterContainer}>
					{renderFilterButton('all', 'All')}
					{renderFilterButton('sent', 'Sent')}
					{renderFilterButton('received', 'Received')}
				</View>

				{isLoading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size='large' color='#007AFF' />
						<Text style={styles.loadingText}>Loading transactions...</Text>
					</View>
				) : (
					<FlatList
						data={filteredTransactions}
						renderItem={renderTransaction}
						keyExtractor={(item) => item.id}
						style={styles.transactionList}
						contentContainerStyle={styles.transactionListContent}
						refreshControl={
							<RefreshControl
								refreshing={isRefreshing}
								onRefresh={handleRefresh}
								tintColor='#007AFF'
							/>
						}
						ListEmptyComponent={renderEmptyState}
						showsVerticalScrollIndicator={false}
					/>
				)}
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
	filterContainer: {
		flexDirection: 'row',
		paddingHorizontal: 20,
		paddingVertical: 16,
		gap: 8,
	},
	filterButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: '#f0f0f0',
	},
	filterButtonActive: {
		backgroundColor: '#007AFF',
	},
	filterButtonText: {
		fontSize: 14,
		color: '#666',
	},
	filterButtonTextActive: {
		color: '#fff',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 12,
		fontSize: 16,
		color: '#666',
	},
	transactionList: {
		flex: 1,
	},
	transactionListContent: {
		paddingHorizontal: 20,
		paddingBottom: 20,
	},
	transactionItem: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: '#eee',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	transactionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 8,
	},
	transactionTypeContainer: {
		flex: 1,
		gap: 4,
	},
	transactionType: {
		fontSize: 16,
		fontWeight: '500',
		color: '#333',
	},
	statusBadge: {
		alignSelf: 'flex-start',
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 12,
	},
	statusText: {
		fontSize: 12,
		color: '#fff',
		fontWeight: '500',
	},
	transactionAmount: {
		fontSize: 18,
		fontWeight: '600',
	},
	outgoingAmount: {
		color: '#dc3545',
	},
	incomingAmount: {
		color: '#28a745',
	},
	transactionDetails: {
		gap: 4,
		marginBottom: 8,
	},
	transactionAddress: {
		fontSize: 14,
		color: '#666',
		fontFamily: 'monospace',
	},
	transactionDate: {
		fontSize: 12,
		color: '#999',
	},
	transactionHash: {
		fontSize: 12,
		color: '#666',
		fontFamily: 'monospace',
		marginTop: 4,
	},
	gasInfo: {
		fontSize: 11,
		color: '#999',
		marginTop: 2,
	},
	emptyState: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 40,
		paddingTop: 60,
	},
	emptyStateTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: '#333',
		marginBottom: 12,
	},
	emptyStateText: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
		lineHeight: 24,
	},
});
