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
 * @title TokenFactory Test Suite
 * @dev Comprehensive tests for TokenFactory createToken functionality
 */
contract TokenFactoryTest is Test {
    // Test accounts
    address public factory;
    address public owner;
    address public user1;
    address public user2;
    address public feeRecipient;

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
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply,
        uint8 decimals,
        bytes32 indexed configHash
    );

    function setUp() public {
        // Setup test accounts
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        feeRecipient = makeAddr("feeRecipient");

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
            feeRecipient,
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

        console.log("TokenFactory Test Setup Complete");
        console.log("Factory address:", factory);
        console.log("Owner:", owner);
        console.log("User1:", user1);
        console.log("User2:", user2);
    }

    // =============================================================================
    // Basic Token Creation Tests
    // =============================================================================

    function testCreateBasicToken() public {
        vm.startPrank(user1);

        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Test Token",
            symbol: "TEST",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        // Expect TokenCreated event (we don't check token address as it's created dynamically)
        vm.expectEmit(false, true, true, false);
        emit TokenCreated(
            address(0), // Token address will be different each time
            user1,
            "Test Token",
            "TEST",
            1000000 * 10**18,
            18,
            keccak256(abi.encode(config))
        );

        address tokenAddress = TokenFactory(factory).createToken{value: SERVICE_FEE}(config);

        // Verify token was created
        assertTrue(tokenAddress != address(0), "Token address should not be zero");

        // Verify token properties using BasicERC20Template
        BasicERC20Template token = BasicERC20Template(tokenAddress);
        assertEq(token.name(), "Test Token", "Token name mismatch");
        assertEq(token.symbol(), "TEST", "Token symbol mismatch");
        assertEq(token.decimals(), 18, "Token decimals mismatch");
        assertEq(token.totalSupply(), 1000000 * 10**18, "Token total supply mismatch");
        assertEq(token.balanceOf(user1), 1000000 * 10**18, "Initial balance mismatch");
        assertEq(token.owner(), user1, "Token owner mismatch");

        vm.stopPrank();
    }

    function testCreateTokenWithAllFeatures() public {
        vm.startPrank(user1);

        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Full Feature Token",
            symbol: "FULL",
            totalSupply: 500000 * 10**18,
            decimals: 18,
            mintable: true,
            burnable: true,
            pausable: true,
            capped: true,
            maxSupply: 1000000 * 10**18,
            initialOwner: user1
        });

        address tokenAddress = TokenFactory(factory).createToken{value: SERVICE_FEE}(config);

        assertTrue(tokenAddress != address(0), "Token address should not be zero");

        // Verify with ERC20Template (full featured)
        ERC20Template token = ERC20Template(tokenAddress);
        assertEq(token.name(), "Full Feature Token", "Token name mismatch");
        assertEq(token.symbol(), "FULL", "Token symbol mismatch");
        assertEq(token.totalSupply(), 500000 * 10**18, "Token total supply mismatch");
        assertTrue(token.isMintable(), "Token should be mintable");
        assertTrue(token.isBurnable(), "Token should be burnable");
        assertTrue(token.isPausable(), "Token should be pausable");
        assertTrue(token.isCapped(), "Token should be capped");

        vm.stopPrank();
    }

    function testCreateTokenWithCustomDecimals() public {
        vm.startPrank(user1);

        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Six Decimal Token",
            symbol: "SIX",
            totalSupply: 1000000 * 10**6,
            decimals: 6,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        address tokenAddress = TokenFactory(factory).createToken{value: SERVICE_FEE}(config);

        assertTrue(tokenAddress != address(0), "Token address should not be zero");

        BasicERC20Template token = BasicERC20Template(tokenAddress);
        assertEq(token.decimals(), 6, "Token decimals should be 6");
        assertEq(token.totalSupply(), 1000000 * 10**6, "Token total supply mismatch");

        vm.stopPrank();
    }

    // =============================================================================
    // Fee Payment Tests
    // =============================================================================

    function testCreateTokenRequiresServiceFee() public {
        vm.startPrank(user1);

        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Fee Test Token",
            symbol: "FEE",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        // Should revert with insufficient fee
        vm.expectRevert(abi.encodeWithSelector(ITokenFactory.InsufficientServiceFee.selector));
        TokenFactory(factory).createToken{value: SERVICE_FEE - 1}(config);

        vm.stopPrank();
    }

    function testCreateTokenWithExactServiceFee() public {
        vm.startPrank(user1);

        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Exact Fee Token",
            symbol: "EXACT",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        uint256 balanceBefore = user1.balance;
        address tokenAddress = TokenFactory(factory).createToken{value: SERVICE_FEE}(config);
        uint256 balanceAfter = user1.balance;

        assertTrue(tokenAddress != address(0), "Token should be created");
        assertEq(balanceBefore - balanceAfter, SERVICE_FEE, "Service fee should be deducted");

        vm.stopPrank();
    }

    function testCreateTokenWithExcessFee() public {
        vm.startPrank(user1);

        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Excess Fee Token",
            symbol: "EXCESS",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        uint256 excessFee = SERVICE_FEE + 0.005 ether;
        uint256 balanceBefore = user1.balance;
        address tokenAddress = TokenFactory(factory).createToken{value: excessFee}(config);
        uint256 balanceAfter = user1.balance;

        assertTrue(tokenAddress != address(0), "Token should be created");
        // Should only charge service fee, excess should be refunded
        assertEq(balanceBefore - balanceAfter, SERVICE_FEE, "Only service fee should be charged");

        vm.stopPrank();
    }

    // =============================================================================
    // Validation Tests
    // =============================================================================

    function testCreateTokenWithInvalidName() public {
        vm.startPrank(user1);

        // Empty name
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "",
            symbol: "EMPTY",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        vm.expectRevert(abi.encodeWithSelector(ITokenFactory.InvalidConfiguration.selector));
        TokenFactory(factory).createToken{value: SERVICE_FEE}(config);

        // Name too long (>50 chars)
        config.name = "This is a very long token name that exceeds the maximum allowed length of fifty characters";
        vm.expectRevert(abi.encodeWithSelector(ITokenFactory.InvalidConfiguration.selector));
        TokenFactory(factory).createToken{value: SERVICE_FEE}(config);

        vm.stopPrank();
    }

    function testCreateTokenWithInvalidSymbol() public {
        vm.startPrank(user1);

        // Empty symbol
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Valid Name",
            symbol: "",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        vm.expectRevert(abi.encodeWithSelector(ITokenFactory.InvalidConfiguration.selector));
        TokenFactory(factory).createToken{value: SERVICE_FEE}(config);

        // Symbol too long (>10 chars)
        config.symbol = "VERYLONGSYMBOL";
        vm.expectRevert(abi.encodeWithSelector(ITokenFactory.InvalidConfiguration.selector));
        TokenFactory(factory).createToken{value: SERVICE_FEE}(config);

        vm.stopPrank();
    }

    function testCreateTokenWithInvalidDecimals() public {
        vm.startPrank(user1);

        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Invalid Decimals Token",
            symbol: "INVDEC",
            totalSupply: 1000000 * 10**18,
            decimals: 19, // Invalid: > 18
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        vm.expectRevert(abi.encodeWithSelector(ITokenFactory.InvalidConfiguration.selector));
        TokenFactory(factory).createToken{value: SERVICE_FEE}(config);

        vm.stopPrank();
    }

    function testCreateTokenWithZeroSupply() public {
        vm.startPrank(user1);

        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Zero Supply Token",
            symbol: "ZERO",
            totalSupply: 0,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        vm.expectRevert(abi.encodeWithSelector(ITokenFactory.InvalidConfiguration.selector));
        TokenFactory(factory).createToken{value: SERVICE_FEE}(config);

        vm.stopPrank();
    }

    function testCreateTokenWithInvalidCappedConfiguration() public {
        vm.startPrank(user1);

        // maxSupply < totalSupply when capped is true
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Invalid Capped Token",
            symbol: "INVCAP",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: true,
            maxSupply: 500000 * 10**18, // Less than totalSupply
            initialOwner: user1
        });

        vm.expectRevert(abi.encodeWithSelector(ITokenFactory.InvalidConfiguration.selector));
        TokenFactory(factory).createToken{value: SERVICE_FEE}(config);

        vm.stopPrank();
    }

    // =============================================================================
    // Symbol Uniqueness Tests
    // =============================================================================

    function testCreateTokenWithDuplicateSymbol() public {
        vm.startPrank(user1);

        ITokenFactory.TokenConfig memory config1 = ITokenFactory.TokenConfig({
            name: "First Token",
            symbol: "DUPE",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        // Create first token
        address token1 = TokenFactory(factory).createToken{value: SERVICE_FEE}(config1);
        assertTrue(token1 != address(0), "First token should be created");

        vm.stopPrank();
        vm.startPrank(user2);

        // Try to create second token with same symbol
        ITokenFactory.TokenConfig memory config2 = ITokenFactory.TokenConfig({
            name: "Second Token",
            symbol: "DUPE", // Same symbol
            totalSupply: 2000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user2
        });

        vm.expectRevert(abi.encodeWithSelector(ITokenFactory.SymbolAlreadyExists.selector));
        TokenFactory(factory).createToken{value: SERVICE_FEE}(config2);

        vm.stopPrank();
    }

    // =============================================================================
    // Gas Optimization Tests
    // =============================================================================

    function testTokenCreationGasCost() public {
        vm.startPrank(user1);

        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Gas Test Token",
            symbol: "GAS",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        uint256 gasBefore = gasleft();
        address tokenAddress = TokenFactory(factory).createToken{value: SERVICE_FEE}(config);
        uint256 gasUsed = gasBefore - gasleft();

        assertTrue(tokenAddress != address(0), "Token should be created");
        console.log("Gas used for basic token creation:", gasUsed);

        // Gas should be reasonable (adjust based on actual implementation)
        assertTrue(gasUsed < 5000000, "Gas usage should be reasonable");

        vm.stopPrank();
    }

    function testCalculateDeploymentCost() public view {
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Cost Test Token",
            symbol: "COST",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        (uint256 gasCost, uint256 serviceFee) = TokenFactory(factory).calculateDeploymentCost(config);

        assertTrue(gasCost > 0, "Gas cost should be greater than zero");
        assertEq(serviceFee, SERVICE_FEE, "Service fee should match expected value");

        console.log("Estimated gas cost:", gasCost);
        console.log("Service fee:", serviceFee);
    }

    // =============================================================================
    // Multi-chain Compatibility Tests
    // =============================================================================

    function testTokenCreationOnDifferentChains() public {
        // Test with different chain configurations
        uint256[] memory chainIds = new uint256[](3);
        chainIds[0] = 1; // Ethereum
        chainIds[1] = 137; // Polygon
        chainIds[2] = 56; // BSC

        for (uint256 i = 0; i < chainIds.length; i++) {
            vm.chainId(chainIds[i]);

            vm.startPrank(user1);

            ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
                name: string(abi.encodePacked("Chain Token ", vm.toString(chainIds[i]))),
                symbol: string(abi.encodePacked("CHAIN", vm.toString(chainIds[i]))),
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
            assertTrue(tokenAddress != address(0), "Token should be created on all chains");

            vm.stopPrank();
        }
    }

    // =============================================================================
    // XSC Pre-Shanghai EVM Compatibility Tests
    // =============================================================================

    function testPreShanghaiCompatibility() public {
        // Test that the factory works with pre-Shanghai EVM features
        vm.startPrank(user1);

        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Pre-Shanghai Token",
            symbol: "PRE",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        // This should work without using post-Shanghai opcodes
        address tokenAddress = TokenFactory(factory).createToken{value: SERVICE_FEE}(config);
        assertTrue(tokenAddress != address(0), "Token should be created on pre-Shanghai EVM");

        vm.stopPrank();
    }

    // =============================================================================
    // Edge Cases and Error Conditions
    // =============================================================================

    function testCreateTokenWithZeroAddress() public {
        vm.startPrank(user1);

        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Zero Owner Token",
            symbol: "ZERO",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: address(0)
        });

        vm.expectRevert(abi.encodeWithSelector(ITokenFactory.InvalidConfiguration.selector));
        TokenFactory(factory).createToken{value: SERVICE_FEE}(config);

        vm.stopPrank();
    }

    // =============================================================================
    // State Tracking Tests
    // =============================================================================

    function testGetTokensByCreator() public {
        vm.startPrank(user1);

        // Create multiple tokens
        for (uint256 i = 0; i < 3; i++) {
            ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
                name: string(abi.encodePacked("Token ", vm.toString(i))),
                symbol: string(abi.encodePacked("TOK", vm.toString(i))),
                totalSupply: 1000000 * 10**18,
                decimals: 18,
                mintable: false,
                burnable: false,
                pausable: false,
                capped: false,
                maxSupply: 0,
                initialOwner: user1
            });

            TokenFactory(factory).createToken{value: SERVICE_FEE}(config);
        }

        address[] memory tokens = TokenFactory(factory).getTokensByCreator(user1);
        assertEq(tokens.length, 3, "Should have 3 tokens created by user1");

        vm.stopPrank();
    }

    function testIsTokenDeployed() public {
        vm.startPrank(user1);

        // Check non-existent token
        assertFalse(TokenFactory(factory).isTokenDeployed("NOTEXIST"), "Token should not exist");

        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Deployed Test Token",
            symbol: "DEPLOY",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        TokenFactory(factory).createToken{value: SERVICE_FEE}(config);

        // Check deployed token
        assertTrue(TokenFactory(factory).isTokenDeployed("DEPLOY"), "Token should exist after creation");

        vm.stopPrank();
    }

    // =============================================================================
    // Configuration Validation Tests
    // =============================================================================

    function testValidateConfiguration() public view {
        ITokenFactory.TokenConfig memory validConfig = ITokenFactory.TokenConfig({
            name: "Valid Token",
            symbol: "VALID",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        (bool valid, string memory reason) = TokenFactory(factory).validateConfiguration(validConfig);
        assertTrue(valid, "Valid configuration should pass validation");
        assertEq(bytes(reason).length, 0, "No reason should be provided for valid config");

        ITokenFactory.TokenConfig memory invalidConfig = ITokenFactory.TokenConfig({
            name: "",
            symbol: "INVALID",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        (bool invalid, string memory invalidReason) = TokenFactory(factory).validateConfiguration(invalidConfig);
        assertFalse(invalid, "Invalid configuration should fail validation");
        assertTrue(bytes(invalidReason).length > 0, "Reason should be provided for invalid config");
    }

    // =============================================================================
    // Fuzz Tests
    // =============================================================================

    function testFuzzTokenCreation(
        string calldata name,
        string calldata symbol,
        uint256 totalSupply,
        uint8 decimals
    ) public {
        vm.assume(bytes(name).length > 0 && bytes(name).length <= 50);
        vm.assume(bytes(symbol).length > 0 && bytes(symbol).length <= 10);
        vm.assume(totalSupply > 0 && totalSupply <= type(uint256).max);
        vm.assume(decimals <= 18);

        vm.startPrank(user1);

        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: name,
            symbol: symbol,
            totalSupply: totalSupply,
            decimals: decimals,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        // Skip if symbol already exists
        if (TokenFactory(factory).isTokenDeployed(symbol)) {
            vm.stopPrank();
            return;
        }

        address tokenAddress = TokenFactory(factory).createToken{value: SERVICE_FEE}(config);
        assertTrue(tokenAddress != address(0), "Fuzz test: Token should be created");

        vm.stopPrank();
    }

    // =============================================================================
    // Helper Functions
    // =============================================================================

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

    // Test will pass with actual TokenFactory implementation
    receive() external payable {}
}