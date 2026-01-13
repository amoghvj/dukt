/**
 * Dukt - API Middleware
 * CORS configuration and error handling
 */

import type { Request, Response, NextFunction } from 'express';
import type { ApiError, ResponseMeta } from '../types';

/**
 * Create response metadata
 */
export function createMeta(source: 'hardhat' | 'mock' = 'mock'): ResponseMeta {
    return {
        analysisStatus: source === 'mock' ? 'mock' : 'complete',
        source,
        timestamp: Date.now(),
    };
}

/**
 * CORS configuration middleware
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }

    next();
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[API] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    });

    next();
}

/**
 * Error handler middleware
 * Returns predictable error responses without stack traces
 */
export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    console.error(`[API Error] ${err.message}`);

    const error: ApiError = {
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred',
        meta: createMeta(),
    };

    res.status(500).json(error);
}

/**
 * 404 handler
 */
export function notFoundHandler(req: Request, res: Response): void {
    const error: ApiError = {
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.path} not found`,
        meta: createMeta(),
    };

    res.status(404).json(error);
}

export default {
    createMeta,
    corsMiddleware,
    requestLogger,
    errorHandler,
    notFoundHandler
};
