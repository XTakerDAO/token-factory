/**
 * PermissionSettings Type Definition
 *
 * Defines ownership and role-based access control for ERC20 tokens with comprehensive
 * validation rules and integration with advanced features.
 *
 * @author Claude Code - TypeScript Interface Generator
 * @created 2025-09-26
 */

/**
 * Permission settings interface for token ownership and access control
 */
export interface PermissionSettings {
  /** Ethereum address of initial owner */
  initialOwner: string;

  /** Owner has minting privileges */
  ownerCanMint: boolean;

  /** Owner can pause/unpause token transfers */
  ownerCanPause: boolean;

  /** Owner can burn any tokens */
  ownerCanBurn: boolean;

  /** Allow ownership transfer to another address */
  transferOwnership: boolean;

  /** Allow ownership renouncement (permanently remove owner) */
  renounceOwnership: boolean;
}

/**
 * Validation result interface
 */
export interface PermissionSettingsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Permission validation context interface
 */
export interface PermissionValidationContext {
  permissionSettings: PermissionSettings;
  advancedFeatures?: {
    mintable: boolean;
    burnable: boolean;
    pausable: boolean;
  };
}

/**
 * Ethereum address validation
 */
export const validateEthereumAddress = (address: string): { isValid: boolean; error?: string } => {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: 'Ethereum address is required' };
  }

  // Basic format validation (0x followed by 40 hex characters)
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { isValid: false, error: 'Invalid Ethereum address format' };
  }

  // Check for zero address
  if (address === '0x0000000000000000000000000000000000000000') {
    return { isValid: false, error: 'Cannot use zero address as owner' };
  }

  // Basic checksum validation (simplified)
  if (address !== address.toLowerCase() && address !== address.toUpperCase()) {
    // If it's mixed case, it should be properly checksummed
    // For production, implement full EIP-55 checksum validation
    const hasLowerCase = /[a-f]/.test(address.slice(2));
    const hasUpperCase = /[A-F]/.test(address.slice(2));

    if (hasLowerCase && hasUpperCase) {
      // Mixed case detected - in production, validate proper checksum
      // For now, we'll accept it but could add warning
    }
  }

  return { isValid: true };
};

/**
 * Validate initial owner address
 */
export const validateInitialOwner = (initialOwner: string): { isValid: boolean; error?: string } => {
  return validateEthereumAddress(initialOwner);
};

/**
 * Validate owner minting permission
 */
export const validateOwnerCanMint = (
  ownerCanMint: boolean,
  mintableFeature?: boolean
): { isValid: boolean; error?: string } => {
  if (typeof ownerCanMint !== 'boolean') {
    return { isValid: false, error: 'Owner mint permission must be a boolean' };
  }

  // Cannot grant minting permission without mintable feature
  if (ownerCanMint === true && mintableFeature === false) {
    return { isValid: false, error: 'Cannot grant minting permission without mintable feature enabled' };
  }

  return { isValid: true };
};

/**
 * Validate owner pause permission
 */
export const validateOwnerCanPause = (
  ownerCanPause: boolean,
  pausableFeature?: boolean
): { isValid: boolean; error?: string } => {
  if (typeof ownerCanPause !== 'boolean') {
    return { isValid: false, error: 'Owner pause permission must be a boolean' };
  }

  // Cannot grant pause permission without pausable feature
  if (ownerCanPause === true && pausableFeature === false) {
    return { isValid: false, error: 'Cannot grant pause permission without pausable feature enabled' };
  }

  return { isValid: true };
};

/**
 * Validate owner burn permission
 */
export const validateOwnerCanBurn = (
  ownerCanBurn: boolean,
  burnableFeature?: boolean
): { isValid: boolean; error?: string } => {
  if (typeof ownerCanBurn !== 'boolean') {
    return { isValid: false, error: 'Owner burn permission must be a boolean' };
  }

  // Cannot grant burn permission without burnable feature
  if (ownerCanBurn === true && burnableFeature === false) {
    return { isValid: false, error: 'Cannot grant burn permission without burnable feature enabled' };
  }

  return { isValid: true };
};

/**
 * Validate transfer ownership permission
 */
export const validateTransferOwnership = (transferOwnership: boolean): { isValid: boolean; error?: string } => {
  if (typeof transferOwnership !== 'boolean') {
    return { isValid: false, error: 'Transfer ownership permission must be a boolean' };
  }

  return { isValid: true };
};

/**
 * Validate renounce ownership permission
 */
