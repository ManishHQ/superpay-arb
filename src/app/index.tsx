import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Home() {
	const router = useRouter();
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		// Wait for the component to be fully mounted before navigating
		const timer = setTimeout(() => {
			setIsReady(true);
			router.push('/login');
		}, 100);

		return () => clearTimeout(timer);
	}, [router]);

	return (
		<View className='items-center justify-center flex-1 bg-white'>
			<Text className='text-lg text-gray-600'>
				{isReady ? 'Redirecting...' : 'Loading...'}
			</Text>
		</View>
	);
}
