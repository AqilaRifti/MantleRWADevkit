'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { WalletConnect } from '@/components/wallet-connect';
import { contractAddresses, propertyDetails } from '@/config/wagmi';
import { useRWAClient } from '@/hooks/use-rwa-client';
import { useToken } from '@/hooks/use-token';
import { useKYC, AccreditationTier } from '@/hooks/use-kyc';
import { useYield } from '@/hooks/use-yield';
import { useCompliance } from '@/hooks/use-compliance';
import { CodeSnippet } from '@/components/sdk/code-snippet';
import { TransactionStatus } from '@/components/sdk/transaction-status';
import { ComplianceCheckResult } from '@/components/sdk/compliance-check-result';
import { EventFeed } from '@/components/sdk/event-feed';
import { useEvents } from '@/hooks/use-events';
import { formatAmount } from '@mantle-rwa/sdk';
import { toast } from 'sonner';
import {
    Building2,
    Coins,
    Clock,
    ArrowLeft,
    Wallet,
    Shield,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Code2,
    AlertTriangle,
    RefreshCw,
    HandCoins,
    FileCheck,
} from 'lucide-react';
import Link from 'next/link';

const TIER_LABELS: Record<AccreditationTier, string> = {
    [AccreditationTier.None]: 'None',
    [AccreditationTier.Retail]: 'Retail',
    [AccreditationTier.Accredited]: 'Accredited',
    [AccreditationTier.Institutional]: 'Institutional',
};

