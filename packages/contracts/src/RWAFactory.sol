// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {IRWAFactory} from "./interfaces/IRWAFactory.sol";
import {IKYCRegistry} from "./interfaces/IKYCRegistry.sol";
import {RWAToken} from "./RWAToken.sol";
import {AssetVault} from "./AssetVault.sol";
import {YieldDistributor} from "./YieldDistributor.sol";
import {KYCRegistry} from "./KYCRegistry.sol";

/**
 * @title RWAFactory
 * @notice Factory contract for deploying complete RWA tokenization infrastructure
 * @dev Deploys all contracts using UUPS proxy pattern for upgradeability
 *
 * Key features:
 * - One-click deployment: Deploy all contracts in a single transaction
 * - UUPS proxies: All contracts are upgradeable
 * - Access control: Proper role configuration between contracts
 * - Event emission: Detailed deployment events
 */
contract RWAFactory is Initializable, AccessControlUpgradeable, UUPSUpgradeable, IRWAFactory {
    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Role for factory operators
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice Role for contract upgraders
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Implementation addresses for each contract type
    address public tokenImplementation;
    address public vaultImplementation;
    address public yieldDistributorImplementation;
    address public kycRegistryImplementation;

    /// @notice Mapping of deployer to their deployed systems
    mapping(address => DeployedContracts[]) public deployments;

    /// @notice Total number of deployments
    uint256 public totalDeployments;

    /// @notice Gap for future storage variables
    uint256[45] private __gap;

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidAddress();
    error InvalidConfig();
    error ImplementationNotSet();
    error NotAuthorized();

    /*//////////////////////////////////////////////////////////////
                            INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the RWA Factory
     * @param admin The address to grant admin roles
     */
    function initialize(address admin) external initializer {
        if (admin == address(0)) revert InvalidAddress();

        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);

        // Deploy implementation contracts
        tokenImplementation = address(new RWAToken());
        vaultImplementation = address(new AssetVault());
        yieldDistributorImplementation = address(new YieldDistributor());
        kycRegistryImplementation = address(new KYCRegistry());
    }

    /*//////////////////////////////////////////////////////////////
                        DEPLOYMENT FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IRWAFactory
    function deploy(DeploymentConfig calldata config) external returns (DeployedContracts memory contracts) {
        _validateConfig(config);

        address deployer = msg.sender;

        // 1. Deploy KYC Registry
        contracts.kycRegistry = _deployKYCRegistry(deployer);

        // 2. Deploy RWA Token with KYC Registry
        contracts.token = _deployToken(config, deployer, contracts.kycRegistry);

        // 3. Deploy Asset Vault
        contracts.vault = _deployVault(config, deployer);

        // 4. Deploy Yield Distributor
        contracts.yieldDistributor = _deployYieldDistributor(config, deployer, contracts.token);

        // 5. Configure access control relationships
        _configureAccessControl(contracts, deployer, config);

        // Store deployment
        deployments[deployer].push(contracts);
        totalDeployments++;

        emit RWASystemDeployed(
            deployer,
            contracts.token,
            contracts.vault,
            contracts.yieldDistributor,
            contracts.kycRegistry
        );
    }

    /*//////////////////////////////////////////////////////////////
                        UPGRADE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IRWAFactory
    function upgradeToken(address proxy, address newImplementation) external onlyRole(UPGRADER_ROLE) {
        if (proxy == address(0) || newImplementation == address(0)) revert InvalidAddress();
        RWAToken(proxy).upgradeToAndCall(newImplementation, "");
    }

    /// @inheritdoc IRWAFactory
    function upgradeVault(address proxy, address newImplementation) external onlyRole(UPGRADER_ROLE) {
        if (proxy == address(0) || newImplementation == address(0)) revert InvalidAddress();
        AssetVault(payable(proxy)).upgradeToAndCall(newImplementation, "");
    }

    /// @inheritdoc IRWAFactory
    function upgradeYieldDistributor(address proxy, address newImplementation) external onlyRole(UPGRADER_ROLE) {
        if (proxy == address(0) || newImplementation == address(0)) revert InvalidAddress();
        YieldDistributor(proxy).upgradeToAndCall(newImplementation, "");
    }

    /// @inheritdoc IRWAFactory
    function upgradeKYCRegistry(address proxy, address newImplementation) external onlyRole(UPGRADER_ROLE) {
        if (proxy == address(0) || newImplementation == address(0)) revert InvalidAddress();
        KYCRegistry(proxy).upgradeToAndCall(newImplementation, "");
    }

    /*//////////////////////////////////////////////////////////////
                        IMPLEMENTATION MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Update the token implementation address
     * @param newImplementation The new implementation address
     */
    function setTokenImplementation(address newImplementation) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newImplementation == address(0)) revert InvalidAddress();
        tokenImplementation = newImplementation;
    }

    /**
     * @notice Update the vault implementation address
     * @param newImplementation The new implementation address
     */
    function setVaultImplementation(address newImplementation) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newImplementation == address(0)) revert InvalidAddress();
        vaultImplementation = newImplementation;
    }

    /**
     * @notice Update the yield distributor implementation address
     * @param newImplementation The new implementation address
     */
    function setYieldDistributorImplementation(address newImplementation) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newImplementation == address(0)) revert InvalidAddress();
        yieldDistributorImplementation = newImplementation;
    }

    /**
     * @notice Update the KYC registry implementation address
     * @param newImplementation The new implementation address
     */
    function setKYCRegistryImplementation(address newImplementation) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newImplementation == address(0)) revert InvalidAddress();
        kycRegistryImplementation = newImplementation;
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get all deployments for an address
     * @param deployer The deployer address
     * @return Array of deployed contract addresses
     */
    function getDeployments(address deployer) external view returns (DeployedContracts[] memory) {
        return deployments[deployer];
    }

    /**
     * @notice Get the number of deployments for an address
     * @param deployer The deployer address
     * @return The number of deployments
     */
    function getDeploymentCount(address deployer) external view returns (uint256) {
        return deployments[deployer].length;
    }

    /*//////////////////////////////////////////////////////////////
                            INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _validateConfig(DeploymentConfig calldata config) internal pure {
        if (bytes(config.tokenName).length == 0) revert InvalidConfig();
        if (bytes(config.tokenSymbol).length == 0) revert InvalidConfig();
        if (config.vaultSigners.length == 0) revert InvalidConfig();
        if (config.vaultThreshold == 0) revert InvalidConfig();
        if (config.vaultThreshold > config.vaultSigners.length) revert InvalidConfig();
    }

    function _deployKYCRegistry(address deployer) internal returns (address) {
        if (kycRegistryImplementation == address(0)) revert ImplementationNotSet();

        // Initialize with factory as admin temporarily
        bytes memory initData = abi.encodeWithSelector(KYCRegistry.initialize.selector, address(this));

        ERC1967Proxy proxy = new ERC1967Proxy(kycRegistryImplementation, initData);
        
        // Grant deployer all roles
        KYCRegistry registry = KYCRegistry(address(proxy));
        registry.grantRole(registry.DEFAULT_ADMIN_ROLE(), deployer);
        registry.grantRole(registry.KYC_ADMIN_ROLE(), deployer);
        registry.grantRole(registry.UPGRADER_ROLE(), deployer);
        
        return address(proxy);
    }

    function _deployToken(
        DeploymentConfig calldata config,
        address deployer,
        address kycRegistry
    ) internal returns (address) {
        if (tokenImplementation == address(0)) revert ImplementationNotSet();

        // Initialize with factory as admin temporarily for configuration
        bytes memory initData = abi.encodeWithSelector(
            RWAToken.initialize.selector,
            config.tokenName,
            config.tokenSymbol,
            address(this), // Factory is admin temporarily
            kycRegistry
        );

        ERC1967Proxy proxy = new ERC1967Proxy(tokenImplementation, initData);
        
        // Grant deployer all roles
        RWAToken token = RWAToken(address(proxy));
        token.grantRole(token.DEFAULT_ADMIN_ROLE(), deployer);
        token.grantRole(token.ISSUER_ROLE(), deployer);
        token.grantRole(token.COMPLIANCE_OFFICER_ROLE(), deployer);
        token.grantRole(token.UPGRADER_ROLE(), deployer);
        
        return address(proxy);
    }

    function _deployVault(DeploymentConfig calldata config, address deployer) internal returns (address) {
        if (vaultImplementation == address(0)) revert ImplementationNotSet();

        // Initialize with factory as admin temporarily
        bytes memory initData = abi.encodeWithSelector(
            AssetVault.initialize.selector,
            address(this), // Factory is admin temporarily
            config.vaultSigners,
            config.vaultThreshold,
            config.vaultWithdrawalThreshold
        );

        ERC1967Proxy proxy = new ERC1967Proxy(vaultImplementation, initData);
        
        // Grant deployer all roles
        AssetVault vault = AssetVault(payable(address(proxy)));
        vault.grantRole(vault.DEFAULT_ADMIN_ROLE(), deployer);
        vault.grantRole(vault.EMERGENCY_ROLE(), deployer);
        vault.grantRole(vault.UPGRADER_ROLE(), deployer);
        
        return address(proxy);
    }

    function _deployYieldDistributor(
        DeploymentConfig calldata config,
        address deployer,
        address token
    ) internal returns (address) {
        if (yieldDistributorImplementation == address(0)) revert ImplementationNotSet();

        // Initialize with factory as admin temporarily
        bytes memory initData = abi.encodeWithSelector(YieldDistributor.initialize.selector, address(this), token, deployer);

        ERC1967Proxy proxy = new ERC1967Proxy(yieldDistributorImplementation, initData);
        
        // Grant deployer all roles
        YieldDistributor dist = YieldDistributor(address(proxy));
        dist.grantRole(dist.DEFAULT_ADMIN_ROLE(), deployer);
        dist.grantRole(dist.DISTRIBUTOR_ROLE(), deployer);
        dist.grantRole(dist.UPGRADER_ROLE(), deployer);
        
        return address(proxy);
    }

    function _configureAccessControl(
        DeployedContracts memory contracts,
        address deployer,
        DeploymentConfig calldata config
    ) internal {
        RWAToken token = RWAToken(contracts.token);

        // Add compliance modules to token (factory has COMPLIANCE_OFFICER_ROLE)
        for (uint256 i = 0; i < config.complianceModules.length; ) {
            if (config.complianceModules[i] != address(0)) {
                token.addComplianceModule(config.complianceModules[i]);
            }
            unchecked {
                ++i;
            }
        }

        // Grant yield distributor the issuer role for snapshots
        token.grantRole(token.ISSUER_ROLE(), contracts.yieldDistributor);

        // Link vault to token for collateralization tracking
        AssetVault vault = AssetVault(payable(contracts.vault));
        vault.setRWAToken(contracts.token);

        // Mint initial supply if specified
        if (config.initialSupply > 0) {
            // Deployer needs to be KYC verified first
            KYCRegistry registry = KYCRegistry(contracts.kycRegistry);
            registry.addInvestor(
                deployer,
                IKYCRegistry.AccreditationTier.Institutional,
                block.timestamp + 365 days,
                keccak256(abi.encodePacked(deployer, "factory-deploy"))
            );

            token.mint(deployer, config.initialSupply);
        }
        
        // Renounce factory's admin roles after configuration
        token.renounceRole(token.DEFAULT_ADMIN_ROLE(), address(this));
        token.renounceRole(token.ISSUER_ROLE(), address(this));
        token.renounceRole(token.COMPLIANCE_OFFICER_ROLE(), address(this));
        token.renounceRole(token.UPGRADER_ROLE(), address(this));
        
        vault.renounceRole(vault.DEFAULT_ADMIN_ROLE(), address(this));
        vault.renounceRole(vault.EMERGENCY_ROLE(), address(this));
        vault.renounceRole(vault.UPGRADER_ROLE(), address(this));
        
        YieldDistributor dist = YieldDistributor(contracts.yieldDistributor);
        dist.renounceRole(dist.DEFAULT_ADMIN_ROLE(), address(this));
        dist.renounceRole(dist.DISTRIBUTOR_ROLE(), address(this));
        dist.renounceRole(dist.UPGRADER_ROLE(), address(this));
        
        KYCRegistry kyc = KYCRegistry(contracts.kycRegistry);
        kyc.renounceRole(kyc.DEFAULT_ADMIN_ROLE(), address(this));
        kyc.renounceRole(kyc.KYC_ADMIN_ROLE(), address(this));
        kyc.renounceRole(kyc.UPGRADER_ROLE(), address(this));
    }

    /**
     * @dev Required override for UUPS upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
