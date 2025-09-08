export interface NetworkConfig {
	chainId: number;
	name: string;
	symbol: string;
	rpcUrls: string[];
	blockExplorerUrls: string[];
	isTestnet: boolean;
}

export const SUPPORTED_NETWORKS: { [chainId: number]: NetworkConfig } = {
	1: {
		chainId: 1,
		name: 'Ethereum Mainnet',
		symbol: 'ETH',
		rpcUrls: ['https://eth.llamarpc.com'],
		blockExplorerUrls: ['https://etherscan.io'],
		isTestnet: false,
	},
	11155111: {
		chainId: 11155111,
		name: 'Sepolia Testnet',
		symbol: 'ETH',
		rpcUrls: ['https://rpc.sepolia.org'],
		blockExplorerUrls: ['https://sepolia.etherscan.io'],
		isTestnet: true,
	},
	137: {
		chainId: 137,
		name: 'Polygon',
		symbol: 'MATIC',
		rpcUrls: ['https://polygon.llamarpc.com'],
		blockExplorerUrls: ['https://polygonscan.com'],
		isTestnet: false,
	},
	80001: {
		chainId: 80001,
		name: 'Mumbai Testnet',
		symbol: 'MATIC',
		rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
		blockExplorerUrls: ['https://mumbai.polygonscan.com'],
		isTestnet: true,
	},
	42161: {
		chainId: 42161,
		name: 'Arbitrum One',
		symbol: 'ETH',
		rpcUrls: ['https://arb1.arbitrum.io/rpc'],
		blockExplorerUrls: ['https://arbiscan.io'],
		isTestnet: false,
	},
	421614: {
		chainId: 421614,
		name: 'Arbitrum Sepolia',
		symbol: 'ETH',
		rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
		blockExplorerUrls: ['https://sepolia.arbiscan.io'],
		isTestnet: true,
	},
	10: {
		chainId: 10,
		name: 'Optimism',
		symbol: 'ETH',
		rpcUrls: ['https://mainnet.optimism.io'],
		blockExplorerUrls: ['https://optimistic.etherscan.io'],
		isTestnet: false,
	},
	11155420: {
		chainId: 11155420,
		name: 'Optimism Sepolia',
		symbol: 'ETH',
		rpcUrls: ['https://sepolia.optimism.io'],
		blockExplorerUrls: ['https://sepolia-optimistic.etherscan.io'],
		isTestnet: true,
	},
	1328: {
		chainId: 1328,
		name: 'Sei Testnet',
		symbol: 'SEI',
		rpcUrls: ['https://evm-rpc-testnet.sei-apis.com'],
		blockExplorerUrls: ['https://seitrace.com'],
		isTestnet: false,
	},
	713715: {
		chainId: 713715,
		name: 'Sei Arctic-1',
		symbol: 'SEI',
		rpcUrls: ['https://evm-rpc-arctic-1.sei-apis.com'],
		blockExplorerUrls: ['https://seitrace.com'],
		isTestnet: true,
	},
};

export const getNetworkConfig = (chainId: number): NetworkConfig | null => {
	return SUPPORTED_NETWORKS[chainId] || null;
};

export const getNetworkName = (chainId: number): string => {
	const config = getNetworkConfig(chainId);
	return config ? config.name : `Unknown Network (${chainId})`;
};

export const isTestnet = (chainId: number): boolean => {
	const config = getNetworkConfig(chainId);
	return config ? config.isTestnet : true; // Default to testnet for unknown networks
};

export const getNetworkSymbol = (chainId: number): string => {
	const config = getNetworkConfig(chainId);
	return config ? config.symbol : 'ETH';
};
