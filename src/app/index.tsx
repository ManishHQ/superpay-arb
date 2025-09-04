import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SplashScreen } from '@/components/SplashScreen';

export default function Home() {
	const router = useRouter();
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		// Wait for the component to be fully mounted before navigating
		const timer = setTimeout(() => {
			setIsReady(true);
			router.push('/login');
		}, 3000);

		return () => clearTimeout(timer);
	}, [router]);

	if (!isReady) {
		return <SplashScreen onAnimationComplete={() => setIsReady(true)} />;
	}

	return (
		<View className='items-center justify-center flex-1 bg-white'>
			<Text className='text-lg text-gray-600'>
				{isReady ? 'Redirecting...' : 'Loading...'}
			</Text>
		</View>
	);
}
