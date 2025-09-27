# Token Creator DApp - 部署指南

完整的部署指南，从本地开发到生产环境的分步部署说明。

## 🚀 快速编译和部署命令

### 核心命令速查表

```bash
# 进入合约目录
cd contracts

# 📋 基础编译命令
forge build                    # 编译所有合约
forge build --force            # 强制重新编译
forge test                     # 运行测试
forge test -vvv                # 详细测试输出

# 🌐 本地部署
forge script script/Deploy.s.sol --broadcast --rpc-url http://localhost:8545 -vvvv

# 🧪 测试网部署
forge script script/Deploy.s.sol --broadcast --rpc-url $SEPOLIA_RPC_URL --verify --etherscan-api-key $ETHERSCAN_API_KEY -vvvv

# 🔐 硬件钱包部署 (推荐)
./scripts/deploy-hardware.sh ethereum ledger false

# 🏛️ 多签钱包部署 (企业级)
./scripts/deploy-multisig.sh ethereum 0xYourMultiSigAddress false

# 🔄 合约升级
forge script script/Upgrade.s.sol --broadcast --rpc-url $RPC_URL -vvvv

# ✅ 部署验证
cast call $FACTORY_ADDRESS "owner()" --rpc-url $RPC_URL
```

### OpenZeppelin兼容性说明

本项目已针对OpenZeppelin v4.9+进行完全优化：
- ✅ 所有合约继承OpenZeppelin标准实现
- ✅ 完美兼容UUPS代理升级模式
- ✅ 修复所有interface冲突问题
- ✅ 遵循OpenZeppelin安全最佳实践

## 📋 部署概览

### 部署架构
```
本地开发 → 测试网部署 → 预发布验证 → 生产环境
    ↓           ↓            ↓           ↓
  Anvil    Sepolia/BSC   Staging   Mainnet/Production
```

### 环境要求
- Node.js 18+
- Foundry (智能合约)
- Git
- 支持Web3的浏览器

## 🏠 本地环境部署

### 1. 项目设置

```bash
# 克隆项目
git clone https://github.com/your-org/token-factory.git
cd token-factory

# 安装依赖
npm run install:all

# 或者分别安装
cd contracts && npm install
cd ../frontend && npm install
```

### 2. 环境配置

**智能合约环境** (`contracts/.env`)：
```bash
# 复制环境文件
cp contracts/.env.example contracts/.env

# 编辑配置
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL=http://localhost:8545
```

**前端环境** (`frontend/.env.local`)：
```bash
# 复制环境文件
cp frontend/.env.example frontend/.env.local

# 编辑配置
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337
```

### 3. 启动本地环境

**终端 1 - 启动区块链**：
```bash
cd contracts
anvil --port 8545 --host 0.0.0.0
```

**终端 2 - 编译和部署智能合约**：
```bash
cd contracts

# 1. 编译合约 (检查语法和依赖)
forge build

# 2. 运行单元测试 (可选)
forge test

# 3. 部署到本地网络
forge script script/Deploy.s.sol --broadcast --rpc-url http://localhost:8545 -vvvv
```

**终端 3 - 启动前端**：
```bash
cd frontend
npm run dev
```

### 4. 验证本地部署

1. 访问 `http://localhost:3000`
2. 连接MetaMask到本地网络：
   - 网络名称: Localhost
   - RPC URL: http://localhost:8545
   - Chain ID: 31337
   - 货币符号: ETH
3. 导入测试账户：
   ```
   私钥: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   地址: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   ```

## 🧪 测试网部署

### 1. 准备测试网账户

**获取测试代币**：
- Sepolia ETH: https://sepoliafaucet.com/
- BSC Testnet BNB: https://testnet.binance.org/faucet-smart
- XSC Testnet: 联系XSC团队

### 2. 配置测试网环境

**智能合约配置** (`contracts/.env`)：
```bash
# 主账户私钥 (确保有足够测试代币)
PRIVATE_KEY=your_testnet_private_key

# RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
XSC_TESTNET_RPC_URL=https://testnet-rpc.xsc.network

# 区块浏览器API密钥 (用于合约验证)
ETHERSCAN_API_KEY=your_etherscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key
```

