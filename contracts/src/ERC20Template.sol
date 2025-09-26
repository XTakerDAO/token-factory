// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IERC20Template.sol";

/**
 * @title ERC20Template
 * @dev Advanced ERC20 token template with configurable features:
 *      - Mintable: Owner can mint new tokens
 *      - Burnable: Tokens can be burned
 *      - Pausable: All transfers can be paused
 *      - Capped: Maximum supply can be enforced
 *      - Ownable: Access control for privileged functions
 * 
 * Security Features:
 *      - Reentrancy protection
 *      - Input validation
 *      - Feature flag enforcement
 *      - Safe math operations
 * 
 * Gas Optimized:
 *      - Minimal storage usage
 *      - Efficient modifiers
 *      - Batch operations support
 */
contract ERC20Template is 
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PausableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    IERC20Template
{
    // Feature flags packed into single storage slot for gas efficiency
    struct Features {
        bool mintable;
        bool burnable;
        bool pausable;
        bool capped;
    }

    Features private _features;
    uint256 private _maxSupply;
    bool private _initialized;
    uint8 private _decimals;

    // Constants for validation
    uint256 private constant MAX_SUPPLY_LIMIT = type(uint256).max;
    uint8 private constant MAX_DECIMALS = 77; // Reasonable upper bound

    /**
     * @dev Modifier to check if feature is enabled
     */
    modifier whenFeatureEnabled(string memory feature) {
        if (keccak256(bytes(feature)) == keccak256(bytes("mintable"))) {
            if (!_features.mintable) revert FeatureNotEnabled("mintable");
        } else if (keccak256(bytes(feature)) == keccak256(bytes("burnable"))) {
            if (!_features.burnable) revert FeatureNotEnabled("burnable");
        } else if (keccak256(bytes(feature)) == keccak256(bytes("pausable"))) {
            if (!_features.pausable) revert FeatureNotEnabled("pausable");
        }
        _;
    }

    /**
     * @dev Modifier to validate amounts
     */
    modifier validAmount(uint256 amount) {
        if (amount == 0) revert InvalidAmount();
        _;
    }

    /**
     * @dev Modifier to check owner access
     */
    modifier onlyTokenOwner() {
        if (_msgSender() != owner()) revert NotOwner();
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
     * @dev Initialize the token with configuration
     * @param name Token name
     * @param symbol Token symbol
     * @param totalSupply Initial token supply
     * @param decimals Number of decimals
     * @param owner Initial owner address
     * @param mintable Enable minting capability
     * @param burnable Enable burning capability
     * @param pausable Enable pause capability
     * @param capped Enable supply cap
     * @param maxSupply Maximum token supply (if capped)
     */
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
    ) external override initializer {
        // Prevent re-initialization
        if (_initialized) revert AlreadyInitialized();

        // Validate configuration
        _validateInitializationConfig(name, symbol, totalSupply, decimals, owner, capped, maxSupply);

        // Initialize OpenZeppelin contracts
        __ERC20_init(name, symbol);
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __Ownable_init(owner);
        __ReentrancyGuard_init();

        // Store decimals
        _decimals = decimals;

        // Set feature flags
        _features = Features({
            mintable: mintable,
            burnable: burnable,
            pausable: pausable,
            capped: capped
        });

        // Set max supply if capped
        if (capped) {
            _maxSupply = maxSupply;
        }

        // Mint initial supply to owner
        _mint(owner, totalSupply);

        // Mark as initialized
        _initialized = true;

        // Emit events
        emit Initialized(name, symbol, totalSupply, decimals, owner);
        
        if (mintable) emit FeatureEnabled("mintable");
        if (burnable) emit FeatureEnabled("burnable");
        if (pausable) emit FeatureEnabled("pausable");
        if (capped) emit FeatureEnabled("capped");
    }

    /**
     * @dev Mint tokens to address (owner only)
     */
    function mint(address to, uint256 amount) 
        external 
        override 
        onlyTokenOwner 
        whenFeatureEnabled("mintable")
        validAmount(amount)
        nonReentrant 
    {
        if (to == address(0)) revert InvalidConfiguration();
        
        // Check supply cap
        if (_features.capped && totalSupply() + amount > _maxSupply) {
            revert ExceedsMaxSupply();
        }

        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from caller's balance
     */
    function burn(uint256 amount) 
        public 
        override(ERC20BurnableUpgradeable, IERC20Template)
        whenFeatureEnabled("burnable")
        validAmount(amount)
    {
        super.burn(amount);
    }

    /**
     * @dev Burn tokens from account with allowance
     */
    function burnFrom(address account, uint256 amount) 
        public 
        override(ERC20BurnableUpgradeable, IERC20Template)
        whenFeatureEnabled("burnable")
        validAmount(amount)
    {
        super.burnFrom(account, amount);
    }

    /**
     * @dev Pause all token transfers (owner only)
     */
    function pause() 
        external 
        override 
        onlyTokenOwner 
        whenFeatureEnabled("pausable") 
    {
        _pause();
        emit TokenPaused();
    }

    /**
     * @dev Unpause token transfers (owner only)
     */
    function unpause() 
        external 
        override 
        onlyTokenOwner 
        whenFeatureEnabled("pausable") 
    {
        _unpause();
        emit TokenUnpaused();
    }

    /**
     * @dev Transfer ownership (owner only)
     */
    function transferOwnership(address newOwner) 
        public 
        override(OwnableUpgradeable, IERC20Template) 
        onlyTokenOwner 
    {
        if (newOwner == address(0)) revert InvalidConfiguration();
        super.transferOwnership(newOwner);
    }

    /**
     * @dev Renounce ownership (owner only)
     */
    function renounceOwnership() 
        public 
        override(OwnableUpgradeable, IERC20Template) 
        onlyTokenOwner 
    {
        super.renounceOwnership();
    }

    // ==================== VIEW FUNCTIONS ====================

    /**
     * @dev Check if minting is enabled
     */
    function isMintable() external view override returns (bool) {
        return _features.mintable;
    }

    /**
     * @dev Check if burning is enabled
     */
    function isBurnable() external view override returns (bool) {
        return _features.burnable;
    }

    /**
     * @dev Check if pausing is enabled
     */
    function isPausable() external view override returns (bool) {
        return _features.pausable;
    }

    /**
     * @dev Check if supply is capped
     */
    function isCapped() external view override returns (bool) {
        return _features.capped;
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
        return (_features.mintable, _features.burnable, _features.pausable, _features.capped);
    }

    /**
     * @dev Check if contract is initialized
     */
    function isInitialized() external view override returns (bool) {
        return _initialized;
    }

    /**
     * @dev Override decimals to return stored value
     */
    function decimals() public view override(ERC20Upgradeable, IERC20Template) returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Get implementation address (for proxy detection)
     */
    function getImplementation() external view override returns (address) {
        // This would be overridden in the actual proxy
        return address(this);
    }

    /**
     * @dev Check if this is a proxy
     */
    function isProxy() external pure override returns (bool) {
        // This would be overridden in the actual proxy
        return false;
    }

    // ==================== INTERNAL FUNCTIONS ====================

    /**
     * @dev Override _update to add pausable functionality and additional checks
     */
    function _update(address from, address to, uint256 value) 
        internal 
        override(ERC20Upgradeable, ERC20PausableUpgradeable) 
    {
        // Check if paused (only if pausable feature is enabled)
        if (_features.pausable && paused()) {
            revert TokenPaused();
        }

        super._update(from, to, value);
    }


    /**
     * @dev Validate initialization configuration
     */
    function _validateInitializationConfig(
        string calldata name,
        string calldata symbol,
        uint256 totalSupply,
        uint8 decimals,
        address owner,
        bool capped,
        uint256 maxSupply
    ) private pure {
        // Validate name
        if (bytes(name).length == 0 || bytes(name).length > 50) {
            revert InvalidConfiguration();
        }

        // Validate symbol
        if (bytes(symbol).length == 0 || bytes(symbol).length > 10) {
            revert InvalidConfiguration();
        }

        // Validate total supply
        if (totalSupply == 0) {
            revert("Invalid total supply");
        }

        // Validate decimals
        if (decimals > MAX_DECIMALS) {
            revert("Invalid decimals");
        }

        // Validate owner
        if (owner == address(0)) {
            revert("Invalid owner address");
        }

        // Validate capped configuration
        if (capped) {
            if (maxSupply == 0) {
                revert("Invalid max supply for capped token");
            }
            if (maxSupply < totalSupply) {
                revert("Max supply too low");
            }
            if (maxSupply > MAX_SUPPLY_LIMIT) {
                revert("Max supply too high");
            }
        }
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[45] private __gap;
}