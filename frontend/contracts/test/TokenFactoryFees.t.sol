// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";

// Import interfaces - these will need to be implemented
interface ITokenFactory {
    // Events
    event ServiceFeeUpdated(uint256 newFee, address feeRecipient);
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
    error InsufficientServiceFee();
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

    // Fee Management Functions
    function getServiceFee() external view returns (uint256);
    function setServiceFee(uint256 newFee) external;
    function setFeeRecipient(address newRecipient) external;
    function getFeeRecipient() external view returns (address);
    
    // Core Functions
    function createToken(TokenConfig calldata config)
        external
        payable
        returns (address tokenAddress);
        
    function calculateDeploymentCost(TokenConfig calldata config)
        external
        view
        returns (uint256 gasCost, uint256 serviceFee);
        
    // Access Control
    function owner() external view returns (address);
}

/**
 * @title TokenFactory Fee Management Test Suite
 * @dev Comprehensive tests for TokenFactory service fee management functionality
 * These tests follow TDD approach and will FAIL initially until implementation is complete
 */
contract TokenFactoryFeesTest is Test {
    // Test accounts
    address public factory;
    address public owner;
    address public user1;
    address public user2;
    address public feeRecipient;
    address public newFeeRecipient;

    // Test constants
    uint256 public constant INITIAL_SERVICE_FEE = 0.01 ether;
    uint256 public constant MAX_REASONABLE_FEE = 1 ether;
    uint256 public constant INITIAL_BALANCE = 100 ether;

    // Events for testing
    event ServiceFeeUpdated(uint256 newFee, address feeRecipient);

    function setUp() public {
        // Setup test accounts
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        feeRecipient = makeAddr("feeRecipient");
        newFeeRecipient = makeAddr("newFeeRecipient");

        // Fund test accounts
        vm.deal(user1, INITIAL_BALANCE);
        vm.deal(user2, INITIAL_BALANCE);
        vm.deal(owner, INITIAL_BALANCE);
        
        // Deploy TokenFactory with initial fee settings (this will fail until implementation exists)
        vm.startPrank(owner);
        // factory = address(new TokenFactory(feeRecipient, INITIAL_SERVICE_FEE)); // This line will fail - no implementation yet
        vm.stopPrank();
        
        console.log("TokenFactory Fees Test Setup Complete");
        console.log("Factory address:", factory);
        console.log("Owner:", owner);
        console.log("Fee Recipient:", feeRecipient);
        console.log("Initial Service Fee:", INITIAL_SERVICE_FEE);
    }

    // =============================================================================
    // Service Fee Query Tests
    // =============================================================================

    function testGetInitialServiceFee() public view {
        uint256 currentFee = ITokenFactory(factory).getServiceFee();
        assertEq(currentFee, INITIAL_SERVICE_FEE, "Initial service fee should match constructor value");
    }

    function testGetFeeRecipient() public view {
        address currentRecipient = ITokenFactory(factory).getFeeRecipient();
        assertEq(currentRecipient, feeRecipient, "Fee recipient should match initial setting");
    }

    // =============================================================================
    // Service Fee Update Tests
    // =============================================================================

    function testOwnerCanUpdateServiceFee() public {
        vm.startPrank(owner);
        
        uint256 newFee = 0.02 ether;
        
        // Expect ServiceFeeUpdated event
        vm.expectEmit(true, true, false, true);
        emit ServiceFeeUpdated(newFee, feeRecipient);
        
        ITokenFactory(factory).setServiceFee(newFee);
        
        uint256 updatedFee = ITokenFactory(factory).getServiceFee();
        assertEq(updatedFee, newFee, "Service fee should be updated");
        
        vm.stopPrank();
    }

    function testNonOwnerCannotUpdateServiceFee() public {
        vm.startPrank(user1);
        
        uint256 newFee = 0.02 ether;
        
        vm.expectRevert(ITokenFactory.Unauthorized.selector);
        ITokenFactory(factory).setServiceFee(newFee);
        
        vm.stopPrank();
        
        // Verify fee hasn't changed
        uint256 currentFee = ITokenFactory(factory).getServiceFee();
        assertEq(currentFee, INITIAL_SERVICE_FEE, "Service fee should remain unchanged");
    }

    function testSetServiceFeeToZero() public {
        vm.startPrank(owner);
        
        // Should allow setting fee to zero
        ITokenFactory(factory).setServiceFee(0);
        
        uint256 updatedFee = ITokenFactory(factory).getServiceFee();
        assertEq(updatedFee, 0, "Service fee should be set to zero");
        
        vm.stopPrank();
    }

    function testSetServiceFeeToMaximum() public {
        vm.startPrank(owner);
        
        // Should allow reasonable maximum fee
        ITokenFactory(factory).setServiceFee(MAX_REASONABLE_FEE);
        
        uint256 updatedFee = ITokenFactory(factory).getServiceFee();
        assertEq(updatedFee, MAX_REASONABLE_FEE, "Service fee should be set to maximum");
        
        vm.stopPrank();
    }

    function testSetServiceFeeAboveMaximum() public {
        vm.startPrank(owner);
        
        // Should revert for unreasonable fees
        uint256 unreasonableFee = MAX_REASONABLE_FEE + 1;
        
        vm.expectRevert(ITokenFactory.InvalidConfiguration.selector);
        ITokenFactory(factory).setServiceFee(unreasonableFee);
        
        vm.stopPrank();
        
        // Verify fee hasn't changed
        uint256 currentFee = ITokenFactory(factory).getServiceFee();
        assertEq(currentFee, INITIAL_SERVICE_FEE, "Service fee should remain unchanged");
    }

    // =============================================================================
    // Fee Recipient Update Tests
    // =============================================================================

    function testOwnerCanUpdateFeeRecipient() public {
        vm.startPrank(owner);
        
        // Expect ServiceFeeUpdated event with same fee but new recipient
        vm.expectEmit(true, true, false, true);
        emit ServiceFeeUpdated(INITIAL_SERVICE_FEE, newFeeRecipient);
        
        ITokenFactory(factory).setFeeRecipient(newFeeRecipient);
        
        address updatedRecipient = ITokenFactory(factory).getFeeRecipient();
        assertEq(updatedRecipient, newFeeRecipient, "Fee recipient should be updated");
        
        vm.stopPrank();
    }

    function testNonOwnerCannotUpdateFeeRecipient() public {
        vm.startPrank(user1);
        
        vm.expectRevert(ITokenFactory.Unauthorized.selector);
        ITokenFactory(factory).setFeeRecipient(newFeeRecipient);
        
        vm.stopPrank();
        
        // Verify recipient hasn't changed
        address currentRecipient = ITokenFactory(factory).getFeeRecipient();
        assertEq(currentRecipient, feeRecipient, "Fee recipient should remain unchanged");
    }

    function testSetFeeRecipientToZeroAddress() public {
        vm.startPrank(owner);
        
        // Should revert for zero address
        vm.expectRevert(ITokenFactory.InvalidConfiguration.selector);
        ITokenFactory(factory).setFeeRecipient(address(0));
        
        vm.stopPrank();
        
        // Verify recipient hasn't changed
        address currentRecipient = ITokenFactory(factory).getFeeRecipient();
        assertEq(currentRecipient, feeRecipient, "Fee recipient should remain unchanged");
    }

    function testSetFeeRecipientToSameAddress() public {
        vm.startPrank(owner);
        
        // Should allow setting to same address (no-op)
        ITokenFactory(factory).setFeeRecipient(feeRecipient);
        
        address updatedRecipient = ITokenFactory(factory).getFeeRecipient();
        assertEq(updatedRecipient, feeRecipient, "Fee recipient should remain the same");
        
        vm.stopPrank();
    }

    // =============================================================================
    // Fee Collection Tests
    // =============================================================================

    function testFeeCollectionOnTokenCreation() public {
        vm.startPrank(user1);
        
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Fee Collection Test",
            symbol: "FCTEST",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        uint256 recipientBalanceBefore = feeRecipient.balance;
        uint256 userBalanceBefore = user1.balance;
        
        // Create token with exact service fee
        ITokenFactory(factory).createToken{value: INITIAL_SERVICE_FEE}(config);
        
        uint256 recipientBalanceAfter = feeRecipient.balance;
        uint256 userBalanceAfter = user1.balance;
        
        // Verify fee was collected
        assertEq(
            recipientBalanceAfter - recipientBalanceBefore,
            INITIAL_SERVICE_FEE,
            "Fee recipient should receive service fee"
        );
        
        assertEq(
            userBalanceBefore - userBalanceAfter,
            INITIAL_SERVICE_FEE,
            "User should pay exact service fee"
        );
        
        vm.stopPrank();
    }

    function testFeeCollectionWithExcessPayment() public {
        vm.startPrank(user1);
        
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Excess Payment Test",
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

        uint256 excessPayment = INITIAL_SERVICE_FEE + 0.005 ether;
        uint256 recipientBalanceBefore = feeRecipient.balance;
        uint256 userBalanceBefore = user1.balance;
        
        // Create token with excess payment
        ITokenFactory(factory).createToken{value: excessPayment}(config);
        
        uint256 recipientBalanceAfter = feeRecipient.balance;
        uint256 userBalanceAfter = user1.balance;
        
        // Verify only service fee was collected, excess refunded
        assertEq(
            recipientBalanceAfter - recipientBalanceBefore,
            INITIAL_SERVICE_FEE,
            "Fee recipient should receive only service fee"
        );
        
        assertEq(
            userBalanceBefore - userBalanceAfter,
            INITIAL_SERVICE_FEE,
            "User should only pay service fee (excess refunded)"
        );
        
        vm.stopPrank();
    }

    function testFeeCollectionAfterFeeUpdate() public {
        // Owner updates fee
        vm.startPrank(owner);
        uint256 newFee = 0.05 ether;
        ITokenFactory(factory).setServiceFee(newFee);
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Updated Fee Test",
            symbol: "UPDATE",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        uint256 recipientBalanceBefore = feeRecipient.balance;
        
        // Create token with new fee
        ITokenFactory(factory).createToken{value: newFee}(config);
        
        uint256 recipientBalanceAfter = feeRecipient.balance;
        
        // Verify new fee was collected
        assertEq(
            recipientBalanceAfter - recipientBalanceBefore,
            newFee,
            "Fee recipient should receive updated service fee"
        );
        
        vm.stopPrank();
    }

    function testFeeCollectionAfterRecipientChange() public {
        // Owner changes fee recipient
        vm.startPrank(owner);
        ITokenFactory(factory).setFeeRecipient(newFeeRecipient);
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Recipient Change Test",
            symbol: "RECIP",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        uint256 oldRecipientBalanceBefore = feeRecipient.balance;
        uint256 newRecipientBalanceBefore = newFeeRecipient.balance;
        
        // Create token
        ITokenFactory(factory).createToken{value: INITIAL_SERVICE_FEE}(config);
        
        uint256 oldRecipientBalanceAfter = feeRecipient.balance;
        uint256 newRecipientBalanceAfter = newFeeRecipient.balance;
        
        // Verify fee went to new recipient
        assertEq(
            oldRecipientBalanceAfter,
            oldRecipientBalanceBefore,
            "Old recipient should not receive fee"
        );
        
        assertEq(
            newRecipientBalanceAfter - newRecipientBalanceBefore,
            INITIAL_SERVICE_FEE,
            "New recipient should receive service fee"
        );
        
        vm.stopPrank();
    }

    // =============================================================================
    // Fee Calculation Tests
    // =============================================================================

    function testCalculateDeploymentCostBasic() public view {
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

        (uint256 gasCost, uint256 serviceFee) = ITokenFactory(factory).calculateDeploymentCost(config);
        
        assertTrue(gasCost > 0, "Gas cost should be greater than zero");
        assertEq(serviceFee, INITIAL_SERVICE_FEE, "Service fee should match current setting");
    }

    function testCalculateDeploymentCostAfterFeeUpdate() public {
        // Update service fee
        vm.startPrank(owner);
        uint256 newFee = 0.03 ether;
        ITokenFactory(factory).setServiceFee(newFee);
        vm.stopPrank();

        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Updated Cost Test",
            symbol: "UPCOST",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        (uint256 gasCost, uint256 serviceFee) = ITokenFactory(factory).calculateDeploymentCost(config);
        
        assertTrue(gasCost > 0, "Gas cost should be greater than zero");
        assertEq(serviceFee, newFee, "Service fee should reflect updated value");
    }

    function testCalculateDeploymentCostComplexToken() public view {
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Complex Cost Test",
            symbol: "COMPLEX",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: true,
            burnable: true,
            pausable: true,
            capped: true,
            maxSupply: 5000000 * 10**18,
            initialOwner: user1
        });

        (uint256 complexGasCost, uint256 complexServiceFee) = ITokenFactory(factory).calculateDeploymentCost(config);
        
        // Compare with basic token
        ITokenFactory.TokenConfig memory basicConfig = ITokenFactory.TokenConfig({
            name: "Basic Cost Test",
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

        (uint256 basicGasCost, uint256 basicServiceFee) = ITokenFactory(factory).calculateDeploymentCost(basicConfig);
        
        // Complex token should cost more gas
        assertTrue(complexGasCost > basicGasCost, "Complex token should require more gas");
        assertEq(complexServiceFee, basicServiceFee, "Service fee should be same regardless of complexity");
    }

    // =============================================================================
    // Zero Fee Tests
    // =============================================================================

    function testTokenCreationWithZeroFee() public {
        // Owner sets fee to zero
        vm.startPrank(owner);
        ITokenFactory(factory).setServiceFee(0);
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Zero Fee Test",
            symbol: "ZEROFEE",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        uint256 userBalanceBefore = user1.balance;
        
        // Should work with no payment
        address tokenAddress = ITokenFactory(factory).createToken(config);
        
        uint256 userBalanceAfter = user1.balance;
        
        assertTrue(tokenAddress != address(0), "Token should be created with zero fee");
        
        // Only gas should be consumed, no service fee
        uint256 gasUsed = userBalanceBefore - userBalanceAfter;
        assertTrue(gasUsed < 0.001 ether, "Only gas should be consumed, no service fee");
        
        vm.stopPrank();
    }

    function testTokenCreationWithPaymentWhenZeroFee() public {
        // Owner sets fee to zero
        vm.startPrank(owner);
        ITokenFactory(factory).setServiceFee(0);
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Payment With Zero Fee",
            symbol: "PAYZERO",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        uint256 payment = 0.01 ether;
        uint256 userBalanceBefore = user1.balance;
        
        // Should refund entire payment
        address tokenAddress = ITokenFactory(factory).createToken{value: payment}(config);
        
        uint256 userBalanceAfter = user1.balance;
        
        assertTrue(tokenAddress != address(0), "Token should be created");
        
        // Payment should be refunded
        uint256 netCost = userBalanceBefore - userBalanceAfter;
        assertTrue(netCost < 0.001 ether, "Payment should be refunded when fee is zero");
        
        vm.stopPrank();
    }

    // =============================================================================
    // Multiple Fee Updates Tests
    // =============================================================================

    function testMultipleServiceFeeUpdates() public {
        uint256[] memory fees = new uint256[](5);
        fees[0] = 0.005 ether;
        fees[1] = 0.02 ether;
        fees[2] = 0;
        fees[3] = 0.1 ether;
        fees[4] = 0.01 ether;

        vm.startPrank(owner);
        
        for (uint256 i = 0; i < fees.length; i++) {
            vm.expectEmit(true, true, false, true);
            emit ServiceFeeUpdated(fees[i], feeRecipient);
            
            ITokenFactory(factory).setServiceFee(fees[i]);
            
            uint256 currentFee = ITokenFactory(factory).getServiceFee();
            assertEq(currentFee, fees[i], string(abi.encodePacked("Fee update ", vm.toString(i), " failed")));
        }
        
        vm.stopPrank();
    }

    function testMultipleFeeRecipientUpdates() public {
        address[] memory recipients = new address[](3);
        recipients[0] = newFeeRecipient;
        recipients[1] = user1;
        recipients[2] = user2;

        vm.startPrank(owner);
        
        for (uint256 i = 0; i < recipients.length; i++) {
            vm.expectEmit(true, true, false, true);
            emit ServiceFeeUpdated(INITIAL_SERVICE_FEE, recipients[i]);
            
            ITokenFactory(factory).setFeeRecipient(recipients[i]);
            
            address currentRecipient = ITokenFactory(factory).getFeeRecipient();
            assertEq(currentRecipient, recipients[i], string(abi.encodePacked("Recipient update ", vm.toString(i), " failed")));
        }
        
        vm.stopPrank();
    }

    // =============================================================================
    // Concurrent Operations Tests
    // =============================================================================

    function testConcurrentTokenCreationsWithFees() public {
        // Create multiple tokens simultaneously to test fee collection
        vm.startPrank(user1);
        
        uint256 numTokens = 3;
        uint256 recipientBalanceBefore = feeRecipient.balance;
        
        for (uint256 i = 0; i < numTokens; i++) {
            ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
                name: string(abi.encodePacked("Concurrent Token ", vm.toString(i))),
                symbol: string(abi.encodePacked("CONC", vm.toString(i))),
                totalSupply: 1000000 * 10**18,
                decimals: 18,
                mintable: false,
                burnable: false,
                pausable: false,
                capped: false,
                maxSupply: 0,
                initialOwner: user1
            });
            
            ITokenFactory(factory).createToken{value: INITIAL_SERVICE_FEE}(config);
        }
        
        uint256 recipientBalanceAfter = feeRecipient.balance;
        
        // Verify total fees collected
        assertEq(
            recipientBalanceAfter - recipientBalanceBefore,
            INITIAL_SERVICE_FEE * numTokens,
            "Fee recipient should receive fees from all token creations"
        );
        
        vm.stopPrank();
    }

    // =============================================================================
    // Edge Cases and Error Conditions
    // =============================================================================

    function testInsufficientFeePayment() public {
        vm.startPrank(user1);
        
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Insufficient Fee Test",
            symbol: "INSUFFEE",
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
        vm.expectRevert(ITokenFactory.InsufficientServiceFee.selector);
        ITokenFactory(factory).createToken{value: INITIAL_SERVICE_FEE - 1}(config);
        
        vm.stopPrank();
    }

    function testFeePaymentWithNoEther() public {
        vm.startPrank(user1);
        
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "No Ether Test",
            symbol: "NOETH",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        // Should revert with insufficient fee (0 < required fee)
        vm.expectRevert(ITokenFactory.InsufficientServiceFee.selector);
        ITokenFactory(factory).createToken(config);
        
        vm.stopPrank();
    }

    // =============================================================================
    // Gas Efficiency Tests
    // =============================================================================

    function testFeeCollectionGasEfficiency() public {
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

        uint256 gasBefore = gasleft();
        ITokenFactory(factory).createToken{value: INITIAL_SERVICE_FEE}(config);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for token creation with fee collection:", gasUsed);
        
        // Fee collection should not add significant gas overhead
        assertTrue(gasUsed < 6000000, "Fee collection should be gas efficient");
        
        vm.stopPrank();
    }

    // =============================================================================
    // Fuzz Tests
    // =============================================================================

    function testFuzzServiceFeeUpdate(uint256 newFee) public {
        vm.assume(newFee <= MAX_REASONABLE_FEE);
        
        vm.startPrank(owner);
        
        ITokenFactory(factory).setServiceFee(newFee);
        
        uint256 currentFee = ITokenFactory(factory).getServiceFee();
        assertEq(currentFee, newFee, "Fuzz test: Service fee should be updated");
        
        vm.stopPrank();
    }

    function testFuzzFeeCollection(uint256 paymentAmount) public {
        vm.assume(paymentAmount >= INITIAL_SERVICE_FEE);
        vm.assume(paymentAmount <= INITIAL_BALANCE);
        
        vm.startPrank(user1);
        
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Fuzz Fee Test",
            symbol: "FUZZFEE",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        uint256 recipientBalanceBefore = feeRecipient.balance;
        
        ITokenFactory(factory).createToken{value: paymentAmount}(config);
        
        uint256 recipientBalanceAfter = feeRecipient.balance;
        
        // Should always collect exactly the service fee
        assertEq(
            recipientBalanceAfter - recipientBalanceBefore,
            INITIAL_SERVICE_FEE,
            "Fuzz test: Should collect exact service fee regardless of payment amount"
        );
        
        vm.stopPrank();
    }

    // =============================================================================
    // Integration Tests
    // =============================================================================

    function testFeeManagementIntegration() public {
        // Test complete fee management workflow
        vm.startPrank(owner);
        
        // 1. Update service fee
        uint256 newFee = 0.03 ether;
        ITokenFactory(factory).setServiceFee(newFee);
        
        // 2. Update fee recipient  
        ITokenFactory(factory).setFeeRecipient(newFeeRecipient);
        
        vm.stopPrank();
        
        // 3. Create token with new settings
        vm.startPrank(user1);
        
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Integration Test Token",
            symbol: "INTEG",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: user1
        });

        uint256 newRecipientBalanceBefore = newFeeRecipient.balance;
        
        ITokenFactory(factory).createToken{value: newFee}(config);
        
        uint256 newRecipientBalanceAfter = newFeeRecipient.balance;
        
        // Verify new fee collected by new recipient
        assertEq(
            newRecipientBalanceAfter - newRecipientBalanceBefore,
            newFee,
            "Integration test: New recipient should receive new fee amount"
        );
        
        vm.stopPrank();
    }

    // Test will fail until TokenFactory implementation exists
    receive() external payable {}
}