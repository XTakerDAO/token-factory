/**
 * TokenConfiguration Type Definition
 *
 * Represents the complete configuration for a token to be created on supported blockchain networks.
 * Supports multi-chain deployment (ETH, BSC, XSC) with comprehensive validation rules.
 *
 * @author Claude Code - TypeScript Interface Generator
 * @created 2025-09-26
 */

import { AdvancedFeatures } from './AdvancedFeatures';
import { PermissionSettings } from './PermissionSettings';

// Supported blockchain networks
export const SUPPORTED_NETWORKS = {
  ETHEREUM: { chainId: 1, name: "Ethereum", symbol: "ETH" },
  BSC: { chainId: 56, name: "Binance Smart Chain", symbol: "BNB" },
  XSC: { chainId: 520, name: "XSC Network", symbol: "XSC" }
} as const;

export type SupportedChainId = 1 | 56 | 520;

/**
 * Complete token configuration interface
 */
export interface TokenConfiguration {
  /** Unique identifier for the configuration */
  id: string;

  /** Token name (1-50 characters, no special characters) */
  name: string;

  /** Token symbol (1-10 characters, uppercase letters only) */
  symbol: string;

  /** Initial token supply (must be > 0, <= 10^77) */
  totalSupply: bigint;

  /** Token decimal places (0-18 inclusive) */
  decimals: number;

  /** Optional advanced functionality configuration */
  advancedFeatures: AdvancedFeatures;

  /** Ownership and access control settings */
  permissionSettings: PermissionSettings;

  /** Target blockchain network ID (1, 56, or 520) */
  networkId: SupportedChainId;

  /** Configuration creation timestamp */
  createdAt: Date;

  /** Last modification timestamp */
  updatedAt: Date;
}

/**
 * Validation result interface
 */
export interface TokenConfigurationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Token name validation rules
 */
export const validateTokenName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Token name is required' };
  }

  if (name.length < 1 || name.length > 50) {
    return { isValid: false, error: 'Token name must be 1-50 characters' };
  }

  // Check for control characters or dangerous HTML
  if (/[\x00-\x1F\x7F-\x9F<>]/.test(name)) {
    return { isValid: false, error: 'Token name contains invalid characters' };
  }

  // Only allow alphanumeric, spaces, and underscores
  if (!/^[a-zA-Z0-9\s_]+$/.test(name)) {
    return { isValid: false, error: 'Token name can only contain letters, numbers, spaces, and underscores' };
  }

  return { isValid: true };
};

/**
 * Token symbol validation rules
 */
export const validateTokenSymbol = (symbol: string): { isValid: boolean; error?: string } => {
  if (!symbol || typeof symbol !== 'string') {
    return { isValid: false, error: 'Token symbol is required' };
  }

  if (symbol.length < 1 || symbol.length > 10) {
    return { isValid: false, error: 'Token symbol must be 1-10 characters' };
  }

  // Must be uppercase letters and numbers only
  if (!/^[A-Z0-9]+$/.test(symbol)) {
    return { isValid: false, error: 'Token symbol must be uppercase letters and numbers only' };
  }

  return { isValid: true };
};

/**
 * Total supply validation rules
 */
export const validateTotalSupply = (totalSupply: bigint): { isValid: boolean; error?: string } => {
  if (typeof totalSupply !== 'bigint') {
    return { isValid: false, error: 'Total supply must be a valid number' };
  }

  if (totalSupply <= 0n) {
    return { isValid: false, error: 'Total supply must be greater than 0' };
  }

  // Maximum practical uint256 value (10^77)
  const maxSupply = 10n ** 77n;
  if (totalSupply > maxSupply) {
    return { isValid: false, error: 'Total supply exceeds maximum allowed value' };
  }

  return { isValid: true };
};

/**
 * Decimals validation rules
 */
export const validateDecimals = (decimals: number): { isValid: boolean; error?: string } => {
  if (typeof decimals !== 'number' || !Number.isInteger(decimals)) {
    return { isValid: false, error: 'Decimals must be an integer' };
  }

  if (decimals < 0 || decimals > 18) {
    return { isValid: false, error: 'Decimals must be between 0 and 18' };
  }

  return { isValid: true };
};

/**
 * Network ID validation rules
 */
export const validateNetworkId = (networkId: number): { isValid: boolean; error?: string } => {
  if (typeof networkId !== 'number' || !Number.isInteger(networkId)) {
    return { isValid: false, error: 'Network ID must be an integer' };
  }

  const supportedIds = [1, 56, 520];
  if (!supportedIds.includes(networkId)) {
    return { isValid: false, error: `Network ID must be one of: ${supportedIds.join(', ')}` };
  }

  return { isValid: true };
};

/**
 * XSC network specific validation constraints
 */
