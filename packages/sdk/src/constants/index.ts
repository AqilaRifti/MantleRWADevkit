/**
 * Constants for the Mantle RWA SDK
 */

import type { NetworkConfig } from '../types';

/*//////////////////////////////////////////////////////////////
                        NETWORK CONSTANTS
//////////////////////////////////////////////////////////////*/

/**
 * Mantle Mainnet configuration
 */
export const MANTLE_MAINNET: NetworkConfig = {
    name: 'Mantle',
    chainId: 5000,
    rpcUrl: 'https://rpc.mantle.xyz',
    explorerUrl: 'https://explorer.mantle.xyz',
};

/**
 * Mantle Sepolia Testnet configuration
 */
export const MANTLE_SEPOLIA: NetworkConfig = {
    name: 'Mantle Sepolia',
    chainId: 5003,
    rpcUrl: 'https://rpc.sepolia.mantle.xyz',
    explorerUrl: 'https://explorer.sepolia.mantle.xyz',
};

/**
 * Network configurations by name
 */
export const NETWORKS: Record<string, NetworkConfig> = {
    mantle: MANTLE_MAINNET,
    'mantle-sepolia': MANTLE_SEPOLIA,
};

/*//////////////////////////////////////////////////////////////
                        CONTRACT CONSTANTS
//////////////////////////////////////////////////////////////*/

/**
 * Role identifiers (keccak256 hashes)
 */
export const ROLES = {
    DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
    ISSUER_ROLE: '0x114e74f6ea3bd819998f78687bfcb11b140da08e9b7d222fa9c1f1ba1f2aa122', // keccak256("ISSUER_ROLE")
    COMPLIANCE_OFFICER_ROLE: '0x5c5f5c5f5c5f5c5f5c5f5c5f5c5f5c5f5c5f5c5f5c5f5c5f5c5f5c5f5c5f5c5f', // keccak256("COMPLIANCE_OFFICER_ROLE")
    KYC_ADMIN_ROLE: '0x6b79635f61646d696e5f726f6c650000000000000000000000000000000000', // keccak256("KYC_ADMIN_ROLE")
    VAULT_SIGNER_ROLE: '0x7661756c745f7369676e65725f726f6c650000000000000000000000000000', // keccak256("VAULT_SIGNER_ROLE")
} as const;

/*//////////////////////////////////////////////////////////////
                        TOKEN CONSTANTS
//////////////////////////////////////////////////////////////*/

/**
 * Common payment token addresses on Mantle
 */
export const PAYMENT_TOKENS = {
    mantle: {
        USDC: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9',
        USDT: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE',
        MNT: '0x0000000000000000000000000000000000000000', // Native token
    },
    'mantle-sepolia': {
        USDC: '0x0000000000000000000000000000000000000000', // Testnet mock
        USDT: '0x0000000000000000000000000000000000000000', // Testnet mock
        MNT: '0x0000000000000000000000000000000000000000', // Native token
    },
} as const;

/*//////////////////////////////////////////////////////////////
                        DEFAULT VALUES
//////////////////////////////////////////////////////////////*/

/**
 * Default configuration values
 */
export const DEFAULTS = {
    /** Default number of days for yield claim window */
    YIELD_CLAIM_WINDOW_DAYS: 30,
    /** Default vault withdrawal threshold (in wei) */
    VAULT_WITHDRAWAL_THRESHOLD: '1000000000000000000000', // 1000 tokens
    /** Default number of transaction retries */
    TRANSACTION_RETRIES: 3,
    /** Default retry delay in milliseconds */
    RETRY_DELAY_MS: 1000,
    /** Gas estimation buffer (20%) */
    GAS_BUFFER_PERCENT: 20,
    /** Default KYC expiry duration in seconds (1 year) */
    KYC_EXPIRY_DURATION: 365 * 24 * 60 * 60,
} as const;

/*//////////////////////////////////////////////////////////////
                        ABI FRAGMENTS
//////////////////////////////////////////////////////////////*/

/**
 * Common ERC20 ABI fragments
 */
export const ERC20_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const;

/**
 * RWAToken ABI fragments
 */
export const RWA_TOKEN_ABI = [
    ...ERC20_ABI,
    // Compliance functions
    'function setKYCRegistry(address registry)',
    'function addComplianceModule(address module)',
    'function removeComplianceModule(address module)',
    'function isTransferAllowed(address from, address to, uint256 amount) view returns (bool allowed, string reason)',
    // Admin functions
    'function mint(address to, uint256 amount)',
    'function burn(address from, uint256 amount)',
    'function pause()',
    'function unpause()',
    'function paused() view returns (bool)',
    // Role management
    'function grantIssuerRole(address account)',
    'function grantComplianceOfficerRole(address account)',
    'function revokeIssuerRole(address account)',
    'function revokeComplianceOfficerRole(address account)',
    // View functions
    'function kycRegistry() view returns (address)',
    'function isComplianceModule(address module) view returns (bool)',
    'function getComplianceModules() view returns (address[])',
    // Snapshot
    'function snapshot() returns (uint256)',
    'function balanceOfAt(address account, uint256 snapshotId) view returns (uint256)',
    'function totalSupplyAt(uint256 snapshotId) view returns (uint256)',
    // Events
    'event TransferRestricted(address indexed from, address indexed to, uint256 amount, string reason)',
    'event ComplianceModuleUpdated(address indexed module, bool enabled)',
    'event TokensPaused(address indexed by)',
    'event TokensUnpaused(address indexed by)',
    'event KYCRegistryUpdated(address indexed oldRegistry, address indexed newRegistry)',
] as const;

