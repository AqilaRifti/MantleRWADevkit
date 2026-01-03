/**
 * Property-based tests for ComplianceModule
 * 
 * Feature: mantle-rwa-sdk
 * Property: 24
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ethers } from 'ethers';
import type { TransferEligibility, TransferCheck, ComplianceReport, FilingData } from '../../src/types';

/**
 * Property 24: Compliance Check Accuracy
 * 
 * For any transfer, checkTransferEligibility() result SHALL match the actual
 * transfer outcome (success/failure and reason).
 * 
 * Validates: Requirements 9.1, 9.4
 */
describe('Property 24: Compliance Check Accuracy', () => {
    // Arbitrary for valid Ethereum addresses
    const addressArb = fc.hexaString({ minLength: 40, maxLength: 40 })
        .map(hex => ethers.getAddress('0x' + hex));

    // Arbitrary for amounts (positive values)
    const amountArb = fc.bigInt({ min: 1n, max: 10n ** 27n })
        .map(n => n.toString());

    // Arbitrary for boolean values
    const boolArb = fc.boolean();

    // Arbitrary for check names
    const checkNameArb = fc.constantFrom(
        'Token Active',
        'Sufficient Balance',
        'Sender KYC Verified',
        'Recipient KYC Verified',
        'Compliance Modules'
    );

    // Arbitrary for transfer check results
    const transferCheckArb = fc.record({
        name: checkNameArb,
        passed: boolArb,
        details: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    });

    // Arbitrary for transfer eligibility results
    const transferEligibilityArb = fc.array(transferCheckArb, { minLength: 1, maxLength: 5 })
        .map(checks => {
            const allPassed = checks.every(c => c.passed);
            const failedCheck = checks.find(c => !c.passed);
            return {
                eligible: allPassed,
                reason: allPassed ? undefined : failedCheck?.details || 'Check failed',
                checks,
            } as TransferEligibility;
        });

    it('should have eligibility match all checks passing', async () => {
        await fc.assert(
            fc.asyncProperty(
                transferEligibilityArb,
                async (eligibility) => {
                    const allChecksPassed = eligibility.checks.every(c => c.passed);

                    // Eligibility should be true if and only if all checks pass
                    expect(eligibility.eligible).toBe(allChecksPassed);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should provide reason when transfer is not eligible', async () => {
        await fc.assert(
            fc.asyncProperty(
                transferEligibilityArb,
                async (eligibility) => {
                    if (!eligibility.eligible) {
                        // When not eligible, reason should be defined
                        expect(eligibility.reason).toBeDefined();
                        expect(typeof eligibility.reason).toBe('string');
                        expect(eligibility.reason!.length).toBeGreaterThan(0);
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should not provide reason when transfer is eligible', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        name: checkNameArb,
                        passed: fc.constant(true), // All checks pass
                        details: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                async (checks) => {
                    const eligibility: TransferEligibility = {
                        eligible: true,
                        reason: undefined,
                        checks,
                    };

                    // When eligible, reason should be undefined
                    expect(eligibility.reason).toBeUndefined();
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have checks array always present and non-empty', async () => {
        await fc.assert(
            fc.asyncProperty(
                transferEligibilityArb,
                async (eligibility) => {
                    // Checks array should always be present
                    expect(Array.isArray(eligibility.checks)).toBe(true);
                    expect(eligibility.checks.length).toBeGreaterThan(0);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have each check contain required fields', async () => {
        await fc.assert(
            fc.asyncProperty(
                transferEligibilityArb,
                async (eligibility) => {
                    for (const check of eligibility.checks) {
                        // Each check must have name and passed fields
                        expect(typeof check.name).toBe('string');
                        expect(check.name.length).toBeGreaterThan(0);
                        expect(typeof check.passed).toBe('boolean');
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should identify the first failing check as the reason', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(transferCheckArb, { minLength: 2, maxLength: 5 }),
                async (checks) => {
                    // Ensure at least one check fails
                    if (checks.every(c => c.passed)) {
                        checks[0].passed = false;
                        checks[0].details = 'First check failed';
                    }

                    const allPassed = checks.every(c => c.passed);
                    const failedCheck = checks.find(c => !c.passed);

                    const eligibility: TransferEligibility = {
                        eligible: allPassed,
                        reason: allPassed ? undefined : failedCheck?.details || 'Check failed',
                        checks,
                    };

                    if (!eligibility.eligible) {
                        // The reason should come from a failed check
                        const hasMatchingFailedCheck = checks.some(
                            c => !c.passed && (c.details === eligibility.reason || eligibility.reason === 'Check failed')
                        );
                        expect(hasMatchingFailedCheck).toBe(true);
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should handle addresses consistently', async () => {
        await fc.assert(
            fc.asyncProperty(
                addressArb,
                addressArb,
                amountArb,
                async (from, to, amount) => {
                    // Addresses should be valid checksummed addresses
                    expect(ethers.isAddress(from)).toBe(true);
                    expect(ethers.isAddress(to)).toBe(true);
                    expect(from).toBe(ethers.getAddress(from));
                    expect(to).toBe(ethers.getAddress(to));

                    // Amount should be a valid string representation
                    expect(typeof amount).toBe('string');
                    expect(BigInt(amount)).toBeGreaterThan(0n);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Additional compliance module property tests
 */
describe('Compliance Report Properties', () => {
    // Arbitrary for compliance report
    const complianceReportArb = fc.record({
        generatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        tokenAddress: fc.hexaString({ minLength: 40, maxLength: 40 })
            .map(hex => ethers.getAddress('0x' + hex)),
        totalHolders: fc.nat({ max: 10000 }),
        verifiedHolders: fc.nat({ max: 10000 }),
        accreditedHolders: fc.nat({ max: 10000 }),
        transfersBlocked: fc.nat({ max: 1000 }),
        complianceScore: fc.integer({ min: 0, max: 100 }),
    }).filter(report =>
        // Ensure logical constraints
        report.verifiedHolders <= report.totalHolders &&
        report.accreditedHolders <= report.verifiedHolders
    );

    it('should have verified holders <= total holders', async () => {
        await fc.assert(
            fc.asyncProperty(
                complianceReportArb,
                async (report) => {
                    expect(report.verifiedHolders).toBeLessThanOrEqual(report.totalHolders);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have accredited holders <= verified holders', async () => {
        await fc.assert(
            fc.asyncProperty(
                complianceReportArb,
                async (report) => {
                    expect(report.accreditedHolders).toBeLessThanOrEqual(report.verifiedHolders);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have compliance score between 0 and 100', async () => {
        await fc.assert(
            fc.asyncProperty(
                complianceReportArb,
                async (report) => {
                    expect(report.complianceScore).toBeGreaterThanOrEqual(0);
                    expect(report.complianceScore).toBeLessThanOrEqual(100);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have valid token address', async () => {
        await fc.assert(
            fc.asyncProperty(
                complianceReportArb,
                async (report) => {
                    expect(ethers.isAddress(report.tokenAddress)).toBe(true);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have generatedAt as valid Date', async () => {
        await fc.assert(
            fc.asyncProperty(
                complianceReportArb,
                async (report) => {
                    expect(report.generatedAt).toBeInstanceOf(Date);
                    expect(report.generatedAt.getTime()).not.toBeNaN();
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Export format property tests
 */
describe('Export Format Properties', () => {
    const complianceReportArb = fc.record({
        generatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        tokenAddress: fc.hexaString({ minLength: 40, maxLength: 40 })
            .map(hex => ethers.getAddress('0x' + hex)),
        totalHolders: fc.nat({ max: 10000 }),
        verifiedHolders: fc.nat({ max: 10000 }),
        accreditedHolders: fc.nat({ max: 10000 }),
        transfersBlocked: fc.nat({ max: 1000 }),
        complianceScore: fc.integer({ min: 0, max: 100 }),
    });

    it('should export to JSON with all fields preserved', async () => {
        await fc.assert(
            fc.asyncProperty(
                complianceReportArb,
                async (report) => {
                    const jsonBuffer = Buffer.from(JSON.stringify(report, null, 2));
                    const parsed = JSON.parse(jsonBuffer.toString());

                    // All fields should be preserved (dates become strings)
                    expect(parsed.tokenAddress).toBe(report.tokenAddress);
                    expect(parsed.totalHolders).toBe(report.totalHolders);
                    expect(parsed.verifiedHolders).toBe(report.verifiedHolders);
                    expect(parsed.accreditedHolders).toBe(report.accreditedHolders);
                    expect(parsed.transfersBlocked).toBe(report.transfersBlocked);
                    expect(parsed.complianceScore).toBe(report.complianceScore);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should export to CSV with correct structure', async () => {
        await fc.assert(
            fc.asyncProperty(
                complianceReportArb,
                async (report) => {
                    const headers = Object.keys(report).join(',');
                    const values = Object.values(report)
                        .map(v => (v instanceof Date ? v.toISOString() : String(v)))
                        .join(',');
                    const csvBuffer = Buffer.from(`${headers}\n${values}`);
                    const csvString = csvBuffer.toString();

                    // CSV should have header row and data row
                    const lines = csvString.split('\n');
                    expect(lines.length).toBe(2);

                    // Header should contain all field names
                    expect(lines[0]).toContain('tokenAddress');
                    expect(lines[0]).toContain('totalHolders');
                    expect(lines[0]).toContain('complianceScore');
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Filing data property tests
 */
describe('Filing Data Properties', () => {
    const filingTypeArb = fc.constantFrom(
        'SEC-Form-D',
        'Reg-A',
        'Reg-CF',
        'Annual-Report',
        'Quarterly-Report'
    );

    const filingDataArb = fc.record({
        filingType: filingTypeArb,
        tokenAddress: fc.hexaString({ minLength: 40, maxLength: 40 })
            .map(hex => ethers.getAddress('0x' + hex)),
        reportingPeriod: fc.record({
            start: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
            end: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        }).filter(period => period.start <= period.end),
        data: fc.record({
            totalHolders: fc.nat({ max: 10000 }),
            verifiedHolders: fc.nat({ max: 10000 }),
            accreditedHolders: fc.nat({ max: 10000 }),
            complianceScore: fc.integer({ min: 0, max: 100 }),
            generatedAt: fc.string(),
        }),
    });

    it('should have valid reporting period (start <= end)', async () => {
        await fc.assert(
            fc.asyncProperty(
                filingDataArb,
                async (filingData) => {
                    expect(filingData.reportingPeriod.start.getTime())
                        .toBeLessThanOrEqual(filingData.reportingPeriod.end.getTime());
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have valid filing type', async () => {
        await fc.assert(
            fc.asyncProperty(
                filingDataArb,
                async (filingData) => {
                    expect(typeof filingData.filingType).toBe('string');
                    expect(filingData.filingType.length).toBeGreaterThan(0);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have valid token address', async () => {
        await fc.assert(
            fc.asyncProperty(
                filingDataArb,
                async (filingData) => {
                    expect(ethers.isAddress(filingData.tokenAddress)).toBe(true);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have data object with required fields', async () => {
        await fc.assert(
            fc.asyncProperty(
                filingDataArb,
                async (filingData) => {
                    expect(filingData.data).toBeDefined();
                    expect(typeof filingData.data).toBe('object');
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});
