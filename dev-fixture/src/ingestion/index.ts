/**
 * Dukt - Ingestion Module Exports
 */

export { ingestHardhatTrace, validateIngestRequest } from './hardhat-ingest';
export { ingestFromRpc, checkRpcSupport } from './rpc-ingest';
export {
    generateMockTrace,
    generateMockIngestRequest,
    generateMockFlows,
    PREDEFINED_MOCKS
} from './mock-data';
