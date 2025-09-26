// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IERC20Template
 * @dev Interface for deployable ERC20 token templates with advanced features support
 */
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
    
    // Pausable events
    event Paused(address account);
    event Unpaused(address account);
    
    // Additional transfer events for pausable state
    event TokenPaused();
    event TokenUnpaused();

    // Errors
    error NotOwner();
    error FeatureNotEnabled(string feature);
    error InvalidAmount();
    error ExceedsMaxSupply();
    error AlreadyInitialized();
    error InvalidConfiguration();
    error TokenPaused();

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
    function paused() external view returns (bool);

    // Ownership
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
    function renounceOwnership() external;

    // Proxy functions for testing
    function getImplementation() external view returns (address);
    function isProxy() external view returns (bool);

    // Utility functions
    function getFeatureFlags() external view returns (bool mintable, bool burnable, bool pausable, bool capped);
    function isInitialized() external view returns (bool);
}