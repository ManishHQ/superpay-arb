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

// Mock groups data
const groups = [
	{
		id: '1',
		name: 'Roommates',
		members: 4,
		avatar: 'https://i.pravatar.cc/150?img=5',
		membersList: ['Alex', 'Sarah', 'Mike', 'Emma'],
	},
	{
		id: '2',
		name: 'Weekend Trip',
		members: 6,
		avatar: 'https://i.pravatar.cc/150?img=6',
		membersList: ['Alex', 'Sarah', 'Mike', 'Emma', 'John', 'Lisa'],
	},
	{
		id: '3',
		name: 'Birthday Party',
		members: 8,
		avatar: 'https://i.pravatar.cc/150?img=7',
		membersList: [
			'Alex',
			'Sarah',
			'Mike',
			'Emma',
			'John',
			'Lisa',
			'Tom',
			'Anna',
		],
	},
	{
		id: '4',
		name: 'Coffee Club',
		members: 3,
		avatar: 'https://i.pravatar.cc/150?img=8',
		membersList: ['Alex', 'Sarah', 'Mike'],
	},
];

interface SplitBottomSheetProps {
	bottomSheetModalRef: React.RefObject<BottomSheetModal | null>;
	onSplit: (
		amount: number,
		groupName: string,
		note: string,
		splitMethod: string
	) => void;
}

