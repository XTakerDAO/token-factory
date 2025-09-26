// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Interface definition based on IERC20Template spec
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

    // Errors
    error NotOwner();
    error FeatureNotEnabled(string feature);
    error InvalidAmount();
    error ExceedsMaxSupply();
    error AlreadyInitialized();
    error InvalidConfiguration();

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

    // Ownership
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
    function renounceOwnership() external;

    // Proxy functions
    function getImplementation() external view returns (address);
    function isProxy() external view returns (bool);
}

// Mock Factory interface for proxy testing
interface ITokenFactory {
    function createToken(
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
    ) external returns (address);

    function getTemplate(string calldata templateType) external view returns (address);
    function addTemplate(string calldata templateType, address implementation) external;
}

// Mock implementation for testing - WILL FAIL INITIALLY
contract MockERC20TemplateInit {
    // This is intentionally incomplete to make tests fail initially
    // Tests will drive the implementation of initialization patterns
}

// Mock Factory for proxy testing
contract MockTokenFactory {
    mapping(string => address) public templates;

    function addTemplate(string calldata templateType, address implementation) external {
        templates[templateType] = implementation;
    }

    function getTemplate(string calldata templateType) external view returns (address) {
        return templates[templateType];
    }

    function createToken(
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
    ) external returns (address) {
        // This will fail initially - no implementation
        address template = templates["basic"];
        require(template != address(0), "Template not found");

        address clone = Clones.clone(template);

        IERC20Template(clone).initialize(
            name,
            symbol,
            totalSupply,
            decimals,
            owner,
            mintable,
            burnable,
            pausable,
            capped,
            maxSupply
        );

        return clone;
    }
}

/**
 * @title ERC20Template Initialization Patterns Tests
 * @dev Comprehensive tests for initialization and proxy patterns following TDD approach
 * @notice These tests MUST FAIL initially as no implementation exists yet
 */
