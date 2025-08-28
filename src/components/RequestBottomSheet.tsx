import React, { useCallback, useMemo, useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
} from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';

// Mock contacts data
const contacts = [
	{
		id: '1',
		name: 'Sarah Wilson',
		avatar: 'https://i.pravatar.cc/150?img=1',
		phone: '+1 (555) 123-4567',
	},
	{
		id: '2',
		name: 'Mike Chen',
		avatar: 'https://i.pravatar.cc/150?img=2',
		phone: '+1 (555) 234-5678',
	},
	{
		id: '3',
		name: 'Emma Davis',
		avatar: 'https://i.pravatar.cc/150?img=3',
		phone: '+1 (555) 345-6789',
	},
	{
		id: '4',
		name: 'John Smith',
		avatar: 'https://i.pravatar.cc/150?img=4',
		phone: '+1 (555) 456-7890',
	},
	{
		id: '5',
		name: 'Lisa Johnson',
		avatar: 'https://i.pravatar.cc/150?img=9',
		phone: '+1 (555) 567-8901',
	},
];

interface RequestBottomSheetProps {
	bottomSheetModalRef: React.RefObject<BottomSheetModal | null>;
	onRequest: (amount: number, requesters: string[], note: string) => void;
}

export default function RequestBottomSheet({
	bottomSheetModalRef,
	onRequest,
}: RequestBottomSheetProps) {
	const [amount, setAmount] = useState('');
	const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
	const [note, setNote] = useState('');
	const [searchQuery, setSearchQuery] = useState('');

	// Variables
	const snapPoints = useMemo(() => ['25%', '90%'], []);

	// Callbacks
	const handleSheetChanges = useCallback((index: number) => {
		console.log('handleSheetChanges', index);
	}, []);

	const handleRequest = () => {
		if (!amount || selectedContacts.length === 0) return;

		const requesterNames = selectedContacts.map((contact) => contact.name);
		onRequest(parseFloat(amount), requesterNames, note);
		setAmount('');
		setSelectedContacts([]);
		setNote('');
		bottomSheetModalRef.current?.dismiss();
	};

	const addContact = (contact: any) => {
		if (!selectedContacts.find((c) => c.id === contact.id)) {
			setSelectedContacts([...selectedContacts, contact]);
		}
		setSearchQuery('');
	};

	const removeContact = (contactId: string) => {
		setSelectedContacts(selectedContacts.filter((c) => c.id !== contactId));
	};

	const filteredContacts = contacts.filter(
		(contact) =>
			contact.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
			!selectedContacts.find((c) => c.id === contact.id)
	);

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
					<Text className='text-2xl font-bold text-text-main'>
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
							style={{ fontSize: 28 }}
						/>
					</View>
				</View>

				{/* Contact Selection */}
				<View className='mb-8'>
					<Text className='mb-3 text-base font-semibold text-gray-700'>
						From
					</Text>

					{/* Search with Pills Inside */}
					<View className='border border-gray-300 rounded-2xl p-4 bg-white min-h-[70px]'>
						{/* Selected Contacts Pills */}
						{selectedContacts.length > 0 && (
							<View className='mb-4'>
								<View className='flex-row flex-wrap gap-2'>
									{selectedContacts.map((contact) => (
										<View
											key={contact.id}
											className='flex-row items-center px-3 py-2 rounded-full bg-primary-green'
										>
											<Image
												source={{ uri: contact.avatar }}
												style={{
													width: 20,
													height: 20,
													borderRadius: 10,
													marginRight: 6,
												}}
												contentFit='cover'
												placeholder='👤'
												transition={200}
											/>
											<Text className='mr-2 text-sm font-medium text-white'>
												{contact.name}
											</Text>
											<TouchableOpacity
												onPress={() => removeContact(contact.id)}
											>
												<Ionicons name='close-circle' size={16} color='white' />
											</TouchableOpacity>
										</View>
									))}
								</View>
							</View>
						)}

						{/* Search Input */}
						<View className='flex-row items-center'>
							<Ionicons name='search' size={18} color='#666' />
							<TextInput
								value={searchQuery}
								onChangeText={setSearchQuery}
								placeholder={
									selectedContacts.length === 0
										? 'Search contacts...'
										: 'Add more contacts...'
								}
								className='flex-1 ml-2 text-base text-text-main'
								placeholderTextColor='#999'
								style={{
									fontSize: 16,
									paddingVertical: 4,
									textAlignVertical: 'center',
								}}
							/>
						</View>
					</View>

					{/* Per Person Amount */}
					{selectedContacts.length > 1 && amount && (
						<Text className='mt-3 ml-1 text-sm text-gray-500'>
							${totalPerPerson.toFixed(2)} per person
						</Text>
					)}

					{/* Contact List */}
					{searchQuery && (
						<ScrollView
							className='mt-4 max-h-48'
							showsVerticalScrollIndicator={false}
						>
							{filteredContacts.map((contact) => (
								<TouchableOpacity
									key={contact.id}
									className='flex-row items-center p-4 border-b border-gray-100 last:border-b-0'
									onPress={() => addContact(contact)}
								>
									<Image
										source={{ uri: contact.avatar }}
										style={{
											width: 44,
											height: 44,
											borderRadius: 22,
											marginRight: 16,
										}}
										contentFit='cover'
										placeholder='👤'
										transition={200}
									/>
									<View className='flex-1'>
										<Text className='text-base font-medium text-text-main'>
											{contact.name}
										</Text>
										<Text className='mt-1 text-sm text-gray-500'>
											{contact.phone}
										</Text>
									</View>
									<Ionicons name='add-circle' size={24} color='#00C896' />
								</TouchableOpacity>
							))}
						</ScrollView>
					)}

					{/* Quick Add Suggestions */}
					{!searchQuery && selectedContacts.length === 0 && (
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
											<Image
												source={{ uri: contact.avatar }}
												style={{
													width: 56,
													height: 56,
													borderRadius: 28,
													marginBottom: 8,
												}}
												contentFit='cover'
												placeholder='👤'
												transition={200}
											/>
											<Text
												className='text-xs text-center text-gray-600'
												numberOfLines={1}
											>
												{contact.name.split(' ')[0]}
											</Text>
										</TouchableOpacity>
									))}
								</View>
							</ScrollView>
						</View>
					)}
				</View>

				{/* Note Input */}
				<View className='mb-8'>
					<Text className='mb-3 text-base font-semibold text-gray-700'>
						Message (Optional)
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

				{/* Request Button */}
				<TouchableOpacity
					className={`py-5 rounded-2xl items-center ${
						amount && selectedContacts.length > 0
							? 'bg-primary-green'
							: 'bg-gray-300'
					}`}
					style={{ paddingHorizontal: 16 }}
					onPress={handleRequest}
					disabled={!amount || selectedContacts.length === 0}
				>
					<Text
						className={`text-lg font-semibold ${
							amount && selectedContacts.length > 0
								? 'text-white'
								: 'text-gray-500'
						}`}
					>
						Request ${amount || '0.00'}
						{selectedContacts.length > 1 &&
							` from ${selectedContacts.length} people`}
					</Text>
				</TouchableOpacity>
			</BottomSheetView>
		</BottomSheetModal>
	);
}
