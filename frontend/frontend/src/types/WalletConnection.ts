/**
 * WalletConnection Type Definition
 *
 * Current user wallet connection state with comprehensive validation rules
 * and viem/wagmi integration support for multi-chain wallet management.
 *
 * @author Claude Code - TypeScript Interface Generator
 * @created 2025-09-26
 */

/**
 * Wallet connection state interface
 */
export interface WalletConnection {
  /** Connected wallet address */
  address?: string;

  /** Current wallet network chain ID */
  chainId?: number;

  /** Connection status */
  isConnected: boolean;

  /** Wallet connector type (MetaMask, WalletConnect, etc.) */
  connector?: string;

  /** Native token balance in wei */
  balance?: bigint;

  /** Last successful connection timestamp */
  lastConnected?: Date;
}

/**
 * Wallet connection state transitions
 */
export enum WalletConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  SWITCHING = 'switching',
  ERROR = 'error'
}

/**
 * Supported wallet connector types
 */
export enum WalletConnectorType {
  METAMASK = 'metamask',
  WALLET_CONNECT = 'walletconnect',
  COINBASE_WALLET = 'coinbase',
  INJECTED = 'injected',
  SAFE = 'safe'
}

/**
 * Wallet connection error types
 */
export enum WalletConnectionError {
  NO_WALLET = 'no_wallet',
  USER_REJECTED = 'user_rejected',
  UNSUPPORTED_NETWORK = 'unsupported_network',
  NETWORK_SWITCH_FAILED = 'network_switch_failed',
  CONNECTION_TIMEOUT = 'connection_timeout',
  BALANCE_FETCH_FAILED = 'balance_fetch_failed'
}

/**
 * Wallet connection validation result
 */
export interface WalletConnectionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Network switch request interface
 */
export interface NetworkSwitchRequest {
  fromChainId: number;
  toChainId: number;
  userAddress: string;
}

/**
 * Wallet balance info interface
 */
export interface WalletBalanceInfo {
  balance: bigint;
  formattedBalance: string;
  symbol: string;
  isLoading: boolean;
  lastUpdated: Date;
}

// Supported networks for wallet connections
const SUPPORTED_CHAIN_IDS = [1, 56, 520]; // ETH, BSC, XSC

/**
 * Wallet address validation
 */
export const validateWalletAddress = (address?: string): { isValid: boolean; error?: string } => {
  if (!address) {
    return { isValid: true }; // Address is optional when disconnected
  }

  if (typeof address !== 'string') {
    return { isValid: false, error: 'Wallet address must be a string' };
  }

  // Basic Ethereum address format validation
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { isValid: false, error: 'Invalid wallet address format' };
  }

  // Check for zero address
  if (address === '0x0000000000000000000000000000000000000000') {
    return { isValid: false, error: 'Wallet address cannot be zero address' };
  }

  return { isValid: true };
};

/**
 * Chain ID validation for wallet connections
 */
export const validateChainId = (chainId?: number): { isValid: boolean; error?: string } => {
  if (!chainId) {
    return { isValid: true }; // Chain ID is optional when disconnected
  }

  if (typeof chainId !== 'number' || !Number.isInteger(chainId)) {
    return { isValid: false, error: 'Chain ID must be an integer' };
  }

  if (chainId <= 0) {
    return { isValid: false, error: 'Chain ID must be positive' };
  }

  if (!SUPPORTED_CHAIN_IDS.includes(chainId)) {
    return { isValid: false, error: `Unsupported chain ID. Must be one of: ${SUPPORTED_CHAIN_IDS.join(', ')}` };
  }

  return { isValid: true };
};

/**
 * Connection status validation
 */
export const validateConnectionStatus = (isConnected: boolean): { isValid: boolean; error?: string } => {
  if (typeof isConnected !== 'boolean') {
    return { isValid: false, error: 'Connection status must be a boolean' };
  }

  return { isValid: true };
};

/**
 * Wallet connector validation
 */
export const validateConnector = (connector?: string): { isValid: boolean; error?: string } => {
  if (!connector) {
    return { isValid: true }; // Connector is optional when disconnected
  }

  if (typeof connector !== 'string') {
    return { isValid: false, error: 'Connector type must be a string' };
  }

  const supportedConnectors = Object.values(WalletConnectorType);
  if (!supportedConnectors.includes(connector as WalletConnectorType)) {
    return { isValid: false, error: `Unsupported connector type. Must be one of: ${supportedConnectors.join(', ')}` };
  }

  return { isValid: true };
};

