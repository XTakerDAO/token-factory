/**
 * NetworkConfiguration Type Definition
 *
 * Defines blockchain network settings and parameters for multi-chain token deployment.
 * Supports Ethereum, Binance Smart Chain (BSC), and XSC Network with specific configurations.
 *
 * @author Claude Code - TypeScript Interface Generator
 * @created 2025-09-26
 */

// Gas settings interface for network-specific gas configuration
export interface GasSettings {
  /** Maximum gas limit for transactions */
  gasLimit: number;

  /** Gas price in wei */
  gasPrice: bigint;

  /** Maximum fee per gas (EIP-1559) - optional */
  maxFeePerGas?: bigint;

  /** Maximum priority fee per gas (EIP-1559) - optional */
  maxPriorityFeePerGas?: bigint;
}

/**
 * Network configuration interface
 */
export interface NetworkConfiguration {
  /** Blockchain chain identifier */
  chainId: number;

  /** Human-readable network name */
  name: string;

  /** Native token symbol (ETH, BNB, XSC) */
  nativeTokenSymbol: string;

  /** RPC endpoint URLs for blockchain connection */
  rpcEndpoints: string[];

  /** Block explorer URLs for transaction viewing */
  explorerUrls: string[];

  /** Whether this is a test network */
  isTestnet: boolean;

  /** EVM version supported (shanghai, london, berlin, istanbul) */
  evmVersion: string;

  /** Network-specific gas configuration */
  gasSettings: GasSettings;
}

// Supported networks configuration
export const NETWORK_CONFIGS: Record<number, NetworkConfiguration> = {
  1: {
    chainId: 1,
    name: "Ethereum",
    nativeTokenSymbol: "ETH",
    rpcEndpoints: [
      "https://eth-mainnet.alchemyapi.io/v2/demo",
      "https://rpc.ankr.com/eth",
      "https://ethereum.publicnode.com"
    ],
    explorerUrls: ["https://etherscan.io"],
    isTestnet: false,
    evmVersion: "shanghai",
    gasSettings: {
      gasLimit: 30000000,
      gasPrice: 20000000000n, // 20 gwei
      maxFeePerGas: 30000000000n,
      maxPriorityFeePerGas: 2000000000n
    }
  },
  56: {
    chainId: 56,
    name: "Binance Smart Chain",
    nativeTokenSymbol: "BNB",
    rpcEndpoints: [
      "https://bsc-dataseed1.binance.org/",
      "https://bsc-dataseed2.binance.org/",
      "https://rpc.ankr.com/bsc"
    ],
    explorerUrls: ["https://bscscan.com", "https://bsc.tokenview.io"],
    isTestnet: false,
    evmVersion: "london",
    gasSettings: {
      gasLimit: 30000000,
      gasPrice: 5000000000n, // 5 gwei
      maxFeePerGas: 10000000000n,
      maxPriorityFeePerGas: 1000000000n
    }
  },
  520: {
    chainId: 520,
    name: "XSC Network",
    nativeTokenSymbol: "XSC",
    rpcEndpoints: [
      "https://rpc.xsc.pub",
      "wss://ws.xsc.pub"
    ],
    explorerUrls: ["https://explorer.xsc.pub"],
    isTestnet: false,
    evmVersion: "shanghai",
    gasSettings: {
      gasLimit: 30000000,
      gasPrice: 1000000000n, // 1 gwei
      maxFeePerGas: 5000000000n,
      maxPriorityFeePerGas: 500000000n
    }
  }
};

// Type for supported chain IDs
export type SupportedChainId = keyof typeof NETWORK_CONFIGS;

// Supported EVM versions
export const SUPPORTED_EVM_VERSIONS = ['shanghai', 'london', 'berlin', 'istanbul'] as const;
export type EVMVersion = typeof SUPPORTED_EVM_VERSIONS[number];

/**
 * Validation result interface
 */
export interface NetworkConfigurationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Chain ID validation
 */
export const validateChainId = (chainId: number): { isValid: boolean; error?: string } => {
  if (typeof chainId !== 'number' || !Number.isInteger(chainId)) {
    return { isValid: false, error: 'Chain ID must be a valid integer' };
  }

  if (chainId <= 0) {
    return { isValid: false, error: 'Chain ID must be positive' };
  }

  const supportedChainIds = [1, 56, 520];
  if (!supportedChainIds.includes(chainId)) {
    return { isValid: false, error: `Unsupported chain ID. Must be one of: ${supportedChainIds.join(', ')}` };
  }

  return { isValid: true };
};

/**
 * Network name validation
 */
export const validateNetworkName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Network name is required' };
  }

  if (name.trim().length === 0) {
    return { isValid: false, error: 'Network name cannot be empty' };
  }

  if (name.length > 100) {
    return { isValid: false, error: 'Network name too long (max 100 characters)' };
  }

  // Check for control characters or dangerous HTML
  if (/[\x00-\x1F\x7F-\x9F<>]/.test(name)) {
    return { isValid: false, error: 'Network name contains invalid characters' };
  }

  return { isValid: true };
};

