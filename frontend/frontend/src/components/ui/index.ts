/**
 * UI Components Index
 * 
 * Central export file for all UI components. Provides tree-shakable
 * imports and consistent component access across the application.
 * 
 * @author Claude Code - UI Component System
 * @created 2025-09-26
 */

// Utilities
export * from './utils';

// Base Components
export * from './button';
export * from './input';
export * from './card';
export * from './select';
export * from './dialog';
export * from './switch';
export * from './toast';
export * from './badge';
export * from './progress';

// Type exports for external usage
export type { ButtonProps } from './button';
export type { InputProps, TextareaProps } from './input';
export type { CardProps } from './card';
export type { EnhancedSelectProps } from './select';
export type { SwitchProps } from './switch';
export type { ToastProps, ToastWithIconProps } from './toast';
export type { BadgeProps, StatusBadgeProps, NetworkBadgeProps } from './badge';
export type { ProgressProps, CircularProgressProps, StepProgressProps } from './progress';

// Component collections for Playwright testing
if (typeof window !== 'undefined') {
  (window as any).UIComponents = {
    // Import all components for testing access
    Button: (window as any).ButtonComponent,
    Input: (window as any).InputComponent,
    Textarea: (window as any).TextareaComponent,
    Card: (window as any).CardComponents,
    Select: (window as any).SelectComponents,
    Dialog: (window as any).DialogComponents,
    Switch: (window as any).SwitchComponents,
    Toast: (window as any).ToastComponents,
    Badge: (window as any).BadgeComponents,
    Progress: (window as any).ProgressComponents,
  };
}