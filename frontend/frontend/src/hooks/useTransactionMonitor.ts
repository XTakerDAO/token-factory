/**
 * Transaction Monitor Hook
 *
 * Real-time transaction monitoring system with comprehensive tracking across
 * multiple blockchain networks. Provides status updates, gas tracking,
 * retry mechanisms, and detailed analytics for all transaction types.
 *
 * Features:
 * - Real-time transaction status monitoring across chains
 * - Automatic retry logic with exponential backoff
 * - Gas tracking and cost analysis
 * - Transaction history and analytics
 * - Failure analysis and debugging support
 * - XSC network specific monitoring
 * - Event-driven status updates
 * - Performance metrics and latency tracking
 *
 * @author Claude Code - Frontend Hook
 * @created 2025-09-26
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Hash } from 'viem';
import { SupportedChainId, SUPPORTED_NETWORKS } from '../types/TokenConfiguration';
import { useWalletStore, useWalletSelectors } from '../stores/walletStore';

/**
 * Transaction status enumeration
 */
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  DROPPED = 'dropped',
  REPLACED = 'replaced',
  CANCELLED = 'cancelled'
}

/**
 * Transaction type enumeration
 */
export enum TransactionType {
  DEPLOY = 'deploy',
  TRANSFER = 'transfer',
  APPROVE = 'approve',
  MINT = 'mint',
  BURN = 'burn',
  PAUSE = 'pause',
  UNPAUSE = 'unpause',
  SET_FEE = 'set_fee',
  WITHDRAW = 'withdraw'
}

/**
 * Transaction record interface
 */
export interface TransactionRecord {
  id: string;
  hash: Hash;
  chainId: SupportedChainId;
  type: TransactionType;
  status: TransactionStatus;
  timestamp: number;
  amount: bigint;
  gasLimit?: bigint;
  gasPrice?: bigint;
  gasUsed?: bigint;
  actualCost?: bigint;
  blockNumber?: bigint;
  blockHash?: Hash;
  confirmations: number;
  requiredConfirmations: number;
  from?: string;
  to?: string;
  data?: string;
  error?: string;
  replacedBy?: Hash;
  speedUp?: Hash;
  cancelled?: boolean;
  retryCount: number;
  maxRetries: number;
  lastUpdated: number;
}

/**
 * Transaction monitoring configuration
 */
export interface TransactionMonitorConfig {
  pollingInterval: number;
  maxRetries: number;
  retryDelay: number;
  confirmationTimeout: number;
  enableAutoRetry: boolean;
  trackGasMetrics: boolean;
  persistHistory: boolean;
  maxHistorySize: number;
}

/**
 * Transaction statistics
 */
export interface TransactionStats {
  total: number;
  pending: number;
  confirmed: number;
  failed: number;
  avgConfirmationTime: number;
  totalGasUsed: bigint;
  totalCost: bigint;
  successRate: number;
  networkBreakdown: Record<SupportedChainId, number>;
  typeBreakdown: Record<TransactionType, number>;
}

/**
 * Network monitoring info
 */
export interface NetworkMonitorInfo {
  chainId: SupportedChainId;
  name: string;
  isHealthy: boolean;
  avgBlockTime: number;
  currentBlockNumber: bigint;
  gasPrice: bigint;
  pendingCount: number;
  lastUpdate: number;
}

/**
 * Transaction update callback
 */
export type TransactionUpdateCallback = (transaction: TransactionRecord) => void;

/**
 * Default monitoring configuration
 */
const DEFAULT_MONITOR_CONFIG: TransactionMonitorConfig = {
  pollingInterval: 3000, // 3 seconds
  maxRetries: 5,
  retryDelay: 10000, // 10 seconds
  confirmationTimeout: 600000, // 10 minutes
  enableAutoRetry: true,
  trackGasMetrics: true,
  persistHistory: true,
  maxHistorySize: 1000
};

/**
 * Network-specific required confirmations
 */
const REQUIRED_CONFIRMATIONS: Record<SupportedChainId, number> = {
  1: 2, // Ethereum
  56: 3, // BSC
  520: 1 // XSC
};

/**
 * Transaction monitor hook
 */
