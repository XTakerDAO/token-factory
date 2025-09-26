/**
 * Wagmi Configuration
 *
 * Multi-chain Wagmi setup with TanStack Query integration.
 * Supports Ethereum, BSC, and XSC networks with optimal
 * connector configurations and caching strategies.
 *
 * @author Claude Code - Frontend Configuration
 * @created 2025-09-26
 */

import { getDefaultConfig } from '@wagmi/core';
import { mainnet, bsc } from 'wagmi/chains';
import { injected, metaMask, walletConnect, coinbaseWallet, safe } from '@wagmi/connectors';
import { QueryClient } from '@tanstack/react-query';
import { createConfig, http } from 'wagmi';
import { xscChain, supportedChains, publicClients } from './viem';

/**
 * Environment configuration
 */
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';
const appName = 'Token Factory DApp';
const appDescription = 'Multi-chain token deployment platform';
const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://token-factory.com';
const appIcon = `${appUrl}/favicon.ico`;

/**
 * Connector configurations with performance optimizations
 */
const connectors = [
  // MetaMask with optimal settings
  metaMask({
    dappMetadata: {
      name: appName,
      url: appUrl,
      iconUrl: appIcon
    }
  }),

  // Injected wallet connector (fallback for other browser wallets)
  injected({
    shimDisconnect: true
  }),

  // WalletConnect v2 with project configuration
  walletConnect({
    projectId,
    metadata: {
      name: appName,
      description: appDescription,
      url: appUrl,
      icons: [appIcon]
    },
    showQrModal: true,
    qrModalOptions: {
      themeMode: 'light',
      themeVariables: {
        '--wcm-z-index': '9999'
      }
    }
  }),

  // Coinbase Wallet connector
  coinbaseWallet({
    appName,
    appLogoUrl: appIcon,
    darkMode: false,
    headlessMode: false
  }),

  // Safe (Gnosis Safe) connector
  safe({
    allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/],
    debug: process.env.NODE_ENV === 'development'
  })
];

/**
 * Transport configuration for each chain
 */
const transports = {
  [mainnet.id]: http('https://eth-mainnet.alchemyapi.io/v2/demo', {
    batch: true,
    fetchOptions: {
      timeout: 10000
    },
    retryCount: 3,
    retryDelay: 1000
  }),
  [bsc.id]: http('https://bsc-dataseed1.binance.org/', {
    batch: true,
    fetchOptions: {
      timeout: 10000
    },
    retryCount: 3,
    retryDelay: 1000
  }),
  [xscChain.id]: http('https://rpc.xsc.pub', {
    batch: true,
    fetchOptions: {
      timeout: 8000 // Shorter timeout for XSC
    },
    retryCount: 2,
    retryDelay: 500
  })
};

/**
 * Main Wagmi configuration
 */
export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors,
  transports,
  ssr: true, // Enable SSR support for Next.js
  batch: {
    multicall: {
      batchSize: 1024 * 200, // 200KB batch size
      wait: 16 // 16ms debounce
    }
  },
  cacheTime: 2_000 // 2 seconds cache
});

/**
 * TanStack Query Client configuration for optimal performance
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache configuration
      gcTime: 1_000 * 60 * 60 * 24, // 24 hours garbage collection
      staleTime: 1_000 * 60 * 5, // 5 minutes stale time
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Network configuration
      networkMode: 'online',
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      
      // Performance optimizations
      structuralSharing: true
    },
    mutations: {
      retry: 1,
      networkMode: 'online'
    }
  }
});

/**
 * Chain-specific configurations and utilities
 */
export const chainSpecificConfig = {
  [mainnet.id]: {
    blockTime: 12000, // 12 seconds
    confirmations: 12,
    gasBuffer: 1.2,
    maxRetries: 3,
    features: {
      eip1559: true,
      multicall: true,
      ensSupport: true
    }
  },
  [bsc.id]: {
    blockTime: 3000, // 3 seconds
    confirmations: 18,
    gasBuffer: 1.1,
    maxRetries: 3,
    features: {
      eip1559: true,
      multicall: true,
      ensSupport: false
    }
  },
  [xscChain.id]: {
    blockTime: 2000, // 2 seconds (faster than BSC)
    confirmations: 20,
    gasBuffer: 1.05,
    maxRetries: 2,
    features: {
      eip1559: true,
      multicall: true,
      ensSupport: false,
      evmVersion: 'shanghai',
      preShanghai: false
    }
  }
};

/**
 * Get chain configuration
 */
export const getChainConfig = (chainId: number) => {
  const config = chainSpecificConfig[chainId as keyof typeof chainSpecificConfig];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config;
};

/**
 * Network switching utilities with Wagmi integration
 */
