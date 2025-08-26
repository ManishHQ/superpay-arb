import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface QuickStatsProps {
	sent: number;
	received: number;
	transactions: number;
	title?: string;
	onRefresh?: () => void;
	isLoading?: boolean;
	className?: string;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
	sent,
	received,
	transactions,
	title = 'This Week',
	onRefresh,
	isLoading = false,
	className = '',
}) => {
	return (
		<View className={`my-6 ${className}`}>
			<View className='flex-row items-center justify-between mb-3'>
				<Text className='text-xl font-semibold text-gray-900'>{title}</Text>
				{onRefresh && (
					<TouchableOpacity onPress={onRefresh}>
						<Ionicons
							name='refresh'
							size={20}
							color='#3D5AFE'
							style={{ opacity: isLoading ? 0.5 : 1 }}
						/>
					</TouchableOpacity>
				)}
			</View>

			<View className='p-6 bg-white shadow-sm rounded-2xl'>
				<View className='flex-row justify-between'>
					<View className='items-center'>
						<Text className='text-2xl font-bold text-blue-600'>
							${sent.toFixed(2)}
						</Text>
						<Text className='text-sm text-gray-500'>Sent</Text>
					</View>
					<View className='items-center'>
						<Text className='text-2xl font-bold text-green-600'>
							${received.toFixed(2)}
						</Text>
						<Text className='text-sm text-gray-500'>Received</Text>
					</View>
					<View className='items-center'>
						<Text className='text-2xl font-bold text-blue-600'>
							{transactions}
						</Text>
						<Text className='text-sm text-gray-500'>Transactions</Text>
					</View>
				</View>
			</View>
		</View>
	);
};
