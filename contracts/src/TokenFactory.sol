// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "./interfaces/ITokenFactory.sol";
import "./interfaces/IERC20Template.sol";

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

        __Ownable_init();
        _transferOwnership(owner);
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
        IERC20Template(tokenAddress).initialize(
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
        if (_templates[templateId] == address(0)) {
            _templateIds.push(templateId);
        }
        _templates[templateId] = implementation;
        
        emit TemplateUpdated(templateId, implementation);
        emit TemplateAdded(templateId, implementation);
    }

    /**
     * @dev Remove a token template (owner only)
     */
    function removeTemplate(bytes32 templateId) external override onlyOwner {
        if (_templates[templateId] == address(0)) revert TemplateNotFound();
        
        delete _templates[templateId];
        
        // Remove from template IDs array
        for (uint256 i = 0; i < _templateIds.length; i++) {
            if (_templateIds[i] == templateId) {
                _templateIds[i] = _templateIds[_templateIds.length - 1];
                _templateIds.pop();
                break;
            }
        }
        
        emit TemplateRemoved(templateId);
    }

    /**
     * @dev Set service fee (owner only)
     */
    function setServiceFee(uint256 newFee) external override onlyOwner {
        if (newFee > MAX_SERVICE_FEE) revert InvalidConfiguration();
        _serviceFee = newFee;
        
        emit ServiceFeeUpdated(newFee, _feeRecipient);
    }

    /**
     * @dev Set fee recipient (owner only)
     */
    function setFeeRecipient(address newRecipient) external override onlyOwner {
        if (newRecipient == address(0)) revert ZeroAddress();
        _feeRecipient = newRecipient;
        
        emit FeeRecipientUpdated(newRecipient);
    }

    /**
     * @dev Pause the factory (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the factory (owner only)  
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal of accumulated fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) return;
        
        (bool success, ) = _feeRecipient.call{value: balance}("");
        require(success, "Fee withdrawal failed");
    }

    // ==================== VIEW FUNCTIONS ====================

    /**
     * @dev Get current service fee
     */
    function getServiceFee() external view override returns (uint256) {
        return _serviceFee;
    }

    /**
     * @dev Get fee recipient address
     */
    function getFeeRecipient() external view override returns (address) {
        return _feeRecipient;
    }

    /**
     * @dev Get tokens created by a specific creator
     */
    function getTokensByCreator(address creator) 
        external 
        view 
        override 
        returns (address[] memory) 
    {
        return _tokensByCreator[creator];
    }

    /**
     * @dev Check if a token symbol is already deployed
     */
    function isTokenDeployed(string calldata symbol) 
        external 
        view 
        override 
        returns (bool) 
    {
        return _deployedSymbols[symbol];
    }

    /**
     * @dev Get template implementation address
     */
    function getTemplate(bytes32 templateId) 
        external 
        view 
        override 
        returns (address) 
    {
        return _templates[templateId];
    }

    /**
     * @dev Get all template IDs
     */
    function getAllTemplates() external view override returns (bytes32[] memory) {
        return _templateIds;
    }

    /**
     * @dev Calculate deployment cost
     */
    function calculateDeploymentCost(TokenConfig calldata config)
        external
        view
        override
        returns (uint256 gasCost, uint256 serviceFee)
    {
        // Estimate gas cost based on features enabled
        gasCost = 200000; // Base deployment cost
        
        // Add gas for each feature
        if (config.mintable) gasCost += 50000;
        if (config.burnable) gasCost += 30000;
        if (config.pausable) gasCost += 40000;
        if (config.capped) gasCost += 20000;
        
        serviceFee = _serviceFee;
    }

    /**
     * @dev Validate token configuration
     */
    function validateConfiguration(TokenConfig calldata config)
        public
        pure
        override
        returns (bool valid, string memory reason)
    {
        // Validate name
        if (bytes(config.name).length == 0) {
            return (false, "Name cannot be empty");
        }
        if (bytes(config.name).length > MAX_NAME_LENGTH) {
            return (false, "Name too long");
        }

        // Validate symbol
        if (bytes(config.symbol).length == 0) {
            return (false, "Symbol cannot be empty");
        }
        if (bytes(config.symbol).length > MAX_SYMBOL_LENGTH) {
            return (false, "Symbol too long");
        }

        // Validate total supply
        if (config.totalSupply == 0) {
            return (false, "Total supply must be greater than zero");
        }

        // Validate decimals
        if (config.decimals > MAX_DECIMALS) {
            return (false, "Decimals cannot exceed 18");
        }

        // Validate owner
        if (config.initialOwner == address(0)) {
            return (false, "Initial owner cannot be zero address");
        }

        // Validate capped configuration
        if (config.capped) {
            if (config.maxSupply == 0) {
                return (false, "Max supply required when capped");
            }
            if (config.maxSupply < config.totalSupply) {
                return (false, "Max supply less than total supply");
            }
        }

        return (true, "");
    }

    /**
     * @dev Get current chain ID
     */
    function getChainId() external view override returns (uint256) {
        return block.chainid;
    }

    /**
     * @dev Check if chain is supported
     */
    function isChainSupported(uint256 chainId) external pure override returns (bool) {
        // Support major chains: Ethereum (1), BSC (56), XSC (custom), Polygon (137), etc.
        return chainId == 1 || chainId == 56 || chainId == 137 || 
               chainId == 5 || chainId == 97 || chainId == 31337; // Include testnets and hardhat
    }

    /**
     * @dev Get total tokens created
     */
    function getTotalTokensCreated() external view override returns (uint256) {
        return _totalTokensCreated;
    }

    /**
     * @dev Get tokens created by specific user
     */
    function getTokensCreatedByUser(address user) external view override returns (uint256) {
        return _tokensCreatedByUser[user];
    }

    /**
     * @dev Get total fees collected
     */
    function getTotalFeesCollected() external view override returns (uint256) {
        return _totalFeesCollected;
    }

    // ==================== INTERNAL FUNCTIONS ====================

    /**
     * @dev Select appropriate template based on configuration
     */
    function _selectTemplate(TokenConfig calldata config) internal pure returns (bytes32) {
        // Full featured if multiple advanced features
        bool hasMultipleFeatures = 
            (config.mintable ? 1 : 0) + 
            (config.burnable ? 1 : 0) + 
            (config.pausable ? 1 : 0) + 
            (config.capped ? 1 : 0) > 1;
            
        if (hasMultipleFeatures || (config.mintable && config.pausable)) {
            return FULL_FEATURED;
        }
        
        // Mintable template if only minting needed
        if (config.mintable && !config.burnable && !config.pausable) {
            return MINTABLE_ERC20;
        }
        
        // Basic template for simple tokens
        return BASIC_ERC20;
    }

    /**
     * @dev Generate deterministic salt for CREATE2 deployment
     */
    function _generateSalt(TokenConfig calldata config, address creator) 
        internal 
        view 
        returns (bytes32) 
    {
        return keccak256(abi.encodePacked(
            creator,
            config.name,
            config.symbol,
            _deploymentNonce,
            block.timestamp
        ));
    }

    /**
     * @dev Handle service fee collection
     */
    function _collectServiceFee(uint256 payment) internal {
        _totalFeesCollected += _serviceFee;
        
        // Refund excess payment
        if (payment > _serviceFee) {
            uint256 refund = payment - _serviceFee;
            (bool success, ) = msg.sender.call{value: refund}("");
            require(success, "Refund failed");
        }
    }

    /**
     * @dev Authorize upgrades (UUPS pattern)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // Additional upgrade validation can be added here
    }

    /**
     * @dev Get predicted token address for CREATE2 deployment
     */
    function predictTokenAddress(TokenConfig calldata config, address creator) 
        external 
        view 
        returns (address) 
    {
        bytes32 templateId = _selectTemplate(config);
        address template = _templates[templateId];
        if (template == address(0)) revert TemplateNotFound();
        
        bytes32 salt = _generateSalt(config, creator);
        return Clones.predictDeterministicAddress(template, salt);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[40] private __gap;
}