import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { SplashScreen } from '@/components/SplashScreen';
import { dynamicClient } from '@/lib/client';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { useUserProfileStore } from '@/stores/userProfileStore';

export default function Home() {
	const [isReady, setIsReady] = useState(false);
	const [authChecked, setAuthChecked] = useState(false);
	const { auth, wallets, sdk } = useReactiveClient(dynamicClient);
	const { currentProfile } = useUserProfileStore();

	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				console.log('Root index - checking auth status...');

				// Wait for SDK to be loaded
				if (!sdk.loaded) {
					console.log('SDK not loaded yet, waiting...');
					return;
				}

				// Simple check - if user has Dynamic auth + profile, they're authenticated
				const isDynamicAuthenticated = !!(
					auth.token &&
					wallets.userWallets &&
					wallets.userWallets.length > 0
				);

				console.log('Root index auth check:');
				console.log('- SDK loaded:', sdk.loaded);
				console.log('- auth.token:', !!auth.token);
				console.log('- wallets count:', wallets.userWallets?.length || 0);
				console.log('- Dynamic authenticated:', isDynamicAuthenticated);
				console.log('- currentProfile:', !!currentProfile);
			} catch (error) {
				console.error('Error checking auth status:', error);
			} finally {
				setAuthChecked(true);
			}
		};

		checkAuthStatus();
	}, [auth.token, wallets.userWallets, sdk.loaded, currentProfile]);

	useEffect(() => {
		if (authChecked) {
			const timer = setTimeout(() => {
				setIsReady(true);
			}, 1500);
			return () => clearTimeout(timer);
		}
	}, [authChecked]);

	console.log(
		'Render decision - authChecked:',
		authChecked,
		'isReady:',
		isReady,
		'currentProfile:',
		!!currentProfile
	);

	if (!authChecked || !isReady) {
		return <SplashScreen onAnimationComplete={() => setIsReady(true)} />;
	}

	// Check if user is fully authenticated (has Dynamic auth + profile)
	const isFullyAuthenticated = !!(
		auth.token &&
		wallets.userWallets?.length > 0 &&
		currentProfile
	);

	if (isFullyAuthenticated) {
		console.log(
			'User fully authenticated, redirecting based on role:',
			currentProfile.role
		);
		if (currentProfile.role === 'business') {
			return <Redirect href='/business/home' />;
		} else {
			return <Redirect href='/(app)/home' />;
		}
	} else {
		console.log('User not fully authenticated, redirecting to login');
		return <Redirect href='/login' />;
	}
}
