/**
 * Dukt - Data Repositories
 * Typed data access methods for transactions and statistics
 */

import { getDatabase } from './database';
import type {
    TransactionFlow,
    ExecutionStep,
    FunctionStatistics,
    StoredTransaction,
    StoredFunctionStats,
} from '../types';

// ============================================
// Transaction Repository
// ============================================

export const TransactionRepository = {
    /**
     * Save a normalized transaction flow
     */
    save(flow: TransactionFlow): void {
        const db = getDatabase();
        const stmt = db.prepare(`
      INSERT OR REPLACE INTO transactions 
      (tx_hash, network, status, entry_function, failed_at_function, failed_at_depth, flow_json, timestamp, block_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            flow.txHash,
            flow.network,
            flow.status,
            flow.entryFunction || null,
            flow.failedAt?.functionName || null,
            flow.failedAt?.depth || null,
            JSON.stringify(flow.steps),
            flow.timestamp || Date.now(),
            flow.blockNumber || null
        );
    },

    /**
     * Get all transactions, ordered by timestamp descending
     */
    findAll(limit: number = 50): TransactionFlow[] {
        const db = getDatabase();
        const stmt = db.prepare(`
      SELECT * FROM transactions 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
        const rows = stmt.all(limit) as StoredTransaction[];
        return rows.map(rowToTransactionFlow);
    },

    /**
     * Get a transaction by hash
     */
    findByHash(txHash: string): TransactionFlow | null {
        const db = getDatabase();
        const stmt = db.prepare('SELECT * FROM transactions WHERE tx_hash = ?');
        const row = stmt.get(txHash) as StoredTransaction | undefined;
        return row ? rowToTransactionFlow(row) : null;
    },

    /**
     * Get transaction count
     */
    count(): number {
        const db = getDatabase();
        const stmt = db.prepare('SELECT COUNT(*) as count FROM transactions');
        const result = stmt.get() as { count: number };
        return result.count;
    },

    /**
     * Get success/failure counts
     */
    getStatusCounts(): { success: number; revert: number } {
        const db = getDatabase();
        const stmt = db.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status = 'revert' THEN 1 ELSE 0 END) as revert
      FROM transactions
    `);
        const result = stmt.get() as { success: number; revert: number };
        return {
            success: result.success || 0,
            revert: result.revert || 0,
        };
    },
};

/**
 * Convert database row to TransactionFlow
 */
function rowToTransactionFlow(row: StoredTransaction): TransactionFlow {
    return {
        txHash: row.tx_hash,
        network: row.network as 'hardhat' | 'testnet' | 'mock',
        status: row.status as 'success' | 'revert',
        entryFunction: row.entry_function || undefined,
        failedAt: row.failed_at_function
            ? {
                functionName: row.failed_at_function,
                depth: row.failed_at_depth || 0,
            }
            : undefined,
        steps: JSON.parse(row.flow_json) as ExecutionStep[],
        timestamp: row.timestamp,
        blockNumber: row.block_number || undefined,
    };
}

// ============================================
// Function Statistics Repository
// ============================================

export const StatsRepository = {
    /**
     * Update function call statistics
     */
    recordCall(functionName: string, contractAddress: string | null, reverted: boolean): void {
        const db = getDatabase();

        // Try to update existing record
        const updateStmt = db.prepare(`
      UPDATE function_stats 
      SET 
        call_count = call_count + 1,
        revert_count = revert_count + ?,
        last_updated = ?
      WHERE function_name = ? AND (contract_address = ? OR (contract_address IS NULL AND ? IS NULL))
    `);

        const result = updateStmt.run(
            reverted ? 1 : 0,
            Date.now(),
            functionName,
            contractAddress,
            contractAddress
        );

        // If no existing record, insert new one
        if (result.changes === 0) {
            const insertStmt = db.prepare(`
        INSERT INTO function_stats (function_name, contract_address, call_count, revert_count, last_updated)
        VALUES (?, ?, 1, ?, ?)
      `);
            insertStmt.run(functionName, contractAddress, reverted ? 1 : 0, Date.now());
        }
    },

    /**
     * Get all function statistics, ordered by call count
     */
    findAll(): FunctionStatistics[] {
        const db = getDatabase();
        const stmt = db.prepare(`
      SELECT * FROM function_stats 
      ORDER BY call_count DESC
    `);
        const rows = stmt.all() as StoredFunctionStats[];
        return rows.map(rowToFunctionStats);
    },

    /**
     * Get top functions by revert rate
     */
    getHotspots(limit: number = 10): FunctionStatistics[] {
        const db = getDatabase();
        const stmt = db.prepare(`
      SELECT * FROM function_stats 
      WHERE call_count >= 1
      ORDER BY (CAST(revert_count AS REAL) / call_count) DESC, call_count DESC
      LIMIT ?
    `);
        const rows = stmt.all(limit) as StoredFunctionStats[];
        return rows.map(rowToFunctionStats);
    },

    /**
     * Clear all statistics (for recomputation)
     */
    clear(): void {
        const db = getDatabase();
        db.exec('DELETE FROM function_stats');
    },
};

/**
 * Convert database row to FunctionStatistics
 */
function rowToFunctionStats(row: StoredFunctionStats): FunctionStatistics {
    return {
        functionName: row.function_name,
        contractAddress: row.contract_address || undefined,
        callCount: row.call_count,
        revertCount: row.revert_count,
        revertRate: row.call_count > 0 ? row.revert_count / row.call_count : 0,
    };
}

export default { TransactionRepository, StatsRepository };
