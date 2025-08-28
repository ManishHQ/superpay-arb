import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	TextInput,
	RefreshControl,
	Alert,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, useEffect } from 'react';

// Mock data for display
const mockActivities = [
	{
		id: '1',
		name: 'Dinner with Friends',
		description: 'Split dinner bill at Italian restaurant',
		type: 'dining',
		members: ['Sarah', 'Mike', 'Emma'],
		createdAt: '2024-01-15T10:00:00Z',
		icon: '🍝',
	},
	{
		id: '2',
		name: 'Movie Night',
		description: 'Shared movie tickets and snacks',
		type: 'entertainment',
		members: ['John', 'Lisa'],
		createdAt: '2024-01-14T18:30:00Z',
		icon: '🎬',
	},
	{
		id: '3',
		name: 'Road Trip',
		description: 'Gas and hotel expenses for weekend trip',
		type: 'travel',
		members: ['Alex', 'Jordan', 'Taylor', 'Casey'],
		createdAt: '2024-01-12T08:15:00Z',
		icon: '🚗',
	},
];

const activityTypeOptions = [
	{ label: '🍽️ Dining', value: 'dining' },
	{ label: '🎬 Entertainment', value: 'entertainment' },
	{ label: '🚗 Travel', value: 'travel' },
	{ label: '🏠 Housing', value: 'housing' },
	{ label: '🛒 Shopping', value: 'shopping' },
];