/**
 * Wallet balance validation
 */
export const validateBalance = (balance?: bigint): { isValid: boolean; error?: string } => {
  if (!balance) {
    return { isValid: true }; // Balance is optional when disconnected or loading
  }

  if (typeof balance !== 'bigint') {
    return { isValid: false, error: 'Balance must be a valid number' };
  }

  if (balance < 0n) {
    return { isValid: false, error: 'Balance cannot be negative' };
  }

  return { isValid: true };
};

/**
 * Last connected timestamp validation
 */
export const validateLastConnected = (lastConnected?: Date): { isValid: boolean; error?: string } => {
  if (!lastConnected) {
    return { isValid: true }; // Optional field
  }

  if (!(lastConnected instanceof Date)) {
    return { isValid: false, error: 'Last connected must be a valid Date' };
  }

  if (lastConnected > new Date()) {
    return { isValid: false, error: 'Last connected cannot be in the future' };
  }

  return { isValid: true };
};

/**
 * Wallet connection consistency validation
 */
export const validateWalletConnectionConsistency = (connection: WalletConnection): { isValid: boolean; error?: string; warnings?: string[] } => {
  const warnings: string[] = [];

  // If connected, address and chainId should be present
  if (connection.isConnected) {
    if (!connection.address) {
      return { isValid: false, error: 'Address is required when wallet is connected' };
    }

    if (!connection.chainId) {
      return { isValid: false, error: 'Chain ID is required when wallet is connected' };
    }

    if (!connection.connector) {
      warnings.push('Connector type should be specified when wallet is connected');
    }

    if (!connection.lastConnected) {
      warnings.push('Last connected timestamp should be recorded when wallet is connected');
    }

    if (!connection.balance) {
      warnings.push('Balance information is not available - this might affect transaction preparation');
    }
  } else {
    // If disconnected, optional fields should be cleared
    if (connection.address || connection.chainId || connection.connector || connection.balance) {
      warnings.push('Connection state inconsistent - wallet appears disconnected but has connection data');
    }
  }

  return { isValid: true, warnings };
};

/**
 * Complete wallet connection validation
 */
