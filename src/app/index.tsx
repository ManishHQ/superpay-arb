import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { SplashScreen } from '@/components/SplashScreen';
import { dynamicClient } from '@/lib/client';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Home() {
	const [isReady, setIsReady] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [authChecked, setAuthChecked] = useState(false);
	const { auth, wallets } = useReactiveClient(dynamicClient);

	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				// Clear any stored tokens to start fresh
				await AsyncStorage.removeItem('authToken');
				
				// Simple check: must have auth token AND connected wallets
				const isLoggedIn = !!(auth.token && wallets.userWallets && wallets.userWallets.length > 0);
				
				console.log('Root index auth check (simplified):');
				console.log('- auth.token:', !!auth.token);
				console.log('- wallets count:', wallets.userWallets?.length || 0);
				console.log('- final authenticated:', isLoggedIn);
				
				setIsAuthenticated(isLoggedIn);
			} catch (error) {
				console.error('Error checking auth status:', error);
				setIsAuthenticated(false);
			} finally {
				setAuthChecked(true);
			}
		};

		checkAuthStatus();
	}, [auth.token, wallets.userWallets]);

	useEffect(() => {
		if (authChecked) {
			const timer = setTimeout(() => {
				setIsReady(true);
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, [authChecked]);

	if (!authChecked || !isReady) {
		return <SplashScreen onAnimationComplete={() => setIsReady(true)} />;
	}

	if (isAuthenticated) {
		console.log('User authenticated, redirecting to home');
		return <Redirect href='/(tabs)/home' />;
	} else {
		console.log('User not authenticated, redirecting to login');
		return <Redirect href='/login' />;
	}
}
