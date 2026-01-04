'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WalletConnect } from '@/components/wallet-connect';
import { contractAddresses, propertyDetails } from '@/config/wagmi';
import { useRWAClient } from '@/hooks/use-rwa-client';
import { useToken } from '@/hooks/use-token';
import { useKYC, AccreditationTier } from '@/hooks/use-kyc';
import { useYield } from '@/hooks/use-yield';
import { useCompliance } from '@/hooks/use-compliance';
import { useEvents } from '@/hooks/use-events';
import { CodeSnippet } from '@/components/sdk/code-snippet';
import { TransactionStatus } from '@/components/sdk/transaction-status';
import { ComplianceCheckResult } from '@/components/sdk/compliance-check-result';
import { EventFeed } from '@/components/sdk/event-feed';
import { formatAmount } from '@mantle-rwa/sdk';
import { toast } from 'sonner';
import {
    Building2,
    Users,
    Coins,
    TrendingUp,
    Shield,
    ArrowLeft,
    Code2,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    Pause,
    Play,
    FileText,
    Download,
    UserPlus,
    Calculator,
} from 'lucide-react';
import Link from 'next/link';

const TIER_LABELS: Record<AccreditationTier, string> = {
    [AccreditationTier.None]: 'None',
    [AccreditationTier.Retail]: 'Retail',
    [AccreditationTier.Accredited]: 'Accredited',
    [AccreditationTier.Institutional]: 'Institutional',
};

