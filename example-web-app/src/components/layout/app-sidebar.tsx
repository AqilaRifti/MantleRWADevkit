'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { WalletAvatar } from '@/components/wallet-avatar';
import { navItems } from '@/config/nav-config';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useFilteredNavItems } from '@/hooks/use-nav';
import { truncateAddress } from '@/lib/wallet-utils';
import {
  IconChevronRight,
  IconChevronsDown,
  IconCopy,
  IconExternalLink,
  IconLogout,
  IconWallet
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { toast } from 'sonner';
import { Icons } from '../icons';
import { Button } from '../ui/button';

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const filteredItems = useFilteredNavItems(navItems);

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

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

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <Link href='/'>
                <div className='bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                  <Icons.logo className='size-4' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>RWA Platform</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    Mantle Network
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarMenu>
            {filteredItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              return item?.items && item?.items?.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className='group/collapsible'
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={pathname === item.url}
                      >
                        {item.icon && <Icon />}
                        <span>{item.title}</span>
                        <IconChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {isConnected && address ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size='lg'
                    className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                  >
                    <WalletAvatar
                      address={address}
                      chainId={chain?.id}
                      className='h-8 w-8'
                      showInfo
                    />
                    <IconChevronsDown className='ml-auto size-4' />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                  side='bottom'
                  align='end'
                  sideOffset={4}
                >
                  <DropdownMenuLabel className='p-0 font-normal'>
                    <div className='px-1 py-1.5'>
                      <WalletAvatar
                        address={address}
                        chainId={chain?.id}
                        className='h-8 w-8'
                        showInfo
                      />
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={copyAddress}>
                      <IconCopy className='mr-2 h-4 w-4' />
                      Copy Address
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={openExplorer}>
                      <IconExternalLink className='mr-2 h-4 w-4' />
                      View on Explorer
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => disconnect()}>
                    <IconLogout className='mr-2 h-4 w-4' />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent'
                asChild
              >
                <Button variant='outline' className='w-full justify-start gap-2'>
                  <IconWallet className='h-4 w-4' />
                  <span>Connect Wallet</span>
                </Button>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
