import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	Dimensions,
} from 'react-native';
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

// Combined financial data
const weeklyFinancialData = [
	{
		spending: 120,
		yield: 12.5,
		net: -107.5,
		label: 'Mon',
	},
	{
		spending: 85,
		yield: 15.2,
		net: -69.8,
		label: 'Tue',
	},
	{
		spending: 150,
		yield: 18.0,
		net: -132,
		label: 'Wed',
	},
	{
		spending: 95,
		yield: 14.8,
		net: -80.2,
		label: 'Thu',
	},
	{
		spending: 200,
		yield: 22.3,
		net: -177.7,
		label: 'Fri',
	},
	{
		spending: 180,
		yield: 19.7,
		net: -160.3,
		label: 'Sat',
	},
	{
		spending: 110,
		yield: 16.1,
		net: -93.9,
		label: 'Sun',
	},
];

const monthlyFinancialData = [
	{ spending: 450, yield: 45.2, net: -404.8, label: 'Jan' },
	{ spending: 520, yield: 52.8, net: -467.2, label: 'Feb' },
	{ spending: 380, yield: 38.5, net: -341.5, label: 'Mar' },
	{ spending: 620, yield: 67.3, net: -552.7, label: 'Apr' },
	{ spending: 580, yield: 59.8, net: -520.2, label: 'May' },
	{ spending: 720, yield: 78.9, net: -641.1, label: 'Jun' },
	{ spending: 680, yield: 71.2, net: -608.8, label: 'Jul' },
	{ spending: 550, yield: 55.6, net: -494.4, label: 'Aug' },
	{ spending: 490, yield: 49.3, net: -440.7, label: 'Sep' },
	{ spending: 640, yield: 64.7, net: -575.3, label: 'Oct' },
	{ spending: 580, yield: 58.4, net: -521.6, label: 'Nov' },
	{ spending: 750, yield: 82.1, net: -667.9, label: 'Dec' },
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
	const {
		getActivePots,
		getTotalSavings,
		globalAutoInvestEnabled,
		setGlobalAutoInvest,
	} = useSavingsPotsStore();
	const activePots = getActivePots();

	// Calculate yield stats
	const yieldEnabledPots = activePots.filter((pot) => pot.isYieldEnabled);
	const totalSaved = getTotalSavings();
	const totalSpending = timeFrame === 'week' ? 716.0 : 2847.5;
	const totalYield = timeFrame === 'week' ? 118.6 : 683.8;
	const netCashFlow = totalYield - totalSpending;
	const averageAPY =
		yieldEnabledPots.length > 0
			? yieldEnabledPots.reduce((sum, pot) => sum + (pot.apy || 0), 0) /
				yieldEnabledPots.length
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
		<SafeAreaView className='flex-1 bg-gray-200'>
			<ScrollView
				className='flex-1 px-6 py-6'
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<View className='mb-6'>
					<Text className='text-3xl font-bold text-gray-900'>Track</Text>
					<Text className='mt-1 text-gray-600'>
						Monitor your spending patterns
					</Text>
				</View>

				{/* Time Frame Toggle */}
				<View className='flex-row p-2 mb-8 bg-white shadow-sm rounded-2xl'>
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

				{/* Summary Stats */}
				<View className='flex-row mb-4 space-x-4 gap-x-4'>
					<View className='flex-1 p-4 border border-red-200 bg-red-50 rounded-xl'>
						<View className='flex-row items-center mb-1'>
							<Ionicons name='card' size={16} color='#EF4444' />
							<Text className='ml-2 text-sm font-medium text-red-600'>
								Total Spent
							</Text>
						</View>
						<Text className='text-xl font-bold text-red-900'>
							${totalSpending.toLocaleString()}
						</Text>
						<Text className='mt-1 text-sm text-red-700'>
							{timeFrame === 'week' ? 'This week' : 'This month'}
						</Text>
					</View>
					<View className='flex-1 p-4 border border-green-200 bg-green-50 rounded-xl'>
						<View className='flex-row items-center mb-1'>
							<Ionicons name='trending-up' size={16} color='#10B981' />
							<Text className='ml-2 text-sm font-medium text-green-600'>
								Yield Earned
							</Text>
						</View>
						<Text className='text-xl font-bold text-green-900'>
							${totalYield.toFixed(0)}
						</Text>
						{averageAPY > 0 && (
							<Text className='mt-1 text-sm text-green-700'>
								Avg {averageAPY.toFixed(1)}% APY
							</Text>
						)}
						<Text className='mt-1 text-sm text-green-700'>
							{timeFrame === 'week' ? 'This week' : 'This month'}
						</Text>
					</View>
				</View>

				{/* Net Cash Flow */}
				<LinearGradient
					colors={['#EFF6FF', '#F3E8FF']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					style={{
						borderRadius: 12,
						padding: 24,
						marginBottom: 24,
						borderWidth: 1,
						borderColor: '#DBEAFE',
					}}
				>
					<View className='flex-row items-center justify-between'>
						<View>
							<Text className='text-lg font-semibold text-gray-900'>
								Net Cash Flow
							</Text>
							<Text
								className={`text-3xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}
							>
								{netCashFlow >= 0 ? '+' : ''}${netCashFlow.toFixed(0)}
							</Text>
							<Text className='mt-1 text-sm text-gray-600'>
								{timeFrame === 'week' ? 'This week' : 'This month'}
							</Text>
						</View>
						<View
							className={`p-3 rounded-full ${netCashFlow >= 0 ? 'bg-green-100' : 'bg-red-100'}`}
						>
							<Ionicons
								name={netCashFlow >= 0 ? 'trending-up' : 'trending-down'}
								size={24}
								color={netCashFlow >= 0 ? '#059669' : '#DC2626'}
							/>
						</View>
					</View>
				</LinearGradient>

				{/* Financial Trend Chart */}
				<View className='p-4 mb-6 bg-white rounded-xl'>
					<View className='flex-row items-center justify-between mb-4'>
						<Text className='text-lg font-semibold text-gray-900'>
							Financial Trend
						</Text>
						<View className='flex-row p-1 bg-gray-100 rounded-lg'>
							<TouchableOpacity
								className={`px-3 py-1 rounded-md ${chartView === 'spending' ? 'bg-red-500' : 'bg-transparent'}`}
								onPress={() => setChartView('spending')}
							>
								<Text
									className={`text-xs font-medium ${chartView === 'spending' ? 'text-white' : 'text-gray-600'}`}
								>
									Spent
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								className={`px-3 py-1 rounded-md ${chartView === 'yield' ? 'bg-green-500' : 'bg-transparent'}`}
								onPress={() => setChartView('yield')}
							>
								<Text
									className={`text-xs font-medium ${chartView === 'yield' ? 'text-white' : 'text-gray-600'}`}
								>
									Earned
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								className={`px-3 py-1 rounded-md ${chartView === 'combined' ? 'bg-blue-500' : 'bg-transparent'}`}
								onPress={() => setChartView('combined')}
							>
								<Text
									className={`text-xs font-medium ${chartView === 'combined' ? 'text-white' : 'text-gray-600'}`}
								>
									Both
								</Text>
							</TouchableOpacity>
						</View>
					</View>
					<View style={{ alignItems: 'center', overflow: 'hidden' }}>
						{timeFrame === 'week' ? (
							<BarChart
								data={weeklyFinancialData.map((item) => ({
									value:
										chartView === 'spending'
											? item.spending
											: chartView === 'yield'
												? item.yield
												: Math.max(item.spending, item.yield),
									label: item.label,
									frontColor:
										chartView === 'spending'
											? '#EF4444'
											: chartView === 'yield'
												? '#10B981'
												: '#3B82F6',
								}))}
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
								maxValue={chartView === 'yield' ? 25 : 220}
								isAnimated
								animationDuration={800}
								initialSpacing={20}
								endSpacing={20}
							/>
						) : (
							<LineChart
								data={monthlyFinancialData.map((item) => ({
									value:
										chartView === 'spending'
											? item.spending
											: chartView === 'yield'
												? item.yield
												: Math.max(item.spending, item.yield),
									dataPointText:
										chartView === 'spending'
											? item.spending.toString()
											: chartView === 'yield'
												? item.yield.toString()
												: Math.max(item.spending, item.yield).toString(),
									label: item.label,
								}))}
								width={width - 120}
								height={180}
								curved
								isAnimated
								animationDuration={800}
								color={
									chartView === 'spending'
										? '#EF4444'
										: chartView === 'yield'
											? '#10B981'
											: '#3B82F6'
								}
								thickness={2}
								dataPointsColor={
									chartView === 'spending'
										? '#EF4444'
										: chartView === 'yield'
											? '#10B981'
											: '#3B82F6'
								}
								hideRules
								xAxisThickness={1}
								xAxisColor='#E5E7EB'
								yAxisThickness={0}
								hideDataPoints={false}
								dataPointsRadius={3}
								textColor='#374151'
								textShiftY={-8}
								textShiftX={-5}
								textFontSize={10}
								initialSpacing={30}
								endSpacing={30}
								showVerticalLines={false}
								rulesType='solid'
								rulesColor='#E5E7EB'
								showYAxisIndices={false}
								xAxisLabelTextStyle={{
									color: '#9CA3AF',
									fontSize: 12,
									textAlign: 'center',
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
									<View
										style={{ justifyContent: 'center', alignItems: 'center' }}
									>
										<Text
											style={{
												fontSize: 18,
												color: '#374151',
												fontWeight: 'bold',
											}}
										>
											${timeFrame === 'week' ? '716' : '2,847'}
										</Text>
										<Text style={{ fontSize: 12, color: '#9CA3AF' }}>
											Total
										</Text>
									</View>
								);
							}}
						/>
					</View>

					{/* Category List */}
					{spendingCategories.slice(0, 3).map((category) => (
						<View
							key={category.id}
							className='flex-row items-center justify-between py-2'
						>
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

					<TouchableOpacity className='py-2 mt-3'>
						<Text className='text-sm font-medium text-center text-blue-600'>
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
							<Text className='text-sm font-medium text-blue-600'>
								View All
							</Text>
						</TouchableOpacity>
					</View>
					{recentSpending.slice(0, 4).map((item) => (
						<View
							key={item.id}
							className='flex-row items-center justify-between py-3'
						>
							<View className='flex-row items-center flex-1'>
								<Text className='mr-3 text-xl'>{item.icon}</Text>
								<View className='flex-1'>
									<Text className='text-base font-medium text-gray-900'>
										{item.name}
									</Text>
									<Text className='text-sm text-gray-500'>{item.time}</Text>
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
							: 'Your transportation costs are 8% higher than usual this month.'}
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
