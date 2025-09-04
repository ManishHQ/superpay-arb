import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
	onAnimationComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
	onAnimationComplete,
}) => {
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.3)).current;
	const slideAnim = useRef(new Animated.Value(50)).current;
	const rotateAnim = useRef(new Animated.Value(0)).current;
	const pulseAnim = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		const animationSequence = Animated.sequence([
			// Initial fade in
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 800,
				useNativeDriver: true,
			}),
			// Logo scale and slide up
			Animated.parallel([
				Animated.spring(scaleAnim, {
					toValue: 1,
					tension: 100,
					friction: 8,
					useNativeDriver: true,
				}),
				Animated.spring(slideAnim, {
					toValue: 0,
					tension: 100,
					friction: 8,
					useNativeDriver: true,
				}),
			]),
			// Continuous animations
			Animated.loop(
				Animated.sequence([
					Animated.timing(rotateAnim, {
						toValue: 1,
						duration: 3000,
						useNativeDriver: true,
					}),
					Animated.timing(rotateAnim, {
						toValue: 0,
						duration: 3000,
						useNativeDriver: true,
					}),
				])
			),
		]);

		// Pulse animation for the main icon
		const pulseSequence = Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, {
					toValue: 1.1,
					duration: 1500,
					useNativeDriver: true,
				}),
				Animated.timing(pulseAnim, {
					toValue: 1,
					duration: 1500,
					useNativeDriver: true,
				}),
			])
		);

		animationSequence.start();
		pulseSequence.start();

		// Auto-complete after 3 seconds
		const timer = setTimeout(() => {
			onAnimationComplete();
		}, 3000);

		return () => clearTimeout(timer);
	}, [
		fadeAnim,
		scaleAnim,
		slideAnim,
		rotateAnim,
		pulseAnim,
		onAnimationComplete,
	]);

	const spin = rotateAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '360deg'],
	});

	return (
		<LinearGradient
			colors={['#1E3A8A', '#3B82F6', '#8B5CF6', '#EC4899']}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			style={styles.container}
		>
			{/* Animated background elements */}
			<Animated.View
				style={[
					styles.floatingIcon,
					{
						opacity: fadeAnim,
						transform: [{ rotate: spin }],
					},
				]}
			>
				<Ionicons name='trending-up' size={40} color='rgba(255,255,255,0.1)' />
			</Animated.View>

			<Animated.View
				style={[
					styles.floatingIcon,
					styles.floatingIcon2,
					{
						opacity: fadeAnim,
						transform: [{ rotate: spin }],
					},
				]}
			>
				<Ionicons name='wallet' size={35} color='rgba(255,255,255,0.08)' />
			</Animated.View>

			<Animated.View
				style={[
					styles.floatingIcon,
					styles.floatingIcon3,
					{
						opacity: fadeAnim,
						transform: [{ rotate: spin }],
					},
				]}
			>
				<Ionicons name='card' size={30} color='rgba(255,255,255,0.06)' />
			</Animated.View>

			{/* Main content */}
			<View style={styles.content}>
				{/* Logo container */}
				<Animated.View
					style={[
						styles.logoContainer,
						{
							opacity: fadeAnim,
							transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
						},
					]}
				>
					<Animated.View
						style={[
							styles.iconContainer,
							{
								transform: [{ scale: pulseAnim }],
							},
						]}
					>
						<Ionicons name='diamond' size={60} color='#FFFFFF' />
					</Animated.View>
				</Animated.View>

				{/* App name */}
				<Animated.Text
					style={[
						styles.appName,
						{
							opacity: fadeAnim,
							transform: [{ translateY: slideAnim }],
						},
					]}
				>
					SuperPay
				</Animated.Text>

				{/* Tagline */}
				<Animated.Text
					style={[
						styles.tagline,
						{
							opacity: fadeAnim,
							transform: [{ translateY: slideAnim }],
						},
					]}
				>
					Your Financial Future, Simplified
				</Animated.Text>

				{/* Loading indicator */}
				<Animated.View
					style={[
						styles.loadingContainer,
						{
							opacity: fadeAnim,
						},
					]}
				>
					<View style={styles.loadingDots}>
						<Animated.View
							style={[
								styles.dot,
								{
									transform: [{ scale: pulseAnim }],
								},
							]}
						/>
						<Animated.View
							style={[
								styles.dot,
								{
									transform: [{ scale: pulseAnim }],
								},
							]}
						/>
						<Animated.View
							style={[
								styles.dot,
								{
									transform: [{ scale: pulseAnim }],
								},
							]}
						/>
					</View>
				</Animated.View>
			</View>

			{/* Bottom gradient overlay */}
			<LinearGradient
				colors={['transparent', 'rgba(0,0,0,0.3)']}
				style={styles.bottomOverlay}
			>
				<Text style={styles.versionText}>v1.0.0</Text>
			</LinearGradient>
		</LinearGradient>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	floatingIcon: {
		position: 'absolute',
		top: '20%',
		left: '10%',
	},
	floatingIcon2: {
		top: '70%',
		right: '15%',
		left: 'auto',
	},
	floatingIcon3: {
		top: '40%',
		right: '20%',
		left: 'auto',
	},
	content: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	logoContainer: {
		marginBottom: 30,
	},
	iconContainer: {
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: 'rgba(255,255,255,0.2)',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 2,
		borderColor: 'rgba(255,255,255,0.3)',
	},
	appName: {
		fontSize: 42,
		fontWeight: 'bold',
		color: '#FFFFFF',
		marginBottom: 10,
		textShadowColor: 'rgba(0,0,0,0.3)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 4,
	},
	tagline: {
		fontSize: 18,
		color: 'rgba(255,255,255,0.9)',
		textAlign: 'center',
		marginBottom: 50,
		fontWeight: '500',
		textShadowColor: 'rgba(0,0,0,0.2)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 2,
	},
	loadingContainer: {
		marginTop: 20,
	},
	loadingDots: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#FFFFFF',
		marginHorizontal: 4,
	},
	bottomOverlay: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: 100,
		justifyContent: 'flex-end',
		alignItems: 'center',
		paddingBottom: 40,
	},
	versionText: {
		color: 'rgba(255,255,255,0.7)',
		fontSize: 14,
		fontWeight: '500',
	},
});
