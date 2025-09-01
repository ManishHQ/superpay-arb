import React, { useState, useEffect, useCallback, useRef } from 'react';
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
	FlatList,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import LottieView from 'lottie-react-native';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useBalanceStore } from '@/stores/balanceStore';
import { useWalletStore } from '@/stores/walletStore';
import { useSavingsPotsStore } from '@/stores/savingsPotsStore';
import { UserProfile } from '@/types/supabase';
import { WalletService } from '@/services/walletService';
import { USDCService } from '@/services/usdcService';
import {
	TransactionService,
	TransactionCategory,
} from '@/services/transactionService';
import { PotsActivityService } from '@/services/potsActivityService';
import { publicClient } from '@/lib/client';
import { debounce } from 'lodash';

type CurrencyType = 'USDC' | 'ETH';

interface SendModalProps {
	visible: boolean;
	onClose: () => void;
	onSend: (
		amount: number,
		recipients: string[],
		note: string,
		currency: CurrencyType,
		category?: TransactionCategory,
		potId?: string
	) => void;
	prefillData?: {
		amount?: string;
		recipient?: string;
		note?: string;
		recipientName?: string;
		category?: TransactionCategory;
		potId?: string;
	};
}

interface SelectedUser {
	id: string;
	username: string;
	full_name: string;
	wallet_address: string;
	avatar_url?: string;
}

