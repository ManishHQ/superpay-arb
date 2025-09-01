import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	StyleSheet,
	useWindowDimensions,
	ActivityIndicator,
	RefreshControl,
	Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserProfileStore } from '@/stores/userProfileStore';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AvatarService } from '@/services/avatarService';
import { Image } from 'react-native';
import { QRPaymentRequestModal } from '@/components/QRPaymentRequestModal';
import { PaymentRequestModal } from '@/components/PaymentRequestModal';
import { QuickQRGenerator } from '@/components/QuickQRGenerator';
import {
	BusinessDashboardService,
	BusinessStats,
	RecentActivity,
} from '@/services/businessDashboardService';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5', // Changed to light gray to see if it renders
	},
	desktopContainer: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 24,
		paddingHorizontal: 24,
		paddingVertical: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#f3f4f6',
	},
	profileSection: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	avatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		marginRight: 16,
		backgroundColor: '#e5e7eb', // Fallback background
	},
	greeting: {
		fontSize: 24,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 4,
	},
	businessName: {
		fontSize: 16,
		color: '#6b7280',
	},
	statsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginBottom: 32,
		paddingHorizontal: 24,
	},
	statCard: {
		backgroundColor: '#ffffff',
		borderRadius: 16,
		padding: 24,
		marginBottom: 16,
		marginRight: 16,
		width: 280,
		borderWidth: 1,
		borderColor: '#f3f4f6',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	statHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
	},
	statValue: {
		fontSize: 32,
		fontWeight: '800',
		color: '#111827',
		marginBottom: 4,
	},
	statLabel: {
		fontSize: 14,
		color: '#6b7280',
		fontWeight: '500',
	},
	iconContainer: {
		width: 48,
		height: 48,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	sectionContainer: {
		backgroundColor: '#ffffff',
		borderRadius: 16,
		marginHorizontal: 24,
		marginBottom: 24,
		borderWidth: 1,
		borderColor: '#f3f4f6',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	sectionHeader: {
		fontSize: 20,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 20,
		paddingHorizontal: 24,
		paddingTop: 24,
	},
	activityItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 24,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#f9fafb',
	},
	activityLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	activityIconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 16,
	},
	activityTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 2,
	},
	activitySubtitle: {
		fontSize: 14,
		color: '#6b7280',
	},
	activityAmount: {
		fontSize: 16,
		fontWeight: '700',
	},
	quickActionsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingHorizontal: 24,
		paddingBottom: 24,
	},
	quickActionButton: {
		alignItems: 'center',
		flex: 1,
		marginHorizontal: 8,
	},
	quickActionIcon: {
		width: 56,
		height: 56,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
	},
	quickActionLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: '#374151',
		textAlign: 'center',
	},
});