export const validateRenounceOwnership = (renounceOwnership: boolean): { isValid: boolean; error?: string } => {
  if (typeof renounceOwnership !== 'boolean') {
    return { isValid: false, error: 'Renounce ownership permission must be a boolean' };
  }

  return { isValid: true };
};

/**
 * Validate that owner has at least one permission
 */
export const validateOwnerHasPermissions = (settings: PermissionSettings): { isValid: boolean; error?: string } => {
  const hasAnyPermission = settings.ownerCanMint ||
                          settings.ownerCanPause ||
                          settings.ownerCanBurn ||
                          settings.transferOwnership ||
                          settings.renounceOwnership;

  if (!hasAnyPermission) {
    return { isValid: false, error: 'Owner must have at least one permission granted' };
  }

  return { isValid: true };
};

/**
 * Validate permission combinations for logical consistency
 */
export const validatePermissionCombinations = (settings: PermissionSettings): { isValid: boolean; error?: string; warnings?: string[] } => {
  const warnings: string[] = [];

  // Warning: Renounce ownership without transfer ownership might be irreversible
  if (settings.renounceOwnership === true && settings.transferOwnership === false) {
    warnings.push('Renouncing ownership without transfer capability makes ownership permanently irrevocable');
  }

  // Warning: Having powerful permissions without transfer capability
  if ((settings.ownerCanMint || settings.ownerCanPause || settings.ownerCanBurn) && !settings.transferOwnership) {
    warnings.push('Consider enabling ownership transfer for powerful permissions to allow future governance changes');
  }

  return { isValid: true, warnings };
};

/**
 * Complete permission settings validation
 */
