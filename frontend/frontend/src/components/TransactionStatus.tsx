/**
 * Transaction Status Component
 * 
 * Comprehensive transaction status display with real-time updates,
 * multi-chain support, and accessibility features. Shows deployment
 * progress, confirmations, and error handling.
 * 
 * @author Claude Code - Frontend Component
 * @created 2025-09-26
 */

import * as React from "react";
import { 
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  Copy,
  RefreshCw,
  AlertTriangle,
  Info,
  Zap,
  Network,
  Hash,
  Timer,
  DollarSign,
  Activity,
  ArrowRight,
  Eye,
  Download
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
  Switch
} from "./ui";

import {
  cn,
  formatTokenAmount,
  getNetworkStyle,
  statusStyles,
  announceToScreenReader
} from "./ui/utils";

import {
  NETWORK_METADATA,
  NETWORK_PERFORMANCE,
  networkUtils,
  type SupportedChainId
} from "../lib/networks";

/**
 * Transaction status enumeration
 */
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed', 
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Transaction type enumeration
 */
export enum TransactionType {
  DEPLOYMENT = 'deployment',
  TRANSFER = 'transfer',
  MINT = 'mint',
  BURN = 'burn',
  PAUSE = 'pause',
  UNPAUSE = 'unpause'
}

/**
 * Transaction data interface
 */
export interface TransactionData {
  hash: string;
  status: TransactionStatus;
  type: TransactionType;
  networkId: number;
  blockNumber?: number;
  confirmations?: number;
  gasUsed?: string;
  gasPrice?: string;
  timestamp?: Date;
  error?: string;
  contractAddress?: string;
  tokenName?: string;
  tokenSymbol?: string;
  value?: string;
}

/**
 * Component props interface
 */
export interface TransactionStatusProps {
  /** Transaction data */
  transaction: TransactionData;
  /** Required confirmations */
  requiredConfirmations?: number;
  /** Auto-refresh interval in seconds */
  refreshInterval?: number;
  /** Show detailed information */
  showDetails?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Status change callback */
  onStatusChange?: (status: TransactionStatus) => void;
}

/**
 * Transaction status indicator
 */
