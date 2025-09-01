import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	RefreshControl,
	Alert,
	Modal,
	Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import {
	PaymentRequest,
	PaymentRequestService,
} from '@/services/paymentRequestService';
import { useUserProfileStore } from '@/stores/userProfileStore';

interface PaymentRequestsListProps {
	onRequestPress?: (request: PaymentRequest) => void;
}

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
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: '#111827',
	},
	filterButtons: {
		flexDirection: 'row',
		paddingHorizontal: 24,
		paddingVertical: 16,
		gap: 12,
	},
	filterButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: '#f3f4f6',
	},
	filterButtonActive: {
		backgroundColor: '#3b82f6',
	},
	filterButtonText: {
		fontSize: 14,
		fontWeight: '600',
		color: '#6b7280',
	},
	filterButtonTextActive: {
		color: '#ffffff',
	},
	requestItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#f9fafb',
	},
	requestAvatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: '#3b82f6',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 16,
	},
	requestAvatarText: {
		color: '#ffffff',
		fontSize: 18,
		fontWeight: '600',
	},
	requestInfo: {
		flex: 1,
		marginRight: 12,
	},
	requestCustomer: {
		fontSize: 16,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 2,
	},
	requestDescription: {
		fontSize: 14,
		color: '#6b7280',
		marginBottom: 4,
	},
	requestDate: {
		fontSize: 12,
		color: '#9ca3af',
	},
	requestAmount: {
		fontSize: 18,
		fontWeight: '700',
		color: '#111827',
		textAlign: 'right',
		marginBottom: 4,
	},
	requestStatus: {
		alignItems: 'center',
	},
	statusBadge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
		minWidth: 70,
		alignItems: 'center',
	},
	statusBadgePending: {
		backgroundColor: '#fef3c7',
	},
	statusBadgePaid: {
		backgroundColor: '#dcfce7',
	},
	statusBadgeOverdue: {
		backgroundColor: '#fee2e2',
	},
	statusBadgeCancelled: {
		backgroundColor: '#f3f4f6',
	},
	statusText: {
		fontSize: 12,
		fontWeight: '600',
	},
	statusTextPending: {
		color: '#d97706',
	},
	statusTextPaid: {
		color: '#16a34a',
	},
	statusTextOverdue: {
		color: '#dc2626',
	},
	statusTextCancelled: {
		color: '#6b7280',
	},
	emptyState: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 40,
		paddingVertical: 60,
	},
	emptyStateIcon: {
		marginBottom: 16,
	},
	emptyStateTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#374151',
		marginBottom: 8,
		textAlign: 'center',
	},
	emptyStateMessage: {
		fontSize: 14,
		color: '#6b7280',
		textAlign: 'center',
		lineHeight: 20,
	},
	qrModal: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	qrModalContent: {
		backgroundColor: '#ffffff',
		borderRadius: 20,
		padding: 24,
		width: '90%',
		maxWidth: 400,
		alignItems: 'center',
	},
	qrModalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%',
		marginBottom: 24,
	},
	qrModalTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: '#111827',
	},
	qrCodeContainer: {
		padding: 20,
		backgroundColor: '#ffffff',
		borderRadius: 16,
		marginBottom: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	qrRequestInfo: {
		alignItems: 'center',
		marginBottom: 20,
	},
	qrAmount: {
		fontSize: 28,
		fontWeight: '800',
		color: '#111827',
		marginBottom: 8,
	},
	qrDescription: {
		fontSize: 16,
		color: '#6b7280',
		textAlign: 'center',
		marginBottom: 4,
	},
	qrCustomer: {
		fontSize: 14,
		color: '#9ca3af',
		textAlign: 'center',
	},
	qrButtons: {
		flexDirection: 'row',
		gap: 12,
		width: '100%',
	},
	qrButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 12,
		borderRadius: 12,
		gap: 6,
	},
	qrButtonPrimary: {
		backgroundColor: '#16a34a',
	},
	qrButtonSecondary: {
		backgroundColor: '#f3f4f6',
		borderWidth: 1,
		borderColor: '#d1d5db',
	},
	qrButtonText: {
		fontSize: 14,
		fontWeight: '600',
	},
	qrButtonTextPrimary: {
		color: '#ffffff',
	},
	qrButtonTextSecondary: {
		color: '#374151',
	},
	statsContainer: {
		flexDirection: 'row',
		paddingHorizontal: 24,
		paddingVertical: 16,
		backgroundColor: '#f9fafb',
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
	},
	statItem: {
		flex: 1,
		alignItems: 'center',
	},
	statValue: {
		fontSize: 20,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 4,
	},
	statLabel: {
		fontSize: 12,
		color: '#6b7280',
		textAlign: 'center',
	},
});

