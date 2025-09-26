/**
 * Create Token Page
 *
 * Comprehensive token creation interface with multi-step wizard workflow,
 * real-time validation, multi-chain deployment, and accessibility support.
 * Integrates with all Phase 3.7 components and custom hooks for complete
 * token creation experience.
 *
 * Features:
 * - Multi-step wizard with progress tracking
 * - Real-time validation and error handling
 * - Multi-chain deployment with cost comparison
 * - Responsive design with mobile navigation
 * - WCAG 2.1 AA accessibility compliance
 * - Performance optimization with lazy loading
 * - XSC network specific features
 * - State persistence with auto-save
 * - Error recovery and rollback capabilities
 *
 * @author Claude Code - Frontend Page
 * @created 2025-09-26
 */

'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useTokenCreation, WizardStep } from '@/hooks/useTokenCreation';
import { useWalletSelectors } from '@/stores/walletStore';
import { TokenCreationForm } from '@/components/TokenCreationForm';
import { AdvancedFeaturesToggle } from '@/components/AdvancedFeaturesToggle';
import { NetworkSelector } from '@/components/NetworkSelector';
import { SUPPORTED_NETWORKS, getNetworkInfo } from '@/types/TokenConfiguration';

// Lazy loaded components for performance
const TokenConfigurationReview = React.lazy(() => import('@/components/TokenConfigurationReview'));
const DeploymentProgress = React.lazy(() => import('@/components/DeploymentProgress'));

/**
 * Step component interface
 */
