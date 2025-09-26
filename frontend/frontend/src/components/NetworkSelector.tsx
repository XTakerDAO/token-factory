/**
 * Network Selector Component
 * 
 * Multi-chain network selection component with visual indicators,
 * performance metrics, and XSC network specific features.
 * Supports both dropdown and grid layouts with accessibility.
 * 
 * @author Claude Code - Frontend Component
 * @created 2025-09-26
 */

import * as React from "react";
import {
  ChevronDown,
  Zap,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Network,
  Gauge,
  Activity
} from "lucide-react";

import {
  Button,
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
  getNetworkStyle,
  formatTokenAmount,
  announceToScreenReader
} from "./ui/utils";

import {
  SUPPORTED_CHAIN_IDS,
  NETWORK_METADATA,
  NETWORK_CONFIGS,
  NETWORK_PERFORMANCE,
  XSC_NETWORK_CONSTANTS,
  networkUtils,
  xscUtils,
  type SupportedChainId
} from "../lib/networks";

import { useWalletSelectors, useWalletActions } from "../stores/walletStore";

/**
 * Component props interface
 */
export interface NetworkSelectorProps {
  /** Current selected network */
  selectedNetwork?: number;
  /** Network change callback */
  onNetworkChange?: (chainId: number) => void;
  /** Display mode */
  mode?: "dropdown" | "grid" | "compact";
  /** Show performance metrics */
  showMetrics?: boolean;
  /** Show only mainnet networks */
  mainnetOnly?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Show XSC specific features */
  showXscFeatures?: boolean;
}

/**
 * Network performance indicator
 */
