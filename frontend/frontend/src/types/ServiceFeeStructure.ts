/**
 * ServiceFeeStructure Type Definition
 *
 * Platform service fee configuration per network with comprehensive validation rules
 * and multi-chain support for Ethereum, BSC, and XSC networks.
 *
 * @author Claude Code - TypeScript Interface Generator
 * @created 2025-09-26
 */

/**
 * Service fee structure interface for platform fees per network
 */
export interface ServiceFeeStructure {
  /** Associated blockchain network ID */
  networkId: number;

  /** Base service fee in network native token (wei) */
  baseFee: bigint;

  /** Percentage fee in basis points (100 basis points = 1%) */
  percentageFee: number;

  /** Minimum total fee in network native token (wei) */
  minimumFee: bigint;

  /** Maximum total fee in network native token (wei) */
  maximumFee: bigint;

  /** Address receiving service fees */
  feeRecipient: string;
}

/**
 * Fee calculation result interface
 */
export interface FeeCalculationResult {
  baseFee: bigint;
  percentageFee: bigint;
  totalFee: bigint;
  currency: string;
  formattedFee: string;
}

/**
 * Service fee validation result interface
 */
export interface ServiceFeeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Default service fee configurations per network
export const DEFAULT_SERVICE_FEES: Record<number, ServiceFeeStructure> = {
  1: { // Ethereum
    networkId: 1,
    baseFee: 10000000000000000n, // 0.01 ETH
    percentageFee: 100, // 1% (100 basis points)
    minimumFee: 5000000000000000n, // 0.005 ETH
    maximumFee: 100000000000000000n, // 0.1 ETH
    feeRecipient: '0x0000000000000000000000000000000000000000' // Placeholder
  },
  56: { // BSC
    networkId: 56,
    baseFee: 50000000000000000n, // 0.05 BNB
    percentageFee: 100, // 1%
    minimumFee: 25000000000000000n, // 0.025 BNB
    maximumFee: 500000000000000000n, // 0.5 BNB
    feeRecipient: '0x0000000000000000000000000000000000000000' // Placeholder
  },
  520: { // XSC
    networkId: 520,
    baseFee: 100000000000000000n, // 0.1 XSC
    percentageFee: 50, // 0.5%
    minimumFee: 50000000000000000n, // 0.05 XSC
    maximumFee: 1000000000000000000n, // 1 XSC
    feeRecipient: '0x0000000000000000000000000000000000000000' // Placeholder
  }
};

// Native token symbols per network
const NETWORK_SYMBOLS: Record<number, string> = {
  1: 'ETH',
  56: 'BNB',
  520: 'XSC'
};

/**
 * Network ID validation for service fees
 */
export const validateNetworkId = (networkId: number): { isValid: boolean; error?: string } => {
  if (typeof networkId !== 'number' || !Number.isInteger(networkId)) {
    return { isValid: false, error: 'Network ID must be an integer' };
  }

  const supportedNetworks = [1, 56, 520];
  if (!supportedNetworks.includes(networkId)) {
    return { isValid: false, error: `Unsupported network ID. Must be one of: ${supportedNetworks.join(', ')}` };
  }

  return { isValid: true };
};

/**
 * Base fee validation
 */
export const validateBaseFee = (baseFee: bigint): { isValid: boolean; error?: string } => {
  if (typeof baseFee !== 'bigint') {
    return { isValid: false, error: 'Base fee must be a valid number' };
  }

  if (baseFee < 0n) {
    return { isValid: false, error: 'Base fee cannot be negative' };
  }

  // Check for reasonable upper limit (10 ETH equivalent)
  const maxBaseFee = 10000000000000000000n; // 10 ETH in wei
  if (baseFee > maxBaseFee) {
    return { isValid: false, error: 'Base fee exceeds reasonable maximum (10 ETH equivalent)' };
  }

  return { isValid: true };
};

/**
 * Percentage fee validation (basis points)
 */
export const validatePercentageFee = (percentageFee: number): { isValid: boolean; error?: string } => {
  if (typeof percentageFee !== 'number' || !Number.isInteger(percentageFee)) {
    return { isValid: false, error: 'Percentage fee must be an integer (basis points)' };
  }

  if (percentageFee < 0) {
    return { isValid: false, error: 'Percentage fee cannot be negative' };
  }

  // Maximum 10% (1000 basis points)
  if (percentageFee > 1000) {
    return { isValid: false, error: 'Percentage fee cannot exceed 10% (1000 basis points)' };
  }

  return { isValid: true };
};

/**
 * Minimum fee validation
 */
