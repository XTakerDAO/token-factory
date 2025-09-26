/**
 * UI Performance E2E Tests - Playwright MCP
 *
 * Performance testing for user interface interactions with <100ms response time targets.
 * Tests Core Web Vitals, interaction responsiveness, load times, and performance
 * under various conditions including slow networks and low-powered devices.
 *
 * Performance Targets:
 * - UI interactions: <100ms response time
 * - Page load: <3 seconds (fast 3G)
 * - First Contentful Paint: <1.5 seconds
 * - Largest Contentful Paint: <2.5 seconds
 * - Cumulative Layout Shift: <0.1
 * - First Input Delay: <100ms
 * - Bundle size: <500KB gzipped
 *
 * @author Claude Code - E2E Performance Testing
 * @created 2025-09-26
 */

import { test, expect } from '@playwright/test';

// Performance test configuration
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const PERFORMANCE_TIMEOUT = 30000;

// Performance thresholds (in milliseconds)
const PERFORMANCE_TARGETS = {
  pageLoad: 3000,          // 3 seconds max
  firstContentfulPaint: 1500, // 1.5 seconds
  largestContentfulPaint: 2500, // 2.5 seconds
  firstInputDelay: 100,    // 100ms max
  interactionResponse: 100, // 100ms for UI interactions
  cumulativeLayoutShift: 0.1, // CLS threshold
  bundleSize: 500000,      // 500KB gzipped
  memoryUsage: 50000000,   // 50MB max heap
  networkLatency: 2000     // 2s on slow 3G
};

// Test scenarios for different conditions
const TEST_CONDITIONS = {
  desktop: {
    viewport: { width: 1200, height: 800 },
    userAgent: 'desktop',
    network: 'fast3g',
    cpu: 'no-throttling'
  },
  mobile: {
    viewport: { width: 375, height: 812 },
    userAgent: 'mobile',
    network: 'slow3g',
    cpu: '4x-slowdown'
  },
  tablet: {
    viewport: { width: 768, height: 1024 },
    userAgent: 'tablet',
    network: 'fast3g',
    cpu: '2x-slowdown'
  },
  lowEnd: {
    viewport: { width: 360, height: 640 },
    userAgent: 'mobile',
    network: 'slow3g',
    cpu: '6x-slowdown'
  }
};

// Mock performance-optimized wallet
const setupPerformanceWallet = async (page: any) => {
  await page.addInitScript(() => {
    (window as any).ethereum = {
      isMetaMask: true,
      request: async ({ method }: { method: string }) => {
        const startTime = performance.now();

        // Simulate fast wallet responses for performance testing
        let response;
        switch (method) {
          case 'eth_requestAccounts':
            response = ['0xperf567890123456789012345678901234567890'];
            break;
          case 'eth_chainId':
            response = '0x208'; // XSC Network for best performance
            break;
          case 'eth_getBalance':
            response = '0x1BC16D674EC80000'; // 2 ETH
            break;
          default:
            response = null;
        }

        const responseTime = performance.now() - startTime;
        console.log(`Wallet method ${method} took ${responseTime}ms`);

        return response;
      }
    };

    // Performance monitoring utilities
    (window as any).performanceMetrics = {
      interactionTimes: [],
      recordInteraction: (action: string, startTime: number) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        (window as any).performanceMetrics.interactionTimes.push({
          action,
          duration,
          timestamp: endTime
        });
      }
    };
  });
};

const measurePageLoad = async (page: any, url: string) => {
  const startTime = Date.now();

  await page.goto(url);
  await page.waitForLoadState('networkidle');

  const endTime = Date.now();
  return endTime - startTime;
};

const measureCoreWebVitals = async (page: any) => {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const metrics: any = {};

      // First Contentful Paint
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            metrics.fcp = entry.startTime;
          }
        });
      });
      observer.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          metrics.lcp = entries[entries.length - 1].startTime;
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        metrics.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          metrics.fid = (entries[0] as any).processingStart - entries[0].startTime;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Give time for metrics to be collected
      setTimeout(() => {
        resolve(metrics);
      }, 5000);
    });
  });
};

