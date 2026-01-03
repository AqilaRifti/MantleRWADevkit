// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {RWAToken} from "../../src/RWAToken.sol";
import {KYCRegistry} from "../../src/KYCRegistry.sol";
import {IKYCRegistry} from "../../src/interfaces/IKYCRegistry.sol";
import {IComplianceModule} from "../../src/interfaces/IComplianceModule.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title RWAToken Property Tests
 * @notice Property-based tests for RWAToken contract
 * @dev Feature: mantle-rwa-sdk, Properties 1-5
 */
contract RWATokenPropertyTest is Test {
    RWAToken public token;
    KYCRegistry public kycRegistry;
    address public admin;
    address public issuer;
    address public complianceOfficer;

    uint256 constant DEFAULT_EXPIRY = 365 days;
    uint256 constant INITIAL_SUPPLY = 1_000_000 ether;

    function setUp() public {
        admin = makeAddr("admin");
        issuer = makeAddr("issuer");
        complianceOfficer = makeAddr("complianceOfficer");

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
    }

    /*//////////////////////////////////////////////////////////////
                PROPERTY 1: KYC-GATED TOKEN OPERATIONS
    //////////////////////////////////////////////////////////////*/

    /// @dev Feature: mantle-rwa-sdk, Property 1: KYC-Gated Token Operations
    /// For any RWA token transfer or mint operation, the operation SHALL succeed if and only if
    /// both the sender (for transfers) and recipient are verified in the KYC registry with
    /// non-expired status.
    function testProperty_KYCGatedTransfers(
        uint256 senderSeed,
        uint256 recipientSeed,
        uint256 amount,
        bool senderVerified,
        bool recipientVerified
    ) public {
        // Bound inputs
        address sender = _boundAddress(senderSeed);
        address recipient = _boundAddress(recipientSeed);
        vm.assume(sender != recipient);
        amount = bound(amount, 1, INITIAL_SUPPLY / 2);

        uint256 expiry = block.timestamp + DEFAULT_EXPIRY;
        bytes32 senderHash = keccak256(abi.encodePacked(sender, "identity"));
        bytes32 recipientHash = keccak256(abi.encodePacked(recipient, "identity"));

        // Setup KYC status
        vm.startPrank(admin);
        if (senderVerified) {
            kycRegistry.addInvestor(sender, IKYCRegistry.AccreditationTier.Retail, expiry, senderHash);
        }
        if (recipientVerified) {
            kycRegistry.addInvestor(recipient, IKYCRegistry.AccreditationTier.Retail, expiry, recipientHash);
        }
        vm.stopPrank();

        // Mint tokens to sender (requires sender to be verified)
        if (senderVerified) {
            vm.prank(issuer);
            token.mint(sender, amount);
        }

        // Attempt transfer
        if (senderVerified && recipientVerified) {
            // Property: Transfer SHALL succeed when both are verified
            vm.prank(sender);
            token.transfer(recipient, amount);
            assertEq(token.balanceOf(recipient), amount, "Transfer should succeed");
        } else if (senderVerified) {
            // Property: Transfer SHALL fail when recipient not verified
            vm.prank(sender);
            vm.expectRevert();
            token.transfer(recipient, amount);
        }
    }

    /// @dev Property test: Minting requires KYC verification
    function testProperty_MintRequiresKYC(uint256 recipientSeed, uint256 amount, bool isVerified) public {
        address recipient = _boundAddress(recipientSeed);
        amount = bound(amount, 1, INITIAL_SUPPLY);

        if (isVerified) {
            uint256 expiry = block.timestamp + DEFAULT_EXPIRY;
            bytes32 identityHash = keccak256(abi.encodePacked(recipient, "identity"));
            vm.prank(admin);
            kycRegistry.addInvestor(recipient, IKYCRegistry.AccreditationTier.Retail, expiry, identityHash);

            // Property: Mint SHALL succeed for verified recipient
            vm.prank(issuer);
            token.mint(recipient, amount);
            assertEq(token.balanceOf(recipient), amount, "Mint should succeed for verified");
        } else {
            // Property: Mint SHALL fail for unverified recipient
            vm.prank(issuer);
            vm.expectRevert(abi.encodeWithSelector(RWAToken.NotVerified.selector, recipient));
            token.mint(recipient, amount);
        }
    }

    /// @dev Property test: Expired KYC blocks transfers
    function testProperty_ExpiredKYCBlocksTransfer(
        uint256 senderSeed,
        uint256 recipientSeed,
        uint256 amount
    ) public {
        address sender = _boundAddress(senderSeed);
        address recipient = _boundAddress(recipientSeed);
        vm.assume(sender != recipient);
        amount = bound(amount, 1, INITIAL_SUPPLY / 2);

        uint256 shortExpiry = block.timestamp + 1 days;
        uint256 longExpiry = block.timestamp + DEFAULT_EXPIRY;

        // Setup both as verified
        vm.startPrank(admin);
        kycRegistry.addInvestor(sender, IKYCRegistry.AccreditationTier.Retail, shortExpiry, keccak256("sender"));
        kycRegistry.addInvestor(recipient, IKYCRegistry.AccreditationTier.Retail, longExpiry, keccak256("recipient"));
        vm.stopPrank();

        // Mint to sender
        vm.prank(issuer);
        token.mint(sender, amount);

        // Transfer works before expiry
        vm.prank(sender);
        token.transfer(recipient, amount / 2);

        // Warp past sender's expiry
        vm.warp(shortExpiry + 1);

        // Transfer back should fail (sender expired)
        vm.prank(recipient);
        vm.expectRevert();
        token.transfer(sender, amount / 4);
    }

    /*//////////////////////////////////////////////////////////////
                PROPERTY 2: COMPLIANCE MODULE EFFECTS
    //////////////////////////////////////////////////////////////*/

    /// @dev Feature: mantle-rwa-sdk, Property 2: Compliance Module Effects
    /// For any RWA token with compliance modules enabled, adding or removing a compliance module
    /// SHALL affect transfer eligibility according to the module's rules.
    function testProperty_ComplianceModuleEffects(
        uint256 senderSeed,
        uint256 recipientSeed,
        uint256 amount,
        bool moduleBlocks
    ) public {
        address sender = _boundAddress(senderSeed);
        address recipient = _boundAddress(recipientSeed);
        vm.assume(sender != recipient);
        amount = bound(amount, 1, INITIAL_SUPPLY / 2);

        // Setup KYC for both
        _setupVerifiedInvestor(sender);
        _setupVerifiedInvestor(recipient);

        // Mint to sender
        vm.prank(issuer);
        token.mint(sender, amount);

        // Deploy mock compliance module
        MockComplianceModule mockModule = new MockComplianceModule(moduleBlocks);

        // Add compliance module
        vm.prank(complianceOfficer);
        token.addComplianceModule(address(mockModule));

        if (moduleBlocks) {
            // Property: Transfer SHALL fail when module blocks
            vm.prank(sender);
            vm.expectRevert();
            token.transfer(recipient, amount);
        } else {
            // Property: Transfer SHALL succeed when module allows
            vm.prank(sender);
            token.transfer(recipient, amount);
            assertEq(token.balanceOf(recipient), amount);
        }

        // Remove module
        vm.prank(complianceOfficer);
        token.removeComplianceModule(address(mockModule));

        // After removal, transfer should work (if sender still has tokens)
        if (moduleBlocks) {
            vm.prank(sender);
            token.transfer(recipient, amount);
            assertEq(token.balanceOf(recipient), amount);
        }
    }

    /*//////////////////////////////////////////////////////////////
                PROPERTY 3: PAUSE HALTS ALL TRANSFERS
    //////////////////////////////////////////////////////////////*/

    /// @dev Feature: mantle-rwa-sdk, Property 3: Pause Halts All Transfers
    /// For any RWA token in paused state, all transfer operations SHALL revert,
    /// and after unpausing, transfers SHALL resume normally.
    function testProperty_PauseHaltsTransfers(
        uint256 senderSeed,
        uint256 recipientSeed,
        uint256 amount
    ) public {
        address sender = _boundAddress(senderSeed);
        address recipient = _boundAddress(recipientSeed);
        vm.assume(sender != recipient);
        amount = bound(amount, 1, INITIAL_SUPPLY / 2);

        // Setup KYC and mint
        _setupVerifiedInvestor(sender);
        _setupVerifiedInvestor(recipient);
        vm.prank(issuer);
        token.mint(sender, amount);

        // Pause
        vm.prank(complianceOfficer);
        token.pause();

        // Property: All transfers SHALL revert when paused
        vm.prank(sender);
        vm.expectRevert();
        token.transfer(recipient, amount);

        // Unpause
        vm.prank(complianceOfficer);
        token.unpause();

        // Property: Transfers SHALL resume after unpause
        vm.prank(sender);
        token.transfer(recipient, amount);
        assertEq(token.balanceOf(recipient), amount, "Transfer should work after unpause");
    }

    /*//////////////////////////////////////////////////////////////
                PROPERTY 4: ROLE-BASED ACCESS CONTROL
    //////////////////////////////////////////////////////////////*/

    /// @dev Feature: mantle-rwa-sdk, Property 4: Role-Based Access Control
    /// For any role-gated function, only accounts with the required role SHALL be able to
    /// execute the function; all other accounts SHALL receive an access denied error.
    function testProperty_RoleBasedAccessControl(uint256 callerSeed, uint256 targetSeed, uint256 amount) public {
        address caller = _boundAddress(callerSeed);
        address target = _boundAddress(targetSeed);
        vm.assume(caller != admin && caller != issuer && caller != complianceOfficer);
        amount = bound(amount, 1, INITIAL_SUPPLY);

        _setupVerifiedInvestor(target);

        // Property: Non-issuer cannot mint
        vm.prank(caller);
        vm.expectRevert();
        token.mint(target, amount);

        // Property: Issuer can mint
        vm.prank(issuer);
        token.mint(target, amount);
        assertEq(token.balanceOf(target), amount);

        // Property: Non-compliance officer cannot pause
        vm.prank(caller);
        vm.expectRevert();
        token.pause();

        // Property: Compliance officer can pause
        vm.prank(complianceOfficer);
        token.pause();
        assertTrue(token.paused());

        // Property: Non-compliance officer cannot unpause
        vm.prank(caller);
        vm.expectRevert();
        token.unpause();

        // Property: Compliance officer can unpause
        vm.prank(complianceOfficer);
        token.unpause();
        assertFalse(token.paused());
    }

    /// @dev Property test: Only admin can grant/revoke roles
    function testProperty_OnlyAdminCanManageRoles(uint256 callerSeed, uint256 targetSeed) public {
        address caller = _boundAddress(callerSeed);
        address target = _boundAddress(targetSeed);
        vm.assume(caller != admin);

        // Property: Non-admin cannot grant issuer role
        vm.prank(caller);
        vm.expectRevert();
        token.grantIssuerRole(target);

        // Property: Admin can grant issuer role
        vm.prank(admin);
        token.grantIssuerRole(target);
        assertTrue(token.hasRole(token.ISSUER_ROLE(), target));
    }

    /*//////////////////////////////////////////////////////////////
                            HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _boundAddress(uint256 seed) internal pure returns (address) {
        return address(uint160(bound(seed, 100, type(uint160).max)));
    }

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
