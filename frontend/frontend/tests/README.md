# Playwright MCP Testing Suite

Complete end-to-end testing framework for the XSC Token Factory frontend implementation using Playwright MCP (Model Context Protocol) integration.

## Overview

This testing suite provides comprehensive coverage for Phase 3.8 frontend implementation, including:

- **Pages**: Token creation wizard and dashboard management
- **Hooks**: Custom React hooks for workflow, deployment, and monitoring
- **Integration**: Cross-component and cross-hook interactions
- **Accessibility**: WCAG 2.1 AA compliance validation
- **Performance**: Core Web Vitals and load time budgets
- **Cross-Browser**: Chrome, Firefox, Safari, Edge compatibility
- **Responsive**: Mobile, tablet, and desktop viewports

## Test Structure

```
tests/
├── e2e/
│   ├── create-token-page.playwright.spec.ts     # Token creation wizard tests
│   ├── my-tokens-page.playwright.spec.ts        # Dashboard management tests
│   └── multi-chain-deployment.spec.ts           # Multi-chain deployment flow
├── hooks/
│   └── hooks-integration.playwright.spec.ts     # Custom hooks integration
├── accessibility/
│   └── a11y-compliance.spec.ts                  # WCAG compliance tests
├── performance/
│   └── web-vitals.spec.ts                       # Performance budget tests
└── playwright-mcp-runner.ts                     # Test orchestration runner
```

## Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all tests
npm run test:playwright:all

# Run specific test categories
npm run test:playwright:critical      # Critical path tests
npm run test:playwright:e2e          # End-to-end page tests
npm run test:playwright:integration  # Hook integration tests
npm run test:playwright:performance  # Performance tests
npm run test:playwright:accessibility # A11y compliance tests

# Run individual test files
npm run test:playwright:create-token # Token creation page
npm run test:playwright:my-tokens    # Dashboard page
npm run test:playwright:hooks        # Hooks integration
```

## Test Categories

### 🚀 Critical Tests (`critical` tag)
Essential user flows that must always pass:
- Token creation wizard completion
- Wallet connection and network switching
- Multi-chain deployment success
- Transaction monitoring accuracy

### 🌐 End-to-End Tests (`e2e` tag)
Complete user journeys across pages:
- Full token creation workflow
- Dashboard management operations
- Search, filtering, and analytics
- Export and data management

### 🔗 Integration Tests (`integration` tag)
Hook and component interactions:
- State management across hooks
- Real-time updates and synchronization
- Error handling and recovery
- Performance under load

### ⚡ Performance Tests (`performance` tag)
Speed and efficiency validation:
- Page load times (< 2 seconds)
- First Contentful Paint (< 1.5 seconds)
- Largest Contentful Paint (< 2.5 seconds)
- Cumulative Layout Shift (< 0.1)

### 🦽 Accessibility Tests (`accessibility` tag)
WCAG 2.1 AA compliance:
- Keyboard navigation
- Screen reader compatibility
- Color contrast requirements
- Focus management
- Semantic markup validation

## Playwright MCP Integration

This suite leverages Playwright MCP for enhanced testing capabilities:

### Browser Automation
- Real browser rendering and interaction
- Cross-browser compatibility testing
- Mobile device emulation
- Network condition simulation

### Advanced Features
- Visual regression testing
- Performance metric collection
- Accessibility auditing
- Real-time monitoring

### MCP Server Benefits
- Intelligent test orchestration
- Dynamic test data generation
- Advanced debugging capabilities
- Integration with external services

## Configuration

### Test Configuration
Configure test behavior in `playwright-mcp-runner.ts`:

```typescript
const config = {
  browsers: ['chromium', 'firefox', 'webkit'],
  viewports: ['desktop', 'tablet', 'mobile'],
  performance: {
    budgets: {
      loadTime: 3000,
      firstContentfulPaint: 1500,
      largestContentfulPaint: 2500
    }
  },
  accessibility: {
    standards: ['WCAG21AA', 'Section508']
  }
};
```

### Environment Variables
```bash
BASE_URL=http://localhost:3000           # Application URL
CI=true                                  # CI mode (headless)
PERF_BUDGET_LOAD_TIME=3000              # Performance budgets
PERF_BUDGET_FCP=1500
PERF_BUDGET_LCP=2500
TEST_TIMEOUT=60000                      # Default timeout
```

## Test Writing Guidelines

### Page Tests
```typescript
test.describe('Create Token Page', () => {
  test('should complete token creation workflow', async ({ page }) => {
    // Navigate to page
    await page.goto('/create-token');

    // Fill form with valid data
    await page.getByLabel(/Token name/i).fill('Test Token');
    await page.getByLabel(/Token symbol/i).fill('TEST');

    // Navigate through wizard
    await page.getByRole('button', { name: /Next/i }).click();

    // Verify step completion
    await expect(page.getByText('Advanced Features')).toBeVisible();
  });
});
```

### Hook Tests
```typescript
test('should integrate hooks correctly', async ({ page }) => {
  await page.setContent(`
    <div id="root"></div>
    <script type="text/babel">
      const TestComponent = () => {
        const tokenCreation = useTokenCreation();
        const multiChain = useMultiChainDeployment();

        return (
          <div>
            <button onClick={() => tokenCreation.deployToken()}>
              Deploy
            </button>
          </div>
        );
      };

      ReactDOM.render(<TestComponent />, document.getElementById('root'));
    </script>
  `);

  await page.getByRole('button', { name: 'Deploy' }).click();
  // Test hook behavior...
});
```

### Accessibility Tests
```typescript
test('should meet WCAG 2.1 AA standards', async ({ page }) => {
  await page.goto('/create-token');

  // Check keyboard navigation
  await page.keyboard.press('Tab');
  await expect(page.getByLabel(/Token name/i)).toBeFocused();

  // Check ARIA labels
  await expect(page.getByRole('form')).toHaveAttribute('aria-label');

  // Check color contrast (would use axe-core in practice)
  // await injectAxe(page);
  // const violations = await checkA11y(page);
  // expect(violations).toHaveLength(0);
});
```

## Debugging Tests

### Visual Debugging
```bash
# Run tests in headed mode
npm run test:playwright:all -- --headed

