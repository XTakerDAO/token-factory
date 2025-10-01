# TokenFactory ABI 文件

这个目录包含了已部署到 XSC 主网的所有合约的 ABI 文件。

## 文件说明

### 核心合约
- **TokenFactory.json** - 主工厂合约 ABI
  - 合约地址: `0x022EC0B5f83Bf885dbbE74C02Cd3Fe77E2F379C6`
  - 用于创建和管理 ERC20 代币

### ERC20 模板合约
- **BasicERC20Template.json** - 基础 ERC20 模板 ABI
  - 合约地址: `0x79C9A3e1DE51F6a06dFE097Eee1F202F133C02E1`
  - 基础 ERC20 功能

- **MintableERC20Template.json** - 可铸造 ERC20 模板 ABI
  - 合约地址: `0xFF61527Bd80f286cC6DE8D36205aFda043Cb1e1b`
  - 支持铸造功能

- **ERC20Template.json** - 全功能 ERC20 模板 ABI
  - 合约地址: `0x248eCE8f6aC5997C66e7D6439659F464634fDa2a`
  - 支持铸造、销毁、暂停等完整功能

## 网络信息
- **网络**: XSC 主网
- **Chain ID**: 520
- **RPC URL**: https://datarpc1.xsc.pub/
- **区块浏览器**: https://explorer.xsc.pub/

## 使用示例

### Web3.js 示例
```javascript
const Web3 = require('web3');
const fs = require('fs');

const web3 = new Web3('https://datarpc1.xsc.pub/');
const factoryABI = JSON.parse(fs.readFileSync('./TokenFactory.json', 'utf8'));
const factory = new web3.eth.Contract(factoryABI, '0x022EC0B5f83Bf885dbbE74C02Cd3Fe77E2F379C6');

// 获取所有模板
const templates = await factory.methods.getAllTemplates().call();
```

### Ethers.js 示例
```javascript
const { ethers } = require('ethers');
const fs = require('fs');

const provider = new ethers.providers.JsonRpcProvider('https://datarpc1.xsc.pub/');
const factoryABI = JSON.parse(fs.readFileSync('./TokenFactory.json', 'utf8'));
const factory = new ethers.Contract('0x022EC0B5f83Bf885dbbE74C02Cd3Fe77E2F379C6', factoryABI, provider);

// 获取服务费
const fee = await factory.getServiceFee();
```

### Cast 命令示例
```bash
# 查看所有模板
cast call 0x022EC0B5f83Bf885dbbE74C02Cd3Fe77E2F379C6 "getAllTemplates()" --rpc-url https://datarpc1.xsc.pub/

# 创建基础代币
cast send 0x022EC0B5f83Bf885dbbE74C02Cd3Fe77E2F379C6 \
  "createToken(bytes32,string,string,uint256,bool,bool,bool,bool,uint256)" \
  0xce300365017af828f5354ed5ed18208fde26dbcc7edce881ddab164c5ce35e53 \
  "MyToken" "MTK" 1000000000000000000000000 false false false false 0 \
  --value 0.01ether \
  --private-key $PRIVATE_KEY \
  --rpc-url https://datarpc1.xsc.pub/ \
  --legacy
```

## 主要函数

### TokenFactory 主要函数
- `createToken()` - 创建新代币
- `getAllTemplates()` - 获取所有模板
- `getTemplate(bytes32)` - 获取指定模板地址
- `getServiceFee()` - 获取服务费
- `getFeeRecipient()` - 获取费用接收地址

### ERC20Template 主要函数
- `initialize()` - 初始化代币
- `mint(address,uint256)` - 铸造代币 (如果支持)
- `burn(uint256)` - 销毁代币 (如果支持)
- `pause()` / `unpause()` - 暂停/恢复 (如果支持)

## 注意事项
- 所有交易都需要使用 `--legacy` 模式
- 创建代币需要支付 0.01 XSC 的服务费
- 使用前请确保连接到正确的 XSC 网络