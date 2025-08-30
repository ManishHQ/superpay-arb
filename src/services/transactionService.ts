import { supabase } from '@/lib/supabase';
import {
	Transaction,
	TransactionInsert,
	TransactionUpdate,
	UserProfile,
} from '@/types/supabase';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useWalletStore } from '@/stores/walletStore';

export type TransactionCategory =
	| 'housing'
	| 'transport'
	| 'emergency'
	| 'vacation'
	| 'investment'
	| 'custom'
	| 'food'
	| 'entertainment'
	| 'healthcare'
	| 'utilities'
	| 'shopping'
	| 'other';

export interface CreateTransactionData {
	to_user_id: string;
	amount: number;
	currency: string;
	note?: string;
	transaction_hash?: string;
	block_number?: number;
	blockchain?: string;
	network?: string;
	gas_fee?: number;
	gas_fee_currency?: string;
	platform_fee?: number;
	platform_fee_currency?: string;
	transaction_type?: 'transfer' | 'request' | 'split' | 'refund';
	category?: TransactionCategory;
	is_internal?: boolean;
}

export interface TransactionWithUsers extends Transaction {
	from_user?: UserProfile;
	to_user?: UserProfile;
}

export class TransactionService {
	/**
	 * Get user profile by wallet address
	 */
	static async getUserProfileByWalletAddress(
		walletAddress: string
	): Promise<UserProfile | null> {
		try {
			const { data: profile, error } = await supabase
				.from('user_profiles')
				.select('*')
				.eq('wallet_address', walletAddress)
				.single();

			if (error) {
				if (error.code === 'PGRST116') {
					return null; // Profile not found
				}
				console.error('Error fetching user profile by wallet:', error);
				throw new Error(`Failed to fetch user profile: ${error.message}`);
			}

			return profile;
		} catch (error) {
			console.error('Error in getUserProfileByWalletAddress:', error);
			throw error;
		}
	}

	/**
	 * Create a new transaction
	 */
	static async createTransaction(
		data: CreateTransactionData
	): Promise<Transaction> {
		try {
			// Get the current wallet address
			const walletAddress = useWalletStore.getState().address;
			if (!walletAddress) {
				throw new Error('No wallet connected');
			}

			// Get the user profile by wallet address
			const userProfile =
				await this.getUserProfileByWalletAddress(walletAddress);
			if (!userProfile) {
				throw new Error('User profile not found for wallet address');
			}

			const transactionData: TransactionInsert = {
				from_user_id: userProfile.id,
				to_user_id: data.to_user_id,
				amount: data.amount,
				currency: data.currency,
				note: data.note,
				transaction_hash: data.transaction_hash,
				block_number: data.block_number,
				blockchain: data.blockchain,
				network: data.network,
				gas_fee: data.gas_fee,
				gas_fee_currency: data.gas_fee_currency,
				platform_fee: data.platform_fee,
				platform_fee_currency: data.platform_fee_currency,
				transaction_type: data.transaction_type || 'transfer',
				category: data.category,
				is_internal: data.is_internal || false,
				status: 'completed', // Set as completed since transaction was successful
				completed_at: new Date().toISOString(),
			};

			const { data: transaction, error } = await supabase
				.from('transactions')
				.insert(transactionData)
				.select()
				.single();

			if (error) {
				console.error('Error creating transaction:', error);
				throw new Error(`Failed to create transaction: ${error.message}`);
			}

			return transaction;
		} catch (error) {
			console.error('Error in createTransaction:', error);
			throw error;
		}
	}

	/**
	 * Get transactions for the current user
	 */
	static async getUserTransactions(
		limit?: number,
		offset?: number
	): Promise<TransactionWithUsers[]> {
		try {
			// Get the current wallet address
			const walletAddress = useWalletStore.getState().address;
			if (!walletAddress) {
				throw new Error('No wallet connected');
			}

			// Get the user profile by wallet address
			const userProfile =
				await this.getUserProfileByWalletAddress(walletAddress);
			if (!userProfile) {
				throw new Error('User profile not found for wallet address');
			}

			let query = supabase
				.from('transactions')
				.select(
					`
          *,
          from_user:user_profiles!transactions_from_user_id_fkey(
            id, username, full_name, avatar_url, wallet_address
          ),
          to_user:user_profiles!transactions_to_user_id_fkey(
            id, username, full_name, avatar_url, wallet_address
          )
        `
				)
				.or(`from_user_id.eq.${userProfile.id},to_user_id.eq.${userProfile.id}`)
				.order('created_at', { ascending: false });

			if (limit) query = query.limit(limit);
			if (offset) query = query.range(offset, offset + (limit || 10) - 1);

			const { data: transactions, error } = await query;

			if (error) {
				console.error('Error fetching transactions:', error);
				throw new Error(`Failed to fetch transactions: ${error.message}`);
			}

			return transactions || [];
		} catch (error) {
			console.error('Error in getUserTransactions:', error);
			throw error;
		}
	}

