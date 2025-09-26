/**
 * Token Configuration Store
 *
 * Zustand store for managing token configuration state with
 * localStorage persistence, real-time validation, and performance
 * optimizations. Supports multi-chain token deployment configuration.
 *
 * @author Claude Code - Frontend Configuration
 * @created 2025-09-26
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { TokenConfiguration, createTokenConfiguration, validateTokenConfiguration } from '../types/TokenConfiguration';
import { AdvancedFeatures } from '../types/AdvancedFeatures';
import { PermissionSettings } from '../types/PermissionSettings';
import { ValidationResult, CompleteValidation } from '../lib/validation';
import { networkUtils } from '../lib/networks';

/**
 * Token configuration form state interface
 */
export interface TokenConfigForm {
  name: string;
  symbol: string;
  totalSupply: string; // String for form input handling
  decimals: number;
  networkId: number;
  advancedFeatures: AdvancedFeatures;
  permissionSettings: PermissionSettings;
}

/**
 * Store state interface
 */
export interface TokenConfigState {
  // Configuration data
  currentConfig: TokenConfiguration | null;
  configHistory: TokenConfiguration[];
  formData: TokenConfigForm;
  
  // Validation state
  validationResult: ValidationResult | null;
  isValidating: boolean;
  validationErrors: Record<string, string[]>;
  
  // UI state
  isConfiguring: boolean;
  currentStep: 'basic' | 'advanced' | 'permissions' | 'review';
  isDirty: boolean;
  
  // Performance tracking
  lastValidationTime: number;
  validationCount: number;
  
  // Actions
  updateFormField: <K extends keyof TokenConfigForm>(field: K, value: TokenConfigForm[K]) => void;
  updateAdvancedFeatures: (features: Partial<AdvancedFeatures>) => void;
  updatePermissionSettings: (permissions: Partial<PermissionSettings>) => void;
  setNetworkId: (networkId: number) => void;
  
  // Validation actions
  validateConfiguration: () => Promise<void>;
  validateField: <K extends keyof TokenConfigForm>(field: K) => Promise<void>;
  
  // Configuration management
  saveConfiguration: () => Promise<boolean>;
  loadConfiguration: (id: string) => boolean;
  createNewConfiguration: () => void;
  duplicateConfiguration: (id: string) => boolean;
  deleteConfiguration: (id: string) => boolean;
  
  // Step management
  setCurrentStep: (step: typeof currentStep) => void;
  canProceedToStep: (step: typeof currentStep) => boolean;
  
  // Utilities
  resetForm: () => void;
  importConfiguration: (config: TokenConfiguration) => void;
  exportConfiguration: () => TokenConfiguration | null;
  getFormattedSupply: () => string;
  estimateDeploymentCost: () => Promise<{ gasEstimate: bigint; costUSD?: number }>;
}

/**
 * Default form data
 */
const defaultFormData: TokenConfigForm = {
  name: '',
  symbol: '',
  totalSupply: '1000000',
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
  }
};

/**
 * Validation debounce utility
 */
const createValidationDebouncer = () => {
  let timeout: NodeJS.Timeout;
  return (fn: () => void, delay: number = 300) => {
    clearTimeout(timeout);
    timeout = setTimeout(fn, delay);
  };
};

/**
 * Main token configuration store
 */
