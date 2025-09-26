#!/bin/bash

# Gas Benchmark Script for Token Factory
# Generates comprehensive gas reports using Foundry

set -e

echo "🔥 Token Factory Gas Benchmarking"
echo "================================="

# Check if foundry is available
if ! command -v forge &> /dev/null; then
    echo "❌ Foundry not found. Please install: https://book.getfoundry.sh/getting-started/installation"
    exit 1
fi

# Navigate to contracts directory
cd "$(dirname "$0")/.."

echo "📁 Working directory: $(pwd)"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
forge clean

# Build contracts
echo "🔨 Building contracts..."
forge build --sizes

# Generate gas snapshots
echo "📊 Generating gas snapshots..."
forge snapshot --optimize

# Run tests with gas reporting
echo "⛽ Running gas analysis tests..."
forge test --gas-report --optimize

# Generate detailed size report
echo "📏 Contract size analysis..."
echo "=========================="
forge build --sizes | grep -E "(TokenFactory|ERC20Template)"

# Check if gas snapshot exists and compare
if [ -f .gas-snapshot ]; then
    echo "📈 Comparing with previous snapshot..."
    forge snapshot --diff .gas-snapshot --optimize || true
else
    echo "📝 Creating initial gas snapshot..."
    forge snapshot --optimize
fi

# Generate custom benchmark report
echo "🎯 Custom benchmarking..."
echo "======================="

# Create a temporary test file for benchmarking specific scenarios
cat > test/GasBenchmark.t.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "forge-std/Test.sol";
import "../src/TokenFactory.sol";
import "../src/ERC20Template.sol";

contract GasBenchmarkTest is Test {
    TokenFactory public factory;
    ERC20Template public template;

    address public owner = makeAddr("owner");
    address public user = makeAddr("user");

    function setUp() public {
        vm.startPrank(owner);

        // Deploy template
        template = new ERC20Template();

        // Deploy and initialize factory
        factory = new TokenFactory();
        factory.initialize(owner, owner, 0.001 ether);

        // Add templates
        factory.addTemplate(factory.BASIC_ERC20(), address(template));
        factory.addTemplate(factory.MINTABLE_ERC20(), address(template));
        factory.addTemplate(factory.FULL_FEATURED(), address(template));

        vm.stopPrank();

        // Fund user for testing
        vm.deal(user, 10 ether);
    }

    function testGas_CreateBasicToken() public {
        vm.prank(user);

        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Basic Token",
            symbol: "BASIC",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            initialOwner: user,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0
        });

        uint256 gasBefore = gasleft();
        factory.createToken{value: 0.001 ether}(config);
        uint256 gasUsed = gasBefore - gasleft();

        emit log_named_uint("Gas used for basic token creation", gasUsed);
    }

    function testGas_CreateMintableToken() public {
        vm.prank(user);

        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Mintable Token",
            symbol: "MINT",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            initialOwner: user,
            mintable: true,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0
        });

        uint256 gasBefore = gasleft();
        factory.createToken{value: 0.001 ether}(config);
        uint256 gasUsed = gasBefore - gasleft();

        emit log_named_uint("Gas used for mintable token creation", gasUsed);
    }

    function testGas_CreateFullFeaturedToken() public {
        vm.prank(user);

        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Full Featured Token",
            symbol: "FULL",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            initialOwner: user,
            mintable: true,
            burnable: true,
            pausable: true,
            capped: true,
            maxSupply: 10000000 * 10**18
        });

        uint256 gasBefore = gasleft();
        factory.createToken{value: 0.001 ether}(config);
        uint256 gasUsed = gasBefore - gasleft();

        emit log_named_uint("Gas used for full featured token creation", gasUsed);
    }

    function testGas_AddTemplate() public {
        vm.prank(owner);

        ERC20Template newTemplate = new ERC20Template();
        bytes32 customId = keccak256("CUSTOM");

        uint256 gasBefore = gasleft();
        factory.addTemplate(customId, address(newTemplate));
        uint256 gasUsed = gasBefore - gasleft();

        emit log_named_uint("Gas used for adding template", gasUsed);
    }

    function testGas_RemoveTemplate() public {
        vm.prank(owner);

        // First add a template to remove
        ERC20Template newTemplate = new ERC20Template();
        bytes32 customId = keccak256("CUSTOM");
        factory.addTemplate(customId, address(newTemplate));

        uint256 gasBefore = gasleft();
        factory.removeTemplate(customId);
        uint256 gasUsed = gasBefore - gasleft();

        emit log_named_uint("Gas used for removing template", gasUsed);
    }
}
EOF

# Run the custom benchmark tests
echo "🚀 Running custom gas benchmarks..."
forge test --match-contract GasBenchmarkTest -vv

# Cleanup temporary test file
rm -f test/GasBenchmark.t.sol

echo "✅ Gas benchmarking complete!"
echo "📄 Reports saved to:"
echo "  - Contract sizes: shown above"
echo "  - Gas snapshots: .gas-snapshot"
echo "  - Full analysis: contracts/gas-analysis.md"

# Display final summary
echo ""
echo "📋 Summary of Gas Costs:"
echo "======================="
if [ -f .gas-snapshot ]; then
    echo "Top gas consumers:"
    grep -E "(TokenFactory|ERC20Template)" .gas-snapshot | head -10 || echo "No snapshot data available"
fi

echo ""
echo "💡 Next steps:"
echo "  1. Review gas-analysis.md for optimization opportunities"
echo "  2. Implement Phase 1 optimizations (non-breaking)"
echo "  3. Test optimizations: forge snapshot --diff .gas-snapshot"
echo "  4. Monitor gas usage in production deployments"