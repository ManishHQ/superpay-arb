import { supabase } from '@/lib/supabase';
import { SavingsPot } from '@/stores/savingsPotsStore';

export interface CreatePotData {
	name: string;
	description?: string;
	targetAmount: number;
	icon?: string;
	color?: string;
	category?:
		| 'housing'
		| 'transport'
		| 'emergency'
		| 'vacation'
		| 'investment'
		| 'custom';
	targetDate?: Date;
	isStrict?: boolean;
	strictDeadline?: Date;
	isJoint?: boolean;
	invitedUsers?: string[];
}

export interface UpdatePotData {
	name?: string;
	description?: string;
	targetAmount?: number;
	icon?: string;
	color?: string;
	category?:
		| 'housing'
		| 'transport'
		| 'emergency'
		| 'vacation'
		| 'investment'
		| 'custom';
	targetDate?: Date;
	isYieldEnabled?: boolean;
	yieldStrategy?: 'aave' | 'compound' | 'celo' | 'coinbase';
	apy?: number;
	isAutoInvestEnabled?: boolean;
	autoInvestAmount?: number;
	autoInvestFrequency?: 'weekly' | 'monthly';
	monthlyContribution?: number;
	isStrict?: boolean;
	strictDeadline?: Date;
	isJoint?: boolean;
	collaborators?: string[];
	invitedUsers?: string[];
	isArchived?: boolean;
}

export interface DatabasePot {
	id: string;
	user_id: string;
	name: string;
	description?: string;
	target_amount: number;
	current_amount: number;
	icon: string;
	color: string;
	category: string;
	is_yield_enabled: boolean;
	yield_strategy?: string;
	apy?: number;
	is_auto_invest_enabled: boolean;
	auto_invest_amount?: number;
	auto_invest_frequency?: string;
	monthly_contribution?: number;
	is_strict: boolean;
	strict_deadline?: string;
	is_joint: boolean;
	collaborators?: string[];
	invited_users?: string[];
	is_archived: boolean;
	created_at: string;
	updated_at: string;
	target_date?: string;
}

export class PotsService {
	/**
	 * Convert database pot to app pot format
	 */
	private static mapDatabasePotToAppPot(dbPot: DatabasePot): SavingsPot {
		return {
			id: dbPot.id,
			name: dbPot.name,
			description: dbPot.description,
			targetAmount: parseFloat(dbPot.target_amount.toString()),
			currentAmount: parseFloat(dbPot.current_amount.toString()),
			icon: dbPot.icon,
			color: dbPot.color,
			category: dbPot.category as any,
			isYieldEnabled: dbPot.is_yield_enabled,
			yieldStrategy: dbPot.yield_strategy as any,
			apy: dbPot.apy ? parseFloat(dbPot.apy.toString()) : undefined,
			createdAt: new Date(dbPot.created_at),
			targetDate: dbPot.target_date ? new Date(dbPot.target_date) : undefined,
			isArchived: dbPot.is_archived,
			isAutoInvestEnabled: dbPot.is_auto_invest_enabled,
			autoInvestAmount: dbPot.auto_invest_amount
				? parseFloat(dbPot.auto_invest_amount.toString())
				: undefined,
			autoInvestFrequency: dbPot.auto_invest_frequency as any,
			monthlyContribution: dbPot.monthly_contribution
				? parseFloat(dbPot.monthly_contribution.toString())
				: undefined,
			isStrict: dbPot.is_strict,
			strictDeadline: dbPot.strict_deadline
				? new Date(dbPot.strict_deadline)
				: undefined,
			isJoint: dbPot.is_joint,
			collaborators: dbPot.collaborators || [],
			invitedUsers: dbPot.invited_users || [],
		};
	}

