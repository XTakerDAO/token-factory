// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../src/TokenFactory.sol";
import "../src/BasicERC20Template.sol";
import "../src/MintableERC20Template.sol";
import "../src/ERC20Template.sol";
import "../src/interfaces/ITokenFactory.sol";
import "../src/interfaces/IERC20Template.sol";

/**
 * @title TokenFactory Template Management Test Suite
 * @dev Comprehensive tests for TokenFactory template management functionality
 */
contract TokenFactoryTemplatesTest is Test {
    // Test accounts
    address public factory;
    address public owner;
    address public user1;
    address public user2;

    // Template implementations
    address public basicERC20Template;
    address public mintableERC20Template;
    address public fullFeaturedTemplate;

    // Template IDs
    bytes32 public constant BASIC_ERC20 = keccak256("BASIC_ERC20");
    bytes32 public constant MINTABLE_ERC20 = keccak256("MINTABLE_ERC20");
    bytes32 public constant FULL_FEATURED = keccak256("FULL_FEATURED");

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

        // Fund test accounts
        vm.deal(user1, INITIAL_BALANCE);
        vm.deal(user2, INITIAL_BALANCE);
        vm.deal(owner, INITIAL_BALANCE);

        // Deploy real template implementations
        basicERC20Template = address(new BasicERC20Template());
        mintableERC20Template = address(new MintableERC20Template());
        fullFeaturedTemplate = address(new ERC20Template());

        // Deploy TokenFactory with UUPS proxy pattern
        vm.startPrank(owner);

        // Deploy implementation
        TokenFactory factoryImpl = new TokenFactory();

        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            TokenFactory.initialize.selector,
            owner,
            owner, // fee recipient
            SERVICE_FEE
        );

        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(address(factoryImpl), initData);
        factory = address(proxy);

        // Add initial templates
        TokenFactory(factory).addTemplate(BASIC_ERC20, basicERC20Template);
        TokenFactory(factory).addTemplate(MINTABLE_ERC20, mintableERC20Template);
        TokenFactory(factory).addTemplate(FULL_FEATURED, fullFeaturedTemplate);

        vm.stopPrank();

        console.log("TokenFactory Templates Test Setup Complete");
        console.log("Factory address:", factory);
        console.log("Owner:", owner);
        console.log("Basic ERC20 Template:", basicERC20Template);
        console.log("Mintable ERC20 Template:", mintableERC20Template);
        console.log("Full Featured Template:", fullFeaturedTemplate);
    }

    // =============================================================================
    // Template Query Tests
    // =============================================================================

    function testGetExistingTemplate() public view {
        address template = TokenFactory(factory).getTemplate(BASIC_ERC20);
        assertEq(template, basicERC20Template, "Should return correct template address");
    }

    function testGetNonExistentTemplate() public view {
        bytes32 nonExistentId = keccak256("NON_EXISTENT");
        address template = TokenFactory(factory).getTemplate(nonExistentId);
        assertEq(template, address(0), "Should return zero address for non-existent template");
    }

    function testGetAllTemplates() public view {
        bytes32[] memory templates = TokenFactory(factory).getAllTemplates();

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

        address tokenAddress = TokenFactory(factory).createToken{value: SERVICE_FEE}(config);

        assertTrue(tokenAddress != address(0), "Token should be created with basic template");

        // Verify token properties using actual contract type
        BasicERC20Template token = BasicERC20Template(tokenAddress);
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

        address tokenAddress = TokenFactory(factory).createToken{value: SERVICE_FEE}(config);

        assertTrue(tokenAddress != address(0), "Token should be created with mintable template");

        MintableERC20Template token = MintableERC20Template(tokenAddress);
        assertEq(token.name(), "Mintable Template Token", "Token name should match config");
        assertTrue(token.isMintable(), "Token should be mintable");

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

        address tokenAddress = TokenFactory(factory).createToken{value: SERVICE_FEE}(config);

        assertTrue(tokenAddress != address(0), "Token should be created with full featured template");

        ERC20Template token = ERC20Template(tokenAddress);
        assertEq(token.name(), "Full Featured Token", "Token name should match config");
        assertTrue(token.isMintable(), "Token should be mintable");
        assertTrue(token.isBurnable(), "Token should be burnable");
        assertTrue(token.isPausable(), "Token should be pausable");
        assertTrue(token.isCapped(), "Token should be capped");

        vm.stopPrank();
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

        address basicToken = TokenFactory(factory).createToken{value: SERVICE_FEE}(basicConfig);
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

        address mintableToken = TokenFactory(factory).createToken{value: SERVICE_FEE}(mintableConfig);
        assertTrue(mintableToken != address(0), "Mintable token should be created with auto-selection");

        vm.stopPrank();
    }

    // =============================================================================
    // Template Addition Tests (Owner Only)
    // =============================================================================

    function testOwnerCanAddTemplate() public {
        vm.startPrank(owner);

        bytes32 customTemplateId = keccak256("CUSTOM_TEMPLATE");
        address customTemplate = address(new BasicERC20Template());

        // Expect TemplateUpdated event
        vm.expectEmit(true, true, false, true);
        emit TemplateUpdated(customTemplateId, customTemplate);

        TokenFactory(factory).addTemplate(customTemplateId, customTemplate);

        address retrievedTemplate = TokenFactory(factory).getTemplate(customTemplateId);
        assertEq(retrievedTemplate, customTemplate, "Template should be added correctly");

        vm.stopPrank();
    }

    function testNonOwnerCannotAddTemplate() public {
        vm.startPrank(user1);

        bytes32 customTemplateId = keccak256("CUSTOM_TEMPLATE");
        address customTemplate = address(new BasicERC20Template());

        vm.expectRevert();
        TokenFactory(factory).addTemplate(customTemplateId, customTemplate);

        vm.stopPrank();
    }

    // =============================================================================
    // Template Removal Tests (Owner Only)
    // =============================================================================

    function testOwnerCanRemoveTemplate() public {
        vm.startPrank(owner);

        bytes32 customTemplateId = keccak256("CUSTOM_TEMPLATE");
        address customTemplate = address(new BasicERC20Template());

        // First add a template
        TokenFactory(factory).addTemplate(customTemplateId, customTemplate);
        assertTrue(TokenFactory(factory).getTemplate(customTemplateId) != address(0), "Template should be added");

        // Remove the template
        TokenFactory(factory).removeTemplate(customTemplateId);

        address retrievedTemplate = TokenFactory(factory).getTemplate(customTemplateId);
        assertEq(retrievedTemplate, address(0), "Template should return zero address");

        vm.stopPrank();
    }

    function testNonOwnerCannotRemoveTemplate() public {
        vm.startPrank(owner);
        bytes32 customTemplateId = keccak256("CUSTOM_TEMPLATE");
        address customTemplate = address(new BasicERC20Template());
        TokenFactory(factory).addTemplate(customTemplateId, customTemplate);
        vm.stopPrank();

        vm.startPrank(user1);

        vm.expectRevert();
        TokenFactory(factory).removeTemplate(customTemplateId);

        vm.stopPrank();

        // Verify template still exists
        assertTrue(TokenFactory(factory).getTemplate(customTemplateId) != address(0), "Template should still exist");
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

        // Test gas efficiency of auto-selection
        uint256 gasBefore = gasleft();
        TokenFactory(factory).createToken{value: SERVICE_FEE}(config);
        uint256 autoGasUsed = gasBefore - gasleft();

        console.log("Gas used with auto-selection:", autoGasUsed);

        // Should be reasonable gas usage (under 500K for complex features)
        assertTrue(autoGasUsed < 500000, "Token creation should be gas efficient");

        vm.stopPrank();
    }

    // Test will pass with actual TokenFactory implementation
    receive() external payable {}
}