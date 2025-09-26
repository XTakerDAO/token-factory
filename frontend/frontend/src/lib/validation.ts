/**
 * Validation Utilities
 *
 * Comprehensive validation utilities for token parameters,
 * network configurations, and user inputs. Integrates with
 * existing TypeScript interfaces and provides real-time validation.
 *
 * @author Claude Code - Frontend Configuration
 * @created 2025-09-26
 */

import { 
  TokenConfiguration,
  validateTokenConfiguration,
  validateTokenName,
  validateTokenSymbol,
  validateTotalSupply,
  validateDecimals,
  validateNetworkId
} from '../types/TokenConfiguration';

import {
  WalletConnection,
  validateWalletConnection,
  validateWalletAddress
} from '../types/WalletConnection';

import {
  NetworkConfiguration,
  validateNetworkConfiguration
} from '../types/NetworkConfiguration';

import { SUPPORTED_CHAIN_IDS, networkUtils, xscUtils } from './networks';

/**
 * Validation result interface with enhanced metadata
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Enhanced validation context for chain-specific rules
 */
export interface ValidationContext {
  chainId?: number;
  userAddress?: string;
  currentBalance?: bigint;
  gasPrice?: bigint;
  isMainnet?: boolean;
  features?: string[];
}

/**
 * Real-time validation options
 */
export interface ValidationOptions {
  /** Enable strict validation (production mode) */
  strict?: boolean;
  /** Include performance warnings */
  includePerformanceWarnings?: boolean;
  /** Context for chain-specific validation */
  context?: ValidationContext;
  /** Skip expensive async validations */
  skipAsyncValidation?: boolean;
  /** Maximum validation time in milliseconds */
  timeoutMs?: number;
}

/**
 * Token parameter validation with enhanced checks
 */
export class TokenValidation {
  /**
   * Validate token name with smart suggestions
   */
  static validateTokenName(
    name: string, 
    options: ValidationOptions = {}
  ): ValidationResult {
    const baseValidation = validateTokenName(name);
    const result: ValidationResult = {
      isValid: baseValidation.isValid,
      errors: baseValidation.error ? [baseValidation.error] : [],
      warnings: [],
      suggestions: []
    };

    // Enhanced checks for better UX
    if (result.isValid) {
      // Check for potential trademark issues (warning only)
      const commonTrademarks = ['ethereum', 'bitcoin', 'binance', 'meta', 'apple', 'google'];
      const lowerName = name.toLowerCase();
      
      for (const trademark of commonTrademarks) {
        if (lowerName.includes(trademark)) {
          result.warnings.push(`Token name contains "${trademark}" which may have trademark implications`);
          result.suggestions?.push(`Consider using a more unique name to avoid potential legal issues`);
          break;
        }
      }

      // Check for clarity
      if (name.length < 3) {
        result.warnings.push('Very short token names may be confusing to users');
        result.suggestions?.push('Consider using a more descriptive name (3+ characters)');
      }

      // Check for special patterns
      if (/^\d+$/.test(name)) {
        result.warnings.push('Pure numeric names may be confusing');
        result.suggestions?.push('Consider adding descriptive text to the name');
      }
    } else {
      // Provide smart suggestions for common errors
      if (name.length > 50) {
        result.suggestions?.push('Try shortening the name to 50 characters or less');
      } else if (name.length === 0) {
        result.suggestions?.push('Enter a descriptive name for your token (e.g., "My Awesome Token")');
      } else if (/[<>]/.test(name)) {
        result.suggestions?.push('Remove HTML characters (<, >) from the name');
      } else if (!/^[a-zA-Z0-9\s_]+$/.test(name)) {
        result.suggestions?.push('Use only letters, numbers, spaces, and underscores');
      }
    }

    return result;
  }

