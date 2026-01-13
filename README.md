# 🔍 Dukt - Hardhat Transaction Tracer Plugin

> **Real-time transaction tracing and analysis for Hardhat development environments**

[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-FFCC00?logo=ethereum)](https://hardhat.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🎯 Overview

**Dukt** is a Hardhat plugin that intercepts, traces, and streams smart contract transaction data to a visualization dashboard in real-time. It provides developers with deep visibility into contract interactions, call hierarchies, and execution patterns during development.

### The Problem
When developing smart contracts, understanding the flow of transactions through multiple contracts is challenging:
- **Nested calls** are invisible without manual debugging
- **Gas consumption** per internal call is hard to track
- **Revert reasons** deep in the call stack are obscured
- **Testing complex DeFi protocols** requires extensive logging

### Our Solution
Dukt wraps your Hardhat provider to:
1. **Intercept** every transaction and RPC request
2. **Trace** full call hierarchies with depth information
3. **Stream** data to a beautiful visualization dashboard
4. **Analyze** patterns, hotspots, and failure points

---

## ✨ Features

### 🔗 Seamless Hardhat Integration
- Zero-configuration plugin installation
- Automatic provider wrapping
- Works with existing Hardhat scripts and tests

### 📡 Real-Time Data Streaming
- WebSocket-style data push to backend
- Sub-second latency from execution to visualization
- Chronological transaction ordering

### 🌳 Deep Call Tracing
- Full call stack with depth levels
- Contract-to-contract call relationships
- Function selectors and decoded names

### 📊 Rich Metadata Capture
- Transaction hash and block number
- Gas usage per step
- Revert reasons with stack location
- Entry point function identification

---

## 🚀 Quick Start

### Installation

```bash
npm install hardhat-dukt --save-dev
```

### Configuration

Add to your `hardhat.config.js`:

```javascript
require("hardhat-dukt");

module.exports = {
  solidity: "0.8.20",
  dukt: {
    backendUrl: "http://localhost:3001",  // Dukt backend
    enabled: true,                         // Toggle tracing
  }
};
```

### Usage

Run any Hardhat command - Dukt intercepts automatically:

```bash
npx hardhat run scripts/deploy.js
npx hardhat test
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Hardhat Runtime                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   DuktProvider                       │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────┐  │   │
│  │  │  Intercept  │ -> │   Trace     │ -> │  Send   │  │   │
│  │  │    RPC      │    │   Build     │    │ Backend │  │   │
│  │  └─────────────┘    └─────────────┘    └─────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│               ┌───────────────────────┐                    │
│               │   Wrapped Provider    │                    │
│               │   (Original Hardhat)  │                    │
│               └───────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ HTTP POST
              ┌──────────────────────────┐
              │      Dukt Backend        │
              │   /api/internal/ingest   │
              └──────────────────────────┘
```

### Core Components

| File | Purpose |
|------|---------|
| `src/index.ts` | Hardhat plugin entry point, environment extension |
| `src/DuktProvider.ts` | EIP-1193 provider wrapper with interception |
| `src/identity.ts` | Project registration and session management |
| `src/transport.ts` | HTTP transport layer for backend communication |

---

## 📦 Data Format

### Trace Payload (sent to backend)

```typescript
interface DuktTracePayload {
  txHash: string;           // Transaction hash
  projectId: string;        // Registered project ID
  network: string;          // Network name (hardhat, testnet)
  timestamp: number;        // Unix timestamp
  method: string;           // RPC method (eth_sendTransaction, etc.)
  params: unknown[];        // RPC parameters
  trace?: {                 // Full trace (when available)
    steps: ExecutionStep[];
  };
}

interface ExecutionStep {
  depth: number;            // Call depth (0 = entry point)
  contractAddress: string;  // Called contract
  contractName?: string;    // Resolved name (if available)
  functionName?: string;    // Function name
  functionSelector: string; // 4-byte selector
  status: 'success' | 'revert';
  revertReason?: string;    // If reverted
  gasUsed?: number;         // Gas for this step
}
```

---

## 🔧 Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `backendUrl` | `string` | `http://localhost:3001` | Dukt backend URL |
| `enabled` | `boolean` | `true` | Enable/disable tracing |
| `projectName` | `string` | `process.cwd()` | Project identifier |

---

## 🛠️ Development

### Building from Source

```bash
git clone https://github.com/your-org/hardhat-dukt
cd hardhat-dukt
npm install
npm run build
```

### Running Tests

```bash
npm test
```

---

## 🗺️ Roadmap

- [x] **Core Plugin** - Provider wrapping and interception
- [x] **Backend Transport** - HTTP data streaming
- [x] **Project Registration** - Hello handshake protocol
- [ ] **Full Trace Parsing** - Deep debug_traceTransaction integration
- [ ] **Source Mapping** - Link traces to Solidity source lines
- [ ] **WebSocket Support** - Persistent connection for lower latency

---

## 📄 License

MIT © 2026 Dukt Contributors

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

<p align="center">
  <b>Built with ❤️ for the Ethereum developer community</b>
</p>
