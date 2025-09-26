/**
 * Viem Clients Configuration
 *
 * Multi-chain viem clients setup for Ethereum, BSC, and XSC networks.
 * Provides type-safe blockchain interaction with optimized configurations
 * for each network's specific requirements.
 *
 * @author Claude Code - Frontend Configuration
 * @created 2025-09-26
 */

import { createPublicClient, createWalletClient, http, custom, Chain, PublicClient, WalletClient, HttpTransport } from 'viem';
import { mainnet, bsc } from 'viem/chains';

/**
 * XSC Network Chain Configuration
 * Pre-Shanghai EVM compatibility with specific optimizations
 */
export const xscChain: Chain = {
  id: 520,
  name: 'XSC Network',
  nativeCurrency: {
    name: 'XSC',
    symbol: 'XSC',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.xsc.pub'],
      webSocket: ['wss://ws.xsc.pub']
    },
    public: {
      http: ['https://rpc.xsc.pub'],
      webSocket: ['wss://ws.xsc.pub']
    }
  },
  blockExplorers: {
    default: {
      name: 'XSC Explorer',
      url: 'https://explorer.xsc.pub'
    }
  },
  contracts: {
    // Add XSC specific contracts if needed
  },
  testnet: false
};

/**
 * Supported chains configuration
 */
export const supportedChains = [mainnet, bsc, xscChain] as const;

/**
 * Chain configuration map for easy access
 */
export const chainConfig = {
  [mainnet.id]: mainnet,
  [bsc.id]: bsc,
  [xscChain.id]: xscChain
} as const;

/**
 * RPC endpoint configurations with fallbacks
 */
const rpcConfig = {
  [mainnet.id]: {
    primary: 'https://eth-mainnet.alchemyapi.io/v2/demo',
    fallbacks: [
      'https://rpc.ankr.com/eth',
      'https://ethereum.publicnode.com'
    ]
  },
  [bsc.id]: {
    primary: 'https://bsc-dataseed1.binance.org/',
    fallbacks: [
      'https://bsc-dataseed2.binance.org/',
      'https://rpc.ankr.com/bsc'
    ]
  },
  [xscChain.id]: {
    primary: 'https://rpc.xsc.pub',
    fallbacks: []
  }
} as const;

/**
 * Create transport with retry logic and fallbacks
 */
const createTransportWithFallback = (chainId: number): HttpTransport => {
  const config = rpcConfig[chainId as keyof typeof rpcConfig];
  
  return http(config.primary, {
    batch: true,
    fetchOptions: {
      timeout: 10000 // 10 second timeout
    },
    retryCount: 3,
    retryDelay: 1000
  });
};

/**
 * Public clients for reading blockchain data
 */
export const publicClients = {
  [mainnet.id]: createPublicClient({
    chain: mainnet,
    transport: createTransportWithFallback(mainnet.id),
    batch: {
      multicall: true
    },
    cacheTime: 4_000 // 4 seconds
  }),
  
  [bsc.id]: createPublicClient({
    chain: bsc,
    transport: createTransportWithFallback(bsc.id),
    batch: {
      multicall: true
    },
    cacheTime: 4_000
  }),
  
  [xscChain.id]: createPublicClient({
    chain: xscChain,
    transport: createTransportWithFallback(xscChain.id),
    batch: {
      multicall: true
    },
    cacheTime: 2_000 // Shorter cache for XSC due to faster blocks
  })
} as const;

/**
 * Get public client by chain ID
 */
export const getPublicClient = (chainId: number): PublicClient => {
  const client = publicClients[chainId as keyof typeof publicClients];
  if (!client) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return client;
};

/**
 * Create wallet client with browser wallet integration
 */
export const createWalletClientForChain = (chainId: number): WalletClient | null => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }

  const chain = chainConfig[chainId as keyof typeof chainConfig];
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  return createWalletClient({
    chain,
    transport: custom(window.ethereum),
    account: undefined // Will be set by wagmi
  });
};

/**
 * Network-specific gas configurations
 */
export const gasConfig = {
  [mainnet.id]: {
    gasLimit: 21000n,
    maxFeePerGas: 30000000000n, // 30 gwei
    maxPriorityFeePerGas: 2000000000n, // 2 gwei
    estimateGasMultiplier: 1.2 // 20% buffer
  },
  [bsc.id]: {
    gasLimit: 21000n,
    gasPrice: 5000000000n, // 5 gwei
    estimateGasMultiplier: 1.1 // 10% buffer
  },
  [xscChain.id]: {
    gasLimit: 21000n,
    gasPrice: 1000000000n, // 1 gwei (lower for XSC)
    estimateGasMultiplier: 1.05, // 5% buffer (XSC is more predictable)
    // XSC specific: Pre-Shanghai EVM considerations
    evmVersion: 'shanghai',
    maxGasLimit: 30000000n
  }
} as const;

