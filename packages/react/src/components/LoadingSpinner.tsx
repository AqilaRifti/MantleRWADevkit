'use client';

/**
 * LoadingSpinner - Shared loading indicator component
 */

import type { LoadingSpinnerProps } from '../types';

const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
};

/**
 * LoadingSpinner component
 */
export function LoadingSpinner({
    size = 'md',
    className = '',
}: LoadingSpinnerProps): JSX.Element {
    return (
        <div className={`rwa-loading-spinner ${className}`}>
            <div
                className={`animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400 ${sizeClasses[size]}`}
                role="status"
                aria-label="Loading"
            />
        </div>
    );
}

export default LoadingSpinner;
