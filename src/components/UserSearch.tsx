import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
	Modal,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthService, UserProfile } from '@/services/authService';

interface UserSearchProps {
	visible: boolean;
	onClose: () => void;
	onUserSelect: (user: UserProfile) => void;
	title?: string;
	placeholder?: string;
	multiSelect?: boolean;
	selectedUsers?: UserProfile[];
	excludeCurrentUser?: boolean;
	minSearchLength?: number;
}

interface SearchResult extends UserProfile {
	displayName: string;
	searchableText: string;
}

export default function UserSearch({
	visible,
	onClose,
	onUserSelect,
	title = 'Search Users',
	placeholder = 'Search by name or username...',
	multiSelect = false,
	selectedUsers = [],
	excludeCurrentUser = true,
	minSearchLength = 3,
}: UserSearchProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [currentUserId, setCurrentUserId] = useState<string>('');
	const [searchPagination, setSearchPagination] = useState<any>(null);
	const [currentPage, setCurrentPage] = useState(1);

	// Load current user ID for exclusion
	useEffect(() => {
		const loadCurrentUser = async () => {
			try {
				const { DIDAuthService } = await import('../services/didAuthService');
				const didToken = await DIDAuthService.getTokenForAPICall();
				if (didToken) {
					const user = await AuthService.getCurrentUser(didToken);
					setCurrentUserId(user.id || user._id || '');
				}
			} catch (error) {
				console.error('Error loading current user:', error);
			}
		};
		if (excludeCurrentUser) {
			loadCurrentUser();
		}
	}, [excludeCurrentUser]);

	// Enhanced search function with privacy protection
	const searchUsers = useCallback(
		async (query: string, page: number = 1) => {
			if (!query.trim() || query.trim().length < minSearchLength) {
				setSearchResults([]);
				setSearchPagination(null);
				return;
			}

			setIsSearching(true);
			try {
				const { DIDAuthService } = await import('../services/didAuthService');
				const didToken = await DIDAuthService.getTokenForAPICall();
				if (!didToken) {
					console.error('No DID authentication token');
					return;
				}

				const { users, pagination } = await AuthService.searchUsers(
					didToken,
					query,
					page,
					8
				);

				// Process users to create privacy-safe display data
				const processedUsers: SearchResult[] = users
					.filter((user) => {
						// Exclude current user if requested
						const userId = user.id || user._id;
						return !excludeCurrentUser || userId !== currentUserId;
					})
					.map((user) => {
						const firstName = user.firstName || '';
						const lastName = user.lastName || '';
						const username = user.username || '';

						// Create display name (no email for privacy)
						let displayName = '';
						if (firstName || lastName) {
							displayName = `${firstName} ${lastName}`.trim();
						} else if (username) {
							displayName = username;
						} else {
							displayName = 'Unknown User';
						}

						// Create searchable text for highlighting
						const searchableText =
							`${firstName} ${lastName} ${username}`.toLowerCase();

						return {
							...user,
							displayName,
							searchableText,
							email: '', // Hide email for privacy
						};
					});

				if (page === 1) {
					setSearchResults(processedUsers);
				} else {
					setSearchResults((prev) => [...prev, ...processedUsers]);
				}
				setSearchPagination(pagination);
			} catch (error) {
				console.error('Error searching users:', error);
				setSearchResults([]);
				setSearchPagination(null);
			} finally {
				setIsSearching(false);
			}
		},
		[minSearchLength, excludeCurrentUser, currentUserId]
	);

	// Auto-search with debounce
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setCurrentPage(1);
			searchUsers(searchQuery, 1);
		}, 500); // 500ms debounce

		return () => clearTimeout(timeoutId);
	}, [searchQuery, searchUsers]);

	// Load more users
	const loadMoreUsers = async () => {
		if (
			searchPagination &&
			currentPage < searchPagination.pages &&
			!isSearching
		) {
			const nextPage = currentPage + 1;
			setCurrentPage(nextPage);
			await searchUsers(searchQuery, nextPage);
		}
	};

	// Handle user selection
	const handleUserSelect = (user: SearchResult) => {
		onUserSelect(user);
		if (!multiSelect) {
			onClose();
		}
	};

	// Check if user is selected (for multi-select)
	const isUserSelected = (user: SearchResult) => {
		if (!multiSelect) return false;
		const userId = user.id || user._id;
		return selectedUsers.some(
			(selected) => (selected.id || selected._id) === userId
		);
	};

	// Reset state when modal opens/closes
	useEffect(() => {
		if (visible) {
			setSearchQuery('');
			setSearchResults([]);
			setSearchPagination(null);
			setCurrentPage(1);
		}
	}, [visible]);

	return (
		<Modal
			visible={visible}
			animationType='slide'
			presentationStyle='pageSheet'
			onRequestClose={onClose}
		>
			<View className='flex-1 bg-white'>
				{/* Header */}
				<View className='flex-row items-center justify-between p-4 border-b border-gray-200'>
					<TouchableOpacity onPress={onClose}>
						<Ionicons name='close' size={24} color='#666' />
					</TouchableOpacity>
					<Text className='text-lg font-semibold text-gray-900'>{title}</Text>
					<View style={{ width: 24 }} />
				</View>

				<View className='flex-1 p-4'>
					{/* Search Input */}
					<View className='mb-4'>
						<View className='flex-row items-center px-3 py-3 border border-gray-300 rounded-lg bg-gray-50'>
							<Ionicons name='search' size={20} color='#9CA3AF' />
							<TextInput
								placeholder={placeholder}
								value={searchQuery}
								onChangeText={setSearchQuery}
								className='flex-1 ml-2 text-base text-gray-900'
								placeholderTextColor='#9CA3AF'
								autoCapitalize='none'
								autoCorrect={false}
							/>
							{isSearching && (
								<ActivityIndicator size='small' color='#3B82F6' />
							)}
						</View>

						{/* Search hint */}
						{searchQuery.length > 0 && searchQuery.length < minSearchLength && (
							<Text className='mt-1 text-xs text-gray-500'>
								Type at least {minSearchLength} characters to search
							</Text>
						)}

						{/* Results count */}
						{searchPagination && searchPagination.total > 0 && (
							<Text className='mt-1 text-xs text-gray-500'>
								Found {searchPagination.total} user(s)
							</Text>
						)}
					</View>

					{/* Search Results */}
					{searchResults.length > 0 && (
						<ScrollView
							className='flex-1'
							showsVerticalScrollIndicator={false}
							onScroll={({ nativeEvent }) => {
								const { layoutMeasurement, contentOffset, contentSize } =
									nativeEvent;
								const paddingToBottom = 20;
								if (
									layoutMeasurement.height + contentOffset.y >=
									contentSize.height - paddingToBottom
								) {
									loadMoreUsers();
								}
							}}
							scrollEventThrottle={400}
						>
							{searchResults.map((user) => {
								const userId = user.id || user._id;
								const isSelected = isUserSelected(user);

								return (
									<TouchableOpacity
										key={userId}
										className={`p-4 mb-2 border rounded-lg ${
											isSelected
												? 'border-blue-500 bg-blue-50'
												: 'border-gray-200 bg-white'
										}`}
										onPress={() => handleUserSelect(user)}
									>
										<View className='flex-row items-center'>
											{/* Avatar */}
											<View className='items-center justify-center w-12 h-12 mr-3 bg-blue-100 rounded-full'>
												<Text className='text-lg font-semibold text-blue-600'>
													{user.displayName.charAt(0).toUpperCase()}
												</Text>
											</View>

											{/* User Info */}
											<View className='flex-1'>
												<Text className='text-base font-semibold text-gray-900'>
													{user.displayName}
												</Text>
												{user.username && (
													<Text className='text-sm text-blue-600'>
														@{user.username}
													</Text>
												)}
												{user.isVerified && (
													<View className='flex-row items-center mt-1'>
														<Ionicons
															name='checkmark-circle'
															size={14}
															color='#10B981'
														/>
														<Text className='ml-1 text-xs text-green-600'>
															Verified
														</Text>
													</View>
												)}
											</View>

											{/* Selection Indicator */}
											{multiSelect ? (
												isSelected ? (
													<Ionicons
														name='checkmark-circle'
														size={24}
														color='#3B82F6'
													/>
												) : (
													<Ionicons
														name='add-circle-outline'
														size={24}
														color='#9CA3AF'
													/>
												)
											) : (
												<Ionicons
													name='chevron-forward'
													size={20}
													color='#9CA3AF'
												/>
											)}
										</View>
									</TouchableOpacity>
								);
							})}

							{/* Load More Button */}
							{searchPagination && currentPage < searchPagination.pages && (
								<TouchableOpacity
									className='p-3 mt-2 border border-gray-300 rounded-lg bg-gray-50'
									onPress={loadMoreUsers}
									disabled={isSearching}
								>
									<View className='flex-row items-center justify-center'>
										{isSearching ? (
											<ActivityIndicator size='small' color='#3B82F6' />
										) : (
											<Ionicons name='chevron-down' size={20} color='#3B82F6' />
										)}
										<Text className='ml-2 text-sm text-blue-600'>
											{isSearching
												? 'Loading...'
												: `Load More (${
														searchPagination.total - searchResults.length
												  } remaining)`}
										</Text>
									</View>
								</TouchableOpacity>
							)}
						</ScrollView>
					)}

					{/* No Results */}
					{searchQuery.length >= minSearchLength &&
						searchResults.length === 0 &&
						!isSearching && (
							<View className='items-center justify-center flex-1 py-8'>
								<Ionicons name='person-outline' size={48} color='#D1D5DB' />
								<Text className='mt-2 text-lg text-gray-500'>
									No users found
								</Text>
								<Text className='max-w-xs text-sm text-center text-gray-400'>
									Try searching with a different name or username
								</Text>
							</View>
						)}

					{/* Initial State */}
					{searchQuery.length === 0 && (
						<View className='items-center justify-center flex-1 py-8'>
							<Ionicons name='search' size={48} color='#D1D5DB' />
							<Text className='mt-2 text-lg text-gray-500'>
								Search for users
							</Text>
							<Text className='max-w-xs text-sm text-center text-gray-400'>
								Enter a name or username to find users
							</Text>
						</View>
					)}
				</View>
			</View>
		</Modal>
	);
}
