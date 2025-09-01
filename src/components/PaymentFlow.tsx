import React, { useState } from 'react';
import { Alert } from 'react-native';
import SendModal from '@/components/SendModal';
import { QRScannerModal } from '@/components/QRScannerModal';

interface PaymentFlowProps {
	showSendModal: boolean;
	showQRScanner: boolean;
	onCloseSend: () => void;
	onCloseQRScanner: () => void;
	onSend: (
		amount: number,
		recipients: string[],
		note: string,
		currency: 'USDC' | 'ETH',
		category?: string,
		potId?: string
	) => void;
	onOpenQRScanner?: () => void;
}

interface PaymentRequestData {
	type: string;
	amount: number;
	currency: string;
	description: string;
	recipient: string;
	recipientName: string;
	timestamp: number;
	requestId: string;
}

export const PaymentFlow: React.FC<PaymentFlowProps> = ({
	showSendModal,
	showQRScanner,
	onCloseSend,
	onCloseQRScanner,
	onSend,
}) => {
	const [prefillData, setPrefillData] = useState<
		| {
				amount?: string;
				recipient?: string;
				note?: string;
				recipientName?: string;
		  }
		| undefined
	>(undefined);

	const handleQRScan = (qrData: string) => {
		try {
			// Try to parse as payment request JSON
			const paymentData: PaymentRequestData = JSON.parse(qrData);

			if (paymentData.type === 'payment_request') {
				// Validate required fields
				if (
					!paymentData.amount ||
					!paymentData.recipient ||
					!paymentData.recipientName
				) {
					Alert.alert(
						'Invalid QR Code',
						'This QR code does not contain valid payment request information.'
					);
					return;
				}

				// Set prefill data for the send modal
				setPrefillData({
					amount: paymentData.amount.toString(),
					recipient: paymentData.recipient,
					note: paymentData.description || '',
					recipientName: paymentData.recipientName,
				});

				// Close QR scanner and automatically show success message
				onCloseQRScanner();

				// Show success message - the QRScannerModal already showed the preview
				// Just confirm the data is ready
				setTimeout(() => {
					Alert.alert(
						'Payment Details Loaded',
						`Ready to send $${paymentData.amount} to ${paymentData.recipientName}`,
						[
							{
								text: 'Review Payment',
								onPress: () => {
									// Trigger opening send modal - you can call a prop function here
								},
							},
						]
					);
				}, 500);
			} else {
				Alert.alert(
					'Invalid QR Code',
					'This QR code is not a valid payment request.'
				);
			}
		} catch (error) {
			// Not a valid JSON, could be a wallet address or other data
			Alert.alert(
				'Invalid QR Code',
				'This QR code does not contain valid payment request information.'
			);
		}
	};

	const handleSendComplete = (
		amount: number,
		recipients: string[],
		note: string,
		currency: 'USDC' | 'ETH',
		category?: string,
		potId?: string
	) => {
		// Clear prefill data after successful send
		setPrefillData(undefined);
		onSend(amount, recipients, note, currency, category, potId);
	};

	const handleCloseSend = () => {
		// Clear prefill data when manually closing
		setPrefillData(undefined);
		onCloseSend();
	};

	return (
		<>
			<SendModal
				visible={showSendModal}
				onClose={handleCloseSend}
				onSend={handleSendComplete}
				prefillData={prefillData}
			/>
			<QRScannerModal
				visible={showQRScanner}
				onClose={onCloseQRScanner}
				onScan={handleQRScan}
			/>
		</>
	);
};
