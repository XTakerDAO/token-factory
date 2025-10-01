# Deployment Scripts Guide

部署脚本使用说明和场景指南。

## 📋 脚本分类

### 🌟 主要部署脚本 (生产使用)

#### `DeployXSC.s.sol` - XSC 主网部署
**推荐用于**: XSC 链生产部署

**特点**:
- 完整的 UUPS 代理部署流程
- 三个模板合约 (Basic, Mintable, Full Featured)
- 自动配置和验证
- London EVM 兼容

**使用方法**:
```bash
forge script script/DeployXSC.s.sol \
  --broadcast \
  --rpc-url https://datarpc1.xsc.pub/ \
  --legacy \
  -vvvv
```

**注意事项**:
- 必须使用 London EVM 版本编译
- 需要配置 `evm_version = "london"` 和 `via_ir = false`

---

#### `Deploy.s.sol` - 通用部署脚本
**推荐用于**: Ethereum, BSC 等主流链

**特点**:
- 支持多链部署 (Ethereum, BSC, Sepolia 等)
- 完整的 UUPS 代理模式
- 自动合约验证
- 生产级安全配置

**使用方法**:
```bash
# Sepolia 测试网
forge script script/Deploy.s.sol \
  --broadcast \
  --rpc-url sepolia \
  --verify

# BSC 主网
forge script script/Deploy.s.sol \
  --broadcast \
  --rpc-url bsc \
  --verify
```

---

#### `Upgrade.s.sol` - 合约升级
**推荐用于**: UUPS 代理升级

**特点**:
- 安全的升级流程
- 保留代理地址和状态
- 升级前后验证
- OpenZeppelin UUPS 兼容

**使用方法**:
```bash
forge script script/Upgrade.s.sol \
  --broadcast \
  --rpc-url <RPC_URL> \
  -vvvv
```

---

### 🔧 辅助部署脚本

#### `DeploySimpleXSC.s.sol` - XSC 简化部署
**用途**: 快速测试和简单部署

**特点**:
- 简化的部署流程
- 最小配置
- 适合测试和验证

**使用场景**: 开发测试、快速验证

---

#### `DeployXSCLegacy.s.sol` - XSC 遗留部署
**用途**: 兼容旧版 XSC 网络

**特点**:
- Legacy gas 模式
- 旧版 EVM 兼容
- 特殊网络配置

**使用场景**: 旧版 XSC 网络部署（不推荐用于新部署）

---

#### `DeploySimple.s.sol` - 最小化部署
**用途**: 开发和本地测试

**特点**:
- 最简配置
- 无额外功能
- 快速部署

**使用场景**: 本地 Anvil 测试

---

### 🔐 安全部署脚本

#### `DeployHardware.s.sol` - 硬件钱包部署
**推荐用于**: 生产环境主网部署

**特点**:
- Ledger/Trezor 支持
- 私钥不暴露
- 企业级安全

**使用方法**:
```bash
# Ledger 钱包部署
forge script script/DeployHardware.s.sol \
  --ledger \
  --broadcast
```

**使用场景**: 所有生产主网部署

---

#### `DeployMultiSig.s.sol` - 多签钱包部署
**推荐用于**: 企业和 DAO 部署

**特点**:
- 多签控制
- 集体决策
- 高安全性

**使用方法**:
```bash
forge script script/DeployMultiSig.s.sol \
  --broadcast \
  --rpc-url <RPC_URL>
```

**使用场景**: 企业级部署、DAO 管理

---

### 🔍 验证脚本

#### `Verify.s.sol` - 合约验证
**用途**: 区块浏览器合约验证

**特点**:
- 自动源码验证
- 支持多个浏览器
- 构造参数验证

---

## 📊 部署脚本对比

| 脚本名称 | 推荐场景 | 安全级别 | 复杂度 | EVM 版本 |
|---------|---------|---------|--------|----------|
| DeployXSC.s.sol | XSC 主网 | ⭐⭐⭐⭐⭐ | 中 | London |
| Deploy.s.sol | 通用主网 | ⭐⭐⭐⭐⭐ | 中 | Shanghai+ |
| Upgrade.s.sol | 合约升级 | ⭐⭐⭐⭐⭐ | 中 | 任意 |
| DeployHardware.s.sol | 生产部署 | ⭐⭐⭐⭐⭐ | 高 | 任意 |
| DeployMultiSig.s.sol | 企业部署 | ⭐⭐⭐⭐⭐ | 高 | 任意 |
| DeploySimpleXSC.s.sol | XSC 测试 | ⭐⭐⭐ | 低 | London |
| DeployXSCLegacy.s.sol | XSC 遗留 | ⭐⭐⭐ | 中 | London |
| DeploySimple.s.sol | 本地测试 | ⭐⭐ | 低 | 任意 |

---

## 🎯 使用建议

### 生产部署清单

**XSC 主网**:
1. ✅ 使用 `DeployXSC.s.sol` 或 `DeployHardware.s.sol`
2. ✅ 确保 London EVM 配置
3. ✅ 使用硬件钱包或多签
4. ✅ 充分测试网验证

**以太坊/BSC 主网**:
1. ✅ 使用 `Deploy.s.sol` + 硬件钱包
2. ✅ 启用合约验证
3. ✅ 多签管理权限
4. ✅ 测试网完整验证

### 开发测试流程

1. **本地开发**: `DeploySimple.s.sol` → Anvil
2. **功能测试**: `DeployXSC.s.sol` → XSC 测试网
3. **集成测试**: `Deploy.s.sol` → Sepolia
4. **生产部署**: `DeployHardware.s.sol` → 主网

---

## 🔗 相关文档

- [部署指南](../../DEPLOYMENT.md)
- [安全部署](../../SECURE_DEPLOYMENT.md)
- [XSC 兼容性](../../CLAUDE.md#xsc-chain-compatibility)

---

## 📝 注意事项

### XSC 链部署
⚠️ **必须使用 London EVM**:
- `evm_version = "london"`
- `via_ir = false`
- Solidity 0.8.20

### 安全提醒
🔐 **生产部署**:
- 使用硬件钱包或多签
- 充分的测试网验证
- 备份所有私钥和配置
- 记录所有合约地址

### 验证要求
✅ **合约验证**:
- 准备 API 密钥
- 保存构造参数
- 验证所有模板和代理合约
