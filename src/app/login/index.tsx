import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { dynamicClient } from '@/lib/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useReactiveClient } from '@dynamic-labs/react-hooks';

export default function LoginPage() {
	const [usedOneTimePasswordMethod, setUsedOneTimePasswordMethod] = useState<
		'email' | 'sms' | null
	>(null);
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [otpToken, setOtpToken] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const { auth } = useReactiveClient(dynamicClient);

	const storeAuthToken = async (token: string) => {
		try {
			await AsyncStorage.setItem('authToken', token);
			console.log('Auth token stored successfully');
			router.replace('/(tabs)/home');
		} catch (error) {
			console.error('Error storing auth token:', error);
		}
	};

	const handleEmailLogin = (email: string) => {
		if (!email.trim()) {
			Alert.alert('Error', 'Please enter a valid email address');
			return;
		}

		setIsLoading(true);
		console.log('Attempting to send email OTP to:', email);

		try {
			dynamicClient.auth.email
				.sendOTP(email)
				.then(() => {
					console.log('Email OTP sent successfully');
					setUsedOneTimePasswordMethod('email');
					setIsLoading(false);
					Alert.alert('Success', 'OTP sent to your email');
				})
				.catch((error: any) => {
					console.error('Email OTP error:', error);
					setIsLoading(false);
					Alert.alert(
						'Error',
						`Failed to send OTP: ${error?.message || 'Unknown error'}`
					);
				});
		} catch (error: any) {
			console.error('Exception in handleEmailLogin:', error);
			setIsLoading(false);
			Alert.alert(
				'Error',
				`Exception occurred: ${error?.message || 'Unknown error'}`
			);
		}
	};

	const handleSMSLogin = (phone: string) => {
		if (!phone.trim()) {
			Alert.alert('Error', 'Please enter a valid phone number');
			return;
		}

		setIsLoading(true);
		console.log('Attempting to send SMS OTP to:', phone);

		try {
			dynamicClient.auth.sms
				.sendOTP({ dialCode: '1', iso2: 'us', phone })
				.then(() => {
					console.log('SMS OTP sent successfully');
					setUsedOneTimePasswordMethod('sms');
					setIsLoading(false);
					Alert.alert('Success', 'OTP sent to your phone');
				})
				.catch((error: any) => {
					console.error('SMS OTP error:', error);
					setIsLoading(false);
					Alert.alert(
						'Error',
						`Failed to send OTP: ${error?.message || 'Unknown error'}`
					);
				});
		} catch (error: any) {
			console.error('Exception in handleSMSLogin:', error);
			setIsLoading(false);
			Alert.alert(
				'Error',
				`Exception occurred: ${error?.message || 'Unknown error'}`
			);
		}
	};

	const handleOTPVerification = (token: string) => {
		if (!token.trim()) {
			Alert.alert('Error', 'Please enter the OTP token');
			return;
		}

		setIsLoading(true);

		if (usedOneTimePasswordMethod === 'email') {
			dynamicClient.auth.email
				.verifyOTP(token)
				.then((response: any) => {
					console.log('Email OTP verification successful:', response);
					// Store the authentication token
					if (response?.token) {
						storeAuthToken(response.token);
					} else {
						// If no token in response, create a mock one for demo
						storeAuthToken(`email_${Date.now()}`);
					}
					setIsLoading(false);
					Alert.alert('Success', 'Email verified successfully!', [
						{
							text: 'Continue',
							onPress: () => router.replace('/(tabs)/home'),
						},
					]);
				})
				.catch((error: any) => {
					console.error('Email OTP verification error:', error);
					setIsLoading(false);
					Alert.alert('Error', 'Invalid OTP. Please try again.');
				});
		} else if (usedOneTimePasswordMethod === 'sms') {
			dynamicClient.auth.sms
				.verifyOTP(token)
				.then((response: any) => {
					console.log('SMS OTP verification successful:', response);
					// Store the authentication token
					if (response?.token) {
						storeAuthToken(response.token);
					} else {
						// If no token in response, create a mock one for demo
						storeAuthToken(`sms_${Date.now()}`);
					}
					setIsLoading(false);
					Alert.alert('Success', 'Phone verified successfully!', [
						{
							text: 'Continue',
							onPress: () => router.replace('/(tabs)/home'),
						},
					]);
				})
				.catch((error: any) => {
					console.error('SMS OTP verification error:', error);
					setIsLoading(false);
					Alert.alert('Error', 'Invalid OTP. Please try again.');
				});
		}
	};

	const renderContent = () => {
		if (usedOneTimePasswordMethod !== null) {
			return (
				<>
					<View className='mb-8'>
						<View className='mb-4'>
							<Text className='text-lg font-semibold text-gray-700'>
								Enter OTP Token
							</Text>
							<Text className='mt-1 text-sm text-gray-500'>
								Enter the 6-digit code sent to your{' '}
								{usedOneTimePasswordMethod === 'email' ? 'email' : 'phone'}
							</Text>
						</View>
						<View className='flex-col gap-3'>
							<TextInput
								className='w-full px-4 py-3 text-lg bg-white border border-gray-300 rounded-lg'
								placeholder={isLoading ? 'Verifying...' : 'OTP token'}
								value={otpToken}
								onChangeText={setOtpToken}
								placeholderTextColor='#9CA3AF'
								keyboardType='numeric'
								returnKeyType='done'
								editable={!isLoading}
								style={{
									textAlignVertical: 'center',
									height: 48,
									lineHeight: 20,
								}}
							/>
							<View className='flex-row gap-3'>
								<TouchableOpacity
									className={`flex-1 px-6 py-3 rounded-xl ${
										isLoading || !otpToken.trim()
											? 'bg-gray-400'
											: 'bg-blue-600'
									}`}
									style={{ height: 48 }}
									onPress={() => handleOTPVerification(otpToken)}
									disabled={isLoading || !otpToken.trim()}
								>
									<Text
										className='font-semibold text-center text-white'
										style={{ lineHeight: 48 }}
									>
										{isLoading ? 'Verifying...' : 'Verify OTP'}
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									className='px-6 bg-red-500 rounded-xl'
									style={{ height: 48 }}
									onPress={() => {
										setUsedOneTimePasswordMethod(null);
										setOtpToken('');
									}}
									disabled={isLoading}
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
							value={email}
							onChangeText={setEmail}
							className='flex-1 px-4 py-3 text-lg bg-white border border-gray-300 rounded-lg'
							placeholderTextColor='#9CA3AF'
							keyboardType='email-address'
							returnKeyType='done'
							onSubmitEditing={() => handleEmailLogin(email)}
							style={{
								textAlignVertical: 'center',
								height: 48,
								lineHeight: 20,
							}}
						/>
						<TouchableOpacity
							className='px-6 bg-blue-600 rounded-xl'
							style={{ height: 48 }}
							onPress={() => handleEmailLogin(email)}
							disabled={isLoading}
						>
							<Text
								className='font-semibold text-center text-white'
								style={{ lineHeight: 48 }}
							>
								{isLoading ? 'Sending...' : 'Send OTP'}
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
							value={phone}
							onChangeText={setPhone}
							placeholderTextColor='#9CA3AF'
							keyboardType='phone-pad'
							returnKeyType='done'
							onSubmitEditing={() => handleSMSLogin(phone)}
							style={{
								textAlignVertical: 'center',
								height: 48,
								lineHeight: 20,
							}}
						/>
						<TouchableOpacity
							className='px-6 bg-blue-600 rounded-xl'
							style={{ height: 48 }}
							onPress={() => handleSMSLogin(phone)}
							disabled={isLoading}
						>
							<Text
								className='font-semibold text-center text-white'
								style={{ lineHeight: 48 }}
							>
								{isLoading ? 'Sending...' : 'Send OTP'}
							</Text>
						</TouchableOpacity>
					</View>
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
