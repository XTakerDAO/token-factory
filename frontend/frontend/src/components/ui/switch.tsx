/**
 * Switch Component
 * 
 * Accessible switch component built with Radix UI primitives.
 * Supports labels, descriptions, error states, and keyboard navigation.
 * 
 * @author Claude Code - UI Component System
 * @created 2025-09-26
 */

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, focusRing, generateId } from "./utils";

/**
 * Switch variant styles
 */
const switchVariants = cva(
  [
    "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
    focusRing
  ].join(" "),
  {
    variants: {
      size: {
        sm: "h-4 w-7",
        default: "h-6 w-11", 
        lg: "h-7 w-12"
      }
    },
    defaultVariants: {
      size: "default"
    }
  }
);

const switchThumbVariants = cva(
  [
    "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform",
    "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
  ].join(" "),
  {
    variants: {
      size: {
        sm: "h-3 w-3 data-[state=checked]:translate-x-3",
        default: "h-5 w-5 data-[state=checked]:translate-x-5",
        lg: "h-5 w-5 data-[state=checked]:translate-x-5"
      }
    },
    defaultVariants: {
      size: "default"
    }
  }
);

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {
  label?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ 
  className, 
  size,
  label,
  description,
  error,
  disabled = false,
  required = false,
  id: providedId,
  ...props 
}, ref) => {
  const [internalId] = React.useState(() => providedId || generateId("switch"));
  
  const descriptionId = description ? `${internalId}-description` : undefined;
  const errorId = error ? `${internalId}-error` : undefined;
  
  const ariaDescriptions = [descriptionId, errorId].filter(Boolean).join(" ");

  const switchElement = (
    <SwitchPrimitive.Root
      className={cn(switchVariants({ size }), className)}
      disabled={disabled}
      ref={ref}
      id={internalId}
      aria-describedby={ariaDescriptions || undefined}
      aria-invalid={error ? true : undefined}
      aria-required={required}
      {...props}
    >
      <SwitchPrimitive.Thumb className={cn(switchThumbVariants({ size }))} />
    </SwitchPrimitive.Root>
  );

  // If no label, return just the switch
  if (!label) {
    return switchElement;
  }

  // Return switch with label and additional elements
  return (
    <div className="flex items-start space-x-3">
      {switchElement}
      <div className="grid gap-1.5 leading-none">
        <label
          htmlFor={internalId}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          {label}
          {required && (
            <span className="text-destructive ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
        
        {description && (
          <p 
            id={descriptionId}
            className="text-xs text-muted-foreground"
          >
            {description}
          </p>
        )}
        
        {error && (
          <p 
            id={errorId}
            className="text-xs text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
});
Switch.displayName = SwitchPrimitive.Root.displayName;

/**
 * Simple switch without label (for inline usage)
 */
const SimpleSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & 
  VariantProps<typeof switchVariants>
>(({ className, size, ...props }, ref) => (
  <SwitchPrimitive.Root
    className={cn(switchVariants({ size }), className)}
    {...props}
    ref={ref}
  >
    <SwitchPrimitive.Thumb className={cn(switchThumbVariants({ size }))} />
  </SwitchPrimitive.Root>
));
SimpleSwitch.displayName = "SimpleSwitch";

export { Switch, SimpleSwitch };

// Export for Playwright testing
if (typeof window !== 'undefined') {
  (window as any).SwitchComponents = {
    Switch,
    SimpleSwitch,
  };
}