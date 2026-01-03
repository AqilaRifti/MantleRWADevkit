// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IYieldDistributor
 * @notice Interface for the Yield Distributor contract that handles dividend payments
 * @dev Uses ERC-20 snapshot functionality for proportional distribution
 */
interface IYieldDistributor {
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a new distribution is created
    /// @param distributionId The distribution ID
    /// @param paymentToken The payment token address
    /// @param totalAmount The total distribution amount
    /// @param snapshotId The snapshot ID used for balance calculation
    event DistributionCreated(
        uint256 indexed distributionId,
        address indexed paymentToken,
        uint256 totalAmount,
        uint256 snapshotId
    );

    /// @notice Emitted when yield is claimed
    /// @param distributionId The distribution ID
    /// @param claimant The claimant address
    /// @param amount The claimed amount
    event YieldClaimed(uint256 indexed distributionId, address indexed claimant, uint256 amount);

    /// @notice Emitted when unclaimed funds are handled
    /// @param distributionId The distribution ID
    /// @param amount The unclaimed amount
    /// @param recipient The recipient of unclaimed funds
    event UnclaimedFundsHandled(uint256 indexed distributionId, uint256 amount, address indexed recipient);

    /*//////////////////////////////////////////////////////////////
                        DISTRIBUTION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Create a new yield distribution
     * @param paymentToken The token to distribute (USDC, USDT, MNT, etc.)
     * @param totalAmount The total amount to distribute
     * @param claimWindowDays Number of days the claim window is open
     * @return distributionId The ID of the created distribution
     */
    function createDistribution(
        address paymentToken,
        uint256 totalAmount,
        uint256 claimWindowDays
    ) external returns (uint256 distributionId);

    /**
     * @notice Claim yield from a specific distribution
     * @param distributionId The distribution ID to claim from
     */
    function claim(uint256 distributionId) external;

    /**
     * @notice Claim yield from multiple distributions
     * @param distributionIds Array of distribution IDs to claim from
     */
    function claimMultiple(uint256[] calldata distributionIds) external;

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Handle unclaimed funds after claim window expires
     * @param distributionId The distribution ID
     */
    function handleUnclaimedFunds(uint256 distributionId) external;

    /**
     * @notice Set the recipient for unclaimed funds
     * @param recipient The new recipient address
     */
    function setUnclaimedFundsRecipient(address recipient) external;

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get the claimable amount for an account
     * @param distributionId The distribution ID
     * @param account The account to check
     * @return The claimable amount
     */
    function getClaimableAmount(uint256 distributionId, address account) external view returns (uint256);

    /**
     * @notice Get distribution information
     * @param distributionId The distribution ID
     * @return paymentToken The payment token address
     * @return totalAmount The total distribution amount
     * @return snapshotId The snapshot ID
     * @return claimDeadline The claim deadline timestamp
     * @return claimedAmount The amount already claimed
     */
    function getDistributionInfo(uint256 distributionId)
        external
        view
        returns (
            address paymentToken,
            uint256 totalAmount,
            uint256 snapshotId,
            uint256 claimDeadline,
            uint256 claimedAmount
        );

    /**
     * @notice Check if an account has claimed from a distribution
     * @param distributionId The distribution ID
     * @param account The account to check
     * @return True if the account has claimed
     */
    function hasClaimed(uint256 distributionId, address account) external view returns (bool);
}
