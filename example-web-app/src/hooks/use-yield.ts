'use client';

/**
 * useYield - Hook for yield distribution operations using the SDK YieldModule
 * 
 * Provides read and write operations for yield distributions including
 * creating distributions, claiming yields, and previewing distributions.
 * 
 * @example
 * ```typescript
 * import { useYield } from '@/hooks/use-yield';
 * 
 * function YieldDashboard() {
 *   const { distributions, pendingClaims, claim, previewDistribution } = useYield(
 *     distributorAddress,
 *     tokenAddress
 *   );
 *   
 *   return (
 *     <div>
 *       <p>Distributions: {distributions.length}</p>
 *       <p>Pending Claims: {pendingClaims.length}</p>
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useRWAClient } from './use-rwa-client';
import type {
    Distribution,
    DistributionPreview,
    PendingClaim,
    TransactionResult,
} from '@mantle-rwa/sdk';

/**
 * Return type for useYield hook
 */
export interface UseYieldReturn {
    /** List of all distributions */
    distributions: Distribution[];
    /** Pending claims for the current user */
    pendingClaims: PendingClaim[];
    /** Total claimable amount for current user */
    totalClaimable: bigint;
    /** Whether data is loading */
    isLoading: boolean;
    /** Error that occurred */
    error: Error | null;
    /** Whether a write operation is pending */
    isPending: boolean;

    // Write operations
    /** Create a new distribution */
    createDistribution: (
        paymentToken: string,
        amount: string,
        claimWindowDays?: number
    ) => Promise<{ result: TransactionResult; distributionId: number }>;
    /** Claim yield from a specific distribution */
    claim: (distributionId: number) => Promise<TransactionResult>;
    /** Claim all pending yields */
    claimAll: () => Promise<TransactionResult>;

    // Query operations
    /** Preview a distribution (calculate per-holder amounts) */
    previewDistribution: (
        totalAmount: string,
        holderAddresses?: string[]
    ) => Promise<DistributionPreview>;
    /** Get claimable amount for a specific distribution */
    getClaimableAmount: (distributionId: number, account: string) => Promise<bigint>;
    /** Check if account has claimed from a distribution */
    hasClaimed: (distributionId: number, account: string) => Promise<boolean>;
    /** Refetch yield data */
    refetch: () => Promise<void>;
}

/**
 * Hook for yield distribution operations
 * @param distributorAddress - The yield distributor contract address
 * @param tokenAddress - The RWA token address (for preview calculations)
 */