export const networkSwitchUtils = {
  /**
   * Check if network switch is supported
   */
  isSwitchSupported: (chainId: number): boolean => {
    return chainId in chainSpecificConfig;
  },

  /**
   * Get network switch parameters
   */
  getSwitchParams: (chainId: number) => {
    if (!networkSwitchUtils.isSwitchSupported(chainId)) {
      throw new Error(`Network switch not supported for chain ${chainId}`);
    }

    const chain = supportedChains.find(c => c.id === chainId);
    if (!chain) {
      throw new Error(`Chain configuration not found for ID ${chainId}`);
    }

    return {
      chainId: `0x${chainId.toString(16)}`,
      chainName: chain.name,
      nativeCurrency: chain.nativeCurrency,
      rpcUrls: chain.rpcUrls.default.http,
      blockExplorerUrls: chain.blockExplorers?.default ? [chain.blockExplorers.default.url] : undefined
    };
  },

  /**
   * Estimate network switch time
   */
  estimateSwitchTime: (fromChainId: number, toChainId: number): number => {
    // Base switch time + network-specific delays
    const baseTime = 2000; // 2 seconds base
    const fromConfig = getChainConfig(fromChainId);
    const toConfig = getChainConfig(toChainId);
    
    return baseTime + fromConfig.blockTime * 0.1 + toConfig.blockTime * 0.1;
  }
};

/**
 * Transaction monitoring utilities
 */
export const transactionMonitor = {
  /**
   * Get recommended confirmation count for chain
   */
  getConfirmationCount: (chainId: number): number => {
    const config = getChainConfig(chainId);
    return config.confirmations;
  },

  /**
   * Calculate expected confirmation time
   */
  getExpectedConfirmationTime: (chainId: number): number => {
    const config = getChainConfig(chainId);
    return config.blockTime * config.confirmations;
  },

  /**
   * Monitor transaction with chain-specific settings
   */
  async waitForTransaction(
    hash: string,
    chainId: number,
    onUpdate?: (confirmations: number) => void
  ): Promise<{ success: boolean; confirmations: number; duration: number }> {
    const startTime = Date.now();
    const requiredConfirmations = transactionMonitor.getConfirmationCount(chainId);
    const client = publicClients[chainId as keyof typeof publicClients];
    
    if (!client) {
      throw new Error(`Public client not available for chain ${chainId}`);
    }

    try {
      // Wait for transaction receipt
      const receipt = await client.waitForTransactionReceipt({
        hash: hash as `0x${string}`,
        confirmations: requiredConfirmations
      });

      const duration = Date.now() - startTime;
      onUpdate?.(requiredConfirmations);

      return {
        success: receipt.status === 'success',
        confirmations: requiredConfirmations,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Transaction monitoring failed for ${hash} on chain ${chainId}:`, error);
      
      return {
        success: false,
        confirmations: 0,
        duration
      };
    }
  }
};

/**
 * XSC Network specific Wagmi utilities
 */
export const xscWagmiUtils = {
  /**
   * Check XSC compatibility with current wallet
   */
  async checkXscCompatibility(): Promise<{ 
    supported: boolean; 
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check if wallet supports custom networks
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [networkSwitchUtils.getSwitchParams(xscChain.id)]
        });
      } catch (error: any) {
        if (error.code === 4902) {
          issues.push('Wallet does not support adding custom networks');
          recommendations.push('Use MetaMask or another wallet that supports custom networks');
        }
      }
    }

    return {
      supported: issues.length === 0,
      issues,
      recommendations
    };
  },

  /**
   * Setup XSC network in wallet
   */
  async setupXscNetwork(): Promise<{ success: boolean; error?: string }> {
    if (typeof window === 'undefined' || !window.ethereum) {
      return { success: false, error: 'No wallet detected' };
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkSwitchUtils.getSwitchParams(xscChain.id)]
      });

      // Try to switch to XSC network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${xscChain.id.toString(16)}` }]
      });

      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to setup XSC network'
      };
    }
  }
};

/**
 * Performance monitoring for Wagmi operations
 */
export const wagmiPerformance = {
  /**
   * Monitor connection performance
   */
  async measureConnectionTime(connectorId: string): Promise<{
    duration: number;
    success: boolean;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      // Connection timing would be handled by the actual wagmi hooks
      // This is a placeholder for performance monitoring structure
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        duration: performance.now() - startTime,
        success: true
      };
    } catch (error: any) {
      return {
        duration: performance.now() - startTime,
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Track query performance by chain
   */
  trackQueryPerformance: (chainId: number, queryType: string, duration: number) => {
    if (duration > 5000) { // Log slow queries
      console.warn(`Slow ${queryType} query on chain ${chainId}: ${duration}ms`);
    }
    
    // In a real implementation, this would send metrics to a monitoring service
    if (process.env.NODE_ENV === 'development') {
      console.log(`Query performance - Chain ${chainId}, Type: ${queryType}, Duration: ${duration}ms`);
    }
  }
};

/**
 * Export configuration for Playwright testing
 */
if (typeof window !== 'undefined') {
  (window as any).wagmiConfig = wagmiConfig;
  (window as any).wagmiUtils = {
    chainSpecificConfig,
    getChainConfig,
    networkSwitchUtils,
    transactionMonitor,
    xscWagmiUtils,
    wagmiPerformance,
    queryClient
  };
}

/**
 * Type exports
 */
export type ChainConfig = typeof chainSpecificConfig[keyof typeof chainSpecificConfig];
export type SupportedConnector = typeof connectors[number];

/**
 * Default export for easy importing
 */
export default {
  wagmiConfig,
  queryClient,
  chainSpecificConfig,
  getChainConfig,
  networkSwitchUtils,
  transactionMonitor,
  xscWagmiUtils,
  wagmiPerformance
};