export const NetworkPerformance: React.FC<{
  chainId: SupportedChainId;
  compact?: boolean;
}> = ({ chainId, compact = false }) => {
  const performance = NETWORK_PERFORMANCE[chainId];
  const [latency, setLatency] = React.useState<number | null>(null);
  const [isHealthy, setIsHealthy] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    // Mock health check - in real app would ping RPC endpoints
    const checkHealth = async () => {
      const startTime = performance.now();
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 200));
      const responseTime = performance.now() - startTime;
      
      setLatency(Math.round(responseTime));
      setIsHealthy(responseTime < 300); // Healthy if under 300ms
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [chainId]);

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        <div className={cn(
          "w-2 h-2 rounded-full",
          isHealthy === null ? "bg-gray-400 animate-pulse" :
          isHealthy ? "bg-green-500" : "bg-red-500"
        )} />
        {latency && (
          <span className="text-xs text-muted-foreground">
            {latency}ms
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Performance</span>
        </div>
        <div className={cn(
          "flex items-center space-x-1 text-xs",
          isHealthy === true ? "text-green-600" :
          isHealthy === false ? "text-red-600" : "text-gray-500"
        )}>
          {isHealthy === null ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <CheckCircle2 className={cn(
              "h-3 w-3",
              isHealthy ? "text-green-500" : "text-red-500"
            )} />
          )}
          <span>{isHealthy === null ? "Checking..." : isHealthy ? "Healthy" : "Issues"}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <div className="text-muted-foreground">Block Time</div>
          <div className="font-medium">{performance.blockTime / 1000}s</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Latency</div>
          <div className="font-medium">{latency ? `${latency}ms` : "—"}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">TPS</div>
          <div className="font-medium">{performance.throughput}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Network gas tracker
 */
export const NetworkGasTracker: React.FC<{
  chainId: SupportedChainId;
}> = ({ chainId }) => {
  const performance = NETWORK_PERFORMANCE[chainId];
  const config = NETWORK_CONFIGS[chainId];
  
  const formatGasPrice = (gasPrice: bigint) => {
    return `${Number(gasPrice) / 1e9} gwei`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Gauge className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Gas Tracker</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground">Current</div>
          <div className="font-medium text-green-600">
            {formatGasPrice(performance.averageGasPrice)}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Peak</div>
          <div className="font-medium text-red-600">
            {formatGasPrice(performance.peakGasPrice)}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-muted rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${Math.min(100, (Number(performance.averageGasPrice) / Number(performance.peakGasPrice)) * 100)}%` 
            }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {Math.round((Number(performance.averageGasPrice) / Number(performance.peakGasPrice)) * 100)}%
        </span>
      </div>
    </div>
  );
};

/**
 * XSC network features display
 */
export const XscFeatures: React.FC = () => {
  const [xscStatus, setXscStatus] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkXscStatus = async () => {
      setLoading(true);
      try {
        const status = await xscUtils.checkXscReadiness();
        setXscStatus(status);
      } catch (error) {
        setXscStatus({ isReady: false, latency: 0, features: XSC_NETWORK_CONSTANTS.FEATURES });
      } finally {
        setLoading(false);
      }
    };

    checkXscStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Checking XSC features...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <div className={cn(
          "w-3 h-3 rounded-full bg-gradient-to-r",
          getNetworkStyle(520)
        )} />
        <span className="text-sm font-medium">XSC Features</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {Object.entries(XSC_NETWORK_CONSTANTS.FEATURES).map(([feature, enabled]) => (
          <div key={feature} className="flex items-center space-x-2">
            {enabled ? (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            ) : (
              <XCircle className="h-3 w-3 text-red-500" />
            )}
            <span className={cn(
              enabled ? "text-foreground" : "text-muted-foreground"
            )}>
              {feature.replace(/_/g, " ")}
            </span>
          </div>
        ))}
      </div>

      {xscStatus && (
        <div className="pt-2 border-t space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Network Status</span>
            <span className={cn(
              "font-medium",
              xscStatus.isReady ? "text-green-600" : "text-red-600"
            )}>
              {xscStatus.isReady ? "Ready" : "Issues"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Response Time</span>
            <span className="font-medium">{Math.round(xscStatus.latency)}ms</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Network card component for grid mode
 */
export const NetworkCard: React.FC<{
  chainId: SupportedChainId;
  selected?: boolean;
  showMetrics?: boolean;
  showXscFeatures?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ 
  chainId, 
  selected = false, 
  showMetrics = true,
  showXscFeatures = false,
  onClick, 
  disabled = false 
}) => {
  const metadata = NETWORK_METADATA[chainId];
  const config = NETWORK_CONFIGS[chainId];

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        selected && "ring-2 ring-primary ring-offset-2",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={disabled ? undefined : onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "w-4 h-4 rounded-full bg-gradient-to-r",
            getNetworkStyle(chainId)
          )} />
          <div className="flex-1">
            <CardTitle className="text-base">{metadata.name}</CardTitle>
            <CardDescription className="text-xs">
              {config.nativeTokenSymbol} • {metadata.shortName}
            </CardDescription>
          </div>
          {selected && (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {showMetrics && (
          <NetworkPerformance chainId={chainId} />
        )}

        {showMetrics && (
          <NetworkGasTracker chainId={chainId} />
        )}

        {showXscFeatures && chainId === 520 && (
          <XscFeatures />
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Compact network indicator
 */
export const CompactNetworkIndicator: React.FC<{
  chainId: number;
  showName?: boolean;
  showPerformance?: boolean;
}> = ({ chainId, showName = true, showPerformance = false }) => {
  if (!networkUtils.isSupportedChain(chainId)) {
    return (
      <div className="flex items-center space-x-2 text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm">Unsupported Network</span>
      </div>
    );
  }

  const metadata = NETWORK_METADATA[chainId as SupportedChainId];

  return (
    <div className="flex items-center space-x-2">
      <div className={cn(
        "w-3 h-3 rounded-full bg-gradient-to-r",
        getNetworkStyle(chainId)
      )} />
      {showName && (
        <span className="text-sm font-medium">
          {metadata.shortName}
        </span>
      )}
      {showPerformance && (
        <NetworkPerformance 
          chainId={chainId as SupportedChainId} 
          compact 
        />
      )}
    </div>
  );
};

/**
 * Main network selector component
 */
export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  selectedNetwork,
  onNetworkChange,
  mode = "dropdown",
  showMetrics = true,
  mainnetOnly = true,
  className,
  disabled = false,
  showXscFeatures = false
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Wallet state
  const currentChainId = useWalletSelectors.chainId();
  const isConnected = useWalletSelectors.isConnected();
  const isSwitchingNetwork = useWalletSelectors.isSwitchingNetwork();
  
  // Wallet actions
  const { switchNetwork } = useWalletActions();

  // Determine current network
  const currentNetwork = selectedNetwork || currentChainId || 1;

  // Filter networks
  const availableNetworks = SUPPORTED_CHAIN_IDS.filter(chainId => {
    if (mainnetOnly) {
      return !NETWORK_CONFIGS[chainId].isTestnet;
    }
    return true;
  });

  // Handle network change
  const handleNetworkChange = React.useCallback(async (chainId: number) => {
    if (isLoading || disabled || isSwitchingNetwork) return;
    
    setIsLoading(true);
    
    try {
      // If wallet is connected, switch network
      if (isConnected) {
        const success = await switchNetwork(chainId);
        if (!success) {
          announceToScreenReader(`Failed to switch to ${NETWORK_METADATA[chainId as SupportedChainId].name}`);
          return;
        }
      }

      // Call external handler
      onNetworkChange?.(chainId);
      announceToScreenReader(`Switched to ${NETWORK_METADATA[chainId as SupportedChainId].name} network`);
      
    } catch (error) {
      console.error('Network switch failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, disabled, isSwitchingNetwork, isConnected, switchNetwork, onNetworkChange]);

  // Render based on mode
  if (mode === "compact") {
    return (
      <div className={className}>
        <CompactNetworkIndicator 
          chainId={currentNetwork}
          showName={true}
          showPerformance={showMetrics}
        />
      </div>
    );
  }

  if (mode === "grid") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Select Network</h3>
          {(isLoading || isSwitchingNetwork) && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Switching network...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableNetworks.map(chainId => (
            <NetworkCard
              key={chainId}
              chainId={chainId}
              selected={chainId === currentNetwork}
              showMetrics={showMetrics}
              showXscFeatures={showXscFeatures}
              onClick={() => handleNetworkChange(chainId)}
              disabled={disabled || isLoading || isSwitchingNetwork}
            />
          ))}
        </div>
      </div>
    );
  }

  // Dropdown mode (default)
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium">Network</label>
      
      <Select
        value={currentNetwork.toString()}
        onValueChange={(value) => handleNetworkChange(parseInt(value))}
        disabled={disabled || isLoading || isSwitchingNetwork}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center space-x-2">
              <CompactNetworkIndicator 
                chainId={currentNetwork}
                showName={true}
                showPerformance={false}
              />
            </div>
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent>
          {availableNetworks.map(chainId => {
            const metadata = NETWORK_METADATA[chainId];
            return (
              <SelectItem key={chainId} value={chainId.toString()}>
                <div className="flex items-center space-x-3 w-full">
                  <div className={cn(
                    "w-3 h-3 rounded-full bg-gradient-to-r",
                    getNetworkStyle(chainId)
                  )} />
                  <div className="flex-1">
                    <div className="font-medium">{metadata.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {NETWORK_CONFIGS[chainId].nativeTokenSymbol}
                    </div>
                  </div>
                  {showMetrics && (
                    <NetworkPerformance chainId={chainId} compact />
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Additional info for selected network */}
      {showMetrics && networkUtils.isSupportedChain(currentNetwork) && (
        <Card className="mt-3">
          <CardContent className="p-4 space-y-3">
            <NetworkGasTracker chainId={currentNetwork as SupportedChainId} />
            {showXscFeatures && currentNetwork === 520 && (
              <XscFeatures />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Export for Playwright testing
if (typeof window !== 'undefined') {
  (window as any).NetworkSelectorComponent = {
    NetworkSelector,
    NetworkCard,
    NetworkPerformance,
    NetworkGasTracker,
    XscFeatures,
    CompactNetworkIndicator
  };
}

export default NetworkSelector;