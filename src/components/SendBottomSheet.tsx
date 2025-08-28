import React, { useCallback, useMemo, useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Alert,
	ActivityIndicator,
} from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PaymentService } from '@/services/paymentService';
import { TransactionService } from '@/services/transactionService';
import { USDCService } from '@/services/usdcService';
import { UserProfile } from '@/services/authService';
import { useBalanceStore } from '@/stores/balanceStore';
import { useUserStore } from '@/stores/userStore';
import UserSearch from '@/components/UserSearch';

// Mock contacts data (converted to UserProfile format)
const contacts: UserProfile[] = [
	{
		id: '1',
		firstName: 'Sarah',
		lastName: 'Wilson',
		email: 'sarah.wilson@example.com',
		phone: '+1 (555) 123-4567',
		username: 'sarahw',
	},
	{
		id: '2',
		firstName: 'Mike',
		lastName: 'Chen',
		email: 'mike.chen@example.com',
		phone: '+1 (555) 234-5678',
		username: 'mikec',
	},
	{
		id: '3',
		firstName: 'Emma',
		lastName: 'Davis',
		email: 'emma.davis@example.com',
		phone: '+1 (555) 345-6789',
		username: 'emmad',
	},
	{
		id: '4',
		firstName: 'John',
		lastName: 'Smith',
		email: 'john.smith@example.com',
		phone: '+1 (555) 456-7890',
		username: 'johns',
	},
	{
		id: '5',
		firstName: 'Lisa',
		lastName: 'Johnson',
		email: 'lisa.johnson@example.com',
		phone: '+1 (555) 567-8901',
		username: 'lisaj',
	},
];

interface SendBottomSheetProps {
	bottomSheetModalRef: React.RefObject<BottomSheetModal | null>;
	onSend: (amount: number, recipients: string[], note: string) => void;
}

