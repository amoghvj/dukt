/**
 * Dukt - Server Startup
 * Entry point for the backend application
 */

import { createApp } from './app';
import { getDatabase, closeDatabase } from './storage';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

/**
 * Start the server
 */
async function start(): Promise<void> {
    console.log('[Dukt] Starting backend server...');

    // Initialize database
    getDatabase();
    console.log('[Dukt] Database initialized');

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(PORT, () => {
        console.log(`[Dukt] Server running at http://localhost:${PORT}`);
        console.log(`[Dukt] Test frontend: http://localhost:${PORT}`);
        console.log(`[Dukt] API endpoints:`);
        console.log(`  GET  /health`);
        console.log(`  GET  /api/context`);
        console.log(`  GET  /api/executions`);
        console.log(`  GET  /api/executions/:txHash`);
        console.log(`  GET  /api/executions/:txHash/flow`);
        console.log(`  GET  /api/hotspots`);
        console.log(`  GET  /api/analytics`);
        console.log(`  POST /api/internal/ingest/hardhat`);
        console.log(`  POST /api/internal/seed-mock`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('[Dukt] SIGTERM received, shutting down...');
        server.close(() => {
            closeDatabase();
            console.log('[Dukt] Server closed');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        console.log('[Dukt] SIGINT received, shutting down...');
        server.close(() => {
            closeDatabase();
            console.log('[Dukt] Server closed');
            process.exit(0);
        });
    });
}

// Run
start().catch((err) => {
    console.error('[Dukt] Failed to start:', err);
    process.exit(1);
});
