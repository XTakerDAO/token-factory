/**
 * Advanced Token Creation E2E Tests - Playwright MCP
 *
 * End-to-end testing for advanced token creation functionality.
 * Tests complex token configurations including mintable, burnable, pausable,
 * and capped features, as well as permission management, multi-signature
 * requirements, and advanced deployment scenarios.
 *
 * Features Tested:
 * - Advanced ERC20 features (mintable, burnable, pausable, capped)
 * - Feature interdependencies and validation
 * - Permission and ownership configuration
 * - Multi-signature wallet integration
 * - Complex deployment scenarios
 * - Gas optimization for feature combinations
 * - Advanced error handling and recovery
 * - Performance under complex configurations
 *
 * @author Claude Code - E2E Advanced Token Testing
 * @created 2025-09-26
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const ADVANCED_TEST_TIMEOUT = 90000; // 90 seconds for complex deployments

// Advanced token configurations
const ADVANCED_TOKEN_CONFIGS = {
  mintable: {
    name: 'Mintable Token',
    symbol: 'MINT',
    totalSupply: '1000000',
    decimals: 18,
    features: {
      mintable: true,
      burnable: false,
      pausable: false,
      capped: false
    }
  },
  burnablePausable: {
    name: 'Burnable Pausable Token',
    symbol: 'BURNPAUS',
    totalSupply: '500000',
    decimals: 8,
    features: {
      mintable: false,
      burnable: true,
      pausable: true,
      capped: false
    }
  },
  fullFeatured: {
    name: 'Full Featured Token',
    symbol: 'FULL',
    totalSupply: '10000000',
    decimals: 18,
    features: {
      mintable: true,
      burnable: true,
      pausable: true,
      capped: true,
      cap: '50000000'
    }
  },
  cappedOnly: {
    name: 'Capped Token',
    symbol: 'CAP',
    totalSupply: '1000000',
    decimals: 18,
    features: {
      mintable: false,
      burnable: false,
      pausable: false,
      capped: true,
      cap: '5000000'
    }
  },
  enterpriseToken: {
    name: 'Enterprise Governance Token',
    symbol: 'ENTGOV',
    totalSupply: '100000000',
    decimals: 18,
    features: {
      mintable: true,
      burnable: true,
      pausable: true,
      capped: true,
      cap: '1000000000'
    },
    permissions: {
      multiSig: true,
      timelock: true,
      roleBasedAccess: true
    }
  }
};

// Permission configurations
const PERMISSION_CONFIGS = {
  singleOwner: {
    type: 'single',
    owner: '0x1234567890123456789012345678901234567890'
  },
  multiSig: {
    type: 'multisig',
    owners: [
      '0x1234567890123456789012345678901234567890',
      '0x2345678901234567890123456789012345678901',
      '0x3456789012345678901234567890123456789012'
    ],
    threshold: 2
  },
  timelock: {
    type: 'timelock',
    delay: 86400, // 1 day
    owner: '0x1234567890123456789012345678901234567890'
  }
};

// Mock advanced wallet with multi-sig capabilities
const setupAdvancedWallet = async (page: any) => {
  await page.addInitScript(() => {
    (window as any).ethereum = {
      isMetaMask: true,
      request: async ({ method, params }: { method: string; params?: any[] }) => {
        switch (method) {
          case 'eth_requestAccounts':
            return ['0x1234567890123456789012345678901234567890'];
          case 'eth_chainId':
            return '0x208'; // XSC Network
          case 'eth_getBalance':
            return '0x3635C9ADC5DEA00000'; // 1000 ETH for complex deployments
          case 'eth_gasPrice':
            return '0x3B9ACA00'; // 1 gwei
          case 'eth_estimateGas':
            return params?.[0]?.data?.length > 1000 ? '0x30D40' : '0x186A0'; // Higher gas for complex contracts
          case 'eth_sendTransaction':
            // Simulate longer deployment for advanced features
            setTimeout(() => {}, 2000);
            return '0xadvanced567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
          case 'eth_getTransactionReceipt':
            return {
              status: '0x1',
              blockNumber: '0x1',
              transactionHash: '0xadvanced567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
              contractAddress: '0xadvanced3210987654321098765432109876543210',
              gasUsed: '0x30D40' // Higher gas usage
            };
          case 'eth_call':
            // Mock contract calls for feature verification
            return '0x0000000000000000000000000000000000000000000000000000000000000001';
          case 'wallet_switchEthereumChain':
            return null;
          default:
            return null;
        }
      }
    };
  });
};

const waitForAdvancedPageReady = async (page: any) => {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => {
    return document.readyState === 'complete' &&
           typeof window !== 'undefined';
  });
  await page.waitForTimeout(1500); // Extra time for advanced features
};

const connectAdvancedWallet = async (page: any) => {
  await page.getByRole('button', { name: /Connect Wallet/i }).click();
  await page.getByRole('button', { name: /MetaMask/i }).click();
  await expect(page.getByText(/Connected/i)).toBeVisible({ timeout: 15000 });
};

const fillBasicInfo = async (page: any, config: any) => {
  await page.getByLabel(/Token name/i).fill(config.name);
  await page.getByLabel(/Token symbol/i).fill(config.symbol);
  await page.getByLabel(/Total supply/i).fill(config.totalSupply);
  if (config.decimals !== 18) {
    await page.getByLabel(/Decimals/i).fill(config.decimals.toString());
  }
};

const configureAdvancedFeatures = async (page: any, features: any) => {
  if (features.mintable) {
    await page.getByLabel(/Mintable/i).check();
  }
  if (features.burnable) {
    await page.getByLabel(/Burnable/i).check();
  }
  if (features.pausable) {
    await page.getByLabel(/Pausable/i).check();
  }
  if (features.capped) {
    await page.getByLabel(/Capped/i).check();
    if (features.cap) {
      await page.getByLabel(/Maximum supply/i).fill(features.cap);
    }
  }
};

test.describe('Advanced Token Creation', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdvancedWallet(page);
    await page.goto(`${BASE_URL}/create-token`);
    await waitForAdvancedPageReady(page);
    await connectAdvancedWallet(page);
  });

  test.describe('Advanced Features Configuration', () => {
    test('should configure mintable token correctly', async ({ page }) => {
      await fillBasicInfo(page, ADVANCED_TOKEN_CONFIGS.mintable);
      await page.getByRole('button', { name: /Next/i }).click(); // to Advanced Features

      // Configure mintable feature
      await page.getByLabel(/Mintable/i).check();
      await expect(page.getByLabel(/Mintable/i)).toBeChecked();

      // Should show mintable-specific options
      await expect(page.getByText(/Minting Permissions/i)).toBeVisible();
      await expect(page.getByText(/Only owner can mint new tokens/i)).toBeVisible();

      // Should show gas impact
      await expect(page.getByText(/Gas Impact: \+15%/i)).toBeVisible();
    });

    test('should configure burnable and pausable features', async ({ page }) => {
      await fillBasicInfo(page, ADVANCED_TOKEN_CONFIGS.burnablePausable);
      await page.getByRole('button', { name: /Next/i }).click();

      // Configure both features
      await page.getByLabel(/Burnable/i).check();
      await page.getByLabel(/Pausable/i).check();

      await expect(page.getByLabel(/Burnable/i)).toBeChecked();
      await expect(page.getByLabel(/Pausable/i)).toBeChecked();

      // Should show combined feature descriptions
      await expect(page.getByText(/Users can burn their own tokens/i)).toBeVisible();
      await expect(page.getByText(/Owner can pause all transfers/i)).toBeVisible();

      // Should show combined gas impact
      await expect(page.getByText(/Gas Impact: \+25%/i)).toBeVisible();
    });

    test('should configure full-featured token with all options', async ({ page }) => {
      await fillBasicInfo(page, ADVANCED_TOKEN_CONFIGS.fullFeatured);
      await page.getByRole('button', { name: /Next/i }).click();

      // Enable all features
      await configureAdvancedFeatures(page, ADVANCED_TOKEN_CONFIGS.fullFeatured.features);

      // Verify all features are enabled
      await expect(page.getByLabel(/Mintable/i)).toBeChecked();
      await expect(page.getByLabel(/Burnable/i)).toBeChecked();
      await expect(page.getByLabel(/Pausable/i)).toBeChecked();
      await expect(page.getByLabel(/Capped/i)).toBeChecked();

      // Should show maximum supply input
      await expect(page.getByLabel(/Maximum supply/i)).toBeVisible();
      await expect(page.getByLabel(/Maximum supply/i)).toHaveValue(ADVANCED_TOKEN_CONFIGS.fullFeatured.features.cap);

      // Should show high gas impact warning
      await expect(page.getByText(/Gas Impact: \+50%/i)).toBeVisible();
      await expect(page.getByText(/Complex deployment may take longer/i)).toBeVisible();
    });

    test('should validate feature dependencies', async ({ page }) => {
      await fillBasicInfo(page, ADVANCED_TOKEN_CONFIGS.cappedOnly);
      await page.getByRole('button', { name: /Next/i }).click();

      // Enable capped without mintable
      await page.getByLabel(/Capped/i).check();
      await page.getByLabel(/Maximum supply/i).fill('5000000');

      // Should show warning about capped tokens typically needing mintable
      await expect(page.getByText(/Warning: Capped tokens are typically mintable/i)).toBeVisible();
      await expect(page.getByText(/Consider enabling mintable feature/i)).toBeVisible();
    });

    test('should validate supply cap constraints', async ({ page }) => {
      await fillBasicInfo(page, ADVANCED_TOKEN_CONFIGS.fullFeatured);
      await page.getByRole('button', { name: /Next/i }).click();

      await page.getByLabel(/Capped/i).check();

      // Try to set cap lower than initial supply
      await page.getByLabel(/Maximum supply/i).fill('1000000'); // Less than totalSupply (10M)
      await page.getByLabel(/Maximum supply/i).blur();

      await expect(page.getByText(/Maximum supply must be greater than initial supply/i)).toBeVisible();

      // Fix the cap
      await page.getByLabel(/Maximum supply/i).fill('50000000');
      await page.getByLabel(/Maximum supply/i).blur();

      await expect(page.getByText(/Maximum supply must be greater than initial supply/i)).not.toBeVisible();
    });
  });

  test.describe('Permission Management', () => {
    test.beforeEach(async ({ page }) => {
      await fillBasicInfo(page, ADVANCED_TOKEN_CONFIGS.enterpriseToken);
      await page.getByRole('button', { name: /Next/i }).click(); // to Advanced Features
      await configureAdvancedFeatures(page, ADVANCED_TOKEN_CONFIGS.enterpriseToken.features);
      await page.getByRole('button', { name: /Next/i }).click(); // to Permissions
    });

    test('should configure single owner permissions', async ({ page }) => {
      await page.getByRole('radio', { name: /Single Owner/i }).check();

      await expect(page.getByText(/Single Owner Control/i)).toBeVisible();
      await expect(page.getByText(/Owner will have full control/i)).toBeVisible();

      // Should show current wallet as default owner
      await expect(page.getByDisplayValue(/0x1234...7890/i)).toBeVisible();
    });

    test('should configure multi-signature permissions', async ({ page }) => {
      await page.getByRole('radio', { name: /Multi-Signature/i }).check();

      await expect(page.getByText(/Multi-Signature Configuration/i)).toBeVisible();

      // Add multiple owners
      await page.getByRole('button', { name: /Add Owner/i }).click();
      await page.getByLabel(/Owner 2 Address/i).fill(PERMISSION_CONFIGS.multiSig.owners[1]);

      await page.getByRole('button', { name: /Add Owner/i }).click();
      await page.getByLabel(/Owner 3 Address/i).fill(PERMISSION_CONFIGS.multiSig.owners[2]);

      // Set threshold
      await page.getByLabel(/Required Signatures/i).fill('2');

      // Should show multi-sig summary
      await expect(page.getByText(/3 owners, 2 signatures required/i)).toBeVisible();
      await expect(page.getByText(/Higher security, but more complex operations/i)).toBeVisible();
    });

    test('should configure timelock permissions', async ({ page }) => {
      await page.getByRole('radio', { name: /Timelock/i }).check();

      await expect(page.getByText(/Timelock Configuration/i)).toBeVisible();

      // Set delay period
      await page.getByLabel(/Delay Period/i).select('1 day');

      await expect(page.getByText(/All administrative actions will have a 1 day delay/i)).toBeVisible();
      await expect(page.getByText(/Provides transparency and security/i)).toBeVisible();
    });

    test('should validate permission configurations', async ({ page }) => {
      await page.getByRole('radio', { name: /Multi-Signature/i }).check();

      // Try to proceed without adding additional owners
      const nextButton = page.getByRole('button', { name: /Next/i });
      await nextButton.click();

      await expect(page.getByText(/Multi-signature requires at least 2 owners/i)).toBeVisible();

      // Add second owner
      await page.getByRole('button', { name: /Add Owner/i }).click();
      await page.getByLabel(/Owner 2 Address/i).fill('invalid-address');
      await page.getByLabel(/Owner 2 Address/i).blur();

      await expect(page.getByText(/Invalid Ethereum address/i)).toBeVisible();
    });
  });

  test.describe('Advanced Deployment Process', () => {
    test('should deploy mintable token successfully', async ({ page }) => {
      test.setTimeout(ADVANCED_TEST_TIMEOUT);

      await fillBasicInfo(page, ADVANCED_TOKEN_CONFIGS.mintable);

      // Configure features and navigate to deployment
      await page.getByRole('button', { name: /Next/i }).click();
      await configureAdvancedFeatures(page, ADVANCED_TOKEN_CONFIGS.mintable.features);

      // Navigate through remaining steps
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        if (i === 1) await page.getByRole('button', { name: /XSC Network/i }).click();
        await page.waitForTimeout(500);
      }

      // Deploy advanced token
      await page.getByRole('button', { name: /Deploy Token/i }).click();

      // Should show advanced deployment progress
      await expect(page.getByText(/Deploying advanced token contract/i)).toBeVisible();
      await expect(page.getByText(/This may take longer due to additional features/i)).toBeVisible();

      await expect(page.getByText(/Deployment Successful/i)).toBeVisible({ timeout: 60000 });

      // Should show advanced token features in success page
      await expect(page.getByText(/Token Features: Mintable/i)).toBeVisible();
      await expect(page.getByText(/Advanced Contract Address/i)).toBeVisible();
    });

    test('should deploy full-featured token successfully', async ({ page }) => {
      test.setTimeout(ADVANCED_TEST_TIMEOUT);

      await fillBasicInfo(page, ADVANCED_TOKEN_CONFIGS.fullFeatured);

      // Configure all features
      await page.getByRole('button', { name: /Next/i }).click();
      await configureAdvancedFeatures(page, ADVANCED_TOKEN_CONFIGS.fullFeatured.features);

      // Navigate through steps
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        if (i === 1) await page.getByRole('button', { name: /XSC Network/i }).click();
        await page.waitForTimeout(500);
      }

      // Should show complex deployment warning
      await expect(page.getByText(/Complex token with multiple features/i)).toBeVisible();
      await expect(page.getByText(/Estimated gas: ~200,000 units/i)).toBeVisible();

      await page.getByRole('button', { name: /Deploy Token/i }).click();

      // Should track complex deployment phases
      await expect(page.getByText(/Deploying template contract/i)).toBeVisible();
      await expect(page.getByText(/Initializing advanced features/i)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/Configuring permissions/i)).toBeVisible({ timeout: 20000 });

      await expect(page.getByText(/Deployment Successful/i)).toBeVisible({ timeout: 75000 });

      // Should show all configured features
      await expect(page.getByText(/Mintable, Burnable, Pausable, Capped/i)).toBeVisible();
      await expect(page.getByText(/Maximum Supply: 50,000,000/i)).toBeVisible();
    });

    test('should handle advanced deployment errors', async ({ page }) => {
      // Mock complex deployment failure
      await page.addInitScript(() => {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'eth_sendTransaction') {
            throw new Error('Contract deployment failed: out of gas');
          }
          return '0x1234567890123456789012345678901234567890';
        };
      });

      await fillBasicInfo(page, ADVANCED_TOKEN_CONFIGS.fullFeatured);
      await page.getByRole('button', { name: /Next/i }).click();
      await configureAdvancedFeatures(page, ADVANCED_TOKEN_CONFIGS.fullFeatured.features);

      // Navigate to deployment
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        if (i === 1) await page.getByRole('button', { name: /XSC Network/i }).click();
        await page.waitForTimeout(300);
      }

      await page.getByRole('button', { name: /Deploy Token/i }).click();

      // Should show specific error for complex deployment
      await expect(page.getByText(/Advanced Deployment Failed/i)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/out of gas/i)).toBeVisible();

      // Should suggest gas optimization
      await expect(page.getByText(/Try reducing features or increasing gas limit/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Optimize Configuration/i })).toBeVisible();
    });

    test('should provide post-deployment management options', async ({ page }) => {
      test.setTimeout(ADVANCED_TEST_TIMEOUT);

      await fillBasicInfo(page, ADVANCED_TOKEN_CONFIGS.mintable);
      await page.getByRole('button', { name: /Next/i }).click();
      await configureAdvancedFeatures(page, ADVANCED_TOKEN_CONFIGS.mintable.features);

      // Quick navigation to deployment
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        if (i === 1) await page.getByRole('button', { name: /XSC Network/i }).click();
        await page.waitForTimeout(300);
      }

      await page.getByRole('button', { name: /Deploy Token/i }).click();
      await expect(page.getByText(/Deployment Successful/i)).toBeVisible({ timeout: 45000 });

      // Should show management options for advanced features
      await expect(page.getByRole('button', { name: /Manage Token/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Mint Tokens/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /View Contract/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Transfer Ownership/i })).toBeVisible();
    });
  });

  test.describe('Gas Optimization and Performance', () => {
    test('should estimate gas costs accurately for different feature combinations', async ({ page }) => {
      // Basic token gas estimate
      await fillBasicInfo(page, { ...ADVANCED_TOKEN_CONFIGS.mintable, features: {} });
      await page.getByRole('button', { name: /Next/i }).click();

      // No features - baseline gas
      await expect(page.getByText(/Estimated Gas: ~100,000 units/i)).toBeVisible();

      // Add mintable
      await page.getByLabel(/Mintable/i).check();
      await expect(page.getByText(/Estimated Gas: ~115,000 units/i)).toBeVisible();

      // Add burnable and pausable
      await page.getByLabel(/Burnable/i).check();
      await page.getByLabel(/Pausable/i).check();
      await expect(page.getByText(/Estimated Gas: ~140,000 units/i)).toBeVisible();

      // Add capped
      await page.getByLabel(/Capped/i).check();
      await page.getByLabel(/Maximum supply/i).fill('10000000');
      await expect(page.getByText(/Estimated Gas: ~155,000 units/i)).toBeVisible();
    });

    test('should provide gas optimization suggestions', async ({ page }) => {
      await fillBasicInfo(page, ADVANCED_TOKEN_CONFIGS.fullFeatured);
      await page.getByRole('button', { name: /Next/i }).click();
      await configureAdvancedFeatures(page, ADVANCED_TOKEN_CONFIGS.fullFeatured.features);

      // Should show optimization panel
      await expect(page.getByText(/Gas Optimization Tips/i)).toBeVisible();
      await expect(page.getByText(/Consider deploying without capped feature/i)).toBeVisible();
      await expect(page.getByText(/Save ~15,000 gas units/i)).toBeVisible();

      // Test optimization
      await page.getByRole('button', { name: /Optimize Gas/i }).click();

      // Should suggest removing least essential features
      await expect(page.getByText(/Remove capped feature to save gas/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Apply Optimization/i })).toBeVisible();
    });

    test('should handle performance under complex configurations', async ({ page }) => {
      const startTime = Date.now();

      await fillBasicInfo(page, ADVANCED_TOKEN_CONFIGS.enterpriseToken);
      await page.getByRole('button', { name: /Next/i }).click();
      await configureAdvancedFeatures(page, ADVANCED_TOKEN_CONFIGS.enterpriseToken.features);

      const configTime = Date.now() - startTime;
      expect(configTime).toBeLessThan(5000); // Should handle complex config in under 5s

      // Navigation should remain responsive
      const navStartTime = Date.now();
      await page.getByRole('button', { name: /Next/i }).click();
      const navTime = Date.now() - navStartTime;
      expect(navTime).toBeLessThan(2000); // Navigation under 2s even with complex config
    });
  });

  test.describe('Feature Interaction and Dependencies', () => {
    test('should handle feature interdependencies correctly', async ({ page }) => {
      await fillBasicInfo(page, ADVANCED_TOKEN_CONFIGS.fullFeatured);
      await page.getByRole('button', { name: /Next/i }).click();

      // Enable capped first
      await page.getByLabel(/Capped/i).check();
      await page.getByLabel(/Maximum supply/i).fill('50000000');

      // Should suggest enabling mintable
      await expect(page.getByText(/Consider enabling mintable for capped tokens/i)).toBeVisible();

      // Auto-suggest button should work
      await page.getByRole('button', { name: /Enable Mintable/i }).click();
      await expect(page.getByLabel(/Mintable/i)).toBeChecked();

      // Should update gas estimate
      await expect(page.getByText(/Gas Impact: \+30%/i)).toBeVisible();
    });

    test('should validate conflicting feature combinations', async ({ page }) => {
      await fillBasicInfo(page, ADVANCED_TOKEN_CONFIGS.fullFeatured);
      await page.getByRole('button', { name: /Next/i }).click();

      // Enable all features
      await configureAdvancedFeatures(page, ADVANCED_TOKEN_CONFIGS.fullFeatured.features);

      // Set cap lower than initial supply (should trigger validation)
      await page.getByLabel(/Maximum supply/i).fill('1000000'); // Less than 10M initial
      await page.getByLabel(/Maximum supply/i).blur();

      await expect(page.getByText(/Configuration Error/i)).toBeVisible();
      await expect(page.getByText(/Maximum supply cannot be less than initial supply/i)).toBeVisible();

      // Should disable next button until fixed
      const nextButton = page.getByRole('button', { name: /Next/i });
      await expect(nextButton).toBeDisabled();
    });

    test('should show feature compatibility matrix', async ({ page }) => {
      await fillBasicInfo(page, ADVANCED_TOKEN_CONFIGS.fullFeatured);
      await page.getByRole('button', { name: /Next/i }).click();

      await page.getByRole('button', { name: /Feature Compatibility/i }).click();

      // Should show compatibility matrix
      await expect(page.getByText(/Feature Compatibility Matrix/i)).toBeVisible();
      await expect(page.getByText(/Mintable ✓ Compatible with all features/i)).toBeVisible();
      await expect(page.getByText(/Burnable ✓ Compatible with all features/i)).toBeVisible();
      await expect(page.getByText(/Pausable ✓ Compatible with all features/i)).toBeVisible();
      await expect(page.getByText(/Capped ⚠️ Works best with mintable/i)).toBeVisible();
    });
  });

  test.describe('Advanced Error Scenarios', () => {
    test('should handle partial deployment failures', async ({ page }) => {
      // Mock partial deployment failure (template deploys, initialization fails)
      await page.addInitScript(() => {
        let callCount = 0;
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'eth_sendTransaction') {
            callCount++;
            if (callCount === 2) { // Second transaction (initialization) fails
              throw new Error('Initialization failed: invalid parameters');
            }
            return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
          }
          return null;
        };
      });

      await fillBasicInfo(page, ADVANCED_TOKEN_CONFIGS.fullFeatured);
      await page.getByRole('button', { name: /Next/i }).click();
      await configureAdvancedFeatures(page, ADVANCED_TOKEN_CONFIGS.fullFeatured.features);

      // Navigate to deployment
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        if (i === 1) await page.getByRole('button', { name: /XSC Network/i }).click();
        await page.waitForTimeout(200);
      }

      await page.getByRole('button', { name: /Deploy Token/i }).click();

      // Should show partial failure state
      await expect(page.getByText(/Partial Deployment Failure/i)).toBeVisible({ timeout: 20000 });
      await expect(page.getByText(/Template deployed but initialization failed/i)).toBeVisible();

      // Should offer recovery options
      await expect(page.getByRole('button', { name: /Retry Initialization/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Deploy New Contract/i })).toBeVisible();
    });

    test('should handle network congestion during advanced deployment', async ({ page }) => {
      // Mock network congestion (high gas prices, slow confirmations)
      await page.addInitScript(() => {
        (window as any).ethereum.request = async ({ method }: { method: string }) => {
          if (method === 'eth_gasPrice') {
            return '0x174876E800'; // 100 gwei (very high)
          }
          if (method === 'eth_sendTransaction') {
            // Simulate slow confirmation
            return new Promise(resolve => {
              setTimeout(() => {
                resolve('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
              }, 10000); // 10 second delay
            });
          }
          return null;
        };
      });

      await fillBasicInfo(page, ADVANCED_TOKEN_CONFIGS.fullFeatured);
      await page.getByRole('button', { name: /Next/i }).click();
      await configureAdvancedFeatures(page, ADVANCED_TOKEN_CONFIGS.fullFeatured.features);

      // Navigate to deployment
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        if (i === 1) await page.getByRole('button', { name: /XSC Network/i }).click();
        await page.waitForTimeout(200);
      }

      // Should show high gas warning
      await expect(page.getByText(/High Gas Prices Detected/i)).toBeVisible();
      await expect(page.getByText(/Network congestion may cause delays/i)).toBeVisible();

      await page.getByRole('button', { name: /Deploy Anyway/i }).click();

      // Should show congestion-aware progress
      await expect(page.getByText(/Network is congested - this may take longer/i)).toBeVisible();
      await expect(page.getByText(/Transaction submitted, waiting for confirmation/i)).toBeVisible();
    });
  });
});

// Export test configuration
export const advancedTokenCreationConfig = {
  testId: 'advanced-token-creation',
  configs: ADVANCED_TOKEN_CONFIGS,
  permissions: PERMISSION_CONFIGS,
  timeout: ADVANCED_TEST_TIMEOUT,
  retries: 1 // Lower retries due to complexity
};

// Export for window access
if (typeof window !== 'undefined') {
  (window as any).advancedTokenCreationTests = {
    ADVANCED_TOKEN_CONFIGS,
    PERMISSION_CONFIGS,
    setupAdvancedWallet,
    waitForAdvancedPageReady,
    connectAdvancedWallet,
    fillBasicInfo,
    configureAdvancedFeatures
  };
}