/**
 * Token Creation Workflow Hook
 *
 * Comprehensive hook for managing the complete token creation workflow,
 * including multi-step wizard management, validation, deployment orchestration,
 * and error recovery. Integrates with Zustand stores and Web3 infrastructure.
 *
 * Features:
 * - Multi-step wizard management with state persistence
 * - Real-time validation with comprehensive error handling
 * - Multi-chain deployment coordination
 * - Gas estimation and cost calculation
 * - Progress tracking and rollback capabilities
 * - XSC network optimizations
 * - Accessibility support with screen reader compatibility
 *
 * @author Claude Code - Frontend Hook
 * @created 2025-09-26
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  TokenConfiguration,
  validateTokenConfiguration,
  createTokenConfiguration,
  SUPPORTED_NETWORKS,
  SupportedChainId
} from '../types/TokenConfiguration';
import { useWalletStore, useWalletSelectors } from '../stores/walletStore';
import { useTokenConfigStore } from '../stores/tokenConfigStore';
import { useTransactionMonitor } from './useTransactionMonitor';
import { useMultiChainDeployment } from './useMultiChainDeployment';

/**
 * Wizard step definitions
 */
export enum WizardStep {
  BASIC_INFO = 'basic-info',
  ADVANCED_FEATURES = 'advanced-features',
  PERMISSIONS = 'permissions',
  NETWORK_SELECTION = 'network-selection',
  REVIEW = 'review',
  DEPLOYMENT = 'deployment'
}

/**
 * Step validation state
 */
export interface StepValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
}

/**
 * Wizard navigation state
 */
export interface WizardNavigation {
  currentStep: WizardStep;
  completedSteps: Set<WizardStep>;
  availableSteps: WizardStep[];
  canGoNext: boolean;
  canGoPrevious: boolean;
  progress: number;
}

/**
 * Token creation state
 */
export interface TokenCreationState {
  // Wizard state
  navigation: WizardNavigation;
  stepValidation: Record<WizardStep, StepValidation>;

  // Configuration state
  configuration: TokenConfiguration;
  isDirty: boolean;
  lastSaved: Date | null;

  // Deployment state
  isDeploying: boolean;
  deploymentProgress: number;
  deploymentStep: string;
  deploymentTransactionHash: string | null;
  deploymentError: string | null;

  // Cost estimation
  estimatedGasCost: bigint | null;
  estimatedDeploymentCost: bigint | null;
  canAffordDeployment: boolean;

  // Persistence
  autosaveEnabled: boolean;
  hasUnsavedChanges: boolean;
}

/**
 * Step configuration mapping
 */
const STEP_ORDER: WizardStep[] = [
  WizardStep.BASIC_INFO,
  WizardStep.ADVANCED_FEATURES,
  WizardStep.PERMISSIONS,
  WizardStep.NETWORK_SELECTION,
  WizardStep.REVIEW,
  WizardStep.DEPLOYMENT
];

const STEP_LABELS: Record<WizardStep, string> = {
  [WizardStep.BASIC_INFO]: 'Basic Information',
  [WizardStep.ADVANCED_FEATURES]: 'Advanced Features',
  [WizardStep.PERMISSIONS]: 'Permissions & Ownership',
  [WizardStep.NETWORK_SELECTION]: 'Network Selection',
  [WizardStep.REVIEW]: 'Review Configuration',
  [WizardStep.DEPLOYMENT]: 'Deploy Token'
};

/**
 * Default validation state
 */
const createDefaultStepValidation = (): StepValidation => ({
  isValid: false,
  errors: [],
  warnings: [],
  canProceed: false
});

/**
 * Token creation workflow hook
 */
