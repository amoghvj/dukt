/**
 * Dukt - RPC Ingestion Service
 * Optional future support for direct RPC trace fetching
 * Currently a placeholder for Hardhat-first MVP
 */

import type { TransactionFlow } from '../types';

/**
 * Fetch and ingest a transaction via RPC
 * NOTE: This is a placeholder for future implementation
 */
export async function ingestFromRpc(
    txHash: string,
    rpcUrl: string
): Promise<TransactionFlow | null> {
    console.warn('[RPC Ingest] RPC ingestion is not implemented in MVP');
    console.warn(`[RPC Ingest] Would fetch ${txHash} from ${rpcUrl}`);

    // Future implementation would:
    // 1. Call debug_traceTransaction via ethers.js
    // 2. Parse the raw trace into HardhatTrace format
    // 3. Call ingestHardhatTrace

    return null;
}

/**
 * Check if an RPC endpoint supports debug_traceTransaction
 */
export async function checkRpcSupport(rpcUrl: string): Promise<boolean> {
    console.warn('[RPC Ingest] RPC support check not implemented in MVP');
    return false;
}

export default { ingestFromRpc, checkRpcSupport };
