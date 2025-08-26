import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { SplashScreen } from '@/components/SplashScreen';
import { dynamicClient } from '@/lib/client';
import { useReactiveClient } from '@dynamic-labs/react-hooks';

export default function Home() {
	const [isReady, setIsReady] = useState(false);
	const { auth, sdk } = useReactiveClient(dynamicClient);

	useEffect(() => {
		// Wait for the component to be fully mounted before navigating
		const timer = setTimeout(() => {
			setIsReady(true);
		}, 2000);

		return () => clearTimeout(timer);
	}, []);

	if (!isReady) {
		return <SplashScreen onAnimationComplete={() => setIsReady(true)} />;
	} else {
		// Check authentication status and redirect accordingly
		if (auth.token) {
			console.log('User authenticated, redirecting to home');
			return <Redirect href='/(tabs)/home' />;
		} else {
			console.log('User not authenticated, redirecting to login');
			return <Redirect href='/login' />;
		}
	}
}
