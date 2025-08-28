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

interface SendModalProps {
	visible: boolean;
	onClose: () => void;
	onSendComplete?: () => void;
}

// Mock user type
interface UserProfile {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
	username?: string;
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

	// Mock data
	const mockBalance = '1,234.56';
	const availableTags = [
		'personal',
		'business',
		'food',
		'transport',
		'entertainment',
	];

	// Reset modal state when opened
	useEffect(() => {
		if (visible) {
			setSelectedUser(null);
			setAmount('');
			setNote('');
			setShowUserSearch(false);
		}
	}, [visible]);

	const handleSend = async () => {
		if (!selectedUser) {
			Alert.alert('Error', 'Please select a recipient');
			return;
		}

		if (!amount || parseFloat(amount) <= 0) {
			Alert.alert('Error', 'Please enter a valid amount');
			return;
		}

		setIsSending(true);
		try {
			// Move payment logic to services
			console.log('Sending payment:', {
				recipient: selectedUser,
				amount: parseFloat(amount),
				note,
				tags: selectedTags,
			});

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 2000));

			Alert.alert(
				'Payment Sent!',
				`Successfully sent $${amount} to ${selectedUser.firstName} ${selectedUser.lastName}`,
				[
					{
						text: 'OK',
						onPress: () => {
							onSendComplete?.();
							onClose();
						},
					},
				]
			);
		} catch (error) {
			console.error('Send payment error:', error);
			Alert.alert('Error', 'Failed to send payment. Please try again.');
		} finally {
			setIsSending(false);
		}
	};

	const handleUserSelect = () => {
		// Mock user selection - move to actual user search
		const mockUser: UserProfile = {
			id: '1',
			firstName: 'Sarah',
			lastName: 'Wilson',
			email: 'sarah.wilson@example.com',
			username: 'sarahw',
		};
		setSelectedUser(mockUser);
		setShowUserSearch(false);
	};

	const toggleTag = (tag: string) => {
		setSelectedTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
		);
	};

	return (
		<Modal
			visible={visible}
			animationType='slide'
			presentationStyle='pageSheet'
			onRequestClose={onClose}
		>
			<SafeAreaView className='flex-1 bg-white'>
				<ScrollView className='flex-1 px-6 py-4'>
					{/* Header */}
					<View className='flex-row items-center justify-between mb-6'>
						<Text className='text-2xl font-bold text-gray-900'>Send Money</Text>
						<TouchableOpacity onPress={onClose} className='p-2'>
							<Ionicons name='close' size={24} color='#666' />
						</TouchableOpacity>
					</View>

					{/* Balance Display */}
					<View className='p-4 mb-6 rounded-xl bg-blue-50'>
						<Text className='text-sm text-blue-600'>Available Balance</Text>
						<Text className='text-2xl font-bold text-blue-900'>
							{mockBalance} USDC
						</Text>
					</View>

					{/* Recipient Selection */}
					<View className='mb-6'>
						<Text className='mb-3 text-lg font-semibold text-gray-900'>
							Send To
						</Text>
						{selectedUser ? (
							<View className='flex-row items-center p-4 border border-gray-200 rounded-xl'>
								<View className='items-center justify-center w-12 h-12 mr-4 bg-blue-100 rounded-full'>
									<Text className='text-lg font-bold text-blue-600'>
										{selectedUser.firstName[0]}
									</Text>
								</View>
								<View className='flex-1'>
									<Text className='text-base font-semibold text-gray-900'>
										{selectedUser.firstName} {selectedUser.lastName}
									</Text>
									<Text className='text-sm text-gray-500'>
										{selectedUser.email}
									</Text>
								</View>
								<TouchableOpacity
									onPress={() => setSelectedUser(null)}
									className='p-2'
								>
									<Ionicons name='close-circle' size={20} color='#EF4444' />
								</TouchableOpacity>
							</View>
						) : (
							<TouchableOpacity
								onPress={handleUserSelect}
								className='flex-row items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl'
							>
								<Ionicons name='person-add' size={24} color='#666' />
								<Text className='ml-2 text-base text-gray-600'>
									Select Recipient
								</Text>
							</TouchableOpacity>
						)}
					</View>

					{/* Amount Input */}
					<View className='mb-6'>
						<Text className='mb-3 text-lg font-semibold text-gray-900'>
							Amount
						</Text>
						<View className='flex-row items-center p-4 border border-gray-300 rounded-xl'>
							<Text className='mr-3 text-xl font-bold text-blue-600'>$</Text>
							<TextInput
								placeholder='0.00'
								value={amount}
								onChangeText={setAmount}
								keyboardType='decimal-pad'
								className='flex-1 text-xl font-semibold'
								placeholderTextColor='#9CA3AF'
							/>
							<Text className='ml-3 text-sm font-medium text-gray-500'>
								USDC
							</Text>
						</View>
					</View>

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
							numberOfLines={3}
							className='p-4 text-base border border-gray-300 rounded-xl'
							placeholderTextColor='#9CA3AF'
							textAlignVertical='top'
						/>
					</View>

					{/* Tags */}
					<View className='mb-8'>
						<Text className='mb-3 text-lg font-semibold text-gray-900'>
							Tags
						</Text>
						<View className='flex-row flex-wrap gap-2'>
							{availableTags.map((tag) => (
								<TouchableOpacity
									key={tag}
									onPress={() => toggleTag(tag)}
									className={`px-4 py-2 rounded-full ${
										selectedTags.includes(tag) ? 'bg-blue-600' : 'bg-gray-200'
									}`}
								>
									<Text
										className={`text-sm font-medium capitalize ${
											selectedTags.includes(tag)
												? 'text-white'
												: 'text-gray-700'
										}`}
									>
										{tag}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>

					{/* Send Button */}
					<TouchableOpacity
						onPress={handleSend}
						disabled={!selectedUser || !amount || isSending}
						className={`p-4 rounded-xl ${
							selectedUser && amount && !isSending
								? 'bg-green-600'
								: 'bg-gray-300'
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
									Send {amount ? `$${amount}` : 'Money'}
								</Text>
							</View>
						)}
					</TouchableOpacity>
				</ScrollView>
			</SafeAreaView>
		</Modal>
	);
}
