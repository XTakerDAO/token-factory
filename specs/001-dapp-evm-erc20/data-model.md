# Data Model: Token Creator DApp

## Entity Relationship Overview

The Token Creator DApp manages several key entities that work together to provide a seamless token creation experience across multiple blockchain networks.

## Core Entities

### TokenConfiguration
**Purpose**: Represents the complete configuration for a token to be created

**Attributes**:
- `id`: string - Unique identifier for the configuration
- `name`: string - Token name (e.g., "My Token")
- `symbol`: string - Token symbol (e.g., "MTK")
- `totalSupply`: bigint - Initial token supply
- `decimals`: number - Token decimal places (usually 18)
- `advancedFeatures`: AdvancedFeatures - Optional advanced functionality
- `permissionSettings`: PermissionSettings - Ownership and access control
- `networkId`: number - Target blockchain network ID
- `createdAt`: Date - Configuration creation timestamp
- `updatedAt`: Date - Last modification timestamp

**Validation Rules**:
- `name`: 1-50 characters, no special characters
- `symbol`: 1-10 characters, uppercase letters only
- `totalSupply`: > 0, <= 10^77 (uint256 max practical)
- `decimals`: 0-18 inclusive
- `networkId`: Must be in supported networks (1, 56, 520)

**Relationships**:
- Has one `NetworkConfiguration`
- Has one `AdvancedFeatures`
- Has one `PermissionSettings`
- Can have many `TransactionRecord`

### NetworkConfiguration
**Purpose**: Defines blockchain network settings and parameters

**Attributes**:
- `chainId`: number - Blockchain chain identifier
- `name`: string - Human-readable network name
- `nativeTokenSymbol`: string - Native token symbol (ETH, BNB, XSC)
- `rpcEndpoints`: string[] - RPC endpoint URLs
- `explorerUrls`: string[] - Block explorer URLs
- `isTestnet`: boolean - Whether this is a test network
- `evmVersion`: string - EVM version supported ("shanghai", "london", etc.)
- `gasSettings`: GasSettings - Network-specific gas configuration

**Supported Networks**:
```typescript
const NETWORKS = {
  ETHEREUM: { chainId: 1, name: "Ethereum", symbol: "ETH" },
  BSC: { chainId: 56, name: "Binance Smart Chain", symbol: "BNB" },
  XSC: { chainId: 520, name: "XSC Network", symbol: "XSC" }
}
```

### AdvancedFeatures
**Purpose**: Configuration for optional ERC20 extensions

**Attributes**:
- `mintable`: boolean - Allow creation of new tokens after deployment
- `burnable`: boolean - Allow token holders to destroy tokens
- `pausable`: boolean - Allow emergency pause of all transfers
- `capped`: boolean - Enforce maximum supply cap
- `maxSupply`: bigint? - Maximum token supply (if capped)

**Feature Dependencies**:
- `capped` requires `maxSupply` when true
- `mintable` and `capped` can coexist with proper validation
- All features are optional and independent

### PermissionSettings
**Purpose**: Defines ownership and role-based access control

**Attributes**:
- `initialOwner`: string - Ethereum address of initial owner
- `ownerCanMint`: boolean - Owner has minting privileges
- `ownerCanPause`: boolean - Owner can pause/unpause
- `ownerCanBurn`: boolean - Owner can burn any tokens
- `transferOwnership`: boolean - Allow ownership transfer
- `renounceOwnership`: boolean - Allow ownership renouncement

**Validation**:
- `initialOwner`: Must be valid Ethereum address (0x...)
- At least one permission must be granted to owner
- Cannot have minting permissions without mintable feature

### ServiceFeeStructure
**Purpose**: Platform service fee configuration per network

**Attributes**:
- `networkId`: number - Associated blockchain network
- `baseFee`: bigint - Base service fee in network native token
- `percentageFee`: number - Percentage fee (basis points)
- `minimumFee`: bigint - Minimum total fee
- `maximumFee`: bigint - Maximum total fee
- `feeRecipient`: string - Address receiving service fees

### WalletConnection
**Purpose**: Current user wallet connection state

