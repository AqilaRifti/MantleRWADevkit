'use client';

import { cn } from '@/lib/utils';
import { truncateAddress, generateWalletGradient, getNetworkName } from '@/lib/wallet-utils';

interface WalletAvatarProps {
    address: string;
    chainId?: number;
    className?: string;
    showInfo?: boolean;
}

export function WalletAvatar({
    address,
    chainId,
    className,
    showInfo = false,
}: WalletAvatarProps) {
    const gradient = generateWalletGradient(address);
    const truncated = truncateAddress(address);
    const networkName = getNetworkName(chainId);

    return (
        <div className="flex items-center gap-2">
            <div
                className={cn(
                    'flex items-center justify-center rounded-lg',
                    className
                )}
                style={{ background: gradient }}
            >
                <span className="text-white text-xs font-bold">
                    {address.slice(2, 4).toUpperCase()}
                </span>
            </div>

            {showInfo && (
                <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{truncated}</span>
                    <span className="truncate text-xs text-muted-foreground">
                        {networkName}
                    </span>
                </div>
            )}
        </div>
    );
}
