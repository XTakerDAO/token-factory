/**
 * UI Component Utilities
 * 
 * Utility functions for UI components including class merging,
 * variant handling, and accessibility helpers.
 * 
 * @author Claude Code - UI Component System
 * @created 2025-09-26
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind CSS conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Focus visible utility for better keyboard navigation
 */
export const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * Screen reader only utility
 */
export const srOnly = "sr-only";

/**
 * Common animation classes
 */
export const animations = {
  fadeIn: "animate-in fade-in-0 duration-200",
  fadeOut: "animate-out fade-out-0 duration-150",
  slideIn: "animate-in slide-in-from-bottom-2 duration-200",
  slideOut: "animate-out slide-out-to-bottom-2 duration-150",
  scaleIn: "animate-in zoom-in-95 duration-200",
  scaleOut: "animate-out zoom-out-95 duration-150",
} as const;

/**
 * Common spacing and sizing utilities
 */
export const spacing = {
  xs: "h-4 w-4",
  sm: "h-5 w-5", 
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
} as const;

/**
 * Generate accessible IDs for form fields
 */
export function generateId(prefix: string = "field"): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format wallet address for display
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format token amounts with proper decimals
 */
export function formatTokenAmount(
  amount: bigint | string | number,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  try {
    const num = typeof amount === 'bigint' ? amount : BigInt(amount.toString());
    const divisor = BigInt(10 ** decimals);
    const whole = num / divisor;
    const remainder = num % divisor;
    
    const wholeStr = whole.toString();
    const remainderStr = remainder.toString().padStart(decimals, '0');
    const trimmedRemainder = remainderStr.slice(0, displayDecimals).replace(/0+$/, '');
    
    return trimmedRemainder ? `${wholeStr}.${trimmedRemainder}` : wholeStr;
  } catch {
    return '0';
  }
}

/**
 * Network-specific styling helpers
 */
export const networkStyles = {
  ethereum: "from-blue-500 to-purple-600",
  bsc: "from-yellow-400 to-orange-500", 
  xsc: "from-green-400 to-teal-500",
  default: "from-gray-400 to-gray-600"
} as const;

/**
 * Get network color class by chain ID
 */
export function getNetworkStyle(chainId: number): string {
  switch (chainId) {
    case 1:
    case 11155111:
      return networkStyles.ethereum;
    case 56:
    case 97:
      return networkStyles.bsc;
    case 520:
      return networkStyles.xsc;
    default:
      return networkStyles.default;
  }
}

/**
 * Debounce utility for input handling
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

/**
 * Accessibility announcements
 */
export function announceToScreenReader(message: string): void {
  const announcement = document.createElement('div');
  announcement.textContent = message;
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = srOnly;
  
  document.body.appendChild(announcement);
  
  // Clean up after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Transaction status styling
 */
export const statusStyles = {
  pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
  confirmed: "text-green-600 bg-green-50 border-green-200", 
  failed: "text-red-600 bg-red-50 border-red-200",
  cancelled: "text-gray-600 bg-gray-50 border-gray-200"
} as const;

/**
 * Loading states
 */
export const loadingStates = {
  spinner: "animate-spin",
  pulse: "animate-pulse",
  bounce: "animate-bounce"
} as const;

/**
 * Responsive breakpoints helper
 */
export const responsive = {
  mobile: "sm:hidden",
  tablet: "hidden sm:block lg:hidden", 
  desktop: "hidden lg:block"
} as const;

/**
 * Export commonly used Radix classes
 */
export const radixClasses = {
  overlay: "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
  content: "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
  trigger: "inline-flex items-center justify-center",
  item: "relative flex cursor-default select-none items-center",
  separator: "h-px bg-muted -mx-1 my-1"
} as const;