/**
 * YieldModule - Handles yield distribution management
 */

import { ethers, type Provider, type Signer } from 'ethers';
import type {
    Distribution,
    DistributionConfig,
    DistributionPreview,
    HolderDistribution,
    PendingClaim,
    TransactionResult,
    TransactionOptions,
} from '../types';
import { YIELD_DISTRIBUTOR_ABI, RWA_TOKEN_ABI, DEFAULTS } from '../constants';
import { RWAError, ErrorCode, parseContractError } from '../errors';
import {
    isValidAddress,
    normalizeAddress,
    parseAmount,
    parseEvents,
    createTransactionResult,
    retry,
    estimateGasWithBuffer,
    timestampToDate,
} from '../utils';

/**
 * Instance of a connected yield distributor
 */
export class YieldDistributorInstance {
    private readonly _contract: ethers.Contract;
    private readonly _retries: number;
    private readonly _retryDelay: number;

    /** Distributor contract address */
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
            YIELD_DISTRIBUTOR_ABI,
            signer || provider
        );
    }

    /*//////////////////////////////////////////////////////////////
                            READ FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * Get the number of distributions
     */
    async distributionCount(): Promise<number> {
        const count = await this._contract.distributionCount();
        return Number(count);
    }

    /**
     * Get distribution information
     */
    async getDistributionInfo(distributionId: number): Promise<Distribution> {
        const [paymentToken, totalAmount, snapshotId, claimDeadline, claimedAmount] =
            await this._contract.getDistributionInfo(distributionId);

        return {
            id: distributionId,
            paymentToken,
            totalAmount,
            snapshotId,
            claimDeadline: timestampToDate(claimDeadline),
            claimedAmount,
        };
    }

    /**
     * Get claimable amount for an account
     */
    async getClaimableAmount(distributionId: number, account: string): Promise<bigint> {
        return this._contract.getClaimableAmount(distributionId, normalizeAddress(account));
    }

    /**
     * Check if an account has claimed from a distribution
     */
    async hasClaimed(distributionId: number, account: string): Promise<boolean> {
        return this._contract.hasClaimed(distributionId, normalizeAddress(account));
    }

    /**
     * Get all distributions
     */
    async getDistributionHistory(): Promise<Distribution[]> {
        const count = await this.distributionCount();
        const distributions: Distribution[] = [];

        for (let i = 0; i < count; i++) {
            distributions.push(await this.getDistributionInfo(i));
        }

        return distributions;
    }

    /**
     * Get pending claims for an account
     */
    async getPendingClaims(account: string): Promise<PendingClaim[]> {
        const count = await this.distributionCount();
        const pendingClaims: PendingClaim[] = [];
        const now = new Date();

        for (let i = 0; i < count; i++) {
            const hasClaimed = await this.hasClaimed(i, account);
            if (hasClaimed) continue;

            const distribution = await this.getDistributionInfo(i);
            if (distribution.claimDeadline < now) continue;

            const amount = await this.getClaimableAmount(i, account);
            if (amount === 0n) continue;

            pendingClaims.push({
                distributionId: i,
                amount,
                paymentToken: distribution.paymentToken,
                deadline: distribution.claimDeadline,
            });
        }

        return pendingClaims;
    }

    /*//////////////////////////////////////////////////////////////
                            WRITE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * Create a new distribution
     */
    async createDistribution(
        paymentToken: string,
        totalAmount: string,
        claimWindowDays: number = DEFAULTS.YIELD_CLAIM_WINDOW_DAYS,
        options?: TransactionOptions
    ): Promise<{ result: TransactionResult; distributionId: number }> {
        const tokenAddress = normalizeAddress(paymentToken);
        const amountWei = parseAmount(totalAmount);

        try {
            const tx = await retry(
                async () => {
                    const gasLimit = options?.gasLimit || await estimateGasWithBuffer(
                        () => this._contract.createDistribution.estimateGas(
                            tokenAddress,
                            amountWei,
                            claimWindowDays
                        )
                    );
                    return this._contract.createDistribution(
                        tokenAddress,
                        amountWei,
                        claimWindowDays,
                        { gasLimit }
                    );
                },
                { retries: options?.retries ?? this._retries, delay: options?.retryDelay ?? this._retryDelay }
            );

            const receipt = await tx.wait();
            const events = parseEvents(receipt, this._contract.interface);
            const result = createTransactionResult(receipt, events);

            // Extract distribution ID from event
            const createdEvent = events.find((e) => e.name === 'DistributionCreated');
            const distributionId = Number(createdEvent?.args.distributionId || 0);

            return { result, distributionId };
        } catch (error) {
            throw parseContractError(error, this.address, 'createDistribution');
        }
    }

    /**
     * Claim yield from a distribution
     */
    async claim(distributionId: number, options?: TransactionOptions): Promise<TransactionResult> {
        try {
            const tx = await retry(
                async () => {
                    const gasLimit = options?.gasLimit || await estimateGasWithBuffer(
                        () => this._contract.claim.estimateGas(distributionId)
                    );
                    return this._contract.claim(distributionId, { gasLimit });
                },
                { retries: options?.retries ?? this._retries, delay: options?.retryDelay ?? this._retryDelay }
            );

            const receipt = await tx.wait();
            const events = parseEvents(receipt, this._contract.interface);
            return createTransactionResult(receipt, events);
        } catch (error) {
            throw parseContractError(error, this.address, 'claim');
        }
    }

    /**
     * Claim yield from multiple distributions
     */
    async claimMultiple(
        distributionIds: number[],
        options?: TransactionOptions
    ): Promise<TransactionResult> {
        try {
            const tx = await retry(
                async () => {
                    const gasLimit = options?.gasLimit || await estimateGasWithBuffer(
                        () => this._contract.claimMultiple.estimateGas(distributionIds)
                    );
                    return this._contract.claimMultiple(distributionIds, { gasLimit });
                },
                { retries: options?.retries ?? this._retries, delay: options?.retryDelay ?? this._retryDelay }
            );

            const receipt = await tx.wait();
            const events = parseEvents(receipt, this._contract.interface);
            return createTransactionResult(receipt, events);
        } catch (error) {
            throw parseContractError(error, this.address, 'claimMultiple');
        }
    }

    /**
     * Handle unclaimed funds after claim window expires
     */
    async handleUnclaimedFunds(
        distributionId: number,
        options?: TransactionOptions
    ): Promise<TransactionResult> {
        try {
            const tx = await retry(
                async () => {
                    const gasLimit = options?.gasLimit || await estimateGasWithBuffer(
                        () => this._contract.handleUnclaimedFunds.estimateGas(distributionId)
                    );
                    return this._contract.handleUnclaimedFunds(distributionId, { gasLimit });
                },
                { retries: options?.retries ?? this._retries, delay: options?.retryDelay ?? this._retryDelay }
            );

            const receipt = await tx.wait();
            const events = parseEvents(receipt, this._contract.interface);
            return createTransactionResult(receipt, events);
        } catch (error) {
            throw parseContractError(error, this.address, 'handleUnclaimedFunds');
        }
    }

    /**
     * Set the unclaimed funds recipient
     */
    async setUnclaimedFundsRecipient(
        recipient: string,
        options?: TransactionOptions
    ): Promise<TransactionResult> {
        const recipientAddress = normalizeAddress(recipient);

        try {
            const tx = await retry(
                async () => {
                    const gasLimit = options?.gasLimit || await estimateGasWithBuffer(
                        () => this._contract.setUnclaimedFundsRecipient.estimateGas(recipientAddress)
                    );
                    return this._contract.setUnclaimedFundsRecipient(recipientAddress, { gasLimit });
                },
                { retries: options?.retries ?? this._retries, delay: options?.retryDelay ?? this._retryDelay }
            );

            const receipt = await tx.wait();
            const events = parseEvents(receipt, this._contract.interface);
            return createTransactionResult(receipt, events);
        } catch (error) {
            throw parseContractError(error, this.address, 'setUnclaimedFundsRecipient');
        }
    }

    /*//////////////////////////////////////////////////////////////
                            EVENT LISTENERS
    //////////////////////////////////////////////////////////////*/

    /**
     * Listen for DistributionCreated events
     */
    onDistributionCreated(
        callback: (distributionId: bigint, paymentToken: string, totalAmount: bigint, snapshotId: bigint) => void
    ): () => void {
        const listener = (
            distributionId: bigint,
            paymentToken: string,
            totalAmount: bigint,
            snapshotId: bigint
        ) => {
            callback(distributionId, paymentToken, totalAmount, snapshotId);
        };
        this._contract.on('DistributionCreated', listener);
        return () => this._contract.off('DistributionCreated', listener);
    }

    /**
     * Listen for YieldClaimed events
     */
    onYieldClaimed(
        callback: (distributionId: bigint, claimant: string, amount: bigint) => void
    ): () => void {
        const listener = (distributionId: bigint, claimant: string, amount: bigint) => {
            callback(distributionId, claimant, amount);
        };
        this._contract.on('YieldClaimed', listener);
        return () => this._contract.off('YieldClaimed', listener);
    }
}

