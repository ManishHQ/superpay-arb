import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRef, useState, useEffect } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import SendBottomSheet from '../../../components/SendBottomSheet';
import RequestBottomSheet from '@/components/RequestBottomSheet';
import SplitBottomSheet from '@/components/SplitBottomSheet';
import SendModal from '@/components/SendModal';
import { useBalanceStore } from '@/stores/balanceStore';
import { PaymentService } from '@/services/paymentService';
import { useUserStore } from '@/stores/userStore';

// Mock data for recent activity with random avatar URLs
const recentActivity = [
	{
		id: '1',
		name: 'Sarah Wilson',
		avatar: 'https://i.pravatar.cc/150?img=1',
		amount: 25.5,
		type: 'sent',
		note: 'Coffee ☕',
		time: '2 hours ago',
	},
	{
		id: '2',
		name: 'Mike Chen',
		avatar: 'https://i.pravatar.cc/150?img=2',
		amount: 45.0,
		type: 'received',
		note: 'Lunch 🍕',
		time: '4 hours ago',
	},
	{
		id: '3',
		name: 'Emma Davis',
		avatar: 'https://i.pravatar.cc/150?img=3',
		amount: 12.75,
		type: 'sent',
		note: 'Uber ride 🚕',
		time: '1 day ago',
	},
	{
		id: '4',
		name: 'John Smith',
		avatar: 'https://i.pravatar.cc/150?img=4',
		amount: 30.0,
		type: 'received',
		note: 'Movie tickets 🎬',
		time: '2 days ago',
	},
];

