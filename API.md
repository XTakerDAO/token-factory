# Token Factory API Documentation

Complete API reference for smart contracts and frontend integration points.

## 📋 Table of Contents

- [Smart Contract APIs](#smart-contract-apis)
  - [TokenFactory Contract](#tokenfactory-contract)
  - [ERC20Template Contract](#erc20template-contract)
- [Frontend Integration APIs](#frontend-integration-apis)
  - [Web3 Hooks](#web3-hooks)
  - [State Management](#state-management)
- [Network Configuration](#network-configuration)
- [Error Handling](#error-handling)

## 🔗 Smart Contract APIs

### TokenFactory Contract

**Contract Address**: See [deployments](./contracts/deployments/) for network-specific addresses

#### Core Functions

##### createToken
Creates a new ERC20 token with specified configuration.

```solidity
function createToken(TokenConfig calldata config)
    external
    payable
    returns (address tokenAddress)
```

**Parameters:**
- `config` (TokenConfig): Token configuration structure

**TokenConfig Structure:**
```solidity
struct TokenConfig {
    string name;           // Token name (max 50 chars)
    string symbol;         // Token symbol (max 10 chars)
    uint256 totalSupply;   // Initial supply (in wei units)
    uint8 decimals;        // Number of decimals (max 18)
    address initialOwner;  // Initial owner address
    bool mintable;         // Enable minting capability
    bool burnable;         // Enable burning capability
    bool pausable;         // Enable pause capability
    bool capped;           // Enable supply cap
    uint256 maxSupply;     // Max supply if capped (0 if not)
}
```

**Returns:**
- `tokenAddress` (address): Address of deployed token

**Reverts:**
- `InvalidConfiguration()`: Invalid configuration parameters
- `InsufficientServiceFee()`: Insufficient fee payment
- `SymbolAlreadyExists()`: Symbol already in use
- `TemplateNotFound()`: Template not available

**Events:**
```solidity
event TokenCreated(
    address indexed tokenAddress,
    address indexed creator,
    string name,
    string symbol,
    uint256 totalSupply,
    uint8 decimals,
    bytes32 configHash
);
```

**Example Usage:**
```javascript
const config = {
    name: "My Token",
    symbol: "MT",
    totalSupply: ethers.parseEther("1000000"),
    decimals: 18,
    initialOwner: userAddress,
    mintable: true,
    burnable: false,
    pausable: false,
    capped: false,
    maxSupply: 0
};

const tx = await tokenFactory.createToken(config, {
    value: await tokenFactory.getServiceFee()
});
```

##### Template Management

###### addTemplate
Adds or updates a token template (owner only).

```solidity
function addTemplate(bytes32 templateId, address implementation) external
```

**Parameters:**
- `templateId` (bytes32): Unique template identifier
- `implementation` (address): Template contract address

**Events:**
```solidity
event TemplateUpdated(bytes32 indexed templateId, address implementation);
```

###### removeTemplate
Removes a token template (owner only).

```solidity
function removeTemplate(bytes32 templateId) external
```

###### getTemplate
Gets template implementation address.

```solidity
function getTemplate(bytes32 templateId) external view returns (address)
```

###### getAllTemplates
Gets all available template IDs.

```solidity
function getAllTemplates() external view returns (bytes32[] memory)
```

##### Configuration Management

###### setServiceFee
Updates service fee (owner only).

```solidity
function setServiceFee(uint256 newFee) external
```

**Parameters:**
- `newFee` (uint256): New fee amount in wei

**Events:**
```solidity
event ServiceFeeUpdated(uint256 newFee, address feeRecipient);
```

###### setFeeRecipient
Updates fee recipient (owner only).

```solidity
function setFeeRecipient(address newRecipient) external
```

**Events:**
```solidity
event FeeRecipientUpdated(address newRecipient);
```

##### View Functions

###### getServiceFee
Gets current service fee.

```solidity
function getServiceFee() external view returns (uint256)
```

###### getFeeRecipient
Gets fee recipient address.

```solidity
function getFeeRecipient() external view returns (address)
```

###### getTokensByCreator
Gets tokens created by a specific address.

```solidity
function getTokensByCreator(address creator) external view returns (address[] memory)
```

###### isTokenDeployed
Checks if a symbol is already deployed.

```solidity
function isTokenDeployed(string calldata symbol) external view returns (bool)
```

###### calculateDeploymentCost
Estimates deployment cost for a configuration.

```solidity
function calculateDeploymentCost(TokenConfig calldata config)
    external
    view
    returns (uint256 gasCost, uint256 serviceFee)
```

###### validateConfiguration
Validates a token configuration.

```solidity
function validateConfiguration(TokenConfig calldata config)
    external
    pure
    returns (bool valid, string memory reason)
```

###### predictTokenAddress
Predicts the deployment address for a configuration.

```solidity
function predictTokenAddress(TokenConfig calldata config, address creator)
    external
    view
    returns (address)
```

##### Statistics

###### getTotalTokensCreated
Gets total number of tokens created.

```solidity
function getTotalTokensCreated() external view returns (uint256)
```

###### getTokensCreatedByUser
Gets number of tokens created by specific user.

```solidity
function getTokensCreatedByUser(address user) external view returns (uint256)
```

###### getTotalFeesCollected
Gets total fees collected by the factory.

```solidity
function getTotalFeesCollected() external view returns (uint256)
```

##### Network Support

###### getChainId
Gets current blockchain ID.

```solidity
function getChainId() external view returns (uint256)
```

###### isChainSupported
Checks if a chain ID is supported.

```solidity
function isChainSupported(uint256 chainId) external pure returns (bool)
```

### ERC20Template Contract

Standard ERC20 implementation with advanced features.

#### Core Features

##### Initialization
Initializes token with configuration.

```solidity
function initialize(
    string memory name,
    string memory symbol,
    uint256 totalSupply,
    uint8 decimals_,
    address initialOwner,
    bool mintable,
    bool burnable,
    bool pausable,
    bool capped,
    uint256 maxSupply
) external
```

##### Standard ERC20 Functions

```solidity
// Standard ERC20
function balanceOf(address account) external view returns (uint256)
function totalSupply() external view returns (uint256)
function transfer(address to, uint256 amount) external returns (bool)
function approve(address spender, uint256 amount) external returns (bool)
function transferFrom(address from, address to, uint256 amount) external returns (bool)
function allowance(address owner, address spender) external view returns (uint256)

// ERC20 Metadata
function name() external view returns (string memory)
function symbol() external view returns (string memory)
function decimals() external view returns (uint8)
```

##### Advanced Features

###### Minting (if enabled)
```solidity
function mint(address to, uint256 amount) external // Owner only
```

###### Burning (if enabled)
```solidity
function burn(uint256 amount) external
function burnFrom(address account, uint256 amount) external
```

###### Pausing (if enabled)
```solidity
function pause() external // Owner only
function unpause() external // Owner only
function paused() external view returns (bool)
```

##### Feature Queries
```solidity
function isMintable() external view returns (bool)
function isBurnable() external view returns (bool)
function isPausable() external view returns (bool)
function isCapped() external view returns (bool)
function maxSupply() external view returns (uint256)
```

## 🌐 Frontend Integration APIs

### Web3 Hooks

#### useTokenFactory
Hook for interacting with TokenFactory contract.

```typescript
interface UseTokenFactoryReturn {
  // Contract instance
  contract: TokenFactory | null

  // Read functions
  getServiceFee: () => Promise<bigint>
  getTokensByCreator: (address: string) => Promise<string[]>
  validateConfiguration: (config: TokenConfig) => Promise<ValidationResult>

  // Write functions
  createToken: (config: TokenConfig) => Promise<TransactionResult>

  // Loading states
  isLoading: boolean
  error: Error | null
}

function useTokenFactory(): UseTokenFactoryReturn
```

**Example:**
```typescript
const { createToken, getServiceFee, isLoading } = useTokenFactory();

const handleCreate = async (config: TokenConfig) => {
  try {
    const result = await createToken(config);
    console.log('Token created:', result.tokenAddress);
  } catch (error) {
    console.error('Creation failed:', error);
  }
};
```

#### useTokenCreation
Hook for managing token creation workflow.

```typescript
interface UseTokenCreationReturn {
  // State
  currentStep: number
  totalSteps: number
  configuration: TokenConfig

  // Actions
  setConfiguration: (config: Partial<TokenConfig>) => void
  nextStep: () => void
  prevStep: () => void
  resetWizard: () => void

  // Validation
  validateCurrentStep: () => Promise<boolean>
  canProceed: boolean

  // Deployment
  deployToken: () => Promise<TransactionResult>
  isDeploying: boolean
  deploymentError: Error | null
}

function useTokenCreation(): UseTokenCreationReturn
```

#### useMultiChainDeployment
Hook for deploying tokens across multiple networks.

```typescript
interface UseMultiChainDeploymentReturn {
  // State
  selectedNetworks: Network[]
  deploymentStatus: Record<number, DeploymentStatus>

  // Actions
  selectNetworks: (networks: Network[]) => void
  deployToNetworks: (config: TokenConfig) => Promise<MultiChainResult>

  // Status
  isDeploying: boolean
  completedDeployments: number
  totalDeployments: number
}

function useMultiChainDeployment(): UseMultiChainDeploymentReturn
```

### State Management

#### Token Configuration Store

```typescript
interface TokenConfigState {
  // Current configuration
  config: TokenConfig

  // Validation
  validation: ValidationState

  // Actions
  updateConfig: (updates: Partial<TokenConfig>) => void
  validateConfig: () => Promise<void>
  resetConfig: () => void

  // Presets
  loadPreset: (presetName: string) => void
  savePreset: (name: string) => void
  getPresets: () => ConfigPreset[]
}

// Usage
const { config, updateConfig, validateConfig } = useTokenConfigStore();
```

#### Wallet Store

```typescript
interface WalletState {
  // Connection
  isConnected: boolean
  address: string | null
  chainId: number | null

  // Network management
  supportedNetworks: Network[]
  currentNetwork: Network | null

  // Actions
  connect: (connector?: string) => Promise<void>
  disconnect: () => Promise<void>
  switchNetwork: (chainId: number) => Promise<void>

  // Token management
  userTokens: Token[]
  refreshTokens: () => Promise<void>
}

// Usage
const { isConnected, connect, switchNetwork } = useWalletStore();
```

## 🌍 Network Configuration

### Supported Networks

```typescript
interface Network {
  id: number
  name: string
  rpcUrl: string
  blockExplorer: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  contracts: {
    tokenFactory: string
    erc20Template: string
  }
}

const NETWORKS: Record<number, Network> = {
  1: {
    id: 1,
    name: "Ethereum Mainnet",
    rpcUrl: "https://mainnet.infura.io/v3/PROJECT_ID",
    blockExplorer: "https://etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    contracts: {
      tokenFactory: "0x...",
      erc20Template: "0x..."
    }
  },
  56: {
    id: 56,
    name: "BSC Mainnet",
    rpcUrl: "https://bsc-dataseed.binance.org",
    blockExplorer: "https://bscscan.com",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    contracts: {
      tokenFactory: "0x...",
      erc20Template: "0x..."
    }
  }
  // ... other networks
};
```

### Network Utilities

```typescript
// Get network configuration
function getNetworkConfig(chainId: number): Network | null

// Check if network is supported
function isSupportedNetwork(chainId: number): boolean

// Get contract address for network
function getContractAddress(chainId: number, contract: string): string

// Format explorer URL
function getExplorerUrl(chainId: number, type: 'tx' | 'address', value: string): string
```

## ⚠️ Error Handling

### Smart Contract Errors

```solidity
// Custom errors
error InvalidConfiguration();
error InsufficientServiceFee();
error SymbolAlreadyExists();
error TemplateNotFound();
error ZeroAddress();
error FeatureNotEnabled(string feature);
error NotOwner();
error InvalidAmount();
```

### Frontend Error Types

```typescript
enum ErrorType {
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  NETWORK_NOT_SUPPORTED = 'NETWORK_NOT_SUPPORTED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

interface AppError {
  type: ErrorType
  message: string
  details?: any
  recoverable: boolean
}

// Error handling utility
function handleError(error: unknown): AppError {
  // Error parsing and transformation logic
}
```

### Common Error Scenarios

#### Wallet Connection Errors
```typescript
// Not connected
if (!isConnected) {
  throw new AppError({
    type: ErrorType.WALLET_NOT_CONNECTED,
    message: "Please connect your wallet",
    recoverable: true
  });
}

// Wrong network
if (!isSupportedNetwork(chainId)) {
  throw new AppError({
    type: ErrorType.NETWORK_NOT_SUPPORTED,
    message: `Network ${chainId} not supported`,
    recoverable: true
  });
}
```

#### Transaction Errors
```typescript
// Insufficient balance
if (balance < requiredAmount) {
  throw new AppError({
    type: ErrorType.INSUFFICIENT_BALANCE,
    message: "Insufficient balance for transaction",
    recoverable: false
  });
}

// Contract revert
catch (error) {
  if (error.reason === "InvalidConfiguration") {
    throw new AppError({
      type: ErrorType.VALIDATION_ERROR,
      message: "Token configuration is invalid",
      details: error,
      recoverable: true
    });
  }
}
```

## 📊 Response Types

### Transaction Result
```typescript
interface TransactionResult {
  hash: string
  tokenAddress?: string
  blockNumber?: number
  gasUsed?: bigint
  effectiveGasPrice?: bigint
  status: 'success' | 'failed'
  events?: Event[]
}
```

### Validation Result
```typescript
interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

interface ValidationError {
  field: string
  message: string
  code: string
}
```

### Multi-Chain Result
```typescript
interface MultiChainResult {
  deployments: Record<number, {
    status: 'success' | 'failed' | 'pending'
    tokenAddress?: string
    error?: Error
  }>
  totalCost: bigint
  successfulDeployments: number
}
```

## 🔧 Rate Limiting

API calls are rate-limited to prevent abuse:

- **Read operations**: 100 requests/minute per IP
- **Write operations**: 10 requests/minute per wallet address
- **Deployment operations**: 5 requests/hour per wallet address

## 📝 SDK Integration

### Installation
```bash
npm install @token-factory/sdk
```

### Quick Start
```typescript
import { TokenFactory, Network } from '@token-factory/sdk';

const factory = new TokenFactory({
  network: Network.ETHEREUM_MAINNET,
  rpcUrl: 'your-rpc-url',
  privateKey: 'your-private-key' // or use wallet
});

// Create token
const config = {
  name: "My Token",
  symbol: "MT",
  totalSupply: "1000000",
  // ... other config
};

const result = await factory.createToken(config);
console.log('Token created:', result.tokenAddress);
```

---

**Need Help?** Check our [troubleshooting guide](./README.md#troubleshooting) or create an issue on GitHub.