type FilterType = 'all' | 'pending' | 'paid' | 'overdue' | 'cancelled';

export const PaymentRequestsList: React.FC<PaymentRequestsListProps> = ({
	onRequestPress,
}) => {
	const { currentProfile } = useUserProfileStore();
	const [requests, setRequests] = useState<PaymentRequest[]>([]);
	const [filteredRequests, setFilteredRequests] = useState<PaymentRequest[]>(
		[]
	);
	const [filter, setFilter] = useState<FilterType>('all');
	const [isLoading, setIsLoading] = useState(false);
	const [showQRModal, setShowQRModal] = useState(false);
	const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(
		null
	);
	const [stats, setStats] = useState({
		pending: 0,
		paid: 0,
		overdue: 0,
		totalAmount: 0,
		pendingAmount: 0,
	});

	const paymentRequestService = PaymentRequestService.getInstance();

	useEffect(() => {
		loadPaymentRequests();
		loadStats();
	}, [currentProfile?.id]);

	useEffect(() => {
		applyFilter();
	}, [requests, filter]);

	const loadPaymentRequests = async () => {
		if (!currentProfile?.id) return;

		setIsLoading(true);
		try {
			const businessRequests =
				await paymentRequestService.getBusinessPaymentRequests(
					currentProfile.id
				);
			setRequests(businessRequests);
		} catch (error) {
			console.error('Error loading payment requests:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const loadStats = async () => {
		if (!currentProfile?.id) return;

		try {
			const requestStats = await paymentRequestService.getPaymentRequestStats(
				currentProfile.id
			);
			setStats(requestStats);
		} catch (error) {
			console.error('Error loading payment request stats:', error);
		}
	};

	const applyFilter = () => {
		if (filter === 'all') {
			setFilteredRequests(requests);
		} else {
			setFilteredRequests(requests.filter((req) => req.status === filter));
		}
	};

	const handleRequestPress = (request: PaymentRequest) => {
		onRequestPress?.(request);

		const actions = [
			{ text: 'View QR Code', onPress: () => showQRCode(request) },
			{ text: 'Share Request', onPress: () => shareRequest(request) },
		];

		if (request.status === 'pending') {
			actions.push({
				text: 'Cancel Request',
				onPress: () => handleCancelRequest(request.id),
			});
		}

		actions.push({ text: 'Close', onPress: () => {} });

		// Show action sheet with options
		Alert.alert(
			'Payment Request Actions',
			`Request to ${request.customer_profile?.full_name} for $${request.amount}`,
			actions
		);
	};

	const showQRCode = (request: PaymentRequest) => {
		setSelectedRequest(request);
		setShowQRModal(true);
	};

	const shareRequest = async (request: PaymentRequest) => {
		const businessName =
			currentProfile?.business_name ||
			currentProfile?.display_name ||
			'Business';
		const shareMessage = `💳 Payment Request from ${businessName}\n\nAmount: $${request.amount}\nDescription: ${request.description}\n\nScan the QR code or use the payment app to pay securely.`;

		try {
			await Share.share({
				message: shareMessage,
				title: 'Payment Request',
			});
		} catch (error) {
			console.error('Error sharing request:', error);
		}
	};

	const handleCancelRequest = async (requestId: string) => {
		Alert.alert(
			'Cancel Payment Request',
			'Are you sure you want to cancel this payment request?',
			[
				{ text: 'No', style: 'cancel' },
				{
					text: 'Yes, Cancel',
					style: 'destructive',
					onPress: async () => {
						const success =
							await paymentRequestService.cancelPaymentRequest(requestId);
						if (success) {
							loadPaymentRequests();
							loadStats();
						} else {
							Alert.alert('Error', 'Failed to cancel payment request');
						}
					},
				},
			]
		);
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year:
				date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
		});
	};

	const getStatusBadgeStyle = (status: PaymentRequest['status']) => {
		switch (status) {
			case 'pending':
				return [styles.statusBadge, styles.statusBadgePending];
			case 'paid':
				return [styles.statusBadge, styles.statusBadgePaid];
			case 'overdue':
				return [styles.statusBadge, styles.statusBadgeOverdue];
			case 'cancelled':
				return [styles.statusBadge, styles.statusBadgeCancelled];
			default:
				return [styles.statusBadge, styles.statusBadgePending];
		}
	};

	const getStatusTextStyle = (status: PaymentRequest['status']) => {
		switch (status) {
			case 'pending':
				return [styles.statusText, styles.statusTextPending];
			case 'paid':
				return [styles.statusText, styles.statusTextPaid];
			case 'overdue':
				return [styles.statusText, styles.statusTextOverdue];
			case 'cancelled':
				return [styles.statusText, styles.statusTextCancelled];
			default:
				return [styles.statusText, styles.statusTextPending];
		}
	};

	const renderRequestItem = ({ item }: { item: PaymentRequest }) => (
		<TouchableOpacity
			style={styles.requestItem}
			onPress={() => handleRequestPress(item)}
		>
			<View style={styles.requestAvatar}>
				<Text style={styles.requestAvatarText}>
					{(item.customer_profile?.full_name || 'C').charAt(0).toUpperCase()}
				</Text>
			</View>

			<View style={styles.requestInfo}>
				<Text style={styles.requestCustomer}>
					{item.customer_profile?.full_name || 'Unknown Customer'}
				</Text>
				<Text style={styles.requestDescription} numberOfLines={1}>
					{item.description}
				</Text>
				<Text style={styles.requestDate}>
					{formatDate(item.created_at)}
					{item.due_date && ` • Due ${formatDate(item.due_date)}`}
				</Text>
			</View>

			<View style={styles.requestStatus}>
				<Text style={styles.requestAmount}>${item.amount}</Text>
				<View style={getStatusBadgeStyle(item.status)}>
					<Text style={getStatusTextStyle(item.status)}>
						{item.status.charAt(0).toUpperCase() + item.status.slice(1)}
					</Text>
				</View>
			</View>
		</TouchableOpacity>
	);

	const renderEmptyState = () => (
		<View style={styles.emptyState}>
			<Ionicons
				name='receipt-outline'
				size={64}
				color='#d1d5db'
				style={styles.emptyStateIcon}
			/>
			<Text style={styles.emptyStateTitle}>
				{filter === 'all' ? 'No Payment Requests' : `No ${filter} requests`}
			</Text>
			<Text style={styles.emptyStateMessage}>
				{filter === 'all'
					? 'Payment requests you send to customers will appear here.'
					: `You don't have any ${filter} payment requests at the moment.`}
			</Text>
		</View>
	);

	const filters: { key: FilterType; label: string; count: number }[] = [
		{ key: 'all', label: 'All', count: requests.length },
		{ key: 'pending', label: 'Pending', count: stats.pending },
		{ key: 'paid', label: 'Paid', count: stats.paid },
		{ key: 'overdue', label: 'Overdue', count: stats.overdue },
	];

	return (
		<View style={styles.container}>
			{/* Stats */}
			{requests.length > 0 && (
				<View style={styles.statsContainer}>
					<View style={styles.statItem}>
						<Text style={styles.statValue}>{stats.pending}</Text>
						<Text style={styles.statLabel}>Pending</Text>
					</View>
					<View style={styles.statItem}>
						<Text style={[styles.statValue, { color: '#16a34a' }]}>
							{stats.paid}
						</Text>
						<Text style={styles.statLabel}>Paid</Text>
					</View>
					<View style={styles.statItem}>
						<Text style={[styles.statValue, { color: '#dc2626' }]}>
							{stats.overdue}
						</Text>
						<Text style={styles.statLabel}>Overdue</Text>
					</View>
					<View style={styles.statItem}>
						<Text style={[styles.statValue, { color: '#3b82f6' }]}>
							${stats.pendingAmount}
						</Text>
						<Text style={styles.statLabel}>Outstanding</Text>
					</View>
				</View>
			)}

			{/* Filter Buttons */}
			<View style={styles.filterButtons}>
				{filters.map((filterOption) => (
					<TouchableOpacity
						key={filterOption.key}
						style={[
							styles.filterButton,
							filter === filterOption.key && styles.filterButtonActive,
						]}
						onPress={() => setFilter(filterOption.key)}
					>
						<Text
							style={[
								styles.filterButtonText,
								filter === filterOption.key && styles.filterButtonTextActive,
							]}
						>
							{filterOption.label} ({filterOption.count})
						</Text>
					</TouchableOpacity>
				))}
			</View>

			{/* Payment Requests List */}
			<FlatList
				data={filteredRequests}
				keyExtractor={(item) => item.id}
				renderItem={renderRequestItem}
				ListEmptyComponent={renderEmptyState}
				refreshControl={
					<RefreshControl
						refreshing={isLoading}
						onRefresh={() => {
							loadPaymentRequests();
							loadStats();
						}}
					/>
				}
				showsVerticalScrollIndicator={false}
			/>

			{/* QR Code Modal */}
			<Modal visible={showQRModal} transparent animationType='fade'>
				<View style={styles.qrModal}>
					<View style={styles.qrModalContent}>
						<View style={styles.qrModalHeader}>
							<Text style={styles.qrModalTitle}>Payment Request QR</Text>
							<TouchableOpacity onPress={() => setShowQRModal(false)}>
								<Ionicons name='close' size={24} color='#6b7280' />
							</TouchableOpacity>
						</View>

						{selectedRequest && (
							<>
								<View style={styles.qrRequestInfo}>
									<Text style={styles.qrAmount}>${selectedRequest.amount}</Text>
									<Text style={styles.qrDescription}>
										{selectedRequest.description}
									</Text>
									<Text style={styles.qrCustomer}>
										For:{' '}
										{selectedRequest.customer_profile?.full_name || 'Customer'}
									</Text>
								</View>

								<View style={styles.qrCodeContainer}>
									<QRCode
										value={JSON.stringify({
											type: 'payment_request',
											amount: selectedRequest.amount,
											currency: selectedRequest.currency,
											description: selectedRequest.description,
											recipient: currentProfile?.wallet_address || '',
											recipientName:
												currentProfile?.business_name ||
												currentProfile?.display_name ||
												'Business',
											businessId: selectedRequest.business_id,
											requestId: selectedRequest.id,
											timestamp: Date.now(),
										})}
										size={200}
										backgroundColor='#ffffff'
										color='#000000'
									/>
								</View>

								<View style={styles.qrButtons}>
									<TouchableOpacity
										style={[styles.qrButton, styles.qrButtonSecondary]}
										onPress={() => shareRequest(selectedRequest)}
									>
										<Ionicons name='share' size={16} color='#374151' />
										<Text
											style={[
												styles.qrButtonText,
												styles.qrButtonTextSecondary,
											]}
										>
											Share
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[styles.qrButton, styles.qrButtonPrimary]}
										onPress={() => setShowQRModal(false)}
									>
										<Ionicons name='checkmark' size={16} color='#ffffff' />
										<Text
											style={[styles.qrButtonText, styles.qrButtonTextPrimary]}
										>
											Done
										</Text>
									</TouchableOpacity>
								</View>
							</>
						)}
					</View>
				</View>
			</Modal>
		</View>
	);
};
