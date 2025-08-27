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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import LottieView from 'lottie-react-native';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useBalanceStore } from '@/stores/balanceStore';
import { useWalletStore } from '@/stores/walletStore';
import { UserProfile } from '@/types/supabase';
import { WalletService } from '@/services/walletService';
import { USDCService } from '@/services/usdcService';
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
		currency: CurrencyType
	) => void;
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
	const [showSuccess, setShowSuccess] = useState(false);
	const [transactionHash, setTransactionHash] = useState<string>('');

	// Lottie animation ref
	const successAnimation = useRef<LottieView>(null);

	// Get safe area insets to ensure proper spacing
	const insets = useSafeAreaInsets();

	// Get services and stores
	const { searchUsers } = useUserProfileStore();
	const { address: walletAddress } = useWalletStore();
	const { getBalance } = useBalanceStore();

	// Get current balances
	const ethBalance = walletAddress ? getBalance(walletAddress, 'eth') : null;
	const usdcBalance = walletAddress ? getBalance(walletAddress, 'usdc') : null;

	// Get available balance for selected currency
	const availableBalance =
		selectedCurrency === 'ETH'
			? ethBalance?.formatted || '0.0000'
			: usdcBalance?.formatted || '0.00';

	// Reset modal state when opened
	useEffect(() => {
		if (visible) {
			setSelectedUsers([]);
			setAmount('');
			setNote('');
			setSearchQuery('');
			setSearchResults([]);
			setSelectedCurrency('USDC');
			setIsSending(false);
			setShowSuccess(false);
			setTransactionHash('');
		}
	}, [visible]);

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

				// Call the parent callback
				onSend(
					numericAmount,
					[recipient.wallet_address],
					note,
					selectedCurrency
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
	};

	const handleRemoveUser = (userId: string) => {
		setSelectedUsers(selectedUsers.filter((user) => user.id !== userId));
	};

	const handleClose = () => {
		if (!isSending && !showSuccess) {
			onClose();
		}
	};

	const isValidAmount = amount && parseFloat(amount) > 0;
	const canSend = selectedUsers.length > 0 && isValidAmount && !isSending;

	// Show success state
	if (showSuccess) {
		return (
			<Modal
				animationType='fade'
				visible={visible}
				transparent
				onRequestClose={handleClose}
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
						<Text className='mb-2 text-2xl font-bold text-center text-green-600'>
							Payment Sent Successfully!
						</Text>
						<Text className='mb-4 text-lg text-center text-gray-600'>
							{amount} {selectedCurrency} sent to {selectedUsers[0]?.username}
						</Text>

						{/* Transaction Hash */}
						{transactionHash && (
							<View className='w-full p-3 mb-6 bg-gray-100 rounded-lg'>
								<Text className='mb-1 text-sm text-gray-500'>
									Transaction Hash:
								</Text>
								<Text
									className='font-mono text-xs text-gray-700'
									numberOfLines={1}
								>
									{transactionHash}
								</Text>
							</View>
						)}

						{/* Close Button */}
						<TouchableOpacity
							onPress={onClose}
							className='px-8 py-3 bg-green-600 rounded-xl'
						>
							<Text className='text-lg font-semibold text-white'>Done</Text>
						</TouchableOpacity>

						{/* Auto-close indicator */}
						<Text className='mt-4 text-sm text-gray-400'>
							Closing automatically in 3 seconds...
						</Text>
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
					<View className='flex-1'>
						<ScrollView
							className='flex-1 px-6 py-4'
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{ paddingBottom: 20 }}
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
												<Text className='text-sm font-bold text-white'>$</Text>
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
												<Text className='text-xs font-bold text-white'>Ξ</Text>
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
									{searchQuery.trim().length > 0 && searchQuery.length < 3 && (
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
											Send {amount ? `${amount} ${selectedCurrency}` : 'Money'}
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
