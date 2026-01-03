/**
 * KYCModule - Handles KYC registry interactions and provider integrations
 */

import { ethers, type Provider, type Signer } from 'ethers';
import type {
    InvestorData,
    VerificationSession,
    VerificationResult,
    TransactionResult,
    TransactionOptions,
    AccreditationTier,
} from '../types';
import { KYC_REGISTRY_ABI } from '../constants';
import { RWAError, ErrorCode, parseContractError } from '../errors';
import {
    isValidAddress,
    normalizeAddress,
    parseEvents,
    createTransactionResult,
    retry,
    estimateGasWithBuffer,
    timestampToDate,
    dateToTimestamp,
    hashIdentityData,
} from '../utils';


/**
 * Interface for KYC providers
 */
export interface KYCProvider {
    /** Provider name */
    name: string;
    /** Initiate verification for an investor */
    initiateVerification(investorAddress: string, options?: unknown): Promise<VerificationSession>;
    /** Check verification status */
    checkStatus(sessionId: string): Promise<'pending' | 'in_progress' | 'completed' | 'failed'>;
    /** Get verification result */
    getVerificationResult(sessionId: string): Promise<VerificationResult>;
}

/**
 * Instance of a connected KYC registry
 */
export class KYCRegistryInstance {
    private readonly _contract: ethers.Contract;
    private readonly _retries: number;
    private readonly _retryDelay: number;

    /** Registry contract address */
    readonly address: string;

    constructor(
        address: string,
        provider: Provider,
        signer: Signer | null,
        retries: number,
        retryDelay: number
    ) {
        this.address = normalizeAddress(address);
        this._retries = retries;
        this._retryDelay = retryDelay;

        this._contract = new ethers.Contract(
            this.address,
            KYC_REGISTRY_ABI,
            signer || provider
        );
    }

    /*//////////////////////////////////////////////////////////////
                            READ FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * Check if an investor is verified
     */
    async isVerified(investor: string): Promise<boolean> {
        return this._contract.isVerified(normalizeAddress(investor));
    }

    /**
     * Check if an investor is accredited
     */
    async isAccredited(investor: string): Promise<boolean> {
        return this._contract.isAccredited(normalizeAddress(investor));
    }

    /**
     * Get investor information
     */
    async getInvestorInfo(investor: string): Promise<InvestorData> {
        const [verified, tier, expiry, identityHash] = await this._contract.getInvestorInfo(
            normalizeAddress(investor)
        );

        return {
            verified,
            tier: tier as AccreditationTier,
            expiry: timestampToDate(expiry),
            identityHash,
        };
    }

    /*//////////////////////////////////////////////////////////////
                            WRITE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * Add an investor to the registry
     */
    async addInvestor(
        investor: string,
        tier: AccreditationTier,
        expiryDate: Date,
        identityHash: string,
        options?: TransactionOptions
    ): Promise<TransactionResult> {
        const investorAddress = normalizeAddress(investor);
        const expiryTimestamp = dateToTimestamp(expiryDate);

        try {
            const tx = await retry(
                async () => {
                    const gasLimit = options?.gasLimit || await estimateGasWithBuffer(
                        () => this._contract.addInvestor.estimateGas(
                            investorAddress,
                            tier,
                            expiryTimestamp,
                            identityHash
                        )
                    );
                    return this._contract.addInvestor(
                        investorAddress,
                        tier,
                        expiryTimestamp,
                        identityHash,
                        { gasLimit }
                    );
                },
                { retries: options?.retries ?? this._retries, delay: options?.retryDelay ?? this._retryDelay }
            );

            const receipt = await tx.wait();
            const events = parseEvents(receipt, this._contract.interface);
            return createTransactionResult(receipt, events);
        } catch (error) {
            throw parseContractError(error, this.address, 'addInvestor');
        }
    }