interface StepComponentProps {
  configuration: any;
  validation: any;
  onUpdate: (updates: any) => void;
  onNext: () => Promise<boolean>;
  onPrevious: () => Promise<boolean>;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Loading component
 */
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

/**
 * Step navigation component
 */
const StepNavigation: React.FC<{
  currentStep: WizardStep;
  completedSteps: Set<WizardStep>;
  availableSteps: WizardStep[];
  stepLabels: Record<WizardStep, string>;
  onStepClick: (step: WizardStep) => void;
  isReadonly?: boolean;
}> = ({ currentStep, completedSteps, availableSteps, stepLabels, onStepClick, isReadonly = false }) => {
  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 md:gap-4 p-4 bg-muted/50 rounded-lg"
      role="tablist"
      aria-label="Token creation steps"
    >
      {availableSteps.map((step, index) => {
        const isActive = step === currentStep;
        const isCompleted = completedSteps.has(step);
        const isClickable = !isReadonly && (isCompleted || step === currentStep);

        return (
          <button
            key={step}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`step-panel-${step}`}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary
              ${isActive
                ? 'bg-primary text-primary-foreground shadow-md'
                : isCompleted
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : isClickable
                ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
              }
            `}
            onClick={() => isClickable && onStepClick(step)}
            disabled={!isClickable}
          >
            <span className={`
              flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
              ${isCompleted ? 'bg-green-500 text-white' : 'bg-current text-current opacity-70'}
            `}>
              {isCompleted ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </span>
            <span className="hidden sm:inline">{stepLabels[step]}</span>
          </button>
        );
      })}
    </nav>
  );
};

/**
 * Basic information step
 */
const BasicInfoStep: React.FC<StepComponentProps> = ({
  configuration,
  validation,
  onUpdate,
  isValid,
  errors,
  warnings
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Basic Token Information</h2>
        <p className="text-muted-foreground">
          Enter the fundamental details for your token
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Token Details</CardTitle>
          <CardDescription>
            Define your token&apos;s name, symbol, supply, and decimals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TokenCreationForm
            configuration={configuration}
            onUpdate={onUpdate}
            validation={validation}
            step="basic"
          />
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Please fix the following issues:</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Recommendations:</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

/**
 * Advanced features step
 */
const AdvancedFeaturesStep: React.FC<StepComponentProps> = ({
  configuration,
  validation,
  onUpdate,
  isValid,
  errors,
  warnings
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Advanced Features</h2>
        <p className="text-muted-foreground">
          Configure optional advanced functionality for your token
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Token Features</CardTitle>
          <CardDescription>
            Enable advanced capabilities like minting, burning, and pausing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdvancedFeaturesToggle
            features={configuration.advancedFeatures}
            onUpdate={(features) => onUpdate({ advancedFeatures: features })}
            validation={validation}
          />
        </CardContent>
      </Card>

      {warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Feature Recommendations:</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

/**
 * Permissions step
 */
const PermissionsStep: React.FC<StepComponentProps> = ({
  configuration,
  validation,
  onUpdate,
  isValid,
  errors,
  warnings
}) => {
  const { address, isConnected } = useWalletSelectors.connection();

  const handlePermissionUpdate = useCallback((permissions: any) => {
    onUpdate({ permissionSettings: permissions });
  }, [onUpdate]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Permissions & Ownership</h2>
        <p className="text-muted-foreground">
          Configure access control and ownership settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ownership Settings</CardTitle>
          <CardDescription>
            Define who can manage your token and what actions they can perform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TokenCreationForm
            configuration={configuration}
            onUpdate={onUpdate}
            validation={validation}
            step="permissions"
          />
        </CardContent>
      </Card>

      {isConnected && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Current Wallet</AlertTitle>
          <AlertDescription>
            Connected: {address}
            <br />
            This address will be set as the initial owner unless specified otherwise.
          </AlertDescription>
        </Alert>
      )}

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Permission Errors:</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

/**
 * Network selection step
 */
const NetworkSelectionStep: React.FC<StepComponentProps> = ({
  configuration,
  validation,
  onUpdate,
  isValid,
  errors,
  warnings
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Network Selection</h2>
        <p className="text-muted-foreground">
          Choose the blockchain network for your token deployment
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Target Network</CardTitle>
          <CardDescription>
            Select the blockchain network where your token will be deployed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NetworkSelector
            selectedChainId={configuration.networkId}
            onNetworkSelect={(networkId) => onUpdate({ networkId })}
            showComparison={true}
            enableCostComparison={true}
          />
        </CardContent>
      </Card>

      {configuration.networkId === 520 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>XSC Network Benefits</AlertTitle>
          <AlertDescription>
            You&apos;ve selected XSC Network, which offers:
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Lower gas costs and faster transactions</li>
              <li>EVM compatibility with enhanced features</li>
              <li>Optimized for token deployments</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Network Selection Errors:</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

/**
 * Review step
 */
const ReviewStep: React.FC<StepComponentProps> = ({
  configuration,
  validation,
  onUpdate,
  isValid,
  errors,
  warnings
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Review Configuration</h2>
        <p className="text-muted-foreground">
          Review your token configuration before deployment
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner message="Loading configuration review..." />}>
        <TokenConfigurationReview
          configuration={configuration}
          validation={validation}
          showCostBreakdown={true}
        />
      </Suspense>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configuration Issues:</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Final Recommendations:</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

/**
 * Deployment step
 */
const DeploymentStep: React.FC<StepComponentProps> = ({
  configuration,
  validation,
  onUpdate,
  isValid,
  errors,
  warnings
}) => {
  const {
    isDeploying,
    deploymentProgress,
    deploymentStep,
    deploymentTransactionHash,
    deploymentError,
    deployToken,
    canAffordDeployment
  } = useTokenCreation();
  const { toast } = useToast();
  const router = useRouter();

  const handleDeploy = useCallback(async () => {
    try {
      const result = await deployToken();

      if (result.success) {
        toast({
          title: 'Deployment Successful!',
          description: `Token deployed successfully. Transaction: ${result.transactionHash}`,
        });
        router.push(`/my-tokens?deployed=${result.transactionHash}`);
      } else {
        toast({
          title: 'Deployment Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Deployment Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  }, [deployToken, toast, router]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Deploy Token</h2>
        <p className="text-muted-foreground">
          Deploy your token to the blockchain
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deployment Status</CardTitle>
          <CardDescription>
            Monitor your token deployment progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoadingSpinner message="Loading deployment interface..." />}>
            <DeploymentProgress
              isDeploying={isDeploying}
              progress={deploymentProgress}
              currentStep={deploymentStep}
              transactionHash={deploymentTransactionHash}
              error={deploymentError}
              configuration={configuration}
            />
          </Suspense>

          {!isDeploying && (
            <div className="mt-6 space-y-4">
              <Button
                size="lg"
                className="w-full"
                onClick={handleDeploy}
                disabled={!canAffordDeployment || !isValid || isDeploying}
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  'Deploy Token'
                )}
              </Button>

              {!canAffordDeployment && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Insufficient Balance</AlertTitle>
                  <AlertDescription>
                    You don&apos;t have enough funds to deploy this token.
                    Please add more funds to your wallet.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Deployment Issues:</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

/**
 * Step component mapping
 */
const STEP_COMPONENTS: Record<WizardStep, React.FC<StepComponentProps>> = {
  [WizardStep.BASIC_INFO]: BasicInfoStep,
  [WizardStep.ADVANCED_FEATURES]: AdvancedFeaturesStep,
  [WizardStep.PERMISSIONS]: PermissionsStep,
  [WizardStep.NETWORK_SELECTION]: NetworkSelectionStep,
  [WizardStep.REVIEW]: ReviewStep,
  [WizardStep.DEPLOYMENT]: DeploymentStep
};

/**
 * Main Create Token Page Component
 */
const CreateTokenPage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { isConnected } = useWalletSelectors.connection();

  // Token creation workflow
  const {
    // State
    navigation,
    stepValidation,
    configuration,
    isDeploying,
    hasUnsavedChanges,
    currentStepLabel,
    currentStepValid,
    hasErrors,
    hasWarnings,

    // Navigation
    goToStep,
    nextStep,
    previousStep,

    // Configuration
    updateConfiguration,

    // Utilities
    resetWizard,
    loadSavedConfiguration,

    // Constants
    STEP_LABELS,
    WizardStep
  } = useTokenCreation();

  const [isLoading, setIsLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  /**
   * Initialize page
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check for saved configuration
        const loaded = await loadSavedConfiguration();
        if (loaded) {
          toast({
            title: 'Draft Restored',
            description: 'Your previous configuration has been loaded.',
          });
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [loadSavedConfiguration, toast]);

  /**
   * Handle beforeunload for unsaved changes
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  /**
   * Handle step navigation
   */
  const handleStepClick = useCallback(async (step: WizardStep) => {
    const success = await goToStep(step);
    if (!success) {
      toast({
        title: 'Navigation Failed',
        description: 'Please complete the current step before proceeding.',
        variant: 'destructive',
      });
    }
  }, [goToStep, toast]);

  const handleNext = useCallback(async () => {
    const success = await nextStep();
    if (!success) {
      toast({
        title: 'Validation Failed',
        description: 'Please fix the errors in the current step.',
        variant: 'destructive',
      });
    }
  }, [nextStep, toast]);

  const handlePrevious = useCallback(async () => {
    await previousStep();
  }, [previousStep]);

  /**
   * Handle reset
   */
  const handleReset = useCallback(() => {
    resetWizard();
    setShowResetConfirm(false);
    toast({
      title: 'Wizard Reset',
      description: 'The token creation wizard has been reset.',
    });
  }, [resetWizard, toast]);

  /**
   * Handle back to home
   */
  const handleBackToHome = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmed) return;
    }
    router.push('/');
  }, [router, hasUnsavedChanges]);

  /**
   * Get current step component
   */
  const CurrentStepComponent = STEP_COMPONENTS[navigation.currentStep];
  const currentValidation = stepValidation[navigation.currentStep];

  /**
   * Check wallet connection requirement
   */
  if (!isLoading && !isConnected && navigation.currentStep !== WizardStep.BASIC_INFO) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Wallet Connection Required</CardTitle>
            <CardDescription>
              Please connect your wallet to continue with token creation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Connection Needed</AlertTitle>
              <AlertDescription>
                You need to connect your wallet to proceed beyond the basic information step.
                This ensures proper network selection and deployment capabilities.
              </AlertDescription>
            </Alert>
            <div className="mt-4 flex space-x-4">
              <Button onClick={() => goToStep(WizardStep.BASIC_INFO)}>
                Back to Basic Info
              </Button>
              <Button variant="outline" onClick={handleBackToHome}>
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Initializing token creation wizard..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Create Token</h1>
              <p className="text-muted-foreground">
                Deploy your custom ERC-20 token across multiple networks
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Unsaved Changes
                </Badge>
              )}
              <Button variant="ghost" onClick={handleBackToHome}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress: {currentStepLabel}</span>
              <span>{navigation.progress}% Complete</span>
            </div>
            <Progress value={navigation.progress} className="w-full" />
          </div>
        </div>

        {/* Step navigation */}
        <StepNavigation
          currentStep={navigation.currentStep}
          completedSteps={navigation.completedSteps}
          availableSteps={navigation.availableSteps}
          stepLabels={STEP_LABELS}
          onStepClick={handleStepClick}
          isReadonly={isDeploying}
        />

        <Separator className="my-8" />

        {/* Main content */}
        <div className="space-y-8">
          <div
            id={`step-panel-${navigation.currentStep}`}
            role="tabpanel"
            aria-labelledby={`step-tab-${navigation.currentStep}`}
          >
            <CurrentStepComponent
              configuration={configuration}
              validation={currentValidation}
              onUpdate={updateConfiguration}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isValid={currentStepValid}
              errors={currentValidation?.errors || []}
              warnings={currentValidation?.warnings || []}
            />
          </div>

          {/* Navigation buttons */}
          {navigation.currentStep !== WizardStep.DEPLOYMENT && (
            <div className="flex items-center justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={!navigation.canGoPrevious || isDeploying}
                className="min-w-24"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowResetConfirm(true)}
                  disabled={isDeploying}
                >
                  Reset
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!navigation.canGoNext || isDeploying}
                  className="min-w-24"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Reset confirmation dialog */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Reset Wizard</CardTitle>
                <CardDescription>
                  Are you sure you want to reset the token creation wizard?
                  This will clear all entered data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTokenPage;