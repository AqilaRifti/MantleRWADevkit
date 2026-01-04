'use client';

/**
 * useToken - Hook for RWA token operations using the SDK TokenModule
 * 
 * Provides read and write operations for RWA tokens including balance queries,
 * transfers, minting, and pause/unpause functionality.
 * 
 * @example
 * ```typescript
 * import { useToken } from '@/hooks/use-token';
 * 
 * function TokenBalance() {
 *   const { tokenInfo, balance, isLoading, mint, transfer } = useToken(tokenAddress);
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   
 *   return (
 *     <div>
 *       <p>Token: {tokenInfo?.name} ({tokenInfo?.symbol})</p>
 *       <p>Balance: {balance?.toString()}</p>
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useRWAClient } from './use-rwa-client';
import type { TokenInfo, TransactionResult } from '@mantle-rwa/sdk';

/**
 * Transfer eligibility check result
 */
export interface TransferAllowedResult {
    allowed: boolean;
    reason: string;
}

/**
 * Return type for useToken hook
 */
export interface UseTokenReturn {
    /** Token information (name, symbol, supply, etc.) */
    tokenInfo: TokenInfo | null;
    /** Current user's token balance */
    balance: bigint | null;
    /** Whether data is loading */
    isLoading: boolean;
    /** Error that occurred */
    error: Error | null;
    /** Whether a write operation is pending */
    isPending: boolean;

    // Write operations
    /** Mint tokens to an address */
    mint: (to: string, amount: string) => Promise<TransactionResult>;
    /** Transfer tokens to an address */
    transfer: (to: string, amount: string) => Promise<TransactionResult>;
    /** Burn tokens from an address */
    burn: (from: string, amount: string) => Promise<TransactionResult>;
    /** Pause token transfers */
    pause: () => Promise<TransactionResult>;
    /** Unpause token transfers */
    unpause: () => Promise<TransactionResult>;

    // Query operations
    /** Check if a transfer is allowed */
    checkTransferAllowed: (from: string, to: string, amount: string) => Promise<TransferAllowedResult>;
    /** Get balance of any address */
    getBalanceOf: (account: string) => Promise<bigint>;
    /** Refetch token data */
    refetch: () => Promise<void>;
}

/**
 * Hook for RWA token operations
 * @param tokenAddress - The RWA token contract address
 */
