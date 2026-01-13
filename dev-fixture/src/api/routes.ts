/**
 * Dukt - API Routes
 * All HTTP endpoints for Thinkroot integration
 */

import { Router, Request, Response } from 'express';
import type { ApiResponse, TransactionFlow, FunctionStatistics, AnalyticsMetrics, NetworkContext } from '../types';
import { createMeta } from './middleware';
import { TransactionRepository } from '../storage/repositories';
import { summarizeFlow } from '../normalization/flow-builder';
import { getHotspots } from '../analysis/hotspots';
import { getAnalytics, getAnalysisSummary } from '../analysis/analytics';
import { ingestHardhatTrace, validateIngestRequest } from '../ingestion/hardhat-ingest';
import { generateMockFlows, PREDEFINED_MOCKS } from '../ingestion/mock-data';

const router = Router();

// ============================================
// Health Check
// ============================================

/**
 * GET /health
 * Basic health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

// ============================================
// Plugin Integration Endpoints
// ============================================

/**
 * POST /hello
 * Hardhat plugin handshake - returns projectId
 */
router.post('/hello', (req: Request, res: Response) => {
    const { tool, version, chain, environment } = req.body;
    
    // For MVP: always use projectId "1"
    const projectId = "1";
    
    console.log(`[Hello] Project registered: ${projectId}`);
    console.log(`  Tool: ${tool}, Version: ${version}, Chain: ${chain}`);
    
    res.json({ projectId });
});

// ============================================
// Context Endpoint
// ============================================

/**
 * GET /api/context
 * Returns current analysis context
 */
router.get('/api/context', (req: Request, res: Response) => {
    const txCount = TransactionRepository.count();
    const hasMockData = txCount > 0;

    const context: NetworkContext = {
        network: hasMockData ? 'mock' : 'hardhat',
        lastUpdated: Date.now(),
        transactionCount: txCount,
        analysisStatus: hasMockData ? 'mock' : 'partial',
    };

    const response: ApiResponse<NetworkContext> = {
        data: context,
        meta: createMeta(hasMockData ? 'mock' : 'hardhat'),
    };

    res.json(response);
});

// ============================================
// Executions Endpoints
// ============================================

/**
 * GET /api/executions
 * Returns chronological transaction list
 */
router.get('/api/executions', (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const transactions = TransactionRepository.findAll(limit);

    // Return summaries, not full flows
    const summaries = transactions.map(summarizeFlow);

    const response: ApiResponse<typeof summaries> = {
        data: summaries,
        meta: createMeta(transactions.length > 0 ? 'mock' : 'hardhat'),
        count: summaries.length,
        message: summaries.length === 0 ? 'No executions found' : undefined,
    };

    res.json(response);
});

/**
 * GET /api/executions/:txHash
 * Returns high-level execution summary
 */
router.get('/api/executions/:txHash', (req: Request, res: Response) => {
    const { txHash } = req.params;
    const transaction = TransactionRepository.findByHash(txHash);

    if (!transaction) {
        res.status(404).json({
            error: 'Not Found',
            message: `Transaction ${txHash} not found`,
            meta: createMeta(),
        });
        return;
    }

    const summary = summarizeFlow(transaction);

    const response: ApiResponse<typeof summary & { timestamp?: number; blockNumber?: number }> = {
        data: {
            ...summary,
            timestamp: transaction.timestamp,
            blockNumber: transaction.blockNumber,
        },
        meta: createMeta('mock'),
    };

    res.json(response);
});

/**
 * GET /api/executions/:txHash/flow
 * Returns human-readable execution flow (full steps)
 */
router.get('/api/executions/:txHash/flow', (req: Request, res: Response) => {
    const { txHash } = req.params;
    const transaction = TransactionRepository.findByHash(txHash);

    if (!transaction) {
        res.status(404).json({
            error: 'Not Found',
            message: `Transaction ${txHash} not found`,
            meta: createMeta(),
        });
        return;
    }

    const response: ApiResponse<TransactionFlow> = {
        data: transaction,
        meta: createMeta('mock'),
    };

    res.json(response);
});

// ============================================
// Hotspots Endpoint
// ============================================

/**
 * GET /api/hotspots
 * Returns ranked function hotspots
 */
router.get('/api/hotspots', (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const hotspots = getHotspots(limit);

    const response: ApiResponse<FunctionStatistics[]> = {
        data: hotspots,
        meta: createMeta(hotspots.length > 0 ? 'mock' : 'hardhat'),
        count: hotspots.length,
        message: hotspots.length === 0 ? 'No function statistics available' : undefined,
    };

    res.json(response);
});

// ============================================
// Analytics Endpoint
// ============================================

/**
 * GET /api/analytics
 * Returns lightweight global metrics
 */
router.get('/api/analytics', (req: Request, res: Response) => {
    const analytics = getAnalytics();
    const summary = getAnalysisSummary();

    const response: ApiResponse<AnalyticsMetrics & typeof summary> = {
        data: {
            ...analytics,
            ...summary,
        },
        meta: createMeta(analytics.totalTransactions > 0 ? 'mock' : 'hardhat'),
    };

    res.json(response);
});

