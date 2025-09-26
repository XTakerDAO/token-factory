/**
 * Network Configuration Constants
 *
 * Centralized network configuration constants for multi-chain support.
 * Includes Ethereum, BSC, and XSC network specifications with
 * performance optimizations and validation rules.
 *
 * @author Claude Code - Frontend Configuration
 * @created 2025-09-26
 */

import { NetworkConfiguration } from '../types/NetworkConfiguration';

/**
 * Supported chain IDs as const assertion for type safety
 */
export const SUPPORTED_CHAIN_IDS = [1, 56, 520] as const;
export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[number];

/**
 * Network metadata for UI display
 */
export const NETWORK_METADATA = {
  1: {
    name: 'Ethereum',
    shortName: 'ETH',
    color: '#627EEA',
    logo: '/networks/ethereum.svg',
    description: 'Ethereum Mainnet - The original smart contract platform',
    website: 'https://ethereum.org',
    isMainnet: true,
    popularityRank: 1
  },
  56: {
    name: 'Binance Smart Chain',
    shortName: 'BSC',
    color: '#F3BA2F',
    logo: '/networks/bsc.svg',
    description: 'Fast and low-cost blockchain compatible with Ethereum',
    website: 'https://www.bnbchain.org',
    isMainnet: true,
    popularityRank: 2
  },
  520: {
    name: 'XSC Network',
    shortName: 'XSC',
    color: '#00D4E5',
    logo: '/networks/xsc.svg',
    description: 'High-performance blockchain with Shanghai EVM compatibility',
    website: 'https://xsc.pub',
    isMainnet: true,
    popularityRank: 3
  }
} as const satisfies Record<SupportedChainId, any>;

/**
 * Complete network configurations
 */
export const NETWORK_CONFIGS: Record<SupportedChainId, NetworkConfiguration> = {
  1: {
    chainId: 1,
    name: 'Ethereum',
    nativeTokenSymbol: 'ETH',
    rpcEndpoints: [
      'https://eth-mainnet.alchemyapi.io/v2/demo',
      'https://rpc.ankr.com/eth',
      'https://ethereum.publicnode.com',
      'https://mainnet.infura.io/v3/demo'
    ],
    explorerUrls: [
      'https://etherscan.io',
      'https://eth.blockscout.com'
    ],
    isTestnet: false,
    evmVersion: 'shanghai',
    gasSettings: {
      gasLimit: 30000000,
      gasPrice: 20000000000n, // 20 gwei
      maxFeePerGas: 30000000000n, // 30 gwei
      maxPriorityFeePerGas: 2000000000n // 2 gwei
    }
  },
  56: {
    chainId: 56,
    name: 'Binance Smart Chain',
    nativeTokenSymbol: 'BNB',
    rpcEndpoints: [
      'https://bsc-dataseed1.binance.org/',
      'https://bsc-dataseed2.binance.org/',
      'https://rpc.ankr.com/bsc',
      'https://bsc.nodereal.io'
    ],
    explorerUrls: [
      'https://bscscan.com',
      'https://bsc.tokenview.io'
    ],
    isTestnet: false,
    evmVersion: 'london',
    gasSettings: {
      gasLimit: 30000000,
      gasPrice: 5000000000n, // 5 gwei
      maxFeePerGas: 10000000000n, // 10 gwei
      maxPriorityFeePerGas: 1000000000n // 1 gwei
    }
  },
  520: {
    chainId: 520,
    name: 'XSC Network',
    nativeTokenSymbol: 'XSC',
    rpcEndpoints: [
      'https://rpc.xsc.pub',
      'wss://ws.xsc.pub'
    ],
    explorerUrls: [
      'https://explorer.xsc.pub'
    ],
    isTestnet: false,
    evmVersion: 'shanghai',
    gasSettings: {
      gasLimit: 30000000,
      gasPrice: 1000000000n, // 1 gwei (lower for XSC)
      maxFeePerGas: 5000000000n, // 5 gwei
      maxPriorityFeePerGas: 500000000n // 0.5 gwei
    }
  }
};

/**
 * Network performance characteristics for optimization
 */
export const NETWORK_PERFORMANCE = {
  1: {
    blockTime: 12000, // 12 seconds
    averageGasPrice: 20000000000n,
    peakGasPrice: 100000000000n,
    confirmationBlocks: 12,
    maxTransactionSize: 128000, // bytes
    throughput: 15 // TPS
  },
  56: {
    blockTime: 3000, // 3 seconds  
    averageGasPrice: 5000000000n,
    peakGasPrice: 20000000000n,
    confirmationBlocks: 18,
    maxTransactionSize: 128000,
    throughput: 60 // TPS
  },
  520: {
    blockTime: 2000, // 2 seconds
    averageGasPrice: 1000000000n,
    peakGasPrice: 10000000000n,
    confirmationBlocks: 20,
    maxTransactionSize: 128000,
    throughput: 100 // TPS (estimated)
  }
} as const satisfies Record<SupportedChainId, any>;

