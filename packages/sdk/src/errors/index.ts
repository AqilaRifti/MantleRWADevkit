/**
 * Error handling for the Mantle RWA SDK
 * Provides descriptive error messages with suggested fixes
 */

/**
 * Error codes for categorizing errors
 */
export enum ErrorCode {
    // Contract errors
    NOT_VERIFIED = 'NOT_VERIFIED',
    KYC_EXPIRED = 'KYC_EXPIRED',
    TRANSFER_RESTRICTED = 'TRANSFER_RESTRICTED',
    TOKENS_PAUSED = 'TOKENS_PAUSED',
    UNAUTHORIZED = 'UNAUTHORIZED',
    INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
    INVALID_RECIPIENT = 'INVALID_RECIPIENT',
    CLAIM_WINDOW_EXPIRED = 'CLAIM_WINDOW_EXPIRED',
    ALREADY_CLAIMED = 'ALREADY_CLAIMED',
    WITHDRAWAL_THRESHOLD_NOT_MET = 'WITHDRAWAL_THRESHOLD_NOT_MET',
    EMERGENCY_NOT_DECLARED = 'EMERGENCY_NOT_DECLARED',
    REENTRANCY = 'REENTRANCY',

    // Network errors
    RPC_ERROR = 'RPC_ERROR',
    TIMEOUT = 'TIMEOUT',
    NONCE_TOO_LOW = 'NONCE_TOO_LOW',
    INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
    GAS_ESTIMATION_FAILED = 'GAS_ESTIMATION_FAILED',
    NETWORK_MISMATCH = 'NETWORK_MISMATCH',

    // Validation errors
    INVALID_ADDRESS = 'INVALID_ADDRESS',
    INVALID_AMOUNT = 'INVALID_AMOUNT',
    MISSING_PARAMETER = 'MISSING_PARAMETER',
    INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',

    // Provider errors
    PROVIDER_NOT_CONFIGURED = 'PROVIDER_NOT_CONFIGURED',
    SIGNER_REQUIRED = 'SIGNER_REQUIRED',

    // Unknown
    UNKNOWN = 'UNKNOWN',
}

/**
 * Suggested fixes for common errors
 */
const ERROR_SUGGESTIONS: Record<ErrorCode, string> = {
    [ErrorCode.NOT_VERIFIED]:
        'Ensure the address is registered in the KYC registry. Use kycModule.updateRegistry() to add the investor.',
    [ErrorCode.KYC_EXPIRED]:
        'The KYC verification has expired. Update the investor expiry using kycModule.updateRegistry().',
    [ErrorCode.TRANSFER_RESTRICTED]:
        'Check compliance requirements using complianceModule.checkTransferEligibility() before attempting transfer.',
    [ErrorCode.TOKENS_PAUSED]:
        'Token transfers are currently paused. Contact the token issuer or wait for tokens to be unpaused.',
    [ErrorCode.UNAUTHORIZED]:
        'The connected account does not have the required role. Ensure you are using the correct signer.',
    [ErrorCode.INSUFFICIENT_BALANCE]:
        'The account does not have enough tokens. Check balance using tokenInstance.balanceOf().',
    [ErrorCode.INVALID_RECIPIENT]:
        'The recipient address is invalid or the zero address. Verify the address format.',
    [ErrorCode.CLAIM_WINDOW_EXPIRED]:
        'The claim window for this distribution has expired. Unclaimed funds may have been handled.',
    [ErrorCode.ALREADY_CLAIMED]:
        'This distribution has already been claimed by this account.',
    [ErrorCode.WITHDRAWAL_THRESHOLD_NOT_MET]:
        'Not enough signers have approved this withdrawal. Additional approvals are required.',
    [ErrorCode.EMERGENCY_NOT_DECLARED]:
        'Emergency mode must be declared before emergency withdrawals can be executed.',
    [ErrorCode.REENTRANCY]:
        'Reentrancy detected. This is a security measure. Do not call vault functions from within callbacks.',
    [ErrorCode.RPC_ERROR]:
        'Failed to connect to the RPC endpoint. Check your network configuration and try again.',
    [ErrorCode.TIMEOUT]:
        'The request timed out. The network may be congested. Try again with higher gas price.',
    [ErrorCode.NONCE_TOO_LOW]:
        'Transaction nonce is too low. A pending transaction may exist. Wait for it to confirm or increase nonce.',
    [ErrorCode.INSUFFICIENT_FUNDS]:
        'Insufficient funds for gas. Ensure the account has enough native tokens (MNT) for transaction fees.',
    [ErrorCode.GAS_ESTIMATION_FAILED]:
        'Gas estimation failed. The transaction may revert. Check parameters and try again.',
    [ErrorCode.NETWORK_MISMATCH]:
        'Connected to wrong network. Ensure your wallet is connected to the correct chain.',
    [ErrorCode.INVALID_ADDRESS]:
        'The provided address is not a valid Ethereum address. Check the format (0x followed by 40 hex characters).',
    [ErrorCode.INVALID_AMOUNT]:
        'The amount is invalid. Ensure it is a positive number and properly formatted.',
    [ErrorCode.MISSING_PARAMETER]:
        'A required parameter is missing. Check the function documentation for required parameters.',
    [ErrorCode.INVALID_CONFIGURATION]:
        'The configuration is invalid. Review the configuration object and ensure all required fields are set.',
    [ErrorCode.PROVIDER_NOT_CONFIGURED]:
        'No provider is configured. Initialize RWAClient with a network configuration or provider.',
    [ErrorCode.SIGNER_REQUIRED]:
        'A signer is required for this operation. Provide a private key or signer in the client configuration.',
    [ErrorCode.UNKNOWN]:
        'An unknown error occurred. Check the error details for more information.',
};

