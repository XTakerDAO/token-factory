/**
 * Progress Component
 * 
 * Accessible progress indicator component with animations,
 * labels, and variant styles for different use cases.
 * 
 * @author Claude Code - UI Component System
 * @created 2025-09-26
 */

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const progressVariants = cva(
  "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      size: {
        sm: "h-2",
        default: "h-4",
        lg: "h-6"
      },
      variant: {
        default: "",
        success: "bg-green-100",
        warning: "bg-yellow-100",
        error: "bg-red-100"
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default"
    }
  }
);

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        error: "bg-red-500",
        gradient: "bg-gradient-to-r from-blue-500 to-purple-600"
      },
      animated: {
        true: "animate-pulse",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      animated: false
    }
  }
);

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  value?: number;
  max?: number;
  indicatorVariant?: VariantProps<typeof progressIndicatorVariants>['variant'];
  animated?: boolean;
  showValue?: boolean;
  showLabel?: boolean;
  label?: string;
  formatValue?: (value: number, max: number) => string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ 
  className, 
  value = 0, 
  max = 100,
  size,
  variant,
  indicatorVariant = "default",
  animated = false,
  showValue = false,
  showLabel = false,
  label,
  formatValue,
  ...props 
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const defaultFormatter = (val: number, maxVal: number) => 
    `${Math.round((val / maxVal) * 100)}%`;
  
  const displayValue = formatValue 
    ? formatValue(value, max)
    : defaultFormatter(value, max);

  return (
    <div className="w-full space-y-2">
      {/* Label and Value */}
      {(showLabel && label) || showValue ? (
        <div className="flex justify-between items-center text-sm">
          {showLabel && label && (
            <span className="font-medium text-foreground">{label}</span>
          )}
          {showValue && (
            <span className="text-muted-foreground">{displayValue}</span>
          )}
        </div>
      ) : null}

      {/* Progress Bar */}
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(progressVariants({ size, variant }), className)}
        value={value}
        max={max}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(progressIndicatorVariants({ 
            variant: indicatorVariant, 
            animated 
          }))}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

// Circular Progress Component
export interface CircularProgressProps {
  value?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  showValue?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(
  ({
    value = 0,
    max = 100,
    size = 120,
    strokeWidth = 8,
    variant = 'default',
    showValue = true,
    className,
    children,
    ...props
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const variantColors = {
      default: 'stroke-primary',
      success: 'stroke-green-500',
      warning: 'stroke-yellow-500',
      error: 'stroke-red-500'
    };

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex items-center justify-center", className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted opacity-20"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className={cn(variantColors[variant], "transition-all duration-300 ease-in-out")}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {children || (showValue && (
            <span className="text-sm font-semibold">
              {Math.round(percentage)}%
            </span>
          ))}
        </div>
      </div>
    );
  }
);
CircularProgress.displayName = "CircularProgress";

// Step Progress Component
export interface Step {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
  current?: boolean;
}

export interface StepProgressProps {
  steps: Step[];
  currentStep?: string;
  variant?: 'default' | 'compact';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  variant = 'default',
  orientation = 'horizontal',
  className
}) => {
  const isHorizontal = orientation === 'horizontal';
  
  return (
    <div className={cn(
      "flex",
      isHorizontal ? "items-center space-x-4" : "flex-col space-y-4",
      className
    )}>
      {steps.map((step, index) => {
        const isCompleted = step.completed || 
          (currentStep && steps.findIndex(s => s.id === currentStep) > index);
        const isCurrent = step.current || step.id === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className={cn(
            "flex",
            isHorizontal ? "items-center" : "flex-col",
            !isLast && !isHorizontal && "pb-4"
          )}>
            {/* Step indicator */}
            <div className={cn(
              "flex items-center",
              !isHorizontal && "mb-2"
            )}>
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                isCompleted && "border-primary bg-primary text-primary-foreground",
                isCurrent && !isCompleted && "border-primary text-primary",
                !isCompleted && !isCurrent && "border-muted text-muted-foreground"
              )}>
                {isCompleted ? "✓" : index + 1}
              </div>
              
              {/* Connector line */}
              {!isLast && (
                <div className={cn(
                  "bg-muted transition-colors",
                  isHorizontal ? "h-0.5 w-16 ml-4" : "w-0.5 h-8 ml-4 mt-2",
                  isCompleted && "bg-primary"
                )} />
              )}
            </div>

            {/* Step content */}
            {variant === 'default' && (
              <div className={cn(
                isHorizontal ? "ml-3" : "ml-0",
                "flex-1"
              )}>
                <div className={cn(
                  "font-medium text-sm",
                  isCurrent && "text-primary",
                  isCompleted && "text-foreground",
                  !isCompleted && !isCurrent && "text-muted-foreground"
                )}>
                  {step.title}
                </div>
                {step.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export { 
  Progress, 
  CircularProgress, 
  StepProgress,
  progressVariants,
  progressIndicatorVariants 
};

// Export for Playwright testing
if (typeof window !== 'undefined') {
  (window as any).ProgressComponents = {
    Progress,
    CircularProgress,
    StepProgress
  };
}