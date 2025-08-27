import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { SplashScreen } from '@/components/SplashScreen';
import { OnboardingModal } from '@/components';
import { dynamicClient } from '@/lib/client';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { AuthService } from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Home() {
	const [isReady, setIsReady] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [authChecked, setAuthChecked] = useState(false);
	const [showOnboarding, setShowOnboarding] = useState(false);
	const [onboardingData, setOnboardingData] = useState<any>(null);
	const { auth, wallets } = useReactiveClient(dynamicClient);
	const { setCurrentProfile, currentProfile } = useUserProfileStore();

	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				// Clear any stored tokens to start fresh
				await AsyncStorage.removeItem('authToken');
				
				// Check if user is authenticated with Dynamic
				const isDynamicAuthenticated = !!(auth.token && wallets.userWallets && wallets.userWallets.length > 0);
				
				console.log('Root index auth check:');
				console.log('- auth.token:', !!auth.token);
				console.log('- wallets count:', wallets.userWallets?.length || 0);
				console.log('- Dynamic authenticated:', isDynamicAuthenticated);
				
				if (isDynamicAuthenticated) {
					// User is authenticated with Dynamic, now check database
					const authFlow = await AuthService.handleAuthenticationFlow(auth, wallets);
					
					console.log('Auth flow result:', authFlow);
					
					if (authFlow.success) {
						if (authFlow.needsOnboarding) {
							// User needs onboarding
							console.log('User needs onboarding, setting up modal');
							const authUser = AuthService.extractUserFromDynamic(auth, wallets);
							if (authUser) {
								const onboardingInfo = {
									fullName: authUser.fullName || authUser.firstName || authUser.lastName || '',
									username: authUser.username || `user_${Date.now()}`,
									email: authUser.email || '',
									walletAddress: authUser.walletAddress || '',
								};
								console.log('Setting onboarding data:', onboardingInfo);
								setOnboardingData(onboardingInfo);
								setShowOnboarding(true);
								setIsAuthenticated(false);
								console.log('Onboarding state set - showOnboarding:', true);
							} else {
								console.error('Failed to extract user data for onboarding');
								setIsAuthenticated(false);
							}
						} else if (authFlow.userProfile) {
							// User exists in database, set profile and continue
							console.log('User profile found, logging in');
							setCurrentProfile(authFlow.userProfile);
							setIsAuthenticated(true);
						} else {
							console.error('Auth flow success but no profile and no onboarding needed - unexpected state');
							setIsAuthenticated(false);
						}
					} else {
						console.error('Auth flow failed:', authFlow.error);
						// Check if it's a server connectivity issue
						if (authFlow.error?.includes('fetch') || authFlow.error?.includes('network') || authFlow.error?.includes('connection')) {
							console.log('Server connectivity issue detected');
							// You could show a different error state here
						}
						setIsAuthenticated(false);
					}
				} else {
					setIsAuthenticated(false);
				}
			} catch (error) {
				console.error('Error checking auth status:', error);
				setIsAuthenticated(false);
			} finally {
				setAuthChecked(true);
			}
		};

		checkAuthStatus();
	}, [auth.token, wallets.userWallets, setCurrentProfile]);

	useEffect(() => {
		if (authChecked) {
			const timer = setTimeout(() => {
				setIsReady(true);
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, [authChecked]);

	const handleOnboardingComplete = (profile: any) => {
		console.log('Onboarding completed:', profile);
		setCurrentProfile(profile);
		setShowOnboarding(false);
		setIsAuthenticated(true);
	};

	const handleOnboardingCancel = () => {
		console.log('Onboarding cancelled, logging out');
		setShowOnboarding(false);
		// Logout from Dynamic
		dynamicClient.auth.logout();
		setIsAuthenticated(false);
	};

	// Debug current state
	console.log('Render decision - authChecked:', authChecked, 'isReady:', isReady, 'showOnboarding:', showOnboarding, 'isAuthenticated:', isAuthenticated);

	if (!authChecked || !isReady) {
		return <SplashScreen onAnimationComplete={() => setIsReady(true)} />;
	}

	if (showOnboarding) {
		console.log('Rendering onboarding modal with data:', onboardingData);
		return (
			<OnboardingModal
				visible={showOnboarding}
				initialData={onboardingData}
				onComplete={handleOnboardingComplete}
				onCancel={handleOnboardingCancel}
			/>
		);
	}

	if (isAuthenticated && currentProfile) {
		console.log('User authenticated, redirecting based on role:', currentProfile.role);
		if (currentProfile.role === 'business') {
			return <Redirect href='/business/home' />;
		} else {
			return <Redirect href='/(app)/home' />;
		}
	} else {
		console.log('User not authenticated, redirecting to login');
		return <Redirect href='/login' />;
	}
}
