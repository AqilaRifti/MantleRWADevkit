'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, LogOut, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export function WalletConnect() {
    const { address, isConnected, chain } = useAccount();
    const { connect, connectors, isPending } = useConnect();
    const { disconnect } = useDisconnect();

    const truncateAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            toast.success('Address copied to clipboard');
        }
    };

    const openExplorer = () => {
        if (address && chain) {
            const explorerUrl = chain.blockExplorers?.default?.url;
            if (explorerUrl) {
                window.open(`${explorerUrl}/address/${address}`, '_blank');
            }
        }
    };

    if (isConnected && address) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Wallet className="h-4 w-4" />
                        {truncateAddress(address)}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={copyAddress}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Address
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={openExplorer}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View on Explorer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => disconnect()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Disconnect
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button disabled={isPending} className="gap-2">
                    <Wallet className="h-4 w-4" />
                    {isPending ? 'Connecting...' : 'Connect Wallet'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
    );
}