export const useTokenConfigStore = create<TokenConfigState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => {
        const debounceValidation = createValidationDebouncer();

        return {
          // Initial state
          currentConfig: null,
          configHistory: [],
          formData: { ...defaultFormData },
          validationResult: null,
          isValidating: false,
          validationErrors: {},
          isConfiguring: false,
          currentStep: 'basic',
          isDirty: false,
          lastValidationTime: 0,
          validationCount: 0,

          // Form field updates with automatic validation
          updateFormField: <K extends keyof TokenConfigForm>(field: K, value: TokenConfigForm[K]) => {
            set((state) => {
              state.formData[field] = value;
              state.isDirty = true;
              
              // Clear field-specific errors
              if (state.validationErrors[field]) {
                delete state.validationErrors[field];
              }
            });

            // Debounced validation
            debounceValidation(() => {
              get().validateField(field);
            });
          },

          // Advanced features updates
          updateAdvancedFeatures: (features: Partial<AdvancedFeatures>) => {
            set((state) => {
              state.formData.advancedFeatures = { ...state.formData.advancedFeatures, ...features };
              state.isDirty = true;
            });

            debounceValidation(() => {
              get().validateConfiguration();
            });
          },

          // Permission settings updates
          updatePermissionSettings: (permissions: Partial<PermissionSettings>) => {
            set((state) => {
              state.formData.permissionSettings = { ...state.formData.permissionSettings, ...permissions };
              state.isDirty = true;
            });

            debounceValidation(() => {
              get().validateConfiguration();
            });
          },

          // Network selection with validation
          setNetworkId: (networkId: number) => {
            set((state) => {
              state.formData.networkId = networkId;
              state.isDirty = true;
            });

            // Immediate validation for network changes
            get().validateConfiguration();
          },

          // Field-specific validation
          validateField: async <K extends keyof TokenConfigForm>(field: K) => {
            const state = get();
            const value = state.formData[field];

            try {
              let fieldErrors: string[] = [];

              switch (field) {
                case 'name':
                  const nameValidation = await CompleteValidation.validateTokenConfiguration(
                    { name: value as string },
                    { strict: true }
                  );
                  fieldErrors = nameValidation.errors.filter(error => error.includes('name'));
                  break;
                
                case 'symbol':
                  const symbolValidation = await CompleteValidation.validateTokenConfiguration(
                    { symbol: value as string },
                    { strict: true }
                  );
                  fieldErrors = symbolValidation.errors.filter(error => error.includes('symbol'));
                  break;
                
                case 'totalSupply':
                  try {
                    const supplyBigInt = BigInt(value as string || '0');
                    const supplyValidation = await CompleteValidation.validateTokenConfiguration(
                      { totalSupply: supplyBigInt },
                      { strict: true }
                    );
                    fieldErrors = supplyValidation.errors.filter(error => error.includes('supply'));
                  } catch {
                    fieldErrors = ['Invalid number format for total supply'];
                  }
                  break;
                
                case 'decimals':
                  const decimalsValidation = await CompleteValidation.validateTokenConfiguration(
                    { decimals: value as number },
                    { strict: true }
                  );
                  fieldErrors = decimalsValidation.errors.filter(error => error.includes('decimal'));
                  break;
                
                case 'networkId':
                  if (!networkUtils.isSupportedChain(value as number)) {
                    fieldErrors = [`Unsupported network: ${value}`];
                  }
                  break;
              }

              set((state) => {
                if (fieldErrors.length > 0) {
                  state.validationErrors[field] = fieldErrors;
                } else {
                  delete state.validationErrors[field];
                }
              });

            } catch (error) {
              set((state) => {
                state.validationErrors[field] = [`Validation error: ${error}`];
              });
            }
          },

          // Complete configuration validation
          validateConfiguration: async () => {
            const state = get();
            
            set((state) => {
              state.isValidating = true;
              state.validationCount++;
            });

            try {
              // Convert form data to configuration format
              const configToValidate: Partial<TokenConfiguration> = {
                name: state.formData.name,
                symbol: state.formData.symbol,
                totalSupply: BigInt(state.formData.totalSupply || '0'),
                decimals: state.formData.decimals,
                networkId: state.formData.networkId as any,
                advancedFeatures: state.formData.advancedFeatures,
                permissionSettings: state.formData.permissionSettings
              };

              // Perform comprehensive validation
              const validationResult = await CompleteValidation.validateTokenConfiguration(
                configToValidate,
                {
                  strict: true,
                  includePerformanceWarnings: true,
                  context: {
                    chainId: state.formData.networkId,
                    isMainnet: true
                  }
                }
              );

              set((state) => {
                state.validationResult = validationResult;
                state.lastValidationTime = performance.now();
                
                // Update field-specific errors
                state.validationErrors = {};
                validationResult.errors.forEach(error => {
                  if (error.includes('name')) {
                    state.validationErrors.name = state.validationErrors.name || [];
                    state.validationErrors.name.push(error);
                  } else if (error.includes('symbol')) {
                    state.validationErrors.symbol = state.validationErrors.symbol || [];
                    state.validationErrors.symbol.push(error);
                  } else if (error.includes('supply')) {
                    state.validationErrors.totalSupply = state.validationErrors.totalSupply || [];
                    state.validationErrors.totalSupply.push(error);
                  } else if (error.includes('decimal')) {
                    state.validationErrors.decimals = state.validationErrors.decimals || [];
                    state.validationErrors.decimals.push(error);
                  } else if (error.includes('network')) {
                    state.validationErrors.networkId = state.validationErrors.networkId || [];
                    state.validationErrors.networkId.push(error);
                  }
                });
              });

            } catch (error) {
              set((state) => {
                state.validationResult = {
                  isValid: false,
                  errors: [`Validation failed: ${error}`],
                  warnings: [],
                  severity: 'critical'
                };
              });
            } finally {
              set((state) => {
                state.isValidating = false;
              });
            }
          },

          // Save configuration
          saveConfiguration: async (): Promise<boolean> => {
            const state = get();
            
            // Validate before saving
            await get().validateConfiguration();
            
            if (!state.validationResult?.isValid) {
              return false;
            }

            try {
              const config = createTokenConfiguration({
                id: `token-${Date.now()}`,
                name: state.formData.name,
                symbol: state.formData.symbol,
                totalSupply: BigInt(state.formData.totalSupply),
                decimals: state.formData.decimals,
                networkId: state.formData.networkId as any,
                advancedFeatures: state.formData.advancedFeatures,
                permissionSettings: state.formData.permissionSettings,
                updatedAt: new Date()
              });

              set((state) => {
                state.currentConfig = config;
                state.configHistory = [config, ...state.configHistory.slice(0, 9)]; // Keep last 10
                state.isDirty = false;
              });

              return true;
            } catch (error) {
              console.error('Failed to save configuration:', error);
              return false;
            }
          },

          // Load configuration
          loadConfiguration: (id: string): boolean => {
            const state = get();
            const config = state.configHistory.find(c => c.id === id);
            
            if (!config) return false;

            set((state) => {
              state.currentConfig = config;
              state.formData = {
                name: config.name,
                symbol: config.symbol,
                totalSupply: config.totalSupply.toString(),
                decimals: config.decimals,
                networkId: config.networkId,
                advancedFeatures: config.advancedFeatures,
                permissionSettings: config.permissionSettings
              };
              state.isDirty = false;
              state.validationResult = null;
              state.validationErrors = {};
            });

            // Validate loaded configuration
            get().validateConfiguration();
            return true;
          },

          // Create new configuration
          createNewConfiguration: () => {
            set((state) => {
              state.currentConfig = null;
              state.formData = { ...defaultFormData };
              state.isDirty = false;
              state.validationResult = null;
              state.validationErrors = {};
              state.currentStep = 'basic';
              state.isConfiguring = true;
            });
          },

          // Duplicate configuration
          duplicateConfiguration: (id: string): boolean => {
            const state = get();
            const config = state.configHistory.find(c => c.id === id);
            
            if (!config) return false;

            const duplicated = {
              ...config,
              id: `token-${Date.now()}`,
              name: `${config.name} Copy`,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            set((state) => {
              state.currentConfig = duplicated;
              state.formData = {
                name: duplicated.name,
                symbol: duplicated.symbol,
                totalSupply: duplicated.totalSupply.toString(),
                decimals: duplicated.decimals,
                networkId: duplicated.networkId,
                advancedFeatures: duplicated.advancedFeatures,
                permissionSettings: duplicated.permissionSettings
              };
              state.isDirty = true;
            });

            return true;
          },

          // Delete configuration
          deleteConfiguration: (id: string): boolean => {
            set((state) => {
              state.configHistory = state.configHistory.filter(c => c.id !== id);
              
              // If current config is deleted, clear it
              if (state.currentConfig?.id === id) {
                state.currentConfig = null;
                state.formData = { ...defaultFormData };
                state.isDirty = false;
              }
            });

            return true;
          },

          // Step management
          setCurrentStep: (step) => {
            set((state) => {
              state.currentStep = step;
            });
          },

          canProceedToStep: (step): boolean => {
            const state = get();
            
            switch (step) {
              case 'basic':
                return true;
              
              case 'advanced':
                return state.formData.name.length > 0 && 
                       state.formData.symbol.length > 0 && 
                       state.formData.totalSupply.length > 0;
              
              case 'permissions':
                return state.validationResult?.isValid ?? false;
              
              case 'review':
                return state.validationResult?.isValid ?? false;
              
              default:
                return false;
            }
          },

          // Utility functions
          resetForm: () => {
            set((state) => {
              state.formData = { ...defaultFormData };
              state.currentConfig = null;
              state.isDirty = false;
              state.validationResult = null;
              state.validationErrors = {};
              state.currentStep = 'basic';
            });
          },

          importConfiguration: (config: TokenConfiguration) => {
            set((state) => {
              state.currentConfig = config;
              state.formData = {
                name: config.name,
                symbol: config.symbol,
                totalSupply: config.totalSupply.toString(),
                decimals: config.decimals,
                networkId: config.networkId,
                advancedFeatures: config.advancedFeatures,
                permissionSettings: config.permissionSettings
              };
              state.isDirty = false;
            });

            get().validateConfiguration();
          },

          exportConfiguration: (): TokenConfiguration | null => {
            const state = get();
            return state.currentConfig;
          },

          getFormattedSupply: (): string => {
            const state = get();
            try {
              const supply = BigInt(state.formData.totalSupply || '0');
              const decimals = state.formData.decimals;
              const tokenAmount = Number(supply) / Math.pow(10, decimals);
              return tokenAmount.toLocaleString();
            } catch {
              return '0';
            }
          },

          estimateDeploymentCost: async (): Promise<{ gasEstimate: bigint; costUSD?: number }> => {
            const state = get();
            
            try {
              const gasEstimate = networkUtils.getDeploymentGasEstimate(
                state.formData.networkId as any,
                state.formData.advancedFeatures.mintable ? 'mintableToken' : 'basicToken'
              );

              // In a real implementation, you would fetch current gas prices
              // and token prices to calculate USD cost
              
              return { gasEstimate };
            } catch (error) {
              console.error('Failed to estimate deployment cost:', error);
              return { gasEstimate: 1000000n };
            }
          }
        };
      }),
      {
        name: 'token-config-storage',
        partialize: (state) => ({
          configHistory: state.configHistory,
          currentConfig: state.currentConfig,
          formData: state.formData
        }),
        version: 1,
        migrate: (persistedState: any, version: number) => {
          // Handle version migrations if needed
          return persistedState;
        }
      }
    )
  )
);

