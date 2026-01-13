import { EthereumProvider, RequestArguments } from "hardhat/types";

const INTERCEPTED_METHODS = ["eth_sendTransaction", "eth_sendRawTransaction"];

export interface TransactionData {
  projectId: string;
  method: string;
  params: unknown;
  timestamp: number;
}

export type TransactionDispatcher = (data: TransactionData) => void;

/**
 * Wrap the provider with Dukt interception.
 * Modifies the provider's request AND send methods in-place.
 * hardhat-ethers uses send(), not request().
 */
export function wrapProvider(
  provider: EthereumProvider,
  projectId: string,
  dispatcher: TransactionDispatcher
): void {
  // Save original methods
  const originalRequest = provider.request.bind(provider);
  const originalSend = provider.send.bind(provider);
  
  // Override request method in-place
  const wrappedRequest = async (args: RequestArguments): Promise<unknown> => {
    console.log("[dukt] request():", args.method);
    
    if (INTERCEPTED_METHODS.includes(args.method)) {
      console.log("🔍 Dukt intercepted (request):", args.method, args.params);
      dispatchTransaction(projectId, args.method, args.params, dispatcher);
    }
    return originalRequest(args);
  };
  (provider as any).request = wrappedRequest;
  
  // Override send method in-place (this is what hardhat-ethers uses!)
  const wrappedSend = async (method: string, params?: unknown[]): Promise<unknown> => {
    console.log("[dukt] send():", method);
    
    if (INTERCEPTED_METHODS.includes(method)) {
      console.log("🔍 Dukt intercepted (send):", method, params);
      dispatchTransaction(projectId, method, params, dispatcher);
    }
    return originalSend(method, params);
  };
  (provider as any).send = wrappedSend;
}

function dispatchTransaction(
  projectId: string,
  method: string,
  params: unknown,
  dispatcher: TransactionDispatcher
): void {
  const data: TransactionData = {
    projectId,
    method,
    params,
    timestamp: Date.now(),
  };

  // Fire-and-forget dispatch (non-blocking)
  try {
    dispatcher(data);
  } catch {
    // Silently ignore dispatch errors
  }
}
