import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	Switch,
	Alert,
	ActivityIndicator,
	RefreshControl,
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
import { router } from 'expo-router';

// Default avatar

export default function ProfileScreen() {
	// Dynamic client and wallet state
	const { auth } = useReactiveClient(dynamicClient);
	const { address: walletAddress, isConnected } = useWalletStore();

	// User profile state
	const {
		currentProfile,
		isLoading: profileLoading,
		error,
		loadProfileByWallet,
		clearProfile,
	} = useUserProfileStore();

	// Privacy & Settings States
	const [profileVisible, setProfileVisible] = useState(false);
	const [portfolioVisible, setPortfolioVisible] = useState(false);
	const [darkMode, setDarkMode] = useState(false);
	const [notifications, setNotifications] = useState(true);
	const [biometric, setBiometric] = useState(true);
	const [autoSplit, setAutoSplit] = useState(true);

	// Loading states
	const [refreshing, setRefreshing] = useState(false);

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

	// Handle pull-to-refresh
	const onRefresh = async () => {
		setRefreshing(true);
		if (walletAddress) {
			await loadProfileByWallet(walletAddress);
		}
		setRefreshing(false);
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

	// Get user stats (simplified - will aggregate from transactions later)
	const userStats = {
		totalTransactions: 0, // Will aggregate from transactions table
		activeGroups: 0, // Not implemented yet
		friendsConnected: 0, // Not using contacts anymore
		portfolioValue: 0, // Will calculate from balance store
		monthlyActivity: 0, // Will calculate from recent transactions
		totalSent: 0, // Will aggregate from transactions
		totalReceived: 0, // Will aggregate from transactions
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

				{/* Quick Stats Card */}
				<LinearGradient
					colors={['#3D5AFE', '#00C896']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					style={{
						padding: 16,
						borderRadius: 16,
						marginBottom: 24,
					}}
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

					<View>
						<View className='flex-row justify-between mb-4'>
							<View
								className='flex-1 p-4 mr-2 rounded-xl'
								style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
							>
								<Text className='text-2xl font-bold text-white'>
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
								className='flex-1 p-4 ml-2 rounded-xl'
								style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
							>
								<Text className='text-2xl font-bold text-white'>
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
								className='flex-1 p-4 mr-2 rounded-xl'
								style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
							>
								<Text className='text-2xl font-bold text-white'>
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
								className='flex-1 p-4 ml-2 rounded-xl'
								style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
							>
								<Text className='text-2xl font-bold text-white'>
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

				{/* Primary Actions Section */}
				<View className='p-8 mb-6 bg-white shadow-sm rounded-2xl'>
					<Text className='mb-6 text-xl font-semibold text-gray-900'>
						Quick Actions
					</Text>
					<View>
						<View className='flex-row justify-between mb-4'>
							<TouchableOpacity
								className='flex-row items-center flex-1 p-4 mr-2 bg-gray-50 rounded-xl'
								onPress={handleEditProfile}
							>
								<Ionicons name='person-circle' size={24} color='#3D5AFE' />
								<Text className='flex-1 ml-2 text-sm font-medium text-gray-700'>
									Edit Profile
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								className='flex-row items-center flex-1 p-4 ml-2 bg-gray-50 rounded-xl'
								onPress={handleShareProfile}
							>
								<Ionicons name='share' size={24} color='#3D5AFE' />
								<Text className='flex-1 ml-2 text-sm font-medium text-gray-700'>
									Share Profile
								</Text>
							</TouchableOpacity>
						</View>
						<View className='flex-row justify-between'>
							<TouchableOpacity
								className='flex-row items-center flex-1 p-4 mr-2 bg-gray-50 rounded-xl'
								onPress={handleQRCode}
							>
								<Ionicons name='qr-code' size={24} color='#3D5AFE' />
								<Text className='flex-1 ml-2 text-sm font-medium text-gray-700'>
									Generate QR
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								className='flex-row items-center flex-1 p-4 ml-2 bg-gray-50 rounded-xl'
								onPress={handlePrivacySettings}
							>
								<Ionicons name='shield-checkmark' size={24} color='#3D5AFE' />
								<Text className='flex-1 ml-2 text-sm font-medium text-gray-700'>
									Privacy
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>

				{/* Account Management */}
				<View className='p-8 mb-6 bg-white shadow-sm rounded-2xl'>
					<Text className='mb-6 text-xl font-semibold text-gray-900'>
						Account Management
					</Text>
					<View className='space-y-2'>
						{[
							{
								icon: 'wallet',
								title: 'USDC Balance',
								subtitle: '$2,847.50',
							},
							{
								icon: 'card',
								title: 'Payment Methods',
								subtitle: '2 linked accounts',
							},
							{
								icon: 'shield-checkmark',
								title: 'Security Settings',
								subtitle: 'Magic.link enabled',
							},
							{
								icon: 'logo-google',
								title: 'Connected Accounts',
								subtitle: '3 social accounts',
							},
							{
								icon: 'document-text',
								title: 'Export Data',
								subtitle: 'Download statements',
								action: handleExportData,
							},
							{
								icon: 'checkmark-circle',
								title: 'Account Verification',
								subtitle: 'Verified account',
							},
						].map((item, index) => (
							<TouchableOpacity
								key={index}
								className='flex-row items-center justify-between py-4 border-b border-gray-100 last:border-b-0'
								onPress={item.action}
							>
								<View className='flex-row items-center'>
									<Ionicons name={item.icon as any} size={24} color='#3D5AFE' />
									<View className='ml-4'>
										<Text className='text-base font-medium text-gray-900'>
											{item.title}
										</Text>
										<Text className='text-sm text-gray-500'>
											{item.subtitle}
										</Text>
									</View>
								</View>
								<Ionicons name='chevron-forward' size={20} color='#E0E0E0' />
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* App Settings & Preferences */}
				<View className='p-8 mb-6 bg-white shadow-sm rounded-2xl'>
					<Text className='mb-6 text-xl font-semibold text-gray-900'>
						Preferences
					</Text>
					<View className='space-y-2'>
						{[
							{
								icon: 'moon',
								title: 'Dark Mode',
								type: 'toggle',
								value: darkMode,
								setter: setDarkMode,
							},
							{
								icon: 'notifications',
								title: 'Notifications',
								type: 'toggle',
								value: notifications,
								setter: setNotifications,
							},
							{
								icon: 'finger-print',
								title: 'Biometric Login',
								type: 'toggle',
								value: biometric,
								setter: setBiometric,
							},
							{
								icon: 'people',
								title: 'Auto-Split Groups',
								type: 'toggle',
								value: autoSplit,
								setter: setAutoSplit,
							},
							{ icon: 'card', title: 'Currency Settings', subtitle: 'USD ($)' },
							{ icon: 'language', title: 'Language', subtitle: 'English' },
						].map((item, index) => (
							<View
								key={index}
								className='flex-row items-center justify-between py-4 border-b border-gray-100 last:border-b-0'
							>
								<View className='flex-row items-center'>
									<Ionicons name={item.icon as any} size={24} color='#3D5AFE' />
									<View className='ml-4'>
										<Text className='text-base font-medium text-gray-900'>
											{item.title}
										</Text>
										{item.subtitle && (
											<Text className='text-sm text-gray-500'>
												{item.subtitle}
											</Text>
										)}
									</View>
								</View>
								{item.type === 'toggle' ? (
									<Switch
										value={item.value}
										onValueChange={item.setter}
										trackColor={{ false: '#E0E0E0', true: '#3D5AFE' }}
										thumbColor='#FFFFFF'
									/>
								) : (
									<Ionicons name='chevron-forward' size={20} color='#E0E0E0' />
								)}
							</View>
						))}
					</View>
				</View>

				{/* Support & Information */}
				<View className='p-8 mb-6 bg-white shadow-sm rounded-2xl'>
					<Text className='mb-6 text-xl font-semibold text-gray-900'>
						Support & Information
					</Text>
					<View className='space-y-2'>
						{[
							{
								icon: 'help-circle',
								title: 'Help Center',
								subtitle: 'FAQs and guides',
							},
							{
								icon: 'chatbubble-ellipses',
								title: 'Contact Support',
								subtitle: '24/7 assistance',
								action: handleSupport,
							},
							{
								icon: 'bulb',
								title: 'Feature Requests',
								subtitle: 'Share your ideas',
							},
							{
								icon: 'document-text',
								title: 'Terms of Service',
								subtitle: 'Legal information',
							},
							{
								icon: 'shield',
								title: 'Privacy Policy',
								subtitle: 'How we protect you',
							},
						].map((item, index) => (
							<TouchableOpacity
								key={index}
								className='flex-row items-center justify-between py-4 border-b border-gray-100 last:border-b-0'
								onPress={item.action}
							>
								<View className='flex-row items-center'>
									<Ionicons name={item.icon as any} size={24} color='#3D5AFE' />
									<View className='ml-4'>
										<Text className='text-base font-medium text-gray-900'>
											{item.title}
										</Text>
										<Text className='text-sm text-gray-500'>
											{item.subtitle}
										</Text>
									</View>
								</View>
								<Ionicons name='chevron-forward' size={20} color='#E0E0E0' />
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Logout Button */}
				<TouchableOpacity
					className='flex-row items-center justify-center p-6 mb-24 bg-red-500 rounded-2xl'
					onPress={handleLogout}
				>
					<Ionicons name='log-out' size={24} color='white' />
					<Text className='ml-3 text-xl font-semibold text-white'>
						Sign Out
					</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}