/**
 * Selectors for optimized component subscriptions
 */
export const useTokenConfigSelectors = {
  // Form data selectors
  formData: () => useTokenConfigStore(state => state.formData),
  name: () => useTokenConfigStore(state => state.formData.name),
  symbol: () => useTokenConfigStore(state => state.formData.symbol),
  totalSupply: () => useTokenConfigStore(state => state.formData.totalSupply),
  decimals: () => useTokenConfigStore(state => state.formData.decimals),
  networkId: () => useTokenConfigStore(state => state.formData.networkId),
  advancedFeatures: () => useTokenConfigStore(state => state.formData.advancedFeatures),
  permissionSettings: () => useTokenConfigStore(state => state.formData.permissionSettings),

  // Validation selectors
  validationResult: () => useTokenConfigStore(state => state.validationResult),
  isValidating: () => useTokenConfigStore(state => state.isValidating),
  validationErrors: () => useTokenConfigStore(state => state.validationErrors),
  fieldErrors: (field: keyof TokenConfigForm) => useTokenConfigStore(state => state.validationErrors[field] || []),

  // State selectors
  currentConfig: () => useTokenConfigStore(state => state.currentConfig),
  configHistory: () => useTokenConfigStore(state => state.configHistory),
  isDirty: () => useTokenConfigStore(state => state.isDirty),
  currentStep: () => useTokenConfigStore(state => state.currentStep),
  isConfiguring: () => useTokenConfigStore(state => state.isConfiguring),

  // Computed selectors
  isFormValid: () => useTokenConfigStore(state => state.validationResult?.isValid ?? false),
  hasErrors: () => useTokenConfigStore(state => Object.keys(state.validationErrors).length > 0),
  canSave: () => useTokenConfigStore(state => 
    state.validationResult?.isValid && state.isDirty
  ),
  formattedSupply: () => useTokenConfigStore(state => {
    try {
      const supply = BigInt(state.formData.totalSupply || '0');
      const decimals = state.formData.decimals;
      const tokenAmount = Number(supply) / Math.pow(10, decimals);
      return tokenAmount.toLocaleString();
    } catch {
      return '0';
    }
  })
};

