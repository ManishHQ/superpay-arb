import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	AppState,
	Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import {
	WalletCard,
	QuickStats,
	QuickActions,
	RecentActivity,
	HomeHeader,
	SendModal,
	RequestModal,
} from '@/components';
import { dynamicClient } from '@/lib/client';
import { Wallet } from '@dynamic-labs/client';
import { useWalletStore } from '@/stores/walletStore';
import { useBalanceStore, useBalanceInvalidation } from '@/stores/balanceStore';
import {
	TransactionService,
	TransactionWithUsers,
} from '@/services/transactionService';
import { router } from 'expo-router';

// Default data fallbacks
const defaultUser = {
	firstName: 'Guest',
	lastName: 'User',
};

// Dynamic wallet configurations
const walletConfigs = [
	{
		id: 'default',
		name: 'Default Wallet',
		gradientColors: ['#3D5AFE', '#00C896'],
		showEthBalance: true,
		showWalletAddress: true,
	},
	{
		id: 'minimal',
		name: 'Minimal View',
		gradientColors: ['#667eea', '#764ba2'],
		showEthBalance: false,
		showWalletAddress: false,
	},
	{
		id: 'premium',
		name: 'Premium Wallet',
		gradientColors: ['#f093fb', '#f5576c'],
		showEthBalance: true,
		showWalletAddress: true,
	},
];

const mockWeeklyStats = {
	sent: 245.5,
	received: 189.25,
	transactions: 12,
};

// Quick actions configuration - will be defined inside component to access refs

