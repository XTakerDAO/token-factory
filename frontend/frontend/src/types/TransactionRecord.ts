/**
 * TransactionRecord Type Definition
 *
 * History of blockchain transactions with comprehensive validation rules
 * and multi-chain support for transaction tracking and monitoring.
 *
 * @author Claude Code - TypeScript Interface Generator
 * @created 2025-09-26
 */

/**
 * Transaction types supported by the platform
 */
export enum TransactionType {
  TOKEN_DEPLOYMENT = 'token_deployment',
  SERVICE_FEE_PAYMENT = 'service_fee_payment',
  NETWORK_SWITCH = 'network_switch'
}

/**
 * Transaction status with clear state transitions
 */
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed'
}

/**
 * Transaction record interface
 */
export interface TransactionRecord {
  /** Unique transaction identifier */
  id: string;

  /** Blockchain transaction hash */
  hash: string;

  /** Type of transaction */
  type: TransactionType;

  /** Current transaction status */
  status: TransactionStatus;

  /** Network where transaction occurred */
  networkId: number;

  /** Gas consumed by transaction */
  gasUsed?: bigint;

  /** Gas price used for transaction */
  gasPrice?: bigint;

  /** Platform service fee paid */
  serviceFee?: bigint;

  /** Block number containing transaction */
  blockNumber?: number;

  /** Transaction submission timestamp */
  timestamp: Date;

  /** Deployed token contract address (for deployment transactions) */
  tokenAddress?: string;

  /** Error details if transaction failed */
  errorMessage?: string;

  /** From address (transaction sender) */
  from?: string;

  /** To address (transaction recipient) */
  to?: string;

  /** Transaction value in wei */
  value?: bigint;

  /** Transaction data/input */
  data?: string;

  /** Number of confirmations */
  confirmations?: number;
}

/**
 * Transaction receipt interface for confirmed transactions
 */
export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  gasUsed: bigint;
  gasPrice: bigint;
  status: TransactionStatus;
  logs: TransactionLog[];
  contractAddress?: string;
}

/**
 * Transaction log interface
 */
export interface TransactionLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
}

/**
 * Transaction validation result interface
 */
export interface TransactionRecordValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Transaction filter interface
 */
export interface TransactionFilter {
  networkId?: number;
  type?: TransactionType;
  status?: TransactionStatus;
  fromAddress?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Transaction statistics interface
 */
export interface TransactionStatistics {
  total: number;
  pending: number;
  confirmed: number;
  failed: number;
  totalGasUsed: bigint;
  totalServiceFees: bigint;
  averageGasPrice: bigint;
}

// Supported networks for transactions
const SUPPORTED_NETWORKS = [1, 56, 520]; // ETH, BSC, XSC

// Network symbols
const NETWORK_SYMBOLS: Record<number, string> = {
  1: 'ETH',
  56: 'BNB',
  520: 'XSC'
};

/**
 * Transaction ID validation
 */
export const validateTransactionId = (id: string): { isValid: boolean; error?: string } => {
  if (!id || typeof id !== 'string') {
    return { isValid: false, error: 'Transaction ID is required' };
  }

  if (id.length < 1 || id.length > 100) {
    return { isValid: false, error: 'Transaction ID must be 1-100 characters' };
  }

  // Basic format validation (alphanumeric with hyphens and underscores)
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return { isValid: false, error: 'Transaction ID contains invalid characters' };
  }

  return { isValid: true };
};

/**
 * Transaction hash validation
 */
export const validateTransactionHash = (hash: string): { isValid: boolean; error?: string } => {
  if (!hash || typeof hash !== 'string') {
    return { isValid: false, error: 'Transaction hash is required' };
  }

  // Ethereum transaction hash format (0x followed by 64 hex characters)
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    return { isValid: false, error: 'Invalid transaction hash format' };
  }

  return { isValid: true };
};

/**
 * Transaction type validation
 */
export const validateTransactionType = (type: TransactionType): { isValid: boolean; error?: string } => {
  if (!type || typeof type !== 'string') {
    return { isValid: false, error: 'Transaction type is required' };
  }

  if (!Object.values(TransactionType).includes(type)) {
    return { isValid: false, error: `Invalid transaction type. Must be one of: ${Object.values(TransactionType).join(', ')}` };
  }

  return { isValid: true };
};

/**
 * Transaction status validation
 */
export const validateTransactionStatus = (status: TransactionStatus): { isValid: boolean; error?: string } => {
  if (!status || typeof status !== 'string') {
    return { isValid: false, error: 'Transaction status is required' };
  }

  if (!Object.values(TransactionStatus).includes(status)) {
    return { isValid: false, error: `Invalid transaction status. Must be one of: ${Object.values(TransactionStatus).join(', ')}` };
  }

  return { isValid: true };
};

