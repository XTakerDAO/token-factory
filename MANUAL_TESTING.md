# Manual Testing Scenarios - Token Factory DApp

Complete manual testing checklist based on quickstart.md scenarios for comprehensive validation.

## 🧪 Testing Overview

### Test Environment Setup
- **Local Development**: Anvil + Frontend dev server
- **Staging**: Sepolia testnet + deployed frontend
- **Production**: Mainnet + production frontend

### Prerequisites
- Multiple wallets with different addresses
- Test tokens on various networks
- Different browsers for compatibility testing
- Mobile devices for responsive testing

## 📋 Testing Checklist

### ✅ Completed Tests
### ❌ Failed Tests
### ⏳ Pending Tests
### ⚠️ Issues Found

---

## 🔗 Phase 1: Wallet Connection & Network Management

### TC001: Wallet Connection Flow
**Objective**: Verify wallet connection across different providers

**Steps**:
1. Visit application homepage
2. Click "Connect Wallet" button
3. Select MetaMask from wallet options
4. Approve connection in MetaMask
5. Verify wallet address displays correctly
6. Check account balance is shown

**Expected Results**:
- ✅ Wallet connects successfully
- ✅ Address displayed in truncated format (0x1234...abcd)
- ✅ Balance shows in native currency
- ✅ Network indicator shows current network

**Test Data**:
```
Wallet: MetaMask
Address: 0x1234567890123456789012345678901234567890
Network: Ethereum Mainnet (1)
Balance: > 0.1 ETH
```

**Status**: ⏳ Pending

---

### TC002: Multi-Wallet Support
**Objective**: Test connection with different wallet providers

**Test Cases**:
1. **MetaMask Connection**
   - Steps: Connect via MetaMask browser extension
   - Expected: Seamless connection, no errors
   - Status: ⏳

2. **Coinbase Wallet Connection**
   - Steps: Connect via Coinbase Wallet
   - Expected: Connection works, proper branding shown
   - Status: ⏳

3. **WalletConnect Integration**
   - Steps: Connect via WalletConnect QR code
   - Expected: Mobile wallet connects successfully
   - Status: ⏳

**Status**: ⏳ Pending

---

### TC003: Network Switching
**Objective**: Verify network switching functionality

**Steps**:
1. Connect wallet on Ethereum mainnet
2. Click network selector dropdown
3. Select "BSC Mainnet" from list
4. Approve network switch in wallet
5. Verify UI updates to show BSC
6. Repeat for XSC Network

**Expected Results**:
- ✅ Network list shows all supported networks
- ✅ Switching prompts wallet confirmation
- ✅ UI updates reflect new network
- ✅ Contract addresses update appropriately

**Test Networks**:
- Ethereum Mainnet (1)
- BSC Mainnet (56)
- XSC Network (Custom)
- Sepolia Testnet (11155111)
- BSC Testnet (97)

**Status**: ⏳ Pending

---

## 🪙 Phase 2: Token Creation Workflow

### TC004: Basic Token Creation
**Objective**: Create simple ERC20 token with minimal features

**Steps**:
1. Navigate to "Create Token" page
2. Fill basic token information:
   - Name: "Test Token"
   - Symbol: "TEST"
   - Total Supply: "1000000"
   - Decimals: "18"
   - Owner: Current wallet address
3. Leave all advanced features disabled
4. Click "Review Configuration"
5. Verify configuration summary
6. Click "Create Token"
7. Approve transaction in wallet
8. Wait for deployment confirmation

**Expected Results**:
- ✅ Form validation works correctly
- ✅ Gas estimation shows reasonable cost
- ✅ Transaction completes successfully
- ✅ Token address is generated
- ✅ Success page shows all details
- ✅ Token appears in "My Tokens"

**Test Data**:
```json
{
  "name": "Test Token",
  "symbol": "TEST",
  "totalSupply": "1000000",
  "decimals": 18,
  "owner": "0x...",
  "mintable": false,
  "burnable": false,
  "pausable": false,
  "capped": false
}
```

**Status**: ⏳ Pending

---

### TC005: Advanced Features Token
**Objective**: Create token with all advanced features enabled

**Steps**:
1. Start token creation process
2. Fill basic information:
   - Name: "Advanced Token"
   - Symbol: "ADV"
   - Total Supply: "500000"
   - Decimals: "18"
3. Enable all advanced features:
   - ✅ Mintable
   - ✅ Burnable
   - ✅ Pausable
   - ✅ Capped (Max Supply: 2000000)
4. Verify feature descriptions show
5. Check gas estimation increases
6. Complete deployment

**Expected Results**:
- ✅ All features can be enabled
- ✅ Feature descriptions are clear
- ✅ Gas cost reflects additional features
- ✅ Max supply validation works (>= total supply)
- ✅ Token deployed with all features

**Test Data**:
```json
{
  "name": "Advanced Token",
  "symbol": "ADV",
  "totalSupply": "500000",
  "decimals": 18,
  "mintable": true,
  "burnable": true,
  "pausable": true,
  "capped": true,
  "maxSupply": "2000000"
}
```

