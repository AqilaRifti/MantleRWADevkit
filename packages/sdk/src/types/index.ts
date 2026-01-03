/**
 * Core type definitions for the Mantle RWA SDK
 */

import type { TransactionReceipt } from 'ethers';

/*//////////////////////////////////////////////////////////////
                        NETWORK TYPES
//////////////////////////////////////////////////////////////*/

/**
 * Supported network names
 */
export type NetworkName = 'mantle' | 'mantle-sepolia';

/**
 * Custom network configuration
 */
export interface CustomNetwork {
  rpcUrl: string;
  chainId: number;
  name?: string;
  explorerUrl?: string;
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  contracts?: {
    factory?: string;
  };
}

/*//////////////////////////////////////////////////////////////
                    ACCREDITATION TYPES
//////////////////////////////////////////////////////////////*/

/**
 * Accreditation tiers matching the smart contract enum
 */
export enum AccreditationTier {
  None = 0,
  Retail = 1,
  Accredited = 2,
  Institutional = 3,
}

/*//////////////////////////////////////////////////////////////
                    TRANSACTION TYPES
//////////////////////////////////////////////////////////////*/

/**
 * Parsed event from a transaction
 */
export interface ParsedEvent {
  name: string;
  args: Record<string, unknown>;
  address: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
}

/**
 * Result of a transaction
 */
export interface TransactionResult {
  hash: string;
  blockNumber: number;
  gasUsed: bigint;
  status: 'success' | 'failed';
  events: ParsedEvent[];
  receipt: TransactionReceipt;
}

/**
 * Options for transaction execution
 */
export interface TransactionOptions {
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
  retries?: number;
  retryDelay?: number;
}

/*//////////////////////////////////////////////////////////////
                    COMPLIANCE TYPES
//////////////////////////////////////////////////////////////*/

/**
 * Available compliance rule types
 */
export type ComplianceRule =
  | 'accredited-investor'
  | 'transfer-limit-24h'
  | 'transfer-limit-30d'
  | 'holding-period'
  | 'max-investors'
  | 'geographic-restriction';

/**
 * Transfer eligibility check result
 */
export interface TransferEligibility {
  eligible: boolean;
  reason?: string;
  checks: TransferCheck[];
}

/**
 * Individual transfer check result
 */
export interface TransferCheck {
  name: string;
  passed: boolean;
  details?: string;
}

/*//////////////////////////////////////////////////////////////
                    DEPLOYMENT TYPES
//////////////////////////////////////////////////////////////*/

/**
 * Configuration for deploying a new RWA system
 */
export interface DeploymentConfig {
  tokenName: string;
  tokenSymbol: string;
  initialSupply: string;
  complianceModules?: string[];
  yieldClaimWindowDays?: number;
  vaultSigners: string[];
  vaultThreshold: number;
  vaultWithdrawalThreshold?: string;
}

/**
 * Addresses of deployed contracts
 */
export interface DeployedContracts {
  token: string;
  vault: string;
  yieldDistributor: string;
  kycRegistry: string;
}

/*//////////////////////////////////////////////////////////////
                    TOKEN TYPES
//////////////////////////////////////////////////////////////*/

/**
 * Configuration for deploying a token
 */
export interface TokenDeployConfig {
  name: string;
  symbol: string;
  totalSupply: string;
  complianceRules?: ComplianceRule[];
  kycRegistryAddress?: string;
}

/**
 * Token information
 */
export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  paused: boolean;
}

/*//////////////////////////////////////////////////////////////
                    KYC TYPES
//////////////////////////////////////////////////////////////*/

/**
 * Investor data from the KYC registry
 */
export interface InvestorData {
  verified: boolean;
  tier: AccreditationTier;
  expiry: Date;
  identityHash: string;
}

/**
 * Verification session for KYC flow
 */
export interface VerificationSession {
  sessionId: string;
  provider: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  redirectUrl?: string;
}

/**
 * Result of a KYC verification
 */
export interface VerificationResult {
  verified: boolean;
  tier: AccreditationTier;
  identityHash: string;
  expiryDate: Date;
  rawData?: unknown;
}

/*//////////////////////////////////////////////////////////////
                    YIELD TYPES
//////////////////////////////////////////////////////////////*/

/**
 * Configuration for creating a distribution
 */
export interface DistributionConfig {
  tokenAddress: string;
  paymentToken: string;
  totalAmount: string;
  snapshotDate?: Date;
  claimWindowDays?: number;
}

/**
 * Preview of a distribution
 */
export interface DistributionPreview {
  totalHolders: number;
  totalSupplyAtSnapshot: bigint;
  distributions: HolderDistribution[];
}

/**
 * Distribution amount for a single holder
 */
export interface HolderDistribution {
  address: string;
  balance: bigint;
  yieldAmount: bigint;
  percentage: number;
}

/**
 * Distribution information
 */
export interface Distribution {
  id: number;
  paymentToken: string;
  totalAmount: bigint;
  snapshotId: bigint;
  claimDeadline: Date;
  claimedAmount: bigint;
}

/**
 * Pending claim for an account
 */
export interface PendingClaim {
  distributionId: number;
  amount: bigint;
  paymentToken: string;
  deadline: Date;
}

/*//////////////////////////////////////////////////////////////
                    VAULT TYPES
//////////////////////////////////////////////////////////////*/

/**
 * Withdrawal proposal
 */
export interface WithdrawalProposal {
  id: number;
  token: string;
  amount: bigint;
  recipient: string;
  approvalCount: number;
  executed: boolean;
  approvers: string[];
}

/**
 * Vault status information
 */
export interface VaultStatus {
  isEmergency: boolean;
  collateralizationRatio: number;
  backingVerified: boolean;
}

/*//////////////////////////////////////////////////////////////
                    COMPLIANCE REPORT TYPES
//////////////////////////////////////////////////////////////*/

/**
 * Compliance report for regulatory purposes
 */
export interface ComplianceReport {
  generatedAt: Date;
  tokenAddress: string;
  totalHolders: number;
  verifiedHolders: number;
  accreditedHolders: number;
  transfersBlocked: number;
  complianceScore: number;
}

/**
 * Filing data for regulatory submissions
 */
export interface FilingData {
  filingType: string;
  tokenAddress: string;
  reportingPeriod: {
    start: Date;
    end: Date;
  };
  data: Record<string, unknown>;
}
