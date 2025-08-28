import React, { useState } from 'react';
import {
	View,
	Text,
	Modal,
	TouchableOpacity,
	TextInput,
	ScrollView,
	Alert,
	ActivityIndicator,
	FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
	ActivityService,
	ActivityType,
	type CreateActivityData,
} from '@/services/activityService';
import { AuthService, type UserProfile } from '@/services/authService';

interface CreateActivityModalProps {
	visible: boolean;
	onClose: () => void;
	onActivityCreated: () => void;
}

export default function CreateActivityModal({
	visible,
	onClose,
	onActivityCreated,
}: CreateActivityModalProps) {
	const [formData, setFormData] = useState<CreateActivityData>({
		name: '',
		type: ActivityType.PERSONAL,
		description: '',
		icon: '',
		memberIds: [],
	});
	const [isLoading, setIsLoading] = useState(false);
	const [showTypeDropdown, setShowTypeDropdown] = useState(false);

	// User search states
	const [userSearchQuery, setUserSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [showUserSearch, setShowUserSearch] = useState(false);

	const activityTypeOptions = ActivityService.getActivityTypeOptions();

	// User search functionality
	const handleUserSearch = async () => {
		if (!userSearchQuery.trim()) {
			Alert.alert('Search Query', 'Please enter a search term');
			return;
		}

		setIsSearching(true);
		try {
			const { DIDAuthService } = await import('../services/didAuthService');
			const didToken = await DIDAuthService.getTokenForAPICall();
			if (!didToken) {
				throw new Error('No DID authentication token found');
			}

			const results = await AuthService.searchUsers(didToken, userSearchQuery);
			setSearchResults(results);
		} catch (error) {
			console.error('User search error:', error);
			Alert.alert('Search Failed', 'Failed to search users. Please try again.');
		} finally {
			setIsSearching(false);
		}
	};

	const addUserToActivity = (user: UserProfile) => {
		if (!selectedUsers.find((u) => u.email === user.email)) {
			const newSelectedUsers = [...selectedUsers, user];
			setSelectedUsers(newSelectedUsers);

			// Update memberIds in formData (assuming we have user IDs)
			const memberEmails = newSelectedUsers.map((u) => u.email);
			updateFormData('memberIds', memberEmails);
		}
		setUserSearchQuery('');
		setSearchResults([]);
	};

	const removeUserFromActivity = (userEmail: string) => {
		const newSelectedUsers = selectedUsers.filter((u) => u.email !== userEmail);
		setSelectedUsers(newSelectedUsers);

		// Update memberIds in formData
		const memberEmails = newSelectedUsers.map((u) => u.email);
		updateFormData('memberIds', memberEmails);
	};

	const updateFormData = (field: keyof CreateActivityData, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const validateForm = (): boolean => {
		return formData.name.trim().length > 0;
	};

	const handleSubmit = async () => {
		if (!validateForm()) {
			Alert.alert('Validation Error', 'Please fill in all required fields');
			return;
		}

		setIsLoading(true);
		try {
			await ActivityService.createActivity(formData);
			Alert.alert('Success', 'Activity created successfully!');
			setFormData({
				name: '',
				type: ActivityType.PERSONAL,
				description: '',
				icon: '',
				memberIds: [],
			});

			// Reset user search states
			setUserSearchQuery('');
			setSearchResults([]);
			setSelectedUsers([]);
			setShowUserSearch(false);

			onActivityCreated();
			onClose();
		} catch (error) {
			console.error('Error creating activity:', error);
			Alert.alert(
				'Error',
				error instanceof Error ? error.message : 'Failed to create activity'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		if (isLoading) return;
		setFormData({
			name: '',
			type: ActivityType.PERSONAL,
			description: '',
			icon: '',
			memberIds: [],
		});
		setShowTypeDropdown(false);

		// Reset user search states
		setUserSearchQuery('');
		setSearchResults([]);
		setSelectedUsers([]);
		setShowUserSearch(false);

		onClose();
	};

	const selectedTypeOption = activityTypeOptions.find(
		(option) => option.value === formData.type
	);

	return (
		<Modal
			visible={visible}
			animationType='slide'
			presentationStyle='pageSheet'
			onRequestClose={handleClose}
		>
			<SafeAreaView className='flex-1 bg-white'>
				{/* Header */}
				<View className='flex-row items-center justify-between p-4 border-b border-gray-200'>
					<TouchableOpacity onPress={handleClose} disabled={isLoading}>
						<Ionicons name='close' size={24} color='#666' />
					</TouchableOpacity>
					<Text className='text-lg font-semibold text-gray-900'>
						Create New Activity
					</Text>
					<TouchableOpacity
						onPress={handleSubmit}
						disabled={!validateForm() || isLoading}
						className={`px-4 py-2 rounded-lg ${
							validateForm() && !isLoading ? 'bg-blue-500' : 'bg-gray-300'
						}`}
					>
						{isLoading ? (
							<ActivityIndicator size='small' color='white' />
						) : (
							<Text className='font-medium text-white'>Create</Text>
						)}
					</TouchableOpacity>
				</View>

				{/* Form */}
				<ScrollView className='flex-1 p-4' showsVerticalScrollIndicator={false}>
					{/* Activity Name */}
					<View className='mb-6'>
						<Text className='mb-2 text-base font-medium text-gray-900'>
							Activity Name <Text className='text-red-500'>*</Text>
						</Text>
						<TextInput
							className='p-3 text-base border border-gray-300 rounded-lg'
							placeholder='Enter activity name'
							value={formData.name}
							onChangeText={(text) => updateFormData('name', text)}
							maxLength={100}
						/>
					</View>

					{/* Activity Type */}
					<View className='mb-6'>
						<Text className='mb-2 text-base font-medium text-gray-900'>
							Activity Type <Text className='text-red-500'>*</Text>
						</Text>
						<TouchableOpacity
							className='flex-row items-center justify-between p-3 border border-gray-300 rounded-lg'
							onPress={() => setShowTypeDropdown(!showTypeDropdown)}
						>
							<View className='flex-row items-center'>
								<Text className='mr-3 text-xl'>{selectedTypeOption?.icon}</Text>
								<Text className='text-base text-gray-900'>
									{selectedTypeOption?.label}
								</Text>
							</View>
							<Ionicons
								name={showTypeDropdown ? 'chevron-up' : 'chevron-down'}
								size={20}
								color='#666'
							/>
						</TouchableOpacity>

						{/* Type Dropdown */}
						{showTypeDropdown && (
							<View className='mt-2 bg-white border border-gray-200 rounded-lg shadow-sm'>
								{activityTypeOptions.map((option) => (
									<TouchableOpacity
										key={option.value}
										className='flex-row items-center p-3 border-b border-gray-100 last:border-b-0'
										onPress={() => {
											updateFormData('type', option.value);
											setShowTypeDropdown(false);
										}}
									>
										<Text className='mr-3 text-xl'>{option.icon}</Text>
										<Text className='text-base text-gray-900'>
											{option.label}
										</Text>
										{formData.type === option.value && (
											<Ionicons
												name='checkmark'
												size={20}
												color='#3D5AFE'
												style={{ marginLeft: 'auto' }}
											/>
										)}
									</TouchableOpacity>
								))}
							</View>
						)}
					</View>

					{/* Description */}
					<View className='mb-6'>
						<Text className='mb-2 text-base font-medium text-gray-900'>
							Description
						</Text>
						<TextInput
							className='p-3 text-base border border-gray-300 rounded-lg'
							placeholder='Enter activity description (optional)'
							value={formData.description}
							onChangeText={(text) => updateFormData('description', text)}
							multiline
							numberOfLines={3}
							maxLength={500}
							textAlignVertical='top'
						/>
					</View>

					{/* Custom Icon */}
					<View className='mb-6'>
						<Text className='mb-2 text-base font-medium text-gray-900'>
							Custom Icon
						</Text>
						<TextInput
							className='p-3 text-base border border-gray-300 rounded-lg'
							placeholder='Enter emoji or icon (optional)'
							value={formData.icon}
							onChangeText={(text) => updateFormData('icon', text)}
							maxLength={10}
						/>
						{formData.icon && (
							<View className='p-2 mt-2 rounded-lg bg-gray-50'>
								<Text className='text-2xl text-center'>{formData.icon}</Text>
							</View>
						)}
					</View>

					{/* Add Members */}
					<View className='mb-6'>
						<View className='flex-row items-center justify-between mb-2'>
							<Text className='text-base font-medium text-gray-900'>
								Add Members
							</Text>
							<TouchableOpacity
								className='px-3 py-1 bg-blue-100 rounded-lg'
								onPress={() => setShowUserSearch(!showUserSearch)}
							>
								<Text className='text-sm font-medium text-blue-600'>
									{showUserSearch ? 'Hide Search' : 'Search Users'}
								</Text>
							</TouchableOpacity>
						</View>

						{/* User Search */}
						{showUserSearch && (
							<View className='p-3 mb-4 rounded-lg bg-gray-50'>
								<View className='flex-row items-center mb-3'>
									<TextInput
										className='flex-1 p-2 mr-2 text-base bg-white border border-gray-300 rounded-lg'
										placeholder='Search by email, phone, or username...'
										value={userSearchQuery}
										onChangeText={setUserSearchQuery}
										onSubmitEditing={handleUserSearch}
									/>
									<TouchableOpacity
										className={`px-4 py-2 rounded-lg ${
											isSearching ? 'bg-gray-400' : 'bg-blue-500'
										}`}
										onPress={handleUserSearch}
										disabled={isSearching}
									>
										{isSearching ? (
											<ActivityIndicator size='small' color='white' />
										) : (
											<Text className='font-medium text-white'>Search</Text>
										)}
									</TouchableOpacity>
								</View>

								{/* Search Results */}
								{searchResults.length > 0 && (
									<View className='max-h-40'>
										<Text className='mb-2 text-sm font-medium text-gray-700'>
											Found {searchResults.length} user(s):
										</Text>
										<FlatList
											data={searchResults}
											keyExtractor={(item) => item.email}
											renderItem={({ item }) => (
												<TouchableOpacity
													className='flex-row items-center p-2 mb-1 bg-white border border-gray-200 rounded'
													onPress={() => addUserToActivity(item)}
												>
													<View className='flex-1'>
														<Text className='font-medium text-gray-900'>
															{item.firstName} {item.lastName}
														</Text>
														<Text className='text-sm text-gray-600'>
															{item.email}
														</Text>
													</View>
													<Ionicons
														name='add-circle'
														size={20}
														color='#3D5AFE'
													/>
												</TouchableOpacity>
											)}
											style={{ maxHeight: 120 }}
											nestedScrollEnabled
										/>
									</View>
								)}

								{searchResults.length === 0 &&
									userSearchQuery &&
									!isSearching && (
										<Text className='text-sm text-center text-gray-500'>
											No users found. Try a different search term.
										</Text>
									)}
							</View>
						)}

						{/* Selected Members */}
						{selectedUsers.length > 0 && (
							<View className='p-3 rounded-lg bg-blue-50'>
								<Text className='mb-2 text-sm font-medium text-gray-700'>
									Selected Members ({selectedUsers.length}):
								</Text>
								{selectedUsers.map((user) => (
									<View
										key={user.email}
										className='flex-row items-center justify-between p-2 mb-1 bg-white border border-blue-200 rounded'
									>
										<View className='flex-1'>
											<Text className='font-medium text-gray-900'>
												{user.firstName} {user.lastName}
											</Text>
											<Text className='text-sm text-gray-600'>
												{user.email}
											</Text>
										</View>
										<TouchableOpacity
											onPress={() => removeUserFromActivity(user.email)}
										>
											<Ionicons name='close-circle' size={20} color='#EF4444' />
										</TouchableOpacity>
									</View>
								))}
							</View>
						)}
					</View>

					{/* Preview */}
					<View className='p-4 mb-6 rounded-lg bg-gray-50'>
						<Text className='mb-2 text-sm font-medium text-gray-600'>
							Preview
						</Text>
						<View className='flex-row items-center mb-3'>
							<View className='items-center justify-center w-12 h-12 mr-3 bg-white rounded-full shadow-sm'>
								<Text className='text-xl'>
									{formData.icon || selectedTypeOption?.icon}
								</Text>
							</View>
							<View className='flex-1'>
								<Text className='text-base font-medium text-gray-900'>
									{formData.name || 'Activity Name'}
								</Text>
								<Text className='text-sm text-gray-600'>
									{formData.description || 'No description'}
								</Text>
								<Text className='mt-1 text-xs text-gray-500'>
									{selectedTypeOption?.label}
								</Text>
							</View>
						</View>
						{selectedUsers.length > 0 && (
							<View className='flex-row items-center mt-2'>
								<Ionicons name='people-outline' size={14} color='#666' />
								<Text className='ml-1 text-xs text-gray-500'>
									{selectedUsers.length + 1} members (including you)
								</Text>
							</View>
						)}
					</View>
				</ScrollView>
			</SafeAreaView>
		</Modal>
	);
}
