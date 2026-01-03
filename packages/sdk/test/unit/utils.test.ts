/**
 * Unit tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import {
    isValidAddress,
    normalizeAddress,
    parseAmount,
    formatAmount,
    hashIdentityData,
    timestampToDate,
    dateToTimestamp,
    isExpired,
    calculatePercentage,
} from '../../src';

describe('isValidAddress', () => {
    it('should return true for valid addresses', () => {
        expect(isValidAddress('0x1234567890123456789012345678901234567890')).toBe(true);
        expect(isValidAddress('0xABCDEF1234567890123456789012345678901234')).toBe(true);
    });

    it('should return false for invalid addresses', () => {
        expect(isValidAddress('0x123')).toBe(false);
        expect(isValidAddress('not-an-address')).toBe(false);
        expect(isValidAddress('')).toBe(false);
    });
});

describe('normalizeAddress', () => {
    it('should checksum valid addresses', () => {
        const address = '0x1234567890123456789012345678901234567890';
        const normalized = normalizeAddress(address);
        expect(normalized).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it('should throw for invalid addresses', () => {
        expect(() => normalizeAddress('invalid')).toThrow('Invalid address');
    });
});

describe('parseAmount', () => {
    it('should parse amounts with default 18 decimals', () => {
        expect(parseAmount('1')).toBe(1000000000000000000n);
        expect(parseAmount('0.5')).toBe(500000000000000000n);
    });

    it('should parse amounts with custom decimals', () => {
        expect(parseAmount('1', 6)).toBe(1000000n);
        expect(parseAmount('100', 8)).toBe(10000000000n);
    });
});

describe('formatAmount', () => {
    it('should format amounts with default 18 decimals', () => {
        expect(formatAmount(1000000000000000000n)).toBe('1.0');
        expect(formatAmount(500000000000000000n)).toBe('0.5');
    });

    it('should format amounts with custom decimals', () => {
        expect(formatAmount(1000000n, 6)).toBe('1.0');
    });
});

describe('hashIdentityData', () => {
    it('should generate consistent hashes', () => {
        const data = {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            documentNumber: 'ABC123',
            country: 'US',
        };
        const hash1 = hashIdentityData(data);
        const hash2 = hashIdentityData(data);
        expect(hash1).toBe(hash2);
        expect(hash1).toMatch(/^0x[0-9a-f]{64}$/);
    });

    it('should normalize input data', () => {
        const data1 = { firstName: 'JOHN', lastName: 'DOE' };
        const data2 = { firstName: 'john', lastName: 'doe' };
        expect(hashIdentityData(data1)).toBe(hashIdentityData(data2));
    });
});

describe('timestampToDate', () => {
    it('should convert Unix timestamp to Date', () => {
        const timestamp = 1704067200; // 2024-01-01 00:00:00 UTC
        const date = timestampToDate(timestamp);
        expect(date.getUTCFullYear()).toBe(2024);
        expect(date.getUTCMonth()).toBe(0);
        expect(date.getUTCDate()).toBe(1);
    });

    it('should handle bigint timestamps', () => {
        const timestamp = 1704067200n;
        const date = timestampToDate(timestamp);
        expect(date.getUTCFullYear()).toBe(2024);
    });
});

describe('dateToTimestamp', () => {
    it('should convert Date to Unix timestamp', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        const timestamp = dateToTimestamp(date);
        expect(timestamp).toBe(1704067200);
    });
});

describe('isExpired', () => {
    it('should return true for past timestamps', () => {
        const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
        expect(isExpired(pastTimestamp)).toBe(true);
    });

    it('should return false for future timestamps', () => {
        const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        expect(isExpired(futureTimestamp)).toBe(false);
    });

    it('should handle bigint timestamps', () => {
        const pastTimestamp = BigInt(Math.floor(Date.now() / 1000) - 3600);
        expect(isExpired(pastTimestamp)).toBe(true);
    });
});

describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
        expect(calculatePercentage(25n, 100n)).toBe(25);
        expect(calculatePercentage(1n, 3n)).toBeCloseTo(33.33, 1);
    });

    it('should return 0 for zero total', () => {
        expect(calculatePercentage(10n, 0n)).toBe(0);
    });
});
