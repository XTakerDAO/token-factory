# Smart Contract Interface Documentation

Technical documentation for TokenFactory and ERC20Template contract interfaces.

## 📋 Interface Definitions

### ITokenFactory Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

interface ITokenFactory {
    // ==================== STRUCTS ====================

    struct TokenConfig {
        string name;           // Token name (e.g., "My Awesome Token")
        string symbol;         // Token symbol (e.g., "MAT")
        uint256 totalSupply;   // Initial supply in wei (e.g., 1000000 * 10^18)
        uint8 decimals;        // Decimal places (typically 18)
        address initialOwner;  // Address that will own the token
        bool mintable;         // Can create new tokens
        bool burnable;         // Can destroy tokens
        bool pausable;         // Can pause all transfers
        bool capped;           // Has maximum supply limit
        uint256 maxSupply;     // Maximum supply if capped (0 if not capped)
    }

    // ==================== EVENTS ====================

    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply,
        uint8 decimals,
        bytes32 configHash
    );

    event ServiceFeeUpdated(uint256 newFee, address feeRecipient);
    event FeeRecipientUpdated(address newRecipient);
    event TemplateUpdated(bytes32 indexed templateId, address implementation);

    // ==================== ERRORS ====================

    error InvalidConfiguration();
    error InsufficientServiceFee();
    error SymbolAlreadyExists();
    error TemplateNotFound();
    error ZeroAddress();

    // ==================== MAIN FUNCTIONS ====================

    /**
     * @notice Create a new ERC20 token with specified configuration
     * @param config Token configuration parameters
     * @return tokenAddress Address of the deployed token contract
     *
     * Requirements:
     * - msg.value must equal or exceed service fee
     * - Token symbol must be unique
     * - Configuration must be valid
     * - Caller must pay gas for deployment
     */
    function createToken(TokenConfig calldata config)
        external
        payable
        returns (address tokenAddress);

    // ==================== TEMPLATE MANAGEMENT ====================

    /**
     * @notice Add or update a token template (owner only)
     * @param templateId Unique identifier for the template
     * @param implementation Address of the template contract
     */
    function addTemplate(bytes32 templateId, address implementation) external;

    /**
     * @notice Remove a token template (owner only)
     * @param templateId Template to remove
     */
    function removeTemplate(bytes32 templateId) external;

    /**
     * @notice Get template implementation address
     * @param templateId Template identifier
     * @return implementation Template contract address (0x0 if not found)
     */
    function getTemplate(bytes32 templateId) external view returns (address implementation);

    /**
     * @notice Get all available template IDs
     * @return templateIds Array of template identifiers
     */
    function getAllTemplates() external view returns (bytes32[] memory templateIds);

    // ==================== FEE MANAGEMENT ====================

    /**
     * @notice Set service fee amount (owner only)
     * @param newFee Fee amount in wei
     */
    function setServiceFee(uint256 newFee) external;

    /**
     * @notice Set fee recipient address (owner only)
     * @param newRecipient Address to receive fees
     */
    function setFeeRecipient(address newRecipient) external;

    /**
     * @notice Get current service fee
     * @return fee Service fee in wei
     */
    function getServiceFee() external view returns (uint256 fee);

    /**
     * @notice Get fee recipient address
     * @return recipient Address that receives fees
     */
    function getFeeRecipient() external view returns (address recipient);

    // ==================== QUERY FUNCTIONS ====================

    /**
     * @notice Get tokens created by a specific creator
     * @param creator Creator address
     * @return tokens Array of token addresses
     */
    function getTokensByCreator(address creator) external view returns (address[] memory tokens);

    /**
     * @notice Check if a token symbol is already deployed
     * @param symbol Token symbol to check
     * @return deployed True if symbol exists
     */
    function isTokenDeployed(string calldata symbol) external view returns (bool deployed);

    /**
     * @notice Calculate deployment cost for a configuration
     * @param config Token configuration
     * @return gasCost Estimated gas cost
     * @return serviceFee Service fee amount
     */
    function calculateDeploymentCost(TokenConfig calldata config)
        external
        view
        returns (uint256 gasCost, uint256 serviceFee);

    /**
     * @notice Validate token configuration
     * @param config Configuration to validate
     * @return valid True if configuration is valid
     * @return reason Error message if invalid
     */
    function validateConfiguration(TokenConfig calldata config)
        external
        pure
        returns (bool valid, string memory reason);

    // ==================== NETWORK SUPPORT ====================

    /**
     * @notice Get current blockchain ID
     * @return chainId Current chain ID
     */
    function getChainId() external view returns (uint256 chainId);

    /**
     * @notice Check if a chain ID is supported
     * @param chainId Chain ID to check
     * @return supported True if chain is supported
     */
    function isChainSupported(uint256 chainId) external pure returns (bool supported);

    // ==================== STATISTICS ====================

    /**
     * @notice Get total number of tokens created
     * @return total Total tokens created by this factory
     */
    function getTotalTokensCreated() external view returns (uint256 total);

    /**
     * @notice Get number of tokens created by specific user
     * @param user User address
     * @return count Number of tokens created by user
     */
    function getTokensCreatedByUser(address user) external view returns (uint256 count);

    /**
     * @notice Get total fees collected by the factory
     * @return total Total fees collected in wei
     */
    function getTotalFeesCollected() external view returns (uint256 total);
}
```

### IERC20Template Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC20Template is IERC20 {
    // ==================== EVENTS ====================

    event TokenInitialized(
        string name,
        string symbol,
        uint256 totalSupply,
        address owner
    );

    event FeatureEnabled(string feature, bool enabled);

    // ==================== ERRORS ====================

    error FeatureNotEnabled(string feature);
    error InvalidAmount();
    error NotOwner();
    error AlreadyInitialized();

    // ==================== INITIALIZATION ====================

    /**
     * @notice Initialize the token with configuration
     * @param name Token name
     * @param symbol Token symbol
     * @param totalSupply Initial supply (in wei)
     * @param decimals_ Number of decimal places
     * @param initialOwner Address that will own the token
     * @param mintable Enable minting capability
     * @param burnable Enable burning capability
     * @param pausable Enable pause capability
     * @param capped Enable supply cap
     * @param maxSupply Maximum supply if capped
     *
     * Requirements:
     * - Can only be called once
     * - Must be called during deployment
     * - All addresses must be non-zero
     */
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
    ) external;

    // ==================== ADVANCED FEATURES ====================

    /**
     * @notice Mint new tokens (if mintable is enabled)
     * @param to Recipient address
     * @param amount Amount to mint (in wei)
     *
     * Requirements:
     * - Only owner can call
     * - Mintable feature must be enabled
     * - Must not exceed max supply if capped
     */
    function mint(address to, uint256 amount) external;

    /**
     * @notice Burn tokens from caller's balance (if burnable is enabled)
     * @param amount Amount to burn (in wei)
     *
     * Requirements:
     * - Burnable feature must be enabled
     * - Caller must have sufficient balance
     */
    function burn(uint256 amount) external;

    /**
     * @notice Burn tokens from specified account (if burnable is enabled)
     * @param account Account to burn from
     * @param amount Amount to burn (in wei)
     *
     * Requirements:
     * - Burnable feature must be enabled
     * - Caller must have sufficient allowance
     * - Account must have sufficient balance
     */
    function burnFrom(address account, uint256 amount) external;

    /**
     * @notice Pause all token transfers (if pausable is enabled)
     *
     * Requirements:
     * - Only owner can call
     * - Pausable feature must be enabled
     * - Contract must not be already paused
     */
    function pause() external;

    /**
     * @notice Unpause token transfers (if pausable is enabled)
     *
     * Requirements:
     * - Only owner can call
     * - Pausable feature must be enabled
     * - Contract must be paused
     */
    function unpause() external;

    // ==================== QUERY FUNCTIONS ====================

    /**
     * @notice Check if minting is enabled
     * @return enabled True if minting is available
     */
    function isMintable() external view returns (bool enabled);

    /**
     * @notice Check if burning is enabled
     * @return enabled True if burning is available
     */
    function isBurnable() external view returns (bool enabled);

    /**
     * @notice Check if pausing is enabled
     * @return enabled True if pausing is available
     */
    function isPausable() external view returns (bool enabled);

    /**
     * @notice Check if token has a supply cap
     * @return enabled True if token is capped
     */
    function isCapped() external view returns (bool enabled);

    /**
     * @notice Get maximum supply (if capped)
     * @return maxSupply Maximum token supply (0 if not capped)
     */
    function maxSupply() external view returns (uint256 maxSupply);

    /**
     * @notice Check if token transfers are currently paused
     * @return paused True if paused
     */
    function paused() external view returns (bool paused);

    /**
     * @notice Get token owner address
     * @return owner Address of the token owner
     */
    function owner() external view returns (address owner);
}
```