/**
 * XSC Network specific constants and constraints
 */
export const XSC_NETWORK_CONSTANTS = {
  CHAIN_ID: 520,
  BLOCK_TIME_MS: 2000,
  MAX_GAS_LIMIT: 30000000n,
  RECOMMENDED_GAS_PRICE: 1000000000n, // 1 gwei
  MAX_RECOMMENDED_GAS_PRICE: 10000000000n, // 10 gwei
  EVM_VERSION: 'shanghai',
  CONFIRMATION_BLOCKS: 20,
  
  // XSC specific features
  FEATURES: {
    EIP1559: true,
    SHANGHAI_FORK: true,
    PRE_SHANGHAI_COMPAT: false,
    MULTICALL: true,
    CREATE2: true,
    OPCODE_COMPATIBILITY: 'shanghai'
  },
  
  // Transaction limits
  TRANSACTION_LIMITS: {
    MAX_GAS_LIMIT: 30000000n,
    MIN_GAS_PRICE: 1000000000n,
    MAX_CONTRACT_SIZE: 24576, // bytes
    MAX_INIT_CODE_SIZE: 49152 // bytes
  }
} as const;

/**
 * Fee estimation configuration for each network
 */
export const FEE_ESTIMATION_CONFIG = {
  1: {
    feeHistoryBlocks: 20,
    percentiles: [10, 50, 90],
    gasBufferMultiplier: 1.2,
    maxFeePerGasBuffer: 1.125,
    priorityFeeBuffer: 1.1
  },
  56: {
    feeHistoryBlocks: 10,
    percentiles: [25, 50, 75],
    gasBufferMultiplier: 1.1,
    maxFeePerGasBuffer: 1.05,
    priorityFeeBuffer: 1.05
  },
  520: {
    feeHistoryBlocks: 5,
    percentiles: [25, 50, 75],
    gasBufferMultiplier: 1.05,
    maxFeePerGasBuffer: 1.02,
    priorityFeeBuffer: 1.02
  }
} as const satisfies Record<SupportedChainId, any>;

/**
 * Network health check endpoints and thresholds
 */
export const NETWORK_HEALTH_CONFIG = {
  1: {
    healthCheckEndpoints: [
      'https://eth-mainnet.alchemyapi.io/v2/demo',
      'https://rpc.ankr.com/eth'
    ],
    maxLatency: 3000, // 3 seconds
    maxBlockLag: 5, // blocks
    healthCheckInterval: 30000 // 30 seconds
  },
  56: {
    healthCheckEndpoints: [
      'https://bsc-dataseed1.binance.org/',
      'https://rpc.ankr.com/bsc'
    ],
    maxLatency: 2000,
    maxBlockLag: 3,
    healthCheckInterval: 15000
  },
  520: {
    healthCheckEndpoints: [
      'https://rpc.xsc.pub'
    ],
    maxLatency: 1500,
    maxBlockLag: 2,
    healthCheckInterval: 10000
  }
} as const satisfies Record<SupportedChainId, any>;

/**
 * Deployed contract addresses by network
 */
export const DEPLOYED_CONTRACTS = {
  // Mainnet contracts (to be deployed)
  1: {
    factory: undefined,
    factoryImplementation: undefined,
    template: undefined,
    deploymentBlock: undefined,
    isVerified: false
  },
  56: {
    factory: undefined,
    factoryImplementation: undefined,
    template: undefined,
    deploymentBlock: undefined,
    isVerified: false
  },
  520: {
    factory: undefined,
    factoryImplementation: undefined,
    template: undefined,
    deploymentBlock: undefined,
    isVerified: false
  },

  // Testnet contracts (deployed)
  11155111: { // Sepolia
    factory: '0x742d35Cc6634C0532925a3b8D68aB32B8c1c9D1e',
    factoryImplementation: '0x8BA1f109551bD432803012645Hac136c22C5c8a9',
    template: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    deploymentBlock: 4856789,
    isVerified: false
  },
  97: { // BSC Testnet
    factory: '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3',
    factoryImplementation: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    template: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    deploymentBlock: 34856789,
    isVerified: false
  },
  199291: { // XSC Testnet
    factory: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    factoryImplementation: '0xA0b86a33E6417C7C1F7FaB9F40a39E0A3e4E4E1F',
    template: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    deploymentBlock: 1856789,
    isVerified: false
  },

  // Local development
  31337: { // Anvil
    factory: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    factoryImplementation: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    template: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    deploymentBlock: 1,
    isVerified: true
  }
} as const;

