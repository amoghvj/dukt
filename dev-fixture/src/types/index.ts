/**
 * Dukt - Shared TypeScript Interfaces
 * All normalized data models for blockchain execution analysis
 */

// ============================================
// Core Execution Models
// ============================================

/**
 * Individual step in a transaction execution flow
 */
export interface ExecutionStep {
    depth: number;
    contractAddress: string;
    contractName?: string;
    functionName?: string;
    functionSelector?: string;
    status: 'success' | 'revert';
    revertReason?: string;
    gasUsed?: number;
}

/**
 * Complete normalized transaction flow
 */
export interface TransactionFlow {
    txHash: string;
    network: 'hardhat' | 'testnet' | 'mock';
    projectId?: string;  // Added for MVP
    entryFunction?: string;
    status: 'success' | 'revert';
    failedAt?: {
        functionName: string;
        depth: number;
    };
    steps: ExecutionStep[];
    timestamp?: number;
    blockNumber?: number;
}

/**
 * Function-level call/revert statistics
 */
export interface FunctionStatistics {
    functionName: string;
    contractAddress?: string;
    callCount: number;
    revertCount: number;
    revertRate: number;
}

/**
 * Global analytics metrics
 */
export interface AnalyticsMetrics {
    totalTransactions: number;
    successCount: number;
    revertCount: number;
    successRate: number;
    avgCallDepth: number;
    topRevertFunctions: string[];
}

/**
 * Current analysis context
 */
export interface NetworkContext {
    network: 'hardhat' | 'testnet' | 'mock';
    lastUpdated: number;
    transactionCount: number;
    analysisStatus: 'complete' | 'partial' | 'mock';
}

// ============================================
// API Response Models
// ============================================

/**
 * Response metadata included in all API responses
 */
export interface ResponseMeta {
    analysisStatus: 'complete' | 'partial' | 'mock';
    source: 'hardhat' | 'mock';
    timestamp: number;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
    data: T;
    meta: ResponseMeta;
    message?: string;
    count?: number;
}

/**
 * Error response structure
 */
export interface ApiError {
    error: string;
    message: string;
    meta: ResponseMeta;
}

// ============================================
// Ingestion Models
// ============================================

/**
 * Raw Hardhat trace structure (simplified)
 */
export interface HardhatTrace {
    type: string;
    from: string;
    to: string;
    value?: string;
    gas?: string;
    gasUsed?: string;
    input?: string;
    output?: string;
    error?: string;
    revertReason?: string;
    calls?: HardhatTrace[];
}

/**
 * Hardhat ingestion request payload (union of plugin and backend fields)
 * Accepts data from Hardhat plugin with optional trace for future enhancement
 */
export interface HardhatIngestRequest {
    // Required fields
    txHash: string;
    network: 'hardhat' | 'testnet';
    timestamp?: number;
    
    // Plugin-specific fields
    projectId?: string;
    method?: string;  // e.g., "eth_sendTransaction"
    params?: unknown; // Transaction params (from, to, value, etc.)
    
    // Backend trace fields (optional for now)
    trace?: HardhatTrace;
    blockNumber?: number;
}

// ============================================
// Storage Models
// ============================================

/**
 * Transaction record as stored in database (snake_case matches SQLite columns)
 */
export interface StoredTransaction {
    id: number;
    tx_hash: string;
    network: string;
    status: string;
    entry_function: string | null;
    failed_at_function: string | null;
    failed_at_depth: number | null;
    flow_json: string;
    timestamp: number;
    block_number: number | null;
}

/**
 * Function stats record as stored in database (snake_case matches SQLite columns)
 */
export interface StoredFunctionStats {
    id: number;
    function_name: string;
    contract_address: string | null;
    call_count: number;
    revert_count: number;
    last_updated: number;
}

