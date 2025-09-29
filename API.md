# Token Factory API 文档

Token Factory 智能合约和前端集成的完整 API 参考文档。

## 📋 目录

- [智能合约 API](#智能合约-api)
  - [TokenFactory 合约](#tokenfactory-合约)
  - [ERC20Template 合约](#erc20template-合约)
- [网络配置](#网络配置)
- [错误处理](#错误处理)

## 🔗 智能合约 API

### TokenFactory 合约

**合约地址**: 请查看 [deployments](./contracts/deployments/) 获取具体网络的合约地址

#### 核心功能

##### createToken
创建具有指定配置的新 ERC20 代币。

```solidity
function createToken(TokenConfig calldata config)
    external
    payable
    returns (address tokenAddress)
```

**参数:**
- `config` (TokenConfig): 代币配置结构体

**TokenConfig 结构体:**
```solidity
struct TokenConfig {
    string name;           // 代币名称 (最大50字符)
    string symbol;         // 代币符号 (最大10字符)
    uint256 totalSupply;   // 初始供应量 (wei单位)
    uint8 decimals;        // 小数位数 (最大18)
    address initialOwner;  // 初始所有者地址
    bool mintable;         // 启用铸造功能
    bool burnable;         // 启用销毁功能
    bool pausable;         // 启用暂停功能
    bool capped;           // 启用供应量上限
    uint256 maxSupply;     // 最大供应量 (如果启用上限，0表示未启用)
}
```

**返回值:**
- `tokenAddress` (address): 部署的代币合约地址

**错误类型:**
- `InvalidConfiguration()`: 配置参数无效
- `InsufficientServiceFee()`: 服务费用不足
- `SymbolAlreadyExists()`: 代币符号已存在
- `TemplateNotFound()`: 模板未找到

**事件:**
```solidity
event TokenCreated(
    address indexed tokenAddress,
    address indexed creator,
    string name,
    string symbol,
    uint256 totalSupply,
    uint8 decimals,
    bytes32 indexed configHash
);
```

**使用示例:**
```javascript
const config = {
    name: "我的代币",
    symbol: "MT",
    totalSupply: ethers.parseEther("1000000"),
    decimals: 18,
    initialOwner: userAddress,
    mintable: true,
    burnable: false,
    pausable: false,
    capped: false,
    maxSupply: 0
};

const tx = await tokenFactory.createToken(config, {
    value: await tokenFactory.getServiceFee()
});
```

##### predictTokenAddress
预测指定配置的代币部署地址（CREATE2）。

```solidity
function predictTokenAddress(TokenConfig calldata config, address creator)
    external
    view
    returns (address)
```

**参数:**
- `config` (TokenConfig): 代币配置
- `creator` (address): 创建者地址

**返回值:**
- `address`: 预测的部署地址

**使用示例:**
```javascript
const predictedAddress = await tokenFactory.predictTokenAddress(config, userAddress);
console.log("预测地址:", predictedAddress);
```

##### 模板管理

###### addTemplate
添加或更新代币模板（仅所有者）。

```solidity
function addTemplate(bytes32 templateId, address implementation) external
```

**参数:**
- `templateId` (bytes32): 唯一模板标识符
- `implementation` (address): 模板合约地址

**模板常量:**
```solidity
bytes32 public constant BASIC_ERC20 = keccak256("BASIC_ERC20");
bytes32 public constant MINTABLE_ERC20 = keccak256("MINTABLE_ERC20");
bytes32 public constant FULL_FEATURED = keccak256("FULL_FEATURED");
```

**事件:**
```solidity
event TemplateUpdated(bytes32 indexed templateId, address implementation);
event TemplateAdded(bytes32 indexed templateId, address implementation);
```

###### removeTemplate
移除代币模板（仅所有者）。

```solidity
function removeTemplate(bytes32 templateId) external
```

###### getTemplate
获取模板实现地址。

```solidity
function getTemplate(bytes32 templateId) external view returns (address)
```

###### getAllTemplates
获取所有可用模板ID。

```solidity
function getAllTemplates() external view returns (bytes32[] memory)
```

##### 配置管理

###### setServiceFee
更新服务费用（仅所有者）。

```solidity
function setServiceFee(uint256 newFee) external
```

**参数:**
- `newFee` (uint256): 新的费用金额（wei）

**事件:**
```solidity
event ServiceFeeUpdated(uint256 newFee, address feeRecipient);
```

###### setFeeRecipient
更新费用接收者（仅所有者）。

```solidity
function setFeeRecipient(address newRecipient) external
```

**事件:**
```solidity
event FeeRecipientUpdated(address indexed newRecipient);
```

###### pause
暂停工厂合约（仅所有者）。

```solidity
function pause() external
```

###### unpause
恢复工厂合约（仅所有者）。

```solidity
function unpause() external
```

###### withdrawFees
紧急提取累积费用（仅所有者）。

```solidity
function withdrawFees() external
```

##### 查询功能

###### getServiceFee
获取当前服务费用。

```solidity
function getServiceFee() external view returns (uint256)
```

###### getFeeRecipient
获取费用接收者地址。

```solidity
function getFeeRecipient() external view returns (address)
```

###### getTokensByCreator
获取指定地址创建的代币列表。

```solidity
function getTokensByCreator(address creator) external view returns (address[] memory)
```

###### isTokenDeployed
检查代币符号是否已被部署。

```solidity
function isTokenDeployed(string calldata symbol) external view returns (bool)
```

###### calculateDeploymentCost
估算配置的部署成本。

```solidity
function calculateDeploymentCost(TokenConfig calldata config)
    external
    view
    returns (uint256 gasCost, uint256 serviceFee)
```

**返回值:**
- `gasCost` (uint256): 估算的gas成本
- `serviceFee` (uint256): 服务费用

###### validateConfiguration
验证代币配置。

```solidity
function validateConfiguration(TokenConfig calldata config)
    external
    pure
    returns (bool valid, string memory reason)
```

**返回值:**
- `valid` (bool): 配置是否有效
- `reason` (string): 无效原因（如果有）

##### 统计功能

###### getTotalTokensCreated
获取已创建代币总数。

```solidity
function getTotalTokensCreated() external view returns (uint256)
```

###### getTokensCreatedByUser
获取指定用户创建的代币数量。

```solidity
function getTokensCreatedByUser(address user) external view returns (uint256)
```

###### getTotalFeesCollected
获取工厂收集的总费用。

```solidity
function getTotalFeesCollected() external view returns (uint256)
```

##### 网络支持

###### getChainId
获取当前区块链ID。

```solidity
function getChainId() external view returns (uint256)
```

###### isChainSupported
检查链ID是否受支持。

```solidity
function isChainSupported(uint256 chainId) external pure returns (bool)
```

**支持的网络:**
- Ethereum (1)
- BSC (56)
- Polygon (137)
- Sepolia 测试网 (11155111)
- BSC 测试网 (97)
- XSC 测试网 (自定义)
- Hardhat 本地网络 (31337)

### ERC20Template 合约

标准ERC20实现，支持高级功能的代币模板。

#### 核心功能

##### 初始化
使用配置初始化代币。

```solidity
function initialize(
    string calldata tokenName,
    string calldata tokenSymbol,
    uint256 totalSupply,
    uint8 tokenDecimals,
    address tokenOwner,
    bool mintable,
    bool burnable,
    bool pausable,
    bool capped,
    uint256 maxSupply
) external
```

**事件:**
```solidity
event TokenInitialized(
    string name,
    string symbol,
    uint256 totalSupply,
    uint8 decimals,
    address owner
);
event FeatureEnabled(string feature);
```

##### 标准 ERC20 功能

```solidity
// 标准 ERC20
function balanceOf(address account) external view returns (uint256)
function totalSupply() external view returns (uint256)
function transfer(address to, uint256 amount) external returns (bool)
function approve(address spender, uint256 amount) external returns (bool)
function transferFrom(address from, address to, uint256 amount) external returns (bool)
function allowance(address owner, address spender) external view returns (uint256)

// ERC20 元数据
function name() external view returns (string memory)
function symbol() external view returns (string memory)
function decimals() external view returns (uint8)
```

##### 高级功能

###### 铸造功能（如果启用）
```solidity
function mint(address to, uint256 amount) external // 仅所有者
```

**错误:**
- `FeatureNotEnabled("mintable")`: 铸造功能未启用
- `ExceedsMaxSupply()`: 超过最大供应量
- `InvalidAmount()`: 金额无效

###### 销毁功能（如果启用）
```solidity
function burn(uint256 amount) external
function burnFrom(address account, uint256 amount) external
```

**错误:**
- `FeatureNotEnabled("burnable")`: 销毁功能未启用

###### 暂停功能（如果启用）
```solidity
function pause() external // 仅所有者
function unpause() external // 仅所有者
function paused() external view returns (bool)
```

**错误:**
- `FeatureNotEnabled("pausable")`: 暂停功能未启用
- `TokenIsPaused()`: 代币已暂停

##### 功能查询

###### 单个功能查询
```solidity
function isMintable() external view returns (bool)
function isBurnable() external view returns (bool)
function isPausable() external view returns (bool)
function isCapped() external view returns (bool)
function getMaxSupply() external view returns (uint256)
```

###### 批量功能查询
```solidity
function getFeatureFlags() external view returns (
    bool mintable,
    bool burnable,
    bool pausable,
    bool capped
)
```

**使用示例:**
```javascript
const [mintable, burnable, pausable, capped] = await token.getFeatureFlags();
console.log("功能标志:", { mintable, burnable, pausable, capped });
```

##### 状态查询

###### isInitialized
检查合约是否已初始化。

```solidity
function isInitialized() external view returns (bool)
```

###### 代理模式支持
```solidity
function getImplementation() external view returns (address)
function isProxy() external pure returns (bool)
```

## 🌍 网络配置

### 支持的网络

```typescript
interface Network {
  id: number
  name: string
  displayName: string
  rpcUrl: string
  blockExplorer: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  contracts: {
    tokenFactory: string
    basicTemplate: string
    mintableTemplate: string
    fullFeaturedTemplate: string
  }
  testnet: boolean
}

const NETWORKS: Record<number, Network> = {
  1: {
    id: 1,
    name: "ethereum",
    displayName: "以太坊主网",
    rpcUrl: "https://mainnet.infura.io/v3/PROJECT_ID",
    blockExplorer: "https://etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    contracts: {
      tokenFactory: "0x...",
      basicTemplate: "0x...",
      mintableTemplate: "0x...",
      fullFeaturedTemplate: "0x..."
    },
    testnet: false
  },
  56: {
    id: 56,
    name: "bsc",
    displayName: "币安智能链",
    rpcUrl: "https://bsc-dataseed.binance.org",
    blockExplorer: "https://bscscan.com",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    contracts: {
      tokenFactory: "0x...",
      basicTemplate: "0x...",
      mintableTemplate: "0x...",
      fullFeaturedTemplate: "0x..."
    },
    testnet: false
  },
  11155111: {
    id: 11155111,
    name: "sepolia",
    displayName: "Sepolia 测试网",
    rpcUrl: "https://sepolia.infura.io/v3/PROJECT_ID",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: { name: "Sepolia Ether", symbol: "SEP", decimals: 18 },
    contracts: {
      tokenFactory: "0x...",
      basicTemplate: "0x...",
      mintableTemplate: "0x...",
      fullFeaturedTemplate: "0x..."
    },
    testnet: true
  }
  // ... 其他网络
};
```

### 网络工具函数

```typescript
// 获取网络配置
function getNetworkConfig(chainId: number): Network | null

// 检查网络是否支持
function isSupportedNetwork(chainId: number): boolean

// 获取合约地址
function getContractAddress(chainId: number, contract: string): string

// 格式化区块浏览器URL
function getExplorerUrl(chainId: number, type: 'tx' | 'address', value: string): string

// 获取网络显示名称
function getNetworkDisplayName(chainId: number): string

// 检查是否为测试网
function isTestnet(chainId: number): boolean
```

## ⚠️ 错误处理

### 智能合约错误

```solidity
// 自定义错误
error InvalidConfiguration();
error InsufficientServiceFee();
error SymbolAlreadyExists();
error TemplateNotFound();
error ZeroAddress();
error FeatureNotEnabled(string feature);
error NotOwner();
error InvalidAmount();
error ExceedsMaxSupply();
error TokenIsPaused();
```

### 前端错误类型

```typescript
enum ErrorType {
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  NETWORK_NOT_SUPPORTED = 'NETWORK_NOT_SUPPORTED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  FEATURE_NOT_ENABLED = 'FEATURE_NOT_ENABLED',
  SYMBOL_EXISTS = 'SYMBOL_EXISTS',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND'
}

interface AppError {
  type: ErrorType
  message: string
  details?: any
  recoverable: boolean
}

// 错误处理工具
function handleError(error: unknown): AppError {
  // 错误解析和转换逻辑
  if (error.reason === "InvalidConfiguration") {
    return {
      type: ErrorType.VALIDATION_ERROR,
      message: "代币配置无效",
      recoverable: true
    };
  }

  if (error.reason === "SymbolAlreadyExists") {
    return {
      type: ErrorType.SYMBOL_EXISTS,
      message: "代币符号已存在",
      recoverable: true
    };
  }

  // ... 其他错误处理
}
```

### 常见错误场景

#### 钱包连接错误
```typescript
// 未连接钱包
if (!isConnected) {
  throw new AppError({
    type: ErrorType.WALLET_NOT_CONNECTED,
    message: "请连接您的钱包",
    recoverable: true
  });
}

// 网络不支持
if (!isSupportedNetwork(chainId)) {
  throw new AppError({
    type: ErrorType.NETWORK_NOT_SUPPORTED,
    message: `网络 ${chainId} 不受支持`,
    recoverable: true
  });
}
```

#### 交易错误
```typescript
// 余额不足
if (balance < requiredAmount) {
  throw new AppError({
    type: ErrorType.INSUFFICIENT_BALANCE,
    message: "余额不足以完成交易",
    recoverable: false
  });
}

// 合约错误
catch (error) {
  if (error.reason === "InsufficientServiceFee") {
    throw new AppError({
      type: ErrorType.VALIDATION_ERROR,
      message: "服务费用不足",
      details: error,
      recoverable: true
    });
  }
}
```

## 📊 响应类型

### 交易结果
```typescript
interface TransactionResult {
  hash: string
  tokenAddress?: string
  blockNumber?: number
  gasUsed?: bigint
  effectiveGasPrice?: bigint
  status: 'success' | 'failed'
  events?: Event[]
}
```

### 验证结果
```typescript
interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

interface ValidationError {
  field: string
  message: string
  code: string
}

interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}
```

### 多链结果
```typescript
interface MultiChainResult {
  deployments: Record<number, {
    status: 'success' | 'failed' | 'pending'
    tokenAddress?: string
    transactionHash?: string
    error?: Error
  }>
  totalCost: bigint
  successfulDeployments: number
  failedDeployments: number
}
```

### 代币信息
```typescript
interface TokenInfo {
  address: string
  name: string
  symbol: string
  decimals: number
  totalSupply: bigint
  maxSupply?: bigint
  owner: string
  features: {
    mintable: boolean
    burnable: boolean
    pausable: boolean
    capped: boolean
  }
  chainId: number
  createdAt: Date
  creator: string
}
```

## 🔧 限流策略

API调用限流防止滥用：

- **读取操作**: 每IP每分钟100次请求
- **写入操作**: 每钱包地址每分钟10次请求
- **部署操作**: 每钱包地址每小时5次请求

## 📝 SDK 集成

### 安装
```bash
npm install @token-factory/sdk
```

### 快速开始
```typescript
import { TokenFactory, Network } from '@token-factory/sdk';

const factory = new TokenFactory({
  network: Network.ETHEREUM_MAINNET,
  rpcUrl: 'your-rpc-url',
  privateKey: 'your-private-key' // 或使用钱包
});

// 创建代币
const config = {
  name: "我的代币",
  symbol: "MT",
  totalSupply: "1000000",
  decimals: 18,
  initialOwner: "0x...",
  mintable: true,
  burnable: false,
  pausable: false,
  capped: false,
  maxSupply: 0
};

// 预测地址
const predictedAddress = await factory.predictTokenAddress(config);
console.log('预测地址:', predictedAddress);

// 创建代币
const result = await factory.createToken(config);
console.log('代币已创建:', result.tokenAddress);
```

### 高级用法
```typescript
// 批量部署到多个网络
const multiChainFactory = new MultiChainTokenFactory([
  Network.ETHEREUM_MAINNET,
  Network.BSC_MAINNET,
  Network.POLYGON_MAINNET
]);

const results = await multiChainFactory.deployToAll(config);
console.log('多链部署结果:', results);

// 监听事件
factory.on('TokenCreated', (event) => {
  console.log('新代币创建:', event.tokenAddress);
});

// 获取统计信息
const stats = await factory.getStats();
console.log('工厂统计:', stats);
```

## 🔗 相关链接

- **GitHub**: https://github.com/your-org/token-factory
- **文档**: https://docs.token-factory.example.com
- **问题反馈**: https://github.com/your-org/token-factory/issues
- **Discord 社区**: https://discord.gg/token-factory

---

**需要帮助?** 查看我们的 [故障排除指南](./README.md#故障排除) 或在 GitHub 上创建问题。