/**
 * Wallet Connection Component
 * 
 * Comprehensive wallet connection component with multi-chain support,
 * auto-reconnection, balance monitoring, and accessibility features.
 * Integrates with Zustand store and supports MetaMask, WalletConnect, etc.
 * 
 * @author Claude Code - Frontend Component
 * @created 2025-09-26
 */

import * as React from "react";
import { 
  Wallet, 
  ChevronDown, 
  Copy, 
  ExternalLink, 
  Power,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";

import { 
  Button,
  Card, 
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui";

import {
  cn,
  formatAddress,
  formatTokenAmount,
  getNetworkStyle,
  announceToScreenReader,
  statusStyles
} from "./ui/utils";

import {
  WalletConnectionState,
  WalletConnectorType,
  WalletConnectionError,
  getNetworkSymbol
} from "../types/WalletConnection";

import {
  useWalletStore,
  useWalletSelectors,
  useWalletActions,
  useNetworkUtils
} from "../stores/walletStore";

/**
 * Component props interface
 */
export interface WalletConnectionProps {
  /** Show detailed connection info */
  showDetails?: boolean;
  /** Show balance information */
  showBalance?: boolean;
  /** Show network selector */
  showNetworkSelector?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Connection callback */
  onConnect?: (address: string, chainId: number) => void;
  /** Disconnection callback */
  onDisconnect?: () => void;
  /** Network change callback */
  onNetworkChange?: (chainId: number) => void;
}

/**
 * Wallet connection button component
 */
export const WalletConnectionButton: React.FC<{
  onClick: () => void;
  loading?: boolean;
  compact?: boolean;
  className?: string;
}> = ({ onClick, loading = false, compact = false, className }) => {
  return (
    <Button
      onClick={onClick}
      loading={loading}
      loadingText="Connecting..."
      leftIcon={<Wallet className="h-4 w-4" />}
      size={compact ? "sm" : "default"}
      variant="gradient"
      network="ethereum"
      className={className}
      aria-label="Connect wallet"
    >
      {compact ? "Connect" : "Connect Wallet"}
    </Button>
  );
};

/**
 * Connected wallet display component
 */
export const ConnectedWalletDisplay: React.FC<{
  address: string;
  chainId: number;
  balance?: bigint;
  showBalance?: boolean;
  compact?: boolean;
  onDisconnect: () => void;
  onNetworkChange?: (chainId: number) => void;
}> = ({ 
  address, 
  chainId, 
  balance, 
  showBalance = true,
  compact = false,
  onDisconnect,
  onNetworkChange
}) => {
  const [copied, setCopied] = React.useState(false);
  const networkSymbol = getNetworkSymbol(chainId);
  const { supportedNetworks } = useNetworkUtils();

  // Copy address to clipboard
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      announceToScreenReader(`Address copied: ${formatAddress(address)}`);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  // Format balance for display
  const formattedBalance = balance 
    ? formatTokenAmount(balance, 18, 4)
    : '0.0000';

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className={cn(
          "w-3 h-3 rounded-full bg-gradient-to-r",
          getNetworkStyle(chainId)
        )} />
        <span className="text-sm font-medium">
          {formatAddress(address, 3)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDisconnect}
          aria-label="Disconnect wallet"
        >
          <Power className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4 space-y-4">
        {/* Network Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-3 h-3 rounded-full bg-gradient-to-r",
              getNetworkStyle(chainId)
            )} />
            <span className="text-sm font-medium capitalize">
              {supportedNetworks.find(n => n.id === chainId)?.config?.name || 'Unknown'}
            </span>
          </div>
          
          {onNetworkChange && (
            <Select
              value={chainId.toString()}
              onValueChange={(value) => onNetworkChange(parseInt(value))}
            >
              <SelectTrigger className="w-20 h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedNetworks.map((network) => (
                  <SelectItem 
                    key={network.id} 
                    value={network.id.toString()}
                  >
                    {network.config?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Wallet Address
          </label>
          <div className="flex items-center space-x-2">
            <code className="flex-1 text-sm bg-muted rounded px-2 py-1">
              {formatAddress(address)}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyAddress}
              aria-label={copied ? "Address copied" : "Copy address"}
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Balance */}
        {showBalance && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Balance
            </label>
            <div className="text-lg font-semibold">
              {formattedBalance} {networkSymbol}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(
              `https://etherscan.io/address/${address}`,
              '_blank'
            )}
            leftIcon={<ExternalLink className="h-4 w-4" />}
          >
            View on Explorer
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDisconnect}
            leftIcon={<Power className="h-4 w-4" />}
          >
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Wallet connector selection dialog
 */
export const WalletConnectorDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (connectorType: WalletConnectorType) => void;
  loading?: boolean;
}> = ({ open, onOpenChange, onConnect, loading = false }) => {
  const connectors = [
    {
      type: WalletConnectorType.METAMASK,
      name: 'MetaMask',
      description: 'Connect using MetaMask wallet',
      popular: true
    },
    {
      type: WalletConnectorType.WALLET_CONNECT,
      name: 'WalletConnect',
      description: 'Connect using WalletConnect protocol',
      popular: true
    },
    {
      type: WalletConnectorType.COINBASE_WALLET,
      name: 'Coinbase Wallet',
      description: 'Connect using Coinbase Wallet',
      popular: false
    },
    {
      type: WalletConnectorType.INJECTED,
      name: 'Browser Wallet',
      description: 'Connect using injected wallet',
      popular: false
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Your Wallet</DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to Token Factory. Make sure you have one installed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {connectors.map((connector) => (
            <Button
              key={connector.type}
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => onConnect(connector.type)}
              disabled={loading}
            >
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{connector.name}</span>
                  {connector.popular && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                      Popular
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground text-left">
                  {connector.description}
                </span>
              </div>
            </Button>
          ))}
        </div>

        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Connection error display
 */
export const ConnectionError: React.FC<{
  error: WalletConnectionError;
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ error, onRetry, onDismiss }) => {
  const errorMessages: Record<WalletConnectionError, string> = {
    [WalletConnectionError.NO_WALLET]: 'No wallet detected. Please install a Web3 wallet.',
    [WalletConnectionError.USER_REJECTED]: 'Connection was rejected. Please try again.',
    [WalletConnectionError.UNSUPPORTED_NETWORK]: 'Unsupported network. Please switch to a supported network.',
    [WalletConnectionError.NETWORK_SWITCH_FAILED]: 'Failed to switch network. Please try manually.',
    [WalletConnectionError.CONNECTION_TIMEOUT]: 'Connection timed out. Please try again.',
    [WalletConnectionError.BALANCE_FETCH_FAILED]: 'Failed to fetch balance. Connection may be unstable.'
  };

  return (
    <div className="flex items-center space-x-3 p-3 border border-destructive/20 bg-destructive/5 rounded-lg">
      <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-destructive font-medium">
          Connection Error
        </p>
        <p className="text-xs text-muted-foreground">
          {errorMessages[error]}
        </p>
      </div>
      <div className="flex space-x-2">
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRetry}
          >
            Retry
          </Button>
        )}
        {onDismiss && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onDismiss}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Main wallet connection component
 */
export const WalletConnection: React.FC<WalletConnectionProps> = ({
  showDetails = true,
  showBalance = true,
  showNetworkSelector = true,
  compact = false,
  className,
  onConnect,
  onDisconnect,
  onNetworkChange
}) => {
  const [showConnectorDialog, setShowConnectorDialog] = React.useState(false);
  
  // Wallet state
  const connection = useWalletSelectors.connection();
  const connectionState = useWalletSelectors.connectionState();
  const lastError = useWalletSelectors.lastError();
  const balanceInfo = useWalletSelectors.balanceInfo();
  const isLoadingBalance = useWalletSelectors.isLoadingBalance();
  const isSwitchingNetwork = useWalletSelectors.isSwitchingNetwork();

  // Wallet actions
  const { connect, disconnect, switchNetwork, refreshBalance } = useWalletActions();

  // Connection handlers
  const handleConnect = React.useCallback(async (connectorType: WalletConnectorType) => {
    const success = await connect(connectorType);
    if (success && connection.address && connection.chainId) {
      onConnect?.(connection.address, connection.chainId);
      announceToScreenReader(`Wallet connected: ${formatAddress(connection.address)}`);
    }
    setShowConnectorDialog(false);
  }, [connect, connection.address, connection.chainId, onConnect]);

  const handleDisconnect = React.useCallback(async () => {
    await disconnect();
    onDisconnect?.();
    announceToScreenReader('Wallet disconnected');
  }, [disconnect, onDisconnect]);

  const handleNetworkChange = React.useCallback(async (chainId: number) => {
    if (isSwitchingNetwork) return;
    
    const success = await switchNetwork(chainId);
    if (success) {
      onNetworkChange?.(chainId);
      announceToScreenReader(`Network switched to chain ${chainId}`);
    }
  }, [switchNetwork, onNetworkChange, isSwitchingNetwork]);

  // Auto-refresh balance
  React.useEffect(() => {
    if (connection.isConnected && !isLoadingBalance) {
      const interval = setInterval(() => {
        refreshBalance();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [connection.isConnected, isLoadingBalance, refreshBalance]);

  // Render based on connection state
  const renderContent = () => {
    switch (connectionState) {
      case WalletConnectionState.DISCONNECTED:
        return (
          <div className="space-y-4">
            <WalletConnectionButton
              onClick={() => setShowConnectorDialog(true)}
              compact={compact}
              className={className}
            />
            {lastError && (
              <ConnectionError
                error={lastError}
                onRetry={() => setShowConnectorDialog(true)}
              />
            )}
          </div>
        );

      case WalletConnectionState.CONNECTING:
        return (
          <div className="flex items-center space-x-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Connecting to wallet...</span>
          </div>
        );

      case WalletConnectionState.CONNECTED:
        if (!connection.address || !connection.chainId) {
          return <div>Invalid connection state</div>;
        }

        return (
          <div className="space-y-4">
            <ConnectedWalletDisplay
              address={connection.address}
              chainId={connection.chainId}
              balance={connection.balance}
              showBalance={showBalance && showDetails}
              compact={compact}
              onDisconnect={handleDisconnect}
              onNetworkChange={showNetworkSelector ? handleNetworkChange : undefined}
            />
            {lastError && (
              <ConnectionError
                error={lastError}
                onRetry={refreshBalance}
              />
            )}
          </div>
        );

      case WalletConnectionState.SWITCHING:
        return (
          <div className="flex items-center space-x-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Switching network...</span>
          </div>
        );

      case WalletConnectionState.ERROR:
        return (
          <div className="space-y-4">
            <WalletConnectionButton
              onClick={() => setShowConnectorDialog(true)}
              compact={compact}
              className={className}
            />
            {lastError && (
              <ConnectionError
                error={lastError}
                onRetry={() => setShowConnectorDialog(true)}
              />
            )}
          </div>
        );

      default:
        return <div>Unknown connection state</div>;
    }
  };

  return (
    <div className={cn("w-full", className)} role="region" aria-label="Wallet connection">
      {renderContent()}
      
      <WalletConnectorDialog
        open={showConnectorDialog}
        onOpenChange={setShowConnectorDialog}
        onConnect={handleConnect}
        loading={connectionState === WalletConnectionState.CONNECTING}
      />
    </div>
  );
};

// Export for Playwright testing
if (typeof window !== 'undefined') {
  (window as any).WalletConnectionComponent = {
    WalletConnection,
    WalletConnectionButton,
    ConnectedWalletDisplay,
    WalletConnectorDialog,
    ConnectionError
  };
}

export default WalletConnection;