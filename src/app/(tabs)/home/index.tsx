import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, useEffect, useMemo } from 'react';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import {
	WalletCard,
	QuickStats,
	QuickActions,
	RecentActivity,
	HomeHeader,
} from '@/components';
import { dynamicClient } from '@/lib/client';
import { Wallet } from '@dynamic-labs/client';
import { useWalletStore } from '@/stores/walletStore';

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

const mockRecentActivity = [
	{
		id: '1',
		name: 'Sarah Wilson',
		avatar: 'https://i.pravatar.cc/150?img=1',
		amount: 25.5,
		type: 'sent' as const,
		note: 'Coffee ☕',
		time: '2 hours ago',
	},
	{
		id: '2',
		name: 'Mike Chen',
		avatar: 'https://i.pravatar.cc/150?img=2',
		amount: 45.0,
		type: 'received' as const,
		note: 'Lunch 🍕',
		time: '4 hours ago',
	},
	{
		id: '3',
		name: 'Emma Davis',
		avatar: 'https://i.pravatar.cc/150?img=3',
		amount: 12.75,
		type: 'sent' as const,
		note: 'Uber ride 🚕',
		time: '1 day ago',
	},
];

// Quick actions configuration
const quickActions = [
	{
		id: 'send',
		title: 'Send',
		icon: 'arrow-up' as keyof typeof Ionicons.glyphMap,
		iconColor: 'white',
		bgColor: 'bg-blue-600',
		onPress: () => console.log('Send button pressed - move logic to services'),
	},
	{
		id: 'request',
		title: 'Request',
		icon: 'arrow-down' as keyof typeof Ionicons.glyphMap,
		iconColor: 'white',
		bgColor: 'bg-green-600',
		onPress: () =>
			console.log('Request button pressed - move logic to services'),
	},
	{
		id: 'split',
		title: 'Split',
		icon: 'people' as keyof typeof Ionicons.glyphMap,
		iconColor: '#3D5AFE',
		bgColor: 'bg-gray-200',
		onPress: () => console.log('Split button pressed - move logic to services'),
	},
];

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

	// Use Zustand store for wallet state
	const {
		isConnected: isWalletConnected,
		isLoading: isWalletLoading,
		balances,
		address: walletAddress,
		shortAddress,
		error: walletError,
		fetchBalances,
		setConnected,
		reset: resetWallet,
	} = useWalletStore();

	// Create wallet data object for compatibility with existing components
	const walletData = useMemo(() => ({
		usdcBalance: balances.usdc,
		ethBalance: balances.eth,
		walletAddress: shortAddress || 'Not connected',
	}), [balances.usdc, balances.eth, shortAddress]);

	// Check if wallet should be connected based on Dynamic state
	const shouldBeConnected = auth.token && wallets.userWallets.length > 0;

	console.log('isWalletConnected', isWalletConnected);
	console.log('wallets.userWallets', wallets.userWallets);
	console.log('auth.token', auth.token);

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
				setConnected(true);
				
				// Fetch balances using the store
				fetchBalances(address);
				console.log('Wallet connected, fetching balances for:', address);
			}
		} else {
			// Reset wallet state when not connected
			setConnectedWallet(null);
			resetWallet();
			console.log('Wallet disconnected, resetting state');
		}
	}, [shouldBeConnected, wallets.userWallets, fetchBalances, setConnected, resetWallet]);

	// Auto-refresh balances every 2 minutes when connected
	useEffect(() => {
		if (!isWalletConnected || !walletAddress) return;

		const interval = setInterval(() => {
			console.log('Auto-refreshing balances...');
			fetchBalances(walletAddress); // Normal fetch, respects debouncing
		}, 120000); // 2 minutes

		return () => clearInterval(interval);
	}, [isWalletConnected, walletAddress, fetchBalances]);

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

	// Simulate real-time stats updates
	useEffect(() => {
		const updateStats = () => {
			setDynamicStats((prev) => ({
				...prev,
				sent: prev.sent + Math.random() * 10,
				received: prev.received + Math.random() * 5,
				transactions: prev.transactions + Math.floor(Math.random() * 2),
			}));
		};

		const statsInterval = setInterval(updateStats, 30000); // Update every 30 seconds

		return () => clearInterval(statsInterval);
	}, []);

	const handleSend = async () => {
		if (!connectedWallet) {
			console.log('No wallet connected');
			// Show connection prompt
			dynamicClient.ui.auth.show();
			return;
		}

		console.log('Send button pressed with wallet:', connectedWallet.address);

		try {
			// For now, just log the action
			// In a real implementation, you would open a send modal
			console.log('Opening send payment modal...');

			// You can implement a send modal here or navigate to a send screen
			// For example: router.push('/send-payment');
		} catch (error) {
			console.error('Error in handleSend:', error);
		}
	};

	const handleRefresh = async () => {
		console.log('Refresh button pressed - force refreshing wallet data');
		setIsLoading(true);

		try {
			// Force refresh balances even if recently fetched
			if (connectedWallet && walletAddress) {
				await fetchBalances(walletAddress, true); // Force refresh
				console.log('Balances force refreshed via store');
			}
		} catch (error) {
			console.error('Error refreshing balance:', error);
		} finally {
			setIsLoading(false);
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
		const currentIndex = walletConfigs.findIndex(
			(config) => config.id === currentWalletConfig.id
		);
		const nextIndex = (currentIndex + 1) % walletConfigs.length;
		setCurrentWalletConfig(walletConfigs[nextIndex]);
		console.log('Switched to wallet config:', walletConfigs[nextIndex].name);
	};

	return (
		<SafeAreaView className='flex-1' edges={['top']}>
			<ScrollView
				className='flex-1 px-6'
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 16 }}
			>
				{/* Header */}
				<HomeHeader
					firstName={userData.firstName}
					subtitle={`${greeting}! Here is your summary for the week.`}
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
						<WalletCard
							usdcBalance={walletData.usdcBalance}
							ethBalance={walletData.ethBalance}
							walletAddress={walletData.walletAddress}
							onSendPress={handleSend}
							gradientColors={currentWalletConfig.gradientColors}
							showEthBalance={currentWalletConfig.showEthBalance}
							showWalletAddress={currentWalletConfig.showWalletAddress}
						/>
					</TouchableOpacity>
				</View>

				{/* Quick Stats */}
				<QuickStats
					sent={dynamicStats.sent}
					received={dynamicStats.received}
					transactions={dynamicStats.transactions}
					onRefresh={handleRefresh}
					isLoading={isLoading}
				/>

				{/* Quick Actions */}
				<QuickActions actions={quickActions} title='Quick Actions' />

				{/* Recent Activity */}
				<RecentActivity
					activities={mockRecentActivity}
					onViewAll={handleViewAllActivity}
					className='mb-32 web:mb-8'
				/>
			</ScrollView>
		</SafeAreaView>
	);
}