	/**
	 * Get transaction by ID
	 */
	static async getTransactionById(
		id: string
	): Promise<TransactionWithUsers | null> {
		try {
			const { data: transaction, error } = await supabase
				.from('transactions')
				.select(
					`
          *,
          from_user:user_profiles!transactions_from_user_id_fkey(
            id, username, full_name, avatar_url, wallet_address
          ),
          to_user:user_profiles!transactions_to_user_id_fkey(
            id, username, full_name, avatar_url, wallet_address
          )
        `
				)
				.eq('id', id)
				.single();

			if (error) {
				if (error.code === 'PGRST116') {
					return null; // Transaction not found
				}
				console.error('Error fetching transaction:', error);
				throw new Error(`Failed to fetch transaction: ${error.message}`);
			}

			return transaction;
		} catch (error) {
			console.error('Error in getTransactionById:', error);
			throw error;
		}
	}

	/**
	 * Get transaction by hash
	 */
	static async getTransactionByHash(hash: string): Promise<Transaction | null> {
		try {
			const { data: transaction, error } = await supabase
				.from('transactions')
				.select('*')
				.eq('transaction_hash', hash)
				.single();

			if (error) {
				if (error.code === 'PGRST116') {
					return null; // Transaction not found
				}
				console.error('Error fetching transaction by hash:', error);
				throw new Error(`Failed to fetch transaction: ${error.message}`);
			}

			return transaction;
		} catch (error) {
			console.error('Error in getTransactionByHash:', error);
			throw error;
		}
	}

	/**
	 * Update transaction status
	 */
	static async updateTransactionStatus(
		id: string,
		status: Transaction['status'],
		updates?: Partial<TransactionUpdate>
	): Promise<Transaction> {
		try {
			const updateData: Partial<TransactionUpdate> = {
				status,
				updated_at: new Date().toISOString(),
				...updates,
			};

			if (status === 'completed') {
				updateData.completed_at = new Date().toISOString();
			}

			const { data: transaction, error } = await supabase
				.from('transactions')
				.update(updateData)
				.eq('id', id)
				.select()
				.single();

			if (error) {
				console.error('Error updating transaction:', error);
				throw new Error(`Failed to update transaction: ${error.message}`);
			}

			return transaction;
		} catch (error) {
			console.error('Error in updateTransactionStatus:', error);
			throw error;
		}
	}

	/**
	 * Get transactions by category
	 */
	static async getTransactionsByCategory(
		category: TransactionCategory
	): Promise<TransactionWithUsers[]> {
		try {
			// Get the current wallet address
			const walletAddress = useWalletStore.getState().address;
			if (!walletAddress) {
				throw new Error('No wallet connected');
			}

			// Get the user profile by wallet address
			const userProfile =
				await this.getUserProfileByWalletAddress(walletAddress);
			if (!userProfile) {
				throw new Error('User profile not found for wallet address');
			}

			const { data: transactions, error } = await supabase
				.from('transactions')
				.select(
					`
          *,
          from_user:user_profiles!transactions_from_user_id_fkey(
            id, username, full_name, avatar_url, wallet_address
          ),
          to_user:user_profiles!transactions_to_user_id_fkey(
            id, username, full_name, avatar_url, wallet_address
          )
        `
				)
				.eq('category', category)
				.or(`from_user_id.eq.${userProfile.id},to_user_id.eq.${userProfile.id}`)
				.order('created_at', { ascending: false });

			if (error) {
				console.error('Error fetching transactions by category:', error);
				throw new Error(`Failed to fetch transactions: ${error.message}`);
			}

			return transactions || [];
		} catch (error) {
			console.error('Error in getTransactionsByCategory:', error);
			throw error;
		}
	}

