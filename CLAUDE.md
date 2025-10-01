# Token Factory Smart Contracts - Development Guidelines

Smart contract repository for ERC20 token factory development. Last updated: 2025-09-27

## Active Technologies
- Solidity ^0.8.20 (London EVM), Foundry, OpenZeppelin Contracts v5.0.0, Node.js 18+

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

## XSC Chain Compatibility

### EVM 版本要求
XSC 链基于 pre-Shanghai EVM，必须使用 **London EVM** 版本：
- `evm_version = "london"` (foundry.toml)
- `via_ir = false` (禁用 IR 优化)
- Solidity 0.8.20 或更早版本

### 已部署合约 (主网)
- **Chain ID**: 520
- **TokenFactory**: `0x3f41Bf6891c4BAF50327D73e0CE3a4bB563f2f1B`
- **RPC**: https://datarpc1.xsc.pub/
- **Explorer**: https://explorer.xsc.pub/

### 部署命令
```bash
cd contracts
forge build --evm-version london
forge script script/DeployXSC.s.sol --broadcast --rpc-url https://datarpc1.xsc.pub/ --legacy -vvvv
```

## Recent Changes
- 2025-10-01: **XSC 主网部署成功**
  * TokenFactory 部署到 XSC 主网 (Chain ID: 520)
  * 地址: 0x3f41Bf6891c4BAF50327D73e0CE3a4bB563f2f1B
  * 使用 London EVM 配置确保兼容性
- 2025-10-01: **升级到 OpenZeppelin v5.0.0**
  * 从 v4.9.6 升级到 v5.0.0
  * 修复所有 API 兼容性问题 (Ownable_init, _update 等)
  * 配置 EVM 版本为 london (XSC 兼容)
- 2025-09-27: Converted from full-stack DApp to pure smart contract repository
  * Removed all frontend dependencies and files
  * Updated to Foundry-only development workflow
  * Enhanced testing structure with unit/integration/fuzz tests
  * Updated documentation to focus on smart contract development

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->