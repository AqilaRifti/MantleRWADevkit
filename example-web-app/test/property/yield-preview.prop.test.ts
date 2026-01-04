/**
 * Property Test: Yield Distribution Preview Accuracy
 * 
 * Validates: Requirements 4.1, 4.6
 * 
 * Property: For any valid distribution amount and set of holders,
 * the preview calculation should:
 * 1. Sum of individual distributions equals total amount (within rounding)
 * 2. Each holder's share is proportional to their balance
 * 3. Percentages sum to 100% (within rounding)
 */

import { describe, it, expect } from 'vitest';

// Mock types matching SDK
interface HolderDistribution {
    address: string;
    balance: bigint;
    yieldAmount: bigint;
    percentage: number;
}

interface DistributionPreview {
    totalHolders: number;
    totalSupplyAtSnapshot: bigint;
    distributions: HolderDistribution[];
}

/**
 * Simulates the SDK's previewDistribution calculation
 * This mirrors the logic in YieldModule.previewDistribution
 */
function calculateDistributionPreview(
    totalAmount: bigint,
    holders: Array<{ address: string; balance: bigint }>,
    totalSupply: bigint
): DistributionPreview {
    if (totalSupply === 0n) {
        return {
            totalHolders: 0,
            totalSupplyAtSnapshot: 0n,
            distributions: [],
        };
    }

    const distributions: HolderDistribution[] = holders
        .filter(h => h.balance > 0n)
        .map(holder => {
            // Calculate proportional yield amount
            const yieldAmount = (totalAmount * holder.balance) / totalSupply;
            const percentage = Number((holder.balance * 10000n) / totalSupply) / 100;

            return {
                address: holder.address,
                balance: holder.balance,
                yieldAmount,
                percentage,
            };
        });

    return {
        totalHolders: distributions.length,
        totalSupplyAtSnapshot: totalSupply,
        distributions,
    };
}

/**
 * Generate random test data
 */
function generateRandomHolders(count: number, maxBalance: bigint): Array<{ address: string; balance: bigint }> {
    const holders: Array<{ address: string; balance: bigint }> = [];
    for (let i = 0; i < count; i++) {
        const balance = BigInt(Math.floor(Math.random() * Number(maxBalance)));
        holders.push({
            address: `0x${i.toString(16).padStart(40, '0')}`,
            balance,
        });
    }
    return holders;
}

