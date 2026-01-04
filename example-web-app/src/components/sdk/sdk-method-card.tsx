'use client';

/**
 * SDKMethodCard - Display SDK method with signature, inputs, and results
 * 
 * Interactive card for executing SDK methods with parameter inputs
 * and result display.
 * 
 * @example
 * ```tsx
 * <SDKMethodCard
 *   method="balanceOf"
 *   module="token"
 *   description="Get token balance for an address"
 *   parameters={[{ name: 'address', type: 'string', required: true }]}
 *   onExecute={handleExecute}
 * />
 * ```
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { CodeSnippet } from './code-snippet';
import { TransactionStatus, TransactionStatusType } from './transaction-status';
import {
    Play,
    Code2,
    Loader2,
    CheckCircle2,
    XCircle,
} from 'lucide-react';

export interface MethodParameter {
    /** Parameter name */
    name: string;
    /** Parameter type */
    type: 'string' | 'number' | 'boolean' | 'address' | 'bigint';
    /** Whether the parameter is required */
    required?: boolean;
    /** Default value */
    defaultValue?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Description */
    description?: string;
}

export interface ExecutionResult {
    /** Whether execution was successful */
    success: boolean;
    /** Result data (for read operations) */
    data?: unknown;
    /** Transaction hash (for write operations) */
    transactionHash?: string;
    /** Error message */
    error?: string;
    /** Execution time in ms */
    executionTime?: number;
}

export interface SDKMethodCardProps {
    /** Method name */
    method: string;
    /** SDK module name */
    module: 'token' | 'kyc' | 'yield' | 'compliance';
    /** Method description */
    description: string;
    /** Method parameters */
    parameters?: MethodParameter[];
    /** Return type description */
    returnType?: string;
    /** Whether this is a write operation (requires transaction) */
    isWriteOperation?: boolean;
    /** Code snippet to display */
    codeSnippet?: string;
    /** Callback when method is executed */
    onExecute?: (params: Record<string, string>) => Promise<ExecutionResult>;
    /** Block explorer URL */
    explorerUrl?: string;
    /** Additional CSS classes */
    className?: string;
    /** Whether the method is currently available */
    disabled?: boolean;
    /** Disabled reason */
    disabledReason?: string;
}

const MODULE_COLORS = {
    token: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    kyc: 'bg-green-500/10 text-green-500 border-green-500/30',
    yield: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    compliance: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
};

export function SDKMethodCard({
    method,
    module,
    description,
    parameters = [],
    returnType,
    isWriteOperation = false,
    codeSnippet,
    onExecute,
    explorerUrl = 'https://sepolia.mantlescan.xyz',
    className,
    disabled = false,
    disabledReason,
}: SDKMethodCardProps) {
    const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        parameters.forEach(p => {
            if (p.defaultValue) {
                initial[p.name] = p.defaultValue;
            }
        });
        return initial;
    });
    const [isExecuting, setIsExecuting] = useState(false);
    const [result, setResult] = useState<ExecutionResult | null>(null);
    const [showCode, setShowCode] = useState(false);

    const handleParamChange = useCallback((name: string, value: string) => {
        setParamValues(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleExecute = useCallback(async () => {
        if (!onExecute || disabled) return;

        setIsExecuting(true);
        setResult(null);

        try {
            const execResult = await onExecute(paramValues);
            setResult(execResult);
        } catch (err) {
            setResult({
                success: false,
                error: err instanceof Error ? err.message : 'Execution failed',
            });
        } finally {
            setIsExecuting(false);
        }
    }, [onExecute, paramValues, disabled]);

    const canExecute = parameters.every(p => {
        if (!p.required) return true;
        return paramValues[p.name]?.trim();
    });

    const getTransactionStatus = (): TransactionStatusType | null => {
        if (!result) return null;
        if (isExecuting) return 'pending';
        return result.success ? 'success' : 'failed';
    };

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge
                                variant="outline"
                                className={cn("text-xs", MODULE_COLORS[module])}
                            >
                                {module}
                            </Badge>
                            {isWriteOperation && (
                                <Badge variant="secondary" className="text-xs">
                                    Write
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="text-lg font-mono">
                            {method}()
                        </CardTitle>
                    </div>
                    {codeSnippet && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCode(!showCode)}
                            className="h-8"
                        >
                            <Code2 className="h-4 w-4 mr-1" />
                            {showCode ? 'Hide' : 'Show'} Code
                        </Button>
                    )}
                </div>
                <CardDescription>{description}</CardDescription>
                {returnType && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Returns: <code className="bg-muted px-1 rounded">{returnType}</code>
                    </p>
                )}
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Code Snippet */}
                {showCode && codeSnippet && (
                    <CodeSnippet
                        code={codeSnippet}
                        language="typescript"
                        collapsible={false}
                    />
                )}

                {/* Parameters */}
                {parameters.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium">Parameters</h4>
                        {parameters.map((param) => (
                            <div key={param.name} className="space-y-1">
                                <Label htmlFor={`${method}-${param.name}`} className="text-sm">
                                    {param.name}
                                    {param.required && (
                                        <span className="text-red-500 ml-1">*</span>
                                    )}
                                    <span className="text-muted-foreground ml-2 font-normal">
                                        ({param.type})
                                    </span>
                                </Label>
                                {param.description && (
                                    <p className="text-xs text-muted-foreground">
                                        {param.description}
                                    </p>
                                )}
                                <Input
                                    id={`${method}-${param.name}`}
                                    value={paramValues[param.name] || ''}
                                    onChange={(e) => handleParamChange(param.name, e.target.value)}
                                    placeholder={param.placeholder || `Enter ${param.name}`}
                                    disabled={disabled || isExecuting}
                                    className="font-mono text-sm"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Execute Button */}
                {onExecute && (
                    <Button
                        onClick={handleExecute}
                        disabled={disabled || isExecuting || !canExecute}
                        className="w-full"
                    >
                        {isExecuting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Executing...
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Execute
                            </>
                        )}
                    </Button>
                )}

                {disabled && disabledReason && (
                    <p className="text-sm text-muted-foreground text-center">
                        {disabledReason}
                    </p>
                )}

                {/* Result Display */}
                {result && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium">Result</h4>

                        {/* Transaction Status for write operations */}
                        {isWriteOperation && result.transactionHash && (
                            <TransactionStatus
                                status={getTransactionStatus() || 'success'}
                                hash={result.transactionHash}
                                explorerUrl={explorerUrl}
                                errorMessage={result.error}
                            />
                        )}

                        {/* Data result for read operations */}
                        {!isWriteOperation && result.success && result.data !== undefined && (
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="text-sm font-medium">Success</span>
                                    {result.executionTime && (
                                        <span className="text-xs text-muted-foreground">
                                            ({result.executionTime}ms)
                                        </span>
                                    )}
                                </div>
                                <pre className="text-sm font-mono bg-muted/50 p-2 rounded overflow-x-auto">
                                    {typeof result.data === 'object'
                                        ? JSON.stringify(result.data, null, 2)
                                        : String(result.data)}
                                </pre>
                            </div>
                        )}

                        {/* Error result */}
                        {!result.success && result.error && !isWriteOperation && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-sm font-medium">Error</span>
                                </div>
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {result.error}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default SDKMethodCard;