export default function HomeScreen() {
	const { auth, wallets } = useReactiveClient(dynamicClient);
	const [isLoading, setIsLoading] = useState(false);
	const [greeting, setGreeting] = useState('');
	const [currentWalletConfig, setCurrentWalletConfig] = useState(
		walletConfigs[0]
	);
	const [dynamicStats, setDynamicStats] = useState(mockWeeklyStats);
	const [userData, setUserData] = useState(defaultUser);
	const [connectedWallet, setConnectedWallet] = useState<Wallet | null>(null);
	const [recentActivity, setRecentActivity] = useState<any[]>([]);
	const [activityLoading, setActivityLoading] = useState(false);
	const [statsLoading, setStatsLoading] = useState(false);

	// Modal states
	const [sendModalVisible, setSendModalVisible] = useState(false);
	const [requestModalVisible, setRequestModalVisible] = useState(false);

	// Use simplified wallet store for connection state
	const {
		isConnected: isWalletConnected,
		address: walletAddress,
		shortAddress,
		setWallet,
		reset: resetWallet,
	} = useWalletStore();

	// Use balance store for balance data
	const { fetchBalances, getBalance, isBalanceStale } = useBalanceStore();
	const { onAppForeground } = useBalanceInvalidation();

	// Get current balances from store
	const ethBalance = walletAddress ? getBalance(walletAddress, 'eth') : null;
	const usdcBalance = walletAddress ? getBalance(walletAddress, 'usdc') : null;

	// Create wallet data object for compatibility with existing components
	const walletData = useMemo(
		() => ({
			usdcBalance: usdcBalance?.formatted || '0.00',
			ethBalance: ethBalance?.formatted || '0.0000',
			walletAddress: shortAddress || 'Not connected',
		}),
		[ethBalance?.formatted, usdcBalance?.formatted, shortAddress]
	);

	// Check if wallet should be connected based on Dynamic state
	const shouldBeConnected = auth.token && wallets.userWallets.length > 0;

	// Update greeting based on time of day
	useEffect(() => {
		const updateGreeting = () => {
			const hour = new Date().getHours();
			if (hour < 12) {
				setGreeting('Good morning');
			} else if (hour < 17) {
				setGreeting('Good afternoon');
			} else {
				setGreeting('Good evening');
			}
		};

		updateGreeting();
		const interval = setInterval(updateGreeting, 60000); // Update every minute

		return () => clearInterval(interval);
	}, []);

	// Sync wallet connection state with Dynamic
	useEffect(() => {
		if (shouldBeConnected && wallets.userWallets.length > 0) {
			const wallet = wallets.userWallets[0];
			const address = wallet?.address;

			if (address) {
				setConnectedWallet(wallet);
				setWallet(address); // This sets address, shortAddress, and isConnected
				console.log('Wallet connected:', address);
			}
		} else {
			// Reset wallet state when not connected
			setConnectedWallet(null);
			resetWallet();
			console.log('Wallet disconnected, resetting state');
		}
	}, [shouldBeConnected, wallets.userWallets, setWallet, resetWallet]);

	// Fetch balances only when wallet first connects or on specific events
	useEffect(() => {
		if (walletAddress && isWalletConnected) {
			console.log(
				'Fetching initial balances for connected wallet:',
				walletAddress
			);
			fetchBalances(walletAddress);
		}
	}, [walletAddress, isWalletConnected, fetchBalances]);

	// Fetch recent activity and weekly stats when wallet connects
	useEffect(() => {
		if (walletAddress && isWalletConnected) {
			fetchRecentActivity();
			refreshWeeklyStats();
		}
	}, [walletAddress, isWalletConnected]);

	// Monitor app state changes for smart balance refreshing
	useEffect(() => {
		if (!walletAddress) return;

		const handleAppStateChange = (nextAppState: string) => {
			if (nextAppState === 'active') {
				// App came to foreground, check if balances are stale
				const isStale = isBalanceStale(walletAddress, 30000); // 30 seconds threshold
				if (isStale) {
					console.log('App became active, refreshing stale balances');
					onAppForeground(walletAddress);
					fetchBalances(walletAddress);
				}
			}
		};

		const subscription = AppState.addEventListener(
			'change',
			handleAppStateChange
		);
		return () => subscription?.remove();
	}, [walletAddress, isBalanceStale, onAppForeground, fetchBalances]);

	// Update user data from Dynamic auth
	useEffect(() => {
		if (auth.authenticatedUser) {
			const user = auth.authenticatedUser;
			setUserData({
				firstName: user.firstName || user.username || 'User',
				lastName: user.lastName || '',
			});
		} else {
			setUserData(defaultUser);
		}
	}, [auth.authenticatedUser]);

	// No more random stats updates - using real data only

	const handleSend = async () => {
		if (!connectedWallet) {
			console.log('No wallet connected');
			// Show connection prompt
			dynamicClient.ui.auth.show();
			return;
		}

		console.log('Send button pressed with wallet:', connectedWallet.address);
		// Open send modal
		setSendModalVisible(true);
	};

	const handleRefresh = async () => {
		if (!walletAddress) return;

		console.log('Manual refresh requested for:', walletAddress);
		setIsLoading(true);

		try {
			// Refresh balances, recent activity, and weekly stats in parallel
			await Promise.all([
				fetchBalances(walletAddress, true),
				fetchRecentActivity(),
				refreshWeeklyStats(),
			]);
			console.log('Manual refresh completed');
		} catch (error) {
			console.error('Error during manual refresh:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// Refresh weekly stats from real transaction data
	const refreshWeeklyStats = async () => {
		if (!walletAddress) return;

		setStatsLoading(true);
		try {
			const stats = await calculateWeeklyStats();
			setDynamicStats(stats);
			console.log('Weekly stats updated:', stats);
		} catch (error) {
			console.error('Error refreshing weekly stats:', error);
		} finally {
			setStatsLoading(false);
		}
	};

	// Calculate weekly stats from real transaction data
	const calculateWeeklyStats = async () => {
		if (!walletAddress) return mockWeeklyStats;

		try {
			// Get transactions from the last 7 days
			const allTransactions = await TransactionService.getUserTransactions(1000); // Get enough transactions
			
			// Calculate start of current week (7 days ago)
			const oneWeekAgo = new Date();
			oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
			oneWeekAgo.setHours(0, 0, 0, 0); // Start of day

			// Filter transactions from this week
			const thisWeekTransactions = allTransactions.filter(transaction => {
				const transactionDate = new Date(transaction.created_at);
				return transactionDate >= oneWeekAgo;
			});

			let sent = 0;
			let received = 0;
			let transactionCount = thisWeekTransactions.length;

			// Calculate sent and received amounts
			thisWeekTransactions.forEach(transaction => {
				const isSent = transaction.from_user?.wallet_address === walletAddress;
				
				if (isSent) {
					sent += transaction.amount;
				} else {
					received += transaction.amount;
				}
			});

			return {
				sent,
				received,
				transactions: transactionCount,
			};
		} catch (error) {
			console.error('Error calculating weekly stats:', error);
			return mockWeeklyStats; // Fallback to mock data
		}
	};

	// Fetch recent activity data
	const fetchRecentActivity = async () => {
		if (!walletAddress) return;

		setActivityLoading(true);
		try {
			// For regular home page, use the legacy method that works with wallet
			const transactions = await TransactionService.getUserTransactions(5); // Get last 5 transactions

			// Transform transactions to activity format
			const activities = transactions.map((transaction) => {
				const currentUserProfile =
					transaction.from_user?.wallet_address === walletAddress
						? transaction.from_user
						: transaction.to_user;
				const otherUser =
					transaction.from_user?.wallet_address === walletAddress
						? transaction.to_user
						: transaction.from_user;

				const isSent = transaction.from_user?.wallet_address === walletAddress;

				// Generate a consistent avatar based on user ID if no avatar_url
				const generateAvatar = (username: string) => {
					return `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${username}`;
				};

				return {
					id: transaction.id,
					name: otherUser?.full_name || otherUser?.username || 'Unknown User',
					avatar:
						otherUser?.avatar_url ||
						generateAvatar(otherUser?.username || 'Unknown User'),
					amount: transaction.amount,
					type: isSent ? ('sent' as const) : ('received' as const),
					note:
						transaction.note || (isSent ? 'Payment sent' : 'Payment received'),
					time: formatTimeAgo(new Date(transaction.created_at)),
				};
			});

			setRecentActivity(activities);
		} catch (error) {
			console.error('Error fetching recent activity:', error);
		} finally {
			setActivityLoading(false);
		}
	};

	// Helper function to format time ago
	const formatTimeAgo = (date: Date) => {
		const now = new Date();
		const diffInMs = now.getTime() - date.getTime();
		const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
		const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
		const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

		if (diffInMinutes < 60) {
			return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
		} else if (diffInHours < 24) {
			return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
		} else {
			return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
		}
	};

	const handleViewAllActivity = () => {
		console.log('View all activity pressed - move logic to services');
	};

	const handleConnectWallet = () => {
		console.log('Opening Dynamic wallet connection...');
		try {
			// This will open the Dynamic wallet connection modal
			dynamicClient.ui.auth.show();
		} catch (error) {
			console.error('Error opening wallet connection modal:', error);
		}
	};

	const cycleWalletConfig = () => {
		if (!currentWalletConfig) {
			dynamicClient.ui.auth.show();
			return;
		}

		const currentIndex = walletConfigs.findIndex(
			(config) => config.id === currentWalletConfig.id
		);
		const nextIndex = (currentIndex + 1) % walletConfigs.length;
		setCurrentWalletConfig(walletConfigs[nextIndex]);
		console.log('Switched to wallet config:', walletConfigs[nextIndex].name);
	};

	// Quick actions configuration
	const quickActions = [
		{
			id: 'send',
			title: 'Send',
			icon: 'arrow-up' as keyof typeof Ionicons.glyphMap,
			iconColor: 'white',
			bgColor: 'bg-blue-600',
			onPress: () => {
				if (!connectedWallet) {
					Alert.alert('Wallet Required', 'Please connect your wallet first');
					return;
				}
				setSendModalVisible(true);
			},
		},
		{
			id: 'request',
			title: 'Request',
			icon: 'arrow-down' as keyof typeof Ionicons.glyphMap,
			iconColor: 'white',
			bgColor: 'bg-green-600',
			onPress: () => {
				setRequestModalVisible(true);
			},
		},
		{
			id: 'savings',
			title: 'Save',
			icon: 'wallet' as keyof typeof Ionicons.glyphMap,
			iconColor: 'white',
			bgColor: 'bg-purple-600',
			onPress: () => {
				router.push('/pots');
			},
		},
	];

	// Handle send completion
	const handleSendComplete = (
		amount: number,
		recipients: string[],
		note: string,
		currency: 'USDC' | 'ETH',
		category?: string,
		potId?: string
	) => {
		console.log('Send completed:', {
			amount,
			recipients,
			note,
			currency,
			category,
			potId,
		});

		// Invalidate balances and refresh all data after sending
		if (walletAddress) {
			// Force refresh balances, activity, and stats after sending
			setTimeout(() => {
				fetchBalances(walletAddress, true);
				fetchRecentActivity(); // Refresh recent activity
				refreshWeeklyStats(); // Refresh weekly stats with new transaction
			}, 2000); // Wait 2 seconds for transaction to be confirmed
		}

		// Don't close modal here - let the success popup handle it
		// The SendModal will show success state and user can manually close
	};

	// Handle modal close (when user clicks "Done" on success popup)
	const handleSendModalClose = () => {
		setSendModalVisible(false);
	};

	// Handle request completion
	const handleRequestComplete = (
		amount: number,
		requesters: string[],
		note: string
	) => {
		console.log('Request completed:', { amount, requesters, note });
		Alert.alert(
			'Request Sent!',
			`Successfully requested $${amount} from ${requesters.join(', ')}`,
			[{ text: 'OK' }]
		);
		// Close modal
		setRequestModalVisible(false);
	};

	return (
		<SafeAreaView className='flex-1 bg-gray-200' edges={['top']}>
			<ScrollView
				className='flex-1 px-6'
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 16 }}
			>
				{/* Header */}
				<HomeHeader
					firstName={userData.firstName}
					subtitle={`${greeting}!`}
					onNotificationPress={() => console.log('Notifications pressed')}
				/>

				{/* Connection Status */}
				{!shouldBeConnected && (
					<View className='p-4 mb-4 border border-yellow-200 bg-yellow-50 rounded-xl'>
						<View className='flex-row items-center justify-between'>
							<View className='flex-1'>
								<Text className='text-sm font-medium text-yellow-800'>
									Wallet Not Connected
								</Text>
								<Text className='mt-1 text-xs text-yellow-600'>
									Connect your wallet to view real-time balances and
									transactions
								</Text>
							</View>
							<TouchableOpacity
								className='px-4 py-2 bg-yellow-600 rounded-lg'
								onPress={handleConnectWallet}
							>
								<Text className='text-sm font-medium text-white'>
									Connect Wallet
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				)}

				{/* Balance Card */}
				<View className='mb-6'>
					<TouchableOpacity onPress={cycleWalletConfig} activeOpacity={0.8}>
						{currentWalletConfig && (
							<WalletCard
								usdcBalance={walletData.usdcBalance}
								ethBalance={walletData.ethBalance}
								walletAddress={walletData.walletAddress}
								onSendPress={handleSend}
								gradientColors={currentWalletConfig.gradientColors}
								showEthBalance={currentWalletConfig.showEthBalance}
								showWalletAddress={currentWalletConfig.showWalletAddress}
							/>
						)}
					</TouchableOpacity>
				</View>

				{/* Quick Stats */}
				<QuickStats
					sent={dynamicStats.sent}
					received={dynamicStats.received}
					transactions={dynamicStats.transactions}
					onRefresh={handleRefresh}
					isLoading={isLoading || statsLoading}
				/>

				{/* Quick Actions */}
				<QuickActions actions={quickActions} title='Quick Actions' />

				{/* Recent Activity */}
				<RecentActivity
					activities={recentActivity}
					onViewAll={handleViewAllActivity}
					className='web:mb-8'
				/>
			</ScrollView>

			{/* Send Modal */}
			<SendModal
				visible={sendModalVisible}
				onClose={handleSendModalClose}
				onSend={handleSendComplete}
			/>

			{/* Request Modal */}
			<RequestModal
				visible={requestModalVisible}
				onClose={() => setRequestModalVisible(false)}
				onRequest={handleRequestComplete}
			/>
		</SafeAreaView>
	);
}