  /**
   * Validate token symbol with market analysis
   */
  static validateTokenSymbol(
    symbol: string,
    options: ValidationOptions = {}
  ): ValidationResult {
    const baseValidation = validateTokenSymbol(symbol);
    const result: ValidationResult = {
      isValid: baseValidation.isValid,
      errors: baseValidation.error ? [baseValidation.error] : [],
      warnings: [],
      suggestions: []
    };

    if (result.isValid) {
      // Check against common symbols (warning only)
      const reservedSymbols = ['ETH', 'BTC', 'BNB', 'XSC', 'USDT', 'USDC', 'DAI'];
      if (reservedSymbols.includes(symbol.toUpperCase())) {
        result.warnings.push(`Symbol "${symbol}" is used by a major cryptocurrency`);
        result.suggestions?.push('Consider using a unique symbol to avoid confusion');
        result.severity = 'high';
      }

      // Check for clarity
      if (symbol.length < 2) {
        result.warnings.push('Single character symbols may be confusing');
        result.suggestions?.push('Consider using 2-5 characters for better recognition');
      }

      // Check for patterns that might be problematic
      if (/^\d+$/.test(symbol)) {
        result.warnings.push('Pure numeric symbols are not recommended');
        result.suggestions?.push('Add letters to make the symbol more meaningful');
      }
    } else {
      // Smart suggestions for symbol errors
      if (symbol.length > 10) {
        result.suggestions?.push('Shorten the symbol to 10 characters or less');
      } else if (symbol.length === 0) {
        result.suggestions?.push('Enter a short symbol for your token (e.g., "MTK")');
      } else if (!/^[A-Z0-9]+$/.test(symbol)) {
        result.suggestions?.push('Use only uppercase letters and numbers');
        if (symbol.toLowerCase() !== symbol) {
          result.suggestions?.push(`Try: "${symbol.toUpperCase().replace(/[^A-Z0-9]/g, '')}"`);
        }
      }
    }

    return result;
  }

  /**
   * Validate total supply with economic analysis
   */
  static validateTotalSupply(
    totalSupply: bigint,
    decimals: number = 18,
    options: ValidationOptions = {}
  ): ValidationResult {
    const baseValidation = validateTotalSupply(totalSupply);
    const result: ValidationResult = {
      isValid: baseValidation.isValid,
      errors: baseValidation.error ? [baseValidation.error] : [],
      warnings: [],
      suggestions: []
    };

    if (result.isValid) {
      // Economic analysis and warnings
      const supplyInTokens = Number(totalSupply) / Math.pow(10, decimals);
      
      // Check for extremely large supplies
      if (supplyInTokens > 1000000000000) { // 1 trillion
        result.warnings.push('Extremely large token supply may cause precision issues');
        result.suggestions?.push('Consider reducing supply or increasing decimals for better precision');
      }
      
      // Check for extremely small supplies
      if (supplyInTokens < 1) {
        result.warnings.push('Very small token supplies may limit divisibility');
        result.suggestions?.push('Consider increasing supply or reducing decimals');
      }

      // Network-specific analysis
      if (options.context?.chainId) {
        const networkPerf = networkUtils.getNetworkPerformance(options.context.chainId as any);
        if (networkPerf) {
          // Estimate transaction cost impact
          const gasEstimate = networkUtils.getDeploymentGasEstimate(
            options.context.chainId as any, 
            'basicToken'
          );
          
          if (options.context.chainId === 520) { // XSC specific
            if (supplyInTokens > 10 ** 15) { // 1 quadrillion
              result.warnings.push('Very large supplies may impact XSC network performance');
            }
          }
        }
      }

      // Precision warnings
      if (decimals > 0) {
        const minUnit = 1 / Math.pow(10, decimals);
        result.suggestions?.push(`Smallest tradeable unit will be ${minUnit} tokens`);
      }
    } else {
      // Smart suggestions for supply errors
      if (totalSupply <= 0n) {
        result.suggestions?.push('Enter a positive number for total supply (e.g., 1000000)');
      } else if (totalSupply > 10n ** 77n) {
        result.suggestions?.push('Reduce total supply to avoid overflow errors');
        result.suggestions?.push('Maximum recommended: 1,000,000,000,000,000,000 tokens');
      }
    }

    return result;
  }