export default function InvestorPortalPage() {
    const { address, isConnected } = useAccount();
    const { isInitialized, networkInfo, hasSigner } = useRWAClient();

    // SDK Hooks
    const { tokenInfo, balance, isLoading: tokenLoading, transfer, isPending: tokenPending } = useToken(contractAddresses.rwaToken);
    const { isVerified, investorInfo, isLoading: kycLoading } = useKYC(contractAddresses.kycRegistry);
    const { distributions, pendingClaims, totalClaimable, claim, isLoading: yieldLoading, isPending: yieldPending } = useYield(
        contractAddresses.yieldDistributor,
        contractAddresses.rwaToken
    );
    const { checkTransferEligibility, lastEligibilityCheck, isLoading: complianceLoading } = useCompliance(contractAddresses.rwaToken);
    const { events, subscribe, unsubscribe, isSubscribed, clearEvents } = useEvents({
        tokenAddress: contractAddresses.rwaToken,
        kycRegistryAddress: contractAddresses.kycRegistry,
        yieldDistributorAddress: contractAddresses.yieldDistributor,
    });

    // Local state
    const [transferTo, setTransferTo] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [lastTxHash, setLastTxHash] = useState<string | null>(null);
    const [lastTxStatus, setLastTxStatus] = useState<'pending' | 'success' | 'failed' | null>(null);

    // Handle transfer
    const handleTransfer = useCallback(async () => {
        if (!transferTo || !transferAmount) {
            toast.error('Please enter recipient and amount');
            return;
        }

        setLastTxStatus('pending');
        try {
            // First check eligibility
            const eligibility = await checkTransferEligibility(address!, transferTo, transferAmount);
            if (!eligibility.eligible) {
                toast.error(`Transfer not allowed: ${eligibility.reason}`);
                setLastTxStatus('failed');
                return;
            }

            const result = await transfer(transferTo, transferAmount);
            setLastTxHash(result.hash);
            setLastTxStatus('success');
            setTransferTo('');
            setTransferAmount('');
            toast.success('Transfer successful!');
        } catch (error) {
            setLastTxStatus('failed');
            toast.error(error instanceof Error ? error.message : 'Transfer failed');
        }
    }, [address, transferTo, transferAmount, transfer, checkTransferEligibility]);

    // Handle yield claim
    const handleClaim = useCallback(async (distributionId: number) => {
        setLastTxStatus('pending');
        try {
            const result = await claim(distributionId);
            setLastTxHash(result.hash);
            setLastTxStatus('success');
            toast.success('Yield claimed successfully!');
        } catch (error) {
            setLastTxStatus('failed');
            toast.error(error instanceof Error ? error.message : 'Claim failed');
        }
    }, [claim]);

    // Calculate portfolio value
    const portfolioValue = balance && tokenInfo
        ? (Number(balance) / Math.pow(10, Number(tokenInfo.decimals))) * propertyDetails.tokenPrice
        : 0;

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
                            <span className="text-xl font-bold">Investor Portal</span>
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
                    /* Not Connected State */
                    <Card className="mx-auto max-w-md">
                        <CardHeader className="text-center">
                            <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
                            <CardTitle>Connect Your Wallet</CardTitle>
                            <CardDescription>
                                Connect your wallet to access the investor portal and manage your investments.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-center">
                                <WalletConnect />
                            </div>
                            <CodeSnippet
                                title="SDK Hook: useRWAClient"
                                code={`// Initialize SDK with wallet
const { client, isInitialized, hasSigner } = useRWAClient();

// Client automatically connects to wallet signer
if (hasSigner) {
  // Can perform write operations
}`}
                                collapsible={true}
                                defaultExpanded={false}
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {/* KYC Status Banner */}
                        <Card className={isVerified ? 'border-green-500/50 bg-green-500/5' : 'border-yellow-500/50 bg-yellow-500/5'}>
                            <CardContent className="flex items-center justify-between py-4">
                                <div className="flex items-center gap-3">
                                    {kycLoading ? (
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                    ) : isVerified ? (
                                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                                    ) : (
                                        <AlertTriangle className="h-10 w-10 text-yellow-500" />
                                    )}
                                    <div>
                                        <p className="font-medium">
                                            {kycLoading ? 'Checking KYC status...' : isVerified ? 'KYC Verified' : 'KYC Required'}
                                        </p>
                                        {investorInfo && isVerified && (
                                            <p className="text-sm text-muted-foreground">
                                                Tier: {TIER_LABELS[investorInfo.tier]} •
                                                Expires: {investorInfo.expiry.toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Badge variant={isVerified ? 'default' : 'secondary'} className="gap-1">
                                    <FileCheck className="h-3 w-3" />
                                    useKYC Hook
                                </Badge>
                            </CardContent>
                        </Card>

                        <Tabs defaultValue="portfolio" className="space-y-4">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                                <TabsTrigger value="yield">Yield</TabsTrigger>
                                <TabsTrigger value="transfer">Transfer</TabsTrigger>
                                <TabsTrigger value="events">Events</TabsTrigger>
                            </TabsList>

                            {/* Portfolio Tab */}
                            <TabsContent value="portfolio" className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardDescription className="flex items-center gap-2">
                                                Token Balance
                                                <Badge variant="outline" className="text-xs">useToken</Badge>
                                            </CardDescription>
                                            {tokenLoading ? (
                                                <Skeleton className="h-9 w-32" />
                                            ) : (
                                                <CardTitle className="text-3xl">
                                                    {balance ? formatAmount(balance) : '0'}
                                                </CardTitle>
                                            )}
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">
                                                {tokenInfo?.symbol || propertyDetails.tokenSymbol} tokens
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardDescription>Portfolio Value</CardDescription>
                                            {tokenLoading ? (
                                                <Skeleton className="h-9 w-32" />
                                            ) : (
                                                <CardTitle className="text-3xl">
                                                    ${portfolioValue.toLocaleString()}
                                                </CardTitle>
                                            )}
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">
                                                @ ${propertyDetails.tokenPrice}/token
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardDescription className="flex items-center gap-2">
                                                Pending Yields
                                                <Badge variant="outline" className="text-xs">useYield</Badge>
                                            </CardDescription>
                                            {yieldLoading ? (
                                                <Skeleton className="h-9 w-32" />
                                            ) : (
                                                <CardTitle className="text-3xl text-green-600">
                                                    {totalClaimable > 0n ? formatAmount(totalClaimable) : '0'}
                                                </CardTitle>
                                            )}
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">
                                                {pendingClaims.length} pending claim(s)
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <CodeSnippet
                                    title="SDK Code: Fetching Portfolio Data"
                                    code={`// Get token balance
const token = client.token.connect(tokenAddress);
const balance = await token.balanceOf(walletAddress);

// Get pending yields
const distributor = client.yield.connect(distributorAddress);
const claims = await distributor.getPendingClaims(walletAddress);

// Calculate total claimable
const total = claims.reduce((sum, c) => sum + c.amount, 0n);`}
                                    collapsible={true}
                                    defaultExpanded={false}
                                />
                            </TabsContent>

                            {/* Yield Tab */}
                            <TabsContent value="yield" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <TrendingUp className="h-5 w-5" />
                                                    Yield Distributions
                                                </CardTitle>
                                                <CardDescription>
                                                    Claim your share of property rental income
                                                </CardDescription>
                                            </div>
                                            <Badge variant="outline" className="gap-1">
                                                <Code2 className="h-3 w-3" />
                                                useYield Hook
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {yieldLoading ? (
                                            <div className="space-y-2">
                                                <Skeleton className="h-20 w-full" />
                                                <Skeleton className="h-20 w-full" />
                                            </div>
                                        ) : pendingClaims.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <HandCoins className="mx-auto h-12 w-12 mb-2 opacity-50" />
                                                <p>No pending yields to claim</p>
                                            </div>
                                        ) : (
                                            pendingClaims.map((claim) => (
                                                <div
                                                    key={claim.distributionId}
                                                    className="flex items-center justify-between p-4 rounded-lg border bg-muted/50"
                                                >
                                                    <div>
                                                        <p className="font-medium">
                                                            Distribution #{claim.distributionId}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Amount: {formatAmount(claim.amount)} •
                                                            Deadline: {claim.deadline.toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        onClick={() => handleClaim(claim.distributionId)}
                                                        disabled={yieldPending}
                                                    >
                                                        {yieldPending ? (
                                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            'Claim'
                                                        )}
                                                    </Button>
                                                </div>
                                            ))
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
                                    title="SDK Code: Claiming Yield"
                                    code={`// Claim yield from a distribution
const distributor = client.yield.connect(distributorAddress);
const result = await distributor.claim(distributionId);

console.log('Transaction hash:', result.hash);
console.log('Gas used:', result.gasUsed);`}
                                    collapsible={true}
                                    defaultExpanded={false}
                                />
                            </TabsContent>

                            {/* Transfer Tab */}
                            <TabsContent value="transfer" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle>Transfer Tokens</CardTitle>
                                                <CardDescription>
                                                    Transfer your tokens to another verified investor
                                                </CardDescription>
                                            </div>
                                            <Badge variant="outline" className="gap-1">
                                                <Code2 className="h-3 w-3" />
                                                useCompliance Hook
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="transferTo">Recipient Address</Label>
                                                <Input
                                                    id="transferTo"
                                                    placeholder="0x..."
                                                    value={transferTo}
                                                    onChange={(e) => setTransferTo(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="transferAmount">Amount</Label>
                                                <Input
                                                    id="transferAmount"
                                                    type="number"
                                                    placeholder="100"
                                                    value={transferAmount}
                                                    onChange={(e) => setTransferAmount(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full"
                                            onClick={handleTransfer}
                                            disabled={tokenPending || !transferTo || !transferAmount}
                                        >
                                            {tokenPending ? (
                                                <>
                                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <Coins className="mr-2 h-4 w-4" />
                                                    Transfer Tokens
                                                </>
                                            )}
                                        </Button>

                                        {lastEligibilityCheck && (
                                            <ComplianceCheckResult
                                                result={lastEligibilityCheck}
                                                from={address}
                                                to={transferTo}
                                                amount={transferAmount}
                                                compact={true}
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
                                    title="SDK Code: Transfer with Compliance Check"
                                    code={`// Check transfer eligibility first
const eligibility = await client.compliance.checkTransferEligibility(
  tokenAddress,
  fromAddress,
  toAddress,
  amount
);

if (eligibility.eligible) {
  // Execute transfer
  const token = client.token.connect(tokenAddress);
  const result = await token.transfer(toAddress, amount);
}`}
                                    collapsible={true}
                                    defaultExpanded={false}
                                />
                            </TabsContent>

                            {/* Events Tab */}
                            <TabsContent value="events" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle>Live Blockchain Events</CardTitle>
                                                <CardDescription>
                                                    Real-time event subscriptions using ethers.js
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="gap-1">
                                                    <Code2 className="h-3 w-3" />
                                                    useEvents Hook
                                                </Badge>
                                                <Button
                                                    variant={isSubscribed ? 'destructive' : 'default'}
                                                    size="sm"
                                                    onClick={isSubscribed ? unsubscribe : subscribe}
                                                >
                                                    {isSubscribed ? 'Stop' : 'Start'} Listening
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <EventFeed
                                            events={events}
                                            explorerUrl={networkInfo?.explorerUrl}
                                            onClear={clearEvents}
                                            maxHeight={300}
                                        />
                                    </CardContent>
                                </Card>

                                <CodeSnippet
                                    title="SDK Code: Event Subscriptions"
                                    code={`// Subscribe to Transfer events
const tokenContract = new ethers.Contract(
  tokenAddress,
  RWA_TOKEN_ABI,
  provider
);

tokenContract.on('Transfer', (from, to, value, event) => {
  console.log(\`Transfer: \${value} from \${from} to \${to}\`);
});

// Don't forget to unsubscribe
tokenContract.off('Transfer', handler);`}
                                    collapsible={true}
                                    defaultExpanded={false}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </main>
        </div>
    );
}
