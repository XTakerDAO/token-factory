#!/bin/bash

XSC_RPC="https://datarpc1.xsc.pub/"
FACTORY="0x6E76D047806B2c7df2a0f0c09B854761CdFB83F6"

echo "=== TokenFactory View Methods Test ==="

echo "1. Service Fee:"
cast call $FACTORY "getServiceFee()" --rpc-url $XSC_RPC

echo "2. Fee Recipient:"
cast call $FACTORY "getFeeRecipient()" --rpc-url $XSC_RPC

echo "3. Chain ID:"
cast call $FACTORY "getChainId()" --rpc-url $XSC_RPC

echo "4. Chain Support (520):"
cast call $FACTORY "isChainSupported(uint256)" 520 --rpc-url $XSC_RPC

echo "5. All Templates:"
cast call $FACTORY "getAllTemplates()" --rpc-url $XSC_RPC

echo "6. Total Tokens Created:"
cast call $FACTORY "getTotalTokensCreated()" --rpc-url $XSC_RPC

echo "7. Total Fees Collected:"
cast call $FACTORY "getTotalFeesCollected()" --rpc-url $XSC_RPC

echo "=== Test Complete ==="