export default function BusinessDashboard() {
	const { currentProfile, isLoading } = useUserProfileStore();
	const { width } = useWindowDimensions();
	const isDesktop = width >= 768;
	const [showQRPaymentModal, setShowQRPaymentModal] = useState(false);
	const [showPaymentRequestModal, setShowPaymentRequestModal] = useState(false);
	const [showQuickQRModal, setShowQuickQRModal] = useState(false);

	// Real data state
	const [businessStats, setBusinessStats] = useState<BusinessStats | null>(
		null
	);
	const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
	const [dataLoading, setDataLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		if (currentProfile?.id) {
			loadDashboardData();
		}
	}, [currentProfile]);

	const loadDashboardData = async () => {
		if (!currentProfile?.id) return;

		try {
			setDataLoading(true);
			const [stats, activity] = await Promise.all([
				BusinessDashboardService.getBusinessStats(currentProfile.id),
				BusinessDashboardService.getRecentActivity(currentProfile.id, 5),
			]);

			setBusinessStats(stats);
			setRecentActivity(activity);
		} catch (error) {
			console.error('Error loading dashboard data:', error);
			Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
		} finally {
			setDataLoading(false);
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await loadDashboardData();
		setRefreshing(false);
	};

	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 17) return 'Good afternoon';
		return 'Good evening';
	};

	const getActivityIcon = (type: RecentActivity['type']) => {
		switch (type) {
			case 'payment_received':
				return {
					name: 'arrow-down',
					color: '#16a34a',
					backgroundColor: '#dcfce7',
				};
			case 'payment_sent':
				return {
					name: 'arrow-up',
					color: '#dc2626',
					backgroundColor: '#fecaca',
				};
			case 'new_customer':
				return {
					name: 'person-add',
					color: '#2563eb',
					backgroundColor: '#dbeafe',
				};
			case 'payment_pending':
				return { name: 'time', color: '#ea580c', backgroundColor: '#fed7aa' };
			case 'payment_request':
				return { name: 'card', color: '#7c3aed', backgroundColor: '#f3e8ff' };
			default:
				return {
					name: 'ellipse',
					color: '#6b7280',
					backgroundColor: '#f3f4f6',
				};
		}
	};

	const displayName =
		currentProfile?.business_name ||
		currentProfile?.display_name ||
		currentProfile?.full_name ||
		'Business Owner';
	const avatarUrl = AvatarService.getAvatarUrl({
		avatar_url: currentProfile?.avatar_url,
		username: currentProfile?.username || 'business',
	});

	// Ensure we have fallback values
	const safeDisplayName = displayName || 'Business Owner';
	const safeAvatarUrl =
		avatarUrl ||
		AvatarService.getAvatarUrl({
			username: currentProfile?.username || 'business',
		});

	// Show loading state
	if (isLoading || dataLoading) {
		return (
			<SafeAreaView style={styles.container}>
				<View
					style={[
						styles.container,
						{ justifyContent: 'center', alignItems: 'center' },
					]}
				>
					<ActivityIndicator size='large' color='#3b82f6' />
					<Text style={[styles.greeting, { marginTop: 16 }]}>
						Loading dashboard...
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView
				style={{ flex: 1 }}
				showsVerticalScrollIndicator={true}
				contentContainerStyle={{ paddingBottom: 100 }}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			>
				{/* Header */}
				<View style={styles.header}>
					<View style={styles.profileSection}>
						<Image
							source={{ uri: safeAvatarUrl }}
							style={styles.avatar}
							resizeMode='cover'
						/>
						<View>
							<Text style={styles.greeting}>{getGreeting()}!</Text>
							<Text style={styles.businessName}>{safeDisplayName}</Text>
						</View>
					</View>
					<TouchableOpacity style={{ padding: 8 }}>
						<Ionicons name='notifications-outline' size={24} color='#6B7280' />
					</TouchableOpacity>
				</View>

				{/* Business Stats Cards */}
				{businessStats ? (
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						style={styles.statsContainer}
					>
						<View style={styles.statCard}>
							<View style={styles.statHeader}>
								<View>
									<Text style={styles.statValue}>
										{BusinessDashboardService.formatCurrency(
											businessStats.monthly_revenue
										)}
									</Text>
									<Text style={styles.statLabel}>Monthly Revenue</Text>
								</View>
								<View
									style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}
								>
									<Ionicons name='trending-up' size={24} color='#16a34a' />
								</View>
							</View>
						</View>

						<View style={styles.statCard}>
							<View style={styles.statHeader}>
								<View>
									<Text style={styles.statValue}>
										{businessStats.total_transactions}
									</Text>
									<Text style={styles.statLabel}>Transactions</Text>
								</View>
								<View
									style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}
								>
									<Ionicons name='card' size={24} color='#2563eb' />
								</View>
							</View>
						</View>

						<View style={styles.statCard}>
							<View style={styles.statHeader}>
								<View>
									<Text style={styles.statValue}>
										{businessStats.total_customers}
									</Text>
									<Text style={styles.statLabel}>Customers</Text>
								</View>
								<View
									style={[styles.iconContainer, { backgroundColor: '#f3e8ff' }]}
								>
									<Ionicons name='people' size={24} color='#7c3aed' />
								</View>
							</View>
						</View>
					</ScrollView>
				) : (
					<View style={styles.statsContainer}>
						<View style={[styles.statCard, { opacity: 0.5 }]}>
							<View style={styles.statHeader}>
								<View>
									<Text style={styles.statValue}>--</Text>
									<Text style={styles.statLabel}>Loading...</Text>
								</View>
							</View>
						</View>
					</View>
				)}

				{/* Recent Activity */}
				<View style={styles.sectionContainer}>
					<Text style={styles.sectionHeader}>Recent Activity</Text>

					<View>
						{recentActivity.length === 0 ? (
							<View
								style={{
									paddingHorizontal: 24,
									paddingVertical: 32,
									alignItems: 'center',
								}}
							>
								<Ionicons name='time-outline' size={48} color='#d1d5db' />
								<Text
									style={{
										fontSize: 16,
										color: '#6b7280',
										marginTop: 8,
										textAlign: 'center',
									}}
								>
									No recent activity
								</Text>
								<Text
									style={{
										fontSize: 14,
										color: '#9ca3af',
										marginTop: 4,
										textAlign: 'center',
									}}
								>
									Activity will appear here as you complete transactions
								</Text>
							</View>
						) : (
							recentActivity.map((activity, index) => {
								const icon = getActivityIcon(activity.type);
								const isLast = index === recentActivity.length - 1;

								return (
									<View
										key={activity.id}
										style={[
											styles.activityItem,
											isLast && { borderBottomWidth: 0 },
										]}
									>
										<View style={styles.activityLeft}>
											<View
												style={[
													styles.activityIconContainer,
													{ backgroundColor: icon.backgroundColor },
												]}
											>
												<Ionicons
													name={icon.name as any}
													size={20}
													color={icon.color}
												/>
											</View>
											<View>
												<Text style={styles.activityTitle}>
													{activity.title}
												</Text>
												<Text style={styles.activitySubtitle}>
													{activity.subtitle}
												</Text>
											</View>
										</View>
										{activity.amount && (
											<Text
												style={[
													styles.activityAmount,
													{
														color:
															activity.type === 'payment_received'
																? '#16a34a'
																: activity.type === 'payment_sent'
																	? '#dc2626'
																	: '#ea580c',
													},
												]}
											>
												{activity.type === 'payment_received'
													? '+'
													: activity.type === 'payment_sent'
														? '-'
														: ''}
												${activity.amount.toFixed(2)}
											</Text>
										)}
									</View>
								);
							})
						)}
					</View>
				</View>

				{/* Quick Actions */}
				<View style={styles.sectionContainer}>
					<Text style={styles.sectionHeader}>Quick Actions</Text>

					<View style={styles.quickActionsContainer}>
						<TouchableOpacity
							style={styles.quickActionButton}
							onPress={() => setShowPaymentRequestModal(true)}
						>
							<View
								style={[styles.quickActionIcon, { backgroundColor: '#dbeafe' }]}
							>
								<Ionicons name='card' size={28} color='#2563eb' />
							</View>
							<Text style={styles.quickActionLabel}>Request Payment</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.quickActionButton}
							onPress={() => setShowQuickQRModal(true)}
						>
							<View
								style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}
							>
								<Ionicons name='qr-code' size={28} color='#16a34a' />
							</View>
							<Text style={styles.quickActionLabel}>Quick QR</Text>
						</TouchableOpacity>

						<TouchableOpacity style={styles.quickActionButton}>
							<View
								style={[styles.quickActionIcon, { backgroundColor: '#f3e8ff' }]}
							>
								<Ionicons name='analytics' size={28} color='#7c3aed' />
							</View>
							<Text style={styles.quickActionLabel}>Reports</Text>
						</TouchableOpacity>

						<TouchableOpacity style={styles.quickActionButton}>
							<View
								style={[styles.quickActionIcon, { backgroundColor: '#fed7aa' }]}
							>
								<Ionicons name='settings' size={28} color='#ea580c' />
							</View>
							<Text style={styles.quickActionLabel}>Settings</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>

			{/* Working Modals - Positioned outside ScrollView for proper overlay */}
			<QRPaymentRequestModal
				visible={showQRPaymentModal}
				onClose={() => setShowQRPaymentModal(false)}
			/>

			<PaymentRequestModal
				visible={showPaymentRequestModal}
				onClose={() => setShowPaymentRequestModal(false)}
				onRequestSent={(requestData) => {
					console.log('Payment request sent:', requestData);
					// You can refresh the dashboard or show a success message here
				}}
			/>

			<QuickQRGenerator
				visible={showQuickQRModal}
				onClose={() => setShowQuickQRModal(false)}
			/>
		</SafeAreaView>
	);
}
