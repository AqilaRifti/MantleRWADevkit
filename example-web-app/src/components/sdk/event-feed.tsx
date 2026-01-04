'use client';

/**
 * EventFeed - Live blockchain event display component
 * 
 * Displays real-time blockchain events with filtering and timestamps.
 * 
 * @example
 * ```tsx
 * <EventFeed
 *   events={events}
 *   onFilterChange={setFilter}
 *   maxHeight={400}
 * />
 * ```
 */

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowRightLeft,
    UserCheck,
    UserMinus,
    UserCog,
    Coins,
    HandCoins,
    Pause,
    Play,
    ShieldAlert,
    Activity,
    ExternalLink,
    Trash2,
} from 'lucide-react';
import type { BlockchainEvent, EventType } from '@/hooks/use-events';

export interface EventFeedProps {
    /** List of events to display */
    events: BlockchainEvent[];
    /** Block explorer base URL */
    explorerUrl?: string;
    /** Maximum height of the feed */
    maxHeight?: number;
    /** Callback when events are cleared */
    onClear?: () => void;
    /** Additional CSS classes */
    className?: string;
    /** Show filter controls */
    showFilters?: boolean;
    /** Title for the feed */
    title?: string;
}

const EVENT_CONFIG: Record<EventType, {
    icon: typeof ArrowRightLeft;
    label: string;
    color: string;
    bgColor: string;
}> = {
    Transfer: {
        icon: ArrowRightLeft,
        label: 'Transfer',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
    },
    TransferRestricted: {
        icon: ShieldAlert,
        label: 'Restricted',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
    },
    TokensPaused: {
        icon: Pause,
        label: 'Paused',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
    },
    TokensUnpaused: {
        icon: Play,
        label: 'Unpaused',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
    },
    InvestorVerified: {
        icon: UserCheck,
        label: 'KYC Verified',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
    },
    InvestorRemoved: {
        icon: UserMinus,
        label: 'KYC Removed',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
    },
    InvestorUpdated: {
        icon: UserCog,
        label: 'KYC Updated',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
    },
    DistributionCreated: {
        icon: Coins,
        label: 'Distribution',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
    },
    YieldClaimed: {
        icon: HandCoins,
        label: 'Yield Claimed',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
    },
};

const EVENT_CATEGORIES = {
    all: 'All Events',
    token: 'Token Events',
    kyc: 'KYC Events',
    yield: 'Yield Events',
} as const;

type EventCategory = keyof typeof EVENT_CATEGORIES;

const CATEGORY_EVENTS: Record<EventCategory, EventType[] | null> = {
    all: null,
    token: ['Transfer', 'TransferRestricted', 'TokensPaused', 'TokensUnpaused'],
    kyc: ['InvestorVerified', 'InvestorRemoved', 'InvestorUpdated'],
    yield: ['DistributionCreated', 'YieldClaimed'],
};

function formatTimestamp(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

function EventItem({
    event,
    explorerUrl,
}: {
    event: BlockchainEvent;
    explorerUrl: string;
}) {
    const config = EVENT_CONFIG[event.type];
    const Icon = config.icon;
    const txLink = `${explorerUrl}/tx/${event.transactionHash}`;

    return (
        <div className={cn(
            "flex items-start gap-3 p-3 rounded-lg border",
            config.bgColor
        )}>
            <div className={cn(
                "rounded-full p-1.5 shrink-0",
                config.bgColor
            )}>
                <Icon className={cn("h-4 w-4", config.color)} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                        {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        {formatTimestamp(event.timestamp)}
                    </span>
                </div>

                <p className="text-sm text-foreground truncate">
                    {event.description}
                </p>

                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                        Block {event.blockNumber.toLocaleString()}
                    </span>
                    <a
                        href={txLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                        View tx
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
            </div>
        </div>
    );
}

export function EventFeed({
    events,
    explorerUrl = 'https://sepolia.mantlescan.xyz',
    maxHeight = 400,
    onClear,
    className,
    showFilters = true,
    title = 'Live Events',
}: EventFeedProps) {
    const [category, setCategory] = useState<EventCategory>('all');

    const filteredEvents = useMemo(() => {
        const allowedTypes = CATEGORY_EVENTS[category];
        if (!allowedTypes) return events;
        return events.filter(e => allowedTypes.includes(e.type));
    }, [events, category]);

    return (
        <div className={cn("rounded-lg border bg-card", className)}>
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{title}</span>
                    {events.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            {filteredEvents.length}
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {showFilters && (
                        <Select
                            value={category}
                            onValueChange={(v) => setCategory(v as EventCategory)}
                        >
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(EVENT_CATEGORIES).map(([key, label]) => (
                                    <SelectItem key={key} value={key} className="text-xs">
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {onClear && events.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={onClear}
                            aria-label="Clear events"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <ScrollArea style={{ height: maxHeight }}>
                <div className="p-4 space-y-2">
                    {filteredEvents.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No events yet</p>
                            <p className="text-xs">Events will appear here in real-time</p>
                        </div>
                    ) : (
                        filteredEvents.map((event) => (
                            <EventItem
                                key={event.id}
                                event={event}
                                explorerUrl={explorerUrl}
                            />
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

export default EventFeed;
