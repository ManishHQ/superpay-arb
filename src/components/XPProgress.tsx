import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface XPProgressProps {
	level: number;
	currentXP: number;
	nextLevelXP: number;
	progressPercentage: number;
	gradientColors?: readonly [string, string, ...string[]];
	className?: string;
}

export const XPProgress: React.FC<XPProgressProps> = ({
	level,
	currentXP,
	nextLevelXP,
	progressPercentage,
	gradientColors = ['#3D5AFE', '#00C896'],
	className = '',
}) => {
	const xpToNextLevel = nextLevelXP - currentXP;

	return (
		<LinearGradient
			colors={gradientColors}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 0 }}
			className={`rounded-2xl p-8 mb-6 ${className}`}
			style={{ marginBottom: 100 }}
		>
			<View className='flex-row items-center justify-between mb-4'>
				<Text className='text-xl font-semibold text-white'>Level {level}</Text>
				<Text className='text-base text-white'>
					{currentXP.toLocaleString()} XP
				</Text>
			</View>

			<View
				className='h-3 mb-3 rounded-full'
				style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
			>
				<View
					className='h-3 bg-white rounded-full'
					style={{ width: `${progressPercentage}%` }}
				/>
			</View>

			<Text className='text-base text-white'>
				{xpToNextLevel} XP to next level
			</Text>
		</LinearGradient>
	);
};
