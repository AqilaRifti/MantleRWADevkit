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
 * @title RWAFactory Property Tests
 * @notice Property-based tests for RWAFactory contract
 * @dev Feature: mantle-rwa-sdk, Properties 16-17
 */
contract RWAFactoryPropertyTest is Test {
    RWAFactory public factory;
    address public admin;
    address public deployer;

    function setUp() public {
        admin = makeAddr("admin");
        deployer = makeAddr("deployer");

        // Deploy factory
        RWAFactory factoryImpl = new RWAFactory();
        bytes memory initData = abi.encodeWithSelector(RWAFactory.initialize.selector, admin);
        ERC1967Proxy proxy = new ERC1967Proxy(address(factoryImpl), initData);
        factory = RWAFactory(address(proxy));
    }

    /*//////////////////////////////////////////////////////////////
            PROPERTY 16: FACTORY CONFIGURATION PROPAGATION
    //////////////////////////////////////////////////////////////*/

    /// @dev Feature: mantle-rwa-sdk, Property 16: Factory Configuration Propagation
    /// For any RWA system deployed via factory with specific configuration, all deployed contracts
    /// SHALL have the configured parameters (token name, symbol, compliance rules, etc.).
    function testProperty_ConfigurationPropagation(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 initialSupply,
        uint256 vaultThreshold,
        uint256 withdrawalThreshold
    ) public {
        // Bound inputs
        vm.assume(bytes(tokenName).length > 0 && bytes(tokenName).length <= 32);
        vm.assume(bytes(tokenSymbol).length > 0 && bytes(tokenSymbol).length <= 8);
        initialSupply = bound(initialSupply, 0, 1e27);
        vaultThreshold = bound(vaultThreshold, 1, 3);
        withdrawalThreshold = bound(withdrawalThreshold, 0, 1e24);

        // Create signers
        address[] memory signers = new address[](3);
        signers[0] = makeAddr("signer1");
        signers[1] = makeAddr("signer2");
        signers[2] = makeAddr("signer3");

        IRWAFactory.DeploymentConfig memory config = IRWAFactory.DeploymentConfig({
            tokenName: tokenName,
            tokenSymbol: tokenSymbol,
            initialSupply: initialSupply,
            complianceModules: new address[](0),
            yieldClaimWindowDays: 30,
            vaultSigners: signers,
            vaultThreshold: vaultThreshold,
            vaultWithdrawalThreshold: withdrawalThreshold
        });

        vm.prank(deployer);
        IRWAFactory.DeployedContracts memory contracts = factory.deploy(config);

        // Property: Token SHALL have configured name and symbol
        RWAToken token = RWAToken(contracts.token);
        assertEq(token.name(), tokenName, "Token name should match config");
        assertEq(token.symbol(), tokenSymbol, "Token symbol should match config");

        // Property: Token SHALL have configured initial supply (if > 0)
        if (initialSupply > 0) {
            assertEq(token.totalSupply(), initialSupply, "Initial supply should match config");
            assertEq(token.balanceOf(deployer), initialSupply, "Deployer should receive initial supply");
        }

        // Property: Vault SHALL have configured signers and threshold
        AssetVault vault = AssetVault(payable(contracts.vault));
        assertEq(vault.approvalThreshold(), vaultThreshold, "Vault threshold should match config");
        assertEq(vault.withdrawalThreshold(), withdrawalThreshold, "Withdrawal threshold should match config");
        assertEq(vault.getSignerCount(), signers.length, "Signer count should match config");

        for (uint256 i = 0; i < signers.length; i++) {
            assertTrue(vault.isSigner(signers[i]), "Each signer should be registered");
        }

        // Property: Token SHALL be linked to KYC Registry
        assertEq(token.kycRegistry(), contracts.kycRegistry, "Token should be linked to KYC registry");

        // Property: Vault SHALL be linked to Token
        assertEq(vault.rwaToken(), contracts.token, "Vault should be linked to token");

        // Property: Yield Distributor SHALL be linked to Token
        YieldDistributor dist = YieldDistributor(contracts.yieldDistributor);
        assertEq(address(dist.rwaToken()), contracts.token, "Distributor should be linked to token");
    }

    /// @dev Property test: Compliance modules are added
    function testProperty_ComplianceModulesAdded(uint8 moduleCount) public {
        moduleCount = uint8(bound(moduleCount, 0, 5));

        address[] memory modules = new address[](moduleCount);
        for (uint256 i = 0; i < moduleCount; i++) {
            modules[i] = makeAddr(string(abi.encodePacked("module", i)));
        }

        address[] memory signers = new address[](1);
        signers[0] = makeAddr("signer");

        IRWAFactory.DeploymentConfig memory config = IRWAFactory.DeploymentConfig({
            tokenName: "Test Token",
            tokenSymbol: "TEST",
            initialSupply: 0,
            complianceModules: modules,
            yieldClaimWindowDays: 30,
            vaultSigners: signers,
            vaultThreshold: 1,
            vaultWithdrawalThreshold: 0
        });

        vm.prank(deployer);
        IRWAFactory.DeployedContracts memory contracts = factory.deploy(config);

        RWAToken token = RWAToken(contracts.token);

        // Property: All compliance modules SHALL be added
        address[] memory addedModules = token.getComplianceModules();
        assertEq(addedModules.length, moduleCount, "All modules should be added");

        for (uint256 i = 0; i < moduleCount; i++) {
            assertTrue(token.isComplianceModule(modules[i]), "Each module should be registered");
        }
    }

    /*//////////////////////////////////////////////////////////////
                PROPERTY 17: UUPS UPGRADE CAPABILITY
    //////////////////////////////////////////////////////////////*/

    /// @dev Feature: mantle-rwa-sdk, Property 17: UUPS Upgrade Capability
    /// For any contract deployed via factory, upgrading to a new implementation SHALL preserve
    /// storage state and update logic.
    function testProperty_UUPSUpgradePreservesState() public {
        // Deploy a system
        address[] memory signers = new address[](1);
        signers[0] = makeAddr("signer");

        IRWAFactory.DeploymentConfig memory config = IRWAFactory.DeploymentConfig({
            tokenName: "Upgrade Test",
            tokenSymbol: "UPG",
            initialSupply: 1000 ether,
            complianceModules: new address[](0),
            yieldClaimWindowDays: 30,
            vaultSigners: signers,
            vaultThreshold: 1,
            vaultWithdrawalThreshold: 0
        });

        vm.prank(deployer);
        IRWAFactory.DeployedContracts memory contracts = factory.deploy(config);

        RWAToken token = RWAToken(contracts.token);

        // Record state before upgrade
        string memory nameBefore = token.name();
        string memory symbolBefore = token.symbol();
        uint256 supplyBefore = token.totalSupply();
        uint256 balanceBefore = token.balanceOf(deployer);

        // Deploy new implementation
        RWAToken newImpl = new RWAToken();

        // Upgrade (deployer has UPGRADER_ROLE)
        vm.prank(deployer);
        token.upgradeTo(address(newImpl));

        // Property: State SHALL be preserved after upgrade
        assertEq(token.name(), nameBefore, "Name should be preserved");
        assertEq(token.symbol(), symbolBefore, "Symbol should be preserved");
        assertEq(token.totalSupply(), supplyBefore, "Supply should be preserved");
        assertEq(token.balanceOf(deployer), balanceBefore, "Balance should be preserved");
    }

    /// @dev Property test: Upgrade all contract types
    function testProperty_UpgradeAllContractTypes() public {
        // Deploy a system
        address[] memory signers = new address[](1);
        signers[0] = makeAddr("signer");

        IRWAFactory.DeploymentConfig memory config = IRWAFactory.DeploymentConfig({
            tokenName: "Multi Upgrade",
            tokenSymbol: "MUP",
            initialSupply: 0,
            complianceModules: new address[](0),
            yieldClaimWindowDays: 30,
            vaultSigners: signers,
            vaultThreshold: 1,
            vaultWithdrawalThreshold: 100 ether
        });

        vm.prank(deployer);
        IRWAFactory.DeployedContracts memory contracts = factory.deploy(config);

        // Deploy new implementations
        RWAToken newTokenImpl = new RWAToken();
        AssetVault newVaultImpl = new AssetVault();
        YieldDistributor newDistImpl = new YieldDistributor();
        KYCRegistry newKycImpl = new KYCRegistry();

        // Upgrade all contracts (deployer has UPGRADER_ROLE on all)
        vm.startPrank(deployer);
        RWAToken(contracts.token).upgradeTo(address(newTokenImpl));
        AssetVault(payable(contracts.vault)).upgradeTo(address(newVaultImpl));
        YieldDistributor(contracts.yieldDistributor).upgradeTo(address(newDistImpl));
        KYCRegistry(contracts.kycRegistry).upgradeTo(address(newKycImpl));
        vm.stopPrank();

        // Verify contracts still work
        RWAToken token = RWAToken(contracts.token);
        assertEq(token.name(), "Multi Upgrade", "Token should still work after upgrade");

        AssetVault vault = AssetVault(payable(contracts.vault));
        assertEq(vault.approvalThreshold(), 1, "Vault should still work after upgrade");

        YieldDistributor dist = YieldDistributor(contracts.yieldDistributor);
        assertEq(address(dist.rwaToken()), contracts.token, "Distributor should still work after upgrade");

        KYCRegistry kyc = KYCRegistry(contracts.kycRegistry);
        assertEq(kyc.investorCount(), 0, "KYC should still work after upgrade"); // 0 since no initial supply
    }
}
