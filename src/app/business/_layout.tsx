import { Tabs, Redirect, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
	Platform,
	StatusBar,
	StyleSheet,
	View,
	Text,
	useWindowDimensions,
	TouchableOpacity,
	Image,
} from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { Ionicons } from '@expo/vector-icons';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { dynamicClient } from '@/lib/client';
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
});

export default function BusinessLayout() {
	const { auth, sdk, wallets } = useReactiveClient(dynamicClient);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [authChecked, setAuthChecked] = useState(false);
	const { width } = useWindowDimensions();
	const isDesktop = width >= 768;
	const router = useRouter();
	const segments = useSegments();
	const { currentProfile } = useUserProfileStore();

	// Check authentication status
	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				const isLoggedIn = !!(
					auth.token &&
					wallets.userWallets &&
					wallets.userWallets.length > 0
				);

				setIsAuthenticated(isLoggedIn);
			} catch (error) {
				console.error('Error checking auth status in business:', error);
				setIsAuthenticated(false);
			} finally {
				setAuthChecked(true);
			}
		};

		if (sdk.loaded) {
			checkAuthStatus();
		}
	}, [auth.token, wallets.userWallets, sdk.loaded]);

	// Show loading while checking auth
	if (!sdk.loaded || !authChecked) {
		return <Text>Loading...</Text>;
	}

	// Redirect to login if not authenticated
	if (!isAuthenticated) {
		return <Redirect href='/login' />;
	}

	const currentRoute = segments[segments.length - 1];

	// Get profile display information
	const displayName =
		currentProfile?.business_name ||
		currentProfile?.display_name ||
		currentProfile?.full_name ||
		'Business Owner';
	const avatarUrl = AvatarService.getAvatarUrl({
		avatar_url: currentProfile?.avatar_url,
		username: currentProfile?.username || 'business',
	});

	// Add cache-busting for avatar updates
	const cacheBustedAvatarUrl = currentProfile?.avatar_url
		? `${avatarUrl}?v=${currentProfile?.updated_at || Date.now()}`
		: avatarUrl;

	const navigationItems = [
		{
			name: 'home/index',
			title: 'Dashboard',
			icon: 'home',
			iconOutline: 'home-outline',
		},
		{
			name: 'customers/index',
			title: 'Customers',
			icon: 'people',
			iconOutline: 'people-outline',
		},
		{
			name: 'payments/index',
			title: 'Payments',
			icon: 'card',
			iconOutline: 'card-outline',
		},
		{
			name: 'loyalty/index',
			title: 'Loyalty',
			icon: 'medal',
			iconOutline: 'medal-outline',
		},
		{
			name: 'transactions/index',
			title: 'Transactions',
			icon: 'receipt',
			iconOutline: 'receipt-outline',
		},
		{
			name: 'settings/index',
			title: 'Settings',
			icon: 'settings',
			iconOutline: 'settings-outline',
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
						/>
						<View style={styles.sidebarProfileInfo}>
							<Text style={styles.sidebarDisplayName}>{displayName}</Text>
							<Text style={styles.sidebarBusinessType}>Business Dashboard</Text>
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
									router.push(`/business/${item.name.replace('/index', '')}`)
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
								title: 'Dashboard',
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
							name='customers/index'
							options={{
								title: 'Customers',
								tabBarIcon: ({ color, focused }) => (
									<Ionicons
										size={20}
										name={focused ? 'people' : 'people-outline'}
										color={color}
									/>
								),
							}}
						/>
						<Tabs.Screen
							name='payments/index'
							options={{
								title: 'Payments',
								tabBarIcon: ({ color, focused }) => (
									<Ionicons
										size={20}
										name={focused ? 'card' : 'card-outline'}
										color={color}
									/>
								),
							}}
						/>
						<Tabs.Screen
							name='transactions/index'
							options={{
								title: 'Transactions',
								tabBarIcon: ({ color, focused }) => (
									<Ionicons
										size={20}
										name={focused ? 'receipt' : 'receipt-outline'}
										color={color}
									/>
								),
							}}
						/>
						<Tabs.Screen
							name='settings/index'
							options={{
								title: 'Settings',
								tabBarIcon: ({ color, focused }) => (
									<Ionicons
										size={20}
										name={focused ? 'settings' : 'settings-outline'}
										color={color}
									/>
								),
							}}
						/>
						<Tabs.Screen
							name='loyalty/index'
							options={{
								title: 'Loyalty',
								tabBarIcon: ({ color, focused }) => (
									<Ionicons
										size={20}
										name={focused ? 'medal' : 'medal-outline'}
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
							position: 'absolute',
						},
						default: {},
					}),
				}}
			>
				<Tabs.Screen
					name='home/index'
					options={{
						title: 'Dashboard',
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
					name='customers/index'
					options={{
						title: 'Customers',
						tabBarIcon: ({ color, focused }) => (
							<Ionicons
								size={24}
								name={focused ? 'people' : 'people-outline'}
								color={color}
							/>
						),
					}}
				/>
				<Tabs.Screen
					name='payments/index'
					options={{
						title: 'Payments',
						tabBarIcon: ({ color, focused }) => (
							<Ionicons
								size={24}
								name={focused ? 'card' : 'card-outline'}
								color={color}
							/>
						),
					}}
				/>
				<Tabs.Screen
					name='transactions/index'
					options={{
						title: 'Transactions',
						tabBarIcon: ({ color, focused }) => (
							<Ionicons
								size={24}
								name={focused ? 'receipt' : 'receipt-outline'}
								color={color}
							/>
						),
					}}
				/>
				<Tabs.Screen
					name='settings/index'
					options={{
						title: 'Settings',
						tabBarIcon: ({ color, focused }) => (
							<Ionicons
								size={24}
								name={focused ? 'settings' : 'settings-outline'}
								color={color}
							/>
						),
					}}
				/>
				<Tabs.Screen
					name='loyalty/index'
					options={{
						title: 'Loyalty',
						tabBarIcon: ({ color, focused }) => (
							<Ionicons
								size={24}
								name={focused ? 'medal' : 'medal-outline'}
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
