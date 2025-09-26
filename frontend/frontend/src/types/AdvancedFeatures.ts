/**
 * AdvancedFeatures Type Definition
 *
 * Configuration for optional ERC20 extensions including mintable, burnable, pausable,
 * and capped functionality with comprehensive validation rules and dependencies.
 *
 * @author Claude Code - TypeScript Interface Generator
 * @created 2025-09-26
 */

import { PermissionSettings } from './PermissionSettings';

/**
 * Advanced features configuration interface
 */
export interface AdvancedFeatures {
  /** Allow creation of new tokens after deployment */
  mintable: boolean;

  /** Allow token holders to destroy tokens */
  burnable: boolean;

  /** Allow emergency pause of all transfers */
  pausable: boolean;

  /** Enforce maximum supply cap */
  capped: boolean;

  /** Maximum token supply (required if capped is true) */
  maxSupply?: bigint;
}

/**
 * Complete token configuration interface for validation purposes
 */
export interface TokenConfigurationForFeatures {
  totalSupply: bigint;
  advancedFeatures: AdvancedFeatures;
  permissionSettings: PermissionSettings;
}

/**
 * Validation result interface
 */
export interface AdvancedFeaturesValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Feature dependency validation result
 */
export interface FeatureDependencyValidationResult {
  isValid: boolean;
  missingDependencies: string[];
  invalidCombinations: string[];
}

/**
 * Individual feature validation for mintable
 */
export const validateMintableFeature = (features: Partial<AdvancedFeatures>): { isValid: boolean; error?: string } => {
  if (features.mintable !== undefined && typeof features.mintable !== 'boolean') {
    return { isValid: false, error: 'Mintable feature must be a boolean' };
  }
  return { isValid: true };
};

/**
 * Individual feature validation for burnable
 */
export const validateBurnableFeature = (features: Partial<AdvancedFeatures>): { isValid: boolean; error?: string } => {
  if (features.burnable !== undefined && typeof features.burnable !== 'boolean') {
    return { isValid: false, error: 'Burnable feature must be a boolean' };
  }
  return { isValid: true };
};

/**
 * Individual feature validation for pausable
 */
export const validatePausableFeature = (features: Partial<AdvancedFeatures>): { isValid: boolean; error?: string } => {
  if (features.pausable !== undefined && typeof features.pausable !== 'boolean') {
    return { isValid: false, error: 'Pausable feature must be a boolean' };
  }
  return { isValid: true };
};

/**
 * Capped feature validation with maxSupply dependency
 */
export const validateCappedFeature = (features: Partial<AdvancedFeatures>): { isValid: boolean; error?: string } => {
  if (features.capped !== undefined && typeof features.capped !== 'boolean') {
    return { isValid: false, error: 'Capped feature must be a boolean' };
  }

  // If capped is true, maxSupply is required
  if (features.capped === true) {
    if (features.maxSupply === undefined || features.maxSupply === null) {
      return { isValid: false, error: 'Max supply is required when capped feature is enabled' };
    }

    if (typeof features.maxSupply !== 'bigint') {
      return { isValid: false, error: 'Max supply must be a valid number' };
    }

    if (features.maxSupply <= 0n) {
      return { isValid: false, error: 'Max supply must be greater than 0' };
    }

    // Maximum practical uint256 value (10^77)
    const maxAllowedSupply = 10n ** 77n;
    if (features.maxSupply > maxAllowedSupply) {
      return { isValid: false, error: 'Max supply exceeds maximum allowed value' };
    }
  }

  return { isValid: true };
};

/**
 * Validate maxSupply range for extreme values
 */
export const validateMaxSupplyRange = (features: Partial<AdvancedFeatures>): { isValid: boolean; error?: string } => {
  if (!features.capped || !features.maxSupply) {
    return { isValid: true };
  }

  if (features.maxSupply <= 0n) {
    return { isValid: false, error: 'Max supply must be positive' };
  }

  // Check for extreme values that might cause issues
  const maxPracticalSupply = 10n ** 76n; // Slightly lower than theoretical max for safety
  if (features.maxSupply > maxPracticalSupply) {
    return { isValid: false, error: 'Max supply exceeds practical limit for blockchain operations' };
  }

  return { isValid: true };
};

/**
 * Validate maxSupply constraint against total supply
 */
