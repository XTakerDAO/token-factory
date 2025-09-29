#!/bin/bash

# Token Factory Multi-Signature Wallet Deployment Script
# Integrates with Gnosis Safe and other multi-sig solutions

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏛️  Token Factory Multi-Sig Deployment${NC}"
echo "================================================"

# Configuration
NETWORK=${1:-ethereum}
MULTISIG_ADDRESS=${2:-""}
DRY_RUN=${3:-false}

# Validate network
case $NETWORK in
    ethereum|bsc|xsc|sepolia|bsc_testnet|xsc_testnet)
        echo -e "${GREEN}✓ Network: $NETWORK${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid network: $NETWORK${NC}"
        echo "Supported networks: ethereum, bsc, xsc, sepolia, bsc_testnet, xsc_testnet"
        exit 1
        ;;
esac

# Load multi-sig configuration
if [ -f ".env.multisig" ]; then
    source .env.multisig
    echo -e "${GREEN}✓ Multi-sig configuration loaded${NC}"
else
    echo -e "${YELLOW}⚠️  .env.multisig not found, using defaults${NC}"
fi

# Set RPC URL based on network
case $NETWORK in
    ethereum)
        RPC_URL=${MAINNET_RPC_URL}
        EXPLORER_URL="https://etherscan.io"
        ;;
    bsc)
        RPC_URL=${BSC_RPC_URL}
        EXPLORER_URL="https://bscscan.com"
        ;;
    xsc)
        RPC_URL=${XSC_RPC_URL}
        EXPLORER_URL="https://explorer.xsc.network"
        ;;
    sepolia)
        RPC_URL=${SEPOLIA_RPC_URL}
        EXPLORER_URL="https://sepolia.etherscan.io"
        ;;
    bsc_testnet)
        RPC_URL=${BSC_TESTNET_RPC_URL}
        EXPLORER_URL="https://testnet.bscscan.com"
        ;;
    xsc_testnet)
        RPC_URL=${XSC_TESTNET_RPC_URL}
        EXPLORER_URL="https://testnet.explorer.xsc.network"
        ;;
esac

if [ -z "$RPC_URL" ]; then
    echo -e "${RED}❌ RPC_URL not set for network $NETWORK${NC}"
    exit 1
fi

echo -e "${YELLOW}📡 RPC URL: $RPC_URL${NC}"

# Multi-sig configuration validation
if [ -z "$MULTISIG_ADDRESS" ]; then
    MULTISIG_ADDRESS=${EXISTING_MULTISIG}
fi

if [ -z "$MULTISIG_ADDRESS" ] || [ "$MULTISIG_ADDRESS" = "0x0000000000000000000000000000000000000000" ]; then
    echo -e "${YELLOW}⚠️  No existing multi-sig address provided${NC}"
    echo -e "${BLUE}📝 Multi-sig wallet creation required:${NC}"
    echo "1. Visit https://app.safe.global/"
    echo "2. Create new Safe wallet"
    echo "3. Add the following owners:"

    if [ -n "$MULTISIG_OWNERS" ]; then
        IFS=',' read -ra OWNERS <<< "$MULTISIG_OWNERS"
        for i in "${!OWNERS[@]}"; do
            echo "   Owner $((i+1)): ${OWNERS[i]}"
        done
        echo "   Threshold: ${MULTISIG_THRESHOLD:-2}"
    else
        echo "   Please configure MULTISIG_OWNERS in .env.multisig"
    fi

    echo ""
    read -p "Enter your multi-sig wallet address: " MULTISIG_ADDRESS

    if [ -z "$MULTISIG_ADDRESS" ]; then
        echo -e "${RED}❌ Multi-sig address required${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Multi-sig Address: $MULTISIG_ADDRESS${NC}"

# Validate multi-sig address
if ! cast code $MULTISIG_ADDRESS --rpc-url $RPC_URL > /dev/null 2>&1; then
    echo -e "${RED}❌ Invalid multi-sig address or not deployed${NC}"
    exit 1
fi

# Check deployer balance
DEPLOYER_ADDRESS=$(cast wallet address)
if [ -n "$DEPLOYER_ADDRESS" ]; then
    BALANCE=$(cast balance $DEPLOYER_ADDRESS --rpc-url $RPC_URL)
    BALANCE_ETH=$(cast to-unit $BALANCE ether)
    echo -e "${GREEN}✓ Deployer: $DEPLOYER_ADDRESS${NC}"
    echo -e "${GREEN}✓ Balance: $BALANCE_ETH ETH${NC}"

    # Minimum balance check
    MIN_BALANCE="100000000000000000"  # 0.1 ETH in wei
    if [ "$(echo "$BALANCE < $MIN_BALANCE" | bc -l)" -eq 1 ]; then
        echo -e "${RED}❌ Insufficient balance. Need at least 0.1 ETH for deployment${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ No wallet configured for deployment${NC}"
    exit 1