**Status**: ⏳ Pending

---

### TC006: Form Validation
**Objective**: Test all form validation rules

**Validation Tests**:

1. **Empty Fields**
   - Input: Leave name field empty
   - Expected: "Name cannot be empty" error
   - Status: ⏳

2. **Name Too Long**
   - Input: Name with 51 characters
   - Expected: "Name too long" error
   - Status: ⏳

3. **Invalid Symbol**
   - Input: Symbol with lowercase/special chars
   - Expected: Symbol formatting guidance
   - Status: ⏳

4. **Symbol Conflict**
   - Input: Symbol that already exists
   - Expected: "Symbol already exists" error
   - Status: ⏳

5. **Invalid Supply**
   - Input: Total supply of 0
   - Expected: "Total supply must be greater than zero"
   - Status: ⏳

6. **Capped Logic**
   - Input: Max supply < total supply
   - Expected: "Max supply less than total supply"
   - Status: ⏳

**Status**: ⏳ Pending

---

### TC007: Multi-Chain Deployment
**Objective**: Deploy same token to multiple networks

**Steps**:
1. Create token on Ethereum mainnet
2. Wait for successful deployment
3. Go to "Deploy to Other Networks"
4. Select BSC and XSC networks
5. Review total costs for all networks
6. Approve each deployment
7. Monitor deployment progress
8. Verify tokens exist on all networks

**Expected Results**:
- ✅ Can select multiple networks
- ✅ Cost calculation includes all networks
- ✅ Deployments can proceed in parallel
- ✅ Status shows progress for each
- ✅ All deployments complete successfully
- ✅ Different contract addresses on each network

**Status**: ⏳ Pending

---

## 🔧 Phase 3: Token Management

### TC008: Token Administration
**Objective**: Test token management features for token owners

**Mintable Token Tests**:
1. Navigate to token management
2. Click "Mint Tokens"
3. Enter recipient address and amount
4. Approve minting transaction
5. Verify new tokens appear in recipient wallet

**Pausable Token Tests**:
1. Click "Pause Transfers" button
2. Approve pause transaction
3. Attempt token transfer (should fail)
4. Click "Unpause Transfers"
5. Retry token transfer (should succeed)

**Burnable Token Tests**:
1. Go to token holder's wallet
2. Use burn functionality
3. Verify tokens are destroyed
4. Check total supply decreases

**Expected Results**:
- ✅ Only owner can access admin functions
- ✅ Minting respects cap limits
- ✅ Pausing stops all transfers
- ✅ Burning reduces total supply
- ✅ All actions emit proper events

**Status**: ⏳ Pending

---

### TC009: Portfolio Management
**Objective**: Test "My Tokens" dashboard functionality

**Steps**:
1. Navigate to "My Tokens" page
2. Verify all created tokens are listed
3. Check token statistics are accurate
4. Test sorting and filtering options
5. Click on individual token for details
6. Test export functionality

**Expected Results**:
- ✅ All user tokens displayed
- ✅ Accurate statistics (supply, holders, etc.)
- ✅ Working sort/filter controls
- ✅ Detailed token view functional
- ✅ Export generates correct data

**Status**: ⏳ Pending

---

## 📱 Phase 4: Cross-Platform Testing

### TC010: Mobile Responsiveness
**Objective**: Verify mobile device compatibility

**Test Devices**:
1. **iPhone (Safari)**
   - Screen sizes: iPhone SE, iPhone 12, iPhone 14 Pro
   - Portrait and landscape orientations

2. **Android (Chrome)**
   - Various screen sizes and densities
   - Different Android versions

3. **Tablet Testing**
   - iPad (Safari)
   - Android tablet (Chrome)

**Test Scenarios**:
- ✅ Wallet connection works on mobile
- ✅ Forms are usable with touch input
- ✅ All buttons are appropriately sized
- ✅ Text remains readable at all sizes
- ✅ Navigation is touch-friendly

**Status**: ⏳ Pending

---

### TC011: Browser Compatibility
**Objective**: Test across different browsers

**Browsers to Test**:
1. **Chrome** (Latest + 2 versions back)
2. **Firefox** (Latest + 2 versions back)
3. **Safari** (Latest + 1 version back)
4. **Edge** (Latest version)

**Test Scenarios for Each**:
- Wallet connection functionality
- Token creation flow
- Network switching
- Performance and responsiveness

**Status**: ⏳ Pending

---

## ⚡ Phase 5: Performance Testing

### TC012: Performance Validation
**Objective**: Verify performance meets requirements

**Performance Metrics**:
1. **Page Load Times**
   - Home page: < 2 seconds
   - Create token page: < 3 seconds
   - My tokens page: < 4 seconds

2. **User Interaction Response**
   - Button clicks: < 100ms response
   - Form field updates: < 50ms
   - Network switching: < 200ms

3. **Transaction Performance**
   - Gas estimation: < 2 seconds
   - Deployment monitoring: Real-time updates

**Testing Tools**:
- Browser DevTools Performance tab
- Lighthouse performance audit
- WebPageTest.org analysis

**Status**: ⏳ Pending