# Debug specific test
npm run test:playwright:create-token -- --debug
```

### Screenshots and Videos
Tests automatically capture:
- Screenshots on failure
- Videos for failed test runs
- Traces for debugging

Find artifacts in `test-results/` directory.

### Browser DevTools
```typescript
test('debug test', async ({ page }) => {
  // Open DevTools
  await page.pause();

  // Or add breakpoint
  await page.evaluate(() => debugger);
});
```

## Continuous Integration

### GitHub Actions
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:playwright:all
```

### Test Reports
Tests generate multiple report formats:
- HTML report with screenshots/videos
- JUnit XML for CI integration
- JSON data for custom processing

## Troubleshooting

### Common Issues

**Tests timing out**
```bash
# Increase timeout
npm run test:playwright:all -- --timeout=90000
```

**Browser not found**
```bash
# Reinstall browsers
npx playwright install --force
```

**Flaky tests**
```bash
# Run with retries
npm run test:playwright:all -- --retries=3
```

**Memory issues**
```bash
# Reduce parallel workers
npm run test:playwright:all -- --workers=1
```

### Performance Tips
- Use `page.waitForLoadState()` instead of arbitrary waits
- Leverage `page.locator()` for auto-waiting
- Mock external API calls to reduce flakiness
- Use `test.describe.configure({ mode: 'parallel' })` for independent tests

## Advanced Features

### Custom Matchers
```typescript
// Custom assertion for token validation
expect.extend({
  toBeValidToken(received, expected) {
    const isValid = received.name && received.symbol && received.totalSupply > 0n;
    return {
      message: () => `Expected ${received} to be a valid token`,
      pass: isValid,
    };
  },
});
```

### Page Object Model
```typescript
class CreateTokenPage {
  constructor(public page: Page) {}

  async fillBasicInfo(token: TokenConfig) {
    await this.page.getByLabel(/Token name/i).fill(token.name);
    await this.page.getByLabel(/Token symbol/i).fill(token.symbol);
  }

  async goToNextStep() {
    await this.page.getByRole('button', { name: /Next/i }).click();
  }
}
```

### Test Data Management
```typescript
// Generate test data
const generateTokenConfig = (overrides = {}) => ({
  name: 'Test Token',
  symbol: 'TEST',
  totalSupply: 1000000n,
  decimals: 18,
  ...overrides
});
```

## Contributing

### Adding New Tests
1. Follow naming convention: `feature.playwright.spec.ts`
2. Add appropriate tags for test categorization
3. Include accessibility and performance checks
4. Add mobile viewport testing
5. Update this README with new test descriptions

### Test Guidelines
- Keep tests focused and atomic
- Use descriptive test names
- Include both positive and negative test cases
- Test error states and edge cases
- Validate accessibility requirements
- Monitor performance budgets

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright MCP Integration](https://github.com/microsoft/playwright)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Next.js Testing](https://nextjs.org/docs/testing)

---

**Phase 3.8 Complete** ✅
*Comprehensive frontend implementation with complete Playwright MCP testing suite*