fi

# Environment check
echo -e "${YELLOW}🔧 Checking environment...${NC}"

# Change to contracts directory
cd contracts

# Check if foundry.toml exists
if [ ! -f "foundry.toml" ]; then
    echo -e "${RED}❌ foundry.toml not found${NC}"
    exit 1
fi

# Check if deployment script exists
if [ ! -f "script/DeployMultiSig.s.sol" ]; then
    echo -e "${RED}❌ DeployMultiSig.s.sol not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment ready${NC}"

# Create multisig_transactions directory
mkdir -p multisig_transactions

# Deployment confirmation
echo -e "${YELLOW}📋 Multi-Sig Deployment Summary${NC}"
echo "================================"
echo "Network: $NETWORK"
echo "RPC URL: $RPC_URL"
echo "Multi-sig Address: $MULTISIG_ADDRESS"
echo "Deployer Address: $DEPLOYER_ADDRESS"
echo "Deployer Balance: $BALANCE_ETH ETH"
echo "Script: DeployMultiSig.s.sol"
echo "================================"

if [ "$DRY_RUN" = "true" ]; then
    echo -e "${YELLOW}🔍 DRY RUN - No actual deployment${NC}"
    BROADCAST_FLAG=""
else
    echo -e "${RED}⚠️  PRODUCTION DEPLOYMENT${NC}"
    echo "This will deploy contracts to $NETWORK with multi-sig ownership!"
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Deployment cancelled"
        exit 0
    fi
    BROADCAST_FLAG="--broadcast"
fi

# Set environment variables for the script
export EXISTING_MULTISIG=$MULTISIG_ADDRESS
export NETWORK=$NETWORK

# Deployment command
echo -e "${BLUE}🚀 Starting multi-sig deployment...${NC}"

DEPLOY_COMMAND="forge script script/DeployMultiSig.s.sol \
    --rpc-url $RPC_URL \
    $BROADCAST_FLAG \
    --verify \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    -vvvv"

echo -e "${YELLOW}Command: $DEPLOY_COMMAND${NC}"

# Execute deployment
if eval $DEPLOY_COMMAND; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"

    # Check if transaction data was generated
    if [ -f "multisig_transactions/add_template.txt" ]; then
        echo -e "${BLUE}📝 Multi-sig transaction data generated:${NC}"
        cat multisig_transactions/add_template.txt
        echo ""
    fi

    # Post-deployment instructions
    echo -e "${BLUE}📝 Next Steps:${NC}"
    echo "1. ✅ Contracts deployed with multi-sig ownership"
    echo "2. ⏳ Create multi-sig transaction to add ERC20Template:"
    echo "   - Visit https://app.safe.global/"
    echo "   - Connect to your multi-sig wallet"
    echo "   - Create new transaction using data from multisig_transactions/add_template.txt"
    echo "   - Get required signatures from other owners"
    echo "   - Execute the transaction"
    echo ""
    echo "3. ⏳ Verify contracts on block explorer:"
    echo "   - Visit $EXPLORER_URL"
    echo "   - Search for deployed contract addresses"
    echo ""
    echo "4. ⏳ Test contract functionality"
    echo "5. ⏳ Set up monitoring and alerts"

    # Save deployment information
    DEPLOYMENT_FILE="deployments/${NETWORK}_multisig_$(date +%Y%m%d_%H%M%S).json"
    echo -e "${GREEN}💾 Deployment info saved to: $DEPLOYMENT_FILE${NC}"

    # Generate transaction summary
    echo -e "${BLUE}📄 Transaction Summary:${NC}"
    echo "Multi-sig wallet: $MULTISIG_ADDRESS"
    echo "Required signatures: ${MULTISIG_THRESHOLD:-2}"
    echo "Transaction data available in: multisig_transactions/"

else
    echo -e "${RED}❌ Multi-sig deployment failed!${NC}"
    echo "Please check the error messages above"
    exit 1
fi

echo -e "${GREEN}🎉 Multi-sig deployment complete!${NC}"
echo -e "${YELLOW}Remember to execute the multi-sig transactions to complete setup${NC}"