/**
 * Dukt - In-Memory Database Layer
 * Simple in-memory storage for MVP testing (no native modules required)
 */

// In-memory storage
const transactions: Map<string, any> = new Map();
const functionStats: Map<string, { callCount: number; revertCount: number; lastUpdated: number }> = new Map();

/**
 * Mock Database interface (matches better-sqlite3 API surface we use)
 */
interface MockDatabase {
    prepare: (sql: string) => MockStatement;
    exec: (sql: string) => void;
    close: () => void;
}

interface MockStatement {
    run: (...params: any[]) => { changes: number };
    get: (...params: any[]) => any;
    all: (...params: any[]) => any[];
}

let db: MockDatabase | null = null;

/**
 * Get or create database instance
 */
export function getDatabase(): MockDatabase {
    if (!db) {
        db = createMockDatabase();
        console.log('[Database] In-memory storage initialized');
    }
    return db;
}

function createMockDatabase(): MockDatabase {
    return {
        prepare: (sql: string) => createMockStatement(sql),
        exec: (sql: string) => {
            // Schema creation - no-op for in-memory
            console.log('[Database] (mock) exec:', sql.slice(0, 50) + '...');
        },
        close: () => {
            transactions.clear();
            functionStats.clear();
            console.log('[Database] In-memory storage cleared');
        }
    };
}

function createMockStatement(sql: string): MockStatement {
    const sqlLower = sql.toLowerCase();
    
    return {
        run: (...params: any[]) => {
            // Handle INSERT/UPDATE for transactions
            if (sqlLower.includes('insert') && sqlLower.includes('transactions')) {
                const [txHash, network, status, entryFn, failedFn, failedDepth, flowJson, timestamp, blockNum] = params;
                transactions.set(txHash, { txHash, network, status, entryFn, failedFn, failedDepth, flowJson, timestamp, blockNum });
                return { changes: 1 };
            }
            // Handle INSERT/UPDATE for function_stats
            if (sqlLower.includes('insert') && sqlLower.includes('function_stats')) {
                const [funcName, contractAddr, callCount, revertCount] = params;
                const key = `${funcName}:${contractAddr || 'unknown'}`;
                functionStats.set(key, { callCount, revertCount, lastUpdated: Date.now() });
                return { changes: 1 };
            }
            // Handle UPDATE for function_stats
            if (sqlLower.includes('update') && sqlLower.includes('function_stats')) {
                // params: increment values + function_name + contract_address
                return { changes: 1 };
            }
            return { changes: 0 };
        },
        get: (...params: any[]) => {
            // Handle SELECT by tx_hash
            if (sqlLower.includes('transactions') && sqlLower.includes('where')) {
                const txHash = params[0];
                const row = transactions.get(txHash);
                if (row) {
                    return {
                        id: 1,
                        tx_hash: row.txHash,
                        network: row.network,
                        status: row.status,
                        entry_function: row.entryFn,
                        failed_at_function: row.failedFn,
                        failed_at_depth: row.failedDepth,
                        flow_json: row.flowJson,
                        timestamp: row.timestamp,
                        block_number: row.blockNum
                    };
                }
                return undefined;
            }
            // Handle count
            if (sqlLower.includes('count(*)')) {
                return { count: transactions.size };
            }
            return undefined;
        },
        all: (...params: any[]) => {
            // Handle SELECT all transactions
            if (sqlLower.includes('transactions')) {
                const limit = params[0] || 50;
                return Array.from(transactions.values())
                    .slice(0, limit)
                    .map(row => ({
                        id: 1,
                        tx_hash: row.txHash,
                        network: row.network,
                        status: row.status,
                        entry_function: row.entryFn,
                        failed_at_function: row.failedFn,
                        failed_at_depth: row.failedDepth,
                        flow_json: row.flowJson,
                        timestamp: row.timestamp,
                        block_number: row.blockNum
                    }));
            }
            // Handle SELECT function_stats
            if (sqlLower.includes('function_stats')) {
                const limit = params[0] || 10;
                return Array.from(functionStats.entries())
                    .slice(0, limit)
                    .map(([key, val]) => {
                        const [funcName, contractAddr] = key.split(':');
                        return {
                            id: 1,
                            function_name: funcName,
                            contract_address: contractAddr === 'unknown' ? null : contractAddr,
                            call_count: val.callCount,
                            revert_count: val.revertCount,
                            last_updated: val.lastUpdated
                        };
                    });
            }
            return [];
        }
    };
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
        console.log('[Database] Connection closed');
    }
}

/**
 * Clear all data (for testing)
 */
export function clearDatabase(): void {
    transactions.clear();
    functionStats.clear();
    console.log('[Database] All data cleared');
}

export default { getDatabase, closeDatabase, clearDatabase };
