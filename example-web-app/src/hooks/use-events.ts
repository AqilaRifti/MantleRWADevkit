'use client';

/**
 * useEvents - Hook for subscribing to blockchain events using ethers.js
 * 
 * Provides real-time event subscriptions for token transfers, KYC updates,
 * and yield distributions.
 * 
 * @example
 * ```typescript
 * import { useEvents } from '@/hooks/use-events';
 * 
 * function EventFeed() {
 *   const { events, isSubscribed, subscribe, unsubscribe } = useEvents({
 *     tokenAddress,
 *     kycRegistryAddress,
 *     yieldDistributorAddress,
 *   });
 *   
 *   return (
 *     <div>
 *       {events.map(event => (
 *         <div key={event.id}>{event.type}: {event.description}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers, Contract } from 'ethers';
import { useRWAClient } from './use-rwa-client';
import {
    RWA_TOKEN_ABI,
    KYC_REGISTRY_ABI,
    YIELD_DISTRIBUTOR_ABI,
} from '@mantle-rwa/sdk';

/**
 * Event types that can be subscribed to
 */
export type EventType =
    | 'Transfer'
    | 'TransferRestricted'
    | 'TokensPaused'
    | 'TokensUnpaused'
    | 'InvestorVerified'
    | 'InvestorRemoved'
    | 'InvestorUpdated'
    | 'DistributionCreated'
    | 'YieldClaimed';

/**
 * Parsed blockchain event
 */
export interface BlockchainEvent {
    id: string;
    type: EventType;
    timestamp: Date;
    blockNumber: number;
    transactionHash: string;
    contractAddress: string;
    description: string;
    data: Record<string, unknown>;
}

/**
 * Configuration for event subscriptions
 */
export interface EventSubscriptionConfig {
    tokenAddress?: string;
    kycRegistryAddress?: string;
    yieldDistributorAddress?: string;
    maxEvents?: number;
}

/**
 * Return type for useEvents hook
 */
export interface UseEventsReturn {
    /** List of captured events (newest first) */
    events: BlockchainEvent[];
    /** Whether subscriptions are active */
    isSubscribed: boolean;
    /** Error that occurred */
    error: Error | null;
    /** Start event subscriptions */
    subscribe: () => void;
    /** Stop event subscriptions */
    unsubscribe: () => void;
    /** Clear event history */
    clearEvents: () => void;
    /** Filter events by type */
    filterByType: (type: EventType) => BlockchainEvent[];
}

const DEFAULT_MAX_EVENTS = 100;

/**
 * Hook for subscribing to blockchain events
 */
