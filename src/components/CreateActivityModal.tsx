import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	Modal,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Alert,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

interface CreateActivityModalProps {
	visible: boolean;
	onClose: () => void;
	onActivityCreated: () => void;
}

const activityTypes = [
	{ id: 'dining', name: 'Dining', icon: '🍽️', color: '#F59E0B' },
	{ id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#8B5CF6' },
	{ id: 'travel', name: 'Travel', icon: '✈️', color: '#3B82F6' },
	{ id: 'shopping', name: 'Shopping', icon: '🛒', color: '#10B981' },
	{ id: 'housing', name: 'Housing', icon: '🏠', color: '#EF4444' },
	{ id: 'utilities', name: 'Utilities', icon: '⚡', color: '#6B7280' },
	{ id: 'other', name: 'Other', icon: '📝', color: '#9CA3AF' },
];

const mockMembers = [
	{ id: '1', name: 'Sarah Wilson', email: 'sarah@example.com' },
	{ id: '2', name: 'Mike Chen', email: 'mike@example.com' },
	{ id: '3', name: 'Emma Davis', email: 'emma@example.com' },
	{ id: '4', name: 'John Smith', email: 'john@example.com' },
];

export default function CreateActivityModal({
	visible,
	onClose,
	onActivityCreated,
}: CreateActivityModalProps) {
	const [activityName, setActivityName] = useState('');
	const [description, setDescription] = useState('');
	const [selectedType, setSelectedType] = useState('dining');
	const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
	const [isCreating, setIsCreating] = useState(false);

	const handleReset = () => {
		setActivityName('');
		setDescription('');
		setSelectedType('dining');
		setSelectedMembers([]);
	};

	const handleClose = () => {
		handleReset();
		onClose();
	};

	const toggleMember = (memberId: string) => {
		setSelectedMembers((prev) =>
			prev.includes(memberId)
				? prev.filter((id) => id !== memberId)
				: [...prev, memberId]
		);
	};

	const handleCreate = async () => {
		if (!activityName.trim()) {
			Alert.alert('Error', 'Please enter an activity name');
			return;
		}

		if (selectedMembers.length === 0) {
			Alert.alert('Error', 'Please select at least one member');
			return;
		}

		setIsCreating(true);
		try {
			// Move creation logic to services
			const activityData = {
				name: activityName.trim(),
				description: description.trim(),
				type: selectedType,
				members: selectedMembers,
			};

			console.log('Creating activity:', activityData);

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 2000));

			Alert.alert('Success', 'Activity created successfully!', [
				{
					text: 'OK',
					onPress: () => {
						onActivityCreated();
						handleClose();
					},
				},
			]);
		} catch (error) {
			console.error('Create activity error:', error);
			Alert.alert('Error', 'Failed to create activity. Please try again.');
		} finally {
			setIsCreating(false);
		}
	};

	const selectedType_obj = activityTypes.find(
		(type) => type.id === selectedType
	);

	return (
		<Modal
			visible={visible}
			animationType='slide'
			presentationStyle='pageSheet'
			onRequestClose={handleClose}
		>
			<SafeAreaView className='flex-1 bg-white'>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					style={{ flex: 1 }}
				>
					<ScrollView
						className='flex-1 px-6 py-4'
						keyboardShouldPersistTaps='handled'
					>
						{/* Header */}
						<View className='flex-row items-center justify-between mb-6'>
							<Text className='text-2xl font-bold text-gray-900'>
								Create Activity
							</Text>
							<TouchableOpacity onPress={handleClose} className='p-2'>
								<Ionicons name='close' size={24} color='#666' />
							</TouchableOpacity>
						</View>

						{/* Activity Name */}
						<View className='mb-6'>
							<Text className='mb-3 text-lg font-semibold text-gray-900'>
								Activity Name
							</Text>
							<TextInput
								placeholder='Enter activity name...'
								value={activityName}
								onChangeText={setActivityName}
								className='p-4 text-base border border-gray-300 rounded-xl'
								placeholderTextColor='#9CA3AF'
							/>
						</View>

						{/* Description */}
						<View className='mb-6'>
							<Text className='mb-3 text-lg font-semibold text-gray-900'>
								Description (Optional)
							</Text>
							<TextInput
								placeholder="What's this activity about?"
								value={description}
								onChangeText={setDescription}
								multiline
								numberOfLines={3}
								className='p-4 text-base border border-gray-300 rounded-xl'
								placeholderTextColor='#9CA3AF'
								textAlignVertical='top'
							/>
						</View>

						{/* Activity Type */}
						<View className='mb-6'>
							<Text className='mb-3 text-lg font-semibold text-gray-900'>
								Activity Type
							</Text>
							<ScrollView horizontal showsHorizontalScrollIndicator={false}>
								<View className='flex-row gap-3'>
									{activityTypes.map((type) => (
										<TouchableOpacity
											key={type.id}
											onPress={() => setSelectedType(type.id)}
											className={`p-4 rounded-xl border-2 min-w-[100px] ${
												selectedType === type.id
													? 'border-blue-500 bg-blue-50'
													: 'border-gray-200 bg-white'
											}`}
										>
											<Text className='text-2xl text-center'>{type.icon}</Text>
											<Text
												className={`text-sm font-medium text-center mt-1 ${
													selectedType === type.id
														? 'text-blue-900'
														: 'text-gray-900'
												}`}
											>
												{type.name}
											</Text>
										</TouchableOpacity>
									))}
								</View>
							</ScrollView>
						</View>

						{/* Members Selection */}
						<View className='mb-6'>
							<Text className='mb-3 text-lg font-semibold text-gray-900'>
								Add Members ({selectedMembers.length} selected)
							</Text>
							{mockMembers.map((member) => (
								<TouchableOpacity
									key={member.id}
									onPress={() => toggleMember(member.id)}
									className={`flex-row items-center p-4 mb-2 border rounded-xl ${
										selectedMembers.includes(member.id)
											? 'border-blue-500 bg-blue-50'
											: 'border-gray-200 bg-white'
									}`}
								>
									<View className='items-center justify-center w-12 h-12 mr-4 bg-gray-200 rounded-full'>
										<Text className='text-lg font-bold text-gray-600'>
											{member.name[0]}
										</Text>
									</View>
									<View className='flex-1'>
										<Text className='text-base font-semibold text-gray-900'>
											{member.name}
										</Text>
										<Text className='text-sm text-gray-500'>
											{member.email}
										</Text>
									</View>
									{selectedMembers.includes(member.id) && (
										<Ionicons
											name='checkmark-circle'
											size={24}
											color='#3B82F6'
										/>
									)}
								</TouchableOpacity>
							))}
						</View>

						{/* Preview */}
						{activityName && selectedMembers.length > 0 && (
							<View className='p-4 mb-6 rounded-xl bg-gray-50'>
								<Text className='mb-2 text-sm font-medium text-gray-600'>
									Preview:
								</Text>
								<View className='flex-row items-center mb-2'>
									<Text className='mr-2 text-xl'>{selectedType_obj?.icon}</Text>
									<Text className='text-base font-semibold text-gray-900'>
										{activityName}
									</Text>
								</View>
								{description && (
									<Text className='mb-2 text-sm text-gray-600'>
										{description}
									</Text>
								)}
								<Text className='text-sm text-gray-600'>
									{selectedMembers.length} member
									{selectedMembers.length !== 1 ? 's' : ''} •{' '}
									{selectedType_obj?.name}
								</Text>
							</View>
						)}

						{/* Create Button */}
						<TouchableOpacity
							onPress={handleCreate}
							disabled={
								!activityName.trim() ||
								selectedMembers.length === 0 ||
								isCreating
							}
							className={`p-4 rounded-xl ${
								activityName.trim() && selectedMembers.length > 0 && !isCreating
									? 'bg-blue-600'
									: 'bg-gray-300'
							}`}
						>
							{isCreating ? (
								<View className='flex-row items-center justify-center'>
									<ActivityIndicator size='small' color='white' />
									<Text className='ml-2 text-lg font-semibold text-white'>
										Creating...
									</Text>
								</View>
							) : (
								<View className='flex-row items-center justify-center'>
									<Ionicons name='add-circle' size={20} color='white' />
									<Text className='ml-2 text-lg font-semibold text-white'>
										Create Activity
									</Text>
								</View>
							)}
						</TouchableOpacity>
					</ScrollView>
				</KeyboardAvoidingView>
			</SafeAreaView>
		</Modal>
	);
}
