import { Redirect, Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
	Platform,
	StatusBar,
	StyleSheet,
	TouchableOpacity,
	View,
	Text,
	useWindowDimensions,
	Image,
} from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { dynamicClient } from '@/lib/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { AvatarService } from '@/services/avatarService';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
	},
	sidebar: {
		width: 250,
		backgroundColor: '#ffffff',
		borderRightWidth: 1,
		borderRightColor: '#f3f4f6',
		paddingTop: 20,
		shadowColor: '#000',
		shadowOffset: { width: 2, height: 0 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 5,
	},
	content: {
		flex: 1,
	},
	mobileContainer: {
		flex: 1,
	},
	sidebarHeader: {
		fontSize: 20,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 32,
		paddingHorizontal: 24,
	},
	navButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingVertical: 16,
		marginHorizontal: 12,
		marginVertical: 2,
		borderRadius: 12,
	},
	navButtonActive: {
		backgroundColor: '#f3f4f6',
	},
	navIcon: {
		marginRight: 16,
	},
	navLabel: {
		fontSize: 16,
		fontWeight: '500',
		color: '#374151',
	},
	navLabelActive: {
		color: '#111827',
		fontWeight: '600',
	},
	sidebarProfileSection: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingVertical: 16,
		marginBottom: 24,
		borderBottomWidth: 1,
		borderBottomColor: '#f3f4f6',
	},
	sidebarAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		marginRight: 12,
		backgroundColor: '#e5e7eb',
		borderWidth: 1,
		borderColor: '#d1d5db',
	},
	sidebarProfileInfo: {
		flex: 1,
	},
	sidebarDisplayName: {
		fontSize: 16,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 2,
	},
	sidebarBusinessType: {
		fontSize: 14,
		color: '#6b7280',
	},
	paymentButton: {
		position: 'absolute',
		top: -35,
		left: '50%',
		marginLeft: -35, // Half of the button width (70/2)
		backgroundColor: '#4F46E5',
		borderRadius: 35,
		width: 70,
		height: 70,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.2,
		shadowRadius: 6,
		elevation: 8, // For Android shadow
	},
});

// get greeting based on the time of day
const getGreeting = () => {
	const hours = new Date().getHours();
	if (hours < 12) return 'Good Morning!';
	if (hours < 18) return 'Good Afternoon!';
	return 'Good Evening!';
};

// PaymentTabButton: The special floating action button for the Payment tab
export const PaymentTabButton = () => {
	const router = useRouter();
	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		router.push('/payment');
	};

	return (
		<TouchableOpacity
			onPress={handlePress}
			style={styles.paymentButton}
			activeOpacity={0.85}
		>
			<Ionicons name='add-circle' size={30} color='#fff' />
		</TouchableOpacity>
	);
};

