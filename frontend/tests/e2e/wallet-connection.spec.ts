/**
 * Wallet Connection E2E Tests - Playwright MCP
 *
 * Comprehensive testing for wallet connection functionality across all supported networks.
 * Tests wallet integration, network switching, connection states, error handling,
 * and multi-chain compatibility with focus on XSC network support.
 *
 * Features Tested:
 * - Multi-wallet support (MetaMask, WalletConnect, Coinbase)
 * - Network switching and validation (ETH, BSC, XSC)
 * - Connection state management and persistence
 * - Error handling and recovery
 * - XSC network pre-Shanghai EVM compatibility
 * - Gas estimation and transaction preparation
 * - Wallet security and permission handling
 *
 * @author Claude Code - E2E Wallet Testing
 * @created 2025-09-26
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Network configurations for testing
const SUPPORTED_NETWORKS = {
  ETHEREUM: { chainId: 1, name: 'Ethereum', rpc: 'https://eth-mainnet.alchemyapi.io' },
  BSC: { chainId: 56, name: 'Binance Smart Chain', rpc: 'https://bsc-dataseed1.binance.org' },
  XSC: { chainId: 520, name: 'XSC Network', rpc: 'https://rpc.xsc.pub' },
  SEPOLIA: { chainId: 11155111, name: 'Sepolia', rpc: 'https://sepolia.infura.io' },
  BSC_TESTNET: { chainId: 97, name: 'BSC Testnet', rpc: 'https://data-seed-prebsc-1-s1.binance.org' },
  XSC_TESTNET: { chainId: 199291, name: 'XSC Testnet', rpc: 'https://testnet-rpc.xsc.pub' }
};

// Mock wallet implementations
const mockWalletProviders = {
  metamask: {
    isMetaMask: true,
    _metamask: { isUnlocked: async () => true },
    request: async ({ method, params }: { method: string; params?: any[] }) => {
      switch (method) {
        case 'eth_requestAccounts':
          return ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'];
        case 'eth_accounts':
          return ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'];
        case 'eth_chainId':
          return '0x208'; // XSC Network default
        case 'eth_getBalance':
          return '0xDE0B6B3A7640000'; // 1 ETH
        case 'wallet_switchEthereumChain':
          return null;
        case 'wallet_addEthereumChain':
          return null;
        case 'personal_sign':
          return '0xmockedsignature';
        case 'eth_sendTransaction':
          return '0xmockedtxhash';
        case 'eth_getTransactionReceipt':
          return { status: '0x1', blockNumber: '0x1' };
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    }
  },
  coinbase: {
    isCoinbaseWallet: true,
    request: async ({ method }: { method: string }) => {
      switch (method) {
        case 'eth_requestAccounts':
          return ['0x742d35Cc6634C0532925a3b8D68aB32B8c1c9D1e'];
        case 'eth_chainId':
          return '0x1'; // Ethereum default
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    }
  }
};

// Test utilities
const setupWalletMock = async (page: any, walletType: keyof typeof mockWalletProviders) => {
  await page.addInitScript((walletMock) => {
    (window as any).ethereum = walletMock;
  }, mockWalletProviders[walletType]);
};

const waitForWalletConnection = async (page: any) => {
  await page.waitForFunction(() => {
    return window.ethereum && document.readyState === 'complete';
  });
  await page.waitForTimeout(1000);
};

const checkNetworkDisplay = async (page: any, networkName: string) => {
  await expect(page.getByText(networkName)).toBeVisible();
  await expect(page.locator('[data-testid="network-indicator"]')).toContainText(networkName);
};

test.describe('Wallet Connection', () => {
  test.beforeEach(async ({ page }) => {
    await setupWalletMock(page, 'metamask');
    await page.goto(BASE_URL);
    await waitForWalletConnection(page);
  });

  test.describe('Basic Connection Flow', () => {
    test('should display wallet connection button when disconnected', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Connect Wallet/i })).toBeVisible();
      await expect(page.getByText(/Wallet not connected/i)).toBeVisible();
    });

    test('should connect wallet successfully', async ({ page }) => {
      const connectButton = page.getByRole('button', { name: /Connect Wallet/i });
      await connectButton.click();

      // Should show wallet selection modal
      await expect(page.getByText(/Select Wallet/i)).toBeVisible();

      // Select MetaMask
      await page.getByRole('button', { name: /MetaMask/i }).click();

      // Should connect and show account info
      await expect(page.getByText(/0xd8dA...6045/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/Connected/i)).toBeVisible();
    });

    test('should show wallet balance after connection', async ({ page }) => {
      // Connect wallet
      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();

      // Should display balance
      await expect(page.getByText(/Balance:/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/1.0 XSC/i)).toBeVisible();
    });

    test('should persist connection state across page reloads', async ({ page }) => {
      // Connect wallet
      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();
      await expect(page.getByText(/Connected/i)).toBeVisible();

      // Reload page
      await page.reload();
      await waitForWalletConnection(page);

      // Should remain connected
      await expect(page.getByText(/Connected/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/0xd8dA...6045/i)).toBeVisible();
    });

    test('should allow disconnecting wallet', async ({ page }) => {
      // Connect first
      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();
      await expect(page.getByText(/Connected/i)).toBeVisible();

      // Disconnect
      await page.getByRole('button', { name: /Account Menu/i }).click();
      await page.getByRole('button', { name: /Disconnect/i }).click();

      // Should show disconnected state
      await expect(page.getByRole('button', { name: /Connect Wallet/i })).toBeVisible();
      await expect(page.getByText(/Wallet not connected/i)).toBeVisible();
    });
  });

  test.describe('Multi-Wallet Support', () => {
    test('should support MetaMask connection', async ({ page }) => {
      await setupWalletMock(page, 'metamask');
      await page.reload();
      await waitForWalletConnection(page);

      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();

      await expect(page.getByText(/MetaMask/i)).toBeVisible();
      await expect(page.getByText(/Connected/i)).toBeVisible();
    });

    test('should support Coinbase Wallet connection', async ({ page }) => {
      await setupWalletMock(page, 'coinbase');
      await page.reload();
      await waitForWalletConnection(page);

      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /Coinbase/i }).click();

      await expect(page.getByText(/Coinbase/i)).toBeVisible();
      await expect(page.getByText(/Connected/i)).toBeVisible();
    });

    test('should handle wallet installation prompts', async ({ page }) => {
      // Remove wallet from window
      await page.addInitScript(() => {
        delete (window as any).ethereum;
      });
      await page.reload();
      await waitForWalletConnection(page);

      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();

      // Should show installation prompt
      await expect(page.getByText(/Install MetaMask/i)).toBeVisible();
      await expect(page.getByRole('link', { name: /Download/i })).toBeVisible();
    });

    test('should prioritize available wallets', async ({ page }) => {
      await page.getByRole('button', { name: /Connect Wallet/i }).click();

      // MetaMask should be available and highlighted
      const metamaskButton = page.getByRole('button', { name: /MetaMask/i });
      await expect(metamaskButton).toBeVisible();
      await expect(metamaskButton).toBeEnabled();

      // Should show "Recommended" or "Available" badge
      await expect(page.locator('[data-wallet="metamask"]').getByText(/Available/i)).toBeVisible();
    });
  });

  test.describe('Network Management', () => {
    test.beforeEach(async ({ page }) => {
      // Connect wallet first
      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();
      await expect(page.getByText(/Connected/i)).toBeVisible();
    });

    test('should display current network', async ({ page }) => {
      await checkNetworkDisplay(page, 'XSC Network');
    });

    test('should open network selector', async ({ page }) => {
      await page.getByRole('button', { name: /XSC Network/i }).click();

      // Should show network selection modal
      await expect(page.getByText(/Select Network/i)).toBeVisible();
      await expect(page.getByText(/Ethereum/i)).toBeVisible();
      await expect(page.getByText(/Binance Smart Chain/i)).toBeVisible();
      await expect(page.getByText(/XSC Network/i)).toBeVisible();
    });

    test('should switch to Ethereum network', async ({ page }) => {
      await page.getByRole('button', { name: /Network/i }).click();
      await page.getByRole('button', { name: /Ethereum/i }).click();

      // Mock network switch
      await page.addInitScript(() => {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'wallet_switchEthereumChain') {
            return null; // Success
          }
          if (method === 'eth_chainId') {
            return '0x1'; // Ethereum
          }
          return '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
        };
      });

      // Should show loading state
      await expect(page.getByText(/Switching Network/i)).toBeVisible();

      // Should update to Ethereum
      await checkNetworkDisplay(page, 'Ethereum');
    });

    test('should switch to BSC network', async ({ page }) => {
      await page.getByRole('button', { name: /Network/i }).click();
      await page.getByRole('button', { name: /Binance Smart Chain/i }).click();

      // Should switch successfully
      await checkNetworkDisplay(page, 'Binance Smart Chain');
    });

    test('should handle network switching errors', async ({ page }) => {
      // Mock network switch failure
      await page.addInitScript(() => {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'wallet_switchEthereumChain') {
            throw new Error('User rejected the request');
          }
          return '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
        };
      });

      await page.getByRole('button', { name: /Network/i }).click();
      await page.getByRole('button', { name: /Ethereum/i }).click();

      // Should show error message
      await expect(page.getByText(/Network switch failed/i)).toBeVisible();
      await expect(page.getByText(/User rejected/i)).toBeVisible();
    });

    test('should add XSC network if not present', async ({ page }) => {
      // Mock network addition needed
      await page.addInitScript(() => {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'wallet_switchEthereumChain') {
            throw { code: 4902 }; // Network not added
          }
          if (method === 'wallet_addEthereumChain') {
            return null; // Success
          }
          return '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
        };
      });

      await page.getByRole('button', { name: /Network/i }).click();
      await page.getByRole('button', { name: /XSC Network/i }).click();

      // Should show adding network dialog
      await expect(page.getByText(/Adding XSC Network/i)).toBeVisible();
      await expect(page.getByText(/Please approve/i)).toBeVisible();
    });
  });

  test.describe('XSC Network Specific Features', () => {
    test.beforeEach(async ({ page }) => {
      // Connect to XSC network
      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();
      await expect(page.getByText(/Connected/i)).toBeVisible();
      await checkNetworkDisplay(page, 'XSC Network');
    });

    test('should display XSC network benefits', async ({ page }) => {
      await page.getByRole('button', { name: /Network Info/i }).click();

      await expect(page.getByText(/XSC Network Benefits/i)).toBeVisible();
      await expect(page.getByText(/Lower gas costs/i)).toBeVisible();
      await expect(page.getByText(/Faster transactions/i)).toBeVisible();
      await expect(page.getByText(/Shanghai EVM compatibility/i)).toBeVisible();
    });

    test('should show XSC-optimized gas estimates', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);

      // Fill basic token info
      await page.getByLabel(/Token name/i).fill('XSC Test Token');
      await page.getByLabel(/Token symbol/i).fill('XSC');
      await page.getByLabel(/Total supply/i).fill('1000000');

      // Navigate to cost estimation
      await page.getByRole('button', { name: /Next/i }).click(); // Advanced Features
      await page.getByRole('button', { name: /Next/i }).click(); // Permissions
      await page.getByRole('button', { name: /Next/i }).click(); // Network Selection
      await page.getByRole('button', { name: /XSC Network/i }).click(); // Select XSC
      await page.getByRole('button', { name: /Next/i }).click(); // Review

      // Should show XSC-optimized gas costs
      await expect(page.getByText(/Estimated Gas Cost/i)).toBeVisible();
      await expect(page.getByText(/~0.0001 XSC/i)).toBeVisible(); // Lower than ETH
      await expect(page.getByText(/XSC Network: Lower fees/i)).toBeVisible();
    });

    test('should validate XSC transaction limits', async ({ page }) => {
      // Mock XSC-specific validation
      await page.addInitScript(() => {
        (window as any).xscValidation = {
          maxGasLimit: 30000000,
          maxContractSize: 24576
        };
      });

      await page.goto(`${BASE_URL}/create-token`);

      // Should enforce XSC limits
      await expect(page.getByText(/XSC Network Limits/i)).toBeVisible();
      await expect(page.getByText(/Gas Limit: 30M/i)).toBeVisible();
    });

    test('should handle XSC pre-Shanghai compatibility', async ({ page }) => {
      await page.goto(`${BASE_URL}/create-token`);

      // Should show compatibility notice
      await expect(page.getByText(/XSC Compatibility/i)).toBeVisible();
      await expect(page.getByText(/Pre-Shanghai EVM/i)).toBeVisible();
      await expect(page.getByText(/Solidity 0.8.19/i)).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle user rejection during connection', async ({ page }) => {
      // Mock user rejection
      await page.addInitScript(() => {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'eth_requestAccounts') {
            throw new Error('User rejected the request');
          }
          return [];
        };
      });

      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();

      // Should show error message
      await expect(page.getByText(/Connection failed/i)).toBeVisible();
      await expect(page.getByText(/User rejected/i)).toBeVisible();

      // Should allow retry
      await expect(page.getByRole('button', { name: /Try Again/i })).toBeVisible();
    });

    test('should handle wallet lock state', async ({ page }) => {
      // Mock locked wallet
      await page.addInitScript(() => {
        (window as any).ethereum._metamask = { isUnlocked: async () => false };
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'eth_accounts') {
            return []; // No accounts when locked
          }
          throw new Error('Wallet is locked');
        };
      });

      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();

      // Should show unlock prompt
      await expect(page.getByText(/Wallet is locked/i)).toBeVisible();
      await expect(page.getByText(/Please unlock MetaMask/i)).toBeVisible();
    });

    test('should handle network connection errors', async ({ page }) => {
      // Connect wallet first
      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();
      await expect(page.getByText(/Connected/i)).toBeVisible();

      // Mock RPC error
      await page.addInitScript(() => {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'eth_getBalance') {
            throw new Error('Network error');
          }
          return '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
        };
      });

      await page.reload();
      await waitForWalletConnection(page);

      // Should show network error
      await expect(page.getByText(/Network connection failed/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Retry Connection/i })).toBeVisible();
    });

    test('should handle unsupported network gracefully', async ({ page }) => {
      // Mock unsupported network
      await page.addInitScript(() => {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'eth_chainId') {
            return '0x89'; // Polygon (unsupported)
          }
          return '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
        };
      });

      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();

      // Should show unsupported network warning
      await expect(page.getByText(/Unsupported network/i)).toBeVisible();
      await expect(page.getByText(/Please switch to a supported network/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Switch Network/i })).toBeVisible();
    });
  });

  test.describe('Connection State Persistence', () => {
    test('should maintain connection across navigation', async ({ page }) => {
      // Connect wallet
      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();
      await expect(page.getByText(/Connected/i)).toBeVisible();

      // Navigate to create token page
      await page.goto(`${BASE_URL}/create-token`);
      await waitForWalletConnection(page);

      // Should remain connected
      await expect(page.getByText(/Connected/i)).toBeVisible();
      await expect(page.getByText(/0xd8dA...6045/i)).toBeVisible();

      // Navigate to my tokens page
      await page.goto(`${BASE_URL}/my-tokens`);
      await waitForWalletConnection(page);

      // Should still be connected
      await expect(page.getByText(/Connected/i)).toBeVisible();
    });

    test('should restore connection state after browser restart simulation', async ({ page }) => {
      // Connect wallet
      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();
      await expect(page.getByText(/Connected/i)).toBeVisible();

      // Simulate browser restart by clearing all storage and reloading
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      await page.reload();
      await waitForWalletConnection(page);

      // Should attempt to restore connection
      await expect(page.getByText(/Restoring connection/i)).toBeVisible({ timeout: 5000 });

      // Should eventually show connected state or connect button
      const isRestored = await page.getByText(/Connected/i).isVisible({ timeout: 3000 }).catch(() => false);
      if (!isRestored) {
        await expect(page.getByRole('button', { name: /Connect Wallet/i })).toBeVisible();
      }
    });
  });

  test.describe('Security Features', () => {
    test('should validate wallet signatures', async ({ page }) => {
      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();
      await expect(page.getByText(/Connected/i)).toBeVisible();

      // Navigate to a page requiring signature
      await page.goto(`${BASE_URL}/my-tokens`);

      // Should request signature for authentication
      await expect(page.getByText(/Sign message to continue/i)).toBeVisible();
      await page.getByRole('button', { name: /Sign Message/i }).click();

      // Should proceed after signature
      await expect(page.getByText(/Signature verified/i)).toBeVisible();
    });

    test('should handle signature rejection', async ({ page }) => {
      // Mock signature rejection
      await page.addInitScript(() => {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'personal_sign') {
            throw new Error('User rejected the request');
          }
          if (method === 'eth_requestAccounts') {
            return ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'];
          }
          return null;
        };
      });

      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();
      await expect(page.getByText(/Connected/i)).toBeVisible();

      await page.goto(`${BASE_URL}/my-tokens`);
      await page.getByRole('button', { name: /Sign Message/i }).click();

      // Should show rejection error
      await expect(page.getByText(/Signature rejected/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Try Again/i })).toBeVisible();
    });

    test('should validate contract interactions', async ({ page }) => {
      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();
      await expect(page.getByText(/Connected/i)).toBeVisible();

      await page.goto(`${BASE_URL}/create-token`);

      // Fill form and proceed to deployment
      await page.getByLabel(/Token name/i).fill('Test Token');
      await page.getByLabel(/Token symbol/i).fill('TEST');
      await page.getByLabel(/Total supply/i).fill('1000000');

      // Navigate through steps (simplified)
      for (let i = 0; i < 5; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        await page.waitForTimeout(500);
      }

      // Should validate transaction before sending
      await expect(page.getByText(/Transaction Validation/i)).toBeVisible();
      await expect(page.getByText(/Gas Estimate:/i)).toBeVisible();
      await expect(page.getByText(/Contract Address:/i)).toBeVisible();
    });
  });
});

// Export test configuration
export const walletConnectionConfig = {
  testId: 'wallet-connection',
  networks: SUPPORTED_NETWORKS,
  mockWallets: mockWalletProviders,
  testTimeout: 30000,
  retries: 2
};

// Export for window access in Playwright MCP
if (typeof window !== 'undefined') {
  (window as any).walletConnectionTests = {
    SUPPORTED_NETWORKS,
    mockWalletProviders,
    setupWalletMock,
    waitForWalletConnection,
    checkNetworkDisplay
  };
}