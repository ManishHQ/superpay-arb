import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

interface WaitlistEntry {
	id: string;
	name: string;
	email: string;
	created_at: string;
	status: 'pending' | 'confirmed' | 'launched';
}

export default function WaitlistPage() {
	const [email, setEmail] = useState('');
	const [name, setName] = useState('');
	const [referral, setReferral] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [waitlistCount, setWaitlistCount] = useState(0);
	const [recentEntries, setRecentEntries] = useState<WaitlistEntry[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showReferral, setShowReferral] = useState(false);

	// Fetch waitlist data on component mount and set up real-time subscription
	useEffect(() => {
		fetchWaitlistData();

		// Set up real-time subscription for new waitlist entries
		const subscription = supabase
			.channel('waitlist_changes')
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'waitlist',
				},
				(payload) => {
					// Update count and recent entries when someone new joins
					setWaitlistCount((prev) => prev + 1);
					setRecentEntries((prev) => [
						payload.new as WaitlistEntry,
						...prev.slice(0, 4),
					]);
				}
			)
			.subscribe();

		// Cleanup subscription on unmount
		return () => {
			subscription.unsubscribe();
		};
	}, []);

	const fetchWaitlistData = async () => {
		try {
			// Get total count
			const { count, error: countError } = await supabase
				.from('waitlist')
				.select('*', { count: 'exact', head: true });

			if (countError) throw countError;
			setWaitlistCount(count || 0);

			// Get recent entries for social proof
			const { data: recentData, error: recentError } = await supabase
				.from('waitlist')
				.select('*')
				.order('created_at', { ascending: false })
				.limit(5);

			if (recentError) throw recentError;
			setRecentEntries(recentData || []);
		} catch (error) {
			console.error('Error fetching waitlist data:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const validateEmail = (email: string) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const handleSubmit = async () => {
		if (!name.trim()) {
			Alert.alert('Error', 'Please enter your name');
			return;
		}

		if (!email.trim()) {
			Alert.alert('Error', 'Please enter your email');
			return;
		}

		if (!validateEmail(email)) {
			Alert.alert('Error', 'Please enter a valid email address');
			return;
		}

		setIsSubmitting(true);

		try {
			// Check if email already exists
			const { data: existingEntry, error: checkError } = await supabase
				.from('waitlist')
				.select('id')
				.eq('email', email.trim().toLowerCase())
				.single();

			if (checkError && checkError.code !== 'PGRST116') {
				throw checkError;
			}

			if (existingEntry) {
				Alert.alert(
					'Already on the waitlist!',
					"This email is already registered. We'll keep you updated!"
				);
				setIsSubmitted(true);
				return;
			}

			// Insert new waitlist entry
			const { error: insertError } = await supabase.from('waitlist').insert([
				{
					name: name.trim(),
					email: email.trim().toLowerCase(),
					status: 'pending',
					source: referral.trim() || 'website',
				},
			]);

			if (insertError) throw insertError;

			// Update local state
			setIsSubmitted(true);
			setEmail('');
			setName('');
			setReferral('');

			// Refresh waitlist data
			await fetchWaitlistData();

			// Show success message
			Alert.alert(
				'Success!',
				"Welcome to the SuperPay waitlist! We'll notify you when we launch."
			);
		} catch (error) {
			console.error('Error submitting waitlist entry:', error);
			Alert.alert('Error', 'Failed to join waitlist. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleJoinAgain = () => {
		setIsSubmitted(false);
	};

	const formatTimeAgo = (dateString: string) => {
		const now = new Date();
		const created = new Date(dateString);
		const diffInMinutes = Math.floor(
			(now.getTime() - created.getTime()) / (1000 * 60)
		);

		if (diffInMinutes < 1) return 'Just now';
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
		return `${Math.floor(diffInMinutes / 1440)}d ago`;
	};

	if (isSubmitted) {
		return (
			<View className='min-h-screen bg-white'>
				<LinearGradient
					colors={['#0d71ba', '#0a5a94']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					className='absolute inset-0'
				/>

				<View className='items-center justify-center flex-1 p-8'>
					<View className='w-full max-w-lg p-12 shadow-2xl bg-white/95 backdrop-blur-xl rounded-3xl'>
						<View className='items-center'>
							<View className='items-center justify-center w-24 h-24 mb-8 bg-green-100 rounded-full'>
								<Ionicons name='checkmark-circle' size={64} color='#10B981' />
							</View>

							<Text className='mb-6 text-4xl font-black leading-tight text-center text-gray-900'>
								You're In! 🚀
							</Text>

							<Text className='mb-8 text-xl leading-relaxed text-center text-gray-600'>
								Welcome to the exclusive club. We'll notify you the moment we
								launch.
							</Text>

							<View className='w-full p-6 mb-8 bg-blue-50 rounded-2xl'>
								<Text className='mb-4 text-lg font-bold text-center text-blue-900'>
									What Happens Next?
								</Text>
								<View className='space-y-4'>
									<View className='flex-row items-center'>
										<View className='items-center justify-center w-8 h-8 mr-4 bg-blue-500 rounded-full'>
											<Text className='font-bold text-white'>1</Text>
										</View>
										<Text className='text-lg text-blue-800'>
											Confirmation email sent
										</Text>
									</View>
									<View className='flex-row items-center'>
										<View className='items-center justify-center w-8 h-8 mr-4 bg-blue-500 rounded-full'>
											<Text className='font-bold text-white'>2</Text>
										</View>
										<Text className='text-lg text-blue-800'>
											Early access updates
										</Text>
									</View>
									<View className='flex-row items-center'>
										<View className='items-center justify-center w-8 h-8 mr-4 bg-blue-500 rounded-full'>
											<Text className='font-bold text-white'>3</Text>
										</View>
										<Text className='text-lg text-blue-800'>
											VIP launch access
										</Text>
									</View>
								</View>
							</View>

							<TouchableOpacity
								onPress={handleJoinAgain}
								className='w-full px-8 py-4 bg-blue-600 rounded-2xl'
							>
								<Text className='text-lg font-bold text-center text-white'>
									Join Another Email
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</View>
		);
	}

	return (
		<View className='min-h-screen bg-white'>
			{/* Single Height Two-Column Layout */}
			<View className='flex-row flex-1'>
				{/* Left Column - Content */}
				<View className='justify-center flex-1 px-12 py-8'>
					{/* Logo */}
					<View className='flex-row items-center mb-8'>
						<View className='items-center justify-center w-12 h-12 mr-3'>
							<View className='relative items-center justify-center w-12 h-12 overflow-hidden rounded-2xl'>
								<Image
									source={require('../../assets/superpay-logo.png')}
									className='w-full h-full'
									contentFit='contain'
								/>
							</View>
						</View>
					</View>

					{/* Badge */}
					<View className='px-4 py-2 mb-6 border border-blue-200 rounded-full bg-blue-50 w-fit'>
						<Text className='text-sm font-medium text-blue-700'>
							🚀 Coming Soon - Join the Revolution
						</Text>
					</View>

					{/* Main Headline */}
					<Text className='mb-4 text-4xl font-black leading-tight text-gray-900'>
						The Future of
						<Text className='text-blue-600'> Payments</Text>
						{'\n'}is Here
					</Text>

					{/* Subheadline */}
					<Text className='max-w-lg mb-6 text-lg leading-relaxed text-gray-600'>
						Experience lightning-fast transactions, zero fees, and seamless
						cross-border payments. Join thousands already waiting for the
						revolution.
					</Text>

					{/* Dynamic Stats */}
					<View className='flex-row mb-8 space-x-6'>
						<View className='items-center'>
							<Text className='text-2xl font-black text-blue-600'>
								{isLoading ? '...' : `${waitlistCount.toLocaleString()}+`}
							</Text>
							<Text className='text-sm text-gray-600'>Waitlist Members</Text>
						</View>
						<View className='items-center'>
							<Text className='text-2xl font-black text-blue-600'>150+</Text>
							<Text className='text-sm text-gray-600'>Countries</Text>
						</View>
						<View className='items-center'>
							<Text className='text-2xl font-black text-blue-600'>0.3%</Text>
							<Text className='text-sm text-gray-600'>Transaction Fees</Text>
						</View>
					</View>

					{/* Features */}
					<View className='mb-6 space-y-3'>
						<View className='flex-row items-center'>
							<View className='items-center justify-center w-5 h-5 mr-3 bg-green-100 rounded-full'>
								<Ionicons name='checkmark' size={14} color='#10B981' />
							</View>
							<Text className='text-base text-gray-700'>
								Lightning-fast transactions under 3 seconds
							</Text>
						</View>
						<View className='flex-row items-center'>
							<View className='items-center justify-center w-5 h-5 mr-3 bg-green-100 rounded-full'>
								<Ionicons name='checkmark' size={14} color='#10B981' />
							</View>
							<Text className='text-base text-gray-700'>
								Zero transaction fees worldwide
							</Text>
						</View>
						<View className='flex-row items-center'>
							<View className='items-center justify-center w-5 h-5 mr-3 bg-green-100 rounded-full'>
								<Ionicons name='checkmark' size={14} color='#10B981' />
							</View>
							<Text className='text-base text-gray-700'>
								Bank-grade security & encryption
							</Text>
						</View>
					</View>

					{/* Recent Joiners - Compact */}
					{recentEntries.length > 0 && (
						<View className='mt-6'>
							<Text className='mb-2 text-xs text-gray-500'>
								Recent joiners:
							</Text>
							<View className='flex-row flex-wrap gap-1'>
								{recentEntries.slice(0, 3).map((entry, index) => (
									<View
										key={entry.id}
										className='flex-row items-center px-2 py-1 bg-gray-100 rounded-full'
									>
										<Text className='text-xs font-medium text-gray-700'>
											{entry.name.split(' ')[0]}
										</Text>
										<Text className='ml-1 text-xs text-gray-500'>
											{formatTimeAgo(entry.created_at)}
										</Text>
									</View>
								))}
							</View>
						</View>
					)}

					{/* Source Distribution - Compact */}
					<View className='mt-4'>
						<Text className='mb-2 text-xs text-gray-500'>Top sources:</Text>
						<View className='flex-row flex-wrap gap-1'>
							<View className='px-2 py-1 bg-blue-100 rounded-full'>
								<Text className='text-xs font-medium text-blue-700'>
									Website
								</Text>
							</View>
							<View className='px-2 py-1 bg-purple-100 rounded-full'>
								<Text className='text-xs font-medium text-purple-700'>
									Social Media
								</Text>
							</View>
							<View className='px-2 py-1 bg-green-100 rounded-full'>
								<Text className='text-xs font-medium text-green-700'>
									Referrals
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Right Column - Form */}
				<View className='justify-center flex-1 px-12 py-8 bg-gradient-to-br from-blue-50 to-blue-100'>
					<View className='w-full max-w-md p-8 bg-white shadow-2xl rounded-3xl'>
						{/* Form Header */}
						<View className='mb-6 text-center'>
							<Text className='mb-2 text-2xl font-bold text-gray-900'>
								Get Early Access
							</Text>
							<Text className='text-base text-gray-600'>
								Join the payment revolution today
							</Text>
						</View>

						{/* Form */}
						<View className='mb-6 space-y-4'>
							<View>
								<Text className='mb-2 text-sm font-semibold text-gray-700'>
									Full Name
								</Text>
								<View className='px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:border-blue-500'>
									<TextInput
										value={name}
										onChangeText={setName}
										placeholder='Enter your full name'
										placeholderTextColor='#9CA3AF'
										className='text-base text-gray-900'
									/>
								</View>
							</View>

							<View>
								<Text className='mb-2 text-sm font-semibold text-gray-700'>
									Email Address
								</Text>
								<View className='px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:border-blue-500'>
									<TextInput
										value={email}
										onChangeText={setEmail}
										placeholder='your@email.com'
										placeholderTextColor='#9CA3AF'
										keyboardType='email-address'
										autoCapitalize='none'
										className='text-base text-gray-900'
									/>
								</View>
							</View>

							{/* Referral Input (Optional) */}
							<View>
								<Text className='mb-2 text-sm font-semibold text-gray-700'>
									How did you hear about us? (Optional)
								</Text>
								<View className='px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:border-blue-500'>
									<TextInput
										value={referral}
										onChangeText={setReferral}
										placeholder='Social media, friend, etc.'
										placeholderTextColor='#9CA3AF'
										className='text-base text-gray-900'
									/>
								</View>
							</View>
						</View>

						{/* Submit Button */}
						<TouchableOpacity
							onPress={handleSubmit}
							disabled={isSubmitting}
							className={`py-4 rounded-xl items-center ${
								isSubmitting ? 'bg-gray-400' : 'bg-blue-600'
							}`}
						>
							{isSubmitting ? (
								<View className='flex-row items-center'>
									<ActivityIndicator size='small' color='white' />
									<Text className='ml-2 text-lg font-bold text-white'>
										Joining...
									</Text>
								</View>
							) : (
								<Text className='text-lg font-bold text-white'>
									Join the Waitlist
								</Text>
							)}
						</TouchableOpacity>

						<TouchableOpacity
							onPress={() => {
								router.push('/login');
							}}
							className='items-center py-4'
						>
							<Text className='text-lg font-bold text-blue'>Try the demo</Text>
						</TouchableOpacity>

						{/* Social Proof */}
						<View className='pt-4 mt-6 border-t border-gray-200'>
							<Text className='mb-2 text-xs text-center text-gray-500'>
								Join {waitlistCount.toLocaleString()}+ people already waiting
							</Text>
							<View className='flex-row justify-center space-x-2'>
								{recentEntries.slice(0, 4).map((entry, index) => (
									<View
										key={entry.id}
										className='items-center justify-center bg-blue-500 rounded-full w-7 h-7'
									>
										<Text className='text-xs font-bold text-white'>
											{entry.name.charAt(0).toUpperCase()}
										</Text>
									</View>
								))}
								{recentEntries.length < 4 && (
									<View className='items-center justify-center bg-gray-400 rounded-full w-7 h-7'>
										<Text className='text-xs font-bold text-white'>+</Text>
									</View>
								)}
							</View>
						</View>

						{/* Privacy Note */}
						<Text className='mt-4 text-xs text-center text-gray-500'>
							No spam, just updates. We respect your privacy.
						</Text>
					</View>
				</View>
			</View>
		</View>
	);
}
