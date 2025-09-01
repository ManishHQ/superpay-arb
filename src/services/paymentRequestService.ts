import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';

export interface PaymentRequest {
	id: string;
	business_id: string;
	customer_id: string;
	amount: number;
	currency: string;
	description: string;
	due_date?: string;
	status: 'pending' | 'paid' | 'overdue' | 'cancelled';
	created_at: string;
	updated_at: string;
	business_profile?: {
		business_name?: string;
		display_name?: string;
		full_name?: string;
		avatar_url?: string;
	};
	customer_profile?: {
		username?: string;
		full_name?: string;
		email?: string;
		avatar_url?: string;
	};
}

export interface CreatePaymentRequestData {
	customer_id: string;
	amount: number;
	description: string;
	due_date?: string;
	currency?: string;
}

export class PaymentRequestService {
	private static instance: PaymentRequestService;

	static getInstance(): PaymentRequestService {
		if (!PaymentRequestService.instance) {
			PaymentRequestService.instance = new PaymentRequestService();
		}
		return PaymentRequestService.instance;
	}

	/**
	 * Create a new payment request
	 */
	async createPaymentRequest(
		businessId: string,
		requestData: CreatePaymentRequestData
	): Promise<PaymentRequest | null> {
		try {
			const { data, error } = await supabase
				.from('payment_requests')
				.insert({
					business_id: businessId,
					customer_id: requestData.customer_id,
					amount: requestData.amount,
					currency: requestData.currency || 'USD',
					description: requestData.description,
					due_date: requestData.due_date,
					status: 'pending',
				})
				.select(`
					*,
					business_profile:profiles!payment_requests_business_id_fkey(
						business_name,
						display_name,
						full_name,
						avatar_url
					),
					customer_profile:profiles!payment_requests_customer_id_fkey(
						username,
						full_name,
						email,
						avatar_url
					)
				`)
				.single();

			if (error) {
				console.error('Error creating payment request:', error);
				return null;
			}

			const paymentRequest = data as PaymentRequest;

			// Send notification to customer
			await this.sendPaymentRequestNotification(paymentRequest);

			return paymentRequest;
		} catch (error) {
			console.error('Error in createPaymentRequest:', error);
			return null;
		}
	}

	/**
	 * Get payment requests for a business
	 */
	async getBusinessPaymentRequests(businessId: string): Promise<PaymentRequest[]> {
		try {
			const { data, error } = await supabase
				.from('payment_requests')
				.select(`
					*,
					customer_profile:profiles!payment_requests_customer_id_fkey(
						username,
						full_name,
						email,
						avatar_url
					)
				`)
				.eq('business_id', businessId)
				.order('created_at', { ascending: false });

			if (error) {
				console.error('Error fetching business payment requests:', error);
				return [];
			}

			return data as PaymentRequest[];
		} catch (error) {
			console.error('Error in getBusinessPaymentRequests:', error);
			return [];
		}
	}

	/**
	 * Get payment requests for a customer
	 */
	async getCustomerPaymentRequests(customerId: string): Promise<PaymentRequest[]> {
		try {
			const { data, error } = await supabase
				.from('payment_requests')
				.select(`
					*,
					business_profile:profiles!payment_requests_business_id_fkey(
						business_name,
						display_name,
						full_name,
						avatar_url
					)
				`)
				.eq('customer_id', customerId)
				.order('created_at', { ascending: false });

			if (error) {
				console.error('Error fetching customer payment requests:', error);
				return [];
			}

			return data as PaymentRequest[];
		} catch (error) {
			console.error('Error in getCustomerPaymentRequests:', error);
			return [];
		}
	}

	/**
	 * Update payment request status
	 */
	async updatePaymentRequestStatus(
		requestId: string,
		status: PaymentRequest['status']
	): Promise<boolean> {
		try {
			const { error } = await supabase
				.from('payment_requests')
				.update({
					status,
					updated_at: new Date().toISOString(),
				})
				.eq('id', requestId);

			if (error) {
				console.error('Error updating payment request status:', error);
				return false;
			}

			return true;
		} catch (error) {
			console.error('Error in updatePaymentRequestStatus:', error);
			return false;
		}
	}

