import { supabase } from '@/lib/supabase';
import { useSavingsPotsStore } from '@/stores/savingsPotsStore';
import { Transaction } from '@/types/supabase';
import { TransactionCategory } from './transactionService';

export interface PotActivity {
	id: string;
	pot_id: string;
	transaction_id?: string;
	activity_type:
		| 'deposit'
		| 'withdrawal'
		| 'interest'
		| 'fee'
		| 'transfer_in'
		| 'transfer_out';
	amount: number;
	currency: string;
	description?: string;
	metadata?: Record<string, any>;
	created_at: string;
}

export interface CreatePotActivityData {
	pot_id: string;
	transaction_id?: string;
	activity_type: PotActivity['activity_type'];
	amount: number;
	currency: string;
	description?: string;
	metadata?: Record<string, any>;
}

export class PotsActivityService {
	/**
	 * Create a new pot activity
	 */
	static async createPotActivity(
		data: CreatePotActivityData
	): Promise<PotActivity> {
		try {
			const activityData = {
				pot_id: data.pot_id,
				transaction_id: data.transaction_id,
				activity_type: data.activity_type,
				amount: data.amount,
				currency: data.currency,
				description: data.description,
				metadata: data.metadata || {},
				created_at: new Date().toISOString(),
			};

			const { data: activity, error } = await supabase
				.from('pot_activities')
				.insert(activityData)
				.select()
				.single();

			if (error) {
				console.error('Error creating pot activity:', error);
				throw new Error(`Failed to create pot activity: ${error.message}`);
			}

			return activity;
		} catch (error) {
			console.error('Error in createPotActivity:', error);
			throw error;
		}
	}

	/**
	 * Get activities for a specific pot
	 */
	static async getPotActivities(
		potId: string,
		limit?: number
	): Promise<PotActivity[]> {
		try {
			let query = supabase
				.from('pot_activities')
				.select('*')
				.eq('pot_id', potId)
				.order('created_at', { ascending: false });

			if (limit) query = query.limit(limit);

			const { data: activities, error } = await query;

			if (error) {
				console.error('Error fetching pot activities:', error);
				throw new Error(`Failed to fetch pot activities: ${error.message}`);
			}

			return activities || [];
		} catch (error) {
			console.error('Error in getPotActivities:', error);
			throw error;
		}
	}

	/**
	 * Link a transaction to a pot and create activity
	 */
	static async linkTransactionToPot(
		transaction: Transaction,
		potId: string,
		activityType: 'deposit' | 'withdrawal' = 'deposit'
	): Promise<PotActivity> {
		try {
			// Create pot activity linked to the transaction
			const activity = await this.createPotActivity({
				pot_id: potId,
				transaction_id: transaction.id,
				activity_type: activityType,
				amount: transaction.amount,
				currency: transaction.currency,
				description:
					transaction.note ||
					`${activityType === 'deposit' ? 'Added' : 'Withdrew'} funds`,
				metadata: {
					transaction_hash: transaction.transaction_hash,
					category: transaction.category,
				},
			});

			// Update pot balance based on activity type
			const potsStore = useSavingsPotsStore.getState();
			if (activityType === 'deposit') {
				await potsStore.addFunds(potId, transaction.amount);
			} else if (activityType === 'withdrawal') {
				await potsStore.withdrawFunds(potId, transaction.amount);
			}

			return activity;
		} catch (error) {
			console.error('Error in linkTransactionToPot:', error);
			throw error;
		}
	}

	/**
	 * Find pots that match transaction category for auto-linking
	 */
	static getPotsByCategory(category: TransactionCategory | null): string[] {
		const potsStore = useSavingsPotsStore.getState();
		const activePots = potsStore.getActivePots();

		if (!category) return [];

		return activePots
			.filter((pot) => pot.category === category)
			.map((pot) => pot.id);
	}

	/**
	 * Auto-link transaction to appropriate pots based on category
	 */
	static async autoLinkTransactionToPots(
		transaction: Transaction,
		potId?: string // Optional specific pot to link to
	): Promise<PotActivity[]> {
		try {
			const activities: PotActivity[] = [];

			if (potId) {
				// Link to specific pot
				const activity = await this.linkTransactionToPot(
					transaction,
					potId,
					'deposit'
				);
				activities.push(activity);
			} else if (transaction.category) {
				// Auto-link based on category
				const matchingPotIds = this.getPotsByCategory(transaction.category);

				for (const potId of matchingPotIds) {
					try {
						const activity = await this.linkTransactionToPot(
							transaction,
							potId,
							'deposit'
						);
						activities.push(activity);
					} catch (error) {
						console.error(`Failed to link transaction to pot ${potId}:`, error);
						// Continue with other pots even if one fails
					}
				}
			}

			return activities;
		} catch (error) {
			console.error('Error in autoLinkTransactionToPots:', error);
			throw error;
		}
	}

	/**
	 * Get pot activity summary
	 */
	static async getPotActivitySummary(potId: string): Promise<{
		totalDeposits: number;
		totalWithdrawals: number;
		netAmount: number;
		activityCount: number;
		lastActivity?: PotActivity;
	}> {
		try {
			const activities = await this.getPotActivities(potId);

			const summary = activities.reduce(
				(acc, activity) => {
					if (
						activity.activity_type === 'deposit' ||
						activity.activity_type === 'interest'
					) {
						acc.totalDeposits += activity.amount;
					} else if (
						activity.activity_type === 'withdrawal' ||
						activity.activity_type === 'fee'
					) {
						acc.totalWithdrawals += activity.amount;
					}
					return acc;
				},
				{
					totalDeposits: 0,
					totalWithdrawals: 0,
					netAmount: 0,
					activityCount: activities.length,
					lastActivity: activities[0],
				}
			);

			summary.netAmount = summary.totalDeposits - summary.totalWithdrawals;

			return summary;
		} catch (error) {
			console.error('Error in getPotActivitySummary:', error);
			throw error;
		}
	}

	/**
	 * Delete pot activity
	 */
	static async deletePotActivity(activityId: string): Promise<void> {
		try {
			const { error } = await supabase
				.from('pot_activities')
				.delete()
				.eq('id', activityId);

			if (error) {
				console.error('Error deleting pot activity:', error);
				throw new Error(`Failed to delete pot activity: ${error.message}`);
			}
		} catch (error) {
			console.error('Error in deletePotActivity:', error);
			throw error;
		}
	}
}
