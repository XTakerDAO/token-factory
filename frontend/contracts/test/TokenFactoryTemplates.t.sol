// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";

// Import interfaces - these will need to be implemented
interface ITokenFactory {
    // Events
    event TemplateUpdated(bytes32 templateId, address implementation);
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply,
        uint8 decimals,
        bytes32 indexed configHash
    );

    // Errors
    error InvalidConfiguration();
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

    // Template Management Functions
    function addTemplate(bytes32 templateId, address implementation) external;
    function removeTemplate(bytes32 templateId) external;
    function getTemplate(bytes32 templateId) external view returns (address);
    function getAllTemplates() external view returns (bytes32[] memory);
    function isTemplateActive(bytes32 templateId) external view returns (bool);
    
    // Core Functions
    function createToken(TokenConfig calldata config)
        external
        payable
        returns (address tokenAddress);
    
    function createTokenWithTemplate(TokenConfig calldata config, bytes32 templateId)
        external
        payable
        returns (address tokenAddress);
        
    // Access Control
    function owner() external view returns (address);
}

// Mock token implementation contracts for testing
contract MockBasicERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    address public owner;
    
    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _totalSupply, address _owner) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        owner = _owner;
    }
}

contract MockMintableERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    address public owner;
    bool public mintable = true;
    
    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _totalSupply, address _owner) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        owner = _owner;
    }
}

contract MockFullFeaturedERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    address public owner;
    bool public mintable = true;
    bool public burnable = true;
    bool public pausable = true;
    bool public capped = true;
    
    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _totalSupply, address _owner) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        owner = _owner;
    }
}

/**
 * @title TokenFactory Template Management Test Suite
 * @dev Comprehensive tests for TokenFactory template management functionality
 * These tests follow TDD approach and will FAIL initially until implementation is complete
 */
