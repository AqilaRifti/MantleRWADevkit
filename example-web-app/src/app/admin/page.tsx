'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { WalletConnect } from '@/components/wallet-connect';
import { contractAddresses, propertyDetails } from '@/config/wagmi';
import { toast } from 'sonner';
import {
    Building2,
    Users,
    Coins,
    TrendingUp,
    Shield,
    ArrowLeft,
    Calculator
} from 'lucide-react';
import Link from 'next/link';

// Import from @mantle-rwa/react package
import { TokenMintForm, YieldCalculator } from '@mantle-rwa/react';
import type { DistributionConfig, PaymentToken } from '@mantle-rwa/react';

// Mock analytics data
interface Analytics {
    totalHolders: number;
    totalSupply: number;
    totalDistributed: number;
    distributionCount: number;
    complianceRate: number;
    pendingKYC: number;
}

// Supported payment tokens for yield distribution
const SUPPORTED_PAYMENT_TOKENS: PaymentToken[] = [
    { address: contractAddresses.mockUsdc || '0x0000000000000000000000000000000000000001', symbol: 'USDC', decimals: 6 },
    { address: '0x0000000000000000000000000000000000000002', symbol: 'USDT', decimals: 6 },
    { address: '0x0000000000000000000000000000000000000003', symbol: 'MNT', decimals: 18 },
];

export default function AdminDashboardPage() {
    const { address, isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState('overview');

    // Mock analytics
    const [analytics] = useState<Analytics>({
        totalHolders: 47,
        totalSupply: 1000,
        totalDistributed: 12500,
        distributionCount: 3,
        complianceRate: 98.5,
        pendingKYC: 2,
    });

    // Handle mint completion from SDK component
    const handleMintComplete = useCallback((txHash: string, recipient: string, amount: string) => {
        console.log('Mint completed:', { txHash, recipient, amount });
        toast.success(`Successfully minted ${amount} ${propertyDetails.tokenSymbol} to ${recipient.slice(0, 10)}...`);
    }, []);

    // Handle mint error
    const handleMintError = useCallback((error: Error) => {
        console.error('Mint error:', error);
        toast.error(`Minting failed: ${error.message}`);
    }, []);

    // Handle yield distribution from SDK component
    const handleDistribute = useCallback((config: DistributionConfig) => {
        console.log('Distribution config:', config);
        toast.success(`Initiating distribution of ${config.totalAmount} to token holders`);
    }, []);

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
                            <CardTitle>Admin Access Required</CardTitle>
                            <CardDescription>
                                Connect your wallet to access the admin dashboard.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <WalletConnect />
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
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
                        <Badge variant="outline" className="ml-2">
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                        </Badge>
                    </div>
                    <WalletConnect />
                </div>
            </header>

            <main className="container py-8">
                {/* Analytics Overview */}
                <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Holders</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.totalHolders}</div>
                            <p className="text-xs text-muted-foreground">
                                {analytics.pendingKYC} pending KYC
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Supply</CardTitle>
                            <Coins className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.totalSupply.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                {propertyDetails.tokenSymbol} tokens
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Distributed</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${analytics.totalDistributed.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                {analytics.distributionCount} distributions
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{analytics.complianceRate}%</div>
                            <p className="text-xs text-muted-foreground">
                                All transfers compliant
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="mint">Mint Tokens</TabsTrigger>
                        <TabsTrigger value="yield">Yield Distribution</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Property Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Name</span>
                                        <span className="font-medium">{propertyDetails.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Location</span>
                                        <span className="font-medium">{propertyDetails.location}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Value</span>
                                        <span className="font-medium">${propertyDetails.totalValue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Token Symbol</span>
                                        <span className="font-medium">{propertyDetails.tokenSymbol}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Expected Yield</span>
                                        <span className="font-medium text-green-600">{propertyDetails.expectedYield}% APY</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('mint')}>
                                        <Coins className="mr-2 h-4 w-4" />
                                        Mint New Tokens
                                    </Button>
                                    <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('yield')}>
                                        <Calculator className="mr-2 h-4 w-4" />
                                        Calculate Yield Distribution
                                    </Button>
                                    <Button className="w-full justify-start" variant="outline">
                                        <Users className="mr-2 h-4 w-4" />
                                        View All Holders
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Mint Tokens Tab - Using SDK TokenMintForm */}
                    <TabsContent value="mint" className="space-y-4">
                        <TokenMintForm
                            tokenAddress={contractAddresses.rwaToken}
                            kycRegistryAddress={contractAddresses.kycRegistry}
                            onMintComplete={handleMintComplete}
                            onError={handleMintError}
                            allowBatchMint={true}
                            maxBatchSize={100}
                            theme="light"
                        />
                    </TabsContent>

                    {/* Yield Distribution Tab - Using SDK YieldCalculator */}
                    <TabsContent value="yield" className="space-y-4">
                        <YieldCalculator
                            tokenAddress={contractAddresses.rwaToken}
                            yieldDistributorAddress={contractAddresses.yieldDistributor}
                            supportedPaymentTokens={SUPPORTED_PAYMENT_TOKENS}
                            onDistribute={handleDistribute}
                            showChart={true}
                            allowExport={true}
                            theme="light"
                        />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
