'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { WalletAvatar } from '@/components/wallet-avatar';
import { truncateAddress } from '@/lib/wallet-utils';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { toast } from 'sonner';
import { Copy, ExternalLink, LogOut, Wallet } from 'lucide-react';

export function UserNav() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

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
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <WalletAvatar address={address} className='h-8 w-8' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className='w-56'
          align='end'
          sideOffset={10}
          forceMount
        >
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col space-y-1'>
              <p className='text-sm leading-none font-medium'>
                {truncateAddress(address)}
              </p>
              <p className='text-muted-foreground text-xs leading-none'>
                {chain?.name || 'Unknown Network'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={copyAddress}>
              <Copy className='mr-2 h-4 w-4' />
              Copy Address
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openExplorer}>
              <ExternalLink className='mr-2 h-4 w-4' />
              View on Explorer
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => disconnect()}>
            <LogOut className='mr-2 h-4 w-4' />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isPending} className='gap-2'>
          <Wallet className='h-4 w-4' />
          {isPending ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
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
