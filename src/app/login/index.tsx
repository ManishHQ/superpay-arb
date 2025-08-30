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
import { StatusBar } from 'expo-status-bar';
import { dynamicClient } from '@/lib/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingModal } from '@/components';
import { AuthService } from '@/services/authService';
import { useUserProfileStore } from '@/stores/userProfileStore';

const { width } = Dimensions.get('window');

export default function LoginPage() {
	const [usedOneTimePasswordMethod, setUsedOneTimePasswordMethod] = useState<
		'email' | 'sms' | null
	>(null);
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [otpToken, setOtpToken] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [showOnboarding, setShowOnboarding] = useState(false);
	const [onboardingData, setOnboardingData] = useState<any>(null);

	const { auth, sdk, wallets } = useReactiveClient(dynamicClient);
	const { setCurrentProfile } = useUserProfileStore();

	// Check if user is already authenticated
	useEffect(() => {
		const checkExistingAuth = async () => {
			if (auth.token && sdk.loaded && wallets.userWallets?.length > 0) {
				console.log('User already authenticated, processing...');
				await handleAuthenticationSuccess();
			}
		};

		checkExistingAuth();
	}, [auth.token, sdk.loaded, wallets.userWallets]);

	// Handle successful Dynamic authentication
	const handleAuthenticationSuccess = async () => {
		try {
			setIsLoading(true);
			console.log('Processing authentication success...');

			// Check database and handle onboarding
			const authFlow = await AuthService.handleAuthenticationFlow(
				auth,
				wallets
			);
			console.log('Auth flow result:', authFlow);

			if (authFlow.success) {
				if (authFlow.needsOnboarding) {
					// User needs onboarding
					console.log('User needs onboarding, setting up modal');
					const authUser = AuthService.extractUserFromDynamic(auth, wallets);
					if (authUser) {
						const onboardingInfo = {
							fullName:
								authUser.fullName ||
								authUser.firstName ||
								authUser.lastName ||
								'',
							username: authUser.username || `user_${Date.now()}`,
							email: authUser.email || '',
							walletAddress: authUser.walletAddress || '',
						};
						console.log('Setting onboarding data:', onboardingInfo);
						setOnboardingData(onboardingInfo);
						setShowOnboarding(true);
					} else {
						console.error('Failed to extract user data for onboarding');
						Alert.alert(
							'Error',
							'Failed to extract user information. Please try again.'
						);
					}
				} else if (authFlow.userProfile) {
					// User exists in database, set profile and navigate
					console.log('User profile found, logging in');
					setCurrentProfile(authFlow.userProfile);

					// Navigate based on role
					if (authFlow.userProfile.role === 'business') {
						router.replace('/business/home');
					} else {
						router.replace('/(app)/home');
					}
				} else {
					console.error(
						'Auth flow success but no profile and no onboarding needed - unexpected state'
					);
					Alert.alert(
						'Error',
						'Authentication completed but user profile is missing. Please contact support.'
					);
				}
			} else {
				console.error('Auth flow failed:', authFlow.error);
				Alert.alert(
					'Authentication Error',
					authFlow.error ||
						'Failed to complete authentication. Please try again.'
				);
			}
		} catch (error) {
			console.error('Error handling authentication success:', error);
			Alert.alert('Error', 'An unexpected error occurred. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	// Handle onboarding completion
	const handleOnboardingComplete = (profile: any) => {
		console.log('Onboarding completed:', profile);
		setCurrentProfile(profile);
		setShowOnboarding(false);

		// Navigate based on role
		if (profile.role === 'business') {
			router.replace('/business/home');
		} else {
			router.replace('/(app)/home');
		}
	};

	// Handle onboarding cancellation
	const handleOnboardingCancel = () => {
		console.log('Onboarding cancelled, logging out');
		setShowOnboarding(false);
		dynamicClient.auth.logout();
		setOnboardingData(null);
	};

	// Show loading while SDK initializes
	if (!sdk.loaded) {
		return (
			<SafeAreaView style={styles.container}>
				<StatusBar style='dark' backgroundColor='#F8FAFC' />
				<View style={styles.loadingContainer}>
					<ActivityIndicator size='large' color='#3b82f6' />
					<Text style={styles.loadingText}>Initializing SuperPay...</Text>
				</View>
			</SafeAreaView>
		);
	}

	// Show onboarding modal if needed
	if (showOnboarding) {
		return (
			<>
				<StatusBar style='dark' backgroundColor='#F8FAFC' />
				<OnboardingModal
					visible={showOnboarding}
					initialData={onboardingData}
					onComplete={handleOnboardingComplete}
					onCancel={handleOnboardingCancel}
				/>
			</>
		);
	}

	const storeAuthToken = async (token: string) => {
		try {
			await AsyncStorage.setItem('authToken', token);
			console.log('Auth token stored successfully');
			await handleAuthenticationSuccess();
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
					if (response?.token) {
						storeAuthToken(response.token);
					} else {
						// Authentication successful, handle it
						handleAuthenticationSuccess();
					}
				})
				.catch((error: any) => {
					console.error('Email OTP verification error:', error);
					setIsLoading(false);
					Alert.alert(
						'Error',
						`OTP verification failed: ${error?.message || 'Invalid OTP'}`
					);
				});
		} else if (usedOneTimePasswordMethod === 'sms') {
			dynamicClient.auth.sms
				.verifyOTP(token)
				.then((response: any) => {
					console.log('SMS OTP verification successful:', response);
					if (response?.token) {
						storeAuthToken(response.token);
					} else {
						// Authentication successful, handle it
						handleAuthenticationSuccess();
					}
				})
				.catch((error: any) => {
					console.error('SMS OTP verification error:', error);
					setIsLoading(false);
					Alert.alert(
						'Error',
						`OTP verification failed: ${error?.message || 'Invalid OTP'}`
					);
				});
		}
	};

	const renderContent = () => {
		if (usedOneTimePasswordMethod !== null) {
			return (
				<View style={styles.otpContainer}>
					<Text style={styles.otpTitle}>Verify your code</Text>
					<Text style={styles.otpSubtitle}>
						We sent a 6-digit code to your{' '}
						{usedOneTimePasswordMethod === 'email'
							? 'email address'
							: 'phone number'}
					</Text>

					<TextInput
						style={styles.otpInput}
						placeholder={isLoading ? 'Verifying...' : 'Enter OTP'}
						value={otpToken}
						onChangeText={setOtpToken}
						placeholderTextColor='#9ca3af'
						keyboardType='numeric'
						returnKeyType='done'
						editable={!isLoading}
						maxLength={6}
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
						}}
						disabled={isLoading}
					>
						<Text style={styles.backButtonText}>Back to Login</Text>
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
			<StatusBar style='dark' backgroundColor='#F8FAFC' />
			<KeyboardAvoidingView
				style={styles.container}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			>
				<ScrollView
					contentContainerStyle={styles.scrollContainer}
					keyboardShouldPersistTaps='handled'
				>
					{/* Header */}
					<View style={styles.header}>
						<View style={styles.logoContainer}>
							<Ionicons name='wallet' size={32} color='#3b82f6' />
							<Text style={styles.title}>SuperPay</Text>
						</View>
						<Text style={styles.subtitle}>
							{usedOneTimePasswordMethod
								? 'Almost there!'
								: 'Welcome back to your digital wallet'}
						</Text>
					</View>

					{/* Main Content Card */}
					<View style={styles.card}>{renderContent()}</View>

					{/* Footer */}
					<View style={styles.footer}>
						<Text style={styles.footerText}>
							By continuing, you agree to SuperPay's Terms of Service and
							Privacy Policy
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
		backgroundColor: '#F8FAFC',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F8FAFC',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		color: '#6B7280',
		fontWeight: '500',
	},
	scrollContainer: {
		flexGrow: 1,
		justifyContent: 'center',
		padding: 24,
	},
	header: {
		alignItems: 'center',
		marginBottom: 32,
	},
	logoContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
	},
	title: {
		fontSize: 32,
		fontWeight: 'bold',
		color: '#1F2937',
		marginLeft: 12,
	},
	subtitle: {
		fontSize: 16,
		color: '#6B7280',
		textAlign: 'center',
		lineHeight: 24,
	},
	card: {
		backgroundColor: '#FFFFFF',
		borderRadius: 24,
		padding: 32,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 8,
		marginBottom: 24,
	},
	inputContainer: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#1F2937',
		marginBottom: 16,
		textAlign: 'center',
	},
	fullWidthInput: {
		backgroundColor: '#F9FAFB',
		borderWidth: 2,
		borderColor: '#E5E7EB',
		borderRadius: 16,
		paddingHorizontal: 20,
		paddingVertical: 16,
		fontSize: 16,
		color: '#1F2937',
		marginBottom: 16,
	},
	primaryButton: {
		backgroundColor: '#3B82F6',
		borderRadius: 16,
		paddingVertical: 16,
		paddingHorizontal: 24,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#3B82F6',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
	},
	secondaryButton: {
		backgroundColor: '#FFFFFF',
		borderWidth: 2,
		borderColor: '#E5E7EB',
		borderRadius: 16,
		paddingVertical: 16,
		paddingHorizontal: 24,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	secondaryButtonText: {
		color: '#3B82F6',
		fontSize: 16,
		fontWeight: '600',
		marginLeft: 8,
	},
	buttonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '600',
		marginLeft: 8,
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	dividerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 24,
	},
	divider: {
		flex: 1,
		height: 1,
		backgroundColor: '#E5E7EB',
	},
	dividerText: {
		marginHorizontal: 16,
		fontSize: 14,
		color: '#9CA3AF',
		fontWeight: '500',
	},
	otpContainer: {
		alignItems: 'center',
	},
	otpTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#1F2937',
		marginBottom: 8,
		textAlign: 'center',
	},
	otpSubtitle: {
		fontSize: 16,
		color: '#6B7280',
		textAlign: 'center',
		marginBottom: 32,
		lineHeight: 24,
	},
	otpInput: {
		backgroundColor: '#F9FAFB',
		borderWidth: 2,
		borderColor: '#E5E7EB',
		borderRadius: 16,
		paddingHorizontal: 20,
		paddingVertical: 16,
		fontSize: 24,
		color: '#1F2937',
		textAlign: 'center',
		letterSpacing: 8,
		fontWeight: 'bold',
		width: '100%',
		marginBottom: 24,
	},
	otpButton: {
		backgroundColor: '#3B82F6',
		borderRadius: 16,
		paddingVertical: 16,
		paddingHorizontal: 32,
		width: '100%',
		alignItems: 'center',
		marginBottom: 16,
		shadowColor: '#3B82F6',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
	},
	backButton: {
		paddingVertical: 12,
		paddingHorizontal: 24,
	},
	backButtonText: {
		color: '#6B7280',
		fontSize: 16,
		fontWeight: '500',
		textAlign: 'center',
	},
	footer: {
		alignItems: 'center',
		paddingHorizontal: 16,
	},
	footerText: {
		fontSize: 12,
		color: '#9CA3AF',
		textAlign: 'center',
		lineHeight: 18,
	},
});