export const validateMinimumFee = (minimumFee: bigint): { isValid: boolean; error?: string } => {
  if (typeof minimumFee !== 'bigint') {
    return { isValid: false, error: 'Minimum fee must be a valid number' };
  }

  if (minimumFee < 0n) {
    return { isValid: false, error: 'Minimum fee cannot be negative' };
  }

  return { isValid: true };
};

/**
 * Maximum fee validation
 */
export const validateMaximumFee = (maximumFee: bigint): { isValid: boolean; error?: string } => {
  if (typeof maximumFee !== 'bigint') {
    return { isValid: false, error: 'Maximum fee must be a valid number' };
  }

  if (maximumFee < 0n) {
    return { isValid: false, error: 'Maximum fee cannot be negative' };
  }

  // Check for reasonable upper limit (100 ETH equivalent)
  const maxReasonableFee = 100000000000000000000n; // 100 ETH in wei
  if (maximumFee > maxReasonableFee) {
    return { isValid: false, error: 'Maximum fee exceeds reasonable limit (100 ETH equivalent)' };
  }

  return { isValid: true };
};

/**
 * Fee recipient address validation
 */
export const validateFeeRecipient = (feeRecipient: string): { isValid: boolean; error?: string } => {
  if (!feeRecipient || typeof feeRecipient !== 'string') {
    return { isValid: false, error: 'Fee recipient address is required' };
  }

  // Basic Ethereum address format validation
  if (!/^0x[a-fA-F0-9]{40}$/.test(feeRecipient)) {
    return { isValid: false, error: 'Fee recipient must be a valid Ethereum address' };
  }

  // Check for zero address
  if (feeRecipient === '0x0000000000000000000000000000000000000000') {
    return { isValid: false, error: 'Fee recipient cannot be zero address' };
  }

  return { isValid: true };
};

/**
 * Validate fee structure consistency
 */
export const validateFeeStructureConsistency = (feeStructure: ServiceFeeStructure): { isValid: boolean; error?: string; warnings?: string[] } => {
  const warnings: string[] = [];

  // Minimum fee should not exceed maximum fee
  if (feeStructure.minimumFee > feeStructure.maximumFee) {
    return { isValid: false, error: 'Minimum fee cannot exceed maximum fee' };
  }

  // Base fee should be reasonable compared to min/max
  if (feeStructure.baseFee < feeStructure.minimumFee) {
    warnings.push('Base fee is lower than minimum fee - minimum will be applied');
  }

  if (feeStructure.baseFee > feeStructure.maximumFee) {
    warnings.push('Base fee exceeds maximum fee - maximum will be applied');
  }

  // Check for zero percentage fee
  if (feeStructure.percentageFee === 0 && feeStructure.baseFee === 0n) {
    warnings.push('Both base fee and percentage fee are zero - no service fee will be collected');
  }

  return { isValid: true, warnings };
};

/**
 * Complete service fee structure validation
 */
