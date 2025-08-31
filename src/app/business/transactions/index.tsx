import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
	TextInput,
	Alert,
	StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserProfileStore } from '@/stores/userProfileStore';
import {
	TransactionService,
	TransactionWithUsers,
} from '@/services/transactionService';
import { AvatarService } from '@/services/avatarService';
import { Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface TransactionFilters {
	timeFrame: 'all' | 'today' | 'week' | 'month' | 'year';
	type: 'all' | 'received' | 'sent';
	status: 'all' | 'pending' | 'completed' | 'failed';
}

export default function BusinessTransactions() {
	const { currentProfile } = useUserProfileStore();
	const [transactions, setTransactions] = useState<TransactionWithUsers[]>([]);
	const [filteredTransactions, setFilteredTransactions] = useState<
		TransactionWithUsers[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [filters, setFilters] = useState<TransactionFilters>({
		timeFrame: 'all',
		type: 'all',
		status: 'all',
	});
	const [stats, setStats] = useState({
		totalReceived: 0,
		totalSent: 0,
		totalTransactions: 0,
		pendingTransactions: 0,
	});

	useEffect(() => {
		if (currentProfile?.id) {
			loadTransactions();
		}
	}, [currentProfile]);

	useEffect(() => {
		applyFilters();
	}, [transactions, searchQuery, filters]);

	const loadTransactions = async () => {
		if (!currentProfile?.id) return;

		try {
			setLoading(true);
			console.log('📊 Loading business transactions...');

			const userTransactions = await TransactionService.getTransactionsByUserId(
				currentProfile.id
			);
			console.log('✅ Loaded transactions:', userTransactions.length);

			setTransactions(userTransactions);
			calculateStats(userTransactions);
		} catch (error) {
			console.error('❌ Error loading transactions:', error);
			Alert.alert('Error', 'Failed to load transactions. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleRefresh = async () => {
		setRefreshing(true);
		await loadTransactions();
		setRefreshing(false);
	};

	const calculateStats = (transactionList: TransactionWithUsers[]) => {
		let totalReceived = 0;
		let totalSent = 0;
		let pendingTransactions = 0;

		transactionList.forEach((transaction) => {
			if (transaction.status === 'pending') {
				pendingTransactions++;
			}

			if (transaction.status === 'completed') {
				if (transaction.to_user_id === currentProfile?.id) {
					totalReceived += transaction.amount;
				} else {
					totalSent += transaction.amount;
				}
			}
		});

		setStats({
			totalReceived,
			totalSent,
			totalTransactions: transactionList.length,
			pendingTransactions,
		});
	};

	const applyFilters = () => {
		let filtered = [...transactions];

		// Apply search filter
		if (searchQuery.trim()) {
			filtered = filtered.filter((transaction) => {
				const searchLower = searchQuery.toLowerCase();
				return (
					transaction.note?.toLowerCase().includes(searchLower) ||
					transaction.from_user?.username
						?.toLowerCase()
						.includes(searchLower) ||
					transaction.to_user?.username?.toLowerCase().includes(searchLower) ||
					transaction.from_user?.full_name
						?.toLowerCase()
						.includes(searchLower) ||
					transaction.to_user?.full_name?.toLowerCase().includes(searchLower) ||
					transaction.transaction_hash?.toLowerCase().includes(searchLower)
				);
			});
		}

		// Apply type filter
		if (filters.type !== 'all') {
			filtered = filtered.filter((transaction) => {
				if (filters.type === 'received') {
					return transaction.to_user_id === currentProfile?.id;
				} else {
					return transaction.from_user_id === currentProfile?.id;
				}
			});
		}

		// Apply status filter
		if (filters.status !== 'all') {
			filtered = filtered.filter(
				(transaction) => transaction.status === filters.status
			);
		}

		// Apply time frame filter
		if (filters.timeFrame !== 'all') {
			const now = new Date();
			const filterDate = new Date();

			switch (filters.timeFrame) {
				case 'today':
					filterDate.setHours(0, 0, 0, 0);
					break;
				case 'week':
					filterDate.setDate(now.getDate() - 7);
					break;
				case 'month':
					filterDate.setMonth(now.getMonth() - 1);
					break;
				case 'year':
					filterDate.setFullYear(now.getFullYear() - 1);
					break;
			}

			filtered = filtered.filter(
				(transaction) => new Date(transaction.created_at) >= filterDate
			);
		}

		// Sort by most recent first
		filtered.sort(
			(a, b) =>
				new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
		);

		setFilteredTransactions(filtered);
	};

	const formatAmount = (amount: number, currency: string = 'USD') => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency,
		}).format(amount);
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

		if (diffInHours < 24) {
			return date.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
			});
		} else if (diffInHours < 24 * 7) {
			return date.toLocaleDateString('en-US', { weekday: 'short' });
		} else {
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
			});
		}
	};

	const getTransactionIcon = (transaction: TransactionWithUsers) => {
		const isReceived = transaction.to_user_id === currentProfile?.id;

		if (transaction.status === 'pending') {
			return 'time-outline';
		} else if (transaction.status === 'failed') {
			return 'close-circle-outline';
		} else if (isReceived) {
			return 'arrow-down-circle-outline';
		} else {
			return 'arrow-up-circle-outline';
		}
	};

	const getTransactionColor = (transaction: TransactionWithUsers) => {
		if (transaction.status === 'pending') {
			return '#f59e0b';
		} else if (transaction.status === 'failed') {
			return '#ef4444';
		} else if (transaction.to_user_id === currentProfile?.id) {
			return '#10b981';
		} else {
			return '#3b82f6';
		}
	};

	const getOtherUser = (transaction: TransactionWithUsers) => {
		const isReceived = transaction.to_user_id === currentProfile?.id;
		return isReceived ? transaction.from_user : transaction.to_user;
	};

	const getAvatarUrl = (user: any) => {
		if (user?.avatar_url && user.avatar_url.trim()) {
			return user.avatar_url;
		}

		const username =
			user?.username ||
			user?.display_name ||
			user?.full_name ||
			user?.id ||
			'user';

		return AvatarService.generateDefaultAvatar(username);
	};

	const renderStatsCard = () => (
		<View style={styles.statsContainer}>
			<View style={styles.statCard}>
				<Text style={styles.statValue}>
					{formatAmount(stats.totalReceived)}
				</Text>
				<Text style={styles.statLabel}>Received</Text>
			</View>
			<View style={styles.statCard}>
				<Text style={styles.statValue}>{formatAmount(stats.totalSent)}</Text>
				<Text style={styles.statLabel}>Sent</Text>
			</View>
			<View style={styles.statCard}>
				<Text style={[styles.statValue, { color: '#3b82f6' }]}>
					{stats.totalTransactions}
				</Text>
				<Text style={styles.statLabel}>Total</Text>
			</View>
			<View style={styles.statCard}>
				<Text style={[styles.statValue, { color: '#f59e0b' }]}>
					{stats.pendingTransactions}
				</Text>
				<Text style={styles.statLabel}>Pending</Text>
			</View>
		</View>
	);

	const renderFilterTabs = () => (
		<View style={styles.filterContainer}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.filterScrollContent}
			>
				{/* Time Frame Section */}
				<View style={styles.filterSection}>
					<Text style={styles.filterSectionLabel}>Time:</Text>
					<View style={styles.filterGroup}>
						{(['all', 'today', 'week', 'month'] as const).map((timeFrame) => (
							<TouchableOpacity
								key={timeFrame}
								style={[
									styles.filterTab,
									filters.timeFrame === timeFrame && styles.activeFilterTab,
								]}
								onPress={() => setFilters({ ...filters, timeFrame })}
							>
								<Text
									style={[
										styles.filterTabText,
										filters.timeFrame === timeFrame &&
											styles.activeFilterTabText,
									]}
								>
									{timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Separator */}
				<View style={styles.filterSeparator} />

				{/* Type Section */}
				<View style={styles.filterSection}>
					<Text style={styles.filterSectionLabel}>Type:</Text>
					<View style={styles.filterGroup}>
						{(['all', 'received', 'sent'] as const).map((type) => (
							<TouchableOpacity
								key={type}
								style={[
									styles.filterTab,
									filters.type === type && styles.activeFilterTab,
								]}
								onPress={() => setFilters({ ...filters, type })}
							>
								<Text
									style={[
										styles.filterTabText,
										filters.type === type && styles.activeFilterTabText,
									]}
								>
									{type.charAt(0).toUpperCase() + type.slice(1)}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>
			</ScrollView>
		</View>
	);

	const renderTransactionItem = (transaction: TransactionWithUsers) => {
		const otherUser = getOtherUser(transaction);
		const isReceived = transaction.to_user_id === currentProfile?.id;
		const avatarUrl = getAvatarUrl(otherUser);

		return (
			<TouchableOpacity
				key={transaction.id}
				style={styles.transactionItem}
				onPress={() => {
					Alert.alert(
						'Transaction Details',
						`${transaction.note || 'No description'}\n\nHash: ${transaction.transaction_hash || 'N/A'}\nStatus: ${transaction.status}\nDate: ${new Date(transaction.created_at).toLocaleString()}`
					);
				}}
			>
				<View style={styles.avatarContainer}>
					{/* Always show fallback with initials behind */}
					<View style={styles.avatarFallback}>
						<Text style={styles.avatarInitials}>
							{(
								otherUser?.display_name ||
								otherUser?.full_name ||
								otherUser?.username ||
								'U'
							)
								.substring(0, 2)
								.toUpperCase()}
						</Text>
					</View>
					{/* Image overlay if available */}
					{avatarUrl && (
						<Image
							source={{ uri: avatarUrl }}
							style={[
								styles.avatar,
								{ position: 'absolute', top: 0, left: 0, zIndex: 1 },
							]}
							onError={(error) => {
								console.error('❌ Avatar load error:', error);
							}}
						/>
					)}
				</View>

				<View style={styles.transactionInfo}>
					<Text style={styles.transactionUser}>
						{otherUser?.display_name ||
							otherUser?.full_name ||
							otherUser?.username ||
							'Unknown User'}
					</Text>
					<Text style={styles.transactionNote} numberOfLines={1}>
						{transaction.note ||
							`${isReceived ? 'Payment received' : 'Payment sent'}`}
					</Text>
					<Text style={styles.transactionDate}>
						{formatDate(transaction.created_at)}
					</Text>
				</View>

				<View style={styles.transactionRight}>
					<Text
						style={[
							styles.transactionAmount,
							{ color: getTransactionColor(transaction) },
						]}
					>
						{isReceived ? '+' : '-'}
						{formatAmount(transaction.amount)}
					</Text>
					<Ionicons
						name={getTransactionIcon(transaction)}
						size={20}
						color={getTransactionColor(transaction)}
					/>
				</View>
			</TouchableOpacity>
		);
	};

	if (loading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size='large' color='#3b82f6' />
					<Text style={styles.loadingText}>Loading transactions...</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Transaction History</Text>
				<TouchableOpacity onPress={handleRefresh}>
					<Ionicons name='refresh' size={24} color='#3b82f6' />
				</TouchableOpacity>
			</View>

			<ScrollView
				style={styles.content}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
				}
				showsVerticalScrollIndicator={false}
			>
				{/* Stats Cards */}
				{renderStatsCard()}

				{/* Search Bar */}
				<View style={styles.searchContainer}>
					<Ionicons name='search' size={20} color='#6b7280' />
					<TextInput
						style={styles.searchInput}
						placeholder='Search transactions...'
						value={searchQuery}
						onChangeText={setSearchQuery}
						placeholderTextColor='#9ca3af'
					/>
				</View>

				{/* Filter Tabs */}
				{renderFilterTabs()}

				{/* Transactions List */}
				<View style={styles.transactionsContainer}>
					{filteredTransactions.length === 0 ? (
						<View style={styles.emptyState}>
							<Ionicons name='receipt-outline' size={64} color='#d1d5db' />
							<Text style={styles.emptyStateTitle}>No Transactions Found</Text>
							<Text style={styles.emptyStateText}>
								{searchQuery ||
								filters.type !== 'all' ||
								filters.timeFrame !== 'all'
									? 'Try adjusting your filters or search terms'
									: 'Your business transactions will appear here'}
							</Text>
						</View>
					) : (
						filteredTransactions.map(renderTransactionItem)
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#ffffff',
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
		paddingHorizontal: 24,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#f3f4f6',
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: '700',
		color: '#111827',
	},
	content: {
		flex: 1,
	},
	statsContainer: {
		flexDirection: 'row',
		paddingHorizontal: 24,
		paddingVertical: 16,
		gap: 12,
	},
	statCard: {
		flex: 1,
		backgroundColor: '#f9fafb',
		padding: 16,
		borderRadius: 12,
		alignItems: 'center',
	},
	statValue: {
		fontSize: 18,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 4,
	},
	statLabel: {
		fontSize: 12,
		color: '#6b7280',
		textAlign: 'center',
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: 24,
		marginBottom: 16,
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: '#f9fafb',
		borderRadius: 12,
		gap: 12,
	},
	searchInput: {
		flex: 1,
		fontSize: 16,
		color: '#111827',
	},
	filterContainer: {
		marginBottom: 16,
	},
	filterScrollContent: {
		paddingHorizontal: 24,
		alignItems: 'center',
	},
	filterSection: {
		alignItems: 'center',
	},
	filterSectionLabel: {
		fontSize: 12,
		fontWeight: '600',
		color: '#374151',
		marginBottom: 8,
		textAlign: 'center',
	},
	filterGroup: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	filterSeparator: {
		width: 1,
		height: 40,
		backgroundColor: '#e5e7eb',
		marginHorizontal: 16,
	},
	filterTab: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		marginHorizontal: 4,
		backgroundColor: '#f3f4f6',
		borderRadius: 20,
	},
	activeFilterTab: {
		backgroundColor: '#3b82f6',
	},
	filterTabText: {
		fontSize: 14,
		fontWeight: '500',
		color: '#6b7280',
	},
	activeFilterTabText: {
		color: '#ffffff',
	},
	transactionsContainer: {
		paddingHorizontal: 24,
		paddingBottom: 24,
	},
	transactionItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#f3f4f6',
	},
	avatarContainer: {
		position: 'relative',
		marginRight: 16,
	},
	avatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: '#e5e7eb',
	},
	avatarFallback: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: '#3b82f6',
		justifyContent: 'center',
		alignItems: 'center',
	},
	avatarInitials: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '600',
	},
	transactionInfo: {
		flex: 1,
	},
	transactionUser: {
		fontSize: 16,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 4,
	},
	transactionNote: {
		fontSize: 14,
		color: '#6b7280',
		marginBottom: 4,
	},
	transactionDate: {
		fontSize: 12,
		color: '#9ca3af',
	},
	transactionRight: {
		alignItems: 'flex-end',
		gap: 4,
	},
	transactionAmount: {
		fontSize: 16,
		fontWeight: '700',
	},
	emptyState: {
		alignItems: 'center',
		paddingVertical: 48,
	},
	emptyStateTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#374151',
		marginTop: 16,
		marginBottom: 8,
	},
	emptyStateText: {
		fontSize: 14,
		color: '#6b7280',
		textAlign: 'center',
		lineHeight: 20,
	},
});
