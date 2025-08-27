import { Stack } from 'expo-router';
import { dynamicClient } from '@/lib/client';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import '../global.css';

export default function AppLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<dynamicClient.reactNative.WebView />
			<BottomSheetModalProvider>
				<Stack>
					<Stack.Screen name='index' options={{ headerShown: false }} />
					<Stack.Screen name='login/index' options={{ headerShown: false }} />
					<Stack.Screen name='login' options={{ headerShown: false }} />
					<Stack.Screen name='(tabs)' options={{ headerShown: false }} />
				</Stack>
			</BottomSheetModalProvider>
		</GestureHandlerRootView>
	);
}
