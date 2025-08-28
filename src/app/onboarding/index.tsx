import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import OnboardingFlow from '@/components/OnboardingFlow';

export default function OnboardingScreen() {
	const handleOnboardingComplete = (userData: any) => {
		// Move onboarding completion logic to services
		console.log('Onboarding completed:', userData);

		// Navigate to home after successful onboarding
		router.replace('/(tabs)/home');
	};

	return (
		<SafeAreaView className='flex-1 bg-gray-50'>
			<OnboardingFlow onComplete={handleOnboardingComplete} />
		</SafeAreaView>
	);
}
