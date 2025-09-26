/**
 * Advanced Features Form Component
 * 
 * Comprehensive advanced token features configuration with dependency
 * management, validation, and accessibility features. Supports
 * mintable, burnable, pausable, and capped functionality.
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
  Shield,
  Flame,
  Pause,
  TrendingUp,
  Lock,
  Unlock,
  AlertCircle,
  HelpCircle
} from "lucide-react";

import { 
  Button,
  Input,
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "./ui";

import {
  cn,
  formatTokenAmount,
  announceToScreenReader
} from "./ui/utils";

import {
  useTokenConfigSelectors,
  useTokenConfigActions
} from "../stores/tokenConfigStore";

import type { AdvancedFeatures } from "../types/AdvancedFeatures";

/**
 * Component props interface
 */
export interface AdvancedFeaturesFormProps {
  /** Form completion callback */
  onComplete?: (isValid: boolean) => void;
  /** Show detailed explanations */
  showHelp?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Disable form fields */
  disabled?: boolean;
}

/**
 * Feature explanation component
 */
export const FeatureExplanation: React.FC<{
  feature: keyof AdvancedFeatures;
  title: string;
  description: string;
  benefits: string[];
  risks: string[];
  gasImpact: 'low' | 'medium' | 'high';
  icon: React.ReactNode;
}> = ({ feature, title, description, benefits, risks, gasImpact, icon }) => {
  const gasImpactColors = {
    low: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-red-600 bg-red-50'
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Learn about {title}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {icon}
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Benefits */}
          <div>
            <h4 className="font-medium text-green-700 mb-2">Benefits</h4>
            <ul className="space-y-1 text-sm">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          {risks.length > 0 && (
            <div>
              <h4 className="font-medium text-red-700 mb-2">Considerations</h4>
              <ul className="space-y-1 text-sm">
                {risks.map((risk, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gas Impact */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <span className="text-sm font-medium">Gas Impact:</span>
            <span className={cn(
              "px-2 py-1 rounded text-xs font-medium",
              gasImpactColors[gasImpact]
            )}>
              {gasImpact.toUpperCase()}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Feature card component
 */
export const FeatureCard: React.FC<{
  feature: keyof AdvancedFeatures;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  icon: React.ReactNode;
  disabled?: boolean;
  children?: React.ReactNode;
  showHelp?: boolean;
  explanation?: {
    description: string;
    benefits: string[];
    risks: string[];
    gasImpact: 'low' | 'medium' | 'high';
  };
}> = ({ 
  feature, 
  title, 
  description, 
  enabled, 
  onToggle, 
  icon, 
  disabled = false,
  children,
  showHelp = true,
  explanation
}) => {
  return (
    <Card className={cn(
      "transition-all duration-200",
      enabled && "ring-2 ring-primary ring-offset-2"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-base flex items-center space-x-2">
                <span>{title}</span>
                {showHelp && explanation && (
                  <FeatureExplanation
                    feature={feature}
                    title={title}
                    icon={icon}
                    {...explanation}
                  />
                )}
              </CardTitle>
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={(checked) => {
              onToggle(checked);
              announceToScreenReader(
                `${title} ${checked ? 'enabled' : 'disabled'}`
              );
            }}
            disabled={disabled}
            aria-label={`Toggle ${title}`}
          />
        </div>
      </CardHeader>

      {enabled && children && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

/**
 * Feature dependency warnings
 */
export const DependencyWarnings: React.FC<{
  features: AdvancedFeatures;
}> = ({ features }) => {
  const warnings = React.useMemo(() => {
    const issues: string[] = [];

    // Capped without mintable might not make sense
    if (features.capped && !features.mintable) {
      issues.push('Capped tokens are typically used with mintable functionality');
    }

    // Pausable with burnable - order of operations matter
    if (features.pausable && features.burnable) {
      issues.push('Pausable and burnable features: pausing prevents burning');
    }

    // High gas combinations
    if (features.mintable && features.burnable && features.pausable && features.capped) {
      issues.push('All advanced features enabled will significantly increase gas costs');
    }

    return issues;
  }, [features]);

  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((warning, index) => (
        <div key={index} className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
          <Info className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
          <p className="text-sm text-yellow-800">{warning}</p>
        </div>
      ))}
    </div>
  );
};

/**
 * Gas cost estimator
 */
export const GasCostEstimate: React.FC<{
  features: AdvancedFeatures;
  networkId: number;
}> = ({ features, networkId }) => {
  const estimate = React.useMemo(() => {
    const baseGas = 1000000; // Base deployment gas
    let additionalGas = 0;

    if (features.mintable) additionalGas += 200000;
    if (features.burnable) additionalGas += 150000;
    if (features.pausable) additionalGas += 250000;
    if (features.capped) additionalGas += 100000;

    const totalGas = baseGas + additionalGas;
    const gasPrice = networkId === 520 ? 1 : networkId === 56 ? 5 : 20; // gwei

    return {
      totalGas,
      additionalGas,
      gasPriceGwei: gasPrice,
      estimatedCostUSD: ((totalGas * gasPrice * 1e-9) * 2000).toFixed(2) // Rough USD estimate
    };
  }, [features, networkId]);

  const enabledFeatureCount = Object.values(features).filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Gas Cost Estimate</CardTitle>
        <CardDescription>Estimated deployment costs with selected features</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Base Gas:</span>
            <span className="font-medium ml-2">{(1000000).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Additional:</span>
            <span className="font-medium ml-2">{estimate.additionalGas.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Gas:</span>
            <span className="font-medium ml-2">{estimate.totalGas.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Gas Price:</span>
            <span className="font-medium ml-2">{estimate.gasPriceGwei} gwei</span>
          </div>
        </div>
        
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="font-medium">Estimated Cost:</span>
            <span className="text-lg font-bold text-primary">
              ~${estimate.estimatedCostUSD}
            </span>
          </div>
        </div>

        {enabledFeatureCount > 2 && (
          <div className="text-xs text-muted-foreground">
            * Estimate includes {enabledFeatureCount} advanced features
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Main advanced features form component
 */
export const AdvancedFeaturesForm: React.FC<AdvancedFeaturesFormProps> = ({
  onComplete,
  showHelp = true,
  className,
  disabled = false
}) => {
  // Form state
  const formData = useTokenConfigSelectors.formData();
  const advancedFeatures = formData.advancedFeatures;
  const validationErrors = useTokenConfigSelectors.validationErrors();
  const isValidating = useTokenConfigSelectors.isValidating();

  // Store actions
  const { updateAdvancedFeatures } = useTokenConfigActions();

  // Feature toggle handler
  const handleFeatureToggle = React.useCallback((
    feature: keyof AdvancedFeatures,
    enabled: boolean
  ) => {
    const updates: Partial<AdvancedFeatures> = { [feature]: enabled };

    // Clear maxSupply if capped is disabled
    if (feature === 'capped' && !enabled) {
      updates.maxSupply = undefined;
    }

    updateAdvancedFeatures(updates);
  }, [updateAdvancedFeatures]);

  // Max supply change handler
  const handleMaxSupplyChange = React.useCallback((value: string) => {
    try {
      const maxSupply = value ? BigInt(value) : undefined;
      updateAdvancedFeatures({ maxSupply });
    } catch (error) {
      console.error('Invalid max supply value:', error);
    }
  }, [updateAdvancedFeatures]);

  // Form completion check
  const isValid = Object.keys(validationErrors).length === 0;
  
  React.useEffect(() => {
    onComplete?.(isValid);
  }, [isValid, onComplete]);

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Advanced Token Features</span>
          </CardTitle>
          <CardDescription>
            Optional ERC20 extensions that add functionality to your token. 
            Each feature affects deployment costs and contract complexity.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mintable Feature */}
        <FeatureCard
          feature="mintable"
          title="Mintable"
          description="Allow creation of new tokens after deployment"
          enabled={advancedFeatures.mintable}
          onToggle={(enabled) => handleFeatureToggle('mintable', enabled)}
          icon={<TrendingUp className="h-4 w-4" />}
          disabled={disabled}
          showHelp={showHelp}
          explanation={{
            description: "Allows the contract owner to create new tokens after initial deployment, increasing the total supply.",
            benefits: [
              "Flexible supply management",
              "Can reward users or fund development",
              "Useful for staking rewards or liquidity incentives",
              "Enables token distribution over time"
            ],
            risks: [
              "Centralized supply control by owner",
              "Potential inflation concerns for holders",
              "Requires careful permission management",
              "May affect token economics and value"
            ],
            gasImpact: 'medium'
          }}
        />

        {/* Burnable Feature */}
        <FeatureCard
          feature="burnable"
          title="Burnable"
          description="Allow token holders to permanently destroy their tokens"
          enabled={advancedFeatures.burnable}
          onToggle={(enabled) => handleFeatureToggle('burnable', enabled)}
          icon={<Flame className="h-4 w-4" />}
          disabled={disabled}
          showHelp={showHelp}
          explanation={{
            description: "Allows token holders to permanently remove their tokens from circulation, reducing total supply.",
            benefits: [
              "Deflationary mechanism",
              "Holders can reduce their own supply",
              "Useful for token buyback programs",
              "Can increase scarcity over time"
            ],
            risks: [
              "Accidental token loss by users",
              "Irreversible operation",
              "May complicate accounting",
              "Requires user education"
            ],
            gasImpact: 'low'
          }}
        />

        {/* Pausable Feature */}
        <FeatureCard
          feature="pausable"
          title="Pausable"
          description="Allow emergency pause of all token transfers"
          enabled={advancedFeatures.pausable}
          onToggle={(enabled) => handleFeatureToggle('pausable', enabled)}
          icon={<Pause className="h-4 w-4" />}
          disabled={disabled}
          showHelp={showHelp}
          explanation={{
            description: "Enables the contract owner to temporarily halt all token transfers in emergency situations.",
            benefits: [
              "Emergency response mechanism",
              "Protection against exploits",
              "Compliance with regulatory requirements",
              "Time to investigate issues"
            ],
            risks: [
              "Centralized control over token movement",
              "Potential for abuse by owner",
              "May break DEX integrations when paused",
              "Reduces decentralization"
            ],
            gasImpact: 'high'
          }}
        />

        {/* Capped Feature */}
        <FeatureCard
          feature="capped"
          title="Capped"
          description="Enforce a maximum supply limit"
          enabled={advancedFeatures.capped}
          onToggle={(enabled) => handleFeatureToggle('capped', enabled)}
          icon={<Lock className="h-4 w-4" />}
          disabled={disabled}
          showHelp={showHelp}
          explanation={{
            description: "Sets a hard limit on the maximum number of tokens that can ever exist, even with minting.",
            benefits: [
              "Guarantees maximum supply",
              "Protects against excessive inflation",
              "Increases holder confidence",
              "Useful with mintable tokens"
            ],
            risks: [
              "May limit future growth options",
              "Requires careful initial planning",
              "Cannot be changed after deployment",
              "May complicate tokenomics"
            ],
            gasImpact: 'low'
          }}
        >
          {advancedFeatures.capped && (
            <Input
              label="Maximum Supply"
              description="Hard cap on total token supply (cannot be changed later)"
              value={advancedFeatures.maxSupply?.toString() || ''}
              onChange={(e) => handleMaxSupplyChange(e.target.value)}
              placeholder="Enter maximum supply"
              required
              disabled={disabled}
              leftIcon={<Lock className="h-4 w-4" />}
            />
          )}
        </FeatureCard>
      </div>

      {/* Dependency Warnings */}
      <DependencyWarnings features={advancedFeatures} />

      {/* Gas Cost Estimate */}
      <GasCostEstimate 
        features={advancedFeatures} 
        networkId={formData.networkId} 
      />

      {/* Validation Status */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          {isValidating ? (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Validating features...</span>
            </div>
          ) : isValid ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Advanced features configuration is valid</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>Please resolve configuration issues</span>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              updateAdvancedFeatures({
                mintable: false,
                burnable: false,
                pausable: false,
                capped: false,
                maxSupply: undefined
              });
              announceToScreenReader('All advanced features disabled');
            }}
            disabled={disabled}
          >
            Disable All
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              updateAdvancedFeatures({
                mintable: true,
                burnable: true,
                pausable: false,
                capped: true,
                maxSupply: BigInt(formData.totalSupply) * 2n
              });
              announceToScreenReader('Common features enabled');
            }}
            disabled={disabled}
          >
            Enable Common
          </Button>
        </div>
      </div>
    </div>
  );
};

// Export for Playwright testing
if (typeof window !== 'undefined') {
  (window as any).AdvancedFeaturesFormComponent = {
    AdvancedFeaturesForm,
    FeatureCard,
    FeatureExplanation,
    DependencyWarnings,
    GasCostEstimate
  };
}

export default AdvancedFeaturesForm;