import React, { useState, useRef } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	Alert,
	ScrollView,
	ActivityIndicator,
	Dimensions,
	Animated,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfileService } from '@/services/userProfileService';
import { useUserProfileStore } from '@/stores/userProfileStore';

interface OnboardingStep {
	id: string;
	title: string;
	description: string;
	fields: OnboardingField[];
}

interface OnboardingField {
	id: string;
	label: string;
	placeholder: string;
	type: 'text' | 'email' | 'phone' | 'select';
	required: boolean;
	options?: string[];
}

interface OnboardingData {
	username: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	country: string;
	notifications: string;
}

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
	id: string;
	title: string;
	subtitle: string;
	description: string;
	icon: string;
	fields: OnboardingField[];
	isWelcome?: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
	{
		id: 'welcome',
		title: 'Welcome to SuperPay',
		subtitle: 'Your Digital Wallet Revolution',
		description:
			'Send, receive, and manage your money with ease. Join millions who trust SuperPay for secure digital payments.',
		icon: '🚀',
		fields: [],
		isWelcome: true,
	},
	{
		id: 'profile',
		title: 'Create Your Profile',
		subtitle: "Let's get to know you",
		description:
			'Your profile helps us personalize your SuperPay experience and keep your account secure.',
		icon: '👤',
		fields: [
			{
				id: 'username',
				label: 'Username',
				placeholder: 'Choose a unique username',
				type: 'text',
				required: true,
			},
			{
				id: 'firstName',
				label: 'First Name',
				placeholder: 'Enter your first name',
				type: 'text',
				required: true,
			},
			{
				id: 'lastName',
				label: 'Last Name',
				placeholder: 'Enter your last name',
				type: 'text',
				required: true,
			},
		],
	},
	{
		id: 'contact',
		title: 'Contact Details',
		subtitle: 'Stay connected',
		description:
			"We'll use this information to send you important updates and help you recover your account if needed.",
		icon: '📧',
		fields: [
			{
				id: 'email',
				label: 'Email Address',
				placeholder: 'your@email.com',
				type: 'email',
				required: true,
			},
			{
				id: 'phone',
				label: 'Phone Number (Optional)',
				placeholder: '+1 (555) 123-4567',
				type: 'phone',
				required: false,
			},
		],
	},
	{
		id: 'location',
		title: 'Location & Preferences',
		subtitle: 'Customize your experience',
		description:
			'Help us provide you with relevant features and comply with local regulations.',
		icon: '🌍',
		fields: [
			{
				id: 'country',
				label: 'Country',
				placeholder: 'Select your country',
				type: 'select',
				required: true,
				options: [
					'United States',
					'Canada',
					'United Kingdom',
					'Australia',
					'Germany',
					'France',
					'Japan',
					'Other',
				],
			},
			{
				id: 'notifications',
				label: 'Notifications',
				placeholder: 'Choose your preference',
				type: 'select',
				required: false,
				options: ['All notifications', 'Important only', 'Minimal'],
			},
		],
	},
];

interface OnboardingFlowProps {
	onComplete: (data: OnboardingData) => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
	const [currentStep, setCurrentStep] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const slideAnim = useRef(new Animated.Value(0)).current;
	const fadeAnim = useRef(new Animated.Value(1)).current;
	const { setCurrentProfile } = useUserProfileStore();

	const [formData, setFormData] = useState<OnboardingData>({
		username: '',
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		country: '',
		notifications: 'All notifications',
	});

	const currentStepData = ONBOARDING_STEPS[currentStep];
	const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

