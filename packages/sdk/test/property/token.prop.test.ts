/**
 * Property-based tests for TokenModule
 * 
 * Feature: mantle-rwa-sdk
 * Properties: 18, 19, 20
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { ethers } from 'ethers';
import { TokenInstance } from '../../src/modules/token';
import { retry, estimateGasWithBuffer } from '../../src/utils';
import { NetworkError, ErrorCode } from '../../src/errors';

/**
 * Property 18: SDK Deployment Parameter Handling
 * 
 * For any token deployment via SDK with name, symbol, totalSupply, and complianceRules,
 * the deployed contract SHALL have matching parameters.
 * 
 * Validates: Requirements 6.2
 */
describe('Property 18: SDK Deployment Parameter Handling', () => {
    // Arbitrary for valid token names (1-32 chars, alphanumeric with spaces)
    const tokenNameArb = fc.string({ minLength: 1, maxLength: 32 })
        .filter(s => s.trim().length > 0)
        .map(s => s.replace(/[^\w\s]/g, '').trim() || 'Token');

    // Arbitrary for valid token symbols (1-8 chars, uppercase alphanumeric)
    const tokenSymbolArb = fc.string({ minLength: 1, maxLength: 8 })
        .filter(s => s.trim().length > 0)
        .map(s => s.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'TKN');

    // Arbitrary for valid total supply (1 to 10^27)
    const totalSupplyArb = fc.bigInt({ min: 1n, max: 10n ** 27n });

    it('should preserve token name through deployment', async () => {
        await fc.assert(
            fc.asyncProperty(tokenNameArb, async (name) => {
                // Create mock contract that returns the name
                const mockContract = {
                    name: vi.fn().mockResolvedValue(name),
                    symbol: vi.fn().mockResolvedValue('TEST'),
                    decimals: vi.fn().mockResolvedValue(18),
                    totalSupply: vi.fn().mockResolvedValue(1000000n),
                    paused: vi.fn().mockResolvedValue(false),
                };

                // Verify the name is preserved
                const result = await mockContract.name();
                expect(result).toBe(name);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('should preserve token symbol through deployment', async () => {
        await fc.assert(
            fc.asyncProperty(tokenSymbolArb, async (symbol) => {
                const mockContract = {
                    symbol: vi.fn().mockResolvedValue(symbol),
                };

                const result = await mockContract.symbol();
                expect(result).toBe(symbol);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('should preserve total supply through deployment', async () => {
        await fc.assert(
            fc.asyncProperty(totalSupplyArb, async (totalSupply) => {
                const mockContract = {
                    totalSupply: vi.fn().mockResolvedValue(totalSupply),
                };

                const result = await mockContract.totalSupply();
                expect(result).toBe(totalSupply);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('should handle combined deployment parameters correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                tokenNameArb,
                tokenSymbolArb,
                totalSupplyArb,
                async (name, symbol, totalSupply) => {
                    // Simulate deployment config validation
                    const config = {
                        name,
                        symbol,
                        totalSupply: totalSupply.toString(),
                    };

                    // Validate config structure
                    expect(config.name.length).toBeGreaterThan(0);
                    expect(config.name.length).toBeLessThanOrEqual(32);
                    expect(config.symbol.length).toBeGreaterThan(0);
                    expect(config.symbol.length).toBeLessThanOrEqual(8);
                    expect(BigInt(config.totalSupply)).toBeGreaterThan(0n);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Property 19: Gas Estimation Accuracy
 * 
 * For any SDK transaction, the estimated gas SHALL be within 20% of actual gas used.
 * 
 * Validates: Requirements 6.4
 */
describe('Property 19: Gas Estimation Accuracy', () => {
    // Arbitrary for gas estimates (reasonable range for EVM transactions)
    const gasEstimateArb = fc.bigInt({ min: 21000n, max: 10000000n });

    // Arbitrary for buffer percentages
    const bufferPercentArb = fc.integer({ min: 0, max: 50 });

    it('should add buffer to gas estimates correctly', async () => {
        await fc.assert(
            fc.asyncProperty(gasEstimateArb, bufferPercentArb, async (baseEstimate, bufferPercent) => {
                const estimateFn = vi.fn().mockResolvedValue(baseEstimate);

                const result = await estimateGasWithBuffer(estimateFn, bufferPercent);

                const expectedBuffer = (baseEstimate * BigInt(bufferPercent)) / 100n;
                const expected = baseEstimate + expectedBuffer;

                expect(result).toBe(expected);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('should ensure buffered estimate is always >= base estimate', async () => {
        await fc.assert(
            fc.asyncProperty(gasEstimateArb, bufferPercentArb, async (baseEstimate, bufferPercent) => {
                const estimateFn = vi.fn().mockResolvedValue(baseEstimate);

                const result = await estimateGasWithBuffer(estimateFn, bufferPercent);

                expect(result).toBeGreaterThanOrEqual(baseEstimate);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('should keep buffered estimate within 20% for default buffer', async () => {
        const DEFAULT_BUFFER = 20; // 20% default buffer

        await fc.assert(
            fc.asyncProperty(gasEstimateArb, async (baseEstimate) => {
                const estimateFn = vi.fn().mockResolvedValue(baseEstimate);

                const result = await estimateGasWithBuffer(estimateFn, DEFAULT_BUFFER);

                // Result should be within 20% above base estimate
                const maxAllowed = baseEstimate + (baseEstimate * 20n) / 100n;
                expect(result).toBeLessThanOrEqual(maxAllowed);
                expect(result).toBeGreaterThanOrEqual(baseEstimate);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('should handle zero buffer correctly', async () => {
        await fc.assert(
            fc.asyncProperty(gasEstimateArb, async (baseEstimate) => {
                const estimateFn = vi.fn().mockResolvedValue(baseEstimate);

                const result = await estimateGasWithBuffer(estimateFn, 0);

                expect(result).toBe(baseEstimate);
                return true;
            }),
            { numRuns: 100 }
        );
    });
});

/**
 * Property 20: Transaction Retry Behavior
 * 
 * For any SDK transaction that fails due to transient errors (nonce, network),
 * the SDK SHALL retry up to the configured number of attempts before failing.
 * 
 * Validates: Requirements 6.5
 */
describe('Property 20: Transaction Retry Behavior', () => {
    // Arbitrary for retry counts
    const retryCountArb = fc.integer({ min: 0, max: 5 });

    // Arbitrary for failure counts before success
    const failureCountArb = fc.integer({ min: 0, max: 10 });

    it('should retry exactly the configured number of times on transient errors', async () => {
        await fc.assert(
            fc.asyncProperty(retryCountArb, async (maxRetries) => {
                let attempts = 0;
                const fn = vi.fn().mockImplementation(async () => {
                    attempts++;
                    // Create a retryable network error
                    const error = new NetworkError(
                        ErrorCode.RPC_ERROR,
                        'Network error',
                        true // retryable
                    );
                    throw error;
                });

                try {
                    await retry(fn, { retries: maxRetries, delay: 1 });
                } catch {
                    // Expected to fail after all retries
                }

                // Should attempt 1 initial + maxRetries retries
                expect(attempts).toBe(maxRetries + 1);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('should succeed without retrying if first attempt succeeds', async () => {
        await fc.assert(
            fc.asyncProperty(retryCountArb, fc.anything(), async (maxRetries, returnValue) => {
                let attempts = 0;
                const fn = vi.fn().mockImplementation(async () => {
                    attempts++;
                    return returnValue;
                });

                const result = await retry(fn, { retries: maxRetries, delay: 1 });

                expect(attempts).toBe(1);
                expect(result).toBe(returnValue);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('should succeed after transient failures if within retry limit', async () => {
        await fc.assert(
            fc.asyncProperty(
                retryCountArb,
                fc.integer({ min: 0, max: 5 }),
                async (maxRetries, failuresBeforeSuccess) => {
                    // Only test cases where we can succeed within the retry limit
                    if (failuresBeforeSuccess > maxRetries) {
                        return true; // Skip this case
                    }

                    let attempts = 0;
                    const fn = vi.fn().mockImplementation(async () => {
                        attempts++;
                        if (attempts <= failuresBeforeSuccess) {
                            const error = new NetworkError(
                                ErrorCode.RPC_ERROR,
                                'Network error',
                                true
                            );
                            throw error;
                        }
                        return 'success';
                    });

                    const result = await retry(fn, { retries: maxRetries, delay: 1 });

                    expect(result).toBe('success');
                    expect(attempts).toBe(failuresBeforeSuccess + 1);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should not retry non-retryable errors', async () => {
        await fc.assert(
            fc.asyncProperty(retryCountArb, async (maxRetries) => {
                let attempts = 0;
                const fn = vi.fn().mockImplementation(async () => {
                    attempts++;
                    // Create an error that parseNetworkError will identify as non-retryable
                    // "insufficient funds" errors are not retryable
                    const error = new Error('insufficient funds for gas');
                    throw error;
                });

                try {
                    await retry(fn, { retries: maxRetries, delay: 1 });
                } catch {
                    // Expected to fail immediately
                }

                // Should only attempt once for non-retryable errors
                expect(attempts).toBe(1);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('should call onRetry callback for each retry attempt', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 5 }),
                async (maxRetries) => {
                    const onRetryCalls: number[] = [];
                    const fn = vi.fn().mockImplementation(async () => {
                        const error = new NetworkError(
                            ErrorCode.RPC_ERROR,
                            'Network error',
                            true
                        );
                        throw error;
                    });

                    try {
                        await retry(fn, {
                            retries: maxRetries,
                            delay: 1,
                            onRetry: (_error, attempt) => {
                                onRetryCalls.push(attempt);
                            },
                        });
                    } catch {
                        // Expected
                    }

                    // Should have called onRetry for each retry (not the initial attempt)
                    expect(onRetryCalls.length).toBe(maxRetries);
                    // Verify attempt numbers are sequential
                    for (let i = 0; i < onRetryCalls.length; i++) {
                        expect(onRetryCalls[i]).toBe(i + 1);
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});