    /**
     * Update an investor's information
     */
    async updateInvestor(
        investor: string,
        tier: AccreditationTier,
        expiryDate: Date,
        options?: TransactionOptions
    ): Promise<TransactionResult> {
        const investorAddress = normalizeAddress(investor);
        const expiryTimestamp = dateToTimestamp(expiryDate);

        try {
            const tx = await retry(
                async () => {
                    const gasLimit = options?.gasLimit || await estimateGasWithBuffer(
                        () => this._contract.updateInvestor.estimateGas(
                            investorAddress,
                            tier,
                            expiryTimestamp
                        )
                    );
                    return this._contract.updateInvestor(
                        investorAddress,
                        tier,
                        expiryTimestamp,
                        { gasLimit }
                    );
                },
                { retries: options?.retries ?? this._retries, delay: options?.retryDelay ?? this._retryDelay }
            );

            const receipt = await tx.wait();
            const events = parseEvents(receipt, this._contract.interface);
            return createTransactionResult(receipt, events);
        } catch (error) {
            throw parseContractError(error, this.address, 'updateInvestor');
        }
    }

    /**
     * Remove an investor from the registry
     */
    async removeInvestor(investor: string, options?: TransactionOptions): Promise<TransactionResult> {
        const investorAddress = normalizeAddress(investor);

        try {
            const tx = await retry(
                async () => {
                    const gasLimit = options?.gasLimit || await estimateGasWithBuffer(
                        () => this._contract.removeInvestor.estimateGas(investorAddress)
                    );
                    return this._contract.removeInvestor(investorAddress, { gasLimit });
                },
                { retries: options?.retries ?? this._retries, delay: options?.retryDelay ?? this._retryDelay }
            );

            const receipt = await tx.wait();
            const events = parseEvents(receipt, this._contract.interface);
            return createTransactionResult(receipt, events);
        } catch (error) {
            throw parseContractError(error, this.address, 'removeInvestor');
        }
    }

    /**
     * Batch add investors
     */
    async batchAddInvestors(
        investors: Array<{
            address: string;
            tier: AccreditationTier;
            expiryDate: Date;
            identityHash: string;
        }>,
        options?: TransactionOptions
    ): Promise<TransactionResult> {
        const addresses = investors.map((i) => normalizeAddress(i.address));
        const tiers = investors.map((i) => i.tier);
        const expiries = investors.map((i) => dateToTimestamp(i.expiryDate));
        const hashes = investors.map((i) => i.identityHash);

        try {
            const tx = await retry(
                async () => {
                    const gasLimit = options?.gasLimit || await estimateGasWithBuffer(
                        () => this._contract.batchAddInvestors.estimateGas(addresses, tiers, expiries, hashes)
                    );
                    return this._contract.batchAddInvestors(addresses, tiers, expiries, hashes, { gasLimit });
                },
                { retries: options?.retries ?? this._retries, delay: options?.retryDelay ?? this._retryDelay }
            );

            const receipt = await tx.wait();
            const events = parseEvents(receipt, this._contract.interface);
            return createTransactionResult(receipt, events);
        } catch (error) {
            throw parseContractError(error, this.address, 'batchAddInvestors');
        }
    }

    /*//////////////////////////////////////////////////////////////
                            EVENT LISTENERS
    //////////////////////////////////////////////////////////////*/

    /**
     * Listen for InvestorVerified events
     */
    onInvestorVerified(
        callback: (investor: string, tier: AccreditationTier, expiry: bigint) => void
    ): () => void {
        const listener = (investor: string, tier: number, expiry: bigint) => {
            callback(investor, tier as AccreditationTier, expiry);
        };
        this._contract.on('InvestorVerified', listener);
        return () => this._contract.off('InvestorVerified', listener);
    }

    /**
     * Listen for InvestorRemoved events
     */
    onInvestorRemoved(callback: (investor: string) => void): () => void {
        const listener = (investor: string) => callback(investor);
        this._contract.on('InvestorRemoved', listener);
        return () => this._contract.off('InvestorRemoved', listener);
    }

    /**
     * Listen for InvestorUpdated events
     */
    onInvestorUpdated(
        callback: (investor: string, newTier: AccreditationTier, newExpiry: bigint) => void
    ): () => void {
        const listener = (investor: string, newTier: number, newExpiry: bigint) => {
            callback(investor, newTier as AccreditationTier, newExpiry);
        };
        this._contract.on('InvestorUpdated', listener);
        return () => this._contract.off('InvestorUpdated', listener);
    }
}

