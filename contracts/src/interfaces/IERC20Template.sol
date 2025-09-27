// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IERC20Template
 * @dev Interface for deployable ERC20 token templates with advanced features support
 * @notice Extends standard ERC20 functionality with factory-specific features
 */
interface IERC20Template {
    // ============== Factory-Specific Events ==============

    /**
     * @dev Emitted when a token template is initialized
     */
    event TokenInitialized(
        string name,
        string symbol,
        uint256 totalSupply,
        uint8 decimals,
        address owner
    );

    /**
     * @dev Emitted when a feature is enabled during initialization
     */
    event FeatureEnabled(string feature);

    // ============== Custom Errors ==============

    error NotOwner();
    error FeatureNotEnabled(string feature);
    error InvalidAmount();
    error ExceedsMaxSupply();
    error AlreadyInitialized();
    error InvalidConfiguration();
    error TokenIsPaused();

    // ============== Core Factory Functions ==============

    /**
     * @dev Initializes the token template with specified parameters
     * @param tokenName Token name
     * @param tokenSymbol Token symbol
     * @param totalSupply Initial total supply
     * @param tokenDecimals Number of decimals (renamed to avoid shadowing)
     * @param tokenOwner Token owner address
     * @param mintable Whether minting is enabled
     * @param burnable Whether burning is enabled
     * @param pausable Whether pausing is enabled
     * @param capped Whether supply is capped
     * @param maxSupply Maximum supply (if capped)
     */
    function initialize(
        string calldata tokenName,
        string calldata tokenSymbol,
        uint256 totalSupply,
        uint8 tokenDecimals,
        address tokenOwner,
        bool mintable,
        bool burnable,
        bool pausable,
        bool capped,
        uint256 maxSupply
    ) external;

    // ============== Feature Query Functions ==============

    /**
     * @dev Returns whether minting is enabled
     */
    function isMintable() external view returns (bool);

    /**
     * @dev Returns whether burning is enabled
     */
    function isBurnable() external view returns (bool);

    /**
     * @dev Returns whether pausing is enabled
     */
    function isPausable() external view returns (bool);

    /**
     * @dev Returns whether supply is capped
     */
    function isCapped() external view returns (bool);

    /**
     * @dev Returns the maximum supply (if capped)
     */
    function getMaxSupply() external view returns (uint256);

    /**
     * @dev Returns all feature flags in a single call
     */
    function getFeatureFlags() external view returns (bool mintable, bool burnable, bool pausable, bool capped);

    /**
     * @dev Returns whether the token has been initialized
     */
    function isInitialized() external view returns (bool);

    // ============== Advanced Features ==============
    // Note: These functions are only available if the corresponding feature is enabled
    // The actual implementation will check feature flags and revert if not enabled

    /**
     * @dev Mints tokens to specified address (if mintable)
     */
    function mint(address to, uint256 amount) external;

    /**
     * @dev Burns tokens from caller's balance (if burnable)
     */
    function burn(uint256 amount) external;

    /**
     * @dev Burns tokens from specified account (if burnable and approved)
     */
    function burnFrom(address account, uint256 amount) external;

    /**
     * @dev Pauses all transfers (if pausable)
     */
    function pause() external;

    /**
     * @dev Unpauses all transfers (if pausable)
     */
    function unpause() external;

    // ============== Proxy Utility Functions ==============

    /**
     * @dev Returns the implementation address (for proxy patterns)
     */
    function getImplementation() external view returns (address);

    /**
     * @dev Returns whether this is a proxy contract
     */
    function isProxy() external view returns (bool);
}