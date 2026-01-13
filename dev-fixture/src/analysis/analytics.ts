/**
 * Dukt - Analytics Module
 * Global metrics and statistics aggregation
 */

import type { AnalyticsMetrics, TransactionFlow } from '../types';
import { TransactionRepository } from '../storage/repositories';
import { getTopRevertingFunctions } from './hotspots';

/**
 * Compute global analytics metrics
 */
export function getAnalytics(): AnalyticsMetrics {
    const totalTransactions = TransactionRepository.count();
    const { success, revert } = TransactionRepository.getStatusCounts();

    // Get all transactions for depth calculation
    const transactions = TransactionRepository.findAll(100);
    const avgCallDepth = calculateAverageDepth(transactions);

    const topRevertFunctions = getTopRevertingFunctions(5);

    return {
        totalTransactions,
        successCount: success,
        revertCount: revert,
        successRate: totalTransactions > 0 ? success / totalTransactions : 0,
        avgCallDepth,
        topRevertFunctions,
    };
}

/**
 * Calculate average call depth across transactions
 */
function calculateAverageDepth(transactions: TransactionFlow[]): number {
    if (transactions.length === 0) return 0;

    const totalMaxDepth = transactions.reduce((sum, tx) => {
        const maxDepth = tx.steps.reduce((max, step) => Math.max(max, step.depth), 0);
        return sum + maxDepth;
    }, 0);

    return totalMaxDepth / transactions.length;
}

/**
 * Get a summary of analysis coverage
 */
export function getAnalysisSummary(): {
    transactionsCovered: number;
    uniqueFunctions: number;
    uniqueContracts: number;
} {
    const transactions = TransactionRepository.findAll(1000);

    const functions = new Set<string>();
    const contracts = new Set<string>();

    for (const tx of transactions) {
        for (const step of tx.steps) {
            if (step.functionName) functions.add(step.functionName);
            if (step.contractAddress) contracts.add(step.contractAddress);
        }
    }

    return {
        transactionsCovered: transactions.length,
        uniqueFunctions: functions.size,
        uniqueContracts: contracts.size,
    };
}

export default { getAnalytics, getAnalysisSummary };
