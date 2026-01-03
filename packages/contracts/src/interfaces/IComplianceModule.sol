// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IComplianceModule
 * @notice Interface for compliance modules that can be attached to RWA tokens
 * @dev Compliance modules implement transfer restrictions based on various rules
 */
interface IComplianceModule {
    /**
     * @notice Check if a transfer is compliant with this module's rules
     * @param from The sender address
     * @param to The recipient address
     * @param amount The transfer amount
     * @return compliant Whether the transfer is compliant
     * @return reason The reason if not compliant
     */
    function checkCompliance(
        address from,
        address to,
        uint256 amount
    ) external view returns (bool compliant, string memory reason);

    /**
     * @notice Get the name of this compliance module
     * @return The module name
     */
    function moduleName() external view returns (string memory);

    /**
     * @notice Called after a successful transfer to update module state
     * @param from The sender address
     * @param to The recipient address
     * @param amount The transfer amount
     */
    function onTransfer(address from, address to, uint256 amount) external;
}
