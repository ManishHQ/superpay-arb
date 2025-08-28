import { Stack } from 'expo-router';
import { client } from '@/lib/client';
import '../global.css';

export default function AppLayout() {
	return (
		<>
			<client.reactNative.WebView />
			<Stack>
				<Stack.Screen name='index' />
				<Stack.Screen name='login/index' />
				<Stack.Screen
					name='(tabs)/home/index'
					options={{ headerShown: false }}
				/>
			</Stack>
		</>
	);
}
