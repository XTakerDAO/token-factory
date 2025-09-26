// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

/**
 * @title ITokenFactory
 * @dev Interface for the upgradeable factory contract that deploys ERC20 tokens
 * with configurable advanced features
 */
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
    event FeeRecipientUpdated(address indexed newRecipient);

    // Errors
    error InvalidConfiguration();
    error InsufficientServiceFee();
    error TemplateNotFound();
    error Unauthorized();
    error SymbolAlreadyExists();
    error ZeroAddress();

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
    function getFeeRecipient() external view returns (address);

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
    function getAllTemplates() external view returns (bytes32[] memory);

    // Utility Functions
    function calculateDeploymentCost(TokenConfig calldata config)
        external
        view
        returns (uint256 gasCost, uint256 serviceFee);

    function validateConfiguration(TokenConfig calldata config)
        external
        pure
        returns (bool valid, string memory reason);

    // Multi-chain Support
    function getChainId() external view returns (uint256);
    function isChainSupported(uint256 chainId) external pure returns (bool);

    // Statistics
    function getTotalTokensCreated() external view returns (uint256);
    function getTokensCreatedByUser(address user) external view returns (uint256);
    function getTotalFeesCollected() external view returns (uint256);
}