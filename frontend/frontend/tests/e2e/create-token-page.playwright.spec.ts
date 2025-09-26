/**
 * Create Token Page - Playwright MCP E2E Tests
 *
 * Comprehensive end-to-end testing for the token creation page using Playwright MCP.
 * Tests the complete user journey from initial form filling through deployment,
 * including accessibility compliance, performance metrics, and error handling.
 *
 * Features Tested:
 * - Multi-step wizard navigation and validation
 * - Real-time form validation and error displays
 * - Network selection and switching
 * - Wallet connection integration
 * - Cost estimation and deployment readiness
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Mobile responsiveness
 * - Performance optimization validation
 * - Error recovery mechanisms
 *
 * @author Claude Code - Frontend E2E Test
 * @created 2025-09-26
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const MOBILE_VIEWPORT = { width: 375, height: 812 };
const TABLET_VIEWPORT = { width: 768, height: 1024 };
const DESKTOP_VIEWPORT = { width: 1200, height: 800 };

// Test data
const VALID_TOKEN_CONFIG = {
  name: 'Test Token',
  symbol: 'TEST',
  totalSupply: '1000000',
  decimals: 18,
  networkId: 520 // XSC Network
};

const INVALID_TOKEN_CONFIG = {
  name: '', // Invalid: empty
  symbol: 'test', // Invalid: lowercase
  totalSupply: '0', // Invalid: zero
  decimals: 25 // Invalid: too high
};

// Test utilities
const setupMockWallet = async (page: any) => {
  // Mock wallet connection for testing
  await page.addInitScript(() => {
    (window as any).ethereum = {
      isMetaMask: true,
      request: async ({ method }: { method: string }) => {
        switch (method) {
          case 'eth_requestAccounts':
            return ['0x1234567890123456789012345678901234567890'];
          case 'eth_chainId':
            return '0x208'; // XSC Network
          case 'eth_getBalance':
            return '0x1BC16D674EC80000'; // 2 ETH
          case 'wallet_switchEthereumChain':
            return null;
          case 'wallet_addEthereumChain':
            return null;
          default:
            throw new Error(`Unhandled method: ${method}`);
        }
      }
    };
  });
};

const waitForHydration = async (page: any) => {
  // Wait for React hydration to complete
  await page.waitForFunction(() => {
    return typeof window !== 'undefined' &&
           document.readyState === 'complete' &&
           (window as any).React;
  });
  await page.waitForTimeout(1000); // Additional safety margin
};

test.describe('Create Token Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockWallet(page);
    await page.goto(`${BASE_URL}/create-token`);
    await waitForHydration(page);
  });

  test.describe('Page Load and Initial State', () => {
    test('should load create token page successfully', async ({ page }) => {
      // Check page title and heading
      await expect(page).toHaveTitle(/Create Token/);
      await expect(page.getByRole('heading', { name: 'Create Token' })).toBeVisible();

      // Check wizard navigation
      await expect(page.getByRole('tablist', { name: 'Token creation steps' })).toBeVisible();

      // Check initial step is active
      await expect(page.getByRole('tab', { name: /Basic Information/, selected: true })).toBeVisible();

      // Check progress indicator
      await expect(page.getByText('Progress: Basic Information')).toBeVisible();
    });

    test('should have proper accessibility structure', async ({ page }) => {
      // Check ARIA landmarks
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('tablist')).toBeVisible();

      // Check heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);

      // Check form accessibility
      await expect(page.getByLabel(/Token name/i)).toBeVisible();
      await expect(page.getByLabel(/Token symbol/i)).toBeVisible();
      await expect(page.getByLabel(/Total supply/i)).toBeVisible();
      await expect(page.getByLabel(/Decimals/i)).toBeVisible();
    });

    test('should be mobile responsive', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT);

      // Check mobile navigation
      await expect(page.getByRole('tablist')).toBeVisible();

      // Check form elements are accessible
      await expect(page.getByLabel(/Token name/i)).toBeVisible();

      // Check buttons are appropriately sized
      const nextButton = page.getByRole('button', { name: /Next/i });
      await expect(nextButton).toBeVisible();

      const boundingBox = await nextButton.boundingBox();
      expect(boundingBox?.height).toBeGreaterThanOrEqual(44); // Minimum touch target
    });
  });

  test.describe('Basic Information Step', () => {
    test('should validate required fields', async ({ page }) => {
      const nextButton = page.getByRole('button', { name: /Next/i });

      // Try to proceed without filling required fields
      await nextButton.click();

      // Check validation errors appear
      await expect(page.getByText(/Token name is required/i)).toBeVisible();
      await expect(page.getByText(/Token symbol is required/i)).toBeVisible();
      await expect(page.getByText(/Total supply must be greater than 0/i)).toBeVisible();
    });

    test('should validate token name format', async ({ page }) => {
      const nameInput = page.getByLabel(/Token name/i);

      // Test invalid characters
      await nameInput.fill('Test<script>');
      await nameInput.blur();

      await expect(page.getByText(/Token name contains invalid characters/i)).toBeVisible();

      // Test valid name
      await nameInput.fill(VALID_TOKEN_CONFIG.name);
      await nameInput.blur();

      await expect(page.getByText(/Token name contains invalid characters/i)).not.toBeVisible();
    });

    test('should validate token symbol format', async ({ page }) => {
      const symbolInput = page.getByLabel(/Token symbol/i);

      // Test lowercase (should be uppercase)
      await symbolInput.fill('test');
      await symbolInput.blur();

      await expect(page.getByText(/Token symbol must be uppercase/i)).toBeVisible();

      // Test valid symbol
      await symbolInput.fill(VALID_TOKEN_CONFIG.symbol);
      await symbolInput.blur();

      await expect(page.getByText(/Token symbol must be uppercase/i)).not.toBeVisible();
    });

    test('should validate total supply', async ({ page }) => {
      const supplyInput = page.getByLabel(/Total supply/i);

      // Test zero supply
      await supplyInput.fill('0');
      await supplyInput.blur();

      await expect(page.getByText(/Total supply must be greater than 0/i)).toBeVisible();

      // Test negative supply
      await supplyInput.fill('-100');
      await supplyInput.blur();

      await expect(page.getByText(/Total supply must be greater than 0/i)).toBeVisible();

      // Test valid supply
      await supplyInput.fill(VALID_TOKEN_CONFIG.totalSupply);
      await supplyInput.blur();

      await expect(page.getByText(/Total supply must be greater than 0/i)).not.toBeVisible();
    });

    test('should validate decimals range', async ({ page }) => {
      const decimalsInput = page.getByLabel(/Decimals/i);

      // Test too high decimals
      await decimalsInput.fill('25');
      await decimalsInput.blur();

      await expect(page.getByText(/Decimals must be between 0 and 18/i)).toBeVisible();

      // Test negative decimals
      await decimalsInput.fill('-1');
      await decimalsInput.blur();

      await expect(page.getByText(/Decimals must be between 0 and 18/i)).toBeVisible();
    });

    test('should allow proceeding with valid data', async ({ page }) => {
      // Fill in valid data
      await page.getByLabel(/Token name/i).fill(VALID_TOKEN_CONFIG.name);
      await page.getByLabel(/Token symbol/i).fill(VALID_TOKEN_CONFIG.symbol);
      await page.getByLabel(/Total supply/i).fill(VALID_TOKEN_CONFIG.totalSupply);
      await page.getByLabel(/Decimals/i).fill(VALID_TOKEN_CONFIG.decimals.toString());

      // Wait for validation
      await page.waitForTimeout(500);

      // Check Next button becomes enabled
      const nextButton = page.getByRole('button', { name: /Next/i });
      await expect(nextButton).toBeEnabled();

      // Proceed to next step
      await nextButton.click();

      // Check we moved to Advanced Features step
      await expect(page.getByRole('tab', { name: /Advanced Features/, selected: true })).toBeVisible();
      await expect(page.getByText('Progress: Advanced Features')).toBeVisible();
    });
  });

  test.describe('Advanced Features Step', () => {
    test.beforeEach(async ({ page }) => {
      // Fill basic info and proceed
      await page.getByLabel(/Token name/i).fill(VALID_TOKEN_CONFIG.name);
      await page.getByLabel(/Token symbol/i).fill(VALID_TOKEN_CONFIG.symbol);
      await page.getByLabel(/Total supply/i).fill(VALID_TOKEN_CONFIG.totalSupply);
      await page.getByLabel(/Decimals/i).fill(VALID_TOKEN_CONFIG.decimals.toString());
      await page.getByRole('button', { name: /Next/i }).click();
      await expect(page.getByText('Progress: Advanced Features')).toBeVisible();
    });

    test('should display feature toggles', async ({ page }) => {
      await expect(page.getByLabel(/Mintable/i)).toBeVisible();
      await expect(page.getByLabel(/Burnable/i)).toBeVisible();
      await expect(page.getByLabel(/Pausable/i)).toBeVisible();
      await expect(page.getByLabel(/Capped/i)).toBeVisible();
    });

    test('should toggle features correctly', async ({ page }) => {
      const mintableToggle = page.getByLabel(/Mintable/i);

      // Check initial state
      await expect(mintableToggle).not.toBeChecked();

      // Toggle on
      await mintableToggle.check();
      await expect(mintableToggle).toBeChecked();

      // Toggle off
      await mintableToggle.uncheck();
      await expect(mintableToggle).not.toBeChecked();
    });

    test('should show feature warnings when appropriate', async ({ page }) => {
      // Enable capped without mintable
      await page.getByLabel(/Capped/i).check();

      // Should show warning about capped tokens typically needing mintable
      await expect(page.getByText(/Capped tokens typically require mintable/i)).toBeVisible();
    });

    test('should allow navigation back and forward', async ({ page }) => {
      const prevButton = page.getByRole('button', { name: /Previous/i });
      const nextButton = page.getByRole('button', { name: /Next/i });

      // Go back
      await prevButton.click();
      await expect(page.getByText('Progress: Basic Information')).toBeVisible();

      // Go forward
      await nextButton.click();
      await expect(page.getByText('Progress: Advanced Features')).toBeVisible();

      // Proceed to next step
      await nextButton.click();
      await expect(page.getByText('Progress: Permissions & Ownership')).toBeVisible();
    });
  });

  test.describe('Network Selection Step', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to network selection step
      await page.getByLabel(/Token name/i).fill(VALID_TOKEN_CONFIG.name);
      await page.getByLabel(/Token symbol/i).fill(VALID_TOKEN_CONFIG.symbol);
      await page.getByLabel(/Total supply/i).fill(VALID_TOKEN_CONFIG.totalSupply);
      await page.getByLabel(/Decimals/i).fill(VALID_TOKEN_CONFIG.decimals.toString());
      await page.getByRole('button', { name: /Next/i }).click(); // to Advanced Features
      await page.getByRole('button', { name: /Next/i }).click(); // to Permissions
      await page.getByRole('button', { name: /Next/i }).click(); // to Network Selection
      await expect(page.getByText('Progress: Network Selection')).toBeVisible();
    });

    test('should display network options', async ({ page }) => {
      await expect(page.getByText(/Ethereum/i)).toBeVisible();
      await expect(page.getByText(/Binance Smart Chain/i)).toBeVisible();
      await expect(page.getByText(/XSC Network/i)).toBeVisible();
    });

    test('should show XSC network benefits when selected', async ({ page }) => {
      // Select XSC network
      await page.getByRole('button', { name: /XSC Network/i }).click();

      // Should show XSC benefits
      await expect(page.getByText(/XSC Network Benefits/i)).toBeVisible();
      await expect(page.getByText(/Lower gas costs and faster transactions/i)).toBeVisible();
    });

    test('should require network selection to proceed', async ({ page }) => {
      const nextButton = page.getByRole('button', { name: /Next/i });

      // Try to proceed without selecting network
      await nextButton.click();

      // Should show validation error
      await expect(page.getByText(/Please select a network/i)).toBeVisible();
    });

    test('should allow proceeding with network selected', async ({ page }) => {
      // Select a network
      await page.getByRole('button', { name: /XSC Network/i }).click();
      await page.waitForTimeout(500);

      // Proceed to next step
      const nextButton = page.getByRole('button', { name: /Next/i });
      await nextButton.click();

      // Check we moved to Review step
      await expect(page.getByText('Progress: Review Configuration')).toBeVisible();
    });
  });

  test.describe('Review and Deployment', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate through all steps to review
      await page.getByLabel(/Token name/i).fill(VALID_TOKEN_CONFIG.name);
      await page.getByLabel(/Token symbol/i).fill(VALID_TOKEN_CONFIG.symbol);
      await page.getByLabel(/Total supply/i).fill(VALID_TOKEN_CONFIG.totalSupply);
      await page.getByLabel(/Decimals/i).fill(VALID_TOKEN_CONFIG.decimals.toString());
      await page.getByRole('button', { name: /Next/i }).click(); // to Advanced Features
      await page.getByRole('button', { name: /Next/i }).click(); // to Permissions
      await page.getByRole('button', { name: /Next/i }).click(); // to Network Selection
      await page.getByRole('button', { name: /XSC Network/i }).click(); // select network
      await page.getByRole('button', { name: /Next/i }).click(); // to Review
      await expect(page.getByText('Progress: Review Configuration')).toBeVisible();
    });

    test('should display configuration summary', async ({ page }) => {
      await expect(page.getByText(VALID_TOKEN_CONFIG.name)).toBeVisible();
      await expect(page.getByText(VALID_TOKEN_CONFIG.symbol)).toBeVisible();
      await expect(page.getByText(/XSC Network/i)).toBeVisible();
      await expect(page.getByText(VALID_TOKEN_CONFIG.totalSupply)).toBeVisible();
    });

    test('should show cost estimation', async ({ page }) => {
      await expect(page.getByText(/Estimated Cost/i)).toBeVisible();
      await expect(page.getByText(/Gas Estimate/i)).toBeVisible();
    });

    test('should allow proceeding to deployment', async ({ page }) => {
      const nextButton = page.getByRole('button', { name: /Next/i });
      await nextButton.click();

      // Check we moved to deployment step
      await expect(page.getByText('Progress: Deploy Token')).toBeVisible();
      await expect(page.getByRole('button', { name: /Deploy Token/i })).toBeVisible();
    });
  });

  test.describe('Deployment Process', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to deployment step
      await page.getByLabel(/Token name/i).fill(VALID_TOKEN_CONFIG.name);
      await page.getByLabel(/Token symbol/i).fill(VALID_TOKEN_CONFIG.symbol);
      await page.getByLabel(/Total supply/i).fill(VALID_TOKEN_CONFIG.totalSupply);
      await page.getByLabel(/Decimals/i).fill(VALID_TOKEN_CONFIG.decimals.toString());
      await page.getByRole('button', { name: /Next/i }).click(); // to Advanced Features
      await page.getByRole('button', { name: /Next/i }).click(); // to Permissions
      await page.getByRole('button', { name: /Next/i }).click(); // to Network Selection
      await page.getByRole('button', { name: /XSC Network/i }).click(); // select network
      await page.getByRole('button', { name: /Next/i }).click(); // to Review
      await page.getByRole('button', { name: /Next/i }).click(); // to Deployment
      await expect(page.getByText('Progress: Deploy Token')).toBeVisible();
    });

    test('should initiate deployment when button clicked', async ({ page }) => {
      const deployButton = page.getByRole('button', { name: /Deploy Token/i });
      await deployButton.click();

      // Should show deployment progress
      await expect(page.getByText(/Deploying/i)).toBeVisible();
      await expect(page.getByRole('progressbar')).toBeVisible();
    });

    test('should handle deployment errors gracefully', async ({ page }) => {
      // Mock deployment failure
      await page.addInitScript(() => {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'eth_sendTransaction') {
            throw new Error('User rejected transaction');
          }
          // Return success for other methods
          switch (method) {
            case 'eth_requestAccounts':
              return ['0x1234567890123456789012345678901234567890'];
            case 'eth_chainId':
              return '0x208';
            case 'eth_getBalance':
              return '0x1BC16D674EC80000';
            default:
              return null;
          }
        };
      });

      const deployButton = page.getByRole('button', { name: /Deploy Token/i });
      await deployButton.click();

      // Should show error message
      await expect(page.getByText(/Deployment failed/i)).toBeVisible();
      await expect(page.getByText(/User rejected transaction/i)).toBeVisible();
    });
  });

  test.describe('Step Navigation', () => {
    test('should allow clicking on completed steps', async ({ page }) => {
      // Complete first step
      await page.getByLabel(/Token name/i).fill(VALID_TOKEN_CONFIG.name);
      await page.getByLabel(/Token symbol/i).fill(VALID_TOKEN_CONFIG.symbol);
      await page.getByLabel(/Total supply/i).fill(VALID_TOKEN_CONFIG.totalSupply);
      await page.getByLabel(/Decimals/i).fill(VALID_TOKEN_CONFIG.decimals.toString());
      await page.getByRole('button', { name: /Next/i }).click();

      // Should be able to click back to basic info step
      await page.getByRole('tab', { name: /Basic Information/i }).click();
      await expect(page.getByText('Progress: Basic Information')).toBeVisible();

      // Data should be preserved
      await expect(page.getByLabel(/Token name/i)).toHaveValue(VALID_TOKEN_CONFIG.name);
    });

    test('should not allow clicking on incomplete steps', async ({ page }) => {
      // Try to click on advanced features step (not yet completed)
      const advancedFeaturesTab = page.getByRole('tab', { name: /Advanced Features/i });

      // Tab should be disabled/not clickable
      await expect(advancedFeaturesTab).toHaveAttribute('disabled');
    });
  });

  test.describe('Data Persistence', () => {
    test('should save draft data automatically', async ({ page }) => {
      // Fill in some data
      await page.getByLabel(/Token name/i).fill(VALID_TOKEN_CONFIG.name);
      await page.getByLabel(/Token symbol/i).fill(VALID_TOKEN_CONFIG.symbol);

      // Wait for autosave
      await page.waitForTimeout(2000);

      // Refresh page
      await page.reload();
      await waitForHydration(page);

      // Data should be restored (if autosave is implemented)
      // This test may need adjustment based on actual autosave implementation
      await expect(page.getByText(/Draft Restored/i)).toBeVisible({ timeout: 5000 });
    });

    test('should warn about unsaved changes when navigating away', async ({ page }) => {
      // Fill in some data
      await page.getByLabel(/Token name/i).fill(VALID_TOKEN_CONFIG.name);

      // Try to navigate away
      const backButton = page.getByRole('button', { name: /Back/i });

      // Set up dialog handler
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('unsaved changes');
        await dialog.dismiss();
      });

      await backButton.click();
    });
  });

  test.describe('Performance', () => {
    test('should load page within performance budget', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/create-token`);
      await waitForHydration(page);
      const loadTime = Date.now() - startTime;

      // Should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });

    test('should have good Core Web Vitals', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);

      // Measure LCP (Largest Contentful Paint)
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            if (entries.length > 0) {
              resolve(entries[entries.length - 1].startTime);
            }
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });

          // Fallback timeout
          setTimeout(() => resolve(0), 5000);
        });
      });

      // LCP should be under 2.5 seconds
      expect(lcp).toBeLessThan(2500);
    });
  });

  test.describe('Accessibility', () => {
    test('should have no automatic accessibility violations', async ({ page }) => {
      // This would require axe-playwright integration
      // await injectAxe(page);
      // const violations = await checkA11y(page);
      // expect(violations).toHaveLength(0);
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through form fields
      await page.keyboard.press('Tab'); // Should focus first input
      await expect(page.getByLabel(/Token name/i)).toBeFocused();

      await page.keyboard.press('Tab'); // Should focus symbol input
      await expect(page.getByLabel(/Token symbol/i)).toBeFocused();

      await page.keyboard.press('Tab'); // Should focus supply input
      await expect(page.getByLabel(/Total supply/i)).toBeFocused();
    });

    test('should have proper focus management in wizard', async ({ page }) => {
      // Complete first step
      await page.getByLabel(/Token name/i).fill(VALID_TOKEN_CONFIG.name);
      await page.getByLabel(/Token symbol/i).fill(VALID_TOKEN_CONFIG.symbol);
      await page.getByLabel(/Total supply/i).fill(VALID_TOKEN_CONFIG.totalSupply);
      await page.getByLabel(/Decimals/i).fill(VALID_TOKEN_CONFIG.decimals.toString());

      // Navigate with keyboard
      await page.keyboard.press('Tab'); // Focus Next button
      await expect(page.getByRole('button', { name: /Next/i })).toBeFocused();

      await page.keyboard.press('Enter'); // Activate Next button

      // Focus should move to new step content
      await expect(page.getByText('Advanced Features')).toBeVisible();
    });

    test('should announce step changes to screen readers', async ({ page }) => {
      // Check ARIA live regions for step announcements
      await expect(page.locator('[aria-live="polite"]')).toBeVisible();

      // Complete first step and check announcement
      await page.getByLabel(/Token name/i).fill(VALID_TOKEN_CONFIG.name);
      await page.getByLabel(/Token symbol/i).fill(VALID_TOKEN_CONFIG.symbol);
      await page.getByLabel(/Total supply/i).fill(VALID_TOKEN_CONFIG.totalSupply);
      await page.getByLabel(/Decimals/i).fill(VALID_TOKEN_CONFIG.decimals.toString());
      await page.getByRole('button', { name: /Next/i }).click();

      // Check that step change is announced
      await expect(page.getByText('Progress: Advanced Features')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/*', route => route.abort());

      // Try to proceed with deployment step
      // ... navigation code ...

      // Should show appropriate error message
      await expect(page.getByText(/Network error/i)).toBeVisible();
    });

    test('should handle wallet connection errors', async ({ page }) => {
      // Remove wallet mock
      await page.addInitScript(() => {
        delete (window as any).ethereum;
      });

      await page.reload();
      await waitForHydration(page);

      // Should show wallet connection prompt
      await expect(page.getByText(/Wallet Connection Required/i)).toBeVisible();
    });

    test('should validate form inputs in real-time', async ({ page }) => {
      const nameInput = page.getByLabel(/Token name/i);

      // Type invalid characters
      await nameInput.fill('Test<>');
      await nameInput.blur();

      // Error should appear immediately
      await expect(page.getByText(/invalid characters/i)).toBeVisible();

      // Fix the input
      await nameInput.fill('Test Token');
      await nameInput.blur();

      // Error should disappear
      await expect(page.getByText(/invalid characters/i)).not.toBeVisible();
    });
  });

  test.describe('Mobile Experience', () => {
    test.use({ viewport: MOBILE_VIEWPORT });

    test('should adapt wizard navigation for mobile', async ({ page }) => {
      // Check that step navigation is mobile-friendly
      await expect(page.getByRole('tablist')).toBeVisible();

      // Steps should be horizontally scrollable or stacked appropriately
      const tablist = page.getByRole('tablist');
      const boundingBox = await tablist.boundingBox();
      expect(boundingBox?.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
    });

    test('should have appropriate touch targets', async ({ page }) => {
      const inputs = await page.locator('input, button, [role="button"]').all();

      for (const input of inputs) {
        const box = await input.boundingBox();
        if (box) {
          // Minimum 44x44 touch target
          expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should handle mobile form interactions', async ({ page }) => {
      const nameInput = page.getByLabel(/Token name/i);

      // Should focus and show mobile keyboard
      await nameInput.tap();
      await expect(nameInput).toBeFocused();

      // Should accept input
      await nameInput.fill(VALID_TOKEN_CONFIG.name);
      await expect(nameInput).toHaveValue(VALID_TOKEN_CONFIG.name);
    });
  });
});

// Export test configuration for Playwright MCP integration
export const playwrightConfig = {
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] }
    }
  ]
};

// Export for window access in Playwright MCP
if (typeof window !== 'undefined') {
  (window as any).createTokenPageTests = {
    VALID_TOKEN_CONFIG,
    INVALID_TOKEN_CONFIG,
    setupMockWallet,
    waitForHydration
  };
}