/**
 * Network ID validation
 */
export const validateNetworkId = (networkId: number): { isValid: boolean; error?: string } => {
  if (typeof networkId !== 'number' || !Number.isInteger(networkId)) {
    return { isValid: false, error: 'Network ID must be an integer' };
  }

  if (!SUPPORTED_NETWORKS.includes(networkId)) {
    return { isValid: false, error: `Unsupported network ID. Must be one of: ${SUPPORTED_NETWORKS.join(', ')}` };
  }

  return { isValid: true };
};

/**
 * Gas validation (gas used, gas price)
 */
export const validateGas = (gas?: bigint, fieldName: string = 'Gas'): { isValid: boolean; error?: string } => {
  if (!gas) {
    return { isValid: true }; // Optional field
  }

  if (typeof gas !== 'bigint') {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (gas < 0n) {
    return { isValid: false, error: `${fieldName} cannot be negative` };
  }

  // Reasonable upper limits
  const maxGasUsed = 50000000n; // 50M gas
  const maxGasPrice = 1000000000000n; // 1000 gwei

  if (fieldName.toLowerCase().includes('used') && gas > maxGasUsed) {
    return { isValid: false, error: `${fieldName} exceeds reasonable maximum (50M gas)` };
  }

  if (fieldName.toLowerCase().includes('price') && gas > maxGasPrice) {
    return { isValid: false, error: `${fieldName} exceeds reasonable maximum (1000 gwei)` };
  }

  return { isValid: true };
};

/**
 * Block number validation
 */
export const validateBlockNumber = (blockNumber?: number): { isValid: boolean; error?: string } => {
  if (!blockNumber) {
    return { isValid: true }; // Optional field
  }

  if (typeof blockNumber !== 'number' || !Number.isInteger(blockNumber)) {
    return { isValid: false, error: 'Block number must be an integer' };
  }

  if (blockNumber <= 0) {
    return { isValid: false, error: 'Block number must be positive' };
  }

  // Reasonable upper limit check (current Ethereum block is ~18M as of 2023)
  if (blockNumber > 100000000) {
    return { isValid: false, error: 'Block number exceeds reasonable maximum' };
  }

  return { isValid: true };
};

/**
 * Ethereum address validation
 */
export const validateAddress = (address?: string, fieldName: string = 'Address'): { isValid: boolean; error?: string } => {
  if (!address) {
    return { isValid: true }; // Optional field
  }

  if (typeof address !== 'string') {
    return { isValid: false, error: `${fieldName} must be a string` };
  }

  // Ethereum address format validation
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { isValid: false, error: `Invalid ${fieldName.toLowerCase()} format` };
  }

  return { isValid: true };
};

/**
 * Transaction value validation
 */
export const validateTransactionValue = (value?: bigint): { isValid: boolean; error?: string } => {
  if (!value) {
    return { isValid: true }; // Optional field
  }

  if (typeof value !== 'bigint') {
    return { isValid: false, error: 'Transaction value must be a valid number' };
  }

  if (value < 0n) {
    return { isValid: false, error: 'Transaction value cannot be negative' };
  }

  return { isValid: true };
};

/**
 * Transaction data validation
 */
export const validateTransactionData = (data?: string): { isValid: boolean; error?: string } => {
  if (!data) {
    return { isValid: true }; // Optional field
  }

  if (typeof data !== 'string') {
    return { isValid: false, error: 'Transaction data must be a string' };
  }

  // Must be hex string
  if (!/^0x[a-fA-F0-9]*$/.test(data)) {
    return { isValid: false, error: 'Transaction data must be valid hex string' };
  }

  return { isValid: true };
};

/**
 * Confirmation count validation
 */
export const validateConfirmations = (confirmations?: number): { isValid: boolean; error?: string } => {
  if (!confirmations) {
    return { isValid: true }; // Optional field
  }

  if (typeof confirmations !== 'number' || !Number.isInteger(confirmations)) {
    return { isValid: false, error: 'Confirmations must be an integer' };
  }

  if (confirmations < 0) {
    return { isValid: false, error: 'Confirmations cannot be negative' };
  }

  return { isValid: true };
};

/**
 * Transaction record consistency validation
 */
