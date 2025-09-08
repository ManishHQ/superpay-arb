import React, { useState, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	RefreshControl,
} from 'react-native';
import { Wallet } from '@dynamic-labs/client';
import { WalletBalance } from '../WalletBalance';
import { SendPayment } from '../SendPayment';
import { ReceivePayment } from '../ReceivePayment';
import { TransactionHistory } from '../TransactionHistory';
import { WalletConnectionStatus } from '../components/WalletConnectionStatus';
import { DemoNotice } from '../components/DemoNotice';
import { Transaction } from '../services/walletService';

interface WalletDashboardProps {
	wallet: Wallet;
}

interface QuickActionProps {
	icon: string;
	title: string;
	description: string;
	onPress: () => void;
	color?: string;
}

const QuickAction: React.FC<QuickActionProps> = ({
	icon,
	title,
	description,
	onPress,
	color = '#007AFF',
}) => (
	<TouchableOpacity style={styles.quickAction} onPress={onPress}>
		<View style={[styles.quickActionIcon, { backgroundColor: color }]}>
			<Text style={styles.quickActionIconText}>{icon}</Text>
		</View>
		<View style={styles.quickActionContent}>
			<Text style={styles.quickActionTitle}>{title}</Text>
			<Text style={styles.quickActionDescription}>{description}</Text>
		</View>
		<Text style={styles.quickActionArrow}>›</Text>
	</TouchableOpacity>
);

export const WalletDashboard: React.FC<WalletDashboardProps> = ({ wallet }) => {
	const [sendModalVisible, setSendModalVisible] = useState(false);
	const [receiveModalVisible, setReceiveModalVisible] = useState(false);
	const [historyModalVisible, setHistoryModalVisible] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);

	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		// Trigger refresh of balance component
		setRefreshKey((prev) => prev + 1);
		setTimeout(() => {
			setIsRefreshing(false);
		}, 1000);
	}, []);

	const handleTransactionComplete = useCallback(
		(transaction: Transaction) => {
			console.log('Transaction completed:', transaction);
			// Refresh the dashboard
			handleRefresh();
		},
		[handleRefresh]
	);

	const quickActions = [
		{
			icon: '📤',
			title: 'Send',
			description: 'Send ETH to another wallet',
			onPress: () => setSendModalVisible(true),
			color: '#FF6B6B',
		},
		{
			icon: '📥',
			title: 'Receive',
			description: 'Get your wallet address & QR code',
			onPress: () => setReceiveModalVisible(true),
			color: '#4ECDC4',
		},
		{
			icon: '📊',
			title: 'History',
			description: 'View transaction history',
			onPress: () => setHistoryModalVisible(true),
			color: '#45B7D1',
		},
		{
			icon: '⚙️',
			title: 'Settings',
			description: 'Manage wallet preferences',
			onPress: () => {
				// TODO: Implement settings
				console.log('Settings pressed');
			},
			color: '#96CEB4',
		},
	];

	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={isRefreshing}
						onRefresh={handleRefresh}
						tintColor='#007AFF'
					/>
				}
			>
				{/* Demo Notice */}
				<DemoNotice />

				{/* Connection Status */}
				<View style={styles.connectionStatus}>
					<WalletConnectionStatus wallet={wallet} />
				</View>

				{/* Balance Card */}
				<WalletBalance
					key={refreshKey}
					wallet={wallet}
					onRefresh={handleRefresh}
				/>

				{/* Quick Actions */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Quick Actions</Text>
					<View style={styles.quickActionsContainer}>
						{quickActions.map((action, index) => (
							<QuickAction
								key={index}
								icon={action.icon}
								title={action.title}
								description={action.description}
								onPress={action.onPress}
								color={action.color}
							/>
						))}
					</View>
				</View>

				{/* Wallet Information */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Wallet Information</Text>
					<View style={styles.infoContainer}>
						<View style={styles.infoItem}>
							<Text style={styles.infoLabel}>Address</Text>
							<Text style={styles.infoValue}>
								{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
							</Text>
						</View>
						<View style={styles.infoItem}>
							<Text style={styles.infoLabel}>Chain</Text>
							<Text style={styles.infoValue}>{wallet.chain}</Text>
						</View>
						<View style={styles.infoItem}>
							<Text style={styles.infoLabel}>Type</Text>
							<Text style={styles.infoValue}>
								{wallet.connector?.name || 'Unknown'}
							</Text>
						</View>
					</View>
				</View>

				{/* Security Tips */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Security Tips</Text>
					<View style={styles.tipsContainer}>
						<View style={styles.tipItem}>
							<Text style={styles.tipIcon}>🔒</Text>
							<Text style={styles.tipText}>
								Never share your private keys or seed phrase
							</Text>
						</View>
						<View style={styles.tipItem}>
							<Text style={styles.tipIcon}>✅</Text>
							<Text style={styles.tipText}>
								Always verify recipient addresses before sending
							</Text>
						</View>
						<View style={styles.tipItem}>
							<Text style={styles.tipIcon}>🌐</Text>
							<Text style={styles.tipText}>
								Double-check you're on the correct network
							</Text>
						</View>
					</View>
				</View>
			</ScrollView>

			{/* Modals */}
			<SendPayment
				wallet={wallet}
				visible={sendModalVisible}
				onClose={() => setSendModalVisible(false)}
				onTransactionComplete={handleTransactionComplete}
			/>

			<ReceivePayment
				wallet={wallet}
				visible={receiveModalVisible}
				onClose={() => setReceiveModalVisible(false)}
			/>

			<TransactionHistory
				wallet={wallet}
				visible={historyModalVisible}
				onClose={() => setHistoryModalVisible(false)}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f8f9fa',
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 20,
	},
	connectionStatus: {
		marginHorizontal: 16,
		marginTop: 8,
		marginBottom: 8,
	},
	section: {
		marginHorizontal: 16,
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: '#333',
		marginBottom: 16,
	},
	quickActionsContainer: {
		gap: 12,
	},
	quickAction: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	quickActionIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	quickActionIconText: {
		fontSize: 20,
	},
	quickActionContent: {
		flex: 1,
	},
	quickActionTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#333',
		marginBottom: 2,
	},
	quickActionDescription: {
		fontSize: 14,
		color: '#666',
	},
	quickActionArrow: {
		fontSize: 20,
		color: '#ccc',
	},
	infoContainer: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	infoItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#f0f0f0',
	},
	infoLabel: {
		fontSize: 14,
		color: '#666',
	},
	infoValue: {
		fontSize: 14,
		fontWeight: '500',
		color: '#333',
		fontFamily: 'monospace',
	},
	tipsContainer: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	tipItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: 12,
	},
	tipIcon: {
		fontSize: 16,
		marginRight: 12,
		marginTop: 2,
	},
	tipText: {
		flex: 1,
		fontSize: 14,
		color: '#666',
		lineHeight: 20,
	},
});
