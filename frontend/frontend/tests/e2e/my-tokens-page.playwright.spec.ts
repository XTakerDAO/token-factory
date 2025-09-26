/**
 * My Tokens Dashboard Page - Playwright MCP E2E Tests
 *
 * Comprehensive end-to-end testing for the token management dashboard using Playwright MCP.
 * Tests portfolio overview, token management operations, transaction monitoring,
 * analytics views, and multi-chain token interactions.
 *
 * Features Tested:
 * - Portfolio overview and statistics
 * - Token grid and list views
 * - Search and filtering capabilities
 * - Token management operations
 * - Transaction history and monitoring
 * - Analytics and performance metrics
 * - Export functionality
 * - Mobile responsiveness
 * - Accessibility compliance
 * - Real-time updates
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

// Mock token data
const MOCK_TOKENS = [
  {
    id: 'token-1',
    name: 'Test Token One',
    symbol: 'TTO',
    networkId: 1, // Ethereum
    totalSupply: 1000000n,
    decimals: 18,
    contractAddress: '0x1234567890123456789012345678901234567890',
    holders: 150,
    transferCount: 1250,
    isActive: true
  },
  {
    id: 'token-2',
    name: 'XSC Test Token',
    symbol: 'XTT',
    networkId: 520, // XSC
    totalSupply: 5000000n,
    decimals: 18,
    contractAddress: '0x2345678901234567890123456789012345678901',
    holders: 450,
    transferCount: 3200,
    isActive: true
  },
  {
    id: 'token-3',
    name: 'BSC Token',
    symbol: 'BST',
    networkId: 56, // BSC
    totalSupply: 2000000n,
    decimals: 18,
    contractAddress: '0x3456789012345678901234567890123456789012',
    holders: 75,
    transferCount: 890,
    isActive: false
  }
];

// Test utilities
const setupMockWallet = async (page: any) => {
  await page.addInitScript(() => {
    (window as any).ethereum = {
      isMetaMask: true,
      request: async ({ method }: { method: string }) => {
        switch (method) {
          case 'eth_requestAccounts':
            return ['0x1234567890123456789012345678901234567890'];
          case 'eth_chainId':
            return '0x1'; // Ethereum mainnet
          case 'eth_getBalance':
            return '0x1BC16D674EC80000'; // 2 ETH
          default:
            return null;
        }
      }
    };
  });
};

const setupMockTokenStore = async (page: any, tokens = MOCK_TOKENS) => {
  await page.addInitScript((mockTokens) => {
    // Mock token store
    (window as any).mockTokenStore = {
      configurations: mockTokens,
      getConfigurations: () => mockTokens,
      removeConfiguration: (id: string) => {
        const index = mockTokens.findIndex((token: any) => token.id === id);
        if (index !== -1) {
          mockTokens.splice(index, 1);
        }
      }
    };
  }, tokens);
};

const waitForHydration = async (page: any) => {
  await page.waitForFunction(() => {
    return typeof window !== 'undefined' &&
           document.readyState === 'complete' &&
           (window as any).React;
  });
  await page.waitForTimeout(1000);
};

test.describe('My Tokens Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockWallet(page);
    await setupMockTokenStore(page);
    await page.goto(`${BASE_URL}/my-tokens`);
    await waitForHydration(page);
  });

  test.describe('Page Load and Initial State', () => {
    test('should load dashboard page successfully', async ({ page }) => {
      // Check page title and heading
      await expect(page).toHaveTitle(/My Tokens/);
      await expect(page.getByRole('heading', { name: 'My Tokens' })).toBeVisible();

      // Check portfolio summary section
      await expect(page.getByText('Total Tokens')).toBeVisible();
      await expect(page.getByText('Transactions')).toBeVisible();
      await expect(page.getByText('Success Rate')).toBeVisible();
      await expect(page.getByText('Networks')).toBeVisible();
    });

    test('should display portfolio statistics correctly', async ({ page }) => {
      // Check total tokens count (should be 3 from mock data)
      await expect(page.getByText('3')).toBeVisible(); // Total tokens

      // Check network breakdown
      await expect(page.getByText('Ethereum')).toBeVisible();
      await expect(page.getByText('XSC Network')).toBeVisible();
      await expect(page.getByText('Binance Smart Chain')).toBeVisible();
    });

    test('should have proper accessibility structure', async ({ page }) => {
      // Check main landmarks
      await expect(page.getByRole('main')).toBeVisible();

      // Check tab navigation
      await expect(page.getByRole('tablist')).toBeVisible();
      await expect(page.getByRole('tab', { name: /Grid View/ })).toBeVisible();
      await expect(page.getByRole('tab', { name: /List View/ })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Analytics/ })).toBeVisible();

      // Check search accessibility
      await expect(page.getByRole('searchbox')).toBeVisible();
      await expect(page.getByLabel(/Search tokens/i)).toBeVisible();
    });
  });

  test.describe('Token Grid View', () => {
    test('should display token cards in grid layout', async ({ page }) => {
      // Should be in grid view by default
      await expect(page.getByRole('tab', { name: /Grid View/, selected: true })).toBeVisible();

      // Check token cards are displayed
      await expect(page.getByText('Test Token One')).toBeVisible();
      await expect(page.getByText('XSC Test Token')).toBeVisible();
      await expect(page.getByText('BSC Token')).toBeVisible();
    });

    test('should display token information correctly', async ({ page }) => {
      const tokenCard = page.locator('text=Test Token One').locator('..');

      // Check token details
      await expect(tokenCard.getByText('TTO')).toBeVisible(); // Symbol
      await expect(tokenCard.getByText('Ethereum')).toBeVisible(); // Network
      await expect(tokenCard.getByText('150')).toBeVisible(); // Holders
      await expect(tokenCard.getByText('Active')).toBeVisible(); // Status
    });

    test('should show network badges correctly', async ({ page }) => {
      // Check Ethereum badge
      const ethereumToken = page.locator('text=Test Token One').locator('..');
      await expect(ethereumToken.getByText('Ethereum')).toBeVisible();

      // Check XSC badge
      const xscToken = page.locator('text=XSC Test Token').locator('..');
      await expect(xscToken.getByText('XSC Network')).toBeVisible();

      // Check BSC badge
      const bscToken = page.locator('text=BSC Token').locator('..');
      await expect(bscToken.getByText('Binance Smart Chain')).toBeVisible();
    });

    test('should display token features as badges', async ({ page }) => {
      const tokenCard = page.locator('text=Test Token One').locator('..');

      // Check if feature badges are displayed (these would come from token configuration)
      // This test may need adjustment based on actual token feature data
      await expect(tokenCard.locator('[data-testid="features"]')).toBeVisible();
    });

    test('should handle token actions dropdown', async ({ page }) => {
      const tokenCard = page.locator('text=Test Token One').locator('..');
      const actionsButton = tokenCard.getByRole('button').first();

      // Open dropdown
      await actionsButton.click();

      // Check dropdown menu items
      await expect(page.getByText('View Details')).toBeVisible();
      await expect(page.getByText('Manage Token')).toBeVisible();
      await expect(page.getByText('Copy Address')).toBeVisible();
      await expect(page.getByText('View on Explorer')).toBeVisible();
      await expect(page.getByText('Remove')).toBeVisible();
    });
  });

  test.describe('Token List View', () => {
    test('should switch to list view', async ({ page }) => {
      // Switch to list view
      await page.getByRole('tab', { name: /List View/ }).click();
      await expect(page.getByRole('tab', { name: /List View/, selected: true })).toBeVisible();

      // Check table is displayed
      await expect(page.getByRole('table')).toBeVisible();
    });

    test('should display tokens in table format', async ({ page }) => {
      await page.getByRole('tab', { name: /List View/ }).click();

      // Check table headers
      await expect(page.getByRole('columnheader', { name: /Name/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Symbol/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Network/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Supply/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Features/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Status/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Actions/ })).toBeVisible();
    });

    test('should display token data in table rows', async ({ page }) => {
      await page.getByRole('tab', { name: /List View/ }).click();

      // Check first token row
      const firstRow = page.getByRole('row').nth(1); // Skip header row
      await expect(firstRow.getByText('Test Token One')).toBeVisible();
      await expect(firstRow.getByText('TTO')).toBeVisible();
    });

    test('should have action buttons in table rows', async ({ page }) => {
      await page.getByRole('tab', { name: /List View/ }).click();

      const firstRow = page.getByRole('row').nth(1);

      // Check action buttons
      await expect(firstRow.getByRole('button').first()).toBeVisible(); // View button
      await expect(firstRow.getByRole('button').nth(1)).toBeVisible(); // Manage button
    });
  });

  test.describe('Search and Filtering', () => {
    test('should filter tokens by search term', async ({ page }) => {
      const searchInput = page.getByRole('searchbox');

      // Search for "XSC"
      await searchInput.fill('XSC');

      // Should show only XSC token
      await expect(page.getByText('XSC Test Token')).toBeVisible();
      await expect(page.getByText('Test Token One')).not.toBeVisible();
      await expect(page.getByText('BSC Token')).not.toBeVisible();
    });

    test('should filter tokens by symbol', async ({ page }) => {
      const searchInput = page.getByRole('searchbox');

      // Search for "TTO" (symbol)
      await searchInput.fill('TTO');

      // Should show only Test Token One
      await expect(page.getByText('Test Token One')).toBeVisible();
      await expect(page.getByText('XSC Test Token')).not.toBeVisible();
      await expect(page.getByText('BSC Token')).not.toBeVisible();
    });

    test('should handle empty search results', async ({ page }) => {
      const searchInput = page.getByRole('searchbox');

      // Search for non-existent token
      await searchInput.fill('NonExistentToken');

      // Should show no tokens found message
      await expect(page.getByText('No tokens found')).toBeVisible();
      await expect(page.getByText('No tokens match your current filters')).toBeVisible();
    });

    test('should filter by network', async ({ page }) => {
      // Open network filter dropdown
      const filterButton = page.getByRole('button', { name: /All Networks/ });
      await filterButton.click();

      // Select Ethereum
      await page.getByText('Ethereum').click();

      // Should show only Ethereum tokens
      await expect(page.getByText('Test Token One')).toBeVisible();
      await expect(page.getByText('XSC Test Token')).not.toBeVisible();
      await expect(page.getByText('BSC Token')).not.toBeVisible();

      // Filter button should update
      await expect(page.getByRole('button', { name: /Ethereum/ })).toBeVisible();
    });

    test('should clear filters correctly', async ({ page }) => {
      // Apply search filter
      await page.getByRole('searchbox').fill('XSC');
      await expect(page.getByText('Test Token One')).not.toBeVisible();

      // Clear search
      await page.getByRole('searchbox').clear();

      // All tokens should be visible again
      await expect(page.getByText('Test Token One')).toBeVisible();
      await expect(page.getByText('XSC Test Token')).toBeVisible();
      await expect(page.getByText('BSC Token')).toBeVisible();
    });
  });

  test.describe('Token Operations', () => {
    test('should open token details modal', async ({ page }) => {
      const tokenCard = page.locator('text=Test Token One').locator('..');
      const detailsButton = tokenCard.getByRole('button', { name: /Details/ });

      await detailsButton.click();

      // Should open details modal
      await expect(page.getByText('Test Token One Details')).toBeVisible();
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('should navigate to manage token page', async ({ page }) => {
      const tokenCard = page.locator('text=Test Token One').locator('..');
      const manageButton = tokenCard.getByRole('button', { name: /Manage/ });

      await manageButton.click();

      // Should navigate to manage page
      await expect(page).toHaveURL(/\/manage-token\/token-1/);
    });

    test('should copy contract address', async ({ page }) => {
      // Mock clipboard API
      await page.evaluate(() => {
        (navigator.clipboard as any) = {
          writeText: async (text: string) => {
            (window as any).clipboardText = text;
          }
        };
      });

      const tokenCard = page.locator('text=Test Token One').locator('..');
      const actionsButton = tokenCard.getByRole('button').first();

      await actionsButton.click();
      await page.getByText('Copy Address').click();

      // Check clipboard was called with correct address
      const clipboardText = await page.evaluate(() => (window as any).clipboardText);
      expect(clipboardText).toBe('0x1234567890123456789012345678901234567890');
    });

    test('should open external explorer link', async ({ page }) => {
      // Listen for popup windows
      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        (async () => {
          const tokenCard = page.locator('text=Test Token One').locator('..');
          const actionsButton = tokenCard.getByRole('button').first();
          await actionsButton.click();
          await page.getByText('View on Explorer').click();
        })()
      ]);

      // Check popup URL
      expect(popup.url()).toContain('etherscan.io');
      await popup.close();
    });

    test('should handle token removal with confirmation', async ({ page }) => {
      const tokenCard = page.locator('text=Test Token One').locator('..');
      const actionsButton = tokenCard.getByRole('button').first();

      await actionsButton.click();
      await page.getByText('Remove').click();

      // Should show confirmation dialog
      await expect(page.getByText('Remove Token')).toBeVisible();
      await expect(page.getByText('Are you sure you want to remove')).toBeVisible();

      // Cancel removal
      await page.getByRole('button', { name: /Cancel/ }).click();
      await expect(page.getByText('Test Token One')).toBeVisible();

      // Try removal again and confirm
      await actionsButton.click();
      await page.getByText('Remove').click();
      await page.getByRole('button', { name: /Remove/ }).click();

      // Token should be removed from view
      await expect(page.getByText('Test Token One')).not.toBeVisible();
    });
  });

  test.describe('Analytics Tab', () => {
    test('should switch to analytics view', async ({ page }) => {
      await page.getByRole('tab', { name: /Analytics/ }).click();
      await expect(page.getByRole('tab', { name: /Analytics/, selected: true })).toBeVisible();

      // Should show analytics content
      await expect(page.getByText('Loading analytics...')).toBeVisible();
    });

    test('should display portfolio analytics', async ({ page }) => {
      await page.getByRole('tab', { name: /Analytics/ }).click();

      // Wait for analytics to load (mocked)
      await page.waitForTimeout(2000);

      // Check for typical analytics elements
      await expect(page.locator('[data-testid="analytics-chart"]')).toBeVisible();
    });
  });

  test.describe('Transactions Tab', () => {
    test('should switch to transactions view', async ({ page }) => {
      await page.getByRole('tab', { name: /Transactions/ }).click();
      await expect(page.getByRole('tab', { name: /Transactions/, selected: true })).toBeVisible();

      // Should show transaction history
      await expect(page.getByText('Loading transaction history...')).toBeVisible();
    });

    test('should display transaction history table', async ({ page }) => {
      await page.getByRole('tab', { name: /Transactions/ }).click();

      // Wait for transactions to load
      await page.waitForTimeout(2000);

      // Check for transaction table
      await expect(page.locator('[data-testid="transaction-history"]')).toBeVisible();
    });
  });

  test.describe('Header Actions', () => {
    test('should have create new token button', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /Create Token/ });
      await expect(createButton).toBeVisible();

      await createButton.click();
      await expect(page).toHaveURL('/create-token');
    });

    test('should have refresh button', async ({ page }) => {
      const refreshButton = page.getByRole('button', { name: /Refresh/ });
      await expect(refreshButton).toBeVisible();

      await refreshButton.click();

      // Should show toast notification
      await expect(page.getByText('Refreshed')).toBeVisible();
    });

    test('should have export functionality', async ({ page }) => {
      // Mock download functionality
      await page.evaluate(() => {
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName: string) {
          const element = originalCreateElement.call(this, tagName);
          if (tagName === 'a') {
            element.click = () => {
              (window as any).downloadTriggered = element.href;
            };
          }
          return element;
        };
      });

      const exportButton = page.getByRole('button', { name: /Export/ });
      await exportButton.click();

      // Should trigger download
      const downloadUrl = await page.evaluate(() => (window as any).downloadTriggered);
      expect(downloadUrl).toContain('blob:');

      // Should show toast notification
      await expect(page.getByText('Data Exported')).toBeVisible();
    });
  });

  test.describe('Empty State', () => {
    test.beforeEach(async ({ page }) => {
      await setupMockWallet(page);
      await setupMockTokenStore(page, []); // Empty token list
      await page.goto(`${BASE_URL}/my-tokens`);
      await waitForHydration(page);
    });

    test('should display empty state when no tokens exist', async ({ page }) => {
      await expect(page.getByText('No tokens found')).toBeVisible();
      await expect(page.getByText("You haven't created any tokens yet")).toBeVisible();
      await expect(page.getByRole('button', { name: /Create Your First Token/ })).toBeVisible();
    });

    test('should navigate to create token from empty state', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /Create Your First Token/ });
      await createButton.click();

      await expect(page).toHaveURL('/create-token');
    });
  });

  test.describe('Mobile Experience', () => {
    test.use({ viewport: MOBILE_VIEWPORT });

    test('should adapt layout for mobile', async ({ page }) => {
      // Check mobile-responsive portfolio summary
      const summaryCards = page.locator('[data-testid="portfolio-summary"] > div');
      await expect(summaryCards.first()).toBeVisible();

      // Should stack cards vertically on mobile
      const firstCardBox = await summaryCards.first().boundingBox();
      const secondCardBox = await summaryCards.nth(1).boundingBox();

      if (firstCardBox && secondCardBox) {
        expect(firstCardBox.y).toBeLessThan(secondCardBox.y); // Vertically stacked
      }
    });

    test('should have mobile-friendly search and filters', async ({ page }) => {
      const searchInput = page.getByRole('searchbox');
      const filterButton = page.getByRole('button', { name: /All Networks/ });

      // Should be accessible on mobile
      await expect(searchInput).toBeVisible();
      await expect(filterButton).toBeVisible();

      // Should have appropriate touch targets
      const searchBox = await searchInput.boundingBox();
      const filterBox = await filterButton.boundingBox();

      expect(searchBox?.height).toBeGreaterThanOrEqual(44);
      expect(filterBox?.height).toBeGreaterThanOrEqual(44);
    });

    test('should adapt token cards for mobile', async ({ page }) => {
      const tokenCards = page.locator('[data-testid="token-card"]');

      // Cards should stack vertically and use full width
      for (let i = 0; i < await tokenCards.count(); i++) {
        const card = tokenCards.nth(i);
        const box = await card.boundingBox();

        if (box) {
          expect(box.width).toBeGreaterThan(MOBILE_VIEWPORT.width * 0.8); // Near full width
        }
      }
    });

    test('should handle mobile touch interactions', async ({ page }) => {
      const tokenCard = page.locator('text=Test Token One').locator('..');
      const actionsButton = tokenCard.getByRole('button').first();

      // Tap interaction
      await actionsButton.tap();
      await expect(page.getByText('View Details')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load dashboard within performance budget', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/my-tokens`);
      await waitForHydration(page);
      const loadTime = Date.now() - startTime;

      // Should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });

    test('should handle large token lists efficiently', async ({ page }) => {
      // Create large mock dataset
      const largeTokenList = Array.from({ length: 100 }, (_, i) => ({
        ...MOCK_TOKENS[0],
        id: `token-${i}`,
        name: `Token ${i}`,
        symbol: `TK${i}`
      }));

      await setupMockTokenStore(page, largeTokenList);
      await page.reload();
      await waitForHydration(page);

      // Should still load within reasonable time
      await expect(page.getByText('Token 50')).toBeVisible({ timeout: 5000 });
    });

    test('should lazy load analytics and transaction tabs', async ({ page }) => {
      // Analytics should not load until tab is clicked
      await expect(page.getByText('Loading analytics...')).not.toBeVisible();

      await page.getByRole('tab', { name: /Analytics/ }).click();
      await expect(page.getByText('Loading analytics...')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Tab through main elements
      await page.keyboard.press('Tab'); // Search input
      await expect(page.getByRole('searchbox')).toBeFocused();

      await page.keyboard.press('Tab'); // Filter button
      await expect(page.getByRole('button', { name: /All Networks/ })).toBeFocused();

      await page.keyboard.press('Tab'); // First action button
      await expect(page.getByRole('button', { name: /Refresh/ })).toBeFocused();
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check search has proper label
      await expect(page.getByRole('searchbox')).toHaveAttribute('aria-label');

      // Check tabs have proper roles
      await expect(page.getByRole('tablist')).toBeVisible();
      await expect(page.getByRole('tab', { name: /Grid View/ })).toHaveAttribute('aria-selected');

      // Check table has proper structure
      await page.getByRole('tab', { name: /List View/ }).click();
      await expect(page.getByRole('table')).toBeVisible();
      await expect(page.getByRole('columnheader')).toHaveCount(7);
    });

    test('should announce state changes to screen readers', async ({ page }) => {
      // Check live regions exist
      await expect(page.locator('[aria-live="polite"]')).toBeVisible();

      // Perform search and check announcement
      await page.getByRole('searchbox').fill('XSC');

      // Should announce filtered results
      await expect(page.getByText('Showing 1 token')).toBeVisible();
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // This would typically require specialized accessibility testing tools
      // Here we check for basic text visibility
      const textElements = page.locator('text=Test Token One, text=Active, text=150');

      for (const element of await textElements.all()) {
        await expect(element).toBeVisible();

        // Check element has sufficient contrast (simplified test)
        const styles = await element.evaluate((el) => {
          const computed = getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor
          };
        });

        // Basic check that text has color (not transparent)
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle wallet disconnection', async ({ page }) => {
      // Remove wallet after page load
      await page.evaluate(() => {
        delete (window as any).ethereum;
      });

      await page.reload();
      await waitForHydration(page);

      // Should show connection required message
      await expect(page.getByText('Wallet Connection Required')).toBeVisible();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/*', route => route.abort());

      // Try to refresh
      const refreshButton = page.getByRole('button', { name: /Refresh/ });
      await refreshButton.click();

      // Should handle error gracefully
      await expect(page.getByText(/Loading Error/)).toBeVisible();
    });

    test('should handle token operation failures', async ({ page }) => {
      // Mock operation failure
      await page.evaluate(() => {
        (window as any).mockTokenStore.removeConfiguration = () => {
          throw new Error('Operation failed');
        };
      });

      const tokenCard = page.locator('text=Test Token One').locator('..');
      const actionsButton = tokenCard.getByRole('button').first();

      await actionsButton.click();
      await page.getByText('Remove').click();
      await page.getByRole('button', { name: /Remove/ }).click();

      // Should show error message
      await expect(page.getByText(/Operation failed/)).toBeVisible();
    });
  });

  test.describe('Real-time Updates', () => {
    test('should update token data in real-time', async ({ page }) => {
      // Mock real-time update
      await page.evaluate(() => {
        setTimeout(() => {
          const mockStore = (window as any).mockTokenStore;
          if (mockStore.configurations[0]) {
            mockStore.configurations[0].holders = 200; // Update holder count
          }
        }, 2000);
      });

      // Check initial value
      await expect(page.getByText('150')).toBeVisible();

      // Wait for update
      await page.waitForTimeout(3000);

      // Check updated value
      await expect(page.getByText('200')).toBeVisible();
    });

    test('should handle transaction status updates', async ({ page }) => {
      await page.getByRole('tab', { name: /Transactions/ }).click();

      // Mock transaction update
      await page.evaluate(() => {
        setTimeout(() => {
          const event = new CustomEvent('transactionUpdate', {
            detail: { status: 'confirmed', hash: '0xabc123' }
          });
          document.dispatchEvent(event);
        }, 1000);
      });

      // Should see transaction status update
      await expect(page.getByText('confirmed')).toBeVisible();
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
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    }
  ]
};

// Export for window access in Playwright MCP
if (typeof window !== 'undefined') {
  (window as any).myTokensPageTests = {
    MOCK_TOKENS,
    setupMockWallet,
    setupMockTokenStore,
    waitForHydration
  };
}