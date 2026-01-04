'use client';

import { useAccount, useConnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

function DefaultFallback() {
    const { connect, connectors, isPending } = useConnect();

    return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Wallet className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Connect Your Wallet</CardTitle>
                    <CardDescription>
                        Please connect your wallet to access this page. Your wallet is used
                        for authentication and to interact with the blockchain.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button disabled={isPending} className="gap-2">
                                <Wallet className="h-4 w-4" />
                                {isPending ? 'Connecting...' : 'Connect Wallet'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center">
                            {connectors.map((connector) => (
                                <DropdownMenuItem
                                    key={connector.uid}
                                    onClick={() => connect({ connector })}
                                >
                                    {connector.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardContent>
            </Card>
        </div>
    );
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
    const { isConnected } = useAccount();

    if (!isConnected) {
        return fallback ?? <DefaultFallback />;
    }

    return <>{children}</>;
}
