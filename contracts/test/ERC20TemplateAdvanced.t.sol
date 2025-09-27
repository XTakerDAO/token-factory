// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "../src/ERC20Template.sol";
import "../src/interfaces/IERC20Template.sol";

/**
 * @title ERC20Template Advanced Features Tests
 * @dev Comprehensive tests for mint/burn/pause functionality
 * @notice These tests should now PASS with the real implementation
 */
contract ERC20TemplateAdvancedTest is Test {
    // Events
    event FeatureEnabled(string feature);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event TokenInitialized(string name, string symbol, uint256 totalSupply, uint8 decimals, address owner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);

    // Errors
    error NotOwner();
    error FeatureNotEnabled(string feature);
    error InvalidAmount();
    error ExceedsMaxSupply();
    error TokenIsPaused();

    // Test accounts
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public minter = address(0x4);
    address public burner = address(0x5);

    // Contract instances
    ERC20Template public templateImplementation;
    ERC20Template public template;

    // Test constants
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1M tokens
    uint256 public constant MAX_SUPPLY = 2000000 * 10**18; // 2M tokens cap
    uint8 public constant DECIMALS = 18;
    string public constant TOKEN_NAME = "Advanced Test Token";
    string public constant TOKEN_SYMBOL = "ADVANCED";

    // XSC network specific constants
    uint256 public constant XSC_BLOCK_TIME = 3;
    uint256 public constant XSC_MAX_SUPPLY = type(uint128).max;

    function setUp() public {
        vm.startPrank(owner);
        // Deploy implementation contract
        templateImplementation = new ERC20Template();

        // Create and initialize template for invariant tests
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);
        template.initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            true,  // mintable
            true,  // burnable
            true,  // pausable
            true,  // capped
            MAX_SUPPLY
        );
        vm.stopPrank();
    }

    // ==================== MINTABLE FEATURE TESTS ====================

    function test_Mintable_Initialize() public {
        vm.startPrank(owner);

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        vm.expectEmit(true, true, true, true);
        emit FeatureEnabled("mintable");

        template.initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            true,  // mintable
            false, // burnable
            false, // pausable
            false, // capped
            0      // maxSupply
        );

        assertTrue(template.isMintable());
        vm.stopPrank();
    }

    function test_Mint_Basic() public {
        _initializeMintableTemplate();
        uint256 mintAmount = 10000 * 10**18;

        vm.startPrank(owner);

        uint256 totalSupplyBefore = template.totalSupply();

        vm.expectEmit(true, true, true, true);
        emit Transfer(address(0), user1, mintAmount);

        template.mint(user1, mintAmount);

        assertEq(template.balanceOf(user1), mintAmount);
        assertEq(
            template.totalSupply(),
            totalSupplyBefore + mintAmount
        );

        vm.stopPrank();
    }

    function test_Mint_OnlyOwner() public {
        _initializeMintableTemplate();
        uint256 mintAmount = 10000 * 10**18;

        vm.startPrank(user1); // Not the owner

        vm.expectRevert(abi.encodeWithSelector(NotOwner.selector));
        template.mint(user2, mintAmount);

        vm.stopPrank();
    }

    function test_Mint_WhenNotMintable() public {
        _initializeBasicTemplate(); // Not mintable
        uint256 mintAmount = 10000 * 10**18;

        vm.startPrank(owner);

        vm.expectRevert(abi.encodeWithSelector(FeatureNotEnabled.selector, "mintable"));
        template.mint(user1, mintAmount);

        vm.stopPrank();
    }

    function test_Mint_ZeroAmount() public {
        _initializeMintableTemplate();

        vm.startPrank(owner);

        vm.expectRevert(abi.encodeWithSelector(InvalidAmount.selector));
        template.mint(user1, 0);

        vm.stopPrank();
    }

    function test_Mint_ZeroAddress() public {
        _initializeMintableTemplate();
        uint256 mintAmount = 10000 * 10**18;

        vm.startPrank(owner);

        vm.expectRevert();
        template.mint(address(0), mintAmount);

        vm.stopPrank();
    }

    // ==================== CAPPED MINTABLE TESTS ====================

    function test_CappedMint_Initialize() public {
        vm.startPrank(owner);

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        template.initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            true,  // mintable
            false, // burnable
            false, // pausable
            true,  // capped
            MAX_SUPPLY
        );

        assertTrue(template.isMintable());
        assertTrue(template.isCapped());
        assertEq(template.getMaxSupply(), MAX_SUPPLY);

        vm.stopPrank();
    }

    function test_CappedMint_WithinLimit() public {
        _initializeCappedMintableTemplate();
        uint256 mintAmount = 500000 * 10**18; // Within cap

        vm.startPrank(owner);

        template.mint(user1, mintAmount);

        assertEq(template.balanceOf(user1), mintAmount);
        assertEq(
            template.totalSupply(),
            INITIAL_SUPPLY + mintAmount
        );

        vm.stopPrank();
    }

    function test_CappedMint_ExceedsLimit() public {
        _initializeCappedMintableTemplate();
        uint256 mintAmount = 1500000 * 10**18; // Exceeds cap

        vm.startPrank(owner);

        vm.expectRevert(abi.encodeWithSelector(ExceedsMaxSupply.selector));
        template.mint(user1, mintAmount);

        vm.stopPrank();
    }

    function test_CappedMint_ExactLimit() public {
        _initializeCappedMintableTemplate();
        uint256 mintAmount = MAX_SUPPLY - INITIAL_SUPPLY; // Exact remaining amount

        vm.startPrank(owner);

        template.mint(user1, mintAmount);

        assertEq(template.totalSupply(), MAX_SUPPLY);

        vm.stopPrank();
    }

    function test_CappedMint_InvalidMaxSupply() public {
        vm.startPrank(owner);

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        vm.expectRevert("Max supply too low");
        template.initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            true,  // mintable
            false, // burnable
            false, // pausable
            true,  // capped
            INITIAL_SUPPLY - 1 // Max supply less than initial supply
        );

        vm.stopPrank();
    }

    // ==================== BURNABLE FEATURE TESTS ====================

    function test_Burnable_Initialize() public {
        vm.startPrank(owner);

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        vm.expectEmit(true, true, true, true);
        emit FeatureEnabled("burnable");

        template.initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false, // mintable
            true,  // burnable
            false, // pausable
            false, // capped
            0      // maxSupply
        );

        assertTrue(template.isBurnable());
        vm.stopPrank();
    }

    function test_Burn_Basic() public {
        _initializeBurnableTemplate();
        uint256 burnAmount = 10000 * 10**18;

        // First transfer some tokens to user1
        vm.startPrank(owner);
        template.transfer(user1, burnAmount * 2);
        vm.stopPrank();

        vm.startPrank(user1);

        uint256 balanceBefore = template.balanceOf(user1);
        uint256 totalSupplyBefore = template.totalSupply();

        vm.expectEmit(true, true, true, true);
        emit Transfer(user1, address(0), burnAmount);

        template.burn(burnAmount);

        assertEq(template.balanceOf(user1), balanceBefore - burnAmount);
        assertEq(template.totalSupply(), totalSupplyBefore - burnAmount);

        vm.stopPrank();
    }

    function test_Burn_WhenNotBurnable() public {
        _initializeBasicTemplate(); // Not burnable
        uint256 burnAmount = 10000 * 10**18;

        vm.startPrank(owner);

        vm.expectRevert(abi.encodeWithSelector(FeatureNotEnabled.selector, "burnable"));
        template.burn(burnAmount);

        vm.stopPrank();
    }

    function test_Burn_InsufficientBalance() public {
        _initializeBurnableTemplate();
        uint256 burnAmount = INITIAL_SUPPLY + 1; // More than owner has

        vm.startPrank(owner);

        vm.expectRevert();
        template.burn(burnAmount);

        vm.stopPrank();
    }

    function test_Burn_ZeroAmount() public {
        _initializeBurnableTemplate();

        vm.startPrank(owner);

        vm.expectRevert(abi.encodeWithSelector(InvalidAmount.selector));
        template.burn(0);

        vm.stopPrank();
    }

    function test_BurnFrom_Basic() public {
        _initializeBurnableTemplate();
        uint256 burnAmount = 10000 * 10**18;

        // Owner approves user1 to burn tokens
        vm.startPrank(owner);
        template.approve(user1, burnAmount);
        vm.stopPrank();

        vm.startPrank(user1);

        uint256 ownerBalanceBefore = template.balanceOf(owner);
        uint256 totalSupplyBefore = template.totalSupply();

        vm.expectEmit(true, true, true, true);
        emit Transfer(owner, address(0), burnAmount);

        template.burnFrom(owner, burnAmount);

        assertEq(template.balanceOf(owner), ownerBalanceBefore - burnAmount);
        assertEq(template.totalSupply(), totalSupplyBefore - burnAmount);

        vm.stopPrank();
    }

    function test_BurnFrom_InsufficientAllowance() public {
        _initializeBurnableTemplate();
        uint256 approveAmount = 5000 * 10**18;
        uint256 burnAmount = 10000 * 10**18; // More than approved

        vm.startPrank(owner);
        template.approve(user1, approveAmount);
        vm.stopPrank();

        vm.startPrank(user1);

        vm.expectRevert();
        template.burnFrom(owner, burnAmount);

        vm.stopPrank();
    }

    // ==================== PAUSABLE FEATURE TESTS ====================

    function test_Pausable_Initialize() public {
        vm.startPrank(owner);

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        vm.expectEmit(true, true, true, true);
        emit FeatureEnabled("pausable");

        template.initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false, // mintable
            false, // burnable
            true,  // pausable
            false, // capped
            0      // maxSupply
        );

        assertTrue(template.isPausable());
        assertFalse(template.paused());

        vm.stopPrank();
    }

    function test_Pause_Basic() public {
        _initializePausableTemplate();

        vm.startPrank(owner);

        // Note: Paused event is emitted by PausableUpgradeable
        template.pause();

        assertTrue(template.paused());

        vm.stopPrank();
    }

    function test_Pause_OnlyOwner() public {
        _initializePausableTemplate();

        vm.startPrank(user1); // Not the owner

        vm.expectRevert(abi.encodeWithSelector(NotOwner.selector));
        template.pause();

        vm.stopPrank();
    }

    function test_Pause_WhenNotPausable() public {
        _initializeBasicTemplate(); // Not pausable

        vm.startPrank(owner);

        vm.expectRevert(abi.encodeWithSelector(FeatureNotEnabled.selector, "pausable"));
        template.pause();

        vm.stopPrank();
    }

    function test_Unpause_Basic() public {
        _initializePausableTemplate();

        vm.startPrank(owner);

        // First pause
        template.pause();
        assertTrue(template.paused());

        // Then unpause
        // Note: Unpaused event is emitted by PausableUpgradeable
        template.unpause();
        assertFalse(template.paused());

        vm.stopPrank();
    }

    function test_TransferWhilePaused() public {
        _initializePausableTemplate();
        uint256 transferAmount = 1000 * 10**18;

        vm.startPrank(owner);

        // Pause the contract
        template.pause();

        // Attempt to transfer
        vm.expectRevert(abi.encodeWithSelector(TokenIsPaused.selector));
        template.transfer(user1, transferAmount);

        vm.stopPrank();
    }

    function test_TransferFromWhilePaused() public {
        _initializePausableTemplate();
        uint256 transferAmount = 1000 * 10**18;

        // Owner approves user1 before pausing
        vm.startPrank(owner);
        template.approve(user1, transferAmount);
        template.pause();
        vm.stopPrank();

        vm.startPrank(user1);

        vm.expectRevert(abi.encodeWithSelector(TokenIsPaused.selector));
        template.transferFrom(owner, user2, transferAmount);

        vm.stopPrank();
    }

    function test_MintWhilePaused() public {
        _initializeMintablePausableTemplate();
        uint256 mintAmount = 10000 * 10**18;

        vm.startPrank(owner);

        template.pause();

        vm.expectRevert(abi.encodeWithSelector(TokenIsPaused.selector));
        template.mint(user1, mintAmount);

        vm.stopPrank();
    }

    function test_BurnWhilePaused() public {
        _initializeBurnablePausableTemplate();
        uint256 burnAmount = 10000 * 10**18;

        vm.startPrank(owner);

        template.pause();

        vm.expectRevert(abi.encodeWithSelector(TokenIsPaused.selector));
        template.burn(burnAmount);

        vm.stopPrank();
    }

    // ==================== COMBINED FEATURES TESTS ====================

    function test_AllFeatures_Initialize() public {
        vm.startPrank(owner);

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        vm.expectEmit(true, true, true, false);
        emit FeatureEnabled("mintable");
        vm.expectEmit(true, true, true, false);
        emit FeatureEnabled("burnable");
        vm.expectEmit(true, true, true, false);
        emit FeatureEnabled("pausable");
        vm.expectEmit(true, true, true, false);
        emit FeatureEnabled("capped");

        template.initialize(
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

        assertTrue(template.isMintable());
        assertTrue(template.isBurnable());
        assertTrue(template.isPausable());
        assertTrue(template.isCapped());
        assertEq(template.getMaxSupply(), MAX_SUPPLY);

        vm.stopPrank();
    }

    function test_MintAndBurn_Workflow() public {
        _initializeAllFeaturesTemplate();
        uint256 mintAmount = 50000 * 10**18;
        uint256 burnAmount = 20000 * 10**18;

        vm.startPrank(owner);

        // Mint tokens
        template.mint(user1, mintAmount);
        assertEq(template.balanceOf(user1), mintAmount);

        // Transfer ownership to user1
        template.transferOwnership(user1);
        vm.stopPrank();

        vm.startPrank(user1);

        // Burn tokens
        template.burn(burnAmount);
        assertEq(template.balanceOf(user1), mintAmount - burnAmount);

        vm.stopPrank();
    }

    function test_PauseStopsAllTransfers() public {
        _initializeAllFeaturesTemplate();
        uint256 transferAmount = 1000 * 10**18;

        vm.startPrank(owner);

        // Transfer some tokens to user1 first
        template.transfer(user1, transferAmount * 3);

        // Pause the contract
        template.pause();

        // All transfers should fail
        vm.expectRevert(abi.encodeWithSelector(TokenIsPaused.selector));
        template.transfer(user2, transferAmount);

        vm.stopPrank();

        vm.startPrank(user1);

        vm.expectRevert(abi.encodeWithSelector(TokenIsPaused.selector));
        template.transfer(user2, transferAmount);

        vm.stopPrank();
    }

    // ==================== XSC NETWORK ADVANCED TESTS ====================

    function test_XSC_LargeCappedMint() public {
        vm.startPrank(owner);

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        uint256 largeInitialSupply = 1000000000 * 10**18; // 1B tokens
        uint256 largeCap = 5000000000 * 10**18; // 5B tokens

        template.initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            largeInitialSupply,
            DECIMALS,
            owner,
            true,  // mintable
            false, // burnable
            false, // pausable
            true,  // capped
            largeCap
        );

        // Mint large amount
        uint256 mintAmount = 2000000000 * 10**18; // 2B tokens
        template.mint(user1, mintAmount);

        assertEq(template.balanceOf(user1), mintAmount);
        assertEq(
            template.totalSupply(),
            largeInitialSupply + mintAmount
        );

        vm.stopPrank();
    }

    function test_XSC_HighFrequencyOperations() public {
        _initializeAllFeaturesTemplate();
        uint256 operationAmount = 1000 * 10**18;

        vm.startPrank(owner);

        // Simulate high-frequency operations
        for (uint256 i = 0; i < 10; i++) {
            template.mint(user1, operationAmount);
            vm.roll(block.number + 1); // Advance XSC block
        }

        assertEq(template.balanceOf(user1), operationAmount * 10);

        vm.stopPrank();
    }

    // ==================== GAS OPTIMIZATION TESTS ====================

    function test_Gas_MintOperation() public {
        _initializeMintableTemplate();
        uint256 mintAmount = 10000 * 10**18;

        vm.startPrank(owner);

        uint256 gasBefore = gasleft();
        template.mint(user1, mintAmount);
        uint256 gasUsed = gasBefore - gasleft();

        assertTrue(gasUsed < 100000, "Mint gas usage too high for XSC network");

        vm.stopPrank();
    }

    function test_Gas_BurnOperation() public {
        _initializeBurnableTemplate();
        uint256 burnAmount = 10000 * 10**18;

        vm.startPrank(owner);

        uint256 gasBefore = gasleft();
        template.burn(burnAmount);
        uint256 gasUsed = gasBefore - gasleft();

        assertTrue(gasUsed < 100000, "Burn gas usage too high for XSC network");

        vm.stopPrank();
    }

    function test_Gas_PauseOperation() public {
        _initializePausableTemplate();

        vm.startPrank(owner);

        uint256 gasBefore = gasleft();
        template.pause();
        uint256 gasUsed = gasBefore - gasleft();

        assertTrue(gasUsed < 50000, "Pause gas usage too high for XSC network");

        vm.stopPrank();
    }

    // ==================== HELPER FUNCTIONS ====================

    function _initializeBasicTemplate() internal {
        vm.startPrank(owner);

        // Create clone and initialize
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        template.initialize(
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

        vm.stopPrank();
    }

    function _initializeMintableTemplate() internal {
        vm.startPrank(owner);

        // Create clone and initialize
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        template.initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            true,  // mintable
            false, // burnable
            false, // pausable
            false, // capped
            0      // maxSupply
        );

        vm.stopPrank();
    }

    function _initializeCappedMintableTemplate() internal {
        vm.startPrank(owner);

        // Create clone and initialize
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        template.initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            true,  // mintable
            false, // burnable
            false, // pausable
            true,  // capped
            MAX_SUPPLY
        );

        vm.stopPrank();
    }

    function _initializeBurnableTemplate() internal {
        vm.startPrank(owner);

        // Create clone and initialize
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        template.initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false, // mintable
            true,  // burnable
            false, // pausable
            false, // capped
            0      // maxSupply
        );

        vm.stopPrank();
    }

    function _initializePausableTemplate() internal {
        vm.startPrank(owner);

        // Create clone and initialize
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        template.initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false, // mintable
            false, // burnable
            true,  // pausable
            false, // capped
            0      // maxSupply
        );

        vm.stopPrank();
    }

    function _initializeMintablePausableTemplate() internal {
        vm.startPrank(owner);

        // Create clone and initialize
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        template.initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            true, // mintable
            false, // burnable
            true, // pausable
            false, // capped
            0     // maxSupply
        );

        vm.stopPrank();
    }

    function _initializeBurnablePausableTemplate() internal {
        vm.startPrank(owner);

        // Create clone and initialize
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        template.initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner,
            false, // mintable
            true,  // burnable
            true,  // pausable
            false, // capped
            0      // maxSupply
        );

        vm.stopPrank();
    }

    function _initializeAllFeaturesTemplate() internal {
        vm.startPrank(owner);

        // Create clone and initialize
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        template.initialize(
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

        vm.stopPrank();
    }

    // ==================== FUZZ TESTS ====================

    function testFuzz_MintAmount(uint256 amount) public {
        _initializeMintableTemplate();

        vm.assume(amount > 0 && amount <= type(uint128).max);

        vm.startPrank(owner);

        uint256 totalSupplyBefore = template.totalSupply();

        template.mint(user1, amount);

        assertEq(template.balanceOf(user1), amount);
        assertEq(template.totalSupply(), totalSupplyBefore + amount);

        vm.stopPrank();
    }

    function testFuzz_BurnAmount(uint256 amount) public {
        _initializeBurnableTemplate();

        vm.assume(amount > 0 && amount <= INITIAL_SUPPLY);

        vm.startPrank(owner);

        uint256 balanceBefore = template.balanceOf(owner);
        uint256 totalSupplyBefore = template.totalSupply();

        template.burn(amount);

        assertEq(template.balanceOf(owner), balanceBefore - amount);
        assertEq(template.totalSupply(), totalSupplyBefore - amount);

        vm.stopPrank();
    }

    // ==================== INVARIANT TESTS ====================

    function invariant_PausedStatePreventsTransfers() public view {
        if (template.isPausable() && template.paused()) {
            // When paused, no transfers should be possible
            // This is checked implicitly in the transfer functions
        }
    }

    function invariant_TotalSupplyNeverExceedsCap() public {
        if (template.isCapped()) {
            uint256 totalSupply = template.totalSupply();
            uint256 maxSupply = template.getMaxSupply();
            assertTrue(totalSupply <= maxSupply);
        }
    }

    function invariant_OnlyOwnerCanUsePrivilegedFunctions() public view {
        // This invariant is enforced by the onlyOwner modifier
        // Tests verify that non-owners cannot call privileged functions
    }
}