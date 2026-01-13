# 📊 Dukt Dashboard - Backend + Frontend

> **Real-time transaction visualization and analysis platform for smart contract development**

[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vanilla JS](https://img.shields.io/badge/Frontend-Vanilla%20JS-yellow?logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

---

## 🎯 Overview

The Dukt Dashboard is a full-stack application providing:
- **Backend**: Express.js API server for transaction ingestion, storage, and analysis
- **Frontend**: Modern dark-themed single-page application for visualization

Together, they transform raw transaction traces into an interactive, hierarchical view of smart contract execution.

---

## ✨ Key Features

### 📥 Transaction Ingestion
- RESTful API for receiving traces from Hardhat plugin
- Real-time data normalization and storage
- Support for both raw traces and pre-built flows

### 🌲 Hierarchical Visualization
- **Nested Blocks View**: Collapsible tree structure showing call depth
- **Flat Table View**: Traditional list for quick scanning
- Toggle between views with one click

### 🏗️ Architecture Diagram
- Interactive visualization of the VaultFi protocol structure
- Shows contract relationships and function signatures
- Color-coded by contract type

### 🔥 Hotspot Detection (Planned)
- Identify frequently called functions
- Highlight gas-intensive operations
- Track revert patterns across transactions

### 📈 Analytics Dashboard (Planned)
- Gas usage trends over time
- Success/failure ratios
- Contract interaction heatmaps

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd dev-fixture
npm install
```

### Start the Server

```bash
npm run dev
```

**Output:**
```
[Dukt] Starting server...
[Database] In-memory storage initialized
[Dukt] Server running at http://localhost:3001
```

### Open Dashboard

Navigate to: **http://localhost:3001**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (SPA)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Sidebar    │  │   Header    │  │     Content Area        │ │
│  │  Navigation │  │   + Toggle  │  │  - Executions View      │ │
│  │             │  │             │  │  - Architecture View    │ │
│  │  • Health   │  │             │  │  - Hotspots View        │ │
│  │  • Context  │  │             │  │  - Analytics View       │ │
│  │  • Execute  │  │             │  │                         │ │
│  │  • Arch     │  │             │  │  Nested Blocks /        │ │
│  │  • Hotspots │  │             │  │  Flat Table Toggle      │ │
│  │  • Analytic │  │             │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ fetch()
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Express.js)                         │
│  ┌────────────────────────────────────────────────────────────┐│
│  │                     API Routes                              ││
│  │  GET  /health              - Health check                   ││
│  │  GET  /api/context         - Current session context        ││
│  │  GET  /api/executions      - Transaction list               ││
│  │  GET  /api/executions/:id  - Single transaction             ││
│  │  GET  /api/executions/:id/flow - Full execution flow        ││
│  │  GET  /api/hotspots        - Function hotspots              ││
│  │  GET  /api/analytics       - Analytics metrics              ││
│  │  POST /api/internal/ingest/hardhat - Hardhat trace ingest   ││
│  │  POST /api/internal/ingest/flow    - Direct flow ingest     ││
│  └────────────────────────────────────────────────────────────┘│
│                              │                                  │
│                              ▼                                  │
│  ┌────────────────────────────────────────────────────────────┐│
│  │                   In-Memory Storage                         ││
│  │  TransactionRepository │ StatsRepository │ AnalyticsStore   ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
dev-fixture/
├── src/
│   ├── api/
│   │   ├── routes.ts          # All API endpoints
│   │   └── middleware.ts      # Request/response helpers
│   ├── storage/
│   │   ├── database.ts        # In-memory database
│   │   └── repositories.ts    # Data access layer
│   ├── ingestion/
│   │   ├── hardhat-ingest.ts  # Trace ingestion logic
│   │   └── mock-data.ts       # VaultFi demo data generator
│   ├── normalization/
│   │   ├── flow-builder.ts    # Build TransactionFlow from raw data
│   │   └── trace-parser.ts    # Parse debug traces
│   ├── analysis/
│   │   ├── hotspots.ts        # Hotspot detection algorithms
│   │   └── analytics.ts       # Analytics metrics
│   ├── types.ts               # TypeScript interfaces
│   └── index.ts               # Application entry point
├── public/
│   ├── index.html             # SPA shell
│   ├── app.js                 # Frontend JavaScript
│   └── styles.css             # Dark theme styles
├── data/
│   └── vaultfi-demo-transactions.json  # Pre-built demo data
├── package.json
└── tsconfig.json
```

---

## 🎨 Frontend Features

### Executions View

The main view for browsing transactions:

#### Flat Table Mode
- Chronological list of all transactions
- Quick-scan with status icons (✅/❌)
- Shows entry function, step count, max depth

#### Nested Blocks Mode
- **Hierarchical visualization** based on `maxDepth`
- Each block has three collapsible sections:
  1. **Title**: `functionName() | status • stepCount steps`
  2. **Body**: Full JSON metadata
  3. **Children**: Nested child blocks

```
┌──────────────────────────────────────────────────────┐
│ ✅ deposit()                        success • 5 steps │
├──────────────────────────────────────────────────────┤
│ { "txHash": "0x...", "projectId": "1", ... }         │
├──────────────────────────────────────────────────────┤
│ ▶ Children: ['transferFrom', 'allocateFunds']        │
│   ┌────────────────────────────────────────────────┐ │
│   │ ✅ transferFrom()              success • ...   │ │
│   └────────────────────────────────────────────────┘ │
│   ┌────────────────────────────────────────────────┐ │
│   │ ✅ allocateFunds()             success • ...   │ │
│   │   ▶ Children: ['deployCapital']                │ │
│   └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Architecture View

Interactive diagram of the VaultFi protocol:

```
        👤 User
           │
           ▼
    🏦 VaultCore
    deposit() • withdraw()
           │
           ▼
    📊 StrategyManager
    allocateFunds() • harvestYield()
           │
           ▼
    🌱 YieldStrategy
    deployCapital() • claimRewards()
           │
    ┌──────┴──────┬─────────┐
    ▼             ▼         ▼
🏛️ LendingPool  📈 Oracle  💰 USDC
```

---

## 🔌 API Reference

### Endpoints

#### `GET /health`
Health check endpoint.

**Response:**
```json
{ "status": "ok" }
```

#### `GET /api/executions`
Get list of all transactions.

**Query Parameters:**
- `limit` (optional): Max transactions to return (default: 50, max: 100)

**Response:**
```json
{
  "data": [
    {
      "txHash": "0x...",
      "projectId": "1",
      "status": "success",
      "entryFunction": "deposit",
      "stepCount": 5,
      "maxDepth": 3
    }
  ],
  "meta": { "source": "hardhat", "timestamp": 1768281000000 },
  "count": 15
}
```

#### `POST /api/internal/ingest/flow`
Ingest a pre-built transaction flow.

**Request Body:**
```json
{
  "txHash": "0x...",
  "entryFunction": "deposit",
  "status": "success",
  "steps": [
    { "depth": 0, "contractName": "VaultCore", "functionName": "deposit", "status": "success" },
    { "depth": 1, "contractName": "USDC", "functionName": "transferFrom", "status": "success" }
  ]
}
```

**Response:**
```json
{
  "data": { "txHash": "0x...", "stepCount": 2, "maxDepth": 1 },
  "message": "Flow ingested successfully"
}
```

---

## 🎨 UI Design

### Theme: Dark Mode
- Background: `#0a0a0f` (near black)
- Surface: `#12121a` (dark blue-gray)
- Accent: `#6366f1` (indigo)
- Success: `#22c55e` (green)
- Error: `#ef4444` (red)
- Warning: `#f59e0b` (amber)

### Typography
- Font: `SF Mono, Menlo, Monaco, monospace`
- Optimized for code readability

---

## 🛠️ Development

### Hot Reload

The server uses `tsx` for TypeScript execution with hot reload:

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

---

## 🗺️ Roadmap

### ✅ Completed
- [x] Core API server with Express
- [x] In-memory transaction storage
- [x] Executions view with Flat/Nested toggle
- [x] Hierarchical nesting by maxDepth
- [x] VaultFi architecture diagram
- [x] Direct flow ingestion endpoint
- [x] Dark theme UI with collapsible blocks

### 🔜 In Progress
- [ ] Hotspot detection and visualization
- [ ] Analytics dashboard with charts
- [ ] Gas usage treemaps
- [ ] Transaction search and filtering

### 📋 Planned
- [ ] Persistent storage (SQLite/PostgreSQL)
- [ ] WebSocket for real-time updates
- [ ] Source code mapping for traces
- [ ] Multi-project support
- [ ] Export functionality (JSON, CSV)

---

## 📄 License

MIT © 2026 Dukt Contributors

---

<p align="center">
  <b>Making smart contract debugging visual and intuitive</b>
</p>
