import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	Pressable,
	Alert,
	ScrollView,
	ActivityIndicator,
} from 'react-native';

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
	preferences: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
	{
		id: 'auth',
		title: 'Welcome to SuperPay',
		description: "Let's get you started with secure authentication",
		fields: [
			{
				id: 'username',
				label: 'Username',
				placeholder: 'Enter your username',
				type: 'text',
				required: true,
			},
		],
	},
	{
		id: 'profile',
		title: 'Complete Your Profile',
		description: 'Tell us a bit about yourself',
		fields: [
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
			{
				id: 'email',
				label: 'Email Address',
				placeholder: 'Enter your email',
				type: 'email',
				required: true,
			},
		],
	},
	{
		id: 'contact',
		title: 'Contact Information',
		description: 'How can we reach you?',
		fields: [
			{
				id: 'phone',
				label: 'Phone Number',
				placeholder: 'Enter your phone number',
				type: 'phone',
				required: false,
			},
			{
				id: 'country',
				label: 'Country',
				placeholder: 'Select your country',
				type: 'select',
				required: true,
				options: ['United States', 'Canada', 'United Kingdom', 'Australia'],
			},
		],
	},
	{
		id: 'preferences',
		title: 'Set Your Preferences',
		description: 'Customize your experience',
		fields: [
			{
				id: 'preferences',
				label: 'Notification Preferences',
				placeholder: 'Select your preference',
				type: 'select',
				required: false,
				options: ['All notifications', 'Important only', 'None'],
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
	const [formData, setFormData] = useState<OnboardingData>({
		username: '',
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		country: '',
		preferences: 'All notifications',
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

	const handleNext = async () => {
		if (!validateStep()) return;

		if (isLastStep) {
			await handleComplete();
		} else {
			setCurrentStep((prev) => prev + 1);
		}
	};

	const handleComplete = async () => {
		setIsLoading(true);
		try {
			// Move onboarding completion logic to services
			console.log('Completing onboarding with data:', formData);

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 2000));

			Alert.alert('Success', 'Onboarding completed successfully!', [
				{
					text: 'Get Started',
					onPress: () => onComplete(formData),
				},
			]);
		} catch (error) {
			console.error('Onboarding error:', error);
			Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleBack = () => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
		}
	};

	const renderField = (field: OnboardingField) => {
		const value = formData[field.id as keyof OnboardingData];

		if (field.type === 'select') {
			return (
				<View key={field.id} className='gap-2'>
					<Text className='text-base font-semibold text-gray-700'>
						{field.label}
					</Text>
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						<View className='flex-row gap-2'>
							{field.options?.map((option) => (
								<Pressable
									key={option}
									className={`px-4 py-2 rounded-full border ${
										value === option
											? 'bg-blue-500 border-blue-500'
											: 'bg-gray-100 border-gray-300'
									}`}
									onPress={() => updateFormData(field.id, option)}
								>
									<Text
										className={`text-sm font-medium ${
											value === option ? 'text-white' : 'text-gray-700'
										}`}
									>
										{option}
									</Text>
								</Pressable>
							))}
						</View>
					</ScrollView>
				</View>
			);
		}

		return (
			<View key={field.id} className='gap-2'>
				<Text className='text-base font-semibold text-gray-700'>
					{field.label}
				</Text>
				<TextInput
					className='p-3 text-base bg-white border border-gray-300 rounded-lg'
					placeholder={field.placeholder}
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
				/>
			</View>
		);
	};

	return (
		<ScrollView
			className='flex-1 p-5 bg-gray-100'
			showsVerticalScrollIndicator={false}
		>
			<View className='p-6 my-5 bg-white shadow-sm rounded-xl'>
				{/* Progress Indicator */}
				<View className='flex-row justify-center gap-2 mb-8'>
					{ONBOARDING_STEPS.map((_, index) => (
						<View
							key={index}
							className={`w-3 h-3 rounded-full ${
								index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
							}`}
						/>
					))}
				</View>

				{/* Step Content */}
				<View className='mb-8'>
					<Text className='mb-2 text-2xl font-bold text-center text-gray-900'>
						{currentStepData.title}
					</Text>
					<Text className='mb-6 text-base text-center text-gray-600'>
						{currentStepData.description}
					</Text>

					<View className='gap-5'>
						{currentStepData.fields.map(renderField)}
					</View>
				</View>

				{/* Navigation Buttons */}
				<View className='flex-row items-center justify-between gap-3'>
					{currentStep > 0 && (
						<Pressable
							className='flex-1 px-6 py-3 bg-white border border-gray-300 rounded-lg'
							onPress={handleBack}
						>
							<Text className='text-base font-semibold text-center text-gray-700'>
								Back
							</Text>
						</Pressable>
					)}

					<Pressable
						className={`flex-[2] py-3 px-6 rounded-lg ${
							isLoading ? 'bg-blue-400' : 'bg-blue-500'
						}`}
						onPress={handleNext}
						disabled={isLoading}
					>
						{isLoading ? (
							<ActivityIndicator size='small' color='white' />
						) : (
							<Text className='text-base font-semibold text-center text-white'>
								{isLastStep ? 'Complete' : 'Next'}
							</Text>
						)}
					</Pressable>
				</View>
			</View>
		</ScrollView>
	);
}