---

### TC013: Stress Testing
**Objective**: Test application under high load

**Stress Scenarios**:
1. **Rapid Network Switching**
   - Switch between networks rapidly
   - Verify no race conditions occur

2. **Multiple Token Creation**
   - Create several tokens in quick succession
   - Check for memory leaks

3. **Large Token Lists**
   - Create 50+ tokens
   - Test portfolio page performance

**Status**: ⏳ Pending

---

## ♿ Phase 6: Accessibility Testing

### TC014: WCAG Compliance
**Objective**: Verify WCAG 2.1 AA compliance

**Accessibility Tests**:
1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify logical tab order
   - Test keyboard shortcuts

2. **Screen Reader Testing**
   - Test with NVDA (Windows)
   - Test with VoiceOver (macOS)
   - Verify all content is announced

3. **Color Contrast**
   - Check all text meets contrast ratios
   - Test with high contrast mode

4. **Focus Management**
   - Verify visible focus indicators
   - Test focus trapping in modals

**Tools**:
- axe-core browser extension
- Lighthouse accessibility audit
- Manual screen reader testing

**Status**: ⏳ Pending

---

## 🔒 Phase 7: Security Testing

### TC015: Security Validation
**Objective**: Verify security measures work correctly

**Security Tests**:
1. **Wallet Security**
   - Verify private keys never transmitted
   - Test session management
   - Check for XSS vulnerabilities

2. **Transaction Security**
   - Verify transaction data integrity
   - Test signature validation
   - Check for front-running protection

3. **Input Sanitization**
   - Test XSS in token names/symbols
   - Verify SQL injection protection
   - Check CSRF protection

**Status**: ⏳ Pending

---

## 🌐 Phase 8: Network-Specific Testing

### TC016: XSC Network Testing
**Objective**: Verify XSC network-specific functionality

**XSC-Specific Tests**:
1. **Pre-Shanghai EVM Compatibility**
   - Deploy contracts on XSC testnet
   - Verify all functions work correctly
   - Test gas optimization features

2. **Network Configuration**
   - Add XSC network to wallet
   - Verify RPC connectivity
   - Test explorer integration

3. **Performance Optimization**
   - Compare gas costs vs other networks
   - Verify transaction speed
   - Test network stability

**Status**: ⏳ Pending

---

## 📊 Testing Results Summary

### Test Execution Status
```
Total Test Cases: 16
✅ Completed: 0
❌ Failed: 0
⏳ Pending: 16
⚠️ Issues Found: 0

Overall Progress: 0% (0/16)
```

### Critical Path Tests
Priority 1 (Must Pass):
- [ ] TC001: Wallet Connection Flow
- [ ] TC004: Basic Token Creation
- [ ] TC005: Advanced Features Token
- [ ] TC006: Form Validation
- [ ] TC008: Token Administration

Priority 2 (Important):
- [ ] TC002: Multi-Wallet Support
- [ ] TC003: Network Switching
- [ ] TC007: Multi-Chain Deployment
- [ ] TC009: Portfolio Management

Priority 3 (Nice to Have):
- [ ] TC010: Mobile Responsiveness
- [ ] TC011: Browser Compatibility
- [ ] TC012: Performance Validation
- [ ] TC014: WCAG Compliance

### Known Issues
*To be updated as testing progresses*

### Test Environment Information
```
Frontend URL: http://localhost:3000
Anvil RPC: http://localhost:8545
Test Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Test Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

## 🚀 Execution Instructions

### Prerequisites Setup
1. **Start Local Environment**
   ```bash
   # Terminal 1: Start Anvil
   cd contracts && anvil

   # Terminal 2: Deploy contracts
   cd contracts && forge script script/Deploy.s.sol --broadcast --rpc-url http://localhost:8545

   # Terminal 3: Start frontend
   cd frontend && npm run dev
   ```

2. **Configure Test Wallet**
   - Import Anvil test account to MetaMask
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Network: Add localhost:8545 as custom network

### Test Execution Order
1. Start with **Phase 1** (Wallet Connection)
2. Progress through phases sequentially
3. Mark results in this document
4. Report issues immediately
5. Retest fixes before marking complete

### Issue Reporting Template
```markdown
**Issue ID**: TC###-##
**Severity**: Critical/High/Medium/Low
**Description**: Brief description
**Steps to Reproduce**:
1. Step one
2. Step two
**Expected**: What should happen
**Actual**: What actually happened
**Environment**: Browser, network, etc.
**Screenshots**: If applicable
```

## ✅ Sign-off Checklist

Before marking testing complete:
- [ ] All Priority 1 tests passing
- [ ] All critical bugs fixed
- [ ] Performance requirements met
- [ ] Security validation passed
- [ ] Accessibility standards met
- [ ] Multi-browser compatibility verified
- [ ] Mobile responsiveness confirmed
- [ ] Documentation updated with findings

**Test Lead Signature**: _________________ Date: _________

**Product Owner Approval**: _________________ Date: _________

---

**Ready for Production**: ✅ / ❌

**Additional Notes**: _To be completed during testing execution_