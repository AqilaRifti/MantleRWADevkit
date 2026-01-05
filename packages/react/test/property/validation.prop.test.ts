/**
 * Property-based tests for validation functions
 * 
 * Feature: react-components
 * Tests address and amount validation properties
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isValidAddress, isValidAmount } from '../../src/components/TokenMintForm';

describe('Validation Property Tests', () => {
    /**
     * Feature: react-components, Property 3: Address Validation
     * Validates: Requirements 4.2
     * 
     * For any string input, the validation function SHALL return true
     * if and only if the string is a valid Ethereum address.
     */
    describe('Property 3: Address Validation', () => {
        it('should accept all valid Ethereum addresses', () => {
            // Generate valid Ethereum addresses (0x + 40 hex chars)
            const validAddressArb = fc.hexaString({ minLength: 40, maxLength: 40 })
                .map(hex => `0x${hex}`);

            fc.assert(
                fc.property(validAddressArb, (address) => {
                    return isValidAddress(address) === true;
                }),
                { numRuns: 100 }
            );
        });

        it('should reject addresses without 0x prefix', () => {
            const hexWithoutPrefix = fc.hexaString({ minLength: 40, maxLength: 40 });

            fc.assert(
                fc.property(hexWithoutPrefix, (hex) => {
                    return isValidAddress(hex) === false;
                }),
                { numRuns: 100 }
            );
        });

        it('should reject addresses with wrong length', () => {
            // Too short
            const shortAddress = fc.hexaString({ minLength: 1, maxLength: 39 })
                .map(hex => `0x${hex}`);

            fc.assert(
                fc.property(shortAddress, (address) => {
                    return isValidAddress(address) === false;
                }),
                { numRuns: 100 }
            );

            // Too long
            const longAddress = fc.hexaString({ minLength: 41, maxLength: 100 })
                .map(hex => `0x${hex}`);

            fc.assert(
                fc.property(longAddress, (address) => {
                    return isValidAddress(address) === false;
                }),
                { numRuns: 100 }
            );
        });

        it('should reject non-hex characters', () => {
            // Generate strings with non-hex characters
            const invalidChars = fc.stringOf(
                fc.constantFrom('g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '!', '@', '#'),
                { minLength: 40, maxLength: 40 }
            ).map(s => `0x${s}`);

            fc.assert(
                fc.property(invalidChars, (address) => {
                    return isValidAddress(address) === false;
                }),
                { numRuns: 100 }
            );
        });

        it('should handle empty and null-like inputs', () => {
            expect(isValidAddress('')).toBe(false);
            expect(isValidAddress('0x')).toBe(false);
            expect(isValidAddress('0x0')).toBe(false);
        });
    });

    /**
     * Feature: react-components, Property 4: Amount Validation
     * Validates: Requirements 4.3
     * 
     * For any numeric input, the validation function SHALL return true
     * if and only if the value is a positive number greater than zero.
     */
    describe('Property 4: Amount Validation', () => {
        it('should accept all positive numbers', () => {
            const positiveNumber = fc.double({ min: 0.000001, max: 1e18, noNaN: true })
                .filter(n => n > 0 && isFinite(n));

            fc.assert(
                fc.property(positiveNumber, (num) => {
                    return isValidAmount(num.toString()) === true;
                }),
                { numRuns: 100 }
            );
        });

        it('should accept positive integer strings', () => {
            const positiveInt = fc.integer({ min: 1, max: 1000000000 });

            fc.assert(
                fc.property(positiveInt, (num) => {
                    return isValidAmount(num.toString()) === true;
                }),
                { numRuns: 100 }
            );
        });

        it('should reject zero', () => {
            expect(isValidAmount('0')).toBe(false);
            expect(isValidAmount('0.0')).toBe(false);
            expect(isValidAmount('0.00')).toBe(false);
        });

        it('should reject negative numbers', () => {
            const negativeNumber = fc.double({ min: -1e18, max: -0.000001, noNaN: true })
                .filter(n => n < 0 && isFinite(n));

            fc.assert(
                fc.property(negativeNumber, (num) => {
                    return isValidAmount(num.toString()) === false;
                }),
                { numRuns: 100 }
            );
        });

        it('should reject non-numeric strings', () => {
            const nonNumeric = fc.stringOf(fc.constantFrom('a', 'b', 'c', 'x', 'y', 'z', '!', '@', '#'))
                .filter(s => s.length > 0 && isNaN(parseFloat(s)));

            fc.assert(
                fc.property(nonNumeric, (str) => {
                    return isValidAmount(str) === false;
                }),
                { numRuns: 100 }
            );
        });

        it('should handle empty string', () => {
            expect(isValidAmount('')).toBe(false);
        });

        it('should reject Infinity', () => {
            expect(isValidAmount('Infinity')).toBe(false);
            expect(isValidAmount('-Infinity')).toBe(false);
        });

        it('should reject NaN', () => {
            expect(isValidAmount('NaN')).toBe(false);
        });
    });
});