export function useYield(distributorAddress: string, tokenAddress: string): UseYieldReturn {
    const { client, isInitialized } = useRWAClient();
    const { address: userAddress } = useAccount();

    const [distributions, setDistributions] = useState<Distribution[]>([]);
    const [pendingClaims, setPendingClaims] = useState<PendingClaim[]>([]);
    const [totalClaimable, setTotalClaimable] = useState<bigint>(0n);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isPending, setIsPending] = useState(false);

    // Fetch yield data
    const fetchYieldData = useCallback(async () => {
        if (!client || !isInitialized || !distributorAddress) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const distributor = client.yield.connect(distributorAddress);

            // Fetch distribution history
            const history = await distributor.getDistributionHistory();
            setDistributions(history);

            // Fetch pending claims for current user
            if (userAddress) {
                const claims = await distributor.getPendingClaims(userAddress);
                setPendingClaims(claims);

                // Calculate total claimable
                const total = claims.reduce((sum, claim) => sum + claim.amount, 0n);
                setTotalClaimable(total);
            } else {
                setPendingClaims([]);
                setTotalClaimable(0n);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch yield data';
            setError(new Error(errorMessage));
        } finally {
            setIsLoading(false);
        }
    }, [client, isInitialized, distributorAddress, userAddress]);

    // Fetch data on mount and when dependencies change
    useEffect(() => {
        fetchYieldData();
    }, [fetchYieldData]);

    // Create distribution
    const createDistribution = useCallback(async (
        paymentToken: string,
        amount: string,
        claimWindowDays: number = 30
    ): Promise<{ result: TransactionResult; distributionId: number }> => {
        if (!client || !distributorAddress) {
            throw new Error('Client not initialized or distributor address not provided');
        }

        setIsPending(true);
        setError(null);

        try {
            const distributor = client.yield.connect(distributorAddress);
            const result = await distributor.createDistribution(paymentToken, amount, claimWindowDays);
            await fetchYieldData(); // Refresh data
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Create distribution failed';
            const error = new Error(errorMessage);
            setError(error);
            throw error;
        } finally {
            setIsPending(false);
        }
    }, [client, distributorAddress, fetchYieldData]);

    // Claim yield
    const claim = useCallback(async (distributionId: number): Promise<TransactionResult> => {
        if (!client || !distributorAddress) {
            throw new Error('Client not initialized or distributor address not provided');
        }

        setIsPending(true);
        setError(null);

        try {
            const distributor = client.yield.connect(distributorAddress);
            const result = await distributor.claim(distributionId);
            await fetchYieldData(); // Refresh data
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Claim failed';
            const error = new Error(errorMessage);
            setError(error);
            throw error;
        } finally {
            setIsPending(false);
        }
    }, [client, distributorAddress, fetchYieldData]);

    // Claim all pending yields
    const claimAll = useCallback(async (): Promise<TransactionResult> => {
        if (!client || !distributorAddress) {
            throw new Error('Client not initialized or distributor address not provided');
        }

        if (pendingClaims.length === 0) {
            throw new Error('No pending claims to process');
        }

        setIsPending(true);
        setError(null);

        try {
            const distributor = client.yield.connect(distributorAddress);
            const distributionIds = pendingClaims.map(c => c.distributionId);
            const result = await distributor.claimMultiple(distributionIds);
            await fetchYieldData(); // Refresh data
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Claim all failed';
            const error = new Error(errorMessage);
            setError(error);
            throw error;
        } finally {
            setIsPending(false);
        }
    }, [client, distributorAddress, pendingClaims, fetchYieldData]);

    // Preview distribution
    const previewDistribution = useCallback(async (
        totalAmount: string,
        holderAddresses?: string[]
    ): Promise<DistributionPreview> => {
        if (!client || !tokenAddress) {
            throw new Error('Client not initialized or token address not provided');
        }

        try {
            return await client.yield.previewDistribution(
                tokenAddress,
                totalAmount,
                undefined, // snapshotId
                holderAddresses
            );
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Preview failed';
            throw new Error(errorMessage);
        }
    }, [client, tokenAddress]);

    // Get claimable amount
    const getClaimableAmount = useCallback(async (
        distributionId: number,
        account: string
    ): Promise<bigint> => {
        if (!client || !distributorAddress) {
            throw new Error('Client not initialized or distributor address not provided');
        }

        try {
            const distributor = client.yield.connect(distributorAddress);
            return await distributor.getClaimableAmount(distributionId, account);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Get claimable amount failed';
            throw new Error(errorMessage);
        }
    }, [client, distributorAddress]);

    // Check if claimed
    const hasClaimed = useCallback(async (
        distributionId: number,
        account: string
    ): Promise<boolean> => {
        if (!client || !distributorAddress) {
            throw new Error('Client not initialized or distributor address not provided');
        }

        try {
            const distributor = client.yield.connect(distributorAddress);
            return await distributor.hasClaimed(distributionId, account);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Has claimed check failed';
            throw new Error(errorMessage);
        }
    }, [client, distributorAddress]);

    return {
        distributions,
        pendingClaims,
        totalClaimable,
        isLoading,
        error,
        isPending,
        createDistribution,
        claim,
        claimAll,
        previewDistribution,
        getClaimableAmount,
        hasClaimed,
        refetch: fetchYieldData,
    };
}

/**
 * Code snippets for documentation display
 */
export const YIELD_CODE_SNIPPETS = {
    getDistributionHistory: `// Get all distributions
const distributor = client.yield.connect(distributorAddress);
const distributions = await distributor.getDistributionHistory();
// Returns: Distribution[]`,

    getPendingClaims: `// Get pending claims for an account
const distributor = client.yield.connect(distributorAddress);
const claims = await distributor.getPendingClaims(accountAddress);
// Returns: PendingClaim[]`,

    previewDistribution: `// Preview distribution amounts
const preview = await client.yield.previewDistribution(
  tokenAddress,
  "10000", // total amount
  undefined, // snapshotId (optional)
  holderAddresses // optional array of addresses
);
// Returns: { totalHolders, totalSupplyAtSnapshot, distributions }`,

    createDistribution: `// Create a new distribution
const distributor = client.yield.connect(distributorAddress);
const { result, distributionId } = await distributor.createDistribution(
  paymentTokenAddress,
  "10000", // total amount
  30 // claim window in days
);`,

    claim: `// Claim yield from a distribution
const distributor = client.yield.connect(distributorAddress);
const result = await distributor.claim(distributionId);`,

    claimMultiple: `// Claim from multiple distributions
const distributor = client.yield.connect(distributorAddress);
const result = await distributor.claimMultiple([0, 1, 2]);`,
};

export default useYield;
