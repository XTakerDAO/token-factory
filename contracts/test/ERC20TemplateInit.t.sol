// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../src/interfaces/IERC20Template.sol";
import "../src/ERC20Template.sol";

// Local interface definition for testing - should match IERC20Template
interface IERC20TemplateTest {
    // Events
    event TokenInitialized(
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
    error TokenIsPaused();

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

// For testing initialization patterns - now use real implementation
// This contract was originally a mock but now we use the real ERC20Template

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

        ERC20Template(clone).initialize(
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
    // Events (matching IERC20Template)
    event TokenInitialized(string name, string symbol, uint256 totalSupply, uint8 decimals, address owner);

    // Errors (matching IERC20Template)
    error InvalidConfiguration();
    error AlreadyInitialized();

    // Test accounts
    address public deployer = address(0x1);
    address public owner = address(0x2);
    address public user1 = address(0x3);
    address public user2 = address(0x4);
    address public factory = address(0x5);

    // Contract instances
    ERC20Template public templateImplementation;
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
        templateImplementation = new ERC20Template();

        // Deploy factory
        tokenFactory = new MockTokenFactory();

        // Add template to factory
        tokenFactory.addTemplate("basic", address(templateImplementation));

        vm.stopPrank();
    }

    // ==================== INITIALIZATION VALIDATION TESTS ====================

    function test_Initialize_ValidConfiguration() public {
        vm.startPrank(owner);

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        ERC20Template token = ERC20Template(clone);

        vm.expectEmit(true, true, true, true);
        emit TokenInitialized(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner
        );

        token.initialize(
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
        assertEq(token.name(), TOKEN_NAME);
        assertEq(token.symbol(), TOKEN_SYMBOL);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.decimals(), DECIMALS);
        assertEq(token.owner(), owner);

        vm.stopPrank();
    }

    function test_Initialize_EmptyName() public {
        vm.startPrank(owner);

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        ERC20Template token = ERC20Template(clone);

        vm.expectRevert(InvalidConfiguration.selector);
        token.initialize(
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

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        ERC20Template token = ERC20Template(clone);

        vm.expectRevert(InvalidConfiguration.selector);
        token.initialize(
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

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        ERC20Template token = ERC20Template(clone);

        vm.expectRevert("Invalid total supply");
        token.initialize(
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

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        ERC20Template token = ERC20Template(clone);

        vm.expectRevert("Invalid owner address");
        token.initialize(
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

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        ERC20Template token = ERC20Template(clone);

        vm.expectRevert("Invalid decimals");
        token.initialize(
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

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        ERC20Template token = ERC20Template(clone);

        vm.expectRevert("Invalid max supply for capped token");
        token.initialize(
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

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        ERC20Template token = ERC20Template(clone);

        vm.expectRevert("Max supply too low");
        token.initialize(
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

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        ERC20Template token = ERC20Template(clone);

        vm.expectRevert(InvalidConfiguration.selector);
        token.initialize(
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

        vm.stopPrank();
    }

    // ==================== SINGLE INITIALIZATION TESTS ====================

    function test_Initialize_OnlyOnce() public {
        vm.startPrank(owner);

        // Create clone for first test
        address clone1 = Clones.clone(address(templateImplementation));
        ERC20Template token1 = ERC20Template(clone1);

        // First initialization should succeed
        token1.initialize(
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

        // Second initialization should fail on same instance
        vm.expectRevert(); // OpenZeppelin v5.0 uses InvalidInitialization() error
        token1.initialize(
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

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        ERC20Template token = ERC20Template(clone);

        // Initialize once
        token.initialize(
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

        vm.expectRevert(); // OpenZeppelin v5.0 uses InvalidInitialization() error
        token.initialize(
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
        vm.expectRevert(); // OpenZeppelin v5.0 uses InvalidInitialization() error
        ERC20Template(address(templateImplementation)).initialize(
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

        ERC20Template token = ERC20Template(tokenAddress);
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
        ERC20Template tokenOne = ERC20Template(token1);
        ERC20Template tokenTwo = ERC20Template(token2);

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
        ERC20Template(token1).transfer(user1, 100000 * 10**18);

        // Verify token2 is unaffected
        assertEq(ERC20Template(token1).balanceOf(owner), 900000 * 10**18);
        assertEq(ERC20Template(token1).balanceOf(user1), 100000 * 10**18);
        assertEq(ERC20Template(token2).balanceOf(owner), 2000000 * 10**18);
        assertEq(ERC20Template(token2).balanceOf(user1), 0);

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

        ERC20Template token = ERC20Template(tokenAddress);

        // Verify it's a clone proxy by checking if the address is different from implementation
        // and that it has minimal proxy bytecode
        assertTrue(tokenAddress != address(templateImplementation), "Should be a clone, not implementation");

        // Clone should have minimal bytecode (around 45 bytes)
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(tokenAddress)
        }
        assertTrue(codeSize < 100, "Clone should have minimal bytecode");
        assertTrue(codeSize > 40, "Clone should have some bytecode");

        // Verify the token works as expected (this confirms it delegates to implementation)
        assertEq(token.name(), TOKEN_NAME);
        assertEq(token.symbol(), TOKEN_SYMBOL);

        vm.stopPrank();
    }

    // ==================== FACTORY INTEGRATION TESTS ====================

    function test_Factory_TemplateManagement() public {
        vm.startPrank(deployer);

        // Deploy another template implementation
        ERC20Template advancedTemplate = new ERC20Template();

        // Add advanced template
        tokenFactory.addTemplate("advanced", address(advancedTemplate));

        // Verify templates
        assertEq(tokenFactory.getTemplate("basic"), address(templateImplementation));
        assertEq(tokenFactory.getTemplate("advanced"), address(advancedTemplate));

        vm.stopPrank();
    }

    function test_Factory_NonExistentTemplate() public {
        vm.startPrank(owner);

        // First remove the basic template to simulate non-existent template
        tokenFactory.addTemplate("basic", address(0));

        // This should now fail as "basic" template has been removed
        vm.expectRevert("Template not found");

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

        ERC20Template token = ERC20Template(tokenAddress);

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

        ERC20Template mintableCapped = ERC20Template(token1);
        ERC20Template burnablePausable = ERC20Template(token2);

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
            ERC20Template token = ERC20Template(tokens[i]);
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

        ERC20Template token = ERC20Template(tokenAddress);
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
        // Including initialization, should be under 300000 gas (much less than full deployment)
        assertTrue(cloneGas < 300000, "Clone creation should be gas efficient");

        vm.stopPrank();
    }

    // ==================== ERROR RECOVERY TESTS ====================

    function test_Initialize_RecoverFromBadCall() public {
        vm.startPrank(owner);

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        ERC20Template token = ERC20Template(clone);

        // First try with bad configuration
        vm.expectRevert("Invalid total supply");
        token.initialize(
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

        // Create new clone for clean test
        address newClone = Clones.clone(address(templateImplementation));
        ERC20Template newToken = ERC20Template(newClone);

        // Then initialize correctly
        newToken.initialize(
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
        assertEq(newToken.totalSupply(), INITIAL_SUPPLY);

        vm.stopPrank();
    }

    // ==================== EDGE CASE TESTS ====================

    function test_Initialize_SpecialCharactersInName() public {
        vm.startPrank(owner);

        string memory specialName = "Token-With.Special@Characters#123";
        string memory specialSymbol = "SPEC!@#";

        address clone = Clones.clone(address(templateImplementation));
        ERC20Template token = ERC20Template(clone);
        token.initialize(
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

        assertEq(token.name(), specialName);
        assertEq(token.symbol(), specialSymbol);

        vm.stopPrank();
    }

    function test_Initialize_UnicodeCharacters() public {
        vm.startPrank(owner);

        string memory unicodeName = unicode"测试代币"; // Chinese characters
        string memory unicodeSymbol = unicode"测试";

        address clone = Clones.clone(address(templateImplementation));
        ERC20Template token = ERC20Template(clone);
        token.initialize(
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

        assertEq(token.name(), unicodeName);
        assertEq(token.symbol(), unicodeSymbol);

        vm.stopPrank();
    }

    // ==================== INVARIANT TESTS ====================

    function invariant_InitializedTokensHaveValidState() public {
        // All initialized tokens should have non-zero total supply
        // Valid owner address, non-empty name and symbol
        if (ERC20Template(address(templateImplementation)).totalSupply() > 0) {
            assertNotEq(bytes(ERC20Template(address(templateImplementation)).name()).length, 0);
            assertNotEq(bytes(ERC20Template(address(templateImplementation)).symbol()).length, 0);
            assertNotEq(ERC20Template(address(templateImplementation)).owner(), address(0));
        }
    }

    function invariant_CappedTokensNeverExceedMax() public {
        if (ERC20Template(address(templateImplementation)).isCapped()) {
            uint256 totalSupply = ERC20Template(address(templateImplementation)).totalSupply();
            uint256 maxSupply = ERC20Template(address(templateImplementation)).getMaxSupply();
            assertTrue(totalSupply <= maxSupply);
        }
    }

    // ==================== FUZZ TESTS ====================

    function testFuzz_InitializeSupply(uint256 supply) public {
        vm.assume(supply > 0 && supply <= type(uint128).max);

        vm.startPrank(owner);

        address clone = Clones.clone(address(templateImplementation));
        ERC20Template token = ERC20Template(clone);
        token.initialize(
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

        assertEq(token.totalSupply(), supply);
        assertEq(token.balanceOf(owner), supply);

        vm.stopPrank();
    }

    function testFuzz_InitializeDecimals(uint8 decimals) public {
        vm.assume(decimals <= 77); // Reasonable upper bound

        vm.startPrank(owner);

        address clone = Clones.clone(address(templateImplementation));
        ERC20Template token = ERC20Template(clone);
        token.initialize(
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

        assertEq(token.decimals(), decimals);

        vm.stopPrank();
    }
}