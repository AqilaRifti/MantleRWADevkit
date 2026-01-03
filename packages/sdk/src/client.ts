/**
 * RWAClient - Main entry point for the Mantle RWA SDK
 */

import { ethers, type Provider, type Signer } from 'ethers';
import { TokenModule } from './modules/token';
import { KYCModule } from './modules/kyc';
import { YieldModule } from './modules/yield';
import { ComplianceModule } from './modules/compliance';
import type { NetworkConfig, CustomNetwork, DeploymentConfig, DeployedContracts } from './types';
import { NETWORKS, RWA_FACTORY_ABI, DEFAULTS } from './constants';
import { RWAError, ErrorCode, parseContractError } from './errors';
import { isValidAddress, parseAmount, parseEvents, retry } from './utils';

/**
 * Configuration for RWAClient
 */
export interface RWAClientConfig {
    /** Network to connect to */
    network: 'mantle' | 'mantle-sepolia' | CustomNetwork;
    /** Private key for signing transactions (optional if signer provided) */
    privateKey?: string;
    /** Ethers signer instance (optional if privateKey provided) */
    signer?: Signer;
    /** Factory contract address (optional, uses default if not provided) */
    factoryAddress?: string;
    /** Number of transaction retries */
    retries?: number;
    /** Retry delay in milliseconds */
    retryDelay?: number;
}

/**
 * Main client for interacting with Mantle RWA contracts
 */
export class RWAClient {
    private readonly _provider: Provider;
    private readonly _signer: Signer | null;
    private readonly _networkConfig: NetworkConfig;
    private readonly _factoryAddress?: string;
    private readonly _retries: number;
    private readonly _retryDelay: number;

    /** Token module for RWA token operations */
    readonly token: TokenModule;
    /** KYC module for investor verification */
    readonly kyc: KYCModule;
    /** Yield module for distribution management */
    readonly yield: YieldModule;
    /** Compliance module for transfer eligibility */
    readonly compliance: ComplianceModule;

    constructor(config: RWAClientConfig) {
        // Resolve network configuration
        if (typeof config.network === 'string') {
            const networkConfig = NETWORKS[config.network];
            if (!networkConfig) {
                throw new RWAError(
                    ErrorCode.INVALID_CONFIGURATION,
                    `Unknown network: ${config.network}. Use 'mantle', 'mantle-sepolia', or provide custom network config.`
                );
            }
            this._networkConfig = networkConfig;
        } else {
            this._networkConfig = {
                name: config.network.name || 'Custom Network',
                chainId: config.network.chainId,
                rpcUrl: config.network.rpcUrl,
                explorerUrl: config.network.explorerUrl || '',
            };
        }

        // Create provider
        this._provider = new ethers.JsonRpcProvider(this._networkConfig.rpcUrl);

        // Create signer if private key provided
        if (config.signer) {
            this._signer = config.signer;
        } else if (config.privateKey) {
            this._signer = new ethers.Wallet(config.privateKey, this._provider);
        } else {
            this._signer = null;
        }

        // Store configuration
        this._factoryAddress = config.factoryAddress || this._networkConfig.contracts?.factory;
        this._retries = config.retries ?? DEFAULTS.TRANSACTION_RETRIES;
        this._retryDelay = config.retryDelay ?? DEFAULTS.RETRY_DELAY_MS;

        // Initialize modules
        this.token = new TokenModule(this._provider, this._signer, this._retries, this._retryDelay);
        this.kyc = new KYCModule(this._provider, this._signer, this._retries, this._retryDelay);
        this.yield = new YieldModule(this._provider, this._signer, this._retries, this._retryDelay);
        this.compliance = new ComplianceModule(this._provider, this._signer);
    }

    /**
     * Get the provider instance
     */
    get provider(): Provider {
        return this._provider;
    }

    /**
     * Get the signer instance (throws if not available)
     */
    get signer(): Signer {
        if (!this._signer) {
            throw new RWAError(
                ErrorCode.SIGNER_REQUIRED,
                'A signer is required for this operation. Provide a privateKey or signer in the client configuration.'
            );
        }
        return this._signer;
    }

    /**
     * Check if a signer is available
     */
    get hasSigner(): boolean {
        return this._signer !== null;
    }

    /**
     * Get the network configuration
     */
    get network(): NetworkConfig {
        return this._networkConfig;
    }

