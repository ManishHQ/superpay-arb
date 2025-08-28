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
import { useUserStore, useAuthStore, useBalanceStore } from '@/stores';

// Mock stats data (we'll replace this with real API data later)
const userStats = {
	totalTransactions: 156,
	activeGroups: 8,
	friendsConnected: 23,
	portfolioValue: 2847.5,
	monthlyActivity: 42,
	totalSent: 12470,
	totalReceived: 8560,
};

export default function ProfileScreen() {
	// Zustand stores
	const {
		user: userData,
		isLoading,
		error,
		fetchUserProfile,
		clearError,
	} = useUserStore();
	const { logout } = useAuthStore();
	const {
		usdcBalance,
		usdcLoading: isLoadingBalance,
		usdcError: balanceError,
		fetchUsdcBalance,
		fetchAllBalances,
	} = useBalanceStore();

	// Privacy & Settings States
	const [profileVisible, setProfileVisible] = useState(false);
	const [portfolioVisible, setPortfolioVisible] = useState(false);
	const [darkMode, setDarkMode] = useState(false);
	const [notifications, setNotifications] = useState(true);
	const [biometric, setBiometric] = useState(true);
	const [autoSplit, setAutoSplit] = useState(true);

	// Refresh state
	const [refreshing, setRefreshing] = useState(false);

	// Fetch user data on component mount if not already loaded
	useEffect(() => {
		if (!userData && !isLoading) {
			fetchUserProfile();
		}
	}, [userData, isLoading, fetchUserProfile]);

	// Fetch USDC balance on component mount
	useEffect(() => {
		fetchUsdcBalance();
	}, [fetchUsdcBalance]);

	// Handle pull-to-refresh
	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await Promise.all([fetchUserProfile(), fetchAllBalances()]);
		} catch (error) {
			console.error('Error refreshing data:', error);
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
		Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
			{
				text: 'Cancel',
				style: 'cancel',
			},
			{
				text: 'Sign Out',
				style: 'destructive',
				onPress: async () => {
					try {
						await logout();
						// Don't show success alert as user will be redirected
						console.log('User logged out successfully');
					} catch (error) {
						console.error('Logout error:', error);
						Alert.alert('Error', 'Failed to sign out. Please try again.');
					}
				},
			},
		]);
	};

	// Show loading state
	if (isLoading) {
		return (
			<SafeAreaView className='flex-1 bg-bg-light'>
				<View className='items-center justify-center flex-1'>
					<ActivityIndicator size='large' color='#3D5AFE' />
					<Text className='mt-4 text-lg text-gray-600'>Loading profile...</Text>
				</View>
			</SafeAreaView>
		);
	}

	// Show error state
	if (error || !userData) {
		return (
			<SafeAreaView className='flex-1 bg-bg-light'>
				<View className='items-center justify-center flex-1 px-6'>
					<Ionicons name='alert-circle' size={64} color='#EF4444' />
					<Text className='mt-4 text-xl font-semibold text-center text-gray-900'>
						Failed to Load Profile
					</Text>
					<Text className='mt-2 text-base text-center text-gray-600'>
						{error || 'Unable to load your profile data'}
					</Text>
					<TouchableOpacity
						className='px-6 py-3 mt-6 bg-blue-600 rounded-lg'
						onPress={() => {
							clearError();
							fetchUserProfile();
						}}
					>
						<Text className='font-semibold text-white'>Try Again</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className='flex-1 bg-bg-light'>
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
						{/* Profile Photo with Edit Overlay */}
						<View className='flex-row items-center justify-center mb-8'>
							<View className='w-32 h-32 srounded-full'>
								<Image
									source={{
										uri:
											userData.avatarUrl || 'https://i.pravatar.cc/150?img=5',
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
								<Text className='mr-2 text-2xl font-bold text-text-main'>
									{userData.firstName} {userData.lastName}
								</Text>
								{/* Show verification badge if user has completed profile */}
								{userData.firstName && userData.firstName !== 'User' && (
									<View className='flex-row items-center'>
										<Ionicons
											name='checkmark-circle'
											size={20}
											color='#00C896'
											className='mr-2'
										/>
										<Ionicons name='qr-code' size={20} color='#00C896' />
									</View>
								)}
							</View>
							<Text className='text-base font-medium text-primary-blue'>
								{userData.email}
							</Text>
							<Text className='mt-1 text-sm text-gray-500'>
								{userData.phone && `Phone: ${userData.phone}`}
							</Text>
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
						<View className='flex-row items-center'>
							<TouchableOpacity
								onPress={fetchAllBalances}
								className='mr-3'
								disabled={isLoadingBalance}
							>
								<Ionicons
									name='refresh'
									size={20}
									color='white'
									style={{ opacity: isLoadingBalance ? 0.5 : 1 }}
								/>
							</TouchableOpacity>
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
									{portfolioVisible ? (
										isLoadingBalance ? (
											<ActivityIndicator size='small' color='white' />
										) : balanceError ? (
											'Error'
										) : (
											`$${parseFloat(usdcBalance).toLocaleString(undefined, {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}`
										)
									) : (
										'•••••'
									)}
								</Text>
								<Text
									style={{ color: 'rgba(255, 255, 255, 0.9)' }}
									className='text-sm'
								>
									USDC Balance
								</Text>
							</View>
						</View>
					</View>
				</LinearGradient>

				{/* Primary Actions Section */}
				<View className='p-8 mb-6 bg-white shadow-sm rounded-2xl'>
					<Text className='mb-6 text-xl font-semibold text-text-main'>
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
					<Text className='mb-6 text-xl font-semibold text-text-main'>
						Account Management
					</Text>
					<View className='space-y-2'>
						{[
							{
								icon: 'wallet',
								title: 'USDC Balance',
								subtitle: isLoadingBalance
									? 'Loading...'
									: balanceError
									? 'Tap to retry'
									: `$${parseFloat(usdcBalance).toLocaleString(undefined, {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
									  })}`,
								action: fetchAllBalances,
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
								className='flex-row items-center justify-between py-4 border-b border-muted last:border-b-0'
								onPress={item.action}
							>
								<View className='flex-row items-center'>
									<Ionicons name={item.icon as any} size={24} color='#3D5AFE' />
									<View className='ml-4'>
										<Text className='text-base font-medium text-text-main'>
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
					<Text className='mb-6 text-xl font-semibold text-text-main'>
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
								className='flex-row items-center justify-between py-4 border-b border-muted last:border-b-0'
							>
								<View className='flex-row items-center'>
									<Ionicons name={item.icon as any} size={24} color='#3D5AFE' />
									<View className='ml-4'>
										<Text className='text-base font-medium text-text-main'>
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
					<Text className='mb-6 text-xl font-semibold text-text-main'>
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
								className='flex-row items-center justify-between py-4 border-b border-muted last:border-b-0'
								onPress={item.action}
							>
								<View className='flex-row items-center'>
									<Ionicons name={item.icon as any} size={24} color='#3D5AFE' />
									<View className='ml-4'>
										<Text className='text-base font-medium text-text-main'>
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
