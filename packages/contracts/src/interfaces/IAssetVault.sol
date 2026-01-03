// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAssetVault
 * @notice Interface for the Asset Vault contract that manages collateral custody
 * @dev Implements multi-signature approval for withdrawals above threshold
 */
interface IAssetVault {
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when assets are deposited
    /// @param token The token address (address(0) for ETH)
    /// @param amount The deposit amount
    /// @param depositor The depositor address
    event Deposited(address indexed token, uint256 amount, address indexed depositor);

    /// @notice Emitted when assets are withdrawn
    /// @param token The token address (address(0) for ETH)
    /// @param amount The withdrawal amount
    /// @param recipient The recipient address
    event Withdrawn(address indexed token, uint256 amount, address indexed recipient);

    /// @notice Emitted during emergency withdrawal
    /// @param token The token address
    /// @param amount The withdrawal amount
    /// @param recipient The recipient address
    event EmergencyWithdrawal(address indexed token, uint256 amount, address indexed recipient);

    /// @notice Emitted when a signer is added
    /// @param signer The new signer address
    event SignerAdded(address indexed signer);

    /// @notice Emitted when a signer is removed
    /// @param signer The removed signer address
    event SignerRemoved(address indexed signer);

    /// @notice Emitted when the approval threshold is updated
    /// @param newThreshold The new threshold value
    event ThresholdUpdated(uint256 newThreshold);

    /// @notice Emitted when a withdrawal is proposed
    /// @param proposalId The proposal ID
    /// @param token The token address
    /// @param amount The withdrawal amount
    /// @param recipient The recipient address
    event WithdrawalProposed(uint256 indexed proposalId, address indexed token, uint256 amount, address recipient);

    /// @notice Emitted when a withdrawal is approved
    /// @param proposalId The proposal ID
    /// @param approver The approver address
    event WithdrawalApproved(uint256 indexed proposalId, address indexed approver);

    /// @notice Emitted when emergency mode is declared
    /// @param declaredBy The address that declared emergency
    event EmergencyDeclared(address indexed declaredBy);

    /// @notice Emitted when emergency mode is resolved
    /// @param resolvedBy The address that resolved emergency
    event EmergencyResolved(address indexed resolvedBy);

    /*//////////////////////////////////////////////////////////////
                            DEPOSIT FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposit ERC20 tokens into the vault
     * @param token The token address
     * @param amount The amount to deposit
     */
    function deposit(address token, uint256 amount) external;

    /**
     * @notice Deposit ETH into the vault
     */
    function depositETH() external payable;

    /*//////////////////////////////////////////////////////////////
                        WITHDRAWAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Propose a withdrawal (requires multi-sig approval if above threshold)
     * @param token The token address (address(0) for ETH)
     * @param amount The withdrawal amount
     * @param recipient The recipient address
     * @return proposalId The ID of the created proposal
     */
    function proposeWithdrawal(address token, uint256 amount, address recipient) external returns (uint256 proposalId);

    /**
     * @notice Approve a withdrawal proposal
     * @param proposalId The proposal ID to approve
     */
    function approveWithdrawal(uint256 proposalId) external;

    /**
     * @notice Execute a withdrawal proposal after sufficient approvals
     * @param proposalId The proposal ID to execute
     */
    function executeWithdrawal(uint256 proposalId) external;

    /*//////////////////////////////////////////////////////////////
                        EMERGENCY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Declare emergency mode
     */
    function declareEmergency() external;

    /**
     * @notice Resolve emergency mode
     */
    function resolveEmergency() external;

    /**
     * @notice Emergency withdrawal (only in emergency mode)
     * @param token The token address
     * @param recipient The recipient address
     */
    function emergencyWithdraw(address token, address recipient) external;

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get the collateralization ratio
     * @return The ratio as a percentage (100 = 100%)
     */
    function getCollateralizationRatio() external view returns (uint256);

    /**
     * @notice Get the balance of a specific asset
     * @param token The token address (address(0) for ETH)
     * @return The balance
     */
    function getAssetBalance(address token) external view returns (uint256);

    /**
     * @notice Check if backing is verified (collateralization >= 100%)
     * @return True if backing is verified
     */
    function isBackingVerified() external view returns (bool);

    /**
     * @notice Check if emergency mode is active
     * @return True if in emergency mode
     */
    function isEmergency() external view returns (bool);
}
