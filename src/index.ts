import { extendConfig, extendEnvironment } from "hardhat/config";
import { HardhatConfig, HardhatUserConfig } from "hardhat/types";
import { getOrCreateProjectId, readCachedProjectId } from "./identity";
import { wrapProvider } from "./DuktProvider";
import { dispatchTransaction } from "./transport";

import "./type-extensions";

extendConfig(
  (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    // Merge user config with defaults
    config.dukt = {
      endpoint: userConfig.dukt?.endpoint,
      enabled: userConfig.dukt?.enabled ?? true,
    };
  }
);

extendEnvironment((hre) => {
  // Initialize dukt runtime object
  hre.dukt = {
    projectId: null,
    enabled: false,
  };

  // If explicitly disabled, skip everything
  if (hre.config.dukt.enabled === false) {
    return;
  }

  // Try to read cached projectId synchronously first
  const cachedId = readCachedProjectId(hre.config.paths.root);
  
  if (cachedId) {
    // We have a cached ID - wrap provider immediately (synchronous)
    console.log("[dukt] Found cached projectId:", cachedId);
    wrapProvider(
      hre.network.provider,
      cachedId,
      dispatchTransaction
    );
    console.log("[dukt] Provider wrapped successfully");
    hre.dukt.projectId = cachedId;
    hre.dukt.enabled = true;
  } else {
    // No cached ID - wrap provider immediately with pending state
    // Transactions will be queued until HELLO completes
    console.log("[dukt] No cached projectId, performing HELLO handshake...");
    
    // Use a mutable reference to store projectId once HELLO completes
    const pendingState = { projectId: null as string | null };
    
    // Queue to store transactions until projectId is available
    const pendingTransactions: Array<{ method: string; params: unknown; timestamp: number }> = [];
    
    // Custom dispatcher that queues until projectId is ready
    const queueingDispatcher = (data: { projectId: string; method: string; params: unknown; timestamp: number }) => {
      if (pendingState.projectId) {
        // ProjectId is available, dispatch immediately
        dispatchTransaction({ ...data, projectId: pendingState.projectId });
      } else {
        // Queue for later dispatch
        console.log("[dukt] Queuing transaction (HELLO pending):", data.method);
        pendingTransactions.push({ method: data.method, params: data.params, timestamp: data.timestamp });
      }
    };
    
    // Wrap provider immediately with queuing dispatcher
    wrapProvider(
      hre.network.provider,
      "", // Placeholder - will use pendingState.projectId via closure
      queueingDispatcher
    );
    console.log("[dukt] Provider wrapped (HELLO pending)");
    hre.dukt.enabled = true;
    
    // Perform async HELLO
    getOrCreateProjectId(hre.config.paths.root)
      .then((projectId) => {
        if (projectId) {
          console.log("[dukt] HELLO complete, projectId:", projectId);
          pendingState.projectId = projectId;
          hre.dukt.projectId = projectId;
          
          // Dispatch any queued transactions
          if (pendingTransactions.length > 0) {
            console.log("[dukt] Dispatching", pendingTransactions.length, "queued transactions");
            for (const tx of pendingTransactions) {
              dispatchTransaction({
                projectId,
                method: tx.method,
                params: tx.params,
                timestamp: tx.timestamp,
              });
            }
            pendingTransactions.length = 0; // Clear queue
          }
        } else {
          console.log("[dukt] HELLO failed, tracing disabled");
          hre.dukt.enabled = false;
        }
      })
      .catch(() => {
        console.log("[dukt] HELLO error, tracing disabled");
        hre.dukt.enabled = false;
      });
  }
});
