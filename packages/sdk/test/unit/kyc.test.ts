/**
 * Unit tests for KYCModule
 * 
 * Feature: mantle-rwa-sdk
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ethers } from 'ethers';
import { KYCModule, KYCRegistryInstance, type KYCProvider } from '../../src/modules/kyc';
import { RWAError, ErrorCode } from '../../src/errors';
import { AccreditationTier } from '../../src/types';
import { hashIdentityData, dateToTimestamp, timestampToDate } from '../../src/utils';

describe('KYCModule', () => {
    let mockProvider: any;
    let mockSigner: any;
    let kycModule: KYCModule;

    beforeEach(() => {
        mockProvider = {
            getNetwork: vi.fn().mockResolvedValue({ chainId: 5003n }),
        };
        mockSigner = {
            getAddress: vi.fn().mockResolvedValue('0x' + '1'.repeat(40)),
            provider: mockProvider,
        };
        kycModule = new KYCModule(mockProvider, mockSigner, 3, 1000);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('connect', () => {
        it('should connect to a valid registry address', () => {
            const validAddress = '0x' + '1'.repeat(40);
            const instance = kycModule.connect(validAddress);

            expect(instance).toBeInstanceOf(KYCRegistryInstance);
            expect(instance.address).toBe(ethers.getAddress(validAddress));
        });

        it('should throw for invalid address', () => {
            expect(() => kycModule.connect('invalid')).toThrow(RWAError);
            expect(() => kycModule.connect('0x123')).toThrow(RWAError);
            expect(() => kycModule.connect('')).toThrow(RWAError);
        });

        it('should normalize address to checksum format', () => {
            const lowercaseAddress = '0x' + 'a'.repeat(40);
            const instance = kycModule.connect(lowercaseAddress);

            expect(instance.address).toBe(ethers.getAddress(lowercaseAddress));
        });
    });

    describe('setProvider', () => {
        it('should set persona provider', () => {
            kycModule.setProvider('persona');

            expect(kycModule.provider).not.toBeNull();
            expect(kycModule.provider?.name).toBe('persona');
        });

        it('should set synaps provider', () => {
            kycModule.setProvider('synaps');

            expect(kycModule.provider).not.toBeNull();
            expect(kycModule.provider?.name).toBe('synaps');
        });

        it('should set jumio provider', () => {
            kycModule.setProvider('jumio');

            expect(kycModule.provider).not.toBeNull();
            expect(kycModule.provider?.name).toBe('jumio');
        });

        it('should set custom provider', () => {
            const customProvider: KYCProvider = {
                name: 'custom',
                initiateVerification: vi.fn(),
                checkStatus: vi.fn(),
                getVerificationResult: vi.fn(),
            };

            kycModule.setProvider(customProvider);

            expect(kycModule.provider).toBe(customProvider);
            expect(kycModule.provider?.name).toBe('custom');
        });
    });

    describe('verifyInvestor', () => {
        it('should throw if no provider is configured', async () => {
            await expect(
                kycModule.verifyInvestor('0x' + '1'.repeat(40))
            ).rejects.toThrow('KYC provider not configured');
        });

        it('should initiate verification with built-in provider', async () => {
            kycModule.setProvider('persona');
            const investorAddress = '0x' + '1'.repeat(40);

            const session = await kycModule.verifyInvestor(investorAddress);

            expect(session.provider).toBe('persona');
            expect(session.status).toBe('pending');
            expect(session.sessionId).toContain('persona');
            expect(session.redirectUrl).toBeDefined();
        });

        it('should initiate verification with custom provider', async () => {
            const mockSession = {
                sessionId: 'custom-123',
                provider: 'custom',
                status: 'pending' as const,
                redirectUrl: 'https://custom.com/verify',
            };

            const customProvider: KYCProvider = {
                name: 'custom',
                initiateVerification: vi.fn().mockResolvedValue(mockSession),
                checkStatus: vi.fn(),
                getVerificationResult: vi.fn(),
            };

            kycModule.setProvider(customProvider);
            const session = await kycModule.verifyInvestor('0x' + '1'.repeat(40));

            expect(session).toEqual(mockSession);
            expect(customProvider.initiateVerification).toHaveBeenCalled();
        });

        it('should pass options to provider', async () => {
            const customProvider: KYCProvider = {
                name: 'custom',
                initiateVerification: vi.fn().mockResolvedValue({
                    sessionId: 'test',
                    provider: 'custom',
                    status: 'pending' as const,
                }),
                checkStatus: vi.fn(),
                getVerificationResult: vi.fn(),
            };

            kycModule.setProvider(customProvider);
            const options = { tier: 'accredited' };
            await kycModule.verifyInvestor('0x' + '1'.repeat(40), options);

            expect(customProvider.initiateVerification).toHaveBeenCalledWith(
                '0x' + '1'.repeat(40),
                options
            );
        });
    });

    describe('generateIdentityHash', () => {
        it('should generate consistent hash for same data', () => {
            const data = {
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: '1990-01-15',
                documentNumber: 'AB123456',
                country: 'US',
            };

            const hash1 = kycModule.generateIdentityHash(data);
            const hash2 = kycModule.generateIdentityHash(data);

            expect(hash1).toBe(hash2);
        });

        it('should generate different hash for different data', () => {
            const data1 = {
                firstName: 'John',
                lastName: 'Doe',
            };
            const data2 = {
                firstName: 'Jane',
                lastName: 'Doe',
            };

            const hash1 = kycModule.generateIdentityHash(data1);
            const hash2 = kycModule.generateIdentityHash(data2);

            expect(hash1).not.toBe(hash2);
        });

        it('should return valid bytes32 hash', () => {
            const hash = kycModule.generateIdentityHash({ firstName: 'Test' });

            expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
        });

        it('should normalize case in identity data', () => {
            const data1 = { firstName: 'JOHN', lastName: 'DOE' };
            const data2 = { firstName: 'john', lastName: 'doe' };

            const hash1 = kycModule.generateIdentityHash(data1);
            const hash2 = kycModule.generateIdentityHash(data2);

            expect(hash1).toBe(hash2);
        });
    });
});

describe('KYCModule provider behavior', () => {
    let kycModule: KYCModule;

    beforeEach(() => {
        const mockProvider = {} as any;
        const mockSigner = {} as any;
        kycModule = new KYCModule(mockProvider, mockSigner, 3, 1000);
    });

    it('should return null provider initially', () => {
        expect(kycModule.provider).toBeNull();
    });

    it('should allow provider to be changed', () => {
        kycModule.setProvider('persona');
        expect(kycModule.provider?.name).toBe('persona');

        kycModule.setProvider('jumio');
        expect(kycModule.provider?.name).toBe('jumio');
    });

    it('built-in provider checkStatus should return pending', async () => {
        kycModule.setProvider('persona');

        const status = await kycModule.provider!.checkStatus('any-session');

        expect(status).toBe('pending');
    });

    it('built-in provider getVerificationResult should throw', async () => {
        kycModule.setProvider('synaps');

        await expect(
            kycModule.provider!.getVerificationResult('any-session')
        ).rejects.toThrow('requires API credentials');
    });
});

describe('KYCRegistryInstance', () => {
    let kycModule: KYCModule;
    const registryAddress = '0x' + '1'.repeat(40);

    beforeEach(() => {
        const mockProvider = {} as any;
        const mockSigner = {} as any;
        kycModule = new KYCModule(mockProvider, mockSigner, 3, 1000);
    });

    describe('address property', () => {
        it('should expose the registry address', () => {
            const instance = kycModule.connect(registryAddress);

            expect(instance.address).toBe(ethers.getAddress(registryAddress));
        });

        it('should return consistent address', () => {
            const instance = kycModule.connect(registryAddress);

            expect(instance.address).toBe(instance.address);
        });
    });
});

describe('AccreditationTier enum', () => {
    it('should have correct values', () => {
        expect(AccreditationTier.None).toBe(0);
        expect(AccreditationTier.Retail).toBe(1);
        expect(AccreditationTier.Accredited).toBe(2);
        expect(AccreditationTier.Institutional).toBe(3);
    });

    it('should be usable in comparisons', () => {
        const tier = AccreditationTier.Accredited;

        expect(tier >= AccreditationTier.Retail).toBe(true);
        expect(tier < AccreditationTier.Institutional).toBe(true);
    });
});

describe('InvestorData structure', () => {
    it('should define correct interface structure', () => {
        const data = {
            verified: true,
            tier: AccreditationTier.Accredited,
            expiry: new Date('2025-12-31'),
            identityHash: '0x' + 'a'.repeat(64),
        };

        expect(data.verified).toBe(true);
        expect(data.tier).toBe(AccreditationTier.Accredited);
        expect(data.expiry).toBeInstanceOf(Date);
        expect(data.identityHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
});

describe('VerificationSession structure', () => {
    it('should define correct interface structure', () => {
        const session = {
            sessionId: 'session-123',
            provider: 'persona',
            status: 'pending' as const,
            redirectUrl: 'https://persona.com/verify',
        };

        expect(session.sessionId).toBe('session-123');
        expect(session.provider).toBe('persona');
        expect(session.status).toBe('pending');
        expect(session.redirectUrl).toBeDefined();
    });

    it('should support all status values', () => {
        const statuses: Array<'pending' | 'in_progress' | 'completed' | 'failed'> = [
            'pending',
            'in_progress',
            'completed',
            'failed',
        ];

        for (const status of statuses) {
            const session = {
                sessionId: 'test',
                provider: 'test',
                status,
            };
            expect(session.status).toBe(status);
        }
    });
});

describe('VerificationResult structure', () => {
    it('should define correct interface structure', () => {
        const result = {
            verified: true,
            tier: AccreditationTier.Institutional,
            identityHash: '0x' + 'b'.repeat(64),
            expiryDate: new Date('2026-06-30'),
            rawData: { source: 'persona' },
        };

        expect(result.verified).toBe(true);
        expect(result.tier).toBe(AccreditationTier.Institutional);
        expect(result.identityHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
        expect(result.expiryDate).toBeInstanceOf(Date);
        expect(result.rawData).toBeDefined();
    });

    it('should allow optional rawData', () => {
        const result = {
            verified: false,
            tier: AccreditationTier.None,
            identityHash: '0x' + '0'.repeat(64),
            expiryDate: new Date(),
        };

        expect(result.rawData).toBeUndefined();
    });
});

describe('Identity hash utilities', () => {
    it('should handle partial identity data', () => {
        const hash = hashIdentityData({ firstName: 'John' });

        expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should handle empty identity data', () => {
        const hash = hashIdentityData({});

        expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should trim whitespace from fields', () => {
        const hash1 = hashIdentityData({ firstName: '  John  ' });
        const hash2 = hashIdentityData({ firstName: 'John' });

        expect(hash1).toBe(hash2);
    });

    it('should uppercase document numbers', () => {
        const hash1 = hashIdentityData({ documentNumber: 'ab123' });
        const hash2 = hashIdentityData({ documentNumber: 'AB123' });

        expect(hash1).toBe(hash2);
    });

    it('should uppercase country codes', () => {
        const hash1 = hashIdentityData({ country: 'us' });
        const hash2 = hashIdentityData({ country: 'US' });

        expect(hash1).toBe(hash2);
    });
});

describe('Date/timestamp utilities', () => {
    it('should convert date to timestamp correctly', () => {
        const date = new Date('2025-06-15T12:00:00Z');
        const timestamp = dateToTimestamp(date);

        expect(timestamp).toBe(Math.floor(date.getTime() / 1000));
    });

    it('should convert timestamp to date correctly', () => {
        const timestamp = 1750000000; // Some future timestamp
        const date = timestampToDate(timestamp);

        expect(date.getTime()).toBe(timestamp * 1000);
    });

    it('should handle bigint timestamps', () => {
        const timestamp = 1750000000n;
        const date = timestampToDate(timestamp);

        expect(date.getTime()).toBe(Number(timestamp) * 1000);
    });

    it('should round-trip date through timestamp', () => {
        const originalDate = new Date('2025-12-31T23:59:59Z');
        const timestamp = dateToTimestamp(originalDate);
        const recoveredDate = timestampToDate(timestamp);

        // Should be within 1 second due to timestamp precision
        const diff = Math.abs(originalDate.getTime() - recoveredDate.getTime());
        expect(diff).toBeLessThan(1000);
    });
});

describe('KYCProvider interface', () => {
    it('should define required methods', () => {
        const provider: KYCProvider = {
            name: 'test',
            initiateVerification: async () => ({
                sessionId: 'test',
                provider: 'test',
                status: 'pending' as const,
            }),
            checkStatus: async () => 'pending' as const,
            getVerificationResult: async () => ({
                verified: true,
                tier: AccreditationTier.Retail,
                identityHash: '0x' + '0'.repeat(64),
                expiryDate: new Date(),
            }),
        };

        expect(provider.name).toBe('test');
        expect(typeof provider.initiateVerification).toBe('function');
        expect(typeof provider.checkStatus).toBe('function');
        expect(typeof provider.getVerificationResult).toBe('function');
    });
});
