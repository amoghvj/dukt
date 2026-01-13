# 🔍 Dukt - Real-Time Smart Contract Transaction Tracer

> **Visualize, Debug, and Analyze Your Hardhat Smart Contract Executions in Real-Time**

[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-FFCC00?logo=ethereum)](https://hardhat.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🎯 Project Overview

**Dukt** is a comprehensive developer toolkit that transforms the way you debug and understand smart contract interactions. It consists of three integrated components:

1. **Hardhat Plugin** - Intercepts transaction executions in real-time
2. **Backend API** - Processes, normalizes, and stores transaction traces
3. **Visual Dashboard** - Interactive visualization of call hierarchies and patterns

### 💡 The Problem We Solve

When developing complex DeFi protocols or multi-contract systems, developers face critical challenges:

| Challenge | Pain Point |
|-----------|------------|
| **Hidden Complexity** | Internal calls between contracts are invisible without manual debugging |
| **Gas Black Box** | No visibility into gas consumption per internal function call |
| **Revert Hell** | Deep reverts in the call stack are obscured, making debugging painful |
| **Pattern Blindness** | No easy way to identify hotspots or frequently failing functions |
| **Manual Logging** | Extensive console.logs required to trace execution flow |

### ✨ Our Solution

Dukt provides **automatic, zero-config transaction tracing** that:

- 🔗 **Intercepts** every transaction during Hardhat development
- 🌳 **Visualizes** nested call hierarchies up to any depth
- ⚡ **Streams** data in real-time to a beautiful dashboard
- 🔥 **Identifies** hotspots, patterns, and failure points
- 📊 **Analyzes** gas usage and function call statistics

---

## 🏆 Unique Selling Points (USPs)

### 1. � Zero-Config Integration
Simply install the plugin and it works. No code changes, no complex setup:
```javascript
require("hardhat-dukt");  // That's it!
```

### 2. 🌲 Hierarchical Call Visualization
See the complete picture of your contract interactions:
```
VaultCore.deposit()
  ├→ USDC.transferFrom()
  ├→ StrategyManager.allocateFunds()
  │   └→ YieldStrategy.deployCapital()
  │       └→ LendingPool.supply()
  └→ emit Deposit(user, amount)
```

### 3. ⏱️ Real-Time Streaming
Watch transactions flow into the dashboard as they execute - perfect for demos and debugging sessions.

### 4. � Smart Error Detection
Automatically identifies where reverts occur in the call stack and surfaces the actual error message.

### 5. 🎨 Modern Developer Experience
Clean, dark-themed UI designed for developers. Toggle between table and tree views. Collapsible blocks for deep call stacks.

---

## 🖥️ Live Demo

### VaultFi Protocol Simulation

We include a complete DeFi vault protocol simulation with 15 pre-built transactions:

| Transaction Type | Status | Description |
|------------------|--------|-------------|
| User Deposit | ✅ | 5-step flow through VaultCore → StrategyManager → LendingPool |
| User Withdraw | ✅ | 6-step withdrawal with yield calculation |
| Governance Rebalance | ✅ | 7-step fund reallocation |
| Failed Deposit | ❌ | Reverts on ERC20 allowance |
| Stale Oracle | ❌ | Reverts on stale price data |
| Unauthorized | ❌ | Access control revert |

**Run the demo:**
```bash
# Terminal 1: Start the dashboard
cd dev-fixture && npm run dev

# Terminal 2: Send demo transactions
cd test-fixture && node scripts/send-demo-traces.js
```

---

## � Repository Structure

```
dukt/
├── src/                     # 🔌 Hardhat Plugin
│   ├── index.ts             # Plugin entry point
│   ├── DuktProvider.ts      # EIP-1193 provider wrapper
│   ├── identity.ts          # Project registration
│   └── transport.ts         # Backend communication
│
├── dev-fixture/             # 🖥️ Backend + Frontend
│   ├── src/
│   │   ├── api/             # Express.js routes
│   │   ├── storage/         # In-memory database
│   │   ├── ingestion/       # Trace processing
│   │   ├── normalization/   # Flow building
│   │   └── analysis/        # Hotspots & analytics
│   ├── public/
│   │   ├── index.html       # Dashboard SPA
│   │   ├── app.js           # Frontend logic
│   │   └── styles.css       # Dark theme
│   └── data/
│       └── vaultfi-demo-transactions.json
│
└── test-fixture/            # 🧪 Demo Project
    ├── hardhat.config.js    # With Dukt plugin
    └── scripts/
        └── send-demo-traces.js
```

---

## 🚀 Quick Start

### 1. Install the Plugin

```bash
npm install hardhat-dukt --save-dev
```

### 2. Add to Hardhat Config

```javascript
require("hardhat-dukt");

module.exports = {
  solidity: "0.8.20",
  dukt: {
    backendUrl: "http://localhost:3001",
    enabled: true
  }
};
```

### 3. Start the Dashboard

```bash
cd dev-fixture
npm install
npm run dev
# Dashboard running at http://localhost:3001
```

### 4. Run Your Hardhat Scripts

```bash
npx hardhat run scripts/deploy.js
npx hardhat test
```

All transactions are automatically captured and displayed in the dashboard!

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       HARDHAT RUNTIME                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    DuktProvider                          │   │
│  │   ┌──────────┐   ┌──────────┐   ┌─────────────────┐     │   │
│  │   │Intercept │ → │  Build   │ → │ Send to Backend │     │   │
│  │   │   RPC    │   │  Trace   │   │    (HTTP POST)  │     │   │
│  │   └──────────┘   └──────────┘   └─────────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Ingestion  │→ │  Storage    │→ │   Analysis Engine       │ │
│  │  /ingest/*  │  │  (Memory)   │  │  Hotspots + Analytics   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (SPA)                             │
│  ┌─────────────┐  ┌───────────────────────────────────────────┐│
│  │  Sidebar    │  │            CONTENT AREA                   ││
│  │             │  │  ┌─────────────────────────────────────┐  ││
│  │  • Health   │  │  │   📊 Executions View                │  ││
│  │  • Context  │  │  │   • Flat Table Mode                 │  ││
│  │  • Execute  │  │  │   • Nested Blocks Mode              │  ││
│  │  • Arch     │  │  │   • Collapsible Hierarchies         │  ││
│  │  • Hotspots │  │  └─────────────────────────────────────┘  ││
│  │  • Analytic │  │  ┌─────────────────────────────────────┐  ││
│  │             │  │  │   🏗️ Architecture View              │  ││
│  │             │  │  │   • Contract relationship diagram   │  ││
│  └─────────────┘  └───────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Key Features

### Executions View
- **Flat Table Mode**: Quick-scan list of all transactions
- **Nested Blocks Mode**: Hierarchical tree with collapsible sections
- **Status Indicators**: ✅ Success / ❌ Revert at a glance
- **Full Metadata**: Gas, depth, function selectors, revert reasons

### Architecture View
- Interactive diagram of VaultFi protocol
- Shows contract-to-contract relationships
- Function signatures for each contract

### (Planned) Hotspots View
- Identify most frequently called functions
- Track revert rates by contract/function
- Gas consumption leaderboards

### (Planned) Analytics Dashboard
- Transaction volume over time
- Success/failure ratios
- Contract interaction heatmaps

---

## � Roadmap

| Status | Feature |
|--------|---------|
| ✅ | Core Hardhat plugin with provider interception |
| ✅ | Real-time data streaming to backend |
| ✅ | Express.js API with trace ingestion |
| ✅ | Hierarchical nested blocks visualization |
| ✅ | VaultFi demo with 15 test transactions |
| ✅ | Architecture diagram view |
| 🔜 | Hotspot detection and visualization |
| 🔜 | Analytics dashboard with charts |
| 📋 | Full debug_traceTransaction integration |
| 📋 | WebSocket support for lower latency |
| 📋 | Source code mapping for traces |

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Plugin | TypeScript, Hardhat Runtime |
| Backend | Express.js, TypeScript |
| Frontend | Vanilla JavaScript, CSS Variables |
| Data | In-memory repositories |
| Theme | Custom dark mode with CSS variables |

---

## 📄 License

MIT © 2026 Dukt Contributors

---

## 🙏 Acknowledgments

- **Hardhat Team** for the excellent plugin architecture
- **Ethereum Community** for inspiration and feedback

---

<p align="center">
  <b>🔍 Making Smart Contract Debugging Visual and Intuitive</b>
  <br><br>
  <a href="#-quick-start">Get Started</a> •
  <a href="#-live-demo">Demo</a> •
  <a href="dev-fixture/README.md">Dashboard Docs</a> •
  <a href="test-fixture/README.md">Test Fixture Docs</a>
</p>