export default function TabLayout() {
	const { auth, sdk, wallets } = useReactiveClient(dynamicClient);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [authChecked, setAuthChecked] = useState(false);
	const { width } = useWindowDimensions();
	const isDesktop = width >= 768;
	const router = useRouter();
	const segments = useSegments();
	const { currentProfile } = useUserProfileStore();

	// Check authentication status and load user profile
	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				// Simple check: must have auth token AND connected wallets
				const isLoggedIn = !!(
					auth.token &&
					wallets.userWallets &&
					wallets.userWallets.length > 0
				);

				console.log('Tab layout auth check (simplified):');
				console.log('- auth.token:', !!auth.token);
				console.log('- wallets count:', wallets.userWallets?.length || 0);
				console.log('- final authenticated:', isLoggedIn);

				if (isLoggedIn) {
					// Load user profile if authenticated and not already loaded
					const primaryWallet = wallets.userWallets?.[0];
					if (primaryWallet?.address && !currentProfile) {
						console.log('Loading user profile for wallet:', primaryWallet.address);
						try {
							// Use the store method to load profile by wallet address
							await useUserProfileStore.getState().loadProfileByWallet(primaryWallet.address);
							
							// Check if profile was loaded successfully
							const loadedProfile = useUserProfileStore.getState().currentProfile;
							if (loadedProfile) {
								console.log('User profile loaded successfully:', {
									username: loadedProfile.username,
									displayName: loadedProfile.display_name,
									hasAvatar: !!loadedProfile.avatar_url
								});
							} else {
								console.log('No user profile found - user may need onboarding');
							}
						} catch (profileError) {
							console.error('Error loading user profile:', profileError);
							// Don't fail auth if profile loading fails
						}
					} else if (currentProfile) {
						console.log('User profile already loaded:', {
							username: currentProfile.username,
							displayName: currentProfile.display_name
						});
					}
				}

				setIsAuthenticated(isLoggedIn);
				
				// Clear profile if not authenticated
				if (!isLoggedIn && currentProfile) {
					console.log('User not authenticated, clearing profile');
					useUserProfileStore.getState().clearProfile();
				}
			} catch (error) {
				console.error('Error checking auth status in tabs:', error);
				setIsAuthenticated(false);
			} finally {
				setAuthChecked(true);
			}
		};

		if (sdk.loaded) {
			checkAuthStatus();
		}
	}, [auth.token, wallets.userWallets, sdk.loaded, currentProfile]);

	// Show loading while checking auth
	if (!sdk.loaded || !authChecked) {
		return <Text>Loading...</Text>;
	}

	// Redirect to login if not authenticated
	if (!isAuthenticated) {
		console.log('User not authenticated in tabs, redirecting to login');
		return <Redirect href='/login' />;
	}

	console.log('User authenticated in tabs, showing protected content');
	console.log(wallets.userWallets);

	const currentRoute = segments[segments.length - 1];

	// Get profile display information
	const displayName =
		currentProfile?.display_name || currentProfile?.full_name || 'User';

	// Generate avatar URL with proper fallbacks
	const getAvatarUrl = () => {
		// If user has a custom avatar, use it with cache-busting
		if (currentProfile?.avatar_url && currentProfile.avatar_url.trim()) {
			return `${currentProfile.avatar_url}?v=${currentProfile?.updated_at || Date.now()}`;
		}

		// Otherwise, generate a default avatar using username or fallback
		const username =
			currentProfile?.username ||
			currentProfile?.display_name ||
			currentProfile?.full_name ||
			'user';

		// Use AvatarService method for better fallback handling with seed
		return AvatarService.generateDefaultAvatar(username, currentProfile?.id);
	};

	const cacheBustedAvatarUrl = getAvatarUrl();

	const navigationItems = [
		{
			name: 'home/index',
			title: 'Home',
			icon: 'home',
			iconOutline: 'home-outline',
		},
		{
			name: 'pots/index',
			title: 'Pots',
			icon: 'wallet',
			iconOutline: 'wallet-outline',
		},
		{
			name: 'payment/index',
			title: 'Payment',
			icon: 'add-circle',
			iconOutline: 'add-circle-outline',
		},
		{
			name: 'track/index',
			title: 'Track',
			icon: 'analytics',
			iconOutline: 'analytics-outline',
		},
		{
			name: 'profile/index',
			title: 'Profile',
			icon: 'person',
			iconOutline: 'person-outline',
		},
	];

	if (isDesktop) {
		return (
			<View style={styles.container}>
				<View style={styles.sidebar}>
					{/* Profile Section */}
					<View style={styles.sidebarProfileSection}>
						<Image
							source={{ uri: cacheBustedAvatarUrl }}
							style={styles.sidebarAvatar}
							resizeMode='cover'
							onError={() => {
								console.warn('Failed to load avatar image');
							}}
						/>
						<View style={styles.sidebarProfileInfo}>
							<Text style={styles.sidebarDisplayName}>{displayName}</Text>
							<Text style={styles.sidebarBusinessType}>{getGreeting()}</Text>
						</View>
					</View>
					{navigationItems.map((item) => {
						const isActive =
							currentRoute === item.name ||
							(currentRoute === 'index' && item.name === 'home/index');
						return (
							<TouchableOpacity
								key={item.name}
								style={[styles.navButton, isActive && styles.navButtonActive]}
								onPress={() =>
									router.push(`/${item.name.replace('/index', '')}`)
								}
							>
								<Ionicons
									name={
										isActive ? (item.icon as any) : (item.iconOutline as any)
									}
									size={20}
									color={isActive ? '#111827' : '#6b7280'}
									style={styles.navIcon}
								/>
								<Text
									style={[styles.navLabel, isActive && styles.navLabelActive]}
								>
									{item.title}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>
				<View style={styles.content}>
					<Tabs
						screenOptions={{
							headerShown: false,
							tabBarButton: HapticTab,
							tabBarStyle: {
								display: 'none',
							},
						}}
					>
						<Tabs.Screen
							name='home/index'
							options={{
								title: 'Home',
								tabBarIcon: ({ color, focused }) => (
									<Ionicons
										size={20}
										name={focused ? 'home' : 'home-outline'}
										color={color}
									/>
								),
							}}
						/>
						<Tabs.Screen
							name='pots/index'
							options={{
								title: 'Pots',
								tabBarIcon: ({ color, focused }) => (
									<Ionicons
										size={20}
										name={focused ? 'wallet' : 'wallet-outline'}
										color={color}
									/>
								),
							}}
						/>
						<Tabs.Screen
							name='payment/index'
							options={{
								title: 'Payment',
								tabBarIcon: ({ color, focused }) => (
									<Ionicons
										size={20}
										name={focused ? 'add-circle' : 'add-circle-outline'}
										color={color}
									/>
								),
							}}
						/>
						<Tabs.Screen
							name='track/index'
							options={{
								title: 'Track',
								tabBarIcon: ({ color, focused }) => (
									<Ionicons
										name={focused ? 'analytics' : 'analytics-outline'}
										size={20}
										color={color}
									/>
								),
							}}
						/>
						<Tabs.Screen
							name='profile/index'
							options={{
								title: 'Profile',
								tabBarIcon: ({ color, focused }) => (
									<Ionicons
										name={focused ? 'person' : 'person-outline'}
										size={20}
										color={color}
									/>
								),
							}}
						/>
					</Tabs>
				</View>
				<StatusBar backgroundColor='#fff' barStyle='dark-content' />
			</View>
		);
	}

	// Mobile layout - standard bottom tabs
	return (
		<View style={styles.mobileContainer}>
			<Tabs
				screenOptions={{
					headerShown: false,
					tabBarButton: HapticTab,
					tabBarStyle: Platform.select({
						ios: {
							// Use a transparent background on iOS to show the blur effect
							position: 'absolute',
						},
						default: {},
					}),
				}}
			>
				<Tabs.Screen
					name='home/index'
					options={{
						title: 'Home',
						tabBarIcon: ({ color, focused }) => (
							<Ionicons
								size={24}
								name={focused ? 'home' : 'home-outline'}
								color={color}
							/>
						),
					}}
				/>
				<Tabs.Screen
					name='pots/index'
					options={{
						title: 'Pots',
						tabBarIcon: ({ color }) => (
							<FontAwesome6 name='piggy-bank' size={24} color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name='payment/index'
					options={{
						title: 'Payment',
						tabBarLabel: 'Payment',
						tabBarButton: PaymentTabButton,
					}}
					listeners={{
						tabPress: (e) => {
							e.preventDefault();
							console.log('tabPress');
						},
					}}
				/>
				<Tabs.Screen
					name='track/index'
					options={{
						title: 'Track',
						tabBarIcon: ({ color, focused }) => (
							<Ionicons
								name={focused ? 'analytics' : 'analytics-outline'}
								size={24}
								color={color}
							/>
						),
					}}
				/>
				<Tabs.Screen
					name='profile/index'
					options={{
						title: 'Profile',
						tabBarIcon: ({ color, focused }) => (
							<Ionicons
								name={focused ? 'person' : 'person-outline'}
								size={24}
								color={color}
							/>
						),
					}}
				/>
			</Tabs>
			<StatusBar backgroundColor='#fff' barStyle='dark-content' />
		</View>
	);
}
