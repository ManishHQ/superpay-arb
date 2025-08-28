import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/supabase';

export interface CustomerData extends UserProfile {
	total_transactions: number;
	total_amount_sent: number;
	total_amount_received: number;
	last_transaction_date: string;
	first_transaction_date: string;
	transaction_count: number;
}

export interface CustomerStats {
	total_customers: number;
	active_customers: number;
	total_revenue: number;
	average_transaction_amount: number;
}

export class CustomerService {
	/**
	 * Get all customers for a business based on transactions
	 */
	static async getBusinessCustomers(
		businessId: string
	): Promise<CustomerData[]> {
		try {
			// Get all unique customers who have transacted with this business
			const { data: customerData, error } = await supabase
				.from('transactions')
				.select(
					`
					from_user_id,
					to_user_id,
					amount,
					currency,
					created_at,
					status,
					from_user:user_profiles!transactions_from_user_id_fkey(
						id, username, full_name, email, avatar_url, display_name, 
						role, business_name, wallet_address, is_active, created_at
					),
					to_user:user_profiles!transactions_to_user_id_fkey(
						id, username, full_name, email, avatar_url, display_name,
						role, business_name, wallet_address, is_active, created_at
					)
				`
				)
				.or(`from_user_id.eq.${businessId},to_user_id.eq.${businessId}`)
				.eq('status', 'completed')
				.order('created_at', { ascending: false });

			if (error) {
				console.error('Error fetching customer data:', error);
				throw new Error(`Failed to fetch customers: ${error.message}`);
			}

			if (!customerData) return [];

			// Process the data to get unique customers with their stats
			const customerMap = new Map<string, CustomerData>();

			customerData.forEach((transaction: any) => {
				// Determine if this business is sender or receiver
				const isSender = transaction.from_user_id === businessId;
				const customer = isSender ? transaction.to_user : transaction.from_user;

				// Skip if customer is null or is the business itself
				if (!customer || customer.id === businessId) return;

				const customerId = customer.id;
				const transactionAmount = transaction.amount;
				const transactionDate = transaction.created_at;

				if (!customerMap.has(customerId)) {
					// Initialize customer data
					customerMap.set(customerId, {
						...customer,
						total_transactions: 0,
						total_amount_sent: 0,
						total_amount_received: 0,
						last_transaction_date: transactionDate,
						first_transaction_date: transactionDate,
						transaction_count: 0,
					});
				}

				const customerData = customerMap.get(customerId)!;

				// Update transaction stats
				customerData.transaction_count++;
				customerData.total_transactions++;

				if (isSender) {
					// Business sent money to customer
					customerData.total_amount_sent += transactionAmount;
				} else {
					// Business received money from customer
					customerData.total_amount_received += transactionAmount;
				}

				// Update dates
				if (
					new Date(transactionDate) >
					new Date(customerData.last_transaction_date)
				) {
					customerData.last_transaction_date = transactionDate;
				}
				if (
					new Date(transactionDate) <
					new Date(customerData.first_transaction_date)
				) {
					customerData.first_transaction_date = transactionDate;
				}
			});

			// Convert map to array and sort by last transaction date
			const customers = Array.from(customerMap.values()).sort(
				(a, b) =>
					new Date(b.last_transaction_date).getTime() -
					new Date(a.last_transaction_date).getTime()
			);

			return customers;
		} catch (error) {
			console.error('Error in getBusinessCustomers:', error);
			throw error;
		}
	}

	/**
	 * Get customer statistics for a business
	 */
	static async getCustomerStats(businessId: string): Promise<CustomerStats> {
		try {
			const customers = await this.getBusinessCustomers(businessId);

			const totalCustomers = customers.length;
			const activeCustomers = customers.filter((customer) => {
				// Consider active if transaction in last 30 days
				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
				return new Date(customer.last_transaction_date) > thirtyDaysAgo;
			}).length;

			const totalRevenue = customers.reduce(
				(sum, customer) => sum + customer.total_amount_received,
				0
			);
			const totalTransactions = customers.reduce(
				(sum, customer) => sum + customer.transaction_count,
				0
			);
			const averageTransactionAmount =
				totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

			return {
				total_customers: totalCustomers,
				active_customers: activeCustomers,
				total_revenue: totalRevenue,
				average_transaction_amount: averageTransactionAmount,
			};
		} catch (error) {
			console.error('Error in getCustomerStats:', error);
			throw error;
		}
	}

	/**
	 * Get top customers by transaction volume
	 */
	static async getTopCustomers(
		businessId: string,
		limit: number = 10
	): Promise<CustomerData[]> {
		try {
			const customers = await this.getBusinessCustomers(businessId);

			return customers
				.sort((a, b) => b.total_amount_received - a.total_amount_received)
				.slice(0, limit);
		} catch (error) {
			console.error('Error in getTopCustomers:', error);
			throw error;
		}
	}

	/**
	 * Search customers by name or username
	 */
	static async searchCustomers(
		businessId: string,
		searchTerm: string
	): Promise<CustomerData[]> {
		try {
			const customers = await this.getBusinessCustomers(businessId);

			const searchLower = searchTerm.toLowerCase();
			return customers.filter(
				(customer) =>
					customer.username.toLowerCase().includes(searchLower) ||
					customer.full_name?.toLowerCase().includes(searchLower) ||
					customer.display_name?.toLowerCase().includes(searchLower) ||
					customer.email.toLowerCase().includes(searchLower)
			);
		} catch (error) {
			console.error('Error in searchCustomers:', error);
			throw error;
		}
	}

	/**
	 * Get customer details with transaction history
	 */
	static async getCustomerDetails(
		businessId: string,
		customerId: string
	): Promise<{
		customer: CustomerData | null;
		transactions: any[];
	}> {
		try {
			const customers = await this.getBusinessCustomers(businessId);
			const customer = customers.find((c) => c.id === customerId) || null;

			// Get transaction history between business and customer
			const { data: transactions, error } = await supabase
				.from('transactions')
				.select(
					`
					*,
					from_user:user_profiles!transactions_from_user_id_fkey(username, full_name, avatar_url),
					to_user:user_profiles!transactions_to_user_id_fkey(username, full_name, avatar_url)
				`
				)
				.or(
					`and(from_user_id.eq.${businessId},to_user_id.eq.${customerId}),and(from_user_id.eq.${customerId},to_user_id.eq.${businessId})`
				)
				.eq('status', 'completed')
				.order('created_at', { ascending: false });

			if (error) {
				console.error('Error fetching customer transactions:', error);
				throw new Error(
					`Failed to fetch customer transactions: ${error.message}`
				);
			}

			return {
				customer,
				transactions: transactions || [],
			};
		} catch (error) {
			console.error('Error in getCustomerDetails:', error);
			throw error;
		}
	}
}
