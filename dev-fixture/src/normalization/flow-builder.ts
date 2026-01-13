/**
 * Dukt - Flow Builder
 * Builds complete TransactionFlow from execution steps
 */

import type { TransactionFlow, ExecutionStep, HardhatIngestRequest } from '../types';
import { parseTrace, findFailurePoint } from './trace-parser';

/**
 * Build a complete TransactionFlow from a Hardhat ingestion request
 * Handles both full trace data and plugin-only data
 */
export function buildFlow(request: HardhatIngestRequest): TransactionFlow {
    let steps: ExecutionStep[];
    
    if (request.trace) {
        // Full trace available - parse it
        steps = parseTrace(request.trace);
    } else if (request.params) {
        // Plugin data only - create basic step from params
        const params = request.params as Record<string, unknown>;
        steps = [{
            depth: 0,
            contractAddress: (params.to as string) || 'unknown',
            functionName: request.method || 'unknown',
            status: 'success', // Assume success if we received the data
        }];
    } else {
        // No data - empty steps
        steps = [];
    }

    // Determine overall status
    const hasRevert = steps.some(step => step.status === 'revert');
    const status = hasRevert ? 'revert' : 'success';

    // Find failure point if reverted
    const failedAt = hasRevert ? findFailurePoint(steps) : undefined;

    // Extract entry function from first step
    const entryFunction = steps.length > 0 ? steps[0].functionName : undefined;

    return {
        txHash: request.txHash,
        network: request.network,
        projectId: request.projectId || "1",  // Default to "1" for MVP
        status,
        entryFunction,
        failedAt,
        steps,
        timestamp: request.timestamp || Date.now(),
        blockNumber: request.blockNumber,
    };
}

/**
 * Build a mock TransactionFlow for testing
 */
export function buildMockFlow(
    txHash: string,
    steps: ExecutionStep[],
    network: 'mock' = 'mock'
): TransactionFlow {
    const hasRevert = steps.some(step => step.status === 'revert');
    const failedAt = hasRevert ? findFailurePoint(steps) : undefined;

    return {
        txHash,
        network,
        projectId: "1",  // Always "1" for mock data
        status: hasRevert ? 'revert' : 'success',
        entryFunction: steps[0]?.functionName,
        failedAt,
        steps,
        timestamp: Date.now(),
    };
}

/**
 * Summarize a flow for list display
 */
export function summarizeFlow(flow: TransactionFlow): {
    txHash: string;
    projectId: string;
    status: string;
    entryFunction: string;
    stepCount: number;
    maxDepth: number;
} {
    const maxDepth = flow.steps.reduce((max, s) => Math.max(max, s.depth), 0);

    return {
        txHash: flow.txHash,
        projectId: flow.projectId || "1",
        status: flow.status,
        entryFunction: flow.entryFunction || 'unknown',
        stepCount: flow.steps.length,
        maxDepth,
    };
}

export default { buildFlow, buildMockFlow, summarizeFlow };
