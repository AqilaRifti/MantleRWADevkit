/**
 * @mantle-rwa/sdk
 * TypeScript SDK for Real-World Asset tokenization on Mantle Network
 */

// Core client
export { RWAClient } from './client';
export type { RWAClientConfig } from './client';

// Modules
export {
    TokenModule,
    TokenInstance,
    KYCModule,
    KYCRegistryInstance,
    YieldModule,
    YieldDistributorInstance,
    ComplianceModule,
} from './modules';
export type { KYCProvider } from './modules';

// Types
export * from './types';

// Errors
export * from './errors';

// Constants
export * from './constants';

// Utilities
export {
    isValidAddress,
    normalizeAddress,
    parseAmount,
    formatAmount,
    hashIdentityData,
    timestampToDate,
    dateToTimestamp,
    isExpired,
    calculatePercentage,
} from './utils';
