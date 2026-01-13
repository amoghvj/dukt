/**
 * Dukt - Hardhat Ingestion Service
 * Accepts Hardhat trace JSON and stores normalized results
 */

import type { HardhatIngestRequest, TransactionFlow } from '../types';
import { buildFlow } from '../normalization/flow-builder';
import { TransactionRepository, StatsRepository } from '../storage/repositories';

/**
 * Ingest a Hardhat trace and store normalized results
 */
export function ingestHardhatTrace(request: HardhatIngestRequest): TransactionFlow {
    // Build normalized flow from trace
    const flow = buildFlow(request);

    // Store the transaction
    TransactionRepository.save(flow);

    // Update function statistics
    updateFunctionStats(flow);

    console.log(`[Ingestion] Stored transaction ${flow.txHash} with ${flow.steps.length} steps`);

    return flow;
}

/**
 * Update function call statistics from a transaction flow
 */
function updateFunctionStats(flow: TransactionFlow): void {
    for (const step of flow.steps) {
        if (step.functionName) {
            StatsRepository.recordCall(
                step.functionName,
                step.contractAddress,
                step.status === 'revert'
            );
        }
    }
}

/**
 * Validate a Hardhat ingest request (accepts union of plugin and backend fields)
 */
export function validateIngestRequest(body: unknown): { valid: boolean; error?: string; request?: HardhatIngestRequest } {
    if (!body || typeof body !== 'object') {
        return { valid: false, error: 'Request body must be an object' };
    }

    const obj = body as Record<string, unknown>;

    if (!obj.txHash || typeof obj.txHash !== 'string') {
        return { valid: false, error: 'txHash is required and must be a string' };
    }

    // Network defaults to 'hardhat' if not provided
    const network = obj.network || 'hardhat';
    if (network !== 'hardhat' && network !== 'testnet') {
        return { valid: false, error: 'network must be "hardhat" or "testnet"' };
    }

    // Trace is now optional - plugin may not have it initially
    const trace = typeof obj.trace === 'object' ? obj.trace as HardhatIngestRequest['trace'] : undefined;

    return {
        valid: true,
        request: {
            txHash: obj.txHash as string,
            network: network as 'hardhat' | 'testnet',
            timestamp: typeof obj.timestamp === 'number' ? obj.timestamp : Date.now(),
            // Plugin fields
            projectId: typeof obj.projectId === 'string' ? obj.projectId : undefined,
            method: typeof obj.method === 'string' ? obj.method : undefined,
            params: obj.params,
            // Backend fields
            trace,
            blockNumber: typeof obj.blockNumber === 'number' ? obj.blockNumber : undefined,
        },
    };
}

export default { ingestHardhatTrace, validateIngestRequest };