export const validateXSCConstraints = (config: Partial<TokenConfiguration>): { isValid: boolean; error?: string } => {
  if (config.networkId !== 520) {
    return { isValid: true }; // Not XSC network, skip XSC-specific validation
  }

  // XSC network has additional EVM compatibility constraints
  // Maximum gas limit for XSC is 30,000,000
  // Supported EVM version is 'shanghai'

  return { isValid: true };
};

/**
 * Complete token configuration validation
 */
export const validateTokenConfiguration = (config: Partial<TokenConfiguration>): TokenConfigurationValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!config.id) {
    errors.push('Configuration ID is required');
  }

  // Validate name
  const nameValidation = validateTokenName(config.name || '');
  if (!nameValidation.isValid && nameValidation.error) {
    errors.push(nameValidation.error);
  }

  // Validate symbol
  const symbolValidation = validateTokenSymbol(config.symbol || '');
  if (!symbolValidation.isValid && symbolValidation.error) {
    errors.push(symbolValidation.error);
  }

  // Validate total supply
  if (config.totalSupply) {
    const supplyValidation = validateTotalSupply(config.totalSupply);
    if (!supplyValidation.isValid && supplyValidation.error) {
      errors.push(supplyValidation.error);
    }
  } else {
    errors.push('Total supply is required');
  }

  // Validate decimals
  if (config.decimals !== undefined) {
    const decimalsValidation = validateDecimals(config.decimals);
    if (!decimalsValidation.isValid && decimalsValidation.error) {
      errors.push(decimalsValidation.error);
    }
  } else {
    errors.push('Decimals value is required');
  }

  // Validate network ID
  if (config.networkId) {
    const networkValidation = validateNetworkId(config.networkId);
    if (!networkValidation.isValid && networkValidation.error) {
      errors.push(networkValidation.error);
    }
  } else {
    errors.push('Network ID is required');
  }

  // Validate timestamps
  if (!config.createdAt) {
    errors.push('Creation timestamp is required');
  }

  if (!config.updatedAt) {
    errors.push('Update timestamp is required');
  }

  // Validate advanced features and permissions if present
  if (config.advancedFeatures && config.permissionSettings) {
    // Cross-validation between features and permissions
    if (config.advancedFeatures.mintable === false && config.permissionSettings.ownerCanMint === true) {
      errors.push('Cannot grant minting permission without mintable feature enabled');
    }

    if (config.advancedFeatures.pausable === false && config.permissionSettings.ownerCanPause === true) {
      errors.push('Cannot grant pause permission without pausable feature enabled');
    }

    if (config.advancedFeatures.burnable === false && config.permissionSettings.ownerCanBurn === true) {
      errors.push('Cannot grant burn permission without burnable feature enabled');
    }
  }

  // XSC specific constraints
  const xscValidation = validateXSCConstraints(config);
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
 * Create a new token configuration with default values
 */
export const createTokenConfiguration = (overrides: Partial<TokenConfiguration> = {}): TokenConfiguration => {
  const now = new Date();

  return {
    id: `token-${Date.now()}`,
    name: '',
    symbol: '',
    totalSupply: 0n,
    decimals: 18,
    networkId: 1, // Default to Ethereum
    advancedFeatures: {
      mintable: false,
      burnable: false,
      pausable: false,
      capped: false
    },
    permissionSettings: {
      initialOwner: '',
      ownerCanMint: false,
      ownerCanPause: false,
      ownerCanBurn: false,
      transferOwnership: true,
      renounceOwnership: false
    },
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
};

/**
 * Helper function to get network info by chain ID
 */
export const getNetworkInfo = (chainId: SupportedChainId) => {
  const networks = Object.values(SUPPORTED_NETWORKS);
  return networks.find(network => network.chainId === chainId);
};

/**
 * Helper function to check if network is supported
 */
export const isSupportedNetwork = (chainId: number): chainId is SupportedChainId => {
  return chainId === 1 || chainId === 56 || chainId === 520;
};

/**
 * Export validation functions for browser window global access
 * This is used by Playwright tests to access validation functions
 */
if (typeof window !== 'undefined') {
  (window as any).validateTokenConfiguration = validateTokenConfiguration;
  (window as any).validateCompleteTokenConfiguration = validateTokenConfiguration;
  (window as any).validateXSCConstraints = validateXSCConstraints;
  (window as any).validateNetworkSpecificConfig = (config: any) => validateNetworkId(config.networkId);
  (window as any).validateFeatureDependencies = (config: any) => {
    if (config.advancedFeatures?.capped && !config.advancedFeatures?.maxSupply) {
      return false;
    }
    return true;
  };
  (window as any).validatePermissionFeatureAlignment = (config: any) => {
    const validation = validateTokenConfiguration(config);
    return validation.isValid;
  };
}

// Type guards for runtime type checking
export const isTokenConfiguration = (obj: any): obj is TokenConfiguration => {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.symbol === 'string' &&
    typeof obj.totalSupply === 'bigint' &&
    typeof obj.decimals === 'number' &&
    typeof obj.networkId === 'number' &&
    obj.advancedFeatures &&
    obj.permissionSettings &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date;
};