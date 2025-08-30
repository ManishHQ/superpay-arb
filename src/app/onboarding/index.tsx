import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import OnboardingFlow from '@/components/OnboardingFlow';

export default function OnboardingScreen() {
	const handleOnboardingComplete = (userData: any) => {
		console.log('✅ Onboarding completed successfully:', userData);

		// Navigate to home after successful onboarding
		setTimeout(() => {
			router.replace('/home');
		}, 500);
	};

	return (
		<>
			<StatusBar style='dark' backgroundColor='#F8FAFC' />
			<OnboardingFlow onComplete={handleOnboardingComplete} />
		</>
	);
}
