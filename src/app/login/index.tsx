import { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
} from 'react-native';
import { router } from 'expo-router';

export default function LoginPage() {
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [otp, setOtp] = useState('');
	const [showOTPInput, setShowOTPInput] = useState(false);

	const handleEmailLogin = () => {
		// Move authentication logic to services
		console.log('Email login:', email);
		setShowOTPInput(true);
	};

	const handleSMSLogin = () => {
		// Move authentication logic to services
		console.log('SMS login:', phone);
		setShowOTPInput(true);
	};

	const handleOTPVerification = () => {
		// Move verification logic to services
		console.log('OTP verification:', otp);
		router.push('/(tabs)/home');
	};

	const handleSocialLogin = (provider: string) => {
		// Move social auth logic to services
		console.log('Social login:', provider);
		router.push('/(tabs)/home');
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Welcome to SuperPay</Text>

			{showOTPInput ? (
				<View style={styles.section}>
					<Text style={styles.label}>Enter OTP</Text>
					<TextInput
						style={styles.input}
						placeholder='Enter OTP code'
						value={otp}
						onChangeText={setOtp}
						keyboardType='numeric'
					/>
					<TouchableOpacity
						style={styles.button}
						onPress={handleOTPVerification}
					>
						<Text style={styles.buttonText}>Verify OTP</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.cancelButton}
						onPress={() => setShowOTPInput(false)}
					>
						<Text style={styles.cancelButtonText}>Cancel</Text>
					</TouchableOpacity>
				</View>
			) : (
				<>
					<View style={styles.section}>
						<Text style={styles.label}>Email Login</Text>
						<TextInput
							style={styles.input}
							placeholder='Enter your email'
							value={email}
							onChangeText={setEmail}
							keyboardType='email-address'
						/>
						<TouchableOpacity style={styles.button} onPress={handleEmailLogin}>
							<Text style={styles.buttonText}>Send Email OTP</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.section}>
						<Text style={styles.label}>SMS Login</Text>
						<TextInput
							style={styles.input}
							placeholder='Enter your phone number'
							value={phone}
							onChangeText={setPhone}
							keyboardType='phone-pad'
						/>
						<TouchableOpacity style={styles.button} onPress={handleSMSLogin}>
							<Text style={styles.buttonText}>Send SMS OTP</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.socialSection}>
						<TouchableOpacity
							style={styles.socialButton}
							onPress={() => handleSocialLogin('farcaster')}
						>
							<Text style={styles.buttonText}>Connect with Farcaster</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.socialButton}
							onPress={() => handleSocialLogin('google')}
						>
							<Text style={styles.buttonText}>Connect with Google</Text>
						</TouchableOpacity>
					</View>
				</>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#f5f5f5',
		justifyContent: 'center',
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 40,
		color: '#333',
	},
	section: {
		marginBottom: 30,
	},
	socialSection: {
		marginTop: 20,
		gap: 15,
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 10,
		color: '#333',
	},
	input: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		padding: 15,
		fontSize: 16,
		backgroundColor: '#fff',
		marginBottom: 15,
	},
	button: {
		backgroundColor: '#4F46E5',
		borderRadius: 8,
		padding: 15,
		alignItems: 'center',
	},
	socialButton: {
		backgroundColor: '#6B7280',
		borderRadius: 8,
		padding: 15,
		alignItems: 'center',
	},
	cancelButton: {
		backgroundColor: '#EF4444',
		borderRadius: 8,
		padding: 15,
		alignItems: 'center',
		marginTop: 10,
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	cancelButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
});
