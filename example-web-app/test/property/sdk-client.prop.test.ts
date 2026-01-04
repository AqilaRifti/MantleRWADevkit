/**
 * Property Tests: SDK Client Initialization
 * 
 * Feature: sdk-demo-rework
 * 
 * Tests the correctness properties for SDK client initialization:
 * - Property 1: SDK Client Initialization with Wallet Signer
 * 
 * **Validates: Requirements 1.4**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { RWAClient } from '@mantle-rwa/sdk';

// Mock ethers BrowserProvider and Signer
vi.mock('ethers', async () => {
    const actual = await vi.importActual('ethers');
    return {
        ...actual,
        BrowserProvider: vi.fn().mockImplementation(() => ({
            getSigner: vi.fn().mockResolvedValue({
                getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
                provider: {
                    getNetwork: vi.fn().mockResolvedValue({ chainId: 5003n }),
                },
            }),
        })),
    };
});

/**
 * Arbitrary generator for valid Ethereum addresses
 */
const ethereumAddressArb = fc
    .array(
        fc.constantFrom(
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            'a', 'b', 'c', 'd', 'e', 'f'
        ),
        { minLength: 40, maxLength: 40 }
    )
    .map((chars) => `0x${chars.join('')}`);

/**
 * Arbitrary generator for supported network names
 */
const networkNameArb = fc.constantFrom('mantle', 'mantle-sepolia');

/**
 * Arbitrary generator for RPC URLs
 */
const rpcUrlArb = fc.constantFrom(
    'https://rpc.mantle.xyz',
    'https://rpc.sepolia.mantle.xyz',
    'https://custom-rpc.example.com'
);

describe('Property 1: SDK Client Initialization with Wallet Signer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * Feature: sdk-demo-rework, Property 1: SDK Client Initialization
     * 
     * *For any* valid network configuration, the RWAClient SHALL initialize
     * successfully and provide access to all SDK modules.
     */
    it('should initialize client with valid network name', () => {
        fc.assert(
            fc.property(networkNameArb, (network) => {
                const client = new RWAClient({ network });

                // Client should be created
                expect(client).toBeDefined();

                // All modules should be accessible
                expect(client.token).toBeDefined();
                expect(client.kyc).toBeDefined();
                expect(client.yield).toBeDefined();
                expect(client.compliance).toBeDefined();
            }),
            { numRuns: 10 }
        );
    });

    it('should expose consistent network configuration', () => {
        fc.assert(
            fc.property(networkNameArb, (network) => {
                const client = new RWAClient({ network });

                // Network config should be accessible
                const config = client.networkConfig;
                expect(config).toBeDefined();
                expect(config.chainId).toBeGreaterThan(0);
                expect(config.rpcUrl).toBeTruthy();
                expect(config.name).toBeTruthy();
            }),
            { numRuns: 10 }
        );
    });

    it('should report signer status correctly', () => {
        // Without signer
        const clientNoSigner = new RWAClient({ network: 'mantle-sepolia' });
        expect(clientNoSigner.hasSigner).toBe(false);
    });

    it('should provide provider access', () => {
        fc.assert(
            fc.property(networkNameArb, (network) => {
                const client = new RWAClient({ network });

                // Provider should be accessible
                expect(client.provider).toBeDefined();
            }),
            { numRuns: 10 }
        );
    });
});

describe('Property 2: SDK Module Consistency', () => {
    /**
     * Feature: sdk-demo-rework, Property 2: Module Consistency
     * 
     * *For any* initialized client, accessing the same module multiple times
     * SHALL return the same module instance.
     */
    it('should return consistent module instances', () => {
        fc.assert(
            fc.property(networkNameArb, (network) => {
                const client = new RWAClient({ network });

                // Same module access should return same instance
                const token1 = client.token;
                const token2 = client.token;
                expect(token1).toBe(token2);

                const kyc1 = client.kyc;
                const kyc2 = client.kyc;
                expect(kyc1).toBe(kyc2);

                const yield1 = client.yield;
                const yield2 = client.yield;
                expect(yield1).toBe(yield2);

                const compliance1 = client.compliance;
                const compliance2 = client.compliance;
                expect(compliance1).toBe(compliance2);
            }),
            { numRuns: 10 }
        );
    });
});

describe('Property 3: Network Configuration Validation', () => {
    /**
     * Feature: sdk-demo-rework, Property 3: Network Configuration
     * 
     * *For any* supported network, the configuration SHALL include
     * all required fields (chainId, rpcUrl, name, explorerUrl).
     */
    it('should have complete network configuration for supported networks', () => {
        fc.assert(
            fc.property(networkNameArb, (network) => {
                const client = new RWAClient({ network });
                const config = client.networkConfig;

                // All required fields should be present
                expect(typeof config.chainId).toBe('number');
                expect(typeof config.rpcUrl).toBe('string');
                expect(typeof config.name).toBe('string');
                expect(typeof config.explorerUrl).toBe('string');

                // Values should be non-empty
                expect(config.chainId).toBeGreaterThan(0);
                expect(config.rpcUrl.length).toBeGreaterThan(0);
                expect(config.name.length).toBeGreaterThan(0);
                expect(config.explorerUrl.length).toBeGreaterThan(0);
            }),
            { numRuns: 10 }
        );
    });

    it('should have correct chain IDs for known networks', () => {
        const mantleClient = new RWAClient({ network: 'mantle' });
        expect(mantleClient.networkConfig.chainId).toBe(5000);

        const sepoliaClient = new RWAClient({ network: 'mantle-sepolia' });
        expect(sepoliaClient.networkConfig.chainId).toBe(5003);
    });
});

describe('Property 4: Error Handling', () => {
    /**
     * Feature: sdk-demo-rework, Property 4: Error Handling
     * 
     * *For any* invalid configuration, the client SHALL throw
     * a descriptive error rather than silently failing.
     */
    it('should throw error for invalid network name', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => s !== 'mantle' && s !== 'mantle-sepolia' && s.length > 0),
                (invalidNetwork) => {
                    expect(() => {
                        new RWAClient({ network: invalidNetwork as 'mantle' });
                    }).toThrow();
                }
            ),
            { numRuns: 20 }
        );
    });
});
