// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRWAToken
 * @notice Interface for the RWA Token contract implementing ERC-3643 compliance
 * @dev Security token with transfer restrictions based on KYC verification
 */
interface IRWAToken {
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a transfer is restricted due to compliance failure
    /// @param from The sender address
    /// @param to The recipient address
    /// @param amount The transfer amount
    /// @param reason The reason for restriction
    event TransferRestricted(address indexed from, address indexed to, uint256 amount, string reason);

    /// @notice Emitted when a compliance module is added or removed
    /// @param module The compliance module address
    /// @param enabled Whether the module is enabled
    event ComplianceModuleUpdated(address indexed module, bool enabled);

    /// @notice Emitted when tokens are paused
    /// @param by The address that triggered the pause
    event TokensPaused(address indexed by);

    /// @notice Emitted when tokens are unpaused
    /// @param by The address that triggered the unpause
    event TokensUnpaused(address indexed by);

    /// @notice Emitted when the KYC registry is updated
    /// @param oldRegistry The previous registry address
    /// @param newRegistry The new registry address
    event KYCRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);

    /*//////////////////////////////////////////////////////////////
                            COMPLIANCE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Set the KYC registry contract address
     * @param registry The address of the KYC registry
     */
    function setKYCRegistry(address registry) external;

    /**
     * @notice Add a compliance module
     * @param module The address of the compliance module to add
     */
    function addComplianceModule(address module) external;

    /**
     * @notice Remove a compliance module
     * @param module The address of the compliance module to remove
     */
    function removeComplianceModule(address module) external;

    /**
     * @notice Check if a transfer is allowed
     * @param from The sender address
     * @param to The recipient address
     * @param amount The transfer amount
     * @return allowed Whether the transfer is allowed
     * @return reason The reason if not allowed
     */
    function isTransferAllowed(
        address from,
        address to,
        uint256 amount
    ) external view returns (bool allowed, string memory reason);

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mint new tokens to an address
     * @param to The recipient address
     * @param amount The amount to mint
     */
    function mint(address to, uint256 amount) external;

    /**
     * @notice Burn tokens from an address
     * @param from The address to burn from
     * @param amount The amount to burn
     */
    function burn(address from, uint256 amount) external;

    /**
     * @notice Pause all token transfers
     */
    function pause() external;

    /**
     * @notice Unpause token transfers
     */
    function unpause() external;

    /*//////////////////////////////////////////////////////////////
                            ROLE MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Grant issuer role to an account
     * @param account The account to grant the role to
     */
    function grantIssuerRole(address account) external;

    /**
     * @notice Grant compliance officer role to an account
     * @param account The account to grant the role to
     */
    function grantComplianceOfficerRole(address account) external;

    /**
     * @notice Revoke issuer role from an account
     * @param account The account to revoke the role from
     */
    function revokeIssuerRole(address account) external;

    /**
     * @notice Revoke compliance officer role from an account
     * @param account The account to revoke the role from
     */
    function revokeComplianceOfficerRole(address account) external;

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get the KYC registry address
     * @return The KYC registry contract address
     */
    function kycRegistry() external view returns (address);

    /**
     * @notice Check if an address is a compliance module
     * @param module The address to check
     * @return True if the address is an active compliance module
     */
    function isComplianceModule(address module) external view returns (bool);

    /**
     * @notice Get all active compliance modules
     * @return Array of compliance module addresses
     */
    function getComplianceModules() external view returns (address[] memory);
}
