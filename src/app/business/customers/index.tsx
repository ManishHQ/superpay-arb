import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	TextInput,
	ActivityIndicator,
	Alert,
	RefreshControl,
	StyleSheet,
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

export default function BusinessCustomers() {
	const { currentProfile } = useUserProfileStore();
	const [customers, setCustomers] = useState<CustomerData[]>([]);
	const [customerStats, setCustomerStats] = useState<CustomerStats | null>(
		null
	);
	const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>(
		[]
	);
	const [searchQuery, setSearchQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [sortBy, setSortBy] = useState<'recent' | 'revenue' | 'transactions'>(
		'recent'
	);

	useEffect(() => {
		loadCustomers();
	}, [currentProfile]);

	useEffect(() => {
		filterAndSortCustomers();
	}, [customers, searchQuery, sortBy]);

	const loadCustomers = async () => {
		if (!currentProfile?.id) return;

		try {
			setLoading(true);
			const [customersData, statsData] = await Promise.all([
				CustomerService.getBusinessCustomers(currentProfile.id),
				CustomerService.getCustomerStats(currentProfile.id),
			]);

			setCustomers(customersData);
			setCustomerStats(statsData);
		} catch (error) {
			console.error('Error loading customers:', error);
			Alert.alert('Error', 'Failed to load customers. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await loadCustomers();
		setRefreshing(false);
	};

	const filterAndSortCustomers = () => {
		let filtered = customers;

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = customers.filter(
				(customer) =>
					customer.username.toLowerCase().includes(query) ||
					customer.full_name?.toLowerCase().includes(query) ||
					customer.display_name?.toLowerCase().includes(query) ||
					customer.email.toLowerCase().includes(query)
			);
		}

		// Apply sorting
		switch (sortBy) {
			case 'recent':
				filtered.sort(
					(a, b) =>
						new Date(b.last_transaction_date).getTime() -
						new Date(a.last_transaction_date).getTime()
				);
				break;
			case 'revenue':
				filtered.sort(
					(a, b) => b.total_amount_received - a.total_amount_received
				);
				break;
			case 'transactions':
				filtered.sort((a, b) => b.transaction_count - a.transaction_count);
				break;
		}

		setFilteredCustomers(filtered);
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
		}).format(amount);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	const getCustomerDisplayName = (customer: CustomerData) => {
		return customer.display_name || customer.full_name || customer.username;
	};

	const renderStatsCard = (
		title: string,
		value: string | number,
		icon: string,
		color: string
	) => (
		<View style={[styles.statCard, { borderLeftColor: color }]}>
			<View style={styles.statHeader}>
				<Ionicons name={icon as any} size={24} color={color} />
				<Text style={styles.statTitle}>{title}</Text>
			</View>
			<Text style={styles.statValue}>{value}</Text>
		</View>
	);

	const renderCustomerItem = (customer: CustomerData) => {
		const avatarUrl = AvatarService.getAvatarUrl({
			avatar_url: customer.avatar_url,
			username: customer.username,
		});

		return (
			<TouchableOpacity key={customer.id} style={styles.customerItem}>
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
						<Text style={styles.customerDate}>
							Last transaction: {formatDate(customer.last_transaction_date)}
						</Text>
					</View>
				</View>
				<View style={styles.customerRight}>
					<Text style={styles.customerRevenue}>
						{formatCurrency(customer.total_amount_received)}
					</Text>
					<Text style={styles.customerTransactions}>
						{customer.transaction_count} transaction
						{customer.transaction_count !== 1 ? 's' : ''}
					</Text>
				</View>
			</TouchableOpacity>
		);
	};

	if (loading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size='large' color='#3b82f6' />
					<Text style={styles.loadingText}>Loading customers...</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.title}>Customers</Text>
					<Text style={styles.subtitle}>
						Manage your business relationships
					</Text>
				</View>

				{/* Stats Cards */}
				{customerStats && (
					<View style={styles.statsContainer}>
						{renderStatsCard(
							'Total Customers',
							customerStats.total_customers,
							'people',
							'#3b82f6'
						)}
						{renderStatsCard(
							'Active Customers',
							customerStats.active_customers,
							'pulse',
							'#10b981'
						)}
						{renderStatsCard(
							'Total Revenue',
							formatCurrency(customerStats.total_revenue),
							'trending-up',
							'#f59e0b'
						)}
						{renderStatsCard(
							'Avg Transaction',
							formatCurrency(customerStats.average_transaction_amount),
							'calculator',
							'#8b5cf6'
						)}
					</View>
				)}

				{/* Search and Sort */}
				<View style={styles.controlsContainer}>
					<View style={styles.searchContainer}>
						<Ionicons name='search' size={20} color='#6b7280' />
						<TextInput
							style={styles.searchInput}
							placeholder='Search customers...'
							value={searchQuery}
							onChangeText={setSearchQuery}
						/>
					</View>

					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						style={styles.sortContainer}
					>
						{[
							{ key: 'recent', label: 'Recent', icon: 'time' },
							{ key: 'revenue', label: 'Revenue', icon: 'trending-up' },
							{
								key: 'transactions',
								label: 'Activity',
								icon: 'swap-horizontal',
							},
						].map((sort) => (
							<TouchableOpacity
								key={sort.key}
								style={[
									styles.sortButton,
									sortBy === sort.key && styles.sortButtonActive,
								]}
								onPress={() => setSortBy(sort.key as any)}
							>
								<Ionicons
									name={sort.icon as any}
									size={16}
									color={sortBy === sort.key ? '#3b82f6' : '#6b7280'}
								/>
								<Text
									style={[
										styles.sortButtonText,
										sortBy === sort.key && styles.sortButtonTextActive,
									]}
								>
									{sort.label}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Customers List */}
				<View style={styles.customersContainer}>
					{filteredCustomers.length === 0 ? (
						<View style={styles.emptyContainer}>
							<Ionicons name='people-outline' size={64} color='#d1d5db' />
							<Text style={styles.emptyTitle}>
								{searchQuery ? 'No customers found' : 'No customers yet'}
							</Text>
							<Text style={styles.emptySubtitle}>
								{searchQuery
									? 'Try adjusting your search terms'
									: 'Customers will appear here after completing transactions'}
							</Text>
						</View>
					) : (
						<View>
							<Text style={styles.listHeader}>
								{filteredCustomers.length} customer
								{filteredCustomers.length !== 1 ? 's' : ''}
							</Text>
							{filteredCustomers.map(renderCustomerItem)}
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
		backgroundColor: '#f9fafb',
	},
	scrollView: {
		flex: 1,
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
		paddingHorizontal: 24,
		paddingTop: 16,
		paddingBottom: 24,
	},
	title: {
		fontSize: 32,
		fontWeight: '800',
		color: '#111827',
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 16,
		color: '#6b7280',
	},
	statsContainer: {
		paddingHorizontal: 24,
		marginBottom: 24,
	},
	statCard: {
		backgroundColor: '#ffffff',
		borderRadius: 16,
		padding: 20,
		marginBottom: 12,
		borderLeftWidth: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	statHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	statTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#6b7280',
		marginLeft: 8,
	},
	statValue: {
		fontSize: 24,
		fontWeight: '800',
		color: '#111827',
	},
	controlsContainer: {
		paddingHorizontal: 24,
		marginBottom: 24,
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#ffffff',
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 1,
	},
	searchInput: {
		flex: 1,
		fontSize: 16,
		marginLeft: 12,
		color: '#111827',
	},
	sortContainer: {
		flexDirection: 'row',
	},
	sortButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#ffffff',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 8,
		marginRight: 8,
		borderWidth: 1,
		borderColor: '#e5e7eb',
	},
	sortButtonActive: {
		backgroundColor: '#eff6ff',
		borderColor: '#3b82f6',
	},
	sortButtonText: {
		fontSize: 14,
		fontWeight: '500',
		color: '#6b7280',
		marginLeft: 6,
	},
	sortButtonTextActive: {
		color: '#3b82f6',
	},
	customersContainer: {
		paddingHorizontal: 24,
		paddingBottom: 32,
	},
	listHeader: {
		fontSize: 18,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 16,
	},
	customerItem: {
		flexDirection: 'row',
		backgroundColor: '#ffffff',
		borderRadius: 16,
		padding: 20,
		marginBottom: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	customerLeft: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
	},
	avatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		marginRight: 16,
		backgroundColor: '#e5e7eb',
	},
	customerInfo: {
		flex: 1,
	},
	customerName: {
		fontSize: 16,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 2,
	},
	customerUsername: {
		fontSize: 14,
		color: '#6b7280',
		marginBottom: 4,
	},
	customerDate: {
		fontSize: 12,
		color: '#9ca3af',
	},
	customerRight: {
		alignItems: 'flex-end',
		justifyContent: 'center',
	},
	customerRevenue: {
		fontSize: 16,
		fontWeight: '700',
		color: '#059669',
		marginBottom: 2,
	},
	customerTransactions: {
		fontSize: 12,
		color: '#6b7280',
	},
	emptyContainer: {
		alignItems: 'center',
		paddingVertical: 64,
	},
	emptyTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: '#374151',
		marginTop: 16,
		marginBottom: 8,
	},
	emptySubtitle: {
		fontSize: 14,
		color: '#6b7280',
		textAlign: 'center',
		paddingHorizontal: 32,
	},
});
