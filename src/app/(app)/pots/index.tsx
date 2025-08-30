import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	TextInput,
	RefreshControl,
	Alert,
	ActivityIndicator,
	Modal,
	KeyboardAvoidingView,
	Platform,
	Pressable,
} from 'react-native';
import {
	SafeAreaView,
	useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
	useSavingsPotsStore,
	potTemplates,
	SavingsPot,
} from '@/stores/savingsPotsStore';
import { useWalletStore } from '@/stores/walletStore';
import { useBalanceStore } from '@/stores/balanceStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { UserProfileService } from '@/services/userProfileService';

import { UserProfile } from '@/types/supabase';

export default function ActivityScreen() {
	// Savings pots store
	const {
		pots,
		yieldStrategies,
		isLoading,
		isUpdatingPot,
		globalAutoInvestEnabled,
		createPot,
		addFunds,
		withdrawFunds,
		deletePot,
		getActivePots,
		getTotalSavings,
		getTotalYieldEarned,
		getProgressPercentage,
		updateYieldStrategies,
		setGlobalAutoInvest,
		loadUserPots,
	} = useSavingsPotsStore();

	// Wallet store
	const { address: walletAddress, isConnected } = useWalletStore();
	const { getBalance } = useBalanceStore();

	// User profile store
	const { currentProfile, loadProfileByWallet } = useUserProfileStore();

	// Safe area insets for proper spacing
	const insets = useSafeAreaInsets();

	// Local state
	const [refreshing, setRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showCustomModal, setShowCustomModal] = useState(false);
	const [showPotDetailModal, setShowPotDetailModal] = useState(false);
	const [selectedPot, setSelectedPot] = useState<SavingsPot | null>(null);
	const [fundAmount, setFundAmount] = useState('');
	const [showYieldBadge, setShowYieldBadge] = useState(false);

	// Custom pot creation state
	const [customPotName, setCustomPotName] = useState('');
	const [customPotDescription, setCustomPotDescription] = useState('');
	const [customPotTarget, setCustomPotTarget] = useState('');
	const [customPotIcon, setCustomPotIcon] = useState('💎');
	const [customPotColor, setCustomPotColor] = useState('#3B82F6');

	// New pot options
	const [isStrictPot, setIsStrictPot] = useState(false);
	const [strictDeadline, setStrictDeadline] = useState<Date | null>(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [isJointPot, setIsJointPot] = useState(false);
	const [invitedUsers, setInvitedUsers] = useState<UserProfile[]>([]);
	const [currentInviteUsername, setCurrentInviteUsername] = useState('');
	const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
	const [isSearching, setIsSearching] = useState(false);

	// Get wallet balance
	const usdcBalance = walletAddress ? getBalance(walletAddress, 'usdc') : null;
	const availableBalance = parseFloat(usdcBalance?.formatted || '0');

	// Load pots from database when component mounts
	useEffect(() => {
		if (walletAddress) {
			loadUserPots();
		}
	}, [walletAddress]);

	// Load pots when wallet connects
	useEffect(() => {
		if (isConnected && walletAddress) {
			loadUserPots();
		}
	}, [isConnected, walletAddress]);

	// Load user profile when wallet connects
	useEffect(() => {
		if (walletAddress) {
			loadProfileByWallet(walletAddress);
		}
	}, [walletAddress]);

	// Load on-chain USDC balance and pot balance when wallet connects
	useEffect(() => {
		if (walletAddress && isConnected) {
		}
	}, [walletAddress, isConnected]);

	// Show yield badge after 2 seconds when auto invest is enabled
	useEffect(() => {
		if (globalAutoInvestEnabled) {
			const timer = setTimeout(() => {
				setShowYieldBadge(true);
			}, 2000);
			return () => clearTimeout(timer);
		} else {
			setShowYieldBadge(false);
		}
	}, [globalAutoInvestEnabled]);

	// Filter pots based on search and category
	const filteredPots = getActivePots().filter((pot) => {
		const matchesSearch =
			!searchQuery ||
			pot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			pot.description?.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesCategory =
			!selectedCategory || pot.category === selectedCategory;

		return matchesSearch && matchesCategory;
	});

	// Category options
	const categoryOptions = [
		{ label: '🛡️ Emergency', value: 'emergency' },
		{ label: '🏠 Housing', value: 'housing' },
		{ label: '🚗 Transport', value: 'transport' },
		{ label: '✈️ Vacation', value: 'vacation' },
		{ label: '📈 Investment', value: 'investment' },
		{ label: '⚙️ Custom', value: 'custom' },
	];

	// Custom pot templates for inspiration
	const customPotSuggestions = [
		{
			name: 'Wedding Ring',
			description: 'Save for the perfect engagement ring',
			icon: '💍',
			color: '#F59E0B',
			target: 5000,
		},
		{
			name: 'Education Fund',
			description: 'Invest in learning and courses',
			icon: '🎓',
			color: '#8B5CF6',
			target: 3000,
		},
		{
			name: 'Gaming Setup',
			description: 'Build the ultimate gaming rig',
			icon: '🎮',
			color: '#EF4444',
			target: 2500,
		},
		{
			name: 'Art Collection',
			description: 'Start collecting beautiful art pieces',
			icon: '🎨',
			color: '#10B981',
			target: 1500,
		},
		{
			name: 'Health & Fitness',
			description: 'Gym membership and equipment',
			icon: '💪',
			color: '#06B6D4',
			target: 1200,
		},
		{
			name: 'Pet Fund',
			description: 'Care for your furry friends',
			icon: '🐕',
			color: '#F97316',
			target: 2000,
		},
		{
			name: 'Music Equipment',
			description: 'Build your home studio',
			icon: '🎵',
			color: '#84CC16',
			target: 4000,
		},
		{
			name: 'Photography Gear',
			description: 'Capture perfect moments',
			icon: '📸',
			color: '#EC4899',
			target: 3500,
		},
	];

	// Available colors for custom pots
	const potColors = [
		'#3B82F6',
		'#8B5CF6',
		'#EF4444',
		'#10B981',
		'#F59E0B',
		'#06B6D4',
		'#F97316',
		'#84CC16',
		'#EC4899',
		'#6366F1',
		'#14B8A6',
		'#F43F5E',
	];

	// Available icons for custom pots
	const potIcons = [
		'💎',
		'💍',
		'🎓',
		'🎮',
		'🎨',
		'💪',
		'🐕',
		'🎵',
		'📸',
		'⚽',
		'🏖️',
		'🍕',
		'📱',
		'💻',
		'🚲',
		'🎪',
		'🎭',
		'🏆',
		'⭐',
		'🔥',
		'🎯',
		'🚀',
		'💡',
		'🎸',
	];

	// Handle pull-to-refresh
	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await updateYieldStrategies();
			await loadUserPots();
		} finally {
			setRefreshing(false);
		}
	};

	// Handle pot creation from template
	const handleCreateFromTemplate = (template: (typeof potTemplates)[0]) => {
		// Pre-fill the custom creation form with template data
		setCustomPotName(template.name);
		setCustomPotDescription(template.description);
		setCustomPotIcon(template.icon);
		setCustomPotColor(template.color);
		setCustomPotTarget(template.targetAmount.toString());

		// Navigate to custom creation modal
		setShowCreateModal(false);
		setShowCustomModal(true);
	};

	// Handle opening custom pot modal
	const handleCreateCustom = () => {
		setShowCreateModal(false);
		setShowCustomModal(true);
	};

	// Handle closing custom modal and reset form
	const handleCloseCustomModal = () => {
		setShowCustomModal(false);
		// Reset form after a delay to prevent visual glitch
		setTimeout(() => {
			setCustomPotName('');
			setCustomPotDescription('');
			setCustomPotTarget('');
			setCustomPotIcon('💎');
			setCustomPotColor('#3B82F6');
			setIsStrictPot(false);
			setStrictDeadline(null);
			setShowDatePicker(false);
			setIsJointPot(false);
			setInvitedUsers([]);
			setCurrentInviteUsername('');
			setSearchResults([]);
			setIsSearching(false);
		}, 300);
	};

	// Handle custom pot creation from suggestion
	const handleCustomSuggestion = (
		suggestion: (typeof customPotSuggestions)[0]
	) => {
		setCustomPotName(suggestion.name);
		setCustomPotDescription(suggestion.description);
		setCustomPotIcon(suggestion.icon);
		setCustomPotColor(suggestion.color);
		setCustomPotTarget(suggestion.target.toString());
	};

	// Handle user search
	const handleUserSearch = async (searchTerm: string) => {
		setCurrentInviteUsername(searchTerm);

		if (searchTerm.trim().length < 2) {
			setSearchResults([]);
			setIsSearching(false);
			return;
		}

		setIsSearching(true);
		try {
			const results = await UserProfileService.searchUsers(searchTerm, 5);
			// Filter out already invited users
			const filteredResults = results.filter(
				(user) => !invitedUsers.some((invited) => invited.id === user.id)
			);
			setSearchResults(filteredResults);
		} catch (error) {
			console.error('Error searching users:', error);
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	};

	// Handle adding user to pot
	const handleAddUserToPot = (user: UserProfile) => {
		if (!invitedUsers.some((invited) => invited.id === user.id)) {
			setInvitedUsers([...invitedUsers, user]);
			setCurrentInviteUsername('');
			setSearchResults([]);
		}
	};

	// Handle removing user from pot
	const handleRemoveUserFromPot = (userId: string) => {
		setInvitedUsers(invitedUsers.filter((user) => user.id !== userId));
	};

	// Handle date picker change
	const handleDateChange = (_: any, selectedDate?: Date) => {
		setShowDatePicker(Platform.OS === 'ios');
		if (selectedDate) {
			setStrictDeadline(selectedDate);
		}
	};

	// Handle custom pot creation
	const handleCreateCustomPot = async () => {
		if (!customPotName.trim()) {
			Alert.alert(
				'Missing Information',
				'Please enter a name for your savings pot'
			);
			return;
		}

		const targetAmount = parseFloat(customPotTarget);
		if (isNaN(targetAmount) || targetAmount <= 0) {
			Alert.alert('Invalid Amount', 'Please enter a valid target amount');
			return;
		}

		const customPotData = {
			name: customPotName.trim(),
			description: customPotDescription.trim() || `Save for ${customPotName}`,
			targetAmount,
			icon: customPotIcon,
			color: customPotColor,
			category: 'custom' as const,
			isYieldEnabled: false,
			isStrict: isStrictPot,
			strictDeadline:
				isStrictPot && strictDeadline ? strictDeadline : undefined,
			isJoint: isJointPot,
			invitedUsers: isJointPot
				? invitedUsers.map((user) => user.username)
				: undefined,
		};

		try {
			// Create regular database pot
			await createPot(customPotData);
			Alert.alert('Success', `${customPotName} pot created successfully!`);

			handleCloseCustomModal();
		} catch (error) {
			console.error('Error creating pot:', error);
			Alert.alert('Error', 'Failed to create pot. Please try again.');
		}
	};

	// Handle adding funds
	const handleAddFunds = async () => {
		if (!selectedPot || !fundAmount) return;

		const amount = parseFloat(fundAmount);
		if (isNaN(amount) || amount <= 0) {
			Alert.alert('Invalid Amount', 'Please enter a valid amount');
			return;
		}

		if (amount > availableBalance) {
			Alert.alert('Insufficient Balance', "You don't have enough USDC");
			return;
		}

		try {
			// Handle regular database pot funding
			await addFunds(selectedPot.id, amount);

			setShowPotDetailModal(false);
			setFundAmount('');
			Alert.alert('Success', `Added $${amount} to ${selectedPot.name}!`);
		} catch (error) {
			console.error('Error adding funds:', error);
			Alert.alert('Error', 'Failed to add funds. Please try again.');
		}
	};

	// Calculate average yield percentage
	const getAverageYield = () => {
		const activePots = getActivePots();
		const yieldEnabledPots = activePots.filter(
			(pot) => pot.isYieldEnabled && pot.apy
		);

		if (yieldEnabledPots.length === 0) return 0;

		const totalApy = yieldEnabledPots.reduce(
			(sum, pot) => sum + (pot.apy || 0),
			0
		);
		return totalApy / yieldEnabledPots.length;
	};

	// Generate avatar for user
	const getUserAvatar = (username: string) => {
		const colors = [
			'#3B82F6',
			'#8B5CF6',
			'#EF4444',
			'#10B981',
			'#F59E0B',
			'#06B6D4',
		];
		const colorIndex = username.length % colors.length;
		return {
			backgroundColor: colors[colorIndex],
			letter: username.charAt(0).toUpperCase(),
		};
	};

	// Format currency
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
		}).format(amount);
	};

	// Render savings pot item
	const renderPotItem = (pot: SavingsPot) => {
		const progress = getProgressPercentage(pot.id);
		const isUpdating = isUpdatingPot === pot.id;

		return (
			<TouchableOpacity
				key={pot.id}
				className='p-4 mb-3 transition-all bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md hover:border-gray-300'
				onPress={() => {
					setSelectedPot(pot);
					setShowPotDetailModal(true);
				}}
				disabled={isUpdating}
			>
				<View className='flex-row items-start'>
					<View className='relative mr-3'>
						<View
							className='items-center justify-center rounded-full w-14 h-14'
							style={{ backgroundColor: pot.color + '20' }}
						>
							<Text className='text-2xl'>{pot.icon}</Text>
						</View>
						{pot.isYieldEnabled && (
							<View className='absolute items-center justify-center w-6 h-6 bg-green-500 border-2 border-white rounded-full shadow-sm -top-1 -right-1'>
								<Ionicons name='trending-up' size={12} color='white' />
							</View>
						)}
						{pot.isStrict && (
							<View className='absolute items-center justify-center w-6 h-6 bg-red-500 border-2 border-white rounded-full shadow-sm -top-1 -left-1'>
								<Ionicons name='lock-closed' size={12} color='white' />
							</View>
						)}
						{pot.isJoint && (
							<View className='absolute items-center justify-center w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-sm -bottom-1 -right-1'>
								<Ionicons name='people' size={12} color='white' />
							</View>
						)}
					</View>

					<View className='flex-1'>
						<View className='flex-row items-center justify-between mb-1'>
							<Text className='flex-1 mr-2 text-lg font-semibold text-gray-900'>
								{pot.name}
							</Text>
						</View>

						{pot.description && (
							<Text className='mb-2 text-sm text-gray-600' numberOfLines={1}>
								{pot.description}
							</Text>
						)}

						{/* Progress Bar */}
						<View className='mb-2'>
							<View className='h-2 overflow-hidden bg-gray-200 rounded-full'>
								<View
									className='h-full transition-all rounded-full'
									style={{
										backgroundColor: pot.color,
										width: `${Math.min(progress, 100)}%`,
									}}
								/>
							</View>
						</View>

						<View className='flex-row items-center justify-between'>
							<View>
								<Text className='text-lg font-bold text-gray-900'>
									{formatCurrency(pot.currentAmount)}
								</Text>
								<Text className='text-xs text-gray-500'>
									of {formatCurrency(pot.targetAmount)} ({progress.toFixed(1)}%)
								</Text>
							</View>

							<View className='flex-row items-center space-x-2'>
								{globalAutoInvestEnabled && (
									<View className='px-2 py-1 bg-purple-100 rounded-full'>
										<Text className='text-xs font-medium text-purple-600'>
											AI Auto-Invest
										</Text>
									</View>
								)}

								{pot.isYieldEnabled && pot.apy && (
									<View className='px-2 py-1 bg-green-100 rounded-full'>
										<Text className='text-xs font-medium text-green-600'>
											{pot.apy.toFixed(1)}% APY
										</Text>
									</View>
								)}

								{pot.isStrict && pot.strictDeadline && (
									<View className='px-2 py-1 bg-red-100 rounded-full'>
										<Text className='text-xs font-medium text-red-600'>
											Locked until {pot.strictDeadline.toLocaleDateString()}
										</Text>
									</View>
								)}

								{pot.isJoint && (
									<View className='px-2 py-1 bg-blue-100 rounded-full'>
										<Text className='text-xs font-medium text-blue-600'>
											Joint ({(pot.collaborators?.length || 0) + 1} members)
										</Text>
									</View>
								)}
							</View>
						</View>

						{isUpdating && (
							<View className='absolute inset-0 items-center justify-center bg-white/80 rounded-xl'>
								<ActivityIndicator size='small' color={pot.color} />
							</View>
						)}
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	return (
		<SafeAreaView className='flex-1 bg-gray-50' edges={['top']}>
			{/* Header */}
			<View className='px-4 py-6 bg-white border-b border-gray-100'>
				<View className='flex-row items-center justify-between mb-6'>
					<View className='flex-1'>
						<Text className='text-3xl font-bold text-gray-900'>
							Savings Pots
						</Text>
						<Text className='mt-1 text-sm text-gray-600'>
							Save for your goals and earn passive income
						</Text>
					</View>
					<TouchableOpacity
						className='flex-row items-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors'
						onPress={() => setShowCreateModal(true)}
					>
						<Ionicons name='add' size={18} color='white' />
						<Text className='ml-2 text-sm font-semibold text-white'>
							Create Pot
						</Text>
					</TouchableOpacity>
				</View>

				{/* Summary Stats */}
				<View className='flex-row mb-4 space-x-4 gap-x-4'>
					<View className='flex-1 p-4 border border-blue-200 bg-blue-50 rounded-xl gap-x-4'>
						<View className='flex-row items-center mb-1'>
							<Ionicons name='wallet' size={16} color='#3B82F6' />
							<Text className='ml-2 text-sm font-medium text-blue-600'>
								Total Saved
							</Text>
						</View>
						<Text className='text-xl font-bold text-blue-900'>
							{formatCurrency(getTotalSavings())}
						</Text>
					</View>
					<View className='flex-1 p-4 border border-green-200 bg-green-50 rounded-xl'>
						<View className='flex-row items-center justify-between mb-1'>
							<View className='flex-row items-center'>
								<Ionicons name='trending-up' size={16} color='#10B981' />
								<Text className='ml-2 text-sm font-medium text-green-600'>
									Yield Earned
								</Text>
							</View>
							{globalAutoInvestEnabled &&
								showYieldBadge &&
								getAverageYield() > 0 && (
									<View className='px-2 py-1 bg-green-200 rounded-full'>
										<Text className='text-xs font-semibold text-green-800'>
											{getAverageYield().toFixed(1)}%
										</Text>
									</View>
								)}
						</View>
						<Text className='text-xl font-bold text-green-900'>
							{formatCurrency(getTotalYieldEarned())}
						</Text>
						{getAverageYield() > 0 && (
							<Text className='mt-1 text-sm text-green-700'>
								Avg {getAverageYield().toFixed(1)}% APY
							</Text>
						)}
					</View>
				</View>

				{/* Global Auto-Invest Toggle */}
				<View className='p-4 mb-4 border border-purple-200 bg-purple-50 rounded-xl'>
					<View className='flex-row items-center justify-between'>
						<View className='flex-row items-center flex-1'>
							<Ionicons name='rocket' size={20} color='#8B5CF6' />
							<View className='flex-1 ml-3'>
								<Text className='text-lg font-semibold text-purple-900'>
									Auto-Invest AI
								</Text>
								<Text className='text-sm text-purple-700'>
									{globalAutoInvestEnabled
										? 'AI managing investments across all pots'
										: 'Enable smart auto-investing for all pots'}
								</Text>
							</View>
						</View>
						<TouchableOpacity
							onPress={() => setGlobalAutoInvest(!globalAutoInvestEnabled)}
							className={`w-12 h-6 rounded-full transition-colors ${
								globalAutoInvestEnabled ? 'bg-purple-500' : 'bg-gray-300'
							}`}
						>
							<View
								className={`w-5 h-5 mt-0.5 bg-white rounded-full shadow-sm transition-transform ${
									globalAutoInvestEnabled ? 'ml-6' : 'ml-0.5'
								}`}
							/>
						</TouchableOpacity>
					</View>
				</View>

				{/* Search Bar */}
				<View className='relative mb-4'>
					<View className='flex-row items-center px-4 py-3 transition-colors bg-white border border-gray-300 rounded-xl focus-within:border-blue-500'>
						<Ionicons name='search' size={20} color='#9CA3AF' />
						<TextInput
							placeholder='Search savings pots...'
							value={searchQuery}
							onChangeText={setSearchQuery}
							className='flex-1 ml-3 text-base text-gray-900 outline-none'
							placeholderTextColor='#9CA3AF'
						/>
						{searchQuery.length > 0 && (
							<TouchableOpacity
								onPress={() => setSearchQuery('')}
								className='p-1'
							>
								<Ionicons name='close-circle' size={20} color='#9CA3AF' />
							</TouchableOpacity>
						)}
					</View>
				</View>

				{/* Category Filter */}
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ paddingRight: 16 }}
				>
					<TouchableOpacity
						className={`px-4 py-2 mr-2 rounded-full border transition-colors ${
							selectedCategory === null
								? 'bg-blue-500 border-blue-500'
								: 'bg-white border-gray-200 hover:border-gray-300'
						}`}
						onPress={() => setSelectedCategory(null)}
					>
						<Text
							className={`text-sm font-medium ${
								selectedCategory === null ? 'text-white' : 'text-gray-700'
							}`}
						>
							All
						</Text>
					</TouchableOpacity>
					{categoryOptions.map((option) => (
						<TouchableOpacity
							key={option.value}
							className={`px-4 py-2 mr-2 rounded-full border transition-colors ${
								selectedCategory === option.value
									? 'bg-blue-500 border-blue-500'
									: 'bg-white border-gray-200 hover:border-gray-300'
							}`}
							onPress={() => setSelectedCategory(option.value)}
						>
							<Text
								className={`text-sm font-medium ${
									selectedCategory === option.value
										? 'text-white'
										: 'text-gray-700'
								}`}
							>
								{option.label}
							</Text>
						</TouchableOpacity>
					))}
				</ScrollView>
			</View>

			{/* Savings Pots List */}
			<ScrollView
				className='flex-1 bg-gray-50'
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: 20,
					paddingHorizontal: 16,
					paddingTop: 16,
				}}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor='#3B82F6'
						colors={['#3B82F6']}
					/>
				}
			>
				{!isConnected && (
					<View className='p-4 mb-4 border border-yellow-200 bg-yellow-50 rounded-xl'>
						<View className='flex-row items-center'>
							<Ionicons name='wallet-outline' size={20} color='#F59E0B' />
							<Text className='ml-2 text-sm font-medium text-yellow-800'>
								Connect wallet to create and fund savings pots
							</Text>
						</View>
					</View>
				)}

				{filteredPots.length === 0 ? (
					<View className='items-center justify-center py-12 mb-8 bg-white rounded-xl'>
						<Ionicons name='wallet-outline' size={64} color='#D1D5DB' />
						<Text className='mt-4 text-lg font-medium text-gray-500'>
							{searchQuery || selectedCategory
								? 'No savings pots found'
								: 'No savings pots yet'}
						</Text>
						<Text className='mt-2 text-sm text-center text-gray-400'>
							{searchQuery || selectedCategory
								? 'Try adjusting your search or filters'
								: 'Create your first savings pot to start building wealth'}
						</Text>
						{!searchQuery && !selectedCategory && (
							<TouchableOpacity
								className='px-6 py-3 mt-4 bg-blue-600 rounded-lg'
								onPress={() => setShowCreateModal(true)}
							>
								<Text className='font-semibold text-white'>
									Create Your First Pot
								</Text>
							</TouchableOpacity>
						)}
					</View>
				) : (
					filteredPots.map(renderPotItem)
				)}
			</ScrollView>

			{/* Create Pot Modal */}
			<Modal
				visible={showCreateModal}
				transparent
				animationType='fade'
				onRequestClose={() => setShowCreateModal(false)}
			>
				<View
					className='justify-end flex-1 bg-black/50 web:justify-center web:items-center'
					style={{
						paddingTop: insets.top,
						paddingLeft: insets.left,
						paddingRight: insets.right,
					}}
				>
					<Pressable
						className='absolute inset-0'
						onPress={() => setShowCreateModal(false)}
					/>
					<View className='bg-white rounded-t-3xl web:rounded-3xl web:max-w-lg web:max-h-[90%] web:w-full web:mx-4 flex-1 web:flex-none'>
						<KeyboardAvoidingView
							behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
							className='flex-1'
						>
							<View className='flex-1'>
								<ScrollView
									className='flex-1 px-6 py-4'
									showsVerticalScrollIndicator={false}
									contentContainerStyle={{ paddingBottom: 20 }}
								>
									{/* Header */}
									<View className='flex-row items-center justify-between mb-6 web:pt-2'>
										<Text className='text-2xl font-bold text-gray-900'>
											Choose a Savings Goal
										</Text>
										<TouchableOpacity
											onPress={() => setShowCreateModal(false)}
											className='p-2 rounded-full hover:bg-gray-100'
										>
											<Ionicons name='close' size={24} color='#666' />
										</TouchableOpacity>
									</View>

									{/* Templates */}
									{potTemplates.map((template) => (
										<TouchableOpacity
											key={template.name}
											className='flex-row items-center p-4 mb-3 transition-colors bg-white border border-gray-200 hover:bg-gray-50 rounded-xl'
											onPress={() => handleCreateFromTemplate(template)}
										>
											<View
												className='items-center justify-center w-12 h-12 mr-4 rounded-full'
												style={{ backgroundColor: template.color + '20' }}
											>
												<Text className='text-2xl'>{template.icon}</Text>
											</View>
											<View className='flex-1'>
												<Text className='text-lg font-semibold text-gray-900'>
													{template.name}
												</Text>
												<Text
													className='text-sm text-gray-600'
													numberOfLines={2}
												>
													{template.description}
												</Text>
												<Text className='mt-1 text-sm font-medium text-green-600'>
													Target: {formatCurrency(template.targetAmount)}
												</Text>
											</View>
											<Ionicons
												name='chevron-forward'
												size={20}
												color='#9CA3AF'
											/>
										</TouchableOpacity>
									))}

									{/* Create Custom Button */}
									<TouchableOpacity
										className='flex-row items-center p-4 mb-3 transition-colors border-2 border-blue-300 border-dashed bg-blue-50 hover:bg-blue-100 rounded-xl'
										onPress={handleCreateCustom}
									>
										<View className='items-center justify-center w-12 h-12 mr-4 bg-blue-200 rounded-full'>
											<Ionicons name='add' size={24} color='#3B82F6' />
										</View>
										<View className='flex-1'>
											<Text className='text-lg font-semibold text-blue-900'>
												Create Custom Pot
											</Text>
											<Text className='text-sm text-blue-700'>
												Design your own savings goal with custom icon and target
											</Text>
										</View>
										<Ionicons
											name='chevron-forward'
											size={20}
											color='#3B82F6'
										/>
									</TouchableOpacity>
								</ScrollView>
							</View>
						</KeyboardAvoidingView>
					</View>
				</View>
			</Modal>

			{/* Custom Pot Creation Modal */}
			<Modal
				visible={showCustomModal}
				transparent
				animationType='fade'
				onRequestClose={handleCloseCustomModal}
			>
				<View
					className='justify-end flex-1 bg-black/50 web:justify-center web:items-center'
					style={{
						paddingTop: insets.top,
						paddingBottom: insets.bottom,
						paddingLeft: insets.left,
						paddingRight: insets.right,
					}}
				>
					<Pressable
						className='absolute inset-0'
						onPress={handleCloseCustomModal}
					/>
					<View className='bg-white rounded-t-3xl web:rounded-3xl web:max-w-lg web:max-h-[90%] web:w-full web:mx-4 flex-1 web:flex-none'>
						<KeyboardAvoidingView
							behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
							className='flex-1'
						>
							<View className='flex-1'>
								<ScrollView
									className='flex-1 px-6 py-4'
									showsVerticalScrollIndicator={false}
									contentContainerStyle={{ paddingBottom: 20 }}
								>
									{/* Header */}
									<View className='flex-row items-center justify-between mb-6 web:pt-2'>
										<Text className='text-2xl font-bold text-gray-900'>
											Create Custom Pot
										</Text>
										<TouchableOpacity
											onPress={handleCloseCustomModal}
											className='p-2 rounded-full hover:bg-gray-100'
										>
											<Ionicons name='close' size={24} color='#666' />
										</TouchableOpacity>
									</View>

									{/* Quick Suggestions */}
									<View className='mb-6'>
										<Text className='mb-3 text-lg font-semibold text-gray-900'>
											Popular Ideas
										</Text>
										<ScrollView
											horizontal
											showsHorizontalScrollIndicator={false}
										>
											{customPotSuggestions.map((suggestion) => (
												<TouchableOpacity
													key={suggestion.name}
													className='p-3 mr-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50'
													onPress={() => handleCustomSuggestion(suggestion)}
													style={{ width: 140 }}
												>
													<View
														className='items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full'
														style={{ backgroundColor: suggestion.color + '20' }}
													>
														<Text className='text-lg'>{suggestion.icon}</Text>
													</View>
													<Text
														className='text-sm font-medium text-center text-gray-900'
														numberOfLines={1}
													>
														{suggestion.name}
													</Text>
													<Text className='mt-1 text-xs text-center text-gray-600'>
														{formatCurrency(suggestion.target)}
													</Text>
												</TouchableOpacity>
											))}
										</ScrollView>
									</View>

									{/* Name Input */}
									<View className='mb-4'>
										<Text className='mb-2 text-lg font-semibold text-gray-900'>
											Pot Name *
										</Text>
										<TextInput
											placeholder='e.g., Wedding Ring, New Laptop...'
											value={customPotName}
											onChangeText={setCustomPotName}
											className='p-4 text-base border border-gray-300 outline-none rounded-xl focus:border-blue-500'
											placeholderTextColor='#9CA3AF'
										/>
									</View>

									{/* Description Input */}
									<View className='mb-4'>
										<Text className='mb-2 text-lg font-semibold text-gray-900'>
											Description (Optional)
										</Text>
										<TextInput
											placeholder='What are you saving for?'
											value={customPotDescription}
											onChangeText={setCustomPotDescription}
											multiline
											numberOfLines={2}
											className='p-4 text-base border border-gray-300 outline-none rounded-xl focus:border-blue-500'
											placeholderTextColor='#9CA3AF'
											textAlignVertical='top'
										/>
									</View>

									{/* Target Amount Input */}
									<View className='mb-4'>
										<Text className='mb-2 text-lg font-semibold text-gray-900'>
											Target Amount *
										</Text>
										<View className='flex-row items-center p-4 border border-gray-300 rounded-xl focus-within:border-blue-500'>
											<Text className='mr-3 text-xl font-bold text-blue-600'>
												$
											</Text>
											<TextInput
												placeholder='0.00'
												value={customPotTarget}
												onChangeText={setCustomPotTarget}
												keyboardType='decimal-pad'
												className='flex-1 text-xl font-semibold outline-none'
												placeholderTextColor='#9CA3AF'
											/>
											<Text className='ml-3 text-sm font-medium text-gray-500'>
												USD
											</Text>
										</View>
									</View>

									{/* Icon Selection */}
									<View className='mb-4'>
										<Text className='mb-3 text-lg font-semibold text-gray-900'>
											Choose Icon
										</Text>
										<View className='flex-row flex-wrap'>
											{potIcons.map((icon) => (
												<TouchableOpacity
													key={icon}
													className={`w-12 h-12 rounded-xl items-center justify-center mr-2 mb-2 border-2 ${
														customPotIcon === icon
															? 'border-blue-500 bg-blue-50'
															: 'border-gray-200 bg-white'
													}`}
													onPress={() => setCustomPotIcon(icon)}
												>
													<Text className='text-xl'>{icon}</Text>
												</TouchableOpacity>
											))}
										</View>
									</View>

									{/* Color Selection */}
									<View className='mb-6'>
										<Text className='mb-3 text-lg font-semibold text-gray-900'>
											Choose Color
										</Text>
										<View className='flex-row flex-wrap'>
											{potColors.map((color) => (
												<TouchableOpacity
													key={color}
													className={`w-12 h-12 rounded-xl mr-2 mb-2 border-4 ${
														customPotColor === color
															? 'border-gray-400'
															: 'border-gray-200'
													}`}
													style={{ backgroundColor: color }}
													onPress={() => setCustomPotColor(color)}
												>
													{customPotColor === color && (
														<View className='items-center justify-center flex-1'>
															<Ionicons
																name='checkmark'
																size={20}
																color='white'
															/>
														</View>
													)}
												</TouchableOpacity>
											))}
										</View>
									</View>

									{/* Pot Options Section */}
									<View className='mb-6'>
										<Text className='mb-4 text-lg font-semibold text-gray-900'>
											Pot Options
										</Text>

										{/* Strict Pot Toggle */}
										<View className='p-4 mb-4 border border-gray-200 rounded-xl'>
											<View className='flex-row items-center justify-between mb-2'>
												<View className='flex-1'>
													<Text className='text-base font-medium text-gray-900'>
														Strict Savings
													</Text>
													<Text className='text-sm text-gray-600'>
														Lock funds until a specific date
													</Text>
												</View>
												<TouchableOpacity
													className={`w-10 h-6 rounded-full transition-colors ${
														isStrictPot ? 'bg-red-500' : 'bg-gray-300'
													}`}
													onPress={() => setIsStrictPot(!isStrictPot)}
												>
													<View
														className={`w-4 h-4 mt-1 bg-white rounded-full shadow-sm transition-transform ${
															isStrictPot ? 'ml-5' : 'ml-1'
														}`}
													/>
												</TouchableOpacity>
											</View>

											{isStrictPot && (
												<View className='mt-3'>
													<Text className='mb-2 text-sm font-medium text-gray-700'>
														Deadline (Cannot withdraw before this date)
													</Text>
													<TouchableOpacity
														onPress={() => setShowDatePicker(true)}
														className='flex-row items-center justify-between p-3 border border-gray-300 rounded-lg focus:border-red-500'
													>
														<Text
															className={
																strictDeadline
																	? 'text-gray-900'
																	: 'text-gray-500'
															}
														>
															{strictDeadline
																? strictDeadline.toLocaleDateString()
																: 'Select deadline date'}
														</Text>
														<Ionicons
															name='calendar'
															size={20}
															color='#6B7280'
														/>
													</TouchableOpacity>

													{showDatePicker && (
														<DateTimePicker
															value={strictDeadline || new Date()}
															mode='date'
															display={
																Platform.OS === 'ios' ? 'spinner' : 'default'
															}
															onChange={handleDateChange}
															minimumDate={new Date()}
														/>
													)}
												</View>
											)}
										</View>

										{/* Joint Pot Toggle */}
										<View className='p-4 mb-4 border border-gray-200 rounded-xl'>
											<View className='flex-row items-center justify-between mb-2'>
												<View className='flex-1'>
													<Text className='text-base font-medium text-gray-900'>
														Joint Savings
													</Text>
													<Text className='text-sm text-gray-600'>
														Invite others to save together
													</Text>
												</View>
												<TouchableOpacity
													className={`w-10 h-6 rounded-full transition-colors ${
														isJointPot ? 'bg-blue-500' : 'bg-gray-300'
													}`}
													onPress={() => setIsJointPot(!isJointPot)}
												>
													<View
														className={`w-4 h-4 mt-1 bg-white rounded-full shadow-sm transition-transform ${
															isJointPot ? 'ml-5' : 'ml-1'
														}`}
													/>
												</TouchableOpacity>
											</View>

											{isJointPot && (
												<View className='mt-3'>
													<Text className='mb-2 text-sm font-medium text-gray-700'>
														Invite Collaborators
													</Text>
													<View className='relative'>
														<View className='flex-row mb-2'>
															<TextInput
																placeholder='Search by username...'
																value={currentInviteUsername}
																onChangeText={handleUserSearch}
																className='flex-1 p-3 border border-gray-300 rounded-lg focus:border-blue-500'
																placeholderTextColor='#9CA3AF'
															/>
															{isSearching && (
																<View className='absolute right-3 top-3'>
																	<ActivityIndicator
																		size='small'
																		color='#3B82F6'
																	/>
																</View>
															)}
														</View>

														{/* Search Results */}
														{searchResults.length > 0 && (
															<View className='mb-2 bg-white border border-gray-200 rounded-lg'>
																{searchResults.map((user) => (
																	<TouchableOpacity
																		key={user.id}
																		onPress={() => handleAddUserToPot(user)}
																		className='flex-row items-center p-3 border-b border-gray-100 last:border-b-0'
																	>
																		<View className='flex-1'>
																			<Text className='font-medium text-gray-900'>
																				@{user.username}
																			</Text>
																			<Text className='text-sm text-gray-600'>
																				{user.full_name}
																			</Text>
																		</View>
																		<Ionicons
																			name='add-circle'
																			size={20}
																			color='#3B82F6'
																		/>
																	</TouchableOpacity>
																))}
															</View>
														)}
													</View>

													{/* Invited Users */}
													{invitedUsers.length > 0 && (
														<View className='space-y-2'>
															<Text className='text-sm font-medium text-gray-700'>
																Invited Users ({invitedUsers.length})
															</Text>
															{invitedUsers.map((user) => (
																<View
																	key={user.id}
																	className='flex-row items-center justify-between p-2 rounded-lg bg-blue-50'
																>
																	<View>
																		<Text className='text-sm font-medium text-blue-800'>
																			@{user.username}
																		</Text>
																		<Text className='text-xs text-blue-600'>
																			{user.full_name}
																		</Text>
																	</View>
																	<TouchableOpacity
																		onPress={() =>
																			handleRemoveUserFromPot(user.id)
																		}
																		className='p-1'
																	>
																		<Ionicons
																			name='close-circle'
																			size={16}
																			color='#3B82F6'
																		/>
																	</TouchableOpacity>
																</View>
															))}
														</View>
													)}
												</View>
											)}
										</View>
									</View>

									{/* Preview */}
									{customPotName && (
										<View className='p-4 mb-6 border border-gray-200 bg-gray-50 rounded-xl'>
											<Text className='mb-2 text-sm font-medium text-gray-600'>
												Preview:
											</Text>
											<View className='flex-row items-center'>
												<View
													className='items-center justify-center w-12 h-12 mr-3 rounded-full'
													style={{ backgroundColor: customPotColor + '20' }}
												>
													<Text className='text-2xl'>{customPotIcon}</Text>
												</View>
												<View className='flex-1'>
													<Text className='text-lg font-semibold text-gray-900'>
														{customPotName}
													</Text>
													{customPotDescription && (
														<Text
															className='text-sm text-gray-600'
															numberOfLines={1}
														>
															{customPotDescription}
														</Text>
													)}
													{customPotTarget && (
														<Text className='mt-1 text-sm font-medium text-green-600'>
															Target:{' '}
															{formatCurrency(parseFloat(customPotTarget) || 0)}
														</Text>
													)}
												</View>
											</View>
										</View>
									)}

									{/* Create Button */}
									<TouchableOpacity
										className={`p-4 rounded-xl transition-colors ${
											customPotName.trim() &&
											customPotTarget &&
											parseFloat(customPotTarget) > 0
												? 'bg-blue-600 hover:bg-blue-700'
												: 'bg-gray-300'
										}`}
										onPress={handleCreateCustomPot}
										disabled={
											!customPotName.trim() ||
											!customPotTarget ||
											parseFloat(customPotTarget) <= 0
										}
									>
										<View className='flex-row items-center justify-center'>
											<Ionicons name='add' size={20} color='white' />
											<Text className='ml-2 text-lg font-semibold text-white'>
												Create Pot
											</Text>
										</View>
									</TouchableOpacity>
								</ScrollView>
							</View>
						</KeyboardAvoidingView>
					</View>
				</View>
			</Modal>

			{/* Pot Detail Modal */}
			<Modal
				visible={showPotDetailModal}
				transparent
				animationType='fade'
				onRequestClose={() => setShowPotDetailModal(false)}
			>
				<View
					className='justify-end flex-1 bg-black/50 web:justify-center web:items-center'
					style={{
						paddingTop: insets.top,
						paddingBottom: insets.bottom,
						paddingLeft: insets.left,
						paddingRight: insets.right,
					}}
				>
					<Pressable
						className='absolute inset-0'
						onPress={() => setShowPotDetailModal(false)}
					/>
					<View className='bg-white rounded-t-3xl web:rounded-3xl web:max-w-md web:max-h-[90%] web:w-full web:mx-4 flex-1 web:flex-none'>
						<KeyboardAvoidingView
							behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
							className='flex-1'
						>
							<View className='flex-1'>
								<ScrollView
									className='flex-1 px-6 py-4'
									showsVerticalScrollIndicator={false}
									contentContainerStyle={{ paddingBottom: 20 }}
								>
									{/* Header */}
									<View className='flex-row items-center justify-between mb-6 web:pt-2'>
										<Text className='text-2xl font-bold text-gray-900'>
											{selectedPot?.name}
										</Text>
										<TouchableOpacity
											onPress={() => setShowPotDetailModal(false)}
											className='p-2 rounded-full hover:bg-gray-100'
										>
											<Ionicons name='close' size={24} color='#666' />
										</TouchableOpacity>
									</View>

									{/* Pot Overview */}
									{selectedPot && (
										<View className='p-4 mb-6 border border-gray-200 bg-gray-50 rounded-xl'>
											<View className='flex-row items-center mb-3'>
												<View
													className='items-center justify-center w-12 h-12 mr-3 rounded-full'
													style={{ backgroundColor: selectedPot.color + '20' }}
												>
													<Text className='text-2xl'>{selectedPot.icon}</Text>
												</View>
												<View className='flex-1'>
													<Text className='text-lg font-semibold text-gray-900'>
														{selectedPot.name}
													</Text>
													{selectedPot.description && (
														<Text className='text-sm text-gray-600'>
															{selectedPot.description}
														</Text>
													)}
												</View>
											</View>

											{/* Progress */}
											<View className='mb-3'>
												<View className='h-2 overflow-hidden bg-gray-200 rounded-full'>
													<View
														className='h-full rounded-full'
														style={{
															backgroundColor: selectedPot.color,
															width: `${Math.min(getProgressPercentage(selectedPot.id), 100)}%`,
														}}
													/>
												</View>
											</View>

											<View className='flex-row items-center justify-between'>
												<View>
													<Text className='text-lg font-bold text-gray-900'>
														{formatCurrency(selectedPot.currentAmount)}
													</Text>
													<Text className='text-sm text-gray-600'>
														of {formatCurrency(selectedPot.targetAmount)}
													</Text>
												</View>
												<Text className='text-sm font-medium text-gray-700'>
													{getProgressPercentage(selectedPot.id).toFixed(1)}%
													complete
												</Text>
											</View>
										</View>
									)}

									{/* Pot Details */}
									<View className='mb-6'>
										<Text className='mb-3 text-lg font-semibold text-gray-900'>
											Details
										</Text>

										{/* Status Badges */}
										<View className='flex-row flex-wrap gap-2 mb-4'>
											{globalAutoInvestEnabled && (
												<View className='px-3 py-1 bg-purple-100 rounded-full'>
													<Text className='text-sm font-medium text-purple-600'>
														AI Auto-Invest Active
													</Text>
												</View>
											)}

											{selectedPot?.isYieldEnabled && selectedPot?.apy && (
												<View className='px-3 py-1 bg-green-100 rounded-full'>
													<Text className='text-sm font-medium text-green-600'>
														{selectedPot.apy.toFixed(1)}% APY
													</Text>
												</View>
											)}

											{selectedPot?.isStrict && (
												<View className='px-3 py-1 bg-red-100 rounded-full'>
													<Text className='text-sm font-medium text-red-600'>
														Strict Savings
													</Text>
												</View>
											)}

											{selectedPot?.isJoint && (
												<View className='px-3 py-1 bg-blue-100 rounded-full'>
													<Text className='text-sm font-medium text-blue-600'>
														Joint Pot
													</Text>
												</View>
											)}
										</View>

										{/* Strict Deadline */}
										{selectedPot?.isStrict && selectedPot?.strictDeadline && (
											<View className='p-3 mb-4 border border-red-200 rounded-lg bg-red-50'>
												<View className='flex-row items-center'>
													<Ionicons
														name='lock-closed'
														size={16}
														color='#EF4444'
													/>
													<Text className='ml-2 text-sm font-medium text-red-800'>
														Locked until{' '}
														{selectedPot.strictDeadline.toLocaleDateString()}
													</Text>
												</View>
												<Text className='mt-1 text-xs text-red-700'>
													Withdrawals are restricted until this date
												</Text>
											</View>
										)}

										{/* People Section */}
										<View className='mb-6'>
											<View className='flex-row items-center mb-3'>
												<Ionicons name='people' size={16} color='#3B82F6' />
												<Text className='ml-2 text-lg font-semibold text-gray-900'>
													People (
													{(selectedPot?.collaborators?.length || 0) + 1})
												</Text>
											</View>

											{/* Creator */}
											<View className='mb-3'>
												<View className='flex-row items-center p-3 bg-white border border-gray-200 rounded-lg'>
													<View
														className='items-center justify-center w-10 h-10 mr-3 rounded-full'
														style={{
															backgroundColor: getUserAvatar(
																walletAddress || 'you'
															).backgroundColor,
														}}
													>
														<Text className='font-semibold text-white'>
															{getUserAvatar(walletAddress || 'you').letter}
														</Text>
													</View>
													<View className='flex-1'>
														<Text className='font-medium text-gray-900'>
															You (Creator)
														</Text>
														<Text className='text-sm text-gray-600'>
															@{walletAddress?.slice(0, 8) || 'current_user'}
														</Text>
													</View>
													<View className='px-2 py-1 bg-blue-100 rounded-full'>
														<Text className='text-xs font-medium text-blue-600'>
															Owner
														</Text>
													</View>
												</View>
											</View>

											{/* Joint Pot Collaborators */}
											{selectedPot?.isJoint && (
												<>
													{selectedPot.collaborators &&
														selectedPot.collaborators.length > 0 && (
															<View className='mb-3'>
																<Text className='mb-2 text-sm font-medium text-gray-700'>
																	Collaborators
																</Text>
																{selectedPot.collaborators.map(
																	(collaborator, index) => (
																		<View
																			key={index}
																			className='flex-row items-center p-3 mb-2 bg-white border border-gray-200 rounded-lg'
																		>
																			<View
																				className='items-center justify-center w-10 h-10 mr-3 rounded-full'
																				style={{
																					backgroundColor:
																						getUserAvatar(collaborator)
																							.backgroundColor,
																				}}
																			>
																				<Text className='font-semibold text-white'>
																					{getUserAvatar(collaborator).letter}
																				</Text>
																			</View>
																			<View className='flex-1'>
																				<Text className='font-medium text-gray-900'>
																					@{collaborator}
																				</Text>
																				<Text className='text-sm text-gray-600'>
																					Collaborator
																				</Text>
																			</View>
																			<View className='px-2 py-1 bg-green-100 rounded-full'>
																				<Text className='text-xs font-medium text-green-600'>
																					Active
																				</Text>
																			</View>
																		</View>
																	)
																)}
															</View>
														)}

													{selectedPot.invitedUsers &&
														selectedPot.invitedUsers.length > 0 && (
															<View className='mb-3'>
																<Text className='mb-2 text-sm font-medium text-gray-700'>
																	Pending Invitations
																</Text>
																{selectedPot.invitedUsers.map(
																	(invited, index) => (
																		<View
																			key={index}
																			className='flex-row items-center p-3 mb-2 border border-gray-200 rounded-lg bg-gray-50'
																		>
																			<View
																				className='items-center justify-center w-10 h-10 mr-3 rounded-full'
																				style={{
																					backgroundColor:
																						getUserAvatar(invited)
																							.backgroundColor,
																				}}
																			>
																				<Text className='font-semibold text-white'>
																					{getUserAvatar(invited).letter}
																				</Text>
																			</View>
																			<View className='flex-1'>
																				<Text className='font-medium text-gray-900'>
																					@{invited}
																				</Text>
																				<Text className='text-sm text-gray-600'>
																					Invited
																				</Text>
																			</View>
																			<View className='px-2 py-1 bg-yellow-100 rounded-full'>
																				<Text className='text-xs font-medium text-yellow-600'>
																					Pending
																				</Text>
																			</View>
																		</View>
																	)
																)}
															</View>
														)}
												</>
											)}
										</View>
									</View>

									{/* Available Balance */}
									<View className='mb-6'>
										<Text className='mb-3 text-lg font-semibold text-gray-900'>
											Available Balance
										</Text>
										<View className='p-4 border border-green-200 bg-green-50 rounded-xl'>
											<Text className='text-2xl font-bold text-green-600'>
												{formatCurrency(availableBalance)}
											</Text>
											<Text className='mt-1 text-sm text-green-700'>
												USDC in your wallet
											</Text>
										</View>
									</View>

									{/* Add Funds Section */}
									<View className='mb-6'>
										<Text className='mb-3 text-lg font-semibold text-gray-900'>
											Add Funds
										</Text>
										<View className='flex-row items-center p-4 border-2 border-gray-300 rounded-xl focus-within:border-blue-500'>
											<Text className='mr-3 text-xl font-bold text-blue-600'>
												$
											</Text>
											<TextInput
												placeholder='0.00'
												value={fundAmount}
												onChangeText={setFundAmount}
												keyboardType='decimal-pad'
												className='flex-1 text-xl font-semibold outline-none'
												placeholderTextColor='#9CA3AF'
											/>
											<Text className='ml-3 text-sm font-medium text-gray-500'>
												USDC
											</Text>
										</View>
										{fundAmount &&
											parseFloat(fundAmount) > availableBalance && (
												<Text className='mt-2 text-sm text-red-600'>
													Insufficient balance. You have{' '}
													{formatCurrency(availableBalance)} available.
												</Text>
											)}
									</View>

									{/* Add Funds Button */}
									<TouchableOpacity
										className={`p-4 rounded-xl transition-colors ${
											fundAmount &&
											parseFloat(fundAmount) > 0 &&
											parseFloat(fundAmount) <= availableBalance
												? 'bg-blue-600 hover:bg-blue-700'
												: 'bg-gray-300'
										}`}
										onPress={handleAddFunds}
										disabled={
											!fundAmount ||
											parseFloat(fundAmount) <= 0 ||
											parseFloat(fundAmount) > availableBalance
										}
									>
										<View className='flex-row items-center justify-center'>
											<Ionicons name='add' size={20} color='white' />
											<Text className='ml-2 text-lg font-semibold text-white'>
												Add {fundAmount ? `$${fundAmount}` : 'Funds'}
											</Text>
										</View>
									</TouchableOpacity>
								</ScrollView>
							</View>
						</KeyboardAvoidingView>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}