## 🔗 Interface Integration Examples

### Creating a Token with JavaScript/TypeScript

```typescript
import { ethers } from 'ethers';

// TokenFactory ABI (abbreviated)
const FACTORY_ABI = [
    "function createToken((string,string,uint256,uint8,address,bool,bool,bool,bool,uint256)) payable returns (address)",
    "function getServiceFee() view returns (uint256)",
    "function validateConfiguration((string,string,uint256,uint8,address,bool,bool,bool,bool,uint256)) pure returns (bool,string)",
    "event TokenCreated(address indexed,address indexed,string,string,uint256,uint8,bytes32)"
];

// Connect to contract
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

// Prepare token configuration
const tokenConfig = {
    name: "My Awesome Token",
    symbol: "MAT",
    totalSupply: ethers.parseEther("1000000"), // 1M tokens
    decimals: 18,
    initialOwner: await signer.getAddress(),
    mintable: true,
    burnable: false,
    pausable: false,
    capped: true,
    maxSupply: ethers.parseEther("10000000") // 10M max
};

// Validate configuration
const [valid, reason] = await factory.validateConfiguration(tokenConfig);
if (!valid) {
    throw new Error(`Invalid configuration: ${reason}`);
}

// Get service fee
const serviceFee = await factory.getServiceFee();

// Create token
const tx = await factory.createToken(tokenConfig, { value: serviceFee });
const receipt = await tx.wait();

// Get token address from event
const event = receipt.events.find(e => e.event === 'TokenCreated');
const tokenAddress = event.args.tokenAddress;

console.log('Token deployed at:', tokenAddress);
```

