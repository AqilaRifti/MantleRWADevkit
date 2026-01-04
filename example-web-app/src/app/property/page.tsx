'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { propertyDetails } from '@/config/wagmi';
import { WalletConnect } from '@/components/wallet-connect';
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
    Calendar
} from 'lucide-react';
import Link from 'next/link';

export default function PropertyPage() {
    const tokensSold = 350; // Mock data - would come from contract
    const percentSold = (tokensSold / propertyDetails.totalTokens) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold">RWA Tokenization</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/investor">
                            <Button variant="ghost">Investor Portal</Button>
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

            {/* Token Sale Section */}
            <section className="border-y bg-muted/30 py-12">
                <div className="container">
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
                                    Per {propertyDetails.tokenSymbol} token
                                </p>
                            </CardContent>
                        </Card>

                        {/* Total Value Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Property Value</CardDescription>
                                <CardTitle className="text-3xl">
                                    ${propertyDetails.totalValue.toLocaleString()}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {propertyDetails.totalTokens.toLocaleString()} total tokens
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
                            <Coins className="h-10 w-10 text-primary" />
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
                    <Link href="/investor">
                        <Button size="lg" variant="secondary" className="gap-2">
                            <Coins className="h-5 w-5" />
                            Get Started
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-8">
                <div className="container text-center text-sm text-muted-foreground">
                    <p>© 2026 RWA Tokenization Platform. Built on Mantle Network.</p>
                    <p className="mt-2">
                        This is a demo application for the Mantle RWA SDK. Not financial advice.
                    </p>
                </div>
            </footer>
        </div>
    );
}
