/**
 * Token Basic Form Component
 * 
 * Comprehensive token configuration form with real-time validation,
 * accessibility features, and integration with Zustand store.
 * Supports multi-chain deployment with network-specific constraints.
 * 
 * @author Claude Code - Frontend Component
 * @created 2025-09-26
 */

import * as React from "react";
import { 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Calculator,
  Hash,
  Type,
  Coins,
  Network
} from "lucide-react";

import { 
  Button,
  Input,
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch
} from "./ui";

import {
  cn,
  formatTokenAmount,
  debounce,
  announceToScreenReader
} from "./ui/utils";

import {
  useTokenConfigStore,
  useTokenConfigSelectors,
  useTokenConfigActions
} from "../stores/tokenConfigStore";

import { useWalletSelectors } from "../stores/walletStore";

import {
  SUPPORTED_NETWORKS,
  validateTokenName,
  validateTokenSymbol,
  type SupportedChainId
} from "../types/TokenConfiguration";

import {
  SUPPORTED_CHAIN_IDS,
  NETWORK_METADATA,
  networkUtils
} from "../lib/networks";

import { NetworkSelector } from "./NetworkSelector";

/**
 * Component props interface
 */
export interface TokenBasicFormProps {
  /** Form completion callback */
  onComplete?: (isValid: boolean) => void;
  /** Show advanced options */
  showAdvanced?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Disable form fields */
  disabled?: boolean;
}

/**
 * Token supply calculator component
 */
