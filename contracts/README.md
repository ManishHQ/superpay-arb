# Smart Contracts - SuperPay

This directory contains the smart contracts for the SuperPay savings pots system. These contracts are **currently not implemented** in the main application but are available for future blockchain integration.

## 📋 Contract Overview

### **SavingsPots.sol**

The main contract that manages savings pots on the Arbitrum blockchain.

**Features:**

- Create and manage savings pots
- Deposit and withdraw USDC funds
- Multi-user collaborative pots
- Time-locked strict savings
- Yield farming integration
- Emergency withdrawal mechanisms

**Key Functions:**

```solidity
function createPot(string memory name, uint256 targetAmount, bool isStrict, uint256 deadline) external
function deposit(uint256 potId, uint256 amount) external
function withdraw(uint256 potId, uint256 amount) external
function addCollaborator(uint256 potId, address user) external
```

### **mUSDC.sol**

Mock USDC token contract for testing and development purposes.

**Features:**

- ERC-20 compliant token
- Mintable for testing
- 6 decimal precision (like real USDC)
- Transfer and approval functionality

**Key Functions:**

```solidity
function mint(address to, uint256 amount) external
function transfer(address to, uint256 amount) external returns (bool)
function approve(address spender, uint256 amount) external returns (bool)
```

## 🚧 Implementation Status

### **Current State**

- ✅ Smart contracts are written and tested
- ✅ Contract architecture is finalized
- ❌ **Not integrated with the main application**
- ❌ **Not deployed to any blockchain network**

### **Why Not Implemented?**

1. **Complexity** - Blockchain integration adds significant complexity
2. **Gas Costs** - Every transaction requires ETH for gas fees
3. **User Experience** - Database operations are faster and more reliable
4. **Development Speed** - Supabase-only approach allows faster iteration

### **Future Integration**

When blockchain integration is desired:

1. **Deploy contracts** to Arbitrum mainnet or Arbitrum Sepolia testnet
2. **Update services** to include blockchain operations
3. **Add wallet connection** requirements
4. **Implement gas fee handling**
5. **Add transaction confirmation flows**

## 🧪 Testing

### **Local Development**

```bash
# Install Hardhat
npm install -g hardhat

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### **Test Networks**

- **Arbitrum Sepolia** - Arbitrum Layer 2 testnet
- **Sepolia** - Ethereum testnet
- **Mumbai** - Polygon testnet

## 🔒 Security Considerations

### **Audit Status**

- ⚠️ **Contracts have NOT been audited**
- ⚠️ **Not recommended for production use**
- ⚠️ **Use at your own risk**

### **Security Features**

- Reentrancy protection
- Access control modifiers
- Emergency pause functionality
- Timelock mechanisms for critical operations

## 📚 Contract Architecture

### **Design Patterns**

- **Factory Pattern** - For creating new savings pots
- **Access Control** - Role-based permissions
- **Events** - Comprehensive logging for transparency
- **Pausable** - Emergency stop functionality

### **Integration Points**

- **USDC** - Main stablecoin for deposits
- **DeFi Protocols** - Yield farming integration
- **Oracle Services** - Price feeds and data
- **Multisig Wallets** - Administrative controls

## 🚀 Deployment

### **Prerequisites**

1. **Hardhat** development environment
2. **Ethereum node** or provider (Infura, Alchemy)
3. **Private key** for deployment
4. **ETH** for gas fees

### **Deployment Steps**

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export INFURA_URL=your_infura_url

# Deploy to Arbitrum Sepolia testnet
npx hardhat run scripts/deploy.js --network arbitrumSepolia

# Verify contracts on Arbiscan
npx hardhat verify --network arbitrumSepolia CONTRACT_ADDRESS
```

## 📖 Documentation

### **Technical Details**

- **Solidity Version**: 0.8.19+
- **OpenZeppelin**: Latest security contracts
- **Gas Optimization**: Efficient storage patterns
- **Upgradeability**: Not currently upgradeable

### **API Reference**

- **Contract ABI** - Available in `artifacts/` after compilation
- **Interface Definitions** - TypeScript types available
- **Event Schemas** - All emitted events documented

## 🤝 Contributing

### **Contract Development**

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure gas optimization
5. Submit pull request

### **Testing Requirements**

- 100% test coverage for new functions
- Gas usage optimization
- Security best practices
- Documentation updates

## ⚠️ Disclaimer

These smart contracts are provided for educational and development purposes. They have not been audited and should not be used in production without proper security review. The SuperPay team is not responsible for any financial losses resulting from the use of these contracts.

---

**Note**: The current application uses a Supabase-only approach which is recommended for production use. These contracts are available for future blockchain integration when the team decides to implement on-chain functionality.
