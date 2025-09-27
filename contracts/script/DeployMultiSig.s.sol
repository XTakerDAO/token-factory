// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/TokenFactory.sol";
import "../src/ERC20Template.sol";

/**
 * @title Multi-Sig Deploy Script
 * @dev Deployment script for TokenFactory using multi-signature wallets
 * @notice Integrates with Gnosis Safe and other multi-sig solutions
 */
contract DeployMultiSig is Script {
    // Multi-sig configuration
    struct MultiSigConfig {
        address[] owners;
        uint256 threshold;
        address safeSingleton;
        address safeProxyFactory;
        string network;
    }

    // Network-specific multi-sig configurations
    mapping(string => MultiSigConfig) private multiSigConfigs;

    // Gnosis Safe addresses (mainnet)
    address constant GNOSIS_SAFE_SINGLETON = 0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552;
    address constant GNOSIS_SAFE_PROXY_FACTORY = 0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2;

    function setUp() public {
        // Parse multi-sig owners from environment
        address[] memory owners = parseOwners(vm.envOr("MULTISIG_OWNERS", string("")));
        uint256 threshold = vm.envOr("MULTISIG_THRESHOLD", uint256(2));

        // Ethereum mainnet multi-sig config
        multiSigConfigs["ethereum"] = MultiSigConfig({
            owners: owners,
            threshold: threshold,
            safeSingleton: GNOSIS_SAFE_SINGLETON,
            safeProxyFactory: GNOSIS_SAFE_PROXY_FACTORY,
            network: "ethereum"
        });

        // BSC mainnet multi-sig config
        multiSigConfigs["bsc"] = MultiSigConfig({
            owners: owners,
            threshold: threshold,
            safeSingleton: 0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552, // BSC Safe addresses
            safeProxyFactory: 0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2,
            network: "bsc"
        });
    }

    function run() public {
        string memory network = vm.envOr("NETWORK", string("ethereum"));
        MultiSigConfig memory config = multiSigConfigs[network];

        console.log("=== Multi-Sig Deployment ===");
        console.log("Network:", network);
        console.log("Multi-Sig Owners:", config.owners.length);
        console.log("Threshold:", config.threshold);
        console.log("Current deployer:", msg.sender);

        // Validate configuration
        validateMultiSigConfig(config);

        // Deploy contracts
        deployWithMultiSig(config);
    }

    function validateMultiSigConfig(MultiSigConfig memory config) internal pure {
        require(config.owners.length >= 2, "At least 2 owners required");
        require(config.threshold >= 1, "Threshold must be at least 1");
        require(config.threshold <= config.owners.length, "Threshold cannot exceed owners count");
        require(config.safeSingleton != address(0), "Invalid Safe singleton address");
    }

    function deployWithMultiSig(MultiSigConfig memory config) internal {
        vm.startBroadcast();

        // 1. Deploy TokenFactory implementation
        console.log("\n1. Deploying TokenFactory implementation...");
        TokenFactory implementation = new TokenFactory();
        console.log("TokenFactory implementation:", address(implementation));

        // 2. Deploy ERC20Template
        console.log("\n2. Deploying ERC20Template...");
        ERC20Template template = new ERC20Template();
        console.log("ERC20Template:", address(template));

        // 3. Create multi-sig wallet (if not exists)
        address multiSigWallet = deployMultiSigWallet(config);
        console.log("Multi-sig wallet:", multiSigWallet);

        // 4. Deploy proxy with multi-sig as owner
        console.log("\n3. Deploying UUPS Proxy with multi-sig owner...");
        bytes memory initData = abi.encodeWithSelector(
            TokenFactory.initialize.selector,
            multiSigWallet, // Multi-sig as owner
            multiSigWallet, // Multi-sig as fee recipient
            vm.envOr("INITIAL_SERVICE_FEE", uint256(0.01 ether))
        );

        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );
        console.log("Proxy deployed at:", address(proxy));

        // 5. Get factory instance
        TokenFactory factory = TokenFactory(address(proxy));

        vm.stopBroadcast();

        // 6. Create multi-sig transaction for template addition
        createMultiSigTransactionData(address(factory), address(template));

        // 7. Save deployment info
        saveMultiSigDeploymentInfo(config.network, address(factory), address(template), multiSigWallet);

        console.log("\n=== Multi-Sig Deployment Complete ===");
        console.log("TokenFactory Proxy:", address(factory));
        console.log("ERC20Template:", address(template));
        console.log("Multi-Sig Owner:", multiSigWallet);
    }

    function deployMultiSigWallet(MultiSigConfig memory config) internal returns (address) {
        // This is a simplified version - in practice, you'd use Gnosis Safe SDK
        // or deploy through their factory contract

        // Check if we have a pre-existing multi-sig address
        address existingSafe = vm.envOr("EXISTING_MULTISIG", address(0));
        if (existingSafe != address(0)) {
            console.log("Using existing multi-sig wallet:", existingSafe);
            return existingSafe;
        }

        // For demonstration - return the first owner as placeholder
        // In real deployment, use Gnosis Safe factory
        console.log("Note: Create multi-sig wallet manually at https://app.safe.global/");
        console.log("Required owners:");
        for (uint i = 0; i < config.owners.length; i++) {
            console.log("Owner", i + 1);
            console.log("Address:", config.owners[i]);
        }
        console.log("Required threshold:", config.threshold);

        return config.owners[0]; // Placeholder
    }

    function createMultiSigTransactionData(address factory, address template) internal {
        // Generate transaction data for multi-sig execution
        bytes memory addTemplateData = abi.encodeWithSelector(
            TokenFactory.addTemplate.selector,
            "ERC20_BASIC",
            template,
            "Basic ERC20 token with optional advanced features"
        );

        console.log("\n=== Multi-Sig Transaction Data ===");
        console.log("Target Contract:", factory);
        console.log("Function: addTemplate");
        console.log("Data (hex):");
        console.logBytes(addTemplateData);

        // Save transaction data for multi-sig wallet
        vm.writeFile(
            "multisig_transactions/add_template.txt",
            string(abi.encodePacked(
                "Target: ", vm.toString(factory), "\n",
                "Value: 0\n",
                "Data: ", vm.toString(addTemplateData)
            ))
        );
    }

    function saveMultiSigDeploymentInfo(
        string memory network,
        address factory,
        address template,
        address multiSig
    ) internal {
        string memory json = "multiSigDeploymentJson";

        vm.serializeAddress(json, "tokenFactory", factory);
        vm.serializeAddress(json, "erc20Template", template);
        vm.serializeAddress(json, "multiSigWallet", multiSig);
        vm.serializeAddress(json, "deployer", msg.sender);
        vm.serializeUint(json, "blockNumber", block.number);
        vm.serializeUint(json, "timestamp", block.timestamp);
        string memory finalJson = vm.serializeString(json, "network", network);

        string memory fileName = string.concat("deployments/", network, "_multisig.json");
        vm.writeJson(finalJson, fileName);

        console.log("Multi-sig deployment info saved to:", fileName);
    }

    function parseOwners(string memory ownersStr) internal returns (address[] memory) {
        // Simple CSV parser for owner addresses
        // Format: "0xaddr1,0xaddr2,0xaddr3"

        if (bytes(ownersStr).length == 0) {
            // Return default test owners if not provided
            address[] memory defaultOwners = new address[](3);
            defaultOwners[0] = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
            defaultOwners[1] = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
            defaultOwners[2] = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
            return defaultOwners;
        }

        // TODO: Implement proper CSV parsing
        // For now, return single address
        address[] memory owners = new address[](1);
        owners[0] = vm.envAddress("MULTISIG_OWNERS");
        return owners;
    }
}