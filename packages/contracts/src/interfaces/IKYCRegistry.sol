// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IKYCRegistry
 * @notice Interface for the KYC Registry contract that manages investor verification status
 * @dev Stores only hashes of identity data, not personally identifiable information
 */
interface IKYCRegistry {
    /// @notice Accreditation tiers for investors
    enum AccreditationTier {
        None,
        Retail,
        Accredited,
        Institutional
    }

    /// @notice Emitted when an investor is verified and added to the whitelist
    /// @param investor The address of the verified investor
    /// @param tier The accreditation tier assigned
    /// @param expiry The timestamp when the verification expires
    event InvestorVerified(address indexed investor, AccreditationTier tier, uint256 expiry);

    /// @notice Emitted when an investor is removed from the whitelist
    /// @param investor The address of the removed investor
    event InvestorRemoved(address indexed investor);

    /// @notice Emitted when an investor's information is updated
    /// @param investor The address of the updated investor
    /// @param newTier The new accreditation tier
    /// @param newExpiry The new expiry timestamp
    event InvestorUpdated(address indexed investor, AccreditationTier newTier, uint256 newExpiry);

    /**
     * @notice Add a new investor to the whitelist
     * @param investor The address of the investor to add
     * @param tier The accreditation tier to assign
     * @param expiryTimestamp The timestamp when the verification expires
     * @param identityHash The keccak256 hash of the investor's identity data
     */
    function addInvestor(
        address investor,
        AccreditationTier tier,
        uint256 expiryTimestamp,
        bytes32 identityHash
    ) external;

    /**
     * @notice Update an existing investor's information
     * @param investor The address of the investor to update
     * @param tier The new accreditation tier
     * @param expiryTimestamp The new expiry timestamp
     */
    function updateInvestor(address investor, AccreditationTier tier, uint256 expiryTimestamp) external;

    /**
     * @notice Remove an investor from the whitelist
     * @param investor The address of the investor to remove
     */
    function removeInvestor(address investor) external;

    /**
     * @notice Add multiple investors in a single transaction
     * @param investors Array of investor addresses
     * @param tiers Array of accreditation tiers
     * @param expiries Array of expiry timestamps
     * @param identityHashes Array of identity hashes
     */
    function batchAddInvestors(
        address[] calldata investors,
        AccreditationTier[] calldata tiers,
        uint256[] calldata expiries,
        bytes32[] calldata identityHashes
    ) external;

    /**
     * @notice Check if an investor is verified (whitelisted and not expired)
     * @param investor The address to check
     * @return True if the investor is verified and not expired
     */
    function isVerified(address investor) external view returns (bool);

    /**
     * @notice Get detailed information about an investor
     * @param investor The address to query
     * @return verified Whether the investor is in the whitelist
     * @return tier The investor's accreditation tier
     * @return expiry The verification expiry timestamp
     * @return identityHash The stored identity hash
     */
    function getInvestorInfo(address investor)
        external
        view
        returns (bool verified, AccreditationTier tier, uint256 expiry, bytes32 identityHash);

    /**
     * @notice Check if an investor has accredited or institutional status
     * @param investor The address to check
     * @return True if the investor is Accredited or Institutional tier
     */
    function isAccredited(address investor) external view returns (bool);
}
