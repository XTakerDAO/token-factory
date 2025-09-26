# Quickstart Guide: Token Creator DApp

## Development Environment Setup

### Prerequisites
- Node.js 18+ with pnpm
- Git
- Modern web browser with Web3 wallet

### Initial Setup

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd token-factory

# Install frontend dependencies
cd frontend
pnpm install

# Install contract dependencies
cd ../contracts
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge install
```

2. **Environment Configuration**
```bash
# Frontend environment
cp frontend/.env.example frontend/.env.local

# Edit environment variables
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_ENVIRONMENT=development
```

3. **Local Blockchain Setup**
```bash
# Start local Anvil chain
anvil --chain-id 31337 --accounts 10 --balance 10000

# Deploy contracts to local chain
cd contracts
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast --private-key 0x...
```

## Development Workflow

### Frontend Development
```bash
cd frontend
pnpm dev
# Open http://localhost:3000
```

### Contract Development
```bash
cd contracts
# Compile contracts
forge build

# Run tests
forge test -vvv

# Format code
forge fmt
```

### Testing

#### Frontend Testing
```bash
cd frontend
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:coverage
```

#### Contract Testing
```bash
cd contracts
# Run all tests
forge test

# Run specific test
forge test --match-test testTokenCreation

# Gas usage report
forge test --gas-report
```

## Key Features Demonstration

### 1. Basic Token Creation
**User Flow**:
1. Connect Web3 wallet
2. Select target network (ETH/BSC/XSC)
3. Enter token details (name, symbol, supply)
4. Review gas costs and service fees
5. Confirm transaction
6. Receive token contract address

**Expected Result**: ERC20 token deployed with specified parameters

### 2. Advanced Features Configuration
**User Flow**:
1. Follow basic token creation steps 1-3
2. Enable advanced features (mintable/burnable/pausable)
3. Configure permissions and ownership
4. Review feature preview
5. Confirm deployment

**Expected Result**: ERC20 token with selected advanced capabilities

### 3. Multi-Chain Deployment
**User Flow**:
1. Switch between supported networks
2. Verify network-specific settings
3. Deploy identical token on different chains
4. Confirm cross-chain deployment

**Expected Result**: Same token deployed on multiple networks

### 4. XSC Network Compatibility
**User Flow**:
1. Select XSC network (Chain ID: 520)
2. System displays EVM compatibility warning
3. Deploy with pre-Shanghai EVM settings
4. Verify successful deployment

**Expected Result**: Token successfully deployed on XSC network

## API Testing

### Factory Contract Interaction
```bash
# Using cast (Foundry CLI)
cast call <FACTORY_ADDRESS> "getServiceFee()" --rpc-url <RPC_URL>

# Create token via contract
cast send <FACTORY_ADDRESS> "createToken((string,string,uint256,uint8,bool,bool,bool,bool,uint256,address))" \
  "MyToken,MTK,1000000000000000000000000,18,true,false,false,false,0,<OWNER_ADDRESS>" \
  --value 0.01ether --private-key <PRIVATE_KEY> --rpc-url <RPC_URL>
```

### Frontend API Testing
```typescript
// Test wagmi hooks
const { data: balance } = useBalance({
  address: '0x...',
  token: '0x...' // deployed token address
})

// Test viem client
const client = createPublicClient({
  chain: mainnet,
  transport: http()
})

const tokenName = await client.readContract({
  address: '0x...',
  abi: erc20ABI,
  functionName: 'name'
})
```

## Performance Validation

### Frontend Performance Tests
```bash
cd frontend
# Lighthouse CI
pnpm lighthouse

# Bundle analysis
pnpm analyze

# Performance monitoring
pnpm test:performance
```

**Expected Metrics**:
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Time to Interactive: <3s
- Cumulative Layout Shift: <0.1

### Contract Gas Optimization
```bash
cd contracts
# Gas usage analysis
forge test --gas-report

# Optimization verification
forge snapshot --diff
```

**Target Gas Costs**:
- Basic token deployment: <500K gas
- Advanced token deployment: <800K gas
- Factory upgrade: <200K gas

## Security Validation

### Contract Security Checks
```bash
cd contracts
# Static analysis with Slither
slither .

# Mythril analysis
myth analyze contracts/src/TokenFactory.sol

# Formal verification (if applicable)
certoraRun conf/TokenFactory.conf
```

### Frontend Security Tests
```bash
cd frontend
# Security audit
pnpm audit

# OWASP dependency check
pnpm audit --audit-level moderate
```

## Deployment Checklist

### Pre-deployment Verification
- [ ] All tests passing (frontend + contracts)
- [ ] Gas optimization completed
- [ ] Security audits passed
- [ ] Performance metrics met
- [ ] Multi-chain compatibility verified
- [ ] XSC network compatibility confirmed

### Mainnet Deployment Process
1. **Contract Deployment**
```bash
# Deploy factory to each network
forge script script/Deploy.s.sol --network ethereum --broadcast --verify
forge script script/Deploy.s.sol --network bsc --broadcast --verify
forge script script/Deploy.s.sol --network xsc --broadcast --verify
```

2. **Frontend Deployment**
```bash
# Build optimized frontend
cd frontend
pnpm build

# Deploy to hosting platform
pnpm deploy:production
```

3. **Post-deployment Verification**
```bash
# Verify contract functionality
cast call <FACTORY_ADDRESS> "getServiceFee()" --rpc-url <MAINNET_RPC>

# Test frontend connectivity
curl -I https://your-dapp-url.com
```

## Troubleshooting

### Common Issues

#### Wallet Connection Problems
- Ensure wallet is installed and unlocked
- Check network compatibility
- Verify sufficient balance for transactions

#### Contract Deployment Failures
- Check gas price and limits
- Verify contract bytecode size (<24KB)
- Ensure proper constructor parameters

#### Performance Issues
- Use React DevTools Profiler
- Check bundle size with webpack-bundle-analyzer
- Monitor Web3 call frequency

### Debug Tools
```bash
# Contract debugging
forge debug --debug <TX_HASH> --rpc-url <RPC_URL>

# Frontend debugging
cd frontend
pnpm dev --debug

# Network analysis
pnpm test:network
```

## Next Steps

After successful quickstart:
1. Customize UI components and styling
2. Implement additional token templates
3. Add analytics and monitoring
4. Prepare for security audit
5. Plan mainnet deployment strategy

This quickstart guide ensures rapid development environment setup and provides comprehensive testing scenarios for all major features.