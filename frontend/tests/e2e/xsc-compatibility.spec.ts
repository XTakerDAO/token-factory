/**
 * XSC Network Compatibility E2E Tests - Playwright MCP
 *
 * Comprehensive testing for XSC Network specific features and compatibility.
 * Tests pre-Shanghai EVM compatibility, XSC-specific optimizations,
 * gas efficiency, transaction handling, and network-specific features.
 *
 * Features Tested:
 * - Pre-Shanghai EVM compatibility verification
 * - XSC Network connection and switching
 * - Gas optimization for XSC transactions
 * - XSC-specific transaction limits and constraints
 * - Network performance and block time handling
 * - XSC native features and benefits
 * - Cross-chain comparison with ETH/BSC
 * - Error handling for XSC-specific issues
 *
 * @author Claude Code - E2E XSC Compatibility Testing
 * @created 2025-09-26
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const XSC_TEST_TIMEOUT = 45000; // 45 seconds for XSC-specific operations

// XSC Network configurations
const XSC_NETWORK_CONFIG = {
  chainId: 520,
  name: 'XSC Network',
  rpcUrl: 'https://rpc.xsc.pub',
  explorerUrl: 'https://explorer.xsc.pub',
  nativeToken: 'XSC',
  blockTime: 2000, // 2 seconds
  gasPrice: 1000000000, // 1 gwei
  maxGasLimit: 30000000,
  evmVersion: 'pre-shanghai',
  solcVersion: '0.8.19'
};

const XSC_TESTNET_CONFIG = {
  chainId: 199291,
  name: 'XSC Testnet',
  rpcUrl: 'https://testnet-rpc.xsc.pub',
  explorerUrl: 'https://testnet-explorer.xsc.pub',
  nativeToken: 'XSC',
  blockTime: 2000,
  gasPrice: 1000000000,
  maxGasLimit: 30000000,
  evmVersion: 'pre-shanghai',
  solcVersion: '0.8.19'
};

// XSC-specific token configurations
const XSC_TOKEN_CONFIGS = {
  optimized: {
    name: 'XSC Optimized Token',
    symbol: 'XSCOPT',
    totalSupply: '1000000',
    decimals: 18,
    xscFeatures: {
      gasOptimized: true,
      fastTransactions: true,
      lowFees: true
    }
  },
  enterprise: {
    name: 'XSC Enterprise Token',
    symbol: 'XSCENT',
    totalSupply: '100000000',
    decimals: 8,
    features: {
      mintable: true,
      burnable: true,
      pausable: true
    },
    xscFeatures: {
      gasOptimized: true,
      fastTransactions: true,
      lowFees: true
    }
  },
  crossChainReady: {
    name: 'Cross Chain Ready Token',
    symbol: 'XCCR',
    totalSupply: '50000000',
    decimals: 18,
    xscFeatures: {
      crossChainCompatible: true,
      bridgeReady: true
    }
  }
};

// Mock XSC wallet with network-specific features
const setupXSCWallet = async (page: any, testnet: boolean = true) => {
  const config = testnet ? XSC_TESTNET_CONFIG : XSC_NETWORK_CONFIG;

  await page.addInitScript((networkConfig) => {
    (window as any).ethereum = {
      isMetaMask: true,
      request: async ({ method, params }: { method: string; params?: any[] }) => {
        switch (method) {
          case 'eth_requestAccounts':
            return ['0xXSC567890123456789012345678901234567890'];
          case 'eth_chainId':
            return `0x${networkConfig.chainId.toString(16)}`;
          case 'eth_getBalance':
            return '0x56BC75E2D630E00000'; // 100 XSC
          case 'eth_gasPrice':
            return `0x${networkConfig.gasPrice.toString(16)}`;
          case 'eth_estimateGas':
            // XSC optimized gas estimates (lower than ETH)
            const baseGas = params?.[0]?.data?.length > 1000 ? 150000 : 80000;
            return `0x${baseGas.toString(16)}`;
          case 'eth_sendTransaction':
            // XSC fast confirmation simulation
            setTimeout(() => {}, 500); // Faster than ETH
            return '0xXSC1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
          case 'eth_getTransactionReceipt':
            return {
              status: '0x1',
              blockNumber: `0x${Math.floor(Date.now() / networkConfig.blockTime).toString(16)}`,
              transactionHash: '0xXSC1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
              contractAddress: '0xXSCcontract1098765432109876543210987654321',
              gasUsed: '0x13880', // Lower gas usage on XSC
              logs: []
            };
          case 'eth_getBlockByNumber':
            return {
              number: `0x${Math.floor(Date.now() / networkConfig.blockTime).toString(16)}`,
              timestamp: `0x${Math.floor(Date.now() / 1000).toString(16)}`,
              gasLimit: `0x${networkConfig.maxGasLimit.toString(16)}`
            };
          case 'wallet_addEthereumChain':
            return null; // XSC network added successfully
          case 'wallet_switchEthereumChain':
            return null; // Switch successful
          case 'net_version':
            return networkConfig.chainId.toString();
          default:
            return null;
        }
      },
      // XSC-specific provider properties
      isXSC: true,
      xscVersion: '1.0.0',
      networkVersion: networkConfig.chainId.toString()
    };
  }, config);
};

const waitForXSCConnection = async (page: any) => {
  await page.waitForFunction(() => {
    return window.ethereum &&
           (window as any).ethereum.isXSC &&
           document.readyState === 'complete';
  });
  await page.waitForTimeout(1000);
};

const verifyXSCNetwork = async (page: any) => {
  await expect(page.getByText(/XSC Network/i)).toBeVisible();
  await expect(page.getByText(/Connected/i)).toBeVisible();
  await expect(page.locator('[data-network-id="520"]')).toBeVisible();
};

const connectToXSC = async (page: any) => {
  await page.getByRole('button', { name: /Connect Wallet/i }).click();
  await page.getByRole('button', { name: /MetaMask/i }).click();
  await expect(page.getByText(/Connected/i)).toBeVisible({ timeout: 10000 });
  await verifyXSCNetwork(page);
};

test.describe('XSC Network Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupXSCWallet(page, true); // Use testnet
    await page.goto(BASE_URL);
    await waitForXSCConnection(page);
  });

  test.describe('XSC Network Detection and Connection', () => {
    test('should detect XSC Network correctly', async ({ page }) => {
      await connectToXSC(page);

      // Should show XSC-specific network information
      await expect(page.getByText(/XSC Testnet/i)).toBeVisible();
      await expect(page.getByText(/Chain ID: 199291/i)).toBeVisible();
      await expect(page.getByText(/100.0 XSC/i)).toBeVisible();
    });

    test('should display XSC Network benefits', async ({ page }) => {
      await connectToXSC(page);

      await page.getByRole('button', { name: /Network Info/i }).click();

      // Should highlight XSC advantages
      await expect(page.getByText(/XSC Network Benefits/i)).toBeVisible();
      await expect(page.getByText(/⚡ 2-second block times/i)).toBeVisible();
      await expect(page.getByText(/💰 Ultra-low gas fees/i)).toBeVisible();
      await expect(page.getByText(/🔧 Pre-Shanghai EVM compatible/i)).toBeVisible();
      await expect(page.getByText(/🚀 Optimized for DeFi applications/i)).toBeVisible();
    });

    test('should handle XSC network switching', async ({ page }) => {
      await connectToXSC(page);

      // Switch to mainnet XSC
      await page.getByRole('button', { name: /Network/i }).click();
      await page.getByRole('button', { name: /XSC Mainnet/i }).click();

      // Should show switching progress
      await expect(page.getByText(/Switching to XSC Mainnet/i)).toBeVisible();

      // Mock successful switch
      await page.addInitScript(() => {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'eth_chainId') {
            return '0x208'; // XSC Mainnet
          }
          return null;
        };
      });

      await expect(page.getByText(/XSC Mainnet/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/Chain ID: 520/i)).toBeVisible();
    });

    test('should add XSC network if not present in wallet', async ({ page }) => {
      // Mock XSC network not present
      await page.addInitScript(() => {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'wallet_switchEthereumChain') {
            throw { code: 4902, message: 'Unrecognized chain ID' };
          }
          if (method === 'wallet_addEthereumChain') {
            return null; // Success
          }
          return '0xXSC567890123456789012345678901234567890';
        };
      });

      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();

      // Should show network addition process
      await expect(page.getByText(/Adding XSC Network/i)).toBeVisible();
      await expect(page.getByText(/Please approve the network addition/i)).toBeVisible();

      // Should eventually connect
      await expect(page.getByText(/Connected/i)).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Pre-Shanghai EVM Compatibility', () => {
    test('should validate EVM version compatibility', async ({ page }) => {
      await connectToXSC(page);
      await page.goto(`${BASE_URL}/create-token`);

      // Should show EVM compatibility information
      await expect(page.getByText(/EVM Compatibility: Pre-Shanghai/i)).toBeVisible();
      await expect(page.getByText(/Solidity Version: 0.8.19 or lower/i)).toBeVisible();
      await expect(page.getByText(/Full Ethereum compatibility/i)).toBeVisible();
    });

    test('should show XSC-specific deployment optimizations', async ({ page }) => {
      await connectToXSC(page);
      await page.goto(`${BASE_URL}/create-token`);

      // Fill token info
      await page.getByLabel(/Token name/i).fill(XSC_TOKEN_CONFIGS.optimized.name);
      await page.getByLabel(/Token symbol/i).fill(XSC_TOKEN_CONFIGS.optimized.symbol);
      await page.getByLabel(/Total supply/i).fill(XSC_TOKEN_CONFIGS.optimized.totalSupply);

      // Navigate to network selection
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        await page.waitForTimeout(300);
      }

      // XSC should already be selected
      await expect(page.getByRole('button', { name: /XSC.*Selected/i })).toBeVisible();

      // Should show XSC optimizations
      await expect(page.getByText(/XSC Network Optimizations/i)).toBeVisible();
      await expect(page.getByText(/Gas-optimized compilation/i)).toBeVisible();
      await expect(page.getByText(/Pre-Shanghai EVM bytecode/i)).toBeVisible();
    });

    test('should handle XSC transaction constraints', async ({ page }) => {
      await connectToXSC(page);
      await page.goto(`${BASE_URL}/create-token`);

      // Fill enterprise token with many features
      await page.getByLabel(/Token name/i).fill(XSC_TOKEN_CONFIGS.enterprise.name);
      await page.getByLabel(/Token symbol/i).fill(XSC_TOKEN_CONFIGS.enterprise.symbol);
      await page.getByLabel(/Total supply/i).fill(XSC_TOKEN_CONFIGS.enterprise.totalSupply);
      await page.getByLabel(/Decimals/i).fill('8');

      await page.getByRole('button', { name: /Next/i }).click();

      // Enable multiple features
      await page.getByLabel(/Mintable/i).check();
      await page.getByLabel(/Burnable/i).check();
      await page.getByLabel(/Pausable/i).check();

      // Should show XSC constraint validation
      await expect(page.getByText(/XSC Transaction Limits/i)).toBeVisible();
      await expect(page.getByText(/Max Gas Limit: 30M units/i)).toBeVisible();
      await expect(page.getByText(/Contract size limit: 24KB/i)).toBeVisible();

      // Gas estimate should be within XSC limits
      await expect(page.getByText(/Estimated Gas: ~150,000 units ✓/i)).toBeVisible();
    });
  });

  test.describe('XSC Gas Optimization', () => {
    test('should show optimized gas estimates for XSC', async ({ page }) => {
      await connectToXSC(page);
      await page.goto(`${BASE_URL}/create-token`);

      // Fill basic token info
      await page.getByLabel(/Token name/i).fill(XSC_TOKEN_CONFIGS.optimized.name);
      await page.getByLabel(/Token symbol/i).fill(XSC_TOKEN_CONFIGS.optimized.symbol);
      await page.getByLabel(/Total supply/i).fill(XSC_TOKEN_CONFIGS.optimized.totalSupply);

      // Navigate through steps
      for (let i = 0; i < 4; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        await page.waitForTimeout(300);
      }

      // Should show XSC-optimized costs
      await expect(page.getByText(/Deployment Cost on XSC/i)).toBeVisible();
      await expect(page.getByText(/Gas Price: 1 gwei/i)).toBeVisible();
      await expect(page.getByText(/Estimated Cost: ~0.00008 XSC/i)).toBeVisible();
      await expect(page.getByText(/🎯 95% cheaper than Ethereum/i)).toBeVisible();
    });

    test('should compare costs across networks with XSC advantage', async ({ page }) => {
      await connectToXSC(page);
      await page.goto(`${BASE_URL}/create-token`);

      // Fill token info and navigate to network selection
      await page.getByLabel(/Token name/i).fill('Cost Comparison Token');
      await page.getByLabel(/Token symbol/i).fill('COST');
      await page.getByLabel(/Total supply/i).fill('1000000');

      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        await page.waitForTimeout(300);
      }

      // Should show cost comparison
      await expect(page.getByText(/Network Cost Comparison/i)).toBeVisible();

      // XSC should be cheapest
      await expect(page.getByText(/XSC Network: ~0.00008 XSC/i)).toBeVisible();
      await expect(page.getByText(/Ethereum: ~0.01 ETH/i)).toBeVisible();
      await expect(page.getByText(/BSC: ~0.001 BNB/i)).toBeVisible();

      // Should highlight XSC savings
      await expect(page.getByText(/💡 Save 99%+ by using XSC Network/i)).toBeVisible();
    });

    test('should optimize gas for complex XSC transactions', async ({ page }) => {
      await connectToXSC(page);
      await page.goto(`${BASE_URL}/create-token`);

      // Create complex token on XSC
      await page.getByLabel(/Token name/i).fill(XSC_TOKEN_CONFIGS.enterprise.name);
      await page.getByLabel(/Token symbol/i).fill(XSC_TOKEN_CONFIGS.enterprise.symbol);
      await page.getByLabel(/Total supply/i).fill(XSC_TOKEN_CONFIGS.enterprise.totalSupply);

      await page.getByRole('button', { name: /Next/i }).click();

      // Enable all features
      await page.getByLabel(/Mintable/i).check();
      await page.getByLabel(/Burnable/i).check();
      await page.getByLabel(/Pausable/i).check();

      // Should show XSC-specific optimizations
      await expect(page.getByText(/XSC Gas Optimizations Applied/i)).toBeVisible();
      await expect(page.getByText(/Optimized bytecode generation/i)).toBeVisible();
      await expect(page.getByText(/Reduced contract initialization cost/i)).toBeVisible();

      // Even complex features should be affordable on XSC
      await expect(page.getByText(/Complex features: ~0.0003 XSC/i)).toBeVisible();
      await expect(page.getByText(/Still 95% cheaper than Ethereum/i)).toBeVisible();
    });
  });

  test.describe('XSC Transaction Performance', () => {
    test('should demonstrate fast XSC block times', async ({ page }) => {
      test.setTimeout(XSC_TEST_TIMEOUT);

      await connectToXSC(page);
      await page.goto(`${BASE_URL}/create-token`);

      // Fill minimal token for quick deployment
      await page.getByLabel(/Token name/i).fill('Fast Deploy Token');
      await page.getByLabel(/Token symbol/i).fill('FAST');
      await page.getByLabel(/Total supply/i).fill('10000');

      // Quick navigation to deployment
      for (let i = 0; i < 5; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        await page.waitForTimeout(200);
      }

      // Deploy and measure time
      const deployStart = Date.now();
      await page.getByRole('button', { name: /Deploy Token/i }).click();

      // Should show XSC speed benefits
      await expect(page.getByText(/XSC Network: Ultra-fast deployment/i)).toBeVisible();
      await expect(page.getByText(/Expected confirmation: ~4-6 seconds/i)).toBeVisible();

      await expect(page.getByText(/Deployment Successful/i)).toBeVisible({ timeout: 25000 });

      const deployTime = Date.now() - deployStart;
      expect(deployTime).toBeLessThan(15000); // Should complete in under 15 seconds on XSC
    });

    test('should track XSC transaction confirmations', async ({ page }) => {
      test.setTimeout(XSC_TEST_TIMEOUT);

      await connectToXSC(page);
      await page.goto(`${BASE_URL}/create-token`);

      // Minimal setup for transaction tracking
      await page.getByLabel(/Token name/i).fill('Track Token');
      await page.getByLabel(/Token symbol/i).fill('TRACK');
      await page.getByLabel(/Total supply/i).fill('5000');

      for (let i = 0; i < 5; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        await page.waitForTimeout(200);
      }

      await page.getByRole('button', { name: /Deploy Token/i }).click();

      // Should show XSC-specific confirmation tracking
      await expect(page.getByText(/Transaction submitted to XSC Network/i)).toBeVisible();
      await expect(page.getByText(/Block time: ~2 seconds/i)).toBeVisible();
      await expect(page.getByText(/Confirmations: 0\/20/i)).toBeVisible();

      // Should update confirmation count rapidly
      await expect(page.getByText(/Confirmations: 1\/20/i)).toBeVisible({ timeout: 3000 });
      await expect(page.getByText(/Confirmations: 5\/20/i)).toBeVisible({ timeout: 8000 });

      await expect(page.getByText(/Deployment Successful/i)).toBeVisible({ timeout: 30000 });
    });

    test('should handle XSC network congestion gracefully', async ({ page }) => {
      // Mock XSC network congestion (rare but possible)
      await page.addInitScript(() => {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'eth_gasPrice') {
            return '0x12A05F200'; // 5 gwei (high for XSC)
          }
          if (method === 'eth_sendTransaction') {
            // Slower confirmation during congestion
            return new Promise(resolve => {
              setTimeout(() => {
                resolve('0xXSC1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
              }, 8000); // 8 second delay
            });
          }
          return null;
        };
      });

      await connectToXSC(page);
      await page.goto(`${BASE_URL}/create-token`);

      await page.getByLabel(/Token name/i).fill('Congestion Test');
      await page.getByLabel(/Token symbol/i).fill('CONG');
      await page.getByLabel(/Total supply/i).fill('1000');

      for (let i = 0; i < 5; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        await page.waitForTimeout(200);
      }

      // Should detect higher gas prices
      await expect(page.getByText(/Higher gas prices detected/i)).toBeVisible();
      await expect(page.getByText(/XSC network experiencing high demand/i)).toBeVisible();
      await expect(page.getByText(/Still much cheaper than Ethereum/i)).toBeVisible();

      await page.getByRole('button', { name: /Deploy Token/i }).click();

      // Should show congestion-aware messaging
      await expect(page.getByText(/Network congestion detected/i)).toBeVisible();
      await expect(page.getByText(/Transaction may take longer than usual/i)).toBeVisible();
    });
  });

  test.describe('XSC-Specific Features', () => {
    test('should enable XSC-specific optimizations', async ({ page }) => {
      await connectToXSC(page);
      await page.goto(`${BASE_URL}/create-token`);

      await page.getByLabel(/Token name/i).fill(XSC_TOKEN_CONFIGS.optimized.name);
      await page.getByLabel(/Token symbol/i).fill(XSC_TOKEN_CONFIGS.optimized.symbol);
      await page.getByLabel(/Total supply/i).fill(XSC_TOKEN_CONFIGS.optimized.totalSupply);

      await page.getByRole('button', { name: /Next/i }).click();

      // Should show XSC-specific feature toggles
      await expect(page.getByText(/XSC Network Features/i)).toBeVisible();
      await expect(page.getByLabel(/Gas Optimizations/i)).toBeVisible();
      await expect(page.getByLabel(/Fast Transaction Mode/i)).toBeVisible();
      await expect(page.getByLabel(/Low Fee Priority/i)).toBeVisible();

      // Enable XSC optimizations
      await page.getByLabel(/Gas Optimizations/i).check();
      await page.getByLabel(/Fast Transaction Mode/i).check();

      await expect(page.getByText(/XSC optimizations will reduce gas costs by ~20%/i)).toBeVisible();
    });

    test('should prepare tokens for cross-chain compatibility', async ({ page }) => {
      await connectToXSC(page);
      await page.goto(`${BASE_URL}/create-token`);

      await page.getByLabel(/Token name/i).fill(XSC_TOKEN_CONFIGS.crossChainReady.name);
      await page.getByLabel(/Token symbol/i).fill(XSC_TOKEN_CONFIGS.crossChainReady.symbol);
      await page.getByLabel(/Total supply/i).fill(XSC_TOKEN_CONFIGS.crossChainReady.totalSupply);

      await page.getByRole('button', { name: /Next/i }).click();

      // Should show cross-chain options
      await expect(page.getByText(/Cross-Chain Features/i)).toBeVisible();
      await expect(page.getByLabel(/Bridge Compatibility/i)).toBeVisible();
      await expect(page.getByLabel(/Multi-Chain Support/i)).toBeVisible();

      await page.getByLabel(/Bridge Compatibility/i).check();
      await page.getByLabel(/Multi-Chain Support/i).check();

      await expect(page.getByText(/Token will be compatible with XSC bridges/i)).toBeVisible();
      await expect(page.getByText(/Enables seamless transfers to other networks/i)).toBeVisible();
    });

    test('should validate XSC-specific constraints', async ({ page }) => {
      await connectToXSC(page);
      await page.goto(`${BASE_URL}/create-token`);

      // Try to create a token that might exceed XSC limits
      await page.getByLabel(/Token name/i).fill('Extreme Complex Token With Very Long Name That Might Exceed Limits');
      await page.getByLabel(/Token symbol/i).fill('EXTREMECOMPLEX');
      await page.getByLabel(/Total supply/i).fill('999999999999999999999999999');

      await page.getByRole('button', { name: /Next/i }).click();

      // Enable many features
      await page.getByLabel(/Mintable/i).check();
      await page.getByLabel(/Burnable/i).check();
      await page.getByLabel(/Pausable/i).check();
      await page.getByLabel(/Capped/i).check();
      await page.getByLabel(/Maximum supply/i).fill('999999999999999999999999999999');

      // Should validate against XSC constraints
      await expect(page.getByText(/XSC Constraint Validation/i)).toBeVisible();
      await expect(page.getByText(/⚠️ Token name exceeds recommended length/i)).toBeVisible();
      await expect(page.getByText(/⚠️ Supply value very large - consider smaller denominations/i)).toBeVisible();
      await expect(page.getByText(/Contract complexity: High but within XSC limits/i)).toBeVisible();
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should handle XSC RPC connection issues', async ({ page }) => {
      // Mock XSC RPC failure
      await page.addInitScript(() => {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'eth_gasPrice' || method === 'eth_getBalance') {
            throw new Error('XSC RPC temporarily unavailable');
          }
          return null;
        };
      });

      await connectToXSC(page);

      // Should handle RPC errors gracefully
      await expect(page.getByText(/XSC Network Connection Issues/i)).toBeVisible();
      await expect(page.getByText(/Checking alternative RPC endpoints/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Switch RPC Endpoint/i })).toBeVisible();
    });

    test('should recover from XSC transaction failures', async ({ page }) => {
      // Mock XSC transaction failure (insufficient XSC balance)
      await page.addInitScript(() => {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'eth_sendTransaction') {
            throw new Error('insufficient funds for gas * price + value');
          }
          if (method === 'eth_getBalance') {
            return '0x16345785D8A0000'; // 0.1 XSC (low balance)
          }
          return null;
        };
      });

      await connectToXSC(page);
      await page.goto(`${BASE_URL}/create-token`);

      // Quick setup and deploy
      await page.getByLabel(/Token name/i).fill('Low Balance Test');
      await page.getByLabel(/Token symbol/i).fill('LOWBAL');
      await page.getByLabel(/Total supply/i).fill('1000');

      for (let i = 0; i < 5; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        await page.waitForTimeout(200);
      }

      await page.getByRole('button', { name: /Deploy Token/i }).click();

      // Should show XSC-specific error and solutions
      await expect(page.getByText(/Insufficient XSC Balance/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/You need ~0.0001 XSC for deployment/i)).toBeVisible();
      await expect(page.getByText(/Current balance: 0.1 XSC/i)).toBeVisible();

      // Should provide XSC-specific solutions
      await expect(page.getByRole('button', { name: /Get XSC Tokens/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Use Bridge/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Reduce Gas Limit/i })).toBeVisible();
    });

    test('should handle XSC network incompatibilities', async ({ page }) => {
      // Mock old wallet version that doesn't support XSC features
      await page.addInitScript(() => {
        (window as any).ethereum = {
          isMetaMask: true,
          request: async ({ method }: { method: string }) => {
            if (method === 'wallet_addEthereumChain') {
              throw new Error('This wallet version does not support custom networks');
            }
            return null;
          }
        };
      });

      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();

      // Should detect incompatibility
      await expect(page.getByText(/Wallet Incompatibility Detected/i)).toBeVisible();
      await expect(page.getByText(/Your wallet version may not support XSC Network/i)).toBeVisible();

      // Should provide solutions
      await expect(page.getByText(/Please update your wallet or try:/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Update Wallet/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Use Different Wallet/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Continue with Limitations/i })).toBeVisible();
    });
  });

  test.describe('Performance Comparison', () => {
    test('should demonstrate XSC performance advantages', async ({ page }) => {
      await connectToXSC(page);
      await page.goto(`${BASE_URL}/network-comparison`);

      // Should show performance comparison
      await expect(page.getByText(/Network Performance Comparison/i)).toBeVisible();

      // XSC should lead in key metrics
      await expect(page.getByText(/Block Time.*XSC: 2s.*ETH: 12s.*BSC: 3s/i)).toBeVisible();
      await expect(page.getByText(/Gas Price.*XSC: 1 gwei.*ETH: 20+ gwei.*BSC: 5 gwei/i)).toBeVisible();
      await expect(page.getByText(/Throughput.*XSC: 100+ TPS.*ETH: 15 TPS.*BSC: 60 TPS/i)).toBeVisible();

      // Should highlight overall XSC advantages
      await expect(page.getByText(/🏆 XSC Network leads in 3\/3 metrics/i)).toBeVisible();
      await expect(page.getByText(/Best choice for DeFi and high-frequency applications/i)).toBeVisible();
    });

    test('should show real-time XSC network stats', async ({ page }) => {
      await connectToXSC(page);

      await page.getByRole('button', { name: /Network Stats/i }).click();

      // Should display live XSC network information
      await expect(page.getByText(/XSC Network Status/i)).toBeVisible();
      await expect(page.getByText(/Current Block:/i)).toBeVisible();
      await expect(page.getByText(/Block Time: 2.1s/i)).toBeVisible();
      await expect(page.getByText(/Gas Price: 1 gwei/i)).toBeVisible();
      await expect(page.getByText(/Network Load: Low/i)).toBeVisible();

      // Should show health indicators
      await expect(page.getByText(/✅ Network Healthy/i)).toBeVisible();
      await expect(page.getByText(/✅ RPC Responsive/i)).toBeVisible();
      await expect(page.getByText(/✅ Gas Prices Stable/i)).toBeVisible();
    });
  });
});

// Export test configuration
export const xscCompatibilityConfig = {
  testId: 'xsc-compatibility',
  networkConfig: XSC_NETWORK_CONFIG,
  testnetConfig: XSC_TESTNET_CONFIG,
  tokenConfigs: XSC_TOKEN_CONFIGS,
  timeout: XSC_TEST_TIMEOUT,
  retries: 2
};

// Export for window access
if (typeof window !== 'undefined') {
  (window as any).xscCompatibilityTests = {
    XSC_NETWORK_CONFIG,
    XSC_TESTNET_CONFIG,
    XSC_TOKEN_CONFIGS,
    setupXSCWallet,
    waitForXSCConnection,
    verifyXSCNetwork,
    connectToXSC
  };
}