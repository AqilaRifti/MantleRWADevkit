/**
 * Utility functions for the Mantle RWA SDK
 */

import { ethers, type TransactionReceipt, type Interface } from 'ethers';
import type { ParsedEvent, TransactionResult } from '../types';
import { NetworkError, ErrorCode, parseNetworkError } from '../errors';
import { DEFAULTS } from '../constants';

/**
 * Validate an Ethereum address
 */
export function isValidAddress(address: string): boolean {
    try {
        return ethers.isAddress(address);
    } catch {
        return false;
    }
}

/**
 * Validate and normalize an Ethereum address
 */
export function normalizeAddress(address: string): string {
    if (!isValidAddress(address)) {
        throw new Error(`Invalid address: ${address}`);
    }
    return ethers.getAddress(address);
}

/**
 * Parse a string amount to bigint with decimals
 */
export function parseAmount(amount: string, decimals: number = 18): bigint {
    return ethers.parseUnits(amount, decimals);
}

/**
 * Format a bigint amount to string with decimals
 */
export function formatAmount(amount: bigint, decimals: number = 18): string {
    return ethers.formatUnits(amount, decimals);
}

/**
 * Parse events from a transaction receipt
 */
export function parseEvents(
    receipt: TransactionReceipt,
    contractInterface: Interface
): ParsedEvent[] {
    const events: ParsedEvent[] = [];

    for (const log of receipt.logs) {
        try {
            const parsed = contractInterface.parseLog({
                topics: log.topics as string[],
                data: log.data,
            });

            if (parsed) {
                const args: Record<string, unknown> = {};
                for (const [key, value] of Object.entries(parsed.args)) {
                    // Skip numeric indices
                    if (!/^\d+$/.test(key)) {
                        args[key] = value;
                    }
                }

                events.push({
                    name: parsed.name,
                    args,
                    address: log.address,
                    blockNumber: log.blockNumber,
                    transactionHash: log.transactionHash,
                    logIndex: log.index,
                });
            }
        } catch {
            // Skip logs that don't match the interface
        }
    }

    return events;
}

/**
 * Create a transaction result from a receipt
 */
export function createTransactionResult(
    receipt: TransactionReceipt,
    events: ParsedEvent[]
): TransactionResult {
    return {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed',
        events,
        receipt,
    };
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
    fn: () => Promise<T>,
    options: {
        retries?: number;
        delay?: number;
        onRetry?: (error: unknown, attempt: number) => void;
    } = {}
): Promise<T> {
    const { retries = DEFAULTS.TRANSACTION_RETRIES, delay = DEFAULTS.RETRY_DELAY_MS, onRetry } = options;

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Check if error is retryable
            const networkError = parseNetworkError(error);
            if (!networkError.retryable) {
                throw error;
            }

            if (attempt < retries) {
                onRetry?.(error, attempt + 1);
                await sleep(delay * Math.pow(2, attempt)); // Exponential backoff
            }
        }
    }

    throw lastError;
}

/**
 * Estimate gas with buffer
 */
export async function estimateGasWithBuffer(
    estimateFn: () => Promise<bigint>,
    bufferPercent: number = DEFAULTS.GAS_BUFFER_PERCENT
): Promise<bigint> {
    const estimate = await estimateFn();
    const buffer = (estimate * BigInt(bufferPercent)) / 100n;
    return estimate + buffer;
}

/**
 * Generate a keccak256 hash of identity data
 */
export function hashIdentityData(data: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    documentNumber?: string;
    country?: string;
}): string {
    const normalized = JSON.stringify({
        firstName: data.firstName?.toLowerCase().trim(),
        lastName: data.lastName?.toLowerCase().trim(),
        dateOfBirth: data.dateOfBirth,
        documentNumber: data.documentNumber?.toUpperCase().trim(),
        country: data.country?.toUpperCase().trim(),
    });
    return ethers.keccak256(ethers.toUtf8Bytes(normalized));
}

/**
 * Convert a timestamp to a Date object
 */
export function timestampToDate(timestamp: bigint | number): Date {
    const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    return new Date(ts * 1000);
}

/**
 * Convert a Date to a Unix timestamp
 */
export function dateToTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
}

/**
 * Check if a timestamp is expired
 */
export function isExpired(timestamp: bigint | number): boolean {
    const now = Math.floor(Date.now() / 1000);
    const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    return ts < now;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: bigint, total: bigint): number {
    if (total === 0n) return 0;
    return Number((part * 10000n) / total) / 100;
}

/**
 * Chunk an array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * Wait for a transaction to be mined
 */
export async function waitForTransaction(
    provider: ethers.Provider,
    hash: string,
    confirmations: number = 1
): Promise<TransactionReceipt> {
    const receipt = await provider.waitForTransaction(hash, confirmations);
    if (!receipt) {
        throw new NetworkError(
            ErrorCode.TIMEOUT,
            `Transaction ${hash} was not mined`,
            true
        );
    }
    return receipt;
}
