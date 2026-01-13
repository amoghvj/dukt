import "hardhat/types/config";
import "hardhat/types/runtime";

export interface DuktConfig {
  /** Override DUKT_ENDPOINT env var */
  endpoint?: string;
  /** Toggle tracing on/off (default: true) */
  enabled?: boolean;
}

declare module "hardhat/types/config" {
  export interface HardhatUserConfig {
    dukt?: DuktConfig;
  }

  export interface HardhatConfig {
    dukt: DuktConfig;
  }
}

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    dukt: {
      /** Project ID from HELLO handshake, null if disabled */
      projectId: string | null;
      /** Whether tracing is active */
      enabled: boolean;
    };
  }
}
