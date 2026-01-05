'use client';

/**
 * KYCFlow - Multi-step KYC verification flow component
 * 
 * Guides users through the KYC verification process and displays
 * their current verification status and accreditation tier.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useRWA } from '../hooks/useRWA';
import type { KYCFlowProps, VerificationStatus } from '../types';
import { AccreditationTier, type InvestorData } from '@mantle-rwa/sdk';

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
 * Format date for display
 */
function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * KYCFlow component for guiding users through KYC verification
 */
export function KYCFlow({
    registryAddress,
    investorAddress,
    onStatusChange,
    onComplete,
    onError,
    className = '',
}: KYCFlowProps): JSX.Element {
    const { client, isInitialized, hasSigner } = useRWA();
    const { address: connectedAddress } = useAccount();

    const targetAddress = investorAddress || connectedAddress;

    const [status, setStatus] = useState<VerificationStatus>('idle');
    const [investorInfo, setInvestorInfo] = useState<InvestorData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Update status and notify callback
    const updateStatus = useCallback((newStatus: VerificationStatus) => {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
    }, [onStatusChange]);

    // Fetch investor KYC data
    const fetchKYCData = useCallback(async () => {
        if (!client || !isInitialized || !registryAddress || !targetAddress) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const registry = client.kyc.connect(registryAddress);
            const info = await registry.getInvestorInfo(targetAddress);
            setInvestorInfo(info);

            // Determine status based on investor info
            if (info.verified) {
                updateStatus('completed');
                onComplete?.(info.tier);
            } else if (info.tier !== AccreditationTier.None) {
                updateStatus('in_progress');
            } else {
                updateStatus('pending');
            }
        } catch (err) {
            const errorObj = err instanceof Error ? err : new Error('Failed to fetch KYC data');
            setError(errorObj);
            updateStatus('failed');
            onError?.(errorObj);
        } finally {
            setIsLoading(false);
        }
    }, [client, isInitialized, registryAddress, targetAddress, updateStatus, onComplete, onError]);

    // Fetch data on mount and when dependencies change
    useEffect(() => {
        fetchKYCData();
    }, [fetchKYCData]);

    // Handle start verification
    const handleStartVerification = useCallback(async () => {
        if (!client || !targetAddress) return;

        updateStatus('in_progress');

        try {
            // Initiate verification through the KYC provider
            const session = await client.kyc.verifyInvestor(targetAddress);

            // If there's a redirect URL, open it
            if (session.redirectUrl) {
                window.open(session.redirectUrl, '_blank');
            }
        } catch (err) {
            const errorObj = err instanceof Error ? err : new Error('Failed to start verification');
            setError(errorObj);
            updateStatus('failed');
            onError?.(errorObj);
        }
    }, [client, targetAddress, updateStatus, onError]);

    // Handle retry
    const handleRetry = useCallback(() => {
        setError(null);
        fetchKYCData();
    }, [fetchKYCData]);

    // Render loading state
    if (isLoading) {
        return (
            <div className={`rwa-kyc-flow rwa-kyc-flow--loading ${className}`}>
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    <span className="ml-3 text-gray-600 dark:text-gray-300">Loading KYC status...</span>
                </div>
            </div>
        );
    }

    // Render no wallet connected state
    if (!targetAddress) {
        return (
            <div className={`rwa-kyc-flow rwa-kyc-flow--no-wallet ${className}`}>
                <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                        Wallet Not Connected
                    </h3>
                    <p className="mt-2 text-yellow-700 dark:text-yellow-300">
                        Please connect your wallet to view your KYC status.
                    </p>
                </div>
            </div>
        );
    }

    // Render error state
    if (status === 'failed' && error) {
        return (
            <div className={`rwa-kyc-flow rwa-kyc-flow--error ${className}`}>
                <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                        Verification Failed
                    </h3>
                    <p className="mt-2 text-red-700 dark:text-red-300">{error.message}</p>
                    <button
                        onClick={handleRetry}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Render completed state
    if (status === 'completed' && investorInfo) {
        return (
            <div className={`rwa-kyc-flow rwa-kyc-flow--completed ${className}`}>
                <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center">
                        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="ml-3 text-lg font-semibold text-green-800 dark:text-green-200">
                            Verification Complete
                        </h3>
                    </div>
                    <div className="mt-4 space-y-2">
                        <p className="text-green-700 dark:text-green-300">
                            <span className="font-medium">Accreditation Tier:</span> {getTierName(investorInfo.tier)}
                        </p>
                        {investorInfo.expiry && (
                            <p className="text-green-700 dark:text-green-300">
                                <span className="font-medium">Valid Until:</span> {formatDate(investorInfo.expiry)}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Render in progress state
    if (status === 'in_progress') {
        return (
            <div className={`rwa-kyc-flow rwa-kyc-flow--in-progress ${className}`}>
                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                        <h3 className="ml-3 text-lg font-semibold text-blue-800 dark:text-blue-200">
                            Verification In Progress
                        </h3>
                    </div>
                    <p className="mt-4 text-blue-700 dark:text-blue-300">
                        Your identity verification is being processed. This may take a few minutes.
                    </p>
                    <button
                        onClick={fetchKYCData}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    >
                        Check Status
                    </button>
                </div>
            </div>
        );
    }

    // Render pending state (default)
    return (
        <div className={`rwa-kyc-flow rwa-kyc-flow--pending ${className}`}>
            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    KYC Verification Required
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Complete identity verification to participate in RWA token offerings.
                </p>
                {!hasSigner ? (
                    <p className="mt-4 text-yellow-600 dark:text-yellow-400 text-sm">
                        Connect your wallet to start verification.
                    </p>
                ) : (
                    <button
                        onClick={handleStartVerification}
                        className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    >
                        Start Verification
                    </button>
                )}
            </div>
        </div>
    );
}

export default KYCFlow;