	/**
	 * Get spending summary by category
	 */
	static async getSpendingByCategory(): Promise<
		Record<TransactionCategory, number>
	> {
		try {
			// Get the current wallet address
			const walletAddress = useWalletStore.getState().address;
			if (!walletAddress) {
				throw new Error('No wallet connected');
			}

			// Get the user profile by wallet address
			const userProfile =
				await this.getUserProfileByWalletAddress(walletAddress);
			if (!userProfile) {
				throw new Error('User profile not found for wallet address');
			}

			const { data: transactions, error } = await supabase
				.from('transactions')
				.select('amount, category, currency')
				.eq('from_user_id', userProfile.id)
				.eq('status', 'completed')
				.not('category', 'is', null);

			if (error) {
				console.error('Error fetching spending data:', error);
				throw new Error(`Failed to fetch spending data: ${error.message}`);
			}

			const spendingByCategory: Record<TransactionCategory, number> = {
				housing: 0,
				transport: 0,
				emergency: 0,
				vacation: 0,
				investment: 0,
				custom: 0,
				food: 0,
				entertainment: 0,
				healthcare: 0,
				utilities: 0,
				shopping: 0,
				other: 0,
			};

			transactions?.forEach((transaction) => {
				if (transaction.category && transaction.currency === 'USDC') {
					spendingByCategory[transaction.category] += transaction.amount;
				}
			});

			return spendingByCategory;
		} catch (error) {
			console.error('Error in getSpendingByCategory:', error);
			throw error;
		}
	}

	/**
	 * Get spending analytics for track page
	 */
	static async getSpendingAnalytics(timeFrame: 'week' | 'month' = 'week') {
		try {
			const walletAddress = useWalletStore.getState().address;
			if (!walletAddress) {
				throw new Error('No wallet connected');
			}

			const userProfile =
				await this.getUserProfileByWalletAddress(walletAddress);
			if (!userProfile) {
				throw new Error('User profile not found for wallet address');
			}

			// Calculate date range
			const now = new Date();
			const startDate = new Date();
			if (timeFrame === 'week') {
				startDate.setDate(now.getDate() - 7);
			} else {
				startDate.setMonth(now.getMonth() - 1);
			}

			// Get transactions in the time range
			const { data: transactions, error } = await supabase
				.from('transactions')
				.select(
					'amount, category, currency, created_at, to_user:user_profiles!transactions_to_user_id_fkey(username, full_name)'
				)
				.eq('from_user_id', userProfile.id)
				.eq('status', 'completed')
				.gte('created_at', startDate.toISOString())
				.lte('created_at', now.toISOString())
				.order('created_at', { ascending: false });

			if (error) {
				console.error('Error fetching analytics data:', error);
				throw new Error(`Failed to fetch analytics data: ${error.message}`);
			}

			// Process spending by category
			const categorySpending: Record<
				string,
				{ amount: number; count: number }
			> = {};
			let totalSpending = 0;

			transactions?.forEach((transaction) => {
				if (transaction.currency === 'USDC') {
					totalSpending += transaction.amount;

					const category = transaction.category || 'other';
					if (!categorySpending[category]) {
						categorySpending[category] = { amount: 0, count: 0 };
					}
					categorySpending[category].amount += transaction.amount;
					categorySpending[category].count += 1;
				}
			});

			// Convert to chart format
			const categoryData = Object.entries(categorySpending)
				.map(([category, data]) => ({
					id: category,
					name: this.getCategoryDisplayName(category as TransactionCategory),
					amount: data.amount,
					percentage:
						totalSpending > 0
							? Math.round((data.amount / totalSpending) * 100)
							: 0,
					color: this.getCategoryColor(category as TransactionCategory),
					icon: this.getCategoryIcon(category as TransactionCategory),
					value:
						totalSpending > 0
							? Math.round((data.amount / totalSpending) * 100)
							: 0,
				}))
				.filter((item) => item.amount > 0)
				.sort((a, b) => b.amount - a.amount);

			// Get recent transactions (last 10)
			const recentTransactions =
				transactions?.slice(0, 10).map((transaction, index) => ({
					id: transaction.id || index.toString(),
					name:
						transaction.to_user?.full_name ||
						transaction.to_user?.username ||
						'Unknown',
					amount: transaction.amount,
					category: this.getCategoryDisplayName(
						transaction.category as TransactionCategory
					),
					time: this.formatTimeAgo(new Date(transaction.created_at)),
					icon: this.getCategoryIcon(
						transaction.category as TransactionCategory
					),
				})) || [];

			return {
				categoryData,
				recentTransactions,
				totalSpending,
				transactionCount: transactions?.length || 0,
			};
		} catch (error) {
			console.error('Error in getSpendingAnalytics:', error);
			throw error;
		}
	}

