import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

interface WalletCardProps {
	usdcBalance: string;
	ethBalance: string;
	walletAddress: string;
	onSendPress: () => void;
	gradientColors?: string[];
	showEthBalance?: boolean;
	showWalletAddress?: boolean;
	className?: string;
}

export const WalletCard: React.FC<WalletCardProps> = ({
	usdcBalance,
	ethBalance,
	walletAddress,
	onSendPress,
	showEthBalance = true,
	showWalletAddress = true,
	className = '',
}) => {
	return (
		<LinearGradient
			colors={['#3D5AFE', '#00C896']}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 0 }}
			style={{
				borderRadius: 16,
				padding: 20,
			}}
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
						<Text className='text-2xl font-bold text-white'>{usdcBalance}</Text>
						<Text
							style={{ color: 'rgba(255, 255, 255, 0.8)' }}
							className='ml-2 text-lg'
						>
							USDC
						</Text>
					</View>

					{showEthBalance && (
						<View className='flex-row items-center'>
							<Text className='text-lg font-semibold text-white'>
								{ethBalance}
							</Text>
							<Text
								style={{ color: 'rgba(255, 255, 255, 0.8)' }}
								className='ml-2 text-sm'
							>
								ETH
							</Text>
						</View>
					)}
				</View>

				<TouchableOpacity
					className='px-4 py-2 bg-white rounded-full'
					onPress={onSendPress}
				>
					<View className='flex-row items-center'>
						<Ionicons name='send' size={16} color='#3D5AFE' />
						<Text className='ml-1 text-sm font-medium text-blue-600'>Send</Text>
					</View>
				</TouchableOpacity>
			</View>

			{showWalletAddress && (
				<View className='flex-row items-center'>
					<Ionicons name='wallet' size={18} color='white' />
					<Text
						style={{ color: 'rgba(255, 255, 255, 0.9)' }}
						className='ml-2 text-sm'
					>
						{walletAddress}
					</Text>
				</View>
			)}
		</LinearGradient>
	);
};
