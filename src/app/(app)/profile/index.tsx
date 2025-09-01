import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	Switch,
	Alert,
	ActivityIndicator,
	RefreshControl,
	TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { dynamicClient } from '@/lib/client';
import { useWalletStore } from '@/stores/walletStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { UserProfileService } from '@/services/userProfileService';
import { AvatarService } from '@/services/avatarService';
import {
	TransactionService,
	TransactionWithUsers,
} from '@/services/transactionService';
import { useBalanceStore } from '@/stores/balanceStore';
import { router } from 'expo-router';

// Types imported from services

// Default avatar

export default function ProfileScreen() {
	// Dynamic client and wallet state
	const { auth } = useReactiveClient(dynamicClient);
	const { address: walletAddress, isConnected } = useWalletStore();

	// User profile state
	const {
		currentProfile,
		setCurrentProfile,
		isLoading: profileLoading,
		error,
		loadProfileByWallet,
		clearProfile,
	} = useUserProfileStore();

	// Balance state
	const { getBalance, isLoading: balanceLoading } = useBalanceStore();
	const currentBalance = walletAddress
		? getBalance(walletAddress, 'usdc')?.formatted
		: null;

	// Privacy & Settings States
	const [profileVisible, setProfileVisible] = useState(false);
	const [portfolioVisible, setPortfolioVisible] = useState(false);
	const [darkMode, setDarkMode] = useState(false);
	const [notifications, setNotifications] = useState(true);
	const [biometric, setBiometric] = useState(true);
	const [autoSplit, setAutoSplit] = useState(true);

	// Loading states
	const [refreshing, setRefreshing] = useState(false);

	// Editable profile state
	const [editableProfile, setEditableProfile] = useState({
		full_name: '',
		username: '',
		email: '',
		bio: '',
	});
	const [isSavingProfile, setIsSavingProfile] = useState(false);
	const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

	// Dynamic data states
	const [transactions, setTransactions] = useState<TransactionWithUsers[]>([]);
	const [stats, setStats] = useState({
		totalTransactions: 0,
		totalReceived: 0,
		totalSent: 0,
		thisMonth: 0,
	});
	const [isLoadingData, setIsLoadingData] = useState(false);

	// Load profile data when wallet is connected - but only if we don't have a profile already
	useEffect(() => {
		if (walletAddress && isConnected && !currentProfile) {
			// Only load existing profile, don't try to create one
			// Profile creation should happen in the root authentication flow
			loadProfileByWallet(walletAddress);
		} else if (!walletAddress || !isConnected) {
			clearProfile();
		}
	}, [walletAddress, isConnected, currentProfile]);

	// Initialize editable profile when current profile changes
	useEffect(() => {
		if (currentProfile) {
			setEditableProfile({
				full_name: currentProfile.full_name || '',
				username: currentProfile.username || '',
				email: currentProfile.email || '',
				bio: currentProfile.bio || '',
			});
			// Load dynamic data when profile is available
			loadDynamicData();
		}
	}, [currentProfile]);

	// Load dynamic data (transactions and stats)
	const loadDynamicData = async () => {
		if (!currentProfile?.id) return;

		setIsLoadingData(true);
		try {
			console.log('📊 Loading dynamic profile data...');

			// Load recent transactions
			const userTransactions = await TransactionService.getUserTransactions(10);
			console.log('✅ Loaded transactions:', userTransactions.length);

			setTransactions(userTransactions);

			// Calculate stats from transactions
			const now = new Date();
			const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

			const totalTransactions = userTransactions.length;
			let totalReceived = 0;
			let totalSent = 0;
			let thisMonthAmount = 0;

			userTransactions.forEach((tx: any) => {
				const amount =
					typeof tx.amount === 'string'
						? parseFloat(tx.amount)
						: tx.amount || 0;
				const txDate = new Date(tx.created_at);

				if (tx.to_user_id === currentProfile.id) {
					totalReceived += amount;
				} else {
					totalSent += amount;
				}

				if (txDate >= thisMonth) {
					if (tx.to_user_id === currentProfile.id) {
						thisMonthAmount += amount;
					}
				}
			});

			setStats({
				totalTransactions,
				totalReceived,
				totalSent,
				thisMonth: thisMonthAmount,
			});

			console.log('📈 Profile stats calculated:', {
				totalTransactions,
				totalReceived,
				totalSent,
				thisMonth: thisMonthAmount,
			});
		} catch (error) {
			console.error('❌ Error loading dynamic data:', error);
		} finally {
			setIsLoadingData(false);
		}
	};

	// Handle pull-to-refresh
	const onRefresh = async () => {
		setRefreshing(true);
		try {
			if (walletAddress) {
				await loadProfileByWallet(walletAddress);
			}
			// Also reload dynamic data
			await loadDynamicData();
		} catch (error) {
			console.error('Error refreshing profile:', error);
		} finally {
			setRefreshing(false);
		}
	};

	const handleEditProfile = () => {
		Alert.alert('Edit Profile', 'Opening profile editor...');
	};

	const handleShareProfile = () => {
		Alert.alert('Share Profile', 'Sharing profile link...');
	};

	const handleQRCode = () => {
		Alert.alert('QR Code', 'Opening QR code for payments...');
	};

	const handlePrivacySettings = () => {
		Alert.alert('Privacy Settings', 'Opening privacy controls...');
	};

	const handleExportData = () => {
		Alert.alert('Export Data', 'Preparing your data export...');
	};

	const handleSupport = () => {
		Alert.alert('Contact Support', 'Opening support chat...');
	};

	const handleLogout = async () => {
		try {
			// Clear profile and wallet state first
			clearProfile();
			useWalletStore.getState().reset();

			// Logout from Dynamic (handle async properly)
			if (auth.authenticatedUser) {
				await auth.logout();
			}

			// Navigate to login screen
			router.replace('/login');
		} catch (error) {
			console.error('Logout error:', error);
			// Still clear local state and redirect even if logout fails
			clearProfile();
			useWalletStore.getState().reset();
			router.replace('/login');
		}
	};

	// Handle profile save
	const handleSaveProfile = async () => {
		if (!currentProfile?.id) {
			Alert.alert('Error', 'Profile not found. Please try again.');
			return;
		}

		// Basic validation
		if (!editableProfile.full_name.trim()) {
			Alert.alert('Validation Error', 'Full name is required.');
			return;
		}

		if (!editableProfile.username.trim()) {
			Alert.alert('Validation Error', 'Username is required.');
			return;
		}

		if (!editableProfile.email.trim()) {
			Alert.alert('Validation Error', 'Email is required.');
			return;
		}

		if (!/\S+@\S+\.\S+/.test(editableProfile.email)) {
			Alert.alert('Validation Error', 'Please enter a valid email address.');
			return;
		}

		setIsSavingProfile(true);
		try {
			const updatedProfile = await UserProfileService.updateProfile(
				String(currentProfile.id),
				{
					full_name: editableProfile.full_name.trim(),
					username: editableProfile.username.trim(),
					email: editableProfile.email.trim(),
					bio: editableProfile.bio.trim() || null,
				}
			);

			if (updatedProfile) {
				setCurrentProfile(updatedProfile);
				Alert.alert('Success', 'Profile updated successfully!');
			} else {
				Alert.alert('Error', 'Failed to update profile. Please try again.');
			}
		} catch (error) {
			console.error('Error updating profile:', error);
			Alert.alert('Error', 'Failed to update profile. Please try again.');
		} finally {
			setIsSavingProfile(false);
		}
	};

	// Handle avatar upload
	const handleAvatarPress = async () => {
		if (!currentProfile?.id) return;

		Alert.alert('Update Avatar', 'Choose how you want to update your avatar', [
			{ text: 'Camera', onPress: () => uploadAvatar(true) },
			{ text: 'Photo Library', onPress: () => uploadAvatar(false) },
			{ text: 'Cancel', style: 'cancel' },
		]);
	};

	const uploadAvatar = async (fromCamera: boolean) => {
		if (!currentProfile?.id) return;

		setIsUploadingAvatar(true);
		try {
			console.log('📸 Starting avatar upload process...');
			const avatarUrl = await AvatarService.selectAndUploadAvatar(
				currentProfile.id,
				fromCamera
			);

			if (avatarUrl) {
				console.log('✅ Avatar uploaded successfully:', avatarUrl);

				// Update the profile in database immediately
				try {
					const updatedProfile = await UserProfileService.updateProfile(
						String(currentProfile.id),
						{
							avatar_url: avatarUrl,
						}
					);

					if (updatedProfile) {
						setCurrentProfile(updatedProfile);
						Alert.alert('Success', 'Avatar updated successfully!');
					} else {
						Alert.alert(
							'Warning',
							'Avatar uploaded but profile update failed. Please save your settings to sync.'
						);
					}
				} catch (profileError) {
					console.error(
						'Error updating profile with new avatar:',
						profileError
					);
					Alert.alert(
						'Warning',
						'Avatar uploaded but profile update failed. Please save your settings to sync.'
					);
				}
			} else {
				console.log('❌ Avatar upload returned null - user may have cancelled');
			}
		} catch (error) {
			console.error('💥 Error uploading avatar:', error);

			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to upload avatar. Please try again.';

			Alert.alert('Upload Error', errorMessage);
		} finally {
			setIsUploadingAvatar(false);
		}
	};

	// Get cache-busted avatar URL
	const getCacheBustedAvatarUrl = () => {
		if (currentProfile?.avatar_url && currentProfile.avatar_url.trim()) {
			const cleanUrl = currentProfile.avatar_url.split('?')[0];
			return `${cleanUrl}?v=${currentProfile?.updated_at || Date.now()}`;
		}
		return AvatarService.getAvatarUrl({
			avatar_url: currentProfile?.avatar_url,
			username: currentProfile?.username || userData.username || 'user',
		});
	};

	// Get user data from profile or fallback to Dynamic auth
	const userData = currentProfile
		? {
				fullName: currentProfile.full_name || 'User',
				email: currentProfile.email,
				avatarUrl: currentProfile.avatar_url,
				username: currentProfile.username,
			}
		: auth.authenticatedUser
			? {
					fullName:
						auth.authenticatedUser.firstName +
							' ' +
							auth.authenticatedUser.lastName || 'User',
					email: auth.authenticatedUser.email || 'Not provided',
					username: auth.authenticatedUser.username || 'user',
				}
			: {
					fullName: 'Guest User',
					email: 'Not signed in',
					username: 'guest',
				};

	// Get dynamic user stats
	const userStats = {
		totalTransactions: stats.totalTransactions,
		activeGroups:
			transactions.length > 0 ? Math.ceil(transactions.length / 5) : 0, // Estimated active groups
		friendsConnected: new Set(
			transactions.map((tx) =>
				tx.to_user_id === currentProfile?.id ? tx.from_user_id : tx.to_user_id
			)
		).size, // Unique users interacted with
		portfolioValue: currentBalance ? parseFloat(currentBalance) : 0, // Current balance
		monthlyActivity: stats.thisMonth,
		totalSent: stats.totalSent,
		totalReceived: stats.totalReceived,
	};

	// Show loading state
	if (profileLoading) {
		return (
			<SafeAreaView className='flex-1 bg-gray-50'>
				<View className='items-center justify-center flex-1'>
					<ActivityIndicator size='large' color='#3D5AFE' />
					<Text className='mt-4 text-lg text-gray-600'>Loading profile...</Text>
				</View>
			</SafeAreaView>
		);
	}

	// Show error state
	if (error) {
		return (
			<SafeAreaView className='flex-1 bg-gray-50'>
				<View className='items-center justify-center flex-1 px-6'>
					<Ionicons name='alert-circle' size={48} color='#EF4444' />
					<Text className='mt-4 text-lg font-semibold text-gray-900'>
						Error Loading Profile
					</Text>
					<Text className='mt-2 text-center text-gray-600'>{error}</Text>
					<TouchableOpacity
						className='px-6 py-3 mt-4 bg-blue-600 rounded-xl'
						onPress={onRefresh}
					>
						<Text className='font-semibold text-white'>Retry</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className='flex-1 bg-gray-50'>
			<ScrollView
				className='flex-1 px-6 py-6'
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor='#3D5AFE'
						colors={['#3D5AFE']}
					/>
				}
			>
				{/* User Identity Section */}
				<View className='p-8 mb-6 bg-white shadow-sm rounded-2xl'>
					<View className='items-center mb-6'>
						{/* Profile Photo */}
						<View className='flex-row items-center justify-center mb-8'>
							<View className='w-32 h-32 rounded-full'>
								<Image
									source={{
										uri:
											userData.avatarUrl ||
											`https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${userData.username}`,
									}}
									style={{
										width: '100%',
										height: '100%',
										borderRadius: 128,
										backgroundColor: '#E0E0E0',
									}}
									contentFit='cover'
								/>
							</View>
						</View>

						{/* Name and Username */}
						<View className='items-center mb-4'>
							<View className='flex-row items-center mb-1'>
								<Text className='mr-2 text-2xl font-bold text-gray-900'>
									{userData.fullName}
								</Text>
								<View className='flex-row items-center'>
									{currentProfile && (
										<Ionicons
											name='checkmark-circle'
											size={20}
											color='#00C896'
											className='mr-2'
										/>
									)}
									<Ionicons name='qr-code' size={20} color='#00C896' />
								</View>
							</View>
							<Text className='text-base font-medium text-blue-600'>
								@{userData.username}
							</Text>
							<Text className='mt-1 text-sm text-gray-600'>
								{userData.email}
							</Text>
							{/* fix phone number */}
							{/* <Text className='mt-1 text-sm text-gray-500'>
								{userData?.phone ?? 'Not provided'}
							</Text> */}
						</View>
					</View>
				</View>

				{/* Cards Container - Responsive Layout */}
				<View className='flex-row gap-4 px-4 mb-6'>
					{/* SuperPay Card Section */}
					<View className='flex-1 w-1/2 mb-6 md:mb-8'>
						<View
							className='relative mx-auto md:max-w-md lg:max-w-lg'
							style={{
								width: '100%',
								maxWidth: 400,
								aspectRatio: 340 / 214,
							}}
						>
							{/* Card Container */}
							<LinearGradient
								colors={['#1e1b4b', '#3730a3', '#4338ca']}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={{
									width: '100%',
									aspectRatio: 340 / 214,
									borderRadius: 16,
									padding: 24,
									shadowColor: '#000',
									shadowOffset: { width: 0, height: 12 },
									shadowOpacity: 0.4,
									shadowRadius: 16,
									elevation: 16,
								}}
							>
								{/* Card Background Patterns */}
								<View
									style={{
										position: 'absolute',
										top: -20,
										right: -20,
										width: 80,
										height: 80,
										borderRadius: 40,
										backgroundColor: 'rgba(255, 255, 255, 0.08)',
									}}
								/>
								<View
									style={{
										position: 'absolute',
										bottom: -30,
										left: -30,
										width: 100,
										height: 100,
										borderRadius: 50,
										backgroundColor: 'rgba(255, 255, 255, 0.05)',
									}}
								/>
								<View
									style={{
										position: 'absolute',
										top: 50,
										right: 40,
										width: 40,
										height: 40,
										borderRadius: 20,
										backgroundColor: 'rgba(255, 255, 255, 0.06)',
									}}
								/>

								{/* Card Header */}
								<View
									style={{
										flexDirection: 'row',
										justifyContent: 'space-between',
										alignItems: 'flex-start',
										marginBottom: 32,
									}}
								>
									<View>
										<Text
											style={{
												color: '#ffffff',
												fontSize: 16,
												fontWeight: '600',
												opacity: 0.95,
											}}
										>
											SuperPay
										</Text>
										<Text
											style={{
												color: '#ffffff',
												fontSize: 12,
												opacity: 0.75,
												marginTop: 2,
											}}
										>
											Premium Wallet
										</Text>
									</View>
									<View
										style={{
											backgroundColor: 'rgba(255, 255, 255, 0.25)',
											borderRadius: 8,
											paddingHorizontal: 12,
											paddingVertical: 6,
											borderWidth: 1,
											borderColor: 'rgba(255, 255, 255, 0.3)',
										}}
									>
										<Text
											style={{
												color: '#ffffff',
												fontSize: 14,
												fontWeight: '700',
												letterSpacing: 1,
											}}
										>
											VISA
										</Text>
									</View>
								</View>

								{/* Card Number */}
								<View style={{ marginBottom: 24 }}>
									<Text
										style={{
											color: '#ffffff',
											fontSize: 22,
											fontFamily: 'monospace',
											letterSpacing: 4,
											fontWeight: '500',
										}}
									>
										•••• •••• •••• ••••
									</Text>
								</View>

								{/* Card Details */}
								<View
									style={{
										flexDirection: 'row',
										justifyContent: 'space-between',
										alignItems: 'flex-end',
									}}
								>
									<View style={{ flex: 1 }}>
										<Text
											style={{
												color: '#ffffff',
												fontSize: 10,
												opacity: 0.7,
												marginBottom: 4,
												letterSpacing: 0.5,
											}}
										>
											CARDHOLDER NAME
										</Text>
										<Text
											style={{
												color: '#ffffff',
												fontSize: 14,
												fontWeight: '600',
											}}
											numberOfLines={1}
										>
											{userData.fullName.toUpperCase()}
										</Text>
									</View>
									<View style={{ alignItems: 'flex-end' }}>
										<Text
											style={{
												color: '#ffffff',
												fontSize: 10,
												opacity: 0.7,
												marginBottom: 4,
												letterSpacing: 0.5,
											}}
										>
											VALID THRU
										</Text>
										<Text
											style={{
												color: '#ffffff',
												fontSize: 14,
												fontWeight: '600',
												fontFamily: 'monospace',
											}}
										>
											••/••
										</Text>
									</View>
								</View>

								{/* Coming Soon Overlay */}
								<View
									style={{
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										bottom: 0,
										backgroundColor: 'rgba(0, 0, 0, 0.6)',
										borderRadius: 16,
										justifyContent: 'center',
										alignItems: 'center',
									}}
								>
									<View
										style={{
											backgroundColor: 'rgba(255, 255, 255, 0.15)',
											borderRadius: 16,
											paddingHorizontal: 32,
											paddingVertical: 16,
											borderWidth: 1,
											borderColor: 'rgba(255, 255, 255, 0.2)',
										}}
									>
										<Text
											style={{
												color: '#ffffff',
												fontSize: 20,
												fontWeight: '700',
												textAlign: 'center',
											}}
										>
											Coming Soon
										</Text>
										<Text
											style={{
												color: '#ffffff',
												fontSize: 14,
												opacity: 0.9,
												textAlign: 'center',
												marginTop: 4,
											}}
										>
											Physical & Virtual Cards
										</Text>
									</View>
								</View>
							</LinearGradient>
						</View>
					</View>
					{/* Activity Card - Left Side */}
					<View className='flex-1 w-1/2 mb-6 lg:mb-0'>
						<LinearGradient
							colors={['#3D5AFE', '#00C896']}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							style={{
								padding: 20,
								borderRadius: 16,
								height: '100%',
							}}
							className='md:p-6'
						>
							<View className='flex-row items-center justify-between mb-6'>
								<View>
									<Text
										style={{ color: 'rgba(255, 255, 255, 0.95)' }}
										className='text-xl font-semibold'
									>
										Your Activity
									</Text>
									<Text
										style={{ color: 'rgba(255, 255, 255, 0.8)' }}
										className='text-sm'
									>
										This month's overview
									</Text>
								</View>
								<TouchableOpacity
									onPress={() => setPortfolioVisible(!portfolioVisible)}
								>
									<Ionicons
										name={portfolioVisible ? 'eye' : 'eye-off'}
										size={24}
										color='white'
									/>
								</TouchableOpacity>
							</View>

							{/* Stats Grid */}
							<View className='space-y-4'>
								<View className='flex-row justify-between'>
									<View
										className='flex-1 p-3 mr-2 rounded-xl'
										style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
									>
										<Text className='text-xl font-bold text-white'>
											{userStats.totalTransactions}
										</Text>
										<Text
											style={{ color: 'rgba(255, 255, 255, 0.9)' }}
											className='text-sm'
										>
											Transactions
										</Text>
									</View>
									<View
										className='flex-1 p-3 ml-2 rounded-xl'
										style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
									>
										<Text className='text-xl font-bold text-white'>
											{userStats.activeGroups}
										</Text>
										<Text
											style={{ color: 'rgba(255, 255, 255, 0.9)' }}
											className='text-sm'
										>
											Active Groups
										</Text>
									</View>
								</View>
								<View className='flex-row justify-between'>
									<View
										className='flex-1 p-3 mr-2 rounded-xl'
										style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
									>
										<Text className='text-xl font-bold text-white'>
											{userStats.friendsConnected}
										</Text>
										<Text
											style={{ color: 'rgba(255, 255, 255, 0.9)' }}
											className='text-sm'
										>
											Friends
										</Text>
									</View>
									<View
										className='flex-1 p-3 ml-2 rounded-xl'
										style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
									>
										<Text className='text-xl font-bold text-white'>
											{portfolioVisible
												? `$${userStats.portfolioValue.toLocaleString()}`
												: '•••••'}
										</Text>
										<Text
											style={{ color: 'rgba(255, 255, 255, 0.9)' }}
											className='text-sm'
										>
											Portfolio Value
										</Text>
									</View>
								</View>
							</View>
						</LinearGradient>
					</View>
				</View>

				<View className='flex-col mb-6 lg:flex-row lg:gap-8 lg:items-start'>
					{/* Profile Information - Right Side */}
					<View className='flex-1'>
						<View className='p-6 bg-white shadow-sm rounded-2xl md:p-8'>
							<Text className='mb-6 text-xl font-semibold text-gray-900 md:text-2xl md:text-center'>
								Profile Information
							</Text>

							{/* Avatar Section */}
							<View className='items-center mb-6'>
								<View className='relative mb-4'>
									<Image
										source={{ uri: getCacheBustedAvatarUrl() }}
										style={{
											width: 100,
											height: 100,
											borderRadius: 50,
											backgroundColor: '#f3f4f6',
										}}
										contentFit='cover'
									/>
									<TouchableOpacity
										className='absolute bottom-0 right-0 items-center justify-center w-8 h-8 bg-blue-600 border-white rounded-full border-3'
										onPress={handleAvatarPress}
										disabled={isUploadingAvatar}
									>
										{isUploadingAvatar ? (
											<ActivityIndicator size='small' color='white' />
										) : (
											<Ionicons name='camera' size={16} color='white' />
										)}
									</TouchableOpacity>
								</View>
								<Text className='text-sm text-center text-gray-600'>
									Tap to update your profile photo
								</Text>
							</View>

							{/* Profile Form */}
							<View className='space-y-4'>
								{/* Full Name */}
								<View className='mb-4'>
									<Text className='mb-2 text-sm font-medium text-gray-700'>
										Full Name
									</Text>
									<TextInput
										className='w-full p-3 border border-gray-300 rounded-lg bg-gray-50'
										value={editableProfile.full_name}
										onChangeText={(value) =>
											setEditableProfile({
												...editableProfile,
												full_name: value,
											})
										}
										placeholder='Enter your full name'
										placeholderTextColor='#9ca3af'
									/>
								</View>

								{/* Username */}
								<View className='mb-4'>
									<Text className='mb-2 text-sm font-medium text-gray-700'>
										Username
									</Text>
									<TextInput
										className='w-full p-3 border border-gray-300 rounded-lg bg-gray-50'
										value={editableProfile.username}
										onChangeText={(value) =>
											setEditableProfile({
												...editableProfile,
												username: value,
											})
										}
										placeholder='Enter your username'
										placeholderTextColor='#9ca3af'
										autoCapitalize='none'
									/>
								</View>

								{/* Email */}
								<View className='mb-4'>
									<Text className='mb-2 text-sm font-medium text-gray-700'>
										Email
									</Text>
									<TextInput
										className='w-full p-3 border border-gray-300 rounded-lg bg-gray-50'
										value={editableProfile.email}
										onChangeText={(value) =>
											setEditableProfile({
												...editableProfile,
												email: value,
											})
										}
										placeholder='Enter your email'
										placeholderTextColor='#9ca3af'
										keyboardType='email-address'
										autoCapitalize='none'
									/>
								</View>

								{/* Bio */}
								<View className='mb-4'>
									<Text className='mb-2 text-sm font-medium text-gray-700'>
										Bio
									</Text>
									<TextInput
										className='w-full p-3 border border-gray-300 rounded-lg bg-gray-50'
										value={editableProfile.bio}
										onChangeText={(value) =>
											setEditableProfile({
												...editableProfile,
												bio: value,
											})
										}
										placeholder='Tell us about yourself...'
										placeholderTextColor='#9ca3af'
										multiline
										numberOfLines={3}
										textAlignVertical='top'
										style={{ minHeight: 80 }}
									/>
								</View>

								{/* Save Button */}
								<TouchableOpacity
									className={`flex-row items-center justify-center w-full p-4 mt-6 rounded-lg ${
										isSavingProfile ? 'bg-gray-400' : 'bg-blue-600'
									}`}
									onPress={handleSaveProfile}
									disabled={isSavingProfile}
								>
									{isSavingProfile ? (
										<ActivityIndicator size='small' color='white' />
									) : (
										<Ionicons name='checkmark-circle' size={20} color='white' />
									)}
									<Text className='ml-2 text-base font-semibold text-white'>
										{isSavingProfile ? 'Saving...' : 'Save Profile'}
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</View>

				{/* Logout Button */}
				<View className='md:max-w-4xl md:mx-auto'>
					<TouchableOpacity
						className='flex-row items-center justify-center p-6 mb-24 shadow-lg bg-gradient-to-r from-red-500 to-red-600 rounded-2xl'
						onPress={handleLogout}
					>
						<Ionicons name='log-out' size={24} color='white' />
						<Text className='ml-3 text-xl font-semibold text-white'>
							Sign Out
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
