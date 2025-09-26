# Contributing to Token Creator DApp

Thank you for your interest in contributing to the Token Creator DApp! This guide will help you get started with contributing to our decentralized token creation platform.

## 🌟 How to Contribute

We welcome contributions in various forms:
- 🐛 Bug reports and fixes
- ✨ New features and enhancements
- 📖 Documentation improvements
- 🧪 Test coverage improvements
- 🎨 UI/UX improvements
- 🔒 Security enhancements

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js 18+ installed
- Foundry installed for smart contract development
- Git configured with your GitHub account
- A code editor (VS Code recommended)

### Development Setup

1. **Fork and Clone**
```bash
git clone https://github.com/YOUR_USERNAME/token-factory.git
cd token-factory
```

2. **Install Dependencies**
```bash
# Install all dependencies
npm run install:all

# Or install separately
cd contracts && npm install
cd ../frontend && npm install
```

3. **Set Up Environment**
```bash
# Copy environment files
cp frontend/.env.example frontend/.env.local
cp contracts/.env.example contracts/.env

# Fill in your API keys and configuration
```

4. **Start Development Environment**
```bash
# Terminal 1: Start local blockchain
cd contracts && anvil

# Terminal 2: Deploy contracts locally
cd contracts && npm run deploy:local

# Terminal 3: Start frontend
cd frontend && npm run dev
```

## 📁 Project Structure

```
token-factory/
├── contracts/              # Smart contracts (Foundry)
│   ├── src/                # Contract source code
│   │   ├── TokenFactory.sol
│   │   ├── ERC20Template.sol
│   │   └── interfaces/
│   ├── test/               # Contract tests
│   ├── script/             # Deployment scripts
│   └── deployments/        # Network configurations
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   ├── components/    # React components
│   │   ├── lib/          # Utilities and configuration
│   │   ├── stores/       # Zustand state management
│   │   └── types/        # TypeScript types
│   ├── tests/            # Frontend tests
│   └── public/           # Static assets
└── specs/                # Project specifications
```

## 🛠️ Development Guidelines

### Smart Contract Development

#### Code Style
- Use Solidity 0.8.21+ with XSC compatibility
- Follow OpenZeppelin patterns for security
- Include comprehensive NatSpec documentation
- Use descriptive variable and function names
- Implement proper access controls

#### Testing Requirements
- Write comprehensive unit tests for all functions
- Include integration tests for complex workflows
- Add gas optimization tests
- Test edge cases and error conditions
- Maintain >95% test coverage

#### Example Smart Contract Test
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "forge-std/Test.sol";
import "../src/TokenFactory.sol";

contract TokenFactoryTest is Test {
    TokenFactory public factory;
    address public owner = makeAddr("owner");

    function setUp() public {
        vm.prank(owner);
        factory = new TokenFactory();
        factory.initialize(owner, owner, 0.01 ether);
    }

    function testCreateBasicToken() public {
        // Test implementation
    }
}
```

### Frontend Development

#### Code Style
- Use TypeScript strict mode
- Follow React best practices and hooks patterns
- Implement proper error handling
- Use semantic HTML for accessibility
- Follow responsive design principles

#### Component Structure
```typescript
// src/components/ExampleComponent.tsx
interface ExampleComponentProps {
  title: string
  onAction: () => void
}

export function ExampleComponent({ title, onAction }: ExampleComponentProps) {
  return (
    <div className="...">
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  )
}
```

#### Testing Requirements
- Write unit tests for all components
- Include integration tests for user workflows
- Add E2E tests using Playwright MCP
- Test accessibility compliance (WCAG 2.1 AA)
- Maintain >90% test coverage

## 🧪 Testing

### Running Tests

**Smart Contracts**:
```bash
cd contracts

# Run all tests
forge test

# Run with coverage
forge coverage

# Run gas report
forge test --gas-report

# Run specific test
forge test --match-test testCreateToken
```

**Frontend**:
```bash
cd frontend

# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run accessibility tests
npm run test:accessibility
```

### Test Requirements

All contributions must include appropriate tests:

1. **Unit Tests**: Test individual functions/components
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test complete user workflows
4. **Accessibility Tests**: Ensure WCAG compliance
5. **Performance Tests**: Validate performance requirements

## 📝 Commit Guidelines

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
git commit -m "feat(contracts): add batch token creation"
git commit -m "fix(frontend): resolve wallet connection timeout"
git commit -m "docs(readme): update installation instructions"
```

## 🔍 Code Review Process

### Before Submitting

1. **Self Review**
   - Review your own code for obvious issues
   - Ensure all tests pass locally
   - Run linting and formatting tools
   - Test the functionality manually

2. **Pre-submission Checklist**
   ```bash
   # Smart contracts
   cd contracts
   forge fmt
   forge test

   # Frontend
   cd frontend
   npm run lint:fix
   npm run type-check
   npm run test
   ```

### Pull Request Process

1. **Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes**
   - Implement your changes
   - Add comprehensive tests
   - Update documentation if needed

3. **Push and Create PR**
```bash
git push origin feature/your-feature-name
```

4. **PR Requirements**
   - Clear title and description
   - Reference related issues
   - Include testing instructions
   - Add screenshots for UI changes

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added for new functionality
- [ ] Documentation updated
```

## 🏷️ Issue Guidelines

### Bug Reports

When reporting bugs, please include:

1. **Environment Information**
   - Operating system and version
   - Browser and version (for frontend issues)
   - Node.js version
   - Network being used

2. **Reproduction Steps**
   - Clear step-by-step instructions
   - Expected vs actual behavior
   - Screenshots or error messages
   - Code snippets if applicable

### Feature Requests

When suggesting features:

1. **Clear Description**
   - What problem does it solve?
   - Who would benefit from this feature?
   - How should it work?

2. **Implementation Ideas**
   - Rough implementation approach
   - Potential challenges
   - Alternative solutions considered

## 🌐 Multi-Chain Considerations

### XSC Network Compatibility
- Ensure Solidity version compatibility (^0.8.19)
- Test gas optimization for XSC network
- Verify pre-Shanghai EVM compatibility
- Include XSC-specific error handling

### Cross-Chain Testing
- Test on all supported networks
- Verify deployment scripts work correctly
- Check gas estimation accuracy
- Validate network switching functionality

## 📚 Resources

### Development Resources
- [Foundry Documentation](https://book.getfoundry.sh/)
- [Next.js Documentation](https://nextjs.org/docs)
- [viem Documentation](https://viem.sh/)
- [wagmi Documentation](https://wagmi.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

### Security Resources
- [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [Solidity Security Patterns](https://github.com/fravoll/solidity-patterns)
- [OWASP Web3 Security](https://owasp.org/www-project-web3-security/)

## 🤝 Community

### Getting Help
- 💬 **Discussions**: Use GitHub Discussions for questions
- 🐛 **Issues**: Create detailed bug reports
- 💡 **Ideas**: Share feature requests and improvements
- 📧 **Direct Contact**: Reach out to maintainers for security issues

### Code of Conduct
- Be respectful and inclusive
- Help others learn and grow
- Give constructive feedback
- Focus on what's best for the community

## 🎉 Recognition

Contributors will be recognized:
- Listed in project documentation
- Mentioned in release notes
- Added to CONTRIBUTORS.md
- GitHub profile highlighted

Thank you for contributing to the Token Creator DApp! Together, we're building the future of decentralized token creation.

---

**Questions?** Don't hesitate to ask in our GitHub Discussions or create an issue.