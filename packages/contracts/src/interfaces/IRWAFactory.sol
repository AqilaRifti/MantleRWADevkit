// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRWAFactory
 * @notice Interface for the RWA Factory contract that deploys complete RWA infrastructure
 * @dev Deploys RWAToken, AssetVault, YieldDistributor, and KYCRegistry in a single transaction
 */
interface IRWAFactory {
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Configuration for deploying a new RWA system
    struct DeploymentConfig {
        string tokenName;
        string tokenSymbol;
        uint256 initialSupply;
        address[] complianceModules;
        uint256 yieldClaimWindowDays;
        address[] vaultSigners;
        uint256 vaultThreshold;
        uint256 vaultWithdrawalThreshold;
    }

    /// @notice Addresses of deployed contracts
    struct DeployedContracts {
        address token;
        address vault;
        address yieldDistributor;
        address kycRegistry;
    }

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a new RWA system is deployed
    /// @param deployer The address that initiated the deployment
    /// @param token The deployed RWA token address
    /// @param vault The deployed Asset Vault address
    /// @param yieldDistributor The deployed Yield Distributor address
    /// @param kycRegistry The deployed KYC Registry address
    event RWASystemDeployed(
        address indexed deployer,
        address token,
        address vault,
        address yieldDistributor,
        address kycRegistry
    );

    /*//////////////////////////////////////////////////////////////
                        DEPLOYMENT FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deploy a complete RWA infrastructure
     * @param config The deployment configuration
     * @return contracts The addresses of all deployed contracts
     */
    function deploy(DeploymentConfig calldata config) external returns (DeployedContracts memory contracts);

    /*//////////////////////////////////////////////////////////////
                        UPGRADE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Upgrade a token proxy to a new implementation
     * @param proxy The proxy address
     * @param newImplementation The new implementation address
     */
    function upgradeToken(address proxy, address newImplementation) external;

    /**
     * @notice Upgrade a vault proxy to a new implementation
     * @param proxy The proxy address
     * @param newImplementation The new implementation address
     */
    function upgradeVault(address proxy, address newImplementation) external;

    /**
     * @notice Upgrade a yield distributor proxy to a new implementation
     * @param proxy The proxy address
     * @param newImplementation The new implementation address
     */
    function upgradeYieldDistributor(address proxy, address newImplementation) external;

    /**
     * @notice Upgrade a KYC registry proxy to a new implementation
     * @param proxy The proxy address
     * @param newImplementation The new implementation address
     */
    function upgradeKYCRegistry(address proxy, address newImplementation) external;
}
