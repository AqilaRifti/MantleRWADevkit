/**
 * TokenModule - Handles RWA token deployment and interactions
 */

import { ethers, type Provider, type Signer } from 'ethers';
import type {
    TokenDeployConfig,
    TokenInfo,
    TransactionResult,
    TransactionOptions,
} from '../types';
import { RWA_TOKEN_ABI } from '../constants';
import { RWAError, ErrorCode, parseContractError } from '../errors';
import {
    isValidAddress,
    normalizeAddress,
    parseAmount,
    parseEvents,
    createTransactionResult,
    retry,
    estimateGasWithBuffer,
} from '../utils';

/**
 * Instance of a connected RWA token
 */
export class TokenInstance {
    private readonly _contract: ethers.Contract;
    private readonly _retries: number;
    private readonly _retryDelay: number;

    /** Token contract address */
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
            RWA_TOKEN_ABI,
            signer || provider
        );
    }

    /*//////////////////////////////////////////////////////////////
                            READ FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * Get token name
     */
    async name(): Promise<string> {
        return this._contract.name();
    }

    /**
     * Get token symbol
     */
    async symbol(): Promise<string> {
        return this._contract.symbol();
    }

    /**
     * Get token decimals
     */
    async decimals(): Promise<number> {
        return this._contract.decimals();
    }

    /**
     * Get total supply
     */
    async totalSupply(): Promise<bigint> {
        return this._contract.totalSupply();
    }

    /**
     * Get balance of an account
     */
    async balanceOf(account: string): Promise<bigint> {
        return this._contract.balanceOf(normalizeAddress(account));
    }

    /**
     * Check if token is paused
     */
    async paused(): Promise<boolean> {
        return this._contract.paused();
    }

    /**
     * Get the KYC registry address
     */
    async kycRegistry(): Promise<string> {
        return this._contract.kycRegistry();
    }

    /**
     * Get all compliance modules
     */
    async getComplianceModules(): Promise<string[]> {
        return this._contract.getComplianceModules();
    }

    /**
     * Check if an address is a compliance module
     */
    async isComplianceModule(module: string): Promise<boolean> {
        return this._contract.isComplianceModule(normalizeAddress(module));
    }

    /**
     * Check if a transfer is allowed
     */
    async isTransferAllowed(
        from: string,
        to: string,
        amount: string
    ): Promise<{ allowed: boolean; reason: string }> {
        const [allowed, reason] = await this._contract.isTransferAllowed(
            normalizeAddress(from),
            normalizeAddress(to),
            parseAmount(amount)
        );
        return { allowed, reason };
    }

    /**
     * Get token info
     */
    async getInfo(): Promise<TokenInfo> {
        const [name, symbol, decimals, totalSupply, paused] = await Promise.all([
            this.name(),
            this.symbol(),
            this.decimals(),
            this.totalSupply(),
            this.paused(),
        ]);

        return {
            address: this.address,
            name,
            symbol,
            decimals,
            totalSupply,
            paused,
        };
    }

    /**
     * Get balance at a specific snapshot
     */
    async balanceOfAt(account: string, snapshotId: bigint): Promise<bigint> {
        return this._contract.balanceOfAt(normalizeAddress(account), snapshotId);
    }

    /**
     * Get total supply at a specific snapshot
     */
    async totalSupplyAt(snapshotId: bigint): Promise<bigint> {
        return this._contract.totalSupplyAt(snapshotId);
    }

    /*//////////////////////////////////////////////////////////////
                            WRITE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * Mint tokens to an address
     */
    async mint(to: string, amount: string, options?: TransactionOptions): Promise<TransactionResult> {
        const toAddress = normalizeAddress(to);
        const amountWei = parseAmount(amount);

        try {
            const tx = await retry(
                async () => {
                    const gasLimit = options?.gasLimit || await estimateGasWithBuffer(
                        () => this._contract.mint.estimateGas(toAddress, amountWei)
                    );
                    return this._contract.mint(toAddress, amountWei, { gasLimit });
                },
                { retries: options?.retries ?? this._retries, delay: options?.retryDelay ?? this._retryDelay }
            );

            const receipt = await tx.wait();
            const events = parseEvents(receipt, this._contract.interface);
            return createTransactionResult(receipt, events);
        } catch (error) {
            throw parseContractError(error, this.address, 'mint');
        }
    }

    /**
     * Burn tokens from an address
     */
    async burn(from: string, amount: string, options?: TransactionOptions): Promise<TransactionResult> {
        const fromAddress = normalizeAddress(from);
        const amountWei = parseAmount(amount);

        try {
            const tx = await retry(
                async () => {
                    const gasLimit = options?.gasLimit || await estimateGasWithBuffer(
                        () => this._contract.burn.estimateGas(fromAddress, amountWei)
                    );
                    return this._contract.burn(fromAddress, amountWei, { gasLimit });
                },
                { retries: options?.retries ?? this._retries, delay: options?.retryDelay ?? this._retryDelay }
            );

            const receipt = await tx.wait();
            const events = parseEvents(receipt, this._contract.interface);
            return createTransactionResult(receipt, events);
        } catch (error) {
            throw parseContractError(error, this.address, 'burn');
        }
    }

    /**
     * Transfer tokens
     */
    async transfer(to: string, amount: string, options?: TransactionOptions): Promise<TransactionResult> {
        const toAddress = normalizeAddress(to);
        const amountWei = parseAmount(amount);

        try {
            const tx = await retry(
                async () => {
                    const gasLimit = options?.gasLimit || await estimateGasWithBuffer(
                        () => this._contract.transfer.estimateGas(toAddress, amountWei)
                    );
                    return this._contract.transfer(toAddress, amountWei, { gasLimit });
                },
                { retries: options?.retries ?? this._retries, delay: options?.retryDelay ?? this._retryDelay }
            );

            const receipt = await tx.wait();
            const events = parseEvents(receipt, this._contract.interface);
            return createTransactionResult(receipt, events);
        } catch (error) {
            throw parseContractError(error, this.address, 'transfer');
        }
    }

    /**
     * Pause token transfers
     */
    async pause(options?: TransactionOptions): Promise<TransactionResult> {
        try {
            const tx = await retry(
                async () => {
                    const gasLimit = options?.gasLimit || await estimateGasWithBuffer(
                        () => this._contract.pause.estimateGas()
                    );
                    return this._contract.pause({ gasLimit });
                },
                { retries: options?.retries ?? this._retries, delay: options?.retryDelay ?? this._retryDelay }
            );

            const receipt = await tx.wait();
            const events = parseEvents(receipt, this._contract.interface);
            return createTransactionResult(receipt, events);
        } catch (error) {
            throw parseContractError(error, this.address, 'pause');
        }
    }

    /**
     * Unpause token transfers
     */
    async unpause(options?: TransactionOptions): Promise<TransactionResult> {
        try {
            const tx = await retry(
                async () => {
                    const gasLimit = options?.gasLimit || await estimateGasWithBuffer(
                        () => this._contract.unpause.estimateGas()
                    );
                    return this._contract.unpause({ gasLimit });
                },
                { retries: options?.retries ?? this._retries, delay: options?.retryDelay ?? this._retryDelay }
            );

            const receipt = await tx.wait();
            const events = parseEvents(receipt, this._contract.interface);
            return createTransactionResult(receipt, events);
        } catch (error) {
            throw parseContractError(error, this.address, 'unpause');
        }
    }

    /**
     * Create a snapshot
     */
    async snapshot(options?: TransactionOptions): Promise<{ result: TransactionResult; snapshotId: bigint }> {
        try {
            const tx = await retry(
                async () => {
                    const gasLimit = options?.gasLimit || await estimateGasWithBuffer(
                        () => this._contract.snapshot.estimateGas()
                    );
                    return this._contract.snapshot({ gasLimit });
                },
                { retries: options?.retries ?? this._retries, delay: options?.retryDelay ?? this._retryDelay }
            );

            const receipt = await tx.wait();
            const events = parseEvents(receipt, this._contract.interface);
            const result = createTransactionResult(receipt, events);

            // Extract snapshot ID from event
            const snapshotEvent = events.find((e) => e.name === 'Snapshot');
            const snapshotId = snapshotEvent?.args.id as bigint || 0n;

            return { result, snapshotId };
        } catch (error) {
            throw parseContractError(error, this.address, 'snapshot');
        }
    }

    /**
     * Set the KYC registry
     */
    async setKYCRegistry(registry: string, options?: TransactionOptions): Promise<TransactionResult> {
        const registryAddress = normalizeAddress(registry);

        try {
            const tx = await retry(
                async () => {
                    const gasLimit = options?.gasLimit || await estimateGasWithBuffer(
                        () => this._contract.setKYCRegistry.estimateGas(registryAddress)
                    );
                    return this._contract.setKYCRegistry(registryAddress, { gasLimit });
                },
                { retries: options?.retries ?? this._retries, delay: options?.retryDelay ?? this._retryDelay }
            );

            const receipt = await tx.wait();
            const events = parseEvents(receipt, this._contract.interface);
            return createTransactionResult(receipt, events);
        } catch (error) {
            throw parseContractError(error, this.address, 'setKYCRegistry');
        }
    }

    /**
     * Add a compliance module
     */
    async addComplianceModule(module: string, options?: TransactionOptions): Promise<TransactionResult> {
        const moduleAddress = normalizeAddress(module);

        try {
            const tx = await retry(
                async () => {
                    const gasLimit = options?.gasLimit || await estimateGasWithBuffer(
                        () => this._contract.addComplianceModule.estimateGas(moduleAddress)
                    );
                    return this._contract.addComplianceModule(moduleAddress, { gasLimit });
                },
                { retries: options?.retries ?? this._retries, delay: options?.retryDelay ?? this._retryDelay }
            );

            const receipt = await tx.wait();
            const events = parseEvents(receipt, this._contract.interface);
            return createTransactionResult(receipt, events);
        } catch (error) {
            throw parseContractError(error, this.address, 'addComplianceModule');
        }
    }

    /**
     * Remove a compliance module
     */
    async removeComplianceModule(module: string, options?: TransactionOptions): Promise<TransactionResult> {
        const moduleAddress = normalizeAddress(module);

        try {
            const tx = await retry(
                async () => {
                    const gasLimit = options?.gasLimit || await estimateGasWithBuffer(
                        () => this._contract.removeComplianceModule.estimateGas(moduleAddress)
                    );
                    return this._contract.removeComplianceModule(moduleAddress, { gasLimit });
                },
                { retries: options?.retries ?? this._retries, delay: options?.retryDelay ?? this._retryDelay }
            );

            const receipt = await tx.wait();
            const events = parseEvents(receipt, this._contract.interface);
            return createTransactionResult(receipt, events);
        } catch (error) {
            throw parseContractError(error, this.address, 'removeComplianceModule');
        }
    }

    /*//////////////////////////////////////////////////////////////
                            EVENT LISTENERS
    //////////////////////////////////////////////////////////////*/

    /**
     * Listen for Transfer events
     */
    onTransfer(callback: (from: string, to: string, amount: bigint) => void): () => void {
        const listener = (from: string, to: string, amount: bigint) => {
            callback(from, to, amount);
        };
        this._contract.on('Transfer', listener);
        return () => this._contract.off('Transfer', listener);
    }

    /**
     * Listen for TransferRestricted events
     */
    onTransferRestricted(
        callback: (from: string, to: string, amount: bigint, reason: string) => void
    ): () => void {
        const listener = (from: string, to: string, amount: bigint, reason: string) => {
            callback(from, to, amount, reason);
        };
        this._contract.on('TransferRestricted', listener);
        return () => this._contract.off('TransferRestricted', listener);
    }

    /**
     * Listen for Paused events
     */
    onPaused(callback: (by: string) => void): () => void {
        const listener = (by: string) => callback(by);
        this._contract.on('TokensPaused', listener);
        return () => this._contract.off('TokensPaused', listener);
    }

    /**
     * Listen for Unpaused events
     */
    onUnpaused(callback: (by: string) => void): () => void {
        const listener = (by: string) => callback(by);
        this._contract.on('TokensUnpaused', listener);
        return () => this._contract.off('TokensUnpaused', listener);
    }
}

/**
 * Module for token operations
 */
export class TokenModule {
    private readonly _provider: Provider;
    private readonly _signer: Signer | null;
    private readonly _retries: number;
    private readonly _retryDelay: number;

    constructor(provider: Provider, signer: Signer | null, retries: number, retryDelay: number) {
        this._provider = provider;
        this._signer = signer;
        this._retries = retries;
        this._retryDelay = retryDelay;
    }

    /**
     * Connect to an existing token contract
     */
    connect(address: string): TokenInstance {
        if (!isValidAddress(address)) {
            throw new RWAError(ErrorCode.INVALID_ADDRESS, `Invalid token address: ${address}`);
        }
        return new TokenInstance(address, this._provider, this._signer, this._retries, this._retryDelay);
    }

    /**
     * Estimate gas for deploying a token
     */
    async estimateDeployGas(_config: TokenDeployConfig): Promise<bigint> {
        // This would require the token bytecode which we don't have in the SDK
        // In practice, deployment is done through the factory
        throw new RWAError(
            ErrorCode.INVALID_CONFIGURATION,
            'Direct token deployment is not supported. Use RWAClient.deployRWASystem() instead.'
        );
    }
}
