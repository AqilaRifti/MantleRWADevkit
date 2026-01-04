'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { WalletConnect } from '@/components/wallet-connect';
import { contractAddresses, propertyDetails } from '@/config/wagmi';
import { useRWAClient } from '@/hooks/use-rwa-client';
import { CodeSnippet } from '@/components/sdk/code-snippet';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Code2,
    Play,
    Wallet,
    Coins,
    Shield,
    Users,
    TrendingUp,
    Terminal,
    Copy,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import Link from 'next/link';

// SDK Method definitions for the playground
const SDK_METHODS = {
    token: [
        {
            name: 'getInfo',
            description: 'Get token information (name, symbol, supply, paused status)',
            params: [],
            returns: 'TokenInfo',
        },
        {
            name: 'balanceOf',
            description: 'Get token balance of an address',
            params: [{ name: 'account', type: 'address', description: 'Address to check' }],
            returns: 'bigint',
        },
        {
            name: 'isTransferAllowed',
            description: 'Check if a transfer would be allowed',
            params: [
                { name: 'from', type: 'address', description: 'Sender address' },
                { name: 'to', type: 'address', description: 'Recipient address' },
                { name: 'amount', type: 'string', description: 'Amount to transfer' },
            ],
            returns: '{ allowed: boolean, reason: string }',
        },
    ],
    kyc: [
        {
            name: 'isVerified',
            description: 'Check if an address is KYC verified',
            params: [{ name: 'investor', type: 'address', description: 'Address to check' }],
            returns: 'boolean',
        },
        {
            name: 'getInvestorInfo',
            description: 'Get full investor information',
            params: [{ name: 'investor', type: 'address', description: 'Address to check' }],
            returns: 'InvestorData',
        },
        {
            name: 'isAccredited',
            description: 'Check if an address is accredited',
            params: [{ name: 'investor', type: 'address', description: 'Address to check' }],
            returns: 'boolean',
        },
    ],
    yield: [
        {
            name: 'getDistributionHistory',
            description: 'Get all yield distributions',
            params: [],
            returns: 'Distribution[]',
        },
        {
            name: 'getPendingClaims',
            description: 'Get pending claims for an account',
            params: [{ name: 'account', type: 'address', description: 'Address to check' }],
            returns: 'PendingClaim[]',
        },
        {
            name: 'previewDistribution',
            description: 'Preview distribution amounts',
            params: [{ name: 'totalAmount', type: 'string', description: 'Total amount to distribute' }],
            returns: 'DistributionPreview',
        },
    ],
    compliance: [
        {
            name: 'checkTransferEligibility',
            description: 'Check if a transfer is eligible with detailed checks',
            params: [
                { name: 'from', type: 'address', description: 'Sender address' },
                { name: 'to', type: 'address', description: 'Recipient address' },
                { name: 'amount', type: 'string', description: 'Amount to transfer' },
            ],
            returns: 'TransferEligibility',
        },
        {
            name: 'generateReport',
            description: 'Generate a compliance report',
            params: [],
            returns: 'ComplianceReport',
        },
    ],
};

// Pre-built scenarios
const SCENARIOS = [
    {
        id: 'check-balance',
        name: 'Check My Balance',
        description: 'Get your current token balance',
        module: 'token',
        method: 'balanceOf',
        useConnectedWallet: true,
    },
    {
        id: 'verify-kyc',
        name: 'Verify KYC Status',
        description: 'Check if your wallet is KYC verified',
        module: 'kyc',
        method: 'isVerified',
        useConnectedWallet: true,
    },
    {
        id: 'preview-yield',
        name: 'Preview Yield Distribution',
        description: 'Calculate distribution for 10,000 tokens',
        module: 'yield',
        method: 'previewDistribution',
        defaultParams: { totalAmount: '10000' },
    },
    {
        id: 'check-transfer',
        name: 'Check Transfer Eligibility',
        description: 'Verify if a transfer would be allowed',
        module: 'compliance',
        method: 'checkTransferEligibility',
    },
];

