/**
 * Property Test: Error Display with Codes and Suggestions
 * 
 * Validates: Requirements 11.2, 11.4
 * 
 * Property: Error handling should:
 * 1. Display appropriate error codes for different error types
 * 2. Provide actionable suggestions for common errors
 * 3. Preserve original error information
 * 4. Handle unknown errors gracefully
 */

import { describe, it, expect } from 'vitest';

// Mock error types matching SDK
enum ErrorCode {
    INVALID_ADDRESS = 'INVALID_ADDRESS',
    INVALID_AMOUNT = 'INVALID_AMOUNT',
    INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
    NOT_AUTHORIZED = 'NOT_AUTHORIZED',
    KYC_NOT_VERIFIED = 'KYC_NOT_VERIFIED',
    TOKEN_PAUSED = 'TOKEN_PAUSED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    CONTRACT_ERROR = 'CONTRACT_ERROR',
    SIGNER_REQUIRED = 'SIGNER_REQUIRED',
    PROVIDER_NOT_CONFIGURED = 'PROVIDER_NOT_CONFIGURED',
    INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

interface RWAError {
    code: ErrorCode;
    message: string;
    originalError?: Error;
}

interface ErrorDisplay {
    code: ErrorCode;
    title: string;
    message: string;
    suggestions: string[];
    isRetryable: boolean;
}

// Error suggestions mapping
const ERROR_SUGGESTIONS: Record<ErrorCode, string[]> = {
    [ErrorCode.INVALID_ADDRESS]: [
        'Check that the address starts with "0x"',
        'Ensure the address is 42 characters long',
        'Verify the address is a valid Ethereum address',
    ],
    [ErrorCode.INVALID_AMOUNT]: [
        'Enter a positive number',
        'Check for valid decimal places',
        'Ensure amount is within allowed range',
    ],
    [ErrorCode.INSUFFICIENT_BALANCE]: [
        'Check your current balance',
        'Reduce the transfer amount',
        'Acquire more tokens before transferring',
    ],
    [ErrorCode.NOT_AUTHORIZED]: [
        'Verify you have the required role',
        'Contact an administrator for access',
        'Check if your permissions have expired',
    ],
    [ErrorCode.KYC_NOT_VERIFIED]: [
        'Complete the KYC verification process',
        'Check if your verification has expired',
        'Contact support if verification is pending',
    ],
    [ErrorCode.TOKEN_PAUSED]: [
        'Wait for the token to be unpaused',
        'Contact the compliance officer',
        'Check announcements for pause duration',
    ],
    [ErrorCode.NETWORK_ERROR]: [
        'Check your internet connection',
        'Try again in a few moments',
        'Switch to a different RPC endpoint',
    ],
    [ErrorCode.CONTRACT_ERROR]: [
        'Verify contract addresses are correct',
        'Check if the contract is deployed on this network',
        'Review transaction parameters',
    ],
    [ErrorCode.SIGNER_REQUIRED]: [
        'Connect your wallet',
        'Approve the connection request',
        'Try reconnecting your wallet',
    ],
    [ErrorCode.PROVIDER_NOT_CONFIGURED]: [
        'Configure the required provider',
        'Check provider API credentials',
        'Review provider documentation',
    ],
    [ErrorCode.INVALID_CONFIGURATION]: [
        'Review configuration settings',
        'Check for missing required fields',
        'Consult the documentation',
    ],
    [ErrorCode.UNKNOWN_ERROR]: [
        'Try the operation again',
        'Check the console for more details',
        'Contact support if the issue persists',
    ],
};

// Error titles mapping
const ERROR_TITLES: Record<ErrorCode, string> = {
    [ErrorCode.INVALID_ADDRESS]: 'Invalid Address',
    [ErrorCode.INVALID_AMOUNT]: 'Invalid Amount',
    [ErrorCode.INSUFFICIENT_BALANCE]: 'Insufficient Balance',
    [ErrorCode.NOT_AUTHORIZED]: 'Not Authorized',
    [ErrorCode.KYC_NOT_VERIFIED]: 'KYC Not Verified',
    [ErrorCode.TOKEN_PAUSED]: 'Token Paused',
    [ErrorCode.NETWORK_ERROR]: 'Network Error',
    [ErrorCode.CONTRACT_ERROR]: 'Contract Error',
    [ErrorCode.SIGNER_REQUIRED]: 'Wallet Required',
    [ErrorCode.PROVIDER_NOT_CONFIGURED]: 'Provider Not Configured',
    [ErrorCode.INVALID_CONFIGURATION]: 'Invalid Configuration',
    [ErrorCode.UNKNOWN_ERROR]: 'Unknown Error',
};

// Retryable errors
const RETRYABLE_ERRORS = new Set([
    ErrorCode.NETWORK_ERROR,
    ErrorCode.CONTRACT_ERROR,
]);

/**
 * Format error for display
 */
function formatErrorForDisplay(error: RWAError | Error): ErrorDisplay {
    // Handle RWA errors
    if ('code' in error && Object.values(ErrorCode).includes(error.code as ErrorCode)) {
        const rwaError = error as RWAError;
        return {
            code: rwaError.code,
            title: ERROR_TITLES[rwaError.code],
            message: rwaError.message,
            suggestions: ERROR_SUGGESTIONS[rwaError.code],
            isRetryable: RETRYABLE_ERRORS.has(rwaError.code),
        };
    }

    // Handle generic errors
    return {
        code: ErrorCode.UNKNOWN_ERROR,
        title: ERROR_TITLES[ErrorCode.UNKNOWN_ERROR],
        message: error.message || 'An unexpected error occurred',
        suggestions: ERROR_SUGGESTIONS[ErrorCode.UNKNOWN_ERROR],
        isRetryable: false,
    };
}

/**
 * Parse contract error to RWA error
 */
function parseContractError(error: Error): RWAError {
    const message = error.message.toLowerCase();

    if (message.includes('insufficient') || message.includes('balance')) {
        return { code: ErrorCode.INSUFFICIENT_BALANCE, message: error.message, originalError: error };
    }
    if (message.includes('not authorized') || message.includes('access denied') || message.includes('role')) {
        return { code: ErrorCode.NOT_AUTHORIZED, message: error.message, originalError: error };
    }
    if (message.includes('kyc') || message.includes('not verified')) {
        return { code: ErrorCode.KYC_NOT_VERIFIED, message: error.message, originalError: error };
    }
    if (message.includes('paused')) {
        return { code: ErrorCode.TOKEN_PAUSED, message: error.message, originalError: error };
    }
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
        return { code: ErrorCode.NETWORK_ERROR, message: error.message, originalError: error };
    }
    if (message.includes('invalid address') || message.includes('address')) {
        return { code: ErrorCode.INVALID_ADDRESS, message: error.message, originalError: error };
    }