	/**
	 * Convert app pot to database format
	 */
	private static mapAppPotToDatabase(
		pot: Partial<SavingsPot>,
		userId: string
	): Partial<DatabasePot> {
		const dbPot: Partial<DatabasePot> = {
			user_id: userId,
		};

		if (pot.name !== undefined) dbPot.name = pot.name;
		if (pot.description !== undefined) dbPot.description = pot.description;
		if (pot.targetAmount !== undefined) dbPot.target_amount = pot.targetAmount;
		if (pot.icon !== undefined) dbPot.icon = pot.icon;
		if (pot.color !== undefined) dbPot.color = pot.color;
		if (pot.category !== undefined) dbPot.category = pot.category;
		if (pot.targetDate !== undefined)
			dbPot.target_date = pot.targetDate.toISOString();
		if (pot.isYieldEnabled !== undefined)
			dbPot.is_yield_enabled = pot.isYieldEnabled;
		if (pot.yieldStrategy !== undefined)
			dbPot.yield_strategy = pot.yieldStrategy;
		if (pot.apy !== undefined) dbPot.apy = pot.apy;
		if (pot.isAutoInvestEnabled !== undefined)
			dbPot.is_auto_invest_enabled = pot.isAutoInvestEnabled;
		if (pot.autoInvestAmount !== undefined)
			dbPot.auto_invest_amount = pot.autoInvestAmount;
		if (pot.autoInvestFrequency !== undefined)
			dbPot.auto_invest_frequency = pot.autoInvestFrequency;
		if (pot.monthlyContribution !== undefined)
			dbPot.monthly_contribution = pot.monthlyContribution;
		if (pot.isStrict !== undefined) dbPot.is_strict = pot.isStrict;
		if (pot.strictDeadline !== undefined)
			dbPot.strict_deadline = pot.strictDeadline.toISOString();
		if (pot.isJoint !== undefined) dbPot.is_joint = pot.isJoint;
		if (pot.collaborators !== undefined)
			dbPot.collaborators = pot.collaborators;
		if (pot.invitedUsers !== undefined) dbPot.invited_users = pot.invitedUsers;
		if (pot.isArchived !== undefined) dbPot.is_archived = pot.isArchived;

		return dbPot;
	}

	/**
	 * Get all pots for a user
	 */
	static async getUserPots(userId: string): Promise<SavingsPot[]> {
		try {
			const { data: pots, error } = await supabase
				.from('user_pots')
				.select('*')
				.eq('user_id', userId)
				.eq('is_archived', false)
				.order('created_at', { ascending: false });

			if (error) {
				console.error('Error fetching user pots:', error);
				throw new Error(`Failed to fetch pots: ${error.message}`);
			}

			return (pots || []).map(this.mapDatabasePotToAppPot);
		} catch (error) {
			console.error('Error in getUserPots:', error);
			throw error;
		}
	}

	/**
	 * Get a specific pot by ID
	 */
	static async getPotById(potId: string): Promise<SavingsPot | null> {
		try {
			const { data: pot, error } = await supabase
				.from('user_pots')
				.select('*')
				.eq('id', potId)
				.single();

			if (error) {
				if (error.code === 'PGRST116') {
					return null; // Pot not found
				}
				console.error('Error fetching pot:', error);
				throw new Error(`Failed to fetch pot: ${error.message}`);
			}

			return this.mapDatabasePotToAppPot(pot);
		} catch (error) {
			console.error('Error in getPotById:', error);
			throw error;
		}
	}

	/**
	 * Create a new pot
	 */
	static async createPot(
		userId: string,
		potData: CreatePotData
	): Promise<SavingsPot> {
		try {
			const dbPotData = this.mapAppPotToDatabase(potData, userId);

			const { data: pot, error } = await supabase
				.from('user_pots')
				.insert(dbPotData)
				.select()
				.single();

			if (error) {
				console.error('Error creating pot:', error);
				throw new Error(`Failed to create pot: ${error.message}`);
			}

			return this.mapDatabasePotToAppPot(pot);
		} catch (error) {
			console.error('Error in createPot:', error);
			throw error;
		}
	}

	/**
	 * Update an existing pot
	 */
	static async updatePot(
		potId: string,
		userId: string,
		updates: UpdatePotData
	): Promise<SavingsPot> {
		try {
			const dbUpdates = this.mapAppPotToDatabase(updates, userId);

			const { data: pot, error } = await supabase
				.from('user_pots')
				.update(dbUpdates)
				.eq('id', potId)
				.eq('user_id', userId)
				.select()
				.single();

			if (error) {
				console.error('Error updating pot:', error);
				throw new Error(`Failed to update pot: ${error.message}`);
			}

			return this.mapDatabasePotToAppPot(pot);
		} catch (error) {
			console.error('Error in updatePot:', error);
			throw error;
		}
	}