export default function PlaygroundPage() {
    const { address, isConnected } = useAccount();
    const { isInitialized, networkInfo, client } = useRWAClient();

    // State
    const [activeModule, setActiveModule] = useState<'token' | 'kyc' | 'yield' | 'compliance'>('token');
    const [selectedMethod, setSelectedMethod] = useState<string>('');
    const [params, setParams] = useState<Record<string, string>>({});
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionTime, setExecutionTime] = useState<number | null>(null);

    // Execute SDK method
    const executeMethod = useCallback(async () => {
        if (!isInitialized || !client) {
            toast.error('SDK not initialized');
            return;
        }

        setIsExecuting(true);
        setError(null);
        setResult(null);
        const startTime = Date.now();

        try {
            let response: unknown;

            // Token methods
            if (activeModule === 'token') {
                const token = client.token.connect(contractAddresses.rwaToken);
                switch (selectedMethod) {
                    case 'getInfo':
                        response = await token.getInfo();
                        break;
                    case 'balanceOf':
                        response = await token.balanceOf(params.account || address || '');
                        break;
                    case 'isTransferAllowed':
                        response = await token.isTransferAllowed(
                            params.from || '',
                            params.to || '',
                            params.amount || '0'
                        );
                        break;
                    default:
                        throw new Error(`Unknown method: ${selectedMethod}`);
                }
            }

            // KYC methods
            if (activeModule === 'kyc') {
                const registry = client.kyc.connect(contractAddresses.kycRegistry);
                switch (selectedMethod) {
                    case 'isVerified':
                        response = await registry.isVerified(params.investor || address || '');
                        break;
                    case 'getInvestorInfo':
                        response = await registry.getInvestorInfo(params.investor || address || '');
                        break;
                    case 'isAccredited':
                        response = await registry.isAccredited(params.investor || address || '');
                        break;
                    default:
                        throw new Error(`Unknown method: ${selectedMethod}`);
                }
            }

            // Yield methods
            if (activeModule === 'yield') {
                const distributor = client.yield.connect(contractAddresses.yieldDistributor);
                switch (selectedMethod) {
                    case 'getDistributionHistory':
                        response = await distributor.getDistributionHistory();
                        break;
                    case 'getPendingClaims':
                        response = await distributor.getPendingClaims(params.account || address || '');
                        break;
                    case 'previewDistribution':
                        response = await client.yield.previewDistribution(
                            contractAddresses.rwaToken,
                            params.totalAmount || '0'
                        );
                        break;
                    default:
                        throw new Error(`Unknown method: ${selectedMethod}`);
                }
            }

            // Compliance methods
            if (activeModule === 'compliance') {
                switch (selectedMethod) {
                    case 'checkTransferEligibility':
                        response = await client.compliance.checkTransferEligibility(
                            contractAddresses.rwaToken,
                            params.from || '',
                            params.to || '',
                            params.amount || '0'
                        );
                        break;
                    case 'generateReport':
                        response = await client.compliance.generateComplianceReport(contractAddresses.rwaToken);
                        break;
                    default:
                        throw new Error(`Unknown method: ${selectedMethod}`);
                }
            }

            // Format response
            const formatted = JSON.stringify(
                response,
                (key, value) => {
                    if (typeof value === 'bigint') {
                        return value.toString() + 'n';
                    }
                    if (value instanceof Date) {
                        return value.toISOString();
                    }
                    return value;
                },
                2
            );

            setResult(formatted);
            setExecutionTime(Date.now() - startTime);
            toast.success('Method executed successfully!');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Execution failed';
            setError(errorMessage);
            setExecutionTime(Date.now() - startTime);
            toast.error(errorMessage);
        } finally {
            setIsExecuting(false);
        }
    }, [isInitialized, client, activeModule, selectedMethod, params, address]);

    // Run scenario - sets up the scenario for manual execution
    const runScenario = useCallback((scenario: typeof SCENARIOS[0]) => {
        setActiveModule(scenario.module as typeof activeModule);
        setSelectedMethod(scenario.method);
        setResult(null);
        setError(null);

        if (scenario.useConnectedWallet && address) {
            setParams({ account: address, investor: address });
        } else if (scenario.defaultParams) {
            setParams(scenario.defaultParams);
        } else {
            setParams({});
        }

        toast.info(`Scenario "${scenario.name}" loaded. Click Execute to run.`);
    }, [address]);

    // Copy result to clipboard
    const copyResult = useCallback(() => {
        if (result) {
            navigator.clipboard.writeText(result);
            toast.success('Copied to clipboard!');
        }
    }, [result]);

    // Get current method definition
    const currentMethods = SDK_METHODS[activeModule] || [];
    const currentMethod = currentMethods.find(m => m.name === selectedMethod);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/property" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Link>
                        <div className="flex items-center gap-2">
                            <Terminal className="h-6 w-6 text-primary" />
                            <span className="text-xl font-bold">SDK Playground</span>
                        </div>
                        {networkInfo && (
                            <Badge variant="outline" className="text-xs">
                                {networkInfo.name}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge variant={isInitialized ? 'default' : 'secondary'} className="gap-1">
                            <Code2 className="h-3 w-3" />
                            SDK {isInitialized ? 'Ready' : 'Loading'}
                        </Badge>
                        <WalletConnect />
                    </div>
                </div>
            </header>

            <main className="container py-8">
                {!isConnected ? (
                    <Card className="mx-auto max-w-md">
                        <CardHeader className="text-center">
                            <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
                            <CardTitle>Connect Wallet</CardTitle>
                            <CardDescription>
                                Connect your wallet to interact with the SDK playground.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <WalletConnect />
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Left Panel - Method Selection */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">SDK Modules</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button
                                        variant={activeModule === 'token' ? 'default' : 'outline'}
                                        className="w-full justify-start"
                                        onClick={() => { setActiveModule('token'); setSelectedMethod(''); }}
                                    >
                                        <Coins className="mr-2 h-4 w-4" />
                                        TokenModule
                                    </Button>
                                    <Button
                                        variant={activeModule === 'kyc' ? 'default' : 'outline'}
                                        className="w-full justify-start"
                                        onClick={() => { setActiveModule('kyc'); setSelectedMethod(''); }}
                                    >
                                        <Users className="mr-2 h-4 w-4" />
                                        KYCModule
                                    </Button>
                                    <Button
                                        variant={activeModule === 'yield' ? 'default' : 'outline'}
                                        className="w-full justify-start"
                                        onClick={() => { setActiveModule('yield'); setSelectedMethod(''); }}
                                    >
                                        <TrendingUp className="mr-2 h-4 w-4" />
                                        YieldModule
                                    </Button>
                                    <Button
                                        variant={activeModule === 'compliance' ? 'default' : 'outline'}
                                        className="w-full justify-start"
                                        onClick={() => { setActiveModule('compliance'); setSelectedMethod(''); }}
                                    >
                                        <Shield className="mr-2 h-4 w-4" />
                                        ComplianceModule
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Methods</CardTitle>
                                    <CardDescription>
                                        Select a method from {activeModule}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {currentMethods.map((method) => (
                                        <Button
                                            key={method.name}
                                            variant={selectedMethod === method.name ? 'secondary' : 'ghost'}
                                            className="w-full justify-start text-left"
                                            onClick={() => {
                                                setSelectedMethod(method.name);
                                                setParams({});
                                                setResult(null);
                                                setError(null);
                                            }}
                                        >
                                            <Code2 className="mr-2 h-4 w-4 shrink-0" />
                                            <span className="truncate">{method.name}</span>
                                        </Button>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Quick Scenarios</CardTitle>
                                    <CardDescription>
                                        Pre-built examples to try
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {SCENARIOS.map((scenario) => (
                                        <Button
                                            key={scenario.id}
                                            variant="outline"
                                            className="w-full justify-start text-left"
                                            onClick={() => runScenario(scenario)}
                                        >
                                            <Play className="mr-2 h-4 w-4 shrink-0" />
                                            <div className="truncate">
                                                <span className="font-medium">{scenario.name}</span>
                                            </div>
                                        </Button>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Middle Panel - Parameters */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        {selectedMethod ? `${activeModule}.${selectedMethod}()` : 'Select a Method'}
                                    </CardTitle>
                                    {currentMethod && (
                                        <CardDescription>{currentMethod.description}</CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {currentMethod ? (
                                        <>
                                            {currentMethod.params.length > 0 ? (
                                                currentMethod.params.map((param) => (
                                                    <div key={param.name} className="space-y-2">
                                                        <Label htmlFor={param.name}>
                                                            {param.name}
                                                            <span className="ml-2 text-xs text-muted-foreground">
                                                                ({param.type})
                                                            </span>
                                                        </Label>
                                                        <Input
                                                            id={param.name}
                                                            placeholder={param.description}
                                                            value={params[param.name] || ''}
                                                            onChange={(e) =>
                                                                setParams({ ...params, [param.name]: e.target.value })
                                                            }
                                                        />
                                                        {param.type === 'address' && address && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-xs"
                                                                onClick={() =>
                                                                    setParams({ ...params, [param.name]: address })
                                                                }
                                                            >
                                                                Use connected wallet
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    This method takes no parameters.
                                                </p>
                                            )}

                                            <div className="pt-4">
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    Returns: <code className="bg-muted px-1 rounded">{currentMethod.returns}</code>
                                                </p>
                                                <Button
                                                    className="w-full"
                                                    onClick={executeMethod}
                                                    disabled={isExecuting || !isInitialized}
                                                >
                                                    {isExecuting ? (
                                                        <>
                                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                            Executing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play className="mr-2 h-4 w-4" />
                                                            Execute
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Terminal className="mx-auto h-12 w-12 mb-2 opacity-50" />
                                            <p>Select a method from the left panel to get started</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Code Preview */}
                            {currentMethod && (
                                <CodeSnippet
                                    title="Generated Code"
                                    code={generateCodeSnippet(activeModule, selectedMethod, params)}
                                    collapsible={false}
                                />
                            )}
                        </div>

                        {/* Right Panel - Results */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">Result</CardTitle>
                                        {executionTime !== null && (
                                            <Badge variant="outline" className="text-xs">
                                                {executionTime}ms
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {error ? (
                                        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
                                            <div className="flex items-center gap-2 text-red-500 mb-2">
                                                <XCircle className="h-5 w-5" />
                                                <span className="font-medium">Error</span>
                                            </div>
                                            <p className="text-sm text-red-400">{error}</p>
                                            <div className="mt-3 text-xs text-muted-foreground">
                                                <p className="font-medium mb-1">Possible fixes:</p>
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li>Check that all parameters are valid</li>
                                                    <li>Ensure addresses are properly formatted (0x...)</li>
                                                    <li>Verify you have the required permissions</li>
                                                    <li>Check network connectivity</li>
                                                </ul>
                                            </div>
                                        </div>
                                    ) : result ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-green-500 mb-2">
                                                <CheckCircle2 className="h-5 w-5" />
                                                <span className="font-medium">Success</span>
                                            </div>
                                            <div className="relative">
                                                <pre className="rounded-lg bg-muted p-4 text-sm overflow-auto max-h-[400px]">
                                                    <code>{result}</code>
                                                </pre>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute top-2 right-2"
                                                    onClick={copyResult}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Code2 className="mx-auto h-12 w-12 mb-2 opacity-50" />
                                            <p>Execute a method to see results</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Contract Addresses */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Contract Addresses</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">RWA Token</span>
                                        <code className="text-xs bg-muted px-1 rounded truncate max-w-[180px]">
                                            {contractAddresses.rwaToken}
                                        </code>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">KYC Registry</span>
                                        <code className="text-xs bg-muted px-1 rounded truncate max-w-[180px]">
                                            {contractAddresses.kycRegistry}
                                        </code>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Yield Distributor</span>
                                        <code className="text-xs bg-muted px-1 rounded truncate max-w-[180px]">
                                            {contractAddresses.yieldDistributor}
                                        </code>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// Helper function to generate code snippet
function generateCodeSnippet(module: string, method: string, params: Record<string, string>): string {
    const paramValues = Object.entries(params)
        .filter(([_, v]) => v)
        .map(([k, v]) => `  ${k}: "${v}"`)
        .join(',\n');

    const paramsStr = paramValues ? `\n${paramValues}\n` : '';

    switch (module) {
        case 'token':
            if (method === 'getInfo') {
                return `const token = client.token.connect(tokenAddress);
const info = await token.getInfo();

console.log('Name:', info.name);
console.log('Symbol:', info.symbol);
console.log('Total Supply:', info.totalSupply);`;
            }
            if (method === 'balanceOf') {
                return `const token = client.token.connect(tokenAddress);
const balance = await token.balanceOf("${params.account || '0x...'}");

console.log('Balance:', balance.toString());`;
            }
            if (method === 'isTransferAllowed') {
                return `const token = client.token.connect(tokenAddress);
const { allowed, reason } = await token.isTransferAllowed(
  "${params.from || '0x...'}",
  "${params.to || '0x...'}",
  "${params.amount || '0'}"
);

console.log('Allowed:', allowed);
console.log('Reason:', reason);`;
            }
            break;

        case 'kyc':
            if (method === 'isVerified') {
                return `const registry = client.kyc.connect(registryAddress);
const isVerified = await registry.isVerified("${params.investor || '0x...'}");

console.log('Is Verified:', isVerified);`;
            }
            if (method === 'getInvestorInfo') {
                return `const registry = client.kyc.connect(registryAddress);
const info = await registry.getInvestorInfo("${params.investor || '0x...'}");

console.log('Verified:', info.verified);
console.log('Tier:', info.tier);
console.log('Expiry:', info.expiry);`;
            }
            if (method === 'isAccredited') {
                return `const registry = client.kyc.connect(registryAddress);
const isAccredited = await registry.isAccredited("${params.investor || '0x...'}");

console.log('Is Accredited:', isAccredited);`;
            }
            break;

        case 'yield':
            if (method === 'getDistributionHistory') {
                return `const distributor = client.yield.connect(distributorAddress);
const distributions = await distributor.getDistributionHistory();

distributions.forEach(d => {
  console.log(\`Distribution #\${d.id}: \${d.totalAmount}\`);
});`;
            }
            if (method === 'getPendingClaims') {
                return `const distributor = client.yield.connect(distributorAddress);
const claims = await distributor.getPendingClaims("${params.account || '0x...'}");

claims.forEach(c => {
  console.log(\`Claim #\${c.distributionId}: \${c.amount}\`);
});`;
            }
            if (method === 'previewDistribution') {
                return `const preview = await client.yield.previewDistribution(
  tokenAddress,
  "${params.totalAmount || '0'}"
);

console.log('Total Holders:', preview.totalHolders);
console.log('Total Supply:', preview.totalSupplyAtSnapshot);`;
            }
            break;

        case 'compliance':
            if (method === 'checkTransferEligibility') {
                return `const result = await client.compliance.checkTransferEligibility(
  tokenAddress,
  "${params.from || '0x...'}",
  "${params.to || '0x...'}",
  "${params.amount || '0'}"
);

console.log('Eligible:', result.eligible);
console.log('Reason:', result.reason);

result.checks.forEach(check => {
  console.log(\`\${check.name}: \${check.passed ? '✓' : '✗'}\`);
});`;
            }
            if (method === 'generateReport') {
                return `const report = await client.compliance.generateComplianceReport(tokenAddress);

console.log('Generated:', report.generatedAt);
console.log('Total Holders:', report.totalHolders);
console.log('Compliance Score:', report.complianceScore);`;
            }
            break;
    }

    return `// Select a method to see the code`;
}
