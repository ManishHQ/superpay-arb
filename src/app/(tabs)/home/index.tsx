import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, useEffect, useCallback } from 'react';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import {
	WalletCard,
	QuickStats,
	QuickActions,
	RecentActivity,
	XPProgress,
	HomeHeader,
} from '@/components';
import { dynamicClient, publicClient } from '@/lib/client';
import { Wallet } from '@dynamic-labs/client';

// Default data fallbacks
const defaultUser = {
	firstName: 'Guest',
	lastName: 'User',
};

const defaultBalances = {
	usdcBalance: '0.00',
	ethBalance: '0.0000',
	walletAddress: 'Not connected',
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
	const { auth, sdk, wallets } = useReactiveClient(dynamicClient);
	const [isLoading, setIsLoading] = useState(false);
	const [currentTime, setCurrentTime] = useState(new Date());
	const [greeting, setGreeting] = useState('');
	const [currentWalletConfig, setCurrentWalletConfig] = useState(
		walletConfigs[0]
	);
	const [dynamicStats, setDynamicStats] = useState(mockWeeklyStats);
	const [userData, setUserData] = useState(defaultUser);
	const [walletData, setWalletData] = useState(defaultBalances);
	const [connectedWallet, setConnectedWallet] = useState<Wallet | null>(null);
	const [isWalletLoading, setIsWalletLoading] = useState(false);

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

	// Fetch real wallet data from Dynamic
	useEffect(() => {
		const fetchWalletData = async () => {
			try {
				if (auth.token && wallets.userWallets.length > 0) {
					const connectedWallet = wallets.userWallets[0];
					console.log('Connected wallet:', connectedWallet);

					// Get wallet address
					const address = connectedWallet.address;

					// Try to get balances using Viem extension
					if (publicClient) {
						try {
							// Get ETH balance
							const ethBalance = await publicClient.getBalance({
								address: address as `0x${string}`,
							});
							console.log('ETH balance:', ethBalance);
							const ethBalanceFormatted = (Number(ethBalance) / 1e18).toFixed(
								4
							);

							// For USDC, you'd typically check a specific token contract
							// This is a simplified example
							const usdcBalance = '0.00'; // You can implement USDC balance checking here

							setWalletData({
								usdcBalance,
								ethBalance: ethBalanceFormatted,
								walletAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
							});
						} catch (error) {
							console.error('Error fetching wallet balances:', error);
							setWalletData({
								...defaultBalances,
								walletAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
							});
						}
					}
				} else {
					setWalletData(defaultBalances);
				}
			} catch (error) {
				console.error('Error in fetchWalletData:', error);
				setWalletData(defaultBalances);
			}
		};

		fetchWalletData();

		// Refresh wallet data every 30 seconds
		const walletInterval = setInterval(fetchWalletData, 30000);

		return () => clearInterval(walletInterval);
	}, [auth.token, wallets.userWallets, publicClient]);

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
		console.log('Refresh button pressed - refreshing wallet data');
		setIsLoading(true);

		try {
			// Trigger wallet data refresh
			if (connectedWallet && publicClient) {
				const ethBalance = await publicClient.getBalance({
					address: connectedWallet.address as `0x${string}`,
				});
				const ethBalanceFormatted = (Number(ethBalance) / 1e18).toFixed(4);

				setWalletData((prev) => ({
					...prev,
					ethBalance: ethBalanceFormatted,
				}));

				console.log('Balance refreshed:', ethBalanceFormatted);
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

	const cycleWalletConfig = () => {
		const currentIndex = walletConfigs.findIndex(
			(config) => config.id === currentWalletConfig.id
		);
		const nextIndex = (currentIndex + 1) % walletConfigs.length;
		setCurrentWalletConfig(walletConfigs[nextIndex]);
		console.log('Switched to wallet config:', walletConfigs[nextIndex].name);
	};

	const handleConnectWallet = () => {
		console.log('Opening Dynamic wallet connection...');
		// This will open the Dynamic wallet connection modal
		dynamicClient.ui.auth.show();
	};

	const handleDisconnect = () => {
		console.log('Disconnecting wallet...');
		// This will disconnect the current wallet
		dynamicClient.auth.logout();
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
				{!auth.token && (
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
					<View className='flex-row items-center justify-between mb-2'>
						<Text className='text-sm text-gray-500'>
							Tap to change wallet style
						</Text>
						<View className='flex-row items-center gap-2'>
							<View
								className={`w-2 h-2 rounded-full ${auth.token ? 'bg-green-500' : 'bg-red-500'}`}
							/>
							<Text className='text-xs text-gray-400'>
								{auth.token ? 'Connected' : 'Not Connected'}
							</Text>
							<Text className='text-xs text-gray-400'>
								• {currentWalletConfig.name}
							</Text>
							{isWalletLoading && (
								<View className='w-2 h-2 bg-blue-500 rounded-full animate-pulse' />
							)}
						</View>
					</View>
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

				{/* Disconnect Button */}
				{auth.token && (
					<View className='flex-row justify-end mb-6'>
						<TouchableOpacity
							className='px-4 py-2 bg-red-100 border border-red-300 rounded-lg'
							onPress={handleDisconnect}
						>
							<Text className='text-sm font-medium text-red-700'>
								Disconnect Wallet
							</Text>
						</TouchableOpacity>
					</View>
				)}

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
				/>

				{/* XP Progress */}
				<XPProgress
					level={8}
					currentXP={1247}
					nextLevelXP={1500}
					progressPercentage={75}
				/>
			</ScrollView>

			{/* Floating Action Button */}
			<TouchableOpacity
				className='absolute items-center justify-center w-16 h-16 bg-blue-600 rounded-full shadow-lg bottom-8 right-6'
				onPress={handleSend}
			>
				<Ionicons name='add' size={36} color='white' />
			</TouchableOpacity>
		</SafeAreaView>
	);
}
