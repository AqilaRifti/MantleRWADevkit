'use client';

/**
 * useKYC - Hook for KYC registry operations using the SDK KYCModule
 * 
 * Provides read and write operations for KYC verification including
 * status checks, investor management, and accreditation queries.
 * 
 * @example
 * ```typescript
 * import { useKYC } from '@/hooks/use-kyc';
 * 
 * function KYCStatus() {
 *   const { isVerified, investorInfo, addInvestor } = useKYC(registryAddress);
 *   
 *   return (
 *     <div>
 *       <p>Verified: {isVerified ? 'Yes' : 'No'}</p>
 *       <p>Tier: {investorInfo?.tier}</p>
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useRWAClient } from './use-rwa-client';
import { AccreditationTier, type InvestorData, type TransactionResult } from '@mantle-rwa/sdk';

/**
 * Input for adding an investor
 */
export interface InvestorInput {
    address: string;
    tier: AccreditationTier;
    expiryDate: Date;
    identityHash: string;
}

/**
 * Return type for useKYC hook
 */
export interface UseKYCReturn {
    /** Whether the current user is verified */
    isVerified: boolean | null;
    /** Whether the current user is accredited */
    isAccredited: boolean | null;
    /** Current user's investor information */
    investorInfo: InvestorData | null;
    /** Whether data is loading */
    isLoading: boolean;
    /** Error that occurred */
    error: Error | null;
    /** Whether a write operation is pending */
    isPending: boolean;

    // Write operations
    /** Add an investor to the registry */
    addInvestor: (
        investor: string,
        tier: AccreditationTier,
        expiryDate: Date,
        identityHash: string
    ) => Promise<TransactionResult>;
    /** Update an investor's information */
    updateInvestor: (
        investor: string,
        tier: AccreditationTier,
        expiryDate: Date
    ) => Promise<TransactionResult>;
    /** Remove an investor from the registry */
    removeInvestor: (investor: string) => Promise<TransactionResult>;
    /** Batch add multiple investors */
    batchAddInvestors: (investors: InvestorInput[]) => Promise<TransactionResult>;

    // Query operations
    /** Check if an address is verified */
    checkIsVerified: (investor: string) => Promise<boolean>;
    /** Check accreditation tier of an address */
    checkAccreditation: (investor: string) => Promise<AccreditationTier>;
    /** Get investor info for any address */
    getInvestorInfo: (investor: string) => Promise<InvestorData>;
    /** Refetch KYC data */
    refetch: () => Promise<void>;
}

/**
 * Hook for KYC registry operations
 * @param registryAddress - The KYC registry contract address
 * @param investorAddress - Optional specific investor address to query (defaults to connected wallet)
 */
