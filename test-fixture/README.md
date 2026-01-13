# 🧪 Dukt Test Fixture - VaultFi Demo Project

> **Demo smart contract project showcasing Dukt plugin integration**

---

## 📋 Overview

This test fixture simulates a **VaultFi DeFi protocol** - a yield-bearing vault system that demonstrates Dukt's transaction tracing capabilities. It provides realistic transaction flows without requiring actual smart contract deployment.

### Purpose
- Validate Dukt plugin integration with Hardhat
- Demonstrate real-time transaction streaming
- Showcase nested call hierarchies up to 4 levels deep
- Test error handling and revert detection

---

## 🏦 VaultFi Protocol Architecture

VaultFi is a simulated DeFi yield vault with the following components:

```
┌──────────────────────────────────────────────────────────────┐
│                         USER                                 │
│                    deposit / withdraw                        │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                      VaultCore                               │
│            deposit() • withdraw() • rebalance()              │
│                    (Entry Point)                             │
└──────────────────────────┬───────────────────────────────────┘
                           │ allocate / harvest
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                   StrategyManager                            │
│         allocateFunds() • withdrawFunds() • harvestYield()   │
└──────────────────────────┬───────────────────────────────────┘
                           │ deploy / claim
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    YieldStrategy                             │
│            deployCapital() • withdrawCapital()               │
└──────────────────────────┬───────────────────────────────────┘
                           │ supply / redeem
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  LendingPool (External)  │  PriceOracle  │  USDC (ERC20)    │
│     supply() redeem()    │   getPrice()  │   transfer()     │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Demo Transactions

The fixture includes **15 pre-built transactions** representing realistic protocol activity:

### ✅ Success Flows (10 transactions)

| # | Type | Entry Function | Steps | Description |
|---|------|----------------|-------|-------------|
| 1 | Deposit | `deposit()` | 5 | User deposits USDC into vault |
| 2 | Deposit | `deposit()` | 5 | Second user deposit |
| 4 | Oracle | `updatePrice()` | 2 | Keeper updates price feed |
| 5 | Withdraw | `withdraw()` | 6 | User withdraws with yield |
| 7 | Governance | `rebalance()` | 7 | Protocol rebalances funds |
| 9 | Deposit | `deposit()` | 5 | Third deposit transaction |
| 11 | Withdraw | `withdraw()` | 6 | Second withdrawal |
| 13 | Oracle | `updatePrice()` | 2 | Price update |
| 14 | Deposit | `deposit()` | 5 | Fourth deposit |
| 15 | Withdraw | `withdraw()` | 6 | Final withdrawal |

### ❌ Error Flows (5 transactions)

| # | Type | Entry Function | Error Location | Revert Reason |
|---|------|----------------|----------------|---------------|
| 3 | Deposit | `deposit()` | USDC.transferFrom | `ERC20: insufficient allowance` |
| 6 | Withdraw | `withdraw()` | PriceOracle.getPrice | `Oracle: Price data stale` |
| 8 | Governance | `rebalance()` | VaultCore.rebalance | `Caller is not governance` |
| 10 | Deposit | `deposit()` | YieldStrategy.deployCapital | `Contract paused` |
| 12 | Withdraw | `withdraw()` | LendingPool.redeem | `Insufficient liquidity` |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Running Dukt backend on `http://localhost:3001`

### Installation

```bash
cd test-fixture
npm install
```

### Send Demo Transactions

```bash
node scripts/send-demo-traces.js
```

**Output:**
```
🚀 VaultFi Demo Trace Sender
=============================
   Backend: http://localhost:3001
   Transactions: 15
   Delay: 500ms between each

✅ [1/15] deposit() - 5 steps
✅ [2/15] deposit() - 5 steps
❌ [3/15] deposit() - 2 steps
✅ [4/15] updatePrice() - 2 steps
...
=============================
✅ Sent: 15 | ❌ Failed: 0
```

---

## 📁 Project Structure

```
test-fixture/
├── hardhat.config.js      # Hardhat config with Dukt plugin
├── package.json           # Dependencies
└── scripts/
    ├── test-transactions.js   # Basic transaction tests
    └── send-demo-traces.js    # VaultFi demo sender
```

---

## ⚙️ Hardhat Configuration

```javascript
require("hardhat-dukt");

module.exports = {
  solidity: "0.8.20",
  defaultNetwork: "hardhat",
  dukt: {
    backendUrl: "http://localhost:3001",
    enabled: true
  }
};
```

---

## 📤 Demo Script Details

The `send-demo-traces.js` script:

1. **Reads** pre-built transactions from `dev-fixture/data/vaultfi-demo-transactions.json`
2. **Sends** each transaction to the backend via POST `/api/internal/ingest/flow`
3. **Waits** 500ms between transactions (configurable) to simulate real-time activity
4. **Logs** success/failure for each transaction

### Configuration

```javascript
const BACKEND_URL = 'http://localhost:3001';
const DELAY_MS = 500;  // Adjust for faster/slower demo
```

---

## 🔮 Future Integration (Production)

In production, the plugin will automatically capture real transactions:

```javascript
// This will be auto-traced by Dukt
await vault.deposit(ethers.parseUnits("1000", 6));
await vault.withdraw(500);
```

The current demo uses pre-built data to showcase the visualization capabilities without requiring:
- Deployed smart contracts
- Running blockchain node
- Actual ERC20 tokens

---

## 📄 License

MIT © 2026 Dukt Contributors
