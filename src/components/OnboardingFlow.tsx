import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	Pressable,
	Alert,
	ScrollView,
	ActivityIndicator,
	StyleSheet,
} from 'react-native';
import { Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService, type UserProfile } from '@/services';
import { MagicAuthService } from '@/services/magicAuthService';
import { useUserStore } from '@/stores';

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

interface OnboardingData extends UserProfile {
	username: string;
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
				id: 'phone',
				label: 'Phone Number (Optional)',
				placeholder: '+1 (555) 123-4567',
				type: 'phone',
				required: false,
			},
			{
				id: 'role',
				label: 'Account Type',
				placeholder: 'Select account type',
				type: 'select',
				required: true,
				options: ['personal', 'business'],
			},
		],
	},
	{
		id: 'preferences',
		title: 'Customize Your Experience',
		description: 'Set up your preferences',
		fields: [
			{
				id: 'bio',
				label: 'Bio (Optional)',
				placeholder: 'Tell us about yourself...',
				type: 'text',
				required: false,
			},
			{
				id: 'avatarUrl',
				label: 'Profile Picture URL (Optional)',
				placeholder: 'https://example.com/avatar.jpg',
				type: 'text',
				required: false,
			},
		],
	},
];

export default function OnboardingFlow({
	onComplete,
}: {
	onComplete: (data: OnboardingData) => void;
}) {
	const [currentStep, setCurrentStep] = useState(0);
	const [formData, setFormData] = useState<OnboardingData>({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		role: 'personal',
		bio: '',
		avatarUrl: '',
		username: '',
	});
	const [isLoading, setIsLoading] = useState(false);
	const [didToken, setDidToken] = useState<string | null>(null);

	// Get DID token from AsyncStorage on component mount
	useEffect(() => {
		const getDidToken = async () => {
			try {
				const storedDidToken = await AsyncStorage.getItem('userToken');
				console.log('storedDidToken', storedDidToken);
				if (storedDidToken) {
					setDidToken(storedDidToken);
				}
			} catch (error) {
				console.error('Error getting DID token:', error);
			}
		};
		getDidToken();
	}, []);

	const currentStepData = ONBOARDING_STEPS[currentStep];

	const updateFormData = (fieldId: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[fieldId]: value,
		}));
	};

	const validateStep = (): boolean => {
		const requiredFields = currentStepData.fields.filter(
			(field) => field.required
		);
		return requiredFields.every((field) => {
			const value = formData[field.id as keyof OnboardingData];
			return value && value.toString().trim().length > 0;
		});
	};

	const handleNext = async () => {
		if (!validateStep()) {
			Alert.alert('Required Fields', 'Please fill in all required fields');
			return;
		}

		if (currentStep === 0) {
			// Handle authentication step
			await handleAuthentication();
		} else if (currentStep === ONBOARDING_STEPS.length - 1) {
			// Final step - complete onboarding
			await handleCompleteOnboarding();
		} else {
			// Move to next step
			setCurrentStep((prev) => prev + 1);
		}
	};

	const handleBack = () => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
		}
	};

	const handleAuthentication = async () => {
		setIsLoading(true);
		try {
			// Get user info from Magic to extract email
			const userInfoResult = await MagicAuthService.getUserInfo();
			if (!userInfoResult.success) {
				throw new Error('Failed to get user info from Magic');
			}

			const userInfo = userInfoResult.data;
			const email = userInfo.email;

			if (!email) {
				throw new Error('Email not found in user info');
			}

			// Update form data with email from Magic
			setFormData((prev) => ({
				...prev,
				email: email,
			}));

			// Get DID token if not already available
			if (!didToken) {
				const didTokenResult = await MagicAuthService.getDidToken();
				if (!didTokenResult.success) {
					throw new Error('Failed to get DID token');
				}
				setDidToken(didTokenResult.data.didToken);
			}

			setCurrentStep((prev) => prev + 1);
		} catch (error) {
			console.error('Authentication error:', error);
			Alert.alert(
				'Authentication Failed',
				'Please check your authentication and try again'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCompleteOnboarding = async () => {
		setIsLoading(true);
		try {
			if (!didToken) {
				throw new Error('No DID token available');
			}

			// Create user profile with basic info first
			const authResponse = await AuthService.magicAuth(didToken, {
				firstName: formData.firstName,
				lastName: formData.lastName,
				role: formData.role,
				username: formData.username,
				phone: formData.phone,
				bio: formData.bio,
				avatarUrl: formData.avatarUrl,
				settings: {
					notifications: true,
					darkMode: false,
				},
			});

			console.log('authResponse', authResponse);

			// Store the JWT token and clean up DID token
			await AsyncStorage.setItem('userToken', authResponse.token);
			await AsyncStorage.removeItem('didToken');

			// Set token in user store
			useUserStore.getState().setToken(authResponse.token);
			useUserStore.getState().setUser(authResponse.user);

			onComplete(formData);
		} catch (error) {
			console.error('Onboarding completion error:', error);
			Alert.alert(
				'Setup Failed',
				'There was an error completing your setup. Please try again.'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const renderField = (field: OnboardingField) => {
		const fieldValue = formData[field.id as keyof OnboardingData];
		const value = typeof fieldValue === 'string' ? fieldValue : '';

		if (field.type === 'select') {
			return (
				<View key={field.id} style={styles.fieldContainer}>
					<Text style={styles.fieldLabel}>{field.label}</Text>
					<View style={styles.selectContainer}>
						{field.options?.map((option) => (
							<Pressable
								key={option}
								style={[
									styles.selectOption,
									value === option && styles.selectOptionSelected,
								]}
								onPress={() => updateFormData(field.id, option)}
							>
								<Text
									style={[
										styles.selectOptionText,
										value === option && styles.selectOptionTextSelected,
									]}
								>
									{option.charAt(0).toUpperCase() + option.slice(1)}
								</Text>
							</Pressable>
						))}
					</View>
				</View>
			);
		}

		return (
			<View key={field.id} style={styles.fieldContainer}>
				<Text style={styles.fieldLabel}>
					{field.label}
					{field.required && <Text style={styles.required}> *</Text>}
				</Text>
				<TextInput
					style={styles.textInput}
					placeholder={field.placeholder}
					value={value}
					onChangeText={(text) => updateFormData(field.id, text)}
					keyboardType={field.type === 'email' ? 'email-address' : 'default'}
					autoCapitalize={field.type === 'email' ? 'none' : 'words'}
				/>
			</View>
		);
	};

	return (
		<ScrollView style={styles.container}>
			<Card style={styles.card}>
				<Card.Content>
					<View style={styles.header}>
						<Text style={styles.stepIndicator}>
							Step {currentStep + 1} of {ONBOARDING_STEPS.length}
						</Text>
						<Text style={styles.title}>{currentStepData.title}</Text>
						<Text style={styles.description}>
							{currentStepData.description}
						</Text>
					</View>

					<View style={styles.form}>
						{currentStepData.fields.map(renderField)}
					</View>

					<View style={styles.buttonContainer}>
						{currentStep > 0 && (
							<Pressable style={styles.backButton} onPress={handleBack}>
								<Text style={styles.backButtonText}>Back</Text>
							</Pressable>
						)}
						<Pressable
							style={[
								styles.nextButton,
								!validateStep() && styles.nextButtonDisabled,
							]}
							onPress={handleNext}
							disabled={!validateStep() || isLoading}
						>
							{isLoading ? (
								<ActivityIndicator color='#fff' />
							) : (
								<Text style={styles.nextButtonText}>
									{currentStep === ONBOARDING_STEPS.length - 1
										? 'Complete'
										: 'Next'}
								</Text>
							)}
						</Pressable>
					</View>
				</Card.Content>
			</Card>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	card: {
		margin: 16,
		elevation: 4,
	},
	header: {
		marginBottom: 24,
	},
	stepIndicator: {
		fontSize: 14,
		color: '#666',
		marginBottom: 8,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 8,
		color: '#333',
	},
	description: {
		fontSize: 16,
		color: '#666',
		lineHeight: 22,
	},
	form: {
		marginBottom: 24,
	},
	fieldContainer: {
		marginBottom: 16,
	},
	fieldLabel: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 8,
		color: '#333',
	},
	required: {
		color: '#e74c3c',
	},
	textInput: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		backgroundColor: '#fff',
	},
	selectContainer: {
		flexDirection: 'row',
		gap: 8,
	},
	selectOption: {
		flex: 1,
		padding: 12,
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		alignItems: 'center',
		backgroundColor: '#fff',
	},
	selectOptionSelected: {
		backgroundColor: '#007AFF',
		borderColor: '#007AFF',
	},
	selectOptionText: {
		fontSize: 16,
		color: '#333',
	},
	selectOptionTextSelected: {
		color: '#fff',
		fontWeight: '600',
	},
	buttonContainer: {
		flexDirection: 'row',
		gap: 12,
	},
	backButton: {
		flex: 1,
		padding: 16,
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		alignItems: 'center',
		backgroundColor: '#fff',
	},
	backButtonText: {
		fontSize: 16,
		color: '#333',
		fontWeight: '600',
	},
	nextButton: {
		flex: 2,
		padding: 16,
		backgroundColor: '#007AFF',
		borderRadius: 8,
		alignItems: 'center',
	},
	nextButtonDisabled: {
		backgroundColor: '#ccc',
	},
	nextButtonText: {
		fontSize: 16,
		color: '#fff',
		fontWeight: '600',
	},
});
