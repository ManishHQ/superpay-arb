import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	TextInput,
	StyleSheet,
	Alert,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { UserProfileService } from '@/services/userProfileService';
import { AvatarService } from '@/services/avatarService';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'react-native';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#ffffff',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 24,
		paddingVertical: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#f3f4f6',
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: '700',
		color: '#111827',
	},
	saveButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#3b82f6',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 12,
		gap: 6,
	},
	saveButtonDisabled: {
		backgroundColor: '#9ca3af',
	},
	saveButtonText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '600',
	},
	content: {
		flex: 1,
		paddingHorizontal: 24,
		paddingVertical: 20,
	},
	section: {
		marginBottom: 32,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 16,
	},
	avatarSection: {
		alignItems: 'center',
		marginBottom: 24,
	},
	avatarContainer: {
		position: 'relative',
		marginBottom: 16,
	},
	avatar: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: '#f3f4f6',
	},
	avatarEditButton: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		backgroundColor: '#3b82f6',
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 3,
		borderColor: '#ffffff',
	},
	avatarText: {
		fontSize: 14,
		color: '#6b7280',
		textAlign: 'center',
	},
	formGroup: {
		marginBottom: 20,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		color: '#374151',
		marginBottom: 8,
	},
	labelRequired: {
		color: '#dc2626',
	},
	input: {
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 16,
		color: '#111827',
		backgroundColor: '#ffffff',
	},
	inputFocused: {
		borderColor: '#3b82f6',
		borderWidth: 2,
	},
	inputError: {
		borderColor: '#dc2626',
	},
	textArea: {
		minHeight: 100,
		textAlignVertical: 'top',
	},
	errorText: {
		fontSize: 12,
		color: '#dc2626',
		marginTop: 4,
	},
	helperText: {
		fontSize: 12,
		color: '#6b7280',
		marginTop: 4,
	},
	businessTypeContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 12,
		marginTop: 8,
	},
	businessTypeChip: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: '#d1d5db',
		backgroundColor: '#ffffff',
	},
	businessTypeChipSelected: {
		backgroundColor: '#3b82f6',
		borderColor: '#3b82f6',
	},
	businessTypeText: {
		fontSize: 14,
		color: '#374151',
	},
	businessTypeTextSelected: {
		color: '#ffffff',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		fontSize: 16,
		color: '#6b7280',
		marginTop: 12,
	},
});

const businessTypes = [
	'Retail',
	'Restaurant',
	'Service',
	'E-commerce',
	'Healthcare',
	'Education',
	'Technology',
	'Consulting',
	'Manufacturing',
	'Other',
];

