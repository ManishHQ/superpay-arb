import { Slot } from 'expo-router';
import { client } from '@/lib/client';

export default function AppLayout() {
	return (
		<>
			<client.reactNative.WebView />
			<Slot />
		</>
	);
}
