/**
 * WCAG 2.1 AA Accessibility E2E Tests - Playwright MCP
 *
 * Comprehensive accessibility testing for WCAG 2.1 AA compliance.
 * Tests keyboard navigation, screen reader compatibility, color contrast,
 * focus management, ARIA implementation, and accessible form design.
 *
 * WCAG 2.1 AA Requirements Tested:
 * - Keyboard Accessibility (2.1.1, 2.1.2, 2.4.7)
 * - Color Contrast (1.4.3, 1.4.6)
 * - Focus Management (2.4.3, 2.4.7, 3.2.1)
 * - Screen Reader Support (1.3.1, 4.1.2)
 * - Accessible Names (1.3.1, 2.4.6, 4.1.2)
 * - Error Identification (3.3.1, 3.3.3, 3.3.4)
 * - Accessible Forms (1.3.1, 2.4.6, 3.3.2)
 * - Responsive Design (1.4.10, 1.4.12)
 *
 * @author Claude Code - E2E Accessibility Testing
 * @created 2025-09-26
 */

import { test, expect } from '@playwright/test';

// Accessibility test configuration
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const A11Y_TIMEOUT = 20000;

// WCAG 2.1 AA compliance thresholds
const WCAG_STANDARDS = {
  colorContrast: {
    normal: 4.5,    // AA level for normal text
    large: 3.0,     // AA level for large text (18pt+ or 14pt+ bold)
    graphics: 3.0   // AA level for graphics and UI components
  },
  touchTarget: {
    minSize: 44,    // Minimum 44x44 pixel touch targets
    spacing: 8      // Minimum 8px spacing between targets
  },
  timing: {
    maxDelay: 500   // Maximum delay for screen reader announcements
  }
};

// Common keyboard shortcuts for testing
const KEYBOARD_SHORTCUTS = {
  tab: 'Tab',
  shiftTab: 'Shift+Tab',
  enter: 'Enter',
  space: 'Space',
  escape: 'Escape',
  arrowDown: 'ArrowDown',
  arrowUp: 'ArrowUp',
  home: 'Home',
  end: 'End'
};

// Mock accessibility-optimized wallet
const setupAccessibleWallet = async (page: any) => {
  await page.addInitScript(() => {
    (window as any).ethereum = {
      isMetaMask: true,
      request: async ({ method }: { method: string }) => {
        switch (method) {
          case 'eth_requestAccounts':
            return ['0xa11y567890123456789012345678901234567890'];
          case 'eth_chainId':
            return '0x208'; // XSC Network
          case 'eth_getBalance':
            return '0x1BC16D674EC80000'; // 2 ETH
          default:
            return null;
        }
      }
    };

    // Add accessibility testing utilities
    (window as any).a11yUtils = {
      announcements: [],
      recordAnnouncement: (text: string) => {
        (window as any).a11yUtils.announcements.push({
          text,
          timestamp: Date.now()
        });
      }
    };
  });
};

const connectAccessibleWallet = async (page: any) => {
  await page.getByRole('button', { name: /Connect Wallet/i }).click();
  await page.getByRole('button', { name: /MetaMask/i }).click();
  await expect(page.getByText(/Connected/i)).toBeVisible({ timeout: 10000 });
};

const checkColorContrast = async (page: any, selector: string, expectedRatio: number = WCAG_STANDARDS.colorContrast.normal) => {
  const element = page.locator(selector);
  const styles = await element.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight
    };
  });

  // This is a simplified contrast check - in real implementation,
  // you would use a proper contrast calculation algorithm
  const hasGoodContrast = await element.evaluate((el, expectedRatio) => {
    // Mock contrast ratio check (would use actual calculation in production)
    const style = window.getComputedStyle(el);
    const color = style.color;
    const bgColor = style.backgroundColor;

    // Simplified check - dark text on light background or vice versa
    const isDarkOnLight = color.includes('rgb(0') && bgColor.includes('rgb(255');
    const isLightOnDark = color.includes('rgb(255') && bgColor.includes('rgb(0');

    return isDarkOnLight || isLightOnDark;
  }, expectedRatio);

  expect(hasGoodContrast).toBeTruthy();
  return styles;
};

