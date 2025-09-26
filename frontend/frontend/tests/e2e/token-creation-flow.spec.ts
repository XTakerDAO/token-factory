import { test, expect, describe, beforeEach } from '@playwright/test';

/**
 * Token Creation Flow E2E Tests
 * 
 * Complete end-to-end testing of the token creation process:
 * 1. Wallet connection flow
 * 2. Form filling and validation  
 * 3. Network selection and switching
 * 4. Advanced features configuration
 * 5. Transaction submission and confirmation
 * 6. Success state and contract verification
 */

describe('Token Creation Flow E2E', () => {
  
  beforeEach(async ({ page }) => {
    // Mock MetaMask and Web3 provider
    await page.addInitScript(() => {
      // Comprehensive MetaMask mock
      (window as any).ethereum = {
        isMetaMask: true,
        chainId: '0x1',
        selectedAddress: null,
        networkVersion: '1',
        
        request: async (params: { method: string; params?: any[] }) => {
          switch (params.method) {
            case 'eth_requestAccounts':
              (window as any).ethereum.selectedAddress = '0x742d35Cc6e1e8E7eD5c987A7eF8D8E8b9b3C0123';
              return ['0x742d35Cc6e1e8E7eD5c987A7eF8D8E8b9b3C0123'];
            
            case 'wallet_switchEthereumChain':
              (window as any).ethereum.chainId = params.params[0].chainId;
              // Trigger chainChanged event
              if (window.chainChangeHandlers) {
                window.chainChangeHandlers.forEach(handler => handler(params.params[0].chainId));
              }
              return null;
            
            case 'wallet_addEthereumChain':
              return null;
            
            case 'eth_sendTransaction':
              // Simulate transaction
              await new Promise(resolve => setTimeout(resolve, 2000));
              return '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234';
            
            case 'eth_getTransactionReceipt':
              return {
                status: '0x1',
                contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
                gasUsed: '0x1e8480',
                blockNumber: '0x1234567'
              };
            
            case 'eth_call':
              // Mock contract calls
              return '0x0000000000000000000000000000000000000000000000000000000000000001';
            
            case 'eth_estimateGas':
              return '0x1e8480'; // ~2M gas
            
            case 'eth_gasPrice':
              return '0x4a817c800'; // 20 gwei
            
            case 'eth_getBalance':
              return '0xde0b6b3a7640000'; // 1 ETH
            
            default:
              throw new Error(`Unknown method: ${params.method}`);
          }
        },
        
        on: (event: string, handler: Function) => {
          if (!window.eventHandlers) window.eventHandlers = {};
          if (!window.eventHandlers[event]) window.eventHandlers[event] = [];
          window.eventHandlers[event].push(handler);
          
          // Store handlers for manual triggering
          if (event === 'chainChanged') {
            if (!window.chainChangeHandlers) window.chainChangeHandlers = [];
            window.chainChangeHandlers.push(handler);
          }
          if (event === 'accountsChanged') {
            if (!window.accountChangeHandlers) window.accountChangeHandlers = [];
            window.accountChangeHandlers.push(handler);
          }
        },
        
        removeListener: (event: string, handler: Function) => {}
      };

      // Mock token factory contract
      (window as any).mockContracts = {
        TokenFactory: {
          address: '0x123456789abcdefabcdefabcdefabcdefabcdef12',
          deploymentFee: '0.001',
          supportedFeatures: ['basic', 'mintable', 'burnable', 'pausable', 'ownable'],
          gasEstimates: {
            basic: 1200000,
            mintable: 1400000,
            burnable: 1300000,
            pausable: 1500000,
            ownable: 1250000
          }
        }
      };
    });

    // Navigate to token creation page
    await page.goto('/create-token');
  });

  describe('Complete Token Creation Flow', () => {
    test('should create basic token successfully', async ({ page }) => {
      // Step 1: Connect wallet
      await page.getByTestId('connect-wallet-button').click();
      await expect(page.getByTestId('wallet-status')).toHaveText('Connected', { timeout: 5000 });
      await expect(page.getByTestId('wallet-address')).toHaveText('0x742d35...0123');

      // Step 2: Fill basic token information
      await page.getByTestId('token-name-input').fill('Test Token');
      await page.getByTestId('token-symbol-input').fill('TEST');
      await page.getByTestId('total-supply-input').fill('1000000');
      await page.getByTestId('decimals-input').fill('18');

      // Step 3: Verify form validation passes
      await expect(page.getByTestId('token-name-validation')).toHaveClass(/success/);
      await expect(page.getByTestId('token-symbol-validation')).toHaveClass(/success/);
      await expect(page.getByTestId('total-supply-validation')).toHaveClass(/success/);

      // Step 4: Review deployment information
      await expect(page.getByTestId('deployment-network')).toHaveText('Ethereum Mainnet');
      await expect(page.getByTestId('deployment-fee')).toHaveText('0.001 ETH');
      await expect(page.getByTestId('gas-estimate')).toHaveText('~1.2M gas');

      // Step 5: Create token
      await page.getByTestId('create-token-button').click();

      // Step 6: Confirm transaction in modal
      await expect(page.getByTestId('transaction-modal')).toBeVisible();
      await expect(page.getByTestId('transaction-details')).toContainText('Test Token (TEST)');
      await expect(page.getByTestId('transaction-details')).toContainText('1,000,000 tokens');

      await page.getByTestId('confirm-transaction-button').click();

      // Step 7: Wait for transaction confirmation
      await expect(page.getByTestId('transaction-status')).toHaveText('Confirming transaction...', { timeout: 3000 });
      await expect(page.getByTestId('transaction-status')).toHaveText('Token created successfully!', { timeout: 10000 });

      // Step 8: Verify success state
      await expect(page.getByTestId('contract-address')).toHaveText('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');
      await expect(page.getByTestId('transaction-hash')).toContain('0x123456789abcdef');
      await expect(page.getByTestId('block-number')).toHaveText('#19088743');

      // Step 9: Verify action buttons
      await expect(page.getByTestId('view-on-etherscan')).toBeVisible();
      await expect(page.getByTestId('add-to-wallet')).toBeVisible();
      await expect(page.getByTestId('create-another-token')).toBeVisible();
      await expect(page.getByTestId('share-token')).toBeVisible();
    });

    test('should create token with advanced features', async ({ page }) => {
      // Step 1: Connect wallet
      await page.getByTestId('connect-wallet-button').click();
      await expect(page.getByTestId('wallet-status')).toHaveText('Connected');

      // Step 2: Fill basic information
      await page.getByTestId('token-name-input').fill('Advanced Token');
      await page.getByTestId('token-symbol-input').fill('ADV');
      await page.getByTestId('total-supply-input').fill('500000');

      // Step 3: Enable advanced features
      await page.getByTestId('advanced-features-toggle').click();
      await expect(page.getByTestId('advanced-features-panel')).toBeVisible();

      // Step 4: Configure advanced features
      await page.getByTestId('mintable-toggle').click();
      await page.getByTestId('mint-cap-input').fill('1000000');
      
      await page.getByTestId('burnable-toggle').click();
      await page.getByTestId('pausable-toggle').click();

      // Step 5: Verify cost updates
      await expect(page.getByTestId('deployment-fee')).toHaveText('0.0018 ETH'); // higher due to features
      await expect(page.getByTestId('gas-estimate')).toHaveText('~1.8M gas');

      // Step 6: Review feature summary
      await expect(page.getByTestId('features-summary')).toContainText('Mintable');
      await expect(page.getByTestId('features-summary')).toContainText('Burnable');  
      await expect(page.getByTestId('features-summary')).toContainText('Pausable');
      await expect(page.getByTestId('features-summary')).toContainText('Ownable');

      // Step 7: Create token
      await page.getByTestId('create-token-button').click();
      await page.getByTestId('confirm-transaction-button').click();

      // Step 8: Verify successful creation
      await expect(page.getByTestId('transaction-status')).toHaveText('Token created successfully!', { timeout: 10000 });
      await expect(page.getByTestId('advanced-features-deployed')).toBeVisible();
    });

    test('should handle network switching during creation', async ({ page }) => {
      // Step 1: Connect wallet
      await page.getByTestId('connect-wallet-button').click();
      await expect(page.getByTestId('wallet-status')).toHaveText('Connected');

      // Step 2: Fill token information
      await page.getByTestId('token-name-input').fill('Multi Chain Token');
      await page.getByTestId('token-symbol-input').fill('MCT');
      await page.getByTestId('total-supply-input').fill('750000');

      // Step 3: Switch to XSC network
      await page.getByTestId('network-selector').click();
      await page.getByTestId('network-option-xsc').click();

      // Step 4: Verify network switch
      await expect(page.getByTestId('current-network')).toHaveText('XSC Network', { timeout: 5000 });
      await expect(page.getByTestId('deployment-fee')).toHaveText('0.0001 XSC');
      await expect(page.getByTestId('xsc-benefits-badge')).toBeVisible();

      // Step 5: Create token on XSC
      await page.getByTestId('create-token-button').click();
      await page.getByTestId('confirm-transaction-button').click();

      // Step 6: Verify faster confirmation on XSC
      await expect(page.getByTestId('transaction-status')).toHaveText('Token created successfully!', { timeout: 5000 });
      await expect(page.getByTestId('xsc-fast-confirmation')).toBeVisible();
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle wallet rejection gracefully', async ({ page }) => {
      // Step 1: Connect wallet
      await page.getByTestId('connect-wallet-button').click();
      await expect(page.getByTestId('wallet-status')).toHaveText('Connected');

      // Step 2: Fill valid information
      await page.getByTestId('token-name-input').fill('Rejected Token');
      await page.getByTestId('token-symbol-input').fill('REJ');
      await page.getByTestId('total-supply-input').fill('100000');

      // Step 3: Mock user rejection
      await page.evaluate(() => {
        (window as any).ethereum.request = async (params: any) => {
          if (params.method === 'eth_sendTransaction') {
            throw new Error('User rejected the request');
          }
        };
      });

      // Step 4: Attempt creation
      await page.getByTestId('create-token-button').click();
      await page.getByTestId('confirm-transaction-button').click();

      // Step 5: Verify error handling
      await expect(page.getByTestId('transaction-error')).toHaveText('User rejected the request');
      await expect(page.getByTestId('error-icon')).toBeVisible();
      await expect(page.getByTestId('retry-button')).toBeVisible();
      await expect(page.getByTestId('cancel-button')).toBeVisible();

      // Step 6: Test retry functionality
      await page.evaluate(() => {
        (window as any).ethereum.request = async (params: any) => {
          if (params.method === 'eth_sendTransaction') {
            return '0x987654321fedcba987654321fedcba987654321fedcba987654321fedcba98';
          }
        };
      });

      await page.getByTestId('retry-button').click();
      await expect(page.getByTestId('transaction-status')).toHaveText('Token created successfully!', { timeout: 10000 });
    });

    test('should handle insufficient funds error', async ({ page }) => {
      await page.getByTestId('connect-wallet-button').click();
      await expect(page.getByTestId('wallet-status')).toHaveText('Connected');

      // Fill form
      await page.getByTestId('token-name-input').fill('Expensive Token');
      await page.getByTestId('token-symbol-input').fill('EXP');
      await page.getByTestId('total-supply-input').fill('1000000');

      // Mock insufficient funds
      await page.evaluate(() => {
        (window as any).ethereum.request = async (params: any) => {
          if (params.method === 'eth_getBalance') {
            return '0x0'; // 0 ETH
          }
          if (params.method === 'eth_sendTransaction') {
            throw new Error('Insufficient funds for gas');
          }
        };
      });

      await page.getByTestId('create-token-button').click();
      await page.getByTestId('confirm-transaction-button').click();

      // Verify insufficient funds handling
      await expect(page.getByTestId('transaction-error')).toHaveText('Insufficient funds for gas');
      await expect(page.getByTestId('add-funds-suggestion')).toBeVisible();
      await expect(page.getByTestId('recommended-amount')).toHaveText('≥ 0.005 ETH recommended');
    });

    test('should handle network congestion', async ({ page }) => {
      await page.getByTestId('connect-wallet-button').click();
      await expect(page.getByTestId('wallet-status')).toHaveText('Connected');

      await page.getByTestId('token-name-input').fill('Congested Token');
      await page.getByTestId('token-symbol-input').fill('CONG');
      await page.getByTestId('total-supply-input').fill('500000');

      // Mock high gas prices
      await page.evaluate(() => {
        (window as any).ethereum.request = async (params: any) => {
          if (params.method === 'eth_gasPrice') {
            return '0x37e11d600'; // 15 gwei (very high)
          }
        };
      });

      await page.getByTestId('create-token-button').click();

      // Should show gas warning
      await expect(page.getByTestId('high-gas-warning')).toBeVisible();
      await expect(page.getByTestId('estimated-cost')).toContainText('~$45-60');
      await expect(page.getByTestId('gas-price-notice')).toHaveText('Network congestion detected');
    });
  });

  describe('Form Validation and User Experience', () => {
    test('should provide real-time validation feedback', async ({ page }) => {
      await page.getByTestId('connect-wallet-button').click();

      // Test name validation
      await page.getByTestId('token-name-input').fill('AB');
      await page.getByTestId('token-name-input').blur();
      await expect(page.getByTestId('token-name-error')).toHaveText('Token name must be at least 3 characters');

      await page.getByTestId('token-name-input').fill('Valid Token Name');
      await expect(page.getByTestId('token-name-success')).toBeVisible();

      // Test symbol validation
      await page.getByTestId('token-symbol-input').fill('invalid');
      await page.getByTestId('token-symbol-input').blur();
      await expect(page.getByTestId('token-symbol-error')).toHaveText('Token symbol must be uppercase letters only');

      await page.getByTestId('token-symbol-input').fill('VALID');
      await expect(page.getByTestId('token-symbol-success')).toBeVisible();

      // Test supply validation
      await page.getByTestId('total-supply-input').fill('0');
      await page.getByTestId('total-supply-input').blur();
      await expect(page.getByTestId('total-supply-error')).toHaveText('Total supply must be greater than 0');

      await page.getByTestId('total-supply-input').fill('1000000');
      await expect(page.getByTestId('total-supply-success')).toBeVisible();
    });

    test('should save form progress locally', async ({ page }) => {
      await page.getByTestId('connect-wallet-button').click();

      // Fill form partially
      await page.getByTestId('token-name-input').fill('Persistent Token');
      await page.getByTestId('token-symbol-input').fill('PERS');
      await page.getByTestId('total-supply-input').fill('2000000');

      // Enable some advanced features
      await page.getByTestId('advanced-features-toggle').click();
      await page.getByTestId('mintable-toggle').click();

      // Reload page
      await page.reload();

      // Reconnect wallet
      await page.getByTestId('connect-wallet-button').click();

      // Verify form data persisted
      await expect(page.getByTestId('token-name-input')).toHaveValue('Persistent Token');
      await expect(page.getByTestId('token-symbol-input')).toHaveValue('PERS');
      await expect(page.getByTestId('total-supply-input')).toHaveValue('2000000');
      
      await page.getByTestId('advanced-features-toggle').click();
      await expect(page.getByTestId('mintable-toggle')).toBeChecked();
    });

    test('should handle form auto-completion suggestions', async ({ page }) => {
      await page.getByTestId('connect-wallet-button').click();

      // Test symbol auto-generation from name
      await page.getByTestId('token-name-input').fill('Amazing Utility Token');
      await page.getByTestId('token-name-input').blur();
      
      await expect(page.getByTestId('suggested-symbol')).toHaveText('Suggested: AUT');
      await page.getByTestId('use-suggested-symbol').click();
      await expect(page.getByTestId('token-symbol-input')).toHaveValue('AUT');

      // Test supply suggestions based on use case
      await page.getByTestId('use-case-selector').selectOption('utility');
      await expect(page.getByTestId('suggested-supply')).toHaveText('Suggested: 10,000,000');
      
      await page.getByTestId('use-suggested-supply').click();
      await expect(page.getByTestId('total-supply-input')).toHaveValue('10000000');
    });
  });

  describe('Performance and Accessibility', () => {
    test('should meet performance requirements', async ({ page }) => {
      const startTime = Date.now();
      
      await page.getByTestId('connect-wallet-button').click();
      await expect(page.getByTestId('wallet-status')).toHaveText('Connected');
      
      const connectTime = Date.now() - startTime;
      expect(connectTime).toBeLessThan(3000);

      // Form interaction performance
      const formStartTime = Date.now();
      
      await page.getByTestId('token-name-input').fill('Performance Test Token');
      await page.getByTestId('token-symbol-input').fill('PERF');
      await page.getByTestId('total-supply-input').fill('1000000');
      
      const formEndTime = Date.now() - formStartTime;
      expect(formEndTime).toBeLessThan(1000);
    });

    test('should be fully accessible', async ({ page }) => {
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('connect-wallet-button')).toBeFocused();
      
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('wallet-status')).toHaveText('Connected');

      // Navigate form with keyboard
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('token-name-input')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('token-symbol-input')).toBeFocused();

      // Test screen reader announcements
      await page.getByTestId('token-name-input').fill('Accessible Token');
      await expect(page.getByTestId('form-status')).toHaveAttribute('aria-live', 'polite');

      // Test ARIA labels
      await expect(page.getByTestId('token-name-input')).toHaveAttribute('aria-label', 'Token name');
      await expect(page.getByTestId('create-token-button')).toHaveAttribute('aria-describedby', 'creation-help');
    });

    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.getByTestId('connect-wallet-button').click();
      await expect(page.getByTestId('wallet-status')).toHaveText('Connected');

      // Test mobile-specific UI
      await expect(page.getByTestId('mobile-form-layout')).toBeVisible();
      await expect(page.getByTestId('step-indicator')).toBeVisible();

      // Test touch interactions
      await page.getByTestId('token-name-input').fill('Mobile Token');
      await page.getByTestId('token-symbol-input').fill('MOB');
      await page.getByTestId('total-supply-input').fill('500000');

      // Test mobile network selector
      await page.getByTestId('network-selector-mobile').click();
      await expect(page.getByTestId('network-bottom-sheet')).toBeVisible();
    });
  });
});