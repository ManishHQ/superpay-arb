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
import { useState } from 'react';

// Mock data for display purposes
const mockUser = {
	firstName: 'John',
	lastName: 'Doe',
};

const mockBalances = {
	usdcBalance: '1,234.56',
	ethBalance: '0.5432',
	walletAddress: '0x1234...5678',
};

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
];

export default function HomeScreen() {
	const [isLoading, setIsLoading] = useState(false);

	const handleSend = () => {
		console.log('Send button pressed - move logic to services');
	};

	const handleRequest = () => {
		console.log('Request button pressed - move logic to services');
	};

	const handleSplit = () => {
		console.log('Split button pressed - move logic to services');
	};

	const handleRefresh = () => {
		console.log('Refresh button pressed - move logic to services');
		setIsLoading(true);
		setTimeout(() => setIsLoading(false), 1000);
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
							<Text className='text-2xl font-bold text-gray-900'>
								Welcome back, {mockUser.firstName}!
							</Text>
							<Text className='text-base text-gray-600'>
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
									{mockBalances.usdcBalance}
								</Text>
								<Text
									style={{ color: 'rgba(255, 255, 255, 0.8)' }}
									className='ml-2 text-lg'
								>
									USDC
								</Text>
							</View>
							<View className='flex-row items-center'>
								<Text className='text-lg font-semibold text-white'>
									{mockBalances.ethBalance}
								</Text>
								<Text
									style={{ color: 'rgba(255, 255, 255, 0.8)' }}
									className='ml-2 text-sm'
								>
									ETH
								</Text>
							</View>
						</View>
						<TouchableOpacity
							className='px-4 py-2 bg-white rounded-full'
							onPress={handleSend}
						>
							<View className='flex-row items-center'>
								<Ionicons name='send' size={16} color='#3D5AFE' />
								<Text className='ml-1 text-sm font-medium text-blue-600'>
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
							{mockBalances.walletAddress}
						</Text>
					</View>
				</LinearGradient>

				{/* Quick Stats */}
				<View className='my-6'>
					<View className='flex-row items-center justify-between mb-3'>
						<Text className='text-xl font-semibold text-gray-900'>
							This Week
						</Text>
						<TouchableOpacity onPress={handleRefresh}>
							<Ionicons
								name='refresh'
								size={20}
								color='#3D5AFE'
								style={{ opacity: isLoading ? 0.5 : 1 }}
							/>
						</TouchableOpacity>
					</View>
					<View className='p-6 bg-white shadow-sm rounded-2xl'>
						<View className='flex-row justify-between'>
							<View className='items-center'>
								<Text className='text-2xl font-bold text-blue-600'>
									${mockWeeklyStats.sent.toFixed(2)}
								</Text>
								<Text className='text-sm text-gray-500'>Sent</Text>
							</View>
							<View className='items-center'>
								<Text className='text-2xl font-bold text-green-600'>
									${mockWeeklyStats.received.toFixed(2)}
								</Text>
								<Text className='text-sm text-gray-500'>Received</Text>
							</View>
							<View className='items-center'>
								<Text className='text-2xl font-bold text-blue-600'>
									{mockWeeklyStats.transactions}
								</Text>
								<Text className='text-sm text-gray-500'>Transactions</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Quick Actions */}
				<View className='mb-6'>
					<Text className='mb-3 text-xl font-semibold text-gray-900'>
						Quick Actions
					</Text>
					<View className='flex-row justify-between space-x-4 bg-white rounded-2xl'>
						<TouchableOpacity
							className='items-center flex-1 py-6 shadow-sm rounded-2xl'
							onPress={handleSend}
						>
							<View className='items-center justify-center w-12 h-12 mb-3 rounded-full bg-blue-600'>
								<Ionicons name='arrow-up' size={24} color='white' />
							</View>
							<Text className='text-base font-medium text-gray-900'>Send</Text>
						</TouchableOpacity>

						<TouchableOpacity
							className='items-center flex-1 py-6 shadow-sm rounded-2xl'
							onPress={handleRequest}
						>
							<View className='items-center justify-center w-12 h-12 mb-3 rounded-full bg-green-600'>
								<Ionicons name='arrow-down' size={24} color='white' />
							</View>
							<Text className='text-base font-medium text-gray-900'>
								Request
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							className='items-center flex-1 py-6 shadow-sm rounded-2xl'
							onPress={handleSplit}
						>
							<View className='items-center justify-center w-12 h-12 mb-3 bg-gray-200 rounded-full'>
								<Ionicons name='people' size={24} color='#3D5AFE' />
							</View>
							<Text className='text-base font-medium text-gray-900'>Split</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Recent Activity */}
				<View className='p-6 mb-6 bg-white shadow-sm rounded-2xl'>
					<View className='flex-row items-center justify-between mb-6'>
						<Text className='text-xl font-semibold text-gray-900'>
							Recent Activity
						</Text>
						<TouchableOpacity>
							<Text className='text-base font-medium text-blue-600'>
								View All
							</Text>
						</TouchableOpacity>
					</View>

					{mockRecentActivity.map((activity) => (
						<View
							key={activity.id}
							className='flex-row items-center justify-between py-4 border-b border-gray-100 last:border-b-0'
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
									<Text className='text-base font-medium text-gray-900'>
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
										activity.type === 'sent' ? 'text-red-500' : 'text-green-600'
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
			<TouchableOpacity
				className='absolute items-center justify-center w-16 h-16 rounded-full shadow-lg bottom-8 right-6 bg-blue-600'
				onPress={handleSend}
			>
				<Ionicons name='add' size={36} color='white' />
			</TouchableOpacity>
		</SafeAreaView>
	);
}
