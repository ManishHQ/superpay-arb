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
import {
	ActivityService,
	type Activity,
	ActivityType,
} from '@/services/activityService';
import CreateActivityModal from '@/components/CreateActivityModal';
import UserSearch from '@/components/UserSearch';
import { useUserStore } from '@/stores/userStore';

export default function ActivityScreen() {
	const [activities, setActivities] = useState<Activity[]>([]);
	const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showUserSearch, setShowUserSearch] = useState(false);
	const { user } = useUserStore();
	// Fetch activities from API
	const fetchActivities = async () => {
		try {
			setError(null);
			const response = await ActivityService.getActivities(1, 100);
			console.log('response', response.data.activities);
			setActivities(response.data.activities);
			setFilteredActivities(response.data.activities);
		} catch (error) {
			console.error('Error fetching activities:', error);
			setError('Failed to load activities');
		} finally {
			setIsLoading(false);
		}
	};

	// Fetch activity statistics
	const fetchStats = async () => {
		try {
			await ActivityService.getActivityStats();
		} catch (error) {
			console.error('Error fetching stats:', error);
		}
	};

	// Load data on component mount
	useEffect(() => {
		fetchActivities();
		fetchStats();
	}, []);

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
		try {
			await Promise.all([fetchActivities(), fetchStats()]);
		} catch (error) {
			console.error('Error refreshing:', error);
		} finally {
			setRefreshing(false);
		}
	};

	// Handle activity creation
	const handleActivityCreated = () => {
		fetchActivities();
		fetchStats();
	};

	// Handle activity deletion
	const handleDeleteActivity = async (
		activityId: string,
		activityName: string
	) => {
		Alert.alert(
			'Delete Activity',
			`Are you sure you want to delete "${activityName}"?`,
			[
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							await ActivityService.deleteActivity(activityId);
							Alert.alert('Success', 'Activity deleted successfully!');
							fetchActivities();
							fetchStats();
						} catch (error) {
							console.error('Error deleting activity:', error);
							Alert.alert('Error', 'Failed to delete activity');
						}
					},
				},
			]
		);
	};

	// Get activity type options for filter
	const activityTypeOptions = ActivityService.getActivityTypeOptions();

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
	const renderActivityItem = (activity: Activity) => (
		<TouchableOpacity
			key={activity._id}
			className='flex-row items-start p-4 mb-3 bg-white border shadow-sm rounded-xl border-gray-50'
			onPress={() => {
				// For now, just show an alert. In the future, this could navigate to a detail screen
				Alert.alert(
					'Activity Details',
					`Viewing details for: ${activity.name}`
				);
			}}
		>
			<View className='relative mr-3'>
				<View className='items-center justify-center rounded-full w-14 h-14 bg-blue-50'>
					<Text className='text-2xl'>
						{activity.icon ||
							ActivityService.getActivityTypeIcon(activity.type)}
					</Text>
				</View>
				{!activity.isActive && (
					<View className='absolute w-4 h-4 bg-gray-400 border-2 border-white rounded-full -top-1 -right-1' />
				)}
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
						onPress={() => handleDeleteActivity(activity._id, activity.name)}
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

	// Show error state
	if (error && activities.length === 0) {
		return (
			<SafeAreaView className='flex-1 bg-gray-50'>
				<View className='items-center justify-center flex-1 px-6'>
					<Ionicons name='alert-circle' size={64} color='#EF4444' />
					<Text className='mt-4 text-xl font-semibold text-center text-gray-900'>
						Failed to Load Activities
					</Text>
					<Text className='mt-2 text-base text-center text-gray-600'>
						{error}
					</Text>
					<TouchableOpacity
						className='px-6 py-3 mt-6 bg-blue-600 rounded-lg'
						onPress={() => {
							setError(null);
							fetchActivities();
						}}
					>
						<Text className='font-semibold text-white'>Try Again</Text>
					</TouchableOpacity>
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
						<TouchableOpacity
							className='flex-row items-center px-3 py-2 bg-gray-100 rounded-xl'
							onPress={() => setShowUserSearch(true)}
						>
							<Ionicons name='people' size={18} color='#4B5563' />
							<Text className='ml-2 text-sm font-medium text-gray-700'>
								Find
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							className='flex-row items-center px-4 py-2.5 rounded-xl bg-blue-600 shadow-sm'
							onPress={() => setShowCreateModal(true)}
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
							style={{
								paddingVertical: 2,
								textAlignVertical: 'center',
								fontSize: 16,
							}}
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
								{option.icon} {option.label}
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
								onPress={() => setShowCreateModal(true)}
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

			{/* Create Activity Modal */}
			<CreateActivityModal
				visible={showCreateModal}
				onClose={() => setShowCreateModal(false)}
				onActivityCreated={handleActivityCreated}
			/>

			{/* User Search Modal */}
			<UserSearch
				visible={showUserSearch}
				onClose={() => setShowUserSearch(false)}
				onUserSelect={(user) => {
					console.log('User selected:', user);
					// Handle user selection here
					setShowUserSearch(false);
				}}
				title='Find Users'
				placeholder='Search by name or username...'
				excludeCurrentUser={user?._id ? false : true}
				minSearchLength={3}
			/>
		</SafeAreaView>
	);
}
