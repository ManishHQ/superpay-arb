import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import {
	Platform,
	StatusBar,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

const styles = StyleSheet.create({
	paymentButton: {
		position: 'absolute',
		top: -30,
		backgroundColor: '#4F46E5',
		borderRadius: 100,
		width: 70,
		height: 70,
		alignItems: 'center',
		justifyContent: 'center',
		boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)',
	},
});

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
	return (
		<View style={{ flex: 1 }}>
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
					name='activity/index'
					options={{
						title: 'Activity',
						tabBarIcon: ({ color, focused }) => (
							<FontAwesome6 name='money-bill-1-wave' size={24} color={color} />
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