export function useToken(tokenAddress: string): UseTokenReturn {
    const { client, isInitialized } = useRWAClient();
    const { address: userAddress } = useAccount();

    const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
    const [balance, setBalance] = useState<bigint | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isPending, setIsPending] = useState(false);

    // Fetch token data
    const fetchTokenData = useCallback(async () => {
        if (!client || !isInitialized || !tokenAddress) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const token = client.token.connect(tokenAddress);

            // Fetch token info
            const info = await token.getInfo();
            setTokenInfo(info);

            // Fetch user balance if connected
            if (userAddress) {
                const userBalance = await token.balanceOf(userAddress);
                setBalance(userBalance);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch token data';
            setError(new Error(errorMessage));
        } finally {
            setIsLoading(false);
        }
    }, [client, isInitialized, tokenAddress, userAddress]);

    // Fetch data on mount and when dependencies change
    useEffect(() => {
        fetchTokenData();
    }, [fetchTokenData]);

    // Mint tokens
    const mint = useCallback(async (to: string, amount: string): Promise<TransactionResult> => {
        if (!client || !tokenAddress) {
            throw new Error('Client not initialized or token address not provided');
        }

        setIsPending(true);
        setError(null);

        try {
            const token = client.token.connect(tokenAddress);
            const result = await token.mint(to, amount);
            await fetchTokenData(); // Refresh data after mint
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Mint failed';
            const error = new Error(errorMessage);
            setError(error);
            throw error;
        } finally {
            setIsPending(false);
        }
    }, [client, tokenAddress, fetchTokenData]);

    // Transfer tokens
    const transfer = useCallback(async (to: string, amount: string): Promise<TransactionResult> => {
        if (!client || !tokenAddress) {
            throw new Error('Client not initialized or token address not provided');
        }

        setIsPending(true);
        setError(null);

        try {
            const token = client.token.connect(tokenAddress);
            const result = await token.transfer(to, amount);
            await fetchTokenData(); // Refresh data after transfer
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Transfer failed';
            const error = new Error(errorMessage);
            setError(error);
            throw error;
        } finally {
            setIsPending(false);
        }
    }, [client, tokenAddress, fetchTokenData]);

    // Burn tokens
    const burn = useCallback(async (from: string, amount: string): Promise<TransactionResult> => {
        if (!client || !tokenAddress) {
            throw new Error('Client not initialized or token address not provided');
        }

        setIsPending(true);
        setError(null);

        try {
            const token = client.token.connect(tokenAddress);
            const result = await token.burn(from, amount);
            await fetchTokenData(); // Refresh data after burn
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Burn failed';
            const error = new Error(errorMessage);
            setError(error);
            throw error;
        } finally {
            setIsPending(false);
        }
    }, [client, tokenAddress, fetchTokenData]);

    // Pause token
    const pause = useCallback(async (): Promise<TransactionResult> => {
        if (!client || !tokenAddress) {
            throw new Error('Client not initialized or token address not provided');
        }

        setIsPending(true);
        setError(null);

        try {
            const token = client.token.connect(tokenAddress);
            const result = await token.pause();
            await fetchTokenData(); // Refresh data after pause
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Pause failed';
            const error = new Error(errorMessage);
            setError(error);
            throw error;
        } finally {
            setIsPending(false);
        }
    }, [client, tokenAddress, fetchTokenData]);

    // Unpause token
    const unpause = useCallback(async (): Promise<TransactionResult> => {
        if (!client || !tokenAddress) {
            throw new Error('Client not initialized or token address not provided');
        }

        setIsPending(true);
        setError(null);

        try {
            const token = client.token.connect(tokenAddress);
            const result = await token.unpause();
            await fetchTokenData(); // Refresh data after unpause
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unpause failed';
            const error = new Error(errorMessage);
            setError(error);
            throw error;
        } finally {
            setIsPending(false);
        }
    }, [client, tokenAddress, fetchTokenData]);

    // Check if transfer is allowed
    const checkTransferAllowed = useCallback(async (
        from: string,
        to: string,
        amount: string
    ): Promise<TransferAllowedResult> => {
        if (!client || !tokenAddress) {
            throw new Error('Client not initialized or token address not provided');
        }

        try {
            const token = client.token.connect(tokenAddress);
            return await token.isTransferAllowed(from, to, amount);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Check failed';
            throw new Error(errorMessage);
        }
    }, [client, tokenAddress]);

    // Get balance of any address
    const getBalanceOf = useCallback(async (account: string): Promise<bigint> => {
        if (!client || !tokenAddress) {
            throw new Error('Client not initialized or token address not provided');
        }

        try {
            const token = client.token.connect(tokenAddress);
            return await token.balanceOf(account);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Balance query failed';
            throw new Error(errorMessage);
        }
    }, [client, tokenAddress]);

    return {
        tokenInfo,
        balance,
        isLoading,
        error,
        isPending,
        mint,
        transfer,
        burn,
        pause,
        unpause,
        checkTransferAllowed,
        getBalanceOf,
        refetch: fetchTokenData,
    };
}

/**
 * Code snippets for documentation display
 */
export const TOKEN_CODE_SNIPPETS = {
    getInfo: `// Get token information
const token = client.token.connect(tokenAddress);
const info = await token.getInfo();
// Returns: { name, symbol, decimals, totalSupply, paused }`,

    balanceOf: `// Get token balance
const token = client.token.connect(tokenAddress);
const balance = await token.balanceOf(accountAddress);
// Returns: bigint`,

    mint: `// Mint tokens (requires ISSUER_ROLE)
const token = client.token.connect(tokenAddress);
const result = await token.mint(recipientAddress, "1000");
// Returns: TransactionResult with hash, events`,

    transfer: `// Transfer tokens
const token = client.token.connect(tokenAddress);
const result = await token.transfer(toAddress, "100");
// Returns: TransactionResult`,

    isTransferAllowed: `// Check if transfer is allowed
const token = client.token.connect(tokenAddress);
const { allowed, reason } = await token.isTransferAllowed(
  fromAddress,
  toAddress,
  "100"
);`,

    pause: `// Pause token transfers (requires COMPLIANCE_OFFICER_ROLE)
const token = client.token.connect(tokenAddress);
await token.pause();`,
};

export default useToken;
