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

interface SplitBottomSheetProps {
	bottomSheetModalRef: React.RefObject<BottomSheetModal>;
	onSplit: (
		amount: number,
		groupName: string,
		note: string,
		splitMethod: string
	) => void;
}

const mockGroups = [
	{ id: '1', name: 'Dinner Squad', members: 4 },
	{ id: '2', name: 'Movie Night', members: 3 },
	{ id: '3', name: 'Weekend Trip', members: 6 },
];

const splitMethods = [
	{
		id: 'equal',
		name: 'Split Equally',
		description: 'Divide amount equally among all members',
	},
	{
		id: 'custom',
		name: 'Custom Split',
		description: 'Set custom amounts for each person',
	},
	{
		id: 'percentage',
		name: 'By Percentage',
		description: 'Split based on percentages',
	},
];

export default function SplitBottomSheet({
	bottomSheetModalRef,
	onSplit,
}: SplitBottomSheetProps) {
	const [selectedGroup, setSelectedGroup] = useState<string>('');
	const [amount, setAmount] = useState('');
	const [note, setNote] = useState('');
	const [splitMethod, setSplitMethod] = useState('equal');
	const [isSplitting, setIsSplitting] = useState(false);

	const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

	const handleSheetChanges = useCallback((index: number) => {
		console.log('handleSheetChanges', index);
	}, []);

	const handleSplit = async () => {
		if (!selectedGroup) {
			Alert.alert('Error', 'Please select a group');
			return;
		}

		if (!amount || parseFloat(amount) <= 0) {
			Alert.alert('Error', 'Please enter a valid amount');
			return;
		}

		setIsSplitting(true);
		try {
			const group = mockGroups.find((g) => g.id === selectedGroup);
			const groupName = group?.name || 'Unknown Group';
			const selectedMethod =
				splitMethods.find((m) => m.id === splitMethod)?.name || 'Equal Split';

			console.log('Splitting expense:', {
				amount: parseFloat(amount),
				groupName,
				note,
				splitMethod: selectedMethod,
			});

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			onSplit(parseFloat(amount), groupName, note, selectedMethod);

			// Reset form
			setSelectedGroup('');
			setAmount('');
			setNote('');
			setSplitMethod('equal');

			bottomSheetModalRef.current?.dismiss();
		} catch (error) {
			console.error('Split error:', error);
			Alert.alert('Error', 'Failed to split expense. Please try again.');
		} finally {
			setIsSplitting(false);
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
						Split Expense
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
						Total Amount
					</Text>
					<View className='flex-row items-center p-4 border border-gray-300 rounded-xl'>
						<Text className='mr-3 text-xl font-bold text-purple-600'>$</Text>
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

				{/* Group Selection */}
				<View className='mb-6'>
					<Text className='mb-3 text-lg font-semibold text-gray-900'>
						Select Group
					</Text>
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						<View className='flex-row gap-3'>
							{mockGroups.map((group) => (
								<TouchableOpacity
									key={group.id}
									onPress={() => setSelectedGroup(group.id)}
									className={`p-4 rounded-xl border-2 min-w-[120px] ${
										selectedGroup === group.id
											? 'border-purple-500 bg-purple-50'
											: 'border-gray-200 bg-white'
									}`}
								>
									<Text
										className={`font-semibold text-center ${
											selectedGroup === group.id
												? 'text-purple-900'
												: 'text-gray-900'
										}`}
									>
										{group.name}
									</Text>
									<Text
										className={`text-sm text-center mt-1 ${
											selectedGroup === group.id
												? 'text-purple-600'
												: 'text-gray-500'
										}`}
									>
										{group.members} members
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</ScrollView>
				</View>

				{/* Split Method */}
				<View className='mb-6'>
					<Text className='mb-3 text-lg font-semibold text-gray-900'>
						Split Method
					</Text>
					{splitMethods.map((method) => (
						<TouchableOpacity
							key={method.id}
							onPress={() => setSplitMethod(method.id)}
							className={`flex-row items-center p-4 mb-2 border rounded-xl ${
								splitMethod === method.id
									? 'border-purple-500 bg-purple-50'
									: 'border-gray-200 bg-white'
							}`}
						>
							<View className='flex-1'>
								<Text
									className={`font-semibold ${
										splitMethod === method.id
											? 'text-purple-900'
											: 'text-gray-900'
									}`}
								>
									{method.name}
								</Text>
								<Text
									className={`text-sm ${
										splitMethod === method.id
											? 'text-purple-600'
											: 'text-gray-500'
									}`}
								>
									{method.description}
								</Text>
							</View>
							{splitMethod === method.id && (
								<Ionicons name='checkmark-circle' size={24} color='#8B5CF6' />
							)}
						</TouchableOpacity>
					))}
				</View>

				{/* Note Input */}
				<View className='mb-6'>
					<Text className='mb-3 text-lg font-semibold text-gray-900'>
						Note (Optional)
					</Text>
					<TextInput
						placeholder='What was this expense for?'
						value={note}
						onChangeText={setNote}
						multiline
						numberOfLines={2}
						className='p-4 text-base border border-gray-300 rounded-xl'
						placeholderTextColor='#9CA3AF'
						textAlignVertical='top'
					/>
				</View>

				{/* Preview */}
				{selectedGroup && amount && (
					<View className='p-4 mb-6 rounded-xl bg-purple-50'>
						<Text className='text-sm text-purple-600'>Preview:</Text>
						<Text className='font-medium text-purple-900'>
							${amount} split{' '}
							{splitMethods
								.find((m) => m.id === splitMethod)
								?.name.toLowerCase()}{' '}
							among {
								mockGroups.find((g) => g.id === selectedGroup)?.members
							}{' '}
							members
						</Text>
						{splitMethod === 'equal' && (
							<Text className='text-sm text-purple-600'>
								Each person pays: $
								{(
									parseFloat(amount) /
									(mockGroups.find((g) => g.id === selectedGroup)?.members || 1)
								).toFixed(2)}
							</Text>
						)}
					</View>
				)}

				{/* Split Button */}
				<TouchableOpacity
					onPress={handleSplit}
					disabled={!selectedGroup || !amount || isSplitting}
					className={`p-4 rounded-xl ${
						selectedGroup && amount && !isSplitting
							? 'bg-purple-600'
							: 'bg-gray-300'
					}`}
				>
					{isSplitting ? (
						<View className='flex-row items-center justify-center'>
							<ActivityIndicator size='small' color='white' />
							<Text className='ml-2 text-lg font-semibold text-white'>
								Splitting...
							</Text>
						</View>
					) : (
						<View className='flex-row items-center justify-center'>
							<Ionicons name='people' size={20} color='white' />
							<Text className='ml-2 text-lg font-semibold text-white'>
								Split {amount ? `$${amount}` : 'Expense'}
							</Text>
						</View>
					)}
				</TouchableOpacity>
			</BottomSheetView>
		</BottomSheetModal>
	);
}
