# Token Factory Smart Contracts - Development Guidelines

Smart contract repository for ERC20 token factory development. Last updated: 2025-09-27

## Active Technologies
- Solidity ^0.8.21, Foundry, OpenZeppelin Contracts v5.0, Node.js 18+

## Project Structure
```
contracts/
├── src/           # Smart contract source code
│   ├── TokenFactory.sol
│   ├── templates/  # Token templates
│   └── interfaces/ # Contract interfaces
├── test/          # Contract tests (unit, integration, fuzz)
│   ├── unit/      # Unit tests
│   ├── integration/ # Integration tests
│   └── fuzzing/   # Fuzz tests
├── script/        # Deployment and utility scripts
│   ├── Deploy.s.sol
│   └── utils/     # Deployment utilities
├── lib/           # Dependencies via forge install
└── deployments/   # Network deployments
```

## Development Commands
```bash
# Build and test
npm run build      # Build contracts
npm test          # Run all tests
npm run test:coverage  # Coverage analysis
npm run test:gas      # Gas usage analysis

# Development
npm run fmt       # Format code
npm run lint      # Check formatting
npm run test:watch    # Watch mode testing

# Deployment
npm run deploy:local     # Deploy to Anvil
npm run deploy:sepolia   # Deploy to Sepolia testnet
npm run deploy:mainnet   # Deploy to mainnet

# Analysis
npm run slither   # Security analysis
npm run doc      # Generate documentation
```

## Code Style
- **Solidity**: OpenZeppelin standards with NatSpec documentation
- **Testing**: Foundry Test with comprehensive coverage
- **Gas Optimization**: Target <300K gas for token creation
- **Security**: Follow OpenZeppelin security patterns

## Environment Setup
Required environment variables in `contracts/.env`:
```bash
PRIVATE_KEY=your_private_key
INFURA_API_KEY=your_infura_key
ETHERSCAN_API_KEY=your_etherscan_key
BSCSCAN_API_KEY=your_bscscan_key
```

## Testing Strategy
- **Unit Tests**: Individual contract functions
- **Integration Tests**: Complete deployment flows
- **Fuzz Tests**: Edge cases with random inputs
- **Gas Analysis**: Optimization and cost tracking
- **Security Tests**: Slither static analysis

## Recent Changes
- 2025-09-27: Converted from full-stack DApp to pure smart contract repository
- Removed all frontend dependencies and files
- Updated to Foundry-only development workflow
- Enhanced testing structure with unit/integration/fuzz tests
- Updated documentation to focus on smart contract development

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->