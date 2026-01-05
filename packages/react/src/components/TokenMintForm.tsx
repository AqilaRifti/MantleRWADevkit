'use client';

/**
 * TokenMintForm - Form for minting RWA tokens to verified investors
 * 
 * Validates recipient address and KYC status before allowing mint.
 */

import React, { useState, useCallback } from 'react';
import { useRWA } from '../hooks/useRWA';
import type { TokenMintFormProps } from '../types';
import { AccreditationTier, type TransactionResult } from '@mantle-rwa/sdk';

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate amount is positive
 */
export function isValidAmount(amount: string): boolean {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && isFinite(num);
}

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

interface FormState {
    recipient: string;
    amount: string;
}

interface ValidationState {
    recipientError: string | null;
    amountError: string | null;
}

interface KYCCheckState {
    isChecking: boolean;
    isVerified: boolean | null;
    tier: AccreditationTier | null;
}

/**
 * TokenMintForm component
 */
export function TokenMintForm({
    tokenAddress,
    kycRegistryAddress,
    onSuccess,
    onError,
    className = '',
}: TokenMintFormProps): JSX.Element {
    const { client, isInitialized, hasSigner } = useRWA();

    const [form, setForm] = useState<FormState>({ recipient: '', amount: '' });
    const [validation, setValidation] = useState<ValidationState>({ recipientError: null, amountError: null });
    const [kycCheck, setKycCheck] = useState<KYCCheckState>({ isChecking: false, isVerified: null, tier: null });
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [txResult, setTxResult] = useState<TransactionResult | null>(null);

    // Validate recipient address
    const validateRecipient = useCallback((address: string): string | null => {
        if (!address) return 'Recipient address is required';
        if (!isValidAddress(address)) return 'Invalid Ethereum address format';
        return null;
    }, []);

    // Validate amount
    const validateAmount = useCallback((amount: string): string | null => {
        if (!amount) return 'Amount is required';
        if (!isValidAmount(amount)) return 'Amount must be a positive number';
        return null;
    }, []);

    // Handle recipient change
    const handleRecipientChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setForm(prev => ({ ...prev, recipient: value }));
        setValidation(prev => ({ ...prev, recipientError: validateRecipient(value) }));
        setKycCheck({ isChecking: false, isVerified: null, tier: null });
        setTxResult(null);
    }, [validateRecipient]);

    // Handle amount change
    const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setForm(prev => ({ ...prev, amount: value }));
        setValidation(prev => ({ ...prev, amountError: validateAmount(value) }));
        setTxResult(null);
    }, [validateAmount]);

    // Check KYC status
    const checkKYC = useCallback(async () => {
        if (!client || !isInitialized || !form.recipient || !isValidAddress(form.recipient)) {
            return;
        }

        setKycCheck({ isChecking: true, isVerified: null, tier: null });

        try {
            const registry = client.kyc.connect(kycRegistryAddress);
            const info = await registry.getInvestorInfo(form.recipient);
            setKycCheck({
                isChecking: false,
                isVerified: info.verified,
                tier: info.tier,
            });
        } catch (err) {
            setKycCheck({ isChecking: false, isVerified: false, tier: null });
        }
    }, [client, isInitialized, form.recipient, kycRegistryAddress]);

    // Handle form submission
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all fields
        const recipientError = validateRecipient(form.recipient);
        const amountError = validateAmount(form.amount);

        setValidation({ recipientError, amountError });

        if (recipientError || amountError) {
            return;
        }

        // Check KYC if not already checked
        if (kycCheck.isVerified === null) {
            await checkKYC();
            return; // User needs to submit again after KYC check
        }

        // Block if not verified
        if (!kycCheck.isVerified) {
            setError(new Error('Recipient is not KYC verified. Cannot mint tokens to unverified addresses.'));
            return;
        }

        if (!client || !hasSigner) {
            setError(new Error('Wallet not connected'));
            return;
        }

        setIsPending(true);
        setError(null);
        setTxResult(null);

        try {
            const token = client.token.connect(tokenAddress);
            const result = await token.mint(form.recipient, form.amount);
            setTxResult(result);
            onSuccess?.(result);
            // Clear form on success
            setForm({ recipient: '', amount: '' });
            setKycCheck({ isChecking: false, isVerified: null, tier: null });
        } catch (err) {
            const errorObj = err instanceof Error ? err : new Error('Mint failed');
            setError(errorObj);
            onError?.(errorObj);
        } finally {
            setIsPending(false);
        }
    }, [form, validation, kycCheck, client, hasSigner, tokenAddress, validateRecipient, validateAmount, checkKYC, onSuccess, onError]);

    const isFormValid = !validation.recipientError && !validation.amountError && form.recipient && form.amount;
    const canSubmit = isFormValid && hasSigner && !isPending && (kycCheck.isVerified === null || kycCheck.isVerified);

    return (
        <div className={`rwa-token-mint-form ${className}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Recipient Address Field */}
                <div>
                    <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Recipient Address
                    </label>
                    <input
                        type="text"
                        id="recipient"
                        value={form.recipient}
                        onChange={handleRecipientChange}
                        onBlur={checkKYC}
                        placeholder="0x..."
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${validation.recipientError
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                            }`}
                    />
                    {validation.recipientError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validation.recipientError}</p>
                    )}

                    {/* KYC Status Display */}
                    {kycCheck.isChecking && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Checking KYC status...</p>
                    )}
                    {kycCheck.isVerified === true && (
                        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                            ✓ Verified ({getTierName(kycCheck.tier!)})
                        </p>
                    )}
                    {kycCheck.isVerified === false && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                            ✗ Not KYC verified - cannot mint to this address
                        </p>
                    )}
                </div>

                {/* Amount Field */}
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Amount
                    </label>
                    <input
                        type="text"
                        id="amount"
                        value={form.amount}
                        onChange={handleAmountChange}
                        placeholder="0.00"
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${validation.amountError
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                            }`}
                    />
                    {validation.amountError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validation.amountError}</p>
                    )}
                </div>

                {/* Wallet Connection Warning */}
                {!hasSigner && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Connect your wallet to mint tokens.
                        </p>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-700 dark:text-red-300">{error.message}</p>
                    </div>
                )}

                {/* Success Display */}
                {txResult && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-700 dark:text-green-300">
                            ✓ Mint successful! Transaction: {txResult.hash.slice(0, 10)}...
                        </p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`w-full py-2 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${canSubmit
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-300 cursor-not-allowed'
                        }`}
                >
                    {isPending ? 'Minting...' : kycCheck.isVerified === null && form.recipient ? 'Check KYC & Mint' : 'Mint Tokens'}
                </button>
            </form>
        </div>
    );
}

export default TokenMintForm;
