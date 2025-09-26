/**
 * Feature Preview Component
 * 
 * Comprehensive token configuration preview with visual summary,
 * deployment simulation, and contract code preview.
 * Provides final review before token deployment.
 * 
 * @author Claude Code - Frontend Component
 * @created 2025-09-26
 */

import * as React from "react";
import { 
  Eye,
  Copy,
  Download,
  Share2,
  Code2,
  Coins,
  Network,
  Shield,
  Settings,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
  Zap,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  Flame,
  Pause,
  Lock
} from "lucide-react";

import { 
  Button,
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Textarea
} from "./ui";

import {
  cn,
  formatTokenAmount,
  getNetworkStyle,
  formatAddress,
  announceToScreenReader
} from "./ui/utils";

import {
  useTokenConfigSelectors,
  useTokenConfigActions
} from "../stores/tokenConfigStore";

import { useWalletSelectors } from "../stores/walletStore";

import {
  NETWORK_METADATA,
  networkUtils,
  type SupportedChainId
} from "../lib/networks";

/**
 * Component props interface
 */
export interface FeaturePreviewProps {
  /** Deployment readiness callback */
  onReadyToDeploy?: (ready: boolean) => void;
  /** Show deployment button */
  showDeployButton?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Token summary card
 */
export const TokenSummaryCard: React.FC<{
  name: string;
  symbol: string;
  supply: string;
  decimals: number;
  networkId: number;
}> = ({ name, symbol, supply, decimals, networkId }) => {
  const networkMetadata = NETWORK_METADATA[networkId as SupportedChainId];
  
  const formattedSupply = React.useMemo(() => {
    try {
      return formatTokenAmount(supply, decimals, 2);
    } catch {
      return '0';
    }
  }, [supply, decimals]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
              <Coins className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">{name || 'Unnamed Token'}</CardTitle>
              <CardDescription className="text-base font-medium">
                {symbol || 'N/A'}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-4 h-4 rounded-full bg-gradient-to-r",
              getNetworkStyle(networkId)
            )} />
            <span className="text-sm font-medium">
              {networkMetadata?.name || 'Unknown Network'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Supply:</span>
            <div className="font-medium text-lg">
              {formattedSupply} {symbol}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Decimals:</span>
            <div className="font-medium text-lg">{decimals}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Advanced features summary
 */
export const AdvancedFeaturesSummary: React.FC<{
  features: {
    mintable: boolean;
    burnable: boolean;
    pausable: boolean;
    capped: boolean;
    maxSupply?: bigint;
  };
  decimals: number;
  symbol: string;
}> = ({ features, decimals, symbol }) => {
  const enabledFeatures = Object.entries(features)
    .filter(([key, value]) => key !== 'maxSupply' && value)
    .map(([key]) => key);

  const featureIcons = {
    mintable: <TrendingUp className="h-4 w-4" />,
    burnable: <Flame className="h-4 w-4" />,
    pausable: <Pause className="h-4 w-4" />,
    capped: <Lock className="h-4 w-4" />
  };

  const featureDescriptions = {
    mintable: 'New tokens can be created',
    burnable: 'Tokens can be permanently destroyed',
    pausable: 'All transfers can be paused',
    capped: 'Maximum supply is enforced'
  };

  if (enabledFeatures.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Advanced Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No advanced features enabled</p>
            <p className="text-sm">This will be a basic ERC20 token</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Advanced Features ({enabledFeatures.length})</span>
        </CardTitle>
        <CardDescription>
          Extended functionality enabled for your token
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {enabledFeatures.map((feature) => (
            <div key={feature} className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg">
              <div className="text-primary">
                {featureIcons[feature as keyof typeof featureIcons]}
              </div>
              <div className="flex-1">
                <div className="font-medium capitalize">{feature}</div>
                <div className="text-sm text-muted-foreground">
                  {featureDescriptions[feature as keyof typeof featureDescriptions]}
                </div>
              </div>
            </div>
          ))}
          
          {features.capped && features.maxSupply && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Maximum Supply</div>
              <div className="font-medium">
                {formatTokenAmount(features.maxSupply.toString(), decimals, 2)} {symbol}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Deployment estimation
 */
export const DeploymentEstimation: React.FC<{
  networkId: number;
  features: {
    mintable: boolean;
    burnable: boolean;
    pausable: boolean;
    capped: boolean;
  };
}> = ({ networkId, features }) => {
  const estimation = React.useMemo(() => {
    const network = NETWORK_METADATA[networkId as SupportedChainId];
    
    // Base gas estimation
    let gasEstimate = 1000000; // Base ERC20
    if (features.mintable) gasEstimate += 200000;
    if (features.burnable) gasEstimate += 150000;
    if (features.pausable) gasEstimate += 250000;
    if (features.capped) gasEstimate += 100000;

    // Network specific gas prices (gwei)
    const gasPrice = networkId === 520 ? 1 : networkId === 56 ? 5 : 20;
    
    // Rough cost estimation (assuming $2000 ETH equivalent)
    const ethCost = (gasEstimate * gasPrice * 1e-9);
    const usdCost = ethCost * 2000;

    return {
      gasEstimate,
      gasPrice,
      ethCost: ethCost.toFixed(6),
      usdCost: usdCost.toFixed(2),
      networkSymbol: network?.shortName || 'ETH',
      confirmationTime: networkId === 520 ? '~4s' : networkId === 56 ? '~9s' : '~24s'
    };
  }, [networkId, features]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5" />
          <span>Deployment Estimation</span>
        </CardTitle>
        <CardDescription>
          Estimated costs and timing for deployment
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Gas Estimate</div>
                <div className="font-medium">{estimation.gasEstimate.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Gas Price</div>
                <div className="font-medium">{estimation.gasPrice} gwei</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Network Cost</div>
                <div className="font-medium">{estimation.ethCost} {estimation.networkSymbol}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">USD Estimate</div>
                <div className="font-medium text-primary">${estimation.usdCost}</div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Confirmation Time:</span>
              </div>
              <span className="font-medium">{estimation.confirmationTime}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Contract code preview
 */
export const ContractCodePreview: React.FC<{
  name: string;
  symbol: string;
  features: {
    mintable: boolean;
    burnable: boolean;
    pausable: boolean;
    capped: boolean;
  };
}> = ({ name, symbol, features }) => {
  const [copied, setCopied] = React.useState(false);

  const contractCode = React.useMemo(() => {
    const imports = [
      '@openzeppelin/contracts/token/ERC20/ERC20.sol',
      ...(features.mintable ? ['@openzeppelin/contracts/access/Ownable.sol'] : []),
      ...(features.burnable ? ['@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol'] : []),
      ...(features.pausable ? ['@openzeppelin/contracts/security/Pausable.sol'] : []),
      ...(features.capped ? ['@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol'] : [])
    ];

    const inheritance = [
      'ERC20',
      ...(features.mintable ? ['Ownable'] : []),
      ...(features.burnable ? ['ERC20Burnable'] : []),
      ...(features.pausable ? ['Pausable'] : []),
      ...(features.capped ? ['ERC20Capped'] : [])
    ];

    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

${imports.map(imp => `import "${imp}";`).join('\n')}

contract ${name.replace(/\s+/g, '')}Token is ${inheritance.join(', ')} {
    constructor(
        uint256 _initialSupply${features.capped ? ',\n        uint256 _cap' : ''}
    ) 
        ERC20("${name}", "${symbol}")
        ${features.capped ? 'ERC20Capped(_cap)' : ''}
    {
        _mint(msg.sender, _initialSupply);
    }

    ${features.mintable ? `
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }` : ''}

    ${features.pausable ? `
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }` : ''}
}`;
  }, [name, symbol, features]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(contractCode);
      setCopied(true);
      announceToScreenReader('Contract code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Code2 className="h-4 w-4 mr-2" />
          Preview Contract Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Smart Contract Preview</DialogTitle>
          <DialogDescription>
            Solidity code that will be deployed for your token
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Contract: {name.replace(/\s+/g, '')}Token.sol
            </span>
            <Button variant="outline" size="sm" onClick={copyCode}>
              {copied ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? 'Copied!' : 'Copy Code'}
            </Button>
          </div>

          <Textarea
            value={contractCode}
            readOnly
            className="font-mono text-sm min-h-[400px] resize-none"
            style={{ whiteSpace: 'pre', overflowWrap: 'normal' }}
          />

          <div className="text-xs text-muted-foreground">
            * This is a simplified preview. The actual deployed contract may include additional optimizations and security features.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Deployment checklist
 */
export const DeploymentChecklist: React.FC<{
  isValid: boolean;
  walletConnected: boolean;
  hasBalance: boolean;
  networkMatch: boolean;
}> = ({ isValid, walletConnected, hasBalance, networkMatch }) => {
  const checks = [
    {
      label: 'Token configuration is valid',
      passed: isValid,
      icon: isValid ? CheckCircle2 : AlertTriangle
    },
    {
      label: 'Wallet is connected',
      passed: walletConnected,
      icon: walletConnected ? CheckCircle2 : AlertTriangle
    },
    {
      label: 'Sufficient balance for deployment',
      passed: hasBalance,
      icon: hasBalance ? CheckCircle2 : AlertTriangle
    },
    {
      label: 'Network matches configuration',
      passed: networkMatch,
      icon: networkMatch ? CheckCircle2 : AlertTriangle
    }
  ];

  const allPassed = checks.every(check => check.passed);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckCircle2 className="h-5 w-5" />
          <span>Deployment Checklist</span>
        </CardTitle>
        <CardDescription>
          Requirements for token deployment
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {checks.map((check, index) => {
            const Icon = check.icon;
            return (
              <div key={index} className="flex items-center space-x-3">
                <Icon className={cn(
                  "h-4 w-4",
                  check.passed ? "text-green-600" : "text-red-600"
                )} />
                <span className={cn(
                  "text-sm",
                  check.passed ? "text-foreground" : "text-muted-foreground"
                )}>
                  {check.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className={cn(
          "mt-4 p-3 rounded-lg text-sm font-medium",
          allPassed 
            ? "bg-green-50 text-green-800 border border-green-200"
            : "bg-red-50 text-red-800 border border-red-200"
        )}>
          {allPassed 
            ? "✅ Ready for deployment!"
            : "❌ Please complete all requirements above"
          }
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main feature preview component
 */
export const FeaturePreview: React.FC<FeaturePreviewProps> = ({
  onReadyToDeploy,
  showDeployButton = true,
  className
}) => {
  // Form state
  const formData = useTokenConfigSelectors.formData();
  const isFormValid = useTokenConfigSelectors.isFormValid();
  const currentConfig = useTokenConfigSelectors.currentConfig();

  // Wallet state
  const isWalletConnected = useWalletSelectors.isConnected();
  const walletChainId = useWalletSelectors.chainId();
  const balance = useWalletSelectors.balance();

  // Deployment readiness checks
  const networkMatch = walletChainId === formData.networkId;
  const hasBalance = balance && balance > 100000000000000000n; // > 0.1 ETH equivalent
  const isReadyToDeploy = isFormValid && isWalletConnected && hasBalance && networkMatch;

  // Share configuration
  const shareConfig = async () => {
    const config = {
      name: formData.name,
      symbol: formData.symbol,
      supply: formData.totalSupply,
      decimals: formData.decimals,
      network: formData.networkId,
      features: formData.advancedFeatures
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      announceToScreenReader('Configuration copied to clipboard');
    } catch (error) {
      console.error('Failed to share config:', error);
    }
  };

  React.useEffect(() => {
    onReadyToDeploy?.(isReadyToDeploy);
  }, [isReadyToDeploy, onReadyToDeploy]);

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Token Configuration Preview</span>
          </CardTitle>
          <CardDescription>
            Review your token configuration before deployment
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Token Summary */}
      <TokenSummaryCard
        name={formData.name}
        symbol={formData.symbol}
        supply={formData.totalSupply}
        decimals={formData.decimals}
        networkId={formData.networkId}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Advanced Features */}
        <AdvancedFeaturesSummary
          features={formData.advancedFeatures}
          decimals={formData.decimals}
          symbol={formData.symbol}
        />

        {/* Deployment Estimation */}
        <DeploymentEstimation
          networkId={formData.networkId}
          features={formData.advancedFeatures}
        />
      </div>

      {/* Deployment Checklist */}
      <DeploymentChecklist
        isValid={isFormValid}
        walletConnected={isWalletConnected}
        hasBalance={hasBalance}
        networkMatch={networkMatch}
      />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <ContractCodePreview
          name={formData.name}
          symbol={formData.symbol}
          features={formData.advancedFeatures}
        />

        <Button variant="outline" onClick={shareConfig}>
          <Share2 className="h-4 w-4 mr-2" />
          Share Config
        </Button>

        {showDeployButton && (
          <Button
            size="lg"
            disabled={!isReadyToDeploy}
            className="sm:ml-auto"
            onClick={() => {
              if (isReadyToDeploy) {
                announceToScreenReader('Initiating token deployment');
                // Deployment logic would go here
              }
            }}
          >
            <Coins className="h-4 w-4 mr-2" />
            Deploy Token
          </Button>
        )}
      </div>
    </div>
  );
};

// Export for Playwright testing
if (typeof window !== 'undefined') {
  (window as any).FeaturePreviewComponent = {
    FeaturePreview,
    TokenSummaryCard,
    AdvancedFeaturesSummary,
    DeploymentEstimation,
    ContractCodePreview,
    DeploymentChecklist
  };
}

export default FeaturePreview;