/**
 * Module for yield distribution operations
 */
export class YieldModule {
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
     * Connect to an existing yield distributor
     */
    connect(address: string): YieldDistributorInstance {
        if (!isValidAddress(address)) {
            throw new RWAError(ErrorCode.INVALID_ADDRESS, `Invalid distributor address: ${address}`);
        }
        return new YieldDistributorInstance(
            address,
            this._provider,
            this._signer,
            this._retries,
            this._retryDelay
        );
    }

    /**
     * Create a distribution
     * 
     * @param config - Distribution configuration
     * @returns Transaction result with distribution ID
     */
    async distribute(config: DistributionConfig): Promise<{ result: TransactionResult; distributionId: number }> {
        if (!isValidAddress(config.tokenAddress)) {
            throw new RWAError(ErrorCode.INVALID_ADDRESS, `Invalid token address: ${config.tokenAddress}`);
        }
        if (!isValidAddress(config.paymentToken)) {
            throw new RWAError(ErrorCode.INVALID_ADDRESS, `Invalid payment token address: ${config.paymentToken}`);
        }

        const distributor = this.connect(config.tokenAddress);
        return distributor.createDistribution(
            config.paymentToken,
            config.totalAmount,
            config.claimWindowDays
        );
    }

    /**
     * Preview a distribution (calculate per-holder amounts)
     * 
     * This method calculates what each holder would receive based on their
     * proportional ownership at the snapshot time.
     * 
     * @param tokenAddress - The RWA token address
     * @param totalAmount - Total amount to distribute (in token units)
     * @param snapshotId - Optional snapshot ID (uses current balances if not provided)
     * @param holderAddresses - Optional array of holder addresses to calculate for
     * @returns Preview of the distribution with per-holder breakdown
     */
    async previewDistribution(
        tokenAddress: string,
        totalAmount: string,
        snapshotId?: bigint,
        holderAddresses?: string[]
    ): Promise<DistributionPreview> {
        if (!isValidAddress(tokenAddress)) {
            throw new RWAError(ErrorCode.INVALID_ADDRESS, `Invalid token address: ${tokenAddress}`);
        }

        const token = new ethers.Contract(tokenAddress, RWA_TOKEN_ABI, this._provider);
        const totalAmountWei = parseAmount(totalAmount);

        // Get total supply at snapshot
        let totalSupply: bigint;
        if (snapshotId !== undefined) {
            totalSupply = await token.totalSupplyAt(snapshotId);
        } else {
            totalSupply = await token.totalSupply();
        }

        if (totalSupply === 0n) {
            return {
                totalHolders: 0,
                totalSupplyAtSnapshot: 0n,
                distributions: [],
            };
        }

        // If holder addresses are provided, calculate their distributions
        const distributions: HolderDistribution[] = [];
        if (holderAddresses && holderAddresses.length > 0) {
            for (const address of holderAddresses) {
                const normalizedAddress = normalizeAddress(address);
                let balance: bigint;

                if (snapshotId !== undefined) {
                    balance = await token.balanceOfAt(normalizedAddress, snapshotId);
                } else {
                    balance = await token.balanceOf(normalizedAddress);
                }

                if (balance > 0n) {
                    // Calculate proportional yield amount
                    const yieldAmount = (totalAmountWei * balance) / totalSupply;
                    const percentage = Number((balance * 10000n) / totalSupply) / 100;

                    distributions.push({
                        address: normalizedAddress,
                        balance,
                        yieldAmount,
                        percentage,
                    });
                }
            }
        }

        return {
            totalHolders: distributions.length,
            totalSupplyAtSnapshot: totalSupply,
            distributions,
        };
    }