export const validatePermissionSettings = (
  settings: Partial<PermissionSettings>,
  advancedFeatures?: { mintable: boolean; burnable: boolean; pausable: boolean }
): PermissionSettingsValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate initial owner
  if (settings.initialOwner !== undefined) {
    const ownerValidation = validateInitialOwner(settings.initialOwner);
    if (!ownerValidation.isValid && ownerValidation.error) {
      errors.push(ownerValidation.error);
    }
  } else {
    errors.push('Initial owner address is required');
  }

  // Validate owner can mint
  if (settings.ownerCanMint !== undefined) {
    const mintValidation = validateOwnerCanMint(settings.ownerCanMint, advancedFeatures?.mintable);
    if (!mintValidation.isValid && mintValidation.error) {
      errors.push(mintValidation.error);
    }
  } else {
    errors.push('Owner mint permission is required');
  }

  // Validate owner can pause
  if (settings.ownerCanPause !== undefined) {
    const pauseValidation = validateOwnerCanPause(settings.ownerCanPause, advancedFeatures?.pausable);
    if (!pauseValidation.isValid && pauseValidation.error) {
      errors.push(pauseValidation.error);
    }
  } else {
    errors.push('Owner pause permission is required');
  }

  // Validate owner can burn
  if (settings.ownerCanBurn !== undefined) {
    const burnValidation = validateOwnerCanBurn(settings.ownerCanBurn, advancedFeatures?.burnable);
    if (!burnValidation.isValid && burnValidation.error) {
      errors.push(burnValidation.error);
    }
  } else {
    errors.push('Owner burn permission is required');
  }

  // Validate transfer ownership
  if (settings.transferOwnership !== undefined) {
    const transferValidation = validateTransferOwnership(settings.transferOwnership);
    if (!transferValidation.isValid && transferValidation.error) {
      errors.push(transferValidation.error);
    }
  } else {
    errors.push('Transfer ownership permission is required');
  }

  // Validate renounce ownership
  if (settings.renounceOwnership !== undefined) {
    const renounceValidation = validateRenounceOwnership(settings.renounceOwnership);
    if (!renounceValidation.isValid && renounceValidation.error) {
      errors.push(renounceValidation.error);
    }
  } else {
    errors.push('Renounce ownership permission is required');
  }

  // Validate complete settings if all fields are present
  if (isCompletePermissionSettings(settings)) {
    const permissionsValidation = validateOwnerHasPermissions(settings);
    if (!permissionsValidation.isValid && permissionsValidation.error) {
      errors.push(permissionsValidation.error);
    }

    const combinationsValidation = validatePermissionCombinations(settings);
    if (combinationsValidation.warnings) {
      warnings.push(...combinationsValidation.warnings);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate permission and feature alignment
 */
export const validatePermissionFeatureAlignment = (context: PermissionValidationContext): PermissionSettingsValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { permissionSettings, advancedFeatures } = context;

  if (!advancedFeatures) {
    return { isValid: true, errors, warnings };
  }

  // Check alignment between permissions and features
  if (permissionSettings.ownerCanMint && !advancedFeatures.mintable) {
    errors.push('Minting permission granted but mintable feature is disabled');
  }

  if (permissionSettings.ownerCanPause && !advancedFeatures.pausable) {
    errors.push('Pause permission granted but pausable feature is disabled');
  }

  if (permissionSettings.ownerCanBurn && !advancedFeatures.burnable) {
    errors.push('Burn permission granted but burnable feature is disabled');
  }

  // Warnings for unused features
  if (advancedFeatures.mintable && !permissionSettings.ownerCanMint) {
    warnings.push('Mintable feature is enabled but owner cannot mint tokens');
  }

  if (advancedFeatures.pausable && !permissionSettings.ownerCanPause) {
    warnings.push('Pausable feature is enabled but owner cannot pause transfers');
  }

  if (advancedFeatures.burnable && !permissionSettings.ownerCanBurn) {
    warnings.push('Burnable feature is enabled but owner cannot burn tokens');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Create default permission settings
 */
export const createDefaultPermissionSettings = (initialOwner: string = ''): PermissionSettings => {
  return {
    initialOwner,
    ownerCanMint: false,
    ownerCanPause: false,
    ownerCanBurn: false,
    transferOwnership: true,
    renounceOwnership: false
  };
};

/**
 * Helper function to get granted permissions as string array
 */
export const getGrantedPermissions = (settings: PermissionSettings): string[] => {
  const granted: string[] = [];

  if (settings.ownerCanMint) granted.push('Mint');
  if (settings.ownerCanPause) granted.push('Pause');
  if (settings.ownerCanBurn) granted.push('Burn');
  if (settings.transferOwnership) granted.push('Transfer Ownership');
  if (settings.renounceOwnership) granted.push('Renounce Ownership');

  return granted;
};

/**
 * Helper function to check if settings have high-privilege permissions
 */
export const hasHighPrivilegePermissions = (settings: PermissionSettings): boolean => {
  return settings.ownerCanMint || settings.ownerCanPause || settings.ownerCanBurn;
};

/**
 * Helper function to generate permission summary
 */
export const getPermissionSummary = (settings: PermissionSettings): {
  owner: string;
  permissions: string[];
  privilegeLevel: 'low' | 'medium' | 'high';
} => {
  const permissions = getGrantedPermissions(settings);

  let privilegeLevel: 'low' | 'medium' | 'high' = 'low';
  if (settings.ownerCanMint || settings.ownerCanPause || settings.ownerCanBurn) {
    privilegeLevel = 'high';
  } else if (settings.transferOwnership || settings.renounceOwnership) {
    privilegeLevel = 'medium';
  }

  return {
    owner: settings.initialOwner,
    permissions,
    privilegeLevel
  };
};

/**
 * Type guard to check if settings are complete
 */
export const isCompletePermissionSettings = (settings: Partial<PermissionSettings>): settings is PermissionSettings => {
  return !!(
    settings.initialOwner !== undefined &&
    settings.ownerCanMint !== undefined &&
    settings.ownerCanPause !== undefined &&
    settings.ownerCanBurn !== undefined &&
    settings.transferOwnership !== undefined &&
    settings.renounceOwnership !== undefined
  );
};

/**
 * Export validation functions for browser window global access
 * This is used by Playwright tests to access validation functions
 */
if (typeof window !== 'undefined') {
  (window as any).validatePermissionSettings = validatePermissionSettings;
  (window as any).validateInitialOwner = validateInitialOwner;
  (window as any).validateOwnerCanMint = validateOwnerCanMint;
  (window as any).validateOwnerCanPause = validateOwnerCanPause;
  (window as any).validateOwnerCanBurn = validateOwnerCanBurn;
  (window as any).validatePermissionFeatureAlignment = validatePermissionFeatureAlignment;
  (window as any).validateOwnerHasPermissions = validateOwnerHasPermissions;
}

// Type guard for runtime type checking
export const isPermissionSettings = (obj: any): obj is PermissionSettings => {
  return obj &&
    typeof obj.initialOwner === 'string' &&
    typeof obj.ownerCanMint === 'boolean' &&
    typeof obj.ownerCanPause === 'boolean' &&
    typeof obj.ownerCanBurn === 'boolean' &&
    typeof obj.transferOwnership === 'boolean' &&
    typeof obj.renounceOwnership === 'boolean';
};