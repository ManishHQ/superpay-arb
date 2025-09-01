import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ExpoQRCode } from '@/components';

export default function ExpoQRPage() {
	const [expoUrl, setExpoUrl] = useState<string>('');

	useEffect(() => {
		// Get the current hostname and port for development
		if (Platform.OS === 'web') {
			const hostname = window.location.hostname;
			const port = '8081'; // Default Expo development port

			// For local development, use localhost or your local IP
			if (hostname === 'localhost' || hostname === '127.0.0.1') {
				// You can customize this IP address for your local network
				setExpoUrl(`exp://192.168.1.100:${port}`);
			} else {
				// For production or deployed web app, you might want to use your actual Expo project URL
				// You can also get this from environment variables
				setExpoUrl(`exp://${hostname}:${port}`);
			}
		}
	}, []);

	return (
		<SafeAreaView
			style={styles.container}
			className='web:min-h-screen web:bg-gradient-to-br web:from-slate-50 web:to-blue-50'
		>
			<StatusBar style='dark' backgroundColor='#F8FAFC' />

			{/* Main Container */}
			<View
				style={styles.mainContainer}
				className='web:flex web:flex-col web:items-center web:justify-center web:min-h-screen web:py-8 web:px-4'
			>
				{/* Header */}
				<View
					style={styles.header}
					className='web:mb-8 web:text-center web:max-w-2xl'
				>
					<View
						style={styles.logoContainer}
						className='web:flex-row web:items-center web:justify-center web:mb-4'
					>
						<View
							style={styles.iconWrapper}
							className='web:bg-blue-500 web:p-3 web:rounded-xl web:shadow-lg web:shadow-blue-500/30'
						>
							<Ionicons name='wallet' size={32} color='#ffffff' />
						</View>
						<Text
							style={styles.title}
							className='web:text-4xl web:font-black web:text-slate-800 web:ml-3 web:tracking-tight'
						>
							SuperPay
						</Text>
					</View>
					<Text
						style={styles.subtitle}
						className='web:text-lg web:text-slate-600 web:text-center web:leading-relaxed web:max-w-2xl web:font-medium'
					>
						Access SuperPay on your mobile device using Expo Go
					</Text>
				</View>

				{/* QR Code Card - Modal Style */}
				<View
					style={styles.qrCard}
					className='web:bg-white web:rounded-3xl web:shadow-2xl web:shadow-slate-900/10 web:p-6 web:max-w-md web:w-full web:mx-4 web:max-h-[80vh] web:overflow-hidden'
				>
					<ScrollView
						style={styles.scrollView}
						contentContainerStyle={styles.scrollContent}
						showsVerticalScrollIndicator={false}
						className='web:max-h-full'
					>
						<ExpoQRCode
							expoUrl={expoUrl}
							showInstructions={true}
							showDownloadLinks={true}
						/>
					</ScrollView>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F8FAFC',
	},
	mainContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingVertical: 20,
	},
	header: {
		alignItems: 'center',
		marginBottom: 32,
	},
	logoContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
	},
	iconWrapper: {
		backgroundColor: '#3b82f6',
		padding: 12,
		borderRadius: 12,
		shadowColor: '#3b82f6',
		shadowOffset: {
			width: 0,
			height: 8,
		},
		shadowOpacity: 0.3,
		shadowRadius: 16,
		elevation: 8,
	},
	title: {
		fontSize: 36,
		fontWeight: '900',
		color: '#1F2937',
		letterSpacing: -1,
	},
	subtitle: {
		fontSize: 18,
		color: '#6B7280',
		textAlign: 'center',
		lineHeight: 26,
		fontWeight: '500',
	},
	qrCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 24,
		padding: 24,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 20,
		},
		shadowOpacity: 0.15,
		shadowRadius: 40,
		elevation: 12,
		maxHeight: '80%',
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
	},
});
