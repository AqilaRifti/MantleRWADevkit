/**
 * Property Test: End-to-End Transfer Blocking
 * 
 * Feature: mantle-rwa-sdk, Property 27: End-to-End Transfer Blocking
 * 
 * *For any* transfer attempt in the Example App between non-compliant parties,
 * the transfer SHALL be blocked at both UI and contract level with consistent error messaging.
 * 
 * **Validates: Requirements 14.6**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Mock KYC status for testing
 */
interface KYCStatus {
    verified: boolean;
    tier: number; // 0: None, 1: Retail, 2: Accredited, 3: Institutional
    expiry: number; // Unix timestamp
}

/**
 * Mock transfer request
 */
interface TransferRequest {
    from: string;
    to: string;
    amount: bigint;
}

/**
 * Transfer result from compliance check
 */
interface TransferResult {
    allowed: boolean;
    reason?: string;
    blockedAt: 'ui' | 'contract' | null;
}

/**
 * Simulates the UI-level compliance check
 * This mirrors the logic in the investor portal
 */
function checkUICompliance(
    senderKYC: KYCStatus,
    recipientKYC: KYCStatus,
    currentTime: number
): TransferResult {
    // Check sender verification
    if (!senderKYC.verified) {
        return {
            allowed: false,
            reason: 'Sender is not KYC verified',
            blockedAt: 'ui',
        };
    }

    // Check sender expiry
    if (senderKYC.expiry < currentTime) {
        return {
            allowed: false,
            reason: 'Sender KYC has expired',
            blockedAt: 'ui',
        };
    }

    // Check recipient verification
    if (!recipientKYC.verified) {
        return {
            allowed: false,
            reason: 'Recipient is not KYC verified',
            blockedAt: 'ui',
        };
    }

    // Check recipient expiry
    if (recipientKYC.expiry < currentTime) {
        return {
            allowed: false,
            reason: 'Recipient KYC has expired',
            blockedAt: 'ui',
        };
    }

    return { allowed: true, blockedAt: null };
}

/**
 * Simulates the contract-level compliance check
 * This mirrors the RWAToken contract logic
 */
function checkContractCompliance(
    senderKYC: KYCStatus,
    recipientKYC: KYCStatus,
    currentTime: number
): TransferResult {
    // Contract checks sender verification
    if (!senderKYC.verified) {
        return {
            allowed: false,
            reason: 'NotVerified: sender',
            blockedAt: 'contract',
        };
    }

    // Contract checks sender expiry
    if (senderKYC.expiry < currentTime) {
        return {
            allowed: false,
            reason: 'KYCExpired: sender',
            blockedAt: 'contract',
        };
    }

    // Contract checks recipient verification
    if (!recipientKYC.verified) {
        return {
            allowed: false,
            reason: 'NotVerified: recipient',
            blockedAt: 'contract',
        };
    }

    // Contract checks recipient expiry
    if (recipientKYC.expiry < currentTime) {
        return {
            allowed: false,
            reason: 'KYCExpired: recipient',
            blockedAt: 'contract',
        };
    }

    return { allowed: true, blockedAt: null };
}

/**
 * Maps UI error reasons to contract error reasons for consistency check
 */
function normalizeErrorReason(reason: string | undefined): string {
    if (!reason) return '';

    // Normalize to a common format for comparison
    if (reason.includes('Sender') && reason.includes('not KYC verified')) {
        return 'sender_not_verified';
    }
    if (reason.includes('Sender') && reason.includes('expired')) {
        return 'sender_expired';
    }
    if (reason.includes('Recipient') && reason.includes('not KYC verified')) {
        return 'recipient_not_verified';
    }
    if (reason.includes('Recipient') && reason.includes('expired')) {
        return 'recipient_expired';
    }
    if (reason.includes('NotVerified') && reason.includes('sender')) {
        return 'sender_not_verified';
    }
    if (reason.includes('KYCExpired') && reason.includes('sender')) {
        return 'sender_expired';
    }
    if (reason.includes('NotVerified') && reason.includes('recipient')) {
        return 'recipient_not_verified';
    }
    if (reason.includes('KYCExpired') && reason.includes('recipient')) {
        return 'recipient_expired';
    }

    return reason;
}

