/**
 * ComplianceModule - Handles transfer eligibility and compliance reporting
 */

import { ethers, type Provider, type Signer } from 'ethers';
import type {
    TransferEligibility,
    TransferCheck,
    ComplianceReport,
    FilingData,
} from '../types';
import { RWA_TOKEN_ABI, KYC_REGISTRY_ABI } from '../constants';
import { RWAError, ErrorCode } from '../errors';
import { isValidAddress, normalizeAddress, parseAmount } from '../utils';

/**
 * Module for compliance operations
 */
export class ComplianceModule {
    private readonly _provider: Provider;

    constructor(provider: Provider, _signer: Signer | null) {
        this._provider = provider;
    }

    /**
     * Check if a transfer is eligible
     */
    async checkTransferEligibility(
        tokenAddress: string,
        from: string,
        to: string,
        amount: string
    ): Promise<TransferEligibility> {
        if (!isValidAddress(tokenAddress)) {
            throw new RWAError(ErrorCode.INVALID_ADDRESS, `Invalid token address: ${tokenAddress}`);
        }
        if (!isValidAddress(from)) {
            throw new RWAError(ErrorCode.INVALID_ADDRESS, `Invalid from address: ${from}`);
        }
        if (!isValidAddress(to)) {
            throw new RWAError(ErrorCode.INVALID_ADDRESS, `Invalid to address: ${to}`);
        }

        const token = new ethers.Contract(tokenAddress, RWA_TOKEN_ABI, this._provider);
        const checks: TransferCheck[] = [];

        // Check 1: Token not paused
        try {
            const paused = await token.paused();
            checks.push({
                name: 'Token Active',
                passed: !paused,
                details: paused ? 'Token transfers are currently paused' : 'Token is active',
            });
        } catch {
            checks.push({
                name: 'Token Active',
                passed: false,
                details: 'Unable to check pause status',
            });
        }

        // Check 2: Sender has sufficient balance
        try {
            const balance = await token.balanceOf(normalizeAddress(from));
            const amountWei = parseAmount(amount);
            const hasBalance = balance >= amountWei;
            checks.push({
                name: 'Sufficient Balance',
                passed: hasBalance,
                details: hasBalance
                    ? `Balance: ${balance.toString()}`
                    : `Insufficient balance. Has: ${balance.toString()}, Needs: ${amountWei.toString()}`,
            });
        } catch {
            checks.push({
                name: 'Sufficient Balance',
                passed: false,
                details: 'Unable to check balance',
            });
        }

        // Check 3: KYC verification for sender and recipient
        try {
            const kycRegistryAddress = await token.kycRegistry();
            if (kycRegistryAddress !== ethers.ZeroAddress) {
                const kycRegistry = new ethers.Contract(
                    kycRegistryAddress,
                    KYC_REGISTRY_ABI,
                    this._provider
                );

                // Check sender (skip for minting from zero address)
                if (from !== ethers.ZeroAddress) {
                    const senderVerified = await kycRegistry.isVerified(normalizeAddress(from));
                    checks.push({
                        name: 'Sender KYC Verified',
                        passed: senderVerified,
                        details: senderVerified
                            ? 'Sender is KYC verified'
                            : 'Sender is not KYC verified or verification has expired',
                    });
                }

                // Check recipient
                const recipientVerified = await kycRegistry.isVerified(normalizeAddress(to));
                checks.push({
                    name: 'Recipient KYC Verified',
                    passed: recipientVerified,
                    details: recipientVerified
                        ? 'Recipient is KYC verified'
                        : 'Recipient is not KYC verified or verification has expired',
                });
            }
        } catch {
            checks.push({
                name: 'KYC Verification',
                passed: false,
                details: 'Unable to check KYC status',
            });
        }

        // Check 4: Compliance modules
        try {
            const [allowed, reason] = await token.isTransferAllowed(
                normalizeAddress(from),
                normalizeAddress(to),
                parseAmount(amount)
            );
            checks.push({
                name: 'Compliance Modules',
                passed: allowed,
                details: allowed ? 'All compliance checks passed' : reason,
            });
        } catch {
            checks.push({
                name: 'Compliance Modules',
                passed: false,
                details: 'Unable to check compliance modules',
            });
        }

        // Determine overall eligibility
        const allPassed = checks.every((c) => c.passed);
        const failedCheck = checks.find((c) => !c.passed);

        return {
            eligible: allPassed,
            reason: allPassed ? undefined : failedCheck?.details,
            checks,
        };
    }

    /**
     * Generate a compliance report for a token
     */
    async generateComplianceReport(tokenAddress: string): Promise<ComplianceReport> {
        if (!isValidAddress(tokenAddress)) {
            throw new RWAError(ErrorCode.INVALID_ADDRESS, `Invalid token address: ${tokenAddress}`);
        }

        const token = new ethers.Contract(tokenAddress, RWA_TOKEN_ABI, this._provider);

        // Get KYC registry - verify it exists
        try {
            await token.kycRegistry();
        } catch {
            throw new RWAError(
                ErrorCode.INVALID_CONFIGURATION,
                'Unable to get KYC registry from token contract'
            );
        }

        // Note: In a production implementation, this would require an indexer
        // to track all token holders and their KYC status. This is a simplified
        // version that returns placeholder data.
        const report: ComplianceReport = {
            generatedAt: new Date(),
            tokenAddress: normalizeAddress(tokenAddress),
            totalHolders: 0, // Would need indexer
            verifiedHolders: 0, // Would need indexer
            accreditedHolders: 0, // Would need indexer
            transfersBlocked: 0, // Would need event indexing
            complianceScore: 100, // Placeholder
        };

        return report;
    }

    /**
     * Export a compliance report in various formats
     */
    async exportReport(
        report: ComplianceReport,
        format: 'json' | 'csv' | 'pdf'
    ): Promise<Buffer> {
        switch (format) {
            case 'json':
                return Buffer.from(JSON.stringify(report, null, 2));

            case 'csv': {
                const headers = Object.keys(report).join(',');
                const values = Object.values(report)
                    .map((v) => (v instanceof Date ? v.toISOString() : String(v)))
                    .join(',');
                return Buffer.from(`${headers}\n${values}`);
            }

            case 'pdf':
                // PDF generation would require a library like pdfkit
                throw new RWAError(
                    ErrorCode.INVALID_CONFIGURATION,
                    'PDF export requires additional dependencies. Use JSON or CSV format.'
                );

            default:
                throw new RWAError(
                    ErrorCode.INVALID_CONFIGURATION,
                    `Unsupported export format: ${format}`
                );
        }
    }

    /**
     * Prepare filing data for regulatory submissions
     */
    async prepareFilingData(
        tokenAddress: string,
        filingType: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<FilingData> {
        const report = await this.generateComplianceReport(tokenAddress);

        return {
            filingType,
            tokenAddress: normalizeAddress(tokenAddress),
            reportingPeriod: {
                start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: 30 days ago
                end: endDate || new Date(),
            },
            data: {
                totalHolders: report.totalHolders,
                verifiedHolders: report.verifiedHolders,
                accreditedHolders: report.accreditedHolders,
                complianceScore: report.complianceScore,
                generatedAt: report.generatedAt.toISOString(),
            },
        };
    }
}
