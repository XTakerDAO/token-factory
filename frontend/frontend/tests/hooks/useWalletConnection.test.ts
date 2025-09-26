import { test, expect, describe, beforeEach, afterEach } from '@playwright/test';
import { Page } from '@playwright/test';

/**
 * Wallet Connection Hook Tests
 * 
 * Testing strategy:
 * 1. Mock MetaMask extension presence
 * 2. Test connection states and transitions
 * 3. Test network switching functionality
 * 4. Test error handling scenarios
 * 5. Test XSC network specific behavior
 */

describe('useWalletConnection Hook', () => {
  let page: Page;

  beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Mock MetaMask provider before navigation
    await page.addInitScript(() => {
      // Mock Ethereum provider
      (window as any).ethereum = {
        isMetaMask: true,
        chainId: '0x1', // Ethereum mainnet by default
        selectedAddress: null,
        request: async (params: { method: string; params?: any[] }) => {
          switch (params.method) {
            case 'eth_requestAccounts':
              return ['0x742d35Cc6e1e8E7eD5c987A7eF8D8E8b9b3C0123'];
            case 'wallet_switchEthereumChain':
              return null;
            case 'wallet_addEthereumChain':
              return null;
            case 'eth_chainId':
              return '0x1';
            default:
              throw new Error(`Unknown method: ${params.method}`);
          }
        },
        on: (event: string, handler: Function) => {},
        removeListener: (event: string, handler: Function) => {},
      };
    });

    // Navigate to test app with wallet connection component
    await page.goto('/test-wallet-connection');
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Initial State', () => {
    test('should display disconnected state initially', async () => {
      await expect(page.getByTestId('wallet-status')).toHaveText('Disconnected');
      await expect(page.getByTestId('connect-button')).toBeVisible();
      await expect(page.getByTestId('wallet-address')).not.toBeVisible();
    });

    test('should detect MetaMask availability', async () => {
      await expect(page.getByTestId('metamask-available')).toHaveText('true');
    });

    test('should show correct initial network state', async () => {
      await expect(page.getByTestId('current-network')).toHaveText('ethereum');
    });
  });

  describe('Connection Flow', () => {
    test('should connect to wallet successfully', async () => {
      await page.getByTestId('connect-button').click();
      
      // Wait for connection state update
      await expect(page.getByTestId('wallet-status')).toHaveText('Connected', { timeout: 5000 });
      await expect(page.getByTestId('wallet-address')).toHaveText('0x742d35Cc6e1e8E7eD5c987A7eF8D8E8b9b3C0123');
      await expect(page.getByTestId('connect-button')).not.toBeVisible();
      await expect(page.getByTestId('disconnect-button')).toBeVisible();
    });

    test('should handle connection rejection', async () => {
      // Mock wallet rejection
      await page.evaluate(() => {
        (window as any).ethereum.request = async (params: any) => {
          if (params.method === 'eth_requestAccounts') {
            throw new Error('User rejected the request');
          }
        };
      });

      await page.getByTestId('connect-button').click();
      
      await expect(page.getByTestId('connection-error')).toHaveText('User rejected the request');
      await expect(page.getByTestId('wallet-status')).toHaveText('Disconnected');
    });

    test('should handle no MetaMask scenario', async () => {
      // Remove MetaMask provider
      await page.evaluate(() => {
        delete (window as any).ethereum;
      });

      await page.reload();
      
      await expect(page.getByTestId('metamask-available')).toHaveText('false');
      await expect(page.getByTestId('install-metamask-prompt')).toBeVisible();
      await expect(page.getByTestId('connect-button')).toBeDisabled();
    });

    test('should disconnect wallet successfully', async () => {
      // First connect
      await page.getByTestId('connect-button').click();
      await expect(page.getByTestId('wallet-status')).toHaveText('Connected');

      // Then disconnect
      await page.getByTestId('disconnect-button').click();
      
      await expect(page.getByTestId('wallet-status')).toHaveText('Disconnected');
      await expect(page.getByTestId('connect-button')).toBeVisible();
      await expect(page.getByTestId('wallet-address')).not.toBeVisible();
    });
  });

  describe('Network Management', () => {
    beforeEach(async () => {
      // Connect wallet first
      await page.getByTestId('connect-button').click();
      await expect(page.getByTestId('wallet-status')).toHaveText('Connected');
    });

    test('should switch to BSC network', async () => {
      await page.getByTestId('network-selector').click();
      await page.getByTestId('network-bsc').click();
      
      await expect(page.getByTestId('current-network')).toHaveText('bsc');
      await expect(page.getByTestId('network-switch-success')).toBeVisible();
    });

    test('should switch to XSC network', async () => {
      await page.getByTestId('network-selector').click();
      await page.getByTestId('network-xsc').click();
      
      await expect(page.getByTestId('current-network')).toHaveText('xsc');
      await expect(page.getByTestId('xsc-network-features')).toBeVisible();
      await expect(page.getByTestId('network-switch-success')).toBeVisible();
    });

    test('should handle network switch rejection', async () => {
      // Mock network switch rejection
      await page.evaluate(() => {
        (window as any).ethereum.request = async (params: any) => {
          if (params.method === 'wallet_switchEthereumChain') {
            throw new Error('User rejected the request');
          }
        };
      });

      await page.getByTestId('network-selector').click();
      await page.getByTestId('network-bsc').click();
      
      await expect(page.getByTestId('network-switch-error')).toHaveText('User rejected the request');
      await expect(page.getByTestId('current-network')).toHaveText('ethereum'); // Should stay on original
    });

    test('should add XSC network if not present', async () => {
      // Mock XSC network not being in wallet
      await page.evaluate(() => {
        (window as any).ethereum.request = async (params: any) => {
          if (params.method === 'wallet_switchEthereumChain' && params.params[0].chainId === '0x1f91') {
            throw { code: 4902 }; // Chain not added error
          }
          if (params.method === 'wallet_addEthereumChain') {
            return null; // Successfully added
          }
        };
      });

      await page.getByTestId('network-selector').click();
      await page.getByTestId('network-xsc').click();
      
      await expect(page.getByTestId('adding-network-modal')).toBeVisible();
      await expect(page.getByTestId('current-network')).toHaveText('xsc');
    });
  });

  describe('Account Change Handling', () => {
    beforeEach(async () => {
      await page.getByTestId('connect-button').click();
      await expect(page.getByTestId('wallet-status')).toHaveText('Connected');
    });

    test('should handle account change event', async () => {
      // Simulate account change
      await page.evaluate(() => {
        const accountChangeHandler = (window as any).accountChangeHandlers[0];
        if (accountChangeHandler) {
          accountChangeHandler(['0x123d35Cc6e1e8E7eD5c987A7eF8D8E8b9b3C9999']);
        }
      });

      await expect(page.getByTestId('wallet-address')).toHaveText('0x123d35Cc6e1e8E7eD5c987A7eF8D8E8b9b3C9999');
    });

    test('should handle account disconnection event', async () => {
      // Simulate account disconnection
      await page.evaluate(() => {
        const accountChangeHandler = (window as any).accountChangeHandlers[0];
        if (accountChangeHandler) {
          accountChangeHandler([]);
        }
      });

      await expect(page.getByTestId('wallet-status')).toHaveText('Disconnected');
      await expect(page.getByTestId('connect-button')).toBeVisible();
    });
  });

  describe('Chain Change Handling', () => {
    beforeEach(async () => {
      await page.getByTestId('connect-button').click();
      await expect(page.getByTestId('wallet-status')).toHaveText('Connected');
    });

    test('should handle chain change to BSC', async () => {
      await page.evaluate(() => {
        const chainChangeHandler = (window as any).chainChangeHandlers[0];
        if (chainChangeHandler) {
          chainChangeHandler('0x38'); // BSC chain ID
        }
      });

      await expect(page.getByTestId('current-network')).toHaveText('bsc');
    });

    test('should handle chain change to XSC', async () => {
      await page.evaluate(() => {
        const chainChangeHandler = (window as any).chainChangeHandlers[0];
        if (chainChangeHandler) {
          chainChangeHandler('0x1f91'); // XSC chain ID
        }
      });

      await expect(page.getByTestId('current-network')).toHaveText('xsc');
      await expect(page.getByTestId('xsc-network-features')).toBeVisible();
    });

    test('should handle unsupported chain', async () => {
      await page.evaluate(() => {
        const chainChangeHandler = (window as any).chainChangeHandlers[0];
        if (chainChangeHandler) {
          chainChangeHandler('0x89'); // Polygon - unsupported
        }
      });

      await expect(page.getByTestId('unsupported-network-warning')).toBeVisible();
      await expect(page.getByTestId('current-network')).toHaveText('unsupported');
    });
  });

  describe('Performance Requirements', () => {
    test('wallet connection should complete within 2 seconds', async () => {
      const startTime = Date.now();
      
      await page.getByTestId('connect-button').click();
      await expect(page.getByTestId('wallet-status')).toHaveText('Connected');
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000);
    });

    test('network switching should complete within 3 seconds', async () => {
      await page.getByTestId('connect-button').click();
      await expect(page.getByTestId('wallet-status')).toHaveText('Connected');
      
      const startTime = Date.now();
      
      await page.getByTestId('network-selector').click();
      await page.getByTestId('network-bsc').click();
      await expect(page.getByTestId('current-network')).toHaveText('bsc');
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(3000);
    });
  });

  describe('Accessibility', () => {
    test('should be keyboard navigable', async () => {
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('connect-button')).toBeFocused();
      
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('wallet-status')).toHaveText('Connected');
    });

    test('should have proper ARIA labels', async () => {
      await expect(page.getByTestId('connect-button')).toHaveAttribute('aria-label', 'Connect wallet');
      await expect(page.getByTestId('network-selector')).toHaveAttribute('aria-label', 'Select network');
    });

    test('should announce status changes to screen readers', async () => {
      await page.getByTestId('connect-button').click();
      
      await expect(page.getByTestId('status-announcement')).toHaveAttribute('aria-live', 'polite');
      await expect(page.getByTestId('status-announcement')).toHaveText('Wallet connected successfully');
    });
  });
});