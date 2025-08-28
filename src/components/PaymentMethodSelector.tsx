import React, { useState } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	Modal,
	TextInput,
	Alert,
	ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PaymentMethod, PaymentService } from '@/services/paymentService';

interface PaymentMethodData {
	upiId?: string;
	cardLast4?: string;
	cryptoAddress?: string;
}

interface PaymentMethodSelectorProps {
	visible: boolean;
	onClose: () => void;
	onPaymentComplete: (method: PaymentMethod, data: PaymentMethodData) => void;
	amount: number;
	recipientName: string;
	note?: string;
}

const paymentMethods: { method: PaymentMethod; name: string; icon: string; description: string }[] = [
	{
		method: 'superpay',
		name: 'SuperPay',
		icon: 'wallet',
		description: 'Pay with SuperPay balance',
	},
	{
		method: 'upi',
		name: 'UPI',
		icon: 'phone-portrait',
		description: 'Pay using UPI ID',
	},
	{
		method: 'card',
		name: 'Card',
		icon: 'card',
		description: 'Pay with debit/credit card',
	},
	{
		method: 'cash',
		name: 'Cash',
		icon: 'cash',
		description: 'Record cash payment',
	},
	{
		method: 'crypto',
		name: 'Crypto',
		icon: 'logo-bitcoin',
		description: 'Pay with cryptocurrency',
	},
];