/**
 * Store actions for external use
 */
export const useTokenConfigActions = () => ({
  updateFormField: useTokenConfigStore(state => state.updateFormField),
  updateAdvancedFeatures: useTokenConfigStore(state => state.updateAdvancedFeatures),
  updatePermissionSettings: useTokenConfigStore(state => state.updatePermissionSettings),
  setNetworkId: useTokenConfigStore(state => state.setNetworkId),
  validateConfiguration: useTokenConfigStore(state => state.validateConfiguration),
  validateField: useTokenConfigStore(state => state.validateField),
  saveConfiguration: useTokenConfigStore(state => state.saveConfiguration),
  loadConfiguration: useTokenConfigStore(state => state.loadConfiguration),
  createNewConfiguration: useTokenConfigStore(state => state.createNewConfiguration),
  duplicateConfiguration: useTokenConfigStore(state => state.duplicateConfiguration),
  deleteConfiguration: useTokenConfigStore(state => state.deleteConfiguration),
  setCurrentStep: useTokenConfigStore(state => state.setCurrentStep),
  resetForm: useTokenConfigStore(state => state.resetForm),
  importConfiguration: useTokenConfigStore(state => state.importConfiguration),
  exportConfiguration: useTokenConfigStore(state => state.exportConfiguration),
  estimateDeploymentCost: useTokenConfigStore(state => state.estimateDeploymentCost)
});

/**
 * Export store for Playwright testing
 */
if (typeof window !== 'undefined') {
  (window as any).tokenConfigStore = useTokenConfigStore;
  (window as any).tokenConfigSelectors = useTokenConfigSelectors;
  (window as any).tokenConfigActions = useTokenConfigActions;
}

/**
 * Performance monitoring hook
 */
export const useTokenConfigPerformance = () => {
  return useTokenConfigStore(state => ({
    lastValidationTime: state.lastValidationTime,
    validationCount: state.validationCount,
    isValidating: state.isValidating
  }));
};

/**
 * Default export
 */
export default useTokenConfigStore;