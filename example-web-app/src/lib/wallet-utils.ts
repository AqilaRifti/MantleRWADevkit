/**
 * Wallet utility functions for address display and avatar generation
 */

/**
 * Truncates an Ethereum address to format: 0xXXXX...XXXX
 * Preserves first 6 characters and last 4 characters
 * 
 * @param address - Full Ethereum address (0x prefixed, 42 characters)
 * @returns Truncated address string
 */
export function truncateAddress(address: string): string {
    if (!address || address.length < 10) {
        return address;
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Generates a deterministic gradient color pair based on wallet address
 * Same address will always produce the same colors
 * 
 * @param address - Ethereum address
 * @returns Object with two hex color strings for gradient
 */
export function generateWalletColors(address: string): { color1: string; color2: string } {
    if (!address || address.length < 10) {
        return { color1: '#6366f1', color2: '#8b5cf6' }; // Default indigo/violet
    }

    // Use different parts of the address for different colors
    const hash1 = parseInt(address.slice(2, 8), 16);
    const hash2 = parseInt(address.slice(-6), 16);

    // Generate hue values (0-360) from the hash
    const hue1 = hash1 % 360;
    const hue2 = hash2 % 360;

    // Convert HSL to hex with fixed saturation and lightness for vibrant colors
    const color1 = hslToHex(hue1, 70, 55);
    const color2 = hslToHex(hue2, 70, 55);

    return { color1, color2 };
}

/**
 * Generates a CSS gradient string for wallet avatar background
 * 
 * @param address - Ethereum address
 * @returns CSS linear-gradient string
 */
export function generateWalletGradient(address: string): string {
    const { color1, color2 } = generateWalletColors(address);
    return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
}

/**
 * Converts HSL color values to hex string
 */
function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
        r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
        r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
        r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
        r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
        r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
        r = c; g = 0; b = x;
    }

    const toHex = (n: number) => {
        const hex = Math.round((n + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Gets a human-readable network name from chain ID
 * 
 * @param chainId - Network chain ID
 * @returns Human-readable network name
 */
export function getNetworkName(chainId: number | undefined): string {
    if (!chainId) return 'Unknown Network';

    const networks: Record<number, string> = {
        1: 'Ethereum',
        5: 'Goerli',
        11155111: 'Sepolia',
        137: 'Polygon',
        80001: 'Mumbai',
        5000: 'Mantle',
        5003: 'Mantle Sepolia',
        42161: 'Arbitrum One',
        10: 'Optimism',
    };

    return networks[chainId] || `Chain ${chainId}`;
}