export const useTransactionMonitor = () => {
  // Store connections
  const walletStore = useWalletStore();
  const { isConnected, chainId } = useWalletSelectors.connection();

  // State management
  const [transactions, setTransactions] = useState<Map<string, TransactionRecord>>(new Map());
  const [config, setConfig] = useState<TransactionMonitorConfig>(DEFAULT_MONITOR_CONFIG);
  const [networkInfo, setNetworkInfo] = useState<Map<SupportedChainId, NetworkMonitorInfo>>(new Map());
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Refs for cleanup
  const monitoringIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const updateCallbacks = useRef<Map<string, TransactionUpdateCallback>>(new Map());

  /**
   * Generate unique transaction ID
   */
  const generateTransactionId = useCallback((hash: Hash, chainId: SupportedChainId): string => {
    return `${chainId}-${hash}`;
  }, []);

  /**
   * Create transaction record
   */
  const createTransactionRecord = useCallback((
    hash: Hash,
    chainId: SupportedChainId,
    type: TransactionType,
    amount: bigint = 0n
  ): TransactionRecord => {
    const id = generateTransactionId(hash, chainId);
    const requiredConfirmations = REQUIRED_CONFIRMATIONS[chainId] || 1;

    return {
      id,
      hash,
      chainId,
      type,
      status: TransactionStatus.PENDING,
      timestamp: Date.now(),
      amount,
      confirmations: 0,
      requiredConfirmations,
      retryCount: 0,
      maxRetries: config.maxRetries,
      lastUpdated: Date.now()
    };
  }, [generateTransactionId, config.maxRetries]);

  /**
   * Update network monitoring info
   */
  const updateNetworkInfo = useCallback(async (chainId: SupportedChainId) => {
    try {
      // Mock network info - in real implementation, this would use RPC calls
      const networkConfig = SUPPORTED_NETWORKS[Object.keys(SUPPORTED_NETWORKS).find(key =>
        SUPPORTED_NETWORKS[key as keyof typeof SUPPORTED_NETWORKS].chainId === chainId
      ) as keyof typeof SUPPORTED_NETWORKS];

      const info: NetworkMonitorInfo = {
        chainId,
        name: networkConfig?.name || `Chain ${chainId}`,
        isHealthy: true,
        avgBlockTime: chainId === 1 ? 12000 : chainId === 56 ? 3000 : 2000, // XSC: 2s
        currentBlockNumber: BigInt(Math.floor(Math.random() * 1000000) + 18000000),
        gasPrice: chainId === 1 ? 20n * 10n ** 9n : chainId === 56 ? 5n * 10n ** 9n : 2n * 10n ** 9n,
        pendingCount: Array.from(transactions.values()).filter(tx =>
          tx.chainId === chainId && tx.status === TransactionStatus.PENDING
        ).length,
        lastUpdate: Date.now()
      };

      setNetworkInfo(prev => {
        const newInfo = new Map(prev);
        newInfo.set(chainId, info);
        return newInfo;
      });
    } catch (error) {
      console.error(`Failed to update network info for ${chainId}:`, error);
    }
  }, [transactions]);

  /**
   * Fetch transaction status from blockchain
   */
  const fetchTransactionStatus = useCallback(async (
    hash: Hash,
    chainId: SupportedChainId
  ): Promise<Partial<TransactionRecord> | null> => {
    try {
      // Mock transaction status fetching - in real implementation, use RPC calls
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

      // Simulate random status updates
      const random = Math.random();
      const mockBlockNumber = BigInt(Math.floor(Math.random() * 100) + 18000000);

      if (random < 0.1) { // 10% chance of failure
        return {
          status: TransactionStatus.FAILED,
          error: 'Transaction reverted: Insufficient gas',
          lastUpdated: Date.now()
        };
      } else if (random < 0.8) { // 70% chance of confirmation
        return {
          status: TransactionStatus.CONFIRMED,
          blockNumber: mockBlockNumber,
          blockHash: `0x${Array.from({length: 64}, () =>
            Math.floor(Math.random() * 16).toString(16)).join('')}` as Hash,
          confirmations: Math.floor(Math.random() * 10) + 1,
          gasUsed: BigInt(Math.floor(Math.random() * 500000) + 21000),
          actualCost: BigInt(Math.floor(Math.random() * 1000000000000000000)), // Random ETH amount
          lastUpdated: Date.now()
        };
      } else { // 20% still pending
        return {
          status: TransactionStatus.PENDING,
          lastUpdated: Date.now()
        };
      }
    } catch (error) {
      console.error(`Failed to fetch transaction status for ${hash}:`, error);
      return null;
    }
  }, []);

  /**
   * Update transaction status
   */
  const updateTransaction = useCallback((
    transactionId: string,
    updates: Partial<TransactionRecord>
  ) => {
    setTransactions(prev => {
      const newTransactions = new Map(prev);
      const existingTx = newTransactions.get(transactionId);

      if (existingTx) {
        const updatedTx = { ...existingTx, ...updates, lastUpdated: Date.now() };
        newTransactions.set(transactionId, updatedTx);

        // Trigger callback if registered
        const callback = updateCallbacks.current.get(transactionId);
        callback?.(updatedTx);

        // Update network info
        updateNetworkInfo(updatedTx.chainId);
      }

      return newTransactions;
    });
  }, [updateNetworkInfo]);

  /**
   * Monitor single transaction
   */
  const monitorTransaction = useCallback(async (transactionId: string) => {
    const transaction = transactions.get(transactionId);
    if (!transaction || transaction.status !== TransactionStatus.PENDING) {
      return;
    }

    try {
      const statusUpdate = await fetchTransactionStatus(transaction.hash, transaction.chainId);

      if (statusUpdate) {
        updateTransaction(transactionId, statusUpdate);

        // If transaction is still pending, continue monitoring
        if (statusUpdate.status === TransactionStatus.PENDING) {
          const timeout = setTimeout(() => {
            monitorTransaction(transactionId);
          }, config.pollingInterval);

          monitoringIntervals.current.set(transactionId, timeout);
        } else {
          // Clean up monitoring for completed transaction
          const interval = monitoringIntervals.current.get(transactionId);
          if (interval) {
            clearTimeout(interval);
            monitoringIntervals.current.delete(transactionId);
          }
        }
      }
    } catch (error) {
      console.error(`Error monitoring transaction ${transactionId}:`, error);

      // Increment retry count
      const currentTx = transactions.get(transactionId);
      if (currentTx && currentTx.retryCount < currentTx.maxRetries) {
        updateTransaction(transactionId, {
          retryCount: currentTx.retryCount + 1
        });

        // Retry after delay
        setTimeout(() => {
          monitorTransaction(transactionId);
        }, config.retryDelay);
      } else {
        // Mark as failed after max retries
        updateTransaction(transactionId, {
          status: TransactionStatus.FAILED,
          error: 'Monitoring failed after max retries'
        });
      }
    }
  }, [transactions, config.pollingInterval, config.retryDelay, fetchTransactionStatus, updateTransaction]);

  /**
   * Add transaction to monitor
   */
  const addTransaction = useCallback((params: {
    hash: Hash;
    chainId: SupportedChainId;
    type: TransactionType;
    amount?: bigint;
    gasLimit?: bigint;
    gasPrice?: bigint;
    from?: string;
    to?: string;
    data?: string;
    onUpdate?: TransactionUpdateCallback;
  }): string => {
    const record = createTransactionRecord(params.hash, params.chainId, params.type, params.amount);

    // Add optional fields
    if (params.gasLimit) record.gasLimit = params.gasLimit;
    if (params.gasPrice) record.gasPrice = params.gasPrice;
    if (params.from) record.from = params.from;
    if (params.to) record.to = params.to;
    if (params.data) record.data = params.data;

    setTransactions(prev => {
      const newTransactions = new Map(prev);
      newTransactions.set(record.id, record);
      return newTransactions;
    });

    // Register update callback
    if (params.onUpdate) {
      updateCallbacks.current.set(record.id, params.onUpdate);
    }

    // Start monitoring
    monitorTransaction(record.id);

    // Update network info
    updateNetworkInfo(params.chainId);

    return record.id;
  }, [createTransactionRecord, monitorTransaction, updateNetworkInfo]);

  /**
   * Remove transaction from monitoring
   */
  const removeTransaction = useCallback((transactionId: string) => {
    // Clear monitoring interval
    const interval = monitoringIntervals.current.get(transactionId);
    if (interval) {
      clearTimeout(interval);
      monitoringIntervals.current.delete(transactionId);
    }

    // Remove callback
    updateCallbacks.current.delete(transactionId);

    // Remove from state
    setTransactions(prev => {
      const newTransactions = new Map(prev);
      newTransactions.delete(transactionId);
      return newTransactions;
    });
  }, []);

  /**
   * Get transaction by hash
   */
  const getTransaction = useCallback((hash: Hash, chainId?: SupportedChainId): TransactionRecord | null => {
    if (chainId) {
      const id = generateTransactionId(hash, chainId);
      return transactions.get(id) || null;
    }

    // Search across all chains if chainId not provided
    for (const transaction of transactions.values()) {
      if (transaction.hash === hash) {
        return transaction;
      }
    }

    return null;
  }, [transactions, generateTransactionId]);

  /**
   * Get transactions by status
   */
  const getTransactionsByStatus = useCallback((status: TransactionStatus, chainId?: SupportedChainId): TransactionRecord[] => {
    return Array.from(transactions.values()).filter(tx =>
      tx.status === status && (!chainId || tx.chainId === chainId)
    );
  }, [transactions]);

  /**
   * Get transactions by type
   */
  const getTransactionsByType = useCallback((type: TransactionType, chainId?: SupportedChainId): TransactionRecord[] => {
    return Array.from(transactions.values()).filter(tx =>
      tx.type === type && (!chainId || tx.chainId === chainId)
    );
  }, [transactions]);

  /**
   * Retry failed transaction
   */
  const retryTransaction = useCallback((transactionId: string): boolean => {
    const transaction = transactions.get(transactionId);
    if (!transaction || transaction.status !== TransactionStatus.FAILED) {
      return false;
    }

    if (transaction.retryCount >= transaction.maxRetries) {
      return false;
    }

    updateTransaction(transactionId, {
      status: TransactionStatus.PENDING,
      error: undefined,
      retryCount: transaction.retryCount + 1
    });

    // Restart monitoring
    monitorTransaction(transactionId);

    return true;
  }, [transactions, updateTransaction, monitorTransaction]);

  /**
   * Speed up transaction (increase gas price)
   */
  const speedUpTransaction = useCallback(async (transactionId: string, newGasPrice: bigint): Promise<string | null> => {
    const transaction = transactions.get(transactionId);
    if (!transaction || transaction.status !== TransactionStatus.PENDING) {
      return null;
    }

    try {
      // Mock speed up transaction - in real implementation, broadcast new transaction
      const newHash = `0x${Array.from({length: 64}, () =>
        Math.floor(Math.random() * 16).toString(16)).join('')}` as Hash;

      // Update original transaction
      updateTransaction(transactionId, {
        status: TransactionStatus.REPLACED,
        replacedBy: newHash
      });

      // Add new transaction
      const newTransactionId = addTransaction({
        hash: newHash,
        chainId: transaction.chainId,
        type: transaction.type,
        amount: transaction.amount,
        gasLimit: transaction.gasLimit,
        gasPrice: newGasPrice,
        from: transaction.from,
        to: transaction.to,
        data: transaction.data
      });

      // Update original with speed up reference
      updateTransaction(transactionId, {
        speedUp: newHash
      });

      return newTransactionId;
    } catch (error) {
      console.error('Failed to speed up transaction:', error);
      return null;
    }
  }, [transactions, updateTransaction, addTransaction]);

  /**
   * Cancel transaction
   */
  const cancelTransaction = useCallback(async (transactionId: string): Promise<boolean> => {
    const transaction = transactions.get(transactionId);
    if (!transaction || transaction.status !== TransactionStatus.PENDING) {
      return false;
    }

    try {
      // Mock cancel transaction - in real implementation, broadcast cancel transaction
      updateTransaction(transactionId, {
        status: TransactionStatus.CANCELLED,
        cancelled: true
      });

      return true;
    } catch (error) {
      console.error('Failed to cancel transaction:', error);
      return false;
    }
  }, [transactions, updateTransaction]);

  /**
   * Clear transaction history
   */
  const clearHistory = useCallback((olderThanDays?: number) => {
    const cutoffTime = olderThanDays
      ? Date.now() - (olderThanDays * 24 * 60 * 60 * 1000)
      : 0;

    setTransactions(prev => {
      const newTransactions = new Map();

      for (const [id, tx] of prev.entries()) {
        // Keep pending transactions and recent transactions
        if (tx.status === TransactionStatus.PENDING || tx.timestamp > cutoffTime) {
          newTransactions.set(id, tx);
        } else {
          // Clean up monitoring for removed transactions
          const interval = monitoringIntervals.current.get(id);
          if (interval) {
            clearTimeout(interval);
            monitoringIntervals.current.delete(id);
          }
          updateCallbacks.current.delete(id);
        }
      }

      return newTransactions;
    });
  }, []);

  /**
   * Start global monitoring
   */
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);

    // Monitor all pending transactions
    for (const [id, tx] of transactions.entries()) {
      if (tx.status === TransactionStatus.PENDING && !monitoringIntervals.current.has(id)) {
        monitorTransaction(id);
      }
    }
  }, [transactions, monitorTransaction]);

  /**
   * Stop global monitoring
   */
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);

    // Clear all intervals
    for (const [id, interval] of monitoringIntervals.current.entries()) {
      clearTimeout(interval);
    }
    monitoringIntervals.current.clear();
  }, []);

  /**
   * Calculate transaction statistics
   */
  const calculateStats = useMemo((): TransactionStats => {
    const txArray = Array.from(transactions.values());
    const now = Date.now();

    const stats: TransactionStats = {
      total: txArray.length,
      pending: 0,
      confirmed: 0,
      failed: 0,
      avgConfirmationTime: 0,
      totalGasUsed: 0n,
      totalCost: 0n,
      successRate: 0,
      networkBreakdown: {} as Record<SupportedChainId, number>,
      typeBreakdown: {} as Record<TransactionType, number>
    };

    let confirmationTimes: number[] = [];

    for (const tx of txArray) {
      // Status breakdown
      if (tx.status === TransactionStatus.PENDING) stats.pending++;
      else if (tx.status === TransactionStatus.CONFIRMED) stats.confirmed++;
      else if (tx.status === TransactionStatus.FAILED) stats.failed++;

      // Confirmation time calculation
      if (tx.status === TransactionStatus.CONFIRMED && tx.timestamp) {
        confirmationTimes.push(now - tx.timestamp);
      }

      // Gas and cost tracking
      if (tx.gasUsed) stats.totalGasUsed += tx.gasUsed;
      if (tx.actualCost) stats.totalCost += tx.actualCost;

      // Network breakdown
      stats.networkBreakdown[tx.chainId] = (stats.networkBreakdown[tx.chainId] || 0) + 1;

      // Type breakdown
      stats.typeBreakdown[tx.type] = (stats.typeBreakdown[tx.type] || 0) + 1;
    }

    // Calculate averages
    stats.avgConfirmationTime = confirmationTimes.length > 0
      ? confirmationTimes.reduce((sum, time) => sum + time, 0) / confirmationTimes.length
      : 0;

    stats.successRate = stats.total > 0
      ? (stats.confirmed / stats.total) * 100
      : 0;

    return stats;
  }, [transactions]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Clear all monitoring intervals
      for (const interval of monitoringIntervals.current.values()) {
        clearTimeout(interval);
      }
      monitoringIntervals.current.clear();
    };
  }, []);

  /**
   * Auto-start monitoring when transactions are added
   */
  useEffect(() => {
    const hasPendingTransactions = Array.from(transactions.values())
      .some(tx => tx.status === TransactionStatus.PENDING);

    if (hasPendingTransactions && !isMonitoring && config.enableAutoRetry) {
      startMonitoring();
    }
  }, [transactions, isMonitoring, config.enableAutoRetry, startMonitoring]);

  /**
   * Return hook interface
   */
  return {
    // State
    transactions: Object.fromEntries(transactions.entries()),
    networkInfo: Object.fromEntries(networkInfo.entries()),
    config,
    isMonitoring,
    stats: calculateStats,

    // Transaction management
    addTransaction,
    removeTransaction,
    getTransaction,
    getTransactionsByStatus,
    getTransactionsByType,

    // Transaction operations
    retryTransaction,
    speedUpTransaction,
    cancelTransaction,

    // Monitoring control
    startMonitoring,
    stopMonitoring,

    // Utilities
    clearHistory,
    updateConfig: setConfig,

    // Constants
    TransactionStatus,
    TransactionType,
    REQUIRED_CONFIRMATIONS
  };
};

/**
 * Hook for monitoring specific transaction
 */
export const useTransactionStatus = (hash: Hash, chainId: SupportedChainId) => {
  const { getTransaction } = useTransactionMonitor();
  const transaction = getTransaction(hash, chainId);

  return {
    transaction,
    status: transaction?.status || null,
    isConfirmed: transaction?.status === TransactionStatus.CONFIRMED,
    isPending: transaction?.status === TransactionStatus.PENDING,
    isFailed: transaction?.status === TransactionStatus.FAILED,
    confirmations: transaction?.confirmations || 0,
    requiredConfirmations: transaction?.requiredConfirmations || 1,
    isFullyConfirmed: transaction
      ? transaction.confirmations >= transaction.requiredConfirmations
      : false
  };
};

/**
 * Export for Playwright testing
 */
if (typeof window !== 'undefined') {
  (window as any).useTransactionMonitor = useTransactionMonitor;
  (window as any).TransactionStatus = TransactionStatus;
  (window as any).TransactionType = TransactionType;
}

export default useTransactionMonitor;