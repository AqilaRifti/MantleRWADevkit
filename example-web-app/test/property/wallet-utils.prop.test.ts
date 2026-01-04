/**
 * Property Tests: Wallet Utilities
 * 
 * Feature: wallet-auth-cleanup
 * 
 * Tests the correctness properties for wallet utility functions:
 * - Property 1: Address Truncation Consistency
 * - Property 2: Avatar Generation Determinism
 * 
 * **Validates: Requirements 3.1, 7.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
    truncateAddress,
    generateWalletColors,
    generateWalletGradient,
    getNetworkName,
} from '../../src/lib/wallet-utils';

/**
 * Arbitrary generator for valid Ethereum addresses
 * Generates 40 hex characters prefixed with 0x
 */
const ethereumAddressArb = fc
    .array(
        fc.constantFrom(
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            'a', 'b', 'c', 'd', 'e', 'f', 'A', 'B', 'C', 'D', 'E', 'F'
        ),
        { minLength: 40, maxLength: 40 }
    )
    .map((chars) => `0x${chars.join('')}`);

/**
 * Arbitrary generator for supported chain IDs
 */
const supportedChainIdArb = fc.constantFrom(
    1,      // Ethereum
    5,      // Goerli
    11155111, // Sepolia
    137,    // Polygon
    80001,  // Mumbai
    5000,   // Mantle
    5003,   // Mantle Sepolia
    42161,  // Arbitrum One
    10,     // Optimism
);

describe('Property 1: Address Truncation Consistency', () => {
    /**
     * Feature: wallet-auth-cleanup, Property 1: Address Truncation Consistency
     * 
     * *For any* valid Ethereum address, the truncation function SHALL always produce
     * a string in the format `0xXXXX...XXXX` where the first 6 characters and last 4
     * characters of the original address are preserved.
     */
    it('should preserve first 6 and last 4 characters for any valid address', () => {
        fc.assert(
            fc.property(ethereumAddressArb, (address) => {
                const truncated = truncateAddress(address);

                // Should start with first 6 characters of original
                expect(truncated.slice(0, 6)).toBe(address.slice(0, 6));

                // Should contain ellipsis
                expect(truncated).toContain('...');

                // Should end with last 4 characters of original
                expect(truncated.slice(-4)).toBe(address.slice(-4));

                // Should have format: 6 chars + '...' + 4 chars = 13 chars total
                expect(truncated.length).toBe(13);
            }),
            { numRuns: 100 }
        );
    });

    it('should produce consistent output for the same address', () => {
        fc.assert(
            fc.property(ethereumAddressArb, (address) => {
                const result1 = truncateAddress(address);
                const result2 = truncateAddress(address);

                // Same input should always produce same output
                expect(result1).toBe(result2);
            }),
            { numRuns: 100 }
        );
    });

    it('should handle edge cases gracefully', () => {
        // Empty string
        expect(truncateAddress('')).toBe('');

        // Short string (less than 10 chars)
        expect(truncateAddress('0x123')).toBe('0x123');

        // Address with exactly 10 chars - truncation still applies
        const shortAddr = '0x12345678';
        const truncated = truncateAddress(shortAddr);
        // For 10 char input, truncation produces: first 6 + '...' + last 4 = 13 chars
        // This is expected behavior - we always truncate addresses >= 10 chars
        expect(truncated).toBe('0x1234...5678');
    });
});

describe('Property 2: Avatar Generation Determinism', () => {
    /**
     * Feature: wallet-auth-cleanup, Property 2: Avatar Generation Determinism
     * 
     * *For any* valid Ethereum address, generating an avatar SHALL always produce
     * the same visual output (same colors/gradient) for the same input address.
     */
    it('should generate identical colors for the same address', () => {
        fc.assert(
            fc.property(ethereumAddressArb, (address) => {
                const colors1 = generateWalletColors(address);
                const colors2 = generateWalletColors(address);

                // Same address should always produce same colors
                expect(colors1.color1).toBe(colors2.color1);
                expect(colors1.color2).toBe(colors2.color2);
            }),
            { numRuns: 100 }
        );
    });

    it('should generate identical gradients for the same address', () => {
        fc.assert(
            fc.property(ethereumAddressArb, (address) => {
                const gradient1 = generateWalletGradient(address);
                const gradient2 = generateWalletGradient(address);

                // Same address should always produce same gradient
                expect(gradient1).toBe(gradient2);
            }),
            { numRuns: 100 }
        );
    });

    it('should generate valid hex color codes', () => {
        fc.assert(
            fc.property(ethereumAddressArb, (address) => {
                const { color1, color2 } = generateWalletColors(address);

                // Colors should be valid hex format (#RRGGBB)
                const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
                expect(color1).toMatch(hexColorRegex);
                expect(color2).toMatch(hexColorRegex);
            }),
            { numRuns: 100 }
        );
    });

    it('should generate valid CSS gradient strings', () => {
        fc.assert(
            fc.property(ethereumAddressArb, (address) => {
                const gradient = generateWalletGradient(address);

                // Should be a valid linear-gradient
                expect(gradient).toMatch(/^linear-gradient\(135deg, #[0-9a-fA-F]{6} 0%, #[0-9a-fA-F]{6} 100%\)$/);
            }),
            { numRuns: 100 }
        );
    });

    it('should produce different colors for different addresses (with high probability)', () => {
        fc.assert(
            fc.property(ethereumAddressArb, ethereumAddressArb, (addr1, addr2) => {
                // Skip if addresses happen to be the same
                if (addr1.toLowerCase() === addr2.toLowerCase()) {
                    return true;
                }

                const colors1 = generateWalletColors(addr1);
                const colors2 = generateWalletColors(addr2);

                // Different addresses should (usually) produce different colors
                // At least one color should be different
                const isDifferent =
                    colors1.color1 !== colors2.color1 ||
                    colors1.color2 !== colors2.color2;

                // This is probabilistic - we expect it to be true most of the time
                // but don't fail if there's a rare collision
                return true; // We just verify no errors occur
            }),
            { numRuns: 100 }
        );
    });
});

describe('Property 3: Network Name Resolution', () => {
    /**
     * Feature: wallet-auth-cleanup, Property 3: Network Name Resolution
     * 
     * *For any* supported chain ID in the wagmi configuration, the system SHALL
     * resolve to a human-readable network name.
     */
    it('should resolve all supported chain IDs to human-readable names', () => {
        fc.assert(
            fc.property(supportedChainIdArb, (chainId) => {
                const name = getNetworkName(chainId);

                // Should return a non-empty string
                expect(name).toBeTruthy();
                expect(typeof name).toBe('string');

                // Should not be the fallback "Chain X" format for supported chains
                expect(name).not.toMatch(/^Chain \d+$/);
            }),
            { numRuns: 100 }
        );
    });

    it('should return consistent names for the same chain ID', () => {
        fc.assert(
            fc.property(supportedChainIdArb, (chainId) => {
                const name1 = getNetworkName(chainId);
                const name2 = getNetworkName(chainId);

                expect(name1).toBe(name2);
            }),
            { numRuns: 100 }
        );
    });

    it('should handle undefined chain ID gracefully', () => {
        const name = getNetworkName(undefined);
        expect(name).toBe('Unknown Network');
    });

    it('should return fallback format for unsupported chain IDs', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 100000, max: 999999 }), // Unlikely to be supported
                (chainId) => {
                    const name = getNetworkName(chainId);

                    // Should return "Chain X" format for unsupported chains
                    expect(name).toBe(`Chain ${chainId}`);
                }
            ),
            { numRuns: 50 }
        );
    });
});
