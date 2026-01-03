/**
 * Unit tests for RWAClient
 */

import { describe, it, expect, vi } from 'vitest';
import { RWAClient, RWAError, ErrorCode, MANTLE_SEPOLIA } from '../../src';

describe('RWAClient', () => {
    describe('constructor', () => {
        it('should create client with network name', () => {
            const client = new RWAClient({ network: 'mantle-sepolia' });
            expect(client.network.chainId).toBe(5003);
            expect(client.network.name).toBe('Mantle Sepolia');
        });

        it('should create client with custom network', () => {
            const client = new RWAClient({
                network: {
                    rpcUrl: 'http://localhost:8545',
                    chainId: 31337,
                    name: 'Local',
                },
            });
            expect(client.network.chainId).toBe(31337);
            expect(client.network.name).toBe('Local');
        });

        it('should throw for unknown network name', () => {
            expect(() => {
                new RWAClient({ network: 'unknown' as any });
            }).toThrow(RWAError);
        });

        it('should have modules available', () => {
            const client = new RWAClient({ network: 'mantle-sepolia' });
            expect(client.token).toBeDefined();
            expect(client.kyc).toBeDefined();
            expect(client.yield).toBeDefined();
            expect(client.compliance).toBeDefined();
        });

        it('should report hasSigner as false without private key', () => {
            const client = new RWAClient({ network: 'mantle-sepolia' });
            expect(client.hasSigner).toBe(false);
        });

        it('should report hasSigner as true with private key', () => {
            const client = new RWAClient({
                network: 'mantle-sepolia',
                privateKey: '0x' + '1'.repeat(64),
            });
            expect(client.hasSigner).toBe(true);
        });

        it('should throw when accessing signer without one', () => {
            const client = new RWAClient({ network: 'mantle-sepolia' });
            expect(() => client.signer).toThrow(RWAError);
        });
    });

    describe('deployRWASystem', () => {
        it('should throw without factory address', async () => {
            const client = new RWAClient({
                network: 'mantle-sepolia',
                privateKey: '0x' + '1'.repeat(64),
            });

            await expect(
                client.deployRWASystem({
                    tokenName: 'Test Token',
                    tokenSymbol: 'TEST',
                    initialSupply: '1000000',
                    vaultSigners: ['0x' + '1'.repeat(40)],
                    vaultThreshold: 1,
                })
            ).rejects.toThrow('Factory address not configured');
        });

        it('should validate deployment config - missing token name', async () => {
            const client = new RWAClient({
                network: 'mantle-sepolia',
                privateKey: '0x' + '1'.repeat(64),
                factoryAddress: '0x' + '1'.repeat(40),
            });

            await expect(
                client.deployRWASystem({
                    tokenName: '',
                    tokenSymbol: 'TEST',
                    initialSupply: '1000000',
                    vaultSigners: ['0x' + '1'.repeat(40)],
                    vaultThreshold: 1,
                })
            ).rejects.toThrow('tokenName is required');
        });

        it('should validate deployment config - invalid vault signer', async () => {
            const client = new RWAClient({
                network: 'mantle-sepolia',
                privateKey: '0x' + '1'.repeat(64),
                factoryAddress: '0x' + '1'.repeat(40),
            });

            await expect(
                client.deployRWASystem({
                    tokenName: 'Test',
                    tokenSymbol: 'TEST',
                    initialSupply: '1000000',
                    vaultSigners: ['invalid-address'],
                    vaultThreshold: 1,
                })
            ).rejects.toThrow('Invalid vault signer address');
        });

        it('should validate deployment config - invalid threshold', async () => {
            const client = new RWAClient({
                network: 'mantle-sepolia',
                privateKey: '0x' + '1'.repeat(64),
                factoryAddress: '0x' + '1'.repeat(40),
            });

            await expect(
                client.deployRWASystem({
                    tokenName: 'Test',
                    tokenSymbol: 'TEST',
                    initialSupply: '1000000',
                    vaultSigners: ['0x' + '1'.repeat(40)],
                    vaultThreshold: 5, // More than signers
                })
            ).rejects.toThrow('vaultThreshold must be between');
        });
    });
});

describe('Constants', () => {
    it('should export MANTLE_SEPOLIA config', () => {
        expect(MANTLE_SEPOLIA.chainId).toBe(5003);
        expect(MANTLE_SEPOLIA.rpcUrl).toContain('sepolia');
    });
});
