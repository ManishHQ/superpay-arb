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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { USDCService } from '@/services/usdcService';
import { TransactionService } from '@/services/transactionService';
import { useBalanceStore } from '@/stores/balanceStore';
import { useUserStore } from '@/stores/userStore';
import UserSearch from '@/components/UserSearch';
import { UserProfile } from '@/services/authService';

interface SendModalProps {
	visible: boolean;
	onClose: () => void;
	onSendComplete?: () => void;
}

export default function SendModal({
	visible,
	onClose,
	onSendComplete,
}: SendModalProps) {
	const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
	const [amount, setAmount] = useState('');
	const [note, setNote] = useState('');
	const [selectedTags, setSelectedTags] = useState<string[]>(['personal']);
	const [isSending, setIsSending] = useState(false);
	const [showUserSearch, setShowUserSearch] = useState(false);

	const { usdcBalance, refreshAllBalances } = useBalanceStore();
	const { user: currentUser } = useUserStore();

	// Reset modal state when opened
	useEffect(() => {
		if (visible) {
			setSelectedUser(null);
			setAmount('');
			setNote('');
			setShowUserSearch(false);
		}
	}, [visible]);

	// Handle send USDC
	const handleSend = async () => {
		if (!selectedUser) {
			Alert.alert('Error', 'Please select a recipient');
			return;
		}

		if (!amount || parseFloat(amount) <= 0) {
			Alert.alert('Error', 'Please enter a valid amount');
			return;
		}

		const sendAmount = parseFloat(amount);
		const currentBalance = parseFloat(usdcBalance);

		if (sendAmount > currentBalance) {
			Alert.alert('Error', 'Insufficient USDC balance');
			return;
		}

		Alert.alert(
			'Confirm Send',
			`Send ${sendAmount} USDC to ${
				selectedUser.firstName || selectedUser.email
			}?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Send',
					onPress: async () => {
						setIsSending(true);
						try {
							// Check if recipient has a wallet address
							if (!selectedUser.walletAddress) {
								Alert.alert(
									'Error',
									'Recipient does not have a wallet address. Please ask them to complete their wallet setup.'
								);
								return;
							}

							// Execute USDC transfer using TransactionService (handles authentication)
							console.log(
								`Transferring ${sendAmount} USDC to ${selectedUser.walletAddress}`
							);

							// Get current user's wallet address for the transaction
							let currentUserAddress = currentUser?.walletAddress;

							// If wallet address is not in user data, try to get it from Magic
							if (!currentUserAddress) {
								try {
									console.log(
										'🔍 [SendModal] Wallet address not in user data, getting from Magic...'
									);
									const { MagicService } = await import('@/hooks/magic');
									const magicUserInfo = await MagicService.magic.user.getInfo();
									currentUserAddress = magicUserInfo.publicAddress;
									console.log(
										'✅ [SendModal] Got wallet address from Magic:',
										currentUserAddress
									);
								} catch (magicError) {
									console.error(
										'❌ [SendModal] Failed to get wallet from Magic:',
										magicError
									);
								}
							}

							if (!currentUserAddress) {
								Alert.alert(
									'Error',
									'Your wallet address is not available. Please try logging out and back in.'
								);
								return;
							}

							// Get current USDC balance
							const currentBalance = await USDCService.getBalance(
								currentUserAddress
							);

							// Use TransactionService which handles DID token authentication
							const result = await TransactionService.executeTransfer(
								selectedUser.walletAddress,
								sendAmount.toString(),
								currentUserAddress,
								currentBalance,
								note ||
									`Payment to ${selectedUser.firstName} ${selectedUser.lastName}`,
								selectedTags
							);

							if (!result.success) {
								Alert.alert(
									'Transfer Failed',
									result.error || 'Unknown error occurred'
								);
								return;
							}

							console.log('USDC transfer transaction:', result.txHash);
							console.log('USDC transfer confirmed');

							// Backend payment record is already created by TransactionService
							console.log('Backend payment record created:', result.paymentId);

							Alert.alert(
								'Success',
								`Payment of ${sendAmount} USDC sent successfully!\n\nTransaction: ${result.txHash}`
							);

							// Refresh balances
							await refreshAllBalances();

							// Callback and close
							onSendComplete?.();
							onClose();
						} catch (error) {
							console.error('Error sending payment:', error);
							let errorMessage = 'Failed to send payment. Please try again.';

							// Provide more specific error messages
							if (error.message.includes('insufficient funds')) {
								errorMessage = 'Insufficient USDC balance or ETH for gas fees.';
							} else if (
								error.message.includes('rejected') ||
								error.message.includes('denied')
							) {
								errorMessage = 'Transaction was cancelled by user.';
							} else if (error.message.includes('gas')) {
								errorMessage =
									'Transaction failed due to gas estimation error.';
							}

							Alert.alert('Error', errorMessage);
						} finally {
							setIsSending(false);
						}
					},
				},
			]
		);
	};

	// Handle user selection from search
	const handleUserSelect = (user: UserProfile) => {
		setSelectedUser(user);
		setShowUserSearch(false);
	};

	return (
		<Modal
			visible={visible}
			animationType='slide'
			presentationStyle='pageSheet'
			onRequestClose={onClose}
		>
			<SafeAreaView className='flex-1 bg-white'>
				{/* Header */}
				<View className='flex-row items-center justify-between p-4 border-b border-gray-200'>
					<TouchableOpacity onPress={onClose}>
						<Ionicons name='close' size={24} color='#666' />
					</TouchableOpacity>
					<Text className='text-lg font-semibold text-gray-900'>Send USDC</Text>
					<View style={{ width: 24 }} />
				</View>

				<ScrollView className='flex-1 p-4'>
					{/* Balance Info */}
					<View className='p-4 mb-4 rounded-lg bg-gray-50'>
						<Text className='text-sm text-gray-600'>Available Balance</Text>
						<Text className='text-xl font-semibold text-gray-900'>
							{parseFloat(usdcBalance).toFixed(2)} USDC
						</Text>
					</View>

					{/* Select Recipient */}
					<View className='mb-4'>
						<Text className='mb-2 text-sm font-medium text-gray-700'>
							Recipient
						</Text>
						{selectedUser ? (
							<View className='p-3 border border-blue-500 rounded-lg bg-blue-50'>
								<View className='flex-row items-center justify-between'>
									<View className='flex-row items-center flex-1'>
										<View className='items-center justify-center w-10 h-10 mr-3 bg-blue-100 rounded-full'>
											<Text className='font-semibold text-blue-600'>
												{(
													selectedUser.firstName ||
													selectedUser.username ||
													selectedUser.email ||
													'?'
												)
													.charAt(0)
													.toUpperCase()}
											</Text>
										</View>
										<View className='flex-1'>
											<Text className='font-medium text-gray-900'>
												{selectedUser.firstName && selectedUser.lastName
													? `${selectedUser.firstName} ${selectedUser.lastName}`
													: selectedUser.username || selectedUser.email}
											</Text>
											{selectedUser.username && (
												<Text className='text-sm text-blue-600'>
													@{selectedUser.username}
												</Text>
											)}
										</View>
									</View>
									<TouchableOpacity
										onPress={() => setSelectedUser(null)}
										className='p-1'
									>
										<Ionicons name='close-circle' size={20} color='#666' />
									</TouchableOpacity>
								</View>
							</View>
						) : (
							<TouchableOpacity
								className='flex-row items-center px-3 py-3 border border-gray-300 rounded-lg bg-gray-50'
								onPress={() => setShowUserSearch(true)}
							>
								<Ionicons name='search' size={20} color='#9CA3AF' />
								<Text className='ml-2 text-base text-gray-500'>
									Search for recipient...
								</Text>
							</TouchableOpacity>
						)}
					</View>

					{/* Amount Input */}
					{selectedUser && (
						<>
							<View className='mb-4'>
								<Text className='mb-2 text-sm font-medium text-gray-700'>
									Amount
								</Text>
								<View className='flex-row items-center px-3 py-2 bg-white border border-gray-300 rounded-lg'>
									<TextInput
										placeholder='0.00'
										value={amount}
										onChangeText={setAmount}
										keyboardType='decimal-pad'
										className='flex-1 text-base text-gray-900'
										placeholderTextColor='#9CA3AF'
									/>
									<Text className='ml-2 text-sm font-medium text-gray-600'>
										USDC
									</Text>
								</View>
							</View>

							{/* Note Input */}
							<View className='mb-4'>
								<Text className='mb-2 text-sm font-medium text-gray-700'>
									Note (Optional)
								</Text>
								<TextInput
									placeholder='Add a note...'
									value={note}
									onChangeText={setNote}
									multiline
									numberOfLines={3}
									className='px-3 py-2 text-base text-gray-900 bg-white border border-gray-300 rounded-lg'
									placeholderTextColor='#9CA3AF'
									textAlignVertical='top'
								/>
							</View>

							{/* Tag Selection */}
							<View className='mb-6'>
								<Text className='mb-2 text-sm font-medium text-gray-700'>
									Tags
								</Text>
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									className='flex-row'
								>
									{[
										'personal',
										'food',
										'entertainment',
										'transportation',
										'shopping',
										'rent',
										'savings',
									].map((tag) => (
										<TouchableOpacity
											key={tag}
											onPress={() => {
												if (selectedTags.includes(tag)) {
													setSelectedTags(
														selectedTags.filter((t) => t !== tag)
													);
												} else {
													setSelectedTags([...selectedTags, tag]);
												}
											}}
											className={`mr-2 px-3 py-2 rounded-full border ${
												selectedTags.includes(tag)
													? 'bg-blue-500 border-blue-500'
													: 'bg-white border-gray-300'
											}`}
										>
											<Text
												className={`text-sm font-medium ${
													selectedTags.includes(tag)
														? 'text-white'
														: 'text-gray-700'
												}`}
											>
												{tag.charAt(0).toUpperCase() + tag.slice(1)}
											</Text>
										</TouchableOpacity>
									))}
								</ScrollView>
							</View>

							{/* Send Button */}
							<TouchableOpacity
								className={`p-4 rounded-lg ${
									isSending ? 'bg-gray-400' : 'bg-green-600'
								}`}
								onPress={handleSend}
								disabled={isSending}
							>
								<View className='flex-row items-center justify-center'>
									{isSending ? (
										<>
											<ActivityIndicator size='small' color='white' />
											<Text className='ml-2 font-semibold text-white'>
												Sending...
											</Text>
										</>
									) : (
										<>
											<Ionicons name='send' size={20} color='white' />
											<Text className='ml-2 font-semibold text-white'>
												Send {amount} USDC
											</Text>
										</>
									)}
								</View>
							</TouchableOpacity>
						</>
					)}
				</ScrollView>

				{/* User Search Modal */}
				<UserSearch
					visible={showUserSearch}
					onClose={() => setShowUserSearch(false)}
					onUserSelect={handleUserSelect}
					title='Select Recipient'
					placeholder='Search by name or username...'
					excludeCurrentUser={true}
					minSearchLength={3}
				/>
			</SafeAreaView>
		</Modal>
	);
}
