/**
 * Input Component
 * 
 * Accessible input component with validation states, error handling,
 * and comprehensive keyboard navigation support.
 * 
 * @author Claude Code - UI Component System
 * @created 2025-09-26
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, focusRing, generateId } from "./utils";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

/**
 * Input variant styles
 */
const inputVariants = cva(
  [
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
    "placeholder:text-muted-foreground",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "transition-colors duration-200",
    focusRing
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-input focus-visible:border-ring",
        error: "border-destructive focus-visible:border-destructive focus-visible:ring-destructive",
        success: "border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500"
      },
      size: {
        sm: "h-8 px-2 text-xs",
        default: "h-10 px-3 py-2",
        lg: "h-12 px-4 py-3 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  description?: string;
  error?: string;
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  loading?: boolean;
  onValueChange?: (value: string) => void;
}

/**
 * Input component with comprehensive validation and accessibility
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = "text",
    variant,
    size,
    label,
    description,
    error,
    success,
    leftIcon,
    rightIcon,
    showPasswordToggle = false,
    loading = false,
    onValueChange,
    id: providedId,
    "aria-describedby": ariaDescribedBy,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [internalId] = React.useState(() => providedId || generateId("input"));
    
    // Determine actual input type
    const actualType = showPasswordToggle && showPassword ? "text" : type;
    
    // Determine variant based on validation state
    const actualVariant = error ? "error" : success ? "success" : variant;
    
    // Generate aria-describedby
    const descriptionId = description ? `${internalId}-description` : undefined;
    const errorId = error ? `${internalId}-error` : undefined;
    const successId = success ? `${internalId}-success` : undefined;
    
    const ariaDescriptions = [
      ariaDescribedBy,
      descriptionId,
      errorId,
      successId
    ].filter(Boolean).join(" ");

    // Handle value changes
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      props.onChange?.(event);
      onValueChange?.(event.target.value);
    };

    // Password toggle handler
    const togglePasswordVisibility = () => {
      setShowPassword(prev => !prev);
    };

    return (
      <div className="w-full space-y-2">
        {/* Label */}
        {label && (
          <label 
            htmlFor={internalId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {props.required && (
              <span className="text-destructive ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Description */}
        {description && (
          <p 
            id={descriptionId}
            className="text-sm text-muted-foreground"
          >
            {description}
          </p>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            type={actualType}
            className={cn(
              inputVariants({ variant: actualVariant, size, className }),
              leftIcon && "pl-10",
              (rightIcon || showPasswordToggle || loading) && "pr-10"
            )}
            ref={ref}
            id={internalId}
            aria-describedby={ariaDescriptions || undefined}
            aria-invalid={error ? true : undefined}
            onChange={handleChange}
            {...props}
          />

          {/* Right Side Content */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {/* Loading Spinner */}
            {loading && (
              <div 
                className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                aria-label="Loading"
              />
            )}

            {/* Password Toggle */}
            {showPasswordToggle && type === "password" && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={cn(
                  "text-muted-foreground hover:text-foreground transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm",
                  "p-0.5"
                )}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={props.disabled ? -1 : 0}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Right Icon */}
            {rightIcon && !loading && (
              <div className="text-muted-foreground pointer-events-none">
                {rightIcon}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            id={errorId}
            className="flex items-center space-x-1 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && !error && (
          <div 
            id={successId}
            className="flex items-center space-x-1 text-sm text-green-600"
            role="status"
            aria-live="polite"
          >
            <span>{success}</span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

/**
 * Textarea variant
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    Omit<InputProps, "type" | "leftIcon" | "rightIcon" | "showPasswordToggle"> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className,
    variant,
    size,
    label,
    description,
    error,
    success,
    loading = false,
    onValueChange,
    id: providedId,
    "aria-describedby": ariaDescribedBy,
    ...props
  }, ref) => {
    const [internalId] = React.useState(() => providedId || generateId("textarea"));
    
    // Determine variant based on validation state
    const actualVariant = error ? "error" : success ? "success" : variant;
    
    // Generate aria-describedby
    const descriptionId = description ? `${internalId}-description` : undefined;
    const errorId = error ? `${internalId}-error` : undefined;
    const successId = success ? `${internalId}-success` : undefined;
    
    const ariaDescriptions = [
      ariaDescribedBy,
      descriptionId,
      errorId,
      successId
    ].filter(Boolean).join(" ");

    // Handle value changes
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      props.onChange?.(event);
      onValueChange?.(event.target.value);
    };

    return (
      <div className="w-full space-y-2">
        {/* Label */}
        {label && (
          <label 
            htmlFor={internalId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {props.required && (
              <span className="text-destructive ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Description */}
        {description && (
          <p 
            id={descriptionId}
            className="text-sm text-muted-foreground"
          >
            {description}
          </p>
        )}

        {/* Textarea Field */}
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-200 resize-vertical",
            focusRing,
            actualVariant === "error" && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive",
            actualVariant === "success" && "border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500",
            className
          )}
          ref={ref}
          id={internalId}
          aria-describedby={ariaDescriptions || undefined}
          aria-invalid={error ? true : undefined}
          onChange={handleChange}
          {...props}
        />

        {/* Error Message */}
        {error && (
          <div 
            id={errorId}
            className="flex items-center space-x-1 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && !error && (
          <div 
            id={successId}
            className="flex items-center space-x-1 text-sm text-green-600"
            role="status"
            aria-live="polite"
          >
            <span>{success}</span>
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Input, Textarea, inputVariants };

// Export for Playwright testing
if (typeof window !== 'undefined') {
  (window as any).InputComponent = Input;
  (window as any).TextareaComponent = Textarea;
}