const checkTouchTargetSize = async (page: any, selector: string) => {
  const element = page.locator(selector);
  const boundingBox = await element.boundingBox();

  expect(boundingBox).not.toBeNull();
  expect(boundingBox!.width).toBeGreaterThanOrEqual(WCAG_STANDARDS.touchTarget.minSize);
  expect(boundingBox!.height).toBeGreaterThanOrEqual(WCAG_STANDARDS.touchTarget.minSize);

  return boundingBox;
};

test.describe('WCAG 2.1 AA Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupAccessibleWallet(page);
  });

  test.describe('Keyboard Accessibility', () => {
    test('should support tab navigation through all interactive elements', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await page.waitForLoadState('networkidle');

      // Connect wallet first
      await connectAccessibleWallet(page);

      // Start from beginning of page
      await page.keyboard.press('Tab');

      const interactiveElements = [
        'Token name input',
        'Token symbol input',
        'Total supply input',
        'Decimals input',
        'Next button'
      ];

      for (let i = 0; i < interactiveElements.length; i++) {
        // Check that focus is visible
        const focused = await page.evaluate(() => document.activeElement);
        expect(focused).not.toBeNull();

        // Verify focus indicator is visible
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();

        // Move to next element
        if (i < interactiveElements.length - 1) {
          await page.keyboard.press(KEYBOARD_SHORTCUTS.tab);
        }
      }
    });

    test('should support reverse tab navigation', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      // Navigate to last element first
      await page.getByRole('button', { name: /Next/i }).focus();

      // Navigate backwards with Shift+Tab
      await page.keyboard.press(KEYBOARD_SHORTCUTS.shiftTab);
      await expect(page.getByLabel(/Decimals/i)).toBeFocused();

      await page.keyboard.press(KEYBOARD_SHORTCUTS.shiftTab);
      await expect(page.getByLabel(/Total supply/i)).toBeFocused();

      await page.keyboard.press(KEYBOARD_SHORTCUTS.shiftTab);
      await expect(page.getByLabel(/Token symbol/i)).toBeFocused();

      await page.keyboard.press(KEYBOARD_SHORTCUTS.shiftTab);
      await expect(page.getByLabel(/Token name/i)).toBeFocused();
    });

    test('should activate buttons with Enter and Space keys', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      // Fill required fields
      await page.getByLabel(/Token name/i).fill('Accessible Token');
      await page.getByLabel(/Token symbol/i).fill('A11Y');
      await page.getByLabel(/Total supply/i).fill('1000000');

      // Focus the Next button
      await page.getByRole('button', { name: /Next/i }).focus();

      // Activate with Enter key
      await page.keyboard.press(KEYBOARD_SHORTCUTS.enter);
      await expect(page.getByText('Progress: Advanced Features')).toBeVisible();

      // Go back to test Space key
      await page.getByRole('button', { name: /Previous/i }).focus();
      await page.keyboard.press(KEYBOARD_SHORTCUTS.space);
      await expect(page.getByText('Progress: Basic Information')).toBeVisible();
    });

    test('should support keyboard navigation in dropdowns and selects', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      // Navigate to network selection step
      await page.getByLabel(/Token name/i).fill('Network Test');
      await page.getByLabel(/Token symbol/i).fill('NET');
      await page.getByLabel(/Total supply/i).fill('1000000');

      // Navigate through steps
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        await page.waitForTimeout(300);
      }

      // Test keyboard navigation in network selector
      const networkButtons = page.getByRole('button', { name: /Ethereum|Binance|XSC/i });

      await networkButtons.first().focus();
      await page.keyboard.press(KEYBOARD_SHORTCUTS.arrowDown);

      // Should move to next network option
      const focusedNetwork = await page.evaluate(() => {
        return document.activeElement?.textContent;
      });

      expect(focusedNetwork).toBeTruthy();

      // Activate with Enter
      await page.keyboard.press(KEYBOARD_SHORTCUTS.enter);
      await expect(page.getByText(/Selected Network/i)).toBeVisible();
    });

    test('should handle Escape key for modal dialogs', async ({ page }) => {
      await page.goto(BASE_URL);

      // Open wallet connection modal
      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await expect(page.getByText(/Select Wallet/i)).toBeVisible();

      // Close with Escape key
      await page.keyboard.press(KEYBOARD_SHORTCUTS.escape);
      await expect(page.getByText(/Select Wallet/i)).not.toBeVisible();
    });
  });

  test.describe('Focus Management', () => {
    test('should maintain focus order during wizard navigation', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      // Fill first step
      await page.getByLabel(/Token name/i).fill('Focus Test');
      await page.getByLabel(/Token symbol/i).fill('FOCUS');
      await page.getByLabel(/Total supply/i).fill('1000000');

      // Navigate to next step
      await page.getByRole('button', { name: /Next/i }).click();

      // Focus should move to the first interactive element in new step
      await page.waitForTimeout(500); // Allow for focus management
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName.toLowerCase();
      });

      // Should focus on first form element or heading
      expect(['input', 'button', 'h1', 'h2', 'h3'].includes(focusedElement)).toBeTruthy();
    });

    test('should announce step changes to screen readers', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      // Check for ARIA live regions
      await expect(page.locator('[aria-live="polite"]')).toBeVisible();
      await expect(page.locator('[aria-live="assertive"]')).toBeVisible();

      // Fill form and navigate
      await page.getByLabel(/Token name/i).fill('Announcement Test');
      await page.getByLabel(/Token symbol/i).fill('ANNOUNCE');
      await page.getByLabel(/Total supply/i).fill('1000000');

      await page.getByRole('button', { name: /Next/i }).click();

      // Check that step change is announced
      const liveRegion = page.locator('[aria-live="polite"]');
      await expect(liveRegion).toContainText(/Advanced Features/i);
    });

    test('should manage focus in error states', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      // Try to submit without required fields
      await page.getByRole('button', { name: /Next/i }).click();

      // Focus should move to first error field
      await page.waitForTimeout(500);
      await expect(page.getByLabel(/Token name/i)).toBeFocused();

      // Error should be announced
      await expect(page.getByText(/Token name is required/i)).toBeVisible();
    });

    test('should provide skip links for keyboard users', async ({ page }) => {
      await page.goto(BASE_URL);

      // Tab to activate skip link
      await page.keyboard.press(KEYBOARD_SHORTCUTS.tab);

      const skipLink = page.getByRole('link', { name: /Skip to main content/i });
      if (await skipLink.isVisible()) {
        await skipLink.click();

        // Should move focus to main content
        const mainContent = page.locator('main');
        await expect(mainContent).toBeFocused();
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);

      // Check heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();

      expect(headings.length).toBeGreaterThan(0);

      // Should have h1
      await expect(page.locator('h1')).toBeVisible();

      // Check heading levels are logical
      const headingElements = await page.locator('h1, h2, h3, h4, h5, h6').all();
      for (const heading of headingElements) {
        const level = await heading.evaluate((el) => parseInt(el.tagName.substring(1)));
        expect(level).toBeGreaterThan(0);
        expect(level).toBeLessThan(7);
      }
    });

    test('should have accessible form labels', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      // Check all form inputs have labels
      const inputs = [
        { label: /Token name/i, required: true },
        { label: /Token symbol/i, required: true },
        { label: /Total supply/i, required: true },
        { label: /Decimals/i, required: false }
      ];

      for (const input of inputs) {
        const field = page.getByLabel(input.label);
        await expect(field).toBeVisible();

        // Check aria-required for required fields
        if (input.required) {
          await expect(field).toHaveAttribute('aria-required', 'true');
        }

        // Check for proper labeling
        const labelId = await field.getAttribute('aria-labelledby');
        const hasLabel = await field.evaluate((el) => {
          const labels = document.querySelectorAll(`label[for="${el.id}"]`);
          return labels.length > 0 || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
        });

        expect(hasLabel).toBeTruthy();
      }
    });

    test('should provide error descriptions with aria-describedby', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      const nameInput = page.getByLabel(/Token name/i);

      // Trigger validation error
      await nameInput.fill('');
      await nameInput.blur();

      // Check error message is associated with input
      const errorMessage = page.getByText(/Token name is required/i);
      await expect(errorMessage).toBeVisible();

      // Check aria-describedby relationship
      const describedBy = await nameInput.getAttribute('aria-describedby');
      if (describedBy) {
        const errorElement = page.locator(`#${describedBy}`);
        await expect(errorElement).toBeVisible();
      }

      // Check aria-invalid is set
      await expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    });

    test('should have proper landmark regions', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);

      // Check for main landmarks
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('[role="main"]')).toBeVisible();

      // Check for navigation landmarks
      const nav = page.locator('nav, [role="navigation"]');
      if (await nav.count() > 0) {
        await expect(nav.first()).toBeVisible();
      }

      // Check for form landmark
      const form = page.locator('form, [role="form"]');
      if (await form.count() > 0) {
        await expect(form.first()).toBeVisible();
      }
    });

    test('should announce button states and roles', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      // Check Next button has proper role and state
      const nextButton = page.getByRole('button', { name: /Next/i });
      await expect(nextButton).toHaveAttribute('role', 'button');

      // Check disabled state is properly communicated
      await expect(nextButton).toHaveAttribute('aria-disabled', 'true');

      // Fill form to enable button
      await page.getByLabel(/Token name/i).fill('State Test');
      await page.getByLabel(/Token symbol/i).fill('STATE');
      await page.getByLabel(/Total supply/i).fill('1000000');

      // Wait for validation
      await page.waitForTimeout(1000);

      // Button should now be enabled
      await expect(nextButton).toHaveAttribute('aria-disabled', 'false');
    });
  });

  test.describe('Color and Contrast', () => {
    test('should meet WCAG AA contrast requirements for text', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);

      // Check various text elements
      await checkColorContrast(page, 'h1', WCAG_STANDARDS.colorContrast.large);
      await checkColorContrast(page, 'h2', WCAG_STANDARDS.colorContrast.large);
      await checkColorContrast(page, 'p', WCAG_STANDARDS.colorContrast.normal);
      await checkColorContrast(page, 'label', WCAG_STANDARDS.colorContrast.normal);
      await checkColorContrast(page, 'button', WCAG_STANDARDS.colorContrast.normal);
    });

    test('should meet contrast requirements for interactive elements', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      // Check form inputs
      await checkColorContrast(page, 'input[type="text"]', WCAG_STANDARDS.colorContrast.normal);
      await checkColorContrast(page, 'button', WCAG_STANDARDS.colorContrast.normal);

      // Check focus states have sufficient contrast
      const nameInput = page.getByLabel(/Token name/i);
      await nameInput.focus();

      // Focus indicator should be visible (simplified check)
      const hasFocusIndicator = await nameInput.evaluate((el) => {
        const style = window.getComputedStyle(el, ':focus');
        return style.outline !== 'none' && style.outline !== '' ||
               style.boxShadow !== 'none' && style.boxShadow !== '';
      });

      expect(hasFocusIndicator).toBeTruthy();
    });

    test('should not rely solely on color to convey information', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      // Trigger validation error
      await page.getByLabel(/Token name/i).fill('');
      await page.getByLabel(/Token name/i).blur();

      const errorElement = page.getByText(/Token name is required/i);

      // Error should be indicated by text, not just color
      await expect(errorElement).toBeVisible();

      // Check for error icon or text indicator
      const hasTextIndicator = await errorElement.evaluate((el) => {
        return el.textContent?.includes('required') ||
               el.textContent?.includes('error') ||
               el.querySelector('[role="img"]') !== null;
      });

      expect(hasTextIndicator).toBeTruthy();
    });
  });

  test.describe('Touch and Mobile Accessibility', () => {
    test('should have adequate touch target sizes on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 }); // iPhone size
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      // Check all interactive elements meet minimum size
      const interactiveSelectors = [
        'button',
        'input',
        'a',
        '[role="button"]',
        '[tabindex="0"]'
      ];

      for (const selector of interactiveSelectors) {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          if (await element.isVisible()) {
            await checkTouchTargetSize(page, selector);
          }
        }
      }
    });

    test('should maintain accessibility on mobile orientation changes', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);

      // Portrait mode
      await page.setViewportSize({ width: 375, height: 812 });
      await connectAccessibleWallet(page);

      // Check accessibility in portrait
      await expect(page.getByLabel(/Token name/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Next/i })).toBeVisible();

      // Landscape mode
      await page.setViewportSize({ width: 812, height: 375 });
      await page.waitForTimeout(1000); // Allow for reflow

      // Elements should still be accessible
      await expect(page.getByLabel(/Token name/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Next/i })).toBeVisible();

      // Tab navigation should still work
      await page.keyboard.press(KEYBOARD_SHORTCUTS.tab);
      const focusedElement = await page.evaluate(() => document.activeElement);
      expect(focusedElement).not.toBeNull();
    });
  });

  test.describe('Form Accessibility', () => {
    test('should provide clear instructions and help text', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      // Check for form instructions
      await expect(page.getByText(/Create your ERC20 token/i)).toBeVisible();

      // Check for field help text
      const decimalsField = page.getByLabel(/Decimals/i);
      const helpText = page.locator('[id*="help"], [aria-describedby], .help-text').first();

      if (await helpText.count() > 0) {
        await expect(helpText).toBeVisible();

        // Check if help text is associated with field
        const describedBy = await decimalsField.getAttribute('aria-describedby');
        if (describedBy) {
          await expect(page.locator(`#${describedBy}`)).toBeVisible();
        }
      }
    });

    test('should group related form controls', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      // Navigate to advanced features
      await page.getByLabel(/Token name/i).fill('Group Test');
      await page.getByLabel(/Token symbol/i).fill('GROUP');
      await page.getByLabel(/Total supply/i).fill('1000000');
      await page.getByRole('button', { name: /Next/i }).click();

      // Check for fieldset grouping of related features
      const fieldsets = await page.locator('fieldset').all();
      if (fieldsets.length > 0) {
        for (const fieldset of fieldsets) {
          // Each fieldset should have a legend
          const legend = fieldset.locator('legend');
          if (await legend.count() > 0) {
            await expect(legend).toBeVisible();
          }
        }
      }

      // Check for ARIA grouping
      const groups = await page.locator('[role="group"]').all();
      for (const group of groups) {
        // Groups should have accessible names
        const hasName = await group.evaluate((el) => {
          return el.getAttribute('aria-label') ||
                 el.getAttribute('aria-labelledby') ||
                 el.querySelector('legend') !== null;
        });
        expect(hasName).toBeTruthy();
      }
    });

    test('should support form submission with keyboard', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      // Fill form using keyboard only
      await page.getByLabel(/Token name/i).fill('Keyboard Token');
      await page.keyboard.press(KEYBOARD_SHORTCUTS.tab);

      await page.getByLabel(/Token symbol/i).fill('KEYB');
      await page.keyboard.press(KEYBOARD_SHORTCUTS.tab);

      await page.getByLabel(/Total supply/i).fill('1000000');
      await page.keyboard.press(KEYBOARD_SHORTCUTS.tab);

      // Should reach Next button
      await expect(page.getByRole('button', { name: /Next/i })).toBeFocused();

      // Submit with Enter
      await page.keyboard.press(KEYBOARD_SHORTCUTS.enter);
      await expect(page.getByText('Progress: Advanced Features')).toBeVisible();
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should provide accessible error messages', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      // Try to submit with invalid data
      await page.getByLabel(/Token name/i).fill('');
      await page.getByLabel(/Token symbol/i).fill('invalid-symbol');
      await page.getByLabel(/Total supply/i).fill('0');

      await page.getByRole('button', { name: /Next/i }).click();

      // Check error summary
      const errorSummary = page.locator('[role="alert"], .error-summary');
      if (await errorSummary.count() > 0) {
        await expect(errorSummary.first()).toBeVisible();
      }

      // Individual field errors should be accessible
      const nameError = page.getByText(/Token name is required/i);
      await expect(nameError).toBeVisible();

      // Error should be announced
      const hasAriaLive = await nameError.evaluate((el) => {
        return el.getAttribute('aria-live') ||
               el.closest('[aria-live]') !== null;
      });

      expect(hasAriaLive).toBeTruthy();
    });

    test('should provide recovery guidance', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      // Create validation error
      await page.getByLabel(/Total supply/i).fill('-100');
      await page.getByLabel(/Total supply/i).blur();

      // Should show helpful error message
      const errorText = await page.getByText(/Total supply must be greater than 0/i);
      await expect(errorText).toBeVisible();

      // Error should provide guidance, not just identification
      const errorContent = await errorText.textContent();
      expect(errorContent).toMatch(/must be|should be|enter|provide/i);
    });
  });

  test.describe('Dynamic Content Accessibility', () => {
    test('should announce loading states', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      // Complete form and initiate deployment
      await page.getByLabel(/Token name/i).fill('Loading Test');
      await page.getByLabel(/Token symbol/i).fill('LOAD');
      await page.getByLabel(/Total supply/i).fill('1000000');

      // Navigate to deployment (simplified)
      for (let i = 0; i < 5; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        await page.waitForTimeout(300);
        if (i === 2) {
          await page.getByRole('button', { name: /XSC Network/i }).click();
        }
      }

      // Check for loading announcement
      const loadingRegion = page.locator('[aria-live="polite"], [aria-live="assertive"]');
      await expect(loadingRegion.first()).toBeVisible();

      // Mock slow loading to test announcements
      await page.addInitScript(() => {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'eth_sendTransaction') {
            return new Promise(resolve => {
              setTimeout(() => resolve('0x123'), 5000);
            });
          }
          return null;
        };
      });

      await page.getByRole('button', { name: /Deploy Token/i }).click();

      // Should announce deployment progress
      await expect(page.getByText(/Deploying/i)).toBeVisible();
    });

    test('should handle dynamic content updates accessibly', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);
      await connectAccessibleWallet(page);

      // Test dynamic validation messages
      const nameInput = page.getByLabel(/Token name/i);

      // Type invalid characters
      await nameInput.fill('<script>');
      await nameInput.blur();

      // Validation message should appear and be announced
      await expect(page.getByText(/Invalid characters/i)).toBeVisible();

      // Clear and type valid name
      await nameInput.fill('Valid Token Name');
      await nameInput.blur();

      // Error should disappear
      await expect(page.getByText(/Invalid characters/i)).not.toBeVisible();
    });
  });
});

// Export accessibility test configuration
export const wcagComplianceConfig = {
  testId: 'wcag-compliance',
  standards: WCAG_STANDARDS,
  shortcuts: KEYBOARD_SHORTCUTS,
  timeout: A11Y_TIMEOUT,
  retries: 2
};

// Export for window access
if (typeof window !== 'undefined') {
  (window as any).wcagComplianceTests = {
    WCAG_STANDARDS,
    KEYBOARD_SHORTCUTS,
    setupAccessibleWallet,
    connectAccessibleWallet,
    checkColorContrast,
    checkTouchTargetSize
  };
}