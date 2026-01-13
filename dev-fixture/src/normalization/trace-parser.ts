/**
 * Dukt - Trace Parser
 * Converts raw Hardhat traces into normalized ExecutionStep arrays
 */

import type { ExecutionStep, HardhatTrace } from '../types';

/**
 * Parse a Hardhat trace into normalized execution steps
 */
export function parseTrace(trace: HardhatTrace, depth: number = 0): ExecutionStep[] {
    const steps: ExecutionStep[] = [];

    // Create step for current call
    const step = createStepFromTrace(trace, depth);
    steps.push(step);

    // Recursively process nested calls
    if (trace.calls && trace.calls.length > 0) {
        for (const nestedCall of trace.calls) {
            const nestedSteps = parseTrace(nestedCall, depth + 1);
            steps.push(...nestedSteps);
        }
    }

    return steps;
}

/**
 * Create a single ExecutionStep from a trace entry
 */
function createStepFromTrace(trace: HardhatTrace, depth: number): ExecutionStep {
    const functionSelector = extractFunctionSelector(trace.input);
    const functionName = trace.type === 'CREATE' || trace.type === 'CREATE2'
        ? 'constructor'
        : functionSelector || 'fallback';

    return {
        depth,
        contractAddress: trace.to || '0x0000000000000000000000000000000000000000',
        functionName,
        functionSelector,
        status: trace.error ? 'revert' : 'success',
        revertReason: trace.revertReason || trace.error,
        gasUsed: trace.gasUsed ? parseInt(trace.gasUsed, 16) : undefined,
    };
}

/**
 * Extract 4-byte function selector from input data
 */
function extractFunctionSelector(input?: string): string | undefined {
    if (!input || input.length < 10) {
        return undefined;
    }
    // Return first 4 bytes (0x + 8 hex chars)
    return input.slice(0, 10);
}

/**
 * Get the maximum call depth in a trace
 */
export function getMaxDepth(steps: ExecutionStep[]): number {
    return steps.reduce((max, step) => Math.max(max, step.depth), 0);
}

/**
 * Find the first failed step in execution
 */
export function findFailurePoint(steps: ExecutionStep[]): { functionName: string; depth: number } | undefined {
    const failed = steps.find(step => step.status === 'revert');
    if (failed) {
        return {
            functionName: failed.functionName || 'unknown',
            depth: failed.depth,
        };
    }
    return undefined;
}

export default { parseTrace, getMaxDepth, findFailurePoint };
