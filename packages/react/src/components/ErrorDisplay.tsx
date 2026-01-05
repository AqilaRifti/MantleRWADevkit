'use client';

/**
 * ErrorDisplay - Shared error display component
 * 
 * Provides consistent error UI across all components with retry functionality.
 */

import type { ErrorDisplayProps } from '../types';

/**
 * Format error message for display
 */
export function formatErrorMessage(error: Error): string {
    const message = error.message;

    // Handle common contract errors
    if (message.includes('user rejected')) {
        return 'Transaction was rejected by the user.';
    }
    if (message.includes('insufficient funds')) {
        return 'Insufficient funds for this transaction.';
    }
    if (message.includes('nonce')) {
        return 'Transaction nonce error. Please try again.';
    }
    if (message.includes('gas')) {
        return 'Gas estimation failed. The transaction may fail.';
    }
    if (message.includes('network')) {
        return 'Network error. Please check your connection.';
    }
    if (message.includes('timeout')) {
        return 'Request timed out. Please try again.';
    }

    // Return original message if no special handling
    return message;
}

/**
 * ErrorDisplay component for consistent error UI
 */
export function ErrorDisplay({
    error,
    onRetry,
    className = '',
}: ErrorDisplayProps): JSX.Element {
    const formattedMessage = formatErrorMessage(error);

    return (
        <div className={`rwa-error-display ${className}`}>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start">
                    <svg
                        className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                            Error
                        </h3>
                        <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                            {formattedMessage}
                        </p>
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="mt-3 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 underline"
                            >
                                Try again
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ErrorDisplay;
