// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/v5.0.0/contracts/token/ERC20/ERC20Upgradeable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/v5.0.0/contracts/access/OwnableUpgradeable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/v5.0.0/contracts/proxy/utils/Initializable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/v5.0.0/contracts/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title IERC20Template
 * @dev Interface for deployable ERC20 token templates with advanced features support
 */
interface IERC20Template {
    // Events
    event TokenInitialized(string name, string symbol, uint256 totalSupply, uint8 decimals, address owner);
    event FeatureEnabled(string feature);

    // Errors
    error NotOwner();
    error FeatureNotEnabled(string feature);
    error InvalidAmount();
    error ExceedsMaxSupply();
    error AlreadyInitialized();
    error InvalidConfiguration();
    error TokenIsPaused();

    // Core Factory Functions
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

    // Feature Query Functions
    function isMintable() external view returns (bool);
    function isBurnable() external view returns (bool);
    function isPausable() external view returns (bool);
    function isCapped() external view returns (bool);
    function getMaxSupply() external view returns (uint256);
    function getFeatureFlags() external view returns (bool mintable, bool burnable, bool pausable, bool capped);
    function isInitialized() external view returns (bool);

    // Advanced Features
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
    function pause() external;
    function unpause() external;

    // Proxy Utility Functions
    function getImplementation() external view returns (address);
    function isProxy() external view returns (bool);
}

/**
 * @title MintableERC20Template
 * @dev Mintable ERC20 token template with core minting features:
 *      - Standard ERC20 functionality (transfer, approve, etc.)
 *      - Mintable: Owner can mint new tokens
 *      - Optional supply cap enforcement
 *      - Ownable for access control
 *      - No burning capability
 *      - No pause capability
 *      - Reentrancy protection for minting
 *
 * This template is optimized for tokens that need controlled supply expansion
 * while maintaining gas efficiency and security.
 */
contract MintableERC20Template is
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    IERC20Template
{
    // Feature flags
    bool private _capped;
    uint256 private _maxSupply;
    uint8 private _decimals;

    // Constants for validation
    uint256 private constant MAX_SUPPLY_LIMIT = type(uint256).max;

    /**
     * @dev Modifier to validate amounts
     */
    modifier validAmount(uint256 amount) {
        if (amount == 0) revert InvalidAmount();
        _;
    }

    /**
     * @dev Constructor disabled for proxy pattern
     */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the mintable token with configuration
     */
    function initialize(
        string calldata tokenName,
        string calldata tokenSymbol,
        uint256 totalSupply,
        uint8 tokenDecimals,
        address tokenOwner,
        bool mintable,     // Ignored (always true)
        bool burnable,     // Ignored in mintable template
        bool pausable,     // Ignored in mintable template
        bool capped,       // Used for supply cap
        uint256 maxSupply  // Used if capped is true
    ) external override initializer {
        // Validate configuration (inline for gas efficiency)
        {
            uint256 nameLen = bytes(tokenName).length;
            require(nameLen > 0, "Name too short");
            require(nameLen <= 50, "Name too long");
        }
        {
            uint256 symbolLen = bytes(tokenSymbol).length;
            require(symbolLen > 0, "Symbol too short");
            require(symbolLen <= 10, "Symbol too long");
        }
        require(totalSupply > 0, "Invalid total supply");
        require(tokenDecimals <= 18, "Invalid decimals");
        require(tokenOwner != address(0), "Invalid owner");
        if (capped) {
            require(maxSupply > 0, "Max supply must be positive");
            require(maxSupply >= totalSupply, "Max supply too low");
        }

        // Initialize OpenZeppelin contracts
        __ERC20_init(tokenName, tokenSymbol);
        __Ownable_init(tokenOwner);
        __ReentrancyGuard_init();

        // Store configuration
        _decimals = tokenDecimals;
        _capped = capped;
        if (capped) {
            _maxSupply = maxSupply;
        }

        // Mint initial supply to owner
        _mint(tokenOwner, totalSupply);

        // Emit events
        emit TokenInitialized(tokenName, tokenSymbol, totalSupply, tokenDecimals, tokenOwner);
        emit FeatureEnabled("mintable");

        if (capped) {
            emit FeatureEnabled("capped");
        }
    }

    /**
     * @dev Mint tokens to address (owner only)
     */
    function mint(address to, uint256 amount)
        external
        override
        onlyOwner
        validAmount(amount)
        nonReentrant
    {
        if (to == address(0)) revert InvalidConfiguration();

        // Check supply cap if enabled
        if (_capped && totalSupply() + amount > _maxSupply) {
            revert ExceedsMaxSupply();
        }

        _mint(to, amount);
    }

    // ==================== NOT SUPPORTED FUNCTIONS ====================
    // These functions are required by IERC20Template but not supported in mintable template

    /**
     * @dev Burn function - NOT SUPPORTED in mintable template
     */
    function burn(uint256 amount)
        public
        override
        pure
    {
        revert FeatureNotEnabled("burnable");
    }

    /**
     * @dev Burn from function - NOT SUPPORTED in mintable template
     */
    function burnFrom(address account, uint256 amount)
        public
        override
        pure
    {
        revert FeatureNotEnabled("burnable");
    }

    /**
     * @dev Pause function - NOT SUPPORTED in mintable template
     */
    function pause()
        external
        override
        pure
    {
        revert FeatureNotEnabled("pausable");
    }

    /**
     * @dev Unpause function - NOT SUPPORTED in mintable template
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
     * @dev Check if minting is enabled - always true for mintable template
     */
    function isMintable() external pure override returns (bool) {
        return true;
    }

    /**
     * @dev Check if burning is enabled - always false for mintable template
     */
    function isBurnable() external pure override returns (bool) {
        return false;
    }

    /**
     * @dev Check if pausing is enabled - always false for mintable template
     */
    function isPausable() external pure override returns (bool) {
        return false;
    }

    /**
     * @dev Check if supply is capped
     */
    function isCapped() external view override returns (bool) {
        return _capped;
    }

    /**
     * @dev Get maximum supply (if capped)
     */
    function getMaxSupply() external view override returns (uint256) {
        return _maxSupply;
    }

    /**
     * @dev Get all feature flags at once
     */
    function getFeatureFlags() external view override returns (
        bool mintable,
        bool burnable,
        bool pausable,
        bool capped
    ) {
        return (true, false, false, _capped);
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
     * @dev Paused function - always false for mintable template (no pause capability)
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
        address tokenOwner,
        bool capped,
        uint256 maxSupply
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

        // Validate capped configuration
        if (capped) {
            if (maxSupply == 0) {
                revert InvalidConfiguration();
            }
            if (maxSupply < totalSupply) {
                revert InvalidConfiguration();
            }
            if (maxSupply > MAX_SUPPLY_LIMIT) {
                revert InvalidConfiguration();
            }
        }
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[46] private __gap;
}