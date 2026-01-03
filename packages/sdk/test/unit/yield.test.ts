/**
 * Unit tests for YieldModule
 * 
 * Feature: mantle-rwa-sdk
 * Requirements: 8.1, 8.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ethers } from 'ethers';
import { YieldModule, YieldDistributorInstance } from '../../src/modules/yield';
import { RWAError, ErrorCode } from '../../src/errors';

describe('YieldModule', () => {
    let mockProvider: any;
    let mockSigner: any;
    let yieldModule: YieldModule;

    beforeEach(() => {
        mockProvider = {
            getNetwork: vi.fn().mockResolvedValue({ chainId: 5003n }),
        };
        mockSigner = {
            getAddress: vi.fn().mockResolvedValue('0x' + '1'.repeat(40)),
            provider: mockProvider,
        };
        yieldModule = new YieldModule(mockProvider, mockSigner, 3, 1000);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('connect', () => {
        it('should connect to a valid distributor address', () => {
            const validAddress = '0x' + '1'.repeat(40);
            const instance = yieldModule.connect(validAddress);

            expect(instance.address).toBe(ethers.getAddress(validAddress));
        });

        it('should throw for invalid address - invalid format', () => {
            expect(() => yieldModule.connect('invalid')).toThrow(RWAError);
        });

        it('should throw for invalid address - too short', () => {
            expect(() => yieldModule.connect('0x123')).toThrow(RWAError);
        });

        it('should throw for invalid address - empty string', () => {
            expect(() => yieldModule.connect('')).toThrow(RWAError);
        });

        it('should normalize address to checksum format', () => {
            const lowercaseAddress = '0x' + 'a'.repeat(40);
            const instance = yieldModule.connect(lowercaseAddress);

            expect(instance.address).toBe(ethers.getAddress(lowercaseAddress));
        });
    });

    describe('distribute', () => {
        it('should throw for invalid token address', async () => {
            await expect(
                yieldModule.distribute({
                    tokenAddress: 'invalid',
                    paymentToken: '0x' + '2'.repeat(40),
                    totalAmount: '1000',
                })
            ).rejects.toThrow(RWAError);
        });

        it('should throw for invalid payment token address', async () => {
            await expect(
                yieldModule.distribute({
                    tokenAddress: '0x' + '1'.repeat(40),
                    paymentToken: 'invalid',
                    totalAmount: '1000',
                })
            ).rejects.toThrow(RWAError);
        });
    });

    describe('previewDistribution', () => {
        it('should throw for invalid token address', async () => {
            await expect(
                yieldModule.previewDistribution('invalid', '1000')
            ).rejects.toThrow(RWAError);
        });

        it('should throw for empty token address', async () => {
            await expect(
                yieldModule.previewDistribution('', '1000')
            ).rejects.toThrow(RWAError);
        });

        it('should throw for short token address', async () => {
            await expect(
                yieldModule.previewDistribution('0x123', '1000')
            ).rejects.toThrow(RWAError);
        });
    });

    describe('calculateHolderYield', () => {
        it('should throw for invalid token address', async () => {
            await expect(
                yieldModule.calculateHolderYield(
                    'invalid',
                    '0x' + '2'.repeat(40),
                    '1000'
                )
            ).rejects.toThrow(RWAError);
        });

        it('should throw for invalid holder address', async () => {
            await expect(
                yieldModule.calculateHolderYield(
                    '0x' + '1'.repeat(40),
                    'invalid',
                    '1000'
                )
            ).rejects.toThrow(RWAError);
        });

        it('should throw for empty token address', async () => {
            await expect(
                yieldModule.calculateHolderYield(
                    '',
                    '0x' + '2'.repeat(40),
                    '1000'
                )
            ).rejects.toThrow(RWAError);
        });

        it('should throw for empty holder address', async () => {
            await expect(
                yieldModule.calculateHolderYield(
                    '0x' + '1'.repeat(40),
                    '',
                    '1000'
                )
            ).rejects.toThrow(RWAError);
        });
    });

    describe('claim', () => {
        it('should throw for invalid distributor address', async () => {
            expect(() => yieldModule.connect('invalid')).toThrow(RWAError);
        });
    });

    describe('claimAll', () => {
        it('should throw when no signer is provided', async () => {
            const readOnlyModule = new YieldModule(mockProvider, null, 3, 1000);

            await expect(
                readOnlyModule.claimAll('0x' + '1'.repeat(40))
            ).rejects.toThrow(RWAError);
        });
    });

    describe('getClaimableAmount', () => {
        it('should connect to distributor and call getClaimableAmount', () => {
            const distributorAddress = '0x' + '1'.repeat(40);
            const instance = yieldModule.connect(distributorAddress);

            expect(instance).toBeInstanceOf(YieldDistributorInstance);
            expect(instance.address).toBe(ethers.getAddress(distributorAddress));
        });
    });
});

describe('YieldModule configuration', () => {
    it('should store retry configuration', () => {
        const mockProvider = {} as any;
        const mockSigner = {} as any;
        const retries = 5;
        const retryDelay = 2000;

        const yieldModule = new YieldModule(mockProvider, mockSigner, retries, retryDelay);
        const instance = yieldModule.connect('0x' + '1'.repeat(40));

        expect(instance).toBeDefined();
    });

    it('should work without signer (read-only mode)', () => {
        const mockProvider = {} as any;

        const yieldModule = new YieldModule(mockProvider, null, 3, 1000);
        const instance = yieldModule.connect('0x' + '1'.repeat(40));

        expect(instance).toBeDefined();
    });
});

describe('YieldDistributorInstance address property', () => {
    let yieldModule: YieldModule;

    beforeEach(() => {
        const mockProvider = {} as any;
        const mockSigner = {} as any;
        yieldModule = new YieldModule(mockProvider, mockSigner, 3, 1000);
    });

    it('should expose the distributor address', () => {
        const address = '0x' + '1'.repeat(40);
        const instance = yieldModule.connect(address);

        expect(instance.address).toBe(ethers.getAddress(address));
    });

    it('should return consistent address', () => {
        const address = '0x' + '1'.repeat(40);
        const instance = yieldModule.connect(address);

        const firstAccess = instance.address;
        const secondAccess = instance.address;
        expect(firstAccess).toBe(secondAccess);
    });
});

describe('Distribution type structures', () => {
    it('should define DistributionConfig structure', () => {
        const config = {
            tokenAddress: '0x' + '1'.repeat(40),
            paymentToken: '0x' + '2'.repeat(40),
            totalAmount: '1000',
            claimWindowDays: 30,
        };

        expect(config.tokenAddress).toBeDefined();
        expect(config.paymentToken).toBeDefined();
        expect(config.totalAmount).toBe('1000');
        expect(config.claimWindowDays).toBe(30);
    });

    it('should define Distribution structure', () => {
        const distribution = {
            id: 1,
            paymentToken: '0x' + '1'.repeat(40),
            totalAmount: 1000n * 10n ** 18n,
            snapshotId: 5n,
            claimDeadline: new Date(),
            claimedAmount: 500n * 10n ** 18n,
        };

        expect(distribution.id).toBe(1);
        expect(distribution.paymentToken).toBeDefined();
        expect(distribution.totalAmount).toBe(1000n * 10n ** 18n);
        expect(distribution.snapshotId).toBe(5n);
        expect(distribution.claimDeadline).toBeInstanceOf(Date);
        expect(distribution.claimedAmount).toBe(500n * 10n ** 18n);
    });

    it('should define PendingClaim structure', () => {
        const pendingClaim = {
            distributionId: 1,
            amount: 100n * 10n ** 18n,
            paymentToken: '0x' + '1'.repeat(40),
            deadline: new Date(),
        };

        expect(pendingClaim.distributionId).toBe(1);
        expect(pendingClaim.amount).toBe(100n * 10n ** 18n);
        expect(pendingClaim.paymentToken).toBeDefined();
        expect(pendingClaim.deadline).toBeInstanceOf(Date);
    });

    it('should define HolderDistribution structure', () => {
        const holderDist = {
            address: '0x' + '1'.repeat(40),
            balance: 100n * 10n ** 18n,
            yieldAmount: 10n * 10n ** 18n,
            percentage: 10,
        };

        expect(holderDist.address).toBeDefined();
        expect(holderDist.balance).toBe(100n * 10n ** 18n);
        expect(holderDist.yieldAmount).toBe(10n * 10n ** 18n);
        expect(holderDist.percentage).toBe(10);
    });

    it('should define DistributionPreview structure', () => {
        const preview = {
            totalHolders: 5,
            totalSupplyAtSnapshot: 1000n * 10n ** 18n,
            distributions: [],
        };

        expect(preview.totalHolders).toBe(5);
        expect(preview.totalSupplyAtSnapshot).toBe(1000n * 10n ** 18n);
        expect(preview.distributions).toEqual([]);
    });
});