export const validateServiceFeeStructure = (feeStructure: Partial<ServiceFeeStructure>): ServiceFeeValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate network ID
  if (feeStructure.networkId !== undefined) {
    const networkValidation = validateNetworkId(feeStructure.networkId);
    if (!networkValidation.isValid && networkValidation.error) {
      errors.push(networkValidation.error);
    }
  } else {
    errors.push('Network ID is required');
  }

  // Validate base fee
  if (feeStructure.baseFee !== undefined) {
    const baseFeeValidation = validateBaseFee(feeStructure.baseFee);
    if (!baseFeeValidation.isValid && baseFeeValidation.error) {
      errors.push(baseFeeValidation.error);
    }
  } else {
    errors.push('Base fee is required');
  }

  // Validate percentage fee
  if (feeStructure.percentageFee !== undefined) {
    const percentageValidation = validatePercentageFee(feeStructure.percentageFee);
    if (!percentageValidation.isValid && percentageValidation.error) {
      errors.push(percentageValidation.error);
    }
  } else {
    errors.push('Percentage fee is required');
  }

  // Validate minimum fee
  if (feeStructure.minimumFee !== undefined) {
    const minimumValidation = validateMinimumFee(feeStructure.minimumFee);
    if (!minimumValidation.isValid && minimumValidation.error) {
      errors.push(minimumValidation.error);
    }
  } else {
    errors.push('Minimum fee is required');
  }

  // Validate maximum fee
  if (feeStructure.maximumFee !== undefined) {
    const maximumValidation = validateMaximumFee(feeStructure.maximumFee);
    if (!maximumValidation.isValid && maximumValidation.error) {
      errors.push(maximumValidation.error);
    }
  } else {
    errors.push('Maximum fee is required');
  }

  // Validate fee recipient
  if (feeStructure.feeRecipient !== undefined) {
    const recipientValidation = validateFeeRecipient(feeStructure.feeRecipient);
    if (!recipientValidation.isValid && recipientValidation.error) {
      errors.push(recipientValidation.error);
    }
  } else {
    errors.push('Fee recipient address is required');
  }

  // Validate consistency if all fields are present
  if (isCompleteServiceFeeStructure(feeStructure)) {
    const consistencyValidation = validateFeeStructureConsistency(feeStructure);
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
 * Calculate service fee for a given deployment cost
 */
export const calculateServiceFee = (
  feeStructure: ServiceFeeStructure,
  deploymentCost: bigint
): FeeCalculationResult => {
  // Calculate percentage fee
  const percentageFee = (deploymentCost * BigInt(feeStructure.percentageFee)) / 10000n; // Divide by 10000 for basis points

  // Calculate total before min/max constraints
  let totalFee = feeStructure.baseFee + percentageFee;

  // Apply minimum fee constraint
  if (totalFee < feeStructure.minimumFee) {
    totalFee = feeStructure.minimumFee;
  }

  // Apply maximum fee constraint
  if (totalFee > feeStructure.maximumFee) {
    totalFee = feeStructure.maximumFee;
  }

  const currency = NETWORK_SYMBOLS[feeStructure.networkId] || 'ETH';
  const formattedFee = formatTokenAmount(totalFee, currency);

  return {
    baseFee: feeStructure.baseFee,
    percentageFee,
    totalFee,
    currency,
    formattedFee
  };
};

/**
 * Format token amount for display
 */
export const formatTokenAmount = (amount: bigint, symbol: string): string => {
  // Convert from wei to token units (divide by 10^18)
  const tokenAmount = Number(amount) / 1e18;
  return `${tokenAmount.toFixed(6)} ${symbol}`;
};

/**
 * Get service fee structure for a network
 */
export const getServiceFeeStructure = (networkId: number): ServiceFeeStructure | undefined => {
  return DEFAULT_SERVICE_FEES[networkId];
};

/**
 * Get all supported service fee structures
 */
export const getAllServiceFeeStructures = (): ServiceFeeStructure[] => {
  return Object.values(DEFAULT_SERVICE_FEES);
};

/**
 * Create custom service fee structure with validation
 */
export const createServiceFeeStructure = (
  networkId: number,
  overrides: Partial<Omit<ServiceFeeStructure, 'networkId'>> = {}
): ServiceFeeStructure => {
  const defaultStructure = DEFAULT_SERVICE_FEES[networkId];

  if (!defaultStructure) {
    throw new Error(`Unsupported network ID: ${networkId}`);
  }

  return {
    ...defaultStructure,
    ...overrides
  };
};

/**
 * Check if service fee structure is complete
 */
export const isCompleteServiceFeeStructure = (structure: Partial<ServiceFeeStructure>): structure is ServiceFeeStructure => {
  return !!(
    structure.networkId !== undefined &&
    structure.baseFee !== undefined &&
    structure.percentageFee !== undefined &&
    structure.minimumFee !== undefined &&
    structure.maximumFee !== undefined &&
    structure.feeRecipient !== undefined
  );
};

/**
 * Convert percentage fee to basis points
 */
export const percentageToBasisPoints = (percentage: number): number => {
  return Math.round(percentage * 100);
};

/**
 * Convert basis points to percentage
 */
export const basisPointsToPercentage = (basisPoints: number): number => {
  return basisPoints / 100;
};

/**
 * Export validation functions for browser window global access
 * This is used by Playwright tests to access validation functions
 */
if (typeof window !== 'undefined') {
  (window as any).validateServiceFeeStructure = validateServiceFeeStructure;
  (window as any).validateNetworkId = validateNetworkId;
  (window as any).validateBaseFee = validateBaseFee;
  (window as any).validatePercentageFee = validatePercentageFee;
  (window as any).validateMinimumFee = validateMinimumFee;
  (window as any).validateMaximumFee = validateMaximumFee;
  (window as any).validateFeeRecipient = validateFeeRecipient;
  (window as any).calculateServiceFee = calculateServiceFee;
}

// Type guard for runtime type checking
export const isServiceFeeStructure = (obj: any): obj is ServiceFeeStructure => {
  return obj &&
    typeof obj.networkId === 'number' &&
    typeof obj.baseFee === 'bigint' &&
    typeof obj.percentageFee === 'number' &&
    typeof obj.minimumFee === 'bigint' &&
    typeof obj.maximumFee === 'bigint' &&
    typeof obj.feeRecipient === 'string';
};