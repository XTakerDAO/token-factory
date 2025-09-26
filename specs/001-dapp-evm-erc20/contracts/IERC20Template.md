# IERC20Template Contract Interface

## Overview
The IERC20Template interface defines the standard for deployable ERC20 token templates with advanced features support.

## Interface Definition

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC20Template is IERC20 {
    // Events
    event Initialized(
        string name,
        string symbol,
        uint256 totalSupply,
        uint8 decimals,
        address owner
    );

    event FeatureEnabled(string feature);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // Errors
    error NotOwner();
    error FeatureNotEnabled(string feature);
    error InvalidAmount();
    error ExceedsMaxSupply();

    // Initialization
    function initialize(
        string calldata name,
        string calldata symbol,
        uint256 totalSupply,
        uint8 decimals,
        address owner,
        bool mintable,
        bool burnable,
        bool pausable,
        bool capped,
        uint256 maxSupply
    ) external;

    // Metadata
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);

    // Feature Flags
    function isMintable() external view returns (bool);
    function isBurnable() external view returns (bool);
    function isPausable() external view returns (bool);
    function isCapped() external view returns (bool);
    function getMaxSupply() external view returns (uint256);

    // Advanced Features (if enabled)
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
    function pause() external;
    function unpause() external;

    // Ownership
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
    function renounceOwnership() external;
}
```

## Implementation Requirements

### Initialization Pattern
- Use OpenZeppelin's Initializable pattern
- Single initialization only
- Set all feature flags during initialization
- Configure initial owner and supply

### Feature Implementation

#### Mintable
```solidity
modifier onlyOwner() {
    if (msg.sender != owner()) revert NotOwner();
    _;
}

modifier whenMintable() {
    if (!isMintable()) revert FeatureNotEnabled("mintable");
    _;
}

function mint(address to, uint256 amount) external onlyOwner whenMintable {
    if (isCapped() && totalSupply() + amount > getMaxSupply()) {
        revert ExceedsMaxSupply();
    }
    _mint(to, amount);
}
```

#### Burnable
- Inherit from OpenZeppelin ERC20Burnable
- Add feature flag validation
- Support both self-burn and approved burn

#### Pausable
- Inherit from OpenZeppelin ERC20Pausable
- Owner can pause/unpause transfers
- Emergency stop mechanism

#### Capped
- Enforce maximum supply limits
- Validate against cap during minting
- Immutable after initialization

### Security Features
- Access control for all privileged functions
- Input validation for all parameters
- Safe arithmetic operations
- Event emission for transparency

### Gas Optimization
- Minimal storage variables
- Efficient modifier checks
- Batch operations where possible
- Optimized inheritance hierarchy

## Template Variations

### BasicERC20Template
- Standard ERC20 functionality only
- No advanced features
- Minimal gas cost
- Suitable for simple tokens

### MintableERC20Template
- ERC20 + Mintable functionality
- Owner can create new tokens
- Optional supply cap
- Suitable for inflationary tokens

### FullFeaturedERC20Template
- All advanced features available
- Maximum flexibility
- Higher deployment cost
- Suitable for complex tokenomics

## Validation Logic

### During Initialization
```solidity
function _validateConfig(
    uint256 totalSupply,
    bool capped,
    uint256 maxSupply
) internal pure {
    require(totalSupply > 0, "Invalid total supply");
    if (capped) {
        require(maxSupply >= totalSupply, "Max supply too low");
        require(maxSupply <= type(uint256).max, "Max supply too high");
    }
}
```

### Runtime Validation
- Check feature flags before operations
- Validate amounts and addresses
- Enforce business logic constraints
- Prevent unauthorized access

## Integration with Factory

### Clone Pattern
- Use OpenZeppelin Clones for gas efficiency
- Each token is a minimal proxy to template
- Template contains implementation logic
- Factory manages template registry

### Deployment Flow
1. Factory receives token configuration
2. Factory validates configuration
3. Factory selects appropriate template
4. Factory clones template contract
5. Factory initializes clone with configuration
6. Factory returns deployed token address

## Upgrade Considerations
- Templates are immutable once deployed
- New templates can be added to factory
- Existing tokens continue using their template
- Gradual migration to new templates possible