/**
 * Components Index
 * 
 * Central export file for all React components. Provides tree-shakable
 * imports and consistent component access across the application.
 * 
 * @author Claude Code - Frontend Component System
 * @created 2025-09-26
 */

// Base UI Components
export * from './ui';

// Main Feature Components
export { default as WalletConnection } from './WalletConnection';
export type { WalletConnectionProps } from './WalletConnection';
export {
  WalletConnectionButton,
  ConnectedWalletDisplay,
  WalletConnectorDialog,
  ConnectionError
} from './WalletConnection';

export { default as NetworkSelector } from './NetworkSelector';
export type { NetworkSelectorProps } from './NetworkSelector';
export {
  NetworkPerformance,
  NetworkGasTracker,
  XscFeatures,
  NetworkCard,
  CompactNetworkIndicator
} from './NetworkSelector';

export { default as TokenBasicForm } from './TokenBasicForm';
export type { TokenBasicFormProps } from './TokenBasicForm';
export {
  TokenSupplyCalculator,
  NetworkConstraints,
  ValidationSummary
} from './TokenBasicForm';

export { default as AdvancedFeaturesForm } from './AdvancedFeaturesForm';
export type { AdvancedFeaturesFormProps } from './AdvancedFeaturesForm';
export {
  FeatureExplanation,
  FeatureCard,
  DependencyWarnings,
  GasCostEstimate
} from './AdvancedFeaturesForm';

export { default as FeaturePreview } from './FeaturePreview';
export type { FeaturePreviewProps } from './FeaturePreview';
export {
  TokenSummaryCard,
  AdvancedFeaturesSummary,
  DeploymentEstimation,
  ContractCodePreview,
  DeploymentChecklist
} from './FeaturePreview';

export {
  TransactionStatus as default,
  TransactionStatusComponent,
  StatusIndicator,
  ConfirmationProgress,
  TransactionDetails,
  TransactionTimeline,
  TransactionStatus as TransactionStatusEnum,
  TransactionType
} from './TransactionStatus';
export type { 
  TransactionStatusProps,
  TransactionData
} from './TransactionStatus';

// Component collections for testing
if (typeof window !== 'undefined') {
  (window as any).TokenFactoryComponents = {
    // UI Components
    UI: (window as any).UIComponents,
    
    // Feature Components
    WalletConnection: (window as any).WalletConnectionComponent,
    NetworkSelector: (window as any).NetworkSelectorComponent,
    TokenBasicForm: (window as any).TokenBasicFormComponent,
    AdvancedFeaturesForm: (window as any).AdvancedFeaturesFormComponent,
    FeaturePreview: (window as any).FeaturePreviewComponent,
    TransactionStatus: (window as any).TransactionStatusComponent,
  };
}