### 3. 部署到测试网

**部署到Sepolia**：
```bash
cd contracts

# 1. 编译合约
forge build

# 2. 部署并验证
forge script script/Deploy.s.sol \
  --broadcast \
  --rpc-url $SEPOLIA_RPC_URL \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

**部署到BSC测试网**：
```bash
# 1. 编译合约
forge build

# 2. 部署并验证
forge script script/Deploy.s.sol \
  --broadcast \
  --rpc-url $BSC_TESTNET_RPC_URL \
  --verify \
  --etherscan-api-key $BSCSCAN_API_KEY \
  -vvvv
```

**部署到XSC测试网**：
```bash
# 1. 编译合约
forge build

# 2. 部署 (XSC暂不支持自动验证)
forge script script/Deploy.s.sol \
  --broadcast \
  --rpc-url $XSC_TESTNET_RPC_URL \
  -vvvv
```

### 4. 记录部署信息

部署成功后，记录合约地址到 `frontend/src/lib/networks.ts`：

```typescript
export const DEPLOYED_CONTRACTS = {
  // Testnets
  11155111: { // Sepolia
    tokenFactory: "0x742d35Cc6634C0532925a3b8D4Ed6C7646C7F11C"
  },
  97: { // BSC Testnet
    tokenFactory: "0x742d35Cc6634C0532925a3b8D4Ed6C7646C7F11D"
  },
  // XSC Testnet
  31338: {
    tokenFactory: "0x742d35Cc6634C0532925a3b8D4Ed6C7646C7F11E"
  }
}
```

## 🌐 前端部署

### 1. Vercel部署 (推荐)

**准备工作**：
1. 在 [Vercel](https://vercel.com) 创建账户
2. 连接GitHub仓库

**部署配置**：
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录
vercel login

# 在frontend目录部署
cd frontend
vercel

# 生产部署
vercel --prod
```

**环境变量配置** (在Vercel面板设置)：
```bash
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_INFURA_PROJECT_ID=your_infura_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_key
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

### 2. Netlify部署

**构建配置** (`frontend/netlify.toml`)：
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. Docker部署

**构建镜像**：
```bash
cd frontend

# 构建镜像
docker build -t token-factory:latest .

# 运行容器
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_ENVIRONMENT=production \
  -e NEXT_PUBLIC_RPC_URL=your_rpc_url \
  token-factory:latest
```

**Docker Compose** (`docker-compose.yml`)：
```yaml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_ENVIRONMENT=production
      - NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
    restart: unless-stopped
```

## 🚀 生产环境部署

### 1. 主网合约部署

**重要提醒**：
⚠️ **主网部署前必须完成**：
- 完整的安全审计
- 测试网充分验证
- Gas费用准备充足
- 备份所有私钥

**生产环境编译和部署命令**：

```bash
cd contracts

# 1. 编译合约 (确保没有错误)
forge build

# 2. 运行完整测试套件
forge test -vvv

# 3. 设置生产环境变量
export MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
export ETHERSCAN_API_KEY=your_etherscan_api_key
export NETWORK=ethereum

# 4. 选择部署方式:
```

**方式1: 私钥部署 (仅用于测试)**：
```bash
export PRIVATE_KEY=your_mainnet_private_key

forge script script/Deploy.s.sol \
  --broadcast \
  --rpc-url $MAINNET_RPC_URL \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --gas-estimate-multiplier 120 \
  -vvvv
```

**方式2: 硬件钱包部署 (推荐)**：
```bash
# Ledger钱包部署
./scripts/deploy-hardware.sh ethereum ledger false

# Trezor钱包部署
./scripts/deploy-hardware.sh ethereum trezor false

# Frame钱包部署
export FRAME_WALLET_ADDRESS=your_frame_address
./scripts/deploy-hardware.sh ethereum frame false
```

**方式3: 多签钱包部署 (企业级)**：
```bash
# 配置多签参数
export EXISTING_MULTISIG=0xYourMultiSigAddress
export MULTISIG_THRESHOLD=2

./scripts/deploy-multisig.sh ethereum $EXISTING_MULTISIG false
```

**部署到BSC主网**：
```bash
export BSC_RPC_URL=https://bsc-dataseed.binance.org/
export BSCSCAN_API_KEY=your_bscscan_api_key