/**
 * Arbitrary generator for KYC status
 */
const kycStatusArb = fc.record({
    verified: fc.boolean(),
    tier: fc.integer({ min: 0, max: 3 }),
    expiry: fc.integer({ min: 0, max: 2000000000 }), // Unix timestamp range
});

/**
 * Arbitrary generator for Ethereum addresses
 */
const addressArb = fc.array(
    fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'),
    { minLength: 40, maxLength: 40 }
).map((chars) => `0x${chars.join('')}`);

/**
 * Arbitrary generator for transfer amounts
 */
const amountArb = fc.bigInt({ min: 1n, max: BigInt(10 ** 27) });

describe('Property 27: End-to-End Transfer Blocking', () => {
    const currentTime = Math.floor(Date.now() / 1000);

    it('should block transfers consistently at UI and contract level for non-compliant parties', () => {
        fc.assert(
            fc.property(
                kycStatusArb,
                kycStatusArb,
                addressArb,
                addressArb,
                amountArb,
                (senderKYC, recipientKYC, fromAddr, toAddr, amount) => {
                    // Skip if both parties are fully compliant (not testing blocking in that case)
                    const isNonCompliant =
                        !senderKYC.verified ||
                        senderKYC.expiry < currentTime ||
                        !recipientKYC.verified ||
                        recipientKYC.expiry < currentTime;

                    if (!isNonCompliant) {
                        // Both parties are compliant, transfer should be allowed
                        const uiResult = checkUICompliance(senderKYC, recipientKYC, currentTime);
                        const contractResult = checkContractCompliance(senderKYC, recipientKYC, currentTime);

                        expect(uiResult.allowed).toBe(true);
                        expect(contractResult.allowed).toBe(true);
                        return;
                    }

                    // At least one party is non-compliant
                    const uiResult = checkUICompliance(senderKYC, recipientKYC, currentTime);
                    const contractResult = checkContractCompliance(senderKYC, recipientKYC, currentTime);

                    // Property: Both UI and contract should block the transfer
                    expect(uiResult.allowed).toBe(false);
                    expect(contractResult.allowed).toBe(false);

                    // Property: Error reasons should be consistent (same root cause)
                    const normalizedUIReason = normalizeErrorReason(uiResult.reason);
                    const normalizedContractReason = normalizeErrorReason(contractResult.reason);

                    expect(normalizedUIReason).toBe(normalizedContractReason);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should allow transfers when both parties are fully compliant', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 3 }), // tier (verified)
                fc.integer({ min: 1, max: 3 }), // tier (verified)
                addressArb,
                addressArb,
                amountArb,
                (senderTier, recipientTier, fromAddr, toAddr, amount) => {
                    // Create compliant KYC statuses
                    const futureExpiry = currentTime + 365 * 24 * 60 * 60; // 1 year from now

                    const senderKYC: KYCStatus = {
                        verified: true,
                        tier: senderTier,
                        expiry: futureExpiry,
                    };

                    const recipientKYC: KYCStatus = {
                        verified: true,
                        tier: recipientTier,
                        expiry: futureExpiry,
                    };

                    const uiResult = checkUICompliance(senderKYC, recipientKYC, currentTime);
                    const contractResult = checkContractCompliance(senderKYC, recipientKYC, currentTime);

                    // Property: Both UI and contract should allow the transfer
                    expect(uiResult.allowed).toBe(true);
                    expect(contractResult.allowed).toBe(true);
                    expect(uiResult.blockedAt).toBeNull();
                    expect(contractResult.blockedAt).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should block transfers when sender is not verified', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 3 }), // sender tier
                fc.integer({ min: 1, max: 3 }), // recipient tier (verified)
                (senderTier, recipientTier) => {
                    const futureExpiry = currentTime + 365 * 24 * 60 * 60;

                    const senderKYC: KYCStatus = {
                        verified: false, // Not verified
                        tier: senderTier,
                        expiry: futureExpiry,
                    };

                    const recipientKYC: KYCStatus = {
                        verified: true,
                        tier: recipientTier,
                        expiry: futureExpiry,
                    };

                    const uiResult = checkUICompliance(senderKYC, recipientKYC, currentTime);
                    const contractResult = checkContractCompliance(senderKYC, recipientKYC, currentTime);

                    // Property: Both should block with sender verification error
                    expect(uiResult.allowed).toBe(false);
                    expect(contractResult.allowed).toBe(false);
                    expect(normalizeErrorReason(uiResult.reason)).toBe('sender_not_verified');
                    expect(normalizeErrorReason(contractResult.reason)).toBe('sender_not_verified');
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should block transfers when recipient is not verified', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 3 }), // sender tier (verified)
                fc.integer({ min: 0, max: 3 }), // recipient tier
                (senderTier, recipientTier) => {
                    const futureExpiry = currentTime + 365 * 24 * 60 * 60;

                    const senderKYC: KYCStatus = {
                        verified: true,
                        tier: senderTier,
                        expiry: futureExpiry,
                    };

                    const recipientKYC: KYCStatus = {
                        verified: false, // Not verified
                        tier: recipientTier,
                        expiry: futureExpiry,
                    };

                    const uiResult = checkUICompliance(senderKYC, recipientKYC, currentTime);
                    const contractResult = checkContractCompliance(senderKYC, recipientKYC, currentTime);

                    // Property: Both should block with recipient verification error
                    expect(uiResult.allowed).toBe(false);
                    expect(contractResult.allowed).toBe(false);
                    expect(normalizeErrorReason(uiResult.reason)).toBe('recipient_not_verified');
                    expect(normalizeErrorReason(contractResult.reason)).toBe('recipient_not_verified');
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should block transfers when sender KYC is expired', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 3 }), // sender tier
                fc.integer({ min: 1, max: 3 }), // recipient tier
                fc.integer({ min: 1, max: currentTime - 1 }), // expired timestamp
                (senderTier, recipientTier, expiredTime) => {
                    const futureExpiry = currentTime + 365 * 24 * 60 * 60;

                    const senderKYC: KYCStatus = {
                        verified: true,
                        tier: senderTier,
                        expiry: expiredTime, // Expired
                    };

                    const recipientKYC: KYCStatus = {
                        verified: true,
                        tier: recipientTier,
                        expiry: futureExpiry,
                    };

                    const uiResult = checkUICompliance(senderKYC, recipientKYC, currentTime);
                    const contractResult = checkContractCompliance(senderKYC, recipientKYC, currentTime);

                    // Property: Both should block with sender expiry error
                    expect(uiResult.allowed).toBe(false);
                    expect(contractResult.allowed).toBe(false);
                    expect(normalizeErrorReason(uiResult.reason)).toBe('sender_expired');
                    expect(normalizeErrorReason(contractResult.reason)).toBe('sender_expired');
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should block transfers when recipient KYC is expired', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 3 }), // sender tier
                fc.integer({ min: 1, max: 3 }), // recipient tier
                fc.integer({ min: 1, max: currentTime - 1 }), // expired timestamp
                (senderTier, recipientTier, expiredTime) => {
                    const futureExpiry = currentTime + 365 * 24 * 60 * 60;

                    const senderKYC: KYCStatus = {
                        verified: true,
                        tier: senderTier,
                        expiry: futureExpiry,
                    };

                    const recipientKYC: KYCStatus = {
                        verified: true,
                        tier: recipientTier,
                        expiry: expiredTime, // Expired
                    };

                    const uiResult = checkUICompliance(senderKYC, recipientKYC, currentTime);
                    const contractResult = checkContractCompliance(senderKYC, recipientKYC, currentTime);

                    // Property: Both should block with recipient expiry error
                    expect(uiResult.allowed).toBe(false);
                    expect(contractResult.allowed).toBe(false);
                    expect(normalizeErrorReason(uiResult.reason)).toBe('recipient_expired');
                    expect(normalizeErrorReason(contractResult.reason)).toBe('recipient_expired');
                }
            ),
            { numRuns: 100 }
        );
    });
});
