#!/bin/bash

# Token Factory Deployment Info Extractor
# 使用方法: ./save-deployment.sh [network]
# 例如: ./save-deployment.sh localhost

NETWORK=${1:-localhost}
DEPLOYMENTS_DIR="contracts/deployments"
OUTPUT_FILE="${DEPLOYMENTS_DIR}/${NETWORK}.json"

echo "🚀 Token Factory Deployment Info Extractor"
echo "Network: $NETWORK"
echo "Output: $OUTPUT_FILE"

# 确保部署目录存在
mkdir -p "$DEPLOYMENTS_DIR"

# 检查是否有部署输出文件或从用户输入获取信息
if [ -f "deployment-output.log" ]; then
    echo "📄 从 deployment-output.log 提取信息..."
    # 这里可以添加从日志文件提取信息的逻辑
else
    echo "📝 请提供部署信息："

    echo -n "Factory Address (Proxy): "
    read FACTORY_ADDRESS

    echo -n "Factory Implementation Address: "
    read FACTORY_IMPL_ADDRESS

    echo -n "ERC20Template Address: "
    read TEMPLATE_ADDRESS

    echo -n "Deployer Address: "
    read DEPLOYER_ADDRESS

    echo -n "Chain ID (default: 31337): "
    read CHAIN_ID
    CHAIN_ID=${CHAIN_ID:-31337}

    echo -n "Service Fee (default: 0): "
    read SERVICE_FEE
    SERVICE_FEE=${SERVICE_FEE:-0}
fi

# 获取当前时间戳
TIMESTAMP=$(date +%s)
BLOCK_NUMBER=0

# 创建 JSON 文件
cat > "$OUTPUT_FILE" << EOF
{
  "blockNumber": $BLOCK_NUMBER,
  "chainId": $CHAIN_ID,
  "deployer": "$DEPLOYER_ADDRESS",
  "factory": "$FACTORY_ADDRESS",
  "factoryImplementation": "$FACTORY_IMPL_ADDRESS",
  "network": "$NETWORK",
  "serviceFee": $SERVICE_FEE,
  "template": "$TEMPLATE_ADDRESS",
  "timestamp": $TIMESTAMP
}
EOF

echo "✅ 部署信息已保存到: $OUTPUT_FILE"
echo "📋 内容:"
cat "$OUTPUT_FILE"

# 验证 JSON 格式
if command -v jq &> /dev/null; then
    echo "🔍 验证 JSON 格式..."
    if jq empty "$OUTPUT_FILE" 2>/dev/null; then
        echo "✅ JSON 格式正确"
    else
        echo "❌ JSON 格式错误"
        exit 1
    fi
else
    echo "💡 提示: 安装 jq 可以验证 JSON 格式: brew install jq"
fi