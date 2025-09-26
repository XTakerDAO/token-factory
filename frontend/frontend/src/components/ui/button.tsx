/**
 * Button Component
 * 
 * Accessible button component with variants, sizes, loading states,
 * and full keyboard navigation support. Built with Radix primitives
 * and optimized for performance.
 * 
 * @author Claude Code - UI Component System
 * @created 2025-09-26
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, focusRing, loadingStates } from "./utils";
import { Loader2 } from "lucide-react";

/**
 * Button variant styles using CVA
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    focusRing
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/90",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/90",
        link: "text-primary underline-offset-4 hover:underline active:no-underline",
        gradient: "bg-gradient-to-r text-white font-semibold shadow-lg hover:shadow-xl active:shadow-md transition-all duration-200"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10"
      },
      loading: {
        true: "cursor-wait",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false
    }
  }
);

/**
 * Network-specific gradient variants
 */
const networkGradients = {
  ethereum: "from-blue-500 to-purple-600",
  bsc: "from-yellow-400 to-orange-500",
  xsc: "from-green-400 to-teal-500",
  default: "from-gray-500 to-gray-700"
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  network?: keyof typeof networkGradients;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Button component with comprehensive accessibility and loading states
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    loading = false,
    loadingText,
    network,
    leftIcon,
    rightIcon,
    fullWidth,
    asChild = false, 
    children,
    disabled,
    type = "button",
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // Determine if button is interactive
    const isInteractive = !loading && !disabled;
    
    // Apply network gradient if specified and variant is gradient
    const networkClass = variant === "gradient" && network ? networkGradients[network] : "";
    
    // Loading state management
    const buttonContent = loading ? (
      <>
        <Loader2 className={cn("mr-2 h-4 w-4", loadingStates.spinner)} aria-hidden="true" />
        <span>{loadingText || "Loading..."}</span>
        <span className="sr-only">Loading, please wait</span>
      </>
    ) : (
      <>
        {leftIcon && (
          <span className="mr-2 flex items-center" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        {children}
        {rightIcon && (
          <span className="ml-2 flex items-center" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </>
    );

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, loading, className }),
          networkClass,
          fullWidth && "w-full"
        )}
        ref={ref}
        disabled={!isInteractive}
        aria-disabled={!isInteractive}
        type={type}
        {...(loading && {
          "aria-busy": true,
          "aria-live": "polite"
        })}
        {...props}
      >
        {buttonContent}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };

// Export for Playwright testing
if (typeof window !== 'undefined') {
  (window as any).ButtonComponent = Button;
}