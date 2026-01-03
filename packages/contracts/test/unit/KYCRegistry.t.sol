// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {KYCRegistry} from "../../src/KYCRegistry.sol";
import {IKYCRegistry} from "../../src/interfaces/IKYCRegistry.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title KYCRegistry Unit Tests
 * @notice Unit tests for KYCRegistry contract edge cases
 * @dev Requirements: 4.1, 4.6
 */
contract KYCRegistryTest is Test {
    KYCRegistry public registry;
    address public admin;
    address public kycAdmin;
    address public investor1;
    address public investor2;

    uint256 constant DEFAULT_EXPIRY = 365 days;

    event InvestorVerified(address indexed investor, IKYCRegistry.AccreditationTier tier, uint256 expiry);
    event InvestorRemoved(address indexed investor);
    event InvestorUpdated(address indexed investor, IKYCRegistry.AccreditationTier newTier, uint256 newExpiry);

    function setUp() public {
        admin = makeAddr("admin");
        kycAdmin = makeAddr("kycAdmin");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");

        // Deploy implementation
        KYCRegistry implementation = new KYCRegistry();

        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(KYCRegistry.initialize.selector, admin);
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        registry = KYCRegistry(address(proxy));

        // Grant KYC admin role
        vm.startPrank(admin);
        registry.grantRole(registry.KYC_ADMIN_ROLE(), kycAdmin);
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Initialize() public view {
        assertTrue(registry.hasRole(registry.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(registry.hasRole(registry.KYC_ADMIN_ROLE(), admin));
        assertTrue(registry.hasRole(registry.UPGRADER_ROLE(), admin));
        assertEq(registry.investorCount(), 0);
    }

    function test_Initialize_RevertZeroAddress() public {
        KYCRegistry implementation = new KYCRegistry();
        bytes memory initData = abi.encodeWithSelector(KYCRegistry.initialize.selector, address(0));
        
        vm.expectRevert(KYCRegistry.InvalidAddress.selector);
        new ERC1967Proxy(address(implementation), initData);
    }

    /*//////////////////////////////////////////////////////////////
                        ADD INVESTOR TESTS
    //////////////////////////////////////////////////////////////*/

    function test_AddInvestor() public {
        uint256 expiry = block.timestamp + DEFAULT_EXPIRY;
        bytes32 identityHash = keccak256("identity1");

        vm.expectEmit(true, false, false, true);
        emit InvestorVerified(investor1, IKYCRegistry.AccreditationTier.Retail, expiry);

        vm.prank(kycAdmin);
        registry.addInvestor(investor1, IKYCRegistry.AccreditationTier.Retail, expiry, identityHash);

        assertTrue(registry.isVerified(investor1));
        assertEq(registry.investorCount(), 1);

        (bool verified, IKYCRegistry.AccreditationTier tier, uint256 storedExpiry, bytes32 storedHash) = 
            registry.getInvestorInfo(investor1);
        
        assertTrue(verified);
        assertEq(uint8(tier), uint8(IKYCRegistry.AccreditationTier.Retail));
        assertEq(storedExpiry, expiry);
        assertEq(storedHash, identityHash);
    }

    function test_AddInvestor_RevertDuplicate() public {
        uint256 expiry = block.timestamp + DEFAULT_EXPIRY;
        bytes32 identityHash = keccak256("identity1");

        vm.prank(kycAdmin);
        registry.addInvestor(investor1, IKYCRegistry.AccreditationTier.Retail, expiry, identityHash);

        vm.expectRevert(abi.encodeWithSelector(KYCRegistry.InvestorAlreadyExists.selector, investor1));
        vm.prank(kycAdmin);
        registry.addInvestor(investor1, IKYCRegistry.AccreditationTier.Accredited, expiry, identityHash);
    }

    function test_AddInvestor_RevertZeroAddress() public {
        uint256 expiry = block.timestamp + DEFAULT_EXPIRY;
        bytes32 identityHash = keccak256("identity1");

        vm.expectRevert(KYCRegistry.InvalidAddress.selector);
        vm.prank(kycAdmin);
        registry.addInvestor(address(0), IKYCRegistry.AccreditationTier.Retail, expiry, identityHash);
    }

    function test_AddInvestor_RevertPastExpiry() public {
        uint256 pastExpiry = block.timestamp - 1;
        bytes32 identityHash = keccak256("identity1");

        vm.expectRevert(abi.encodeWithSelector(KYCRegistry.InvalidExpiry.selector, pastExpiry));
        vm.prank(kycAdmin);
        registry.addInvestor(investor1, IKYCRegistry.AccreditationTier.Retail, pastExpiry, identityHash);
    }

    function test_AddInvestor_RevertCurrentTimestampExpiry() public {
        uint256 currentExpiry = block.timestamp;
        bytes32 identityHash = keccak256("identity1");

        vm.expectRevert(abi.encodeWithSelector(KYCRegistry.InvalidExpiry.selector, currentExpiry));
        vm.prank(kycAdmin);
        registry.addInvestor(investor1, IKYCRegistry.AccreditationTier.Retail, currentExpiry, identityHash);
    }

    function test_AddInvestor_RevertUnauthorized() public {
        uint256 expiry = block.timestamp + DEFAULT_EXPIRY;
        bytes32 identityHash = keccak256("identity1");

        vm.expectRevert();
        vm.prank(investor1);
        registry.addInvestor(investor1, IKYCRegistry.AccreditationTier.Retail, expiry, identityHash);
    }

    /*//////////////////////////////////////////////////////////////
                        REMOVE INVESTOR TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RemoveInvestor() public {
        uint256 expiry = block.timestamp + DEFAULT_EXPIRY;
        bytes32 identityHash = keccak256("identity1");

        vm.prank(kycAdmin);
        registry.addInvestor(investor1, IKYCRegistry.AccreditationTier.Retail, expiry, identityHash);
        assertEq(registry.investorCount(), 1);

        vm.expectEmit(true, false, false, false);
        emit InvestorRemoved(investor1);

        vm.prank(kycAdmin);
        registry.removeInvestor(investor1);

        assertFalse(registry.isVerified(investor1));
        assertEq(registry.investorCount(), 0);
    }

    function test_RemoveInvestor_RevertNotFound() public {
        vm.expectRevert(abi.encodeWithSelector(KYCRegistry.InvestorNotFound.selector, investor1));
        vm.prank(kycAdmin);
        registry.removeInvestor(investor1);
    }

    function test_RemoveInvestor_RevertZeroAddress() public {
        vm.expectRevert(KYCRegistry.InvalidAddress.selector);
        vm.prank(kycAdmin);
        registry.removeInvestor(address(0));
    }

    /*//////////////////////////////////////////////////////////////
                        UPDATE INVESTOR TESTS
    //////////////////////////////////////////////////////////////*/

    function test_UpdateInvestor() public {
        uint256 expiry = block.timestamp + DEFAULT_EXPIRY;
        uint256 newExpiry = block.timestamp + 2 * DEFAULT_EXPIRY;
        bytes32 identityHash = keccak256("identity1");

        vm.prank(kycAdmin);
        registry.addInvestor(investor1, IKYCRegistry.AccreditationTier.Retail, expiry, identityHash);

        vm.expectEmit(true, false, false, true);
        emit InvestorUpdated(investor1, IKYCRegistry.AccreditationTier.Accredited, newExpiry);

        vm.prank(kycAdmin);
        registry.updateInvestor(investor1, IKYCRegistry.AccreditationTier.Accredited, newExpiry);

        (, IKYCRegistry.AccreditationTier tier, uint256 storedExpiry, ) = registry.getInvestorInfo(investor1);
        assertEq(uint8(tier), uint8(IKYCRegistry.AccreditationTier.Accredited));
        assertEq(storedExpiry, newExpiry);
    }

    function test_UpdateInvestor_RevertNotFound() public {
        uint256 newExpiry = block.timestamp + DEFAULT_EXPIRY;

        vm.expectRevert(abi.encodeWithSelector(KYCRegistry.InvestorNotFound.selector, investor1));
        vm.prank(kycAdmin);
        registry.updateInvestor(investor1, IKYCRegistry.AccreditationTier.Accredited, newExpiry);
    }

    function test_UpdateInvestor_RevertPastExpiry() public {
        uint256 expiry = block.timestamp + DEFAULT_EXPIRY;
        bytes32 identityHash = keccak256("identity1");

        vm.prank(kycAdmin);
        registry.addInvestor(investor1, IKYCRegistry.AccreditationTier.Retail, expiry, identityHash);

        uint256 pastExpiry = block.timestamp - 1;
        vm.expectRevert(abi.encodeWithSelector(KYCRegistry.InvalidExpiry.selector, pastExpiry));
        vm.prank(kycAdmin);
        registry.updateInvestor(investor1, IKYCRegistry.AccreditationTier.Accredited, pastExpiry);
    }

    /*//////////////////////////////////////////////////////////////
                        BATCH ADD TESTS
    //////////////////////////////////////////////////////////////*/

    function test_BatchAddInvestors() public {
        address[] memory investors = new address[](3);
        investors[0] = makeAddr("batch1");
        investors[1] = makeAddr("batch2");
        investors[2] = makeAddr("batch3");

        IKYCRegistry.AccreditationTier[] memory tiers = new IKYCRegistry.AccreditationTier[](3);
        tiers[0] = IKYCRegistry.AccreditationTier.Retail;
        tiers[1] = IKYCRegistry.AccreditationTier.Accredited;
        tiers[2] = IKYCRegistry.AccreditationTier.Institutional;

        uint256[] memory expiries = new uint256[](3);
        expiries[0] = block.timestamp + 100 days;
        expiries[1] = block.timestamp + 200 days;
        expiries[2] = block.timestamp + 300 days;

        bytes32[] memory hashes = new bytes32[](3);
        hashes[0] = keccak256("hash1");
        hashes[1] = keccak256("hash2");
        hashes[2] = keccak256("hash3");

        vm.prank(kycAdmin);
        registry.batchAddInvestors(investors, tiers, expiries, hashes);

        assertEq(registry.investorCount(), 3);
        assertTrue(registry.isVerified(investors[0]));
        assertTrue(registry.isVerified(investors[1]));
        assertTrue(registry.isVerified(investors[2]));

        assertFalse(registry.isAccredited(investors[0])); // Retail
        assertTrue(registry.isAccredited(investors[1]));  // Accredited
        assertTrue(registry.isAccredited(investors[2]));  // Institutional
    }

    function test_BatchAddInvestors_RevertEmptyArray() public {
        address[] memory investors = new address[](0);
        IKYCRegistry.AccreditationTier[] memory tiers = new IKYCRegistry.AccreditationTier[](0);
        uint256[] memory expiries = new uint256[](0);
        bytes32[] memory hashes = new bytes32[](0);

        vm.expectRevert(KYCRegistry.EmptyArray.selector);
        vm.prank(kycAdmin);
        registry.batchAddInvestors(investors, tiers, expiries, hashes);
    }

    function test_BatchAddInvestors_RevertArrayLengthMismatch() public {
        address[] memory investors = new address[](2);
        investors[0] = makeAddr("batch1");
        investors[1] = makeAddr("batch2");

        IKYCRegistry.AccreditationTier[] memory tiers = new IKYCRegistry.AccreditationTier[](1);
        tiers[0] = IKYCRegistry.AccreditationTier.Retail;

        uint256[] memory expiries = new uint256[](2);
        expiries[0] = block.timestamp + 100 days;
        expiries[1] = block.timestamp + 200 days;

        bytes32[] memory hashes = new bytes32[](2);
        hashes[0] = keccak256("hash1");
        hashes[1] = keccak256("hash2");

        vm.expectRevert(KYCRegistry.ArrayLengthMismatch.selector);
        vm.prank(kycAdmin);
        registry.batchAddInvestors(investors, tiers, expiries, hashes);
    }

    function test_BatchAddInvestors_RevertOnInvalidData() public {
        address[] memory investors = new address[](2);
        investors[0] = makeAddr("batch1");
        investors[1] = address(0); // Invalid

        IKYCRegistry.AccreditationTier[] memory tiers = new IKYCRegistry.AccreditationTier[](2);
        tiers[0] = IKYCRegistry.AccreditationTier.Retail;
        tiers[1] = IKYCRegistry.AccreditationTier.Retail;

        uint256[] memory expiries = new uint256[](2);
        expiries[0] = block.timestamp + 100 days;
        expiries[1] = block.timestamp + 200 days;

        bytes32[] memory hashes = new bytes32[](2);
        hashes[0] = keccak256("hash1");
        hashes[1] = keccak256("hash2");

        vm.expectRevert(KYCRegistry.InvalidAddress.selector);
        vm.prank(kycAdmin);
        registry.batchAddInvestors(investors, tiers, expiries, hashes);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_IsExpired() public {
        uint256 expiry = block.timestamp + 1 days;
        bytes32 identityHash = keccak256("identity1");

        vm.prank(kycAdmin);
        registry.addInvestor(investor1, IKYCRegistry.AccreditationTier.Retail, expiry, identityHash);

        assertFalse(registry.isExpired(investor1));

        vm.warp(expiry + 1);
        assertTrue(registry.isExpired(investor1));
    }

    function test_GetExpiry() public {
        uint256 expiry = block.timestamp + DEFAULT_EXPIRY;
        bytes32 identityHash = keccak256("identity1");

        vm.prank(kycAdmin);
        registry.addInvestor(investor1, IKYCRegistry.AccreditationTier.Retail, expiry, identityHash);

        assertEq(registry.getExpiry(investor1), expiry);
        assertEq(registry.getExpiry(investor2), 0); // Not registered
    }

    function test_GetTier() public {
        uint256 expiry = block.timestamp + DEFAULT_EXPIRY;
        bytes32 identityHash = keccak256("identity1");

        vm.prank(kycAdmin);
        registry.addInvestor(investor1, IKYCRegistry.AccreditationTier.Institutional, expiry, identityHash);

        assertEq(uint8(registry.getTier(investor1)), uint8(IKYCRegistry.AccreditationTier.Institutional));
        assertEq(uint8(registry.getTier(investor2)), uint8(IKYCRegistry.AccreditationTier.None)); // Not registered
    }

    function test_IsAccredited_ExpiredInvestor() public {
        uint256 expiry = block.timestamp + 1 days;
        bytes32 identityHash = keccak256("identity1");

        vm.prank(kycAdmin);
        registry.addInvestor(investor1, IKYCRegistry.AccreditationTier.Accredited, expiry, identityHash);

        assertTrue(registry.isAccredited(investor1));

        vm.warp(expiry + 1);
        assertFalse(registry.isAccredited(investor1)); // Expired, so not accredited
    }
}