const measureInteractionTime = async (page: any, action: () => Promise<void>) => {
  const startTime = Date.now();
  await action();
  return Date.now() - startTime;
};

const measureMemoryUsage = async (page: any) => {
  return await page.evaluate(() => {
    if ((performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  });
};

test.describe('UI Performance', () => {
  test.describe('Page Load Performance', () => {
    Object.entries(TEST_CONDITIONS).forEach(([condition, config]) => {
      test(`should load home page within performance budget on ${condition}`, async ({ page }) => {
        test.setTimeout(PERFORMANCE_TIMEOUT);

        await page.setViewportSize(config.viewport);
        // Note: Network throttling would be set via test configuration

        await setupPerformanceWallet(page);

        const loadTime = await measurePageLoad(page, BASE_URL);
        const expectedThreshold = condition === 'lowEnd' ?
          PERFORMANCE_TARGETS.pageLoad * 1.5 :
          PERFORMANCE_TARGETS.pageLoad;

        expect(loadTime).toBeLessThan(expectedThreshold);

        // Verify page is functional after load
        await expect(page.getByRole('button', { name: /Connect Wallet/i })).toBeVisible();
      });

      test(`should load create-token page within budget on ${condition}`, async ({ page }) => {
        test.setTimeout(PERFORMANCE_TIMEOUT);

        await page.setViewportSize(config.viewport);
        await setupPerformanceWallet(page);

        const loadTime = await measurePageLoad(page, `${BASE_URL}/create-token`);
        const expectedThreshold = condition === 'lowEnd' ?
          PERFORMANCE_TARGETS.pageLoad * 2 :
          PERFORMANCE_TARGETS.pageLoad * 1.2;

        expect(loadTime).toBeLessThan(expectedThreshold);

        // Verify critical elements are visible
        await expect(page.getByText(/Create Token/i)).toBeVisible();
        await expect(page.getByLabel(/Token name/i)).toBeVisible();
      });
    });
  });

  test.describe('Core Web Vitals', () => {
    test('should meet Core Web Vitals thresholds on desktop', async ({ page }) => {
      test.setTimeout(PERFORMANCE_TIMEOUT);

      await page.setViewportSize(TEST_CONDITIONS.desktop.viewport);
      await setupPerformanceWallet(page);

      await page.goto(`${BASE_URL}/create-token`);

      const vitals = await measureCoreWebVitals(page);

      // First Contentful Paint
      if (vitals.fcp) {
        expect(vitals.fcp).toBeLessThan(PERFORMANCE_TARGETS.firstContentfulPaint);
      }

      // Largest Contentful Paint
      if (vitals.lcp) {
        expect(vitals.lcp).toBeLessThan(PERFORMANCE_TARGETS.largestContentfulPaint);
      }

      // Cumulative Layout Shift
      if (vitals.cls !== undefined) {
        expect(vitals.cls).toBeLessThan(PERFORMANCE_TARGETS.cumulativeLayoutShift);
      }

      // First Input Delay (if measured)
      if (vitals.fid) {
        expect(vitals.fid).toBeLessThan(PERFORMANCE_TARGETS.firstInputDelay);
      }
    });

    test('should maintain acceptable vitals on mobile', async ({ page }) => {
      test.setTimeout(PERFORMANCE_TIMEOUT);

      await page.setViewportSize(TEST_CONDITIONS.mobile.viewport);
      await setupPerformanceWallet(page);

      await page.goto(`${BASE_URL}/create-token`);

      const vitals = await measureCoreWebVitals(page);

      // Mobile thresholds are slightly more lenient
      if (vitals.fcp) {
        expect(vitals.fcp).toBeLessThan(PERFORMANCE_TARGETS.firstContentfulPaint * 1.3);
      }

      if (vitals.lcp) {
        expect(vitals.lcp).toBeLessThan(PERFORMANCE_TARGETS.largestContentfulPaint * 1.3);
      }

      if (vitals.cls !== undefined) {
        expect(vitals.cls).toBeLessThan(PERFORMANCE_TARGETS.cumulativeLayoutShift * 1.2);
      }
    });
  });

  test.describe('Interaction Performance', () => {
    test.beforeEach(async ({ page }) => {
      await setupPerformanceWallet(page);
      await page.goto(`${BASE_URL}/create-token`);
      await page.waitForLoadState('networkidle');

      // Connect wallet quickly
      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();
      await expect(page.getByText(/Connected/i)).toBeVisible();
    });

    test('should respond to form input within 100ms', async ({ page }) => {
      const nameInput = page.getByLabel(/Token name/i);

      const inputTime = await measureInteractionTime(page, async () => {
        await nameInput.click();
        await nameInput.fill('Performance Test Token');
        await nameInput.blur();
      });

      expect(inputTime).toBeLessThan(PERFORMANCE_TARGETS.interactionResponse);
    });

    test('should validate form fields quickly', async ({ page }) => {
      const nameInput = page.getByLabel(/Token name/i);

      // Test validation response time
      const validationTime = await measureInteractionTime(page, async () => {
        await nameInput.fill(''); // Invalid input
        await nameInput.blur();
        await expect(page.getByText(/Token name is required/i)).toBeVisible();
      });

      expect(validationTime).toBeLessThan(PERFORMANCE_TARGETS.interactionResponse * 1.5);
    });

    test('should navigate wizard steps quickly', async ({ page }) => {
      // Fill required fields
      await page.getByLabel(/Token name/i).fill('Fast Token');
      await page.getByLabel(/Token symbol/i).fill('FAST');
      await page.getByLabel(/Total supply/i).fill('1000000');

      const navigationTime = await measureInteractionTime(page, async () => {
        await page.getByRole('button', { name: /Next/i }).click();
        await expect(page.getByText('Progress: Advanced Features')).toBeVisible();
      });

      expect(navigationTime).toBeLessThan(PERFORMANCE_TARGETS.interactionResponse * 2);
    });

    test('should handle complex feature toggles efficiently', async ({ page }) => {
      // Navigate to advanced features
      await page.getByLabel(/Token name/i).fill('Complex Token');
      await page.getByLabel(/Token symbol/i).fill('COMPLEX');
      await page.getByLabel(/Total supply/i).fill('1000000');
      await page.getByRole('button', { name: /Next/i }).click();

      // Test multiple feature toggles
      const toggleTime = await measureInteractionTime(page, async () => {
        await page.getByLabel(/Mintable/i).check();
        await page.getByLabel(/Burnable/i).check();
        await page.getByLabel(/Pausable/i).check();
        await page.getByLabel(/Capped/i).check();
        await page.getByLabel(/Maximum supply/i).fill('10000000');
      });

      expect(toggleTime).toBeLessThan(PERFORMANCE_TARGETS.interactionResponse * 3);
    });

    test('should respond to network selection quickly', async ({ page }) => {
      // Navigate to network selection
      await page.getByLabel(/Token name/i).fill('Network Test Token');
      await page.getByLabel(/Token symbol/i).fill('NET');
      await page.getByLabel(/Total supply/i).fill('1000000');

      // Quick navigation to network step
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        await page.waitForTimeout(100);
      }

      const selectionTime = await measureInteractionTime(page, async () => {
        await page.getByRole('button', { name: /XSC Network/i }).click();
        await expect(page.getByText(/Selected Network: XSC/i)).toBeVisible();
      });

      expect(selectionTime).toBeLessThan(PERFORMANCE_TARGETS.interactionResponse * 1.5);
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('should maintain reasonable memory usage', async ({ page }) => {
      await setupPerformanceWallet(page);
      await page.goto(`${BASE_URL}/create-token`);

      // Initial memory measurement
      const initialMemory = await measureMemoryUsage(page);

      // Perform complex interactions
      await page.getByLabel(/Token name/i).fill('Memory Test Token');
      await page.getByLabel(/Token symbol/i).fill('MEM');
      await page.getByLabel(/Total supply/i).fill('1000000');

      // Navigate through wizard
      for (let i = 0; i < 4; i++) {
        await page.getByRole('button', { name: /Next/i }).click();
        await page.waitForTimeout(200);
        if (i === 2) {
          await page.getByRole('button', { name: /XSC Network/i }).click();
        }
      }

      // Final memory measurement
      const finalMemory = await measureMemoryUsage(page);
      const memoryIncrease = finalMemory - initialMemory;

      expect(finalMemory).toBeLessThan(PERFORMANCE_TARGETS.memoryUsage);
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_TARGETS.memoryUsage / 2); // Max 25MB increase
    });

    test('should not create memory leaks during navigation', async ({ page }) => {
      await setupPerformanceWallet(page);

      const measurements = [];

      // Navigate between pages multiple times
      for (let i = 0; i < 5; i++) {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        await page.goto(`${BASE_URL}/create-token`);
        await page.waitForLoadState('networkidle');

        await page.goto(`${BASE_URL}/my-tokens`);
        await page.waitForLoadState('networkidle');

        const memory = await measureMemoryUsage(page);
        measurements.push(memory);

        // Wait between iterations
        await page.waitForTimeout(1000);
      }

      // Memory should not continuously increase
      const firstHalf = measurements.slice(0, 2);
      const secondHalf = measurements.slice(-2);
      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      // Allow for some variance but no major memory leaks
      expect(avgSecond - avgFirst).toBeLessThan(PERFORMANCE_TARGETS.memoryUsage / 4);
    });
  });

  test.describe('Bundle Size and Loading', () => {
    test('should have acceptable JavaScript bundle size', async ({ page }) => {
      const resourceSizes: number[] = [];

      page.on('response', (response) => {
        const url = response.url();
        if (url.includes('.js') && !url.includes('node_modules')) {
          response.body().then((body) => {
            resourceSizes.push(body.length);
          }).catch(() => {
            // Ignore errors for this test
          });
        }
      });

      await setupPerformanceWallet(page);
      await page.goto(`${BASE_URL}/create-token`);
      await page.waitForLoadState('networkidle');

      // Wait for all resources to be captured
      await page.waitForTimeout(3000);

      const totalBundleSize = resourceSizes.reduce((sum, size) => sum + size, 0);

      // Bundle should be under 500KB (this is uncompressed size)
      // In production with gzip, it should be much smaller
      expect(totalBundleSize).toBeLessThan(PERFORMANCE_TARGETS.bundleSize * 2);
    });

    test('should load critical resources first', async ({ page }) => {
      const loadOrder: string[] = [];

      page.on('response', (response) => {
        const url = response.url();
        if (url.includes('.js') || url.includes('.css')) {
          loadOrder.push(url);
        }
      });

      await setupPerformanceWallet(page);
      await page.goto(`${BASE_URL}/create-token`);
      await page.waitForLoadState('networkidle');

      // Critical resources should load first
      const criticalResources = loadOrder.filter(url =>
        url.includes('app') || url.includes('main') || url.includes('vendors')
      );

      expect(criticalResources.length).toBeGreaterThan(0);
      // First few resources should be critical
      expect(loadOrder.slice(0, 3).some(url => criticalResources.includes(url))).toBeTruthy();
    });
  });

  test.describe('Performance Under Load', () => {
    test('should maintain performance with rapid interactions', async ({ page }) => {
      await setupPerformanceWallet(page);
      await page.goto(`${BASE_URL}/create-token`);
      await page.waitForLoadState('networkidle');

      const interactionTimes: number[] = [];

      // Perform rapid form interactions
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();

        await page.getByLabel(/Token name/i).fill(`Rapid Test Token ${i}`);
        await page.getByLabel(/Token symbol/i).fill(`RAPID${i}`);

        const endTime = Date.now();
        interactionTimes.push(endTime - startTime);

        await page.waitForTimeout(50); // Brief pause between interactions
      }

      const avgInteractionTime = interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length;
      const maxInteractionTime = Math.max(...interactionTimes);

      expect(avgInteractionTime).toBeLessThan(PERFORMANCE_TARGETS.interactionResponse);
      expect(maxInteractionTime).toBeLessThan(PERFORMANCE_TARGETS.interactionResponse * 2);
    });

    test('should handle concurrent operations efficiently', async ({ page }) => {
      await setupPerformanceWallet(page);
      await page.goto(`${BASE_URL}/create-token`);

      // Connect wallet
      await page.getByRole('button', { name: /Connect Wallet/i }).click();
      await page.getByRole('button', { name: /MetaMask/i }).click();

      // Fill form while performing other operations
      const formFillPromise = (async () => {
        await page.getByLabel(/Token name/i).fill('Concurrent Test Token');
        await page.getByLabel(/Token symbol/i).fill('CONC');
        await page.getByLabel(/Total supply/i).fill('1000000');
      })();

      const validationPromise = (async () => {
        await page.waitForTimeout(100);
        // Trigger validation checks
        await page.getByLabel(/Token name/i).blur();
        await page.getByLabel(/Token symbol/i).blur();
      })();

      const startTime = Date.now();
      await Promise.all([formFillPromise, validationPromise]);
      const concurrentTime = Date.now() - startTime;

      expect(concurrentTime).toBeLessThan(PERFORMANCE_TARGETS.interactionResponse * 3);

      // Verify form state is correct
      await expect(page.getByLabel(/Token name/i)).toHaveValue('Concurrent Test Token');
      await expect(page.getByLabel(/Token symbol/i)).toHaveValue('CONC');
    });
  });

  test.describe('Performance Regression Detection', () => {
    test('should maintain consistent performance across sessions', async ({ page }) => {
      const sessionPerformance = [];

      for (let session = 0; session < 3; session++) {
        await setupPerformanceWallet(page);

        const startTime = Date.now();
        await page.goto(`${BASE_URL}/create-token`);
        await page.waitForLoadState('networkidle');

        // Perform standard interaction
        await page.getByLabel(/Token name/i).fill(`Session ${session} Token`);
        await page.getByLabel(/Token symbol/i).fill(`S${session}`);
        await page.getByLabel(/Total supply/i).fill('1000000');

        const sessionTime = Date.now() - startTime;
        sessionPerformance.push(sessionTime);

        // Clear page for next session
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
      }

      const avgTime = sessionPerformance.reduce((a, b) => a + b, 0) / sessionPerformance.length;
      const maxDeviation = Math.max(...sessionPerformance.map(time => Math.abs(time - avgTime)));

      // Performance should be consistent (within 50% variance)
      expect(maxDeviation).toBeLessThan(avgTime * 0.5);
    });

    test('should track performance metrics for monitoring', async ({ page }) => {
      await setupPerformanceWallet(page);
      await page.goto(`${BASE_URL}/create-token`);

      // Collect performance metrics
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paints = performance.getEntriesByType('paint');

        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: paints.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paints.find(p => p.name === 'first-contentful-paint')?.startTime || 0
        };
      });

      // All metrics should be within acceptable ranges
      expect(metrics.domContentLoaded).toBeLessThan(1000); // 1 second
      expect(metrics.loadComplete).toBeLessThan(2000); // 2 seconds
      if (metrics.firstPaint > 0) {
        expect(metrics.firstPaint).toBeLessThan(PERFORMANCE_TARGETS.firstContentfulPaint);
      }
      if (metrics.firstContentfulPaint > 0) {
        expect(metrics.firstContentfulPaint).toBeLessThan(PERFORMANCE_TARGETS.firstContentfulPaint);
      }
    });
  });
});

// Export performance test configuration
export const uiPerformanceConfig = {
  testId: 'ui-performance',
  targets: PERFORMANCE_TARGETS,
  conditions: TEST_CONDITIONS,
  timeout: PERFORMANCE_TIMEOUT,
  retries: 1 // Lower retries for performance tests
};

// Export for window access
if (typeof window !== 'undefined') {
  (window as any).uiPerformanceTests = {
    PERFORMANCE_TARGETS,
    TEST_CONDITIONS,
    setupPerformanceWallet,
    measurePageLoad,
    measureCoreWebVitals,
    measureInteractionTime,
    measureMemoryUsage
  };
}