forge script script/Deploy.s.sol \
  --broadcast \
  --rpc-url $BSC_RPC_URL \
  --verify \
  --etherscan-api-key $BSCSCAN_API_KEY
```

### 2. 生产前端部署

**更新配置** (`frontend/.env.production`)：
```bash
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_INFURA_PROJECT_ID=your_production_infura_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_key
NEXT_PUBLIC_ANALYTICS_ID=your_production_analytics_id
```

**构建和部署**：
```bash
cd frontend

# 生产构建
npm run build

# 部署到Vercel
vercel --prod

# 或部署到其他平台
npm run start
```

## 🔄 CI/CD自动化部署

### 1. GitHub Actions设置

项目已包含完整的CI/CD配置 (`.github/workflows/`):

- `ci.yml`: 持续集成
- `security.yml`: 安全扫描
- `release.yml`: 发布自动化

### 2. 配置Secrets

在GitHub仓库设置中添加以下Secrets：

**智能合约相关**：
```
MAINNET_PRIVATE_KEY=your_mainnet_private_key
SEPOLIA_RPC_URL=your_sepolia_rpc_url
BSC_TESTNET_RPC_URL=your_bsc_testnet_rpc_url
MAINNET_RPC_URL=your_mainnet_rpc_url
BSC_MAINNET_RPC_URL=your_bsc_mainnet_rpc_url
ETHERSCAN_API_KEY=your_etherscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key
```

**前端部署相关**：
```
VERCEL_TOKEN=your_vercel_token
VERCEL_PROJECT_ID=your_project_id
VERCEL_ORG_ID=your_org_id
```

**通知相关**：
```
SLACK_WEBHOOK=your_slack_webhook_url
SECURITY_SLACK_WEBHOOK=your_security_webhook_url
```

### 3. 自动部署流程

**测试网自动部署** (develop分支)：
1. 推送到develop分支
2. 自动运行测试
3. 部署到测试网
4. 发送部署通知

**生产部署** (main分支)：
1. 推送到main分支
2. 完整测试和安全扫描
3. 部署到主网
4. 创建GitHub Release
5. 发送部署通知

## 📊 部署后验证

### 1. 智能合约验证

**检查合约状态**：
```bash
# 使用cast工具验证
cast call $FACTORY_ADDRESS "getTotalTokensCreated()" --rpc-url $RPC_URL

# 检查服务费
cast call $FACTORY_ADDRESS "getServiceFee()" --rpc-url $RPC_URL

# 验证模板
cast call $FACTORY_ADDRESS "getTemplate(bytes32)" $TEMPLATE_ID --rpc-url $RPC_URL
```

**在区块浏览器验证**：
1. 访问 Etherscan/BscScan
2. 搜索合约地址
3. 确认合约已验证
4. 检查合约交互记录

### 2. 前端功能验证

**基本功能检查**：
- [ ] 钱包连接正常
- [ ] 网络切换功能
- [ ] 代币创建流程
- [ ] 交易监控功能
- [ ] 代币管理功能

**性能检查**：
```bash
# 使用Lighthouse检查
npx lighthouse https://your-domain.com --output html

# 检查加载时间
curl -w "@curl-format.txt" -o /dev/null https://your-domain.com
```

### 3. 集成测试

创建一个测试代币验证完整流程：

```javascript
// 测试脚本示例
const testDeployment = async () => {
  // 1. 连接钱包
  // 2. 创建测试代币
  // 3. 验证代币功能
  // 4. 测试高级功能
  // 5. 检查事件日志
}
```

## 🔧 故障排除

### 常见部署问题

**1. 编译错误解决方案**

```bash
# 清理编译缓存
forge clean

# 重新安装依赖
forge install

# 强制重新编译
forge build --force

# 常见编译错误修复:
```

**Interface冲突错误**：
```
Error: Multiple definitions of 'OwnershipTransferred'
解决方案: 已修复 - 使用OpenZeppelin标准事件，移除自定义重复定义
```

**函数Override错误**：
```
Error: Function needs to specify overridden contracts
解决方案: 已修复 - 添加正确的override(ContractName)声明
```

**参数Shadowing警告**：
```
Warning: This declaration shadows an existing declaration
解决方案: 已修复 - 重命名参数避免与函数名冲突
```

**2. 合约部署失败**
```bash
# 检查余额
cast balance $YOUR_ADDRESS --rpc-url $RPC_URL