  /**
   * Validate decimals with precision analysis
   */
  static validateDecimals(
    decimals: number,
    totalSupply?: bigint,
    options: ValidationOptions = {}
  ): ValidationResult {
    const baseValidation = validateDecimals(decimals);
    const result: ValidationResult = {
      isValid: baseValidation.isValid,
      errors: baseValidation.error ? [baseValidation.error] : [],
      warnings: [],
      suggestions: []
    };

    if (result.isValid) {
      // Standard recommendations
      if (decimals === 18) {
        result.suggestions?.push('Using 18 decimals (Ethereum standard) - good choice for compatibility');
      } else if (decimals === 8) {
        result.suggestions?.push('Using 8 decimals (Bitcoin standard) - good for larger denomination tokens');
      } else if (decimals === 6) {
        result.suggestions?.push('Using 6 decimals (common for stablecoins) - good for dollar-pegged tokens');
      }

      // Precision analysis with total supply
      if (totalSupply) {
        const smallestUnit = 1 / Math.pow(10, decimals);
        const totalInTokens = Number(totalSupply) / Math.pow(10, decimals);
        
        if (decimals > 18) {
          result.warnings.push('More than 18 decimals may cause compatibility issues with some wallets');
        }
        
        if (decimals < 2 && totalInTokens > 1000) {
          result.warnings.push('Low decimal precision with high supply may limit trading flexibility');
          result.suggestions?.push('Consider increasing decimals for better divisibility');
        }
      }

      // Network-specific considerations
      if (options.context?.chainId === 520) { // XSC
        result.suggestions?.push('XSC network supports all decimal configurations efficiently');
      }
    } else {
      // Smart suggestions for decimal errors
      if (decimals < 0) {
        result.suggestions?.push('Decimals cannot be negative - use 0 for whole number tokens');
      } else if (decimals > 18) {
        result.suggestions?.push('Use 18 or fewer decimals for maximum compatibility');
      } else if (!Number.isInteger(decimals)) {
        result.suggestions?.push('Decimals must be a whole number (0-18)');
      }
    }

    return result;
  }
}

/**
 * Wallet validation with network context
 */
export class WalletValidation {
  /**
   * Validate wallet connection with network compatibility
   */
  static validateWalletConnection(
    connection: Partial<WalletConnection>,
    options: ValidationOptions = {}
  ): ValidationResult {
    const baseValidation = validateWalletConnection(connection);
    const result: ValidationResult = {
      isValid: baseValidation.isValid,
      errors: baseValidation.errors,
      warnings: baseValidation.warnings,
      suggestions: []
    };

    if (result.isValid && connection.isConnected) {
      // Network compatibility checks
      if (connection.chainId && !networkUtils.isSupportedChain(connection.chainId)) {
        result.errors.push(`Network ${connection.chainId} is not supported`);
        result.isValid = false;
        result.suggestions?.push('Switch to Ethereum (1), BSC (56), or XSC (520)');
      }

      // XSC specific validation
      if (connection.chainId === 520) {
        const xscValidation = xscUtils.validateXscConstraints({});
        if (!xscValidation.isValid) {
          result.warnings.push('XSC network may have compatibility considerations');
          result.suggestions?.push('Ensure your wallet supports XSC network features');
        }
      }

      // Balance checks
      if (connection.balance !== undefined && options.context?.gasPrice) {
        const estimatedGasCost = options.context.gasPrice * 300000n; // Basic estimate
        if (connection.balance < estimatedGasCost) {
          result.warnings.push('Low balance - may not be sufficient for transaction fees');
          const networkMeta = connection.chainId ? networkUtils.getNetworkMetadata(connection.chainId as any) : null;
          if (networkMeta) {
            result.suggestions?.push(`Add more ${networkMeta.shortName} for transaction fees`);
          }
        }
      }
    }

    return result;
  }

  /**
   * Validate wallet address with checksum verification
   */
  static validateWalletAddress(
    address: string,
    options: ValidationOptions = {}
  ): ValidationResult {
    const baseValidation = validateWalletAddress(address);
    const result: ValidationResult = {
      isValid: baseValidation.isValid,
      errors: baseValidation.error ? [baseValidation.error] : [],
      warnings: [],
      suggestions: []
    };

    if (result.isValid && address) {
      // Checksum validation
      const hasLowerCase = /[a-f]/.test(address);
      const hasUpperCase = /[A-F]/.test(address);
      
      if (hasLowerCase && hasUpperCase) {
        // Mixed case might be checksum - validate it
        // Note: Full EIP-55 validation would require crypto libraries
        result.suggestions?.push('Address appears to use EIP-55 checksum encoding');
      } else if (hasLowerCase && !hasUpperCase) {
        result.warnings.push('Address is not checksummed - consider using checksum format');
        result.suggestions?.push('Checksum format helps prevent typos and improves security');
      }

      // Common address patterns
      if (address === '0x0000000000000000000000000000000000000000') {
        result.errors.push('Cannot use zero address');
        result.isValid = false;
      } else if (address === '0x000000000000000000000000000000000000dEaD') {
        result.warnings.push('This appears to be a burn address');
        result.suggestions?.push('Verify you intend to use a burn address');
      }
    }

    return result;
  }
}

