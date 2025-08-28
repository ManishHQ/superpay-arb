import { API_BASE_URL } from '@/config/api';
import { DIDAuthService } from './didAuthService';

export type PaymentMethod =
	| 'superpay'
	| 'upi'
	| 'card'
	| 'cash'
	| 'crypto'
	| 'qr';

export type PaymentTag =
	| 'savings'
	| 'entertainment'
	| 'food'
	| 'rent'
	| 'transportation'
	| 'healthcare'
	| 'education'
	| 'shopping'
	| 'utilities'
	| 'insurance'
	| 'investment'
	| 'travel'
	| 'subscription'
	| 'charity'
	| 'business'
	| 'personal'
	| 'other';

export interface CreatePaymentRequest {
	to: string;
	amount: number;
	currency: string;
	method: PaymentMethod;
	note?: string;
	activity?: string;
	transactionIds?: string[];
	transactionHash?: string;
	upiId?: string;
	cardLast4?: string;
	cryptoAddress?: string;
	requestId?: string;
	isRequest?: boolean;
	requestedBy?: string;
	tags?: PaymentTag[];
}

export interface Payment {
	_id: string;
	from: string;
	to: string;
	amount: number;
	currency: string;
	method: string;
	note?: string;
	status: 'pending' | 'completed' | 'failed' | 'cancelled';
	activity?: string;
	transactionIds?: string[];
	transactionHash?: string;
	upiId?: string;
	cardLast4?: string;
	cryptoAddress?: string;
	requestId?: string;
	isRequest?: boolean;
	requestedBy?: string;
	tags?: PaymentTag[];
	createdAt: string;
	updatedAt: string;
}

export interface PaymentResponse {
	status: string;
	message: string;
	data: Payment;
}

export interface PaymentsListResponse {
	status: string;
	message: string;
	data: {
		payments: Payment[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			pages: number;
		};
	};
}

export class PaymentService {
	private static async getAuthToken(): Promise<string> {
		console.log('🔐 [PaymentService] Getting DID token for API call...');
		const token = await DIDAuthService.getTokenForAPICall();
		if (!token) {
			throw new Error('No DID authentication token found');
		}
		console.log('✅ [PaymentService] DID token obtained for API call');
		return token;
	}