describe('Yield Distribution Preview Accuracy', () => {
    describe('Property 1: Distribution sum equals total amount (within rounding)', () => {
        it('should distribute total amount correctly for single holder', () => {
            const totalAmount = 10000n;
            const holders = [{ address: '0x1', balance: 1000n }];
            const totalSupply = 1000n;

            const preview = calculateDistributionPreview(totalAmount, holders, totalSupply);

            expect(preview.distributions[0].yieldAmount).toBe(totalAmount);
        });

        it('should distribute total amount correctly for equal holders', () => {
            const totalAmount = 10000n;
            const holders = [
                { address: '0x1', balance: 500n },
                { address: '0x2', balance: 500n },
            ];
            const totalSupply = 1000n;

            const preview = calculateDistributionPreview(totalAmount, holders, totalSupply);

            const totalDistributed = preview.distributions.reduce(
                (sum, d) => sum + d.yieldAmount,
                0n
            );

            expect(totalDistributed).toBe(totalAmount);
        });

        it('should handle rounding for uneven distributions', () => {
            const totalAmount = 100n;
            const holders = [
                { address: '0x1', balance: 333n },
                { address: '0x2', balance: 333n },
                { address: '0x3', balance: 334n },
            ];
            const totalSupply = 1000n;

            const preview = calculateDistributionPreview(totalAmount, holders, totalSupply);

            const totalDistributed = preview.distributions.reduce(
                (sum, d) => sum + d.yieldAmount,
                0n
            );

            // Due to integer division, total distributed may be slightly less
            expect(totalDistributed).toBeLessThanOrEqual(totalAmount);
            // But should be within 1% of total (use >= for boundary case)
            expect(Number(totalDistributed)).toBeGreaterThanOrEqual(Number(totalAmount) * 0.99);
        });

        it('should handle random distributions within rounding tolerance', () => {
            for (let trial = 0; trial < 10; trial++) {
                const totalAmount = BigInt(Math.floor(Math.random() * 1000000) + 1000);
                const holderCount = Math.floor(Math.random() * 20) + 1;
                const holders = generateRandomHolders(holderCount, 10000n);
                const totalSupply = holders.reduce((sum, h) => sum + h.balance, 0n);

                if (totalSupply === 0n) continue;

                const preview = calculateDistributionPreview(totalAmount, holders, totalSupply);

                const totalDistributed = preview.distributions.reduce(
                    (sum, d) => sum + d.yieldAmount,
                    0n
                );

                // Total distributed should be within rounding error
                const difference = totalAmount - totalDistributed;
                expect(difference).toBeGreaterThanOrEqual(0n);
                // Rounding error should be at most number of holders
                expect(difference).toBeLessThanOrEqual(BigInt(preview.totalHolders));
            }
        });
    });

    describe('Property 2: Proportional distribution', () => {
        it('should give double yield for double balance', () => {
            const totalAmount = 10000n;
            const holders = [
                { address: '0x1', balance: 200n },
                { address: '0x2', balance: 100n },
            ];
            const totalSupply = 300n;

            const preview = calculateDistributionPreview(totalAmount, holders, totalSupply);

            const holder1Yield = preview.distributions.find(d => d.address === '0x1')!.yieldAmount;
            const holder2Yield = preview.distributions.find(d => d.address === '0x2')!.yieldAmount;

            // Holder 1 has 2x balance, should get 2x yield
            expect(holder1Yield).toBe(holder2Yield * 2n);
        });

        it('should maintain proportionality for various ratios', () => {
            const totalAmount = 1000000n;
            const holders = [
                { address: '0x1', balance: 100n },
                { address: '0x2', balance: 200n },
                { address: '0x3', balance: 300n },
                { address: '0x4', balance: 400n },
            ];
            const totalSupply = 1000n;

            const preview = calculateDistributionPreview(totalAmount, holders, totalSupply);

            // Check that yield ratios match balance ratios
            for (let i = 0; i < preview.distributions.length; i++) {
                for (let j = i + 1; j < preview.distributions.length; j++) {
                    const d1 = preview.distributions[i];
                    const d2 = preview.distributions[j];

                    // Ratio of yields should equal ratio of balances
                    const yieldRatio = Number(d1.yieldAmount) / Number(d2.yieldAmount);
                    const balanceRatio = Number(d1.balance) / Number(d2.balance);

                    // Allow small tolerance for rounding
                    expect(Math.abs(yieldRatio - balanceRatio)).toBeLessThan(0.01);
                }
            }
        });
    });

    describe('Property 3: Percentages sum to 100%', () => {
        it('should have percentages summing to 100% for complete holder set', () => {
            const totalAmount = 10000n;
            const holders = [
                { address: '0x1', balance: 250n },
                { address: '0x2', balance: 250n },
                { address: '0x3', balance: 500n },
            ];
            const totalSupply = 1000n;

            const preview = calculateDistributionPreview(totalAmount, holders, totalSupply);

            const totalPercentage = preview.distributions.reduce(
                (sum, d) => sum + d.percentage,
                0
            );

            expect(totalPercentage).toBe(100);
        });

        it('should handle rounding in percentages', () => {
            const totalAmount = 10000n;
            const holders = [
                { address: '0x1', balance: 333n },
                { address: '0x2', balance: 333n },
                { address: '0x3', balance: 334n },
            ];
            const totalSupply = 1000n;

            const preview = calculateDistributionPreview(totalAmount, holders, totalSupply);

            const totalPercentage = preview.distributions.reduce(
                (sum, d) => sum + d.percentage,
                0
            );

            // Should be very close to 100%
            expect(totalPercentage).toBeGreaterThan(99);
            expect(totalPercentage).toBeLessThanOrEqual(100);
        });
    });

    describe('Property 4: Edge cases', () => {
        it('should handle zero total supply', () => {
            const totalAmount = 10000n;
            const holders: Array<{ address: string; balance: bigint }> = [];
            const totalSupply = 0n;

            const preview = calculateDistributionPreview(totalAmount, holders, totalSupply);

            expect(preview.totalHolders).toBe(0);
            expect(preview.distributions).toHaveLength(0);
        });

        it('should filter out zero-balance holders', () => {
            const totalAmount = 10000n;
            const holders = [
                { address: '0x1', balance: 500n },
                { address: '0x2', balance: 0n },
                { address: '0x3', balance: 500n },
            ];
            const totalSupply = 1000n;

            const preview = calculateDistributionPreview(totalAmount, holders, totalSupply);

            expect(preview.totalHolders).toBe(2);
            expect(preview.distributions.every(d => d.balance > 0n)).toBe(true);
        });

        it('should handle very large amounts', () => {
            const totalAmount = 10n ** 24n; // 1 million tokens with 18 decimals
            const holders = [
                { address: '0x1', balance: 10n ** 20n },
                { address: '0x2', balance: 10n ** 20n },
            ];
            const totalSupply = 2n * 10n ** 20n;

            const preview = calculateDistributionPreview(totalAmount, holders, totalSupply);

            expect(preview.distributions[0].yieldAmount).toBe(totalAmount / 2n);
            expect(preview.distributions[1].yieldAmount).toBe(totalAmount / 2n);
        });

        it('should handle very small amounts', () => {
            const totalAmount = 10n;
            const holders = [
                { address: '0x1', balance: 1n },
                { address: '0x2', balance: 1n },
                { address: '0x3', balance: 1n },
            ];
            const totalSupply = 3n;

            const preview = calculateDistributionPreview(totalAmount, holders, totalSupply);

            // Each holder should get 3 (10/3 = 3 with integer division)
            expect(preview.distributions.every(d => d.yieldAmount === 3n)).toBe(true);
        });
    });
});
