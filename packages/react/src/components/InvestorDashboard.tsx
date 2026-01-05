'use client';

/**
 * InvestorDashboard - Dashboard displaying investor portfolio information
 * 
 * Shows token balance, KYC status, accreditation tier, and pending yield claims.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { useRWA } from '../hooks/useRWA';
import type { InvestorDashboardProps } from '../types';
import { AccreditationTier, type TokenInfo, type InvestorData, type PendingClaim } from '@mantle-rwa/sdk';

/**
 * Get display name for accreditation tier
 */
function getTierName(tier: AccreditationTier): string {
    switch (tier) {
        case AccreditationTier.None:
            return 'None';
        case AccreditationTier.Retail:
            return 'Retail';
        case AccreditationTier.Accredited:
            return 'Accredited';
        case AccreditationTier.Institutional:
            return 'Institutional';
        default:
            return 'Unknown';
    }
}

/**
 * Format token amount for display
 */
function formatTokenAmount(amount: bigint, decimals: number, symbol: string): string {
    const formatted = formatUnits(amount, decimals);
    const num = parseFloat(formatted);
    return `${num.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${symbol}`;
}

/**
 * InvestorDashboard component
 */
export function InvestorDashboard({
    tokenAddress,
    kycRegistryAddress,
    yieldDistributorAddress,
    investorAddress,
    onClaimSuccess,
    onError,
    className = '',
}: InvestorDashboardProps): JSX.Element {
    const { client, isInitialized, hasSigner } = useRWA();
    const { address: connectedAddress } = useAccount();

    const targetAddress = investorAddress || connectedAddress;

    const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
    const [balance, setBalance] = useState<bigint | null>(null);
    const [kycInfo, setKycInfo] = useState<InvestorData | null>(null);
    const [pendingClaims, setPendingClaims] = useState<PendingClaim[]>([]);
    const [totalClaimable, setTotalClaimable] = useState<bigint>(0n);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isClaiming, setIsClaiming] = useState(false);

    // Fetch all dashboard data
    const fetchData = useCallback(async () => {
        if (!client || !isInitialized || !targetAddress) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch token info and balance
            const token = client.token.connect(tokenAddress);
            const [info, userBalance] = await Promise.all([
                token.getInfo(),
                token.balanceOf(targetAddress),
            ]);
            setTokenInfo(info);
            setBalance(userBalance);

            // Fetch KYC info
            const registry = client.kyc.connect(kycRegistryAddress);
            const investorData = await registry.getInvestorInfo(targetAddress);
            setKycInfo(investorData);

            // Fetch pending claims
            const distributor = client.yield.connect(yieldDistributorAddress);
            const claims = await distributor.getPendingClaims(targetAddress);
            setPendingClaims(claims);

            // Calculate total claimable
            const total = claims.reduce((sum, claim) => sum + claim.amount, 0n);
            setTotalClaimable(total);
        } catch (err) {
            const errorObj = err instanceof Error ? err : new Error('Failed to fetch dashboard data');
            setError(errorObj);
            onError?.(errorObj);
        } finally {
            setIsLoading(false);
        }
    }, [client, isInitialized, targetAddress, tokenAddress, kycRegistryAddress, yieldDistributorAddress, onError]);

    // Fetch data on mount and when dependencies change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle claim single distribution
    const handleClaim = useCallback(async (distributionId: number) => {
        if (!client || !hasSigner) return;

        setIsClaiming(true);
        setError(null);

        try {
            const distributor = client.yield.connect(yieldDistributorAddress);
            const result = await distributor.claim(distributionId);
            onClaimSuccess?.(result);
            await fetchData(); // Refresh data
        } catch (err) {
            const errorObj = err instanceof Error ? err : new Error('Failed to claim yield');
            setError(errorObj);
            onError?.(errorObj);
        } finally {
            setIsClaiming(false);
        }
    }, [client, hasSigner, yieldDistributorAddress, onClaimSuccess, onError, fetchData]);

    // Handle claim all
    const handleClaimAll = useCallback(async () => {
        if (!client || !hasSigner || pendingClaims.length === 0) return;

        setIsClaiming(true);
        setError(null);

        try {
            const distributor = client.yield.connect(yieldDistributorAddress);
            const distributionIds = pendingClaims.map(c => c.distributionId);
            const result = await distributor.claimMultiple(distributionIds);
            onClaimSuccess?.(result);
            await fetchData(); // Refresh data
        } catch (err) {
            const errorObj = err instanceof Error ? err : new Error('Failed to claim yields');
            setError(errorObj);
            onError?.(errorObj);
        } finally {
            setIsClaiming(false);
        }
    }, [client, hasSigner, pendingClaims, yieldDistributorAddress, onClaimSuccess, onError, fetchData]);

    // Render loading state
    if (isLoading) {
        return (
            <div className={`rwa-investor-dashboard rwa-investor-dashboard--loading ${className}`}>
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    <span className="ml-3 text-gray-600 dark:text-gray-300">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    // Render no wallet state
    if (!targetAddress) {
        return (
            <div className={`rwa-investor-dashboard rwa-investor-dashboard--no-wallet ${className}`}>
                <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-yellow-700 dark:text-yellow-300">
                        Please connect your wallet to view your dashboard.
                    </p>
                </div>
            </div>
        );
    }

    // Render error state
    if (error && !tokenInfo) {
        return (
            <div className={`rwa-investor-dashboard rwa-investor-dashboard--error ${className}`}>
                <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error</h3>
                    <p className="mt-2 text-red-700 dark:text-red-300">{error.message}</p>
                    <button
                        onClick={fetchData}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`rwa-investor-dashboard ${className}`}>
            <div className="space-y-6">
                {/* Token Balance Card */}
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Token Balance</h3>
                    {tokenInfo && balance !== null && (
                        <div className="mt-4">
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {formatTokenAmount(balance, tokenInfo.decimals, tokenInfo.symbol)}
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {tokenInfo.name}
                            </p>
                        </div>
                    )}
                </div>

                {/* KYC Status Card */}
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">KYC Status</h3>
                    {kycInfo && (
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center">
                                <span className="text-gray-600 dark:text-gray-400 w-32">Status:</span>
                                <span className={`font-medium ${kycInfo.verified ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                    {kycInfo.verified ? 'Verified' : 'Not Verified'}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-gray-600 dark:text-gray-400 w-32">Tier:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {getTierName(kycInfo.tier)}
                                </span>
                            </div>
                            {kycInfo.expiry && kycInfo.verified && (
                                <div className="flex items-center">
                                    <span className="text-gray-600 dark:text-gray-400 w-32">Valid Until:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {kycInfo.expiry.toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Pending Claims Card */}
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Pending Yields</h3>
                        {pendingClaims.length > 0 && hasSigner && (
                            <button
                                onClick={handleClaimAll}
                                disabled={isClaiming}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors text-sm"
                            >
                                {isClaiming ? 'Claiming...' : 'Claim All'}
                            </button>
                        )}
                    </div>

                    {pendingClaims.length === 0 ? (
                        <p className="mt-4 text-gray-500 dark:text-gray-400">No pending yields to claim.</p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Total Claimable: <span className="font-semibold">{formatUnits(totalClaimable, 18)} tokens</span>
                            </p>
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {pendingClaims.map((claim) => (
                                    <div key={claim.distributionId} className="py-3 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                Distribution #{claim.distributionId}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Amount: {formatUnits(claim.amount, 18)} • Deadline: {claim.deadline.toLocaleDateString()}
                                            </p>
                                        </div>
                                        {hasSigner && (
                                            <button
                                                onClick={() => handleClaim(claim.distributionId)}
                                                disabled={isClaiming}
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-sm transition-colors"
                                            >
                                                Claim
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!hasSigner && pendingClaims.length > 0 && (
                        <p className="mt-4 text-sm text-yellow-600 dark:text-yellow-400">
                            Connect your wallet to claim yields.
                        </p>
                    )}
                </div>

                {/* Error display */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-red-700 dark:text-red-300">{error.message}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default InvestorDashboard;
