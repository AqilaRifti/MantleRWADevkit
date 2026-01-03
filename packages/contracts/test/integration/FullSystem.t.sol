// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {RWAFactory} from "../../src/RWAFactory.sol";
import {RWAToken} from "../../src/RWAToken.sol";
import {AssetVault} from "../../src/AssetVault.sol";
import {YieldDistributor} from "../../src/YieldDistributor.sol";
import {KYCRegistry} from "../../src/KYCRegistry.sol";
import {IRWAFactory} from "../../src/interfaces/IRWAFactory.sol";
import {IKYCRegistry} from "../../src/interfaces/IKYCRegistry.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC20Mock} from "../mocks/ERC20Mock.sol";

/**
 * @title Full System Integration Tests
 * @notice Integration tests for the complete RWA system
 * @dev Requirements: 1.2, 3.2, 4.1
 */
contract FullSystemTest is Test {
    RWAFactory public factory;
    RWAToken public token;
    AssetVault public vault;
    YieldDistributor public distributor;
    KYCRegistry public kycRegistry;
    ERC20Mock public usdc;

    address public admin;
    address public issuer;
    address public complianceOfficer;
    address public investor1;
    address public investor2;
    address public investor3;
    address public unverifiedUser;

    uint256 constant DEFAULT_EXPIRY = 365 days;
    uint256 constant INITIAL_SUPPLY = 1_000_000 ether;

    function setUp() public {
        admin = makeAddr("admin");
        issuer = makeAddr("issuer");
        complianceOfficer = makeAddr("complianceOfficer");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");
        investor3 = makeAddr("investor3");
        unverifiedUser = makeAddr("unverifiedUser");

        // Deploy factory
        RWAFactory factoryImpl = new RWAFactory();
        bytes memory initData = abi.encodeWithSelector(RWAFactory.initialize.selector, admin);
        ERC1967Proxy proxy = new ERC1967Proxy(address(factoryImpl), initData);
        factory = RWAFactory(address(proxy));

        // Deploy USDC mock
        usdc = new ERC20Mock("USD Coin", "USDC");

        // Deploy complete system via factory
        _deploySystem();

        // Setup additional roles
        vm.startPrank(admin);
        token.grantIssuerRole(issuer);
        token.grantComplianceOfficerRole(complianceOfficer);
        // YieldDistributor needs ISSUER_ROLE for snapshots (already granted by factory)
        vm.stopPrank();

        // Setup investors
        _setupInvestors();
    }

    /*//////////////////////////////////////////////////////////////
                    INVESTOR ONBOARDING FLOW
    //////////////////////////////////////////////////////////////*/

    function test_CompleteInvestorOnboardingFlow() public {
        address newInvestor = makeAddr("newInvestor");

        // Step 1: KYC verification
        vm.prank(admin);
        kycRegistry.addInvestor(
            newInvestor,
            IKYCRegistry.AccreditationTier.Accredited,
            block.timestamp + DEFAULT_EXPIRY,
            keccak256("newInvestor-identity")
        );

        assertTrue(kycRegistry.isVerified(newInvestor), "Investor should be verified");
        assertTrue(kycRegistry.isAccredited(newInvestor), "Investor should be accredited");

        // Step 2: Token purchase (mint)
        uint256 purchaseAmount = 10_000 ether;
        vm.prank(issuer);
        token.mint(newInvestor, purchaseAmount);

        assertEq(token.balanceOf(newInvestor), purchaseAmount, "Investor should have tokens");

        // Step 3: Transfer to another verified investor
        vm.prank(newInvestor);
        token.transfer(investor1, 1000 ether);

        assertEq(token.balanceOf(newInvestor), purchaseAmount - 1000 ether);
        assertGt(token.balanceOf(investor1), 0);
    }

    /*//////////////////////////////////////////////////////////////
                    YIELD DISTRIBUTION FLOW
    //////////////////////////////////////////////////////////////*/

    function test_CompleteYieldDistributionFlow() public {
        // Step 1: Distribute tokens to investors
        vm.startPrank(issuer);
        token.mint(investor1, 500_000 ether); // 50%
        token.mint(investor2, 300_000 ether); // 30%
        token.mint(investor3, 200_000 ether); // 20%
        vm.stopPrank();

        // Step 2: Create yield distribution
        uint256 yieldAmount = 100_000 * 1e6; // 100k USDC
        usdc.mint(admin, yieldAmount);

        vm.startPrank(admin);
        usdc.approve(address(distributor), yieldAmount);
        uint256 distId = distributor.createDistribution(address(usdc), yieldAmount, 30);
        vm.stopPrank();

        // Step 3: Verify proportional distribution
        uint256 claimable1 = distributor.getClaimableAmount(distId, investor1);
        uint256 claimable2 = distributor.getClaimableAmount(distId, investor2);
        uint256 claimable3 = distributor.getClaimableAmount(distId, investor3);

        assertEq(claimable1, (yieldAmount * 50) / 100, "Investor1 should get 50%");
        assertEq(claimable2, (yieldAmount * 30) / 100, "Investor2 should get 30%");
        assertEq(claimable3, (yieldAmount * 20) / 100, "Investor3 should get 20%");

        // Step 4: Investors claim yield
        vm.prank(investor1);
        distributor.claim(distId);
        assertEq(usdc.balanceOf(investor1), claimable1);

        vm.prank(investor2);
        distributor.claim(distId);
        assertEq(usdc.balanceOf(investor2), claimable2);

        vm.prank(investor3);
        distributor.claim(distId);
        assertEq(usdc.balanceOf(investor3), claimable3);

        // Step 5: Verify all claimed
        assertTrue(distributor.hasClaimed(distId, investor1));
        assertTrue(distributor.hasClaimed(distId, investor2));
        assertTrue(distributor.hasClaimed(distId, investor3));
    }

    /*//////////////////////////////////////////////////////////////
                    COMPLIANCE BLOCKING FLOW
    //////////////////////////////////////////////////////////////*/

    function test_ComplianceBlocksUnauthorizedTransfers() public {
        // Mint tokens to verified investor
        vm.prank(issuer);
        token.mint(investor1, 10_000 ether);

        // Attempt transfer to unverified user - should fail
        vm.prank(investor1);
        vm.expectRevert();
        token.transfer(unverifiedUser, 1000 ether);

        // Verify unverified user has no tokens
        assertEq(token.balanceOf(unverifiedUser), 0);

        // Attempt mint to unverified user - should fail
        vm.prank(issuer);
        vm.expectRevert(abi.encodeWithSelector(RWAToken.NotVerified.selector, unverifiedUser));
        token.mint(unverifiedUser, 1000 ether);
    }

    function test_ExpiredKYCBlocksTransfers() public {
        // Create investor with short expiry
        address shortExpiryInvestor = makeAddr("shortExpiry");
        uint256 shortExpiry = block.timestamp + 1 days;

        vm.prank(admin);
        kycRegistry.addInvestor(
            shortExpiryInvestor,
            IKYCRegistry.AccreditationTier.Retail,
            shortExpiry,
            keccak256("short-expiry")
        );

        // Mint tokens
        vm.prank(issuer);
        token.mint(shortExpiryInvestor, 10_000 ether);

        // Transfer works before expiry
        vm.prank(shortExpiryInvestor);
        token.transfer(investor1, 1000 ether);

        // Warp past expiry
        vm.warp(shortExpiry + 1);

        // Transfer should fail after expiry
        vm.prank(shortExpiryInvestor);
        vm.expectRevert();
        token.transfer(investor1, 1000 ether);
    }

    function test_PauseBlocksAllTransfers() public {
        // Mint tokens
        vm.prank(issuer);
        token.mint(investor1, 10_000 ether);

        // Pause token
        vm.prank(complianceOfficer);
        token.pause();

        // All transfers should fail
        vm.prank(investor1);
        vm.expectRevert();
        token.transfer(investor2, 1000 ether);

        // Minting should fail
        vm.prank(issuer);
        vm.expectRevert();
        token.mint(investor2, 1000 ether);

        // Unpause
        vm.prank(complianceOfficer);
        token.unpause();

        // Transfers should work again
        vm.prank(investor1);
        token.transfer(investor2, 1000 ether);
        assertEq(token.balanceOf(investor2), 1000 ether);
    }

    /*//////////////////////////////////////////////////////////////
                    VAULT CUSTODY FLOW
    //////////////////////////////////////////////////////////////*/

    function test_VaultCustodyFlow() public {
        // Deposit assets
        uint256 depositAmount = 1_000_000 * 1e6;
        usdc.mint(admin, depositAmount);

        vm.startPrank(admin);
        usdc.approve(address(vault), depositAmount);
        vault.deposit(address(usdc), depositAmount);
        vm.stopPrank();

        assertEq(vault.getAssetBalance(address(usdc)), depositAmount);

        // Set asset value for collateralization (admin is a signer)
        vm.prank(admin);
        vault.setTotalAssetValue(depositAmount);

        // Mint tokens equal to asset value
        vm.prank(issuer);
        token.mint(investor1, depositAmount);

        // Check collateralization
        uint256 ratio = vault.getCollateralizationRatio();
        assertEq(ratio, 10000, "Should be 100% collateralized");
        assertTrue(vault.isBackingVerified(), "Backing should be verified");
    }

    /*//////////////////////////////////////////////////////////////
                    MULTI-DISTRIBUTION FLOW
    //////////////////////////////////////////////////////////////*/

    function test_MultipleDistributions() public {
        // Setup token holdings
        vm.startPrank(issuer);
        token.mint(investor1, 500_000 ether);
        token.mint(investor2, 500_000 ether);
        vm.stopPrank();

        // Create multiple distributions
        uint256 dist1Amount = 50_000 * 1e6;
        uint256 dist2Amount = 100_000 * 1e6;

        usdc.mint(admin, dist1Amount + dist2Amount);

        vm.startPrank(admin);
        usdc.approve(address(distributor), dist1Amount + dist2Amount);
        uint256 distId1 = distributor.createDistribution(address(usdc), dist1Amount, 30);
        uint256 distId2 = distributor.createDistribution(address(usdc), dist2Amount, 30);
        vm.stopPrank();

        // Claim multiple distributions at once
        uint256[] memory distIds = new uint256[](2);
        distIds[0] = distId1;
        distIds[1] = distId2;

        uint256 expected1 = distributor.getClaimableAmount(distId1, investor1);
        uint256 expected2 = distributor.getClaimableAmount(distId2, investor1);

        vm.prank(investor1);
        distributor.claimMultiple(distIds);

        assertEq(usdc.balanceOf(investor1), expected1 + expected2);
    }

    /*//////////////////////////////////////////////////////////////
                            HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _deploySystem() internal {
        address[] memory signers = new address[](1);
        signers[0] = admin;

        IRWAFactory.DeploymentConfig memory config = IRWAFactory.DeploymentConfig({
            tokenName: "Miami Luxury Condo",
            tokenSymbol: "MLC",
            initialSupply: 0,
            complianceModules: new address[](0),
            yieldClaimWindowDays: 30,
            vaultSigners: signers,
            vaultThreshold: 1,
            vaultWithdrawalThreshold: 0
        });

        vm.prank(admin);
        IRWAFactory.DeployedContracts memory contracts = factory.deploy(config);

        token = RWAToken(contracts.token);
        vault = AssetVault(payable(contracts.vault));
        distributor = YieldDistributor(contracts.yieldDistributor);
        kycRegistry = KYCRegistry(contracts.kycRegistry);
    }

    function _setupInvestors() internal {
        uint256 expiry = block.timestamp + DEFAULT_EXPIRY;

        vm.startPrank(admin);
        kycRegistry.addInvestor(
            investor1,
            IKYCRegistry.AccreditationTier.Accredited,
            expiry,
            keccak256("investor1")
        );
        kycRegistry.addInvestor(
            investor2,
            IKYCRegistry.AccreditationTier.Accredited,
            expiry,
            keccak256("investor2")
        );
        kycRegistry.addInvestor(
            investor3,
            IKYCRegistry.AccreditationTier.Retail,
            expiry,
            keccak256("investor3")
        );
        vm.stopPrank();
    }
}
