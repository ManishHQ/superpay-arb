import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/api';

// Activity type enum matching the backend
export enum ActivityType {
	SUBSCRIPTION = 'subscription',
	GROUP = 'group',
	EVENT = 'event',
	DONATION = 'donation',
	BUSINESS = 'business',
	PERSONAL = 'personal',
}

export interface Activity {
	_id: string;
	name: string;
	type: ActivityType;
	description?: string;
	icon?: string;
	owner: string;
	members: string[];
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreateActivityData {
	name: string;
	type: ActivityType;
	description?: string;
	icon?: string;
	memberIds?: string[];
}

export interface UpdateActivityData {
	name?: string;
	description?: string;
	icon?: string;
	memberIds?: string[];
	isActive?: boolean;
}

export interface ActivityStats {
	totalActivities: number;
	activeActivities: number;
	activitiesByType: Record<ActivityType, number>;
}

export class ActivityService {
	/**
	 * Get authentication token
	 */
	private static async getToken(): Promise<string> {
		try {
			const token = await AsyncStorage.getItem('userToken');
			console.log(
				'ActivityService - Retrieved token:',
				token ? 'Token exists' : 'No token'
			);
			if (!token) {
				throw new Error('No authentication token found');
			}
			return token;
		} catch (error) {
			console.error('ActivityService - Error getting token:', error);
			throw new Error('Failed to get authentication token');
		}
	}

	/**
	 * Get all activities with pagination
	 */
	static async getActivities(
		page: number = 1,
		limit: number = 10,
		type?: ActivityType
	): Promise<{
		data: {
			activities: Activity[];
			total: number;
			page: number;
			limit: number;
		};
	}> {
		try {
			const token = await this.getToken();
			let url = `${API_BASE_URL}/activities?page=${page}&limit=${limit}`;

			console.log('url', url);

			if (type) {
				url += `&type=${type}`;
			}

			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error('Failed to fetch activities');
			}

			return await response.json();
		} catch (error) {
			console.error('Error fetching activities:', error);
			throw error;
		}
	}

	/**
	 * Get activity statistics
	 */
	static async getActivityStats(): Promise<ActivityStats> {
		try {
			const token = await this.getToken();
			const response = await fetch(`${API_BASE_URL}/activities/stats`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error('Failed to fetch activity statistics');
			}

			return await response.json();
		} catch (error) {
			console.error('Error fetching activity stats:', error);
			throw error;
		}
	}

	/**
	 * Get specific activity by ID
	 */
	static async getActivity(activityId: string): Promise<Activity> {
		try {
			const token = await this.getToken();
			const response = await fetch(`${API_BASE_URL}/activities/${activityId}`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error('Failed to fetch activity');
			}

			return await response.json();
		} catch (error) {
			console.error('Error fetching activity:', error);
			throw error;
		}
	}

	/**
	 * Create new activity
	 */
	static async createActivity(
		activityData: CreateActivityData
	): Promise<Activity> {
		try {
			const token = await this.getToken();
			const response = await fetch(`${API_BASE_URL}/activities`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(activityData),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to create activity');
			}

			return await response.json();
		} catch (error) {
			console.error('Error creating activity:', error);
			throw error;
		}
	}

	/**
	 * Update activity
	 */
	static async updateActivity(
		activityId: string,
		updateData: UpdateActivityData
	): Promise<Activity> {
		try {
			const token = await this.getToken();
			const response = await fetch(`${API_BASE_URL}/activities/${activityId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(updateData),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to update activity');
			}

			return await response.json();
		} catch (error) {
			console.error('Error updating activity:', error);
			throw error;
		}
	}

	/**
	 * Delete activity
	 */
	static async deleteActivity(activityId: string): Promise<void> {
		try {
			const token = await this.getToken();
			const response = await fetch(`${API_BASE_URL}/activities/${activityId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error('Failed to delete activity');
			}
		} catch (error) {
			console.error('Error deleting activity:', error);
			throw error;
		}
	}

	/**
	 * Add member to activity
	 */
	static async addMember(activityId: string, memberId: string): Promise<void> {
		try {
			const token = this.getToken();
			const response = await fetch(
				`${API_BASE_URL}/activities/${activityId}/members`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ memberId }),
				}
			);

			if (!response.ok) {
				throw new Error('Failed to add member to activity');
			}
		} catch (error) {
			console.error('Error adding member to activity:', error);
			throw error;
		}
	}

	/**
	 * Remove member from activity
	 */
	static async removeMember(
		activityId: string,
		memberId: string
	): Promise<void> {
		try {
			const token = await this.getToken();
			const response = await fetch(
				`${API_BASE_URL}/activities/${activityId}/members/${memberId}`,
				{
					method: 'DELETE',
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (!response.ok) {
				throw new Error('Failed to remove member from activity');
			}
		} catch (error) {
			console.error('Error removing member from activity:', error);
			throw error;
		}
	}

	/**
	 * Get activity type options for dropdown
	 */
	static getActivityTypeOptions() {
		return Object.values(ActivityType).map((type) => ({
			value: type,
			label: type.charAt(0).toUpperCase() + type.slice(1),
			icon: this.getActivityTypeIcon(type),
		}));
	}

	/**
	 * Get icon for activity type
	 */
	static getActivityTypeIcon(type: ActivityType): string {
		const icons: Record<ActivityType, string> = {
			[ActivityType.SUBSCRIPTION]: '📺',
			[ActivityType.GROUP]: '👥',
			[ActivityType.EVENT]: '🎉',
			[ActivityType.DONATION]: '🎓',
			[ActivityType.BUSINESS]: '💼',
			[ActivityType.PERSONAL]: '👤',
		};
		return icons[type] || '📋';
	}
}