export const validateWalletConnection = (connection: Partial<WalletConnection>): WalletConnectionValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate connection status (required)
  if (connection.isConnected !== undefined) {
    const statusValidation = validateConnectionStatus(connection.isConnected);
    if (!statusValidation.isValid && statusValidation.error) {
      errors.push(statusValidation.error);
    }
  } else {
    errors.push('Connection status is required');
  }

  // Validate address
  const addressValidation = validateWalletAddress(connection.address);
  if (!addressValidation.isValid && addressValidation.error) {
    errors.push(addressValidation.error);
  }

  // Validate chain ID
  const chainIdValidation = validateChainId(connection.chainId);
  if (!chainIdValidation.isValid && chainIdValidation.error) {
    errors.push(chainIdValidation.error);
  }

  // Validate connector
  const connectorValidation = validateConnector(connection.connector);
  if (!connectorValidation.isValid && connectorValidation.error) {
    errors.push(connectorValidation.error);
  }

  // Validate balance
  const balanceValidation = validateBalance(connection.balance);
  if (!balanceValidation.isValid && balanceValidation.error) {
    errors.push(balanceValidation.error);
  }

  // Validate last connected timestamp
  const lastConnectedValidation = validateLastConnected(connection.lastConnected);
  if (!lastConnectedValidation.isValid && lastConnectedValidation.error) {
    errors.push(lastConnectedValidation.error);
  }

  // Validate consistency if all required fields are present
  if (isCompleteWalletConnection(connection)) {
    const consistencyValidation = validateWalletConnectionConsistency(connection);
    if (!consistencyValidation.isValid && consistencyValidation.error) {
      errors.push(consistencyValidation.error);
    }
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
 * Network switch validation
 */
export const validateNetworkSwitch = (switchRequest: NetworkSwitchRequest): { isValid: boolean; error?: string } => {
  // Validate from chain ID
  const fromChainValidation = validateChainId(switchRequest.fromChainId);
  if (!fromChainValidation.isValid) {
    return { isValid: false, error: `Invalid source chain ID: ${fromChainValidation.error}` };
  }

  // Validate to chain ID
  const toChainValidation = validateChainId(switchRequest.toChainId);
  if (!toChainValidation.isValid) {
    return { isValid: false, error: `Invalid target chain ID: ${toChainValidation.error}` };
  }

  // Cannot switch to the same network
  if (switchRequest.fromChainId === switchRequest.toChainId) {
    return { isValid: false, error: 'Cannot switch to the same network' };
  }

  // Validate user address
  const addressValidation = validateWalletAddress(switchRequest.userAddress);
  if (!addressValidation.isValid) {
    return { isValid: false, error: `Invalid user address: ${addressValidation.error}` };
  }

  return { isValid: true };
};

/**
 * Create default wallet connection state
 */
export const createDefaultWalletConnection = (): WalletConnection => {
  return {
    isConnected: false
  };
};

/**
 * Create connected wallet connection state
 */
export const createConnectedWalletConnection = (
  address: string,
  chainId: number,
  connector: WalletConnectorType,
  balance?: bigint
): WalletConnection => {
  return {
    address,
    chainId,
    isConnected: true,
    connector,
    balance,
    lastConnected: new Date()
  };
};

/**
 * Format wallet balance for display
 */
export const formatWalletBalance = (balance: bigint, symbol: string, decimals: number = 18): string => {
  const tokenAmount = Number(balance) / Math.pow(10, decimals);
  return `${tokenAmount.toFixed(4)} ${symbol}`;
};

/**
 * Get network symbol by chain ID
 */
export const getNetworkSymbol = (chainId: number): string => {
  const symbols: Record<number, string> = {
    1: 'ETH',
    56: 'BNB',
    520: 'XSC'
  };
  return symbols[chainId] || 'ETH';
};

/**
 * Get wallet balance info
 */
export const getWalletBalanceInfo = (
  connection: WalletConnection,
  isLoading: boolean = false
): WalletBalanceInfo => {
  const symbol = connection.chainId ? getNetworkSymbol(connection.chainId) : 'ETH';
  const formattedBalance = connection.balance ? formatWalletBalance(connection.balance, symbol) : '0.0000';

  return {
    balance: connection.balance || 0n,
    formattedBalance,
    symbol,
    isLoading,
    lastUpdated: new Date()
  };
};

/**
 * Check if wallet has sufficient balance for transaction
 */
export const hasSufficientBalance = (
  walletBalance: bigint,
  requiredAmount: bigint,
  includeGasBuffer: boolean = true
): boolean => {
  let totalRequired = requiredAmount;

  if (includeGasBuffer) {
    // Add 20% buffer for gas costs
    const gasBuffer = requiredAmount / 5n; // 20%
    totalRequired += gasBuffer;
  }

  return walletBalance >= totalRequired;
};

/**
 * Check if wallet connection is complete
 */
export const isCompleteWalletConnection = (connection: Partial<WalletConnection>): connection is WalletConnection => {
  return connection.isConnected !== undefined;
};

/**
 * Check if wallet is connected and ready for transactions
 */
export const isWalletReadyForTransaction = (connection: WalletConnection): boolean => {
  return connection.isConnected &&
         !!connection.address &&
         !!connection.chainId &&
         SUPPORTED_CHAIN_IDS.includes(connection.chainId);
};

/**
 * Get connection state enum from wallet connection
 */
export const getConnectionState = (connection: WalletConnection): WalletConnectionState => {
  if (!connection.isConnected) {
    return WalletConnectionState.DISCONNECTED;
  }

  if (connection.isConnected && connection.address && connection.chainId) {
    return WalletConnectionState.CONNECTED;
  }

  // In practice, connecting/switching states would be managed by the wallet provider
  return WalletConnectionState.CONNECTING;
};

/**
 * Export validation functions for browser window global access
 * This is used by Playwright tests to access validation functions
 */
if (typeof window !== 'undefined') {
  (window as any).validateWalletConnection = validateWalletConnection;
  (window as any).validateWalletAddress = validateWalletAddress;
  (window as any).validateChainId = validateChainId;
  (window as any).validateConnectionStatus = validateConnectionStatus;
  (window as any).validateConnector = validateConnector;
  (window as any).validateNetworkSwitch = validateNetworkSwitch;
  (window as any).isWalletReadyForTransaction = isWalletReadyForTransaction;
}

// Type guard for runtime type checking
export const isWalletConnection = (obj: any): obj is WalletConnection => {
  return obj &&
    typeof obj.isConnected === 'boolean' &&
    (obj.address === undefined || typeof obj.address === 'string') &&
    (obj.chainId === undefined || typeof obj.chainId === 'number') &&
    (obj.connector === undefined || typeof obj.connector === 'string') &&
    (obj.balance === undefined || typeof obj.balance === 'bigint') &&
    (obj.lastConnected === undefined || obj.lastConnected instanceof Date);
};