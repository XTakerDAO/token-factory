/**
 * TypeScript Interface Exports
 *
 * Central export file for all Token Factory DApp TypeScript interfaces.
 * These interfaces provide complete type safety and validation for multi-chain
 * token deployment on Ethereum, BSC, and XSC networks.
 *
 * @author Claude Code - TypeScript Interface Generator
 * @created 2025-09-26
 */

// Core token configuration
export type {
  TokenConfiguration,
  TokenConfigurationValidationResult,
  SupportedChainId
} from './TokenConfiguration';

export {
  SUPPORTED_NETWORKS,
  validateTokenConfiguration,
  validateTokenName,
  validateTokenSymbol,
  validateTotalSupply,
  validateDecimals,
  validateNetworkId,
  validateXSCConstraints,
  createTokenConfiguration,
  getNetworkInfo,
  isSupportedNetwork,
  isTokenConfiguration
} from './TokenConfiguration';

// Network configuration
export type {
  NetworkConfiguration,
  GasSettings,
  NetworkConfigurationValidationResult,
  EVMVersion
} from './NetworkConfiguration';

export {
  NETWORK_CONFIGS,
  SUPPORTED_EVM_VERSIONS,
  validateNetworkConfiguration,
  validateChainId,
  validateNetworkName,
  validateNativeTokenSymbol,
  validateRPCEndpoints,
  validateExplorerUrls,
  validateEVMVersion,
  validateGasSettings,
  validateXSCNetworkConstraints,
  validateNetworkSwitch,
  getNetworkConfig,
  getAllNetworkConfigs,
  isSupportedChainId,
  isNetworkConfiguration
} from './NetworkConfiguration';

// Advanced features
export type {
  AdvancedFeatures,
  TokenConfigurationForFeatures,
  AdvancedFeaturesValidationResult,
  FeatureDependencyValidationResult
} from './AdvancedFeatures';

export {
  validateAdvancedFeatures,
  validateMintableFeature,
  validateBurnableFeature,
  validatePausableFeature,
  validateCappedFeature,
  validateMaxSupplyRange,
  validateMaxSupplyConstraint,
  validateMintableCappedCombination,
  validateFeatureDependencies,
  validateMintablePermissionAlignment,
  validatePausablePermissionAlignment,
  validateBurnablePermissionAlignment,
  validateCompleteAdvancedFeatures,
  createDefaultAdvancedFeatures,
  getEnabledFeatures,
  hasEnabledFeatures,
  isAdvancedFeatures
} from './AdvancedFeatures';

// Permission settings
export type {
  PermissionSettings,
  PermissionSettingsValidationResult,
  PermissionValidationContext
} from './PermissionSettings';

export {
  validatePermissionSettings,
  validateInitialOwner,
  validateOwnerCanMint,
  validateOwnerCanPause,
  validateOwnerCanBurn,
  validateTransferOwnership,
  validateRenounceOwnership,
  validateOwnerHasPermissions,
  validatePermissionCombinations,
  validatePermissionFeatureAlignment,
  validateEthereumAddress,
  createDefaultPermissionSettings,
  getGrantedPermissions,
  hasHighPrivilegePermissions,
  getPermissionSummary,
  isCompletePermissionSettings,
  isPermissionSettings
} from './PermissionSettings';

// Service fee structure
export type {
  ServiceFeeStructure,
  FeeCalculationResult,
  ServiceFeeValidationResult
} from './ServiceFeeStructure';

export {
  DEFAULT_SERVICE_FEES,
  validateServiceFeeStructure,
  validateBaseFee,
  validatePercentageFee,
  validateMinimumFee,
  validateMaximumFee,
  validateFeeRecipient,
  validateFeeStructureConsistency,
  calculateServiceFee,
  formatTokenAmount,
  getServiceFeeStructure,
  getAllServiceFeeStructures,
  createServiceFeeStructure,
  isCompleteServiceFeeStructure,
  percentageToBasisPoints,
  basisPointsToPercentage,
  isServiceFeeStructure
} from './ServiceFeeStructure';

// Wallet connection
export type {
  WalletConnection,
  NetworkSwitchRequest,
  WalletBalanceInfo,
  WalletConnectionValidationResult
} from './WalletConnection';

export {
  WalletConnectionState,
  WalletConnectorType,
  WalletConnectionError,
  validateWalletConnection,
  validateWalletAddress,
  validateConnectionStatus,
  validateConnector,
  validateBalance,
  validateLastConnected,
  validateWalletConnectionConsistency,
  validateNetworkSwitch as validateWalletNetworkSwitch,
  createDefaultWalletConnection,
  createConnectedWalletConnection,
  formatWalletBalance,
  getNetworkSymbol,
  getWalletBalanceInfo,
  hasSufficientBalance,
  isCompleteWalletConnection,
  isWalletReadyForTransaction,
  getConnectionState,
  isWalletConnection
} from './WalletConnection';

