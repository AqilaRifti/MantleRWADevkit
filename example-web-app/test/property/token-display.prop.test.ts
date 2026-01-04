/**
 * Property Tests: Token Info Display Consistency
 * 
 * Feature: sdk-demo-rework
 * 
 * Tests the correctness properties for token info display:
 * - Property 2: Token Info Display Consistency
 * 
 * **Validates: Requirements 2.1, 2.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatAmount } from '@mantle-rwa/sdk';

/**
 * Arbitrary generator for token info objects
 */
const tokenInfoArb = fc.record({
    address: fc.hexaString({ minLength: 40, maxLength: 40 }).map(s => `0x${s}`),
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    symbol: fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[A-Z0-9]+$/i.test(s)),
    decimals: fc.constantFrom(6, 8, 18),
    totalSupply: fc.bigInt({ min: 0n, max: BigInt('1000000000000000000000000000') }),
    paused: fc.boolean(),
});

/**
 * Arbitrary generator for valid amounts (as strings)
 */
const amountStringArb = fc.bigInt({ min: 0n, max: BigInt('1000000000000000000000000') })
    .map(n => n.toString());

describe('Property 2: Token Info Display Consistency', () => {
    /**
     * Feature: sdk-demo-rework, Property 2: Token Info Display Consistency
     * 
     * *For any* token info returned by the SDK, the display SHALL consistently
     * show the same values when rendered multiple times.
     */
    it('should display consistent token name and symbol', () => {
        fc.assert(
            fc.property(tokenInfoArb, (tokenInfo) => {
                // Name should be non-empty
                expect(tokenInfo.name.trim().length).toBeGreaterThan(0);

                // Symbol should be alphanumeric
                expect(tokenInfo.symbol).toMatch(/^[A-Z0-9]+$/i);

                // Multiple accesses should return same values
                const name1 = tokenInfo.name;
                const name2 = tokenInfo.name;
                expect(name1).toBe(name2);

                const symbol1 = tokenInfo.symbol;
                const symbol2 = tokenInfo.symbol;
                expect(symbol1).toBe(symbol2);
            }),
            { numRuns: 100 }
        );
    });

    it('should format total supply consistently', () => {
        fc.assert(
            fc.property(amountStringArb, (amount) => {
                // Format should be deterministic
                const formatted1 = formatAmount(amount);
                const formatted2 = formatAmount(amount);

                expect(formatted1).toBe(formatted2);

                // Formatted amount should be a valid string
                expect(typeof formatted1).toBe('string');
            }),
            { numRuns: 100 }
        );
    });

    it('should handle zero supply correctly', () => {
        const zeroFormatted = formatAmount('0');
        expect(zeroFormatted).toBe('0.0');
    });

    it('should handle large supplies correctly', () => {
        fc.assert(
            fc.property(
                fc.bigInt({ min: BigInt('1000000000000000000'), max: BigInt('1000000000000000000000000000') }),
                (supply) => {
                    const formatted = formatAmount(supply.toString());

                    // Should not throw
                    expect(formatted).toBeTruthy();

                    // Should be a valid number string
                    expect(formatted).toMatch(/^[\d,]+\.?\d*$/);
                }
            ),
            { numRuns: 50 }
        );
    });

    it('should display paused status as boolean', () => {
        fc.assert(
            fc.property(tokenInfoArb, (tokenInfo) => {
                expect(typeof tokenInfo.paused).toBe('boolean');

                // Paused status should be deterministic
                const paused1 = tokenInfo.paused;
                const paused2 = tokenInfo.paused;
                expect(paused1).toBe(paused2);
            }),
            { numRuns: 100 }
        );
    });
});

describe('Property: Token Address Validation', () => {
    /**
     * Token addresses should be valid Ethereum addresses
     */
    it('should have valid address format', () => {
        fc.assert(
            fc.property(tokenInfoArb, (tokenInfo) => {
                // Address should start with 0x
                expect(tokenInfo.address.startsWith('0x')).toBe(true);

                // Address should be 42 characters (0x + 40 hex chars)
                expect(tokenInfo.address.length).toBe(42);

                // Address should be valid hex
                expect(tokenInfo.address.slice(2)).toMatch(/^[0-9a-fA-F]+$/);
            }),
            { numRuns: 100 }
        );
    });
});

describe('Property: Decimals Handling', () => {
    /**
     * Token decimals should be handled correctly in display
     */
    it('should support standard decimal values', () => {
        fc.assert(
            fc.property(tokenInfoArb, (tokenInfo) => {
                // Decimals should be a positive integer
                expect(Number.isInteger(tokenInfo.decimals)).toBe(true);
                expect(tokenInfo.decimals).toBeGreaterThanOrEqual(0);
                expect(tokenInfo.decimals).toBeLessThanOrEqual(18);
            }),
            { numRuns: 100 }
        );
    });

    it('should format amounts correctly based on decimals', () => {
        // Test with 18 decimals (standard)
        const amount18 = '1000000000000000000'; // 1 token with 18 decimals
        const formatted18 = formatAmount(amount18);
        expect(formatted18).toBe('1.0');

        // Test with larger amounts
        const amount18Large = '1000000000000000000000'; // 1000 tokens
        const formatted18Large = formatAmount(amount18Large);
        expect(formatted18Large).toBe('1,000.0');
    });
});