export default function ActivityScreen() {
	const [activities, setActivities] = useState(mockActivities);
	const [filteredActivities, setFilteredActivities] = useState(mockActivities);
	const [isLoading, setIsLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedType, setSelectedType] = useState<string | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showUserSearch, setShowUserSearch] = useState(false);

	// Filter activities based on search query and type
	useEffect(() => {
		let filtered = activities;

		// Filter by type
		if (selectedType) {
			filtered = filtered.filter((activity) => activity.type === selectedType);
		}

		// Filter by search query
		if (searchQuery.trim()) {
			filtered = filtered.filter(
				(activity) =>
					activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					activity.description
						?.toLowerCase()
						.includes(searchQuery.toLowerCase())
			);
		}

		setFilteredActivities(filtered);
	}, [searchQuery, selectedType, activities]);

	// Handle pull-to-refresh
	const onRefresh = async () => {
		setRefreshing(true);
		// Move refresh logic to services
		console.log('Refreshing activities...');
		setTimeout(() => setRefreshing(false), 1000);
	};

	// Handle activity creation
	const handleCreateActivity = () => {
		console.log('Create activity - move logic to services');
		setShowCreateModal(true);
	};

	// Handle activity deletion
	const handleDeleteActivity = (activityId: string, activityName: string) => {
		Alert.alert(
			'Delete Activity',
			`Are you sure you want to delete "${activityName}"?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: () => {
						// Move delete logic to services
						console.log('Deleting activity:', activityId);
						setActivities((prev) => prev.filter((a) => a.id !== activityId));
						setFilteredActivities((prev) =>
							prev.filter((a) => a.id !== activityId)
						);
						Alert.alert('Success', 'Activity deleted successfully!');
					},
				},
			]
		);
	};

	// Format date
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 1) return 'Today';
		if (diffDays === 2) return 'Yesterday';
		if (diffDays <= 7) return `${diffDays - 1} days ago`;
		return date.toLocaleDateString();
	};

	// Render activity item
	const renderActivityItem = (activity: (typeof mockActivities)[0]) => (
		<TouchableOpacity
			key={activity.id}
			className='flex-row items-start p-4 mb-3 bg-white border shadow-sm rounded-xl border-gray-50'
			onPress={() => {
				Alert.alert(
					'Activity Details',
					`Viewing details for: ${activity.name}`
				);
			}}
		>
			<View className='relative mr-3'>
				<View className='items-center justify-center rounded-full w-14 h-14 bg-blue-50'>
					<Text className='text-2xl'>{activity.icon}</Text>
				</View>
			</View>
			<View className='flex-1'>
				<View className='flex-row items-center justify-between mb-1'>
					<Text
						className='flex-1 mr-2 text-lg font-semibold text-gray-900'
						numberOfLines={1}
					>
						{activity.name}
					</Text>
					<Text className='text-xs text-gray-500'>
						{formatDate(activity.createdAt)}
					</Text>
				</View>

				{activity.description && (
					<Text className='mb-2 text-sm text-gray-600' numberOfLines={2}>
						{activity.description}
					</Text>
				)}

				<View className='flex-row items-center justify-between'>
					<View className='flex-row items-center flex-1'>
						<View className='px-2 py-1 mr-2 bg-blue-100 rounded-full'>
							<Text className='text-xs font-medium text-blue-600 capitalize'>
								{activity.type}
							</Text>
						</View>

						<View className='flex-row items-center'>
							<Ionicons name='people-outline' size={14} color='#666' />
							<Text className='ml-1 text-xs text-gray-500'>
								{activity.members.length} members
							</Text>
						</View>
					</View>

					<TouchableOpacity
						onPress={() => handleDeleteActivity(activity.id, activity.name)}
						className='p-2 ml-2'
					>
						<Ionicons name='trash-outline' size={16} color='#EF4444' />
					</TouchableOpacity>
				</View>
			</View>
		</TouchableOpacity>
	);

	// Show loading state
	if (isLoading) {
		return (
			<SafeAreaView className='flex-1 bg-gray-50'>
				<View className='items-center justify-center flex-1'>
					<ActivityIndicator size='large' color='#3D5AFE' />
					<Text className='mt-4 text-lg text-gray-600'>
						Loading activities...
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className='flex-1 bg-gray-50' edges={['top']}>
			{/* Header */}
			<View className='px-4 py-6 bg-white'>
				<View className='flex-row items-center justify-between mb-6'>
					<View>
						<Text className='text-3xl font-bold text-gray-900'>Activities</Text>
						<Text className='mt-1 text-sm text-gray-600'>
							Manage your shared activities
						</Text>
					</View>
					<View className='flex-row items-center space-x-3'>
						{/* find user */}

						<TouchableOpacity
							className='flex-row items-center px-4 py-2.5 rounded-xl bg-blue-600 shadow-sm'
							onPress={handleCreateActivity}
						>
							<Ionicons name='add' size={18} color='white' />
							<Text className='ml-2 text-sm font-semibold text-white'>
								Create
							</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Search Bar */}
				<View className='relative mb-4'>
					<View className='flex-row items-center px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl'>
						<Ionicons name='search' size={20} color='#9CA3AF' />
						<TextInput
							placeholder='Search activities...'
							value={searchQuery}
							onChangeText={setSearchQuery}
							className='flex-1 ml-3 text-base text-gray-900'
							placeholderTextColor='#9CA3AF'
						/>
						{searchQuery.length > 0 && (
							<TouchableOpacity onPress={() => setSearchQuery('')}>
								<Ionicons name='close-circle' size={20} color='#9CA3AF' />
							</TouchableOpacity>
						)}
					</View>
				</View>

				{/* Type Filter */}
				<ScrollView horizontal showsHorizontalScrollIndicator={false}>
					<TouchableOpacity
						className={`px-6 py-2 flex-row items-center justify-center mr-2 rounded-full ${
							selectedType === null ? 'bg-blue-500' : 'bg-gray-200'
						}`}
						onPress={() => setSelectedType(null)}
					>
						<Text
							className={`text-sm font-medium ${
								selectedType === null ? 'text-white' : 'text-gray-600'
							}`}
						>
							All
						</Text>
					</TouchableOpacity>
					{activityTypeOptions.map((option) => (
						<TouchableOpacity
							key={option.value}
							className={`px-6 py-2 flex-row items-center justify-center mr-2 rounded-full ${
								selectedType === option.value ? 'bg-blue-500' : 'bg-gray-200'
							}`}
							onPress={() => setSelectedType(option.value)}
						>
							<Text
								className={`text-sm font-medium ${
									selectedType === option.value ? 'text-white' : 'text-gray-600'
								}`}
							>
								{option.label}
							</Text>
						</TouchableOpacity>
					))}
				</ScrollView>
			</View>

			{/* Activities List */}
			<ScrollView
				className='flex-1 bg-gray-200'
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: 20,
					paddingLeft: 12,
					paddingRight: 12,
					paddingTop: 12,
				}}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor='#3D5AFE'
						colors={['#3D5AFE']}
					/>
				}
			>
				{filteredActivities.length === 0 ? (
					<View className='items-center justify-center py-12 mb-8 bg-white rounded-xl'>
						<Ionicons name='folder-open' size={64} color='#D1D5DB' />
						<Text className='mt-4 text-lg font-medium text-gray-500'>
							{searchQuery || selectedType
								? 'No activities found'
								: 'No activities yet'}
						</Text>
						<Text className='mt-2 text-sm text-center text-gray-400'>
							{searchQuery || selectedType
								? 'Try adjusting your search or filters'
								: 'Create your first activity to get started'}
						</Text>
						{!searchQuery && !selectedType && (
							<TouchableOpacity
								className='px-6 py-3 mt-4 bg-blue-600 rounded-lg'
								onPress={handleCreateActivity}
							>
								<Text className='font-semibold text-white'>
									Create Activity
								</Text>
							</TouchableOpacity>
						)}
					</View>
				) : (
					filteredActivities.map(renderActivityItem)
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