export const validateMaxSupplyConstraint = (config: Partial<TokenConfigurationForFeatures>): { isValid: boolean; error?: string } => {
  if (!config.advancedFeatures?.capped || !config.advancedFeatures?.maxSupply) {
    return { isValid: true };
  }

  if (!config.totalSupply) {
    return { isValid: false, error: 'Total supply is required for max supply validation' };
  }

  if (config.advancedFeatures.maxSupply <= config.totalSupply) {
    return { isValid: false, error: 'Max supply must be greater than initial total supply' };
  }

  return { isValid: true };
};

/**
 * Validate mintable and capped combination
 */
export const validateMintableCappedCombination = (features: Partial<AdvancedFeatures>): { isValid: boolean; error?: string } => {
  // Mintable and capped can coexist with proper validation
  if (features.mintable === true && features.capped === true) {
    if (!features.maxSupply) {
      return { isValid: false, error: 'Max supply is required when both mintable and capped features are enabled' };
    }
  }

  return { isValid: true };
};

/**
 * Validate feature dependencies
 */
export const validateFeatureDependencies = (features: Partial<AdvancedFeatures>): FeatureDependencyValidationResult => {
  const missingDependencies: string[] = [];
  const invalidCombinations: string[] = [];

  // Capped feature requires maxSupply
  if (features.capped === true && !features.maxSupply) {
    missingDependencies.push('maxSupply is required when capped feature is enabled');
  }

  // Validate maxSupply when not capped
  if (features.capped === false && features.maxSupply !== undefined) {
    invalidCombinations.push('maxSupply should not be set when capped feature is disabled');
  }

  return {
    isValid: missingDependencies.length === 0 && invalidCombinations.length === 0,
    missingDependencies,
    invalidCombinations
  };
};

/**
 * Permission-feature alignment validation for mintable
 */
export const validateMintablePermissionAlignment = (config: Partial<TokenConfigurationForFeatures>): { isValid: boolean; error?: string } => {
  const features = config.advancedFeatures;
  const permissions = config.permissionSettings;

  if (!features || !permissions) {
    return { isValid: true };
  }

  // Cannot grant minting permission without mintable feature
  if (features.mintable === false && permissions.ownerCanMint === true) {
    return { isValid: false, error: 'Cannot grant minting permission without mintable feature enabled' };
  }

  return { isValid: true };
};

/**
 * Permission-feature alignment validation for pausable
 */
export const validatePausablePermissionAlignment = (config: Partial<TokenConfigurationForFeatures>): { isValid: boolean; error?: string } => {
  const features = config.advancedFeatures;
  const permissions = config.permissionSettings;

  if (!features || !permissions) {
    return { isValid: true };
  }

  // Cannot grant pause permission without pausable feature
  if (features.pausable === false && permissions.ownerCanPause === true) {
    return { isValid: false, error: 'Cannot grant pause permission without pausable feature enabled' };
  }

  return { isValid: true };
};

/**
 * Permission-feature alignment validation for burnable
 */
export const validateBurnablePermissionAlignment = (config: Partial<TokenConfigurationForFeatures>): { isValid: boolean; error?: string } => {
  const features = config.advancedFeatures;
  const permissions = config.permissionSettings;

  if (!features || !permissions) {
    return { isValid: true };
  }

  // Cannot grant burn permission without burnable feature
  if (features.burnable === false && permissions.ownerCanBurn === true) {
    return { isValid: false, error: 'Cannot grant burn permission without burnable feature enabled' };
  }

  return { isValid: true };
};

/**
 * Validate burnable with permission settings
 */
export const validateBurnablePermissions = (config: Partial<TokenConfigurationForFeatures>): { isValid: boolean; error?: string } => {
  return validateBurnablePermissionAlignment(config);
};

/**
 * Validate pausable with permission settings
 */
export const validatePausablePermissions = (config: Partial<TokenConfigurationForFeatures>): { isValid: boolean; error?: string } => {
  return validatePausablePermissionAlignment(config);
};

/**
 * Complete advanced features validation
 */