### Interacting with Created Token

```typescript
// ERC20Template ABI (abbreviated)
const TOKEN_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function mint(address,uint256)",
    "function isMintable() view returns (bool)",
    "function owner() view returns (address)"
];

// Connect to deployed token
const token = new ethers.Contract(tokenAddress, TOKEN_ABI, signer);

// Check token details
const name = await token.name();
const symbol = await token.symbol();
const totalSupply = await token.totalSupply();

console.log(`Token: ${name} (${symbol})`);
console.log(`Total Supply: ${ethers.formatEther(totalSupply)}`);

// Check if minting is enabled
const isMintable = await token.isMintable();
if (isMintable) {
    // Mint additional tokens (only owner can do this)
    const mintTx = await token.mint(
        recipientAddress,
        ethers.parseEther("1000") // Mint 1000 tokens
    );
    await mintTx.wait();
    console.log('Minted 1000 tokens to', recipientAddress);
}
```

### Template ID Constants

```solidity
// Template identifiers used in the factory
bytes32 public constant BASIC_ERC20 = keccak256("BASIC_ERC20");
bytes32 public constant MINTABLE_ERC20 = keccak256("MINTABLE_ERC20");
bytes32 public constant FULL_FEATURED = keccak256("FULL_FEATURED");

// Calculate template ID for custom template
bytes32 customId = keccak256("CUSTOM_TEMPLATE_NAME");
```

## 🛡️ Security Considerations

### Access Control

