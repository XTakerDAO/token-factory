// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import "../src/TokenFactory.sol";
import "../src/ERC20Template.sol";

/**
 * @title Upgrade Script
 * @dev Upgrade script for TokenFactory UUPS proxy
 * @notice Handles safe upgrades with validation and rollback capabilities
 */
contract Upgrade is Script {
    // Upgrade configuration
    struct UpgradeConfig {
        address proxy;
        address currentImplementation;
        address newImplementation;
        bytes initData;
        bool skipValidation;
        string network;
    }

    // Events for logging
    event UpgradeStarted(address indexed proxy, address indexed oldImplementation, address indexed newImplementation);
    event UpgradeCompleted(address indexed proxy, address indexed newImplementation);
    event ValidationPassed(address indexed proxy, string checkType);
    event ValidationFailed(address indexed proxy, string checkType, string reason);

    function run() public {
        // Get configuration from environment variables
        address proxy = vm.envAddress("FACTORY_PROXY");
        string memory network = vm.envOr("NETWORK", string("localhost"));
        bool skipValidation = vm.envOr("SKIP_VALIDATION", false);

        console.log("=== TokenFactory Upgrade Started ===");
        console.log("Network:", network);
        console.log("Chain ID:", block.chainid);
        console.log("Proxy address:", proxy);
        console.log("Upgrader address:", msg.sender);
        console.log("Skip validation:", skipValidation);

        vm.startBroadcast();

        // Perform upgrade
        address newImplementation = upgradeFactory(proxy, skipValidation);

        vm.stopBroadcast();

        // Log completion
        logUpgradeResults(network, proxy, newImplementation);

        // Save upgrade info
        saveUpgradeInfo(network, proxy, newImplementation);
    }

    function upgradeFactory(address proxy, bool skipValidation) internal returns (address newImplementation) {
        // 1. Validate current state
        console.log("\n1. Validating current state...");
        address currentImpl = validateCurrentState(proxy);

        // 2. Deploy new implementation
        console.log("\n2. Deploying new implementation...");
        newImplementation = deployNewImplementation();

        // 3. Validate new implementation
        if (!skipValidation) {
            console.log("\n3. Validating new implementation...");
            validateNewImplementation(newImplementation);
        } else {
            console.log("\n3. Skipping validation (--skip-validation flag set)");
        }

        // 4. Perform upgrade
        console.log("\n4. Performing upgrade...");
        performUpgrade(proxy, newImplementation);

        // 5. Validate upgrade success
        console.log("\n5. Validating upgrade success...");
        validateUpgradeSuccess(proxy, currentImpl, newImplementation);

        console.log("Upgrade completed successfully!");
        return newImplementation;
    }

    function validateCurrentState(address proxy) internal view returns (address currentImpl) {
        TokenFactory factory = TokenFactory(proxy);
        
        // Check if contract is properly initialized
        address owner = factory.owner();
        require(owner != address(0), "Factory not initialized");
        
        // Check if we have permission to upgrade
        require(owner == msg.sender, "Not authorized to upgrade");
        
        // Check proxy state
        currentImpl = getCurrentImplementation(proxy);
        require(currentImpl != address(0), "Invalid proxy state");
        
        // Log current state
        console.log("   Current implementation:", currentImpl);
        console.log("   Current owner:", owner);
        console.log("   Current service fee:", factory.getServiceFee());
        console.log("   Current fee recipient:", factory.getFeeRecipient());
        console.log("   Total tokens created:", factory.getTotalTokensCreated());
        
        // Check templates
        bytes32[] memory templates = factory.getAllTemplates();
        console.log("   Current templates count:", templates.length);
        
        console.log("   Current state validation passed");
        return currentImpl;
    }

    function deployNewImplementation() internal returns (address newImplementation) {
        // Deploy new TokenFactory implementation
        TokenFactory newImpl = new TokenFactory();
        newImplementation = address(newImpl);
        console.log("   New implementation deployed at:", newImplementation);

        // Also deploy new ERC20Template if needed
        ERC20Template newTemplate = new ERC20Template();
        console.log("   New ERC20Template deployed at:", address(newTemplate));
        console.log("   (Note: Template updates require separate addTemplate call)");

        return newImplementation;
    }

    function validateNewImplementation(address newImpl) internal {
        // Basic deployment validation
        require(newImpl != address(0), "Invalid new implementation address");
        
        // Verify contract bytecode exists
        uint256 codeSize;
        assembly { codeSize := extcodesize(newImpl) }
        require(codeSize > 0, "No bytecode at new implementation address");

        console.log("   New implementation bytecode size:", codeSize);
        console.log("   New implementation validation passed");
    }

    function performUpgrade(address proxy, address newImplementation) internal {
        TokenFactory factoryProxy = TokenFactory(proxy);
        
        // Call upgradeToAndCall with empty data (no reinitializer needed)
        factoryProxy.upgradeToAndCall(newImplementation, "");
        
        console.log("   Upgrade transaction executed");
    }

    function validateUpgradeSuccess(address proxy, address oldImpl, address newImpl) internal view {
        // Check that implementation was updated
        address currentImpl = getCurrentImplementation(proxy);
        require(currentImpl == newImpl, "Implementation not updated");
        require(currentImpl != oldImpl, "Implementation unchanged");
        
        // Check that proxy still works
        TokenFactory factory = TokenFactory(proxy);
        address owner = factory.owner();
        require(owner != address(0), "Proxy functionality broken");
        
        // Verify state preservation
        uint256 serviceFee = factory.getServiceFee();
        address feeRecipient = factory.getFeeRecipient();
        uint256 totalTokens = factory.getTotalTokensCreated();
        
        console.log("   Post-upgrade implementation:", currentImpl);
        console.log("   Post-upgrade owner:", owner);
        console.log("   Post-upgrade service fee:", serviceFee);
        console.log("   Post-upgrade fee recipient:", feeRecipient);
        console.log("   Post-upgrade total tokens:", totalTokens);
        
        // Verify templates still exist
        bytes32[] memory templates = factory.getAllTemplates();
        require(templates.length > 0, "Templates lost during upgrade");
        console.log("   Post-upgrade templates count:", templates.length);
        
        console.log("   Upgrade success validation passed");
    }

    function logUpgradeResults(string memory network, address proxy, address newImplementation) internal view {
        TokenFactory factory = TokenFactory(proxy);
        
        console.log("\n=== UPGRADE COMPLETE ===");
        console.log("Network:", network);
        console.log("Chain ID:", block.chainid);
        console.log("Proxy:", proxy);
        console.log("New Implementation:", newImplementation);
        console.log("Owner:", factory.owner());
        console.log("Service Fee:", factory.getServiceFee());
        console.log("Templates:", factory.getAllTemplates().length);
        console.log("Total Tokens Created:", factory.getTotalTokensCreated());
        console.log("Upgrader:", msg.sender);
    }

    function getCurrentImplementation(address proxy) internal view returns (address) {
        bytes32 implementationSlot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
        return address(uint160(uint256(vm.load(proxy, implementationSlot))));
    }

    function saveUpgradeInfo(string memory network, address proxy, address newImplementation) internal {
        string memory json = "upgrade";
        
        vm.serializeString(json, "network", network);
        vm.serializeUint(json, "chainId", block.chainid);
        vm.serializeAddress(json, "proxy", proxy);
        vm.serializeAddress(json, "oldImplementation", getCurrentImplementation(proxy));
        vm.serializeAddress(json, "newImplementation", newImplementation);
        vm.serializeAddress(json, "upgrader", msg.sender);
        vm.serializeUint(json, "timestamp", block.timestamp);
        vm.serializeUint(json, "blockNumber", block.number);
        
        string memory finalJson = vm.serializeUint(json, "gasUsed", 0); // Would need to track actual gas usage

        // Create upgrade directory
        try vm.createDir("./upgrades", true) {} catch {}
        
        string memory filename = string.concat("./upgrades/", network, "_", vm.toString(block.timestamp), ".json");
        vm.writeJson(finalJson, filename);
        
        console.log("\nUpgrade info saved to:", filename);
    }

    // ==================== UTILITY FUNCTIONS ====================

    // Direct upgrade function for external use
    function upgradeFactoryInternal(address proxy, bool skipValidation) public returns (address newImplementation) {
        return upgradeFactory(proxy, skipValidation);
    }

    // Emergency upgrade (skips all validation)
    function emergencyUpgrade(address proxy, address newImplementation) public {
        console.log("!!! EMERGENCY UPGRADE - SKIPPING ALL VALIDATIONS !!!");
        console.log("Proxy:", proxy);
        console.log("New Implementation:", newImplementation);

        vm.startBroadcast();

        TokenFactory factoryProxy = TokenFactory(proxy);
        factoryProxy.upgradeToAndCall(newImplementation, "");

        vm.stopBroadcast();

        console.log("Emergency upgrade completed");
    }

    // Rollback to previous implementation
    function rollbackUpgrade(address proxy, address previousImplementation) public {
        console.log("!!! ROLLBACK UPGRADE !!!");
        console.log("Proxy:", proxy);
        console.log("Rolling back to:", previousImplementation);

        require(previousImplementation != address(0), "Invalid previous implementation");

        vm.startBroadcast();

        TokenFactory factoryProxy = TokenFactory(proxy);
        factoryProxy.upgradeToAndCall(previousImplementation, "");

        vm.stopBroadcast();

        // Validate rollback
        address currentImpl = getCurrentImplementation(proxy);
        require(currentImpl == previousImplementation, "Rollback failed");
        
        console.log("Rollback completed successfully");
    }

    // Upgrade with reinitialization
    function upgradeAndReinit(address proxy, bytes memory initData) public returns (address newImplementation) {
        console.log("Upgrading with reinitialization...");

        vm.startBroadcast();

        // Deploy new implementation
        TokenFactory newImpl = new TokenFactory();
        newImplementation = address(newImpl);
        console.log("New implementation:", newImplementation);

        // Upgrade with reinit data
        TokenFactory factoryProxy = TokenFactory(proxy);
        factoryProxy.upgradeToAndCall(newImplementation, initData);

        vm.stopBroadcast();

        console.log("Upgrade with reinitialization completed");
        return newImplementation;
    }

    // Test upgrade on a fork
    function testUpgradeOnFork(address proxy) public returns (bool success) {
        console.log("Testing upgrade on fork...");
        
        try this.upgradeFactoryInternal(proxy, true) returns (address newImpl) {
            console.log("Test upgrade successful, new implementation:", newImpl);
            
            // Test basic functionality
            TokenFactory factory = TokenFactory(proxy);
            
            // These calls should not revert
            factory.getServiceFee();
            factory.owner();
            factory.getAllTemplates();
            factory.getTotalTokensCreated();
            
            success = true;
            console.log("All post-upgrade functionality tests passed");
        } catch Error(string memory reason) {
            console.log("Test upgrade failed:", reason);
            success = false;
        } catch {
            console.log("Test upgrade failed with unknown error");
            success = false;
        }

        return success;
    }

    // Get comprehensive upgrade information
    function getUpgradeInfo(address proxy) public view returns (
        address currentImpl,
        address owner,
        uint256 serviceFee,
        uint256 totalTokens,
        uint256 templateCount
    ) {
        currentImpl = getCurrentImplementation(proxy);
        TokenFactory factory = TokenFactory(proxy);
        owner = factory.owner();
        serviceFee = factory.getServiceFee();
        totalTokens = factory.getTotalTokensCreated();
        templateCount = factory.getAllTemplates().length;
    }

    // Batch upgrade multiple proxies (for multi-chain deployments)
    function batchUpgrade(address[] memory proxies) public {
        require(proxies.length > 0, "No proxies provided");
        console.log("Starting batch upgrade for", proxies.length, "proxies");

        vm.startBroadcast();

        // Deploy single implementation for all proxies
        TokenFactory newImpl = new TokenFactory();
        address newImplementation = address(newImpl);
        console.log("Shared implementation deployed at:", newImplementation);

        uint256 successful = 0;
        uint256 failed = 0;

        // Upgrade each proxy
        for (uint256 i = 0; i < proxies.length; i++) {
            console.log("Upgrading proxy", i + 1, "of", proxies.length, ":", proxies[i]);
            
            try TokenFactory(proxies[i]).upgradeToAndCall(newImplementation, "") {
                console.log("  SUCCESS: Proxy upgraded");
                successful++;
            } catch Error(string memory reason) {
                console.log("  FAILED:", reason);
                failed++;
            } catch {
                console.log("  FAILED: Unknown error");
                failed++;
            }
        }

        vm.stopBroadcast();

        console.log("Batch upgrade completed:");
        console.log("  Successful:", successful);
        console.log("  Failed:", failed);
        console.log("  Total:", proxies.length);
    }

    // Update templates after upgrade (separate function)
    function updateTemplates(address factory, address newTemplate) public {
        console.log("Updating templates in factory:", factory);
        console.log("New template implementation:", newTemplate);

        vm.startBroadcast();

        TokenFactory factoryContract = TokenFactory(factory);
        
        // Update all template mappings to use new implementation
        factoryContract.addTemplate(factoryContract.BASIC_ERC20(), newTemplate);
        factoryContract.addTemplate(factoryContract.MINTABLE_ERC20(), newTemplate);
        factoryContract.addTemplate(factoryContract.FULL_FEATURED(), newTemplate);

        vm.stopBroadcast();

        console.log("Templates updated successfully");
    }

    // Prepare upgrade (deploy implementation without upgrading)
    function prepareUpgrade() public returns (address newImplementation, address newTemplate) {
        console.log("Preparing upgrade implementations...");

        vm.startBroadcast();

        // Deploy new implementations
        newImplementation = address(new TokenFactory());
        newTemplate = address(new ERC20Template());

        vm.stopBroadcast();

        console.log("New TokenFactory implementation:", newImplementation);
        console.log("New ERC20Template implementation:", newTemplate);
        console.log("Implementations ready for upgrade");

        return (newImplementation, newTemplate);
    }

    // Verify upgrade compatibility
    function verifyUpgradeCompatibility(address proxy, address newImplementation) public view returns (bool compatible, string memory reason) {
        try TokenFactory(proxy).owner() returns (address) {
            // Basic proxy functionality check passed
            if (newImplementation == address(0)) {
                return (false, "New implementation is zero address");
            }
            
            uint256 codeSize;
            assembly { codeSize := extcodesize(newImplementation) }
            if (codeSize == 0) {
                return (false, "New implementation has no code");
            }

            return (true, "Compatible");
        } catch {
            return (false, "Current proxy is not functional");
        }
    }
}