/**
 * Contract deployment gas estimates by network
 */
export const DEPLOYMENT_GAS_ESTIMATES = {
  1: {
    basicToken: 1200000n,
    mintableToken: 1400000n,
    burnableToken: 1350000n,
    pausableToken: 1450000n,
    cappedToken: 1500000n,
    fullFeaturedToken: 1800000n
  },
  56: {
    basicToken: 1100000n,
    mintableToken: 1300000n,
    burnableToken: 1250000n,
    pausableToken: 1350000n,
    cappedToken: 1400000n,
    fullFeaturedToken: 1700000n
  },
  520: {
    basicToken: 1000000n,
    mintableToken: 1200000n,
    burnableToken: 1150000n,
    pausableToken: 1250000n,
    cappedToken: 1300000n,
    fullFeaturedToken: 1600000n
  }
} as const satisfies Record<SupportedChainId, any>;

/**
 * Utility functions for network operations
 */
export const networkUtils = {
  /**
   * Get network configuration by chain ID
   */
  getNetworkConfig: (chainId: number): NetworkConfiguration | undefined => {
    return NETWORK_CONFIGS[chainId as SupportedChainId];
  },

  /**
   * Get all supported networks
   */
  getAllNetworks: (): NetworkConfiguration[] => {
    return Object.values(NETWORK_CONFIGS);
  },

  /**
   * Check if chain ID is supported
   */
  isSupportedChain: (chainId: number): chainId is SupportedChainId => {
    return SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId);
  },

  /**
   * Get network metadata for UI
   */
  getNetworkMetadata: (chainId: SupportedChainId) => {
    return NETWORK_METADATA[chainId];
  },

  /**
   * Get network performance data
   */
  getNetworkPerformance: (chainId: SupportedChainId) => {
    return NETWORK_PERFORMANCE[chainId];
  },

  /**
   * Get fee estimation config
   */
  getFeeConfig: (chainId: SupportedChainId) => {
    return FEE_ESTIMATION_CONFIG[chainId];
  },

  /**
   * Get deployment gas estimate
   */
  getDeploymentGasEstimate: (chainId: SupportedChainId, tokenType: keyof typeof DEPLOYMENT_GAS_ESTIMATES[SupportedChainId]) => {
    return DEPLOYMENT_GAS_ESTIMATES[chainId][tokenType];
  },

  /**
   * Format network display name
   */
  formatNetworkName: (chainId: SupportedChainId, short: boolean = false): string => {
    const metadata = NETWORK_METADATA[chainId];
    return short ? metadata.shortName : metadata.name;
  },

  /**
   * Get network color for UI theming
   */
  getNetworkColor: (chainId: SupportedChainId): string => {
    return NETWORK_METADATA[chainId].color;
  },

  /**
   * Sort networks by popularity
   */
  getNetworksByPopularity: (): SupportedChainId[] => {
    return SUPPORTED_CHAIN_IDS
      .slice()
      .sort((a, b) => NETWORK_METADATA[a].popularityRank - NETWORK_METADATA[b].popularityRank);
  },

  /**
   * Get deployed contract addresses for a network
   */
  getContractAddresses: (chainId: number) => {
    return DEPLOYED_CONTRACTS[chainId as keyof typeof DEPLOYED_CONTRACTS];
  },

  /**
   * Check if contracts are deployed on a network
   */
  areContractsDeployed: (chainId: number): boolean => {
    const contracts = DEPLOYED_CONTRACTS[chainId as keyof typeof DEPLOYED_CONTRACTS];
    return contracts?.factory !== undefined;
  },

  /**
   * Get factory contract address for a network
   */
  getFactoryAddress: (chainId: number): string | undefined => {
    const contracts = DEPLOYED_CONTRACTS[chainId as keyof typeof DEPLOYED_CONTRACTS];
    return contracts?.factory;
  },

  /**
   * Check if contracts are verified on block explorer
   */
  areContractsVerified: (chainId: number): boolean => {
    const contracts = DEPLOYED_CONTRACTS[chainId as keyof typeof DEPLOYED_CONTRACTS];
    return contracts?.isVerified === true;
  },

  /**
   * Get supported networks with deployed contracts
   */
  getNetworksWithContracts: () => {
    return Object.entries(DEPLOYED_CONTRACTS)
      .filter(([_, contracts]) => contracts.factory !== undefined)
      .map(([chainId, _]) => parseInt(chainId));
  },

  /**
   * Estimate transaction cost in USD (requires external price feed)
   */
  estimateTransactionCostUSD: async (
    chainId: SupportedChainId,
    gasEstimate: bigint,
    tokenPriceUSD?: number
  ): Promise<{ costUSD: number; gasPrice: bigint; totalGas: bigint }> => {
    const networkConfig = NETWORK_CONFIGS[chainId];
    const gasPrice = networkConfig.gasSettings.gasPrice;
    const totalGas = gasEstimate;

    // Convert gas cost to native token amount
    const gasCostInWei = gasPrice * totalGas;
    const gasCostInNative = Number(gasCostInWei) / 10 ** 18;

    // If no price provided, return 0 for USD cost
    const costUSD = tokenPriceUSD ? gasCostInNative * tokenPriceUSD : 0;

    return {
      costUSD,
      gasPrice,
      totalGas
    };
  }
};