export default function AdminDashboardPage() {
    const { address, isConnected } = useAccount();
    const { isInitialized, networkInfo } = useRWAClient();

    // SDK Hooks
    const {
        tokenInfo,
        balance,
        isLoading: tokenLoading,
        mint,
        pause,
        unpause,
        isPending: tokenPending,
        refetch: refetchToken,
    } = useToken(contractAddresses.rwaToken);

    const {
        addInvestor,
        batchAddInvestors,
        removeInvestor,
        checkIsVerified,
        getInvestorInfo,
        isPending: kycPending,
    } = useKYC(contractAddresses.kycRegistry);

    const {
        distributions,
        createDistribution,
        previewDistribution,
        isLoading: yieldLoading,
        isPending: yieldPending,
        refetch: refetchYield,
    } = useYield(contractAddresses.yieldDistributor, contractAddresses.rwaToken);

    const {
        checkTransferEligibility,
        generateReport,
        exportReport,
        lastReport,
        lastEligibilityCheck,
        isLoading: complianceLoading,
    } = useCompliance(contractAddresses.rwaToken);

    const { events, subscribe, unsubscribe, isSubscribed, clearEvents } = useEvents({
        tokenAddress: contractAddresses.rwaToken,
        kycRegistryAddress: contractAddresses.kycRegistry,
        yieldDistributorAddress: contractAddresses.yieldDistributor,
    });

    // Local state
    const [activeTab, setActiveTab] = useState('overview');
    const [lastTxHash, setLastTxHash] = useState<string | null>(null);
    const [lastTxStatus, setLastTxStatus] = useState<'pending' | 'success' | 'failed' | null>(null);

    // Mint form state
    const [mintRecipient, setMintRecipient] = useState('');
    const [mintAmount, setMintAmount] = useState('');

    // KYC form state
    const [kycAddress, setKycAddress] = useState('');
    const [kycTier, setKycTier] = useState<AccreditationTier>(AccreditationTier.Retail);
    const [kycExpiry, setKycExpiry] = useState('');
    const [kycIdentityHash, setKycIdentityHash] = useState('');
    const [lookupAddress, setLookupAddress] = useState('');
    const [lookupResult, setLookupResult] = useState<{ verified: boolean; tier: AccreditationTier; expiry: Date } | null>(null);

    // Yield form state
    const [yieldAmount, setYieldAmount] = useState('');
    const [yieldPaymentToken, setYieldPaymentToken] = useState(contractAddresses.mockUsdc || '');
    const [yieldClaimWindow, setYieldClaimWindow] = useState('30');
    const [previewResult, setPreviewResult] = useState<{ totalHolders: number; totalSupply: string } | null>(null);

    // Compliance form state
    const [complianceFrom, setComplianceFrom] = useState('');
    const [complianceTo, setComplianceTo] = useState('');
    const [complianceAmount, setComplianceAmount] = useState('');

    // Start event subscription on mount
    useEffect(() => {
        if (isInitialized && !isSubscribed) {
            subscribe();
        }
        return () => {
            if (isSubscribed) {
                unsubscribe();
            }
        };
    }, [isInitialized, isSubscribed, subscribe, unsubscribe]);

    // Handle mint
    const handleMint = useCallback(async () => {
        if (!mintRecipient || !mintAmount) {
            toast.error('Please enter recipient and amount');
            return;
        }

        setLastTxStatus('pending');
        try {
            // First check eligibility
            const eligibility = await checkTransferEligibility(
                '0x0000000000000000000000000000000000000000', // from zero address for minting
                mintRecipient,
                mintAmount
            );

            if (!eligibility.eligible) {
                toast.error(`Mint not allowed: ${eligibility.reason}`);
                setLastTxStatus('failed');
                return;
            }

            const result = await mint(mintRecipient, mintAmount);
            setLastTxHash(result.hash);
            setLastTxStatus('success');
            setMintRecipient('');
            setMintAmount('');
            toast.success('Tokens minted successfully!');
        } catch (error) {
            setLastTxStatus('failed');
            toast.error(error instanceof Error ? error.message : 'Mint failed');
        }
    }, [mintRecipient, mintAmount, mint, checkTransferEligibility]);

    // Handle pause/unpause
    const handlePauseToggle = useCallback(async () => {
        setLastTxStatus('pending');
        try {
            const result = tokenInfo?.paused ? await unpause() : await pause();
            setLastTxHash(result.hash);
            setLastTxStatus('success');
            toast.success(tokenInfo?.paused ? 'Token unpaused!' : 'Token paused!');
        } catch (error) {
            setLastTxStatus('failed');
            toast.error(error instanceof Error ? error.message : 'Operation failed');
        }
    }, [tokenInfo?.paused, pause, unpause]);

    // Handle add investor
    const handleAddInvestor = useCallback(async () => {
        if (!kycAddress || !kycExpiry || !kycIdentityHash) {
            toast.error('Please fill all KYC fields');
            return;
        }

        setLastTxStatus('pending');
        try {
            const result = await addInvestor(
                kycAddress,
                kycTier,
                new Date(kycExpiry),
                kycIdentityHash
            );
            setLastTxHash(result.hash);
            setLastTxStatus('success');
            setKycAddress('');
            setKycExpiry('');
            setKycIdentityHash('');
            toast.success('Investor added successfully!');
        } catch (error) {
            setLastTxStatus('failed');
            toast.error(error instanceof Error ? error.message : 'Add investor failed');
        }
    }, [kycAddress, kycTier, kycExpiry, kycIdentityHash, addInvestor]);

    // Handle lookup investor
    const handleLookupInvestor = useCallback(async () => {
        if (!lookupAddress) {
            toast.error('Please enter an address to lookup');
            return;
        }

        try {
            const info = await getInvestorInfo(lookupAddress);
            setLookupResult({
                verified: info.verified,
                tier: info.tier,
                expiry: info.expiry,
            });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Lookup failed');
            setLookupResult(null);
        }
    }, [lookupAddress, getInvestorInfo]);

    // Handle preview distribution
    const handlePreviewDistribution = useCallback(async () => {
        if (!yieldAmount) {
            toast.error('Please enter distribution amount');
            return;
        }

        try {
            const preview = await previewDistribution(yieldAmount);
            setPreviewResult({
                totalHolders: preview.totalHolders,
                totalSupply: formatAmount(preview.totalSupplyAtSnapshot),
            });
            toast.success('Preview calculated!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Preview failed');
        }
    }, [yieldAmount, previewDistribution]);

    // Handle create distribution
    const handleCreateDistribution = useCallback(async () => {
        if (!yieldAmount || !yieldPaymentToken) {
            toast.error('Please enter amount and payment token');
            return;
        }

        setLastTxStatus('pending');
        try {
            const { result, distributionId } = await createDistribution(
                yieldPaymentToken,
                yieldAmount,
                parseInt(yieldClaimWindow)
            );
            setLastTxHash(result.hash);
            setLastTxStatus('success');
            setYieldAmount('');
            toast.success(`Distribution #${distributionId} created!`);
        } catch (error) {
            setLastTxStatus('failed');
            toast.error(error instanceof Error ? error.message : 'Distribution failed');
        }
    }, [yieldAmount, yieldPaymentToken, yieldClaimWindow, createDistribution]);

    // Handle compliance check
    const handleComplianceCheck = useCallback(async () => {
        if (!complianceFrom || !complianceTo || !complianceAmount) {
            toast.error('Please fill all compliance check fields');
            return;
        }

        try {
            await checkTransferEligibility(complianceFrom, complianceTo, complianceAmount);
            toast.success('Compliance check complete!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Check failed');
        }
    }, [complianceFrom, complianceTo, complianceAmount, checkTransferEligibility]);

    // Handle generate report
    const handleGenerateReport = useCallback(async () => {
        try {
            await generateReport();
            toast.success('Report generated!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Report generation failed');
        }
    }, [generateReport]);

    // Handle export report
    const handleExportReport = useCallback(async (format: 'json' | 'csv') => {
        if (!lastReport) {
            toast.error('Generate a report first');
            return;
        }

        try {
            const blob = await exportReport(lastReport, format);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `compliance-report.${format}`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`Report exported as ${format.toUpperCase()}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Export failed');
        }
    }, [lastReport, exportReport]);

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-background">
                <header className="border-b">
                    <div className="container flex h-16 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/property" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Link>
                            <div className="flex items-center gap-2">
                                <Building2 className="h-6 w-6 text-primary" />
                                <span className="text-xl font-bold">Admin Dashboard</span>
                            </div>
                        </div>
                        <WalletConnect />
                    </div>
                </header>
                <main className="container py-8">
                    <Card className="mx-auto max-w-md">
                        <CardHeader className="text-center">
                            <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                            <CardTitle>Admin Access Required</CardTitle>
                            <CardDescription>
                                Connect your wallet to access the admin dashboard.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-center">
                                <WalletConnect />
                            </div>
                            <CodeSnippet
                                title="SDK: Admin Role Check"
                                code={`// Check if wallet has admin role
const token = client.token.connect(tokenAddress);
const hasRole = await token.hasRole(ADMIN_ROLE, walletAddress);

// Admin operations require specific roles:
// - ISSUER_ROLE: mint tokens
// - COMPLIANCE_OFFICER_ROLE: pause/unpause
// - KYC_ADMIN_ROLE: manage KYC registry`}
                                collapsible={true}
                                defaultExpanded={false}
                            />
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

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
                            <Building2 className="h-6 w-6 text-primary" />
                            <span className="text-xl font-bold">Admin Dashboard</span>
                        </div>
                        <Badge variant="outline" className="ml-2">
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                        </Badge>
                        {networkInfo && (
                            <Badge variant="secondary" className="text-xs">
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
                {/* Analytics Overview */}
                <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Supply</CardTitle>
                            <Coins className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {tokenLoading ? (
                                <Skeleton className="h-8 w-24" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">
                                        {tokenInfo ? formatAmount(tokenInfo.totalSupply) : '0'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {tokenInfo?.symbol || propertyDetails.tokenSymbol} tokens
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Token Status</CardTitle>
                            {tokenInfo?.paused ? (
                                <Pause className="h-4 w-4 text-yellow-500" />
                            ) : (
                                <Play className="h-4 w-4 text-green-500" />
                            )}
                        </CardHeader>
                        <CardContent>
                            {tokenLoading ? (
                                <Skeleton className="h-8 w-24" />
                            ) : (
                                <>
                                    <div className={`text-2xl font-bold ${tokenInfo?.paused ? 'text-yellow-500' : 'text-green-500'}`}>
                                        {tokenInfo?.paused ? 'Paused' : 'Active'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Transfers {tokenInfo?.paused ? 'disabled' : 'enabled'}
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Distributions</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {yieldLoading ? (
                                <Skeleton className="h-8 w-24" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{distributions.length}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Total yield distributions
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Live Events</CardTitle>
                            <Badge variant={isSubscribed ? 'default' : 'secondary'} className="text-xs">
                                {isSubscribed ? 'Listening' : 'Stopped'}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{events.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Events captured
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4 grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="mint">Mint</TabsTrigger>
                        <TabsTrigger value="kyc">KYC</TabsTrigger>
                        <TabsTrigger value="yield">Yield</TabsTrigger>
                        <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Token Overview</CardTitle>
                                        <Badge variant="outline" className="gap-1">
                                            <Code2 className="h-3 w-3" />
                                            useToken
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Name</span>
                                        <span className="font-medium">{tokenInfo?.name || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Symbol</span>
                                        <span className="font-medium">{tokenInfo?.symbol || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Decimals</span>
                                        <span className="font-medium">{tokenInfo?.decimals || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Supply</span>
                                        <span className="font-medium">
                                            {tokenInfo ? formatAmount(tokenInfo.totalSupply) : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Status</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={tokenInfo?.paused ? 'destructive' : 'default'}>
                                                {tokenInfo?.paused ? 'Paused' : 'Active'}
                                            </Badge>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handlePauseToggle}
                                                disabled={tokenPending}
                                            >
                                                {tokenPending ? (
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                ) : tokenInfo?.paused ? (
                                                    <Play className="h-4 w-4" />
                                                ) : (
                                                    <Pause className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => refetchToken()}
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Refresh Data
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Live Events</CardTitle>
                                        <Badge variant="outline" className="gap-1">
                                            <Code2 className="h-3 w-3" />
                                            useEvents
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <EventFeed
                                        events={events.slice(0, 5)}
                                        explorerUrl={networkInfo?.explorerUrl}
                                        onClear={clearEvents}
                                        maxHeight={200}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        <CodeSnippet
                            title="SDK Code: Token Overview"
                            code={`// Get token information
const token = client.token.connect(tokenAddress);
const info = await token.getInfo();

console.log('Name:', info.name);
console.log('Symbol:', info.symbol);
console.log('Total Supply:', info.totalSupply);
console.log('Paused:', info.paused);

// Pause/Unpause token (requires COMPLIANCE_OFFICER_ROLE)
await token.pause();
await token.unpause();`}
                            collapsible={true}
                            defaultExpanded={false}
                        />
                    </TabsContent>

                    {/* Mint Tab */}
                    <TabsContent value="mint" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Coins className="h-5 w-5" />
                                            Mint Tokens
                                        </CardTitle>
                                        <CardDescription>
                                            Mint new tokens to verified investors (requires ISSUER_ROLE)
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className="gap-1">
                                        <Code2 className="h-3 w-3" />
                                        useToken.mint
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="mintRecipient">Recipient Address</Label>
                                        <Input
                                            id="mintRecipient"
                                            placeholder="0x..."
                                            value={mintRecipient}
                                            onChange={(e) => setMintRecipient(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mintAmount">Amount</Label>
                                        <Input
                                            id="mintAmount"
                                            type="number"
                                            placeholder="1000"
                                            value={mintAmount}
                                            onChange={(e) => setMintAmount(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Button
                                    className="w-full"
                                    onClick={handleMint}
                                    disabled={tokenPending || !mintRecipient || !mintAmount}
                                >
                                    {tokenPending ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Minting...
                                        </>
                                    ) : (
                                        <>
                                            <Coins className="mr-2 h-4 w-4" />
                                            Mint Tokens
                                        </>
                                    )}
                                </Button>

                                {lastEligibilityCheck && activeTab === 'mint' && (
                                    <ComplianceCheckResult
                                        result={lastEligibilityCheck}
                                        from="0x0000000000000000000000000000000000000000"
                                        to={mintRecipient}
                                        amount={mintAmount}
                                    />
                                )}

                                {lastTxStatus && lastTxHash && (
                                    <TransactionStatus
                                        status={lastTxStatus}
                                        hash={lastTxHash}
                                        explorerUrl={networkInfo?.explorerUrl}
                                    />
                                )}
                            </CardContent>
                        </Card>

                        <CodeSnippet
                            title="SDK Code: Minting Tokens"
                            code={`// Check recipient eligibility first
const eligibility = await client.compliance.checkTransferEligibility(
  tokenAddress,
  ethers.ZeroAddress, // from zero address for minting
  recipientAddress,
  amount
);

if (!eligibility.eligible) {
  console.error('Mint not allowed:', eligibility.reason);
  return;
}

// Mint tokens (requires ISSUER_ROLE)
const token = client.token.connect(tokenAddress);
const result = await token.mint(recipientAddress, amount);

console.log('Transaction hash:', result.hash);
console.log('Gas used:', result.gasUsed);`}
                            collapsible={true}
                            defaultExpanded={false}
                        />
                    </TabsContent>

                    {/* KYC Tab */}
                    <TabsContent value="kyc" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <UserPlus className="h-5 w-5" />
                                                Add Investor
                                            </CardTitle>
                                            <CardDescription>
                                                Register a new investor in the KYC registry
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="gap-1">
                                            <Code2 className="h-3 w-3" />
                                            useKYC.addInvestor
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="kycAddress">Investor Address</Label>
                                        <Input
                                            id="kycAddress"
                                            placeholder="0x..."
                                            value={kycAddress}
                                            onChange={(e) => setKycAddress(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="kycTier">Accreditation Tier</Label>
                                        <Select
                                            value={kycTier.toString()}
                                            onValueChange={(v) => setKycTier(parseInt(v) as AccreditationTier)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Retail</SelectItem>
                                                <SelectItem value="2">Accredited</SelectItem>
                                                <SelectItem value="3">Institutional</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="kycExpiry">Expiry Date</Label>
                                        <Input
                                            id="kycExpiry"
                                            type="date"
                                            value={kycExpiry}
                                            onChange={(e) => setKycExpiry(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="kycIdentityHash">Identity Hash</Label>
                                        <Input
                                            id="kycIdentityHash"
                                            placeholder="0x..."
                                            value={kycIdentityHash}
                                            onChange={(e) => setKycIdentityHash(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={handleAddInvestor}
                                        disabled={kycPending}
                                    >
                                        {kycPending ? (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                Add Investor
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Users className="h-5 w-5" />
                                                Lookup Investor
                                            </CardTitle>
                                            <CardDescription>
                                                Check KYC status of any address
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="gap-1">
                                            <Code2 className="h-3 w-3" />
                                            useKYC.getInvestorInfo
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="lookupAddress">Address to Lookup</Label>
                                        <Input
                                            id="lookupAddress"
                                            placeholder="0x..."
                                            value={lookupAddress}
                                            onChange={(e) => setLookupAddress(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={handleLookupInvestor}
                                    >
                                        <Users className="mr-2 h-4 w-4" />
                                        Lookup
                                    </Button>

                                    {lookupResult && (
                                        <div className="rounded-lg border p-4 space-y-2">
                                            <div className="flex items-center gap-2">
                                                {lookupResult.verified ? (
                                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                                )}
                                                <span className="font-medium">
                                                    {lookupResult.verified ? 'Verified' : 'Not Verified'}
                                                </span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                <p>Tier: {TIER_LABELS[lookupResult.tier]}</p>
                                                <p>Expires: {lookupResult.expiry.toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {lastTxStatus && lastTxHash && activeTab === 'kyc' && (
                            <TransactionStatus
                                status={lastTxStatus}
                                hash={lastTxHash}
                                explorerUrl={networkInfo?.explorerUrl}
                            />
                        )}

                        <CodeSnippet
                            title="SDK Code: KYC Management"
                            code={`// Add investor to KYC registry
const registry = client.kyc.connect(registryAddress);
const result = await registry.addInvestor(
  investorAddress,
  AccreditationTier.Accredited,
  new Date('2026-12-31'),
  identityHash
);

// Check investor status
const isVerified = await registry.isVerified(investorAddress);
const info = await registry.getInvestorInfo(investorAddress);

console.log('Verified:', info.verified);
console.log('Tier:', info.tier);
console.log('Expiry:', info.expiry);

// Batch add multiple investors
await registry.batchAddInvestors([
  { address: addr1, tier: AccreditationTier.Retail, expiryDate, identityHash: hash1 },
  { address: addr2, tier: AccreditationTier.Accredited, expiryDate, identityHash: hash2 },
]);`}
                            collapsible={true}
                            defaultExpanded={false}
                        />
                    </TabsContent>

                    {/* Yield Tab */}
                    <TabsContent value="yield" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Calculator className="h-5 w-5" />
                                                Preview Distribution
                                            </CardTitle>
                                            <CardDescription>
                                                Calculate per-holder amounts before distributing
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="gap-1">
                                            <Code2 className="h-3 w-3" />
                                            useYield.previewDistribution
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="previewAmount">Total Amount</Label>
                                        <Input
                                            id="previewAmount"
                                            type="number"
                                            placeholder="10000"
                                            value={yieldAmount}
                                            onChange={(e) => setYieldAmount(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={handlePreviewDistribution}
                                    >
                                        <Calculator className="mr-2 h-4 w-4" />
                                        Preview
                                    </Button>

                                    {previewResult && (
                                        <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
                                            <p className="text-sm">
                                                <span className="text-muted-foreground">Total Holders:</span>{' '}
                                                <span className="font-medium">{previewResult.totalHolders}</span>
                                            </p>
                                            <p className="text-sm">
                                                <span className="text-muted-foreground">Total Supply:</span>{' '}
                                                <span className="font-medium">{previewResult.totalSupply}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Each holder receives proportional to their balance
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5" />
                                                Create Distribution
                                            </CardTitle>
                                            <CardDescription>
                                                Distribute yield to all token holders
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="gap-1">
                                            <Code2 className="h-3 w-3" />
                                            useYield.createDistribution
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="yieldPaymentToken">Payment Token</Label>
                                        <Input
                                            id="yieldPaymentToken"
                                            placeholder="0x... (USDC address)"
                                            value={yieldPaymentToken}
                                            onChange={(e) => setYieldPaymentToken(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="yieldAmount">Amount</Label>
                                        <Input
                                            id="yieldAmount"
                                            type="number"
                                            placeholder="10000"
                                            value={yieldAmount}
                                            onChange={(e) => setYieldAmount(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="yieldClaimWindow">Claim Window (days)</Label>
                                        <Input
                                            id="yieldClaimWindow"
                                            type="number"
                                            placeholder="30"
                                            value={yieldClaimWindow}
                                            onChange={(e) => setYieldClaimWindow(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={handleCreateDistribution}
                                        disabled={yieldPending}
                                    >
                                        {yieldPending ? (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <TrendingUp className="mr-2 h-4 w-4" />
                                                Create Distribution
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Distribution History */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Distribution History</CardTitle>
                                    <Button variant="outline" size="sm" onClick={() => refetchYield()}>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Refresh
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {yieldLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                    </div>
                                ) : distributions.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">
                                        No distributions yet
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {distributions.map((dist) => (
                                            <div
                                                key={dist.id}
                                                className="flex items-center justify-between p-3 rounded-lg border"
                                            >
                                                <div>
                                                    <p className="font-medium">Distribution #{dist.id}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Amount: {formatAmount(dist.totalAmount)} •
                                                        Deadline: {dist.claimDeadline.toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Badge variant="outline">
                                                    {formatAmount(dist.claimedAmount)} claimed
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {lastTxStatus && lastTxHash && activeTab === 'yield' && (
                            <TransactionStatus
                                status={lastTxStatus}
                                hash={lastTxHash}
                                explorerUrl={networkInfo?.explorerUrl}
                            />
                        )}

                        <CodeSnippet
                            title="SDK Code: Yield Distribution"
                            code={`// Preview distribution (calculate per-holder amounts)
const preview = await client.yield.previewDistribution(
  tokenAddress,
  "10000", // total amount
  undefined, // snapshotId (optional)
  holderAddresses // optional array of addresses
);

console.log('Total holders:', preview.totalHolders);
console.log('Total supply:', preview.totalSupplyAtSnapshot);

// Create distribution
const distributor = client.yield.connect(distributorAddress);
const { result, distributionId } = await distributor.createDistribution(
  paymentTokenAddress, // e.g., USDC
  "10000", // total amount
  30 // claim window in days
);

console.log('Distribution ID:', distributionId);
console.log('Transaction hash:', result.hash);`}
                            collapsible={true}
                            defaultExpanded={false}
                        />
                    </TabsContent>

                    {/* Compliance Tab */}
                    <TabsContent value="compliance" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Shield className="h-5 w-5" />
                                                Transfer Eligibility Check
                                            </CardTitle>
                                            <CardDescription>
                                                Verify if a transfer would be allowed
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="gap-1">
                                            <Code2 className="h-3 w-3" />
                                            useCompliance.checkTransferEligibility
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="complianceFrom">From Address</Label>
                                        <Input
                                            id="complianceFrom"
                                            placeholder="0x..."
                                            value={complianceFrom}
                                            onChange={(e) => setComplianceFrom(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="complianceTo">To Address</Label>
                                        <Input
                                            id="complianceTo"
                                            placeholder="0x..."
                                            value={complianceTo}
                                            onChange={(e) => setComplianceTo(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="complianceAmount">Amount</Label>
                                        <Input
                                            id="complianceAmount"
                                            type="number"
                                            placeholder="100"
                                            value={complianceAmount}
                                            onChange={(e) => setComplianceAmount(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={handleComplianceCheck}
                                        disabled={complianceLoading}
                                    >
                                        {complianceLoading ? (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                Checking...
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="mr-2 h-4 w-4" />
                                                Check Eligibility
                                            </>
                                        )}
                                    </Button>

                                    {lastEligibilityCheck && activeTab === 'compliance' && (
                                        <ComplianceCheckResult
                                            result={lastEligibilityCheck}
                                            from={complianceFrom}
                                            to={complianceTo}
                                            amount={complianceAmount}
                                        />
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <FileText className="h-5 w-5" />
                                                Compliance Report
                                            </CardTitle>
                                            <CardDescription>
                                                Generate and export compliance reports
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="gap-1">
                                            <Code2 className="h-3 w-3" />
                                            useCompliance.generateReport
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={handleGenerateReport}
                                        disabled={complianceLoading}
                                    >
                                        {complianceLoading ? (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="mr-2 h-4 w-4" />
                                                Generate Report
                                            </>
                                        )}
                                    </Button>

                                    {lastReport && (
                                        <div className="rounded-lg border p-4 space-y-3 bg-muted/50">
                                            <p className="text-sm font-medium">Report Generated</p>
                                            <div className="text-sm space-y-1">
                                                <p>
                                                    <span className="text-muted-foreground">Generated:</span>{' '}
                                                    {lastReport.generatedAt.toLocaleString()}
                                                </p>
                                                <p>
                                                    <span className="text-muted-foreground">Total Holders:</span>{' '}
                                                    {lastReport.totalHolders}
                                                </p>
                                                <p>
                                                    <span className="text-muted-foreground">Verified:</span>{' '}
                                                    {lastReport.verifiedHolders}
                                                </p>
                                                <p>
                                                    <span className="text-muted-foreground">Compliance Score:</span>{' '}
                                                    <span className="text-green-600 font-medium">
                                                        {lastReport.complianceScore}%
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleExportReport('json')}
                                                >
                                                    <Download className="mr-2 h-4 w-4" />
                                                    JSON
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleExportReport('csv')}
                                                >
                                                    <Download className="mr-2 h-4 w-4" />
                                                    CSV
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <CodeSnippet
                            title="SDK Code: Compliance Operations"
                            code={`// Check transfer eligibility
const result = await client.compliance.checkTransferEligibility(
  tokenAddress,
  fromAddress,
  toAddress,
  "100" // amount
);

console.log('Eligible:', result.eligible);
console.log('Reason:', result.reason);

// Each check includes:
result.checks.forEach(check => {
  console.log(\`\${check.name}: \${check.passed ? '✓' : '✗'}\`);
  console.log(\`  Details: \${check.details}\`);
});

// Generate compliance report
const report = await client.compliance.generateComplianceReport(tokenAddress);

// Export report
const jsonBlob = await client.compliance.exportReport(report, 'json');
const csvBlob = await client.compliance.exportReport(report, 'csv');`}
                            collapsible={true}
                            defaultExpanded={false}
                        />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
