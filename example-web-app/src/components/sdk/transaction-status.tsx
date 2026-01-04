'use client';

/**
 * TransactionStatus - Display transaction status with explorer links
 * 
 * Shows pending, success, and failed transaction states with
 * transaction hash links to block explorer.
 * 
 * @example
 * ```tsx
 * <TransactionStatus
 *   status="success"
 *   hash="0x123..."
 *   explorerUrl="https://sepolia.mantlescan.xyz"
 * />
 * ```
 */

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    CheckCircle2,
    XCircle,
    Loader2,
    ExternalLink,
    Copy,
    Check,
} from 'lucide-react';
import { useState, useCallback } from 'react';

export type TransactionStatusType = 'pending' | 'success' | 'failed';

export interface TransactionStatusProps {
    /** Current transaction status */
    status: TransactionStatusType;
    /** Transaction hash */
    hash?: string;
    /** Block explorer base URL */
    explorerUrl?: string;
    /** Error message for failed transactions */
    errorMessage?: string;
    /** Block number where transaction was included */
    blockNumber?: number;
    /** Gas used by the transaction */
    gasUsed?: bigint;
    /** Additional CSS classes */
    className?: string;
    /** Compact display mode */
    compact?: boolean;
}

const STATUS_CONFIG = {
    pending: {
        icon: Loader2,
        label: 'Pending',
        variant: 'secondary' as const,
        iconClass: 'animate-spin text-yellow-500',
        bgClass: 'bg-yellow-500/10',
    },
    success: {
        icon: CheckCircle2,
        label: 'Success',
        variant: 'default' as const,
        iconClass: 'text-green-500',
        bgClass: 'bg-green-500/10',
    },
    failed: {
        icon: XCircle,
        label: 'Failed',
        variant: 'destructive' as const,
        iconClass: 'text-red-500',
        bgClass: 'bg-red-500/10',
    },
};

export function TransactionStatus({
    status,
    hash,
    explorerUrl = 'https://sepolia.mantlescan.xyz',
    errorMessage,
    blockNumber,
    gasUsed,
    className,
    compact = false,
}: TransactionStatusProps) {
    const [copied, setCopied] = useState(false);
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;

    const truncatedHash = hash
        ? `${hash.slice(0, 10)}...${hash.slice(-8)}`
        : null;

    const explorerLink = hash ? `${explorerUrl}/tx/${hash}` : null;

    const handleCopyHash = useCallback(async () => {
        if (!hash) return;
        try {
            await navigator.clipboard.writeText(hash);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }, [hash]);

    if (compact) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <Icon className={cn("h-4 w-4", config.iconClass)} />
                <Badge variant={config.variant}>{config.label}</Badge>
                {hash && explorerLink && (
                    <a
                        href={explorerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                        {truncatedHash}
                        <ExternalLink className="h-3 w-3" />
                    </a>
                )}
            </div>
        );
    }

    return (
        <div className={cn(
            "rounded-lg border p-4",
            config.bgClass,
            className
        )}>
            <div className="flex items-start gap-3">
                <div className={cn(
                    "rounded-full p-2",
                    status === 'pending' && "bg-yellow-500/20",
                    status === 'success' && "bg-green-500/20",
                    status === 'failed' && "bg-red-500/20"
                )}>
                    <Icon className={cn("h-5 w-5", config.iconClass)} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                            Transaction {config.label}
                        </span>
                        <Badge variant={config.variant} className="text-xs">
                            {config.label}
                        </Badge>
                    </div>

                    {hash && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-mono">{truncatedHash}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={handleCopyHash}
                                aria-label={copied ? 'Copied' : 'Copy hash'}
                            >
                                {copied ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                    <Copy className="h-3 w-3" />
                                )}
                            </Button>
                            {explorerLink && (
                                <a
                                    href={explorerLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-foreground transition-colors"
                                    aria-label="View on explorer"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            )}
                        </div>
                    )}

                    {(blockNumber || gasUsed) && status === 'success' && (
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            {blockNumber && (
                                <span>Block: {blockNumber.toLocaleString()}</span>
                            )}
                            {gasUsed && (
                                <span>Gas: {gasUsed.toLocaleString()}</span>
                            )}
                        </div>
                    )}

                    {errorMessage && status === 'failed' && (
                        <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {errorMessage}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TransactionStatus;
