// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
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
     * @param tokenName Token name
     * @param tokenSymbol Token symbol
     * @param totalSupply Initial token supply
     * @param tokenDecimals Number of decimals
     * @param tokenOwner Initial owner address
     * @param mintable Enable minting capability
     * @param burnable Enable burning capability
     * @param pausable Enable pause capability
     * @param capped Enable supply cap
     * @param maxSupply Maximum token supply (if capped)
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
    ) external override initializer {
        // Validate configuration
        _validateInitializationConfig(tokenName, tokenSymbol, totalSupply, tokenDecimals, tokenOwner, capped, maxSupply);

        // Initialize OpenZeppelin contracts
        __ERC20_init(tokenName, tokenSymbol);
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __Ownable_init();
        _transferOwnership(tokenOwner);
        __ReentrancyGuard_init();

        // Store decimals
        _decimals = tokenDecimals;

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
        _mint(tokenOwner, totalSupply);

        // Emit events
        emit TokenInitialized(tokenName, tokenSymbol, totalSupply, tokenDecimals, tokenOwner);
        
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
        // The standard Paused(address) event is emitted by OpenZeppelin's _pause()
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
        // The standard Unpaused(address) event is emitted by OpenZeppelin's _unpause()
    }

    /**
     * @dev Transfer ownership (owner only)
     */
    function transferOwnership(address newOwner) 
        public 
        override(OwnableUpgradeable) 
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
        override(OwnableUpgradeable) 
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
        return _getInitializedVersion() != 0;
    }

    // ============== OpenZeppelin Override Functions ==============

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
     * @dev Override decimals to return stored value
     */
    function decimals() public view override(ERC20Upgradeable) returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Override owner function (required by interface conflicts)
     */
    function owner() public view override(OwnableUpgradeable) returns (address) {
        return super.owner();
    }

    /**
     * @dev Override paused function (required by interface conflicts)
     */
    function paused() public view override(PausableUpgradeable) returns (bool) {
        return super.paused();
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
     * @dev Override _beforeTokenTransfer to add pausable functionality and additional checks
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20Upgradeable, ERC20PausableUpgradeable)
    {
        // Check if paused (only if pausable feature is enabled)
        if (_features.pausable && paused()) {
            revert TokenIsPaused();
        }

        super._beforeTokenTransfer(from, to, amount);
    }


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
            revert("Invalid total supply");
        }

        // Validate decimals
        if (tokenDecimals > MAX_DECIMALS) {
            revert("Invalid decimals");
        }

        // Validate owner
        if (tokenOwner == address(0)) {
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