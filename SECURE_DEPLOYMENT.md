# 🔐 安全部署指南 - 硬件钱包与多签钱包

Token Factory项目的安全生产部署指南，支持硬件钱包和多签钱包部署方案。

## 📋 部署方案对比

| 特性 | 私钥部署 | 硬件钱包部署 | 多签钱包部署 |
|------|----------|--------------|--------------|
| **安全等级** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **操作复杂度** | 简单 | 中等 | 复杂 |
| **私钥暴露风险** | 高 | 无 | 无 |
| **单点故障风险** | 高 | 中 | 低 |
| **适用场景** | 测试/开发 | 小团队生产 | 企业级生产 |
| **成本** | 免费 | ~$100 | ~$0-500 |

## 🔐 硬件钱包部署方案

### 支持的硬件钱包
- **Ledger Nano S/X/S Plus** ✅ 推荐
- **Trezor One/Model T** ✅ 推荐
- **Frame Desktop Wallet** ✅ 软件钱包选项

### 1. Ledger钱包部署

#### 准备工作
```bash
# 1. 确保Ledger设备已设置
# 2. 安装Ethereum应用程序
# 3. 启用"Contract data"设置
# 4. 连接到电脑并解锁

# 5. 检查连接
cast wallet list --ledger
```

#### 部署步骤
```bash
# 1. 配置环境变量
export MAINNET_RPC_URL="https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY"
export ETHERSCAN_API_KEY="your_etherscan_api_key"

# 2. 使用硬件钱包部署脚本
./scripts/deploy-hardware.sh ethereum ledger

# 3. 在Ledger设备上确认所有交易
```

#### 详细命令
```bash
# 测试网部署 (推荐先测试)
./scripts/deploy-hardware.sh sepolia ledger true  # DRY RUN
./scripts/deploy-hardware.sh sepolia ledger false # 实际部署

# 生产环境部署
./scripts/deploy-hardware.sh ethereum ledger false
```

### 2. Trezor钱包部署

```bash
# Trezor部署命令
./scripts/deploy-hardware.sh ethereum trezor false
```

### 3. Frame钱包部署

```bash
# 1. 启动Frame桌面应用
# 2. 连接硬件钱包或热钱包
export FRAME_WALLET_ADDRESS="your_frame_wallet_address"

# 3. 使用Frame部署
./scripts/deploy-hardware.sh ethereum frame false
```

## 🏛️ 多签钱包部署方案

### Gnosis Safe多签钱包

#### 1. 创建多签钱包

**选项A: 通过Web界面创建**
```bash
# 1. 访问 https://app.safe.global/
# 2. 选择对应网络 (Ethereum, BSC等)
# 3. 点击 "Create new Safe"
# 4. 添加所有者地址
# 5. 设置签名阈值 (建议2/3或3/5)
# 6. 部署钱包
```

**选项B: 通过脚本配置**
```bash
# 1. 配置多签环境
cp contracts/.env.multisig.example contracts/.env.multisig

# 2. 编辑配置文件
vim contracts/.env.multisig
```

#### 2. 多签钱包配置示例

```bash
# .env.multisig 配置
EXISTING_MULTISIG=0x1234...  # 已创建的多签钱包地址
MULTISIG_OWNERS=0xowner1,0xowner2,0xowner3  # 所有者地址
MULTISIG_THRESHOLD=2  # 签名阈值
NETWORK=ethereum
```

#### 3. 多签部署流程

```bash
# 1. 部署合约 (所有权转移到多签钱包)
./scripts/deploy-multisig.sh ethereum 0xYourMultiSigAddress false

# 2. 检查生成的交易数据
cat contracts/multisig_transactions/add_template.txt

# 3. 在Gnosis Safe中创建交易
# - 访问 https://app.safe.global/
# - 连接到多签钱包
# - 创建新交易
# - 使用生成的交易数据

# 4. 获取其他所有者签名并执行
```

## 📊 安全最佳实践

### 硬件钱包安全
```bash
# ✅ 推荐做法
- 使用官方硬件钱包
- 启用PIN码和密码短语
- 验证设备固件是最新版本
- 备份助记词在安全位置
- 在设备上确认所有交易细节

# ❌ 避免做法
- 从非官方渠道购买设备
- 在公共电脑上使用硬件钱包
- 忽视设备上的交易确认
- 将助记词存储在数字设备上
```

### 多签钱包安全
```bash
# ✅ 推荐配置
- 至少3个所有者，2/3或3/5阈值
- 所有者使用硬件钱包
- 定期轮换所有者密钥
- 设置适当的执行延迟

# ❌ 避免配置
- 1/1或1/2的低安全阈值
- 所有者使用相同类型的钱包
- 所有所有者在同一物理位置
- 无备份所有者计划
```

## 🔧 部署后验证

### 1. 合约验证清单
```bash
# 检查合约所有权
cast call $FACTORY_ADDRESS "owner()" --rpc-url $RPC_URL

# 验证服务费设置
cast call $FACTORY_ADDRESS "getServiceFee()" --rpc-url $RPC_URL

# 检查模板配置
cast call $FACTORY_ADDRESS "getTemplate(bytes32)" $TEMPLATE_ID --rpc-url $RPC_URL

# 验证代理实现
cast call $FACTORY_ADDRESS "implementation()" --rpc-url $RPC_URL
```

### 2. 功能测试
```bash
# 创建测试代币 (需要多签批准)
# 1. 准备交易数据
# 2. 在多签钱包中创建交易
# 3. 获取必要签名
# 4. 执行交易
# 5. 验证代币创建成功
```

### 3. 监控设置
```bash
# 合约事件监控
cast logs --address $FACTORY_ADDRESS --rpc-url $RPC_URL

# 设置监控警报
# - 合约所有权变更
# - 服务费变更
# - 大额交易
# - 异常活动
```

## 🚨 应急响应

### 硬件钱包丢失/损坏
```bash
# 1. 准备备份助记词
# 2. 获取新硬件钱包
# 3. 恢复钱包
# 4. 验证地址正确性
# 5. 测试小额交易
# 6. 转移合约所有权 (如需要)
```

### 多签钱包所有者变更
```bash
# 1. 在Safe中提议移除/添加所有者
# 2. 获得当前阈值数量的签名
# 3. 执行所有者变更交易
# 4. 验证新配置
# 5. 更新内部文档
```

### 合约暂停/升级
```bash
# 如果发现安全问题:
# 1. 使用pausable功能暂停合约 (如果实现)
# 2. 通过UUPS代理升级合约
# 3. 部署修复版本
# 4. 获得多签批准
# 5. 执行升级交易
```

## 📞 支持联系

### 技术支持
- **GitHub Issues**: 技术问题和bug报告
- **Discord社区**: 实时讨论和帮助
- **邮件支持**: 紧急问题联系

### 硬件钱包支持
- **Ledger**: https://support.ledger.com/
- **Trezor**: https://trezor.io/support/
- **Frame**: https://frame.sh/

### 多签钱包支持
- **Gnosis Safe**: https://help.safe.global/
- **Safe社区**: https://forum.safe.global/

---

## ⚠️ 重要提醒

1. **测试优先**: 在测试网充分测试后再部署主网
2. **备份准备**: 确保所有私钥和助记词已安全备份
3. **权限管理**: 部署后立即验证权限和所有权设置
4. **监控设置**: 设置合约活动监控和异常报警
5. **应急计划**: 制定详细的应急响应计划

**🔐 安全是第一要务 - 切勿急于部署生产环境！**