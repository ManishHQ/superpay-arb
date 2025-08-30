import { Stack } from 'expo-router';
import { dynamicClient } from '@/lib/client';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import '../global.css';

import { LogBox } from 'react-native';

LogBox.ignoreAllLogs();

if (!__DEV__) {
	(console as any) = {
		log: () => {},
		warn: () => {},
		error: () => {},
	};
}

export default function AppLayout() {
	return (
		<>
			<dynamicClient.reactNative.WebView />
			<GestureHandlerRootView style={{ flex: 1 }}>
				<BottomSheetModalProvider>
					<Stack>
						<Stack.Screen name='index' options={{ headerShown: false }} />
						<Stack.Screen name='login/index' options={{ headerShown: false }} />
						<Stack.Screen name='login' options={{ headerShown: false }} />
						<Stack.Screen name='(app)' options={{ headerShown: false }} />
						<Stack.Screen name='business' options={{ headerShown: false }} />
					</Stack>
				</BottomSheetModalProvider>
			</GestureHandlerRootView>
		</>
	);
}
