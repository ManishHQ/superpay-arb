import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	Modal,
	Alert,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthService, OnboardingData } from '@/services/authService';
import { AvatarService } from '@/services/avatarService';

interface OnboardingModalProps {
	visible: boolean;
	initialData?: Partial<OnboardingData>;
	onComplete: (profile: any) => void;
	onCancel?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
	visible,
	initialData,
	onComplete,
	onCancel,
}) => {
	const [formData, setFormData] = useState<Partial<OnboardingData>>({
		fullName: initialData?.fullName || '',
		username: initialData?.username || '',
		email: initialData?.email || '',
		walletAddress: initialData?.walletAddress || '',
		role: 'person',
		businessName: '',
		businessType: '',
		businessDescription: '',
	});

	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<string[]>([]);
	const [usernameChecking, setUsernameChecking] = useState(false);
	const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
		null
	);
	const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
	const [avatarUploading, setAvatarUploading] = useState(false);

	const checkUsernameAvailability = async (username: string) => {
		if (!username || username.length < 3) {
			setUsernameAvailable(null);
			return;
		}

		setUsernameChecking(true);
		try {
			const available = await AuthService.isUsernameAvailable(username);
			setUsernameAvailable(available);
		} catch (error) {
			setUsernameAvailable(null);
		} finally {
			setUsernameChecking(false);
		}
	};

	const updateField = (field: keyof OnboardingData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));

		// Clear errors when user starts typing
		if (errors.length > 0) {
			setErrors([]);
		}

		// Check username availability when username changes
		if (field === 'username') {
			setUsernameAvailable(null);
			if (value.length >= 3) {
				const timeoutId = setTimeout(() => {
					checkUsernameAvailability(value);
				}, 500); // Debounce the API call

				return () => clearTimeout(timeoutId);
			}
		}
	};

	const getUsernameIcon = () => {
		if (usernameChecking) {
			return <ActivityIndicator size='small' color='#3B82F6' />;
		}
		if (usernameAvailable === true) {
			return <Ionicons name='checkmark-circle' size={20} color='#10B981' />;
		}
		if (usernameAvailable === false) {
			return <Ionicons name='close-circle' size={20} color='#EF4444' />;
		}
		return null;
	};

	const handleAvatarSelection = () => {
		Alert.alert(
			'Select Profile Picture',
			'Choose how you want to set your avatar',
			[
				{ text: 'Take Photo', onPress: () => selectAvatarFromCamera() },
				{
					text: 'Choose from Gallery',
					onPress: () => selectAvatarFromGallery(),
				},
				{ text: 'Use Default', onPress: () => setSelectedAvatar(null) },
				{ text: 'Cancel', style: 'cancel' },
			]
		);
	};

	const selectAvatarFromCamera = async () => {
		setAvatarUploading(true);
		try {
			const result = await AvatarService.takePhoto();
			if (
				result &&
				!result.canceled &&
				result.assets &&
				result.assets.length > 0
			) {
				setSelectedAvatar(result.assets[0].uri);
			}
		} catch (error) {
			console.error('Error selecting avatar from camera:', error);
			Alert.alert('Error', 'Failed to take photo. Please try again.');
		} finally {
			setAvatarUploading(false);
		}
	};

	const selectAvatarFromGallery = async () => {
		setAvatarUploading(true);
		try {
			const result = await AvatarService.pickImage();
			if (
				result &&
				!result.canceled &&
				result.assets &&
				result.assets.length > 0
			) {
				setSelectedAvatar(result.assets[0].uri);
			}
		} catch (error) {
			console.error('Error selecting avatar from gallery:', error);
			Alert.alert('Error', 'Failed to select image. Please try again.');
		} finally {
			setAvatarUploading(false);
		}
	};

	const getAvatarUrl = () => {
		if (selectedAvatar) {
			return selectedAvatar;
		}
		return AvatarService.generateDefaultAvatar(formData.username || 'user');
	};

	const handleSubmit = async () => {
		// Validate form data
		const validation = AuthService.validateOnboardingData(formData);

		if (!validation.isValid) {
			setErrors(validation.errors);
			return;
		}

		if (usernameAvailable === false) {
			setErrors(['Username is already taken. Please choose a different one.']);
			return;
		}

		setIsLoading(true);
		setErrors([]);

		try {
			let avatarUrl = null;

			// Upload avatar if one was selected
			if (selectedAvatar) {
				console.log('Uploading avatar...');
				avatarUrl = await AvatarService.uploadAvatar(
					selectedAvatar,
					formData.username || 'temp_user'
				);

				if (!avatarUrl) {
					console.warn('Avatar upload failed, using default');
					avatarUrl = AvatarService.generateDefaultAvatar(
						formData.username || 'user'
					);
				}
			} else {
				// Use default avatar
				avatarUrl = AvatarService.generateDefaultAvatar(
					formData.username || 'user'
				);
			}

			// Create profile with avatar URL
			const profileData = {
				...formData,
				avatar_url: avatarUrl,
			} as OnboardingData;

			const profile = await AuthService.createUserProfile(profileData);

			if (profile) {
				Alert.alert('Welcome!', 'Your profile has been created successfully.', [
					{
						text: 'Continue',
						onPress: () => onComplete(profile),
					},
				]);
			} else {
				setErrors(['Failed to create profile. Please try again.']);
			}
		} catch (error) {
			console.error('Error during onboarding:', error);
			setErrors(['An error occurred. Please try again.']);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal
			visible={visible}
			animationType='slide'
			presentationStyle='pageSheet'
		>
			<SafeAreaView className='flex-1 bg-white'>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					className='flex-1'
				>
					{/* Header */}
					<View className='flex-row items-center justify-between p-4 border-b border-gray-200'>
						<View>
							<Text className='text-xl font-bold text-gray-900'>
								Complete Your Profile
							</Text>
							<Text className='mt-1 text-sm text-gray-500'>
								Set up your account with a few details
							</Text>
						</View>
						{onCancel && (
							<TouchableOpacity onPress={onCancel} className='p-2'>
								<Ionicons name='close' size={24} color='#6B7280' />
							</TouchableOpacity>
						)}
					</View>

					<ScrollView
						className='flex-1 p-4'
						showsVerticalScrollIndicator={false}
						keyboardShouldPersistTaps='handled'
					>
						{/* Error Messages */}
						{errors.length > 0 && (
							<View className='p-3 mb-4 border border-red-200 rounded-lg bg-red-50'>
								{errors.map((error, index) => (
									<Text key={index} className='text-sm text-red-700'>
										• {error}
									</Text>
								))}
							</View>
						)}

						{/* Avatar Section */}
						<View className='items-center mb-6'>
							<Text className='mb-3 text-sm font-medium text-gray-700'>
								Profile Picture
							</Text>

							<View className='relative'>
								<TouchableOpacity
									onPress={handleAvatarSelection}
									disabled={avatarUploading}
									className='relative'
								>
									<View className='w-24 h-24 overflow-hidden border-4 border-blue-100 rounded-full'>
										<Image
											source={{ uri: getAvatarUrl() }}
											className='w-full h-full'
											resizeMode='cover'
										/>
									</View>

									{/* Upload indicator */}
									{avatarUploading && (
										<View className='absolute inset-0 items-center justify-center rounded-full bg-black/30'>
											<ActivityIndicator size='small' color='white' />
										</View>
									)}

									{/* Camera icon */}
									<View className='absolute items-center justify-center w-8 h-8 bg-blue-600 border-2 border-white rounded-full -bottom-1 -right-1'>
										<Ionicons name='camera' size={16} color='white' />
									</View>
								</TouchableOpacity>
							</View>

							<Text className='mt-2 text-xs text-center text-gray-500'>
								Tap to change your profile picture
							</Text>
						</View>

						{/* Role Selection */}
						<View className='mb-6'>
							<Text className='mb-3 text-sm font-medium text-gray-700'>
								Account Type *
							</Text>
							<View className='flex-row space-x-3'>
								<TouchableOpacity
									className={`flex-1 p-4 border-2 rounded-lg ${
										formData.role === 'person'
											? 'border-blue-500 bg-blue-50'
											: 'border-gray-300 bg-white'
									}`}
									onPress={() => updateField('role', 'person')}
								>
									<View className='items-center'>
										<Ionicons
											name='person'
											size={24}
											color={formData.role === 'person' ? '#3B82F6' : '#6B7280'}
										/>
										<Text
											className={`mt-2 font-medium ${
												formData.role === 'person'
													? 'text-blue-600'
													: 'text-gray-600'
											}`}
										>
											Personal
										</Text>
										<Text className='mt-1 text-xs text-center text-gray-500'>
											Individual user
										</Text>
									</View>
								</TouchableOpacity>

								<TouchableOpacity
									className={`flex-1 p-4 border-2 rounded-lg ${
										formData.role === 'business'
											? 'border-blue-500 bg-blue-50'
											: 'border-gray-300 bg-white'
									}`}
									onPress={() => updateField('role', 'business')}
								>
									<View className='items-center'>
										<Ionicons
											name='business'
											size={24}
											color={
												formData.role === 'business' ? '#3B82F6' : '#6B7280'
											}
										/>
										<Text
											className={`mt-2 font-medium ${
												formData.role === 'business'
													? 'text-blue-600'
													: 'text-gray-600'
											}`}
										>
											Business
										</Text>
										<Text className='mt-1 text-xs text-center text-gray-500'>
											Company or organization
										</Text>
									</View>
								</TouchableOpacity>
							</View>
						</View>

						{/* Form Fields */}
						<View className='space-y-4'>
							{/* Business Fields (only show for business accounts) */}
							{formData.role === 'business' && (
								<>
									<View>
										<Text className='mb-2 text-sm font-medium text-gray-700'>
											Business Name *
										</Text>
										<TextInput
											className='w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50'
											placeholder='Enter your business name'
											value={formData.businessName}
											onChangeText={(value) =>
												updateField('businessName', value)
											}
											placeholderTextColor='#9CA3AF'
											autoCapitalize='words'
										/>
									</View>

									<View>
										<Text className='mb-2 text-sm font-medium text-gray-700'>
											Business Type
										</Text>
										<TextInput
											className='w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50'
											placeholder='e.g., Restaurant, Retail, Technology'
											value={formData.businessType}
											onChangeText={(value) =>
												updateField('businessType', value)
											}
											placeholderTextColor='#9CA3AF'
											autoCapitalize='words'
										/>
									</View>

									<View>
										<Text className='mb-2 text-sm font-medium text-gray-700'>
											Business Description
										</Text>
										<TextInput
											className='w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50'
											placeholder='Brief description of your business'
											value={formData.businessDescription}
											onChangeText={(value) =>
												updateField('businessDescription', value)
											}
											placeholderTextColor='#9CA3AF'
											multiline
											numberOfLines={3}
											textAlignVertical='top'
										/>
									</View>
								</>
							)}

							{/* Full Name */}
							<View>
								<Text className='mb-2 text-sm font-medium text-gray-700'>
									Full Name *
								</Text>
								<TextInput
									className='w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50'
									placeholder='Enter your full name'
									value={formData.fullName}
									onChangeText={(value) => updateField('fullName', value)}
									placeholderTextColor='#9CA3AF'
									autoCapitalize='words'
								/>
							</View>

							{/* Username */}
							<View>
								<Text className='mb-2 text-sm font-medium text-gray-700'>
									Username *
								</Text>
								<View className='relative'>
									<TextInput
										className='w-full px-4 py-3 pr-12 text-gray-900 border border-gray-300 rounded-lg bg-gray-50'
										placeholder='Choose a unique username'
										value={formData.username}
										onChangeText={(value) =>
											updateField('username', value.toLowerCase())
										}
										placeholderTextColor='#9CA3AF'
										autoCapitalize='none'
										autoCorrect={false}
									/>
									<View className='absolute right-3 top-3.5'>
										{getUsernameIcon()}
									</View>
								</View>
								{usernameAvailable === false && (
									<Text className='mt-1 text-xs text-red-600'>
										This username is already taken
									</Text>
								)}
								{usernameAvailable === true && (
									<Text className='mt-1 text-xs text-green-600'>
										Username is available
									</Text>
								)}
							</View>

							{/* Email */}
							<View>
								<Text className='mb-2 text-sm font-medium text-gray-700'>
									Email *
								</Text>
								<TextInput
									className='w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50'
									placeholder='Enter your email address'
									value={formData.email}
									onChangeText={(value) => updateField('email', value)}
									placeholderTextColor='#9CA3AF'
									keyboardType='email-address'
									autoCapitalize='none'
									autoCorrect={false}
								/>
							</View>

							{/* Wallet Address (readonly) */}
							<View>
								<Text className='mb-2 text-sm font-medium text-gray-700'>
									Connected Wallet
								</Text>
								<View className='w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg'>
									<Text className='font-mono text-sm text-gray-600'>
										{formData.walletAddress || 'No wallet connected'}
									</Text>
								</View>
								<Text className='mt-1 text-xs text-gray-500'>
									Your wallet address from Dynamic.xyz
								</Text>
							</View>
						</View>
					</ScrollView>

					{/* Footer */}
					<View className='p-4 border-t border-gray-200'>
						<TouchableOpacity
							className={`w-full py-4 rounded-lg ${
								isLoading || usernameAvailable === false
									? 'bg-gray-400'
									: 'bg-blue-600'
							}`}
							onPress={handleSubmit}
							disabled={isLoading || usernameAvailable === false}
						>
							{isLoading ? (
								<View className='flex-row items-center justify-center'>
									<ActivityIndicator
										size='small'
										color='white'
										className='mr-2'
									/>
									<Text className='font-semibold text-white'>
										Creating Profile...
									</Text>
								</View>
							) : (
								<Text className='font-semibold text-center text-white'>
									Complete Profile
								</Text>
							)}
						</TouchableOpacity>
					</View>
				</KeyboardAvoidingView>
			</SafeAreaView>
		</Modal>
	);
};