- **Factory Owner**: Can add/remove templates, set fees, upgrade contract
- **Token Owner**: Can mint (if enabled), pause (if enabled), burn from allowances
- **Token Holders**: Can transfer, approve, burn their own tokens (if enabled)

### Validation Requirements

#### TokenConfig Validation
- `name`: Must not be empty, max 50 characters
- `symbol`: Must not be empty, max 10 characters, must be unique
- `totalSupply`: Must be greater than 0
- `decimals`: Must be ≤ 18
- `initialOwner`: Must not be zero address
- `maxSupply`: Must be ≥ totalSupply if capped is true

#### Feature Constraints
- Mintable + Capped: New mints cannot exceed maxSupply
- Pausable: Affects all transfers when paused
- Burnable: Only burns from caller's balance or approved allowance

### Gas Considerations

#### Factory Operations
- `createToken`: ~280K-450K gas (varies by features)
- `addTemplate`: ~45K gas
- `removeTemplate`: ~25K-55K gas (varies by array position)

#### Token Operations
- Standard transfers: ~21K gas
- Mint operation: ~45K gas
- Burn operation: ~35K gas
- Pause/unpause: ~25K gas

## 📊 Event Monitoring

### Factory Events

```typescript
// Listen for token creation events
factory.on('TokenCreated', (tokenAddress, creator, name, symbol, totalSupply, decimals, configHash) => {
    console.log('New token created:', {
        address: tokenAddress,
        creator,
        name,
        symbol,
        supply: ethers.formatUnits(totalSupply, decimals)
    });
});

// Listen for fee updates
factory.on('ServiceFeeUpdated', (newFee, feeRecipient) => {
    console.log('Service fee updated:', ethers.formatEther(newFee), 'ETH');
});
```

### Token Events

```typescript
// Standard ERC20 events
token.on('Transfer', (from, to, amount) => {
    if (from === ethers.ZeroAddress) {
        console.log('Minted:', ethers.formatEther(amount), 'tokens to', to);
    } else if (to === ethers.ZeroAddress) {
        console.log('Burned:', ethers.formatEther(amount), 'tokens from', from);
    } else {
        console.log('Transferred:', ethers.formatEther(amount), 'tokens from', from, 'to', to);
    }
});

// Approval events
token.on('Approval', (owner, spender, amount) => {
    console.log('Approval:', owner, 'approved', ethers.formatEther(amount), 'tokens for', spender);
});
```

## 🔧 Testing Interface Compliance

### Foundry Tests

```solidity
// Test interface compliance
contract InterfaceTest is Test {
    function testFactoryInterface() public {
        // Verify factory implements ITokenFactory
        assertTrue(factory.supportsInterface(type(ITokenFactory).interfaceId));
    }

    function testTokenInterface() public {
        // Deploy token and verify interfaces
        address token = factory.createToken(config);

        // Check ERC20 compliance
        assertTrue(IERC20(token).totalSupply() > 0);
        assertTrue(IERC20Template(token).isMintable() == config.mintable);
    }
}
```

### TypeScript Interface Validation

```typescript
// Type-safe contract interaction
interface TokenFactoryContract {
    createToken(config: TokenConfig, overrides?: PayableOverrides): Promise<TransactionResponse>;
    getServiceFee(): Promise<bigint>;
    validateConfiguration(config: TokenConfig): Promise<[boolean, string]>;
}

// Runtime validation
function validateTokenConfig(config: any): config is TokenConfig {
    return (
        typeof config.name === 'string' &&
        typeof config.symbol === 'string' &&
        typeof config.totalSupply === 'bigint' &&
        typeof config.decimals === 'number' &&
        typeof config.initialOwner === 'string' &&
        typeof config.mintable === 'boolean' &&
        typeof config.burnable === 'boolean' &&
        typeof config.pausable === 'boolean' &&
        typeof config.capped === 'boolean' &&
        typeof config.maxSupply === 'bigint'
    );
}
```

---

This interface documentation provides the complete technical specification for integrating with the Token Factory smart contracts. For implementation examples, see the [API documentation](../API.md) and frontend source code.