# 检查gas价格
cast gas-price --rpc-url $RPC_URL

# 增加gas limit
forge script script/Deploy.s.sol --broadcast --gas-limit 3000000
```

**2. 前端构建失败**
```bash
# 清除缓存
rm -rf .next node_modules package-lock.json
npm install
npm run build

# 检查环境变量
echo $NEXT_PUBLIC_ENVIRONMENT
```

**3. 网络连接问题**
```bash
# 测试RPC连接
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  $RPC_URL
```

### 回滚程序

**智能合约回滚**：
```bash
# 使用UUPS升级功能
forge script script/Rollback.s.sol --broadcast --rpc-url $RPC_URL
```

**前端回滚**：
```bash
# Vercel回滚到上个版本
vercel rollback

# 或指定版本
vercel rollback [deployment-url]
```

## 🚨 安全注意事项

### 部署安全检查清单

**部署前检查**：
- [ ] 私钥安全存储 (硬件钱包推荐)
- [ ] RPC URLs使用HTTPS
- [ ] API密钥权限最小化
- [ ] 环境变量正确配置
- [ ] 合约代码最终审查
- [ ] 测试网充分验证

**部署后检查**：
- [ ] 合约ownership正确设置
- [ ] 升级权限合理配置
- [ ] 服务费设置合理
- [ ] 模板权限正确
- [ ] 前端HTTPS配置
- [ ] CSP和CORS正确配置

### 监控和维护

**设置监控**：
```bash
# 合约事件监控
cast logs --address $FACTORY_ADDRESS --rpc-url $RPC_URL

# 前端性能监控 (使用Analytics)
# 错误日志监控 (使用Sentry)
```

## 📞 获取帮助

### 支持渠道

**技术支持**：
- GitHub Issues: 技术问题和bug报告
- Discord社区: 实时讨论和帮助
- 邮件支持: 紧急问题联系

**文档资源**：
- [用户指南](./USER_GUIDE.md)
- [API文档](./API.md)
- [故障排除指南](./TROUBLESHOOTING.md)

### 紧急联系

**生产问题**：
- 紧急邮箱: emergency@your-domain.com
- 值班电话: +1-XXX-XXX-XXXX
- Slack频道: #emergency-support

---

## 📝 部署检查清单

### 编译前检查
- [ ] 确保Foundry已安装: `forge --version`
- [ ] 检查Solidity版本兼容性 (0.8.21)
- [ ] 验证OpenZeppelin依赖已安装
- [ ] 清理旧的编译缓存: `forge clean`

### 编译验证
- [ ] 成功编译: `forge build` (无错误)
- [ ] 单元测试通过: `forge test -vvv`
- [ ] 合约大小检查: `forge build --sizes`
- [ ] Gas优化检查: `forge test --gas-report`

### 部署前准备
- [ ] 环境变量配置正确
- [ ] RPC URL连接测试通过
- [ ] 部署账户余额充足 (>0.1 ETH)
- [ ] API密钥有效 (Etherscan/BSCScan)

### 部署执行
- [ ] 选择正确的部署脚本
- [ ] 使用适当的安全方式 (硬件钱包/多签)
- [ ] 记录所有交易哈希和地址
- [ ] 验证合约源码

### 部署后验证
- [ ] 合约Owner设置正确
- [ ] 所有函数调用正常
- [ ] 事件日志记录正确
- [ ] 前端集成测试通过
- [ ] 监控和告警设置完成

---

**🎉 部署成功！您的Token Creator DApp现在可以为用户提供服务了！🎉**

**重要提醒**:
- 🔐 本项目完全基于OpenZeppelin标准，确保最高安全性
- 🛡️ 支持硬件钱包和多签钱包部署，满足企业级安全需求
- ⚡ 所有编译错误已修复，可直接进行生产部署
- 📊 定期更新和监控系统状态，确保为用户提供最佳体验