import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PaymentRequestsList } from '@/components/PaymentRequestsList';
import { PaymentRequestModal } from '@/components/PaymentRequestModal';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#ffffff',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#f3f4f6',
		backgroundColor: '#ffffff',
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: '700',
		color: '#111827',
	},
	createButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#3b82f6',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 12,
		gap: 6,
	},
	createButtonText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '600',
	},
});

export default function PaymentRequestsPage() {
	const [showCreateModal, setShowCreateModal] = useState(false);

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Payment Requests</Text>
				<TouchableOpacity 
					style={styles.createButton}
					onPress={() => setShowCreateModal(true)}
				>
					<Ionicons name="add" size={18} color="#ffffff" />
					<Text style={styles.createButtonText}>New Request</Text>
				</TouchableOpacity>
			</View>
			
			<PaymentRequestsList />
			
			<PaymentRequestModal
				visible={showCreateModal}
				onClose={() => setShowCreateModal(false)}
				onRequestSent={(requestData) => {
					console.log('Payment request sent:', requestData);
					setShowCreateModal(false);
				}}
			/>
		</SafeAreaView>
	);
}