	/**
	 * Delete a pot
	 */
	static async deletePot(potId: string, userId: string): Promise<void> {
		try {
			const { error } = await supabase
				.from('user_pots')
				.delete()
				.eq('id', potId)
				.eq('user_id', userId);

			if (error) {
				console.error('Error deleting pot:', error);
				throw new Error(`Failed to delete pot: ${error.message}`);
			}
		} catch (error) {
			console.error('Error in deletePot:', error);
			throw error;
		}
	}

	/**
	 * Archive a pot (soft delete)
	 */
	static async archivePot(potId: string, userId: string): Promise<void> {
		try {
			const { error } = await supabase
				.from('user_pots')
				.update({ is_archived: true })
				.eq('id', potId)
				.eq('user_id', userId);

			if (error) {
				console.error('Error archiving pot:', error);
				throw new Error(`Failed to archive pot: ${error.message}`);
			}
		} catch (error) {
			console.error('Error in archivePot:', error);
			throw error;
		}
	}

	/**
	 * Add funds to a pot
	 */
	static async addFunds(
		potId: string,
		userId: string,
		amount: number
	): Promise<SavingsPot> {
		try {
			// Get current pot to calculate new amount
			const currentPot = await this.getPotById(potId);
			if (!currentPot) {
				throw new Error('Pot not found');
			}

			const newAmount = currentPot.currentAmount + amount;

			const { data: pot, error } = await supabase
				.from('user_pots')
				.update({ current_amount: newAmount })
				.eq('id', potId)
				.eq('user_id', userId)
				.select()
				.single();

			if (error) {
				console.error('Error adding funds to pot:', error);
				throw new Error(`Failed to add funds: ${error.message}`);
			}

			return this.mapDatabasePotToAppPot(pot);
		} catch (error) {
			console.error('Error in addFunds:', error);
			throw error;
		}
	}

	/**
	 * Withdraw funds from a pot
	 */
	static async withdrawFunds(
		potId: string,
		userId: string,
		amount: number
	): Promise<SavingsPot> {
		try {
			// Get current pot to validate withdrawal
			const currentPot = await this.getPotById(potId);
			if (!currentPot) {
				throw new Error('Pot not found');
			}

			if (currentPot.currentAmount < amount) {
				throw new Error('Insufficient funds in pot');
			}

			// Check strict pot deadline
			if (
				currentPot.isStrict &&
				currentPot.strictDeadline &&
				new Date() < currentPot.strictDeadline
			) {
				throw new Error('Cannot withdraw from strict pot before deadline');
			}

			const newAmount = currentPot.currentAmount - amount;

			const { data: pot, error } = await supabase
				.from('user_pots')
				.update({ current_amount: newAmount })
				.eq('id', potId)
				.eq('user_id', userId)
				.select()
				.single();

			if (error) {
				console.error('Error withdrawing funds from pot:', error);
				throw new Error(`Failed to withdraw funds: ${error.message}`);
			}

			return this.mapDatabasePotToAppPot(pot);
		} catch (error) {
			console.error('Error in withdrawFunds:', error);
			throw error;
		}
	}

	/**
	 * Get total savings across all pots for a user
	 */
	static async getTotalSavings(userId: string): Promise<number> {
		try {
			const { data: result, error } = await supabase
				.from('user_pots')
				.select('current_amount')
				.eq('user_id', userId)
				.eq('is_archived', false);

			if (error) {
				console.error('Error fetching total savings:', error);
				throw new Error(`Failed to fetch total savings: ${error.message}`);
			}

			return (result || []).reduce((total, pot) => {
				return total + parseFloat(pot.current_amount.toString());
			}, 0);
		} catch (error) {
			console.error('Error in getTotalSavings:', error);
			throw error;
		}
	}

	/**
	 * Get pots by category
	 */
	static async getPotsByCategory(
		userId: string,
		category: string
	): Promise<SavingsPot[]> {
		try {
			const { data: pots, error } = await supabase
				.from('user_pots')
				.select('*')
				.eq('user_id', userId)
				.eq('category', category)
				.eq('is_archived', false)
				.order('created_at', { ascending: false });

			if (error) {
				console.error('Error fetching pots by category:', error);
				throw new Error(`Failed to fetch pots by category: ${error.message}`);
			}

			return (pots || []).map(this.mapDatabasePotToAppPot);
		} catch (error) {
			console.error('Error in getPotsByCategory:', error);
			throw error;
		}
	}
}
