'use client';

/**
 * ConnectWalletPrompt - Prompt for wallet connection
 */

interface ConnectWalletPromptProps {
    /** Message to display */
    message?: string;
    /** Custom CSS class */
    className?: string;
}

/**
 * ConnectWalletPrompt component
 */
export function ConnectWalletPrompt({
    message = 'Please connect your wallet to continue.',
    className = '',
}: ConnectWalletPromptProps): JSX.Element {
    return (
        <div className={`rwa-connect-wallet-prompt ${className}`}>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center">
                    <svg
                        className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                    <p className="ml-3 text-sm text-yellow-700 dark:text-yellow-300">
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ConnectWalletPrompt;
