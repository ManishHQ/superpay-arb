import React, { useState } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	Modal,
	Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

interface PaymentMethod {
	id: string;
	type: 'card' | 'bank' | 'wallet';
	name: string;
	details: string;
	isDefault: boolean;
	icon: string;
}

interface PaymentMethodSelectorProps {
	visible: boolean;
	onClose: () => void;
	onMethodSelect: (method: PaymentMethod) => void;
	selectedMethodId?: string;
}

// Mock payment methods
const mockPaymentMethods: PaymentMethod[] = [
	{
		id: '1',
		type: 'wallet',
		name: 'USDC Wallet',
		details: '1,234.56 USDC',
		isDefault: true,
		icon: 'wallet',
	},
	{
		id: '2',
		type: 'card',
		name: 'Visa ****1234',
		details: 'Expires 12/26',
		isDefault: false,
		icon: 'card',
	},
	{
		id: '3',
		type: 'bank',
		name: 'Chase Bank',
		details: 'Checking ****5678',
		isDefault: false,
		icon: 'business',
	},
	{
		id: '4',
		type: 'card',
		name: 'Mastercard ****9012',
		details: 'Expires 03/27',
		isDefault: false,
		icon: 'card',
	},
];

export default function PaymentMethodSelector({
	visible,
	onClose,
	onMethodSelect,
	selectedMethodId,
}: PaymentMethodSelectorProps) {
	const [selectedMethod, setSelectedMethod] = useState<string>(
		selectedMethodId || mockPaymentMethods.find((m) => m.isDefault)?.id || ''
	);

	const handleMethodSelect = (method: PaymentMethod) => {
		setSelectedMethod(method.id);
	};

	const handleConfirm = () => {
		const method = mockPaymentMethods.find((m) => m.id === selectedMethod);
		if (method) {
			onMethodSelect(method);
			onClose();
		} else {
			Alert.alert('Error', 'Please select a payment method');
		}
	};

	const handleAddNewMethod = () => {
		Alert.alert(
			'Add Payment Method',
			'This would open the add payment method flow'
		);
	};

	const getMethodIcon = (type: string) => {
		switch (type) {
			case 'card':
				return 'card';
			case 'bank':
				return 'business';
			case 'wallet':
				return 'wallet';
			default:
				return 'card';
		}
	};

	const getMethodColor = (type: string) => {
		switch (type) {
			case 'card':
				return '#3B82F6';
			case 'bank':
				return '#10B981';
			case 'wallet':
				return '#8B5CF6';
			default:
				return '#6B7280';
		}
	};

	return (
		<Modal
			visible={visible}
			animationType='slide'
			presentationStyle='pageSheet'
			onRequestClose={onClose}
		>
			<SafeAreaView className='flex-1 bg-white'>
				{/* Header */}
				<View className='flex-row items-center justify-between p-6 border-b border-gray-200'>
					<Text className='text-xl font-bold text-gray-900'>
						Payment Method
					</Text>
					<TouchableOpacity onPress={onClose} className='p-2'>
						<Ionicons name='close' size={24} color='#666' />
					</TouchableOpacity>
				</View>

				<ScrollView className='flex-1 p-6'>
					{/* Payment Methods List */}
					<View className='mb-6'>
						<Text className='mb-4 text-lg font-semibold text-gray-900'>
							Select Payment Method
						</Text>

						{mockPaymentMethods.map((method) => (
							<TouchableOpacity
								key={method.id}
								onPress={() => handleMethodSelect(method)}
								className={`flex-row items-center p-4 mb-3 border-2 rounded-xl ${
									selectedMethod === method.id
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-200 bg-white'
								}`}
							>
								<View
									className='items-center justify-center w-12 h-12 mr-4 rounded-full'
									style={{
										backgroundColor: `${getMethodColor(method.type)}20`,
									}}
								>
									<Ionicons
										name={getMethodIcon(method.type) as any}
										size={24}
										color={getMethodColor(method.type)}
									/>
								</View>

								<View className='flex-1'>
									<View className='flex-row items-center'>
										<Text className='text-base font-semibold text-gray-900'>
											{method.name}
										</Text>
										{method.isDefault && (
											<View className='px-2 py-1 ml-2 bg-green-100 rounded-full'>
												<Text className='text-xs font-medium text-green-600'>
													Default
												</Text>
											</View>
										)}
									</View>
									<Text className='text-sm text-gray-500'>
										{method.details}
									</Text>
								</View>

								{selectedMethod === method.id && (
									<Ionicons name='checkmark-circle' size={24} color='#3B82F6' />
								)}
							</TouchableOpacity>
						))}
					</View>

					{/* Add New Method */}
					<TouchableOpacity
						onPress={handleAddNewMethod}
						className='flex-row items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl'
					>
						<Ionicons name='add-circle-outline' size={24} color='#6B7280' />
						<Text className='ml-2 text-base font-medium text-gray-600'>
							Add New Payment Method
						</Text>
					</TouchableOpacity>

					{/* Method Details */}
					{selectedMethod && (
						<View className='p-4 mt-6 rounded-xl bg-gray-50'>
							<Text className='mb-2 text-sm font-medium text-gray-600'>
								Selected Method:
							</Text>
							{(() => {
								const method = mockPaymentMethods.find(
									(m) => m.id === selectedMethod
								);
								return method ? (
									<View>
										<Text className='text-base font-semibold text-gray-900'>
											{method.name}
										</Text>
										<Text className='text-sm text-gray-500'>
											{method.details}
										</Text>
										{method.type === 'wallet' && (
											<Text className='mt-1 text-xs text-green-600'>
												✓ Instant transfer
											</Text>
										)}
										{method.type === 'card' && (
											<Text className='mt-1 text-xs text-blue-600'>
												• Processing fee may apply
											</Text>
										)}
										{method.type === 'bank' && (
											<Text className='mt-1 text-xs text-gray-600'>
												• 1-3 business days
											</Text>
										)}
									</View>
								) : null;
							})()}
						</View>
					)}
				</ScrollView>

				{/* Confirm Button */}
				<View className='p-6 border-t border-gray-200'>
					<TouchableOpacity
						onPress={handleConfirm}
						className={`p-4 rounded-xl ${
							selectedMethod ? 'bg-blue-600' : 'bg-gray-300'
						}`}
						disabled={!selectedMethod}
					>
						<Text className='text-lg font-semibold text-center text-white'>
							Confirm Payment Method
						</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		</Modal>
	);
}