export default function SendBottomSheet({
	bottomSheetModalRef,
	onSend,
}: SendBottomSheetProps) {
	const [amount, setAmount] = useState('');
	const [selectedContacts, setSelectedContacts] = useState<UserProfile[]>([]);
	const [note, setNote] = useState('');
	const [selectedTags, setSelectedTags] = useState<string[]>(['personal']);
	const [isLoading, setIsLoading] = useState(false);
	const [showUserSearch, setShowUserSearch] = useState(false);

	// Get balance store and user store
	const { usdcBalance, refreshAllBalances, walletAddress } = useBalanceStore();
	const { user: currentUser } = useUserStore();

	// Variables
	const snapPoints = useMemo(() => ['25%', '90%'], []);

	// Callbacks
	const handleSheetChanges = useCallback((index: number) => {
		console.log('handleSheetChanges', index);
	}, []);

	const handleSend = async () => {
		if (!amount || selectedContacts.length === 0) return;

		const amountFloat = parseFloat(amount);
		const amountPerPerson = amountFloat / selectedContacts.length;

		// Validate balance
		if (amountFloat > parseFloat(usdcBalance)) {
			Alert.alert('Error', 'Insufficient USDC balance');
			return;
		}

		// Get current user's wallet address
		let currentUserAddress = walletAddress || currentUser?.walletAddress;
		if (!currentUserAddress) {
			try {
				const { MagicService } = await import('@/hooks/magic');
				const magicUserInfo = await MagicService.magic.user.getInfo();
				currentUserAddress = magicUserInfo.publicAddress;
			} catch (error) {
				Alert.alert('Error', 'Unable to get wallet address. Please try again.');
				return;
			}
		}

		setIsLoading(true);
		try {
			console.log(
				'🚀 Processing payments to',
				selectedContacts.length,
				'recipients'
			);

			// Process each payment
			for (const contact of selectedContacts) {
				if (!contact.walletAddress) {
					Alert.alert(
						'Error',
						`${
							contact.firstName || contact.email
						} does not have a wallet address set up.`
					);
					return;
				}

				// Execute USDC transfer
				const result = await TransactionService.executeTransfer(
					contact.walletAddress,
					amountPerPerson.toString(),
					currentUserAddress,
					usdcBalance,
					note.trim() ||
						`Payment to ${
							contact.firstName || contact.username || contact.email
						}`,
					selectedTags
				);

				if (!result.success) {
					Alert.alert(
						'Transfer Failed',
						`Failed to send payment to ${contact.firstName || contact.email}: ${
							result.error
						}`
					);
					return;
				}

				console.log(
					`✅ Payment to ${contact.firstName || contact.email}:`,
					result.txHash
				);
			}

			const recipientNames = selectedContacts.map((contact) =>
				contact.firstName && contact.lastName
					? `${contact.firstName} ${contact.lastName}`
					: contact.username || contact.email
			);

			// Update balances
			await refreshAllBalances();

			// Call parent callback
			onSend(amountFloat, recipientNames, note);

			Alert.alert(
				'Success',
				`Successfully sent ${amountFloat} USDC to ${selectedContacts.length} recipient(s)!`
			);

			// Reset form
			setAmount('');
			setSelectedContacts([]);
			setNote('');
			bottomSheetModalRef.current?.dismiss();
		} catch (error) {
			console.error('Error sending payments:', error);
			Alert.alert('Error', 'Failed to send payments. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const addContact = (user: UserProfile) => {
		const userId = user.id || user._id;
		if (!selectedContacts.find((c) => (c.id || c._id) === userId)) {
			setSelectedContacts([...selectedContacts, user]);
		}
		setShowUserSearch(false);
	};

	const removeContact = (contactId: string) => {
		setSelectedContacts(
			selectedContacts.filter((c) => (c.id || c._id) !== contactId)
		);
	};

	const totalPerPerson =
		selectedContacts.length > 0
			? parseFloat(amount || '0') / selectedContacts.length
			: 0;

	return (
		<BottomSheetModal
			ref={bottomSheetModalRef}
			index={1}
			snapPoints={snapPoints}
			onChange={handleSheetChanges}
			backgroundStyle={{ backgroundColor: 'white' }}
			handleIndicatorStyle={{ backgroundColor: '#E0E0E0' }}
		>
			<BottomSheetView className='flex-1 px-6' style={{ paddingBottom: 32 }}>
				{/* Header */}
				<View className='flex-row items-center justify-between mb-8'>
					<Text className='text-2xl font-bold text-text-main'>Send Money</Text>
					<TouchableOpacity
						onPress={() => bottomSheetModalRef.current?.dismiss()}
						className='p-2'
					>
						<Ionicons name='close' size={24} color='#666' />
					</TouchableOpacity>
				</View>

				{/* Amount Input */}
				<View className='mb-8'>
					<Text className='mb-3 text-base font-semibold text-gray-700'>
						Amount
					</Text>
					<View className='flex-row items-center px-4 py-4 bg-white border border-gray-300 rounded-2xl'>
						<Text className='mr-3 text-3xl font-bold text-text-main'>$</Text>
						<TextInput
							value={amount}
							onChangeText={setAmount}
							placeholder='0.00'
							keyboardType='decimal-pad'
							className='flex-1 text-3xl font-bold text-text-main'
							placeholderTextColor='#999'
							style={{ fontSize: 24, paddingBottom: 6 }}
						/>
					</View>
				</View>

				{/* Contact Selection */}
				<View className='mb-8'>
					<Text className='mb-3 text-base font-semibold text-gray-700'>To</Text>

					{/* Selected Contacts */}
					<View className='border border-gray-300 rounded-2xl p-4 bg-white min-h-[70px]'>
						{/* Selected Contacts Pills */}
						{selectedContacts.length > 0 && (
							<View className='mb-4'>
								<View className='flex-row flex-wrap gap-2'>
									{selectedContacts.map((contact) => {
										const contactId = contact.id || contact._id;
										const contactName =
											contact.firstName && contact.lastName
												? `${contact.firstName} ${contact.lastName}`
												: contact.username || contact.email;
										return (
											<View
												key={contactId}
												className='flex-row items-center px-3 py-2 rounded-full bg-primary-blue'
											>
												<View className='items-center justify-center w-5 h-5 mr-2 bg-white rounded-full'>
													<Text className='text-blue-600 font-semibold text-xs'>
														{contactName.charAt(0).toUpperCase()}
													</Text>
												</View>
												<Text className='mr-2 text-sm font-medium text-white'>
													{contactName}
												</Text>
												<TouchableOpacity
													onPress={() => removeContact(contactId)}
												>
													<Ionicons
														name='close-circle'
														size={16}
														color='white'
													/>
												</TouchableOpacity>
											</View>
										);
									})}
								</View>
							</View>
						)}

						{/* Add Contact Button */}
						<TouchableOpacity
							className='flex-row items-center'
							onPress={() => setShowUserSearch(true)}
						>
							<Ionicons name='search' size={18} color='#666' />
							<Text className='flex-1 ml-2 text-base text-gray-500'>
								{selectedContacts.length === 0
									? 'Search by name or username...'
									: 'Add more contacts...'}
							</Text>
							<Ionicons name='add-circle' size={20} color='#3D5AFE' />
						</TouchableOpacity>
					</View>

					{/* Per Person Amount */}
					{selectedContacts.length > 1 && amount && (
						<Text className='mt-3 ml-1 text-sm text-gray-500'>
							${totalPerPerson.toFixed(2)} per person
						</Text>
					)}

					{/* Quick Add Suggestions */}
					{selectedContacts.length === 0 && (
						<View className='mt-4'>
							<Text className='mb-4 ml-1 text-sm text-gray-600'>
								Quick add:
							</Text>
							<ScrollView horizontal showsHorizontalScrollIndicator={false}>
								<View className='flex-row space-x-4'>
									{contacts.slice(0, 4).map((contact) => (
										<TouchableOpacity
											key={contact.id}
											className='items-center'
											onPress={() => addContact(contact)}
										>
											<View
												className='items-center justify-center bg-blue-100 rounded-full'
												style={{
													width: 48,
													height: 48,
													marginBottom: 8,
												}}
											>
												<Text className='text-blue-600 font-semibold text-lg'>
													{(contact.firstName || contact.username || '?')
														.charAt(0)
														.toUpperCase()}
												</Text>
											</View>
											<Text
												className='text-xs text-center text-gray-600'
												numberOfLines={1}
											>
												{contact.firstName || contact.username || 'User'}
											</Text>
										</TouchableOpacity>
									))}
								</View>
							</ScrollView>
						</View>
					)}
				</View>

				{/* Note Input */}
				<View className='mb-6'>
					<Text className='mb-3 text-base font-semibold text-gray-700'>
						Note (Optional)
					</Text>
					<TextInput
						value={note}
						onChangeText={setNote}
						placeholder="What's this for?"
						className='px-4 py-4 text-base bg-white border border-gray-300 rounded-2xl text-text-main'
						placeholderTextColor='#999'
						multiline
						style={{ fontSize: 16, minHeight: 60 }}
					/>
				</View>

				{/* Tag Selection */}
				<View className='mb-8'>
					<Text className='mb-3 text-base font-semibold text-gray-700'>
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
										setSelectedTags(selectedTags.filter((t) => t !== tag));
									} else {
										setSelectedTags([...selectedTags, tag]);
									}
								}}
								className={`mr-3 px-4 py-2 rounded-full border ${
									selectedTags.includes(tag)
										? 'bg-blue-500 border-blue-500'
										: 'bg-white border-gray-300'
								}`}
							>
								<Text
									className={`text-sm font-medium ${
										selectedTags.includes(tag) ? 'text-white' : 'text-gray-700'
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
					className={`py-5 rounded-2xl items-center ${
						amount && selectedContacts.length > 0 && !isLoading
							? 'bg-primary-blue'
							: 'bg-gray-300'
					}`}
					style={{ paddingHorizontal: 16 }}
					onPress={handleSend}
					disabled={!amount || selectedContacts.length === 0 || isLoading}
				>
					{isLoading ? (
						<View className='flex-row items-center'>
							<ActivityIndicator size='small' color='white' />
							<Text className='ml-2 text-lg font-semibold text-white'>
								Sending...
							</Text>
						</View>
					) : (
						<Text
							className={`text-lg font-semibold ${
								amount && selectedContacts.length > 0
									? 'text-white'
									: 'text-gray-500'
							}`}
						>
							Send ${amount || '0.00'}
							{selectedContacts.length > 1 &&
								` to ${selectedContacts.length} people`}
						</Text>
					)}
				</TouchableOpacity>

				{/* User Search Modal */}
				<UserSearch
					visible={showUserSearch}
					onClose={() => setShowUserSearch(false)}
					onUserSelect={addContact}
					title='Add Contact'
					placeholder='Search by name or username...'
					multiSelect={true}
					selectedUsers={selectedContacts}
					excludeCurrentUser={true}
					minSearchLength={3}
				/>
			</BottomSheetView>
		</BottomSheetModal>
	);
}