export const TokenSupplyCalculator: React.FC<{
  supply: string;
  decimals: number;
  onSupplyChange: (supply: string) => void;
}> = ({ supply, decimals, onSupplyChange }) => {
  const [calculatorMode, setCalculatorMode] = React.useState<'manual' | 'calculated'>('manual');
  const [userFriendlyAmount, setUserFriendlyAmount] = React.useState<string>('');

  // Calculate human-readable amount
  const displayAmount = React.useMemo(() => {
    if (!supply || supply === '0') return '0';
    
    try {
      const supplyBigInt = BigInt(supply);
      const divisor = BigInt(10 ** decimals);
      const humanReadable = Number(supplyBigInt) / Math.pow(10, decimals);
      return humanReadable.toLocaleString();
    } catch {
      return 'Invalid';
    }
  }, [supply, decimals]);

  // Handle calculator mode switch
  const handleModeChange = (useCalculator: boolean) => {
    setCalculatorMode(useCalculator ? 'calculated' : 'manual');
    
    if (useCalculator && supply) {
      try {
        const supplyBigInt = BigInt(supply);
        const humanReadable = Number(supplyBigInt) / Math.pow(10, decimals);
        setUserFriendlyAmount(humanReadable.toString());
      } catch {
        setUserFriendlyAmount('');
      }
    }
  };

  // Handle user-friendly amount change
  const handleUserAmountChange = (value: string) => {
    setUserFriendlyAmount(value);
    
    try {
      if (!value || value === '0') {
        onSupplyChange('0');
        return;
      }
      
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        const rawSupply = BigInt(Math.floor(numValue * Math.pow(10, decimals)));
        onSupplyChange(rawSupply.toString());
      }
    } catch (error) {
      console.error('Supply calculation error:', error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Supply Calculator</label>
        <Switch
          checked={calculatorMode === 'calculated'}
          onCheckedChange={handleModeChange}
          size="sm"
        />
      </div>

      {calculatorMode === 'calculated' && (
        <Input
          label="User-Friendly Amount"
          type="number"
          value={userFriendlyAmount}
          onChange={(e) => handleUserAmountChange(e.target.value)}
          placeholder="Enter amount (e.g., 1000000)"
          description="This will be converted to the raw supply amount"
          leftIcon={<Calculator className="h-4 w-4" />}
        />
      )}

      <div className="p-3 bg-muted rounded-lg space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Display Amount:</span>
          <span className="font-mono font-medium">{displayAmount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Raw Supply:</span>
          <span className="font-mono text-xs">{supply || '0'}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Network constraint checker
 */
export const NetworkConstraints: React.FC<{
  networkId: number;
  tokenConfig: {
    name: string;
    symbol: string;
    supply: string;
    decimals: number;
  };
}> = ({ networkId, tokenConfig }) => {
  const constraints = React.useMemo(() => {
    if (!networkUtils.isSupportedChain(networkId)) {
      return { isValid: false, warnings: ['Unsupported network selected'], errors: [] };
    }

    const network = NETWORK_METADATA[networkId as SupportedChainId];
    const warnings: string[] = [];
    const errors: string[] = [];

    // XSC specific constraints
    if (networkId === 520) {
      if (tokenConfig.decimals > 18) {
        errors.push('XSC network supports maximum 18 decimals');
      }
      
      try {
        const supply = BigInt(tokenConfig.supply || '0');
        const maxSupply = BigInt('1000000000000000000000000'); // 1M tokens with 18 decimals
        if (supply > maxSupply) {
          warnings.push('Very high supply for XSC network - consider lower amounts');
        }
      } catch {
        // Invalid supply format
      }
    }

    // Gas cost estimation
    if (tokenConfig.name.length > 20) {
      warnings.push('Long token names increase deployment gas costs');
    }

    return { isValid: errors.length === 0, warnings, errors };
  }, [networkId, tokenConfig]);

  if (!constraints.warnings.length && !constraints.errors.length) {
    return null;
  }

  return (
    <div className="space-y-2">
      {constraints.errors.map((error, index) => (
        <div key={index} className="flex items-center space-x-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      ))}
      {constraints.warnings.map((warning, index) => (
        <div key={index} className="flex items-center space-x-2 text-sm text-yellow-600">
          <Info className="h-4 w-4" />
          <span>{warning}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Form validation summary
 */
export const ValidationSummary: React.FC<{
  isValid: boolean;
  errors: Record<string, string[]>;
}> = ({ isValid, errors }) => {
  const errorCount = Object.values(errors).flat().length;
  
  if (errorCount === 0) {
    return (
      <div className="flex items-center space-x-2 text-sm text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span>Configuration is valid</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 text-sm text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <span>{errorCount} error{errorCount !== 1 ? 's' : ''} found</span>
      </div>
      <div className="text-xs text-muted-foreground">
        Please fix the errors above to continue
      </div>
    </div>
  );
};

/**
 * Main token basic form component
 */
export const TokenBasicForm: React.FC<TokenBasicFormProps> = ({
  onComplete,
  showAdvanced = false,
  className,
  disabled = false
}) => {
  // Form state
  const formData = useTokenConfigSelectors.formData();
  const validationErrors = useTokenConfigSelectors.validationErrors();
  const isValidating = useTokenConfigSelectors.isValidating();
  const isFormValid = useTokenConfigSelectors.isFormValid();
  const currentStep = useTokenConfigSelectors.currentStep();

  // Wallet state
  const walletChainId = useWalletSelectors.chainId();
  const isWalletConnected = useWalletSelectors.isConnected();

  // Store actions
  const {
    updateFormField,
    setNetworkId,
    validateConfiguration,
    validateField
  } = useTokenConfigActions();

  // Debounced validation
  const debouncedValidation = React.useCallback(
    debounce((field: string, value: any) => {
      validateField(field as any);
    }, 300),
    [validateField]
  );

  // Field change handlers
  const handleFieldChange = React.useCallback((
    field: keyof typeof formData,
    value: any
  ) => {
    updateFormField(field, value);
    debouncedValidation(field, value);
    
    // Announce validation to screen reader
    setTimeout(() => {
      const errors = validationErrors[field];
      if (errors && errors.length > 0) {
        announceToScreenReader(`${field} validation failed: ${errors[0]}`);
      }
    }, 100);
  }, [updateFormField, debouncedValidation, validationErrors]);

  // Network change handler
  const handleNetworkChange = React.useCallback((chainId: number) => {
    setNetworkId(chainId);
    announceToScreenReader(`Network changed to ${NETWORK_METADATA[chainId as SupportedChainId]?.name || 'Unknown'}`);
  }, [setNetworkId]);

  // Auto-sync with wallet network if connected
  React.useEffect(() => {
    if (isWalletConnected && walletChainId && networkUtils.isSupportedChain(walletChainId)) {
      if (formData.networkId !== walletChainId) {
        handleNetworkChange(walletChainId);
      }
    }
  }, [isWalletConnected, walletChainId, formData.networkId, handleNetworkChange]);

  // Form completion check
  React.useEffect(() => {
    onComplete?.(isFormValid);
  }, [isFormValid, onComplete]);

  // Auto-validate when form changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      validateConfiguration();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [formData, validateConfiguration]);

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Coins className="h-5 w-5" />
            <span>Basic Token Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure the fundamental properties of your token. All fields are required.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Token Name */}
          <Input
            label="Token Name"
            description="The full name of your token (e.g., 'Bitcoin', 'Ethereum')"
            placeholder="Enter token name"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            error={validationErrors.name?.[0]}
            required
            disabled={disabled}
            leftIcon={<Type className="h-4 w-4" />}
            data-testid="token-name-input"
          />

          {/* Token Symbol */}
          <Input
            label="Token Symbol"
            description="Short identifier for your token (e.g., 'BTC', 'ETH')"
            placeholder="Enter symbol (3-5 chars)"
            value={formData.symbol}
            onChange={(e) => handleFieldChange('symbol', e.target.value.toUpperCase())}
            error={validationErrors.symbol?.[0]}
            required
            disabled={disabled}
            leftIcon={<Hash className="h-4 w-4" />}
            data-testid="token-symbol-input"
          />

          {/* Token Decimals */}
          <div className="space-y-2">
            <Input
              label="Decimals"
              description="Number of decimal places (0-18, typically 18)"
              type="number"
              min={0}
              max={18}
              value={formData.decimals}
              onChange={(e) => handleFieldChange('decimals', parseInt(e.target.value) || 18)}
              error={validationErrors.decimals?.[0]}
              required
              disabled={disabled}
              leftIcon={<Calculator className="h-4 w-4" />}
              data-testid="token-decimals-input"
            />
          </div>

          {/* Total Supply with Calculator */}
          <div className="space-y-4">
            <Input
              label="Total Supply (Raw)"
              description="Total number of tokens (in smallest unit)"
              value={formData.totalSupply}
              onChange={(e) => handleFieldChange('totalSupply', e.target.value)}
              error={validationErrors.totalSupply?.[0]}
              required
              disabled={disabled}
              leftIcon={<Coins className="h-4 w-4" />}
              data-testid="token-supply-input"
            />
            
            <TokenSupplyCalculator
              supply={formData.totalSupply}
              decimals={formData.decimals}
              onSupplyChange={(supply) => handleFieldChange('totalSupply', supply)}
            />
          </div>

          {/* Network Selection */}
          <div className="space-y-4">
            <NetworkSelector
              selectedNetwork={formData.networkId}
              onNetworkChange={handleNetworkChange}
              mode="dropdown"
              showMetrics={showAdvanced}
              showXscFeatures={formData.networkId === 520 && showAdvanced}
              disabled={disabled}
              className="w-full"
            />

            <NetworkConstraints
              networkId={formData.networkId}
              tokenConfig={{
                name: formData.name,
                symbol: formData.symbol,
                supply: formData.totalSupply,
                decimals: formData.decimals
              }}
            />
          </div>

          {/* Validation Summary */}
          <div className="pt-4 border-t">
            {isValidating ? (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Validating configuration...</span>
              </div>
            ) : (
              <ValidationSummary 
                isValid={isFormValid} 
                errors={validationErrors} 
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={() => {
            // Reset form
            updateFormField('name', '');
            updateFormField('symbol', '');
            updateFormField('totalSupply', '1000000');
            updateFormField('decimals', 18);
            announceToScreenReader('Form reset');
          }}
          disabled={disabled}
        >
          Reset Form
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            // Load example configuration
            updateFormField('name', 'Example Token');
            updateFormField('symbol', 'EXAM');
            updateFormField('totalSupply', '1000000000000000000000000'); // 1M tokens with 18 decimals
            updateFormField('decimals', 18);
            announceToScreenReader('Example configuration loaded');
          }}
          disabled={disabled}
        >
          Load Example
        </Button>

        {currentStep === 'basic' && isFormValid && (
          <Button
            onClick={() => {
              // Move to next step
              announceToScreenReader('Basic configuration complete, ready to proceed');
            }}
            disabled={disabled}
            className="sm:ml-auto"
          >
            Continue to Advanced Features
          </Button>
        )}
      </div>
    </div>
  );
};

// Export for Playwright testing
if (typeof window !== 'undefined') {
  (window as any).TokenBasicFormComponent = {
    TokenBasicForm,
    TokenSupplyCalculator,
    NetworkConstraints,
    ValidationSummary
  };
}

export default TokenBasicForm;