export default function BusinessSettings() {
	const {
		currentProfile,
		setCurrentProfile,
		isLoading: profileLoading,
	} = useUserProfileStore();
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [focusedField, setFocusedField] = useState<string | null>(null);
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Form state
	const [formData, setFormData] = useState({
		business_name: '',
		display_name: '',
		full_name: '',
		email: '',
		phone: '',
		business_type: '',
		business_description: '',
		website: '',
		address: '',
		avatar_url: '',
	});

	useEffect(() => {
		if (currentProfile) {
			setFormData({
				business_name: currentProfile.business_name || '',
				display_name: currentProfile.display_name || '',
				full_name: currentProfile.full_name || '',
				email: currentProfile.email || '',
				phone: currentProfile.phone || '',
				business_type: currentProfile.business_type || '',
				business_description: currentProfile.business_description || '',
				website: currentProfile.website || '',
				address: currentProfile.address || '',
				avatar_url: currentProfile.avatar_url || '',
			});
		}
	}, [currentProfile]);

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.business_name.trim()) {
			newErrors.business_name = 'Business name is required';
		}

		if (!formData.display_name.trim()) {
			newErrors.display_name = 'Display name is required';
		}

		if (!formData.email.trim()) {
			newErrors.email = 'Email is required';
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = 'Please enter a valid email address';
		}

		if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
			newErrors.website =
				'Please enter a valid URL (starting with http:// or https://)';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = async () => {
		if (!validateForm()) {
			Alert.alert('Validation Error', 'Please fix the errors before saving.');
			return;
		}

		if (!currentProfile?.id) {
			Alert.alert('Error', 'Profile not found. Please try again.');
			return;
		}

		setIsSaving(true);
		try {
			console.log(
				'🔄 Saving profile with ID:',
				currentProfile.id,
				'type:',
				typeof currentProfile.id
			);
			const updatedProfile = await UserProfileService.updateProfile(
				String(currentProfile.id), // Ensure it's a string
				{
					business_name: formData.business_name.trim(),
					display_name: formData.display_name.trim(),
					full_name: formData.full_name.trim(),
					email: formData.email.trim(),
					phone: formData.phone.trim() || null,
					business_type: formData.business_type || null,
					business_description: formData.business_description.trim() || null,
					website: formData.website.trim() || null,
					address: formData.address.trim() || null,
					avatar_url: formData.avatar_url || null,
				}
			);

			if (updatedProfile) {
				setCurrentProfile(updatedProfile);
				Alert.alert('Success', 'Business settings updated successfully!');
			} else {
				Alert.alert(
					'Error',
					'Failed to update business settings. Please try again.'
				);
			}
		} catch (error) {
			console.error('Error updating profile:', error);
			Alert.alert(
				'Error',
				'Failed to update business settings. Please try again.'
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleAvatarPress = async () => {
		if (!currentProfile?.id) return;

		Alert.alert(
			'Update Avatar',
			'Choose how you want to update your business avatar',
			[
				{ text: 'Camera', onPress: () => uploadAvatar(true) },
				{ text: 'Photo Library', onPress: () => uploadAvatar(false) },
				{ text: 'Cancel', style: 'cancel' },
			]
		);
	};

	const uploadAvatar = async (fromCamera: boolean) => {
		if (!currentProfile?.id) return;

		setIsLoading(true);
		try {
			console.log('📸 Starting avatar upload process...');
			const avatarUrl = await AvatarService.selectAndUploadAvatar(
				currentProfile.id,
				fromCamera
			);

			if (avatarUrl) {
				console.log('✅ Avatar uploaded successfully:', avatarUrl);

				// Update local form state (store clean URL, cache-busting handled in getAvatarUrl)
				setFormData((prev) => ({
					...prev,
					avatar_url: avatarUrl,
				}));

				// Also update the profile in database immediately
				try {
					console.log(
						'🔄 Updating profile with ID:',
						currentProfile.id,
						'type:',
						typeof currentProfile.id
					);
					console.log(
						'🔄 Avatar URL to update:',
						avatarUrl,
						'type:',
						typeof avatarUrl
					);

					// Simple test - just update avatar_url with a plain string (store original URL without timestamp)
					const updateData = {
						avatar_url: String(avatarUrl), // Store original URL in database
					};
					console.log('🔄 Update data:', JSON.stringify(updateData));

					const updatedProfile = await UserProfileService.updateProfile(
						String(currentProfile.id), // Ensure it's a string
						updateData
					);

					if (updatedProfile) {
						setCurrentProfile(updatedProfile);
						Alert.alert('Success', 'Avatar updated successfully!');
					} else {
						Alert.alert(
							'Warning',
							'Avatar uploaded but profile update failed. Please save your settings to sync.'
						);
					}
				} catch (profileError) {
					console.error(
						'Error updating profile with new avatar:',
						profileError
					);
					Alert.alert(
						'Warning',
						'Avatar uploaded but profile update failed. Please save your settings to sync.'
					);
				}
			} else {
				console.log('❌ Avatar upload returned null - user may have cancelled');
				// Don't show error if user cancelled
			}
		} catch (error) {
			console.error('💥 Error uploading avatar:', error);

			// Show the specific error message from the service
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to upload avatar. Please try again.';

			Alert.alert('Upload Error', errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const updateFormData = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: '' }));
		}
	};

	const getAvatarUrl = () => {
		if (formData.avatar_url) {
			// Remove any existing cache-busting parameters and add a fresh one
			const cleanUrl = formData.avatar_url.split('?')[0];
			return `${cleanUrl}?v=${Date.now()}`;
		}
		return AvatarService.getAvatarUrl({
			avatar_url: formData.avatar_url,
			username: currentProfile?.username || 'business',
		});
	};

	if (profileLoading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size='large' color='#3b82f6' />
					<Text style={styles.loadingText}>Loading business settings...</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={{ flex: 1 }}
		>
			<SafeAreaView style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.headerTitle}>Business Settings</Text>
					<TouchableOpacity
						style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
						onPress={handleSave}
						disabled={isSaving}
					>
						{isSaving ? (
							<ActivityIndicator size='small' color='#ffffff' />
						) : (
							<Ionicons name='checkmark' size={16} color='#ffffff' />
						)}
						<Text style={styles.saveButtonText}>
							{isSaving ? 'Saving...' : 'Save'}
						</Text>
					</TouchableOpacity>
				</View>

				<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
					{/* Avatar Section */}
					<View style={styles.avatarSection}>
						<View style={styles.avatarContainer}>
							<Image
								source={{ uri: getAvatarUrl() }}
								style={styles.avatar}
								resizeMode='cover'
							/>
							<TouchableOpacity
								style={styles.avatarEditButton}
								onPress={handleAvatarPress}
								disabled={isLoading}
							>
								{isLoading ? (
									<ActivityIndicator size='small' color='#ffffff' />
								) : (
									<Ionicons name='camera' size={16} color='#ffffff' />
								)}
							</TouchableOpacity>
						</View>
						<Text style={styles.avatarText}>
							Tap to update your business logo or photo
						</Text>
					</View>

					{/* Business Information */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Business Information</Text>

						<View style={styles.formGroup}>
							<Text style={styles.label}>
								Business Name <Text style={styles.labelRequired}>*</Text>
							</Text>
							<TextInput
								style={[
									styles.input,
									focusedField === 'business_name' && styles.inputFocused,
									errors.business_name && styles.inputError,
								]}
								value={formData.business_name}
								onChangeText={(value) => updateFormData('business_name', value)}
								onFocus={() => setFocusedField('business_name')}
								onBlur={() => setFocusedField(null)}
								placeholder='Enter your business name'
								placeholderTextColor='#9ca3af'
							/>
							{errors.business_name && (
								<Text style={styles.errorText}>{errors.business_name}</Text>
							)}
						</View>

						<View style={styles.formGroup}>
							<Text style={styles.label}>
								Display Name <Text style={styles.labelRequired}>*</Text>
							</Text>
							<TextInput
								style={[
									styles.input,
									focusedField === 'display_name' && styles.inputFocused,
									errors.display_name && styles.inputError,
								]}
								value={formData.display_name}
								onChangeText={(value) => updateFormData('display_name', value)}
								onFocus={() => setFocusedField('display_name')}
								onBlur={() => setFocusedField(null)}
								placeholder='How should customers see your business?'
								placeholderTextColor='#9ca3af'
							/>
							{errors.display_name && (
								<Text style={styles.errorText}>{errors.display_name}</Text>
							)}
							<Text style={styles.helperText}>
								This is how your business appears to customers
							</Text>
						</View>

						<View style={styles.formGroup}>
							<Text style={styles.label}>Business Type</Text>
							<View style={styles.businessTypeContainer}>
								{businessTypes.map((type) => (
									<TouchableOpacity
										key={type}
										style={[
											styles.businessTypeChip,
											formData.business_type === type &&
												styles.businessTypeChipSelected,
										]}
										onPress={() => updateFormData('business_type', type)}
									>
										<Text
											style={[
												styles.businessTypeText,
												formData.business_type === type &&
													styles.businessTypeTextSelected,
											]}
										>
											{type}
										</Text>
									</TouchableOpacity>
								))}
							</View>
						</View>

						<View style={styles.formGroup}>
							<Text style={styles.label}>Business Description</Text>
							<TextInput
								style={[
									styles.input,
									styles.textArea,
									focusedField === 'business_description' &&
										styles.inputFocused,
								]}
								value={formData.business_description}
								onChangeText={(value) =>
									updateFormData('business_description', value)
								}
								onFocus={() => setFocusedField('business_description')}
								onBlur={() => setFocusedField(null)}
								placeholder='Describe your business...'
								placeholderTextColor='#9ca3af'
								multiline
								numberOfLines={4}
								textAlignVertical='top'
							/>
						</View>
					</View>

					{/* Contact Information */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Contact Information</Text>

						<View style={styles.formGroup}>
							<Text style={styles.label}>
								Email <Text style={styles.labelRequired}>*</Text>
							</Text>
							<TextInput
								style={[
									styles.input,
									focusedField === 'email' && styles.inputFocused,
									errors.email && styles.inputError,
								]}
								value={formData.email}
								onChangeText={(value) => updateFormData('email', value)}
								onFocus={() => setFocusedField('email')}
								onBlur={() => setFocusedField(null)}
								placeholder='business@example.com'
								placeholderTextColor='#9ca3af'
								keyboardType='email-address'
								autoCapitalize='none'
							/>
							{errors.email && (
								<Text style={styles.errorText}>{errors.email}</Text>
							)}
						</View>

						<View style={styles.formGroup}>
							<Text style={styles.label}>Phone Number</Text>
							<TextInput
								style={[
									styles.input,
									focusedField === 'phone' && styles.inputFocused,
								]}
								value={formData.phone}
								onChangeText={(value) => updateFormData('phone', value)}
								onFocus={() => setFocusedField('phone')}
								onBlur={() => setFocusedField(null)}
								placeholder='+1 (555) 123-4567'
								placeholderTextColor='#9ca3af'
								keyboardType='phone-pad'
							/>
						</View>

						<View style={styles.formGroup}>
							<Text style={styles.label}>Website</Text>
							<TextInput
								style={[
									styles.input,
									focusedField === 'website' && styles.inputFocused,
									errors.website && styles.inputError,
								]}
								value={formData.website}
								onChangeText={(value) => updateFormData('website', value)}
								onFocus={() => setFocusedField('website')}
								onBlur={() => setFocusedField(null)}
								placeholder='https://www.yourbusiness.com'
								placeholderTextColor='#9ca3af'
								keyboardType='url'
								autoCapitalize='none'
							/>
							{errors.website && (
								<Text style={styles.errorText}>{errors.website}</Text>
							)}
						</View>

						<View style={styles.formGroup}>
							<Text style={styles.label}>Business Address</Text>
							<TextInput
								style={[
									styles.input,
									styles.textArea,
									focusedField === 'address' && styles.inputFocused,
								]}
								value={formData.address}
								onChangeText={(value) => updateFormData('address', value)}
								onFocus={() => setFocusedField('address')}
								onBlur={() => setFocusedField(null)}
								placeholder='123 Business St, City, State 12345'
								placeholderTextColor='#9ca3af'
								multiline
								numberOfLines={3}
								textAlignVertical='top'
							/>
						</View>
					</View>

					{/* Owner Information */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Owner Information</Text>

						<View style={styles.formGroup}>
							<Text style={styles.label}>Full Name</Text>
							<TextInput
								style={[
									styles.input,
									focusedField === 'full_name' && styles.inputFocused,
								]}
								value={formData.full_name}
								onChangeText={(value) => updateFormData('full_name', value)}
								onFocus={() => setFocusedField('full_name')}
								onBlur={() => setFocusedField(null)}
								placeholder='Your full name'
								placeholderTextColor='#9ca3af'
							/>
							<Text style={styles.helperText}>
								Your name as the business owner
							</Text>
						</View>
					</View>

					{/* Add some bottom padding for the last section */}
					<View style={{ height: 40 }} />
				</ScrollView>
			</SafeAreaView>
		</KeyboardAvoidingView>
	);
}
