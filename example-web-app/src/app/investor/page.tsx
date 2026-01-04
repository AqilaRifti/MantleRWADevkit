'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { WalletConnect } from '@/components/wallet-connect';
import { contractAddresses, propertyDetails } from '@/config/wagmi';
import { toast } from 'sonner';
import { Building2, Coins, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Import from @mantle-rwa/react package
import { KYCFlow, InvestorDashboard } from '@mantle-rwa/react';
import type { KYCResult } from '@mantle-rwa/react';

export default function InvestorPortalPage() {
    const { address, isConnected } = useAccount();
    const [isKYCVerified, setIsKYCVerified] = useState(false);
    const [purchaseAmount, setPurchaseAmount] = useState('');
    const [isPurchasing, setIsPurchasing] = useState(false);

    // Handle KYC completion from the SDK component
    const handleKYCComplete = useCallback((result: KYCResult) => {
        console.log('KYC completed:', result);
        setIsKYCVerified(true);
        toast.success('KYC verification completed successfully!');
    }, []);

    // Handle KYC error
    const handleKYCError = useCallback((error: Error) => {
        console.error('KYC error:', error);
        toast.error(`KYC verification failed: ${error.message}`);
    }, []);

    // Handle yield claim from InvestorDashboard
    const handleClaimYield = useCallback((distributionId: number) => {
        console.log('Claiming yield for distribution:', distributionId);
        toast.success(`Claiming yield for distribution #${distributionId}`);
    }, []);

    // Handle token purchase
    const handlePurchase = useCallback(async () => {
        const amount = parseInt(purchaseAmount);
        if (!amount || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setIsPurchasing(true);
        try {
            // Simulate purchase transaction - in production would use SDK
            await new Promise(resolve => setTimeout(resolve, 1500));
            setPurchaseAmount('');
            toast.success(`Successfully purchased ${amount} ${propertyDetails.tokenSymbol} tokens!`);
        } catch (error) {
            toast.error('Purchase failed. Please try again.');
        } finally {
            setIsPurchasing(false);
        }
    }, [purchaseAmount]);

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
                    </div>
                    <WalletConnect />
                </div>
            </header>

            <main className="container py-8">
                {!isConnected ? (
                    /* Not Connected State */
                    <Card className="mx-auto max-w-md">
                        <CardHeader className="text-center">
                            <CardTitle>Connect Your Wallet</CardTitle>
                            <CardDescription>
                                Connect your wallet to access the investor portal and manage your investments.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <WalletConnect />
                        </CardContent>
                    </Card>
                ) : !isKYCVerified ? (
                    /* KYC Required - Using SDK KYCFlow Component */
                    <div className="mx-auto max-w-2xl space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Identity Verification Required</CardTitle>
                                <CardDescription>
                                    Complete KYC verification to invest in tokenized real estate.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <KYCFlow
                                    provider="persona"
                                    requiredFields={['identity', 'accreditation', 'address']}
                                    onComplete={handleKYCComplete}
                                    onError={handleKYCError}
                                    theme="light"
                                    registryAddress={contractAddresses.kycRegistry}
                                    autoUpdateRegistry={true}
                                />
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    /* Verified Investor - Using SDK InvestorDashboard Component */
                    <div className="space-y-6">
                        <Tabs defaultValue="dashboard" className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                                <TabsTrigger value="invest">Invest</TabsTrigger>
                            </TabsList>

                            {/* Dashboard Tab - Using SDK InvestorDashboard */}
                            <TabsContent value="dashboard">
                                <InvestorDashboard
                                    tokenAddress={contractAddresses.rwaToken}
                                    yieldDistributorAddress={contractAddresses.yieldDistributor}
                                    kycRegistryAddress={contractAddresses.kycRegistry}
                                    onClaimYield={handleClaimYield}
                                    showPortfolioValue={true}
                                    theme="light"
                                />
                            </TabsContent>

                            {/* Invest Tab */}
                            <TabsContent value="invest" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Purchase Tokens</CardTitle>
                                        <CardDescription>
                                            Buy {propertyDetails.tokenSymbol} tokens to own a fraction of {propertyDetails.name}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="amount">Number of Tokens</Label>
                                                <Input
                                                    id="amount"
                                                    type="number"
                                                    placeholder="Enter amount"
                                                    value={purchaseAmount}
                                                    onChange={(e) => setPurchaseAmount(e.target.value)}
                                                    min="1"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Total Cost</Label>
                                                <div className="flex h-10 items-center rounded-md border bg-muted px-3">
                                                    ${((parseInt(purchaseAmount) || 0) * propertyDetails.tokenPrice).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Token Price</p>
                                                <p className="font-medium">${propertyDetails.tokenPrice} per token</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Expected Yield</p>
                                                <p className="font-medium text-green-600">{propertyDetails.expectedYield}% APY</p>
                                            </div>
                                        </div>
                                        <Button
                                            className="w-full"
                                            size="lg"
                                            onClick={handlePurchase}
                                            disabled={isPurchasing || !purchaseAmount}
                                        >
                                            {isPurchasing ? (
                                                <>
                                                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <Coins className="mr-2 h-4 w-4" />
                                                    Purchase Tokens
                                                </>
                                            )}
                                        </Button>
                                        <p className="text-center text-xs text-muted-foreground">
                                            Testnet only - uses mock USDC for demonstration
                                        </p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </main>
        </div>
    );
}
