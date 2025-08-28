import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

// Mock data for spending categories
const spendingCategories = [
	{
		id: '1',
		name: 'Food & Dining',
		amount: 245.5,
		percentage: 35,
		color: '#FF6B6B',
		icon: '🍕',
	},
	{
		id: '2',
		name: 'Transportation',
		amount: 180.0,
		percentage: 25,
		color: '#4ECDC4',
		icon: '🚗',
	},
	{
		id: '3',
		name: 'Shopping',
		amount: 140.25,
		percentage: 20,
		color: '#45B7D1',
		icon: '🛍️',
	},
	{
		id: '4',
		name: 'Entertainment',
		amount: 85.75,
		percentage: 12,
		color: '#96CEB4',
		icon: '🎬',
	},
	{
		id: '5',
		name: 'Utilities',
		amount: 65.5,
		percentage: 8,
		color: '#FFEAA7',
		icon: '⚡',
	},
];

// Mock recent spending
const recentSpending = [
	{
		id: '1',
		name: 'Coffee Shop',
		amount: 4.5,
		category: 'Food & Dining',
		time: '2 hours ago',
		icon: '☕',
	},
	{
		id: '2',
		name: 'Uber Ride',
		amount: 12.75,
		category: 'Transportation',
		time: '4 hours ago',
		icon: '🚕',
	},
	{
		id: '3',
		name: 'Grocery Store',
		amount: 45.2,
		category: 'Food & Dining',
		time: '1 day ago',
		icon: '🛒',
	},
	{
		id: '4',
		name: 'Movie Tickets',
		amount: 28.0,
		category: 'Entertainment',
		time: '2 days ago',
		icon: '🎬',
	},
	{
		id: '5',
		name: 'Gas Station',
		amount: 35.5,
		category: 'Transportation',
		time: '3 days ago',
		icon: '⛽',
	},
];

export default function TrackScreen() {
	const [timeFrame, setTimeFrame] = useState('week'); // 'week' or 'month'

	return (
		<SafeAreaView className='flex-1 bg-bg-light'>
			<ScrollView
				className='flex-1 px-6 py-6'
				showsVerticalScrollIndicator={false}
			>
				{/* XP Points Card */}
				<LinearGradient
					colors={['#3D5AFE', '#00C896']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					style={{ borderRadius: 16, padding: 32, marginBottom: 24 }}
				>
					<View className='flex-row items-center justify-between mb-6'>
						<View>
							<Text
								style={{ color: 'rgba(255, 255, 255, 0.9)' }}
								className='text-xl font-semibold'
							>
								Your XP Points
							</Text>
							<Text className='text-4xl font-bold text-white'>1,247</Text>
						</View>
						<View
							className='p-4 bg-white rounded-full'
							style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
						>
							<Ionicons name='trophy' size={36} color='white' />
						</View>
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
					<Text
						style={{ color: 'rgba(255, 255, 255, 0.9)' }}
						className='text-base'
					>
						Level 8 • 247 XP to next level
					</Text>
				</LinearGradient>

				{/* Time Frame Toggle */}
				<View className='flex-row p-2 mb-8 bg-white rounded-2xl'>
					<TouchableOpacity
						className={`flex-1 py-4 rounded-xl ${
							timeFrame === 'week' ? 'bg-primary-blue' : ''
						}`}
						onPress={() => setTimeFrame('week')}
					>
						<Text
							className={`text-center font-medium text-base ${
								timeFrame === 'week' ? 'text-white' : 'text-gray-600'
							}`}
						>
							This Week
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						className={`flex-1 py-4 rounded-xl ${
							timeFrame === 'month' ? 'bg-primary-blue' : ''
						}`}
						onPress={() => setTimeFrame('month')}
					>
						<Text
							className={`text-center font-medium text-base ${
								timeFrame === 'month' ? 'text-white' : 'text-gray-600'
							}`}
						>
							This Month
						</Text>
					</TouchableOpacity>
				</View>

				{/* Total Spending */}
				<View className='p-8 mb-8 bg-white rounded-2xl'>
					<Text className='mb-3 text-xl font-semibold text-text-main'>
						Total Spending
					</Text>
					<Text className='text-4xl font-bold text-primary-blue'>
						${timeFrame === 'week' ? '716.00' : '2,847.50'}
					</Text>
					<Text className='mt-2 text-base text-gray-500'>
						{timeFrame === 'week' ? 'This week' : 'This month'}
					</Text>
				</View>

				{/* Pie Chart Placeholder */}
				<View className='p-8 mb-8 bg-white rounded-2xl'>
					<Text className='mb-6 text-xl font-semibold text-text-main'>
						Spending by Category
					</Text>
					<View className='items-center mb-6'>
						<View className='items-center justify-center rounded-full w-36 h-36 bg-muted'>
							<Text className='text-3xl'>📊</Text>
							<Text className='mt-2 text-sm text-gray-500'>Chart</Text>
						</View>
					</View>

					{/* Category Breakdown */}
					{spendingCategories.map((category) => (
						<View
							key={category.id}
							className='flex-row items-center justify-between py-3'
						>
							<View className='flex-row items-center'>
								<Text className='mr-4 text-xl'>{category.icon}</Text>
								<View>
									<Text className='text-base font-medium text-text-main'>
										{category.name}
									</Text>
									<Text className='text-sm text-gray-500'>
										{category.percentage}%
									</Text>
								</View>
							</View>
							<Text className='text-lg font-semibold text-text-main'>
								${category.amount}
							</Text>
						</View>
					))}
				</View>

				{/* Recent Spending */}
				<View className='p-8 mb-8 bg-white rounded-2xl'>
					<Text className='mb-6 text-xl font-semibold text-text-main'>
						Recent Spending
					</Text>
					{recentSpending.map((item) => (
						<View
							key={item.id}
							className='flex-row items-center justify-between py-4 border-b border-muted last:border-b-0'
						>
							<View className='flex-row items-center'>
								<Text className='mr-4 text-2xl'>{item.icon}</Text>
								<View>
									<Text className='text-base font-medium text-text-main'>
										{item.name}
									</Text>
									<Text className='text-sm text-gray-500'>
										{item.category} • {item.time}
									</Text>
								</View>
							</View>
							<Text className='text-lg font-semibold text-text-main'>
								${item.amount}
							</Text>
						</View>
					))}
				</View>

				{/* Insights */}
				<LinearGradient
					colors={['#00C896', '#3D5AFE']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					style={{ borderRadius: 16, padding: 32, marginBottom: 100 }}
				>
					<View className='flex-row items-center mb-4'>
						<Ionicons name='bulb' size={28} color='white' />
						<Text className='ml-3 text-xl font-semibold text-white'>
							Insight
						</Text>
					</View>
					<Text className='text-base text-white'>
						You&apos;ve spent 15% less on dining this week compared to last
						week. Great job! 🎉
					</Text>
				</LinearGradient>
			</ScrollView>
		</SafeAreaView>
	);
}
