import { Stack } from 'expo-router';
import '../global.css';

export default function AppLayout() {
	return (
		<Stack>
			<Stack.Screen name='index' options={{ headerShown: false }} />
			<Stack.Screen name='login/index' options={{ headerShown: false }} />
			<Stack.Screen name='(tabs)' options={{ headerShown: false }} />
		</Stack>
	);
}