    /**
     * Deploy a complete RWA system using the factory contract
     * @param config Deployment configuration
     * @returns Addresses of all deployed contracts
     */
    async deployRWASystem(config: DeploymentConfig): Promise<DeployedContracts> {
        if (!this._factoryAddress) {
            throw new RWAError(
                ErrorCode.INVALID_CONFIGURATION,
                'Factory address not configured. Provide factoryAddress in client config or use a network with a deployed factory.'
            );
        }

        // Validate configuration
        this._validateDeploymentConfig(config);

        const factory = new ethers.Contract(
            this._factoryAddress,
            RWA_FACTORY_ABI,
            this.signer
        );

        const deployConfig = {
            tokenName: config.tokenName,
            tokenSymbol: config.tokenSymbol,
            initialSupply: parseAmount(config.initialSupply),
            complianceModules: config.complianceModules || [],
            yieldClaimWindowDays: config.yieldClaimWindowDays ?? DEFAULTS.YIELD_CLAIM_WINDOW_DAYS,
            vaultSigners: config.vaultSigners,
            vaultThreshold: config.vaultThreshold,
            vaultWithdrawalThreshold: parseAmount(
                config.vaultWithdrawalThreshold || DEFAULTS.VAULT_WITHDRAWAL_THRESHOLD
            ),
        };

        try {
            const tx = await retry(
                () => factory.deploy(deployConfig),
                { retries: this._retries, delay: this._retryDelay }
            );

            const receipt = await tx.wait();
            const iface = new ethers.Interface(RWA_FACTORY_ABI);
            const events = parseEvents(receipt, iface);

            const deployedEvent = events.find((e) => e.name === 'RWASystemDeployed');
            if (!deployedEvent) {
                throw new RWAError(
                    ErrorCode.UNKNOWN,
                    'Deployment succeeded but RWASystemDeployed event not found'
                );
            }

            return {
                token: deployedEvent.args.token as string,
                vault: deployedEvent.args.vault as string,
                yieldDistributor: deployedEvent.args.yieldDistributor as string,
                kycRegistry: deployedEvent.args.kycRegistry as string,
            };
        } catch (error) {
            throw parseContractError(error, this._factoryAddress, 'deploy');
        }
    }

    /**
     * Connect to an existing RWA token
     */
    connectToken(address: string) {
        return this.token.connect(address);
    }

    /**
     * Connect to an existing KYC registry
     */
    connectKYCRegistry(address: string) {
        return this.kyc.connect(address);
    }

    /**
     * Connect to an existing yield distributor
     */
    connectYieldDistributor(address: string) {
        return this.yield.connect(address);
    }

    /**
     * Get the current block number
     */
    async getBlockNumber(): Promise<number> {
        return this._provider.getBlockNumber();
    }

    /**
     * Get the balance of an address
     */
    async getBalance(address: string): Promise<bigint> {
        return this._provider.getBalance(address);
    }

    /**
     * Validate deployment configuration
     */
    private _validateDeploymentConfig(config: DeploymentConfig): void {
        if (!config.tokenName || config.tokenName.length === 0) {
            throw new RWAError(ErrorCode.MISSING_PARAMETER, 'tokenName is required');
        }
        if (!config.tokenSymbol || config.tokenSymbol.length === 0) {
            throw new RWAError(ErrorCode.MISSING_PARAMETER, 'tokenSymbol is required');
        }
        if (!config.initialSupply || parseFloat(config.initialSupply) <= 0) {
            throw new RWAError(ErrorCode.INVALID_AMOUNT, 'initialSupply must be greater than 0');
        }
        if (!config.vaultSigners || config.vaultSigners.length === 0) {
            throw new RWAError(ErrorCode.MISSING_PARAMETER, 'vaultSigners is required');
        }
        for (const signer of config.vaultSigners) {
            if (!isValidAddress(signer)) {
                throw new RWAError(ErrorCode.INVALID_ADDRESS, `Invalid vault signer address: ${signer}`);
            }
        }
        if (config.vaultThreshold <= 0 || config.vaultThreshold > config.vaultSigners.length) {
            throw new RWAError(
                ErrorCode.INVALID_CONFIGURATION,
                `vaultThreshold must be between 1 and ${config.vaultSigners.length}`
            );
        }
    }
}
