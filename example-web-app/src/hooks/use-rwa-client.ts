'use client';

/**
 * useRWAClient - Hook for initializing and managing the RWA SDK client
 * 
 * This hook provides access to the @mantle-rwa/sdk RWAClient instance,
 * automatically integrating with the connected wallet's signer.
 * 
 * @example
 * ```typescript
 * import { useRWAClient } from '@/hooks/use-rwa-client';
 * 
 * function MyComponent() {
 *   const { client, isInitialized, error, networkInfo } = useRWAClient();
 *   
 *   if (!isInitialized) return <div>Initializing SDK...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   
 *   // Use client.token, client.kyc, client.yield, client.compliance
 * }
 * ```
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider } from 'ethers';
import { RWAClient, type RWAClientConfig } from '@mantle-rwa/sdk';
import { contractAddresses } from '@/config/wagmi';

/**
 * Network information for display
 */
export interface NetworkInfo {
    chainId: number;
    name: string;
    rpcUrl: string;
    explorerUrl: string;
}

/**
 * Contract addresses configuration
 */
export interface ContractAddresses {
    rwaToken: string;
    kycRegistry: string;
    yieldDistributor: string;
    assetVault: string;
    rwaFactory: string;
}

/**
 * Return type for useRWAClient hook
 */
export interface UseRWAClientReturn {
    /** The RWAClient instance (null if not initialized) */
    client: RWAClient | null;
    /** Whether the client is initialized and ready */
    isInitialized: boolean;
    /** Whether the client is currently initializing */
    isLoading: boolean;
    /** Error that occurred during initialization */
    error: Error | null;
    /** Network information */
    networkInfo: NetworkInfo | null;
    /** Contract addresses */
    contractAddresses: ContractAddresses;
    /** Whether a signer is available (wallet connected) */
    hasSigner: boolean;
    /** Reinitialize the client */
    reinitialize: () => Promise<void>;
}

// Mantle Sepolia network configuration
const MANTLE_SEPOLIA_CONFIG: NetworkInfo = {
    chainId: 5003,
    name: 'Mantle Sepolia',
    rpcUrl: 'https://rpc.sepolia.mantle.xyz',
    explorerUrl: 'https://sepolia.mantlescan.xyz',
};

/**
 * Hook for initializing and managing the RWA SDK client
 */
export function useRWAClient(): UseRWAClientReturn {
    const { address, isConnected, chain } = useAccount();
    const { data: walletClient } = useWalletClient();

    const [client, setClient] = useState<RWAClient | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Initialize or reinitialize the client
    const initializeClient = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            let rwaClient: RWAClient;

            if (walletClient && isConnected) {
                // Create client with wallet signer
                const provider = new BrowserProvider(walletClient.transport);
                const signer = await provider.getSigner();

                rwaClient = new RWAClient({
                    network: 'mantle-sepolia',
                    signer,
                });
            } else {
                // Create read-only client (no signer)
                rwaClient = new RWAClient({
                    network: 'mantle-sepolia',
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
    }, [walletClient, isConnected]);

    // Initialize client on mount and when wallet changes
    useEffect(() => {
        initializeClient();
    }, [initializeClient]);

    // Memoized network info
    const networkInfo = useMemo<NetworkInfo | null>(() => {
        if (!client) return null;

        // Use connected chain info if available, otherwise default to Mantle Sepolia
        if (chain) {
            return {
                chainId: chain.id,
                name: chain.name,
                rpcUrl: MANTLE_SEPOLIA_CONFIG.rpcUrl,
                explorerUrl: chain.blockExplorers?.default?.url || MANTLE_SEPOLIA_CONFIG.explorerUrl,
            };
        }

        return MANTLE_SEPOLIA_CONFIG;
    }, [client, chain]);

    // Memoized contract addresses
    const addresses = useMemo<ContractAddresses>(() => ({
        rwaToken: contractAddresses.rwaToken,
        kycRegistry: contractAddresses.kycRegistry,
        yieldDistributor: contractAddresses.yieldDistributor,
        assetVault: contractAddresses.assetVault,
        rwaFactory: contractAddresses.rwaFactory,
    }), []);

    return {
        client,
        isInitialized: client !== null && !isLoading,
        isLoading,
        error,
        networkInfo,
        contractAddresses: addresses,
        hasSigner: client?.hasSigner ?? false,
        reinitialize: initializeClient,
    };
}

/**
 * Code snippet for documentation display
 */
export const USE_RWA_CLIENT_CODE = `import { RWAClient } from '@mantle-rwa/sdk';
import { BrowserProvider } from 'ethers';

// Initialize with wallet signer
const provider = new BrowserProvider(walletClient.transport);
const signer = await provider.getSigner();

const client = new RWAClient({
  network: 'mantle-sepolia',
  signer,
});

// Access SDK modules
const tokenModule = client.token;
const kycModule = client.kyc;
const yieldModule = client.yield;
const complianceModule = client.compliance;`;

export default useRWAClient;
