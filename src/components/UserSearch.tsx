import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	Modal,
	TextInput,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

interface UserProfile {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
	username?: string;
	avatarUrl?: string;
}

interface UserSearchProps {
	visible: boolean;
	onClose: () => void;
	onUserSelect: (user: UserProfile) => void;
	title?: string;
	placeholder?: string;
	excludeCurrentUser?: boolean;
	minSearchLength?: number;
}

// Mock users data
const mockUsers: UserProfile[] = [
	{
		id: '1',
		firstName: 'Sarah',
		lastName: 'Wilson',
		email: 'sarah.wilson@example.com',
		phone: '+1 (555) 123-4567',
		username: 'sarahw',
		avatarUrl: 'https://i.pravatar.cc/150?img=1',
	},
	{
		id: '2',
		firstName: 'Mike',
		lastName: 'Chen',
		email: 'mike.chen@example.com',
		phone: '+1 (555) 234-5678',
		username: 'mikec',
		avatarUrl: 'https://i.pravatar.cc/150?img=2',
	},
	{
		id: '3',
		firstName: 'Emma',
		lastName: 'Davis',
		email: 'emma.davis@example.com',
		phone: '+1 (555) 345-6789',
		username: 'emmad',
		avatarUrl: 'https://i.pravatar.cc/150?img=3',
	},
	{
		id: '4',
		firstName: 'John',
		lastName: 'Smith',
		email: 'john.smith@example.com',
		phone: '+1 (555) 456-7890',
		username: 'johns',
		avatarUrl: 'https://i.pravatar.cc/150?img=4',
	},
	{
		id: '5',
		firstName: 'Lisa',
		lastName: 'Johnson',
		email: 'lisa.johnson@example.com',
		phone: '+1 (555) 567-8901',
		username: 'lisaj',
		avatarUrl: 'https://i.pravatar.cc/150?img=5',
	},
];

export default function UserSearch({
	visible,
	onClose,
	onUserSelect,
	title = 'Search Users',
	placeholder = 'Search by name, email, or username...',
	excludeCurrentUser = false,
	minSearchLength = 1,
}: UserSearchProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [searchResults, setSearchResults] = useState<UserProfile[]>([]);

	// Reset search when modal opens/closes
	useEffect(() => {
		if (visible) {
			setSearchQuery('');
			setSearchResults([]);
		}
	}, [visible]);

	// Perform search
	useEffect(() => {
		const performSearch = async () => {
			if (searchQuery.length < minSearchLength) {
				setSearchResults([]);
				return;
			}

			setIsLoading(true);
			try {
				// Move search logic to services
				console.log('Searching users:', searchQuery);

				// Simulate API delay
				await new Promise((resolve) => setTimeout(resolve, 500));

				// Filter mock users
				const filtered = mockUsers.filter((user) => {
					const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
					const email = user.email.toLowerCase();
					const username = user.username?.toLowerCase() || '';
					const query = searchQuery.toLowerCase();

					return (
						fullName.includes(query) ||
						email.includes(query) ||
						username.includes(query)
					);
				});

				setSearchResults(filtered);
			} catch (error) {
				console.error('User search error:', error);
				setSearchResults([]);
			} finally {
				setIsLoading(false);
			}
		};

		const debounceTimer = setTimeout(performSearch, 300);
		return () => clearTimeout(debounceTimer);
	}, [searchQuery, minSearchLength]);

	const handleUserSelect = (user: UserProfile) => {
		onUserSelect(user);
		onClose();
	};

	const renderUserItem = (user: UserProfile) => (
		<TouchableOpacity
			key={user.id}
			onPress={() => handleUserSelect(user)}
			className='flex-row items-center p-4 border-b border-gray-100'
		>
			<View className='items-center justify-center w-12 h-12 mr-4 bg-blue-100 rounded-full'>
				<Text className='text-lg font-bold text-blue-600'>
					{user.firstName[0]}
				</Text>
			</View>
			<View className='flex-1'>
				<Text className='text-base font-semibold text-gray-900'>
					{user.firstName} {user.lastName}
				</Text>
				<Text className='text-sm text-gray-500'>{user.email}</Text>
				{user.username && (
					<Text className='text-sm text-blue-600'>@{user.username}</Text>
				)}
			</View>
			<Ionicons name='chevron-forward' size={20} color='#9CA3AF' />
		</TouchableOpacity>
	);

	return (
		<Modal
			visible={visible}
			animationType='slide'
			presentationStyle='pageSheet'
			onRequestClose={onClose}
		>
			<SafeAreaView className='flex-1 bg-white'>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					style={{ flex: 1 }}
				>
					{/* Header */}
					<View className='flex-row items-center justify-between p-6 border-b border-gray-200'>
						<Text className='text-xl font-bold text-gray-900'>{title}</Text>
						<TouchableOpacity onPress={onClose} className='p-2'>
							<Ionicons name='close' size={24} color='#666' />
						</TouchableOpacity>
					</View>

					{/* Search Input */}
					<View className='p-6'>
						<View className='flex-row items-center p-4 border border-gray-300 rounded-xl'>
							<Ionicons name='search' size={20} color='#9CA3AF' />
							<TextInput
								placeholder={placeholder}
								value={searchQuery}
								onChangeText={setSearchQuery}
								className='flex-1 ml-3 text-base'
								placeholderTextColor='#9CA3AF'
								autoFocus
							/>
							{searchQuery.length > 0 && (
								<TouchableOpacity onPress={() => setSearchQuery('')}>
									<Ionicons name='close-circle' size={20} color='#9CA3AF' />
								</TouchableOpacity>
							)}
						</View>
					</View>

					{/* Results */}
					<ScrollView className='flex-1' keyboardShouldPersistTaps='handled'>
						{searchQuery.length < minSearchLength ? (
							<View className='items-center justify-center flex-1 p-6'>
								<Ionicons name='search' size={64} color='#D1D5DB' />
								<Text className='mt-4 text-lg font-medium text-gray-500'>
									Start typing to search
								</Text>
								<Text className='mt-2 text-sm text-center text-gray-400'>
									Enter at least {minSearchLength} character
									{minSearchLength !== 1 ? 's' : ''} to begin searching
								</Text>
							</View>
						) : isLoading ? (
							<View className='items-center justify-center flex-1 p-6'>
								<ActivityIndicator size='large' color='#3B82F6' />
								<Text className='mt-4 text-lg text-gray-600'>Searching...</Text>
							</View>
						) : searchResults.length === 0 ? (
							<View className='items-center justify-center flex-1 p-6'>
								<Ionicons name='person-outline' size={64} color='#D1D5DB' />
								<Text className='mt-4 text-lg font-medium text-gray-500'>
									No users found
								</Text>
								<Text className='mt-2 text-sm text-center text-gray-400'>
									Try adjusting your search terms
								</Text>
							</View>
						) : (
							<View>
								<View className='px-6 py-3 bg-gray-50'>
									<Text className='text-sm font-medium text-gray-600'>
										{searchResults.length} result
										{searchResults.length !== 1 ? 's' : ''} found
									</Text>
								</View>
								{searchResults.map(renderUserItem)}
							</View>
						)}
					</ScrollView>
				</KeyboardAvoidingView>
			</SafeAreaView>
		</Modal>
	);
}