	/**
	 * Get daily/weekly spending data for charts
	 */
	static async getTimeSeriesData(timeFrame: 'week' | 'month' = 'week') {
		try {
			const walletAddress = useWalletStore.getState().address;
			if (!walletAddress) {
				throw new Error('No wallet connected');
			}

			const userProfile =
				await this.getUserProfileByWalletAddress(walletAddress);
			if (!userProfile) {
				throw new Error('User profile not found for wallet address');
			}

			const now = new Date();
			const startDate = new Date();
			const periods: string[] = [];

			if (timeFrame === 'week') {
				startDate.setDate(now.getDate() - 7);
				// Generate last 7 days
				for (let i = 6; i >= 0; i--) {
					const date = new Date();
					date.setDate(now.getDate() - i);
					periods.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
				}
			} else {
				startDate.setMonth(now.getMonth() - 12);
				// Generate last 12 months
				for (let i = 11; i >= 0; i--) {
					const date = new Date();
					date.setMonth(now.getMonth() - i);
					periods.push(date.toLocaleDateString('en-US', { month: 'short' }));
				}
			}

			const { data: transactions, error } = await supabase
				.from('transactions')
				.select('amount, currency, created_at')
				.eq('from_user_id', userProfile.id)
				.eq('status', 'completed')
				.gte('created_at', startDate.toISOString())
				.lte('created_at', now.toISOString());

			if (error) {
				console.error('Error fetching time series data:', error);
				throw new Error(`Failed to fetch time series data: ${error.message}`);
			}

			// Group transactions by time period
			const spendingByPeriod: Record<string, number> = {};
			periods.forEach((period) => {
				spendingByPeriod[period] = 0;
			});

			transactions?.forEach((transaction) => {
				if (transaction.currency === 'USDC') {
					const date = new Date(transaction.created_at);
					const period =
						timeFrame === 'week'
							? date.toLocaleDateString('en-US', { weekday: 'short' })
							: date.toLocaleDateString('en-US', { month: 'short' });

					if (spendingByPeriod[period] !== undefined) {
						spendingByPeriod[period] += transaction.amount;
					}
				}
			});

			// Convert to chart format with mock yield data (since we don't have yield transactions yet)
			const chartData = periods.map((period) => ({
				spending: spendingByPeriod[period] || 0,
				yield: (spendingByPeriod[period] || 0) * 0.1, // Mock 10% yield
				net:
					(spendingByPeriod[period] || 0) * 0.1 -
					(spendingByPeriod[period] || 0),
				label: period,
			}));

			return chartData;
		} catch (error) {
			console.error('Error in getTimeSeriesData:', error);
			throw error;
		}
	}

	/**
	 * Helper methods for category display
	 */
	private static getCategoryDisplayName(category: TransactionCategory): string {
		const displayNames: Record<TransactionCategory, string> = {
			food: 'Food & Dining',
			transport: 'Transportation',
			shopping: 'Shopping',
			entertainment: 'Entertainment',
			utilities: 'Utilities',
			housing: 'Housing',
			healthcare: 'Healthcare',
			emergency: 'Emergency',
			vacation: 'Vacation',
			investment: 'Investment',
			custom: 'Custom',
			other: 'Other',
		};
		return displayNames[category] || 'Other';
	}

	private static getCategoryColor(category: TransactionCategory): string {
		const colors: Record<TransactionCategory, string> = {
			food: '#FF6B6B',
			transport: '#4ECDC4',
			shopping: '#45B7D1',
			entertainment: '#96CEB4',
			utilities: '#FFEAA7',
			housing: '#DDA0DD',
			healthcare: '#98D8C8',
			emergency: '#F7DC6F',
			vacation: '#BB8FCE',
			investment: '#85C1E9',
			custom: '#F8C471',
			other: '#AED6F1',
		};
		return colors[category] || '#AED6F1';
	}

	private static getCategoryIcon(category: TransactionCategory): string {
		const icons: Record<TransactionCategory, string> = {
			food: '🍕',
			transport: '🚗',
			shopping: '🛍️',
			entertainment: '🎬',
			utilities: '⚡',
			housing: '🏠',
			healthcare: '🏥',
			emergency: '🚨',
			vacation: '✈️',
			investment: '📈',
			custom: '⭐',
			other: '📝',
		};
		return icons[category] || '📝';
	}

	private static formatTimeAgo(date: Date): string {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days > 0) {
			return `${days} day${days > 1 ? 's' : ''} ago`;
		} else if (hours > 0) {
			return `${hours} hour${hours > 1 ? 's' : ''} ago`;
		} else {
			return 'Just now';
		}
	}
}