    /**
     * Calculate yield amount for a specific holder
     * 
     * @param tokenAddress - The RWA token address
     * @param holderAddress - The holder's address
     * @param totalAmount - Total distribution amount
     * @param snapshotId - Optional snapshot ID
     * @returns The calculated yield amount for the holder
     */
    async calculateHolderYield(
        tokenAddress: string,
        holderAddress: string,
        totalAmount: string,
        snapshotId?: bigint
    ): Promise<{ balance: bigint; yieldAmount: bigint; percentage: number }> {
        if (!isValidAddress(tokenAddress)) {
            throw new RWAError(ErrorCode.INVALID_ADDRESS, `Invalid token address: ${tokenAddress}`);
        }
        if (!isValidAddress(holderAddress)) {
            throw new RWAError(ErrorCode.INVALID_ADDRESS, `Invalid holder address: ${holderAddress}`);
        }

        const token = new ethers.Contract(tokenAddress, RWA_TOKEN_ABI, this._provider);
        const totalAmountWei = parseAmount(totalAmount);
        const normalizedHolder = normalizeAddress(holderAddress);

        // Get total supply and holder balance
        let totalSupply: bigint;
        let balance: bigint;

        if (snapshotId !== undefined) {
            totalSupply = await token.totalSupplyAt(snapshotId);
            balance = await token.balanceOfAt(normalizedHolder, snapshotId);
        } else {
            totalSupply = await token.totalSupply();
            balance = await token.balanceOf(normalizedHolder);
        }

        if (totalSupply === 0n || balance === 0n) {
            return { balance: 0n, yieldAmount: 0n, percentage: 0 };
        }

        // Calculate proportional yield amount
        const yieldAmount = (totalAmountWei * balance) / totalSupply;
        const percentage = Number((balance * 10000n) / totalSupply) / 100;

        return { balance, yieldAmount, percentage };
    }