/**
 * Get gas configuration for a specific chain
 */
export const getGasConfig = (chainId: number) => {
  const config = gasConfig[chainId as keyof typeof gasConfig];
  if (!config) {
    throw new Error(`No gas configuration for chain ID: ${chainId}`);
  }
  return config;
};

/**
 * Estimate gas with network-specific optimizations
 */
export const estimateGasOptimized = async (
  chainId: number,
  transaction: any
): Promise<bigint> => {
  const client = getPublicClient(chainId);
  const config = getGasConfig(chainId);
  
  try {
    const estimate = await client.estimateGas(transaction);
    const multiplier = BigInt(Math.floor(config.estimateGasMultiplier * 100));
    return (estimate * multiplier) / 100n;
  } catch (error) {
    console.error(`Gas estimation failed for chain ${chainId}:`, error);
    return config.gasLimit;
  }
};

/**
 * Network health check utilities
 */
export const checkNetworkHealth = async (chainId: number): Promise<{
  isHealthy: boolean;
  blockNumber: bigint | null;
  latency: number;
}> => {
  const startTime = Date.now();
  
  try {
    const client = getPublicClient(chainId);
    const blockNumber = await client.getBlockNumber();
    const latency = Date.now() - startTime;
    
    return {
      isHealthy: true,
      blockNumber,
      latency
    };
  } catch (error) {
    return {
      isHealthy: false,
      blockNumber: null,
      latency: Date.now() - startTime
    };
  }
};

/**
 * XSC Network specific utilities
 */
export const xscNetworkUtils = {
  /**
   * Check if XSC network is ready for transactions
   */
  async isXscReady(): Promise<boolean> {
    try {
      const health = await checkNetworkHealth(xscChain.id);
      return health.isHealthy && health.latency < 5000; // 5 second max latency
    } catch {
      return false;
    }
  },

  /**
   * Get XSC network status
   */
  async getXscStatus() {
    const health = await checkNetworkHealth(xscChain.id);
    return {
      ...health,
      evmVersion: 'shanghai',
      preShanghai: false, // XSC supports Shanghai
      maxGasLimit: gasConfig[xscChain.id].maxGasLimit
    };
  },

  /**
   * Validate transaction for XSC constraints
   */
  validateXscTransaction(transaction: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (transaction.gas && transaction.gas > gasConfig[xscChain.id].maxGasLimit) {
      errors.push(`Gas limit exceeds XSC maximum: ${gasConfig[xscChain.id].maxGasLimit}`);
    }
    
    if (transaction.gasPrice && transaction.gasPrice > 10000000000n) { // 10 gwei
      errors.push('Gas price too high for XSC network');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  /**
   * Track RPC call performance
   */
  async trackRpcCall<T>(
    chainId: number,
    operation: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number; success: boolean }> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      // Log slow operations
      if (duration > 2000) {
        console.warn(`Slow RPC call on chain ${chainId}: ${operation} took ${duration}ms`);
      }
      
      return { result, duration, success: true };
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`RPC call failed on chain ${chainId}: ${operation}`, error);
      throw error;
    }
  },

  /**
   * Monitor network switching performance
   */
  async measureNetworkSwitch(fromChainId: number, toChainId: number) {
    const startTime = performance.now();
    
    const fromHealth = await checkNetworkHealth(fromChainId);
    const toHealth = await checkNetworkHealth(toChainId);
    
    const duration = performance.now() - startTime;
    
    return {
      duration,
      fromNetwork: { chainId: fromChainId, ...fromHealth },
      toNetwork: { chainId: toChainId, ...toHealth },
      switchRecommended: fromHealth.isHealthy && toHealth.isHealthy
    };
  }
};

/**
 * Export all clients and utilities for Playwright testing
 */
if (typeof window !== 'undefined') {
  (window as any).viemClients = {
    publicClients,
    getPublicClient,
    createWalletClientForChain,
    gasConfig,
    getGasConfig,
    estimateGasOptimized,
    checkNetworkHealth,
    xscNetworkUtils,
    performanceMonitor,
    supportedChains,
    chainConfig
  };
}

/**
 * Type exports for TypeScript integration
 */
export type SupportedChainId = typeof supportedChains[number]['id'];
export type PublicClientMap = typeof publicClients;
export type GasConfig = typeof gasConfig[keyof typeof gasConfig];

/**
 * Default export for easy importing
 */
export default {
  publicClients,
  getPublicClient,
  createWalletClientForChain,
  gasConfig,
  getGasConfig,
  estimateGasOptimized,
  checkNetworkHealth,
  xscNetworkUtils,
  performanceMonitor,
  supportedChains,
  chainConfig
};