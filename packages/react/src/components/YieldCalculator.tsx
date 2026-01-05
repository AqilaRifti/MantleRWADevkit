'use client';

/**
 * YieldCalculator - Calculator for previewing yield distributions
 * 
 * Shows how yields will be allocated to token holders before creating a distribution.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { formatUnits } from 'viem';
import { useRWA } from '../hooks/useRWA';
import type { YieldCalculatorProps } from '../types';
import type { DistributionPreview, HolderDistribution } from '@mantle-rwa/sdk';

/**
 * Format address for display
 */
function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format token amount for display
 */
function formatAmount(amount: bigint, decimals: number = 18): string {
    const formatted = formatUnits(amount, decimals);
    const num = parseFloat(formatted);
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

/**
 * YieldCalculator component
 */
export function YieldCalculator({
    tokenAddress,
    yieldDistributorAddress: _yieldDistributorAddress,
    holderAddresses,
    onCalculate,
    onError,
    className = '',
}: YieldCalculatorProps): JSX.Element {
    const { client, isInitialized } = useRWA();

    const [amount, setAmount] = useState<string>('');
    const [preview, setPreview] = useState<DistributionPreview | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Debounce timer ref
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Calculate preview
    const calculatePreview = useCallback(async (distributionAmount: string) => {
        if (!client || !isInitialized || !distributionAmount || parseFloat(distributionAmount) <= 0) {
            setPreview(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await client.yield.previewDistribution(
                tokenAddress,
                distributionAmount,
                undefined, // snapshotId
                holderAddresses
            );
            setPreview(result);
            onCalculate?.(result);
        } catch (err) {
            const errorObj = err instanceof Error ? err : new Error('Failed to calculate preview');
            setError(errorObj);
            onError?.(errorObj);
            setPreview(null);
        } finally {
            setIsLoading(false);
        }
    }, [client, isInitialized, tokenAddress, holderAddresses, onCalculate, onError]);

    // Handle amount change with debounce
    const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAmount(value);

        // Clear previous debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Debounce the calculation
        debounceRef.current = setTimeout(() => {
            calculatePreview(value);
        }, 500);
    }, [calculatePreview]);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    // Recalculate when holder addresses change
    useEffect(() => {
        if (amount && parseFloat(amount) > 0) {
            calculatePreview(amount);
        }
    }, [holderAddresses]); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle manual calculate button
    const handleCalculate = useCallback(() => {
        calculatePreview(amount);
    }, [amount, calculatePreview]);

    return (
        <div className={`rwa-yield-calculator ${className}`}>
            <div className="space-y-6">
                {/* Amount Input */}
                <div>
                    <label htmlFor="distribution-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Total Distribution Amount
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                            type="text"
                            id="distribution-amount"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="Enter amount to distribute"
                            className="flex-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                        <button
                            type="button"
                            onClick={handleCalculate}
                            disabled={isLoading || !amount}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:dark:bg-gray-600 text-white font-medium rounded-r-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                        >
                            {isLoading ? 'Calculating...' : 'Calculate'}
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                        <span className="ml-2 text-gray-600 dark:text-gray-300">Calculating distribution...</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-red-700 dark:text-red-300">{error.message}</p>
                        <button
                            onClick={handleCalculate}
                            className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Preview Results */}
                {preview && !isLoading && (
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Distribution Summary</h4>
                            <div className="mt-2 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Holders</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{preview.totalHolders}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Supply</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {formatAmount(preview.totalSupplyAtSnapshot)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Holder Distributions Table */}
                        {preview.distributions.length > 0 && (
                            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Address
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Balance
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Yield Amount
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Share
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                        {preview.distributions.map((dist: HolderDistribution) => (
                                            <tr key={dist.address}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                                                    {formatAddress(dist.address)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300">
                                                    {formatAmount(dist.balance)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-green-600 dark:text-green-400">
                                                    {formatAmount(dist.yieldAmount)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300">
                                                    {dist.percentage.toFixed(2)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {preview.distributions.length === 0 && (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <p className="text-yellow-700 dark:text-yellow-300">
                                    No holder addresses provided or no holders have balances.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!preview && !isLoading && !error && (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        <p>Enter a distribution amount to preview how yields will be allocated.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default YieldCalculator;