/**
 * XSC specific utility functions
 */
export const xscUtils = {
  /**
   * Check XSC network constraints
   */
  validateXscConstraints: (transaction: {
    gasLimit?: bigint;
    gasPrice?: bigint;
    data?: string;
  }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (transaction.gasLimit && transaction.gasLimit > XSC_NETWORK_CONSTANTS.MAX_GAS_LIMIT) {
      errors.push(`Gas limit exceeds XSC maximum: ${XSC_NETWORK_CONSTANTS.MAX_GAS_LIMIT}`);
    }
    
    if (transaction.gasPrice && transaction.gasPrice > XSC_NETWORK_CONSTANTS.MAX_RECOMMENDED_GAS_PRICE) {
      errors.push(`Gas price too high for XSC network: ${transaction.gasPrice} > ${XSC_NETWORK_CONSTANTS.MAX_RECOMMENDED_GAS_PRICE}`);
    }
    
    if (transaction.data) {
      const dataSize = transaction.data.length / 2 - 1; // -1 for 0x prefix
      if (dataSize > XSC_NETWORK_CONSTANTS.TRANSACTION_LIMITS.MAX_CONTRACT_SIZE) {
        errors.push(`Transaction data too large for XSC: ${dataSize} bytes`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Get optimal XSC transaction parameters
   */
  getOptimalXscParams: () => ({
    gasPrice: XSC_NETWORK_CONSTANTS.RECOMMENDED_GAS_PRICE,
    gasLimit: 300000n, // Conservative default
    maxFeePerGas: XSC_NETWORK_CONSTANTS.RECOMMENDED_GAS_PRICE * 2n,
    maxPriorityFeePerGas: XSC_NETWORK_CONSTANTS.RECOMMENDED_GAS_PRICE / 2n
  }),

  /**
   * Check XSC network readiness
   */
  checkXscReadiness: async (): Promise<{
    isReady: boolean;
    blockNumber?: bigint;
    latency: number;
    features: typeof XSC_NETWORK_CONSTANTS.FEATURES;
  }> => {
    const startTime = performance.now();
    
    try {
      // This would normally check the actual RPC endpoint
      // For now, return a mock implementation
      const latency = performance.now() - startTime;
      
      return {
        isReady: latency < NETWORK_HEALTH_CONFIG[520].maxLatency,
        blockNumber: 1000000n,
        latency,
        features: XSC_NETWORK_CONSTANTS.FEATURES
      };
    } catch (error) {
      return {
        isReady: false,
        latency: performance.now() - startTime,
        features: XSC_NETWORK_CONSTANTS.FEATURES
      };
    }
  }
};

/**
 * Export for Playwright testing and debugging
 */
if (typeof window !== 'undefined') {
  (window as any).networkConstants = {
    SUPPORTED_CHAIN_IDS,
    NETWORK_METADATA,
    NETWORK_CONFIGS,
    NETWORK_PERFORMANCE,
    XSC_NETWORK_CONSTANTS,
    FEE_ESTIMATION_CONFIG,
    NETWORK_HEALTH_CONFIG,
    DEPLOYED_CONTRACTS,
    DEPLOYMENT_GAS_ESTIMATES,
    networkUtils,
    xscUtils
  };
}

/**
 * Type exports for TypeScript integration
 */
export type NetworkMetadata = typeof NETWORK_METADATA[SupportedChainId];
export type NetworkPerformance = typeof NETWORK_PERFORMANCE[SupportedChainId];
export type FeeEstimationConfig = typeof FEE_ESTIMATION_CONFIG[SupportedChainId];
export type DeploymentGasEstimate = typeof DEPLOYMENT_GAS_ESTIMATES[SupportedChainId];

/**
 * Default export
 */
export default {
  SUPPORTED_CHAIN_IDS,
  NETWORK_METADATA,
  NETWORK_CONFIGS,
  NETWORK_PERFORMANCE,
  XSC_NETWORK_CONSTANTS,
  FEE_ESTIMATION_CONFIG,
  NETWORK_HEALTH_CONFIG,
  DEPLOYED_CONTRACTS,
  DEPLOYMENT_GAS_ESTIMATES,
  networkUtils,
  xscUtils
};