/**
 * Dukt - VaultFi Mock Data Generator
 * Simulates a DeFi Yield Vault Protocol for testing
 */

import type { HardhatTrace, HardhatIngestRequest, ExecutionStep, TransactionFlow } from '../types';
import { buildMockFlow } from '../normalization/flow-builder';

// ============================================
// VaultFi Contract Addresses (Deterministic)
// ============================================

const ADDRESSES = {
    VaultCore: '0xVault1234567890abcdef1234567890abcdef12',
    StrategyManager: '0xStrat1234567890abcdef1234567890abcdef12',
    YieldStrategy: '0xYield1234567890abcdef1234567890abcdef12',
    LendingPool: '0xLend1234567890abcdef1234567890abcdef123',
    PriceOracle: '0xOracle234567890abcdef1234567890abcdef1',
    USDC: '0xUSDC1234567890abcdef1234567890abcdef12',
    GovernanceToken: '0xGov12345678890abcdef1234567890abcdef12',
};

// ============================================
// VaultFi Contract Names
// ============================================

const VAULTFI_CONTRACTS = [
    'VaultCore',
    'StrategyManager',
    'YieldStrategy',
    'LendingPool',
    'PriceOracle',
    'USDC',
    'GovernanceToken',
];

// ============================================
// VaultFi Function Names by Contract
// ============================================

const VAULTFI_FUNCTIONS: Record<string, string[]> = {
    VaultCore: ['deposit', 'withdraw', 'rebalance', 'getSharePrice', 'totalAssets'],
    StrategyManager: ['allocateFunds', 'withdrawFunds', 'harvestYield', 'getStrategyBalance'],
    YieldStrategy: ['deployCapital', 'withdrawCapital', 'claimRewards', 'getAPY'],
    LendingPool: ['supply', 'redeem', 'getExchangeRate', 'accrueInterest'],
    PriceOracle: ['getPrice', 'updatePrice', 'getLatestRound'],
    USDC: ['transfer', 'transferFrom', 'approve', 'balanceOf'],
    GovernanceToken: ['delegate', 'propose', 'vote', 'execute'],
};

// ============================================
// Helper Functions
// ============================================

