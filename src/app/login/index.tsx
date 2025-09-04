import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';

export default function LoginPage() {
	const [usedOneTimePasswordMethod, setUsedOneTimePasswordMethod] = useState<
		'email' | 'sms' | null
	>(null);

	const handleEmailLogin = (email: string) => {
		// Move authentication logic to services
		console.log('Email login:', email);
		setUsedOneTimePasswordMethod('email');
	};

	const handleSMSLogin = (phone: string) => {
		// Move authentication logic to services
		console.log('SMS login:', phone);
		setUsedOneTimePasswordMethod('sms');
	};

	const handleOTPVerification = (token: string) => {
		// Move verification logic to services
		console.log('OTP verification:', token);
		router.push('/(tabs)/home');
	};

	const handleSocialLogin = (provider: string) => {
		// Move social auth logic to services
		console.log('Social login:', provider);
		router.push('/(tabs)/home');
	};

	const renderContent = () => {
		if (usedOneTimePasswordMethod !== null) {
			return (
				<>
					<View className='mb-8'>
						<Text className='mb-4 text-lg font-semibold text-gray-700'>
							Enter OTP Token
						</Text>
						<View className='flex-row items-center gap-3'>
							<TextInput
								className='flex-1 px-4 py-3 text-lg bg-white border border-gray-300 rounded-lg'
								placeholder='OTP token'
								placeholderTextColor='#9CA3AF'
								onSubmitEditing={(e) =>
									handleOTPVerification(e.nativeEvent.text)
								}
								keyboardType='numeric'
								returnKeyType='done'
								style={{
									textAlignVertical: 'center',
									height: 48,
									lineHeight: 20,
								}}
							/>
							<TouchableOpacity
								className='px-6 bg-red-500 rounded-xl'
								style={{ height: 48 }}
								onPress={() => setUsedOneTimePasswordMethod(null)}
							>
								<Text
									className='font-semibold text-center text-white'
									style={{ lineHeight: 48 }}
								>
									Cancel
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</>
			);
		}

		return (
			<>
				<View className='mb-8'>
					<Text className='mb-4 text-lg font-semibold text-gray-700'>
						Email Login
					</Text>
					<View className='flex-row items-center gap-3'>
						<TextInput
							placeholder='Enter your email'
							className='flex-1 px-4 py-3 text-lg bg-white border border-gray-300 rounded-lg'
							placeholderTextColor='#9CA3AF'
							keyboardType='email-address'
							returnKeyType='done'
							onSubmitEditing={(e) => handleEmailLogin(e.nativeEvent.text)}
							style={{
								textAlignVertical: 'center',
								height: 48,
								lineHeight: 20,
							}}
						/>
						<TouchableOpacity
							className='px-6 bg-blue-600 rounded-xl'
							style={{ height: 48 }}
							onPress={() => handleEmailLogin('')}
						>
							<Text
								className='font-semibold text-white text-center'
								style={{ lineHeight: 48 }}
							>
								Send OTP
							</Text>
						</TouchableOpacity>
					</View>
				</View>

				<View className='mb-8'>
					<Text className='mb-4 text-lg font-semibold text-gray-700'>
						SMS Login
					</Text>
					<View className='flex-row items-center gap-3'>
						<TextInput
							className='flex-1 px-4 py-3 text-lg bg-white border border-gray-300 rounded-lg'
							placeholder='Enter your phone number'
							placeholderTextColor='#9CA3AF'
							keyboardType='phone-pad'
							returnKeyType='done'
							onSubmitEditing={(e) => handleSMSLogin(e.nativeEvent.text)}
							style={{
								textAlignVertical: 'center',
								height: 48,
								lineHeight: 20,
							}}
						/>
						<TouchableOpacity
							className='px-6 bg-blue-600 rounded-xl'
							style={{ height: 48 }}
							onPress={() => handleSMSLogin('')}
						>
							<Text
								className='font-semibold text-white text-center'
								style={{ lineHeight: 48 }}
							>
								Send OTP
							</Text>
						</TouchableOpacity>
					</View>
				</View>

				<View className='mb-8'>
					<TouchableOpacity
						className='w-full py-4 mb-4 bg-purple-600 rounded-xl'
						onPress={() => handleSocialLogin('farcaster')}
					>
						<Text className='text-lg font-semibold text-center text-white'>
							Connect with Farcaster
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						className='w-full py-4 mb-4 bg-red-500 rounded-xl'
						onPress={() => handleSocialLogin('google')}
					>
						<Text className='text-lg font-semibold text-center text-white'>
							Connect with Google
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						className='w-full py-4 bg-gray-600 rounded-xl'
						onPress={() => console.log('Open Auth Flow UI')}
					>
						<Text className='text-lg font-semibold text-center text-white'>
							Open Auth Flow UI
						</Text>
					</TouchableOpacity>
				</View>
			</>
		);
	};

	return (
		<View className='justify-center flex-1 p-5 bg-gray-50'>
			<Text className='mb-10 text-3xl font-bold text-center text-gray-800'>
				Welcome to SuperPay
			</Text>
			{renderContent()}
		</View>
	);
}
