// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/v5.0.0/contracts/proxy/utils/Initializable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/v5.0.0/contracts/proxy/utils/UUPSUpgradeable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/v5.0.0/contracts/access/OwnableUpgradeable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/v5.0.0/contracts/utils/ReentrancyGuardUpgradeable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/v5.0.0/contracts/utils/PausableUpgradeable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/proxy/Clones.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/utils/Create2.sol";

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

/**
 * @title TokenFactory
 * @dev UUPS Upgradeable factory contract for deploying ERC20 tokens with advanced features
 *
 * Features:
 * - UUPS upgradeable proxy pattern
 * - Template-based token deployment using OpenZeppelin Clones
 * - Service fee collection mechanism
 * - Template management system
 * - Multi-chain support (ETH/BSC/XSC)
 * - Comprehensive validation and security
 * - Gas optimized deployment using CREATE2
 * - Token tracking and statistics
 *
 * Security:
 * - Access control for admin functions
 * - Reentrancy protection
 * - Input validation
 * - Pausable for emergency stops
 * - Safe math operations
 */
contract TokenFactory is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    ITokenFactory
{
    // State variables
    uint256 private _serviceFee;
    address private _feeRecipient;

    // Template management
    mapping(bytes32 => address) private _templates;
    bytes32[] private _templateIds;

    // Token tracking
    mapping(string => bool) private _deployedSymbols;
    mapping(address => address[]) private _tokensByCreator;
    mapping(address => uint256) private _tokensCreatedByUser;

    // Statistics
    uint256 private _totalTokensCreated;
    uint256 private _totalFeesCollected;

    // Salt for CREATE2 deployments
    uint256 private _deploymentNonce;

    // Constants
    uint256 private constant MAX_SERVICE_FEE = 1 ether;
    uint256 private constant MAX_NAME_LENGTH = 50;
    uint256 private constant MAX_SYMBOL_LENGTH = 10;
    uint8 private constant MAX_DECIMALS = 18;

    // Default template IDs
    bytes32 public constant BASIC_ERC20 = keccak256("BASIC_ERC20");
    bytes32 public constant MINTABLE_ERC20 = keccak256("MINTABLE_ERC20");
    bytes32 public constant FULL_FEATURED = keccak256("FULL_FEATURED");

    // Events for internal tracking
    event TemplateAdded(bytes32 indexed templateId, address implementation);
    event TemplateRemoved(bytes32 indexed templateId);

    /**
     * @dev Modifier to validate token configuration
     */
    modifier validConfig(TokenConfig calldata config) {
        (bool valid, string memory reason) = validateConfiguration(config);
        if (!valid) revert InvalidConfiguration();
        _;
    }

    /**
     * @dev Constructor - disable initializers for proxy pattern
     */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the TokenFactory
     * @param owner Contract owner address
     * @param feeRecipient Address to receive service fees
     * @param serviceFee Service fee amount in wei
     */
    function initialize(
        address owner,
        address feeRecipient,
        uint256 serviceFee
    ) external initializer {
        if (owner == address(0) || feeRecipient == address(0)) revert ZeroAddress();
        if (serviceFee > MAX_SERVICE_FEE) revert InvalidConfiguration();

        __Ownable_init(owner);
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _feeRecipient = feeRecipient;
        _serviceFee = serviceFee;

        emit ServiceFeeUpdated(serviceFee, feeRecipient);
    }

    /**
     * @dev Create a new ERC20 token with specified configuration
     * @param config Token configuration parameters
     * @return tokenAddress Address of the deployed token
     */
    function createToken(TokenConfig calldata config)
        external
        payable
        override
        nonReentrant
        whenNotPaused
        validConfig(config)
        returns (address tokenAddress)
    {
        // Validate service fee payment
        if (msg.value < _serviceFee) revert InsufficientServiceFee();

        // Check symbol uniqueness
        if (_deployedSymbols[config.symbol]) revert SymbolAlreadyExists();

        // Select appropriate template
        bytes32 templateId = _selectTemplate(config);
        address template = _templates[templateId];
        if (template == address(0)) revert TemplateNotFound();

        // Generate deterministic salt for CREATE2
        bytes32 salt = _generateSalt(config, msg.sender);

        // Deploy token using Clone pattern with CREATE2
        tokenAddress = Clones.cloneDeterministic(template, salt);

        // Initialize the cloned token
        {
            IERC20Template tokenContract = IERC20Template(tokenAddress);
            tokenContract.initialize(
                config.name,
                config.symbol,
                config.totalSupply,
                config.decimals,
                config.initialOwner,
                config.mintable,
                config.burnable,
                config.pausable,
                config.capped,
                config.maxSupply
            );
        }

        // Update state
        _deployedSymbols[config.symbol] = true;
        _tokensByCreator[msg.sender].push(tokenAddress);
        _tokensCreatedByUser[msg.sender]++;
        _totalTokensCreated++;
        _deploymentNonce++;

        // Handle fee collection
        _collectServiceFee(msg.value);

        // Generate config hash for event
        bytes32 configHash = keccak256(abi.encode(config));

        // Emit event
        emit TokenCreated(
            tokenAddress,
            msg.sender,
            config.name,
            config.symbol,
            config.totalSupply,
            config.decimals,
            configHash
        );

        return tokenAddress;
    }

    /**
     * @dev Add a new token template (owner only)
     */
    function addTemplate(bytes32 templateId, address implementation)
        external
        override
        onlyOwner
    {
        if (implementation == address(0)) revert ZeroAddress();
        if (implementation.code.length == 0) revert InvalidConfiguration();

        bool isNew = _templates[templateId] == address(0);
        _templates[templateId] = implementation;

        if (isNew) {
            _templateIds.push(templateId);
        }

        emit TemplateAdded(templateId, implementation);
        emit TemplateUpdated(templateId, implementation);
    }

    /**
     * @dev Remove a token template (owner only)
     */
    function removeTemplate(bytes32 templateId) external override onlyOwner {
        if (_templates[templateId] == address(0)) revert TemplateNotFound();

        delete _templates[templateId];

        // Remove from templateIds array
        for (uint256 i = 0; i < _templateIds.length; i++) {
            if (_templateIds[i] == templateId) {
                _templateIds[i] = _templateIds[_templateIds.length - 1];
                _templateIds.pop();
                break;
            }
        }

        emit TemplateRemoved(templateId);
    }

    // ==================== VIEW FUNCTIONS ====================

    function getServiceFee() external view override returns (uint256) {
        return _serviceFee;
    }

    function getFeeRecipient() external view override returns (address) {
        return _feeRecipient;
    }

    function getTemplate(bytes32 templateId) external view override returns (address) {
        return _templates[templateId];
    }

    function getAllTemplates() external view override returns (bytes32[] memory) {
        return _templateIds;
    }

    function getTokensByCreator(address creator) external view override returns (address[] memory) {
        return _tokensByCreator[creator];
    }

    function isTokenDeployed(string calldata symbol) external view override returns (bool) {
        return _deployedSymbols[symbol];
    }

    function getTotalTokensCreated() external view override returns (uint256) {
        return _totalTokensCreated;
    }

    function getTokensCreatedByUser(address user) external view override returns (uint256) {
        return _tokensCreatedByUser[user];
    }

    function getTotalFeesCollected() external view override returns (uint256) {
        return _totalFeesCollected;
    }

    function getChainId() external view override returns (uint256) {
        return block.chainid;
    }

    function isChainSupported(uint256 chainId) external pure override returns (bool) {
        // ETH, BSC, XSC and testnets
        return chainId == 1 || chainId == 56 || chainId == 520 ||
               chainId == 11155111 || chainId == 97 || chainId == 5201;
    }

    // ==================== ADMIN FUNCTIONS ====================

    function setServiceFee(uint256 newFee) external override onlyOwner {
        if (newFee > MAX_SERVICE_FEE) revert InvalidConfiguration();
        _serviceFee = newFee;
        emit ServiceFeeUpdated(newFee, _feeRecipient);
    }

    function setFeeRecipient(address newRecipient) external override onlyOwner {
        if (newRecipient == address(0)) revert ZeroAddress();
        _feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(_feeRecipient).transfer(balance);
        }
    }

    // ==================== UTILITY FUNCTIONS ====================

    function calculateDeploymentCost(TokenConfig calldata config)
        external
        view
        override
        returns (uint256 gasCost, uint256 serviceFee)
    {
        // Estimate gas based on features enabled
        gasCost = 200000; // Base deployment cost
        if (config.mintable) gasCost += 50000;
        if (config.burnable) gasCost += 50000;
        if (config.pausable) gasCost += 50000;
        if (config.capped) gasCost += 20000;

        serviceFee = _serviceFee;
    }

    function validateConfiguration(TokenConfig calldata config)
        public
        pure
        override
        returns (bool valid, string memory reason)
    {
        if (bytes(config.name).length == 0 || bytes(config.name).length > MAX_NAME_LENGTH) {
            return (false, "Invalid name length");
        }

        if (bytes(config.symbol).length == 0 || bytes(config.symbol).length > MAX_SYMBOL_LENGTH) {
            return (false, "Invalid symbol length");
        }

        if (config.totalSupply == 0) {
            return (false, "Total supply cannot be zero");
        }

        if (config.decimals > MAX_DECIMALS) {
            return (false, "Decimals too high");
        }

        if (config.initialOwner == address(0)) {
            return (false, "Invalid owner address");
        }

        if (config.capped && config.maxSupply < config.totalSupply) {
            return (false, "Max supply lower than total supply");
        }

        return (true, "");
    }

    // ==================== INTERNAL FUNCTIONS ====================

    function _selectTemplate(TokenConfig calldata config) internal pure returns (bytes32) {
        // Select template based on features
        if (config.mintable && config.burnable && config.pausable) {
            return FULL_FEATURED;
        } else if (config.mintable) {
            return MINTABLE_ERC20;
        } else {
            return BASIC_ERC20;
        }
    }

    function _generateSalt(TokenConfig calldata config, address creator) internal view returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                creator,
                config.name,
                config.symbol,
                _deploymentNonce
            )
        );
    }

    function _collectServiceFee(uint256 amount) internal {
        _totalFeesCollected += amount;
        // Fees remain in contract until withdrawn by owner
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     */
    uint256[40] private __gap;
}