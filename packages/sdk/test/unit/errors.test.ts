/**
 * Unit tests for error handling
 */

import { describe, it, expect } from 'vitest';
import {
    RWAError,
    ContractError,
    NetworkError,
    ValidationError,
    ErrorCode,
    parseContractError,
    parseNetworkError,
} from '../../src';

describe('RWAError', () => {
    it('should create error with code and message', () => {
        const error = new RWAError(ErrorCode.NOT_VERIFIED, 'Account not verified');
        expect(error.code).toBe(ErrorCode.NOT_VERIFIED);
        expect(error.message).toBe('Account not verified');
        expect(error.suggestion).toContain('KYC registry');
    });

    it('should include details when provided', () => {
        const error = new RWAError(ErrorCode.INVALID_ADDRESS, 'Bad address', {
            address: '0xinvalid',
        });
        expect(error.details).toEqual({ address: '0xinvalid' });
    });

    it('should format error string with suggestion', () => {
        const error = new RWAError(ErrorCode.TOKENS_PAUSED, 'Transfers paused');
        const formatted = error.toFormattedString();
        expect(formatted).toContain('[TOKENS_PAUSED]');
        expect(formatted).toContain('Transfers paused');
        expect(formatted).toContain('Suggested fix:');
    });
});

describe('ContractError', () => {
    it('should include contract details', () => {
        const error = new ContractError(
            ErrorCode.TRANSFER_RESTRICTED,
            'Transfer blocked',
            '0x1234567890123456789012345678901234567890',
            'transfer',
            'KYC not verified'
        );
        expect(error.contractAddress).toBe('0x1234567890123456789012345678901234567890');
        expect(error.functionName).toBe('transfer');
        expect(error.revertReason).toBe('KYC not verified');
    });
});

describe('NetworkError', () => {
    it('should include network details', () => {
        const error = new NetworkError(
            ErrorCode.RPC_ERROR,
            'Connection failed',
            true,
            5003,
            'https://rpc.sepolia.mantle.xyz'
        );
        expect(error.chainId).toBe(5003);
        expect(error.rpcUrl).toBe('https://rpc.sepolia.mantle.xyz');
        expect(error.retryable).toBe(true);
    });
});

describe('ValidationError', () => {
    it('should include validation details', () => {
        const error = new ValidationError(
            ErrorCode.INVALID_AMOUNT,
            'Amount must be positive',
            'amount',
            'positive',
            -100
        );
        expect(error.field).toBe('amount');
        expect(error.constraint).toBe('positive');
        expect(error.value).toBe(-100);
    });
});

describe('parseContractError', () => {
    it('should parse NotVerified error', () => {
        const error = parseContractError(
            { reason: 'NotVerified: account not in whitelist' },
            '0x1234567890123456789012345678901234567890',
            'transfer'
        );
        expect(error.code).toBe(ErrorCode.NOT_VERIFIED);
    });

    it('should parse Paused error', () => {
        const error = parseContractError(
            { message: 'Pausable: paused' },
            '0x1234567890123456789012345678901234567890',
            'transfer'
        );
        expect(error.code).toBe(ErrorCode.TOKENS_PAUSED);
    });

    it('should return UNKNOWN for unrecognized errors', () => {
        const error = parseContractError(
            { message: 'Something weird happened' },
            '0x1234567890123456789012345678901234567890',
            'someFunction'
        );
        expect(error.code).toBe(ErrorCode.UNKNOWN);
    });
});

describe('parseNetworkError', () => {
    it('should parse nonce error as retryable', () => {
        const error = parseNetworkError({ message: 'nonce too low' }, 5003);
        expect(error.code).toBe(ErrorCode.NONCE_TOO_LOW);
        expect(error.retryable).toBe(true);
    });

    it('should parse insufficient funds as non-retryable', () => {
        const error = parseNetworkError({ message: 'insufficient funds for gas' });
        expect(error.code).toBe(ErrorCode.INSUFFICIENT_FUNDS);
        expect(error.retryable).toBe(false);
    });

    it('should parse timeout as retryable', () => {
        const error = parseNetworkError({ message: 'ETIMEDOUT' });
        expect(error.code).toBe(ErrorCode.TIMEOUT);
        expect(error.retryable).toBe(true);
    });
});
