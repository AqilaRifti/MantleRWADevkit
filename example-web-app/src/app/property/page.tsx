'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { propertyDetails, contractAddresses } from '@/config/wagmi';
import { WalletConnect } from '@/components/wallet-connect';
import { useToken } from '@/hooks/use-token';
import { useRWAClient } from '@/hooks/use-rwa-client';
import { CodeSnippet } from '@/components/sdk/code-snippet';
import { formatAmount } from '@mantle-rwa/sdk';
import {
    Building2,
    MapPin,
    DollarSign,
    TrendingUp,
    Users,
    Shield,
    Coins,
    BedDouble,
    Bath,
    Maximize,
    Calendar,
    Code2,
    Wallet,
    FileCheck,
    Zap,
    ArrowRight,
    ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function PropertyPage() {
    const { isInitialized, networkInfo } = useRWAClient();
    const { tokenInfo, isLoading: tokenLoading } = useToken(contractAddresses.rwaToken);

    // Calculate tokens sold from total supply (mock calculation)
    const totalSupply = tokenInfo?.totalSupply ?? 0n;
    const tokensSold = totalSupply > 0n
        ? Number(totalSupply / BigInt(10 ** 18))
        : 350; // Fallback mock data
    const percentSold = (tokensSold / propertyDetails.totalTokens) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold">RWA Tokenization</span>
                        {networkInfo && (
                            <Badge variant="outline" className="ml-2 text-xs">
                                {networkInfo.name}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/investor">
                            <Button variant="ghost">Investor Portal</Button>
                        </Link>
                        <Link href="/admin">
                            <Button variant="ghost">Admin</Button>
                        </Link>
                        <Link href="/playground">
                            <Button variant="ghost" className="gap-2">
                                <Code2 className="h-4 w-4" />
                                SDK Playground
                            </Button>
                        </Link>
                        <WalletConnect />
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container py-12 md:py-20">
                <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                    {/* Property Image Placeholder */}
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                            <Building2 className="h-32 w-32 text-muted-foreground/50" />
                        </div>
                        <Badge className="absolute left-4 top-4" variant="secondary">
                            Featured Property
                        </Badge>
                        {isInitialized && (
                            <Badge className="absolute right-4 top-4 gap-1" variant="default">
                                <Zap className="h-3 w-3" />
                                SDK Connected
                            </Badge>
                        )}
                    </div>

                    {/* Property Info */}
                    <div className="flex flex-col justify-center space-y-6">
                        <div>
                            <Badge className="mb-2">{propertyDetails.propertyType}</Badge>
                            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                                {propertyDetails.name}
                            </h1>
                            <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{propertyDetails.location}</span>
                            </div>
                        </div>

                        <p className="text-lg text-muted-foreground">
                            {propertyDetails.description}
                        </p>

                        {/* Property Stats */}
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div className="flex items-center gap-2">
                                <BedDouble className="h-5 w-5 text-muted-foreground" />
                                <span>{propertyDetails.bedrooms} Beds</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Bath className="h-5 w-5 text-muted-foreground" />
                                <span>{propertyDetails.bathrooms} Baths</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Maximize className="h-5 w-5 text-muted-foreground" />
                                <span>{propertyDetails.squareFeet.toLocaleString()} sqft</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <span>Built {propertyDetails.yearBuilt}</span>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <Link href="/investor" className="flex-1">
                                <Button size="lg" className="w-full gap-2">
                                    <Coins className="h-5 w-5" />
                                    Invest Now
                                </Button>
                            </Link>
                            <Button size="lg" variant="outline" className="flex-1 gap-2">
                                <Shield className="h-5 w-5" />
                                View Documents
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Token Sale Section with Live Data */}
            <section className="border-y bg-muted/30 py-12">
                <div className="container">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Live Token Statistics</h2>
                        <Badge variant="outline" className="gap-1">
                            <Code2 className="h-3 w-3" />
                            useToken Hook
                        </Badge>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {/* Token Price Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Token Price</CardDescription>
                                <CardTitle className="text-3xl">
                                    ${propertyDetails.tokenPrice.toLocaleString()}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Per {tokenInfo?.symbol || propertyDetails.tokenSymbol} token
                                </p>
                            </CardContent>
                        </Card>

                        {/* Total Supply Card - Live from SDK */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2">
                                    Total Supply
                                    {tokenLoading && <Skeleton className="h-4 w-4 rounded-full" />}
                                </CardDescription>
                                {tokenLoading ? (
                                    <Skeleton className="h-9 w-32" />
                                ) : (
                                    <CardTitle className="text-3xl">
                                        {tokenInfo?.totalSupply
                                            ? formatAmount(tokenInfo.totalSupply)
                                            : propertyDetails.totalTokens.toLocaleString()}
                                    </CardTitle>
                                )}
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {tokenInfo?.name || propertyDetails.tokenName}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Expected Yield Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Expected Annual Yield</CardDescription>
                                <CardTitle className="text-3xl text-green-600">
                                    {propertyDetails.expectedYield}%
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Quarterly distributions
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Progress Bar */}
                    <Card className="mt-8">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Token Sale Progress</CardTitle>
                                <Badge variant="outline">{percentSold.toFixed(1)}% Sold</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Progress value={percentSold} className="h-3" />
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>{tokensSold.toLocaleString()} tokens sold</span>
                                <span>{(propertyDetails.totalTokens - tokensSold).toLocaleString()} remaining</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SDK Code Snippet */}
                    <div className="mt-6">
                        <CodeSnippet
                            title="Fetching Token Info with SDK"
                            code={`// Get live token statistics
const token = client.token.connect(tokenAddress);
const info = await token.getInfo();

console.log('Name:', info.name);
console.log('Symbol:', info.symbol);
console.log('Total Supply:', info.totalSupply);
console.log('Paused:', info.paused);`}
                            language="typescript"
                            collapsible={true}
                            defaultExpanded={false}
                        />
                    </div>
                </div>
            </section>

            {/* SDK Features Section */}
            <section className="container py-12 md:py-20">
                <div className="mb-8 text-center">
                    <Badge className="mb-4" variant="secondary">
                        Powered by @mantle-rwa/sdk
                    </Badge>
                    <h2 className="text-3xl font-bold">
                        SDK Features
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Explore the capabilities of the Mantle RWA SDK
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Link href="/playground?module=token">
                        <Card className="h-full transition-colors hover:border-primary">
                            <CardHeader>
                                <Coins className="h-10 w-10 text-blue-500" />
                                <CardTitle className="flex items-center gap-2">
                                    Token Module
                                    <ArrowRight className="h-4 w-4" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Mint, transfer, burn tokens. Check balances and transfer eligibility.
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/playground?module=kyc">
                        <Card className="h-full transition-colors hover:border-primary">
                            <CardHeader>
                                <FileCheck className="h-10 w-10 text-green-500" />
                                <CardTitle className="flex items-center gap-2">
                                    KYC Module
                                    <ArrowRight className="h-4 w-4" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Manage investor verification, accreditation tiers, and compliance.
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/playground?module=yield">
                        <Card className="h-full transition-colors hover:border-primary">
                            <CardHeader>
                                <TrendingUp className="h-10 w-10 text-purple-500" />
                                <CardTitle className="flex items-center gap-2">
                                    Yield Module
                                    <ArrowRight className="h-4 w-4" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Create distributions, preview yields, and manage claims.
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/playground?module=compliance">
                        <Card className="h-full transition-colors hover:border-primary">
                            <CardHeader>
                                <Shield className="h-10 w-10 text-orange-500" />
                                <CardTitle className="flex items-center gap-2">
                                    Compliance Module
                                    <ArrowRight className="h-4 w-4" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Check transfer eligibility, generate reports, and export data.
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </section>

            {/* Navigation Cards */}
            <section className="border-y bg-muted/30 py-12">
                <div className="container">
                    <h2 className="mb-8 text-center text-3xl font-bold">
                        Explore the Demo
                    </h2>
                    <div className="grid gap-6 md:grid-cols-3">
                        <Link href="/investor">
                            <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                                <CardHeader>
                                    <Wallet className="h-12 w-12 text-primary" />
                                    <CardTitle>Investor Portal</CardTitle>
                                    <CardDescription>
                                        Connect wallet, complete KYC, view portfolio, and claim yields
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full gap-2">
                                        Enter Portal
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/admin">
                            <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                                <CardHeader>
                                    <Shield className="h-12 w-12 text-primary" />
                                    <CardTitle>Admin Dashboard</CardTitle>
                                    <CardDescription>
                                        Mint tokens, manage KYC, create distributions, view compliance
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full gap-2" variant="outline">
                                        Open Dashboard
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/playground">
                            <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                                <CardHeader>
                                    <Code2 className="h-12 w-12 text-primary" />
                                    <CardTitle>SDK Playground</CardTitle>
                                    <CardDescription>
                                        Interactive SDK explorer with live method execution
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full gap-2" variant="secondary">
                                        Try SDK
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="container py-12 md:py-20">
                <h2 className="mb-8 text-center text-3xl font-bold">
                    Why Invest in Tokenized Real Estate?
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <DollarSign className="h-10 w-10 text-primary" />
                            <CardTitle>Fractional Ownership</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Own a piece of premium real estate starting from just ${propertyDetails.tokenPrice}.
                                No need for large capital to invest in high-value properties.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <TrendingUp className="h-10 w-10 text-primary" />
                            <CardTitle>Passive Income</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Receive quarterly yield distributions directly to your wallet.
                                Expected {propertyDetails.expectedYield}% annual returns from rental income.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Users className="h-10 w-10 text-primary" />
                            <CardTitle>Liquidity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Trade your tokens on supported exchanges. Unlike traditional real estate,
                                exit your investment whenever you need.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Shield className="h-10 w-10 text-primary" />
                            <CardTitle>Regulatory Compliance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                ERC-3643 compliant security tokens with built-in KYC/AML verification.
                                Fully compliant with securities regulations.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Building2 className="h-10 w-10 text-primary" />
                            <CardTitle>Asset-Backed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Each token represents real ownership in the underlying property.
                                Backed by physical real estate with verified collateralization.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Zap className="h-10 w-10 text-primary" />
                            <CardTitle>Powered by Mantle</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Built on Mantle Network for low gas fees and fast transactions.
                                Secure, scalable, and efficient blockchain infrastructure.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* CTA Section */}
            <section className="border-t bg-primary py-12 text-primary-foreground">
                <div className="container text-center">
                    <h2 className="mb-4 text-3xl font-bold">Ready to Invest?</h2>
                    <p className="mx-auto mb-8 max-w-2xl text-primary-foreground/80">
                        Complete your KYC verification and start investing in tokenized real estate today.
                        Join hundreds of investors already earning passive income.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/investor">
                            <Button size="lg" variant="secondary" className="gap-2">
                                <Coins className="h-5 w-5" />
                                Get Started
                            </Button>
                        </Link>
                        <a
                            href="https://github.com/mantle-rwa/sdk"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button size="lg" variant="outline" className="gap-2 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                                <ExternalLink className="h-5 w-5" />
                                View SDK Docs
                            </Button>
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-8">
                <div className="container text-center text-sm text-muted-foreground">
                    <p>© 2026 RWA Tokenization Platform. Built on Mantle Network.</p>
                    <p className="mt-2">
                        This is a demo application for the @mantle-rwa/sdk package. Not financial advice.
                    </p>
                </div>
            </footer>
        </div>
    );
}
