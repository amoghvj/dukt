import * as fs from "fs";
import * as path from "path";

const DUKT_DIR = ".dukt";
const PROJECT_FILE = "project.json";
const PLUGIN_VERSION = "0.1.0";

interface ProjectIdentity {
  projectId: string;
  createdAt: number;
}

interface HelloResponse {
  projectId: string;
}

/**
 * Get the endpoint for HELLO requests.
 * Priority: DUKT_ENDPOINT env var → fallback
 */
function getHelloEndpoint(): string {
  const envEndpoint = process.env.DUKT_ENDPOINT;
  if (envEndpoint) {
    // Remove trailing slash and append /hello
    return `${envEndpoint.replace(/\/$/, "")}/hello`;
  }
  return "http://localhost:3001/hello";
}

/**
 * Perform the HELLO handshake with the backend.
 * Returns projectId on success, null on failure.
 */
async function performHello(): Promise<string | null> {
  const endpoint = getHelloEndpoint();

  const payload = {
    tool: "dukt-hardhat-plugin",
    version: PLUGIN_VERSION,
    chain: "hardhat",
    environment: "local",
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(`[dukt] HELLO failed: HTTP ${response.status}`);
      return null;
    }

    const data = (await response.json()) as HelloResponse;
    if (!data.projectId) {
      console.warn("[dukt] HELLO response missing projectId");
      return null;
    }

    return data.projectId;
  } catch (error) {
    // Network error, timeout, etc. - fail silently
    console.warn("[dukt] HELLO request failed, tracing disabled for this run");
    return null;
  }
}

/**
 * Read existing project identity from .dukt/project.json (synchronous)
 * Exported for use in synchronous provider wrapping.
 */
export function readCachedProjectId(projectRoot: string): string | null {
  const filePath = path.join(projectRoot, DUKT_DIR, PROJECT_FILE);

  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const identity = JSON.parse(content) as ProjectIdentity;
    return identity?.projectId ?? null;
  } catch {
    return null;
  }
}

/**
 * Write project identity to .dukt/project.json
 */
function writeProjectIdentity(
  projectRoot: string,
  projectId: string
): boolean {
  const dirPath = path.join(projectRoot, DUKT_DIR);
  const filePath = path.join(dirPath, PROJECT_FILE);

  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const identity: ProjectIdentity = {
      projectId,
      createdAt: Date.now(),
    };

    fs.writeFileSync(filePath, JSON.stringify(identity, null, 2));
    return true;
  } catch (error) {
    console.warn("[dukt] Failed to write project identity");
    return false;
  }
}

/**
 * Get or create the project identity.
 * - If .dukt/project.json exists, return cached projectId
 * - Otherwise, perform HELLO and persist the result
 * - Returns null if HELLO fails (tracing should be disabled)
 */
export async function getOrCreateProjectId(
  projectRoot: string
): Promise<string | null> {
  // Check for existing identity
  const existing = readCachedProjectId(projectRoot);
  if (existing) {
    return existing;
  }

  // No identity - perform HELLO
  const projectId = await performHello();
  if (!projectId) {
    return null;
  }

  // Persist the new identity
  writeProjectIdentity(projectRoot, projectId);

  return projectId;
}
