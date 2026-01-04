'use client';

/**
 * Client-side hook for filtering navigation items based on wallet connection
 *
 * This hook uses wagmi's useAccount hook to check wallet connection status.
 * Navigation items can be filtered based on whether a wallet is connected.
 *
 * Performance:
 * - All checks are synchronous (no server calls)
 * - Instant filtering
 * - No loading states
 * - No UI flashing
 */

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import type { NavItem } from '@/types';

/**
 * Hook to filter navigation items based on wallet connection (fully client-side)
 *
 * @param items - Array of navigation items to filter
 * @returns Filtered items based on wallet connection status
 */
export function useFilteredNavItems(items: NavItem[]) {
  const { isConnected, address } = useAccount();

  // Memoize context
  const accessContext = useMemo(() => {
    return {
      isConnected,
      address,
    };
  }, [isConnected, address]);

  // Filter items synchronously (all client-side)
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // No access restrictions - show item
        if (!item.access) {
          return true;
        }

        // Check if wallet connection is required
        if (item.access.requiresWallet && !accessContext.isConnected) {
          return false;
        }

        return true;
      })
      .map((item) => {
        // Recursively filter child items
        if (item.items && item.items.length > 0) {
          const filteredChildren = item.items.filter((childItem) => {
            // No access restrictions - show item
            if (!childItem.access) {
              return true;
            }

            // Check if wallet connection is required
            if (childItem.access.requiresWallet && !accessContext.isConnected) {
              return false;
            }

            return true;
          });

          return {
            ...item,
            items: filteredChildren
          };
        }

        return item;
      });
  }, [items, accessContext]);

  return filteredItems;
}