export default function PaymentMethodSelector({
	visible,
	onClose,
	onPaymentComplete,
	amount,
	recipientName,
	note,
}: PaymentMethodSelectorProps) {
	const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
	const [paymentData, setPaymentData] = useState<PaymentMethodData>({});
	const [isProcessing, setIsProcessing] = useState(false);

	const handleMethodSelect = (method: PaymentMethod) => {
		setSelectedMethod(method);
		setPaymentData({});
	};

	const handleBack = () => {
		setSelectedMethod(null);
		setPaymentData({});
	};

	const handlePayment = async () => {
		if (!selectedMethod) return;

		// Validate method-specific data
		if (selectedMethod === 'upi' && !paymentData.upiId) {
			Alert.alert('Error', 'Please enter UPI ID');
			return;
		}
		if (selectedMethod === 'card' && !paymentData.cardLast4) {
			Alert.alert('Error', 'Please enter card details');
			return;
		}
		if (selectedMethod === 'crypto' && !paymentData.cryptoAddress) {
			Alert.alert('Error', 'Please enter crypto wallet address');
			return;
		}

		setIsProcessing(true);
		try {
			await onPaymentComplete(selectedMethod, paymentData);
			Alert.alert('Success', `Payment processed successfully via ${PaymentService.getPaymentMethodDisplayName(selectedMethod)}`);
			onClose();
		} catch (error) {
			console.error('Payment error:', error);
			Alert.alert('Error', 'Payment failed. Please try again.');
		} finally {
			setIsProcessing(false);
		}
	};

	const renderMethodInput = () => {
		switch (selectedMethod) {
			case 'upi':
				return (
					<View className='mb-4'>
						<Text className='mb-2 text-sm font-medium text-gray-700'>UPI ID</Text>
						<TextInput
							placeholder='yourname@upi'
							value={paymentData.upiId}
							onChangeText={(text) => setPaymentData({ ...paymentData, upiId: text })}
							className='px-3 py-2 text-base border border-gray-300 rounded-lg'
							placeholderTextColor='#9CA3AF'
							autoCapitalize='none'
						/>
					</View>
				);
			case 'card':
				return (
					<View className='mb-4'>
						<Text className='mb-2 text-sm font-medium text-gray-700'>Card Details</Text>
						<TextInput
							placeholder='Last 4 digits of card'
							value={paymentData.cardLast4}
							onChangeText={(text) => setPaymentData({ ...paymentData, cardLast4: text })}
							className='px-3 py-2 text-base border border-gray-300 rounded-lg'
							placeholderTextColor='#9CA3AF'
							keyboardType='numeric'
							maxLength={4}
						/>
					</View>
				);
			case 'crypto':
				return (
					<View className='mb-4'>
						<Text className='mb-2 text-sm font-medium text-gray-700'>Crypto Wallet Address</Text>
						<TextInput
							placeholder='Wallet address'
							value={paymentData.cryptoAddress}
							onChangeText={(text) => setPaymentData({ ...paymentData, cryptoAddress: text })}
							className='px-3 py-2 text-base border border-gray-300 rounded-lg'
							placeholderTextColor='#9CA3AF'
							autoCapitalize='none'
							multiline
						/>
					</View>
				);
			default:
				return null;
		}
	};

	return (
		<Modal
			visible={visible}
			animationType='slide'
			presentationStyle='pageSheet'
			onRequestClose={onClose}
		>
			<View className='flex-1 p-6 bg-white'>
				{/* Header */}
				<View className='flex-row items-center justify-between mb-6'>
					{selectedMethod ? (
						<View className='flex-row items-center'>
							<TouchableOpacity onPress={handleBack} className='mr-3'>
								<Ionicons name='arrow-back' size={24} color='#3D5AFE' />
							</TouchableOpacity>
							<Text className='text-xl font-bold'>
								{PaymentService.getPaymentMethodDisplayName(selectedMethod)}
							</Text>
						</View>
					) : (
						<Text className='text-xl font-bold'>Choose Payment Method</Text>
					)}
					<TouchableOpacity onPress={onClose}>
						<Ionicons name='close' size={24} color='#666' />
					</TouchableOpacity>
				</View>

				{/* Payment Summary */}
				<View className='p-4 mb-6 bg-gray-50 rounded-lg'>
					<Text className='text-sm text-gray-600'>Paying</Text>
					<Text className='text-2xl font-bold text-green-600'>${amount.toFixed(2)}</Text>
					<Text className='text-sm text-gray-600'>to {recipientName}</Text>
					{note && <Text className='mt-1 text-sm text-gray-500'>Note: {note}</Text>}
				</View>

				{!selectedMethod ? (
					/* Method Selection */
					<View>
						<Text className='mb-4 text-base font-semibold text-gray-700'>Select Payment Method</Text>
						{paymentMethods.map((method) => (
							<TouchableOpacity
								key={method.method}
								className='flex-row items-center p-4 mb-3 border border-gray-200 rounded-lg bg-white'
								onPress={() => handleMethodSelect(method.method)}
							>
								<View className='items-center justify-center w-12 h-12 mr-4 bg-gray-100 rounded-full'>
									<Ionicons name={method.icon as any} size={24} color='#3D5AFE' />
								</View>
								<View className='flex-1'>
									<Text className='text-base font-semibold text-gray-900'>{method.name}</Text>
									<Text className='text-sm text-gray-500'>{method.description}</Text>
								</View>
								<Ionicons name='chevron-forward' size={20} color='#9CA3AF' />
							</TouchableOpacity>
						))}
					</View>
				) : (
					/* Method Details */
					<View>
						{renderMethodInput()}

						<TouchableOpacity
							className={`p-4 rounded-lg ${
								isProcessing ? 'bg-gray-400' : 'bg-green-600'
							}`}
							onPress={handlePayment}
							disabled={isProcessing}
						>
							{isProcessing ? (
								<View className='flex-row items-center justify-center'>
									<ActivityIndicator size="small" color="white" />
									<Text className='ml-2 font-semibold text-white'>Processing...</Text>
								</View>
							) : (
								<View className='flex-row items-center justify-center'>
									<Ionicons name='card' size={20} color='white' />
									<Text className='ml-2 font-semibold text-white'>
										Pay ${amount.toFixed(2)}
									</Text>
								</View>
							)}
						</TouchableOpacity>
					</View>
				)}
			</View>
		</Modal>
	);
}