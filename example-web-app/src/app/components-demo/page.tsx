'use client';

/**
 * React Components Demo Page
 * 
 * Demonstrates the @mantle-rwa/react component library with live examples.
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { WalletConnect } from '@/components/wallet-connect';
import { CodeSnippet } from '@/components/sdk/code-snippet';
import { contractAddresses } from '@/config/wagmi';
import { useRWAClient } from '@/hooks/use-rwa-client';
import {
    ArrowLeft,
    Code2,
    Wallet,
    Shield,
    LayoutDashboard,
    Calculator,
    FileText,
    Package,
} from 'lucide-react';
import Link from 'next/link';

// Import @mantle-rwa/react components
import {
    KYCFlow,
    InvestorDashboard,
    TokenMintForm,
    YieldCalculator,
    ErrorDisplay,
    type VerificationStatus,
    type AccreditationTier,
    type TransactionResult,
    type DistributionPreview,
} from '@mantle-rwa/react';

export default function ComponentsDemoPage() {
    const { isConnected } = useAccount();
    const { isInitialized, networkInfo } = useRWAClient();
    const [activeTab, setActiveTab] = useState('kyc');

    // Demo error for ErrorDisplay
    const [showError, setShowError] = useState(false);
    const demoError = new Error('This is a demo error message to showcase the ErrorDisplay component.');

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
                            <Package className="h-6 w-6 text-primary" />
                            <span className="text-xl font-bold">@mantle-rwa/react Demo</span>
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
                {/* Introduction */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">React Component Library</h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Pre-built React components for RWA tokenization on Mantle Network.
                        These components integrate with wagmi and the @mantle-rwa/sdk to provide
                        a seamless developer experience.
                    </p>
                </div>

                {/* Installation */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Installation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CodeSnippet
                            title="Install the package"
                            code={`npm install @mantle-rwa/react @mantle-rwa/sdk wagmi viem`}
                            collapsible={false}
                        />
                    </CardContent>
                </Card>

                {!isConnected ? (
                    /* Not Connected State */
                    <Card className="mx-auto max-w-md">
                        <CardHeader className="text-center">
                            <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
                            <CardTitle>Connect Your Wallet</CardTitle>
                            <CardDescription>
                                Connect your wallet to see the components in action with live data.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <WalletConnect />
                        </CardContent>
                    </Card>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="kyc" className="gap-2">
                                <Shield className="h-4 w-4" />
                                KYCFlow
                            </TabsTrigger>
                            <TabsTrigger value="dashboard" className="gap-2">
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </TabsTrigger>
                            <TabsTrigger value="mint" className="gap-2">
                                <FileText className="h-4 w-4" />
                                MintForm
                            </TabsTrigger>
                            <TabsTrigger value="yield" className="gap-2">
                                <Calculator className="h-4 w-4" />
                                YieldCalc
                            </TabsTrigger>
                            <TabsTrigger value="error" className="gap-2">
                                <Code2 className="h-4 w-4" />
                                ErrorDisplay
                            </TabsTrigger>
                        </TabsList>

                        {/* KYCFlow Tab */}
                        <TabsContent value="kyc" className="space-y-6">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>KYCFlow Component</CardTitle>
                                        <CardDescription>
                                            Multi-step KYC verification flow with status display
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <KYCFlow
                                            registryAddress={contractAddresses.kycRegistry}
                                            onStatusChange={(status: VerificationStatus) => console.log('KYC Status:', status)}
                                            onComplete={(tier: AccreditationTier) => console.log('KYC Complete, Tier:', tier)}
                                            onError={(error: Error) => console.error('KYC Error:', error)}
                                            className="w-full"
                                        />
                                    </CardContent>
                                </Card>

                                <div className="space-y-4">
                                    <CodeSnippet
                                        title="Usage"
                                        code={`import { KYCFlow } from '@mantle-rwa/react';

<KYCFlow
  registryAddress="${contractAddresses.kycRegistry}"
  onStatusChange={(status) => console.log(status)}
  onComplete={(tier) => console.log('Tier:', tier)}
  onError={(error) => console.error(error)}
  className="custom-class"
/>`}
                                        collapsible={false}
                                    />
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm">Props</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-sm space-y-2">
                                            <p><code className="bg-muted px-1 rounded">registryAddress</code> - KYC registry contract address</p>
                                            <p><code className="bg-muted px-1 rounded">investorAddress?</code> - Optional address to check</p>
                                            <p><code className="bg-muted px-1 rounded">onStatusChange?</code> - Callback when status changes</p>
                                            <p><code className="bg-muted px-1 rounded">onComplete?</code> - Callback when verification completes</p>
                                            <p><code className="bg-muted px-1 rounded">onError?</code> - Callback when error occurs</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* InvestorDashboard Tab */}
                        <TabsContent value="dashboard" className="space-y-6">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>InvestorDashboard Component</CardTitle>
                                        <CardDescription>
                                            Complete investor portfolio view with balance, KYC status, and yield claims
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <InvestorDashboard
                                            tokenAddress={contractAddresses.rwaToken}
                                            kycRegistryAddress={contractAddresses.kycRegistry}
                                            yieldDistributorAddress={contractAddresses.yieldDistributor}
                                            onClaimSuccess={(result: TransactionResult) => console.log('Claim success:', result)}
                                            onError={(error: Error) => console.error('Dashboard error:', error)}
                                            className="w-full"
                                        />
                                    </CardContent>
                                </Card>

                                <div className="space-y-4">
                                    <CodeSnippet
                                        title="Usage"
                                        code={`import { InvestorDashboard } from '@mantle-rwa/react';

<InvestorDashboard
  tokenAddress="${contractAddresses.rwaToken}"
  kycRegistryAddress="${contractAddresses.kycRegistry}"
  yieldDistributorAddress="${contractAddresses.yieldDistributor}"
  onClaimSuccess={(result) => console.log(result)}
  onError={(error) => console.error(error)}
/>`}
                                        collapsible={false}
                                    />
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm">Features</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-sm space-y-2">
                                            <p>• Token balance display with formatting</p>
                                            <p>• KYC verification status and tier</p>
                                            <p>• Pending yield claims with claim buttons</p>
                                            <p>• Loading and error states</p>
                                            <p>• Auto-refresh after transactions</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TokenMintForm Tab */}
                        <TabsContent value="mint" className="space-y-6">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>TokenMintForm Component</CardTitle>
                                        <CardDescription>
                                            Form for minting tokens with address and amount validation
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <TokenMintForm
                                            tokenAddress={contractAddresses.rwaToken}
                                            kycRegistryAddress={contractAddresses.kycRegistry}
                                            onSuccess={(result: TransactionResult) => console.log('Mint success:', result)}
                                            onError={(error: Error) => console.error('Mint error:', error)}
                                            className="w-full"
                                        />
                                    </CardContent>
                                </Card>

                                <div className="space-y-4">
                                    <CodeSnippet
                                        title="Usage"
                                        code={`import { TokenMintForm } from '@mantle-rwa/react';

<TokenMintForm
  tokenAddress="${contractAddresses.rwaToken}"
  kycRegistryAddress="${contractAddresses.kycRegistry}"
  onSuccess={(result) => console.log(result)}
  onError={(error) => console.error(error)}
/>`}
                                        collapsible={false}
                                    />
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm">Validation</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-sm space-y-2">
                                            <p>• Ethereum address format validation</p>
                                            <p>• Positive amount validation</p>
                                            <p>• KYC verification check before submit</p>
                                            <p>• Form clears after successful mint</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* YieldCalculator Tab */}
                        <TabsContent value="yield" className="space-y-6">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>YieldCalculator Component</CardTitle>
                                        <CardDescription>
                                            Preview yield distributions before creating them
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <YieldCalculator
                                            tokenAddress={contractAddresses.rwaToken}
                                            yieldDistributorAddress={contractAddresses.yieldDistributor}
                                            onCalculate={(preview: DistributionPreview) => console.log('Preview:', preview)}
                                            onError={(error: Error) => console.error('Calc error:', error)}
                                            className="w-full"
                                        />
                                    </CardContent>
                                </Card>

                                <div className="space-y-4">
                                    <CodeSnippet
                                        title="Usage"
                                        code={`import { YieldCalculator } from '@mantle-rwa/react';

<YieldCalculator
  tokenAddress="${contractAddresses.rwaToken}"
  yieldDistributorAddress="${contractAddresses.yieldDistributor}"
  holderAddresses={['0x...', '0x...']} // Optional filter
  onCalculate={(preview) => console.log(preview)}
  onError={(error) => console.error(error)}
/>`}
                                        collapsible={false}
                                    />
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm">Features</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-sm space-y-2">
                                            <p>• Distribution amount input with debounce</p>
                                            <p>• Preview table with holder details</p>
                                            <p>• Balance, yield amount, and percentage</p>
                                            <p>• Optional holder address filtering</p>
                                            <p>• Auto-recalculate on amount change</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ErrorDisplay Tab */}
                        <TabsContent value="error" className="space-y-6">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>ErrorDisplay Component</CardTitle>
                                        <CardDescription>
                                            Consistent error UI with retry functionality
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <button
                                            onClick={() => setShowError(!showError)}
                                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                        >
                                            {showError ? 'Hide Error' : 'Show Error'}
                                        </button>

                                        {showError && (
                                            <ErrorDisplay
                                                error={demoError}
                                                onRetry={() => {
                                                    console.log('Retry clicked');
                                                    setShowError(false);
                                                }}
                                                className="w-full"
                                            />
                                        )}
                                    </CardContent>
                                </Card>

                                <div className="space-y-4">
                                    <CodeSnippet
                                        title="Usage"
                                        code={`import { ErrorDisplay } from '@mantle-rwa/react';

<ErrorDisplay
  error={new Error('Something went wrong')}
  onRetry={() => refetchData()}
  className="custom-class"
/>`}
                                        collapsible={false}
                                    />
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm">Error Formatting</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-sm space-y-2">
                                            <p>• User-friendly error messages</p>
                                            <p>• Handles common contract errors</p>
                                            <p>• Optional retry button</p>
                                            <p>• Consistent styling across components</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </main>
        </div>
    );
}