/**
 * Native token symbol validation
 */
export const validateNativeTokenSymbol = (symbol: string): { isValid: boolean; error?: string } => {
  if (!symbol || typeof symbol !== 'string') {
    return { isValid: false, error: 'Native token symbol is required' };
  }

  if (symbol.length < 1 || symbol.length > 10) {
    return { isValid: false, error: 'Native token symbol must be 1-10 characters' };
  }

  // Must be uppercase letters only
  if (!/^[A-Z]+$/.test(symbol)) {
    return { isValid: false, error: 'Native token symbol must be uppercase letters only' };
  }

  return { isValid: true };
};

/**
 * RPC endpoints validation
 */
export const validateRPCEndpoints = (endpoints: string[]): { isValid: boolean; error?: string } => {
  if (!Array.isArray(endpoints)) {
    return { isValid: false, error: 'RPC endpoints must be an array' };
  }

  if (endpoints.length === 0) {
    return { isValid: false, error: 'At least one RPC endpoint is required' };
  }

  for (const endpoint of endpoints) {
    if (typeof endpoint !== 'string') {
      return { isValid: false, error: 'All RPC endpoints must be strings' };
    }

    try {
      const url = new URL(endpoint);
      // For mainnet, prefer HTTPS or WSS for security
      if (!['https:', 'wss:', 'http:'].includes(url.protocol)) {
        return { isValid: false, error: 'RPC endpoints must use HTTP, HTTPS, or WSS protocol' };
      }
    } catch {
      return { isValid: false, error: `Invalid RPC endpoint URL: ${endpoint}` };
    }
  }

  return { isValid: true };
};

/**
 * Explorer URLs validation
 */
export const validateExplorerUrls = (urls: string[]): { isValid: boolean; error?: string } => {
  if (!Array.isArray(urls)) {
    return { isValid: false, error: 'Explorer URLs must be an array' };
  }

  if (urls.length === 0) {
    return { isValid: false, error: 'At least one explorer URL is required' };
  }

  for (const url of urls) {
    if (typeof url !== 'string') {
      return { isValid: false, error: 'All explorer URLs must be strings' };
    }

    try {
      const urlObj = new URL(url);
      if (!['https:', 'http:'].includes(urlObj.protocol)) {
        return { isValid: false, error: 'Explorer URLs must use HTTP or HTTPS protocol' };
      }
    } catch {
      return { isValid: false, error: `Invalid explorer URL: ${url}` };
    }
  }

  return { isValid: true };
};

/**
 * EVM version validation
 */
export const validateEVMVersion = (version: string): { isValid: boolean; error?: string } => {
  if (!version || typeof version !== 'string') {
    return { isValid: false, error: 'EVM version is required' };
  }

  if (!SUPPORTED_EVM_VERSIONS.includes(version as EVMVersion)) {
    return { isValid: false, error: `Unsupported EVM version. Must be one of: ${SUPPORTED_EVM_VERSIONS.join(', ')}` };
  }

  return { isValid: true };
};

/**
 * Gas settings validation
 */
export const validateGasSettings = (gasSettings: GasSettings): { isValid: boolean; error?: string } => {
  if (!gasSettings || typeof gasSettings !== 'object') {
    return { isValid: false, error: 'Gas settings are required' };
  }

  // Validate gas limit
  if (typeof gasSettings.gasLimit !== 'number' || !Number.isInteger(gasSettings.gasLimit)) {
    return { isValid: false, error: 'Gas limit must be an integer' };
  }

  if (gasSettings.gasLimit <= 0) {
    return { isValid: false, error: 'Gas limit must be positive' };
  }

  // Validate gas price
  if (typeof gasSettings.gasPrice !== 'bigint') {
    return { isValid: false, error: 'Gas price must be a BigInt' };
  }

  if (gasSettings.gasPrice <= 0n) {
    return { isValid: false, error: 'Gas price must be positive' };
  }

  // Validate optional EIP-1559 fields
  if (gasSettings.maxFeePerGas !== undefined) {
    if (typeof gasSettings.maxFeePerGas !== 'bigint') {
      return { isValid: false, error: 'Max fee per gas must be a BigInt' };
    }
    if (gasSettings.maxFeePerGas <= 0n) {
      return { isValid: false, error: 'Max fee per gas must be positive' };
    }
  }

  if (gasSettings.maxPriorityFeePerGas !== undefined) {
    if (typeof gasSettings.maxPriorityFeePerGas !== 'bigint') {
      return { isValid: false, error: 'Max priority fee per gas must be a BigInt' };
    }
    if (gasSettings.maxPriorityFeePerGas <= 0n) {
      return { isValid: false, error: 'Max priority fee per gas must be positive' };
    }
  }

  return { isValid: true };
};

/**
 * XSC network specific constraints validation
 */
