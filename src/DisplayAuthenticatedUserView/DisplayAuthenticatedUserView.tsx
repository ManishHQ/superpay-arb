import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { FC, useState } from 'react';
import {
	Button,
	StyleSheet,
	Text,
	View,
	ScrollView,
	TouchableOpacity,
} from 'react-native';
import { client } from '../lib/client';
import { Wallet } from '@dynamic-labs/client';
import { WalletDashboard } from '../WalletDashboard';

export const DisplayAuthenticatedUserView: FC = () => {
	const { auth, wallets } = useReactiveClient(client);
	const [activeTab, setActiveTab] = useState<'wallet' | 'profile'>('wallet');

	const handleSignEVMMessage = async (wallet: Wallet) => {
		try {
			const walletClient = await client.viem.createWalletClient({
				wallet,
			});
			await walletClient.signMessage({ message: 'Hello from Dynamic Wallet!' });
			console.log('Message signed successfully');
		} catch (error) {
			console.error('Failed to sign message:', error);
		}
	};

	// Get the first EVM wallet for the dashboard
	const evmWallet = wallets.userWallets.find(
		(wallet) => wallet.chain === 'EVM'
	);

	const renderTabButton = (
		tab: 'wallet' | 'profile',
		title: string,
		icon: string
	) => (
		<TouchableOpacity
			style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
			onPress={() => setActiveTab(tab)}
		>
			<Text style={styles.tabIcon}>{icon}</Text>
			<Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
				{title}
			</Text>
		</TouchableOpacity>
	);

	return (
		<View style={styles.container}>
			{/* Tab Navigation */}
			<View style={styles.tabContainer}>
				{renderTabButton('wallet', 'Wallet', '💳')}
				{renderTabButton('profile', 'Profile', '👤')}
			</View>

			{/* Content */}
			{activeTab === 'wallet' ? (
				evmWallet ? (
					<WalletDashboard wallet={evmWallet} />
				) : (
					<View style={styles.noWalletContainer}>
						<Text style={styles.noWalletTitle}>No EVM Wallet Found</Text>
						<Text style={styles.noWalletText}>
							Please connect an Ethereum-compatible wallet to use the payment
							features.
						</Text>
						<Button
							title='Connect Wallet'
							onPress={() => client.ui.auth.show()}
						/>
					</View>
				)
			) : (
				<ScrollView style={styles.profileContainer}>
					<View style={styles.section}>
						<Text style={styles.section__heading}>User Information</Text>
						<View style={styles.content_section}>
							<Text>{JSON.stringify(auth.authenticatedUser, null, 2)}</Text>
						</View>
					</View>

					<View style={styles.section}>
						<Text style={styles.section__heading}>Actions</Text>
						<View style={[styles.content_section, styles.actions_section]}>
							<Button
								onPress={() => client.ui.userProfile.show()}
								title='User Profile UI'
							/>
							<Button onPress={() => client.auth.logout()} title='Logout' />
						</View>
					</View>

					<View style={styles.section}>
						<Text style={styles.section__heading}>Connected Wallets</Text>
						<View style={styles.content_section}>
							{wallets.userWallets.map((wallet) => (
								<View key={wallet.id} style={styles.wallet_item}>
									<Text>Address: {wallet.address}</Text>
									<Text>Chain: {wallet.chain}</Text>
									<Text>Connector: {wallet.chain || 'Unknown'}</Text>

									{wallet.chain === 'EVM' && (
										<Button
											title='Sign Test Message'
											onPress={() => handleSignEVMMessage(wallet)}
										/>
									)}
								</View>
							))}
						</View>
					</View>

					<View style={styles.section}>
						<Text style={styles.section__heading}>JWT Token</Text>
						<View style={styles.content_section}>
							<Text
								style={styles.jwtText}
								numberOfLines={3}
								ellipsizeMode='middle'
							>
								{auth.token}
							</Text>
						</View>
					</View>
				</ScrollView>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	tabContainer: {
		flexDirection: 'row',
		backgroundColor: '#f8f9fa',
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	tabButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		marginHorizontal: 4,
	},
	tabButtonActive: {
		backgroundColor: '#007AFF',
	},
	tabIcon: {
		fontSize: 16,
		marginRight: 8,
	},
	tabText: {
		fontSize: 16,
		fontWeight: '500',
		color: '#666',
	},
	tabTextActive: {
		color: '#fff',
	},
	noWalletContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 40,
	},
	noWalletTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: '#333',
		marginBottom: 12,
		textAlign: 'center',
	},
	noWalletText: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
		lineHeight: 24,
		marginBottom: 24,
	},
	profileContainer: {
		flex: 1,
	},
	section: {
		gap: 5,
		padding: 20,
	},
	section__heading: {
		fontSize: 18,
		fontWeight: '600',
		color: '#333',
		marginBottom: 8,
	},
	content_section: {
		padding: 16,
		borderRadius: 12,
		backgroundColor: '#f8f9fa',
		borderWidth: 1,
		borderColor: '#eee',
	},
	actions_section: {
		flexDirection: 'column',
		gap: 12,
	},
	wallet_item: {
		marginBottom: 16,
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	jwtText: {
		fontSize: 12,
		fontFamily: 'monospace',
		color: '#666',
	},
});
