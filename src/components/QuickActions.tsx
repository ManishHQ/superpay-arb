import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ActionItem {
	id: string;
	title: string;
	icon: keyof typeof Ionicons.glyphMap;
	iconColor: string;
	bgColor: string;
	onPress: () => void;
}

interface QuickActionsProps {
	actions: ActionItem[];
	title?: string;
	className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
	actions,
	title = 'Quick Actions',
	className = '',
}) => {
	return (
		<View className={`mb-6 ${className}`}>
			<Text className='mb-3 text-xl font-semibold text-gray-900'>{title}</Text>

			<View className='flex-row justify-between space-x-4 bg-white rounded-2xl'>
				{actions.map((action) => (
					<TouchableOpacity
						key={action.id}
						className='items-center flex-1 py-6 shadow-sm rounded-2xl'
						onPress={action.onPress}
					>
						<View
							className={`items-center justify-center w-12 h-12 mb-3 rounded-full ${action.bgColor}`}
						>
							<Ionicons name={action.icon} size={24} color={action.iconColor} />
						</View>
						<Text className='text-base font-medium text-gray-900'>
							{action.title}
						</Text>
					</TouchableOpacity>
				))}
			</View>
		</View>
	);
};
