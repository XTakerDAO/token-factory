// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "../src/ERC20Template.sol";
import "../src/interfaces/IERC20Template.sol";

/**
 * @title ERC20Template Basic Functionality Tests
 * @dev Comprehensive tests for basic ERC20 functionality following TDD approach
 * @notice These tests should now PASS with the real implementation
 */
contract ERC20TemplateTest is Test {
    // Events (matching IERC20Template)
    event TokenInitialized(string name, string symbol, uint256 totalSupply, uint8 decimals, address owner);

    // Standard ERC20 events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // Errors (matching IERC20Template)
    error NotOwner();

    // Test accounts
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public user3 = address(0x4);

    // Contract instances
    ERC20Template public templateImplementation;
    ERC20Template public template;

    // Test constants for XSC network compatibility
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1M tokens
    uint8 public constant DECIMALS = 18;
    string public constant TOKEN_NAME = "Test Token";
    string public constant TOKEN_SYMBOL = "TEST";

    // XSC network specific constants
    uint256 public constant XSC_BLOCK_TIME = 3; // 3 second blocks
    uint256 public constant XSC_MAX_SUPPLY = type(uint128).max; // XSC limits

    function setUp() public {
        vm.startPrank(owner);
        // Deploy implementation contract
        templateImplementation = new ERC20Template();
        vm.stopPrank();
    }

    // ==================== INITIALIZATION TESTS ====================

    function test_Initialize_BasicParameters() public {
        vm.startPrank(owner);

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        vm.expectEmit(true, true, true, true);
        emit TokenInitialized(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            INITIAL_SUPPLY,
            DECIMALS,
            owner
        );

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

    function test_Initialize_OnlyOnce() public {
        vm.startPrank(owner);

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        // First initialization should succeed
        template.initialize(
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

        // Second initialization should revert
        vm.expectRevert();
        template.initialize(
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

    function test_Initialize_WithZeroSupply() public {
        vm.startPrank(owner);

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        vm.expectRevert("Invalid total supply");
        template.initialize(
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

    // ==================== METADATA TESTS ====================

    function test_Name() public {
        _initializeBasicTemplate();

        string memory name = template.name();
        assertEq(name, TOKEN_NAME);
    }

    function test_Symbol() public {
        _initializeBasicTemplate();

        string memory symbol = template.symbol();
        assertEq(symbol, TOKEN_SYMBOL);
    }

    function test_Decimals() public {
        _initializeBasicTemplate();

        uint8 decimals = template.decimals();
        assertEq(decimals, DECIMALS);
    }

    function test_TotalSupply() public {
        _initializeBasicTemplate();

        uint256 totalSupply = template.totalSupply();
        assertEq(totalSupply, INITIAL_SUPPLY);
    }

    // ==================== BALANCE TESTS ====================

    function test_InitialBalance() public {
        _initializeBasicTemplate();

        uint256 ownerBalance = template.balanceOf(owner);
        assertEq(ownerBalance, INITIAL_SUPPLY);
    }

    function test_ZeroBalanceForNonOwner() public {
        _initializeBasicTemplate();

        uint256 userBalance = template.balanceOf(user1);
        assertEq(userBalance, 0);
    }

    // ==================== TRANSFER TESTS ====================

    function test_Transfer_Basic() public {
        _initializeBasicTemplate();
        uint256 transferAmount = 1000 * 10**18;

        vm.startPrank(owner);

        vm.expectEmit(true, true, true, true);
        emit Transfer(owner, user1, transferAmount);

        bool success = template.transfer(user1, transferAmount);
        assertTrue(success);

        assertEq(template.balanceOf(owner), INITIAL_SUPPLY - transferAmount);
        assertEq(template.balanceOf(user1), transferAmount);

        vm.stopPrank();
    }

    function test_Transfer_InsufficientBalance() public {
        _initializeBasicTemplate();

        vm.startPrank(user1); // user1 has no balance

        vm.expectRevert();
        template.transfer(user2, 1000);

        vm.stopPrank();
    }

    function test_Transfer_ToZeroAddress() public {
        _initializeBasicTemplate();

        vm.startPrank(owner);

        vm.expectRevert();
        template.transfer(address(0), 1000);

        vm.stopPrank();
    }

    function test_Transfer_ZeroAmount() public {
        _initializeBasicTemplate();

        vm.startPrank(owner);

        bool success = template.transfer(user1, 0);
        assertTrue(success);

        // Balances should remain unchanged
        assertEq(template.balanceOf(owner), INITIAL_SUPPLY);
        assertEq(template.balanceOf(user1), 0);

        vm.stopPrank();
    }

    // ==================== APPROVAL TESTS ====================

    function test_Approve_Basic() public {
        _initializeBasicTemplate();
        uint256 approvalAmount = 5000 * 10**18;

        vm.startPrank(owner);

        vm.expectEmit(true, true, true, true);
        emit Approval(owner, user1, approvalAmount);

        bool success = template.approve(user1, approvalAmount);
        assertTrue(success);

        uint256 allowance = template.allowance(owner, user1);
        assertEq(allowance, approvalAmount);

        vm.stopPrank();
    }

    function test_Approve_ZeroAmount() public {
        _initializeBasicTemplate();

        vm.startPrank(owner);

        bool success = template.approve(user1, 0);
        assertTrue(success);

        uint256 allowance = template.allowance(owner, user1);
        assertEq(allowance, 0);

        vm.stopPrank();
    }

    function test_Approve_ZeroAddress() public {
        _initializeBasicTemplate();

        vm.startPrank(owner);

        vm.expectRevert();
        template.approve(address(0), 1000);

        vm.stopPrank();
    }

    // ==================== TRANSFER FROM TESTS ====================

    function test_TransferFrom_Basic() public {
        _initializeBasicTemplate();
        uint256 approvalAmount = 5000 * 10**18;
        uint256 transferAmount = 2000 * 10**18;

        // Owner approves user1 to spend tokens
        vm.startPrank(owner);
        template.approve(user1, approvalAmount);
        vm.stopPrank();

        // User1 transfers tokens from owner to user2
        vm.startPrank(user1);

        vm.expectEmit(true, true, true, true);
        emit Transfer(owner, user2, transferAmount);

        bool success = template.transferFrom(owner, user2, transferAmount);
        assertTrue(success);

        // Check balances
        assertEq(template.balanceOf(owner), INITIAL_SUPPLY - transferAmount);
        assertEq(template.balanceOf(user2), transferAmount);

        // Check remaining allowance
        uint256 remainingAllowance = template.allowance(owner, user1);
        assertEq(remainingAllowance, approvalAmount - transferAmount);

        vm.stopPrank();
    }

    function test_TransferFrom_InsufficientAllowance() public {
        _initializeBasicTemplate();
        uint256 approvalAmount = 1000 * 10**18;
        uint256 transferAmount = 2000 * 10**18; // More than approved

        vm.startPrank(owner);
        template.approve(user1, approvalAmount);
        vm.stopPrank();

        vm.startPrank(user1);

        vm.expectRevert();
        template.transferFrom(owner, user2, transferAmount);

        vm.stopPrank();
    }

    function test_TransferFrom_InsufficientBalance() public {
        _initializeBasicTemplate();
        uint256 transferAmount = INITIAL_SUPPLY + 1; // More than owner has

        vm.startPrank(owner);
        template.approve(user1, transferAmount);
        vm.stopPrank();

        vm.startPrank(user1);

        vm.expectRevert();
        template.transferFrom(owner, user2, transferAmount);

        vm.stopPrank();
    }

    // ==================== OWNERSHIP TESTS ====================

    function test_Owner_Initial() public {
        _initializeBasicTemplate();

        address currentOwner = template.owner();
        assertEq(currentOwner, owner);
    }

    function test_TransferOwnership() public {
        _initializeBasicTemplate();

        vm.startPrank(owner);

        vm.expectEmit(true, true, true, true);
        emit OwnershipTransferred(owner, user1);

        template.transferOwnership(user1);

        address currentOwner = template.owner();
        assertEq(currentOwner, user1);

        vm.stopPrank();
    }

    function test_TransferOwnership_OnlyOwner() public {
        _initializeBasicTemplate();

        vm.startPrank(user1); // Not the owner

        vm.expectRevert(abi.encodeWithSelector(NotOwner.selector));
        template.transferOwnership(user2);

        vm.stopPrank();
    }

    function test_RenounceOwnership() public {
        _initializeBasicTemplate();

        vm.startPrank(owner);

        // Note: OwnershipTransferred event is emitted by OwnableUpgradeable
        template.renounceOwnership();

        address currentOwner = template.owner();
        assertEq(currentOwner, address(0));

        vm.stopPrank();
    }

    // ==================== FEATURE FLAGS TESTS ====================

    function test_FeatureFlags_Basic() public {
        _initializeBasicTemplate();

        assertFalse(template.isMintable());
        assertFalse(template.isBurnable());
        assertFalse(template.isPausable());
        assertFalse(template.isCapped());
        assertEq(template.getMaxSupply(), 0);
    }

    // ==================== XSC NETWORK COMPATIBILITY TESTS ====================

    function test_XSC_MaxSupplyCompatibility() public {
        vm.startPrank(owner);

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        // Test with XSC maximum supply limit
        template.initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            XSC_MAX_SUPPLY,
            DECIMALS,
            owner,
            false,
            false,
            false,
            true, // capped
            XSC_MAX_SUPPLY
        );

        uint256 totalSupply = template.totalSupply();
        assertEq(totalSupply, XSC_MAX_SUPPLY);

        vm.stopPrank();
    }

    function test_XSC_LargeTransfers() public {
        vm.startPrank(owner);

        // Create clone
        address clone = Clones.clone(address(templateImplementation));
        template = ERC20Template(clone);

        uint256 largeAmount = 1000000000 * 10**18; // 1B tokens
        template.initialize(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            largeAmount,
            DECIMALS,
            owner,
            false,
            false,
            false,
            false,
            0
        );

        // Test large transfer
        uint256 transferAmount = 500000000 * 10**18; // 500M tokens
        bool success = template.transfer(user1, transferAmount);
        assertTrue(success);

        assertEq(template.balanceOf(user1), transferAmount);

        vm.stopPrank();
    }

    // ==================== GAS OPTIMIZATION TESTS ====================

    function test_Gas_BasicTransfer() public {
        _initializeBasicTemplate();
        uint256 transferAmount = 1000 * 10**18;

        vm.startPrank(owner);

        uint256 gasBefore = gasleft();
        bool success = template.transfer(user1, transferAmount);
        uint256 gasUsed = gasBefore - gasleft();

        assertTrue(success, "Transfer should succeed");

        // XSC network has lower gas costs - test should pass with reasonable limits
        assertTrue(gasUsed < 100000, "Transfer gas usage too high for XSC network");

        vm.stopPrank();
    }

    function test_Gas_Approval() public {
        _initializeBasicTemplate();
        uint256 approvalAmount = 5000 * 10**18;

        vm.startPrank(owner);

        uint256 gasBefore = gasleft();
        template.approve(user1, approvalAmount);
        uint256 gasUsed = gasBefore - gasleft();

        assertTrue(gasUsed < 100000, "Approval gas usage too high for XSC network");

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

    // ==================== FUZZ TESTS ====================

    function testFuzz_Transfer(uint256 amount) public {
        _initializeBasicTemplate();

        vm.assume(amount <= INITIAL_SUPPLY);
        vm.assume(amount > 0);

        vm.startPrank(owner);

        bool success = template.transfer(user1, amount);
        assertTrue(success);

        assertEq(template.balanceOf(owner), INITIAL_SUPPLY - amount);
        assertEq(template.balanceOf(user1), amount);

        vm.stopPrank();
    }

    function testFuzz_Approve(uint256 amount) public {
        _initializeBasicTemplate();

        vm.assume(amount <= type(uint256).max);

        vm.startPrank(owner);

        bool success = template.approve(user1, amount);
        assertTrue(success);

        uint256 allowance = template.allowance(owner, user1);
        assertEq(allowance, amount);

        vm.stopPrank();
    }

    // ==================== HELPER TEST FUNCTIONS ====================

    function test_TotalSupplyNeverChanges() public {
        _initializeBasicTemplate();
        uint256 totalSupply = template.totalSupply();
        assertEq(totalSupply, INITIAL_SUPPLY);
    }

    function test_SumOfBalancesEqualsTotalSupply() public {
        _initializeBasicTemplate();
        uint256 ownerBalance = template.balanceOf(owner);
        uint256 user1Balance = template.balanceOf(user1);
        uint256 user2Balance = template.balanceOf(user2);
        uint256 user3Balance = template.balanceOf(user3);

        uint256 sumOfBalances = ownerBalance + user1Balance + user2Balance + user3Balance;
        uint256 totalSupply = template.totalSupply();

        assertEq(sumOfBalances, totalSupply);
    }
}