export default function HomeScreen() {
	// Bottom sheet refs
	const sendBottomSheetRef = useRef<BottomSheetModal>(null);
	const requestBottomSheetRef = useRef<BottomSheetModal>(null);
	const splitBottomSheetRef = useRef<BottomSheetModal>(null);
	const { user } = useUserStore();

	// State for recent activity and send modal
	const [activityList, setActivityList] = useState(recentActivity);
	const [showSendModal, setShowSendModal] = useState(false);
	const [weeklyStats, setWeeklyStats] = useState({
		sent: 0,
		received: 0,
		transactions: 0,
	});

	// Balance store
	const {
		usdcBalance,
		ethBalance,
		usdcLoading,
		ethLoading,
		fetchAllBalances,
		refreshAllBalances,
		walletAddress,
	} = useBalanceStore();

	// Load data on component mount
	useEffect(() => {
		fetchAllBalances();
		loadPaymentStats();
	}, []);

	// Load payment statistics
	const loadPaymentStats = async () => {
		try {
			const stats = await PaymentService.getPaymentStats();
			// Process stats to get weekly data
			setWeeklyStats({
				sent: stats.data?.totalSent || 0,
				received: stats.data?.totalReceived || 0,
				transactions: stats.data?.totalTransactions || 0,
			});
		} catch (error) {
			console.error('Error loading payment stats:', error);
		}
	};

	// Handle send money
	const handleSend = async (
		amount: number,
		recipients: string[],
		note: string
	) => {
		const recipientNames = recipients.join(', ');
		const newActivity = {
			id: Date.now().toString(),
			name:
				recipients.length > 1 ? `${recipients.length} people` : recipients[0],
			avatar:
				'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 10 + 1),
			amount: amount,
			type: 'sent' as const,
			note: note || 'Payment',
			time: 'Just now',
		};
		setActivityList([newActivity, ...activityList]);
		console.log('Sent $' + amount + ' to ' + recipientNames);

		// Refresh balances after payment
		await refreshAllBalances();
		await loadPaymentStats();
	};

	// Handle request money
	const handleRequest = (
		amount: number,
		requesters: string[],
		note: string
	) => {
		const requesterNames = requesters.join(', ');
		const newActivity = {
			id: Date.now().toString(),
			name:
				requesters.length > 1 ? `${requesters.length} people` : requesters[0],
			avatar:
				'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 10 + 1),
			amount: amount,
			type: 'received' as const,
			note: note || 'Request',
			time: 'Just now',
		};
		setActivityList([newActivity, ...activityList]);
		console.log('Requested $' + amount + ' from ' + requesterNames);
	};

	// Handle split expense
	const handleSplit = (
		amount: number,
		groupName: string,
		note: string,
		splitMethod: string
	) => {
		const newActivity = {
			id: Date.now().toString(),
			name: groupName,
			avatar:
				'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 10 + 1),
			amount: amount,
			type: 'sent' as const,
			note: note || 'Split expense',
			time: 'Just now',
		};
		setActivityList([newActivity, ...activityList]);
		console.log(
			'Split $' +
				amount +
				' with ' +
				groupName +
				' using ' +
				splitMethod +
				' method'
		);
	};

	return (
		<SafeAreaView className='flex-1' edges={['top']}>
			<ScrollView
				className='flex-1 px-6'
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 16 }}
			>
				{/* Header */}
				<View className='mb-6'>
					<View className='flex-row items-center justify-between mb-2'>
						<View>
							<Text className='text-2xl font-bold text-text-main'>
								Welcome back, {user?.firstName || 'User'}!
							</Text>
							<Text className='text-base text-text-main'>
								Here is your summary for the week.
							</Text>
						</View>
						<TouchableOpacity className='items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm'>
							<Ionicons name='notifications' size={24} color='#3D5AFE' />
						</TouchableOpacity>
					</View>
				</View>

				{/* Balance Card */}
				<LinearGradient
					colors={['#3D5AFE', '#00C896']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					className='mb-6'
					style={{ borderRadius: 20, padding: 24 }}
				>
					<Text
						style={{ color: 'rgba(255, 255, 255, 0.9)' }}
						className='mb-3 text-base font-medium'
					>
						Wallet Balance
					</Text>
					<View className='flex-row items-center justify-between mb-4'>
						<View className='flex-1'>
							<View className='flex-row items-center mb-2'>
								<Text className='text-2xl font-bold text-white'>
									{usdcLoading
										? '...'
										: `${parseFloat(usdcBalance).toFixed(2)}`}
								</Text>
								<Text
									style={{ color: 'rgba(255, 255, 255, 0.8)' }}
									className='ml-2 text-lg'
								>
									USDC
								</Text>
								{usdcLoading && (
									<ActivityIndicator
										size='small'
										color='white'
										className='ml-2'
									/>
								)}
							</View>
							<View className='flex-row items-center'>
								<Text className='text-lg font-semibold text-white'>
									{ethLoading ? '...' : `${parseFloat(ethBalance).toFixed(4)}`}
								</Text>
								<Text
									style={{ color: 'rgba(255, 255, 255, 0.8)' }}
									className='ml-2 text-sm'
								>
									ETH
								</Text>
								{ethLoading && (
									<ActivityIndicator
										size='small'
										color='white'
										className='ml-2'
									/>
								)}
							</View>
						</View>
						<TouchableOpacity
							className='px-4 py-2 bg-white rounded-full'
							onPress={() => setShowSendModal(true)}
						>
							<View className='flex-row items-center'>
								<Ionicons name='send' size={16} color='#3D5AFE' />
								<Text className='ml-1 text-sm font-medium text-primary-blue'>
									Send
								</Text>
							</View>
						</TouchableOpacity>
					</View>
					<View className='flex-row items-center'>
						<Ionicons name='wallet' size={18} color='white' />
						<Text
							style={{ color: 'rgba(255, 255, 255, 0.9)' }}
							className='ml-2 text-sm'
						>
							{walletAddress
								? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
								: 'Loading wallet...'}
						</Text>
					</View>
				</LinearGradient>

				{/* Quick Stats */}
				<View className='my-6'>
					<Text className='mb-3 text-xl font-semibold text-text-main'>
						This Week
					</Text>
					<View className='p-6 bg-white shadow-sm rounded-2xl'>
						<View className='flex-row justify-between'>
							<View className='items-center'>
								<Text className='text-2xl font-bold text-primary-blue'>
									${weeklyStats.sent.toFixed(2)}
								</Text>
								<Text className='text-sm text-gray-500'>Sent</Text>
							</View>
							<View className='items-center'>
								<Text className='text-2xl font-bold text-primary-green'>
									${weeklyStats.received.toFixed(2)}
								</Text>
								<Text className='text-sm text-gray-500'>Received</Text>
							</View>
							<View className='items-center'>
								<Text className='text-2xl font-bold text-primary-blue'>
									{weeklyStats.transactions}
								</Text>
								<Text className='text-sm text-gray-500'>Transactions</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Quick Actions */}
				<View className='mb-6'>
					<Text className='mb-3 text-xl font-semibold text-text-main'>
						Quick Actions
					</Text>
					<View className='flex-row justify-between space-x-4 bg-white rounded-2xl'>
						<TouchableOpacity
							className='items-center flex-1 py-6 shadow-sm rounded-2xl'
							onPress={() => setShowSendModal(true)}
						>
							<View className='items-center justify-center w-12 h-12 mb-3 rounded-full bg-primary-blue'>
								<Ionicons name='arrow-up' size={24} color='white' />
							</View>
							<Text className='text-base font-medium text-text-main'>Send</Text>
						</TouchableOpacity>

						<TouchableOpacity
							className='items-center flex-1 py-6 shadow-sm rounded-2xl'
							onPress={() => requestBottomSheetRef.current?.present()}
						>
							<View className='items-center justify-center w-12 h-12 mb-3 rounded-full bg-primary-green'>
								<Ionicons name='arrow-down' size={24} color='white' />
							</View>
							<Text className='text-base font-medium text-text-main'>
								Request
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							className='items-center flex-1 py-6 shadow-sm rounded-2xl'
							onPress={() => splitBottomSheetRef.current?.present()}
						>
							<View className='items-center justify-center w-12 h-12 mb-3 bg-gray-200 rounded-full'>
								<Ionicons name='people' size={24} color='#3D5AFE' />
							</View>
							<Text className='text-base font-medium text-text-main'>
								Split
							</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Recent Activity */}
				<View className='p-6 mb-6 bg-white shadow-sm rounded-2xl'>
					<View className='flex-row items-center justify-between mb-6'>
						<Text className='text-xl font-semibold text-text-main'>
							Recent Activity
						</Text>
						<TouchableOpacity>
							<Text className='text-base font-medium text-primary-blue'>
								View All
							</Text>
						</TouchableOpacity>
					</View>

					{activityList.map((activity) => (
						<View
							key={activity.id}
							className='flex-row items-center justify-between py-4 border-b border-muted last:border-b-0'
						>
							<View className='flex-row items-center flex-1'>
								<Image
									source={{ uri: activity.avatar }}
									style={{
										width: 48,
										height: 48,
										marginRight: 16,
										borderRadius: 24,
									}}
									contentFit='cover'
									placeholder='👤'
									transition={200}
								/>
								<View className='flex-1'>
									<Text className='text-base font-medium text-text-main'>
										{activity.name}
									</Text>
									<Text className='text-sm text-gray-500'>
										{activity.note} • {activity.time}
									</Text>
								</View>
							</View>
							<View className='items-end'>
								<Text
									className={`font-semibold text-xl ${
										activity.type === 'sent'
											? 'text-red-500'
											: 'text-primary-green'
									}`}
								>
									{activity.type === 'sent' ? '-' : '+'}${activity.amount}
								</Text>
								<Text className='text-sm text-gray-600 capitalize'>
									{activity.type}
								</Text>
							</View>
						</View>
					))}
				</View>

				{/* XP Progress */}
				<LinearGradient
					colors={['#3D5AFE', '#00C896']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					className='mb-6'
					style={{ borderRadius: 20, padding: 32, marginBottom: 100 }}
				>
					<View className='flex-row items-center justify-between mb-4'>
						<Text className='text-xl font-semibold text-white'>Level 8</Text>
						<Text className='text-base text-white'>1,247 XP</Text>
					</View>
					<View
						className='h-3 mb-3 bg-white rounded-full'
						style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
					>
						<View
							className='h-3 bg-white rounded-full'
							style={{ width: '75%' }}
						/>
					</View>
					<Text className='text-base text-white'>247 XP to next level</Text>
				</LinearGradient>
			</ScrollView>

			{/* Floating Action Button */}
			<TouchableOpacity className='absolute items-center justify-center w-16 h-16 rounded-full shadow-lg bottom-8 right-6 bg-primary-blue'>
				<Ionicons name='add' size={36} color='white' />
			</TouchableOpacity>

			{/* Bottom Sheets */}
			<SendBottomSheet
				bottomSheetModalRef={sendBottomSheetRef}
				onSend={handleSend}
			/>
			<RequestBottomSheet
				bottomSheetModalRef={requestBottomSheetRef}
				onRequest={handleRequest}
			/>
			<SplitBottomSheet
				bottomSheetModalRef={splitBottomSheetRef}
				onSplit={handleSplit}
			/>

			{/* Send Modal */}
			<SendModal
				visible={showSendModal}
				onClose={() => setShowSendModal(false)}
				onSendComplete={() => {
					// Refresh balances and stats after sending
					fetchAllBalances();
					loadPaymentStats();
				}}
			/>
		</SafeAreaView>
	);
}