export function useEvents(config: EventSubscriptionConfig): UseEventsReturn {
    const { client, isInitialized } = useRWAClient();
    const { tokenAddress, kycRegistryAddress, yieldDistributorAddress, maxEvents = DEFAULT_MAX_EVENTS } = config;

    const [events, setEvents] = useState<BlockchainEvent[]>([]);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Store contract references
    const contractsRef = useRef<Contract[]>([]);
    const listenersRef = useRef<Map<Contract, Map<string, (...args: unknown[]) => void>>>(new Map());

    // Add event to the list
    const addEvent = useCallback((event: BlockchainEvent) => {
        setEvents(prev => {
            const newEvents = [event, ...prev];
            return newEvents.slice(0, maxEvents);
        });
    }, [maxEvents]);

    // Create event handler
    const createEventHandler = useCallback((
        type: EventType,
        contractAddress: string,
        parseArgs: (args: unknown[]) => { description: string; data: Record<string, unknown> }
    ) => {
        return (...args: unknown[]) => {
            const eventObj = args[args.length - 1] as ethers.EventLog;
            const { description, data } = parseArgs(args);

            const event: BlockchainEvent = {
                id: `${eventObj.transactionHash}-${eventObj.index}`,
                type,
                timestamp: new Date(),
                blockNumber: eventObj.blockNumber,
                transactionHash: eventObj.transactionHash,
                contractAddress,
                description,
                data,
            };

            addEvent(event);
        };
    }, [addEvent]);

    // Subscribe to events
    const subscribe = useCallback(async () => {
        if (!client || !isInitialized) {
            setError(new Error('Client not initialized'));
            return;
        }

        try {
            setError(null);
            const provider = client.provider;
            const contracts: Contract[] = [];
            const listeners = new Map<Contract, Map<string, (...args: unknown[]) => void>>();

            // Subscribe to token events
            if (tokenAddress) {
                const tokenContract = new Contract(tokenAddress, RWA_TOKEN_ABI, provider);
                contracts.push(tokenContract);
                const tokenListeners = new Map<string, (...args: unknown[]) => void>();

                // Transfer event
                const transferHandler = createEventHandler('Transfer', tokenAddress, (args) => {
                    const [from, to, value] = args as [string, string, bigint];
                    return {
                        description: `Transfer: ${ethers.formatUnits(value, 18)} tokens from ${from.slice(0, 8)}... to ${to.slice(0, 8)}...`,
                        data: { from, to, value: value.toString() },
                    };
                });
                tokenContract.on('Transfer', transferHandler);
                tokenListeners.set('Transfer', transferHandler);

                // TransferRestricted event
                const restrictedHandler = createEventHandler('TransferRestricted', tokenAddress, (args) => {
                    const [from, to, amount, reason] = args as [string, string, bigint, string];
                    return {
                        description: `Transfer Restricted: ${reason}`,
                        data: { from, to, amount: amount.toString(), reason },
                    };
                });
                tokenContract.on('TransferRestricted', restrictedHandler);
                tokenListeners.set('TransferRestricted', restrictedHandler);

                // TokensPaused event
                const pausedHandler = createEventHandler('TokensPaused', tokenAddress, (args) => {
                    const [by] = args as [string];
                    return {
                        description: `Tokens paused by ${by.slice(0, 8)}...`,
                        data: { by },
                    };
                });
                tokenContract.on('TokensPaused', pausedHandler);
                tokenListeners.set('TokensPaused', pausedHandler);

                // TokensUnpaused event
                const unpausedHandler = createEventHandler('TokensUnpaused', tokenAddress, (args) => {
                    const [by] = args as [string];
                    return {
                        description: `Tokens unpaused by ${by.slice(0, 8)}...`,
                        data: { by },
                    };
                });
                tokenContract.on('TokensUnpaused', unpausedHandler);
                tokenListeners.set('TokensUnpaused', unpausedHandler);

                listeners.set(tokenContract, tokenListeners);
            }

            // Subscribe to KYC events
            if (kycRegistryAddress) {
                const kycContract = new Contract(kycRegistryAddress, KYC_REGISTRY_ABI, provider);
                contracts.push(kycContract);
                const kycListeners = new Map<string, (...args: unknown[]) => void>();

                // InvestorVerified event
                const verifiedHandler = createEventHandler('InvestorVerified', kycRegistryAddress, (args) => {
                    const [investor, tier, expiry] = args as [string, number, bigint];
                    return {
                        description: `Investor ${investor.slice(0, 8)}... verified (Tier ${tier})`,
                        data: { investor, tier, expiry: expiry.toString() },
                    };
                });
                kycContract.on('InvestorVerified', verifiedHandler);
                kycListeners.set('InvestorVerified', verifiedHandler);

                // InvestorRemoved event
                const removedHandler = createEventHandler('InvestorRemoved', kycRegistryAddress, (args) => {
                    const [investor] = args as [string];
                    return {
                        description: `Investor ${investor.slice(0, 8)}... removed from registry`,
                        data: { investor },
                    };
                });
                kycContract.on('InvestorRemoved', removedHandler);
                kycListeners.set('InvestorRemoved', removedHandler);

                // InvestorUpdated event
                const updatedHandler = createEventHandler('InvestorUpdated', kycRegistryAddress, (args) => {
                    const [investor, newTier, newExpiry] = args as [string, number, bigint];
                    return {
                        description: `Investor ${investor.slice(0, 8)}... updated to Tier ${newTier}`,
                        data: { investor, newTier, newExpiry: newExpiry.toString() },
                    };
                });
                kycContract.on('InvestorUpdated', updatedHandler);
                kycListeners.set('InvestorUpdated', updatedHandler);

                listeners.set(kycContract, kycListeners);
            }

            // Subscribe to yield events
            if (yieldDistributorAddress) {
                const yieldContract = new Contract(yieldDistributorAddress, YIELD_DISTRIBUTOR_ABI, provider);
                contracts.push(yieldContract);
                const yieldListeners = new Map<string, (...args: unknown[]) => void>();

                // DistributionCreated event
                const distributionHandler = createEventHandler('DistributionCreated', yieldDistributorAddress, (args) => {
                    const [distributionId, paymentToken, totalAmount] = args as [bigint, string, bigint];
                    return {
                        description: `Distribution #${distributionId} created: ${ethers.formatUnits(totalAmount, 18)} tokens`,
                        data: { distributionId: distributionId.toString(), paymentToken, totalAmount: totalAmount.toString() },
                    };
                });
                yieldContract.on('DistributionCreated', distributionHandler);
                yieldListeners.set('DistributionCreated', distributionHandler);

                // YieldClaimed event
                const claimedHandler = createEventHandler('YieldClaimed', yieldDistributorAddress, (args) => {
                    const [distributionId, claimant, amount] = args as [bigint, string, bigint];
                    return {
                        description: `Yield claimed: ${ethers.formatUnits(amount, 18)} by ${claimant.slice(0, 8)}...`,
                        data: { distributionId: distributionId.toString(), claimant, amount: amount.toString() },
                    };
                });
                yieldContract.on('YieldClaimed', claimedHandler);
                yieldListeners.set('YieldClaimed', claimedHandler);

                listeners.set(yieldContract, yieldListeners);
            }

            contractsRef.current = contracts;
            listenersRef.current = listeners;
            setIsSubscribed(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to events';
            setError(new Error(errorMessage));
        }
    }, [client, isInitialized, tokenAddress, kycRegistryAddress, yieldDistributorAddress, createEventHandler]);

    // Unsubscribe from events
    const unsubscribe = useCallback(() => {
        // Remove all listeners
        listenersRef.current.forEach((listeners, contract) => {
            listeners.forEach((handler, eventName) => {
                contract.off(eventName, handler);
            });
        });

        contractsRef.current = [];
        listenersRef.current = new Map();
        setIsSubscribed(false);
    }, []);

    // Clear events
    const clearEvents = useCallback(() => {
        setEvents([]);
    }, []);

    // Filter events by type
    const filterByType = useCallback((type: EventType): BlockchainEvent[] => {
        return events.filter(e => e.type === type);
    }, [events]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            unsubscribe();
        };
    }, [unsubscribe]);

    return {
        events,
        isSubscribed,
        error,
        subscribe,
        unsubscribe,
        clearEvents,
        filterByType,
    };
}