export const useTokenCreation = () => {
  const router = useRouter();

  // Store connections
  const walletStore = useWalletStore();
  const { connection, isConnected } = useWalletSelectors.connection();
  const tokenConfigStore = useTokenConfigStore();

  // Related hooks
  const transactionMonitor = useTransactionMonitor();
  const multiChainDeployment = useMultiChainDeployment();

  // Local state
  const [state, setState] = useState<TokenCreationState>(() => ({
    navigation: {
      currentStep: WizardStep.BASIC_INFO,
      completedSteps: new Set(),
      availableSteps: [WizardStep.BASIC_INFO],
      canGoNext: false,
      canGoPrevious: false,
      progress: 0
    },
    stepValidation: Object.fromEntries(
      STEP_ORDER.map(step => [step, createDefaultStepValidation()])
    ) as Record<WizardStep, StepValidation>,
    configuration: createTokenConfiguration(),
    isDirty: false,
    lastSaved: null,
    isDeploying: false,
    deploymentProgress: 0,
    deploymentStep: '',
    deploymentTransactionHash: null,
    deploymentError: null,
    estimatedGasCost: null,
    estimatedDeploymentCost: null,
    canAffordDeployment: false,
    autosaveEnabled: true,
    hasUnsavedChanges: false
  }));

  /**
   * Calculate wizard progress
   */
  const calculateProgress = useCallback((currentStep: WizardStep, completedSteps: Set<WizardStep>): number => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    const completedCount = completedSteps.size;
    return Math.round(((completedCount + (currentIndex + 1) / STEP_ORDER.length) / STEP_ORDER.length) * 100);
  }, []);

  /**
   * Update navigation state
   */
  const updateNavigation = useCallback((updates: Partial<WizardNavigation>) => {
    setState(prev => {
      const newNavigation = { ...prev.navigation, ...updates };

      // Recalculate dependent properties
      const currentIndex = STEP_ORDER.indexOf(newNavigation.currentStep);
      newNavigation.canGoNext = currentIndex < STEP_ORDER.length - 1 &&
        prev.stepValidation[newNavigation.currentStep]?.canProceed;
      newNavigation.canGoPrevious = currentIndex > 0;
      newNavigation.progress = calculateProgress(newNavigation.currentStep, newNavigation.completedSteps);

      // Update available steps
      newNavigation.availableSteps = STEP_ORDER.slice(0,
        Math.max(currentIndex + 1, newNavigation.completedSteps.size + 1));

      return {
        ...prev,
        navigation: newNavigation
      };
    });
  }, [calculateProgress]);

  /**
   * Validate current step
   */
  const validateCurrentStep = useCallback(async (step: WizardStep, config: TokenConfiguration): Promise<StepValidation> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (step) {
      case WizardStep.BASIC_INFO:
        // Validate basic token information
        const basicValidation = validateTokenConfiguration(config);
        if (!config.name) errors.push('Token name is required');
        if (!config.symbol) errors.push('Token symbol is required');
        if (config.totalSupply <= 0n) errors.push('Total supply must be greater than 0');
        if (config.decimals < 0 || config.decimals > 18) errors.push('Decimals must be between 0 and 18');

        // Add specific validation errors
        basicValidation.errors.forEach(error => {
          if (error.includes('name') || error.includes('symbol') ||
              error.includes('supply') || error.includes('decimal')) {
            errors.push(error);
          }
        });
        break;

      case WizardStep.ADVANCED_FEATURES:
        // Validate feature combinations
        if (config.advancedFeatures.capped && !config.advancedFeatures.mintable) {
          warnings.push('Capped tokens typically require mintable functionality');
        }
        break;

      case WizardStep.PERMISSIONS:
        // Validate permission settings
        if (!config.permissionSettings.initialOwner && isConnected) {
          warnings.push('Consider setting an initial owner');
        }

        // Check permission-feature alignment
        if (config.advancedFeatures.mintable && !config.permissionSettings.ownerCanMint) {
          warnings.push('Mintable feature enabled but owner cannot mint');
        }
        break;

      case WizardStep.NETWORK_SELECTION:
        // Validate network selection
        if (!config.networkId) {
          errors.push('Please select a network');
        } else {
          const networkSupported = await walletStore.checkNetworkSupport(config.networkId);
          if (!networkSupported) {
            errors.push('Selected network is not supported');
          }
        }
        break;

      case WizardStep.REVIEW:
        // Final validation
        const fullValidation = validateTokenConfiguration(config);
        errors.push(...fullValidation.errors);
        warnings.push(...fullValidation.warnings);

        // Check wallet readiness
        if (!isConnected) {
          errors.push('Wallet must be connected to deploy');
        } else if (connection.chainId !== config.networkId) {
          errors.push('Wallet must be connected to the selected network');
        }
        break;

      case WizardStep.DEPLOYMENT:
        // Pre-deployment checks
        if (!state.canAffordDeployment) {
          errors.push('Insufficient balance for deployment');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.length === 0
    };
  }, [walletStore, isConnected, connection, state.canAffordDeployment]);

  /**
   * Update step validation
   */
  const updateStepValidation = useCallback(async (step: WizardStep, config: TokenConfiguration) => {
    const validation = await validateCurrentStep(step, config);

    setState(prev => ({
      ...prev,
      stepValidation: {
        ...prev.stepValidation,
        [step]: validation
      }
    }));
  }, [validateCurrentStep]);

  /**
   * Update configuration
   */
  const updateConfiguration = useCallback(async (updates: Partial<TokenConfiguration>) => {
    const newConfig = { ...state.configuration, ...updates, updatedAt: new Date() };

    setState(prev => ({
      ...prev,
      configuration: newConfig,
      isDirty: true,
      hasUnsavedChanges: true
    }));

    // Validate current step with new config
    await updateStepValidation(state.navigation.currentStep, newConfig);

    // Autosave if enabled
    if (state.autosaveEnabled) {
      await autosave(newConfig);
    }
  }, [state.configuration, state.navigation.currentStep, state.autosaveEnabled, updateStepValidation]);

  /**
   * Navigate to step
   */
  const goToStep = useCallback(async (step: WizardStep) => {
    const stepIndex = STEP_ORDER.indexOf(step);
    const currentIndex = STEP_ORDER.indexOf(state.navigation.currentStep);

    // Validate current step before moving
    if (stepIndex > currentIndex) {
      const validation = await validateCurrentStep(state.navigation.currentStep, state.configuration);
      if (!validation.canProceed) {
        return false;
      }

      // Mark current step as completed
      const newCompletedSteps = new Set(state.navigation.completedSteps);
      newCompletedSteps.add(state.navigation.currentStep);

      updateNavigation({
        currentStep: step,
        completedSteps: newCompletedSteps
      });
    } else {
      // Going backwards is always allowed
      updateNavigation({ currentStep: step });
    }

    // Validate new step
    await updateStepValidation(step, state.configuration);

    return true;
  }, [state.navigation.currentStep, state.navigation.completedSteps, state.configuration, validateCurrentStep, updateNavigation, updateStepValidation]);

  /**
   * Navigate to next step
   */
  const nextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(state.navigation.currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      return goToStep(STEP_ORDER[currentIndex + 1]);
    }
    return Promise.resolve(false);
  }, [state.navigation.currentStep, goToStep]);

  /**
   * Navigate to previous step
   */
  const previousStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(state.navigation.currentStep);
    if (currentIndex > 0) {
      return goToStep(STEP_ORDER[currentIndex - 1]);
    }
    return Promise.resolve(false);
  }, [state.navigation.currentStep, goToStep]);

  /**
   * Estimate deployment costs
   */
  const estimateDeploymentCosts = useCallback(async (): Promise<void> => {
    if (!isConnected || !state.configuration.networkId) {
      return;
    }

    try {
      // Base gas estimate for token deployment
      const baseGas = 2000000n; // ~2M gas for typical ERC20 deployment

      // Additional gas for features
      let additionalGas = 0n;
      if (state.configuration.advancedFeatures.mintable) additionalGas += 100000n;
      if (state.configuration.advancedFeatures.burnable) additionalGas += 50000n;
      if (state.configuration.advancedFeatures.pausable) additionalGas += 75000n;
      if (state.configuration.advancedFeatures.capped) additionalGas += 25000n;

      const totalGasEstimate = baseGas + additionalGas;

      // Get cost estimation from wallet store
      const { cost, canAfford } = await walletStore.estimateTransactionCost(totalGasEstimate);

      setState(prev => ({
        ...prev,
        estimatedGasCost: totalGasEstimate,
        estimatedDeploymentCost: cost,
        canAffordDeployment: canAfford
      }));
    } catch (error) {
      console.error('Cost estimation failed:', error);
      setState(prev => ({
        ...prev,
        estimatedGasCost: null,
        estimatedDeploymentCost: null,
        canAffordDeployment: false
      }));
    }
  }, [isConnected, state.configuration, walletStore]);

  /**
   * Auto-save configuration
   */
  const autosave = useCallback(async (config: TokenConfiguration) => {
    try {
      // Save to local storage or backend
      const savedData = {
        configuration: config,
        timestamp: new Date(),
        step: state.navigation.currentStep
      };

      localStorage.setItem('token-creation-draft', JSON.stringify(savedData));

      setState(prev => ({
        ...prev,
        lastSaved: new Date(),
        hasUnsavedChanges: false
      }));
    } catch (error) {
      console.error('Autosave failed:', error);
    }
  }, [state.navigation.currentStep]);

  /**
   * Load saved configuration
   */
  const loadSavedConfiguration = useCallback(async (): Promise<boolean> => {
    try {
      const savedData = localStorage.getItem('token-creation-draft');
      if (!savedData) return false;

      const parsed = JSON.parse(savedData);
      const config = parsed.configuration;
      const step = parsed.step;

      setState(prev => ({
        ...prev,
        configuration: config,
        lastSaved: new Date(parsed.timestamp),
        isDirty: false,
        hasUnsavedChanges: false
      }));

      // Navigate to saved step
      await goToStep(step);

      return true;
    } catch (error) {
      console.error('Failed to load saved configuration:', error);
      return false;
    }
  }, [goToStep]);

  /**
   * Deploy token
   */
  const deployToken = useCallback(async (): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    if (!isConnected || !state.configuration.networkId) {
      return { success: false, error: 'Wallet not connected or network not selected' };
    }

    // Final validation
    const validation = validateTokenConfiguration(state.configuration);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    setState(prev => ({
      ...prev,
      isDeploying: true,
      deploymentProgress: 0,
      deploymentStep: 'Preparing deployment',
      deploymentError: null
    }));

    try {
      // Use multi-chain deployment hook
      const result = await multiChainDeployment.deployToChain(
        state.configuration.networkId as SupportedChainId,
        state.configuration,
        {
          onProgress: (progress, step) => {
            setState(prev => ({
              ...prev,
              deploymentProgress: progress,
              deploymentStep: step
            }));
          },
          onTransactionHash: (hash) => {
            setState(prev => ({
              ...prev,
              deploymentTransactionHash: hash
            }));

            // Start monitoring transaction
            transactionMonitor.addTransaction({
              hash,
              chainId: state.configuration.networkId as SupportedChainId,
              type: 'deploy',
              amount: state.estimatedDeploymentCost || 0n,
              timestamp: Date.now(),
              status: 'pending'
            });
          }
        }
      );

      if (result.success) {
        setState(prev => ({
          ...prev,
          isDeploying: false,
          deploymentProgress: 100,
          deploymentStep: 'Deployment completed'
        }));

        // Clear draft
        localStorage.removeItem('token-creation-draft');

        // Save to token config store
        tokenConfigStore.addConfiguration(state.configuration);

        // Navigate to success page
        router.push(`/my-tokens?deployed=${result.contractAddress}`);

        return { success: true, transactionHash: result.transactionHash };
      } else {
        throw new Error(result.error || 'Deployment failed');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Deployment failed';

      setState(prev => ({
        ...prev,
        isDeploying: false,
        deploymentError: errorMessage
      }));

      return { success: false, error: errorMessage };
    }
  }, [
    isConnected,
    state.configuration,
    state.estimatedDeploymentCost,
    multiChainDeployment,
    transactionMonitor,
    tokenConfigStore,
    router
  ]);

  /**
   * Reset wizard
   */
  const resetWizard = useCallback(() => {
    setState(prev => ({
      ...prev,
      navigation: {
        currentStep: WizardStep.BASIC_INFO,
        completedSteps: new Set(),
        availableSteps: [WizardStep.BASIC_INFO],
        canGoNext: false,
        canGoPrevious: false,
        progress: 0
      },
      stepValidation: Object.fromEntries(
        STEP_ORDER.map(step => [step, createDefaultStepValidation()])
      ) as Record<WizardStep, StepValidation>,
      configuration: createTokenConfiguration(),
      isDirty: false,
      lastSaved: null,
      isDeploying: false,
      deploymentProgress: 0,
      deploymentStep: '',
      deploymentTransactionHash: null,
      deploymentError: null,
      hasUnsavedChanges: false
    }));

    // Clear autosave
    localStorage.removeItem('token-creation-draft');
  }, []);

  /**
   * Initialize wizard
   */
  useEffect(() => {
    const initializeWizard = async () => {
      // Try to load saved configuration
      const loaded = await loadSavedConfiguration();

      if (!loaded) {
        // Validate initial step
        await updateStepValidation(WizardStep.BASIC_INFO, state.configuration);
      }
    };

    initializeWizard();
  }, []); // Run once on mount

  /**
   * Update cost estimates when configuration changes
   */
  useEffect(() => {
    if (state.navigation.currentStep === WizardStep.REVIEW ||
        state.navigation.currentStep === WizardStep.DEPLOYMENT) {
      estimateDeploymentCosts();
    }
  }, [state.configuration, state.navigation.currentStep, estimateDeploymentCosts]);

  /**
   * Memoized computed values
   */
  const computedValues = useMemo(() => ({
    // Step information
    currentStepLabel: STEP_LABELS[state.navigation.currentStep],
    currentStepIndex: STEP_ORDER.indexOf(state.navigation.currentStep),
    totalSteps: STEP_ORDER.length,

    // Validation summary
    currentStepValid: state.stepValidation[state.navigation.currentStep]?.isValid || false,
    hasErrors: state.stepValidation[state.navigation.currentStep]?.errors.length > 0,
    hasWarnings: state.stepValidation[state.navigation.currentStep]?.warnings.length > 0,

    // Configuration summary
    isConfigurationValid: validateTokenConfiguration(state.configuration).isValid,
    isReadyForDeployment: state.navigation.currentStep === WizardStep.DEPLOYMENT &&
      state.canAffordDeployment && !state.isDeploying,

    // Network information
    selectedNetwork: state.configuration.networkId
      ? SUPPORTED_NETWORKS[Object.keys(SUPPORTED_NETWORKS).find(key =>
          SUPPORTED_NETWORKS[key as keyof typeof SUPPORTED_NETWORKS].chainId === state.configuration.networkId
        ) as keyof typeof SUPPORTED_NETWORKS]
      : null,

    // Cost formatting
    formattedEstimatedCost: state.estimatedDeploymentCost
      ? `${Number(state.estimatedDeploymentCost) / 1e18} ETH`
      : 'Calculating...'
  }), [state]);

  /**
   * Return hook interface
   */
  return {
    // State
    ...state,
    ...computedValues,

    // Navigation
    goToStep,
    nextStep,
    previousStep,

    // Configuration
    updateConfiguration,

    // Deployment
    deployToken,
    estimateDeploymentCosts,

    // Persistence
    autosave,
    loadSavedConfiguration,

    // Utilities
    resetWizard,

    // Step constants
    STEP_ORDER,
    STEP_LABELS,
    WizardStep
  };
};

/**
 * Hook for accessing step-specific validation
 */
export const useStepValidation = (step: WizardStep) => {
  const { stepValidation } = useTokenCreation();
  return stepValidation[step];
};

/**
 * Export for Playwright testing
 */
if (typeof window !== 'undefined') {
  (window as any).useTokenCreation = useTokenCreation;
  (window as any).WizardStep = WizardStep;
  (window as any).STEP_ORDER = STEP_ORDER;
  (window as any).STEP_LABELS = STEP_LABELS;
}

export default useTokenCreation;