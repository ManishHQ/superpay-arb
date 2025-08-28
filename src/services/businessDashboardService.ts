import { supabase } from '@/lib/supabase';
import { Transaction, UserProfile } from '@/types/supabase';

export interface BusinessStats {
	monthly_revenue: number;
	total_transactions: number;
	total_customers: number;
	average_rating: number;
	total_revenue: number;
	revenue_growth: number;
	transaction_growth: number;
	customer_growth: number;
}

export interface RecentActivity {
	id: string;
	type:
		| 'payment_received'
		| 'payment_sent'
		| 'new_customer'
		| 'payment_pending'
		| 'payment_request';
	title: string;
	subtitle: string;
	amount?: number;
	timestamp: string;
	customer?: {
		id: string;
		name: string;
		username: string;
		avatar_url?: string;
	};
}

export class BusinessDashboardService {
	/**
	 * Get comprehensive business statistics
	 */
	static async getBusinessStats(businessId: string): Promise<BusinessStats> {
		try {
			const now = new Date();
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
			const startOfLastMonth = new Date(
				now.getFullYear(),
				now.getMonth() - 1,
				1
			);
			const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

			// Get all transactions for this business
			const { data: allTransactions, error: allTransactionsError } =
				await supabase
					.from('transactions')
					.select(
						`
					*,
					from_user:user_profiles!transactions_from_user_id_fkey(id, username, full_name),
					to_user:user_profiles!transactions_to_user_id_fkey(id, username, full_name)
				`
					)
					.or(`from_user_id.eq.${businessId},to_user_id.eq.${businessId}`)
					.eq('status', 'completed');

			if (allTransactionsError) {
				console.error('Error fetching all transactions:', allTransactionsError);
				throw new Error(
					`Failed to fetch transactions: ${allTransactionsError.message}`
				);
			}

			// Get current month transactions
			const { data: monthlyTransactions, error: monthlyError } = await supabase
				.from('transactions')
				.select('*')
				.or(`from_user_id.eq.${businessId},to_user_id.eq.${businessId}`)
				.eq('status', 'completed')
				.gte('created_at', startOfMonth.toISOString());

			if (monthlyError) {
				console.error('Error fetching monthly transactions:', monthlyError);
				throw new Error(
					`Failed to fetch monthly transactions: ${monthlyError.message}`
				);
			}

			// Get last month transactions for growth comparison
			const { data: lastMonthTransactions, error: lastMonthError } =
				await supabase
					.from('transactions')
					.select('*')
					.or(`from_user_id.eq.${businessId},to_user_id.eq.${businessId}`)
					.eq('status', 'completed')
					.gte('created_at', startOfLastMonth.toISOString())
					.lte('created_at', endOfLastMonth.toISOString());

			if (lastMonthError) {
				console.error(
					'Error fetching last month transactions:',
					lastMonthError
				);
			}

			// Calculate revenue (money received by business)
			const monthlyRevenue = (monthlyTransactions || [])
				.filter((t) => t.to_user_id === businessId)
				.reduce((sum, t) => sum + t.amount, 0);

			const totalRevenue = (allTransactions || [])
				.filter((t) => t.to_user_id === businessId)
				.reduce((sum, t) => sum + t.amount, 0);

			const lastMonthRevenue = (lastMonthTransactions || [])
				.filter((t) => t.to_user_id === businessId)
				.reduce((sum, t) => sum + t.amount, 0);

			// Calculate unique customers
			const uniqueCustomers = new Set();
			(allTransactions || []).forEach((transaction) => {
				const customerId =
					transaction.from_user_id === businessId
						? transaction.to_user_id
						: transaction.from_user_id;
				if (customerId !== businessId) {
					uniqueCustomers.add(customerId);
				}
			});

			const lastMonthUniqueCustomers = new Set();
			(lastMonthTransactions || []).forEach((transaction) => {
				const customerId =
					transaction.from_user_id === businessId
						? transaction.to_user_id
						: transaction.from_user_id;
				if (customerId !== businessId) {
					lastMonthUniqueCustomers.add(customerId);
				}
			});

			// Calculate growth percentages
			const revenueGrowth =
				lastMonthRevenue > 0
					? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
					: 0;

			const transactionGrowth =
				(lastMonthTransactions?.length || 0) > 0
					? (((monthlyTransactions?.length || 0) -
							(lastMonthTransactions?.length || 0)) /
							(lastMonthTransactions?.length || 1)) *
						100
					: 0;

			const customerGrowth =
				lastMonthUniqueCustomers.size > 0
					? ((uniqueCustomers.size - lastMonthUniqueCustomers.size) /
							lastMonthUniqueCustomers.size) *
						100
					: 0;

			// For now, we'll use a placeholder for average rating since we don't have a ratings system
			// This could be implemented with a separate ratings table in the future
			const averageRating = 4.8; // Placeholder

			return {
				monthly_revenue: monthlyRevenue,
				total_transactions: allTransactions?.length || 0,
				total_customers: uniqueCustomers.size,
				average_rating: averageRating,
				total_revenue: totalRevenue,
				revenue_growth: revenueGrowth,
				transaction_growth: transactionGrowth,
				customer_growth: customerGrowth,
			};
		} catch (error) {
			console.error('Error in getBusinessStats:', error);
			throw error;
		}
	}

