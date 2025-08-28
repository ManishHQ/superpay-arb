import { MOCKUSDC_CONFIG } from '../constants/mUSDC';
import { Share } from 'react-native';

export interface PaymentRequestData {
	type: 'MOCKUSDC_PAYMENT';
	to: string;
	amount: string;
	token: string;
	contract: string;
	decimals: number;
	description: string;
	timestamp: number;
	chainId: number;
}

export class QRService {
	/** Generate payment request QR data */
	static generatePaymentRequest(
		recipientAddress: string,
		amount: string,
		description?: string
	): string {
		const paymentData: PaymentRequestData = {
			type: 'MOCKUSDC_PAYMENT',
			to: recipientAddress,
			amount: amount,
			token: MOCKUSDC_CONFIG.symbol,
			contract: MOCKUSDC_CONFIG.address,
			decimals: MOCKUSDC_CONFIG.decimals,
			description: description || 'MockUSDC Payment Request',
			timestamp: Date.now(),
			chainId: 1328, // Sei EVM Testnet
		};

		return JSON.stringify(paymentData);
	}

	/** Parse QR code data */
	static parsePaymentRequest(qrData: string): PaymentRequestData | null {
		try {
			const paymentData = JSON.parse(qrData);

			// Validate that it's a valid payment request
			if (paymentData.type === 'MOCKUSDC_PAYMENT') {
				return paymentData as PaymentRequestData;
			}

			return null;
		} catch (error) {
			console.error('Error parsing QR data:', error);
			return null;
		}
	}

	/** Validate payment request data */
	static validatePaymentRequest(paymentData: PaymentRequestData): {
		isValid: boolean;
		error?: string;
	} {
		// Check required fields
		if (!paymentData.to || !paymentData.amount) {
			return { isValid: false, error: 'Missing required payment data' };
		}

		// Validate amount - allow zero for general payment QR codes
		if (parseFloat(paymentData.amount) < 0) {
			return { isValid: false, error: 'Invalid payment amount' };
		}

		// Check if it's the correct token type
		if (paymentData.token !== MOCKUSDC_CONFIG.symbol) {
			return { isValid: false, error: 'Unsupported token type' };
		}

		// Check contract address
		if (paymentData.contract !== MOCKUSDC_CONFIG.address) {
			return { isValid: false, error: 'Invalid contract address' };
		}

		return { isValid: true };
	}

	/** Share payment request */
	static async sharePaymentRequest(
		amount: string,
		recipientAddress: string,
		description?: string
	): Promise<boolean> {
		try {
			const message = `💰 Payment Request\n\nAmount: ${amount} ${
				MOCKUSDC_CONFIG.symbol
			}\nTo: ${recipientAddress}\nDescription: ${
				description || 'MockUSDC Payment'
			}\n\nScan QR code to pay with SuperPay!`;

			const result = await Share.share({
				message: message,
				title: 'MockUSDC Payment Request',
			});

			return result.action === Share.sharedAction;
		} catch (error) {
			console.error('Error sharing payment request:', error);
			return false;
		}
	}

	/** Format address for display */
	static formatAddress(address: string): string {
		if (!address || address.length < 10) return address;
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}
}