    /**
     * Claim yield from a distribution
     */
    async claim(distributorAddress: string, distributionId: number): Promise<TransactionResult> {
        const distributor = this.connect(distributorAddress);
        return distributor.claim(distributionId);
    }

    /**
     * Claim all pending yields
     */
    async claimAll(distributorAddress: string): Promise<TransactionResult> {
        if (!this._signer) {
            throw new RWAError(ErrorCode.SIGNER_REQUIRED, 'A signer is required to claim yields');
        }

        const distributor = this.connect(distributorAddress);
        const signerAddress = await this._signer.getAddress();
        const pendingClaims = await distributor.getPendingClaims(signerAddress);

        if (pendingClaims.length === 0) {
            throw new RWAError(ErrorCode.INVALID_CONFIGURATION, 'No pending claims to process');
        }

        const distributionIds = pendingClaims.map((c) => c.distributionId);
        return distributor.claimMultiple(distributionIds);
    }

    /**
     * Get claimable amount for an account
     */
    async getClaimableAmount(
        distributorAddress: string,
        distributionId: number,
        account: string
    ): Promise<bigint> {
        const distributor = this.connect(distributorAddress);
        return distributor.getClaimableAmount(distributionId, account);
    }

    /**
     * Get distribution history
     */
    async getDistributionHistory(distributorAddress: string): Promise<Distribution[]> {
        const distributor = this.connect(distributorAddress);
        return distributor.getDistributionHistory();
    }

    /**
     * Get pending claims for an account
     */
    async getPendingClaims(distributorAddress: string, account: string): Promise<PendingClaim[]> {
        const distributor = this.connect(distributorAddress);
        return distributor.getPendingClaims(account);
    }
}
