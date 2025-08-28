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

// Mock contacts data
const mockContacts = [
	{
		id: '1',
		firstName: 'Sarah',
		lastName: 'Wilson',
		email: 'sarah.wilson@example.com',
	},
	{
		id: '2',
		firstName: 'Mike',
		lastName: 'Chen',
		email: 'mike.chen@example.com',
	},
	{
		id: '3',
		firstName: 'Emma',
		lastName: 'Davis',
		email: 'emma.davis@example.com',
	},
];

interface RequestBottomSheetProps {
	bottomSheetModalRef: React.RefObject<BottomSheetModal>;
	onRequest: (amount: number, requesters: string[], note: string) => void;
}

export default function RequestBottomSheet({
	bottomSheetModalRef,
	onRequest,
}: RequestBottomSheetProps) {
	const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
	const [amount, setAmount] = useState('');
	const [note, setNote] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [isRequesting, setIsRequesting] = useState(false);

	const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

	const filteredContacts = mockContacts.filter(
		(contact) =>
			`${contact.firstName} ${contact.lastName}`
				.toLowerCase()
				.includes(searchQuery.toLowerCase()) ||
			contact.email.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const handleSheetChanges = useCallback((index: number) => {
		console.log('handleSheetChanges', index);
	}, []);

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
				const contact = mockContacts.find((c) => c.id === id);
				return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown';
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

			bottomSheetModalRef.current?.dismiss();
		} catch (error) {
			console.error('Request error:', error);
			Alert.alert('Error', 'Failed to send request. Please try again.');
		} finally {
			setIsRequesting(false);
		}
	};

	return (
		<BottomSheetModal
			ref={bottomSheetModalRef}
			index={1}
			snapPoints={snapPoints}
			onChange={handleSheetChanges}
		>
			<BottomSheetView className='flex-1 px-6 py-4'>
				{/* Header */}
				<View className='flex-row items-center justify-between mb-6'>
					<Text className='text-2xl font-bold text-gray-900'>
						Request Money
					</Text>
					<TouchableOpacity
						onPress={() => bottomSheetModalRef.current?.dismiss()}
						className='p-2'
					>
						<Ionicons name='close' size={24} color='#666' />
					</TouchableOpacity>
				</View>

				{/* Amount Input */}
				<View className='mb-6'>
					<Text className='mb-3 text-lg font-semibold text-gray-900'>
						Amount
					</Text>
					<View className='flex-row items-center p-4 border border-gray-300 rounded-xl'>
						<Text className='mr-3 text-xl font-bold text-green-600'>$</Text>
						<TextInput
							placeholder='0.00'
							value={amount}
							onChangeText={setAmount}
							keyboardType='decimal-pad'
							className='flex-1 text-xl font-semibold'
							placeholderTextColor='#9CA3AF'
						/>
						<Text className='ml-3 text-sm font-medium text-gray-500'>USD</Text>
					</View>
				</View>

				{/* Contact Search */}
				<View className='mb-4'>
					<Text className='mb-3 text-lg font-semibold text-gray-900'>
						Request From ({selectedContacts.length} selected)
					</Text>
					<View className='flex-row items-center p-3 border border-gray-300 rounded-xl'>
						<Ionicons name='search' size={20} color='#9CA3AF' />
						<TextInput
							placeholder='Search contacts...'
							value={searchQuery}
							onChangeText={setSearchQuery}
							className='flex-1 ml-3 text-base'
							placeholderTextColor='#9CA3AF'
						/>
					</View>
				</View>

				{/* Contacts List */}
				<ScrollView
					className='flex-1 mb-4'
					showsVerticalScrollIndicator={false}
				>
					{filteredContacts.map((contact) => (
						<TouchableOpacity
							key={contact.id}
							onPress={() => toggleContact(contact.id)}
							className={`flex-row items-center p-4 mb-2 border rounded-xl ${
								selectedContacts.includes(contact.id)
									? 'border-green-500 bg-green-50'
									: 'border-gray-200 bg-white'
							}`}
						>
							<View className='items-center justify-center w-12 h-12 mr-4 bg-gray-200 rounded-full'>
								<Text className='text-lg font-bold text-gray-600'>
									{contact.firstName[0]}
								</Text>
							</View>
							<View className='flex-1'>
								<Text className='text-base font-semibold text-gray-900'>
									{contact.firstName} {contact.lastName}
								</Text>
								<Text className='text-sm text-gray-500'>{contact.email}</Text>
							</View>
							{selectedContacts.includes(contact.id) && (
								<Ionicons name='checkmark-circle' size={24} color='#10B981' />
							)}
						</TouchableOpacity>
					))}
				</ScrollView>

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
						className='p-4 text-base border border-gray-300 rounded-xl'
						placeholderTextColor='#9CA3AF'
						textAlignVertical='top'
					/>
				</View>

				{/* Request Button */}
				<TouchableOpacity
					onPress={handleRequest}
					disabled={selectedContacts.length === 0 || !amount || isRequesting}
					className={`p-4 rounded-xl ${
						selectedContacts.length > 0 && amount && !isRequesting
							? 'bg-green-600'
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
			</BottomSheetView>
		</BottomSheetModal>
	);
}