/**
 * Code snippets for documentation display
 */
export const EVENTS_CODE_SNIPPETS = {
    subscribeToTransfers: `// Subscribe to Transfer events
const tokenContract = new ethers.Contract(
  tokenAddress,
  RWA_TOKEN_ABI,
  provider
);

tokenContract.on('Transfer', (from, to, value, event) => {
  console.log(\`Transfer: \${value} from \${from} to \${to}\`);
  console.log(\`Block: \${event.blockNumber}\`);
});`,

    subscribeToKYC: `// Subscribe to KYC events
const kycContract = new ethers.Contract(
  kycRegistryAddress,
  KYC_REGISTRY_ABI,
  provider
);

kycContract.on('InvestorVerified', (investor, tier, expiry) => {
  console.log(\`Investor \${investor} verified\`);
  console.log(\`Tier: \${tier}, Expiry: \${expiry}\`);
});`,

    subscribeToYield: `// Subscribe to Yield events
const yieldContract = new ethers.Contract(
  yieldDistributorAddress,
  YIELD_DISTRIBUTOR_ABI,
  provider
);

yieldContract.on('YieldClaimed', (distributionId, claimant, amount) => {
  console.log(\`Yield claimed: \${amount} by \${claimant}\`);
});`,

    unsubscribe: `// Unsubscribe from events
tokenContract.off('Transfer', transferHandler);
kycContract.off('InvestorVerified', kycHandler);
yieldContract.off('YieldClaimed', yieldHandler);`,
};

export default useEvents;
