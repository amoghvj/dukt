/**
 * Dukt - Hotspots Analysis
 * Function-level call and revert statistics
 */

import type { FunctionStatistics, TransactionFlow } from '../types';
import { StatsRepository, TransactionRepository } from '../storage/repositories';

/**
 * Get function hotspots ranked by revert rate
 */
export function getHotspots(limit: number = 10): FunctionStatistics[] {
    return StatsRepository.getHotspots(limit);
}

/**
 * Get all function statistics
 */
export function getAllFunctionStats(): FunctionStatistics[] {
    return StatsRepository.findAll();
}

/**
 * Recompute all function statistics from stored transactions
 * Useful after data import or for consistency checks
 */
export function recomputeHotspots(): void {
    console.log('[Analysis] Recomputing function hotspots...');

    // Clear existing stats
    StatsRepository.clear();

    // Get all transactions
    const transactions = TransactionRepository.findAll(1000);

    // Recompute from each transaction's steps
    for (const tx of transactions) {
        for (const step of tx.steps) {
            if (step.functionName) {
                StatsRepository.recordCall(
                    step.functionName,
                    step.contractAddress,
                    step.status === 'revert'
                );
            }
        }
    }

    console.log(`[Analysis] Recomputed stats from ${transactions.length} transactions`);
}

/**
 * Get top reverting functions
 */
export function getTopRevertingFunctions(limit: number = 5): string[] {
    const hotspots = getHotspots(limit);
    return hotspots
        .filter(h => h.revertCount > 0)
        .map(h => h.functionName);
}

export default { getHotspots, getAllFunctionStats, recomputeHotspots, getTopRevertingFunctions };
