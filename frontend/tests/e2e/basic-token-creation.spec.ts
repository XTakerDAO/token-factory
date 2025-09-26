/**
 * Basic Token Creation E2E Tests - Playwright MCP
 *
 * End-to-end testing for basic token creation functionality.
 * Tests the complete user journey for creating simple ERC20 tokens
 * without advanced features, focusing on core functionality,
 * validation, deployment process, and user experience.
 *
 * Features Tested:
 * - Basic token configuration (name, symbol, supply, decimals)
 * - Form validation and error handling
 * - Network selection and gas estimation
 * - Deployment process and transaction monitoring
 * - Success confirmation and token information display
 * - Cross-browser compatibility
 * - Mobile responsiveness
 * - Performance under normal load
 *
 * @author Claude Code - E2E Basic Token Testing
 * @created 2025-09-26
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000; // 60 seconds for deployment tests

// Test data for basic tokens
const BASIC_TOKEN_CONFIGS = {
  minimal: {
    name: 'Basic Token',
    symbol: 'BASIC',
    totalSupply: '1000',
    decimals: 18,
    network: 'XSC Network'
  },
  standard: {
    name: 'Standard ERC20 Token',
    symbol: 'STD20',
    totalSupply: '1000000',
    decimals: 18,
    network: 'XSC Network'
  },
  large: {
    name: 'Large Supply Token',
    symbol: 'LARGE',
    totalSupply: '1000000000000',
    decimals: 6,
    network: 'Ethereum'
  },
  customDecimals: {
    name: 'Custom Decimals Token',
    symbol: 'CUSTOM',
    totalSupply: '500000',
    decimals: 8,
    network: 'Binance Smart Chain'
  }
};

// Invalid configurations for validation testing
const INVALID_TOKEN_CONFIGS = {
  emptyName: { ...BASIC_TOKEN_CONFIGS.minimal, name: '' },
  invalidSymbol: { ...BASIC_TOKEN_CONFIGS.minimal, symbol: 'invalid-symbol-123' },
  zeroSupply: { ...BASIC_TOKEN_CONFIGS.minimal, totalSupply: '0' },
  negativeSupply: { ...BASIC_TOKEN_CONFIGS.minimal, totalSupply: '-1000' },
  invalidDecimals: { ...BASIC_TOKEN_CONFIGS.minimal, decimals: 25 },
  scriptInjection: { ...BASIC_TOKEN_CONFIGS.minimal, name: '<script>alert("xss")</script>' }
};

// Mock wallet setup
const setupBasicWallet = async (page: any) => {
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
          case 'eth_gasPrice':
            return '0x3B9ACA00'; // 1 gwei
          case 'eth_estimateGas':
            return '0x186A0'; // 100000 gas
          case 'eth_sendTransaction':
            return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
          case 'eth_getTransactionReceipt':
            return {
              status: '0x1',
              blockNumber: '0x1',
              transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
              contractAddress: '0x9876543210987654321098765432109876543210'
            };
          case 'wallet_switchEthereumChain':
            return null;
          case 'wallet_addEthereumChain':
            return null;
          default:
            return null;
        }
      }
    };
  });
};

const waitForPageReady = async (page: any) => {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => document.readyState === 'complete');
  await page.waitForTimeout(1000);
};

const connectWallet = async (page: any) => {
  await page.getByRole('button', { name: /Connect Wallet/i }).click();
  await page.getByRole('button', { name: /MetaMask/i }).click();
  await expect(page.getByText(/Connected/i)).toBeVisible({ timeout: 10000 });
};

const fillBasicTokenInfo = async (page: any, config: typeof BASIC_TOKEN_CONFIGS.minimal) => {
  await page.getByLabel(/Token name/i).fill(config.name);
  await page.getByLabel(/Token symbol/i).fill(config.symbol);
  await page.getByLabel(/Total supply/i).fill(config.totalSupply);
  if (config.decimals !== 18) {
    await page.getByLabel(/Decimals/i).fill(config.decimals.toString());
  }
};

test.describe('Basic Token Creation', () => {
  test.beforeEach(async ({ page }) => {
    await setupBasicWallet(page);
    await page.goto(`${BASE_URL}/create-token`);
    await waitForPageReady(page);
    await connectWallet(page);
  });

  test.describe('Form Validation', () => {
    test('should validate required fields', async ({ page }) => {
      const nextButton = page.getByRole('button', { name: /Next/i });

      // Try to proceed without filling any fields
      await nextButton.click();

      // Should show validation errors
      await expect(page.getByText(/Token name is required/i)).toBeVisible();
      await expect(page.getByText(/Token symbol is required/i)).toBeVisible();
      await expect(page.getByText(/Total supply is required/i)).toBeVisible();

      // Next button should remain disabled
      await expect(nextButton).toBeDisabled();
    });

    test('should validate token name format', async ({ page }) => {
      const nameInput = page.getByLabel(/Token name/i);

      // Test empty name
      await fillBasicTokenInfo(page, INVALID_TOKEN_CONFIGS.emptyName);
      await nameInput.blur();
      await expect(page.getByText(/Token name is required/i)).toBeVisible();

      // Test script injection
      await nameInput.fill(INVALID_TOKEN_CONFIGS.scriptInjection.name);
      await nameInput.blur();
      await expect(page.getByText(/Invalid characters in token name/i)).toBeVisible();

      // Test valid name
      await nameInput.fill(BASIC_TOKEN_CONFIGS.minimal.name);
      await nameInput.blur();
      await expect(page.getByText(/Invalid characters in token name/i)).not.toBeVisible();
    });

    test('should validate token symbol format', async ({ page }) => {
      const symbolInput = page.getByLabel(/Token symbol/i);

      // Test invalid symbol
      await symbolInput.fill(INVALID_TOKEN_CONFIGS.invalidSymbol.symbol);
      await symbolInput.blur();
      await expect(page.getByText(/Invalid token symbol format/i)).toBeVisible();

      // Test valid symbol
      await symbolInput.fill(BASIC_TOKEN_CONFIGS.minimal.symbol);
      await symbolInput.blur();
      await expect(page.getByText(/Invalid token symbol format/i)).not.toBeVisible();
    });

    test('should validate total supply', async ({ page }) => {
      const supplyInput = page.getByLabel(/Total supply/i);

      // Test zero supply
      await supplyInput.fill(INVALID_TOKEN_CONFIGS.zeroSupply.totalSupply);
      await supplyInput.blur();
      await expect(page.getByText(/Total supply must be greater than 0/i)).toBeVisible();

      // Test negative supply
      await supplyInput.fill(INVALID_TOKEN_CONFIGS.negativeSupply.totalSupply);
      await supplyInput.blur();
      await expect(page.getByText(/Total supply must be greater than 0/i)).toBeVisible();

      // Test valid supply
      await supplyInput.fill(BASIC_TOKEN_CONFIGS.minimal.totalSupply);
      await supplyInput.blur();
      await expect(page.getByText(/Total supply must be greater than 0/i)).not.toBeVisible();
    });

    test('should validate decimals range', async ({ page }) => {
      const decimalsInput = page.getByLabel(/Decimals/i);

      // Test invalid decimals
      await decimalsInput.fill(INVALID_TOKEN_CONFIGS.invalidDecimals.decimals.toString());
      await decimalsInput.blur();
      await expect(page.getByText(/Decimals must be between 0 and 18/i)).toBeVisible();

      // Test valid decimals
      await decimalsInput.fill(BASIC_TOKEN_CONFIGS.customDecimals.decimals.toString());
      await decimalsInput.blur();
      await expect(page.getByText(/Decimals must be between 0 and 18/i)).not.toBeVisible();
    });

    test('should enable next button when form is valid', async ({ page }) => {
      const nextButton = page.getByRole('button', { name: /Next/i });

      // Initially disabled
      await expect(nextButton).toBeDisabled();

      // Fill valid data
      await fillBasicTokenInfo(page, BASIC_TOKEN_CONFIGS.minimal);
      await page.waitForTimeout(500); // Wait for validation

      // Should be enabled
      await expect(nextButton).toBeEnabled();
    });
  });

  test.describe('Multi-Step Wizard Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await fillBasicTokenInfo(page, BASIC_TOKEN_CONFIGS.standard);
    });

    test('should navigate through wizard steps correctly', async ({ page }) => {
      // Step 1: Basic Information
      await expect(page.getByText('Progress: Basic Information')).toBeVisible();
      await page.getByRole('button', { name: /Next/i }).click();

      // Step 2: Advanced Features (skip for basic token)
      await expect(page.getByText('Progress: Advanced Features')).toBeVisible();
      await page.getByRole('button', { name: /Next/i }).click();

      // Step 3: Permissions & Ownership
      await expect(page.getByText('Progress: Permissions')).toBeVisible();
      await page.getByRole('button', { name: /Next/i }).click();

      // Step 4: Network Selection
      await expect(page.getByText('Progress: Network Selection')).toBeVisible();
      await page.getByRole('button', { name: /XSC Network/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();

      // Step 5: Review Configuration
      await expect(page.getByText('Progress: Review Configuration')).toBeVisible();
    });

    test('should allow going back to previous steps', async ({ page }) => {
      // Navigate forward
      await page.getByRole('button', { name: /Next/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();

      // Go back
      await page.getByRole('button', { name: /Previous/i }).click();
      await expect(page.getByText('Progress: Advanced Features')).toBeVisible();

      await page.getByRole('button', { name: /Previous/i }).click();
      await expect(page.getByText('Progress: Basic Information')).toBeVisible();

      // Data should be preserved
      await expect(page.getByLabel(/Token name/i)).toHaveValue(BASIC_TOKEN_CONFIGS.standard.name);
      await expect(page.getByLabel(/Token symbol/i)).toHaveValue(BASIC_TOKEN_CONFIGS.standard.symbol);
    });

    test('should validate step completion before allowing navigation', async ({ page }) => {
      // Navigate to network selection
      await page.getByRole('button', { name: /Next/i }).click(); // Advanced Features
      await page.getByRole('button', { name: /Next/i }).click(); // Permissions
      await page.getByRole('button', { name: /Next/i }).click(); // Network Selection

      const nextButton = page.getByRole('button', { name: /Next/i });

      // Try to proceed without selecting network
      await nextButton.click();

      // Should show validation error
      await expect(page.getByText(/Please select a network/i)).toBeVisible();

      // Should not proceed to next step
      await expect(page.getByText('Progress: Network Selection')).toBeVisible();
    });
  });

  test.describe('Network Selection', () => {
    test.beforeEach(async ({ page }) => {
      await fillBasicTokenInfo(page, BASIC_TOKEN_CONFIGS.standard);
      // Navigate to network selection
      await page.getByRole('button', { name: /Next/i }).click(); // Advanced Features
      await page.getByRole('button', { name: /Next/i }).click(); // Permissions
      await page.getByRole('button', { name: /Next/i }).click(); // Network Selection
    });

    test('should display available networks', async ({ page }) => {
      await expect(page.getByText(/Ethereum/i)).toBeVisible();
      await expect(page.getByText(/Binance Smart Chain/i)).toBeVisible();
      await expect(page.getByText(/XSC Network/i)).toBeVisible();
    });

    test('should show network information when selected', async ({ page }) => {
      await page.getByRole('button', { name: /XSC Network/i }).click();

      await expect(page.getByText(/Selected Network: XSC/i)).toBeVisible();
      await expect(page.getByText(/Lower gas costs/i)).toBeVisible();
      await expect(page.getByText(/Faster transactions/i)).toBeVisible();
    });

    test('should calculate different gas costs per network', async ({ page }) => {
      // Select XSC Network
      await page.getByRole('button', { name: /XSC Network/i }).click();
      await expect(page.getByText(/Estimated Cost: ~0.0001 XSC/i)).toBeVisible();

      // Select Ethereum
      await page.getByRole('button', { name: /Ethereum/i }).click();
      await expect(page.getByText(/Estimated Cost: ~0.01 ETH/i)).toBeVisible();

      // Select BSC
      await page.getByRole('button', { name: /Binance Smart Chain/i }).click();
      await expect(page.getByText(/Estimated Cost: ~0.001 BNB/i)).toBeVisible();
    });
  });

  test.describe('Configuration Review', () => {
    test.beforeEach(async ({ page }) => {
      await fillBasicTokenInfo(page, BASIC_TOKEN_CONFIGS.standard);
      // Navigate to review step
      await page.getByRole('button', { name: /Next/i }).click(); // Advanced Features
      await page.getByRole('button', { name: /Next/i }).click(); // Permissions
      await page.getByRole('button', { name: /Next/i }).click(); // Network Selection
      await page.getByRole('button', { name: /XSC Network/i }).click();
      await page.getByRole('button', { name: /Next/i }).click(); // Review
    });

    test('should display configuration summary', async ({ page }) => {
      // Basic token information
      await expect(page.getByText(BASIC_TOKEN_CONFIGS.standard.name)).toBeVisible();
      await expect(page.getByText(BASIC_TOKEN_CONFIGS.standard.symbol)).toBeVisible();
      await expect(page.getByText(BASIC_TOKEN_CONFIGS.standard.totalSupply)).toBeVisible();
      await expect(page.getByText(/18 decimals/i)).toBeVisible();

      // Network information
      await expect(page.getByText(/XSC Network/i)).toBeVisible();

      // Feature summary (should show "Basic Token")
      await expect(page.getByText(/Token Type: Basic ERC20/i)).toBeVisible();
      await expect(page.getByText(/Advanced Features: None/i)).toBeVisible();
    });

    test('should show cost estimation', async ({ page }) => {
      await expect(page.getByText(/Deployment Cost/i)).toBeVisible();
      await expect(page.getByText(/Gas Estimate:/i)).toBeVisible();
      await expect(page.getByText(/Network Fee:/i)).toBeVisible();
      await expect(page.getByText(/Service Fee:/i)).toBeVisible();
    });

    test('should allow editing configuration', async ({ page }) => {
      // Click edit button for basic information
      await page.getByRole('button', { name: /Edit Basic Information/i }).click();

      // Should return to basic information step
      await expect(page.getByText('Progress: Basic Information')).toBeVisible();

      // Data should be preserved
      await expect(page.getByLabel(/Token name/i)).toHaveValue(BASIC_TOKEN_CONFIGS.standard.name);
    });

    test('should proceed to deployment when confirmed', async ({ page }) => {
      await page.getByRole('button', { name: /Next/i }).click();

      await expect(page.getByText('Progress: Deploy Token')).toBeVisible();
      await expect(page.getByRole('button', { name: /Deploy Token/i })).toBeVisible();
    });
  });

  test.describe('Token Deployment', () => {
    test.beforeEach(async ({ page }) => {
      await fillBasicTokenInfo(page, BASIC_TOKEN_CONFIGS.minimal);
      // Navigate to deployment step
      for (let i = 0; i < 4; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        if (i === 2) { // Network selection step
          await page.getByRole('button', { name: /XSC Network/i }).click();
        }
        await page.waitForTimeout(500);
      }
    });

    test('should initiate deployment process', async ({ page }) => {
      test.setTimeout(TEST_TIMEOUT);

      const deployButton = page.getByRole('button', { name: /Deploy Token/i });
      await deployButton.click();

      // Should show deployment progress
      await expect(page.getByText(/Deploying your token/i)).toBeVisible();
      await expect(page.getByRole('progressbar')).toBeVisible();
      await expect(page.getByText(/Please confirm the transaction/i)).toBeVisible();
    });

    test('should track deployment progress', async ({ page }) => {
      test.setTimeout(TEST_TIMEOUT);

      await page.getByRole('button', { name: /Deploy Token/i }).click();

      // Should show progress steps
      await expect(page.getByText(/Preparing transaction/i)).toBeVisible();
      await expect(page.getByText(/Waiting for confirmation/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/Deploying contract/i)).toBeVisible({ timeout: 15000 });
    });

    test('should show deployment success', async ({ page }) => {
      test.setTimeout(TEST_TIMEOUT);

      await page.getByRole('button', { name: /Deploy Token/i }).click();

      // Wait for deployment to complete
      await expect(page.getByText(/Deployment Successful/i)).toBeVisible({ timeout: 30000 });

      // Should show token details
      await expect(page.getByText(/Token Contract Address/i)).toBeVisible();
      await expect(page.getByText(/0x9876543210987654321098765432109876543210/i)).toBeVisible();
      await expect(page.getByText(/Transaction Hash/i)).toBeVisible();

      // Should provide next actions
      await expect(page.getByRole('button', { name: /View on Explorer/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Create Another Token/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Go to My Tokens/i })).toBeVisible();
    });

    test('should handle deployment errors', async ({ page }) => {
      // Mock transaction failure
      await page.addInitScript(() => {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'eth_sendTransaction') {
            throw new Error('Transaction failed: insufficient funds');
          }
          return '0x1234567890123456789012345678901234567890';
        };
      });

      await page.getByRole('button', { name: /Deploy Token/i }).click();

      // Should show error message
      await expect(page.getByText(/Deployment Failed/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/insufficient funds/i)).toBeVisible();

      // Should provide retry options
      await expect(page.getByRole('button', { name: /Try Again/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Edit Configuration/i })).toBeVisible();
    });

    test('should handle user rejection', async ({ page }) => {
      // Mock user rejection
      await page.addInitScript(() => {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'eth_sendTransaction') {
            throw new Error('User denied transaction signature');
          }
          return '0x1234567890123456789012345678901234567890';
        };
      });

      await page.getByRole('button', { name: /Deploy Token/i }).click();

      // Should show user rejection message
      await expect(page.getByText(/Transaction Cancelled/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/User denied transaction/i)).toBeVisible();

      // Should allow retry
      await expect(page.getByRole('button', { name: /Try Again/i })).toBeVisible();
    });
  });

  test.describe('Different Token Configurations', () => {
    test('should create minimal token successfully', async ({ page }) => {
      test.setTimeout(TEST_TIMEOUT);

      await fillBasicTokenInfo(page, BASIC_TOKEN_CONFIGS.minimal);

      // Navigate through wizard quickly
      for (let i = 0; i < 5; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        if (i === 2) await page.getByRole('button', { name: /XSC Network/i }).click();
        await page.waitForTimeout(300);
      }

      // Deploy
      await page.getByRole('button', { name: /Deploy Token/i }).click();
      await expect(page.getByText(/Deployment Successful/i)).toBeVisible({ timeout: 30000 });

      // Verify token details match minimal config
      await expect(page.getByText(BASIC_TOKEN_CONFIGS.minimal.name)).toBeVisible();
      await expect(page.getByText(BASIC_TOKEN_CONFIGS.minimal.symbol)).toBeVisible();
      await expect(page.getByText(/1,000 tokens/i)).toBeVisible();
    });

    test('should create large supply token successfully', async ({ page }) => {
      test.setTimeout(TEST_TIMEOUT);

      await fillBasicTokenInfo(page, BASIC_TOKEN_CONFIGS.large);

      // Navigate and select Ethereum network for large token
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        await page.waitForTimeout(300);
      }

      await page.getByRole('button', { name: /Ethereum/i }).click();
      await page.getByRole('button', { name: /Next/i }).click(); // to Review
      await page.getByRole('button', { name: /Next/i }).click(); // to Deploy

      // Should show higher gas costs for Ethereum
      await expect(page.getByText(/Higher gas costs on Ethereum/i)).toBeVisible();

      await page.getByRole('button', { name: /Deploy Token/i }).click();
      await expect(page.getByText(/Deployment Successful/i)).toBeVisible({ timeout: 45000 });

      // Verify large supply formatting
      await expect(page.getByText(/1,000,000,000,000 tokens/i)).toBeVisible();
    });

    test('should create custom decimals token successfully', async ({ page }) => {
      test.setTimeout(TEST_TIMEOUT);

      await fillBasicTokenInfo(page, BASIC_TOKEN_CONFIGS.customDecimals);

      // Navigate through and select BSC
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        await page.waitForTimeout(300);
      }

      await page.getByRole('button', { name: /Binance Smart Chain/i }).click();
      await page.getByRole('button', { name: /Next/i }).click(); // to Review

      // Should show 8 decimals in summary
      await expect(page.getByText(/8 decimals/i)).toBeVisible();

      await page.getByRole('button', { name: /Next/i }).click(); // to Deploy
      await page.getByRole('button', { name: /Deploy Token/i }).click();

      await expect(page.getByText(/Deployment Successful/i)).toBeVisible({ timeout: 30000 });

      // Verify custom decimals
      await expect(page.getByText(BASIC_TOKEN_CONFIGS.customDecimals.symbol)).toBeVisible();
      await expect(page.getByText(/8 decimal places/i)).toBeVisible();
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('should load form within performance budget', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/create-token`);
      await waitForPageReady(page);
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000); // 3 seconds
    });

    test('should respond to user input quickly', async ({ page }) => {
      const nameInput = page.getByLabel(/Token name/i);

      const startTime = Date.now();
      await nameInput.fill('Quick Response Test');
      await nameInput.blur();

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500); // 500ms for validation feedback
    });

    test('should handle rapid navigation', async ({ page }) => {
      await fillBasicTokenInfo(page, BASIC_TOKEN_CONFIGS.minimal);

      // Rapid forward navigation
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        await page.getByRole('button', { name: /Next/i }).click();
        if (i === 2) await page.getByRole('button', { name: /XSC Network/i }).click();

        await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible();
        const navigationTime = Date.now() - startTime;
        expect(navigationTime).toBeLessThan(1000); // 1 second per step
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 812 } }); // iPhone size

    test('should be fully functional on mobile', async ({ page }) => {
      await fillBasicTokenInfo(page, BASIC_TOKEN_CONFIGS.minimal);

      // Check form elements are touch-friendly
      const inputs = await page.locator('input').all();
      for (const input of inputs) {
        const box = await input.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44); // Minimum touch target
      }

      // Should navigate successfully on mobile
      await page.getByRole('button', { name: /Next/i }).click();
      await expect(page.getByText('Progress: Advanced Features')).toBeVisible();

      // Mobile-specific UI adaptations
      await expect(page.locator('[data-testid="mobile-step-indicator"]')).toBeVisible();
    });

    test('should handle mobile form interactions', async ({ page }) => {
      const nameInput = page.getByLabel(/Token name/i);

      // Tap to focus (mobile interaction)
      await nameInput.tap();
      await expect(nameInput).toBeFocused();

      // Should handle mobile keyboard input
      await nameInput.fill('Mobile Token');
      await expect(nameInput).toHaveValue('Mobile Token');

      // Mobile-specific validation display
      await nameInput.fill('');
      await nameInput.blur();
      await expect(page.getByText(/Token name is required/i)).toBeVisible();
    });
  });
});

// Export test configuration for Playwright MCP integration
export const basicTokenCreationConfig = {
  testId: 'basic-token-creation',
  configs: BASIC_TOKEN_CONFIGS,
  invalidConfigs: INVALID_TOKEN_CONFIGS,
  timeout: TEST_TIMEOUT,
  retries: 2
};

// Export utilities for window access in Playwright MCP
if (typeof window !== 'undefined') {
  (window as any).basicTokenCreationTests = {
    BASIC_TOKEN_CONFIGS,
    INVALID_TOKEN_CONFIGS,
    setupBasicWallet,
    waitForPageReady,
    connectWallet,
    fillBasicTokenInfo
  };
}