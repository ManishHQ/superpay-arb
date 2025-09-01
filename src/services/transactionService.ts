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
}
