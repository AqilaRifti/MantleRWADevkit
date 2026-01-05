'use client';

/**
 * useRWA - Core hook for accessing the RWA SDK client
 * 
 * Provides access to the @mantle-rwa/sdk RWAClient instance with
 * automatic wagmi wallet integration.
 * 
 * @example
 * ```typescript
 * import { useRWA } from '@mantle-rwa/react';
 * 
 * function MyComponent() {
 *   const { client, isInitialized, hasSigner } = useRWA();
 *   
 *   if (!isInitialized) return <div>Loading...</div>;
 *   
 *   // Use client.token, client.kyc, client.yield, client.compliance
 * }
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider } from 'ethers';
import { RWAClient } from '@mantle-rwa/sdk';
import type { UseRWAConfig, UseRWAReturn, ContractAddresses } from '../types';

// Default contract addresses (can be overridden via config)
const DEFAULT_CONTRACTS: ContractAddresses = {
    token: undefined,
    kycRegistry: undefined,
    yieldDistributor: undefined,
    assetVault: undefined,
    factory: undefined,
};

/**
 * Hook for initializing and managing the RWA SDK client
 * 
 * @param config - Optional configuration for network and contract addresses
 * @returns UseRWAReturn object with client, state, and utilities
 */
export function useRWA(config?: UseRWAConfig): UseRWAReturn {
    const { isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();

    const [client, setClient] = useState<RWAClient | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const network = config?.network ?? 'mantle-sepolia';

    // Initialize or reinitialize the client
    const initializeClient = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            let rwaClient: RWAClient;

            if (walletClient && isConnected) {
                // Create client with wallet signer for write operations
                const provider = new BrowserProvider(walletClient.transport);
                const signer = await provider.getSigner();

                rwaClient = new RWAClient({
                    network,
                    signer,
                });
            } else {
                // Create read-only client (no signer)
                rwaClient = new RWAClient({
                    network,
                });
            }

            setClient(rwaClient);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to initialize RWA client';
            setError(new Error(errorMessage));
            setClient(null);
        } finally {
            setIsLoading(false);
        }
    }, [walletClient, isConnected, network]);

    // Initialize client on mount and when wallet changes
    useEffect(() => {
        initializeClient();
    }, [initializeClient]);

    // Memoized contract addresses
    const contracts = useMemo<ContractAddresses>(() => ({
        ...DEFAULT_CONTRACTS,
        ...config?.contracts,
    }), [config?.contracts]);

    return {
        client,
        isInitialized: client !== null && !isLoading,
        isLoading,
        error,
        hasSigner: client?.hasSigner ?? false,
        contracts,
        reinitialize: initializeClient,
    };
}

export default useRWA;