function randomHex(length: number): string {
    const chars = '0123456789abcdef';
    let result = '0x';
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

function mockTxHash(): string {
    return randomHex(64);
}

// ============================================
// Predefined VaultFi Transactions
// ============================================

export const PREDEFINED_MOCKS = {
    /**
     * TX1: User Deposit - Success (5 steps, depth 4)
     * User deposits 1000 USDC into the vault
     */
    userDeposit: (): TransactionFlow => buildMockFlow(
        '0xdeposit1234567890abcdef1234567890abcdef1234567890abcdef1234',
        [
            { depth: 0, contractAddress: ADDRESSES.VaultCore, contractName: 'VaultCore', functionName: 'deposit', functionSelector: '0xb6b55f25', status: 'success', gasUsed: 45000 },
            { depth: 1, contractAddress: ADDRESSES.USDC, contractName: 'USDC', functionName: 'transferFrom', functionSelector: '0x23b872dd', status: 'success', gasUsed: 35000 },
            { depth: 1, contractAddress: ADDRESSES.StrategyManager, contractName: 'StrategyManager', functionName: 'allocateFunds', functionSelector: '0x8f6ede1f', status: 'success', gasUsed: 55000 },
            { depth: 2, contractAddress: ADDRESSES.YieldStrategy, contractName: 'YieldStrategy', functionName: 'deployCapital', functionSelector: '0x4e71d92d', status: 'success', gasUsed: 65000 },
            { depth: 3, contractAddress: ADDRESSES.LendingPool, contractName: 'LendingPool', functionName: 'supply', functionSelector: '0x617ba037', status: 'success', gasUsed: 85000 },
        ]
    ),

    /**
     * TX2: User Withdraw - Success (6 steps, depth 4)
     * User withdraws 500 shares with yield
     */
    userWithdraw: (): TransactionFlow => buildMockFlow(
        '0xwithdraw234567890abcdef1234567890abcdef1234567890abcdef1234',
        [
            { depth: 0, contractAddress: ADDRESSES.VaultCore, contractName: 'VaultCore', functionName: 'withdraw', functionSelector: '0x2e1a7d4d', status: 'success', gasUsed: 48000 },
            { depth: 1, contractAddress: ADDRESSES.PriceOracle, contractName: 'PriceOracle', functionName: 'getPrice', functionSelector: '0x41976e09', status: 'success', gasUsed: 8000 },
            { depth: 1, contractAddress: ADDRESSES.StrategyManager, contractName: 'StrategyManager', functionName: 'withdrawFunds', functionSelector: '0x441a3e70', status: 'success', gasUsed: 52000 },
            { depth: 2, contractAddress: ADDRESSES.YieldStrategy, contractName: 'YieldStrategy', functionName: 'withdrawCapital', functionSelector: '0x5cffe9de', status: 'success', gasUsed: 60000 },
            { depth: 3, contractAddress: ADDRESSES.LendingPool, contractName: 'LendingPool', functionName: 'redeem', functionSelector: '0xdb006a75', status: 'success', gasUsed: 75000 },
            { depth: 1, contractAddress: ADDRESSES.USDC, contractName: 'USDC', functionName: 'transfer', functionSelector: '0xa9059cbb', status: 'success', gasUsed: 32000 },
        ]
    ),

    /**
     * TX3: Failed Withdraw - Revert (4 steps, depth 3)
     * User tries to withdraw more than available liquidity
     */
    failedWithdraw: (): TransactionFlow => buildMockFlow(
        '0xfailed0987654321fedcba0987654321fedcba0987654321fedcba0987',
        [
            { depth: 0, contractAddress: ADDRESSES.VaultCore, contractName: 'VaultCore', functionName: 'withdraw', functionSelector: '0x2e1a7d4d', status: 'success', gasUsed: 48000 },
            { depth: 1, contractAddress: ADDRESSES.StrategyManager, contractName: 'StrategyManager', functionName: 'withdrawFunds', functionSelector: '0x441a3e70', status: 'success', gasUsed: 52000 },
            { depth: 2, contractAddress: ADDRESSES.YieldStrategy, contractName: 'YieldStrategy', functionName: 'withdrawCapital', functionSelector: '0x5cffe9de', status: 'success', gasUsed: 45000 },
            { depth: 3, contractAddress: ADDRESSES.LendingPool, contractName: 'LendingPool', functionName: 'redeem', functionSelector: '0xdb006a75', status: 'revert', revertReason: 'LendingPool: Insufficient liquidity', gasUsed: 25000 },
        ]
    ),

    /**
     * TX4: Governance Rebalance - Success (7 steps, depth 4)
     * Governance triggers yield harvest and reallocation
     */
    governanceRebalance: (): TransactionFlow => buildMockFlow(
        '0xrebalance4567890abcdef1234567890abcdef1234567890abcdef12345',
        [
            { depth: 0, contractAddress: ADDRESSES.VaultCore, contractName: 'VaultCore', functionName: 'rebalance', functionSelector: '0x7d7c2a1c', status: 'success', gasUsed: 55000 },
            { depth: 1, contractAddress: ADDRESSES.StrategyManager, contractName: 'StrategyManager', functionName: 'harvestYield', functionSelector: '0x4641257d', status: 'success', gasUsed: 65000 },
            { depth: 2, contractAddress: ADDRESSES.YieldStrategy, contractName: 'YieldStrategy', functionName: 'claimRewards', functionSelector: '0x372500ab', status: 'success', gasUsed: 45000 },
            { depth: 2, contractAddress: ADDRESSES.PriceOracle, contractName: 'PriceOracle', functionName: 'getPrice', functionSelector: '0x41976e09', status: 'success', gasUsed: 8000 },
            { depth: 1, contractAddress: ADDRESSES.StrategyManager, contractName: 'StrategyManager', functionName: 'allocateFunds', functionSelector: '0x8f6ede1f', status: 'success', gasUsed: 55000 },
            { depth: 2, contractAddress: ADDRESSES.YieldStrategy, contractName: 'YieldStrategy', functionName: 'deployCapital', functionSelector: '0x4e71d92d', status: 'success', gasUsed: 65000 },
            { depth: 3, contractAddress: ADDRESSES.LendingPool, contractName: 'LendingPool', functionName: 'supply', functionSelector: '0x617ba037', status: 'success', gasUsed: 85000 },
        ]
    ),

    /**
     * TX5: Oracle Price Update - Success (2 steps, depth 1)
     * Keeper updates the oracle price
     */
    oracleUpdate: (): TransactionFlow => buildMockFlow(
        '0xoracle01234567890abcdef1234567890abcdef1234567890abcdef12345',
        [
            { depth: 0, contractAddress: ADDRESSES.PriceOracle, contractName: 'PriceOracle', functionName: 'updatePrice', functionSelector: '0x2baeceb7', status: 'success', gasUsed: 42000 },
            { depth: 1, contractAddress: ADDRESSES.PriceOracle, contractName: 'PriceOracle', functionName: 'getLatestRound', functionSelector: '0xfeaf968c', status: 'success', gasUsed: 5000 },
        ]
    ),

    // ============================================
    // ERROR SCENARIOS FOR HOTSPOT DETECTION
    // ============================================

    /**
     * TX6: Failed Deposit - USDC Approval Error (2 steps, depth 1)
     * User didn't approve USDC spending
     */
    failedDeposit: (): TransactionFlow => buildMockFlow(
        '0xfaildeposit1234567890abcdef1234567890abcdef1234567890abcd',
        [
            { depth: 0, contractAddress: ADDRESSES.VaultCore, contractName: 'VaultCore', functionName: 'deposit', functionSelector: '0xb6b55f25', status: 'success', gasUsed: 28000 },
            { depth: 1, contractAddress: ADDRESSES.USDC, contractName: 'USDC', functionName: 'transferFrom', functionSelector: '0x23b872dd', status: 'revert', revertReason: 'ERC20: insufficient allowance', gasUsed: 12000 },
        ]
    ),

    /**
     * TX7: Stale Oracle Revert (3 steps, depth 1)
     * Withdrawal fails due to stale price data
     */
    staleOracleRevert: (): TransactionFlow => buildMockFlow(
        '0xstaleoracle1234567890abcdef1234567890abcdef1234567890abc',
        [
            { depth: 0, contractAddress: ADDRESSES.VaultCore, contractName: 'VaultCore', functionName: 'withdraw', functionSelector: '0x2e1a7d4d', status: 'success', gasUsed: 35000 },
            { depth: 1, contractAddress: ADDRESSES.PriceOracle, contractName: 'PriceOracle', functionName: 'getPrice', functionSelector: '0x41976e09', status: 'revert', revertReason: 'Oracle: Price data stale', gasUsed: 8000 },
        ]
    ),

    /**
     * TX8: Strategy Paused (4 steps, depth 2)
     * Deposit fails because strategy is paused by governance
     */
    strategyPaused: (): TransactionFlow => buildMockFlow(
        '0xpaused0123456789abcdef1234567890abcdef1234567890abcdef12',
        [
            { depth: 0, contractAddress: ADDRESSES.VaultCore, contractName: 'VaultCore', functionName: 'deposit', functionSelector: '0xb6b55f25', status: 'success', gasUsed: 45000 },
            { depth: 1, contractAddress: ADDRESSES.USDC, contractName: 'USDC', functionName: 'transferFrom', functionSelector: '0x23b872dd', status: 'success', gasUsed: 35000 },
            { depth: 1, contractAddress: ADDRESSES.StrategyManager, contractName: 'StrategyManager', functionName: 'allocateFunds', functionSelector: '0x8f6ede1f', status: 'success', gasUsed: 40000 },
            { depth: 2, contractAddress: ADDRESSES.YieldStrategy, contractName: 'YieldStrategy', functionName: 'deployCapital', functionSelector: '0x4e71d92d', status: 'revert', revertReason: 'YieldStrategy: Contract paused', gasUsed: 15000 },
        ]
    ),

    /**
     * TX9: Unauthorized Rebalance (1 step, depth 0)
     * Non-governance address tries to rebalance
     */
    unauthorizedRebalance: (): TransactionFlow => buildMockFlow(
        '0xunauth012345678abcdef1234567890abcdef1234567890abcdef1234',
        [
            { depth: 0, contractAddress: ADDRESSES.VaultCore, contractName: 'VaultCore', functionName: 'rebalance', functionSelector: '0x7d7c2a1c', status: 'revert', revertReason: 'VaultCore: Caller is not governance', gasUsed: 8000 },
        ]
    ),
};

// ============================================
// Random Flow Generator (for bulk testing)
// ============================================

function mockStep(depth: number, forceRevert: boolean = false): ExecutionStep {
    const contractIndex = Math.min(depth, VAULTFI_CONTRACTS.length - 1);
    const contractName = VAULTFI_CONTRACTS[contractIndex];
    const functions = VAULTFI_FUNCTIONS[contractName] || ['execute'];
    const functionName = functions[Math.floor(Math.random() * functions.length)];
    const status = forceRevert ? 'revert' : 'success';

    return {
        depth,
        contractAddress: ADDRESSES[contractName as keyof typeof ADDRESSES] || randomHex(40),
        contractName,
        functionName,
        functionSelector: randomHex(8),
        status,
        revertReason: status === 'revert' ? `${contractName}: Operation failed` : undefined,
        gasUsed: Math.floor(Math.random() * 80000) + 20000,
    };
}

export function generateMockFlows(count: number = 10): TransactionFlow[] {
    const flows: TransactionFlow[] = [];

    for (let i = 0; i < count; i++) {
        const stepCount = Math.floor(Math.random() * 6) + 2;
        const maxDepth = Math.min(stepCount - 1, 4);
        const steps: ExecutionStep[] = [];

        let currentDepth = 0;
        for (let j = 0; j < stepCount; j++) {
            steps.push(mockStep(currentDepth, i === 0 && j === stepCount - 1));

            if (currentDepth < maxDepth && Math.random() > 0.3) {
                currentDepth++;
            } else if (currentDepth > 0 && Math.random() > 0.6) {
                currentDepth--;
            }
        }

        flows.push(buildMockFlow(mockTxHash(), steps));
    }

    return flows;
}

// ============================================
// Exports
// ============================================

export function generateMockTrace(): HardhatTrace {
    return {} as HardhatTrace; // Placeholder
}

export function generateMockIngestRequest(): HardhatIngestRequest {
    return {} as HardhatIngestRequest; // Placeholder
}

export default { generateMockTrace, generateMockIngestRequest, generateMockFlows, PREDEFINED_MOCKS };

