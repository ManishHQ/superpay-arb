import { Tabs, Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
	Platform,
	StatusBar,
	StyleSheet,
	View,
	Text,
	useWindowDimensions,
} from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { Ionicons } from '@expo/vector-icons';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { dynamicClient } from '@/lib/client';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
	},
	sidebar: {
		width: 250,
		backgroundColor: '#f8f9fa',
		borderRightWidth: 1,
		borderRightColor: '#e9ecef',
		paddingTop: 20,
	},
	content: {
		flex: 1,
	},
	mobileContainer: {
		flex: 1,
	},
});

export default function BusinessLayout() {
	const { auth, sdk, wallets } = useReactiveClient(dynamicClient);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [authChecked, setAuthChecked] = useState(false);
	const { width } = useWindowDimensions();
	const isDesktop = width >= 768;

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

	if (isDesktop) {
		return (
			<View style={styles.container}>
				<Tabs
					screenOptions={{
						headerShown: false,
						tabBarButton: HapticTab,
						tabBarStyle: {
							position: 'absolute',
							left: 0,
							top: 0,
							bottom: 0,
							width: 250,
							height: '100%',
							backgroundColor: '#f8f9fa',
							borderRightWidth: 1,
							borderRightColor: '#e9ecef',
							flexDirection: 'column',
							paddingTop: 20,
							paddingHorizontal: 0,
						},
						tabBarLabelStyle: {
							fontSize: 14,
							fontWeight: '500',
							marginLeft: 12,
						},
						tabBarIconStyle: {
							marginRight: 8,
						},
						tabBarItemStyle: {
							flexDirection: 'row',
							justifyContent: 'flex-start',
							alignItems: 'center',
							paddingHorizontal: 16,
							paddingVertical: 12,
							marginHorizontal: 8,
							marginVertical: 2,
							borderRadius: 8,
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
				</Tabs>
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
			</Tabs>
			<StatusBar backgroundColor='#fff' barStyle='dark-content' />
		</View>
	);
}
