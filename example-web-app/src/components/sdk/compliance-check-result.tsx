'use client';

/**
 * ComplianceCheckResult - Display transfer eligibility check results
 * 
 * Shows overall eligibility status and individual check results
 * with pass/fail indicators and failure reasons.
 * 
 * @example
 * ```tsx
 * <ComplianceCheckResult
 *   result={eligibilityResult}
 *   from="0x123..."
 *   to="0x456..."
 *   amount="100"
 * />
 * ```
 */

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Shield,
    ArrowRight,
} from 'lucide-react';
import type { TransferEligibility, TransferCheck } from '@mantle-rwa/sdk';

export interface ComplianceCheckResultProps {
    /** The eligibility check result */
    result: TransferEligibility;
    /** Sender address */
    from?: string;
    /** Recipient address */
    to?: string;
    /** Transfer amount */
    amount?: string;
    /** Additional CSS classes */
    className?: string;
    /** Compact display mode */
    compact?: boolean;
}

function CheckItem({ check }: { check: TransferCheck }) {
    return (
        <div className={cn(
            "flex items-start gap-3 p-3 rounded-lg border",
            check.passed
                ? "bg-green-500/5 border-green-500/20"
                : "bg-red-500/5 border-red-500/20"
        )}>
            {check.passed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            ) : (
                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{check.name}</span>
                    <Badge
                        variant={check.passed ? 'default' : 'destructive'}
                        className="text-xs"
                    >
                        {check.passed ? 'Passed' : 'Failed'}
                    </Badge>
                </div>
                {check.details && (
                    <p className={cn(
                        "text-sm mt-1",
                        check.passed
                            ? "text-muted-foreground"
                            : "text-red-600 dark:text-red-400"
                    )}>
                        {check.details}
                    </p>
                )}
            </div>
        </div>
    );
}

function truncateAddress(address: string): string {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ComplianceCheckResult({
    result,
    from,
    to,
    amount,
    className,
    compact = false,
}: ComplianceCheckResultProps) {
    const passedCount = result.checks.filter(c => c.passed).length;
    const totalCount = result.checks.length;

    if (compact) {
        return (
            <div className={cn(
                "flex items-center gap-3 p-3 rounded-lg border",
                result.eligible
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-red-500/10 border-red-500/30",
                className
            )}>
                {result.eligible ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                    <span className="font-medium">
                        {result.eligible ? 'Transfer Eligible' : 'Transfer Not Eligible'}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                        ({passedCount}/{totalCount} checks passed)
                    </span>
                </div>
            </div>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">Compliance Check</CardTitle>
                    </div>
                    <Badge
                        variant={result.eligible ? 'default' : 'destructive'}
                        className="text-sm"
                    >
                        {result.eligible ? 'Eligible' : 'Not Eligible'}
                    </Badge>
                </div>
                {(from || to || amount) && (
                    <CardDescription className="flex items-center gap-2 mt-2">
                        {from && (
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                {truncateAddress(from)}
                            </span>
                        )}
                        {from && to && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        {to && (
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                {truncateAddress(to)}
                            </span>
                        )}
                        {amount && (
                            <span className="text-sm text-muted-foreground ml-2">
                                Amount: {amount}
                            </span>
                        )}
                    </CardDescription>
                )}
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Overall Status */}
                <div className={cn(
                    "p-4 rounded-lg",
                    result.eligible
                        ? "bg-green-500/10"
                        : "bg-red-500/10"
                )}>
                    <div className="flex items-center gap-3">
                        {result.eligible ? (
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        ) : (
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        )}
                        <div>
                            <p className="font-semibold text-lg">
                                {result.eligible
                                    ? 'Transfer is Allowed'
                                    : 'Transfer is Blocked'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {passedCount} of {totalCount} compliance checks passed
                            </p>
                        </div>
                    </div>

                    {!result.eligible && result.reason && (
                        <div className="mt-3 p-3 rounded bg-red-500/10 border border-red-500/20">
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">
                                Reason: {result.reason}
                            </p>
                        </div>
                    )}
                </div>

                {/* Individual Checks */}
                <div>
                    <h4 className="text-sm font-medium mb-3">Check Details</h4>
                    <div className="space-y-2">
                        {result.checks.map((check, index) => (
                            <CheckItem key={index} check={check} />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default ComplianceCheckResult;
