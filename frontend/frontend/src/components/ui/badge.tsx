/**
 * Badge Component
 * 
 * Flexible badge component with variants for status indicators,
 * labels, and interactive elements.
 * 
 * @author Claude Code - UI Component System
 * @created 2025-09-26
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        success: "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
        warning: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        info: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
        network: "border-transparent bg-gradient-to-r text-white font-medium shadow-sm"
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        default: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

const networkGradients = {
  ethereum: "from-blue-500 to-purple-600",
  bsc: "from-yellow-400 to-orange-500",
  xsc: "from-green-400 to-teal-500",
  default: "from-gray-500 to-gray-700"
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  network?: keyof typeof networkGradients;
  interactive?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, network, interactive, leftIcon, rightIcon, children, ...props }, ref) => {
    // Apply network gradient if specified and variant is network
    const networkClass = variant === "network" && network ? networkGradients[network] : "";
    
    return (
      <div
        ref={ref}
        className={cn(
          badgeVariants({ variant, size }),
          networkClass,
          interactive && "cursor-pointer hover:scale-105 transition-transform",
          className
        )}
        {...props}
      >
        {leftIcon && (
          <span className="mr-1 flex items-center" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        {children}
        {rightIcon && (
          <span className="ml-1 flex items-center" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
);
Badge.displayName = "Badge";

// Status Badge variants
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'success' | 'error' | 'warning' | 'info' | 'pending' | 'active' | 'inactive';
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, ...props }, ref) => {
    const statusConfig = {
      success: { variant: 'success' as const, text: 'Success' },
      error: { variant: 'destructive' as const, text: 'Error' },
      warning: { variant: 'warning' as const, text: 'Warning' },
      info: { variant: 'info' as const, text: 'Info' },
      pending: { variant: 'warning' as const, text: 'Pending' },
      active: { variant: 'success' as const, text: 'Active' },
      inactive: { variant: 'secondary' as const, text: 'Inactive' }
    };

    const config = statusConfig[status];

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        {...props}
      >
        {props.children || config.text}
      </Badge>
    );
  }
);
StatusBadge.displayName = "StatusBadge";

// Network Badge component
export interface NetworkBadgeProps extends Omit<BadgeProps, 'variant' | 'network'> {
  chainId: number;
  showChainId?: boolean;
}

const NetworkBadge = React.forwardRef<HTMLDivElement, NetworkBadgeProps>(
  ({ chainId, showChainId = false, ...props }, ref) => {
    const getNetworkInfo = (id: number) => {
      switch (id) {
        case 1:
          return { name: 'Ethereum', network: 'ethereum' as const };
        case 11155111:
          return { name: 'Sepolia', network: 'ethereum' as const };
        case 56:
          return { name: 'BSC', network: 'bsc' as const };
        case 97:
          return { name: 'BSC Testnet', network: 'bsc' as const };
        case 520:
          return { name: 'XSC', network: 'xsc' as const };
        default:
          return { name: 'Unknown', network: 'default' as const };
      }
    };

    const { name, network } = getNetworkInfo(chainId);

    return (
      <Badge
        ref={ref}
        variant="network"
        network={network}
        {...props}
      >
        {name} {showChainId && `(${chainId})`}
      </Badge>
    );
  }
);
NetworkBadge.displayName = "NetworkBadge";

export { Badge, badgeVariants, StatusBadge, NetworkBadge };

// Export for Playwright testing
if (typeof window !== 'undefined') {
  (window as any).BadgeComponents = {
    Badge,
    StatusBadge,
    NetworkBadge
  };
}