	/**
	 * Get recent activity for the business
	 */
	static async getRecentActivity(
		businessId: string,
		limit: number = 10
	): Promise<RecentActivity[]> {
		try {
			// Get recent transactions
			const { data: transactions, error: transactionsError } = await supabase
				.from('transactions')
				.select(
					`
					*,
					from_user:user_profiles!transactions_from_user_id_fkey(id, username, full_name, display_name, avatar_url),
					to_user:user_profiles!transactions_to_user_id_fkey(id, username, full_name, display_name, avatar_url)
				`
				)
				.or(`from_user_id.eq.${businessId},to_user_id.eq.${businessId}`)
				.order('created_at', { ascending: false })
				.limit(limit);

			if (transactionsError) {
				console.error('Error fetching recent transactions:', transactionsError);
				throw new Error(
					`Failed to fetch recent activity: ${transactionsError.message}`
				);
			}

			// Get recent transaction requests
			const { data: requests, error: requestsError } = await supabase
				.from('transaction_requests')
				.select(
					`
					*,
					from_user:user_profiles!transaction_requests_from_user_id_fkey(id, username, full_name, display_name, avatar_url),
					to_user:user_profiles!transaction_requests_to_user_id_fkey(id, username, full_name, display_name, avatar_url)
				`
				)
				.or(`from_user_id.eq.${businessId},to_user_id.eq.${businessId}`)
				.order('created_at', { ascending: false })
				.limit(5);

			if (requestsError) {
				console.error('Error fetching recent requests:', requestsError);
			}

			const activities: RecentActivity[] = [];

			// Process transactions
			(transactions || []).forEach((transaction: any) => {
				const isReceived = transaction.to_user_id === businessId;
				const otherUser = isReceived
					? transaction.from_user
					: transaction.to_user;

				if (!otherUser) return;

				const customerName =
					otherUser.display_name || otherUser.full_name || otherUser.username;
				const timeAgo = this.getTimeAgo(transaction.created_at);

				if (transaction.status === 'completed') {
					activities.push({
						id: transaction.id,
						type: isReceived ? 'payment_received' : 'payment_sent',
						title: isReceived ? 'Payment Received' : 'Payment Sent',
						subtitle: `${customerName} • ${timeAgo}`,
						amount: transaction.amount,
						timestamp: transaction.created_at,
						customer: {
							id: otherUser.id,
							name: customerName,
							username: otherUser.username,
							avatar_url: otherUser.avatar_url,
						},
					});
				} else if (transaction.status === 'pending') {
					activities.push({
						id: transaction.id,
						type: 'payment_pending',
						title: 'Payment Pending',
						subtitle: `${customerName} • ${timeAgo}`,
						amount: transaction.amount,
						timestamp: transaction.created_at,
						customer: {
							id: otherUser.id,
							name: customerName,
							username: otherUser.username,
							avatar_url: otherUser.avatar_url,
						},
					});
				}
			});

			// Process transaction requests
			(requests || []).forEach((request: any) => {
				const isRequester = request.from_user_id === businessId;
				const otherUser = isRequester ? request.to_user : request.from_user;

				if (!otherUser) return;

				const customerName =
					otherUser.display_name || otherUser.full_name || otherUser.username;
				const timeAgo = this.getTimeAgo(request.created_at);

				activities.push({
					id: request.id,
					type: 'payment_request',
					title: isRequester
						? 'Payment Request Sent'
						: 'Payment Request Received',
					subtitle: `${customerName} • ${timeAgo}`,
					amount: request.amount,
					timestamp: request.created_at,
					customer: {
						id: otherUser.id,
						name: customerName,
						username: otherUser.username,
						avatar_url: otherUser.avatar_url,
					},
				});
			});

			// Sort all activities by timestamp and limit
			return activities
				.sort(
					(a, b) =>
						new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
				)
				.slice(0, limit);
		} catch (error) {
			console.error('Error in getRecentActivity:', error);
			throw error;
		}
	}

	/**
	 * Helper function to calculate time ago
	 */
	private static getTimeAgo(dateString: string): string {
		const now = new Date();
		const past = new Date(dateString);
		const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

		if (diffInSeconds < 60) {
			return 'just now';
		} else if (diffInSeconds < 3600) {
			const minutes = Math.floor(diffInSeconds / 60);
			return `${minutes} min ago`;
		} else if (diffInSeconds < 86400) {
			const hours = Math.floor(diffInSeconds / 3600);
			return `${hours} hour${hours > 1 ? 's' : ''} ago`;
		} else if (diffInSeconds < 2592000) {
			const days = Math.floor(diffInSeconds / 86400);
			return `${days} day${days > 1 ? 's' : ''} ago`;
		} else {
			const months = Math.floor(diffInSeconds / 2592000);
			return `${months} month${months > 1 ? 's' : ''} ago`;
		}
	}

	/**
	 * Format currency values
	 */
	static formatCurrency(amount: number): string {
		if (amount >= 1000000) {
			return `$${(amount / 1000000).toFixed(1)}M`;
		} else if (amount >= 1000) {
			return `$${(amount / 1000).toFixed(1)}K`;
		} else {
			return `$${amount.toFixed(2)}`;
		}
	}

	/**
	 * Get growth indicator
	 */
	static getGrowthIndicator(growth: number): {
		color: string;
		icon: string;
		text: string;
	} {
		if (growth > 0) {
			return {
				color: '#10b981',
				icon: 'trending-up',
				text: `+${growth.toFixed(1)}%`,
			};
		} else if (growth < 0) {
			return {
				color: '#ef4444',
				icon: 'trending-down',
				text: `${growth.toFixed(1)}%`,
			};
		} else {
			return {
				color: '#6b7280',
				icon: 'remove',
				text: '0%',
			};
		}
	}
}