	const updateFormData = (fieldId: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[fieldId]: value,
		}));
	};

	const validateStep = () => {
		const requiredFields = currentStepData.fields.filter(
			(field) => field.required
		);

		for (const field of requiredFields) {
			const value = formData[field.id as keyof OnboardingData];
			if (!value || value.trim() === '') {
				Alert.alert('Error', `${field.label} is required`);
				return false;
			}
		}

		// Basic email validation
		if (currentStepData.id === 'profile' && formData.email) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(formData.email)) {
				Alert.alert('Error', 'Please enter a valid email address');
				return false;
			}
		}

		return true;
	};

	const animateTransition = (direction: 'forward' | 'backward' = 'forward') => {
		Animated.sequence([
			Animated.timing(fadeAnim, {
				toValue: 0,
				duration: 150,
				useNativeDriver: true,
			}),
			Animated.timing(slideAnim, {
				toValue: direction === 'forward' ? -width : width,
				duration: 0,
				useNativeDriver: true,
			}),
			Animated.timing(slideAnim, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}),
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true,
			}),
		]).start();
	};

	const handleNext = async () => {
		// Skip validation for welcome screen
		if (!currentStepData.isWelcome && !validateStep()) return;

		if (isLastStep) {
			await handleComplete();
		} else {
			animateTransition('forward');
			setTimeout(() => {
				setCurrentStep((prev) => prev + 1);
			}, 150);
		}
	};

	const handleComplete = async () => {
		setIsLoading(true);
		try {
			console.log('Completing onboarding with data:', formData);

			// Create user profile with the collected data
			const profileData = {
				username: formData.username,
				full_name: `${formData.firstName} ${formData.lastName}`.trim(),
				email: formData.email,
				phone: formData.phone || null,
				country: formData.country || null,
				notification_preferences: formData.notifications,
			};

			// This would typically create the profile in the database
			// For now, we'll just set it in the store
			setCurrentProfile(profileData as any);

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			onComplete(formData);
		} catch (error) {
			console.error('Onboarding error:', error);
			Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleBack = () => {
		if (currentStep > 0) {
			animateTransition('backward');
			setTimeout(() => {
				setCurrentStep((prev) => prev - 1);
			}, 150);
		}
	};

	const renderField = (field: OnboardingField) => {
		const value = formData[field.id as keyof OnboardingData];

		if (field.type === 'select') {
			return (
				<View key={field.id} className='mb-6'>
					<Text className='text-base font-semibold text-gray-800 mb-3'>
						{field.label}
					</Text>
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						<View className='flex-row gap-3'>
							{field.options?.map((option) => (
								<TouchableOpacity
									key={option}
									className={`px-6 py-3 rounded-full border-2 min-w-[100px] ${
										value === option
											? 'bg-blue-500 border-blue-500'
											: 'bg-white border-gray-200'
									}`}
									onPress={() => updateFormData(field.id, option)}
									style={{
										shadowColor: '#000',
										shadowOffset: { width: 0, height: 2 },
										shadowOpacity: 0.1,
										shadowRadius: 4,
										elevation: 2,
									}}
								>
									<Text
										className={`text-sm font-semibold text-center ${
											value === option ? 'text-white' : 'text-gray-700'
										}`}
									>
										{option}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</ScrollView>
				</View>
			);
		}

		return (
			<View key={field.id} className='mb-6'>
				<Text className='text-base font-semibold text-gray-800 mb-3'>
					{field.label}
				</Text>
				<View className='relative'>
					<TextInput
						className='p-4 text-base bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500'
						placeholder={field.placeholder}
						placeholderTextColor='#9CA3AF'
						value={value}
						onChangeText={(text) => updateFormData(field.id, text)}
						keyboardType={
							field.type === 'email'
								? 'email-address'
								: field.type === 'phone'
									? 'phone-pad'
									: 'default'
						}
						autoCapitalize={field.type === 'email' ? 'none' : 'words'}
						autoComplete={
							field.type === 'email'
								? 'email'
								: field.type === 'phone'
									? 'tel'
									: 'name'
						}
						style={{
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 1 },
							shadowOpacity: 0.1,
							shadowRadius: 3,
							elevation: 2,
						}}
					/>
					{field.required && (
						<View className='absolute right-4 top-4'>
							<Text className='text-red-500 text-lg'>*</Text>
						</View>
					)}
				</View>
			</View>
		);
	};

	const renderWelcomeScreen = () => (
		<View className='flex-1 items-center justify-center px-6'>
			<View className='items-center mb-12'>
				<View className='w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full items-center justify-center mb-6'>
					<Text className='text-4xl'>{currentStepData.icon}</Text>
				</View>
				<Text className='text-3xl font-bold text-gray-900 text-center mb-3'>
					{currentStepData.title}
				</Text>
				<Text className='text-xl font-semibold text-blue-600 text-center mb-4'>
					{currentStepData.subtitle}
				</Text>
				<Text className='text-base text-gray-600 text-center leading-6'>
					{currentStepData.description}
				</Text>
			</View>

			<View className='w-full space-y-4 mb-8'>
				<View className='flex-row items-center'>
					<View className='w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-4'>
						<Ionicons name='shield-checkmark' size={16} color='#10B981' />
					</View>
					<Text className='text-gray-700 flex-1'>
						Bank-level security for your money
					</Text>
				</View>
				<View className='flex-row items-center'>
					<View className='w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-4'>
						<Ionicons name='flash' size={16} color='#3B82F6' />
					</View>
					<Text className='text-gray-700 flex-1'>
						Instant transfers worldwide
					</Text>
				</View>
				<View className='flex-row items-center'>
					<View className='w-8 h-8 bg-purple-100 rounded-full items-center justify-center mr-4'>
						<Ionicons name='people' size={16} color='#8B5CF6' />
					</View>
					<Text className='text-gray-700 flex-1'>
						Trusted by millions of users
					</Text>
				</View>
			</View>
		</View>
	);

	return (
		<SafeAreaView className='flex-1'>
			<LinearGradient colors={['#F8FAFC', '#E2E8F0']} className='flex-1'>
				<KeyboardAvoidingView
					className='flex-1'
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				>
					<Animated.View
						className='flex-1'
						style={{
							opacity: fadeAnim,
							transform: [{ translateX: slideAnim }],
						}}
					>
						{/* Header with Progress */}
						<View className='px-6 py-4'>
							<View className='flex-row items-center justify-between mb-6'>
								{currentStep > 0 ? (
									<TouchableOpacity
										onPress={handleBack}
										className='w-10 h-10 items-center justify-center rounded-full bg-white'
										style={{
											shadowColor: '#000',
											shadowOffset: { width: 0, height: 2 },
											shadowOpacity: 0.1,
											shadowRadius: 4,
											elevation: 2,
										}}
									>
										<Ionicons name='arrow-back' size={20} color='#374151' />
									</TouchableOpacity>
								) : (
									<View className='w-10 h-10' />
								)}

								<View className='flex-row items-center gap-2'>
									{ONBOARDING_STEPS.map((_, index) => (
										<View
											key={index}
											className={`h-2 rounded-full transition-all duration-300 ${
												index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
											}`}
											style={{
												width: index === currentStep ? 24 : 8,
											}}
										/>
									))}
								</View>

								<View className='w-10 h-10 items-center justify-center'>
									<Text className='text-sm font-semibold text-gray-500'>
										{currentStep + 1}/{ONBOARDING_STEPS.length}
									</Text>
								</View>
							</View>
						</View>

						{/* Main Content */}
						<ScrollView
							className='flex-1 px-6'
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{ flexGrow: 1 }}
						>
							{currentStepData.isWelcome ? (
								renderWelcomeScreen()
							) : (
								<View className='flex-1'>
									{/* Step Header */}
									<View className='items-center mb-8'>
										<View className='w-16 h-16 bg-white rounded-full items-center justify-center mb-4 border border-gray-200'>
											<Text className='text-2xl'>{currentStepData.icon}</Text>
										</View>
										<Text className='text-2xl font-bold text-gray-900 text-center mb-2'>
											{currentStepData.title}
										</Text>
										<Text className='text-lg font-semibold text-blue-600 text-center mb-3'>
											{currentStepData.subtitle}
										</Text>
										<Text className='text-base text-gray-600 text-center leading-6'>
											{currentStepData.description}
										</Text>
									</View>

									{/* Form Fields */}
									<View className='flex-1'>
										{currentStepData.fields.map(renderField)}
									</View>
								</View>
							)}
						</ScrollView>

						{/* Bottom Action Button */}
						<View className='px-6 py-4 bg-white border-t border-gray-200'>
							<TouchableOpacity
								className={`w-full py-4 rounded-2xl items-center justify-center ${
									isLoading ? 'bg-blue-400' : 'bg-blue-500'
								}`}
								onPress={handleNext}
								disabled={isLoading}
								style={{
									shadowColor: '#3B82F6',
									shadowOffset: { width: 0, height: 4 },
									shadowOpacity: 0.3,
									shadowRadius: 8,
									elevation: 8,
								}}
							>
								{isLoading ? (
									<View className='flex-row items-center'>
										<ActivityIndicator size='small' color='white' />
										<Text className='text-white font-semibold text-lg ml-3'>
											{isLastStep
												? 'Setting up your account...'
												: 'Processing...'}
										</Text>
									</View>
								) : (
									<View className='flex-row items-center'>
										<Text className='text-white font-semibold text-lg'>
											{currentStepData.isWelcome
												? 'Get Started'
												: isLastStep
													? 'Complete Setup'
													: 'Continue'}
										</Text>
										<Ionicons
											name='arrow-forward'
											size={20}
											color='white'
											style={{ marginLeft: 8 }}
										/>
									</View>
								)}
							</TouchableOpacity>
						</View>
					</Animated.View>
				</KeyboardAvoidingView>
			</LinearGradient>
		</SafeAreaView>
	);
}