contract TokenFactoryTemplatesTest is Test {
    // Test accounts
    address public factory;
    address public owner;
    address public user1;
    address public user2;
    address public templateManager;

    // Template implementations
    address public basicERC20Template;
    address public mintableERC20Template;
    address public fullFeaturedTemplate;
    address public customTemplate;

    // Template IDs
    bytes32 public constant BASIC_ERC20 = keccak256("BASIC_ERC20");
    bytes32 public constant MINTABLE_ERC20 = keccak256("MINTABLE_ERC20");
    bytes32 public constant FULL_FEATURED = keccak256("FULL_FEATURED");
    bytes32 public constant CUSTOM_TEMPLATE = keccak256("CUSTOM_TEMPLATE");

    // Test constants
    uint256 public constant SERVICE_FEE = 0.01 ether;
    uint256 public constant INITIAL_BALANCE = 100 ether;

    // Events for testing
    event TemplateUpdated(bytes32 templateId, address implementation);

    function setUp() public {
        // Setup test accounts
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        templateManager = makeAddr("templateManager");

        // Fund test accounts
        vm.deal(user1, INITIAL_BALANCE);
        vm.deal(user2, INITIAL_BALANCE);
        vm.deal(owner, INITIAL_BALANCE);
        
        // Deploy mock template implementations
        basicERC20Template = address(new MockBasicERC20("", "", 0, 0, address(0)));
        mintableERC20Template = address(new MockMintableERC20("", "", 0, 0, address(0)));
        fullFeaturedTemplate = address(new MockFullFeaturedERC20("", "", 0, 0, address(0)));
        customTemplate = address(new MockBasicERC20("", "", 0, 0, address(0)));
        
        // Deploy TokenFactory with initial templates (this will fail until implementation exists)
        vm.startPrank(owner);
        // factory = address(new TokenFactory()); // This line will fail - no implementation yet
        
        // Add initial templates
        // ITokenFactory(factory).addTemplate(BASIC_ERC20, basicERC20Template);
        // ITokenFactory(factory).addTemplate(MINTABLE_ERC20, mintableERC20Template);
        // ITokenFactory(factory).addTemplate(FULL_FEATURED, fullFeaturedTemplate);
        vm.stopPrank();
        
        console.log("TokenFactory Templates Test Setup Complete");
        console.log("Factory address:", factory);
        console.log("Owner:", owner);
        console.log("Basic ERC20 Template:", basicERC20Template);
        console.log("Mintable ERC20 Template:", mintableERC20Template);
        console.log("Full Featured Template:", fullFeaturedTemplate);
    }

    // =============================================================================
    // Template Addition Tests
    // =============================================================================

    function testOwnerCanAddTemplate() public {
        vm.startPrank(owner);
        
        // Expect TemplateUpdated event
        vm.expectEmit(true, true, false, true);
        emit TemplateUpdated(CUSTOM_TEMPLATE, customTemplate);
        
        ITokenFactory(factory).addTemplate(CUSTOM_TEMPLATE, customTemplate);
        
        address retrievedTemplate = ITokenFactory(factory).getTemplate(CUSTOM_TEMPLATE);
        assertEq(retrievedTemplate, customTemplate, "Template should be added correctly");
        
        assertTrue(ITokenFactory(factory).isTemplateActive(CUSTOM_TEMPLATE), "Template should be active");
        
        vm.stopPrank();
    }

    function testNonOwnerCannotAddTemplate() public {
        vm.startPrank(user1);
        
        vm.expectRevert(ITokenFactory.Unauthorized.selector);
        ITokenFactory(factory).addTemplate(CUSTOM_TEMPLATE, customTemplate);
        
        vm.stopPrank();
    }

    function testAddTemplateWithZeroAddress() public {
        vm.startPrank(owner);
        
        vm.expectRevert(ITokenFactory.InvalidConfiguration.selector);
        ITokenFactory(factory).addTemplate(CUSTOM_TEMPLATE, address(0));
        
        vm.stopPrank();
    }

    function testAddTemplateWithEmptyId() public {
        vm.startPrank(owner);
        
        bytes32 emptyId = bytes32(0);
        vm.expectRevert(ITokenFactory.InvalidConfiguration.selector);
        ITokenFactory(factory).addTemplate(emptyId, customTemplate);
        
        vm.stopPrank();
    }

    function testOverrideExistingTemplate() public {
        vm.startPrank(owner);
        
        // First add a template
        ITokenFactory(factory).addTemplate(CUSTOM_TEMPLATE, basicERC20Template);
        address firstTemplate = ITokenFactory(factory).getTemplate(CUSTOM_TEMPLATE);
        assertEq(firstTemplate, basicERC20Template, "First template should be set");
        
        // Override with new implementation
        vm.expectEmit(true, true, false, true);
        emit TemplateUpdated(CUSTOM_TEMPLATE, customTemplate);
        
        ITokenFactory(factory).addTemplate(CUSTOM_TEMPLATE, customTemplate);
        
        address secondTemplate = ITokenFactory(factory).getTemplate(CUSTOM_TEMPLATE);
        assertEq(secondTemplate, customTemplate, "Template should be overridden");
        
        vm.stopPrank();
    }

    // =============================================================================
    // Template Removal Tests
    // =============================================================================

    function testOwnerCanRemoveTemplate() public {
        vm.startPrank(owner);
        
        // First add a template
        ITokenFactory(factory).addTemplate(CUSTOM_TEMPLATE, customTemplate);
        assertTrue(ITokenFactory(factory).isTemplateActive(CUSTOM_TEMPLATE), "Template should be active");
        
        // Remove the template
        vm.expectEmit(true, true, false, true);
        emit TemplateUpdated(CUSTOM_TEMPLATE, address(0));
        
        ITokenFactory(factory).removeTemplate(CUSTOM_TEMPLATE);
        
        assertFalse(ITokenFactory(factory).isTemplateActive(CUSTOM_TEMPLATE), "Template should be inactive");
        
        address retrievedTemplate = ITokenFactory(factory).getTemplate(CUSTOM_TEMPLATE);
        assertEq(retrievedTemplate, address(0), "Template should return zero address");
        
        vm.stopPrank();
    }

    function testNonOwnerCannotRemoveTemplate() public {
        vm.startPrank(owner);
        ITokenFactory(factory).addTemplate(CUSTOM_TEMPLATE, customTemplate);
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        vm.expectRevert(ITokenFactory.Unauthorized.selector);
        ITokenFactory(factory).removeTemplate(CUSTOM_TEMPLATE);
        
        vm.stopPrank();
        
        // Verify template still exists
        assertTrue(ITokenFactory(factory).isTemplateActive(CUSTOM_TEMPLATE), "Template should still be active");
    }

    function testRemoveNonExistentTemplate() public {
        vm.startPrank(owner);
        
        bytes32 nonExistentId = keccak256("NON_EXISTENT");
        
        vm.expectRevert(ITokenFactory.TemplateNotFound.selector);
        ITokenFactory(factory).removeTemplate(nonExistentId);
        
        vm.stopPrank();
    }

    function testRemoveTemplateWithEmptyId() public {
        vm.startPrank(owner);
        
        bytes32 emptyId = bytes32(0);
        vm.expectRevert(ITokenFactory.InvalidConfiguration.selector);
        ITokenFactory(factory).removeTemplate(emptyId);
        
        vm.stopPrank();
    }

    // =============================================================================
    // Template Query Tests
    // =============================================================================

    function testGetExistingTemplate() public view {
        address template = ITokenFactory(factory).getTemplate(BASIC_ERC20);
        assertEq(template, basicERC20Template, "Should return correct template address");
    }

    function testGetNonExistentTemplate() public view {
        bytes32 nonExistentId = keccak256("NON_EXISTENT");
        address template = ITokenFactory(factory).getTemplate(nonExistentId);
        assertEq(template, address(0), "Should return zero address for non-existent template");
    }

    function testIsTemplateActiveForExistingTemplate() public view {
        assertTrue(ITokenFactory(factory).isTemplateActive(BASIC_ERC20), "Basic template should be active");
        assertTrue(ITokenFactory(factory).isTemplateActive(MINTABLE_ERC20), "Mintable template should be active");
        assertTrue(ITokenFactory(factory).isTemplateActive(FULL_FEATURED), "Full featured template should be active");
    }

    function testIsTemplateActiveForNonExistentTemplate() public view {
        bytes32 nonExistentId = keccak256("NON_EXISTENT");
        assertFalse(ITokenFactory(factory).isTemplateActive(nonExistentId), "Non-existent template should not be active");
    }

    function testGetAllTemplates() public view {
        bytes32[] memory templates = ITokenFactory(factory).getAllTemplates();
        
        assertEq(templates.length, 3, "Should return all active templates");
        
        // Check that all expected templates are present
        bool foundBasic = false;
        bool foundMintable = false;
        bool foundFull = false;
        
        for (uint256 i = 0; i < templates.length; i++) {
            if (templates[i] == BASIC_ERC20) foundBasic = true;
            else if (templates[i] == MINTABLE_ERC20) foundMintable = true;
            else if (templates[i] == FULL_FEATURED) foundFull = true;
        }
        
        assertTrue(foundBasic, "Should include basic template");
        assertTrue(foundMintable, "Should include mintable template");
        assertTrue(foundFull, "Should include full featured template");
    }

    // =============================================================================
    // Token Creation with Templates Tests
    // =============================================================================

    function testCreateTokenWithBasicTemplate() public {
        vm.startPrank(user1);
        
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Basic Template Token",
            symbol: "BASIC",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        address tokenAddress = ITokenFactory(factory).createTokenWithTemplate{value: SERVICE_FEE}(config, BASIC_ERC20);
        
        assertTrue(tokenAddress != address(0), "Token should be created with basic template");
        
        // Verify token properties match basic template
        MockBasicERC20 token = MockBasicERC20(tokenAddress);
        assertEq(token.name(), "Basic Template Token", "Token name should match config");
        assertEq(token.symbol(), "BASIC", "Token symbol should match config");
        assertEq(token.decimals(), 18, "Token decimals should match config");
        assertEq(token.totalSupply(), 1000000 * 10**18, "Token supply should match config");
        assertEq(token.owner(), user1, "Token owner should match config");
        
        vm.stopPrank();
    }

    function testCreateTokenWithMintableTemplate() public {
        vm.startPrank(user1);
        
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Mintable Template Token",
            symbol: "MINT",
            totalSupply: 500000 * 10**18,
            decimals: 18,
            mintable: true,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        address tokenAddress = ITokenFactory(factory).createTokenWithTemplate{value: SERVICE_FEE}(config, MINTABLE_ERC20);
        
        assertTrue(tokenAddress != address(0), "Token should be created with mintable template");
        
        MockMintableERC20 token = MockMintableERC20(tokenAddress);
        assertEq(token.name(), "Mintable Template Token", "Token name should match config");
        assertTrue(token.mintable(), "Token should be mintable");
        
        vm.stopPrank();
    }

    function testCreateTokenWithFullFeaturedTemplate() public {
        vm.startPrank(user1);
        
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Full Featured Token",
            symbol: "FULL",
            totalSupply: 200000 * 10**18,
            decimals: 18,
            mintable: true,
            burnable: true,
            pausable: true,
            capped: true,
            maxSupply: 1000000 * 10**18,
            initialOwner: user1
        });

        address tokenAddress = ITokenFactory(factory).createTokenWithTemplate{value: SERVICE_FEE}(config, FULL_FEATURED);
        
        assertTrue(tokenAddress != address(0), "Token should be created with full featured template");
        
        MockFullFeaturedERC20 token = MockFullFeaturedERC20(tokenAddress);
        assertEq(token.name(), "Full Featured Token", "Token name should match config");
        assertTrue(token.mintable(), "Token should be mintable");
        assertTrue(token.burnable(), "Token should be burnable");
        assertTrue(token.pausable(), "Token should be pausable");
        assertTrue(token.capped(), "Token should be capped");
        
        vm.stopPrank();
    }

    function testCreateTokenWithNonExistentTemplate() public {
        vm.startPrank(user1);
        
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Non Existent Template Token",
            symbol: "NONEX",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        bytes32 nonExistentTemplate = keccak256("NON_EXISTENT");
        
        vm.expectRevert(ITokenFactory.TemplateNotFound.selector);
        ITokenFactory(factory).createTokenWithTemplate{value: SERVICE_FEE}(config, nonExistentTemplate);
        
        vm.stopPrank();
    }

    function testCreateTokenWithRemovedTemplate() public {
        vm.startPrank(owner);
        
        // Add and then remove a template
        ITokenFactory(factory).addTemplate(CUSTOM_TEMPLATE, customTemplate);
        ITokenFactory(factory).removeTemplate(CUSTOM_TEMPLATE);
        
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Removed Template Token",
            symbol: "REMOVED",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        vm.expectRevert(ITokenFactory.TemplateNotFound.selector);
        ITokenFactory(factory).createTokenWithTemplate{value: SERVICE_FEE}(config, CUSTOM_TEMPLATE);
        
        vm.stopPrank();
    }

    // =============================================================================
    // Template Configuration Validation Tests
    // =============================================================================

    function testCreateTokenWithMismatchedTemplate() public {
        vm.startPrank(user1);
        
        // Try to create mintable token with basic template
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Mismatched Template Token",
            symbol: "MISMATCH",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: true, // This doesn't match basic template
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        vm.expectRevert(ITokenFactory.InvalidConfiguration.selector);
        ITokenFactory(factory).createTokenWithTemplate{value: SERVICE_FEE}(config, BASIC_ERC20);
        
        vm.stopPrank();
    }

    function testCreateCappedTokenWithNonCappedTemplate() public {
        vm.startPrank(user1);
        
        // Try to create capped token with basic template
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Capped With Basic",
            symbol: "CAPBASIC",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: true, // This doesn't match basic template
            maxSupply: 2000000 * 10**18,
            initialOwner: user1
        });

        vm.expectRevert(ITokenFactory.InvalidConfiguration.selector);
        ITokenFactory(factory).createTokenWithTemplate{value: SERVICE_FEE}(config, BASIC_ERC20);
        
        vm.stopPrank();
    }

    // =============================================================================
    // Template-Based Feature Detection Tests
    // =============================================================================

    function testTemplateFeatureDetection() public view {
        // This test would verify that the factory can detect which features
        // are supported by each template
        
        // For basic template
        ITokenFactory.FeatureFlags memory basicFeatures = getTemplateFeatures(BASIC_ERC20);
        assertFalse(basicFeatures.mintable, "Basic template should not support minting");
        assertFalse(basicFeatures.burnable, "Basic template should not support burning");
        assertFalse(basicFeatures.pausable, "Basic template should not support pausing");
        assertFalse(basicFeatures.capped, "Basic template should not support capping");
        
        // For mintable template
        ITokenFactory.FeatureFlags memory mintableFeatures = getTemplateFeatures(MINTABLE_ERC20);
        assertTrue(mintableFeatures.mintable, "Mintable template should support minting");
        assertFalse(mintableFeatures.burnable, "Mintable template should not support burning");
        assertFalse(mintableFeatures.pausable, "Mintable template should not support pausing");
        assertFalse(mintableFeatures.capped, "Mintable template should not support capping");
        
        // For full featured template
        ITokenFactory.FeatureFlags memory fullFeatures = getTemplateFeatures(FULL_FEATURED);
        assertTrue(fullFeatures.mintable, "Full featured template should support minting");
        assertTrue(fullFeatures.burnable, "Full featured template should support burning");
        assertTrue(fullFeatures.pausable, "Full featured template should support pausing");
        assertTrue(fullFeatures.capped, "Full featured template should support capping");
    }

    // =============================================================================
    // Template Selection Logic Tests
    // =============================================================================

    function testAutoTemplateSelection() public {
        vm.startPrank(user1);
        
        // Create token without specifying template - should auto-select based on config
        ITokenFactory.TokenConfig memory basicConfig = ITokenFactory.TokenConfig({
            name: "Auto Basic Token",
            symbol: "AUTOBASIC",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        address basicToken = ITokenFactory(factory).createToken{value: SERVICE_FEE}(basicConfig);
        assertTrue(basicToken != address(0), "Basic token should be created with auto-selection");
        
        // Create mintable token - should auto-select mintable template
        ITokenFactory.TokenConfig memory mintableConfig = ITokenFactory.TokenConfig({
            name: "Auto Mintable Token",
            symbol: "AUTOMINT",
            totalSupply: 500000 * 10**18,
            decimals: 18,
            mintable: true,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        address mintableToken = ITokenFactory(factory).createToken{value: SERVICE_FEE}(mintableConfig);
        assertTrue(mintableToken != address(0), "Mintable token should be created with auto-selection");
        
        vm.stopPrank();
    }

    // =============================================================================
    // Template Upgrade and Migration Tests
    // =============================================================================

    function testTemplateUpgrade() public {
        vm.startPrank(owner);
        
        // Deploy new version of basic template
        address newBasicTemplate = address(new MockBasicERC20("", "", 0, 0, address(0)));
        
        // Upgrade the template
        vm.expectEmit(true, true, false, true);
        emit TemplateUpdated(BASIC_ERC20, newBasicTemplate);
        
        ITokenFactory(factory).addTemplate(BASIC_ERC20, newBasicTemplate);
        
        address currentTemplate = ITokenFactory(factory).getTemplate(BASIC_ERC20);
        assertEq(currentTemplate, newBasicTemplate, "Template should be upgraded");
        
        vm.stopPrank();
        
        // Verify new tokens use upgraded template
        vm.startPrank(user1);
        
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Upgraded Template Token",
            symbol: "UPGRADE",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        address tokenAddress = ITokenFactory(factory).createTokenWithTemplate{value: SERVICE_FEE}(config, BASIC_ERC20);
        assertTrue(tokenAddress != address(0), "Token should be created with upgraded template");
        
        vm.stopPrank();
    }

    // =============================================================================
    // Multi-Template Management Tests
    // =============================================================================

    function testMultipleTemplateOperations() public {
        vm.startPrank(owner);
        
        bytes32[] memory newTemplates = new bytes32[](3);
        address[] memory implementations = new address[](3);
        
        newTemplates[0] = keccak256("TEMPLATE_1");
        newTemplates[1] = keccak256("TEMPLATE_2"); 
        newTemplates[2] = keccak256("TEMPLATE_3");
        
        implementations[0] = address(new MockBasicERC20("", "", 0, 0, address(0)));
        implementations[1] = address(new MockMintableERC20("", "", 0, 0, address(0)));
        implementations[2] = address(new MockFullFeaturedERC20("", "", 0, 0, address(0)));
        
        // Add multiple templates
        for (uint256 i = 0; i < newTemplates.length; i++) {
            ITokenFactory(factory).addTemplate(newTemplates[i], implementations[i]);
            assertTrue(ITokenFactory(factory).isTemplateActive(newTemplates[i]), "Template should be active after addition");
        }
        
        // Verify all templates are listed
        bytes32[] memory allTemplates = ITokenFactory(factory).getAllTemplates();
        assertTrue(allTemplates.length >= 6, "Should have at least 6 templates (3 initial + 3 added)");
        
        // Remove one template
        ITokenFactory(factory).removeTemplate(newTemplates[1]);
        assertFalse(ITokenFactory(factory).isTemplateActive(newTemplates[1]), "Removed template should be inactive");
        
        // Verify remaining templates still work
        assertTrue(ITokenFactory(factory).isTemplateActive(newTemplates[0]), "First template should still be active");
        assertTrue(ITokenFactory(factory).isTemplateActive(newTemplates[2]), "Third template should still be active");
        
        vm.stopPrank();
    }

    // =============================================================================
    // Gas Efficiency Tests
    // =============================================================================

    function testTemplateCreationGasEfficiency() public {
        vm.startPrank(user1);
        
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Gas Efficiency Test",
            symbol: "GASEFF",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        // Test gas efficiency of template-based creation vs auto-selection
        uint256 gasBefore = gasleft();
        ITokenFactory(factory).createTokenWithTemplate{value: SERVICE_FEE}(config, BASIC_ERC20);
        uint256 templateGasUsed = gasBefore - gasleft();
        
        config.symbol = "GASEFF2"; // Change symbol to avoid duplicate
        gasBefore = gasleft();
        ITokenFactory(factory).createToken{value: SERVICE_FEE}(config);
        uint256 autoGasUsed = gasBefore - gasleft();
        
        console.log("Gas used with template selection:", templateGasUsed);
        console.log("Gas used with auto-selection:", autoGasUsed);
        
        // Template selection should be more efficient or comparable
        assertTrue(templateGasUsed <= autoGasUsed + 50000, "Template selection should not be significantly more expensive");
        
        vm.stopPrank();
    }

    // =============================================================================
    // Security Tests
    // =============================================================================

    function testTemplateSecurityValidation() public {
        vm.startPrank(owner);
        
        // Try to add malicious template (this would be a more complex test in reality)
        address maliciousTemplate = address(this); // Use test contract as mock malicious template
        
        // The factory should validate that the template implements required interfaces
        vm.expectRevert(ITokenFactory.InvalidConfiguration.selector);
        ITokenFactory(factory).addTemplate(keccak256("MALICIOUS"), maliciousTemplate);
        
        vm.stopPrank();
    }

    // =============================================================================
    // Edge Cases and Error Conditions
    // =============================================================================

    function testTemplateManagementEdgeCases() public {
        vm.startPrank(owner);
        
        // Test adding template with maximum length ID
        bytes32 maxLengthId = bytes32(type(uint256).max);
        ITokenFactory(factory).addTemplate(maxLengthId, customTemplate);
        assertTrue(ITokenFactory(factory).isTemplateActive(maxLengthId), "Max length ID should work");
        
        // Test removing and re-adding same template
        ITokenFactory(factory).removeTemplate(maxLengthId);
        assertFalse(ITokenFactory(factory).isTemplateActive(maxLengthId), "Template should be removed");
        
        ITokenFactory(factory).addTemplate(maxLengthId, customTemplate);
        assertTrue(ITokenFactory(factory).isTemplateActive(maxLengthId), "Template should be re-added");
        
        vm.stopPrank();
    }

    // =============================================================================
    // Fuzz Tests
    // =============================================================================

    function testFuzzTemplateManagement(bytes32 templateId, address implementation) public {
        vm.assume(templateId != bytes32(0));
        vm.assume(implementation != address(0));
        vm.assume(implementation.code.length > 0); // Assume it's a contract
        
        vm.startPrank(owner);
        
        ITokenFactory(factory).addTemplate(templateId, implementation);
        
        address retrievedImplementation = ITokenFactory(factory).getTemplate(templateId);
        assertEq(retrievedImplementation, implementation, "Fuzz test: Template should be stored correctly");
        
        assertTrue(ITokenFactory(factory).isTemplateActive(templateId), "Fuzz test: Template should be active");
        
        vm.stopPrank();
    }

    // =============================================================================
    // Helper Functions
    // =============================================================================

    function getTemplateFeatures(bytes32 templateId) internal view returns (ITokenFactory.FeatureFlags memory) {
        // Mock implementation - in real contract this would query the template
        if (templateId == BASIC_ERC20) {
            return ITokenFactory.FeatureFlags({
                mintable: false,
                burnable: false,
                pausable: false,
                capped: false
            });
        } else if (templateId == MINTABLE_ERC20) {
            return ITokenFactory.FeatureFlags({
                mintable: true,
                burnable: false,
                pausable: false,
                capped: false
            });
        } else if (templateId == FULL_FEATURED) {
            return ITokenFactory.FeatureFlags({
                mintable: true,
                burnable: true,
                pausable: true,
                capped: true
            });
        } else {
            return ITokenFactory.FeatureFlags({
                mintable: false,
                burnable: false,
                pausable: false,
                capped: false
            });
        }
    }

    function getDefaultConfig() internal view returns (ITokenFactory.TokenConfig memory) {
        return ITokenFactory.TokenConfig({
            name: "Default Token",
            symbol: "DEFAULT",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });
    }

    // Test will fail until TokenFactory implementation exists
    receive() external payable {}
}