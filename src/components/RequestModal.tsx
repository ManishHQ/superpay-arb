import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	Modal,
	TouchableOpacity,
	TextInput,
	Alert,
	ActivityIndicator,
	ScrollView,
	Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { UserProfile } from '@/types/supabase';

interface RequestModalProps {
	visible: boolean;
	onClose: () => void;
	onRequest: (amount: number, requesters: string[], note: string) => void;
}

export default function RequestModal({
	visible,
	onClose,
	onRequest,
}: RequestModalProps) {
	const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
	const [amount, setAmount] = useState('');
	const [note, setNote] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [isRequesting, setIsRequesting] = useState(false);
	const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
	const [isSearching, setIsSearching] = useState(false);

	// Get safe area insets to ensure proper spacing
	const insets = useSafeAreaInsets();

	// Get search function from store
	const { searchUsers, currentProfile } = useUserProfileStore();

	// Show only search results when user is searching
	const availableUsers = searchQuery.trim() ? searchResults : [];

	// Reset modal state when opened
	useEffect(() => {
		if (visible) {
			setSelectedContacts([]);
			setAmount('');
			setNote('');
			setSearchQuery('');
			setSearchResults([]);
		}
	}, [visible]);

	// Search users when search query changes
	useEffect(() => {
		const performSearch = async () => {
			if (searchQuery.trim().length > 2) {
				setIsSearching(true);
				try {
					const results = await searchUsers(searchQuery);
					// Filter out current user from results
					const filteredResults = currentProfile
						? results.filter((user) => user.id !== currentProfile.id)
						: results;
					setSearchResults(filteredResults);
				} catch (error) {
					console.error('Error searching users:', error);
				} finally {
					setIsSearching(false);
				}
			} else {
				setSearchResults([]);
			}
		};

		const timeoutId = setTimeout(performSearch, 300); // Debounce search
		return () => clearTimeout(timeoutId);
	}, [searchQuery, currentProfile?.id]);

	const toggleContact = (contactId: string) => {
		setSelectedContacts((prev) =>
			prev.includes(contactId)
				? prev.filter((id) => id !== contactId)
				: [...prev, contactId]
		);
	};

	const handleRequest = async () => {
		if (selectedContacts.length === 0) {
			Alert.alert('Error', 'Please select at least one person to request from');
			return;
		}

		if (!amount || parseFloat(amount) <= 0) {
			Alert.alert('Error', 'Please enter a valid amount');
			return;
		}

		setIsRequesting(true);
		try {
			const selectedNames = selectedContacts.map((id) => {
				const user = availableUsers.find((u) => u.id === id);
				return user ? `@${user.username}` : 'Unknown';
			});

			console.log('Requesting payment:', {
				amount: parseFloat(amount),
				requesters: selectedNames,
				note,
			});

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			onRequest(parseFloat(amount), selectedNames, note);

			// Reset form
			setSelectedContacts([]);
			setAmount('');
			setNote('');
			setSearchQuery('');

			onClose();
		} catch (error) {
			console.error('Request error:', error);
			Alert.alert('Error', 'Failed to send request. Please try again.');
		} finally {
			setIsRequesting(false);
		}
	};

	const getSelectedContactNames = () => {
		return selectedContacts
			.map((id) => {
				const user = availableUsers.find((u) => u.id === id);
				return user ? `@${user.username}` : 'Unknown';
			})
			.join(', ');
	};

	const handleClose = () => {
		if (!isRequesting) {
			onClose();
		}
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType='fade'
			onRequestClose={handleClose}
		>
			<View
				className='justify-end flex-1 bg-black/50 web:justify-center web:items-center'
				style={{
					paddingTop: insets.top,
					paddingBottom: insets.bottom,
					paddingLeft: insets.left,
					paddingRight: insets.right,
				}}
			>
				<Pressable className='absolute inset-0' onPress={handleClose} />
				<View className='bg-white rounded-t-3xl web:rounded-3xl web:max-w-md web:max-h-[90%] web:w-full web:mx-4 flex-1 web:flex-none'>
					<View className='flex-1'>
						<ScrollView
							className='flex-1 px-6 py-4'
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{ paddingBottom: 20 }}
						>
							{/* Header */}
							<View className='flex-row items-center justify-between mb-6 web:pt-2'>
								<Text className='text-2xl font-bold text-gray-900'>
									Request Money
								</Text>
								<TouchableOpacity
									onPress={handleClose}
									className='p-2 rounded-full hover:bg-gray-100'
									disabled={isRequesting}
								>
									<Ionicons name='close' size={24} color='#666' />
								</TouchableOpacity>
							</View>

							{/* Amount Input */}
							<View className='mb-6'>
								<Text className='mb-3 text-lg font-semibold text-gray-900'>
									Amount
								</Text>
								<View className='flex-row items-center p-4 border border-gray-300 rounded-xl focus-within:border-green-500'>
									<Text className='mr-3 text-xl font-bold text-green-600'>
										$
									</Text>
									<TextInput
										placeholder='0.00'
										value={amount}
										onChangeText={setAmount}
										keyboardType='decimal-pad'
										className='flex-1 text-xl font-semibold outline-none'
										placeholderTextColor='#9CA3AF'
									/>
									<Text className='ml-3 text-sm font-medium text-gray-500'>
										USD
									</Text>
								</View>
							</View>

							{/* User Search */}
							<View className='mb-4'>
								<Text className='mb-3 text-lg font-semibold text-gray-900'>
									Request From
								</Text>
								<View className='flex-row items-center p-3 border border-gray-300 rounded-xl focus-within:border-green-500'>
									<Ionicons name='search' size={20} color='#9CA3AF' />
									<TextInput
										placeholder='Search by username (e.g. alice_crypto)...'
										value={searchQuery}
										onChangeText={setSearchQuery}
										className='flex-1 ml-3 text-base outline-none'
										placeholderTextColor='#9CA3AF'
									/>
									{isSearching && (
										<ActivityIndicator size='small' color='#9CA3AF' />
									)}
								</View>
								{searchQuery.trim() && searchQuery.length <= 2 && (
									<Text className='mt-2 text-sm text-gray-500'>
										Type at least 3 characters to search for users
									</Text>
								)}
								{!searchQuery.trim() && (
									<Text className='mt-2 text-sm text-gray-500'>
										Start typing to search for users by username
									</Text>
								)}
							</View>

							{/* Selected Contacts Preview */}
							{selectedContacts.length > 0 && (
								<View className='p-3 mb-4 rounded-xl bg-green-50'>
									<Text className='text-sm text-green-600'>
										Requesting from:
									</Text>
									<Text className='font-medium text-green-900'>
										{getSelectedContactNames()}
									</Text>
								</View>
							)}

							{/* Users List */}
							<View className='mb-6 max-h-64'>
								{availableUsers.length > 0 ? (
									<ScrollView
										showsVerticalScrollIndicator={false}
										nestedScrollEnabled
									>
										{availableUsers.map((user) => (
											<TouchableOpacity
												key={user.id}
												onPress={() => toggleContact(user.id)}
												className={`flex-row items-center p-4 mb-2 border rounded-xl transition-colors ${
													selectedContacts.includes(user.id)
														? 'border-green-500 bg-green-50'
														: 'border-gray-200 bg-white hover:bg-gray-50'
												}`}
											>
												<View className='items-center justify-center w-12 h-12 mr-4 bg-gray-200 rounded-full'>
													<Text className='text-lg font-bold text-gray-600'>
														{user.full_name?.[0] || user.username[0] || 'U'}
													</Text>
												</View>
												<View className='flex-1'>
													<Text className='text-base font-semibold text-gray-900'>
														{user.full_name || `@${user.username}`}
													</Text>
													<Text className='text-sm text-gray-500'>
														@{user.username}
													</Text>
													<Text className='text-sm text-gray-400'>
														{user.email}
													</Text>
												</View>
												{selectedContacts.includes(user.id) && (
													<Ionicons
														name='checkmark-circle'
														size={24}
														color='#10B981'
													/>
												)}
											</TouchableOpacity>
										))}
									</ScrollView>
								) : searchQuery.trim() && !isSearching ? (
									<View className='p-4 text-center'>
										<Text className='text-gray-500'>No users found</Text>
									</View>
								) : null}
							</View>

							{/* Note Input */}
							<View className='mb-6'>
								<Text className='mb-3 text-lg font-semibold text-gray-900'>
									Note (Optional)
								</Text>
								<TextInput
									placeholder="What's this request for?"
									value={note}
									onChangeText={setNote}
									multiline
									numberOfLines={2}
									className='p-4 text-base border border-gray-300 outline-none rounded-xl focus:border-green-500'
									placeholderTextColor='#9CA3AF'
									textAlignVertical='top'
								/>
							</View>

							{/* Request Button */}
							<TouchableOpacity
								onPress={handleRequest}
								disabled={
									selectedContacts.length === 0 || !amount || isRequesting
								}
								className={`p-4 rounded-xl transition-colors ${
									selectedContacts.length > 0 && amount && !isRequesting
										? 'bg-green-600 hover:bg-green-700'
										: 'bg-gray-300'
								}`}
							>
								{isRequesting ? (
									<View className='flex-row items-center justify-center'>
										<ActivityIndicator size='small' color='white' />
										<Text className='ml-2 text-lg font-semibold text-white'>
											Sending Request...
										</Text>
									</View>
								) : (
									<View className='flex-row items-center justify-center'>
										<Ionicons name='hand-left' size={20} color='white' />
										<Text className='ml-2 text-lg font-semibold text-white'>
											Request {amount ? `$${amount}` : 'Money'}
										</Text>
									</View>
								)}
							</TouchableOpacity>
						</ScrollView>
					</View>
				</View>
			</View>
		</Modal>
	);
}