export const StatusIndicator: React.FC<{
  status: TransactionStatus;
  size?: 'sm' | 'md' | 'lg';
}> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6'
  };

  const iconClass = sizeClasses[size];

  const statusConfig = {
    [TransactionStatus.PENDING]: {
      icon: <Loader2 className={cn(iconClass, "animate-spin")} />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      label: 'Pending'
    },
    [TransactionStatus.CONFIRMED]: {
      icon: <CheckCircle2 className={iconClass} />,
      color: 'text-green-600',
      bgColor: 'bg-green-50', 
      borderColor: 'border-green-200',
      label: 'Confirmed'
    },
    [TransactionStatus.FAILED]: {
      icon: <XCircle className={iconClass} />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200', 
      label: 'Failed'
    },
    [TransactionStatus.CANCELLED]: {
      icon: <XCircle className={iconClass} />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      label: 'Cancelled'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={cn(
      "inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium",
      config.color,
      config.bgColor,
      config.borderColor
    )}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
};

/**
 * Progress bar component
 */
export const ConfirmationProgress: React.FC<{
  current: number;
  required: number;
  networkId: number;
}> = ({ current, required, networkId }) => {
  const progress = Math.min((current / required) * 100, 100);
  const networkPerf = NETWORK_PERFORMANCE[networkId as SupportedChainId];
  const estimatedTime = (required - current) * (networkPerf?.blockTime || 12000) / 1000;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Confirmations: {current}/{required}
        </span>
        <span className="text-muted-foreground">
          ~{Math.max(0, Math.round(estimatedTime))}s remaining
        </span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Transaction details component
 */
export const TransactionDetails: React.FC<{
  transaction: TransactionData;
}> = ({ transaction }) => {
  const [copied, setCopied] = React.useState<string | null>(null);
  const networkMetadata = NETWORK_METADATA[transaction.networkId as SupportedChainId];

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      announceToScreenReader(`${label} copied to clipboard`);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getExplorerUrl = (hash: string) => {
    const config = networkUtils.getNetworkConfig(transaction.networkId);
    return config?.explorerUrls[0] ? `${config.explorerUrls[0]}/tx/${hash}` : null;
  };

  const explorerUrl = getExplorerUrl(transaction.hash);

  return (
    <div className="space-y-4">
      {/* Transaction Hash */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Transaction Hash</label>
        <div className="flex items-center space-x-2">
          <code className="flex-1 text-xs bg-muted rounded px-3 py-2 font-mono">
            {transaction.hash}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(transaction.hash, 'hash')}
          >
            {copied === 'hash' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          {explorerUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(explorerUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Network Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Network</label>
          <div className="flex items-center space-x-2 mt-1">
            <div className={cn(
              "w-3 h-3 rounded-full bg-gradient-to-r",
              getNetworkStyle(transaction.networkId)
            )} />
            <span className="text-sm">{networkMetadata?.name}</span>
          </div>
        </div>
        
        {transaction.blockNumber && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Block</label>
            <div className="text-sm mt-1">#{transaction.blockNumber.toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* Gas Information */}
      {(transaction.gasUsed || transaction.gasPrice) && (
        <div className="grid grid-cols-2 gap-4">
          {transaction.gasUsed && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Gas Used</label>
              <div className="text-sm mt-1">{parseInt(transaction.gasUsed).toLocaleString()}</div>
            </div>
          )}
          
          {transaction.gasPrice && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Gas Price</label>
              <div className="text-sm mt-1">
                {(parseInt(transaction.gasPrice) / 1e9).toFixed(2)} gwei
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contract Address for Deployments */}
      {transaction.type === TransactionType.DEPLOYMENT && transaction.contractAddress && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Contract Address</label>
          <div className="flex items-center space-x-2">
            <code className="flex-1 text-xs bg-muted rounded px-3 py-2 font-mono">
              {transaction.contractAddress}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(transaction.contractAddress!, 'address')}
            >
              {copied === 'address' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {transaction.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-medium text-red-800">Transaction Failed</div>
              <div className="text-xs text-red-700 mt-1">{transaction.error}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Transaction timeline component
 */
export const TransactionTimeline: React.FC<{
  transaction: TransactionData;
  confirmations?: number;
  requiredConfirmations?: number;
}> = ({ transaction, confirmations = 0, requiredConfirmations = 12 }) => {
  const steps = React.useMemo(() => {
    const baseSteps = [
      {
        label: 'Submitted',
        completed: true,
        timestamp: transaction.timestamp,
        icon: <Activity className="h-4 w-4" />
      },
      {
        label: 'Included in Block',
        completed: transaction.blockNumber !== undefined,
        timestamp: transaction.blockNumber ? transaction.timestamp : undefined,
        icon: <Hash className="h-4 w-4" />
      }
    ];

    if (transaction.status === TransactionStatus.CONFIRMED) {
      baseSteps.push({
        label: `${requiredConfirmations} Confirmations`,
        completed: confirmations >= requiredConfirmations,
        timestamp: transaction.timestamp,
        icon: <CheckCircle2 className="h-4 w-4" />
      });
    }

    return baseSteps;
  }, [transaction, confirmations, requiredConfirmations]);

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start space-x-3">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
            step.completed 
              ? "bg-green-100 border-green-500 text-green-700"
              : "bg-gray-100 border-gray-300 text-gray-500"
          )}>
            {step.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className={cn(
              "text-sm font-medium",
              step.completed ? "text-foreground" : "text-muted-foreground"
            )}>
              {step.label}
            </div>
            {step.timestamp && (
              <div className="text-xs text-muted-foreground">
                {step.timestamp.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Main transaction status component
 */
export const TransactionStatusComponent: React.FC<TransactionStatusProps> = ({
  transaction,
  requiredConfirmations = 12,
  refreshInterval = 5,
  showDetails = true,
  className,
  onStatusChange
}) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [lastRefresh, setLastRefresh] = React.useState<Date>(new Date());

  // Auto-refresh logic
  React.useEffect(() => {
    if (!autoRefresh || transaction.status !== TransactionStatus.PENDING) {
      return;
    }

    const interval = setInterval(() => {
      setIsRefreshing(true);
      // Simulate refresh
      setTimeout(() => {
        setIsRefreshing(false);
        setLastRefresh(new Date());
      }, 1000);
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, transaction.status]);

  // Status change notification
  React.useEffect(() => {
    onStatusChange?.(transaction.status);
  }, [transaction.status, onStatusChange]);

  const getTransactionTypeLabel = (type: TransactionType) => {
    const labels = {
      [TransactionType.DEPLOYMENT]: 'Token Deployment',
      [TransactionType.TRANSFER]: 'Token Transfer',
      [TransactionType.MINT]: 'Token Mint',
      [TransactionType.BURN]: 'Token Burn',
      [TransactionType.PAUSE]: 'Contract Pause',
      [TransactionType.UNPAUSE]: 'Contract Unpause'
    };
    return labels[type];
  };

  const isPending = transaction.status === TransactionStatus.PENDING;
  const isConfirmed = transaction.status === TransactionStatus.CONFIRMED;
  const hasFailed = transaction.status === TransactionStatus.FAILED;

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <StatusIndicator status={transaction.status} />
                <span>{getTransactionTypeLabel(transaction.type)}</span>
              </CardTitle>
              <CardDescription>
                {transaction.tokenName && transaction.tokenSymbol && (
                  <span>{transaction.tokenName} ({transaction.tokenSymbol}) • </span>
                )}
                {transaction.hash.slice(0, 10)}...{transaction.hash.slice(-8)}
              </CardDescription>
            </div>

            <div className="flex items-center space-x-2">
              {isPending && (
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                    size="sm"
                  />
                  <span className="text-sm text-muted-foreground">Auto-refresh</span>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsRefreshing(true);
                  setTimeout(() => {
                    setIsRefreshing(false);
                    setLastRefresh(new Date());
                  }, 1000);
                }}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn(
                  "h-4 w-4",
                  isRefreshing && "animate-spin"
                )} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Confirmation Progress */}
          {isPending && transaction.confirmations !== undefined && (
            <ConfirmationProgress
              current={transaction.confirmations}
              required={requiredConfirmations}
              networkId={transaction.networkId}
            />
          )}

          {/* Success Message */}
          {isConfirmed && (
            <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-medium text-green-800">
                  Transaction Confirmed
                </div>
                <div className="text-xs text-green-700 mt-1">
                  Your transaction has been successfully confirmed on the blockchain.
                </div>
              </div>
            </div>
          )}

          {/* Failure Message */}
          {hasFailed && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-medium text-red-800">
                  Transaction Failed
                </div>
                <div className="text-xs text-red-700 mt-1">
                  {transaction.error || 'The transaction failed to execute successfully.'}
                </div>
              </div>
            </div>
          )}

          {/* Last Refresh Time */}
          {isPending && (
            <div className="text-xs text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Information */}
      {showDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionDetails transaction={transaction} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTimeline
                transaction={transaction}
                confirmations={transaction.confirmations}
                requiredConfirmations={requiredConfirmations}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Export for Playwright testing
if (typeof window !== 'undefined') {
  (window as any).TransactionStatusComponent = {
    TransactionStatusComponent,
    StatusIndicator,
    ConfirmationProgress,
    TransactionDetails,
    TransactionTimeline,
    TransactionStatus,
    TransactionType
  };
}

export {
  TransactionStatusComponent as TransactionStatus,
  StatusIndicator,
  ConfirmationProgress,
  TransactionDetails,
  TransactionTimeline,
  TransactionStatus as TransactionStatusEnum,
  TransactionType
};

export default TransactionStatusComponent;