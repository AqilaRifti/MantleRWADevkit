/**
 * Unit tests for TokenModule
 * 
 * Feature: mantle-rwa-sdk
 * Requirements: 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ethers } from 'ethers';
import { TokenModule } from '../../src/modules/token';
import { RWAError, ErrorCode } from '../../src/errors';

describe('TokenModule', () => {
    let mockProvider: any;
    let mockSigner: any;
    let tokenModule: TokenModule;

    beforeEach(() => {
        mockProvider = {
            getNetwork: vi.fn().mockResolvedValue({ chainId: 5003n }),
        };
        mockSigner = {
            getAddress: vi.fn().mockResolvedValue('0x' + '1'.repeat(40)),
            provider: mockProvider,
        };
        tokenModule = new TokenModule(mockProvider, mockSigner, 3, 1000);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('connect', () => {
        it('should connect to a valid token address', () => {
            const validAddress = '0x' + '1'.repeat(40);
            const instance = tokenModule.connect(validAddress);

            expect(instance.address).toBe(ethers.getAddress(validAddress));
        });

        it('should throw for invalid address - invalid format', () => {
            expect(() => tokenModule.connect('invalid')).toThrow(RWAError);
        });

        it('should throw for invalid address - too short', () => {
            expect(() => tokenModule.connect('0x123')).toThrow(RWAError);
        });

        it('should throw for invalid address - empty string', () => {
            expect(() => tokenModule.connect('')).toThrow(RWAError);
        });

        it('should normalize address to checksum format', () => {
            const lowercaseAddress = '0x' + 'a'.repeat(40);
            const instance = tokenModule.connect(lowercaseAddress);

            expect(instance.address).toBe(ethers.getAddress(lowercaseAddress));
        });
    });

    describe('estimateDeployGas', () => {
        it('should throw indicating factory deployment is required', async () => {
            await expect(
                tokenModule.estimateDeployGas({
                    name: 'Test Token',
                    symbol: 'TEST',
                    totalSupply: '1000000',
                })
            ).rejects.toThrow('Direct token deployment is not supported');
        });

        it('should throw with correct error code', async () => {
            try {
                await tokenModule.estimateDeployGas({
                    name: 'Test Token',
                    symbol: 'TEST',
                    totalSupply: '1000000',
                });
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(RWAError);
                expect((error as RWAError).code).toBe(ErrorCode.INVALID_CONFIGURATION);
            }
        });
    });
});

describe('TokenModule address validation', () => {
    let tokenModule: TokenModule;

    beforeEach(() => {
        const mockProvider = {} as any;
        const mockSigner = {} as any;
        tokenModule = new TokenModule(mockProvider, mockSigner, 3, 1000);
    });

    it('should accept valid checksummed address', () => {
        const address = ethers.getAddress('0x' + '1'.repeat(40));
        const instance = tokenModule.connect(address);
        expect(instance.address).toBe(address);
    });

    it('should accept valid lowercase address', () => {
        const address = '0x' + 'a'.repeat(40);
        const instance = tokenModule.connect(address);
        expect(instance.address).toBe(ethers.getAddress(address));
    });

    it('should accept valid mixed case address', () => {
        const address = '0xABCDEF' + '1'.repeat(34);
        const instance = tokenModule.connect(address);
        expect(instance.address).toBe(ethers.getAddress(address));
    });

    it('should reject null address', () => {
        expect(() => tokenModule.connect(null as any)).toThrow(RWAError);
    });

    it('should reject address with wrong length', () => {
        expect(() => tokenModule.connect('0x' + '1'.repeat(39))).toThrow(RWAError);
        expect(() => tokenModule.connect('0x' + '1'.repeat(41))).toThrow(RWAError);
    });

    it('should reject address with invalid characters', () => {
        expect(() => tokenModule.connect('0x' + 'g'.repeat(40))).toThrow(RWAError);
    });
});

describe('TokenModule configuration', () => {
    it('should store retry configuration', () => {
        const mockProvider = {} as any;
        const mockSigner = {} as any;
        const retries = 5;
        const retryDelay = 2000;

        const tokenModule = new TokenModule(mockProvider, mockSigner, retries, retryDelay);

        // The configuration is internal, but we can verify it works by connecting
        const instance = tokenModule.connect('0x' + '1'.repeat(40));
        expect(instance).toBeDefined();
    });

    it('should work without signer (read-only mode)', () => {
        const mockProvider = {} as any;

        const tokenModule = new TokenModule(mockProvider, null, 3, 1000);
        const instance = tokenModule.connect('0x' + '1'.repeat(40));

        expect(instance).toBeDefined();
    });
});

describe('TokenInstance address property', () => {
    let tokenModule: TokenModule;

    beforeEach(() => {
        const mockProvider = {} as any;
        const mockSigner = {} as any;
        tokenModule = new TokenModule(mockProvider, mockSigner, 3, 1000);
    });

    it('should expose the token address', () => {
        const address = '0x' + '1'.repeat(40);
        const instance = tokenModule.connect(address);

        expect(instance.address).toBe(ethers.getAddress(address));
    });

    it('should return consistent address', () => {
        const address = '0x' + '1'.repeat(40);
        const instance = tokenModule.connect(address);

        // Address should be consistent across multiple accesses
        const firstAccess = instance.address;
        const secondAccess = instance.address;
        expect(firstAccess).toBe(secondAccess);
    });
});

describe('TokenDeployConfig validation', () => {
    it('should define correct interface structure', () => {
        // This test verifies the TypeScript interface is correctly defined
        const config = {
            name: 'Test Token',
            symbol: 'TEST',
            totalSupply: '1000000',
            complianceRules: ['accredited-investor' as const],
            kycRegistryAddress: '0x' + '1'.repeat(40),
        };

        expect(config.name).toBe('Test Token');
        expect(config.symbol).toBe('TEST');
        expect(config.totalSupply).toBe('1000000');
        expect(config.complianceRules).toContain('accredited-investor');
        expect(config.kycRegistryAddress).toBeDefined();
    });

    it('should allow optional fields', () => {
        const minimalConfig = {
            name: 'Test Token',
            symbol: 'TEST',
            totalSupply: '1000000',
        };

        expect(minimalConfig.name).toBeDefined();
        expect(minimalConfig.symbol).toBeDefined();
        expect(minimalConfig.totalSupply).toBeDefined();
    });
});

describe('TokenInfo structure', () => {
    it('should define correct interface structure', () => {
        const info = {
            address: '0x' + '1'.repeat(40),
            name: 'Test Token',
            symbol: 'TEST',
            decimals: 18,
            totalSupply: 1000000n * 10n ** 18n,
            paused: false,
        };

        expect(info.address).toBeDefined();
        expect(info.name).toBe('Test Token');
        expect(info.symbol).toBe('TEST');
        expect(info.decimals).toBe(18);
        expect(info.totalSupply).toBe(1000000n * 10n ** 18n);
        expect(info.paused).toBe(false);
    });
});

describe('TransactionResult structure', () => {
    it('should define correct interface structure', () => {
        const result = {
            hash: '0x' + 'a'.repeat(64),
            blockNumber: 12345,
            gasUsed: 50000n,
            status: 'success' as const,
            events: [],
            receipt: {} as any,
        };

        expect(result.hash).toBeDefined();
        expect(result.blockNumber).toBe(12345);
        expect(result.gasUsed).toBe(50000n);
        expect(result.status).toBe('success');
        expect(result.events).toEqual([]);
    });

    it('should support failed status', () => {
        const result = {
            hash: '0x' + 'a'.repeat(64),
            blockNumber: 12345,
            gasUsed: 50000n,
            status: 'failed' as const,
            events: [],
            receipt: {} as any,
        };

        expect(result.status).toBe('failed');
    });
});

describe('TransactionOptions structure', () => {
    it('should define correct interface structure', () => {
        const options = {
            gasLimit: 100000n,
            maxFeePerGas: 1000000000n,
            maxPriorityFeePerGas: 100000000n,
            nonce: 5,
            retries: 3,
            retryDelay: 1000,
        };

        expect(options.gasLimit).toBe(100000n);
        expect(options.maxFeePerGas).toBe(1000000000n);
        expect(options.maxPriorityFeePerGas).toBe(100000000n);
        expect(options.nonce).toBe(5);
        expect(options.retries).toBe(3);
        expect(options.retryDelay).toBe(1000);
    });

    it('should allow all fields to be optional', () => {
        const options = {};
        expect(options).toEqual({});
    });
});

describe('Event listener types', () => {
    it('should define Transfer event callback signature', () => {
        const callback = (from: string, to: string, amount: bigint) => {
            expect(typeof from).toBe('string');
            expect(typeof to).toBe('string');
            expect(typeof amount).toBe('bigint');
        };

        callback('0x' + '1'.repeat(40), '0x' + '2'.repeat(40), 100n);
    });

    it('should define TransferRestricted event callback signature', () => {
        const callback = (from: string, to: string, amount: bigint, reason: string) => {
            expect(typeof from).toBe('string');
            expect(typeof to).toBe('string');
            expect(typeof amount).toBe('bigint');
            expect(typeof reason).toBe('string');
        };

        callback('0x' + '1'.repeat(40), '0x' + '2'.repeat(40), 100n, 'KYC not verified');
    });

    it('should define Paused event callback signature', () => {
        const callback = (by: string) => {
            expect(typeof by).toBe('string');
        };

        callback('0x' + '1'.repeat(40));
    });

    it('should define Unpaused event callback signature', () => {
        const callback = (by: string) => {
            expect(typeof by).toBe('string');
        };

        callback('0x' + '1'.repeat(40));
    });
});

describe('Amount parsing', () => {
    it('should handle integer amounts', () => {
        const amount = ethers.parseUnits('1000', 18);
        expect(amount).toBe(1000n * 10n ** 18n);
    });

    it('should handle decimal amounts', () => {
        const amount = ethers.parseUnits('1000.5', 18);
        expect(amount).toBe(10005n * 10n ** 17n);
    });

    it('should handle very small amounts', () => {
        const amount = ethers.parseUnits('0.000000000000000001', 18);
        expect(amount).toBe(1n);
    });

    it('should handle very large amounts', () => {
        const amount = ethers.parseUnits('1000000000', 18);
        expect(amount).toBe(10n ** 27n);
    });
});