/**
 * Module for KYC operations
 */
export class KYCModule {
    private readonly _provider: Provider;
    private readonly _signer: Signer | null;
    private readonly _retries: number;
    private readonly _retryDelay: number;
    private _kycProvider: KYCProvider | null = null;

    constructor(provider: Provider, signer: Signer | null, retries: number, retryDelay: number) {
        this._provider = provider;
        this._signer = signer;
        this._retries = retries;
        this._retryDelay = retryDelay;
    }

    /**
     * Connect to an existing KYC registry
     */
    connect(address: string): KYCRegistryInstance {
        if (!isValidAddress(address)) {
            throw new RWAError(ErrorCode.INVALID_ADDRESS, `Invalid registry address: ${address}`);
        }
        return new KYCRegistryInstance(
            address,
            this._provider,
            this._signer,
            this._retries,
            this._retryDelay
        );
    }

    /**
     * Set the KYC provider
     */
    setProvider(provider: 'persona' | 'synaps' | 'jumio' | KYCProvider): void {
        if (typeof provider === 'string') {
            // Create stub provider for built-in providers
            this._kycProvider = this._createBuiltInProvider(provider);
        } else {
            this._kycProvider = provider;
        }
    }

    /**
     * Get the current KYC provider
     */
    get provider(): KYCProvider | null {
        return this._kycProvider;
    }

    /**
     * Initiate verification for an investor
     */
    async verifyInvestor(investorAddress: string, options?: unknown): Promise<VerificationSession> {
        if (!this._kycProvider) {
            throw new RWAError(
                ErrorCode.PROVIDER_NOT_CONFIGURED,
                'KYC provider not configured. Call setProvider() first.'
            );
        }
        return this._kycProvider.initiateVerification(investorAddress, options);
    }

    /**
     * Check accreditation status
     */
    async checkAccreditation(
        registryAddress: string,
        investorAddress: string
    ): Promise<AccreditationTier> {
        const registry = this.connect(registryAddress);
        const info = await registry.getInvestorInfo(investorAddress);
        return info.tier;
    }

    /**
     * Update registry with verification result
     */
    async updateRegistry(
        registryAddress: string,
        investorAddress: string,
        result: VerificationResult
    ): Promise<TransactionResult> {
        const registry = this.connect(registryAddress);
        return registry.addInvestor(
            investorAddress,
            result.tier,
            result.expiryDate,
            result.identityHash
        );
    }

    /**
     * Batch update registry with multiple verification results
     */
    async batchUpdateRegistry(
        registryAddress: string,
        results: Array<{ address: string; result: VerificationResult }>
    ): Promise<TransactionResult> {
        const registry = this.connect(registryAddress);
        const investors = results.map((r) => ({
            address: r.address,
            tier: r.result.tier,
            expiryDate: r.result.expiryDate,
            identityHash: r.result.identityHash,
        }));
        return registry.batchAddInvestors(investors);
    }

    /**
     * Generate identity hash from data
     */
    generateIdentityHash(data: {
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
        documentNumber?: string;
        country?: string;
    }): string {
        return hashIdentityData(data);
    }

    /**
     * Create a built-in provider stub
     */
    private _createBuiltInProvider(name: 'persona' | 'synaps' | 'jumio'): KYCProvider {
        return {
            name,
            initiateVerification: async (investorAddress: string) => {
                // Stub implementation - in production, this would call the actual provider API
                return {
                    sessionId: `${name}-${Date.now()}-${investorAddress.slice(2, 10)}`,
                    provider: name,
                    status: 'pending' as const,
                    redirectUrl: `https://${name}.com/verify?session=${Date.now()}`,
                };
            },
            checkStatus: async () => {
                // Stub implementation
                return 'pending' as const;
            },
            getVerificationResult: async () => {
                // Stub implementation
                throw new RWAError(
                    ErrorCode.PROVIDER_NOT_CONFIGURED,
                    `${name} provider integration requires API credentials. Configure the provider with your API keys.`
                );
            },
        };
    }
}