export default function SplitBottomSheet({
	bottomSheetModalRef,
	onSplit,
}: SplitBottomSheetProps) {
	const [amount, setAmount] = useState('');
	const [selectedGroup, setSelectedGroup] = useState<any>(null);
	const [note, setNote] = useState('');
	const [splitMethod, setSplitMethod] = useState('equal'); // 'equal' or 'custom'

	// Variables
	const snapPoints = useMemo(() => ['25%', '90%'], []);

	// Callbacks
	const handleSheetChanges = useCallback((index: number) => {
		console.log('handleSheetChanges', index);
	}, []);

	const handleSplit = () => {
		if (!amount || !selectedGroup) return;

		onSplit(parseFloat(amount), selectedGroup.name, note, splitMethod);
		setAmount('');
		setSelectedGroup(null);
		setNote('');
		setSplitMethod('equal');
		bottomSheetModalRef.current?.dismiss();
	};

	const splitAmount =
		selectedGroup && amount ? parseFloat(amount) / selectedGroup.members : 0;

	return (
		<BottomSheetModal
			ref={bottomSheetModalRef}
			index={1}
			snapPoints={snapPoints}
			onChange={handleSheetChanges}
			backgroundStyle={{ backgroundColor: 'white' }}
			handleIndicatorStyle={{ backgroundColor: '#E0E0E0' }}
		>
			<BottomSheetView className='flex-1 px-6'>
				{/* Header */}
				<View className='flex-row items-center justify-between mb-6'>
					<Text className='text-2xl font-bold text-text-main'>
						Split Expense
					</Text>
					<TouchableOpacity
						onPress={() => bottomSheetModalRef.current?.dismiss()}
					>
						<Ionicons name='close' size={24} color='#666' />
					</TouchableOpacity>
				</View>

				{/* Amount Input */}
				<View className='mb-6'>
					<Text className='mb-2 text-base font-medium text-gray-600'>
						Total Amount
					</Text>
					<View className='flex-row items-center px-4 py-3 border border-gray-300 rounded-2xl'>
						<Text className='mr-2 text-2xl font-bold text-text-main'>$</Text>
						<TextInput
							value={amount}
							onChangeText={setAmount}
							placeholder='0.00'
							keyboardType='decimal-pad'
							className='flex-1 text-2xl font-bold text-text-main'
							placeholderTextColor='#999'
						/>
					</View>
				</View>

				{/* Group Selection */}
				<View className='mb-6'>
					<Text className='mb-2 text-base font-medium text-gray-600'>
						Split with Group
					</Text>

					{/* Selected Group */}
					{selectedGroup && (
						<View className='flex-row items-center p-4 mb-4 bg-primary-blue rounded-2xl'>
							<Image
								source={{ uri: selectedGroup.avatar }}
								style={{
									width: 40,
									height: 40,
									borderRadius: 20,
									marginRight: 12,
								}}
								contentFit='cover'
								placeholder='👥'
								transition={200}
							/>
							<View className='flex-1'>
								<Text className='text-base font-medium text-white'>
									{selectedGroup.name}
								</Text>
								<Text className='text-sm text-blue-100'>
									{selectedGroup.members} members
								</Text>
							</View>
							<TouchableOpacity onPress={() => setSelectedGroup(null)}>
								<Ionicons name='close-circle' size={24} color='white' />
							</TouchableOpacity>
						</View>
					)}

					{/* Group List */}
					<ScrollView className='max-h-32' showsVerticalScrollIndicator={false}>
						{groups.map((group) => (
							<TouchableOpacity
								key={group.id}
								className='flex-row items-center p-3 border-b border-gray-100 last:border-b-0'
								onPress={() => setSelectedGroup(group)}
							>
								<Image
									source={{ uri: group.avatar }}
									style={{
										width: 40,
										height: 40,
										borderRadius: 20,
										marginRight: 12,
									}}
									contentFit='cover'
									placeholder='👥'
									transition={200}
								/>
								<View className='flex-1'>
									<Text className='text-base font-medium text-text-main'>
										{group.name}
									</Text>
									<Text className='text-sm text-gray-500'>
										{group.members} members
									</Text>
								</View>
								<Ionicons name='chevron-forward' size={20} color='#666' />
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Split Method */}
				<View className='mb-6'>
					<Text className='mb-2 text-base font-medium text-gray-600'>
						Split Method
					</Text>
					<View className='flex-row space-x-3'>
						<TouchableOpacity
							className={`flex-1 py-3 rounded-2xl border-2 ${
								splitMethod === 'equal'
									? 'border-primary-blue bg-blue-50'
									: 'border-gray-300'
							}`}
							onPress={() => setSplitMethod('equal')}
						>
							<Text
								className={`text-center font-medium ${
									splitMethod === 'equal'
										? 'text-primary-blue'
										: 'text-gray-600'
								}`}
							>
								Equal Split
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							className={`flex-1 py-3 rounded-2xl border-2 ${
								splitMethod === 'custom'
									? 'border-primary-blue bg-blue-50'
									: 'border-gray-300'
							}`}
							onPress={() => setSplitMethod('custom')}
						>
							<Text
								className={`text-center font-medium ${
									splitMethod === 'custom'
										? 'text-primary-blue'
										: 'text-gray-600'
								}`}
							>
								Custom Split
							</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Split Preview */}
				{selectedGroup && amount && (
					<View className='p-4 mb-6 bg-gray-50 rounded-2xl'>
						<Text className='mb-2 text-base font-medium text-gray-600'>
							Split Preview
						</Text>
						<Text className='text-lg font-semibold text-text-main'>
							${splitAmount.toFixed(2)} per person
						</Text>
						<Text className='mt-1 text-sm text-gray-500'>
							{selectedGroup.members} people × ${splitAmount.toFixed(2)} = $
							{amount}
						</Text>
					</View>
				)}

				{/* Note Input */}
				<View className='mb-6'>
					<Text className='mb-2 text-base font-medium text-gray-600'>
						Note (Optional)
					</Text>
					<TextInput
						value={note}
						onChangeText={setNote}
						placeholder="What's this expense for?"
						className='px-4 py-3 text-base border border-gray-300 rounded-2xl text-text-main'
						placeholderTextColor='#999'
						multiline
					/>
				</View>

				{/* Split Button */}
				<TouchableOpacity
					className={`py-4 rounded-2xl items-center ${
						amount && selectedGroup ? 'bg-primary-blue' : 'bg-gray-300'
					}`}
					onPress={handleSplit}
					disabled={!amount || !selectedGroup}
				>
					<Text
						className={`text-lg font-semibold ${
							amount && selectedGroup ? 'text-white' : 'text-gray-500'
						}`}
					>
						Split ${amount || '0.00'}
					</Text>
				</TouchableOpacity>
			</BottomSheetView>
		</BottomSheetModal>
	);
}
