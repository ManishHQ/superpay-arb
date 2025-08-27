import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart, LineChart, BarChart } from 'react-native-gifted-charts';
import { useSavingsPotsStore } from '@/stores/savingsPotsStore';

const { width } = Dimensions.get('window');

// Mock data for spending categories
const spendingCategories = [
	{
		id: '1',
		name: 'Food & Dining',
		amount: 245.5,
		percentage: 35,
		color: '#FF6B6B',
		icon: '🍕',
		value: 35,
	},
	{
		id: '2',
		name: 'Transportation',
		amount: 180.0,
		percentage: 25,
		color: '#4ECDC4',
		icon: '🚗',
		value: 25,
	},
	{
		id: '3',
		name: 'Shopping',
		amount: 140.25,
		percentage: 20,
		color: '#45B7D1',
		icon: '🛍️',
		value: 20,
	},
	{
		id: '4',
		name: 'Entertainment',
		amount: 85.75,
		percentage: 12,
		color: '#96CEB4',
		icon: '🎬',
		value: 12,
	},
	{
		id: '5',
		name: 'Utilities',
		amount: 65.5,
		percentage: 8,
		color: '#FFEAA7',
		icon: '⚡',
		value: 8,
	},
];

// Weekly spending trend data
const weeklySpendingData = [
	{ value: 120, label: 'Mon', frontColor: '#3B82F6' },
	{ value: 85, label: 'Tue', frontColor: '#3B82F6' },
	{ value: 150, label: 'Wed', frontColor: '#3B82F6' },
	{ value: 95, label: 'Thu', frontColor: '#3B82F6' },
	{ value: 200, label: 'Fri', frontColor: '#3B82F6' },
	{ value: 180, label: 'Sat', frontColor: '#3B82F6' },
	{ value: 110, label: 'Sun', frontColor: '#3B82F6' },
];

// Monthly spending trend data
const monthlySpendingData = [
	{ value: 450, dataPointText: '450', label: 'Jan' },
	{ value: 520, dataPointText: '520', label: 'Feb' },
	{ value: 380, dataPointText: '380', label: 'Mar' },
	{ value: 620, dataPointText: '620', label: 'Apr' },
	{ value: 580, dataPointText: '580', label: 'May' },
	{ value: 720, dataPointText: '720', label: 'Jun' },
	{ value: 680, dataPointText: '680', label: 'Jul' },
	{ value: 550, dataPointText: '550', label: 'Aug' },
	{ value: 490, dataPointText: '490', label: 'Sep' },
	{ value: 640, dataPointText: '640', label: 'Oct' },
	{ value: 580, dataPointText: '580', label: 'Nov' },
	{ value: 750, dataPointText: '750', label: 'Dec' },
];

// Weekly yield data
const weeklyYieldData = [
	{ value: 12.5, label: 'Mon', frontColor: '#10B981' },
	{ value: 15.2, label: 'Tue', frontColor: '#10B981' },
	{ value: 18.0, label: 'Wed', frontColor: '#10B981' },
	{ value: 14.8, label: 'Thu', frontColor: '#10B981' },
	{ value: 22.3, label: 'Fri', frontColor: '#10B981' },
	{ value: 19.7, label: 'Sat', frontColor: '#10B981' },
	{ value: 16.1, label: 'Sun', frontColor: '#10B981' },
];

// Monthly yield data
const monthlyYieldData = [
	{ value: 45.2, dataPointText: '45', label: 'Jan' },
	{ value: 52.8, dataPointText: '53', label: 'Feb' },
	{ value: 38.5, dataPointText: '39', label: 'Mar' },
	{ value: 67.3, dataPointText: '67', label: 'Apr' },
	{ value: 59.8, dataPointText: '60', label: 'May' },
	{ value: 78.9, dataPointText: '79', label: 'Jun' },
	{ value: 71.2, dataPointText: '71', label: 'Jul' },
	{ value: 55.6, dataPointText: '56', label: 'Aug' },
	{ value: 49.3, dataPointText: '49', label: 'Sep' },
	{ value: 64.7, dataPointText: '65', label: 'Oct' },
	{ value: 58.4, dataPointText: '58', label: 'Nov' },
	{ value: 82.1, dataPointText: '82', label: 'Dec' },
];

