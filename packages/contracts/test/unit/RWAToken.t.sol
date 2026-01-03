// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {RWAToken} from "../../src/RWAToken.sol";
import {KYCRegistry} from "../../src/KYCRegistry.sol";
import {IKYCRegistry} from "../../src/interfaces/IKYCRegistry.sol";
import {IRWAToken} from "../../src/interfaces/IRWAToken.sol";
import {IComplianceModule} from "../../src/interfaces/IComplianceModule.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title RWAToken Unit Tests
 * @notice Unit tests for RWAToken contract
 * @dev Requirements: 1.2, 1.3, 1.6
 */
contract RWATokenTest is Test {
    RWAToken public token;
    KYCRegistry public kycRegistry;
    address public admin;
    address public issuer;
    address public complianceOfficer;
    address public investor1;
    address public investor2;
    address public unverifiedUser;

    uint256 constant DEFAULT_EXPIRY = 365 days;
    uint256 constant MINT_AMOUNT = 1000 ether;

    event TransferRestricted(address indexed from, address indexed to, uint256 amount, string reason);
    event ComplianceModuleUpdated(address indexed module, bool enabled);
    event TokensPaused(address indexed by);
    event TokensUnpaused(address indexed by);
    event KYCRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);

    function setUp() public {
        admin = makeAddr("admin");
        issuer = makeAddr("issuer");
        complianceOfficer = makeAddr("complianceOfficer");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");
        unverifiedUser = makeAddr("unverifiedUser");

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
        token = RWAToken(address(tokenProxy));

        // Setup roles
        vm.startPrank(admin);
        token.grantIssuerRole(issuer);
        token.grantComplianceOfficerRole(complianceOfficer);
        vm.stopPrank();

        // Setup verified investors
        _setupVerifiedInvestor(investor1);
        _setupVerifiedInvestor(investor2);
    }

    /*//////////////////////////////////////////////////////////////
                        INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Initialize() public view {
        assertEq(token.name(), "RWA Token");
        assertEq(token.symbol(), "RWA");
        assertEq(token.kycRegistry(), address(kycRegistry));
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(token.hasRole(token.ISSUER_ROLE(), admin));
        assertTrue(token.hasRole(token.ISSUER_ROLE(), issuer));
        assertTrue(token.hasRole(token.COMPLIANCE_OFFICER_ROLE(), complianceOfficer));
    }

    function test_Initialize_WithoutKYCRegistry() public {
        RWAToken tokenImpl = new RWAToken();
        bytes memory tokenInitData = abi.encodeWithSelector(
            RWAToken.initialize.selector,
            "No KYC Token",
            "NKT",
            admin,
            address(0)
        );
        ERC1967Proxy tokenProxy = new ERC1967Proxy(address(tokenImpl), tokenInitData);
        RWAToken noKycToken = RWAToken(address(tokenProxy));

        assertEq(noKycToken.kycRegistry(), address(0));
    }

    /*//////////////////////////////////////////////////////////////
                        MINTING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Mint_ToVerifiedAddress() public {
        vm.prank(issuer);
        token.mint(investor1, MINT_AMOUNT);

        assertEq(token.balanceOf(investor1), MINT_AMOUNT);
        assertEq(token.totalSupply(), MINT_AMOUNT);
    }

    function test_Mint_RevertUnverifiedAddress() public {
        vm.prank(issuer);
        vm.expectRevert(abi.encodeWithSelector(RWAToken.NotVerified.selector, unverifiedUser));
        token.mint(unverifiedUser, MINT_AMOUNT);
    }

    function test_Mint_RevertZeroAddress() public {
        vm.prank(issuer);
        vm.expectRevert(RWAToken.InvalidAddress.selector);
        token.mint(address(0), MINT_AMOUNT);
    }

    function test_Mint_RevertUnauthorized() public {
        vm.prank(investor1);
        vm.expectRevert();
        token.mint(investor1, MINT_AMOUNT);
    }

    /*//////////////////////////////////////////////////////////////
                        TRANSFER TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Transfer_BetweenVerifiedAddresses() public {
        vm.prank(issuer);
        token.mint(investor1, MINT_AMOUNT);

        vm.prank(investor1);
        token.transfer(investor2, MINT_AMOUNT / 2);

        assertEq(token.balanceOf(investor1), MINT_AMOUNT / 2);
        assertEq(token.balanceOf(investor2), MINT_AMOUNT / 2);
    }

    function test_Transfer_RevertSenderNotVerified() public {
        // Mint to investor1
        vm.prank(issuer);
        token.mint(investor1, MINT_AMOUNT);

        // Remove investor1 from KYC
        vm.prank(admin);
        kycRegistry.removeInvestor(investor1);

        // Transfer should fail
        vm.prank(investor1);
        vm.expectRevert();
        token.transfer(investor2, MINT_AMOUNT / 2);
    }

    function test_Transfer_RevertRecipientNotVerified() public {
        vm.prank(issuer);
        token.mint(investor1, MINT_AMOUNT);

        vm.prank(investor1);
        vm.expectRevert();
        token.transfer(unverifiedUser, MINT_AMOUNT / 2);
    }

    function test_Transfer_EmitsTransferRestrictedEvent() public {
        vm.prank(issuer);
        token.mint(investor1, MINT_AMOUNT);

        vm.expectEmit(true, true, false, true);
        emit TransferRestricted(investor1, unverifiedUser, MINT_AMOUNT / 2, "Recipient not KYC verified");

        vm.prank(investor1);
        vm.expectRevert();
        token.transfer(unverifiedUser, MINT_AMOUNT / 2);
    }

    /*//////////////////////////////////////////////////////////////
                    COMPLIANCE MODULE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_AddComplianceModule() public {
        MockComplianceModule module = new MockComplianceModule(false);

        vm.expectEmit(true, false, false, true);
        emit ComplianceModuleUpdated(address(module), true);

        vm.prank(complianceOfficer);
        token.addComplianceModule(address(module));

        assertTrue(token.isComplianceModule(address(module)));
        address[] memory modules = token.getComplianceModules();
        assertEq(modules.length, 1);
        assertEq(modules[0], address(module));
    }

    function test_AddComplianceModule_RevertDuplicate() public {
        MockComplianceModule module = new MockComplianceModule(false);

        vm.prank(complianceOfficer);
        token.addComplianceModule(address(module));

        vm.prank(complianceOfficer);
        vm.expectRevert(abi.encodeWithSelector(RWAToken.ModuleAlreadyExists.selector, address(module)));
        token.addComplianceModule(address(module));
    }

    function test_RemoveComplianceModule() public {
        MockComplianceModule module = new MockComplianceModule(false);

        vm.prank(complianceOfficer);
        token.addComplianceModule(address(module));

        vm.expectEmit(true, false, false, true);
        emit ComplianceModuleUpdated(address(module), false);

        vm.prank(complianceOfficer);
        token.removeComplianceModule(address(module));

        assertFalse(token.isComplianceModule(address(module)));
    }

    function test_RemoveComplianceModule_RevertNotFound() public {
        address fakeModule = makeAddr("fakeModule");

        vm.prank(complianceOfficer);
        vm.expectRevert(abi.encodeWithSelector(RWAToken.ModuleNotFound.selector, fakeModule));
        token.removeComplianceModule(fakeModule);
    }

    function test_ComplianceModule_BlocksTransfer() public {
        MockComplianceModule blockingModule = new MockComplianceModule(true);

        vm.prank(complianceOfficer);
        token.addComplianceModule(address(blockingModule));

        vm.prank(issuer);
        token.mint(investor1, MINT_AMOUNT);

        vm.prank(investor1);
        vm.expectRevert();
        token.transfer(investor2, MINT_AMOUNT / 2);
    }

    /*//////////////////////////////////////////////////////////////
                        PAUSE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Pause() public {
        vm.expectEmit(true, false, false, false);
        emit TokensPaused(complianceOfficer);

        vm.prank(complianceOfficer);
        token.pause();

        assertTrue(token.paused());
    }

    function test_Unpause() public {
        vm.prank(complianceOfficer);
        token.pause();

        vm.expectEmit(true, false, false, false);
        emit TokensUnpaused(complianceOfficer);

        vm.prank(complianceOfficer);
        token.unpause();

        assertFalse(token.paused());
    }

    function test_Pause_BlocksTransfers() public {
        vm.prank(issuer);
        token.mint(investor1, MINT_AMOUNT);

        vm.prank(complianceOfficer);
        token.pause();

        vm.prank(investor1);
        vm.expectRevert();
        token.transfer(investor2, MINT_AMOUNT / 2);
    }

    function test_Pause_BlocksMinting() public {
        vm.prank(complianceOfficer);
        token.pause();

        vm.prank(issuer);
        vm.expectRevert();
        token.mint(investor1, MINT_AMOUNT);
    }

    /*//////////////////////////////////////////////////////////////
                        BURN TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Burn() public {
        vm.prank(issuer);
        token.mint(investor1, MINT_AMOUNT);

        vm.prank(issuer);
        token.burn(investor1, MINT_AMOUNT / 2);

        assertEq(token.balanceOf(investor1), MINT_AMOUNT / 2);
        assertEq(token.totalSupply(), MINT_AMOUNT / 2);
    }

    function test_Burn_RevertZeroAddress() public {
        vm.prank(issuer);
        vm.expectRevert(RWAToken.InvalidAddress.selector);
        token.burn(address(0), MINT_AMOUNT);
    }

    /*//////////////////////////////////////////////////////////////
                        SNAPSHOT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Snapshot() public {
        vm.prank(issuer);
        token.mint(investor1, MINT_AMOUNT);

        vm.prank(issuer);
        uint256 snapshotId = token.snapshot();

        assertEq(token.balanceOfAt(investor1, snapshotId), MINT_AMOUNT);
        assertEq(token.totalSupplyAt(snapshotId), MINT_AMOUNT);

        // Transfer after snapshot
        vm.prank(investor1);
        token.transfer(investor2, MINT_AMOUNT / 2);

        // Snapshot values unchanged
        assertEq(token.balanceOfAt(investor1, snapshotId), MINT_AMOUNT);
        assertEq(token.balanceOfAt(investor2, snapshotId), 0);

        // Current values changed
        assertEq(token.balanceOf(investor1), MINT_AMOUNT / 2);
        assertEq(token.balanceOf(investor2), MINT_AMOUNT / 2);
    }

    /*//////////////////////////////////////////////////////////////
                    KYC REGISTRY UPDATE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SetKYCRegistry() public {
        KYCRegistry newKycImpl = new KYCRegistry();
        bytes memory newKycInitData = abi.encodeWithSelector(KYCRegistry.initialize.selector, admin);
        ERC1967Proxy newKycProxy = new ERC1967Proxy(address(newKycImpl), newKycInitData);
        address newRegistry = address(newKycProxy);

        vm.expectEmit(true, true, false, false);
        emit KYCRegistryUpdated(address(kycRegistry), newRegistry);

        vm.prank(complianceOfficer);
        token.setKYCRegistry(newRegistry);

        assertEq(token.kycRegistry(), newRegistry);
    }

    function test_SetKYCRegistry_RevertZeroAddress() public {
        vm.prank(complianceOfficer);
        vm.expectRevert(RWAToken.InvalidAddress.selector);
        token.setKYCRegistry(address(0));
    }

    /*//////////////////////////////////////////////////////////////
                        TRANSFER ELIGIBILITY
    //////////////////////////////////////////////////////////////*/

    function test_IsTransferAllowed_BothVerified() public view {
        (bool allowed, string memory reason) = token.isTransferAllowed(investor1, investor2, MINT_AMOUNT);
        assertTrue(allowed);
        assertEq(reason, "");
    }

    function test_IsTransferAllowed_SenderNotVerified() public view {
        (bool allowed, string memory reason) = token.isTransferAllowed(unverifiedUser, investor2, MINT_AMOUNT);
        assertFalse(allowed);
        assertEq(reason, "Sender not KYC verified");
    }

    function test_IsTransferAllowed_RecipientNotVerified() public view {
        (bool allowed, string memory reason) = token.isTransferAllowed(investor1, unverifiedUser, MINT_AMOUNT);
        assertFalse(allowed);
        assertEq(reason, "Recipient not KYC verified");
    }

    /*//////////////////////////////////////////////////////////////
                            HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _setupVerifiedInvestor(address investor) internal {
        uint256 expiry = block.timestamp + DEFAULT_EXPIRY;
        bytes32 identityHash = keccak256(abi.encodePacked(investor, "identity"));
        vm.prank(admin);
        kycRegistry.addInvestor(investor, IKYCRegistry.AccreditationTier.Retail, expiry, identityHash);
    }
}

/**
 * @title MockComplianceModule
 * @notice Mock compliance module for testing
 */
contract MockComplianceModule is IComplianceModule {
    bool public shouldBlock;

    constructor(bool _shouldBlock) {
        shouldBlock = _shouldBlock;
    }

    function checkCompliance(address, address, uint256) external view returns (bool compliant, string memory reason) {
        if (shouldBlock) {
            return (false, "MockModule: Transfer blocked");
        }
        return (true, "");
    }

    function moduleName() external pure returns (string memory) {
        return "MockComplianceModule";
    }

    function onTransfer(address, address, uint256) external {}
}
