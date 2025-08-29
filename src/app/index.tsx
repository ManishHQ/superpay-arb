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
	const { auth } = useReactiveClient(dynamicClient);

	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				const storedToken = await AsyncStorage.getItem('authToken');
				const isLoggedIn = !!(auth.token || storedToken);
				setIsAuthenticated(isLoggedIn);
			} catch (error) {
				console.error('Error checking auth status:', error);
				setIsAuthenticated(false);
			} finally {
				setAuthChecked(true);
			}
		};

		checkAuthStatus();
	}, [auth.token]);

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
