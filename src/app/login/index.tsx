import { useState, useEffect } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	TextInput,
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	ActivityIndicator,
	Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { dynamicClient } from '@/lib/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function LoginPage() {
	const [usedOneTimePasswordMethod, setUsedOneTimePasswordMethod] = useState<
		'email' | 'sms' | null
	>(null);
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [otpToken, setOtpToken] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const { auth, sdk } = useReactiveClient(dynamicClient);

	// All hooks must be called before any conditional returns
	useEffect(() => {
		if (auth.token && sdk.loaded) {
			router.replace('/');
		}
	}, [auth.token, sdk.loaded]);

	// Conditional rendering after all hooks
	if (!sdk.loaded) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size='large' color='#3b82f6' />
					<Text style={styles.loadingText}>Initializing SuperPay...</Text>
				</View>
			</SafeAreaView>
		);
	}

	const storeAuthToken = async (token: string) => {
		try {
			await AsyncStorage.setItem('authToken', token);
			console.log('Auth token stored successfully');
			router.replace('/');
		} catch (error) {
			console.error('Error storing auth token:', error);
		}
	};

	const handleEmailLogin = (email: string) => {
		if (!email.trim()) {
			Alert.alert('Error', 'Please enter your email address');
			return;
		}

		setIsLoading(true);

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
			Alert.alert('Error', 'Please enter your phone number');
			return;
		}

		setIsLoading(true);

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
							onPress: () => router.replace('/'),
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
							onPress: () => router.replace('/'),
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
				<View style={styles.otpContainer}>
					<Text style={styles.otpTitle}>Enter Verification Code</Text>
					<Text style={styles.otpSubtitle}>
						We sent a 6-digit code to your{' '}
						{usedOneTimePasswordMethod === 'email'
							? 'email address'
							: 'phone number'}
					</Text>

					<TextInput
						style={styles.otpInput}
						placeholder='000000'
						value={otpToken}
						onChangeText={setOtpToken}
						placeholderTextColor='#9ca3af'
						keyboardType='number-pad'
						maxLength={6}
						returnKeyType='done'
						editable={!isLoading}
						onSubmitEditing={() => handleOTPVerification(otpToken)}
					/>

					<TouchableOpacity
						style={[
							styles.otpButton,
							(isLoading || !otpToken.trim()) && styles.buttonDisabled,
						]}
						onPress={() => handleOTPVerification(otpToken)}
						disabled={isLoading || !otpToken.trim()}
					>
						{isLoading ? (
							<ActivityIndicator color='#ffffff' />
						) : (
							<Text style={styles.buttonText}>Verify Code</Text>
						)}
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.backButton}
						onPress={() => {
							setUsedOneTimePasswordMethod(null);
							setOtpToken('');
							setEmail('');
							setPhone('');
						}}
						disabled={isLoading}
					>
						<Text style={styles.backButtonText}>← Back to login options</Text>
					</TouchableOpacity>
				</View>
			);
		}

		return (
			<>
				{/* Email Login - Primary Method */}
				<View style={styles.inputContainer}>
					<Text style={styles.sectionTitle}>Sign in with Email</Text>
					<TextInput
						style={styles.fullWidthInput}
						placeholder='Enter your email address'
						value={email}
						onChangeText={setEmail}
						placeholderTextColor='#9ca3af'
						keyboardType='email-address'
						autoCapitalize='none'
						returnKeyType='done'
						onSubmitEditing={() => handleEmailLogin(email)}
					/>
					<TouchableOpacity
						style={[
							styles.primaryButton,
							(isLoading || !email.trim()) && styles.buttonDisabled,
						]}
						onPress={() => handleEmailLogin(email)}
						disabled={isLoading || !email.trim()}
					>
						{isLoading ? (
							<ActivityIndicator color='#ffffff' size='small' />
						) : (
							<>
								<Ionicons name='mail' size={20} color='#ffffff' />
								<Text style={styles.buttonText}>Continue with Email</Text>
							</>
						)}
					</TouchableOpacity>
				</View>

				{/* Divider */}
				<View style={styles.dividerContainer}>
					<View style={styles.divider} />
					<Text style={styles.dividerText}>or</Text>
					<View style={styles.divider} />
				</View>

				{/* Phone Login - Secondary Button */}
				<TouchableOpacity
					style={styles.secondaryButton}
					onPress={() => {
						const phoneNumber = phone || '';
						Alert.prompt(
							'Phone Login',
							'Enter your phone number:',
							[
								{ text: 'Cancel', style: 'cancel' },
								{
									text: 'Send OTP',
									onPress: (inputPhone) => {
										if (inputPhone) {
											setPhone(inputPhone);
											handleSMSLogin(inputPhone);
										}
									},
								},
							],
							'plain-text',
							phoneNumber,
							'phone-pad'
						);
					}}
					disabled={isLoading}
				>
					<Ionicons name='phone-portrait' size={20} color='#3b82f6' />
					<Text style={styles.secondaryButtonText}>Continue with Phone</Text>
				</TouchableOpacity>
			</>
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.keyboardContainer}
			>
				<ScrollView
					contentContainerStyle={styles.scrollContainer}
					keyboardShouldPersistTaps='handled'
					showsVerticalScrollIndicator={false}
				>
					{/* Header */}
					<View style={styles.header}>
						<View style={styles.logoContainer}>
							<Ionicons name='wallet' size={48} color='#3b82f6' />
						</View>
						<Text style={styles.title}>SuperPay</Text>
						<Text style={styles.subtitle}>
							{usedOneTimePasswordMethod
								? 'Verify your identity'
								: 'Sign in to your account'}
						</Text>
					</View>

					{/* Content Card */}
					<View style={styles.card}>{renderContent()}</View>

					{/* Footer */}
					<View style={styles.footer}>
						<Text style={styles.footerText}>
							Secure payments powered by blockchain technology
						</Text>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f8fafc',
	},
	keyboardContainer: {
		flex: 1,
	},
	scrollContainer: {
		flexGrow: 1,
		paddingHorizontal: 24,
		paddingVertical: 32,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		gap: 16,
	},
	loadingText: {
		fontSize: 16,
		color: '#6b7280',
		fontWeight: '500',
	},
	header: {
		alignItems: 'center',
		marginBottom: 40,
	},
	logoContainer: {
		width: 80,
		height: 80,
		backgroundColor: '#eff6ff',
		borderRadius: 24,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 24,
	},
	title: {
		fontSize: 32,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: '#6b7280',
		textAlign: 'center',
		lineHeight: 24,
	},
	card: {
		backgroundColor: '#ffffff',
		borderRadius: 20,
		padding: 32,
		marginBottom: 32,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 8,
	},
	footer: {
		alignItems: 'center',
		marginTop: 'auto',
	},
	footerText: {
		fontSize: 14,
		color: '#9ca3af',
		textAlign: 'center',
	},
	// Form styles
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 16,
		flexDirection: 'row',
		alignItems: 'center',
	},
	inputContainer: {
		marginBottom: 24,
	},
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	input: {
		flex: 1,
		height: 52,
		backgroundColor: '#f9fafb',
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderRadius: 12,
		paddingHorizontal: 16,
		fontSize: 16,
		color: '#111827',
	},
	inputFocused: {
		borderColor: '#3b82f6',
		backgroundColor: '#ffffff',
	},
	button: {
		height: 52,
		backgroundColor: '#3b82f6',
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 24,
		minWidth: 120,
	},
	buttonDisabled: {
		backgroundColor: '#9ca3af',
	},
	buttonText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#ffffff',
	},
	// OTP styles
	otpContainer: {
		alignItems: 'center',
	},
	otpTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 8,
		textAlign: 'center',
	},
	otpSubtitle: {
		fontSize: 16,
		color: '#6b7280',
		textAlign: 'center',
		marginBottom: 32,
		lineHeight: 24,
	},
	otpInput: {
		width: '100%',
		height: 52,
		backgroundColor: '#f9fafb',
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderRadius: 12,
		paddingHorizontal: 16,
		fontSize: 18,
		textAlign: 'center',
		letterSpacing: 8,
		marginBottom: 24,
		color: '#111827',
	},
	otpButton: {
		width: '100%',
		height: 52,
		backgroundColor: '#3b82f6',
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
	},
	backButton: {
		width: '100%',
		height: 48,
		justifyContent: 'center',
		alignItems: 'center',
	},
	backButtonText: {
		fontSize: 16,
		color: '#6b7280',
		fontWeight: '500',
	},
	// Updated divider styles
	dividerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 24,
	},
	divider: {
		flex: 1,
		height: 1,
		backgroundColor: '#e5e7eb',
	},
	dividerText: {
		fontSize: 14,
		color: '#9ca3af',
		marginHorizontal: 16,
		fontWeight: '500',
	},
	// New input and button styles
	fullWidthInput: {
		width: '100%',
		height: 52,
		backgroundColor: '#f9fafb',
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderRadius: 12,
		paddingHorizontal: 16,
		fontSize: 16,
		color: '#111827',
		marginBottom: 16,
	},
	primaryButton: {
		width: '100%',
		height: 52,
		backgroundColor: '#3b82f6',
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		flexDirection: 'row',
		gap: 8,
	},
	secondaryButton: {
		width: '100%',
		height: 52,
		backgroundColor: 'transparent',
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		flexDirection: 'row',
		gap: 8,
	},
	secondaryButtonText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#374151',
	},
});