/**
 * Network validation with performance analysis
 */
export class NetworkValidation {
  /**
   * Validate network configuration with performance checks
   */
  static async validateNetworkConfiguration(
    config: Partial<NetworkConfiguration>,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const baseValidation = validateNetworkConfiguration(config);
    const result: ValidationResult = {
      isValid: baseValidation.isValid,
      errors: baseValidation.errors,
      warnings: baseValidation.warnings,
      suggestions: []
    };

    if (result.isValid && config.chainId && !options.skipAsyncValidation) {
      // Performance analysis
      if (options.includePerformanceWarnings && networkUtils.isSupportedChain(config.chainId)) {
        const performance = networkUtils.getNetworkPerformance(config.chainId);
        
        if (performance.throughput < 20) {
          result.warnings.push(`Network has low throughput (${performance.throughput} TPS)`);
          result.suggestions?.push('Consider transaction timing during high network usage');
        }
        
        if (performance.blockTime > 10000) {
          result.warnings.push(`Network has slow block times (${performance.blockTime}ms)`);
          result.suggestions?.push('Expect longer confirmation times');
        }
      }

      // XSC specific validation
      if (config.chainId === 520) {
        try {
          const xscStatus = await xscUtils.checkXscReadiness();
          if (!xscStatus.isReady) {
            result.warnings.push('XSC network may not be fully ready');
            result.suggestions?.push('Check XSC network status before proceeding');
          } else {
            result.suggestions?.push('XSC network is ready with Shanghai EVM compatibility');
          }
        } catch (error) {
          result.warnings.push('Could not verify XSC network status');
        }
      }
    }

    return result;
  }

  /**
   * Validate network switching
   */
  static validateNetworkSwitch(
    fromChainId: number,
    toChainId: number,
    options: ValidationOptions = {}
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Basic validation
    if (fromChainId === toChainId) {
      result.errors.push('Cannot switch to the same network');
      result.isValid = false;
      return result;
    }

    if (!networkUtils.isSupportedChain(fromChainId) || !networkUtils.isSupportedChain(toChainId)) {
      result.errors.push('One or more networks are not supported');
      result.isValid = false;
      return result;
    }

    // Performance impact analysis
    const fromPerf = networkUtils.getNetworkPerformance(fromChainId);
    const toPerf = networkUtils.getNetworkPerformance(toChainId);

    if (fromPerf.throughput > toPerf.throughput * 2) {
      result.warnings.push('Switching to a significantly slower network');
      result.suggestions?.push(`${networkUtils.formatNetworkName(toChainId as any)} has lower throughput than ${networkUtils.formatNetworkName(fromChainId as any)}`);
    }

    if (fromPerf.averageGasPrice < toPerf.averageGasPrice) {
      result.warnings.push('Switching to a more expensive network');
      const fromName = networkUtils.formatNetworkName(fromChainId as any);
      const toName = networkUtils.formatNetworkName(toChainId as any);
      result.suggestions?.push(`${toName} typically has higher gas costs than ${fromName}`);
    }

    // XSC specific considerations
    if (toChainId === 520) {
      result.suggestions?.push('XSC network offers lower fees and faster confirmations');
      result.suggestions?.push('Ensure your wallet supports XSC network before switching');
    }

    return result;
  }
}

/**
 * Complete configuration validation
 */