    return { code: ErrorCode.CONTRACT_ERROR, message: error.message, originalError: error };
}

describe('Error Display with Codes and Suggestions', () => {
    describe('Property 1: Appropriate error codes', () => {
        it('should assign INVALID_ADDRESS for address errors', () => {
            const error: RWAError = {
                code: ErrorCode.INVALID_ADDRESS,
                message: 'Invalid address: 0xinvalid',
            };

            const display = formatErrorForDisplay(error);
            expect(display.code).toBe(ErrorCode.INVALID_ADDRESS);
            expect(display.title).toBe('Invalid Address');
        });

        it('should assign INSUFFICIENT_BALANCE for balance errors', () => {
            const error: RWAError = {
                code: ErrorCode.INSUFFICIENT_BALANCE,
                message: 'Insufficient balance for transfer',
            };

            const display = formatErrorForDisplay(error);
            expect(display.code).toBe(ErrorCode.INSUFFICIENT_BALANCE);
            expect(display.title).toBe('Insufficient Balance');
        });

        it('should assign NOT_AUTHORIZED for permission errors', () => {
            const error: RWAError = {
                code: ErrorCode.NOT_AUTHORIZED,
                message: 'Caller does not have ISSUER_ROLE',
            };

            const display = formatErrorForDisplay(error);
            expect(display.code).toBe(ErrorCode.NOT_AUTHORIZED);
            expect(display.title).toBe('Not Authorized');
        });

        it('should assign KYC_NOT_VERIFIED for KYC errors', () => {
            const error: RWAError = {
                code: ErrorCode.KYC_NOT_VERIFIED,
                message: 'Recipient is not KYC verified',
            };

            const display = formatErrorForDisplay(error);
            expect(display.code).toBe(ErrorCode.KYC_NOT_VERIFIED);
            expect(display.title).toBe('KYC Not Verified');
        });

        it('should assign TOKEN_PAUSED for pause errors', () => {
            const error: RWAError = {
                code: ErrorCode.TOKEN_PAUSED,
                message: 'Token transfers are currently paused',
            };

            const display = formatErrorForDisplay(error);
            expect(display.code).toBe(ErrorCode.TOKEN_PAUSED);
            expect(display.title).toBe('Token Paused');
        });

        it('should assign NETWORK_ERROR for network issues', () => {
            const error: RWAError = {
                code: ErrorCode.NETWORK_ERROR,
                message: 'Network request failed',
            };

            const display = formatErrorForDisplay(error);
            expect(display.code).toBe(ErrorCode.NETWORK_ERROR);
            expect(display.title).toBe('Network Error');
        });

        it('should assign SIGNER_REQUIRED when wallet not connected', () => {
            const error: RWAError = {
                code: ErrorCode.SIGNER_REQUIRED,
                message: 'A signer is required for this operation',
            };

            const display = formatErrorForDisplay(error);
            expect(display.code).toBe(ErrorCode.SIGNER_REQUIRED);
            expect(display.title).toBe('Wallet Required');
        });
    });

    describe('Property 2: Actionable suggestions', () => {
        it('should provide suggestions for every error code', () => {
            for (const code of Object.values(ErrorCode)) {
                const error: RWAError = { code, message: 'Test error' };
                const display = formatErrorForDisplay(error);

                expect(display.suggestions).toBeDefined();
                expect(display.suggestions.length).toBeGreaterThan(0);
            }
        });

        it('should provide address-specific suggestions for INVALID_ADDRESS', () => {
            const error: RWAError = {
                code: ErrorCode.INVALID_ADDRESS,
                message: 'Invalid address',
            };

            const display = formatErrorForDisplay(error);

            expect(display.suggestions.some(s => s.includes('0x'))).toBe(true);
            expect(display.suggestions.some(s => s.includes('42 characters') || s.includes('valid'))).toBe(true);
        });

        it('should provide balance-specific suggestions for INSUFFICIENT_BALANCE', () => {
            const error: RWAError = {
                code: ErrorCode.INSUFFICIENT_BALANCE,
                message: 'Insufficient balance',
            };

            const display = formatErrorForDisplay(error);

            expect(display.suggestions.some(s => s.toLowerCase().includes('balance'))).toBe(true);
            expect(display.suggestions.some(s => s.toLowerCase().includes('amount') || s.toLowerCase().includes('reduce'))).toBe(true);
        });

        it('should provide KYC-specific suggestions for KYC_NOT_VERIFIED', () => {
            const error: RWAError = {
                code: ErrorCode.KYC_NOT_VERIFIED,
                message: 'KYC not verified',
            };

            const display = formatErrorForDisplay(error);

            expect(display.suggestions.some(s => s.toLowerCase().includes('kyc') || s.toLowerCase().includes('verification'))).toBe(true);
        });

        it('should provide network-specific suggestions for NETWORK_ERROR', () => {
            const error: RWAError = {
                code: ErrorCode.NETWORK_ERROR,
                message: 'Network error',
            };

            const display = formatErrorForDisplay(error);

            expect(display.suggestions.some(s => s.toLowerCase().includes('connection') || s.toLowerCase().includes('internet'))).toBe(true);
            expect(display.suggestions.some(s => s.toLowerCase().includes('try again') || s.toLowerCase().includes('rpc'))).toBe(true);
        });

        it('should provide wallet-specific suggestions for SIGNER_REQUIRED', () => {
            const error: RWAError = {
                code: ErrorCode.SIGNER_REQUIRED,
                message: 'Signer required',
            };

            const display = formatErrorForDisplay(error);

            expect(display.suggestions.some(s => s.toLowerCase().includes('wallet') || s.toLowerCase().includes('connect'))).toBe(true);
        });
    });

    describe('Property 3: Preserve original error information', () => {
        it('should preserve error message', () => {
            const originalMessage = 'Specific error: Transfer amount exceeds balance of 500';
            const error: RWAError = {
                code: ErrorCode.INSUFFICIENT_BALANCE,
                message: originalMessage,
            };

            const display = formatErrorForDisplay(error);
            expect(display.message).toBe(originalMessage);
        });

        it('should preserve error code', () => {
            const error: RWAError = {
                code: ErrorCode.NOT_AUTHORIZED,
                message: 'Access denied',
            };

            const display = formatErrorForDisplay(error);
            expect(display.code).toBe(ErrorCode.NOT_AUTHORIZED);
        });

        it('should handle errors with original error attached', () => {
            const originalError = new Error('Original contract revert');
            const error: RWAError = {
                code: ErrorCode.CONTRACT_ERROR,
                message: 'Contract call failed',
                originalError,
            };

            const display = formatErrorForDisplay(error);
            expect(display.message).toBe('Contract call failed');
            expect(display.code).toBe(ErrorCode.CONTRACT_ERROR);
        });
    });

    describe('Property 4: Handle unknown errors gracefully', () => {
        it('should handle generic Error objects', () => {
            const error = new Error('Something went wrong');

            const display = formatErrorForDisplay(error);

            expect(display.code).toBe(ErrorCode.UNKNOWN_ERROR);
            expect(display.title).toBe('Unknown Error');
            expect(display.message).toBe('Something went wrong');
            expect(display.suggestions.length).toBeGreaterThan(0);
        });

        it('should handle errors without message', () => {
            const error = new Error();

            const display = formatErrorForDisplay(error);

            expect(display.code).toBe(ErrorCode.UNKNOWN_ERROR);
            expect(display.message).toBe('An unexpected error occurred');
        });

        it('should provide generic suggestions for unknown errors', () => {
            const error = new Error('Unknown issue');

            const display = formatErrorForDisplay(error);

            expect(display.suggestions.some(s => s.toLowerCase().includes('try') || s.toLowerCase().includes('again'))).toBe(true);
            expect(display.suggestions.some(s => s.toLowerCase().includes('support') || s.toLowerCase().includes('contact'))).toBe(true);
        });
    });

    describe('Property 5: Retryable error identification', () => {
        it('should mark NETWORK_ERROR as retryable', () => {
            const error: RWAError = {
                code: ErrorCode.NETWORK_ERROR,
                message: 'Network timeout',
            };

            const display = formatErrorForDisplay(error);
            expect(display.isRetryable).toBe(true);
        });

        it('should mark CONTRACT_ERROR as retryable', () => {
            const error: RWAError = {
                code: ErrorCode.CONTRACT_ERROR,
                message: 'Contract call failed',
            };

            const display = formatErrorForDisplay(error);
            expect(display.isRetryable).toBe(true);
        });

        it('should not mark INSUFFICIENT_BALANCE as retryable', () => {
            const error: RWAError = {
                code: ErrorCode.INSUFFICIENT_BALANCE,
                message: 'Not enough tokens',
            };

            const display = formatErrorForDisplay(error);
            expect(display.isRetryable).toBe(false);
        });

        it('should not mark NOT_AUTHORIZED as retryable', () => {
            const error: RWAError = {
                code: ErrorCode.NOT_AUTHORIZED,
                message: 'Access denied',
            };

            const display = formatErrorForDisplay(error);
            expect(display.isRetryable).toBe(false);
        });

        it('should not mark KYC_NOT_VERIFIED as retryable', () => {
            const error: RWAError = {
                code: ErrorCode.KYC_NOT_VERIFIED,
                message: 'KYC required',
            };

            const display = formatErrorForDisplay(error);
            expect(display.isRetryable).toBe(false);
        });
    });

    describe('Property 6: Contract error parsing', () => {
        it('should parse insufficient balance errors', () => {
            const error = new Error('execution reverted: ERC20: transfer amount exceeds balance');
            const parsed = parseContractError(error);

            expect(parsed.code).toBe(ErrorCode.INSUFFICIENT_BALANCE);
            expect(parsed.originalError).toBe(error);
        });

        it('should parse authorization errors', () => {
            const error = new Error('execution reverted: AccessControl: account is missing role');
            const parsed = parseContractError(error);

            expect(parsed.code).toBe(ErrorCode.NOT_AUTHORIZED);
        });

        it('should parse KYC errors', () => {
            const error = new Error('execution reverted: Recipient not KYC verified');
            const parsed = parseContractError(error);

            expect(parsed.code).toBe(ErrorCode.KYC_NOT_VERIFIED);
        });

        it('should parse pause errors', () => {
            const error = new Error('execution reverted: Pausable: paused');
            const parsed = parseContractError(error);

            expect(parsed.code).toBe(ErrorCode.TOKEN_PAUSED);
        });

        it('should parse network errors', () => {
            const error = new Error('network timeout at block 12345');
            const parsed = parseContractError(error);

            expect(parsed.code).toBe(ErrorCode.NETWORK_ERROR);
        });

        it('should default to CONTRACT_ERROR for unknown contract errors', () => {
            const error = new Error('execution reverted: some unknown reason');
            const parsed = parseContractError(error);

            expect(parsed.code).toBe(ErrorCode.CONTRACT_ERROR);
        });
    });
});