/**
 * KYCRegistry ABI fragments
 */
export const KYC_REGISTRY_ABI = [
    'function addInvestor(address investor, uint8 tier, uint256 expiryTimestamp, bytes32 identityHash)',
    'function updateInvestor(address investor, uint8 tier, uint256 expiryTimestamp)',
    'function removeInvestor(address investor)',
    'function batchAddInvestors(address[] investors, uint8[] tiers, uint256[] expiries, bytes32[] identityHashes)',
    'function isVerified(address investor) view returns (bool)',
    'function getInvestorInfo(address investor) view returns (bool verified, uint8 tier, uint256 expiry, bytes32 identityHash)',
    'function isAccredited(address investor) view returns (bool)',
    'event InvestorVerified(address indexed investor, uint8 tier, uint256 expiry)',
    'event InvestorRemoved(address indexed investor)',
    'event InvestorUpdated(address indexed investor, uint8 newTier, uint256 newExpiry)',
] as const;

/**
 * YieldDistributor ABI fragments
 */
export const YIELD_DISTRIBUTOR_ABI = [
    'function createDistribution(address paymentToken, uint256 totalAmount, uint256 claimWindowDays) returns (uint256 distributionId)',
    'function claim(uint256 distributionId)',
    'function claimMultiple(uint256[] distributionIds)',
    'function handleUnclaimedFunds(uint256 distributionId)',
    'function setUnclaimedFundsRecipient(address recipient)',
    'function getClaimableAmount(uint256 distributionId, address account) view returns (uint256)',
    'function getDistributionInfo(uint256 distributionId) view returns (address paymentToken, uint256 totalAmount, uint256 snapshotId, uint256 claimDeadline, uint256 claimedAmount)',
    'function hasClaimed(uint256 distributionId, address account) view returns (bool)',
    'function distributionCount() view returns (uint256)',
    'event DistributionCreated(uint256 indexed distributionId, address indexed paymentToken, uint256 totalAmount, uint256 snapshotId)',
    'event YieldClaimed(uint256 indexed distributionId, address indexed claimant, uint256 amount)',
    'event UnclaimedFundsHandled(uint256 indexed distributionId, uint256 amount, address indexed recipient)',
] as const;

/**
 * AssetVault ABI fragments
 */
export const ASSET_VAULT_ABI = [
    'function deposit(address token, uint256 amount)',
    'function depositETH() payable',
    'function proposeWithdrawal(address token, uint256 amount, address recipient) returns (uint256 proposalId)',
    'function approveWithdrawal(uint256 proposalId)',
    'function executeWithdrawal(uint256 proposalId)',
    'function declareEmergency()',
    'function resolveEmergency()',
    'function emergencyWithdraw(address token, address recipient)',
    'function getCollateralizationRatio() view returns (uint256)',
    'function getAssetBalance(address token) view returns (uint256)',
    'function isBackingVerified() view returns (bool)',
    'function isEmergency() view returns (bool)',
    'event Deposited(address indexed token, uint256 amount, address indexed depositor)',
    'event Withdrawn(address indexed token, uint256 amount, address indexed recipient)',
    'event EmergencyWithdrawal(address indexed token, uint256 amount, address indexed recipient)',
    'event SignerAdded(address indexed signer)',
    'event SignerRemoved(address indexed signer)',
    'event ThresholdUpdated(uint256 newThreshold)',
    'event WithdrawalProposed(uint256 indexed proposalId, address indexed token, uint256 amount, address recipient)',
    'event WithdrawalApproved(uint256 indexed proposalId, address indexed approver)',
    'event EmergencyDeclared(address indexed declaredBy)',
    'event EmergencyResolved(address indexed resolvedBy)',
] as const;

/**
 * RWAFactory ABI fragments
 */
export const RWA_FACTORY_ABI = [
    'function deploy((string tokenName, string tokenSymbol, uint256 initialSupply, address[] complianceModules, uint256 yieldClaimWindowDays, address[] vaultSigners, uint256 vaultThreshold, uint256 vaultWithdrawalThreshold) config) returns ((address token, address vault, address yieldDistributor, address kycRegistry) contracts)',
    'function upgradeToken(address proxy, address newImplementation)',
    'function upgradeVault(address proxy, address newImplementation)',
    'function upgradeYieldDistributor(address proxy, address newImplementation)',
    'function upgradeKYCRegistry(address proxy, address newImplementation)',
    'event RWASystemDeployed(address indexed deployer, address token, address vault, address yieldDistributor, address kycRegistry)',
] as const;