export class CompleteValidation {
  /**
   * Validate entire token configuration with cross-field checks
   */
  static async validateTokenConfiguration(
    config: Partial<TokenConfiguration>,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    // Use existing validation as base
    const baseValidation = validateTokenConfiguration(config);
    const result: ValidationResult = {
      isValid: baseValidation.isValid,
      errors: baseValidation.errors,
      warnings: baseValidation.warnings,
      suggestions: []
    };

    if (config.name && config.symbol) {
      // Enhanced cross-field validation
      const nameValidation = TokenValidation.validateTokenName(config.name, options);
      const symbolValidation = TokenValidation.validateTokenSymbol(config.symbol, options);
      
      // Merge suggestions
      result.suggestions?.push(...(nameValidation.suggestions || []));
      result.suggestions?.push(...(symbolValidation.suggestions || []));
      result.warnings.push(...nameValidation.warnings);
      result.warnings.push(...symbolValidation.warnings);
    }

    // Economic analysis
    if (config.totalSupply && config.decimals !== undefined) {
      const supplyValidation = TokenValidation.validateTotalSupply(
        config.totalSupply, 
        config.decimals,
        options
      );
      result.warnings.push(...supplyValidation.warnings);
      result.suggestions?.push(...(supplyValidation.suggestions || []));
    }

    // Network-specific validation
    if (config.networkId && options.context) {
      options.context.chainId = config.networkId;
    }

    return result;
  }

  /**
   * Performance validation for deployment
   */
  static async validateDeploymentReadiness(
    tokenConfig: Partial<TokenConfiguration>,
    walletConnection: Partial<WalletConnection>,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Check wallet connection
    const walletValidation = WalletValidation.validateWalletConnection(walletConnection, options);
    if (!walletValidation.isValid) {
      result.errors.push('Wallet connection is required for deployment');
      result.isValid = false;
      return result;
    }

    // Check network compatibility
    if (tokenConfig.networkId && walletConnection.chainId) {
      if (tokenConfig.networkId !== walletConnection.chainId) {
        result.errors.push(`Network mismatch: token configured for ${tokenConfig.networkId}, wallet on ${walletConnection.chainId}`);
        result.isValid = false;
        result.suggestions?.push('Switch wallet to the correct network or update token configuration');
      }
    }

    // Gas estimation and balance check
    if (tokenConfig.networkId && walletConnection.balance) {
      const gasEstimate = networkUtils.getDeploymentGasEstimate(
        tokenConfig.networkId as any,
        'basicToken'
      );
      const networkConfig = networkUtils.getNetworkConfig(tokenConfig.networkId);
      
      if (networkConfig) {
        const estimatedCost = gasEstimate * networkConfig.gasSettings.gasPrice;
        
        if (walletConnection.balance < estimatedCost) {
          result.errors.push('Insufficient balance for deployment');
          result.isValid = false;
          const networkMeta = networkUtils.getNetworkMetadata(tokenConfig.networkId as any);
          result.suggestions?.push(`Add more ${networkMeta.shortName} to cover deployment costs`);
        } else if (walletConnection.balance < estimatedCost * 2n) {
          result.warnings.push('Low balance - consider adding more funds for safety buffer');
        }
      }
    }

    return result;
  }
}

/**
 * Real-time validation hook utility
 */
export const createRealtimeValidator = <T>(
  validator: (value: T, options?: ValidationOptions) => ValidationResult | Promise<ValidationResult>,
  debounceMs: number = 300
) => {
  let timeout: NodeJS.Timeout;
  let lastValidation: ValidationResult | null = null;

  return (
    value: T,
    options?: ValidationOptions,
    onResult?: (result: ValidationResult) => void
  ): ValidationResult | null => {
    // Clear previous timeout
    clearTimeout(timeout);

    // Immediate basic validation for critical errors
    if (typeof validator === 'function') {
      timeout = setTimeout(async () => {
        try {
          const result = await validator(value, options);
          lastValidation = result;
          onResult?.(result);
        } catch (error) {
          const errorResult: ValidationResult = {
            isValid: false,
            errors: [`Validation error: ${error}`],
            warnings: [],
            severity: 'critical'
          };
          lastValidation = errorResult;
          onResult?.(errorResult);
        }
      }, debounceMs);
    }

    return lastValidation;
  };
};

/**
 * Export validation utilities for Playwright testing
 */
if (typeof window !== 'undefined') {
  (window as any).validationUtils = {
    TokenValidation,
    WalletValidation,
    NetworkValidation,
    CompleteValidation,
    createRealtimeValidator
  };
}

/**
 * Default exports
 */
export {
  TokenValidation,
  WalletValidation,
  NetworkValidation,
  CompleteValidation,
  createRealtimeValidator
};

export default {
  TokenValidation,
  WalletValidation,
  NetworkValidation,
  CompleteValidation,
  createRealtimeValidator
};