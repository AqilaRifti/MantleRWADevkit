// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {YieldDistributor} from "../../src/YieldDistributor.sol";
import {RWAToken} from "../../src/RWAToken.sol";
import {KYCRegistry} from "../../src/KYCRegistry.sol";
import {IKYCRegistry} from "../../src/interfaces/IKYCRegistry.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC20Mock} from "../mocks/ERC20Mock.sol";

/**
 * @title YieldDistributor Property Tests
 * @notice Property-based tests for YieldDistributor contract
 * @dev Feature: mantle-rwa-sdk, Properties 10-12
 */
contract YieldDistributorPropertyTest is Test {
    YieldDistributor public distributor;
    RWAToken public rwaToken;
    KYCRegistry public kycRegistry;
    ERC20Mock public usdc;
    ERC20Mock public usdt;
    ERC20Mock public mnt;

    address public admin;
    address public issuer;
    address[] public holders;

    uint256 constant DEFAULT_EXPIRY = 365 days;
    uint256 constant TOTAL_SUPPLY = 1_000_000 ether;
    uint256 constant DISTRIBUTION_AMOUNT = 100_000 * 1e6; // 100k USDC (6 decimals)

    function setUp() public {
        admin = makeAddr("admin");
        issuer = makeAddr("issuer");

        // Create holders
        for (uint256 i = 0; i < 5; i++) {
            holders.push(makeAddr(string(abi.encodePacked("holder", i))));
        }

        // Deploy KYC Registry
        KYCRegistry kycImpl = new KYCRegistry();
        bytes memory kycInitData = abi.encodeWithSelector(KYCRegistry.initialize.selector, admin);
        ERC1967Proxy kycProxy = new ERC1967Proxy(address(kycImpl), kycInitData);
        kycRegistry = KYCRegistry(address(kycProxy));

        // Deploy RWA Token
        RWAToken tokenImpl = new RWAToken();
        bytes memory tokenInitData = abi.encodeWithSelector(
            RWAToken.initialize.selector,
            "RWA Token",
            "RWA",
            admin,
            address(kycRegistry)
        );
        ERC1967Proxy tokenProxy = new ERC1967Proxy(address(tokenImpl), tokenInitData);
        rwaToken = RWAToken(address(tokenProxy));

        // Deploy Yield Distributor
        YieldDistributor distImpl = new YieldDistributor();
        bytes memory distInitData = abi.encodeWithSelector(
            YieldDistributor.initialize.selector,
            admin,
            address(rwaToken),
            admin
        );
        ERC1967Proxy distProxy = new ERC1967Proxy(address(distImpl), distInitData);
        distributor = YieldDistributor(address(distProxy));

        // Deploy payment tokens
        usdc = new ERC20Mock("USD Coin", "USDC");
        usdt = new ERC20Mock("Tether USD", "USDT");
        mnt = new ERC20Mock("Mantle", "MNT");

        // Setup roles
        vm.startPrank(admin);
        rwaToken.grantIssuerRole(issuer);
        rwaToken.grantIssuerRole(address(distributor)); // YieldDistributor needs ISSUER_ROLE for snapshots
        vm.stopPrank();

        // Setup holders with KYC and tokens
        _setupHolders();
    }

    /*//////////////////////////////////////////////////////////////
        PROPERTY 10: SNAPSHOT-BASED PROPORTIONAL DISTRIBUTION
    //////////////////////////////////////////////////////////////*/

    /// @dev Feature: mantle-rwa-sdk, Property 10: Snapshot-Based Proportional Distribution
    /// For any yield distribution, each holder's claimable amount SHALL be proportional to their
    /// balance at snapshot time, and the sum of all claimable amounts SHALL equal the total
    /// distribution amount (minus rounding).
    function testProperty_ProportionalDistribution(uint256 distributionAmount) public {
        // Bound distribution amount
        distributionAmount = bound(distributionAmount, 1000, 1e12); // 1000 to 1 trillion units

        // Fund admin with payment tokens
        usdc.mint(admin, distributionAmount);

        // Create distribution
        vm.startPrank(admin);
        usdc.approve(address(distributor), distributionAmount);
        uint256 distId = distributor.createDistribution(address(usdc), distributionAmount, 30);
        vm.stopPrank();

        // Calculate expected amounts and verify proportionality
        uint256 totalClaimable = 0;
        uint256 totalSupply = rwaToken.totalSupply();

        for (uint256 i = 0; i < holders.length; i++) {
            uint256 holderBalance = rwaToken.balanceOf(holders[i]);
            uint256 expectedAmount = (holderBalance * distributionAmount) / totalSupply;
            uint256 actualClaimable = distributor.getClaimableAmount(distId, holders[i]);

            // Property: Claimable amount SHALL be proportional to balance
            assertEq(actualClaimable, expectedAmount, "Claimable should be proportional");

            totalClaimable += actualClaimable;
        }

        // Property: Sum of claimable amounts SHALL equal total (minus rounding)
        // Allow for rounding error of up to holders.length wei
        assertApproxEqAbs(
            totalClaimable,
            distributionAmount,
            holders.length,
            "Total claimable should equal distribution amount"
        );
    }

    /// @dev Property test: Claiming updates balances correctly
    function testProperty_ClaimingUpdatesBalances(uint256 distributionAmount) public {
        distributionAmount = bound(distributionAmount, 1000, 1e12);

        usdc.mint(admin, distributionAmount);

        vm.startPrank(admin);
        usdc.approve(address(distributor), distributionAmount);
        uint256 distId = distributor.createDistribution(address(usdc), distributionAmount, 30);
        vm.stopPrank();

        // Each holder claims
        for (uint256 i = 0; i < holders.length; i++) {
            uint256 expectedAmount = distributor.getClaimableAmount(distId, holders[i]);
            uint256 balanceBefore = usdc.balanceOf(holders[i]);

            vm.prank(holders[i]);
            distributor.claim(distId);

            uint256 balanceAfter = usdc.balanceOf(holders[i]);

            // Property: Balance should increase by claimable amount
            assertEq(balanceAfter - balanceBefore, expectedAmount, "Balance should increase by claim amount");

            // Property: Cannot claim twice
            assertEq(distributor.getClaimableAmount(distId, holders[i]), 0, "Should have 0 claimable after claim");
        }
    }

    /*//////////////////////////////////////////////////////////////
            PROPERTY 11: MULTI-TOKEN YIELD SUPPORT
    //////////////////////////////////////////////////////////////*/

    /// @dev Feature: mantle-rwa-sdk, Property 11: Multi-Token Yield Support
    /// For any supported payment token (USDC, USDT, MNT), creating a distribution and claiming
    /// yield SHALL work correctly with proper decimal handling.
    function testProperty_MultiTokenSupport(uint8 tokenIndex, uint256 amount) public {
        // Select token based on index
        ERC20Mock paymentToken;
        if (tokenIndex % 3 == 0) {
            paymentToken = usdc;
        } else if (tokenIndex % 3 == 1) {
            paymentToken = usdt;
        } else {
            paymentToken = mnt;
        }

        amount = bound(amount, 1000, 1e12);

        // Fund and create distribution
        paymentToken.mint(admin, amount);

        vm.startPrank(admin);
        paymentToken.approve(address(distributor), amount);
        uint256 distId = distributor.createDistribution(address(paymentToken), amount, 30);
        vm.stopPrank();

        // Verify distribution was created correctly
        (address storedToken, uint256 storedAmount, , , ) = distributor.getDistributionInfo(distId);
        assertEq(storedToken, address(paymentToken), "Payment token should match");
        assertEq(storedAmount, amount, "Amount should match");

        // Claim and verify
        address holder = holders[0];
        uint256 claimable = distributor.getClaimableAmount(distId, holder);
        uint256 balanceBefore = paymentToken.balanceOf(holder);

        vm.prank(holder);
        distributor.claim(distId);

        // Property: Claiming SHALL work correctly for any supported token
        assertEq(paymentToken.balanceOf(holder), balanceBefore + claimable, "Should receive correct amount");
    }

    /*//////////////////////////////////////////////////////////////
            PROPERTY 12: CLAIM WINDOW ENFORCEMENT
    //////////////////////////////////////////////////////////////*/

    /// @dev Feature: mantle-rwa-sdk, Property 12: Claim Window Enforcement
    /// For any yield distribution, claims SHALL succeed only within the claim window;
    /// claims after expiry SHALL revert, and unclaimed funds SHALL be handled according to policy.
    function testProperty_ClaimWindowEnforcement(uint256 claimWindowDays) public {
        claimWindowDays = bound(claimWindowDays, 1, 365);
        uint256 amount = 100_000 * 1e6;

        usdc.mint(admin, amount);

        vm.startPrank(admin);
        usdc.approve(address(distributor), amount);
        uint256 distId = distributor.createDistribution(address(usdc), amount, claimWindowDays);
        vm.stopPrank();

        // Property: Claims SHALL succeed within window
        address holder1 = holders[0];
        vm.prank(holder1);
        distributor.claim(distId);
        assertTrue(distributor.hasClaimed(distId, holder1), "Should be able to claim within window");

        // Warp past claim window
        vm.warp(block.timestamp + (claimWindowDays * 1 days) + 1);

        // Property: Claims SHALL revert after expiry
        address holder2 = holders[1];
        vm.prank(holder2);
        vm.expectRevert(YieldDistributor.ClaimWindowExpired.selector);
        distributor.claim(distId);

        // Property: Unclaimed funds SHALL be handled according to policy
        uint256 unclaimedBefore = usdc.balanceOf(admin);
        vm.prank(admin);
        distributor.handleUnclaimedFunds(distId);
        uint256 unclaimedAfter = usdc.balanceOf(admin);

        assertTrue(unclaimedAfter > unclaimedBefore, "Unclaimed funds should be transferred");
    }

    /// @dev Property test: Cannot handle unclaimed before window expires
    function testProperty_CannotHandleUnclaimedEarly(uint256 claimWindowDays) public {
        claimWindowDays = bound(claimWindowDays, 1, 365);
        uint256 amount = 100_000 * 1e6;

        usdc.mint(admin, amount);

        vm.startPrank(admin);
        usdc.approve(address(distributor), amount);
        uint256 distId = distributor.createDistribution(address(usdc), amount, claimWindowDays);
        vm.stopPrank();

        // Property: Cannot handle unclaimed before window expires
        vm.prank(admin);
        vm.expectRevert(YieldDistributor.ClaimWindowNotExpired.selector);
        distributor.handleUnclaimedFunds(distId);
    }

    /// @dev Property test: Cannot handle unclaimed twice
    function testProperty_CannotHandleUnclaimedTwice() public {
        uint256 amount = 100_000 * 1e6;

        usdc.mint(admin, amount);

        vm.startPrank(admin);
        usdc.approve(address(distributor), amount);
        uint256 distId = distributor.createDistribution(address(usdc), amount, 1);
        vm.stopPrank();

        // Warp past window
        vm.warp(block.timestamp + 2 days);

        // Handle unclaimed
        vm.prank(admin);
        distributor.handleUnclaimedFunds(distId);

        // Property: Cannot handle twice
        vm.prank(admin);
        vm.expectRevert(YieldDistributor.UnclaimedAlreadyHandled.selector);
        distributor.handleUnclaimedFunds(distId);
    }

    /*//////////////////////////////////////////////////////////////
                            HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _setupHolders() internal {
        uint256 expiry = block.timestamp + DEFAULT_EXPIRY;

        // Distribute tokens with varying amounts
        uint256[] memory amounts = new uint256[](5);
        amounts[0] = 100_000 ether; // 10%
        amounts[1] = 200_000 ether; // 20%
        amounts[2] = 300_000 ether; // 30%
        amounts[3] = 150_000 ether; // 15%
        amounts[4] = 250_000 ether; // 25%

        for (uint256 i = 0; i < holders.length; i++) {
            // Add to KYC
            vm.prank(admin);
            kycRegistry.addInvestor(
                holders[i],
                IKYCRegistry.AccreditationTier.Retail,
                expiry,
                keccak256(abi.encodePacked(holders[i]))
            );

            // Mint tokens
            vm.prank(issuer);
            rwaToken.mint(holders[i], amounts[i]);
        }
    }
}