export const validateTransactionConsistency = (record: TransactionRecord): { isValid: boolean; error?: string; warnings?: string[] } => {
  const warnings: string[] = [];

  // Deployment transactions should have token address when confirmed
  if (record.type === TransactionType.TOKEN_DEPLOYMENT &&
      record.status === TransactionStatus.CONFIRMED &&
      !record.tokenAddress) {
    warnings.push('Confirmed token deployment transaction should have token address');
  }

  // Failed transactions should have error message
  if (record.status === TransactionStatus.FAILED && !record.errorMessage) {
    warnings.push('Failed transaction should have error message');
  }

  // Confirmed transactions should have block number and gas info
  if (record.status === TransactionStatus.CONFIRMED) {
    if (!record.blockNumber) {
      warnings.push('Confirmed transaction should have block number');
    }
    if (!record.gasUsed) {
      warnings.push('Confirmed transaction should have gas used information');
    }
  }

  // Pending transactions shouldn't have block number or gas used
  if (record.status === TransactionStatus.PENDING) {
    if (record.blockNumber || record.gasUsed) {
      warnings.push('Pending transaction should not have block number or gas used');
    }
  }

  return { isValid: true, warnings };
};

/**
 * Complete transaction record validation
 */
export const validateTransactionRecord = (record: Partial<TransactionRecord>): TransactionRecordValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  const idValidation = validateTransactionId(record.id || '');
  if (!idValidation.isValid && idValidation.error) {
    errors.push(idValidation.error);
  }

  const hashValidation = validateTransactionHash(record.hash || '');
  if (!hashValidation.isValid && hashValidation.error) {
    errors.push(hashValidation.error);
  }

  if (record.type) {
    const typeValidation = validateTransactionType(record.type);
    if (!typeValidation.isValid && typeValidation.error) {
      errors.push(typeValidation.error);
    }
  } else {
    errors.push('Transaction type is required');
  }

  if (record.status) {
    const statusValidation = validateTransactionStatus(record.status);
    if (!statusValidation.isValid && statusValidation.error) {
      errors.push(statusValidation.error);
    }
  } else {
    errors.push('Transaction status is required');
  }

  if (record.networkId) {
    const networkValidation = validateNetworkId(record.networkId);
    if (!networkValidation.isValid && networkValidation.error) {
      errors.push(networkValidation.error);
    }
  } else {
    errors.push('Network ID is required');
  }

  if (!record.timestamp) {
    errors.push('Transaction timestamp is required');
  } else if (!(record.timestamp instanceof Date)) {
    errors.push('Transaction timestamp must be a valid Date');
  }

  // Validate optional fields
  const gasUsedValidation = validateGas(record.gasUsed, 'Gas used');
  if (!gasUsedValidation.isValid && gasUsedValidation.error) {
    errors.push(gasUsedValidation.error);
  }

  const gasPriceValidation = validateGas(record.gasPrice, 'Gas price');
  if (!gasPriceValidation.isValid && gasPriceValidation.error) {
    errors.push(gasPriceValidation.error);
  }

  const serviceFeeValidation = validateGas(record.serviceFee, 'Service fee');
  if (!serviceFeeValidation.isValid && serviceFeeValidation.error) {
    errors.push(serviceFeeValidation.error);
  }

  const blockValidation = validateBlockNumber(record.blockNumber);
  if (!blockValidation.isValid && blockValidation.error) {
    errors.push(blockValidation.error);
  }

  const tokenAddressValidation = validateAddress(record.tokenAddress, 'Token address');
  if (!tokenAddressValidation.isValid && tokenAddressValidation.error) {
    errors.push(tokenAddressValidation.error);
  }

  const fromValidation = validateAddress(record.from, 'From address');
  if (!fromValidation.isValid && fromValidation.error) {
    errors.push(fromValidation.error);
  }

  const toValidation = validateAddress(record.to, 'To address');
  if (!toValidation.isValid && toValidation.error) {
    errors.push(toValidation.error);
  }

  const valueValidation = validateTransactionValue(record.value);
  if (!valueValidation.isValid && valueValidation.error) {
    errors.push(valueValidation.error);
  }

  const dataValidation = validateTransactionData(record.data);
  if (!dataValidation.isValid && dataValidation.error) {
    errors.push(dataValidation.error);
  }

  const confirmationsValidation = validateConfirmations(record.confirmations);
  if (!confirmationsValidation.isValid && confirmationsValidation.error) {
    errors.push(confirmationsValidation.error);
  }

  // Validate consistency if all required fields are present
  if (isCompleteTransactionRecord(record)) {
    const consistencyValidation = validateTransactionConsistency(record);
    if (consistencyValidation.warnings) {
      warnings.push(...consistencyValidation.warnings);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Create new transaction record
 */
export const createTransactionRecord = (
  hash: string,
  type: TransactionType,
  networkId: number,
  overrides: Partial<TransactionRecord> = {}
): TransactionRecord => {
  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    hash,
    type,
    status: TransactionStatus.PENDING,
    networkId,
    timestamp: new Date(),
    ...overrides
  };
};

/**
 * Update transaction record with receipt data
 */
export const updateTransactionWithReceipt = (
  record: TransactionRecord,
  receipt: TransactionReceipt
): TransactionRecord => {
  return {
    ...record,
    status: receipt.status,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed,
    gasPrice: receipt.gasPrice,
    tokenAddress: receipt.contractAddress,
    confirmations: 1 // Initial confirmation count
  };
};

/**
 * Format transaction value for display
 */
export const formatTransactionValue = (value: bigint, networkId: number): string => {
  const symbol = NETWORK_SYMBOLS[networkId] || 'ETH';
  const tokenAmount = Number(value) / 1e18;
  return `${tokenAmount.toFixed(6)} ${symbol}`;
};

/**
 * Get transaction status icon
 */
export const getTransactionStatusIcon = (status: TransactionStatus): string => {
  switch (status) {
    case TransactionStatus.PENDING:
      return '⏳';
    case TransactionStatus.CONFIRMED:
      return '✅';
    case TransactionStatus.FAILED:
      return '❌';
    default:
      return '?';
  }
};

/**
 * Check if transaction is complete
 */
export const isCompleteTransactionRecord = (record: Partial<TransactionRecord>): record is TransactionRecord => {
  return !!(
    record.id &&
    record.hash &&
    record.type &&
    record.status &&
    record.networkId !== undefined &&
    record.timestamp
  );
};

/**
 * Check if transaction is final (confirmed or failed)
 */
export const isTransactionFinal = (status: TransactionStatus): boolean => {
  return status === TransactionStatus.CONFIRMED || status === TransactionStatus.FAILED;
};

/**
 * Filter transactions based on criteria
 */
export const filterTransactions = (transactions: TransactionRecord[], filter: TransactionFilter): TransactionRecord[] => {
  let filtered = [...transactions];

  if (filter.networkId) {
    filtered = filtered.filter(tx => tx.networkId === filter.networkId);
  }

  if (filter.type) {
    filtered = filtered.filter(tx => tx.type === filter.type);
  }

  if (filter.status) {
    filtered = filtered.filter(tx => tx.status === filter.status);
  }

  if (filter.fromAddress) {
    filtered = filtered.filter(tx => tx.from === filter.fromAddress);
  }

  if (filter.dateFrom) {
    filtered = filtered.filter(tx => tx.timestamp >= filter.dateFrom!);
  }

  if (filter.dateTo) {
    filtered = filtered.filter(tx => tx.timestamp <= filter.dateTo!);
  }

  // Sort by timestamp descending
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Apply pagination
  if (filter.offset) {
    filtered = filtered.slice(filter.offset);
  }

  if (filter.limit) {
    filtered = filtered.slice(0, filter.limit);
  }

  return filtered;
};

/**
 * Calculate transaction statistics
 */
export const calculateTransactionStatistics = (transactions: TransactionRecord[]): TransactionStatistics => {
  const stats: TransactionStatistics = {
    total: transactions.length,
    pending: 0,
    confirmed: 0,
    failed: 0,
    totalGasUsed: 0n,
    totalServiceFees: 0n,
    averageGasPrice: 0n
  };

  let totalGasPrice = 0n;
  let gasPriceCount = 0;

  for (const tx of transactions) {
    // Count by status
    if (tx.status === TransactionStatus.PENDING) stats.pending++;
    if (tx.status === TransactionStatus.CONFIRMED) stats.confirmed++;
    if (tx.status === TransactionStatus.FAILED) stats.failed++;

    // Sum gas used
    if (tx.gasUsed) {
      stats.totalGasUsed += tx.gasUsed;
    }

    // Sum service fees
    if (tx.serviceFee) {
      stats.totalServiceFees += tx.serviceFee;
    }

    // Collect gas prices for average
    if (tx.gasPrice) {
      totalGasPrice += tx.gasPrice;
      gasPriceCount++;
    }
  }

  // Calculate average gas price
  if (gasPriceCount > 0) {
    stats.averageGasPrice = totalGasPrice / BigInt(gasPriceCount);
  }

  return stats;
};

/**
 * Export validation functions for browser window global access
 * This is used by Playwright tests to access validation functions
 */
if (typeof window !== 'undefined') {
  (window as any).validateTransactionRecord = validateTransactionRecord;
  (window as any).validateTransactionId = validateTransactionId;
  (window as any).validateTransactionHash = validateTransactionHash;
  (window as any).validateTransactionType = validateTransactionType;
  (window as any).validateTransactionStatus = validateTransactionStatus;
}

// Type guard for runtime type checking
export const isTransactionRecord = (obj: any): obj is TransactionRecord => {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.hash === 'string' &&
    Object.values(TransactionType).includes(obj.type) &&
    Object.values(TransactionStatus).includes(obj.status) &&
    typeof obj.networkId === 'number' &&
    obj.timestamp instanceof Date;
};