export function useKYC(registryAddress: string, investorAddress?: string): UseKYCReturn {
    const { client, isInitialized } = useRWAClient();
    const { address: userAddress } = useAccount();

    const targetAddress = investorAddress || userAddress;

    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const [isAccredited, setIsAccredited] = useState<boolean | null>(null);
    const [investorInfo, setInvestorInfo] = useState<InvestorData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isPending, setIsPending] = useState(false);

    // Fetch KYC data
    const fetchKYCData = useCallback(async () => {
        if (!client || !isInitialized || !registryAddress) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const registry = client.kyc.connect(registryAddress);

            if (targetAddress) {
                // Fetch verification status
                const verified = await registry.isVerified(targetAddress);
                setIsVerified(verified);

                // Fetch accreditation status
                const accredited = await registry.isAccredited(targetAddress);
                setIsAccredited(accredited);

                // Fetch full investor info
                const info = await registry.getInvestorInfo(targetAddress);
                setInvestorInfo(info);
            } else {
                setIsVerified(null);
                setIsAccredited(null);
                setInvestorInfo(null);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch KYC data';
            setError(new Error(errorMessage));
        } finally {
            setIsLoading(false);
        }
    }, [client, isInitialized, registryAddress, targetAddress]);

    // Fetch data on mount and when dependencies change
    useEffect(() => {
        fetchKYCData();
    }, [fetchKYCData]);

    // Add investor
    const addInvestor = useCallback(async (
        investor: string,
        tier: AccreditationTier,
        expiryDate: Date,
        identityHash: string
    ): Promise<TransactionResult> => {
        if (!client || !registryAddress) {
            throw new Error('Client not initialized or registry address not provided');
        }

        setIsPending(true);
        setError(null);

        try {
            const registry = client.kyc.connect(registryAddress);
            const result = await registry.addInvestor(investor, tier, expiryDate, identityHash);
            await fetchKYCData(); // Refresh data
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Add investor failed';
            const error = new Error(errorMessage);
            setError(error);
            throw error;
        } finally {
            setIsPending(false);
        }
    }, [client, registryAddress, fetchKYCData]);

    // Update investor
    const updateInvestor = useCallback(async (
        investor: string,
        tier: AccreditationTier,
        expiryDate: Date
    ): Promise<TransactionResult> => {
        if (!client || !registryAddress) {
            throw new Error('Client not initialized or registry address not provided');
        }

        setIsPending(true);
        setError(null);

        try {
            const registry = client.kyc.connect(registryAddress);
            const result = await registry.updateInvestor(investor, tier, expiryDate);
            await fetchKYCData(); // Refresh data
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Update investor failed';
            const error = new Error(errorMessage);
            setError(error);
            throw error;
        } finally {
            setIsPending(false);
        }
    }, [client, registryAddress, fetchKYCData]);

    // Remove investor
    const removeInvestor = useCallback(async (investor: string): Promise<TransactionResult> => {
        if (!client || !registryAddress) {
            throw new Error('Client not initialized or registry address not provided');
        }

        setIsPending(true);
        setError(null);

        try {
            const registry = client.kyc.connect(registryAddress);
            const result = await registry.removeInvestor(investor);
            await fetchKYCData(); // Refresh data
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Remove investor failed';
            const error = new Error(errorMessage);
            setError(error);
            throw error;
        } finally {
            setIsPending(false);
        }
    }, [client, registryAddress, fetchKYCData]);

    // Batch add investors
    const batchAddInvestors = useCallback(async (
        investors: InvestorInput[]
    ): Promise<TransactionResult> => {
        if (!client || !registryAddress) {
            throw new Error('Client not initialized or registry address not provided');
        }

        setIsPending(true);
        setError(null);

        try {
            const registry = client.kyc.connect(registryAddress);
            const result = await registry.batchAddInvestors(investors);
            await fetchKYCData(); // Refresh data
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Batch add failed';
            const error = new Error(errorMessage);
            setError(error);
            throw error;
        } finally {
            setIsPending(false);
        }
    }, [client, registryAddress, fetchKYCData]);

    // Check if address is verified
    const checkIsVerified = useCallback(async (investor: string): Promise<boolean> => {
        if (!client || !registryAddress) {
            throw new Error('Client not initialized or registry address not provided');
        }

        try {
            const registry = client.kyc.connect(registryAddress);
            return await registry.isVerified(investor);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Verification check failed';
            throw new Error(errorMessage);
        }
    }, [client, registryAddress]);

    // Check accreditation tier
    const checkAccreditation = useCallback(async (investor: string): Promise<AccreditationTier> => {
        if (!client || !registryAddress) {
            throw new Error('Client not initialized or registry address not provided');
        }

        try {
            return await client.kyc.checkAccreditation(registryAddress, investor);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Accreditation check failed';
            throw new Error(errorMessage);
        }
    }, [client, registryAddress]);

    // Get investor info for any address
    const getInvestorInfoFn = useCallback(async (investor: string): Promise<InvestorData> => {
        if (!client || !registryAddress) {
            throw new Error('Client not initialized or registry address not provided');
        }

        try {
            const registry = client.kyc.connect(registryAddress);
            return await registry.getInvestorInfo(investor);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Get investor info failed';
            throw new Error(errorMessage);
        }
    }, [client, registryAddress]);

    return {
        isVerified,
        isAccredited,
        investorInfo,
        isLoading,
        error,
        isPending,
        addInvestor,
        updateInvestor,
        removeInvestor,
        batchAddInvestors,
        checkIsVerified,
        checkAccreditation,
        getInvestorInfo: getInvestorInfoFn,
        refetch: fetchKYCData,
    };
}

/**
 * Code snippets for documentation display
 */
export const KYC_CODE_SNIPPETS = {
    isVerified: `// Check if investor is verified
const registry = client.kyc.connect(registryAddress);
const isVerified = await registry.isVerified(investorAddress);
// Returns: boolean`,

    getInvestorInfo: `// Get full investor information
const registry = client.kyc.connect(registryAddress);
const info = await registry.getInvestorInfo(investorAddress);
// Returns: { verified, tier, expiry, identityHash }`,

    addInvestor: `// Add investor to registry (requires KYC_ADMIN_ROLE)
const registry = client.kyc.connect(registryAddress);
const result = await registry.addInvestor(
  investorAddress,
  AccreditationTier.Accredited,
  new Date('2025-12-31'),
  identityHash
);`,

    batchAddInvestors: `// Batch add multiple investors
const registry = client.kyc.connect(registryAddress);
const result = await registry.batchAddInvestors([
  { address: addr1, tier: AccreditationTier.Retail, expiryDate, identityHash: hash1 },
  { address: addr2, tier: AccreditationTier.Accredited, expiryDate, identityHash: hash2 },
]);`,

    checkAccreditation: `// Check accreditation tier
const tier = await client.kyc.checkAccreditation(registryAddress, investorAddress);
// Returns: AccreditationTier enum (None, Retail, Accredited, Institutional)`,
};

// Re-export AccreditationTier for convenience
export { AccreditationTier };

export default useKYC;