// Pie chart data for categories
const pieData = spendingCategories.map((category, index) => ({
	value: category.value,
	color: category.color,
	gradientCenterColor: category.color,
	focused: index === 0,
	text: `${category.percentage}%`,
}));

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
	const [chartView, setChartView] = useState('combined'); // 'spending' | 'yield' | 'combined'
	
	// Get savings pots store data
	const { getActivePots } = useSavingsPotsStore();
	const activePots = getActivePots();
	
	// Calculate yield stats
	const yieldEnabledPots = activePots.filter(pot => pot.isYieldEnabled);
	const totalSpending = timeFrame === 'week' ? 716.00 : 2847.50;
	const totalYield = timeFrame === 'week' ? 118.60 : 683.80;
	const netCashFlow = totalYield - totalSpending;
	const averageAPY = yieldEnabledPots.length > 0 
		? yieldEnabledPots.reduce((sum, pot) => sum + (pot.apy || 0), 0) / yieldEnabledPots.length 
		: 0;

	const renderDot = (color: string) => {
		return (
			<View
				style={{
					height: 10,
					width: 10,
					borderRadius: 5,
					backgroundColor: color,
					marginRight: 10,
				}}
			/>
		);
	};

	return (
		<SafeAreaView className='flex-1 bg-bg-light'>
			<ScrollView
				className='flex-1 px-6 py-6'
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<View className='mb-6'>
					<Text className='text-3xl font-bold text-gray-900'>Track</Text>
					<Text className='text-gray-600 mt-1'>Monitor your spending patterns</Text>
				</View>

				{/* Time Frame Toggle */}
				<View className='flex-row p-2 mb-8 bg-white rounded-2xl shadow-sm'>
					<TouchableOpacity
						className={`flex-1 py-4 rounded-xl ${
							timeFrame === 'week' ? 'bg-blue-600' : 'bg-transparent'
						}`}
						onPress={() => setTimeFrame('week')}
					>
						<Text
							className={`text-center font-medium text-base ${
								timeFrame === 'week' ? 'text-white' : 'text-gray-700'
							}`}
						>
							This Week
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						className={`flex-1 py-4 rounded-xl ${
							timeFrame === 'month' ? 'bg-blue-600' : 'bg-transparent'
						}`}
						onPress={() => setTimeFrame('month')}
					>
						<Text
							className={`text-center font-medium text-base ${
								timeFrame === 'month' ? 'text-white' : 'text-gray-700'
							}`}
						>
							This Month
						</Text>
					</TouchableOpacity>
				</View>

				{/* Total Spending */}
				<View className='p-6 mb-6 bg-white rounded-xl shadow-sm'>
					<Text className='mb-3 text-lg font-semibold text-gray-900'>
						Total Spending
					</Text>
					<Text className='text-3xl font-bold text-gray-900'>
						${timeFrame === 'week' ? '716.00' : '2,847.50'}
					</Text>
					<Text className='mt-2 text-base text-gray-500'>
						{timeFrame === 'week' ? 'This week' : 'This month'}
					</Text>
					<View className='flex-row items-center mt-3'>
						<Ionicons 
							name={timeFrame === 'week' ? 'trending-down' : 'trending-up'} 
							size={16} 
							color={timeFrame === 'week' ? '#10B981' : '#EF4444'} 
						/>
						<Text className={`ml-2 text-sm font-medium ${
							timeFrame === 'week' ? 'text-green-600' : 'text-red-600'
						}`}>
							{timeFrame === 'week' ? '12% less than last week' : '8% more than last month'}
						</Text>
					</View>
				</View>

				{/* Spending Trend Chart */}
				<View className='p-4 mb-6 bg-white rounded-xl'>
					<Text className='mb-4 text-lg font-semibold text-gray-900'>
						Spending Trend
					</Text>
					<View style={{ alignItems: 'center', overflow: 'hidden' }}>
						{timeFrame === 'week' ? (
							<BarChart
								data={weeklySpendingData}
								width={width - 120}
								height={180}
								barWidth={24}
								spacing={16}
								roundedTop
								roundedBottom
								hideRules
								xAxisThickness={0}
								yAxisThickness={0}
								yAxisTextStyle={{ color: '#9CA3AF', fontSize: 12 }}
								noOfSections={3}
								maxValue={220}
								isAnimated
								animationDuration={800}
								initialSpacing={20}
								endSpacing={20}
							/>
						) : (
							<LineChart
								data={monthlySpendingData}
								width={width - 120}
								height={180}
								curved
								isAnimated
								animationDuration={800}
								color="#3B82F6"
								thickness={2}
								dataPointsColor="#3B82F6"
								hideRules
								xAxisThickness={1}
								xAxisColor="#E5E7EB"
								yAxisThickness={0}
								hideDataPoints={false}
								dataPointsRadius={3}
								textColor="#374151"
								textShiftY={-8}
								textShiftX={-5}
								textFontSize={10}
								initialSpacing={30}
								endSpacing={30}
								showVerticalLines={false}
								rulesType="solid"
								rulesColor="#E5E7EB"
								showYAxisIndices={false}
								xAxisLabelTextStyle={{
									color: '#9CA3AF',
									fontSize: 12,
									textAlign: 'center'
								}}
							/>
						)}
					</View>
				</View>

				{/* Yield Earnings */}
				<LinearGradient
					colors={['#F0FDF4', '#ECFDF5']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					style={{ borderRadius: 12, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: '#BBF7D0' }}
				>
					<View className='flex-row items-center justify-between mb-4'>
						<View>
							<Text className='text-lg font-semibold text-green-900'>
								Yield Earned
							</Text>
							<Text className='text-3xl font-bold text-green-600'>
								${timeFrame === 'week' ? '118.60' : '683.80'}
							</Text>
							<Text className='text-sm text-green-700 mt-1'>
								{timeFrame === 'week' ? 'This week' : 'This month'}
							</Text>
						</View>
						<View className='items-end'>
							<View className='p-3 bg-green-100 rounded-full'>
								<Ionicons name='trending-up' size={24} color='#059669' />
							</View>
							{averageAPY > 0 && (
								<Text className='text-sm font-medium text-green-600 mt-2'>
									{averageAPY.toFixed(1)}% APY
								</Text>
							)}
						</View>
					</View>
					<View className='flex-row items-center'>
						<Ionicons name='leaf' size={16} color='#059669' />
						<Text className='ml-2 text-sm text-green-700'>
							From {yieldEnabledPots.length} earning pot{yieldEnabledPots.length !== 1 ? 's' : ''}
						</Text>
					</View>
				</LinearGradient>

				{/* Yield Trend Chart */}
				<View className='p-4 mb-6 bg-white rounded-xl'>
					<Text className='mb-4 text-lg font-semibold text-gray-900'>
						Yield Trend
					</Text>
					<View style={{ alignItems: 'center', overflow: 'hidden' }}>
						{timeFrame === 'week' ? (
							<BarChart
								data={weeklyYieldData}
								width={width - 120}
								height={160}
								barWidth={24}
								spacing={16}
								roundedTop
								roundedBottom
								hideRules
								xAxisThickness={0}
								yAxisThickness={0}
								yAxisTextStyle={{ color: '#9CA3AF', fontSize: 12 }}
								noOfSections={3}
								maxValue={25}
								isAnimated
								animationDuration={800}
								initialSpacing={20}
								endSpacing={20}
							/>
						) : (
							<LineChart
								data={monthlyYieldData}
								width={width - 120}
								height={160}
								curved
								isAnimated
								animationDuration={800}
								color="#10B981"
								thickness={2}
								dataPointsColor="#10B981"
								hideRules
								xAxisThickness={1}
								xAxisColor="#E5E7EB"
								yAxisThickness={0}
								hideDataPoints={false}
								dataPointsRadius={3}
								textColor="#374151"
								textShiftY={-8}
								textShiftX={-5}
								textFontSize={10}
								initialSpacing={30}
								endSpacing={30}
								showVerticalLines={false}
								rulesType="solid"
								rulesColor="#E5E7EB"
								showYAxisIndices={false}
								xAxisLabelTextStyle={{
									color: '#9CA3AF',
									fontSize: 12,
									textAlign: 'center'
								}}
							/>
						)}
					</View>
				</View>

				{/* Categories Overview */}
				<View className='p-4 mb-6 bg-white rounded-xl'>
					<Text className='mb-4 text-lg font-semibold text-gray-900'>
						Categories
					</Text>
					<View style={{ alignItems: 'center', marginBottom: 20 }}>
						<PieChart
							data={pieData}
							donut
							radius={80}
							innerRadius={50}
							innerCircleColor={'#ffffff'}
							centerLabelComponent={() => {
								return (
									<View style={{ justifyContent: 'center', alignItems: 'center' }}>
										<Text style={{ fontSize: 18, color: '#374151', fontWeight: 'bold' }}>
											${timeFrame === 'week' ? '716' : '2,847'}
										</Text>
										<Text style={{ fontSize: 12, color: '#9CA3AF' }}>Total</Text>
									</View>
								);
							}}
						/>
					</View>

					{/* Category List */}
					{spendingCategories.slice(0, 3).map((category) => (
						<View key={category.id} className='flex-row items-center justify-between py-2'>
							<View className='flex-row items-center flex-1'>
								{renderDot(category.color)}
								<Text className='mr-3 text-lg'>{category.icon}</Text>
								<View className='flex-1'>
									<Text className='text-base font-medium text-gray-900'>
										{category.name}
									</Text>
									<Text className='text-sm text-gray-500'>
										{category.percentage}%
									</Text>
								</View>
							</View>
							<Text className='text-base font-semibold text-gray-900'>
								${category.amount}
							</Text>
						</View>
					))}
					
					<TouchableOpacity className='mt-3 py-2'>
						<Text className='text-center text-sm font-medium text-blue-600'>
							View all categories
						</Text>
					</TouchableOpacity>
				</View>

				{/* Recent Spending */}
				<View className='p-4 mb-6 bg-white rounded-xl'>
					<View className='flex-row items-center justify-between mb-4'>
						<Text className='text-lg font-semibold text-gray-900'>
							Recent Transactions
						</Text>
						<TouchableOpacity>
							<Text className='text-sm font-medium text-blue-600'>View All</Text>
						</TouchableOpacity>
					</View>
					{recentSpending.slice(0, 4).map((item) => (
						<View key={item.id} className='flex-row items-center justify-between py-3'>
							<View className='flex-row items-center flex-1'>
								<Text className='mr-3 text-xl'>{item.icon}</Text>
								<View className='flex-1'>
									<Text className='text-base font-medium text-gray-900'>
										{item.name}
									</Text>
									<Text className='text-sm text-gray-500'>
										{item.time}
									</Text>
								</View>
							</View>
							<Text className='text-base font-semibold text-gray-900'>
								-${item.amount}
							</Text>
						</View>
					))}
				</View>

				{/* Insights */}
				<View className='p-4 mb-20 bg-blue-50 rounded-xl'>
					<View className='flex-row items-center mb-3'>
						<Ionicons name='bulb-outline' size={20} color='#3B82F6' />
						<Text className='ml-2 text-base font-semibold text-blue-900'>
							Insight
						</Text>
					</View>
					<Text className='text-sm text-blue-800'>
						{timeFrame === 'week' 
							? "You've spent 15% less on dining this week. Keep it up!"
							: "Your transportation costs are 8% higher than usual this month."
						}
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
