import { Stack } from 'expo-router';
import { dynamicClient } from '@/lib/client';
import '../global.css';

export default function AppLayout() {
	return (
		<>
			<dynamicClient.reactNative.WebView />
			<Stack>
				<Stack.Screen name='index' options={{ headerShown: false }} />
				<Stack.Screen name='login/index' options={{ headerShown: false }} />
				<Stack.Screen name='(tabs)' options={{ headerShown: false }} />
			</Stack>
		</>
	);
}
