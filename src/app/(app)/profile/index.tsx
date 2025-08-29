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

				{/* Cards Container - Responsive Layout */}
				<View className='px-4 mb-6'>
					{/* SuperPay Card Section */}
					<View className='mb-6 md:mb-8'>
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

					{/* Quick Stats Card */}
					<View className='mb-6 md:mb-8'>
						<LinearGradient
							colors={['#3D5AFE', '#00C896']}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							style={{
								padding: 20,
								borderRadius: 16,
								marginHorizontal: 'auto',
								maxWidth: 600,
								width: '100%',
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

							{/* Stats Grid - Responsive Layout */}
							<View className='md:max-w-lg md:mx-auto'>
								<View className='flex-row justify-between mb-4 md:mb-6'>
									<View
										className='flex-1 p-4 mr-2 rounded-xl md:p-6 md:mr-3'
										style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
									>
										<Text className='text-2xl font-bold text-white md:text-3xl'>
											{userStats.totalTransactions}
										</Text>
										<Text
											style={{ color: 'rgba(255, 255, 255, 0.9)' }}
											className='text-sm md:text-base'
										>
											Transactions
										</Text>
									</View>
									<View
										className='flex-1 p-4 ml-2 rounded-xl md:p-6 md:ml-3'
										style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
									>
										<Text className='text-2xl font-bold text-white md:text-3xl'>
											{userStats.activeGroups}
										</Text>
										<Text
											style={{ color: 'rgba(255, 255, 255, 0.9)' }}
											className='text-sm md:text-base'
										>
											Active Groups
										</Text>
									</View>
								</View>
								<View className='flex-row justify-between'>
									<View
										className='flex-1 p-4 mr-2 rounded-xl md:p-6 md:mr-3'
										style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
									>
										<Text className='text-2xl font-bold text-white md:text-3xl'>
											{userStats.friendsConnected}
										</Text>
										<Text
											style={{ color: 'rgba(255, 255, 255, 0.9)' }}
											className='text-sm md:text-base'
										>
											Friends
										</Text>
									</View>
									<View
										className='flex-1 p-4 ml-2 rounded-xl md:p-6 md:ml-3'
										style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
									>
										<Text className='text-2xl font-bold text-white md:text-3xl'>
											{portfolioVisible
												? `$${userStats.portfolioValue.toLocaleString()}`
												: '•••••'}
										</Text>
										<Text
											style={{ color: 'rgba(255, 255, 255, 0.9)' }}
											className='text-sm md:text-base'
										>
											Portfolio Value
										</Text>
									</View>
								</View>
							</View>
						</LinearGradient>
					</View>
				</View>
				{/* Primary Actions Section */}
				<View className='p-6 mb-6 bg-white shadow-sm rounded-2xl md:p-8 md:max-w-2xl md:mx-auto'>
					<Text className='mb-6 text-xl font-semibold text-gray-900 md:text-2xl md:text-center'>
						Quick Actions
					</Text>
					<View>
						<View className='flex-row justify-between mb-4 md:mb-6'>
							<TouchableOpacity
								className='flex-row items-center flex-1 p-4 mr-2 bg-gray-50 rounded-xl md:p-6 md:mr-3'
								onPress={handleEditProfile}
							>
								<Ionicons name='person-circle' size={24} color='#3D5AFE' />
								<Text className='flex-1 ml-2 text-sm font-medium text-gray-700 md:text-base'>
									Edit Profile
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								className='flex-row items-center flex-1 p-4 ml-2 bg-gray-50 rounded-xl md:p-6 md:ml-3'
								onPress={handleShareProfile}
							>
								<Ionicons name='share' size={24} color='#3D5AFE' />
								<Text className='flex-1 ml-2 text-sm font-medium text-gray-700 md:text-base'>
									Share Profile
								</Text>
							</TouchableOpacity>
						</View>
						<View className='flex-row justify-between'>
							<TouchableOpacity
								className='flex-row items-center flex-1 p-4 mr-2 bg-gray-50 rounded-xl md:p-6 md:mr-3'
								onPress={handleQRCode}
							>
								<Ionicons name='qr-code' size={24} color='#3D5AFE' />
								<Text className='flex-1 ml-2 text-sm font-medium text-gray-700 md:text-base'>
									Generate QR
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								className='flex-row items-center flex-1 p-4 ml-2 bg-gray-50 rounded-xl md:p-6 md:ml-3'
								onPress={handlePrivacySettings}
							>
								<Ionicons name='shield-checkmark' size={24} color='#3D5AFE' />
								<Text className='flex-1 ml-2 text-sm font-medium text-gray-700 md:text-base'>
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