export const validateXSCNetworkConstraints = (config: Partial<NetworkConfiguration>): { isValid: boolean; error?: string } => {
  if (config.chainId !== 520) {
    return { isValid: true }; // Not XSC network
  }

  // XSC specific validations
  if (config.evmVersion && config.evmVersion !== 'shanghai') {
    return { isValid: false, error: 'XSC network requires Shanghai EVM version' };
  }

  if (config.gasSettings) {
    // XSC has specific gas limits
    if (config.gasSettings.gasLimit > 30000000) {
      return { isValid: false, error: 'XSC network gas limit cannot exceed 30,000,000' };
    }

    // XSC should have lower gas prices
    if (config.gasSettings.gasPrice > 10000000000n) { // 10 gwei
      return { isValid: false, error: 'XSC network gas price should not exceed 10 gwei' };
    }
  }

  return { isValid: true };
};

/**
 * Network switching compatibility validation
 */
export const validateNetworkSwitch = (switchScenario: { from: number; to: number }): boolean => {
  const { from, to } = switchScenario;

  // Cannot switch to same network
  if (from === to) {
    return false;
  }

  // Both networks must be supported
  const supportedNetworks = [1, 56, 520];
  if (!supportedNetworks.includes(from) || !supportedNetworks.includes(to)) {
    return false;
  }

  return true;
};

/**
 * Complete network configuration validation
 */
export const validateNetworkConfiguration = (config: Partial<NetworkConfiguration>): NetworkConfigurationValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate chain ID
  if (config.chainId !== undefined) {
    const chainIdValidation = validateChainId(config.chainId);
    if (!chainIdValidation.isValid && chainIdValidation.error) {
      errors.push(chainIdValidation.error);
    }
  } else {
    errors.push('Chain ID is required');
  }

  // Validate network name
  const nameValidation = validateNetworkName(config.name || '');
  if (!nameValidation.isValid && nameValidation.error) {
    errors.push(nameValidation.error);
  }

  // Validate native token symbol
  const symbolValidation = validateNativeTokenSymbol(config.nativeTokenSymbol || '');
  if (!symbolValidation.isValid && symbolValidation.error) {
    errors.push(symbolValidation.error);
  }

  // Validate RPC endpoints
  if (config.rpcEndpoints) {
    const rpcValidation = validateRPCEndpoints(config.rpcEndpoints);
    if (!rpcValidation.isValid && rpcValidation.error) {
      errors.push(rpcValidation.error);
    }
  } else {
    errors.push('RPC endpoints are required');
  }

  // Validate explorer URLs
  if (config.explorerUrls) {
    const explorerValidation = validateExplorerUrls(config.explorerUrls);
    if (!explorerValidation.isValid && explorerValidation.error) {
      errors.push(explorerValidation.error);
    }
  } else {
    errors.push('Explorer URLs are required');
  }

  // Validate testnet flag
  if (config.isTestnet !== undefined) {
    if (typeof config.isTestnet !== 'boolean') {
      errors.push('Testnet flag must be a boolean');
    }
  } else {
    errors.push('Testnet flag is required');
  }

  // Validate EVM version
  const evmValidation = validateEVMVersion(config.evmVersion || '');
  if (!evmValidation.isValid && evmValidation.error) {
    errors.push(evmValidation.error);
  }

  // Validate gas settings
  if (config.gasSettings) {
    const gasValidation = validateGasSettings(config.gasSettings);
    if (!gasValidation.isValid && gasValidation.error) {
      errors.push(gasValidation.error);
    }
  } else {
    errors.push('Gas settings are required');
  }

  // XSC specific validations
  const xscValidation = validateXSCNetworkConstraints(config);
  if (!xscValidation.isValid && xscValidation.error) {
    errors.push(xscValidation.error);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Get network configuration by chain ID
 */
export const getNetworkConfig = (chainId: SupportedChainId): NetworkConfiguration | undefined => {
  return NETWORK_CONFIGS[chainId];
};

/**
 * Get all supported network configurations
 */
export const getAllNetworkConfigs = (): NetworkConfiguration[] => {
  return Object.values(NETWORK_CONFIGS);
};

/**
 * Check if chain ID is supported
 */
export const isSupportedChainId = (chainId: number): chainId is SupportedChainId => {
  return chainId in NETWORK_CONFIGS;
};

/**
 * Export validation functions for browser window global access
 * This is used by Playwright tests to access validation functions
 */
if (typeof window !== 'undefined') {
  (window as any).validateNetworkConfiguration = validateNetworkConfiguration;
  (window as any).validateCompleteNetworkConfiguration = validateNetworkConfiguration;
  (window as any).validateXSCNetworkConstraints = validateXSCNetworkConstraints;
  (window as any).validateNetworkSwitch = validateNetworkSwitch;
}

// Type guard for runtime type checking
export const isNetworkConfiguration = (obj: any): obj is NetworkConfiguration => {
  return obj &&
    typeof obj.chainId === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.nativeTokenSymbol === 'string' &&
    Array.isArray(obj.rpcEndpoints) &&
    Array.isArray(obj.explorerUrls) &&
    typeof obj.isTestnet === 'boolean' &&
    typeof obj.evmVersion === 'string' &&
    obj.gasSettings &&
    typeof obj.gasSettings.gasLimit === 'number' &&
    typeof obj.gasSettings.gasPrice === 'bigint';
};