// Transaction records
export type {
  TransactionRecord,
  TransactionReceipt,
  TransactionLog,
  TransactionRecordValidationResult,
  TransactionFilter,
  TransactionStatistics
} from './TransactionRecord';

export {
  TransactionType,
  TransactionStatus,
  validateTransactionRecord,
  validateTransactionId,
  validateTransactionHash,
  validateTransactionType,
  validateTransactionStatus,
  validateGas,
  validateBlockNumber,
  validateAddress,
  validateTransactionValue,
  validateTransactionData,
  validateConfirmations,
  validateTransactionConsistency,
  createTransactionRecord,
  updateTransactionWithReceipt,
  formatTransactionValue,
  getTransactionStatusIcon,
  isCompleteTransactionRecord,
  isTransactionFinal,
  filterTransactions,
  calculateTransactionStatistics,
  isTransactionRecord
} from './TransactionRecord';

// Re-export commonly used types
export type {
  SupportedChainId as ChainId
} from './TokenConfiguration';

// Utility type for complete token factory configuration
export interface CompleteTokenFactoryConfiguration {
  tokenConfiguration: TokenConfiguration;
  networkConfiguration: NetworkConfiguration;
  advancedFeatures: AdvancedFeatures;
  permissionSettings: PermissionSettings;
  serviceFeeStructure: ServiceFeeStructure;
  walletConnection: WalletConnection;
}

// Validation result aggregator
export interface ValidationSummary {
  isValid: boolean;
  totalErrors: number;
  totalWarnings: number;
  componentResults: {
    tokenConfiguration: TokenConfigurationValidationResult;
    networkConfiguration: NetworkConfigurationValidationResult;
    advancedFeatures: AdvancedFeaturesValidationResult;
    permissionSettings: PermissionSettingsValidationResult;
    serviceFeeStructure: ServiceFeeValidationResult;
    walletConnection: WalletConnectionValidationResult;
  };
}

/**
 * Validate complete token factory configuration
 */
export const validateCompleteConfiguration = (
  config: Partial<CompleteTokenFactoryConfiguration>
): ValidationSummary => {
  const tokenResult = config.tokenConfiguration
    ? validateTokenConfiguration(config.tokenConfiguration)
    : { isValid: false, errors: ['Token configuration is required'], warnings: [] };

  const networkResult = config.networkConfiguration
    ? validateNetworkConfiguration(config.networkConfiguration)
    : { isValid: false, errors: ['Network configuration is required'], warnings: [] };

  const featuresResult = config.advancedFeatures
    ? validateAdvancedFeatures(config.advancedFeatures)
    : { isValid: false, errors: ['Advanced features configuration is required'], warnings: [] };

  const permissionsResult = config.permissionSettings
    ? validatePermissionSettings(config.permissionSettings, config.advancedFeatures)
    : { isValid: false, errors: ['Permission settings are required'], warnings: [] };

  const serviceFeeResult = config.serviceFeeStructure
    ? validateServiceFeeStructure(config.serviceFeeStructure)
    : { isValid: false, errors: ['Service fee structure is required'], warnings: [] };

  const walletResult = config.walletConnection
    ? validateWalletConnection(config.walletConnection)
    : { isValid: false, errors: ['Wallet connection is required'], warnings: [] };

  const componentResults = {
    tokenConfiguration: tokenResult,
    networkConfiguration: networkResult,
    advancedFeatures: featuresResult,
    permissionSettings: permissionsResult,
    serviceFeeStructure: serviceFeeResult,
    walletConnection: walletResult
  };

  const totalErrors = Object.values(componentResults)
    .reduce((sum, result) => sum + result.errors.length, 0);

  const totalWarnings = Object.values(componentResults)
    .reduce((sum, result) => sum + result.warnings.length, 0);

  const isValid = Object.values(componentResults)
    .every(result => result.isValid);

  return {
    isValid,
    totalErrors,
    totalWarnings,
    componentResults
  };
};

// Export for browser window global access (for Playwright tests)
if (typeof window !== 'undefined') {
  (window as any).TokenFactoryTypes = {
    validateCompleteConfiguration,
    // Export all validation functions
    validateTokenConfiguration,
    validateNetworkConfiguration,
    validateAdvancedFeatures,
    validatePermissionSettings,
    validateServiceFeeStructure,
    validateWalletConnection,
    validateTransactionRecord
  };
}