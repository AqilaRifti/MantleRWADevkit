// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {RWAFactory} from "../../src/RWAFactory.sol";
import {RWAToken} from "../../src/RWAToken.sol";
import {AssetVault} from "../../src/AssetVault.sol";
import {YieldDistributor} from "../../src/YieldDistributor.sol";
import {KYCRegistry} from "../../src/KYCRegistry.sol";
import {IRWAFactory} from "../../src/interfaces/IRWAFactory.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title RWAFactory Unit Tests
 * @notice Unit tests for RWAFactory contract
 * @dev Requirements: 5.1, 5.4
 */
contract RWAFactoryTest is Test {
    RWAFactory public factory;
    address public admin;
    address public deployer;
    address public signer1;
    address public signer2;

    event RWASystemDeployed(
        address indexed deployer,
        address token,
        address vault,
        address yieldDistributor,
        address kycRegistry
    );

    function setUp() public {
        admin = makeAddr("admin");
        deployer = makeAddr("deployer");
        signer1 = makeAddr("signer1");
        signer2 = makeAddr("signer2");

        // Deploy factory
        RWAFactory factoryImpl = new RWAFactory();
        bytes memory initData = abi.encodeWithSelector(RWAFactory.initialize.selector, admin);
        ERC1967Proxy proxy = new ERC1967Proxy(address(factoryImpl), initData);
        factory = RWAFactory(address(proxy));
    }

    /*//////////////////////////////////////////////////////////////
                        INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Initialize() public view {
        assertTrue(factory.hasRole(factory.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(factory.hasRole(factory.OPERATOR_ROLE(), admin));
        assertTrue(factory.hasRole(factory.UPGRADER_ROLE(), admin));
        assertTrue(factory.tokenImplementation() != address(0));
        assertTrue(factory.vaultImplementation() != address(0));
        assertTrue(factory.yieldDistributorImplementation() != address(0));
        assertTrue(factory.kycRegistryImplementation() != address(0));
    }

    /*//////////////////////////////////////////////////////////////
                        DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Deploy() public {
        IRWAFactory.DeploymentConfig memory config = _createDefaultConfig();

        vm.expectEmit(true, false, false, false);
        emit RWASystemDeployed(deployer, address(0), address(0), address(0), address(0));

        vm.prank(deployer);
        IRWAFactory.DeployedContracts memory contracts = factory.deploy(config);

        // Verify all contracts deployed
        assertTrue(contracts.token != address(0), "Token should be deployed");
        assertTrue(contracts.vault != address(0), "Vault should be deployed");
        assertTrue(contracts.yieldDistributor != address(0), "Yield distributor should be deployed");
        assertTrue(contracts.kycRegistry != address(0), "KYC registry should be deployed");

        // Verify deployment tracking
        assertEq(factory.totalDeployments(), 1);
        assertEq(factory.getDeploymentCount(deployer), 1);

        IRWAFactory.DeployedContracts[] memory deployerContracts = factory.getDeployments(deployer);
        assertEq(deployerContracts.length, 1);
        assertEq(deployerContracts[0].token, contracts.token);
    }

    function test_Deploy_WithInitialSupply() public {
        IRWAFactory.DeploymentConfig memory config = _createDefaultConfig();
        config.initialSupply = 1_000_000 ether;

        vm.prank(deployer);
        IRWAFactory.DeployedContracts memory contracts = factory.deploy(config);

        RWAToken token = RWAToken(contracts.token);
        assertEq(token.totalSupply(), config.initialSupply);
        assertEq(token.balanceOf(deployer), config.initialSupply);

        // Deployer should be KYC verified
        KYCRegistry kyc = KYCRegistry(contracts.kycRegistry);
        assertTrue(kyc.isVerified(deployer));
    }

    function test_Deploy_WithComplianceModules() public {
        address module1 = makeAddr("module1");
        address module2 = makeAddr("module2");

        address[] memory modules = new address[](2);
        modules[0] = module1;
        modules[1] = module2;

        IRWAFactory.DeploymentConfig memory config = _createDefaultConfig();
        config.complianceModules = modules;

        vm.prank(deployer);
        IRWAFactory.DeployedContracts memory contracts = factory.deploy(config);

        RWAToken token = RWAToken(contracts.token);
        assertTrue(token.isComplianceModule(module1));
        assertTrue(token.isComplianceModule(module2));
    }

    function test_Deploy_RevertEmptyTokenName() public {
        IRWAFactory.DeploymentConfig memory config = _createDefaultConfig();
        config.tokenName = "";

        vm.prank(deployer);
        vm.expectRevert(RWAFactory.InvalidConfig.selector);
        factory.deploy(config);
    }

    function test_Deploy_RevertEmptyTokenSymbol() public {
        IRWAFactory.DeploymentConfig memory config = _createDefaultConfig();
        config.tokenSymbol = "";

        vm.prank(deployer);
        vm.expectRevert(RWAFactory.InvalidConfig.selector);
        factory.deploy(config);
    }

    function test_Deploy_RevertNoSigners() public {
        IRWAFactory.DeploymentConfig memory config = _createDefaultConfig();
        config.vaultSigners = new address[](0);

        vm.prank(deployer);
        vm.expectRevert(RWAFactory.InvalidConfig.selector);
        factory.deploy(config);
    }

    function test_Deploy_RevertThresholdTooHigh() public {
        IRWAFactory.DeploymentConfig memory config = _createDefaultConfig();
        config.vaultThreshold = 10; // More than signers

        vm.prank(deployer);
        vm.expectRevert(RWAFactory.InvalidConfig.selector);
        factory.deploy(config);
    }

    function test_Deploy_MultipleDeployments() public {
        IRWAFactory.DeploymentConfig memory config1 = _createDefaultConfig();
        config1.tokenName = "Token 1";
        config1.tokenSymbol = "TK1";

        IRWAFactory.DeploymentConfig memory config2 = _createDefaultConfig();
        config2.tokenName = "Token 2";
        config2.tokenSymbol = "TK2";

        vm.startPrank(deployer);
        IRWAFactory.DeployedContracts memory contracts1 = factory.deploy(config1);
        IRWAFactory.DeployedContracts memory contracts2 = factory.deploy(config2);
        vm.stopPrank();

        assertEq(factory.totalDeployments(), 2);
        assertEq(factory.getDeploymentCount(deployer), 2);

        // Verify different contracts
        assertTrue(contracts1.token != contracts2.token);
        assertTrue(contracts1.vault != contracts2.vault);
    }

    /*//////////////////////////////////////////////////////////////
                        UPGRADE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_UpgradeToken() public {
        IRWAFactory.DeploymentConfig memory config = _createDefaultConfig();
        config.initialSupply = 1000 ether;

        vm.prank(deployer);
        IRWAFactory.DeployedContracts memory contracts = factory.deploy(config);

        RWAToken newImpl = new RWAToken();

        // Deployer upgrades directly (has UPGRADER_ROLE)
        vm.prank(deployer);
        RWAToken(contracts.token).upgradeTo(address(newImpl));

        // Verify state preserved
        RWAToken token = RWAToken(contracts.token);
        assertEq(token.name(), config.tokenName);
        assertEq(token.totalSupply(), config.initialSupply);
    }

    function test_UpgradeVault() public {
        IRWAFactory.DeploymentConfig memory config = _createDefaultConfig();

        vm.prank(deployer);
        IRWAFactory.DeployedContracts memory contracts = factory.deploy(config);

        AssetVault newImpl = new AssetVault();

        // Deployer upgrades directly (has UPGRADER_ROLE)
        vm.prank(deployer);
        AssetVault(payable(contracts.vault)).upgradeTo(address(newImpl));

        // Verify state preserved
        AssetVault vault = AssetVault(payable(contracts.vault));
        assertEq(vault.approvalThreshold(), config.vaultThreshold);
    }

    function test_Upgrade_RevertUnauthorized() public {
        IRWAFactory.DeploymentConfig memory config = _createDefaultConfig();

        vm.prank(deployer);
        IRWAFactory.DeployedContracts memory contracts = factory.deploy(config);

        RWAToken newImpl = new RWAToken();

        // Random user cannot upgrade
        address randomUser = makeAddr("randomUser");
        vm.prank(randomUser);
        vm.expectRevert();
        RWAToken(contracts.token).upgradeTo(address(newImpl));
    }

    /*//////////////////////////////////////////////////////////////
                IMPLEMENTATION MANAGEMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SetTokenImplementation() public {
        RWAToken newImpl = new RWAToken();

        vm.prank(admin);
        factory.setTokenImplementation(address(newImpl));

        assertEq(factory.tokenImplementation(), address(newImpl));
    }

    function test_SetVaultImplementation() public {
        AssetVault newImpl = new AssetVault();

        vm.prank(admin);
        factory.setVaultImplementation(address(newImpl));

        assertEq(factory.vaultImplementation(), address(newImpl));
    }

    function test_SetImplementation_RevertZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(RWAFactory.InvalidAddress.selector);
        factory.setTokenImplementation(address(0));
    }

    function test_SetImplementation_RevertUnauthorized() public {
        RWAToken newImpl = new RWAToken();

        vm.prank(deployer);
        vm.expectRevert();
        factory.setTokenImplementation(address(newImpl));
    }

    /*//////////////////////////////////////////////////////////////
                        ACCESS CONTROL TESTS
    //////////////////////////////////////////////////////////////*/

    function test_DeployedContractsHaveCorrectRoles() public {
        IRWAFactory.DeploymentConfig memory config = _createDefaultConfig();

        vm.prank(deployer);
        IRWAFactory.DeployedContracts memory contracts = factory.deploy(config);

        // Token roles
        RWAToken token = RWAToken(contracts.token);
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), deployer));
        assertTrue(token.hasRole(token.ISSUER_ROLE(), deployer));
        assertTrue(token.hasRole(token.ISSUER_ROLE(), contracts.yieldDistributor));

        // Vault roles
        AssetVault vault = AssetVault(payable(contracts.vault));
        assertTrue(vault.hasRole(vault.DEFAULT_ADMIN_ROLE(), deployer));
        assertTrue(vault.isSigner(signer1));
        assertTrue(vault.isSigner(signer2));

        // KYC Registry roles
        KYCRegistry kyc = KYCRegistry(contracts.kycRegistry);
        assertTrue(kyc.hasRole(kyc.DEFAULT_ADMIN_ROLE(), deployer));
        assertTrue(kyc.hasRole(kyc.KYC_ADMIN_ROLE(), deployer));

        // Yield Distributor roles
        YieldDistributor dist = YieldDistributor(contracts.yieldDistributor);
        assertTrue(dist.hasRole(dist.DEFAULT_ADMIN_ROLE(), deployer));
        assertTrue(dist.hasRole(dist.DISTRIBUTOR_ROLE(), deployer));
    }

    /*//////////////////////////////////////////////////////////////
                            HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _createDefaultConfig() internal view returns (IRWAFactory.DeploymentConfig memory) {
        address[] memory signers = new address[](2);
        signers[0] = signer1;
        signers[1] = signer2;

        return IRWAFactory.DeploymentConfig({
            tokenName: "Test RWA Token",
            tokenSymbol: "TRWA",
            initialSupply: 0,
            complianceModules: new address[](0),
            yieldClaimWindowDays: 30,
            vaultSigners: signers,
            vaultThreshold: 2,
            vaultWithdrawalThreshold: 100 ether
        });
    }
}
