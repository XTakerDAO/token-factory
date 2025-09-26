# ITokenFactory Contract Interface

## Overview
The ITokenFactory interface defines the core functionality for the upgradeable factory contract that deploys ERC20 tokens with configurable advanced features.

## Interface Definition

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITokenFactory {
    // Events
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply,
        uint8 decimals,
        bytes32 indexed configHash
    );

    event ServiceFeeUpdated(uint256 newFee, address feeRecipient);
    event TemplateUpdated(bytes32 templateId, address implementation);

    // Errors
    error InvalidConfiguration();
    error InsufficientServiceFee();
    error TemplateNotFound();
    error Unauthorized();

    // Structs
    struct TokenConfig {
        string name;
        string symbol;
        uint256 totalSupply;
        uint8 decimals;
        bool mintable;
        bool burnable;
        bool pausable;
        bool capped;
        uint256 maxSupply;
        address initialOwner;
    }

    struct FeatureFlags {
        bool mintable;
        bool burnable;
        bool pausable;
        bool capped;
    }

    // Core Functions
    function createToken(TokenConfig calldata config)
        external
        payable
        returns (address tokenAddress);

    function getServiceFee() external view returns (uint256);
    function setServiceFee(uint256 newFee) external;
    function setFeeRecipient(address newRecipient) external;

    function getTokensByCreator(address creator)
        external
        view
        returns (address[] memory);

    function isTokenDeployed(string calldata symbol)
        external
        view
        returns (bool);

    // Template Management
    function addTemplate(bytes32 templateId, address implementation) external;
    function removeTemplate(bytes32 templateId) external;
    function getTemplate(bytes32 templateId) external view returns (address);

    // Utility Functions
    function calculateDeploymentCost(TokenConfig calldata config)
        external
        view
        returns (uint256 gasCost, uint256 serviceFee);

    function validateConfiguration(TokenConfig calldata config)
        external
        pure
        returns (bool valid, string memory reason);
}
```

## Function Specifications

### createToken
**Purpose**: Deploy a new ERC20 token with specified configuration
**Parameters**:
- `config`: Complete token configuration including features
**Returns**: Address of the deployed token contract
**Requirements**:
- Caller must pay required service fee
- Configuration must be valid
- Token symbol must not already exist
**Events**: Emits `TokenCreated`

### getServiceFee / setServiceFee
**Purpose**: Manage platform service fees
**Access**: `setServiceFee` restricted to contract owner
**Validation**: Fee must be reasonable (< 1 ETH equivalent)

### Template Management
**Purpose**: Support multiple token templates for different feature sets
**Templates**:
- `BASIC_ERC20`: Standard ERC20 without advanced features
- `MINTABLE_ERC20`: ERC20 with minting capabilities
- `FULL_FEATURED`: ERC20 with all advanced features

### Validation Rules
- Token name: 1-50 characters
- Token symbol: 1-10 characters, unique per network
- Total supply: > 0 and <= type(uint256).max
- Decimals: 0-18 inclusive
- If capped, maxSupply must be >= totalSupply
- If mintable and capped, proper validation logic

## Gas Optimization
- Use CREATE2 for deterministic addresses
- Minimize storage writes in deployment
- Batch validation checks
- Efficient event logging

## Security Considerations
- Input validation for all parameters
- Reentrancy protection
- Access control for administrative functions
- Safe math for fee calculations
- Protection against front-running attacks

## Upgrade Compatibility
- Interface must remain backward compatible
- New functions should not break existing integrations
- Event structures should be append-only
- Storage layout must be upgrade-safe