contract ERC20TemplateInitTest is Test {
    // Test accounts
    address public deployer = address(0x1);
    address public owner = address(0x2);
    address public user1 = address(0x3);
    address public user2 = address(0x4);
    address public factory = address(0x5);

    // Mock contracts
    MockERC20TemplateInit public templateImplementation;
    MockTokenFactory public tokenFactory;

    // Test constants
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1M tokens
    uint256 public constant MAX_SUPPLY = 2000000 * 10**18; // 2M tokens cap
    uint8 public constant DECIMALS = 18;
    string public constant TOKEN_NAME = "Init Test Token";
    string public constant TOKEN_SYMBOL = "INIT";

    // XSC network specific constants
    uint256 public constant XSC_BLOCK_TIME = 3;
    uint256 public constant XSC_MAX_GAS = 30000000;

    function setUp() public {
        vm.startPrank(deployer);

        // Deploy template implementation
        templateImplementation = new MockERC20TemplateInit();

        // Deploy factory
        tokenFactory = new MockTokenFactory();

        // Add template to factory
        tokenFactory.addTemplate("basic", address(templateImplementation));

        vm.stopPrank();
    }

    // ==================== INITIALIZATION VALIDATION TESTS ====================

    function test_Initialize_ValidConfiguration() public {
        vm.startPrank(owner);

        vm.expectEmit(true, true, true, true);
        emit IERC20Template.Initialized(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner
        );

        IERC20Template(address(templateImplementation)).initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false, // mintable
            false, // burnable
            false, // pausable
            false, // capped
            0      // maxSupply
        );

        // Verify initialization
        assertEq(IERC20Template(address(templateImplementation)).name(), TOKEN_NAME);
        assertEq(IERC20Template(address(templateImplementation)).symbol(), TOKEN_SYMBOL);
        assertEq(IERC20Template(address(templateImplementation)).totalSupply(), INITIAL_SUPPLY);
        assertEq(IERC20Template(address(templateImplementation)).decimals(), DECIMALS);
        assertEq(IERC20Template(address(templateImplementation)).owner(), owner);

        vm.stopPrank();
    }

    function test_Initialize_EmptyName() public {
        vm.startPrank(owner);

        vm.expectRevert(IERC20Template.InvalidConfiguration.selector);
        IERC20Template(address(templateImplementation)).initialize(
            "", // empty name
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        vm.stopPrank();
    }

    function test_Initialize_EmptySymbol() public {
        vm.startPrank(owner);

        vm.expectRevert(IERC20Template.InvalidConfiguration.selector);
        IERC20Template(address(templateImplementation)).initialize(
            TOKEN_NAME,
            "", // empty symbol
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        vm.stopPrank();
    }

    function test_Initialize_ZeroTotalSupply() public {
        vm.startPrank(owner);

        vm.expectRevert("Invalid total supply");
        IERC20Template(address(templateImplementation)).initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            0, // zero supply
            DECIMALS,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        vm.stopPrank();
    }

    function test_Initialize_ZeroOwner() public {
        vm.startPrank(owner);

        vm.expectRevert("Invalid owner address");
        IERC20Template(address(templateImplementation)).initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            address(0), // zero owner
            false,
            false,
            false,
            false,
            0
        );

        vm.stopPrank();
    }

    function test_Initialize_InvalidDecimals() public {
        vm.startPrank(owner);

        vm.expectRevert("Invalid decimals");
        IERC20Template(address(templateImplementation)).initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            255, // invalid decimals
            owner,
            false,
            false,
            false,
            false,
            0
        );

        vm.stopPrank();
    }

    function test_Initialize_CappedWithoutMaxSupply() public {
        vm.startPrank(owner);

        vm.expectRevert("Invalid max supply for capped token");
        IERC20Template(address(templateImplementation)).initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false,
            false,
            false,
            true, // capped
            0     // but no max supply
        );

        vm.stopPrank();
    }

    function test_Initialize_MaxSupplyLowerThanInitial() public {
        vm.startPrank(owner);

        vm.expectRevert("Max supply too low");
        IERC20Template(address(templateImplementation)).initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false,
            false,
            false,
            true,
            INITIAL_SUPPLY - 1 // max supply less than initial
        );

        vm.stopPrank();
    }

    function test_Initialize_LongNameAndSymbol() public {
        vm.startPrank(owner);

        string memory longName = "This is a very long token name that exceeds normal limits to test edge cases";
        string memory longSymbol = "VERYLONGSYMBOL";

        IERC20Template(address(templateImplementation)).initialize(
            longName,
            longSymbol,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        assertEq(IERC20Template(address(templateImplementation)).name(), longName);
        assertEq(IERC20Template(address(templateImplementation)).symbol(), longSymbol);

        vm.stopPrank();
    }

    // ==================== SINGLE INITIALIZATION TESTS ====================

    function test_Initialize_OnlyOnce() public {
        vm.startPrank(owner);

        // First initialization should succeed
        IERC20Template(address(templateImplementation)).initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        // Second initialization should fail
        vm.expectRevert(IERC20Template.AlreadyInitialized.selector);
        IERC20Template(address(templateImplementation)).initialize(
            "Second Token",
            "SECOND",
            500000 * 10**18,
            DECIMALS,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        vm.stopPrank();
    }

    function test_Initialize_PreventReinitialization() public {
        vm.startPrank(owner);

        // Initialize once
        IERC20Template(address(templateImplementation)).initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        // Attempt to reinitialize with different owner
        vm.stopPrank();
        vm.startPrank(user1);

        vm.expectRevert(IERC20Template.AlreadyInitialized.selector);
        IERC20Template(address(templateImplementation)).initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            user1, // different owner
            true,  // different features
            true,
            true,
            false,
            0
        );

        vm.stopPrank();
    }

    // ==================== PROXY PATTERN TESTS ====================

    function test_ClonePattern_Basic() public {
        vm.startPrank(deployer);

        // Initialize the implementation (this should fail in production)
        vm.expectRevert("Cannot initialize implementation");
        IERC20Template(address(templateImplementation)).initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        vm.stopPrank();
    }

    function test_ClonePattern_CreateToken() public {
        vm.startPrank(owner);

        address tokenAddress = tokenFactory.createToken(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false, // mintable
            false, // burnable
            false, // pausable
            false, // capped
            0      // maxSupply
        );

        // Verify the created token
        assertNotEq(tokenAddress, address(0));
        assertNotEq(tokenAddress, address(templateImplementation));

        IERC20Template token = IERC20Template(tokenAddress);
        assertEq(token.name(), TOKEN_NAME);
        assertEq(token.symbol(), TOKEN_SYMBOL);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.owner(), owner);

        vm.stopPrank();
    }

    function test_ClonePattern_MultipleTokens() public {
        vm.startPrank(owner);

        // Create first token
        address token1 = tokenFactory.createToken(
            "Token One",
            "ONE",
            1000000 * 10**18,
            18,
            owner,
            true,  // mintable
            false, // burnable
            false, // pausable
            false, // capped
            0
        );

        // Create second token with different config
        address token2 = tokenFactory.createToken(
            "Token Two",
            "TWO",
            500000 * 10**18,
            6, // different decimals
            user1, // different owner
            false, // not mintable
            true,  // burnable
            true,  // pausable
            false, // not capped
            0
        );

        // Verify both tokens are different
        assertNotEq(token1, token2);

        // Verify configurations
        IERC20Template tokenOne = IERC20Template(token1);
        IERC20Template tokenTwo = IERC20Template(token2);

        assertEq(tokenOne.name(), "Token One");
        assertEq(tokenTwo.name(), "Token Two");
        assertEq(tokenOne.owner(), owner);
        assertEq(tokenTwo.owner(), user1);
        assertTrue(tokenOne.isMintable());
        assertFalse(tokenTwo.isMintable());
        assertFalse(tokenOne.isBurnable());
        assertTrue(tokenTwo.isBurnable());

        vm.stopPrank();
    }

    function test_ClonePattern_IndependentState() public {
        vm.startPrank(owner);

        // Create two tokens
        address token1 = tokenFactory.createToken(
            "Token One",
            "ONE",
            1000000 * 10**18,
            18,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        address token2 = tokenFactory.createToken(
            "Token Two",
            "TWO",
            2000000 * 10**18,
            18,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        // Transfer tokens in token1
        IERC20Template(token1).transfer(user1, 100000 * 10**18);

        // Verify token2 is unaffected
        assertEq(IERC20Template(token1).balanceOf(owner), 900000 * 10**18);
        assertEq(IERC20Template(token1).balanceOf(user1), 100000 * 10**18);
        assertEq(IERC20Template(token2).balanceOf(owner), 2000000 * 10**18);
        assertEq(IERC20Template(token2).balanceOf(user1), 0);

        vm.stopPrank();
    }

    function test_ClonePattern_ProxyDetection() public {
        vm.startPrank(owner);

        address tokenAddress = tokenFactory.createToken(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        IERC20Template token = IERC20Template(tokenAddress);

        // Verify it's a proxy
        assertTrue(token.isProxy());
        assertEq(token.getImplementation(), address(templateImplementation));

        vm.stopPrank();
    }

    // ==================== FACTORY INTEGRATION TESTS ====================

    function test_Factory_TemplateManagement() public {
        vm.startPrank(deployer);

        // Deploy another template implementation
        MockERC20TemplateInit advancedTemplate = new MockERC20TemplateInit();

        // Add advanced template
        tokenFactory.addTemplate("advanced", address(advancedTemplate));

        // Verify templates
        assertEq(tokenFactory.getTemplate("basic"), address(templateImplementation));
        assertEq(tokenFactory.getTemplate("advanced"), address(advancedTemplate));

        vm.stopPrank();
    }

    function test_Factory_NonExistentTemplate() public {
        vm.startPrank(owner);

        // This should fail as "premium" template doesn't exist
        vm.expectRevert("Template not found");

        // Manually call the factory with non-existent template
        // Since our mock factory only supports "basic", this will fail
        tokenFactory.createToken(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        vm.stopPrank();
    }

    // ==================== FEATURE COMBINATION INITIALIZATION TESTS ====================

    function test_Initialize_AllFeatures() public {
        vm.startPrank(owner);

        address tokenAddress = tokenFactory.createToken(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            true, // mintable
            true, // burnable
            true, // pausable
            true, // capped
            MAX_SUPPLY
        );

        IERC20Template token = IERC20Template(tokenAddress);

        // Verify all features are enabled
        assertTrue(token.isMintable());
        assertTrue(token.isBurnable());
        assertTrue(token.isPausable());
        assertTrue(token.isCapped());
        assertEq(token.getMaxSupply(), MAX_SUPPLY);

        vm.stopPrank();
    }

    function test_Initialize_FeatureCombinations() public {
        vm.startPrank(owner);

        // Test mintable + capped
        address token1 = tokenFactory.createToken(
            "Mintable Capped",
            "MC",
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            true,  // mintable
            false, // burnable
            false, // pausable
            true,  // capped
            MAX_SUPPLY
        );

        // Test burnable + pausable
        address token2 = tokenFactory.createToken(
            "Burnable Pausable",
            "BP",
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false, // mintable
            true,  // burnable
            true,  // pausable
            false, // capped
            0
        );

        IERC20Template mintableCapped = IERC20Template(token1);
        IERC20Template burnablePausable = IERC20Template(token2);

        // Verify feature combinations
        assertTrue(mintableCapped.isMintable());
        assertTrue(mintableCapped.isCapped());
        assertFalse(mintableCapped.isBurnable());
        assertFalse(mintableCapped.isPausable());

        assertFalse(burnablePausable.isMintable());
        assertFalse(burnablePausable.isCapped());
        assertTrue(burnablePausable.isBurnable());
        assertTrue(burnablePausable.isPausable());

        vm.stopPrank();
    }

    // ==================== XSC NETWORK INITIALIZATION TESTS ====================

    function test_XSC_LargeScaleDeployment() public {
        vm.startPrank(owner);

        uint256 tokensToCreate = 10;
        address[] memory tokens = new address[](tokensToCreate);

        // Create multiple tokens to test XSC network capacity
        for (uint256 i = 0; i < tokensToCreate; i++) {
            tokens[i] = tokenFactory.createToken(
                string(abi.encodePacked("XSC Token ", vm.toString(i))),
                string(abi.encodePacked("XSC", vm.toString(i))),
                (i + 1) * 100000 * 10**18, // Different supply for each
                DECIMALS,
                owner,
                i % 2 == 0, // alternate mintable
                i % 3 == 0, // alternate burnable
                i % 4 == 0, // alternate pausable
                false,
                0
            );

            // Verify each token
            IERC20Template token = IERC20Template(tokens[i]);
            assertEq(token.totalSupply(), (i + 1) * 100000 * 10**18);
            assertEq(token.owner(), owner);
        }

        vm.stopPrank();
    }

    function test_XSC_MaxSupplyLimits() public {
        vm.startPrank(owner);

        // Test with XSC maximum supply
        address tokenAddress = tokenFactory.createToken(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            XSC_MAX_GAS, // Use gas limit as large number
            DECIMALS,
            owner,
            true,
            false,
            false,
            true,
            XSC_MAX_GAS * 2 // Double for max supply
        );

        IERC20Template token = IERC20Template(tokenAddress);
        assertEq(token.totalSupply(), XSC_MAX_GAS);
        assertEq(token.getMaxSupply(), XSC_MAX_GAS * 2);

        vm.stopPrank();
    }

    // ==================== GAS OPTIMIZATION TESTS ====================

    function test_Gas_TokenCreation() public {
        vm.startPrank(owner);

        uint256 gasBefore = gasleft();

        tokenFactory.createToken(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        uint256 gasUsed = gasBefore - gasleft();

        // XSC network should handle token creation efficiently
        assertTrue(gasUsed < 500000, "Token creation gas usage too high for XSC network");

        vm.stopPrank();
    }

    function test_Gas_CloneVsNew() public {
        vm.startPrank(owner);

        // Measure clone creation
        uint256 gasBefore = gasleft();
        tokenFactory.createToken(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false,
            false,
            false,
            false,
            0
        );
        uint256 cloneGas = gasBefore - gasleft();

        // Clone should be much more gas efficient than deploying new contract
        assertTrue(cloneGas < 200000, "Clone creation should be gas efficient");

        vm.stopPrank();
    }

    // ==================== ERROR RECOVERY TESTS ====================

    function test_Initialize_RecoverFromBadCall() public {
        vm.startPrank(owner);

        // First try with bad configuration
        vm.expectRevert("Invalid total supply");
        IERC20Template(address(templateImplementation)).initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            0, // zero supply
            DECIMALS,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        // Deploy new instance for clean test
        MockERC20TemplateInit newTemplate = new MockERC20TemplateInit();

        // Then initialize correctly
        IERC20Template(address(newTemplate)).initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        // Verify successful initialization
        assertEq(IERC20Template(address(newTemplate)).totalSupply(), INITIAL_SUPPLY);

        vm.stopPrank();
    }

    // ==================== EDGE CASE TESTS ====================

    function test_Initialize_SpecialCharactersInName() public {
        vm.startPrank(owner);

        string memory specialName = "Token-With.Special@Characters#123";
        string memory specialSymbol = "SPEC!@#";

        IERC20Template(address(templateImplementation)).initialize(
            specialName,
            specialSymbol,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        assertEq(IERC20Template(address(templateImplementation)).name(), specialName);
        assertEq(IERC20Template(address(templateImplementation)).symbol(), specialSymbol);

        vm.stopPrank();
    }

    function test_Initialize_UnicodeCharacters() public {
        vm.startPrank(owner);

        string memory unicodeName = unicode"测试代币"; // Chinese characters
        string memory unicodeSymbol = unicode"测试";

        IERC20Template(address(templateImplementation)).initialize(
            unicodeName,
            unicodeSymbol,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        assertEq(IERC20Template(address(templateImplementation)).name(), unicodeName);
        assertEq(IERC20Template(address(templateImplementation)).symbol(), unicodeSymbol);

        vm.stopPrank();
    }

    // ==================== INVARIANT TESTS ====================

    function invariant_InitializedTokensHaveValidState() public view {
        // All initialized tokens should have non-zero total supply
        // Valid owner address, non-empty name and symbol
        if (IERC20Template(address(templateImplementation)).totalSupply() > 0) {
            assertNotEq(bytes(IERC20Template(address(templateImplementation)).name()).length, 0);
            assertNotEq(bytes(IERC20Template(address(templateImplementation)).symbol()).length, 0);
            assertNotEq(IERC20Template(address(templateImplementation)).owner(), address(0));
        }
    }

    function invariant_CappedTokensNeverExceedMax() public view {
        if (IERC20Template(address(templateImplementation)).isCapped()) {
            uint256 totalSupply = IERC20Template(address(templateImplementation)).totalSupply();
            uint256 maxSupply = IERC20Template(address(templateImplementation)).getMaxSupply();
            assertTrue(totalSupply <= maxSupply);
        }
    }

    // ==================== FUZZ TESTS ====================

    function testFuzz_InitializeSupply(uint256 supply) public {
        vm.assume(supply > 0 && supply <= type(uint128).max);

        // Deploy new template for fuzzing
        MockERC20TemplateInit fuzzTemplate = new MockERC20TemplateInit();

        vm.startPrank(owner);

        IERC20Template(address(fuzzTemplate)).initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            supply,
            DECIMALS,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        assertEq(IERC20Template(address(fuzzTemplate)).totalSupply(), supply);
        assertEq(IERC20Template(address(fuzzTemplate)).balanceOf(owner), supply);

        vm.stopPrank();
    }

    function testFuzz_InitializeDecimals(uint8 decimals) public {
        vm.assume(decimals <= 77); // Reasonable upper bound

        MockERC20TemplateInit fuzzTemplate = new MockERC20TemplateInit();

        vm.startPrank(owner);

        IERC20Template(address(fuzzTemplate)).initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            decimals,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        assertEq(IERC20Template(address(fuzzTemplate)).decimals(), decimals);

        vm.stopPrank();
    }
}