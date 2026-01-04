'use client';

/**
 * useCompliance - Hook for compliance operations using the SDK ComplianceModule
 * 
 * Provides transfer eligibility checks, compliance reporting, and export functionality.
 * 
 * @example
 * ```typescript
 * import { useCompliance } from '@/hooks/use-compliance';
 * 
 * function ComplianceChecker() {
 *   const { checkTransferEligibility, generateReport, exportReport } = useCompliance(tokenAddress);
 *   
 *   const handleCheck = async () => {
 *     const result = await checkTransferEligibility(from, to, amount);
 *     console.log('Eligible:', result.eligible);
 *   };
 * }
 * ```
 */

import { useState, useCallback } from 'react';
import { useRWAClient } from './use-rwa-client';
import type {
    TransferEligibility,
    ComplianceReport,
} from '@mantle-rwa/sdk';

/**
 * Return type for useCompliance hook
 */
export interface UseComplianceReturn {
    /** Last transfer eligibility check result */
    lastEligibilityCheck: TransferEligibility | null;
    /** Last generated compliance report */
    lastReport: ComplianceReport | null;
    /** Whether a check/operation is in progress */
    isLoading: boolean;
    /** Error that occurred */
    error: Error | null;

    // Operations
    /** Check if a transfer is eligible */
    checkTransferEligibility: (
        from: string,
        to: string,
        amount: string
    ) => Promise<TransferEligibility>;
    /** Generate a compliance report */
    generateReport: () => Promise<ComplianceReport>;
    /** Export a compliance report */
    exportReport: (
        report: ComplianceReport,
        format: 'json' | 'csv'
    ) => Promise<Blob>;
    /** Clear the last eligibility check */
    clearEligibilityCheck: () => void;
    /** Clear the last report */
    clearReport: () => void;
}

/**
 * Hook for compliance operations
 * @param tokenAddress - The RWA token address
 */
export function useCompliance(tokenAddress: string): UseComplianceReturn {
    const { client, isInitialized } = useRWAClient();

    const [lastEligibilityCheck, setLastEligibilityCheck] = useState<TransferEligibility | null>(null);
    const [lastReport, setLastReport] = useState<ComplianceReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Check transfer eligibility
    const checkTransferEligibility = useCallback(async (
        from: string,
        to: string,
        amount: string
    ): Promise<TransferEligibility> => {
        if (!client || !isInitialized) {
            throw new Error('Client not initialized');
        }

        if (!tokenAddress) {
            throw new Error('Token address not provided');
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await client.compliance.checkTransferEligibility(
                tokenAddress,
                from,
                to,
                amount
            );
            setLastEligibilityCheck(result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Transfer eligibility check failed';
            const error = new Error(errorMessage);
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [client, isInitialized, tokenAddress]);

    // Generate compliance report
    const generateReport = useCallback(async (): Promise<ComplianceReport> => {
        if (!client || !isInitialized) {
            throw new Error('Client not initialized');
        }

        if (!tokenAddress) {
            throw new Error('Token address not provided');
        }

        setIsLoading(true);
        setError(null);

        try {
            const report = await client.compliance.generateComplianceReport(tokenAddress);
            setLastReport(report);
            return report;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Report generation failed';
            const error = new Error(errorMessage);
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [client, isInitialized, tokenAddress]);

    // Export compliance report
    const exportReport = useCallback(async (
        report: ComplianceReport,
        format: 'json' | 'csv'
    ): Promise<Blob> => {
        if (!client || !isInitialized) {
            throw new Error('Client not initialized');
        }

        setIsLoading(true);
        setError(null);

        try {
            const buffer = await client.compliance.exportReport(report, format);
            const mimeType = format === 'json' ? 'application/json' : 'text/csv';
            return new Blob([buffer], { type: mimeType });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Report export failed';
            const error = new Error(errorMessage);
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [client, isInitialized]);

    // Clear eligibility check
    const clearEligibilityCheck = useCallback(() => {
        setLastEligibilityCheck(null);
        setError(null);
    }, []);

    // Clear report
    const clearReport = useCallback(() => {
        setLastReport(null);
        setError(null);
    }, []);

    return {
        lastEligibilityCheck,
        lastReport,
        isLoading,
        error,
        checkTransferEligibility,
        generateReport,
        exportReport,
        clearEligibilityCheck,
        clearReport,
    };
}

/**
 * Code snippets for documentation display
 */
export const COMPLIANCE_CODE_SNIPPETS = {
    checkTransferEligibility: `// Check if a transfer is eligible
const result = await client.compliance.checkTransferEligibility(
  tokenAddress,
  fromAddress,
  toAddress,
  "100" // amount
);

// Result includes:
// - eligible: boolean
// - reason: string (if not eligible)
// - checks: TransferCheck[] (detailed check results)`,

    generateReport: `// Generate a compliance report
const report = await client.compliance.generateComplianceReport(tokenAddress);

// Report includes:
// - generatedAt: Date
// - tokenAddress: string
// - totalHolders: number
// - verifiedHolders: number
// - accreditedHolders: number
// - complianceScore: number`,

    exportReport: `// Export report to JSON or CSV
const buffer = await client.compliance.exportReport(report, 'json');
// or
const csvBuffer = await client.compliance.exportReport(report, 'csv');

// Create downloadable file
const blob = new Blob([buffer], { type: 'application/json' });
const url = URL.createObjectURL(blob);`,

    transferChecks: `// Transfer eligibility checks include:
// 1. Token Active - Is the token paused?
// 2. Sufficient Balance - Does sender have enough tokens?
// 3. Sender KYC Verified - Is sender KYC verified?
// 4. Recipient KYC Verified - Is recipient KYC verified?
// 5. Compliance Modules - Do all compliance rules pass?

result.checks.forEach(check => {
  console.log(\`\${check.name}: \${check.passed ? '✓' : '✗'}\`);
  console.log(\`  Details: \${check.details}\`);
});`,
};

export default useCompliance;
