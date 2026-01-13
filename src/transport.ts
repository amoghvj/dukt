import { TransactionData } from "./DuktProvider";

/**
 * Get the endpoint for transaction ingestion.
 * Priority: DUKT_ENDPOINT env var → fallback
 */
function getIngestEndpoint(): string {
  const envEndpoint = process.env.DUKT_ENDPOINT;
  if (envEndpoint) {
    return `${envEndpoint.replace(/\/$/, "")}/api/internal/ingest/hardhat`;
  }
  return "http://localhost:3001/api/internal/ingest/hardhat";
}

/**
 * Dispatch transaction data to the backend.
 * Fire-and-forget: no await, no retries, no acknowledgement.
 * Execution is never delayed by network I/O.
 */
export function dispatchTransaction(data: TransactionData): void {
  const endpoint = getIngestEndpoint();

  // Build payload matching backend's HardhatIngestRequest
  const payload = {
    txHash: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`,  // Temp txHash
    network: 'hardhat',
    projectId: data.projectId,
    method: data.method,
    params: data.params,
    timestamp: data.timestamp,
  };

  // Fire-and-forget: start the request but don't await
  fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Silently ignore errors - never block execution
  });
}
