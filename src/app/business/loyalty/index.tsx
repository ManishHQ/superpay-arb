import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	RefreshControl,
	Alert,
	useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserProfileStore } from '@/stores/userProfileStore';
import {
	CustomerService,
	CustomerData,
	CustomerStats,
} from '@/services/customerService';
import { AvatarService } from '@/services/avatarService';
import { Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface LoyaltyTier {
	name: string;
	minSpending: number;
	color: string;
	backgroundColor: string;
	icon: string;
	benefits: string[];
}

interface CustomerWithLoyalty extends CustomerData {
	loyaltyTier: LoyaltyTier;
	loyaltyPoints: number;
	nextTierSpending: number;
	progressToNext: number;
}

const LOYALTY_TIERS: LoyaltyTier[] = [
	{
		name: 'Bronze',
		minSpending: 0,
		color: '#cd7f32',
		backgroundColor: '#fef3e2',
		icon: 'medal',
		benefits: ['Basic support', '5% discount on select items'],
	},
	{
		name: 'Silver',
		minSpending: 100,
		color: '#c0c0c0',
		backgroundColor: '#f8fafc',
		icon: 'trophy',
		benefits: ['Priority support', '10% discount', 'Free shipping'],
	},
	{
		name: 'Gold',
		minSpending: 500,
		color: '#ffd700',
		backgroundColor: '#fffbeb',
		icon: 'star',
		benefits: ['VIP support', '15% discount', 'Free shipping', 'Early access'],
	},
	{
		name: 'Platinum',
		minSpending: 1000,
		color: '#e5e4e2',
		backgroundColor: '#f1f5f9',
		icon: 'diamond',
		benefits: [
			'Dedicated manager',
			'20% discount',
			'Free everything',
			'Exclusive events',
		],
	},
];

export default function LoyaltyScreen() {
	const { currentProfile } = useUserProfileStore();
	const { width } = useWindowDimensions();
	const isDesktop = width >= 768;

	const [customers, setCustomers] = useState<CustomerWithLoyalty[]>([]);
	const [customerStats, setCustomerStats] = useState<CustomerStats | null>(
		null
	);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [selectedTier, setSelectedTier] = useState<string | null>(null);

	useEffect(() => {
		loadLoyaltyData();
	}, [currentProfile]);

	const loadLoyaltyData = async () => {
		if (!currentProfile?.id) return;

		try {
			setLoading(true);
			const [customersData, statsData] = await Promise.all([
				CustomerService.getBusinessCustomers(currentProfile.id),
				CustomerService.getCustomerStats(currentProfile.id),
			]);

			// Convert customers to loyalty customers
			const loyaltyCustomers = customersData.map((customer) => {
				const spending = customer.total_amount_received;
				const tier = getLoyaltyTier(spending);
				const nextTier = getNextTier(tier);

				return {
					...customer,
					loyaltyTier: tier,
					loyaltyPoints: Math.floor(spending * 10), // 10 points per dollar
					nextTierSpending: nextTier ? nextTier.minSpending - spending : 0,
					progressToNext: nextTier
						? ((spending - tier.minSpending) /
								(nextTier.minSpending - tier.minSpending)) *
							100
						: 100,
				};
			});

			// Sort by total spending (highest first)
			loyaltyCustomers.sort(
				(a, b) => b.total_amount_received - a.total_amount_received
			);

			setCustomers(loyaltyCustomers);
			setCustomerStats(statsData);
		} catch (error) {
			console.error('Error loading loyalty data:', error);
			Alert.alert('Error', 'Failed to load loyalty data. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await loadLoyaltyData();
		setRefreshing(false);
	};

	const getLoyaltyTier = (spending: number): LoyaltyTier => {
		for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
			if (spending >= LOYALTY_TIERS[i].minSpending) {
				return LOYALTY_TIERS[i];
			}
		}
		return LOYALTY_TIERS[0];
	};

	const getNextTier = (currentTier: LoyaltyTier): LoyaltyTier | null => {
		const currentIndex = LOYALTY_TIERS.findIndex(
			(tier) => tier.name === currentTier.name
		);
		return currentIndex < LOYALTY_TIERS.length - 1
			? LOYALTY_TIERS[currentIndex + 1]
			: null;
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
		}).format(amount);
	};

	const getCustomerDisplayName = (customer: CustomerData) => {
		return customer.display_name || customer.full_name || customer.username;
	};

	const getTierStats = () => {
		const stats = LOYALTY_TIERS.map((tier) => ({
			...tier,
			count: customers.filter((c) => c.loyaltyTier.name === tier.name).length,
			totalSpending: customers
				.filter((c) => c.loyaltyTier.name === tier.name)
				.reduce((sum, c) => sum + c.total_amount_received, 0),
		}));
		return stats;
	};

	const filteredCustomers = selectedTier
		? customers.filter((c) => c.loyaltyTier.name === selectedTier)
		: customers;

	const renderTierCard = (
		tier: LoyaltyTier,
		count: number,
		totalSpending: number
	) => (
		<TouchableOpacity
			key={tier.name}
			style={[
				styles.tierCard,
				{ backgroundColor: tier.backgroundColor },
				selectedTier === tier.name && styles.tierCardActive,
			]}
			onPress={() =>
				setSelectedTier(selectedTier === tier.name ? null : tier.name)
			}
		>
			<View style={styles.tierHeader}>
				<View style={[styles.tierIcon, { backgroundColor: tier.color + '20' }]}>
					<Ionicons name={tier.icon as any} size={24} color={tier.color} />
				</View>
				<View style={styles.tierInfo}>
					<Text style={[styles.tierName, { color: tier.color }]}>
						{tier.name}
					</Text>
					<Text style={styles.tierRequirement}>
						{tier.minSpending === 0
							? 'No minimum'
							: `${formatCurrency(tier.minSpending)}+ spent`}
					</Text>
				</View>
			</View>
			<View style={styles.tierStats}>
				<Text style={styles.tierCount}>{count} customers</Text>
				<Text style={styles.tierSpending}>{formatCurrency(totalSpending)}</Text>
			</View>
		</TouchableOpacity>
	);

	const renderCustomerItem = (customer: CustomerWithLoyalty, index: number) => {
		// Generate avatar URL with proper fallbacks
		const getCustomerAvatarUrl = () => {
			// If customer has a custom avatar, use it
			if (customer.avatar_url && customer.avatar_url.trim()) {
				return customer.avatar_url;
			}

			// Otherwise, generate a default avatar using username or fallback
			const username =
				customer.username ||
				customer.display_name ||
				customer.full_name ||
				`customer${index + 1}`;

			return AvatarService.generateDefaultAvatar(username);
		};

		const avatarUrl = getCustomerAvatarUrl();

		return (
			<View key={customer.id} style={styles.customerItem}>
				<View style={styles.rankContainer}>
					<Text style={styles.rank}>#{index + 1}</Text>
				</View>
				<View style={styles.customerLeft}>
					<Image
						source={{ uri: avatarUrl }}
						style={styles.avatar}
						resizeMode='cover'
					/>
					<View style={styles.customerInfo}>
						<Text style={styles.customerName}>
							{getCustomerDisplayName(customer)}
						</Text>
						<Text style={styles.customerUsername}>@{customer.username}</Text>
						<View style={styles.tierBadge}>
							<Ionicons
								name={customer.loyaltyTier.icon as any}
								size={12}
								color={customer.loyaltyTier.color}
							/>
							<Text
								style={[
									styles.tierBadgeText,
									{ color: customer.loyaltyTier.color },
								]}
							>
								{customer.loyaltyTier.name}
							</Text>
						</View>
					</View>
				</View>
				<View style={styles.customerRight}>
					<Text style={styles.customerSpending}>
						{formatCurrency(customer.total_amount_received)}
					</Text>
					<Text style={styles.customerPoints}>
						{customer.loyaltyPoints.toLocaleString()} pts
					</Text>
					{customer.nextTierSpending > 0 && (
						<Text style={styles.nextTier}>
							{formatCurrency(customer.nextTierSpending)} to{' '}
							{getNextTier(customer.loyaltyTier)?.name}
						</Text>
					)}
				</View>
			</View>
		);
	};

	if (loading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size='large' color='#3b82f6' />
					<Text style={styles.loadingText}>Loading loyalty program...</Text>
				</View>
			</SafeAreaView>
		);
	}

	const tierStats = getTierStats();

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
					<View>
						<Text style={styles.title}>Loyalty Program</Text>
						<Text style={styles.subtitle}>
							Reward your best customers and track their spending
						</Text>
					</View>
				</View>

				{/* Tier Overview */}
				<View style={styles.sectionContainer}>
					<Text style={styles.sectionHeader}>Loyalty Tiers</Text>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						style={styles.tiersContainer}
					>
						{tierStats.map((tier) =>
							renderTierCard(tier, tier.count, tier.totalSpending)
						)}
					</ScrollView>
				</View>

				{/* Customer Rankings */}
				<View style={styles.sectionContainer}>
					<View style={styles.rankingHeader}>
						<Text style={styles.sectionHeader}>
							{selectedTier ? `${selectedTier} Customers` : 'Top Customers'}
						</Text>
						{selectedTier && (
							<TouchableOpacity
								style={styles.clearFilter}
								onPress={() => setSelectedTier(null)}
							>
								<Text style={styles.clearFilterText}>Show All</Text>
							</TouchableOpacity>
						)}
					</View>

					{filteredCustomers.length === 0 ? (
						<View style={styles.emptyContainer}>
							<Ionicons name='trophy-outline' size={48} color='#d1d5db' />
							<Text style={styles.emptyTitle}>
								{selectedTier
									? `No ${selectedTier} customers yet`
									: 'No customers yet'}
							</Text>
							<Text style={styles.emptySubtitle}>
								{selectedTier
									? `Customers will appear here when they reach ${selectedTier} tier`
									: 'Customers will appear here after completing transactions'}
							</Text>
						</View>
					) : (
						<View>
							<Text style={styles.listHeader}>
								{filteredCustomers.length} customer
								{filteredCustomers.length !== 1 ? 's' : ''}
							</Text>
							{filteredCustomers.map((customer, index) =>
								renderCustomerItem(customer, index)
							)}
						</View>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		color: '#6b7280',
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
	title: {
		fontSize: 24,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 16,
		color: '#6b7280',
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
	tiersContainer: {
		paddingHorizontal: 24,
		paddingBottom: 24,
	},
	tierCard: {
		borderRadius: 12,
		padding: 16,
		marginRight: 16,
		width: 200,
		borderWidth: 2,
		borderColor: 'transparent',
	},
	tierCardActive: {
		borderColor: '#3b82f6',
		shadowColor: '#3b82f6',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 4,
	},
	tierHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	tierIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	tierInfo: {
		flex: 1,
	},
	tierName: {
		fontSize: 18,
		fontWeight: '700',
		marginBottom: 2,
	},
	tierRequirement: {
		fontSize: 12,
		color: '#6b7280',
		fontWeight: '500',
	},
	tierStats: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	tierCount: {
		fontSize: 14,
		fontWeight: '600',
		color: '#374151',
	},
	tierSpending: {
		fontSize: 14,
		fontWeight: '700',
		color: '#059669',
	},
	rankingHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingTop: 24,
		marginBottom: 20,
	},
	clearFilter: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		backgroundColor: '#eff6ff',
		borderRadius: 8,
	},
	clearFilterText: {
		fontSize: 14,
		color: '#3b82f6',
		fontWeight: '600',
	},
	listHeader: {
		fontSize: 16,
		fontWeight: '600',
		color: '#6b7280',
		marginBottom: 16,
		paddingHorizontal: 24,
	},
	customerItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#f9fafb',
	},
	rankContainer: {
		width: 40,
		alignItems: 'center',
		marginRight: 16,
	},
	rank: {
		fontSize: 16,
		fontWeight: '700',
		color: '#3b82f6',
	},
	customerLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		marginRight: 12,
		backgroundColor: '#e5e7eb',
	},
	customerInfo: {
		flex: 1,
	},
	customerName: {
		fontSize: 16,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 2,
	},
	customerUsername: {
		fontSize: 14,
		color: '#6b7280',
		marginBottom: 4,
	},
	tierBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f9fafb',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		alignSelf: 'flex-start',
	},
	tierBadgeText: {
		fontSize: 12,
		fontWeight: '600',
		marginLeft: 4,
	},
	customerRight: {
		alignItems: 'flex-end',
	},
	customerSpending: {
		fontSize: 16,
		fontWeight: '700',
		color: '#059669',
		marginBottom: 2,
	},
	customerPoints: {
		fontSize: 14,
		color: '#3b82f6',
		fontWeight: '600',
		marginBottom: 2,
	},
	nextTier: {
		fontSize: 12,
		color: '#6b7280',
		textAlign: 'right',
	},
	emptyContainer: {
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingVertical: 32,
	},
	emptyTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#6b7280',
		marginTop: 8,
		textAlign: 'center',
	},
	emptySubtitle: {
		fontSize: 14,
		color: '#9ca3af',
		marginTop: 4,
		textAlign: 'center',
	},
});
