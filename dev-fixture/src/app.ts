/**
 * Dukt - Express App Configuration
 * Bootstrap and middleware registration
 */

import express, { Express } from 'express';
import path from 'path';
import {
    routes,
    corsMiddleware,
    requestLogger,
    errorHandler,
    notFoundHandler
} from './api';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
    const app = express();

    // Core middleware
    app.use(express.json());
    app.use(corsMiddleware);
    app.use(requestLogger);

    // Serve static files for test frontend
    app.use(express.static(path.join(__dirname, '..', 'public')));

    // API routes
    app.use(routes);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

export default { createApp };