export default function SendModal({
	visible,
	onClose,
	onSend,
	prefillData,
}: SendModalProps) {
	const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
	const [amount, setAmount] = useState('');
	const [note, setNote] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [isSending, setIsSending] = useState(false);
	const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [selectedCurrency, setSelectedCurrency] =
		useState<CurrencyType>('USDC');
	const [showSuccess, setShowSuccess] = useState(true);
	const [transactionHash, setTransactionHash] = useState<string>('');
	const [selectedCategory, setSelectedCategory] = useState<
		TransactionCategory | undefined
	>();
	const [selectedPotId, setSelectedPotId] = useState<string | undefined>();
	const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

	// Lottie animation ref
	const successAnimation = useRef<LottieView>(null);

	// Get safe area insets to ensure proper spacing
	const insets = useSafeAreaInsets();

	// Get services and stores
	const { searchUsers } = useUserProfileStore();
	const { address: walletAddress } = useWalletStore();
	const { getBalance } = useBalanceStore();
	const { getActivePots } = useSavingsPotsStore();

	// Get current balances
	const ethBalance = walletAddress ? getBalance(walletAddress, 'eth') : null;
	const usdcBalance = walletAddress ? getBalance(walletAddress, 'usdc') : null;

	// Category options
	const categoryOptions = [
		{ key: 'food', label: 'Food & Dining', icon: '🍕' },
		{ key: 'transport', label: 'Transport', icon: '🚗' },
		{ key: 'shopping', label: 'Shopping', icon: '🛍️' },
		{ key: 'entertainment', label: 'Entertainment', icon: '🎮' },
		{ key: 'healthcare', label: 'Healthcare', icon: '🏥' },
		{ key: 'utilities', label: 'Utilities', icon: '💡' },
		{ key: 'housing', label: 'Housing', icon: '🏠' },
		{ key: 'emergency', label: 'Emergency', icon: '🛡️' },
		{ key: 'vacation', label: 'Vacation', icon: '✈️' },
		{ key: 'investment', label: 'Investment', icon: '📈' },
		{ key: 'other', label: 'Other', icon: '📦' },
	];

	const selectedCategoryOption = categoryOptions.find(
		(cat) => cat.key === selectedCategory
	);

	// Get available balance for selected currency
	const availableBalance =
		selectedCurrency === 'ETH'
			? ethBalance?.formatted || '0.0000'
			: usdcBalance?.formatted || '0.00';

	// Reset modal state when opened and handle prefill data
	useEffect(() => {
		if (visible) {
			// Apply prefill data if available
			if (prefillData) {
				setAmount(prefillData.amount || '');
				setNote(prefillData.note || '');

				// If recipient info is provided, create a selected user
				if (prefillData.recipient && prefillData.recipientName) {
					const prefillUser: SelectedUser = {
						id: 'prefill_' + Date.now(),
						username: prefillData.recipientName
							.toLowerCase()
							.replace(/\s+/g, '_'),
						full_name: prefillData.recipientName,
						wallet_address: prefillData.recipient,
					};
					setSelectedUsers([prefillUser]);
				} else {
					setSelectedUsers([]);
				}

				// Set category and pot ID from prefill data
				setSelectedCategory(prefillData.category);
				setSelectedPotId(prefillData.potId);
			} else {
				setSelectedUsers([]);
				setAmount('');
				setNote('');
				setSelectedCategory(undefined);
				setSelectedPotId(undefined);
			}

			setSearchQuery('');
			setSearchResults([]);
			setSelectedCurrency('USDC');
			setIsSending(false);
			setShowSuccess(false);
			setTransactionHash('');
			setShowCategoryDropdown(false);
		}
	}, [visible, prefillData]);

	// Debounced search function
	const debouncedSearch = useCallback(
		debounce(async (query: string) => {
			if (query.trim().length < 3) {
				setSearchResults([]);
				setIsSearching(false);
				return;
			}

			setIsSearching(true);
			try {
				const results = await searchUsers(query.trim());
				setSearchResults(results || []);
			} catch (error) {
				console.error('Error searching users:', error);
				setSearchResults([]);
			} finally {
				setIsSearching(false);
			}
		}, 300),
		[searchUsers]
	);

	// Handle search query changes
	useEffect(() => {
		if (searchQuery.trim().length >= 3) {
			debouncedSearch(searchQuery);
		} else {
			setSearchResults([]);
			setIsSearching(false);
		}
	}, [searchQuery, debouncedSearch]);

	const handleSend = async () => {
		if (!walletAddress || selectedUsers.length === 0 || !amount) {
			return;
		}

		setIsSending(true);

		try {
			const walletService = new WalletService();
			const numericAmount = parseFloat(amount);

			if (isNaN(numericAmount) || numericAmount <= 0) {
				Alert.alert('Error', 'Please enter a valid amount');
				return;
			}

			// Check if user has sufficient balance
			const currentBalance = parseFloat(availableBalance);
			if (numericAmount > currentBalance) {
				Alert.alert(
					'Insufficient Balance',
					`You don't have enough ${selectedCurrency} to complete this transaction.`
				);
				return;
			}

			// For now, send to the first selected user (multi-user sending can be implemented later)
			const recipient = selectedUsers[0];
			const recipientAddress = recipient.wallet_address as `0x${string}`;

			let txResult;
			if (selectedCurrency === 'ETH') {
				txResult = await walletService.sendETH(recipientAddress, amount);
			} else {
				const usdcService = walletService.getUSDCService();
				txResult = await usdcService.sendUSDC(recipientAddress, amount);
			}

			if (txResult.status === 'confirmed') {
				setTransactionHash(txResult.hash);
				setShowSuccess(true);

				// Play the success animation
				successAnimation.current?.play();

				// Create transaction record in database
				try {
					const transaction = await TransactionService.createTransaction({
						to_user_id: recipient.id,
						amount: numericAmount,
						currency: selectedCurrency,
						note: note,
						transaction_hash: txResult.hash,
						block_number: txResult.blockNumber,
						blockchain: 'ethereum',
						network: 'base-sepolia',
						transaction_type: 'transfer',
						category: selectedCategory,
						gas_fee: txResult.gasUsed
							? Number(txResult.gasUsed) * 0.000000001
							: undefined, // Convert wei to ETH
						gas_fee_currency: 'ETH',
					});

					console.log('Transaction created:', transaction.id);

					// Link transaction to pot if specified
					if (selectedPotId) {
						try {
							await PotsActivityService.linkTransactionToPot(
								transaction,
								selectedPotId,
								'deposit'
							);
							console.log('Transaction linked to pot:', selectedPotId);
						} catch (error) {
							console.error('Failed to link transaction to pot:', error);
							// Don't fail the entire transaction if pot linking fails
						}
					} else if (selectedCategory) {
						// Auto-link to pots based on category
						try {
							const activities =
								await PotsActivityService.autoLinkTransactionToPots(
									transaction
								);
							if (activities.length > 0) {
								console.log(
									`Transaction auto-linked to ${activities.length} pots`
								);
							}
						} catch (error) {
							console.error('Failed to auto-link transaction to pots:', error);
							// Don't fail the entire transaction if auto-linking fails
						}
					}
				} catch (error) {
					console.error('Failed to create transaction record:', error);
					// Continue with success flow even if database transaction fails
				}

				// Call the parent callback
				onSend(
					numericAmount,
					[recipient.wallet_address],
					note,
					selectedCurrency,
					selectedCategory,
					selectedPotId
				);
			} else {
				Alert.alert(
					'Transaction Failed',
					'The transaction could not be completed. Please try again.'
				);
				console.log('Transaction failed');
			}
		} catch (error) {
			console.error('Send transaction error:', error);
			Alert.alert('Error', 'Failed to send transaction. Please try again.');
		} finally {
			setIsSending(false);
		}
	};

	const handleSelectUser = (user: UserProfile) => {
		const selectedUser: SelectedUser = {
			id: user.id,
			username: user.username || 'unknown',
			full_name: user.full_name || 'Unknown User',
			wallet_address: user.wallet_address || '',
			avatar_url: user.avatar_url || undefined,
		};

		// For now, only allow selecting one user at a time
		setSelectedUsers([selectedUser]);
		setSearchQuery('');
		setSearchResults([]);
		setShowCategoryDropdown(false);
	};

	const handleRemoveUser = (userId: string) => {
		setSelectedUsers(selectedUsers.filter((user) => user.id !== userId));
	};

	const handleClose = () => {
		// Allow closing at any time, including during success state
		onClose();
	};

	const isValidAmount = amount && parseFloat(amount) > 0;
	const hasValidCategory = selectedCategory !== undefined;
	const canSend =
		selectedUsers.length > 0 && isValidAmount && hasValidCategory && !isSending;

	// Show success state
	if (showSuccess) {
		return (
			<Modal
				animationType='fade'
				visible={visible}
				transparent
				onRequestClose={handleClose}
				className='bg-red-500'
			>
				<View
					className='justify-center flex-1 bg-black/50 web:justify-center web:items-center'
					style={{
						paddingTop: insets.top,
						paddingBottom: insets.bottom,
						paddingLeft: insets.left,
						paddingRight: insets.right,
					}}
				>
					<Pressable className='absolute inset-0' onPress={handleClose} />
					<View className='items-center p-8 bg-white rounded-3xl web:max-w-lg web:mx-4'>
						{/* Success Animation */}
						<View className='w-48 h-48 mb-6'>
							<LottieView
								ref={successAnimation}
								source={require('../../assets/lottie/success-confetti.json')}
								autoPlay
								loop={false}
								style={{ width: '100%', height: '100%' }}
							/>
						</View>

						{/* Success Message */}
						<Text className='mb-4 text-3xl font-bold text-center text-green-600'>
							🎉 Payment Sent Successfully!
						</Text>
						<View className='p-4 mb-4 bg-green-50 rounded-xl'>
							<Text className='mb-2 text-lg font-semibold text-center text-gray-800'>
								{amount} {selectedCurrency}
							</Text>
							<Text className='text-base text-center text-gray-600'>
								sent to{' '}
								<Text className='font-semibold text-green-700'>
									{selectedUsers[0]?.full_name || selectedUsers[0]?.username}
								</Text>
							</Text>
							{note && (
								<Text className='mt-2 text-sm italic text-center text-gray-500'>
									"{note}"
								</Text>
							)}
						</View>
						{selectedCategory && (
							<Text className='mb-4 text-sm text-center text-blue-600'>
								📊 Categorized as:{' '}
								<Text className='font-semibold'>
									{selectedCategory.charAt(0).toUpperCase() +
										selectedCategory.slice(1)}
								</Text>
							</Text>
						)}

						{/* Transaction Hash */}
						{transactionHash && (
							<View className='w-full p-3 mb-6 bg-gray-100 rounded-lg'>
								<Text className='mb-1 text-sm text-gray-500'>
									Transaction Hash:
								</Text>
								<TouchableOpacity
									onPress={() => {
										if (Platform.OS === 'web') {
											window.open(
												`https://testnet.seitrace.com/tx/${transactionHash}?`,
												'_blank'
											);
										}
									}}
									className={Platform.OS === 'web' ? 'cursor-pointer' : ''}
								>
									<Text
										className={`font-mono text-xs ${Platform.OS === 'web' ? 'text-blue-600 underline' : 'text-gray-700'}`}
										numberOfLines={1}
									>
										{transactionHash}
									</Text>
								</TouchableOpacity>
								{Platform.OS === 'web' && (
									<Text className='mt-1 text-xs text-gray-500'>
										👆 Click to view on SeiTrace
									</Text>
								)}
							</View>
						)}

						{/* Close Button */}
						<TouchableOpacity
							onPress={onClose}
							className='px-8 py-3 bg-green-600 rounded-xl'
						>
							<Text className='text-lg font-semibold text-white'>Done</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		);
	}

	return (
		<Modal
			animationType='fade'
			visible={visible}
			transparent
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
				<View className='bg-white rounded-t-3xl web:rounded-3xl web:max-w-lg web:max-h-[90%] web:w-full web:mx-4 flex-1 web:flex-none'>
					<KeyboardAvoidingView
						behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
						style={{ flex: 1 }}
					>
						<View className='flex-1'>
							<ScrollView
								className='flex-1 px-6 py-4'
								showsVerticalScrollIndicator={false}
								contentContainerStyle={{ paddingBottom: 20 }}
								keyboardShouldPersistTaps='handled'
							>
								{/* Header */}
								<View className='flex-row items-center justify-between mb-6 web:pt-2'>
									<Text className='text-2xl font-bold text-gray-900'>
										Send Money
									</Text>
									<TouchableOpacity
										onPress={handleClose}
										className='p-2 rounded-full hover:bg-gray-100'
										disabled={isSending}
									>
										<Ionicons name='close' size={24} color='#666' />
									</TouchableOpacity>
								</View>

								{/* Currency Selection */}
								<View className='mb-6'>
									<Text className='mb-3 text-lg font-semibold text-gray-900'>
										Currency
									</Text>
									<View className='flex-row space-x-3'>
										<TouchableOpacity
											onPress={() => setSelectedCurrency('USDC')}
											className={`flex-1 p-4 rounded-xl border-2 ${
												selectedCurrency === 'USDC'
													? 'border-blue-500 bg-blue-50'
													: 'border-gray-200 bg-white'
											}`}
										>
											<View className='flex-row items-center'>
												<View
													className={`w-8 h-8 rounded-full mr-3 ${
														selectedCurrency === 'USDC'
															? 'bg-blue-600'
															: 'bg-gray-400'
													} items-center justify-center`}
												>
													<Text className='text-sm font-bold text-white'>
														$
													</Text>
												</View>
												<View className='flex-1'>
													<Text
														className={`font-semibold ${
															selectedCurrency === 'USDC'
																? 'text-blue-900'
																: 'text-gray-900'
														}`}
													>
														USDC
													</Text>
													<Text
														className={`text-sm ${
															selectedCurrency === 'USDC'
																? 'text-blue-700'
																: 'text-gray-500'
														}`}
													>
														Balance: ${usdcBalance?.formatted || '0.00'}
													</Text>
												</View>
											</View>
										</TouchableOpacity>

										<TouchableOpacity
											onPress={() => setSelectedCurrency('ETH')}
											className={`flex-1 p-4 rounded-xl border-2 ${
												selectedCurrency === 'ETH'
													? 'border-purple-500 bg-purple-50'
													: 'border-gray-200 bg-white'
											}`}
										>
											<View className='flex-row items-center'>
												<View
													className={`w-8 h-8 rounded-full mr-3 ${
														selectedCurrency === 'ETH'
															? 'bg-purple-600'
															: 'bg-gray-400'
													} items-center justify-center`}
												>
													<Text className='text-xs font-bold text-white'>
														Ξ
													</Text>
												</View>
												<View className='flex-1'>
													<Text
														className={`font-semibold ${
															selectedCurrency === 'ETH'
																? 'text-purple-900'
																: 'text-gray-900'
														}`}
													>
														ETH
													</Text>
													<Text
														className={`text-sm ${
															selectedCurrency === 'ETH'
																? 'text-purple-700'
																: 'text-gray-500'
														}`}
													>
														Balance: {ethBalance?.formatted || '0.0000'}
													</Text>
												</View>
											</View>
										</TouchableOpacity>
									</View>
								</View>

								{/* Amount Input */}
								<View className='mb-6'>
									<Text className='mb-3 text-lg font-semibold text-gray-900'>
										Amount
									</Text>
									<View
										className={`flex-row items-center p-4 border-2 rounded-xl ${
											isValidAmount
												? 'border-green-300 bg-green-50'
												: 'border-gray-300 bg-white'
										} focus-within:border-blue-500`}
									>
										<Text
											className={`mr-3 text-xl font-bold ${
												selectedCurrency === 'USDC'
													? 'text-blue-600'
													: 'text-purple-600'
											}`}
										>
											{selectedCurrency === 'USDC' ? '$' : 'Ξ'}
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
											{selectedCurrency}
										</Text>
									</View>
									<Text className='mt-2 text-sm text-gray-500'>
										Available: {availableBalance} {selectedCurrency}
									</Text>
								</View>

								{/* Selected Users */}
								{selectedUsers.length > 0 && (
									<View className='mb-4'>
										<Text className='mb-3 text-lg font-semibold text-gray-900'>
											Sending To
										</Text>
										{selectedUsers.map((user) => (
											<View
												key={user.id}
												className='flex-row items-center p-3 mb-2 border border-green-200 bg-green-50 rounded-xl'
											>
												<View className='items-center justify-center w-10 h-10 mr-3 bg-green-600 rounded-full'>
													<Text className='font-semibold text-white'>
														{user.full_name.charAt(0).toUpperCase()}
													</Text>
												</View>
												<View className='flex-1'>
													<Text className='font-semibold text-gray-900'>
														{user.full_name}
													</Text>
													<Text className='text-sm text-gray-600'>
														@{user.username}
													</Text>
												</View>
												<TouchableOpacity
													onPress={() => handleRemoveUser(user.id)}
													className='p-1 rounded-full hover:bg-gray-100'
												>
													<Ionicons name='close' size={18} color='#666' />
												</TouchableOpacity>
											</View>
										))}
									</View>
								)}

								{/* User Search */}
								{selectedUsers.length === 0 && (
									<View className='mb-4'>
										<Text className='mb-3 text-lg font-semibold text-gray-900'>
											Send To
										</Text>
										<View className='flex-row items-center p-3 mb-3 border border-gray-300 rounded-xl focus-within:border-blue-500'>
											<Ionicons name='search' size={20} color='#9CA3AF' />
											<TextInput
												placeholder='Search by username or name...'
												value={searchQuery}
												onChangeText={setSearchQuery}
												className='flex-1 ml-3 text-base outline-none'
												placeholderTextColor='#9CA3AF'
											/>
											{isSearching && (
												<ActivityIndicator size='small' color='#9CA3AF' />
											)}
										</View>

										{/* Search Results */}
										{searchQuery.trim().length >= 3 &&
											searchResults.length > 0 && (
												<View className='bg-white border border-gray-200 rounded-xl max-h-48'>
													<FlatList
														data={searchResults}
														keyExtractor={(item) => item.id}
														renderItem={({ item }) => (
															<TouchableOpacity
																onPress={() => handleSelectUser(item)}
																className='flex-row items-center p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50'
															>
																<View className='items-center justify-center w-10 h-10 mr-3 bg-blue-600 rounded-full'>
																	<Text className='font-semibold text-white'>
																		{(item.full_name || 'U')
																			.charAt(0)
																			.toUpperCase()}
																	</Text>
																</View>
																<View className='flex-1'>
																	<Text className='font-semibold text-gray-900'>
																		{item.full_name || 'Unknown User'}
																	</Text>
																	<Text className='text-sm text-gray-600'>
																		@{item.username}
																	</Text>
																</View>
															</TouchableOpacity>
														)}
													/>
												</View>
											)}

										{/* Search Helpers */}
										{searchQuery.trim().length > 0 &&
											searchQuery.length < 3 && (
												<Text className='mt-2 text-sm text-gray-500'>
													Type at least 3 characters to search for users
												</Text>
											)}
										{searchQuery.trim().length >= 3 &&
											searchResults.length === 0 &&
											!isSearching && (
												<Text className='mt-2 text-sm text-gray-500'>
													No users found. Try a different search term.
												</Text>
											)}
										{!searchQuery.trim() && (
											<Text className='mt-2 text-sm text-gray-500'>
												Start typing to search for users by username or name
											</Text>
										)}
									</View>
								)}

								{/* Note Input */}
								<View className='mb-6'>
									<Text className='mb-3 text-lg font-semibold text-gray-900'>
										Note (Optional)
									</Text>
									<TextInput
										placeholder="What's this for?"
										value={note}
										onChangeText={setNote}
										multiline
										numberOfLines={2}
										className='p-4 text-base border border-gray-300 outline-none rounded-xl focus:border-blue-500'
										placeholderTextColor='#9CA3AF'
										textAlignVertical='top'
									/>
								</View>

								{/* Category Selection */}
								<View className='mb-6'>
									<Text className='mb-3 text-lg font-semibold text-gray-900'>
										Category
									</Text>
									<Text className='mb-3 text-sm text-gray-600'>
										Select a category to help track your spending
									</Text>
									<TouchableOpacity
										onPress={() =>
											setShowCategoryDropdown(!showCategoryDropdown)
										}
										className={`flex-row items-center justify-between p-4 border rounded-xl bg-white border-gray-300`}
									>
										<View className='flex-row items-center'>
											{selectedCategoryOption ? (
												<>
													<Text className='mr-2 text-lg'>
														{selectedCategoryOption.icon}
													</Text>
													<Text className='text-base font-medium text-gray-900'>
														{selectedCategoryOption.label}
													</Text>
												</>
											) : (
												<Text className='text-base text-gray-500'>
													Select a category...
												</Text>
											)}
										</View>
										<Ionicons
											name={
												showCategoryDropdown ? 'chevron-up' : 'chevron-down'
											}
											size={20}
											color='#6B7280'
										/>
									</TouchableOpacity>

									{/* Dropdown Options */}
									{showCategoryDropdown && (
										<View className='mt-1 bg-white border-2 border-gray-300 rounded-xl'>
											<TouchableOpacity
												onPress={() => {
													setSelectedCategory(undefined);
													setShowCategoryDropdown(false);
												}}
												className='p-4 border-b border-gray-100'
											>
												<Text className='text-base text-gray-500'>
													Clear selection
												</Text>
											</TouchableOpacity>
											{categoryOptions.map((category) => (
												<TouchableOpacity
													key={category.key}
													onPress={() => {
														setSelectedCategory(
															category.key as TransactionCategory
														);
														setShowCategoryDropdown(false);
													}}
													className='flex-row items-center p-4 border-b border-gray-100 last:border-b-0'
												>
													<Text className='mr-3 text-lg'>{category.icon}</Text>
													<Text
														className={`text-base font-medium ${
															selectedCategory === category.key
																? 'text-blue-900'
																: 'text-gray-900'
														}`}
													>
														{category.label}
													</Text>
													{selectedCategory === category.key && (
														<View className='ml-auto'>
															<Ionicons
																name='checkmark'
																size={20}
																color='#3B82F6'
															/>
														</View>
													)}
												</TouchableOpacity>
											))}
										</View>
									)}
									{selectedCategory && (
										<TouchableOpacity
											onPress={() => setSelectedCategory(undefined)}
											className='self-start p-2 mt-2 bg-gray-100 rounded-lg'
										>
											<Text className='text-sm text-gray-600'>
												Clear category
											</Text>
										</TouchableOpacity>
									)}
								</View>

								{/* Pot Selection */}
								{selectedCategory && (
									<View className='mb-6'>
										<Text className='mb-3 text-lg font-semibold text-gray-900'>
											Add to Savings Pot (Optional)
										</Text>
										<Text className='mb-3 text-sm text-gray-600'>
											Automatically add this transaction to a savings pot
										</Text>
										<View className='space-y-2'>
											{getActivePots()
												.filter((pot) => pot.category === selectedCategory)
												.map((pot) => (
													<TouchableOpacity
														key={pot.id}
														onPress={() =>
															setSelectedPotId(
																selectedPotId === pot.id ? undefined : pot.id
															)
														}
														className={`p-4 rounded-xl border-2 ${
															selectedPotId === pot.id
																? 'border-green-500 bg-green-50'
																: 'border-gray-200 bg-white'
														}`}
													>
														<View className='flex-row items-center justify-between'>
															<View className='flex-row items-center flex-1'>
																<Text className='mr-3 text-2xl'>
																	{pot.icon}
																</Text>
																<View className='flex-1'>
																	<Text
																		className={`font-semibold ${
																			selectedPotId === pot.id
																				? 'text-green-900'
																				: 'text-gray-900'
																		}`}
																	>
																		{pot.name}
																	</Text>
																	<Text
																		className={`text-sm ${
																			selectedPotId === pot.id
																				? 'text-green-700'
																				: 'text-gray-500'
																		}`}
																	>
																		Current: ${pot.currentAmount.toFixed(2)} /
																		Target: ${pot.targetAmount.toFixed(2)}
																	</Text>
																</View>
															</View>
															<View
																className={`w-6 h-6 rounded-full border-1 ${
																	selectedPotId === pot.id
																		? 'border-green-500 bg-green-500'
																		: 'border-gray-300'
																} items-center justify-center`}
															>
																{selectedPotId === pot.id && (
																	<Ionicons
																		name='checkmark'
																		size={14}
																		color='white'
																	/>
																)}
															</View>
														</View>
													</TouchableOpacity>
												))}
										</View>
										{selectedPotId && (
											<TouchableOpacity
												onPress={() => setSelectedPotId(undefined)}
												className='self-start p-2 mt-2 bg-gray-100 rounded-lg'
											>
												<Text className='text-sm text-gray-600'>
													Don't add to pot
												</Text>
											</TouchableOpacity>
										)}
									</View>
								)}

								{/* Send Button */}
								<TouchableOpacity
									onPress={handleSend}
									disabled={!canSend}
									className={`p-4 rounded-xl transition-colors ${
										canSend ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300'
									}`}
								>
									{isSending ? (
										<View className='flex-row items-center justify-center'>
											<ActivityIndicator size='small' color='white' />
											<Text className='ml-2 text-lg font-semibold text-white'>
												Sending...
											</Text>
										</View>
									) : (
										<View className='flex-row items-center justify-center'>
											<Ionicons name='send' size={20} color='white' />
											<Text className='ml-2 text-lg font-semibold text-white'>
												Send{' '}
												{amount ? `${amount} ${selectedCurrency}` : 'Money'}
											</Text>
										</View>
									)}
								</TouchableOpacity>
							</ScrollView>
						</View>
					</KeyboardAvoidingView>
				</View>
			</View>
		</Modal>
	);
}