// ============================================
// Internal Ingestion Endpoint
// ============================================

/**
 * POST /api/internal/ingest/hardhat
 * Accepts Hardhat trace JSON (internal endpoint, not for Thinkroot)
 */
router.post('/api/internal/ingest/hardhat', (req: Request, res: Response) => {
    const validation = validateIngestRequest(req.body);

    if (!validation.valid || !validation.request) {
        res.status(400).json({
            error: 'Bad Request',
            message: validation.error || 'Invalid request',
            meta: createMeta(),
        });
        return;
    }

    try {
        const flow = ingestHardhatTrace(validation.request);

        const response: ApiResponse<{ txHash: string; stepCount: number }> = {
            data: {
                txHash: flow.txHash,
                stepCount: flow.steps.length,
            },
            meta: createMeta('hardhat'),
            message: 'Transaction ingested successfully',
        };

        res.status(201).json(response);
    } catch (error) {
        res.status(500).json({
            error: 'Ingestion Failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            meta: createMeta(),
        });
    }
});

/**
 * POST /api/internal/ingest/flow
 * Accepts pre-built TransactionFlow objects directly (for demo/testing)
 * This bypasses trace parsing and stores the flow as-is
 */
router.post('/api/internal/ingest/flow', (req: Request, res: Response) => {
    const body = req.body;

    // Basic validation
    if (!body.txHash || typeof body.txHash !== 'string') {
        res.status(400).json({
            error: 'Bad Request',
            message: 'txHash is required',
            meta: createMeta(),
        });
        return;
    }

    if (!body.steps || !Array.isArray(body.steps)) {
        res.status(400).json({
            error: 'Bad Request',
            message: 'steps array is required',
            meta: createMeta(),
        });
        return;
    }

    try {
        // Build TransactionFlow from request body
        const hasRevert = body.steps.some((s: { status?: string }) => s.status === 'revert');
        const maxDepth = body.steps.reduce((max: number, s: { depth?: number }) => Math.max(max, s.depth || 0), 0);

        const flow: TransactionFlow = {
            txHash: body.txHash,
            network: body.network || 'hardhat',
            projectId: body.projectId || '1',
            status: hasRevert ? 'revert' : (body.status || 'success'),
            entryFunction: body.entryFunction || body.steps[0]?.functionName || 'unknown',
            failedAt: body.failedAt,
            steps: body.steps,
            timestamp: body.timestamp || Date.now(),
            blockNumber: body.blockNumber,
        };

        // Store in repository
        TransactionRepository.save(flow);

        console.log(`[Ingest/Flow] Stored ${flow.txHash.slice(0, 12)}... (${flow.entryFunction}) - ${flow.steps.length} steps`);

        res.status(201).json({
            data: {
                txHash: flow.txHash,
                stepCount: flow.steps.length,
                maxDepth,
            },
            meta: createMeta('hardhat'),
            message: 'Flow ingested successfully',
        });
    } catch (error) {
        res.status(500).json({
            error: 'Ingestion Failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            meta: createMeta(),
        });
    }
});

// ============================================
// Development: Seed Mock Data
// ============================================

/**
 * POST /api/internal/seed-mock
 * Seeds the database with mock data for testing
 */
router.post('/api/internal/seed-mock', (req: Request, res: Response) => {
    const count = Math.min(parseInt(req.query.count as string) || 10, 50);

    // Add predefined mocks first (success + error scenarios)
    const predefinedFlows = [
        // Success flows
        PREDEFINED_MOCKS.userDeposit(),
        PREDEFINED_MOCKS.userWithdraw(),
        PREDEFINED_MOCKS.governanceRebalance(),
        PREDEFINED_MOCKS.oracleUpdate(),
        // Error flows (for hotspot detection)
        PREDEFINED_MOCKS.failedWithdraw(),
        PREDEFINED_MOCKS.failedDeposit(),
        PREDEFINED_MOCKS.staleOracleRevert(),
        PREDEFINED_MOCKS.strategyPaused(),
        PREDEFINED_MOCKS.unauthorizedRebalance(),
    ];

    // Add random mocks
    const randomFlows = generateMockFlows(count);

    const allFlows = [...predefinedFlows, ...randomFlows];

    // Store all flows
    for (const flow of allFlows) {
        TransactionRepository.save(flow);
        // Update stats
        for (const step of flow.steps) {
            if (step.functionName) {
                const { StatsRepository } = require('../storage/repositories');
                StatsRepository.recordCall(
                    step.functionName,
                    step.contractAddress,
                    step.status === 'revert'
                );
            }
        }
    }

    const response: ApiResponse<{ seeded: number }> = {
        data: { seeded: allFlows.length },
        meta: createMeta('mock'),
        message: `Seeded ${allFlows.length} mock transactions`,
    };

    res.status(201).json(response);
});

export default router;
