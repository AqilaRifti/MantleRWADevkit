/**
 * Type definitions for @mantle-rwa/react
 */

// Re-export relevant types from SDK
export {
    AccreditationTier,
    type TokenInfo,
    type InvestorData,
    type TransactionResult,
    type Distribution,
    type DistributionPreview,
    type HolderDistribution,
    type PendingClaim,
    type VerificationSession,
    type NetworkConfig,
} from '@mantle-rwa/sdk';

import type { RWAClient, TransactionResult, AccreditationTier, DistributionPreview } from '@mantle-rwa/sdk';

/*//////////////////////////////////////////////////////////////
                        CONTRACT ADDRESSES
//////////////////////////////////////////////////////////////*/

/**
 * Contract addresses configuration
 */
export interface ContractAddresses {
    /** RWA token contract address */
    token?: string;
    /** KYC registry contract address */
    kycRegistry?: string;
    /** Yield distributor contract address */
    yieldDistributor?: string;
    /** Asset vault contract address */
    assetVault?: string;
    /** RWA factory contract address */
    factory?: string;
}

/*//////////////////////////////////////////////////////////////
                        HOOK TYPES
//////////////////////////////////////////////////////////////*/

/**
 * Configuration for useRWA hook
 */
export interface UseRWAConfig {
    /** Network to connect to (default: 'mantle-sepolia') */
    network?: 'mantle' | 'mantle-sepolia';
    /** Contract addresses configuration */
    contracts?: ContractAddresses;
}

/**
 * Return type for useRWA hook
 */
export interface UseRWAReturn {
    /** The RWAClient instance (null if not initialized) */
    client: RWAClient | null;
    /** Whether the client is initialized and ready */
    isInitialized: boolean;
    /** Whether the client is currently initializing */
    isLoading: boolean;
    /** Error that occurred during initialization */
    error: Error | null;
    /** Whether a signer is available (wallet connected) */
    hasSigner: boolean;
    /** Contract addresses */
    contracts: ContractAddresses;
    /** Reinitialize the client */
    reinitialize: () => Promise<void>;
}

/*//////////////////////////////////////////////////////////////
                        COMPONENT PROPS
//////////////////////////////////////////////////////////////*/

/**
 * Verification status for KYC flow
 */
export type VerificationStatus = 'idle' | 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Props for KYCFlow component
 */
export interface KYCFlowProps {
    /** KYC registry contract address */
    registryAddress: string;
    /** Investor address to verify (defaults to connected wallet) */
    investorAddress?: string;
    /** Callback when verification status changes */
    onStatusChange?: (status: VerificationStatus) => void;
    /** Callback when verification completes successfully */
    onComplete?: (tier: AccreditationTier) => void;
    /** Callback when an error occurs */
    onError?: (error: Error) => void;
    /** Custom CSS class */
    className?: string;
}

/**
 * Props for InvestorDashboard component
 */
export interface InvestorDashboardProps {
    /** RWA token contract address */
    tokenAddress: string;
    /** KYC registry contract address */
    kycRegistryAddress: string;
    /** Yield distributor contract address */
    yieldDistributorAddress: string;
    /** Investor address (defaults to connected wallet) */
    investorAddress?: string;
    /** Callback when yield claim succeeds */
    onClaimSuccess?: (result: TransactionResult) => void;
    /** Callback when an error occurs */
    onError?: (error: Error) => void;
    /** Custom CSS class */
    className?: string;
}

/**
 * Props for TokenMintForm component
 */
export interface TokenMintFormProps {
    /** RWA token contract address */
    tokenAddress: string;
    /** KYC registry contract address */
    kycRegistryAddress: string;
    /** Callback when mint succeeds */
    onSuccess?: (result: TransactionResult) => void;
    /** Callback when an error occurs */
    onError?: (error: Error) => void;
    /** Custom CSS class */
    className?: string;
}

/**
 * Props for YieldCalculator component
 */
export interface YieldCalculatorProps {
    /** RWA token contract address */
    tokenAddress: string;
    /** Yield distributor contract address */
    yieldDistributorAddress: string;
    /** Optional list of holder addresses to include in preview */
    holderAddresses?: string[];
    /** Callback when calculation completes */
    onCalculate?: (preview: DistributionPreview) => void;
    /** Callback when an error occurs */
    onError?: (error: Error) => void;
    /** Custom CSS class */
    className?: string;
}

/*//////////////////////////////////////////////////////////////
                        UTILITY TYPES
//////////////////////////////////////////////////////////////*/

/**
 * Common loading state interface
 */
export interface LoadingState {
    /** Whether data is loading */
    isLoading: boolean;
    /** Error that occurred */
    error: Error | null;
}

/**
 * Transaction state interface
 */
export interface TransactionState extends LoadingState {
    /** Whether a transaction is pending */
    isPending: boolean;
    /** Transaction hash if available */
    txHash: string | null;
}

/**
 * Props for ErrorDisplay component
 */
export interface ErrorDisplayProps {
    /** Error to display */
    error: Error;
    /** Callback for retry action */
    onRetry?: () => void;
    /** Custom CSS class */
    className?: string;
}

/**
 * Props for LoadingSpinner component
 */
export interface LoadingSpinnerProps {
    /** Size of the spinner */
    size?: 'sm' | 'md' | 'lg';
    /** Custom CSS class */
    className?: string;
}
