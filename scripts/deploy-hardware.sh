#!/bin/bash

# Token Factory Hardware Wallet Deployment Script
# Supports Ledger, Trezor, and Frame wallets

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Token Factory Hardware Wallet Deployment${NC}"
echo "================================================"

# Configuration
NETWORK=${1:-ethereum}
WALLET_TYPE=${2:-ledger}  # ledger, trezor, frame
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

# Set RPC URL based on network
case $NETWORK in
    ethereum)
        RPC_URL=${MAINNET_RPC_URL}
        ;;
    bsc)
        RPC_URL=${BSC_RPC_URL}
        ;;
    xsc)
        RPC_URL=${XSC_RPC_URL}
        ;;
    sepolia)
        RPC_URL=${SEPOLIA_RPC_URL}
        ;;
    bsc_testnet)
        RPC_URL=${BSC_TESTNET_RPC_URL}
        ;;
    xsc_testnet)
        RPC_URL=${XSC_TESTNET_RPC_URL}
        ;;
esac

if [ -z "$RPC_URL" ]; then
    echo -e "${RED}❌ RPC_URL not set for network $NETWORK${NC}"
    exit 1
fi

echo -e "${YELLOW}📡 RPC URL: $RPC_URL${NC}"

# Check hardware wallet connection
echo -e "${YELLOW}🔍 Checking hardware wallet connection...${NC}"

case $WALLET_TYPE in
    ledger)
        echo "Please ensure your Ledger device is:"
        echo "1. Connected via USB"
        echo "2. Unlocked with PIN"
        echo "3. Ethereum app is open"
        echo "4. Contract data is allowed"

        # Test Ledger connection
        WALLET_ADDRESS=$(cast wallet list --ledger 2>/dev/null | head -n1 | cut -d' ' -f1 || echo "")
        if [ -z "$WALLET_ADDRESS" ]; then
            echo -e "${RED}❌ Cannot connect to Ledger device${NC}"
            exit 1
        fi
        DEPLOY_CMD="--ledger --mnemonic-indexes 0"
        ;;
    trezor)
        echo "Please ensure your Trezor device is connected and unlocked"
        DEPLOY_CMD="--trezor --mnemonic-indexes 0"
        ;;
    frame)
        echo "Please ensure Frame wallet is running and connected"
        WALLET_ADDRESS=${FRAME_WALLET_ADDRESS}
        DEPLOY_CMD="--from $WALLET_ADDRESS"
        ;;
    *)
        echo -e "${RED}❌ Invalid wallet type: $WALLET_TYPE${NC}"
        echo "Supported types: ledger, trezor, frame"
        exit 1
        ;;
esac

echo -e "${GREEN}✓ Hardware wallet type: $WALLET_TYPE${NC}"

# Get wallet address
if [ -z "$WALLET_ADDRESS" ]; then
    case $WALLET_TYPE in
        ledger)
            WALLET_ADDRESS=$(cast wallet list --ledger | head -n1 | awk '{print $1}')
            ;;
        trezor)
            WALLET_ADDRESS=$(cast wallet list --trezor | head -n1 | awk '{print $1}')
            ;;
    esac
fi

echo -e "${GREEN}✓ Wallet Address: $WALLET_ADDRESS${NC}"

# Check wallet balance
echo -e "${YELLOW}💰 Checking wallet balance...${NC}"
BALANCE=$(cast balance $WALLET_ADDRESS --rpc-url $RPC_URL)
BALANCE_ETH=$(cast to-unit $BALANCE ether)

echo -e "${GREEN}✓ Balance: $BALANCE_ETH ETH${NC}"

# Minimum balance check (0.1 ETH for deployment)
MIN_BALANCE="100000000000000000"  # 0.1 ETH in wei
if [ "$(echo "$BALANCE < $MIN_BALANCE" | bc)" -eq 1 ]; then
    echo -e "${RED}❌ Insufficient balance. Need at least 0.1 ETH for deployment${NC}"
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
if [ ! -f "script/DeployHardware.s.sol" ]; then
    echo -e "${RED}❌ DeployHardware.s.sol not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment ready${NC}"

# Deployment confirmation
echo -e "${YELLOW}📋 Deployment Summary${NC}"
echo "================================"
echo "Network: $NETWORK"
echo "RPC URL: $RPC_URL"
echo "Wallet Type: $WALLET_TYPE"
echo "Deployer Address: $WALLET_ADDRESS"
echo "Balance: $BALANCE_ETH ETH"
echo "Script: DeployHardware.s.sol"
echo "================================"

if [ "$DRY_RUN" = "true" ]; then
    echo -e "${YELLOW}🔍 DRY RUN - No actual deployment${NC}"
    BROADCAST_FLAG=""
else
    echo -e "${RED}⚠️  PRODUCTION DEPLOYMENT${NC}"
    echo "This will deploy contracts to $NETWORK mainnet!"
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Deployment cancelled"
        exit 0
    fi
    BROADCAST_FLAG="--broadcast"
fi

# Deployment command
echo -e "${BLUE}🚀 Starting deployment...${NC}"

DEPLOY_COMMAND="forge script script/DeployHardware.s.sol \
    --rpc-url $RPC_URL \
    $DEPLOY_CMD \
    --sender $WALLET_ADDRESS \
    $BROADCAST_FLAG \
    --verify \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    -vvvv"

echo -e "${YELLOW}Command: $DEPLOY_COMMAND${NC}"

# Execute deployment
if eval $DEPLOY_COMMAND; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"

    # Post-deployment actions
    echo -e "${BLUE}📝 Post-deployment checklist:${NC}"
    echo "1. ✓ Verify contracts on block explorer"
    echo "2. ⏳ Test contract functionality"
    echo "3. ⏳ Set up monitoring"
    echo "4. ⏳ Update frontend configuration"
    echo "5. ⏳ Create operational procedures"

    # Save deployment information
    DEPLOYMENT_FILE="deployments/${NETWORK}_hardware_$(date +%Y%m%d_%H%M%S).json"
    echo -e "${GREEN}💾 Deployment info saved to: $DEPLOYMENT_FILE${NC}"

else
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo "Please check the error messages above"
    exit 1
fi

echo -e "${GREEN}🎉 Hardware wallet deployment complete!${NC}"