	/**
	 * Mark payment request as paid
	 */
	async markPaymentRequestAsPaid(
		requestId: string,
		transactionHash?: string
	): Promise<boolean> {
		try {
			const { error } = await supabase
				.from('payment_requests')
				.update({
					status: 'paid',
					transaction_hash: transactionHash,
					paid_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
				.eq('id', requestId);

			if (error) {
				console.error('Error marking payment request as paid:', error);
				return false;
			}

			return true;
		} catch (error) {
			console.error('Error in markPaymentRequestAsPaid:', error);
			return false;
		}
	}

	/**
	 * Send payment request notification to customer
	 */
	private async sendPaymentRequestNotification(paymentRequest: PaymentRequest): Promise<void> {
		try {
			const businessName = 
				paymentRequest.business_profile?.business_name ||
				paymentRequest.business_profile?.display_name ||
				paymentRequest.business_profile?.full_name ||
				'Business';

			// Create the notification content
			const notificationContent = {
				title: '💳 Payment Request',
				body: `${businessName} has requested $${paymentRequest.amount} - ${paymentRequest.description}`,
				data: {
					type: 'payment_request',
					paymentRequestId: paymentRequest.id,
					businessId: paymentRequest.business_id,
					amount: paymentRequest.amount,
					currency: paymentRequest.currency,
					description: paymentRequest.description,
					businessName,
				},
			};

			// Here you would typically:
			// 1. Get customer's push notification token from database
			// 2. Send push notification via Expo Push Service
			// 3. Send email notification
			// 4. Create in-app notification record

			// For now, we'll simulate sending the notification
			console.log('📱 Payment request notification sent:', notificationContent);

			// You would also save the notification to the database for in-app display
			await this.createInAppNotification(paymentRequest);

		} catch (error) {
			console.error('Error sending payment request notification:', error);
		}
	}

	/**
	 * Create in-app notification record
	 */
	private async createInAppNotification(paymentRequest: PaymentRequest): Promise<void> {
		try {
			const businessName = 
				paymentRequest.business_profile?.business_name ||
				paymentRequest.business_profile?.display_name ||
				paymentRequest.business_profile?.full_name ||
				'Business';

			const { error } = await supabase
				.from('notifications')
				.insert({
					user_id: paymentRequest.customer_id,
					type: 'payment_request',
					title: 'Payment Request',
					message: `${businessName} has requested $${paymentRequest.amount} - ${paymentRequest.description}`,
					data: {
						payment_request_id: paymentRequest.id,
						business_id: paymentRequest.business_id,
						amount: paymentRequest.amount,
						currency: paymentRequest.currency,
					},
					is_read: false,
				});

			if (error) {
				console.error('Error creating in-app notification:', error);
			}
		} catch (error) {
			console.error('Error in createInAppNotification:', error);
		}
	}

	/**
	 * Cancel a payment request
	 */
	async cancelPaymentRequest(requestId: string): Promise<boolean> {
		return this.updatePaymentRequestStatus(requestId, 'cancelled');
	}

	/**
	 * Get overdue payment requests for a business
	 */
	async getOverduePaymentRequests(businessId: string): Promise<PaymentRequest[]> {
		try {
			const now = new Date().toISOString();
			
			const { data, error } = await supabase
				.from('payment_requests')
				.select(`
					*,
					customer_profile:profiles!payment_requests_customer_id_fkey(
						username,
						full_name,
						email,
						avatar_url
					)
				`)
				.eq('business_id', businessId)
				.eq('status', 'pending')
				.lt('due_date', now)
				.order('due_date', { ascending: true });

			if (error) {
				console.error('Error fetching overdue payment requests:', error);
				return [];
			}

			// Update status to overdue
			const overdueIds = data.map(req => req.id);
			if (overdueIds.length > 0) {
				await supabase
					.from('payment_requests')
					.update({ status: 'overdue' })
					.in('id', overdueIds);
			}

			return data.map(req => ({ ...req, status: 'overdue' as const }));
		} catch (error) {
			console.error('Error in getOverduePaymentRequests:', error);
			return [];
		}
	}

	/**
	 * Get payment request statistics for a business
	 */
	async getPaymentRequestStats(businessId: string): Promise<{
		pending: number;
		paid: number;
		overdue: number;
		totalAmount: number;
		pendingAmount: number;
	}> {
		try {
			const { data, error } = await supabase
				.from('payment_requests')
				.select('status, amount')
				.eq('business_id', businessId);

			if (error) {
				console.error('Error fetching payment request stats:', error);
				return { pending: 0, paid: 0, overdue: 0, totalAmount: 0, pendingAmount: 0 };
			}

			const stats = data.reduce((acc, req) => {
				acc.totalAmount += req.amount;
				
				if (req.status === 'pending') {
					acc.pending++;
					acc.pendingAmount += req.amount;
				} else if (req.status === 'paid') {
					acc.paid++;
				} else if (req.status === 'overdue') {
					acc.overdue++;
					acc.pendingAmount += req.amount;
				}

				return acc;
			}, { pending: 0, paid: 0, overdue: 0, totalAmount: 0, pendingAmount: 0 });

			return stats;
		} catch (error) {
			console.error('Error in getPaymentRequestStats:', error);
			return { pending: 0, paid: 0, overdue: 0, totalAmount: 0, pendingAmount: 0 };
		}
	}
}