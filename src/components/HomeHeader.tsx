import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface HomeHeaderProps {
	firstName: string;
	subtitle?: string;
	onNotificationPress?: () => void;
	className?: string;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
	firstName,
	subtitle = 'Here is your summary for the week.',
	onNotificationPress,
	className = '',
}) => {
	return (
		<View className={`web:mt-6 mb-6 ${className}`}>
			<View className='flex-row items-center justify-between mb-2'>
				<View>
					<Text className='text-2xl font-bold text-gray-900'>
						Welcome back, {firstName}!
					</Text>
					<Text className='text-base text-gray-600'>{subtitle}</Text>
				</View>

				{onNotificationPress && (
					<TouchableOpacity
						className='items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm'
						onPress={onNotificationPress}
					>
						<Ionicons name='notifications' size={24} color='#3D5AFE' />
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
};
