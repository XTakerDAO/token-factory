// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IERC20Template.sol";

/**
 * @title BasicERC20Template
 * @dev Basic ERC20 token template with minimal features:
 *      - Standard ERC20 functionality (transfer, approve, etc.)
 *      - Ownable for basic access control
 *      - Fixed supply (no minting capability)
 *      - No burning capability
 *      - No pause capability
 *      - No supply cap (unlimited if minting was enabled)
 *
 * This template is optimized for simple tokens that only need basic ERC20 features.
 * It uses minimal gas and storage while maintaining full ERC20 compatibility.
 */
contract BasicERC20Template is
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    IERC20Template
{
    uint8 private _decimals;

    /**
     * @dev Constructor disabled for proxy pattern
     */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the basic token with configuration
     * @param tokenName Token name
     * @param tokenSymbol Token symbol
     * @param totalSupply Initial token supply (fixed)
     * @param tokenDecimals Number of decimals
     * @param tokenOwner Initial owner address
     * @param mintable Not used in basic template (always false)
     * @param burnable Not used in basic template (always false)
     * @param pausable Not used in basic template (always false)
     * @param capped Not used in basic template (always false)
     * @param maxSupply Not used in basic template (ignored)
     */
    function initialize(
        string calldata tokenName,
        string calldata tokenSymbol,
        uint256 totalSupply,
        uint8 tokenDecimals,
        address tokenOwner,
        bool mintable,     // Ignored in basic template
        bool burnable,     // Ignored in basic template
        bool pausable,     // Ignored in basic template
        bool capped,       // Ignored in basic template
        uint256 maxSupply  // Ignored in basic template
    ) external override initializer {
        // Validate configuration
        _validateInitializationConfig(tokenName, tokenSymbol, totalSupply, tokenDecimals, tokenOwner);

        // Initialize OpenZeppelin contracts
        __ERC20_init(tokenName, tokenSymbol);
        __Ownable_init(tokenOwner);

        // Store decimals
        _decimals = tokenDecimals;

        // Mint initial supply to owner (this is the only minting that will ever happen)
        _mint(tokenOwner, totalSupply);

        // Emit initialization event
        emit TokenInitialized(tokenName, tokenSymbol, totalSupply, tokenDecimals, tokenOwner);
    }

    // ==================== NOT SUPPORTED FUNCTIONS ====================
    // These functions are required by IERC20Template but not supported in basic template

    /**
     * @dev Mint function - NOT SUPPORTED in basic template
     */
    function mint(address to, uint256 amount)
        external
        override
        pure
    {
        revert FeatureNotEnabled("mintable");
    }

    /**
     * @dev Burn function - NOT SUPPORTED in basic template
     */
    function burn(uint256 amount)
        public
        override
        pure
    {
        revert FeatureNotEnabled("burnable");
    }

    /**
     * @dev Burn from function - NOT SUPPORTED in basic template
     */
    function burnFrom(address account, uint256 amount)
        public
        override
        pure
    {
        revert FeatureNotEnabled("burnable");
    }

    /**
     * @dev Pause function - NOT SUPPORTED in basic template
     */
    function pause()
        external
        override
        pure
    {
        revert FeatureNotEnabled("pausable");
    }

    /**
     * @dev Unpause function - NOT SUPPORTED in basic template
     */
    function unpause()
        external
        override
        pure
    {
        revert FeatureNotEnabled("pausable");
    }

    // ==================== VIEW FUNCTIONS ====================

    /**
     * @dev Check if minting is enabled - always false for basic template
     */
    function isMintable() external pure override returns (bool) {
        return false;
    }

    /**
     * @dev Check if burning is enabled - always false for basic template
     */
    function isBurnable() external pure override returns (bool) {
        return false;
    }

    /**
     * @dev Check if pausing is enabled - always false for basic template
     */
    function isPausable() external pure override returns (bool) {
        return false;
    }

    /**
     * @dev Check if supply is capped - always false for basic template
     */
    function isCapped() external pure override returns (bool) {
        return false;
    }

    /**
     * @dev Get maximum supply - always 0 for basic template (no cap)
     */
    function getMaxSupply() external pure override returns (uint256) {
        return 0; // No cap
    }

    /**
     * @dev Get all feature flags at once - all false for basic template
     */
    function getFeatureFlags() external pure override returns (
        bool mintable,
        bool burnable,
        bool pausable,
        bool capped
    ) {
        return (false, false, false, false);
    }

    /**
     * @dev Check if contract is initialized
     */
    function isInitialized() external view override returns (bool) {
        return _getInitializedVersion() != 0;
    }

    // ============== OpenZeppelin Override Functions ==============

    /**
     * @dev Override decimals to return stored value
     */
    function decimals() public view override(ERC20Upgradeable) returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Override name function (required by interface conflicts)
     */
    function name() public view override(ERC20Upgradeable) returns (string memory) {
        return super.name();
    }

    /**
     * @dev Override symbol function (required by interface conflicts)
     */
    function symbol() public view override(ERC20Upgradeable) returns (string memory) {
        return super.symbol();
    }

    /**
     * @dev Override owner function (required by interface conflicts)
     */
    function owner() public view override(OwnableUpgradeable) returns (address) {
        return super.owner();
    }

    /**
     * @dev Paused function - always false for basic template (no pause capability)
     */
    function paused() public pure returns (bool) {
        return false;
    }

    /**
     * @dev Transfer ownership (owner only)
     */
    function transferOwnership(address newOwner)
        public
        override(OwnableUpgradeable)
        onlyOwner
    {
        if (newOwner == address(0)) revert InvalidConfiguration();
        super.transferOwnership(newOwner);
    }

    /**
     * @dev Renounce ownership (owner only)
     */
    function renounceOwnership()
        public
        override(OwnableUpgradeable)
        onlyOwner
    {
        super.renounceOwnership();
    }

    /**
     * @dev Get implementation address (for proxy detection)
     */
    function getImplementation() external view override returns (address) {
        return address(this);
    }

    /**
     * @dev Check if this is a proxy
     */
    function isProxy() external pure override returns (bool) {
        return false;
    }

    // ==================== INTERNAL FUNCTIONS ====================

    /**
     * @dev Validate initialization configuration
     */
    function _validateInitializationConfig(
        string calldata tokenName,
        string calldata tokenSymbol,
        uint256 totalSupply,
        uint8 tokenDecimals,
        address tokenOwner
    ) private pure {
        // Validate name
        if (bytes(tokenName).length == 0 || bytes(tokenName).length > 50) {
            revert InvalidConfiguration();
        }

        // Validate symbol
        if (bytes(tokenSymbol).length == 0 || bytes(tokenSymbol).length > 10) {
            revert InvalidConfiguration();
        }

        // Validate total supply
        if (totalSupply == 0) {
            revert InvalidConfiguration();
        }

        // Validate decimals
        if (tokenDecimals > 18) {
            revert InvalidConfiguration();
        }

        // Validate owner
        if (tokenOwner == address(0)) {
            revert InvalidConfiguration();
        }
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[48] private __gap;
}