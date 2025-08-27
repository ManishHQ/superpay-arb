import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';

interface ActivityItem {
	id: string;
	name: string;
	avatar: string;
	amount: number;
	type: 'sent' | 'received';
	note: string;
	time: string;
}

interface RecentActivityProps {
	activities: ActivityItem[];
	title?: string;
	showViewAll?: boolean;
	onViewAll?: () => void;
	className?: string;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
	activities,
	title = 'Recent Activity',
	showViewAll = true,
	onViewAll,
	className = '',
}) => {
	return (
		<View
			className={`p-6 mb-6 bg-white shadow-sm rounded-2xl ${className}`}
			style={{ marginBottom: 112 }}
		>
			<View className='flex-row items-center justify-between mb-6'>
				<Text className='text-xl font-semibold text-gray-900'>{title}</Text>
				{showViewAll && onViewAll && (
					<TouchableOpacity onPress={onViewAll}>
						<Text className='text-base font-medium text-blue-600'>
							View All
						</Text>
					</TouchableOpacity>
				)}
			</View>

			{activities.map((activity) => (
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
	);
};