export const validateAdvancedFeatures = (features: Partial<AdvancedFeatures>): AdvancedFeaturesValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate individual features
  const mintableValidation = validateMintableFeature(features);
  if (!mintableValidation.isValid && mintableValidation.error) {
    errors.push(mintableValidation.error);
  }

  const burnableValidation = validateBurnableFeature(features);
  if (!burnableValidation.isValid && burnableValidation.error) {
    errors.push(burnableValidation.error);
  }

  const pausableValidation = validatePausableFeature(features);
  if (!pausableValidation.isValid && pausableValidation.error) {
    errors.push(pausableValidation.error);
  }

  const cappedValidation = validateCappedFeature(features);
  if (!cappedValidation.isValid && cappedValidation.error) {
    errors.push(cappedValidation.error);
  }

  // Validate feature dependencies
  const dependencyValidation = validateFeatureDependencies(features);
  if (!dependencyValidation.isValid) {
    errors.push(...dependencyValidation.missingDependencies);
    errors.push(...dependencyValidation.invalidCombinations);
  }

  // Validate maxSupply range
  const rangeValidation = validateMaxSupplyRange(features);
  if (!rangeValidation.isValid && rangeValidation.error) {
    errors.push(rangeValidation.error);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Complete advanced features validation with token configuration
 */
export const validateCompleteAdvancedFeatures = (config: Partial<TokenConfigurationForFeatures>): AdvancedFeaturesValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.advancedFeatures) {
    errors.push('Advanced features configuration is required');
    return { isValid: false, errors, warnings };
  }

  // Basic features validation
  const featuresValidation = validateAdvancedFeatures(config.advancedFeatures);
  errors.push(...featuresValidation.errors);
  warnings.push(...featuresValidation.warnings);

  // Cross-validation with permissions
  if (config.permissionSettings) {
    const mintableAlignment = validateMintablePermissionAlignment(config);
    if (!mintableAlignment.isValid && mintableAlignment.error) {
      errors.push(mintableAlignment.error);
    }

    const pausableAlignment = validatePausablePermissionAlignment(config);
    if (!pausableAlignment.isValid && pausableAlignment.error) {
      errors.push(pausableAlignment.error);
    }

    const burnableAlignment = validateBurnablePermissionAlignment(config);
    if (!burnableAlignment.isValid && burnableAlignment.error) {
      errors.push(burnableAlignment.error);
    }
  }

  // Validate maxSupply constraint against totalSupply
  const maxSupplyValidation = validateMaxSupplyConstraint(config);
  if (!maxSupplyValidation.isValid && maxSupplyValidation.error) {
    errors.push(maxSupplyValidation.error);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Create default advanced features configuration
 */
export const createDefaultAdvancedFeatures = (): AdvancedFeatures => {
  return {
    mintable: false,
    burnable: false,
    pausable: false,
    capped: false
  };
};

/**
 * Helper function to get enabled features as string array
 */
export const getEnabledFeatures = (features: AdvancedFeatures): string[] => {
  const enabled: string[] = [];

  if (features.mintable) enabled.push('Mintable');
  if (features.burnable) enabled.push('Burnable');
  if (features.pausable) enabled.push('Pausable');
  if (features.capped) enabled.push(`Capped: ${features.maxSupply?.toString() || 'N/A'}`);

  return enabled;
};

/**
 * Helper function to check if any features are enabled
 */
export const hasEnabledFeatures = (features: AdvancedFeatures): boolean => {
  return features.mintable || features.burnable || features.pausable || features.capped;
};

/**
 * Export validation functions for browser window global access
 * This is used by Playwright tests to access validation functions
 */
if (typeof window !== 'undefined') {
  (window as any).validateAdvancedFeatures = validateAdvancedFeatures;
  (window as any).validateMintableFeature = validateMintableFeature;
  (window as any).validateBurnableFeature = validateBurnableFeature;
  (window as any).validatePausableFeature = validatePausableFeature;
  (window as any).validateCappedFeature = validateCappedFeature;
  (window as any).validateMaxSupplyRange = validateMaxSupplyRange;
  (window as any).validateMaxSupplyConstraint = validateMaxSupplyConstraint;
  (window as any).validateMintableCappedCombination = validateMintableCappedCombination;
  (window as any).validateFeatureDependencies = validateFeatureDependencies;
  (window as any).validateMintablePermissionAlignment = validateMintablePermissionAlignment;
  (window as any).validatePausablePermissionAlignment = validatePausablePermissionAlignment;
  (window as any).validateBurnablePermissionAlignment = validateBurnablePermissionAlignment;
  (window as any).validateBurnablePermissions = validateBurnablePermissions;
  (window as any).validatePausablePermissions = validatePausablePermissions;
  (window as any).validateCompleteAdvancedFeatures = validateCompleteAdvancedFeatures;
}

// Type guard for runtime type checking
export const isAdvancedFeatures = (obj: any): obj is AdvancedFeatures => {
  return obj &&
    typeof obj.mintable === 'boolean' &&
    typeof obj.burnable === 'boolean' &&
    typeof obj.pausable === 'boolean' &&
    typeof obj.capped === 'boolean' &&
    (obj.maxSupply === undefined || typeof obj.maxSupply === 'bigint');
};