/**
 * Base error class for RWA SDK errors
 */
export class RWAError extends Error {
    readonly code: ErrorCode;
    readonly suggestion: string;
    readonly details?: Record<string, unknown>;

    constructor(
        code: ErrorCode,
        message: string,
        details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'RWAError';
        this.code = code;
        this.suggestion = ERROR_SUGGESTIONS[code] || ERROR_SUGGESTIONS[ErrorCode.UNKNOWN];
        this.details = details;

        // Maintains proper stack trace for where error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, RWAError);
        }
    }

    /**
     * Get a formatted error message including suggestion
     */
    toFormattedString(): string {
        let result = `[${this.code}] ${this.message}`;
        result += `\n\nSuggested fix: ${this.suggestion}`;
        if (this.details) {
            result += `\n\nDetails: ${JSON.stringify(this.details, null, 2)}`;
        }
        return result;
    }
}

/**
 * Error class for contract-related errors
 */
export class ContractError extends RWAError {
    readonly contractAddress: string;
    readonly functionName: string;
    readonly revertReason?: string;

    constructor(
        code: ErrorCode,
        message: string,
        contractAddress: string,
        functionName: string,
        revertReason?: string,
        details?: Record<string, unknown>
    ) {
        super(code, message, details);
        this.name = 'ContractError';
        this.contractAddress = contractAddress;
        this.functionName = functionName;
        this.revertReason = revertReason;
    }
}

/**
 * Error class for network-related errors
 */
export class NetworkError extends RWAError {
    readonly chainId?: number;
    readonly rpcUrl?: string;
    readonly retryable: boolean;

    constructor(
        code: ErrorCode,
        message: string,
        retryable: boolean,
        chainId?: number,
        rpcUrl?: string,
        details?: Record<string, unknown>
    ) {
        super(code, message, details);
        this.name = 'NetworkError';
        this.chainId = chainId;
        this.rpcUrl = rpcUrl;
        this.retryable = retryable;
    }
}

/**
 * Error class for validation errors
 */
export class ValidationError extends RWAError {
    readonly field: string;
    readonly constraint: string;
    readonly value: unknown;

    constructor(
        code: ErrorCode,
        message: string,
        field: string,
        constraint: string,
        value: unknown,
        details?: Record<string, unknown>
    ) {
        super(code, message, details);
        this.name = 'ValidationError';
        this.field = field;
        this.constraint = constraint;
        this.value = value;
    }
}

/**
 * Parse a contract revert reason and return the appropriate error
 */
export function parseContractError(
    error: unknown,
    contractAddress: string,
    functionName: string
): ContractError {
    const errorObj = error as { reason?: string; message?: string; data?: string };
    const reason = errorObj.reason || errorObj.message || 'Unknown contract error';

    // Map common revert reasons to error codes
    let code = ErrorCode.UNKNOWN;
    if (reason.includes('NotVerified') || reason.includes('not verified')) {
        code = ErrorCode.NOT_VERIFIED;
    } else if (reason.includes('KYCExpired') || reason.includes('expired')) {
        code = ErrorCode.KYC_EXPIRED;
    } else if (reason.includes('TransferRestricted') || reason.includes('restricted')) {
        code = ErrorCode.TRANSFER_RESTRICTED;
    } else if (reason.includes('Paused') || reason.includes('paused')) {
        code = ErrorCode.TOKENS_PAUSED;
    } else if (reason.includes('AccessControl') || reason.includes('unauthorized') || reason.includes('Ownable')) {
        code = ErrorCode.UNAUTHORIZED;
    } else if (reason.includes('insufficient') || reason.includes('balance')) {
        code = ErrorCode.INSUFFICIENT_BALANCE;
    } else if (reason.includes('ClaimWindowExpired')) {
        code = ErrorCode.CLAIM_WINDOW_EXPIRED;
    } else if (reason.includes('AlreadyClaimed')) {
        code = ErrorCode.ALREADY_CLAIMED;
    } else if (reason.includes('ReentrancyGuard')) {
        code = ErrorCode.REENTRANCY;
    }

    return new ContractError(
        code,
        `Contract call failed: ${reason}`,
        contractAddress,
        functionName,
        reason,
        { originalError: errorObj.message }
    );
}

/**
 * Parse a network error and return the appropriate error
 */
export function parseNetworkError(
    error: unknown,
    chainId?: number,
    rpcUrl?: string
): NetworkError {
    const errorObj = error as { code?: string; message?: string };
    const message = errorObj.message || 'Unknown network error';

    let code = ErrorCode.RPC_ERROR;
    let retryable = true;

    if (message.includes('nonce') && message.includes('low')) {
        code = ErrorCode.NONCE_TOO_LOW;
        retryable = true;
    } else if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
        code = ErrorCode.TIMEOUT;
        retryable = true;
    } else if (message.includes('insufficient funds')) {
        code = ErrorCode.INSUFFICIENT_FUNDS;
        retryable = false;
    } else if (message.includes('gas')) {
        code = ErrorCode.GAS_ESTIMATION_FAILED;
        retryable = false;
    }

    return new NetworkError(
        code,
        `Network error: ${message}`,
        retryable,
        chainId,
        rpcUrl,
        { originalError: message }
    );
}
