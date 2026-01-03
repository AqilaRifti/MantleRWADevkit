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
 * @title YieldDistributor Unit Tests
 * @notice Unit tests for YieldDistributor contract
 * @dev Requirements: 3.4, 3.5
 */
contract YieldDistributorTest is Test {
    YieldDistributor public distributor;
    RWAToken public rwaToken;
    KYCRegistry public kycRegistry;
    ERC20Mock public usdc;

    address public admin;
    address public issuer;
    address public holder1;
    address public holder2;
    address public holder3;

    uint256 constant DEFAULT_EXPIRY = 365 days;
    uint256 constant DISTRIBUTION_AMOUNT = 100_000 * 1e6;

    event DistributionCreated(
        uint256 indexed distributionId,
        address indexed paymentToken,
        uint256 totalAmount,
        uint256 snapshotId
    );
    event YieldClaimed(uint256 indexed distributionId, address indexed claimant, uint256 amount);
    event UnclaimedFundsHandled(uint256 indexed distributionId, uint256 amount, address indexed recipient);

    function setUp() public {
        admin = makeAddr("admin");
        issuer = makeAddr("issuer");
        holder1 = makeAddr("holder1");
        holder2 = makeAddr("holder2");
        holder3 = makeAddr("holder3");

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

        // Deploy USDC mock
        usdc = new ERC20Mock("USD Coin", "USDC");

        // Setup roles
        vm.startPrank(admin);
        rwaToken.grantIssuerRole(issuer);
        rwaToken.grantIssuerRole(address(distributor)); // YieldDistributor needs ISSUER_ROLE for snapshots
        vm.stopPrank();

        // Setup holders
        _setupHolder(holder1, 500_000 ether); // 50%
        _setupHolder(holder2, 300_000 ether); // 30%
        _setupHolder(holder3, 200_000 ether); // 20%
    }

    /*//////////////////////////////////////////////////////////////
                        INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Initialize() public view {
        assertEq(address(distributor.rwaToken()), address(rwaToken));
        assertEq(distributor.unclaimedFundsRecipient(), admin);
        assertEq(distributor.distributionCount(), 0);
    }

    /*//////////////////////////////////////////////////////////////
                    CREATE DISTRIBUTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_CreateDistribution() public {
        usdc.mint(admin, DISTRIBUTION_AMOUNT);

        vm.startPrank(admin);
        usdc.approve(address(distributor), DISTRIBUTION_AMOUNT);

        vm.expectEmit(true, true, false, true);
        emit DistributionCreated(0, address(usdc), DISTRIBUTION_AMOUNT, 1);

        uint256 distId = distributor.createDistribution(address(usdc), DISTRIBUTION_AMOUNT, 30);
        vm.stopPrank();

        assertEq(distId, 0);
        assertEq(distributor.distributionCount(), 1);

        (address paymentToken, uint256 totalAmount, uint256 snapshotId, uint256 claimDeadline, uint256 claimedAmount) =
            distributor.getDistributionInfo(distId);

        assertEq(paymentToken, address(usdc));
        assertEq(totalAmount, DISTRIBUTION_AMOUNT);
        assertEq(snapshotId, 1);
        assertEq(claimDeadline, block.timestamp + 30 days);
        assertEq(claimedAmount, 0);
    }

    function test_CreateDistribution_RevertZeroAmount() public {
        vm.prank(admin);
        vm.expectRevert(YieldDistributor.InvalidAmount.selector);
        distributor.createDistribution(address(usdc), 0, 30);
    }

    function test_CreateDistribution_RevertZeroClaimWindow() public {
        usdc.mint(admin, DISTRIBUTION_AMOUNT);

        vm.startPrank(admin);
        usdc.approve(address(distributor), DISTRIBUTION_AMOUNT);

        vm.expectRevert(YieldDistributor.InvalidClaimWindow.selector);
        distributor.createDistribution(address(usdc), DISTRIBUTION_AMOUNT, 0);
        vm.stopPrank();
    }

    function test_CreateDistribution_RevertUnauthorized() public {
        usdc.mint(holder1, DISTRIBUTION_AMOUNT);

        vm.startPrank(holder1);
        usdc.approve(address(distributor), DISTRIBUTION_AMOUNT);

        vm.expectRevert();
        distributor.createDistribution(address(usdc), DISTRIBUTION_AMOUNT, 30);
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                            CLAIM TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Claim() public {
        uint256 distId = _createDistribution();

        uint256 expectedAmount = distributor.getClaimableAmount(distId, holder1);
        uint256 balanceBefore = usdc.balanceOf(holder1);

        vm.expectEmit(true, true, false, true);
        emit YieldClaimed(distId, holder1, expectedAmount);

        vm.prank(holder1);
        distributor.claim(distId);

        assertEq(usdc.balanceOf(holder1), balanceBefore + expectedAmount);
        assertTrue(distributor.hasClaimed(distId, holder1));
        assertEq(distributor.getClaimableAmount(distId, holder1), 0);
    }

    function test_Claim_RevertAlreadyClaimed() public {
        uint256 distId = _createDistribution();

        vm.prank(holder1);
        distributor.claim(distId);

        vm.prank(holder1);
        vm.expectRevert(YieldDistributor.AlreadyClaimed.selector);
        distributor.claim(distId);
    }

    function test_Claim_RevertExpired() public {
        uint256 distId = _createDistribution();

        // Warp past deadline
        vm.warp(block.timestamp + 31 days);

        vm.prank(holder1);
        vm.expectRevert(YieldDistributor.ClaimWindowExpired.selector);
        distributor.claim(distId);
    }

    function test_Claim_RevertNothingToClaim() public {
        uint256 distId = _createDistribution();

        address nonHolder = makeAddr("nonHolder");

        vm.prank(nonHolder);
        vm.expectRevert(YieldDistributor.NothingToClaim.selector);
        distributor.claim(distId);
    }

    function test_ClaimMultiple() public {
        uint256 distId1 = _createDistribution();
        uint256 distId2 = _createDistribution();

        uint256[] memory distIds = new uint256[](2);
        distIds[0] = distId1;
        distIds[1] = distId2;

        uint256 expected1 = distributor.getClaimableAmount(distId1, holder1);
        uint256 expected2 = distributor.getClaimableAmount(distId2, holder1);
        uint256 balanceBefore = usdc.balanceOf(holder1);

        vm.prank(holder1);
        distributor.claimMultiple(distIds);

        assertEq(usdc.balanceOf(holder1), balanceBefore + expected1 + expected2);
        assertTrue(distributor.hasClaimed(distId1, holder1));
        assertTrue(distributor.hasClaimed(distId2, holder1));
    }

    /*//////////////////////////////////////////////////////////////
                    UNCLAIMED FUNDS TESTS
    //////////////////////////////////////////////////////////////*/

    function test_HandleUnclaimedFunds() public {
        uint256 distId = _createDistribution();

        // Only holder1 claims
        vm.prank(holder1);
        distributor.claim(distId);

        // Warp past deadline
        vm.warp(block.timestamp + 31 days);

        uint256 unclaimedAmount = distributor.getUnclaimedAmount(distId);
        uint256 adminBalanceBefore = usdc.balanceOf(admin);

        vm.expectEmit(true, false, true, true);
        emit UnclaimedFundsHandled(distId, unclaimedAmount, admin);

        vm.prank(admin);
        distributor.handleUnclaimedFunds(distId);

        assertEq(usdc.balanceOf(admin), adminBalanceBefore + unclaimedAmount);
        assertTrue(distributor.isUnclaimedHandled(distId));
    }

    function test_HandleUnclaimedFunds_RevertNotExpired() public {
        uint256 distId = _createDistribution();

        vm.prank(admin);
        vm.expectRevert(YieldDistributor.ClaimWindowNotExpired.selector);
        distributor.handleUnclaimedFunds(distId);
    }

    function test_HandleUnclaimedFunds_RevertAlreadyHandled() public {
        uint256 distId = _createDistribution();

        vm.warp(block.timestamp + 31 days);

        vm.prank(admin);
        distributor.handleUnclaimedFunds(distId);

        vm.prank(admin);
        vm.expectRevert(YieldDistributor.UnclaimedAlreadyHandled.selector);
        distributor.handleUnclaimedFunds(distId);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetClaimableAmount() public {
        uint256 distId = _createDistribution();

        // holder1 has 50% of supply
        uint256 expected1 = (DISTRIBUTION_AMOUNT * 50) / 100;
        assertEq(distributor.getClaimableAmount(distId, holder1), expected1);

        // holder2 has 30% of supply
        uint256 expected2 = (DISTRIBUTION_AMOUNT * 30) / 100;
        assertEq(distributor.getClaimableAmount(distId, holder2), expected2);

        // holder3 has 20% of supply
        uint256 expected3 = (DISTRIBUTION_AMOUNT * 20) / 100;
        assertEq(distributor.getClaimableAmount(distId, holder3), expected3);
    }

    function test_GetClaimableAmount_AfterExpiry() public {
        uint256 distId = _createDistribution();

        vm.warp(block.timestamp + 31 days);

        assertEq(distributor.getClaimableAmount(distId, holder1), 0);
    }

    function test_SetUnclaimedFundsRecipient() public {
        address newRecipient = makeAddr("newRecipient");

        vm.prank(admin);
        distributor.setUnclaimedFundsRecipient(newRecipient);

        assertEq(distributor.unclaimedFundsRecipient(), newRecipient);
    }

    function test_SetUnclaimedFundsRecipient_RevertZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(YieldDistributor.InvalidAddress.selector);
        distributor.setUnclaimedFundsRecipient(address(0));
    }

    /*//////////////////////////////////////////////////////////////
                            HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _setupHolder(address holder, uint256 amount) internal {
        uint256 expiry = block.timestamp + DEFAULT_EXPIRY;

        vm.prank(admin);
        kycRegistry.addInvestor(holder, IKYCRegistry.AccreditationTier.Retail, expiry, keccak256(abi.encodePacked(holder)));

        vm.prank(issuer);
        rwaToken.mint(holder, amount);
    }

    function _createDistribution() internal returns (uint256) {
        usdc.mint(admin, DISTRIBUTION_AMOUNT);

        vm.startPrank(admin);
        usdc.approve(address(distributor), DISTRIBUTION_AMOUNT);
        uint256 distId = distributor.createDistribution(address(usdc), DISTRIBUTION_AMOUNT, 30);
        vm.stopPrank();

        return distId;
    }
}
