import { useState, useEffect } from 'react';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { client } from '../lib/client';
import { walletService } from '../services/walletService';

export const useNetworkInfo = () => {
	const { wallets } = useReactiveClient(client);
	const [networkInfo, setNetworkInfo] = useState<{
		chainId: number;
		blockNumber: string;
		name?: string;
		shortName?: string;
	} | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchNetworkInfo = async () => {
			try {
				setIsLoading(true);

				// Get the primary wallet
				const primaryWallet = wallets.userWallets[0];
				if (!primaryWallet) {
					setNetworkInfo(null);
					return;
				}

				// Method 1: Direct from wallet properties
				console.log('Wallet object:', primaryWallet);
				console.log('Wallet chain:', primaryWallet.chain);
				console.log('Wallet network:', primaryWallet.network);
				console.log('Wallet connector:', primaryWallet.connector);

				// Get network info using wallet service
				const info = await walletService.getNetworkInfo(primaryWallet);
				setNetworkInfo(info);
			} catch (error) {
				console.error('Failed to fetch network info:', error);
				setNetworkInfo(null);
			} finally {
				setIsLoading(false);
			}
		};

		if (wallets.userWallets.length > 0) {
			fetchNetworkInfo();
		} else {
			setIsLoading(false);
			setNetworkInfo(null);
		}
	}, [wallets.userWallets]);

	return { networkInfo, isLoading };
};
