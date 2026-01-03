/**
 * Unit tests for ComplianceModule
 * 
 * Feature: mantle-rwa-sdk
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ethers } from 'ethers';
import { ComplianceModule } from '../../src/modules/compliance';
import { RWAError, ErrorCode } from '../../src/errors';
import type { ComplianceReport, FilingData } from '../../src/types';

describe('ComplianceModule', () => {
    let mockProvider: any;
    let mockSigner: any;
    let complianceModule: ComplianceModule;

    beforeEach(() => {
        mockProvider = {
            getNetwork: vi.fn().mockResolvedValue({ chainId: 5003n }),
        };
        mockSigner = {
            getAddress: vi.fn().mockResolvedValue('0x' + '1'.repeat(40)),
            provider: mockProvider,
        };
        complianceModule = new ComplianceModule(mockProvider, mockSigner);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('checkTransferEligibility', () => {
        it('should throw for invalid token address', async () => {
            await expect(
                complianceModule.checkTransferEligibility(
                    'invalid',
                    '0x' + '1'.repeat(40),
                    '0x' + '2'.repeat(40),
                    '100'
                )
            ).rejects.toThrow(RWAError);
        });

        it('should throw for invalid from address', async () => {
            await expect(
                complianceModule.checkTransferEligibility(
                    '0x' + '1'.repeat(40),
                    'invalid',
                    '0x' + '2'.repeat(40),
                    '100'
                )
            ).rejects.toThrow(RWAError);
        });

        it('should throw for invalid to address', async () => {
            await expect(
                complianceModule.checkTransferEligibility(
                    '0x' + '1'.repeat(40),
                    '0x' + '2'.repeat(40),
                    'invalid',
                    '100'
                )
            ).rejects.toThrow(RWAError);
        });

        it('should throw with INVALID_ADDRESS error code', async () => {
            try {
                await complianceModule.checkTransferEligibility(
                    'invalid',
                    '0x' + '1'.repeat(40),
                    '0x' + '2'.repeat(40),
                    '100'
                );
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(RWAError);
                expect((error as RWAError).code).toBe(ErrorCode.INVALID_ADDRESS);
            }
        });
    });

    describe('generateComplianceReport', () => {
        it('should throw for invalid token address', async () => {
            await expect(
                complianceModule.generateComplianceReport('invalid')
            ).rejects.toThrow(RWAError);
        });

        it('should throw with INVALID_ADDRESS error code for invalid address', async () => {
            try {
                await complianceModule.generateComplianceReport('0x123');
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(RWAError);
                expect((error as RWAError).code).toBe(ErrorCode.INVALID_ADDRESS);
            }
        });
    });

    describe('exportReport', () => {
        const sampleReport: ComplianceReport = {
            generatedAt: new Date('2025-01-01T00:00:00Z'),
            tokenAddress: '0x' + '1'.repeat(40),
            totalHolders: 100,
            verifiedHolders: 80,
            accreditedHolders: 50,
            transfersBlocked: 5,
            complianceScore: 95,
        };

        it('should export to JSON format', async () => {
            const buffer = await complianceModule.exportReport(sampleReport, 'json');

            expect(buffer).toBeInstanceOf(Buffer);
            const parsed = JSON.parse(buffer.toString());
            expect(parsed.tokenAddress).toBe(sampleReport.tokenAddress);
            expect(parsed.totalHolders).toBe(sampleReport.totalHolders);
            expect(parsed.complianceScore).toBe(sampleReport.complianceScore);
        });

        it('should export to CSV format', async () => {
            const buffer = await complianceModule.exportReport(sampleReport, 'csv');

            expect(buffer).toBeInstanceOf(Buffer);
            const csvString = buffer.toString();
            const lines = csvString.split('\n');

            // Should have header and data rows
            expect(lines.length).toBe(2);
            expect(lines[0]).toContain('tokenAddress');
            expect(lines[0]).toContain('totalHolders');
            expect(lines[1]).toContain(sampleReport.tokenAddress);
        });

        it('should throw for PDF format (not implemented)', async () => {
            await expect(
                complianceModule.exportReport(sampleReport, 'pdf')
            ).rejects.toThrow(RWAError);
        });

        it('should throw for unsupported format', async () => {
            await expect(
                complianceModule.exportReport(sampleReport, 'xml' as any)
            ).rejects.toThrow(RWAError);
        });

        it('should include all report fields in JSON export', async () => {
            const buffer = await complianceModule.exportReport(sampleReport, 'json');
            const parsed = JSON.parse(buffer.toString());

            expect(parsed).toHaveProperty('generatedAt');
            expect(parsed).toHaveProperty('tokenAddress');
            expect(parsed).toHaveProperty('totalHolders');
            expect(parsed).toHaveProperty('verifiedHolders');
            expect(parsed).toHaveProperty('accreditedHolders');
            expect(parsed).toHaveProperty('transfersBlocked');
            expect(parsed).toHaveProperty('complianceScore');
        });

        it('should format JSON with indentation', async () => {
            const buffer = await complianceModule.exportReport(sampleReport, 'json');
            const jsonString = buffer.toString();

            // Should have newlines (formatted)
            expect(jsonString).toContain('\n');
            // Should have indentation
            expect(jsonString).toContain('  ');
        });

        it('should convert Date to ISO string in CSV', async () => {
            const buffer = await complianceModule.exportReport(sampleReport, 'csv');
            const csvString = buffer.toString();

            // Date should be in ISO format
            expect(csvString).toContain('2025-01-01');
        });
    });

    describe('prepareFilingData', () => {
        it('should throw for invalid token address', async () => {
            await expect(
                complianceModule.prepareFilingData('invalid', 'SEC-Form-D')
            ).rejects.toThrow(RWAError);
        });

        it('should throw with INVALID_ADDRESS error code for invalid address', async () => {
            try {
                await complianceModule.prepareFilingData('0x123', 'SEC-Form-D');
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(RWAError);
                expect((error as RWAError).code).toBe(ErrorCode.INVALID_ADDRESS);
            }
        });
    });
});

describe('ComplianceReport structure', () => {
    it('should define correct interface structure', () => {
        const report: ComplianceReport = {
            generatedAt: new Date(),
            tokenAddress: '0x' + '1'.repeat(40),
            totalHolders: 100,
            verifiedHolders: 80,
            accreditedHolders: 50,
            transfersBlocked: 5,
            complianceScore: 95,
        };

        expect(report.generatedAt).toBeInstanceOf(Date);
        expect(typeof report.tokenAddress).toBe('string');
        expect(typeof report.totalHolders).toBe('number');
        expect(typeof report.verifiedHolders).toBe('number');
        expect(typeof report.accreditedHolders).toBe('number');
        expect(typeof report.transfersBlocked).toBe('number');
        expect(typeof report.complianceScore).toBe('number');
    });

    it('should allow zero values', () => {
        const report: ComplianceReport = {
            generatedAt: new Date(),
            tokenAddress: '0x' + '1'.repeat(40),
            totalHolders: 0,
            verifiedHolders: 0,
            accreditedHolders: 0,
            transfersBlocked: 0,
            complianceScore: 0,
        };

        expect(report.totalHolders).toBe(0);
        expect(report.complianceScore).toBe(0);
    });
});

describe('FilingData structure', () => {
    it('should define correct interface structure', () => {
        const filingData: FilingData = {
            filingType: 'SEC-Form-D',
            tokenAddress: '0x' + '1'.repeat(40),
            reportingPeriod: {
                start: new Date('2024-01-01'),
                end: new Date('2024-12-31'),
            },
            data: {
                totalHolders: 100,
                verifiedHolders: 80,
            },
        };

        expect(typeof filingData.filingType).toBe('string');
        expect(typeof filingData.tokenAddress).toBe('string');
        expect(filingData.reportingPeriod.start).toBeInstanceOf(Date);
        expect(filingData.reportingPeriod.end).toBeInstanceOf(Date);
        expect(typeof filingData.data).toBe('object');
    });

    it('should allow arbitrary data fields', () => {
        const filingData: FilingData = {
            filingType: 'Custom',
            tokenAddress: '0x' + '1'.repeat(40),
            reportingPeriod: {
                start: new Date(),
                end: new Date(),
            },
            data: {
                customField1: 'value1',
                customField2: 123,
                nestedData: { key: 'value' },
            },
        };

        expect(filingData.data.customField1).toBe('value1');
        expect(filingData.data.customField2).toBe(123);
        expect(filingData.data.nestedData).toEqual({ key: 'value' });
    });
});

describe('TransferEligibility structure', () => {
    it('should define correct interface for eligible transfer', () => {
        const eligibility = {
            eligible: true,
            reason: undefined,
            checks: [
                { name: 'Token Active', passed: true, details: 'Token is active' },
                { name: 'Sufficient Balance', passed: true, details: 'Balance: 1000' },
            ],
        };

        expect(eligibility.eligible).toBe(true);
        expect(eligibility.reason).toBeUndefined();
        expect(eligibility.checks.length).toBe(2);
    });

    it('should define correct interface for ineligible transfer', () => {
        const eligibility = {
            eligible: false,
            reason: 'Sender is not KYC verified',
            checks: [
                { name: 'Token Active', passed: true },
                { name: 'Sender KYC Verified', passed: false, details: 'Sender is not KYC verified' },
            ],
        };

        expect(eligibility.eligible).toBe(false);
        expect(eligibility.reason).toBe('Sender is not KYC verified');
        expect(eligibility.checks.some(c => !c.passed)).toBe(true);
    });
});

describe('TransferCheck structure', () => {
    it('should define correct interface', () => {
        const check = {
            name: 'Token Active',
            passed: true,
            details: 'Token is active and not paused',
        };

        expect(typeof check.name).toBe('string');
        expect(typeof check.passed).toBe('boolean');
        expect(typeof check.details).toBe('string');
    });

    it('should allow optional details', () => {
        const check = {
            name: 'Compliance Modules',
            passed: true,
        };

        expect(check.details).toBeUndefined();
    });
});