	private static async request<T>(
		endpoint: string,
		options: RequestInit = {},
		retryCount: number = 0
	): Promise<T> {
		const token = await this.getAuthToken();
		const url = `${API_BASE_URL}${endpoint}`;

		console.log('🔍 [PaymentService] Making request to:', url);
		console.log(
			'🎫 [PaymentService] Token preview:',
			token ? `${token.substring(0, 50)}...` : 'null'
		);
		console.log('🔄 [PaymentService] Retry count:', retryCount);

		const response = await fetch(url, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
				...options.headers,
			},
		});

		console.log('📊 [PaymentService] Response status:', response.status);

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			console.error('❌ [PaymentService] Request failed:', {
				status: response.status,
				statusText: response.statusText,
				errorData,
			});

			// If it's a 401 (token expired) and we haven't retried yet, try to refresh token
			if (response.status === 401 && retryCount === 0) {
				console.log(
					'🔄 [PaymentService] Token expired (401), attempting to refresh...'
				);

				const refreshResult = await DIDAuthService.refreshToken();

				if (refreshResult.success && refreshResult.didToken) {
					console.log(
						'✅ [PaymentService] Token refreshed, retrying request...'
					);
					return this.request<T>(endpoint, options, retryCount + 1);
				} else {
					console.error(
						'❌ [PaymentService] Token refresh failed:',
						refreshResult.error
					);
					throw new Error(
						`Token expired and refresh failed: ${refreshResult.error}`
					);
				}
			}

			throw new Error(
				errorData?.message || `HTTP ${response.status}: ${response.statusText}`
			);
		}

		console.log('✅ [PaymentService] Request successful');
		return response.json();
	}

	// Create a new payment
	static async createPayment(
		paymentData: CreatePaymentRequest
	): Promise<PaymentResponse> {
		return this.request<PaymentResponse>('/payments', {
			method: 'POST',
			body: JSON.stringify(paymentData),
		});
	}

	// Get all payments
	static async getPayments(
		page = 1,
		limit = 10
	): Promise<PaymentsListResponse> {
		return this.request<PaymentsListResponse>(
			`/payments?page=${page}&limit=${limit}`
		);
	}

	// Get payments by activity
	static async getPaymentsByActivity(
		activityId: string,
		page = 1,
		limit = 10
	): Promise<PaymentsListResponse> {
		return this.request<PaymentsListResponse>(
			`/payments?activity=${activityId}&page=${page}&limit=${limit}`
		);
	}

	// Get payments by status
	static async getPaymentsByStatus(
		status: string,
		page = 1,
		limit = 10
	): Promise<PaymentsListResponse> {
		return this.request<PaymentsListResponse>(
			`/payments?status=${status}&page=${page}&limit=${limit}`
		);
	}

	// Get payments by method
	static async getPaymentsByMethod(
		method: string,
		page = 1,
		limit = 10
	): Promise<PaymentsListResponse> {
		return this.request<PaymentsListResponse>(
			`/payments?method=${method}&page=${page}&limit=${limit}`
		);
	}

	// Get payments by tags
	static async getPaymentsByTags(
		tags: PaymentTag[],
		page = 1,
		limit = 10
	): Promise<PaymentsListResponse> {
		const tagsParam = tags.join(',');
		return this.request<PaymentsListResponse>(
			`/payments?tags=${tagsParam}&page=${page}&limit=${limit}`
		);
	}

	// Get activity payments
	static async getActivityPayments(
		activityId: string,
		page = 1,
		limit = 10
	): Promise<PaymentsListResponse> {
		return this.request<PaymentsListResponse>(
			`/payments/activity/${activityId}?page=${page}&limit=${limit}`
		);
	}

	// Get payment statistics
	static async getPaymentStats(): Promise<any> {
		return this.request('/payments/stats');
	}

	// Get payment statistics by tags
	static async getPaymentStatsByTags(): Promise<any> {
		return this.request('/payments/stats/tags');
	}

	// Get specific payment
	static async getPayment(paymentId: string): Promise<PaymentResponse> {
		return this.request<PaymentResponse>(`/payments/${paymentId}`);
	}

	// Update payment status
	static async updatePaymentStatus(
		paymentId: string,
		status: string
	): Promise<PaymentResponse> {
		return this.request<PaymentResponse>(`/payments/${paymentId}/status`, {
			method: 'PATCH',
			body: JSON.stringify({ status }),
		});
	}

	// Create payment request (not actual payment yet)
	static async createPaymentRequest(
		requestData: Omit<CreatePaymentRequest, 'isRequest' | 'from'>
	): Promise<PaymentResponse> {
		return this.request<PaymentResponse>('/payments', {
			method: 'POST',
			body: JSON.stringify({
				...requestData,
				isRequest: true,
				status: 'requested',
			}),
		});
	}

	// Fulfill payment request (convert request to payment)
	static async fulfillPaymentRequest(
		requestId: string
	): Promise<PaymentResponse> {
		return this.request<PaymentResponse>(`/payments/fulfill/${requestId}`, {
			method: 'POST',
		});
	}

	// Get payment requests for current user
	static async getPaymentRequests(
		page = 1,
		limit = 10
	): Promise<PaymentsListResponse> {
		return this.request<PaymentsListResponse>(
			`/payments?isRequest=true&page=${page}&limit=${limit}`
		);
	}

	// Helper method to get payment method display name
	static getPaymentMethodDisplayName(method: PaymentMethod): string {
		const methodNames: Record<PaymentMethod, string> = {
			superpay: 'SuperPay',
			upi: 'UPI',
			card: 'Card',
			cash: 'Cash',
			crypto: 'Crypto',
			qr: 'QR Code',
		};
		return methodNames[method] || method;
	}

	// Helper method to get payment method icon
	static getPaymentMethodIcon(method: PaymentMethod): string {
		const methodIcons: Record<PaymentMethod, string> = {
			superpay: 'wallet',
			upi: 'phone-portrait',
			card: 'card',
			cash: 'cash',
			crypto: 'logo-bitcoin',
			qr: 'qr-code',
		};
		return methodIcons[method] || 'card';
	}

	// Helper method to get payment tag display name
	static getPaymentTagDisplayName(tag: PaymentTag): string {
		const tagNames: Record<PaymentTag, string> = {
			savings: 'Savings',
			entertainment: 'Entertainment',
			food: 'Food & Dining',
			rent: 'Rent & Housing',
			transportation: 'Transportation',
			healthcare: 'Healthcare',
			education: 'Education',
			shopping: 'Shopping',
			utilities: 'Utilities',
			insurance: 'Insurance',
			investment: 'Investment',
			travel: 'Travel',
			subscription: 'Subscriptions',
			charity: 'Charity',
			business: 'Business',
			personal: 'Personal',
			other: 'Other',
		};
		return tagNames[tag] || tag;
	}

	// Helper method to get payment tag icon
	static getPaymentTagIcon(tag: PaymentTag): string {
		const tagIcons: Record<PaymentTag, string> = {
			savings: 'save',
			entertainment: 'game-controller',
			food: 'restaurant',
			rent: 'home',
			transportation: 'car',
			healthcare: 'medical',
			education: 'school',
			shopping: 'bag',
			utilities: 'flash',
			insurance: 'shield-checkmark',
			investment: 'trending-up',
			travel: 'airplane',
			subscription: 'repeat',
			charity: 'heart',
			business: 'briefcase',
			personal: 'person',
			other: 'ellipsis-horizontal',
		};
		return tagIcons[tag] || 'ellipsis-horizontal';
	}

	// Helper method to get payment tag color
	static getPaymentTagColor(tag: PaymentTag): string {
		const tagColors: Record<PaymentTag, string> = {
			savings: '#10B981', // green
			entertainment: '#8B5CF6', // purple
			food: '#F59E0B', // amber
			rent: '#3B82F6', // blue
			transportation: '#EF4444', // red
			healthcare: '#EC4899', // pink
			education: '#06B6D4', // cyan
			shopping: '#F97316', // orange
			utilities: '#84CC16', // lime
			insurance: '#6366F1', // indigo
			investment: '#059669', // emerald
			travel: '#7C3AED', // violet
			subscription: '#DC2626', // red-600
			charity: '#DB2777', // pink-600
			business: '#1F2937', // gray-800
			personal: '#6B7280', // gray-500
			other: '#9CA3AF', // gray-400
		};
		return tagColors[tag] || '#9CA3AF';
	}

	// Get all available payment tags
	static getAllPaymentTags(): PaymentTag[] {
		return [
			'savings',
			'entertainment',
			'food',
			'rent',
			'transportation',
			'healthcare',
			'education',
			'shopping',
			'utilities',
			'insurance',
			'investment',
			'travel',
			'subscription',
			'charity',
			'business',
			'personal',
			'other',
		];
	}
}