**Attributes**:
- `address`: string? - Connected wallet address
- `chainId`: number? - Current wallet network
- `isConnected`: boolean - Connection status
- `connector`: string? - Wallet connector type (MetaMask, WalletConnect)
- `balance`: bigint? - Native token balance
- `lastConnected`: Date? - Last successful connection time

**State Transitions**:
- Disconnected → Connecting → Connected
- Connected → Switching → Connected (different network)
- Connected → Disconnected (user disconnect/error)

### TransactionRecord
**Purpose**: History of blockchain transactions

**Attributes**:
- `id`: string - Unique transaction identifier
- `hash`: string - Blockchain transaction hash
- `type`: TransactionType - Type of transaction
- `status`: TransactionStatus - Current transaction status
- `networkId`: number - Network where transaction occurred
- `gasUsed`: bigint? - Gas consumed by transaction
- `gasPrice`: bigint? - Gas price used
- `serviceFee`: bigint? - Platform service fee paid
- `blockNumber`: number? - Block containing transaction
- `timestamp`: Date - Transaction submission time
- `tokenAddress`: string? - Deployed token contract address
- `errorMessage`: string? - Error details if failed

**Transaction Types**:
```typescript
enum TransactionType {
  TOKEN_DEPLOYMENT = "token_deployment",
  SERVICE_FEE_PAYMENT = "service_fee_payment",
  NETWORK_SWITCH = "network_switch"
}
```

**Status Transitions**:
- Pending → Confirmed | Failed
- Failed transactions may be retried

### ERC20Contract
**Purpose**: Deployed token contract information

**Attributes**:
- `address`: string - Contract address on blockchain
- `tokenConfiguration`: TokenConfiguration - Original configuration
- `deploymentTransaction`: string - Deployment transaction hash
- `verificationStatus`: VerificationStatus - Contract verification state
- `deployedAt`: Date - Deployment timestamp
- `isActive`: boolean - Whether contract is operational

### FactoryContract
**Purpose**: Upgradeable factory contract state

**Attributes**:
- `address`: string - Factory contract address per network
- `version`: string - Current factory version
- `proxyAdmin`: string - Proxy admin contract address
- `implementation`: string - Current implementation address
- `availableTemplates`: TokenTemplate[] - Available token templates
- `upgradeHistory`: FactoryUpgrade[] - Version upgrade history

### FeaturePreview
**Purpose**: User confirmation summary before deployment

**Attributes**:
- `tokenConfiguration`: TokenConfiguration - Complete token config
- `estimatedGasCost`: bigint - Estimated deployment gas
- `serviceFeeAmount`: bigint - Platform service fee
- `totalCostEstimate`: bigint - Total transaction cost
- `features`: string[] - List of enabled features
- `warnings`: string[] - Configuration warnings
- `isValid`: boolean - Whether configuration is deployable

## Data Flow Patterns

### Token Creation Flow
1. User creates `TokenConfiguration`
2. System validates against `NetworkConfiguration`
3. `AdvancedFeatures` and `PermissionSettings` are configured
4. `FeaturePreview` is generated for confirmation
5. `ServiceFeeStructure` calculates fees
6. `TransactionRecord` tracks deployment
7. `ERC20Contract` stores deployment result

### Multi-Chain Support
- Each `TokenConfiguration` targets one `NetworkConfiguration`
- `WalletConnection` must match target network
- `FactoryContract` deployed separately per network
- `ServiceFeeStructure` varies by network

### State Management
- Frontend state managed by Zustand stores
- Blockchain state queried via viem/wagmi
- Local persistence in browser localStorage
- Cross-tab synchronization for wallet state

## Validation and Constraints

### Business Rules
- Token symbols must be unique per network (enforced by factory)
- Advanced features require corresponding permissions
- XSC network has additional EVM compatibility constraints
- Service fees must be paid before deployment
- Wallet must be connected to target network

### Data Integrity
- All blockchain addresses validated as checksummed
- Token supply arithmetic uses BigInt for precision
- Gas estimates include safety margins
- Transaction records immutable once confirmed

### Security Considerations
- Permission settings validated against feature flags
- Owner addresses validated for correct format
- Service fee calculations protected against overflow
- Factory contract upgrades require multi-sig approval

This data model provides a robust foundation for the Token Creator DApp, ensuring data integrity, security, and scalability across multiple blockchain networks.