// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {KYCRegistry} from "../../src/KYCRegistry.sol";
import {IKYCRegistry} from "../../src/interfaces/IKYCRegistry.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title KYCRegistry Property Tests
 * @notice Property-based tests for KYCRegistry contract
 * @dev Feature: mantle-rwa-sdk, Properties 13-15
 */
contract KYCRegistryPropertyTest is Test {
    KYCRegistry public registry;
    address public admin;
    address public user;

    function setUp() public {
        admin = makeAddr("admin");
        user = makeAddr("user");

        // Deploy implementation
        KYCRegistry implementation = new KYCRegistry();

        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(KYCRegistry.initialize.selector, admin);
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        registry = KYCRegistry(address(proxy));
    }

    /*//////////////////////////////////////////////////////////////
                    PROPERTY 13: KYC EXPIRY ENFORCEMENT
    //////////////////////////////////////////////////////////////*/

    /// @dev Feature: mantle-rwa-sdk, Property 13: KYC Expiry Enforcement
    /// For any investor with an expiry timestamp in the past, isVerified() SHALL return false
    /// regardless of their verification status.
    /// @param investorSeed Seed for generating investor address
    /// @param tierValue Tier value (0-3)
    /// @param expiryOffset Offset from current timestamp for expiry
    function testProperty_ExpiryEnforcement(
        uint256 investorSeed,
        uint8 tierValue,
        uint256 expiryOffset
    ) public {
        // Bound inputs
        address investor = _boundAddress(investorSeed);
        IKYCRegistry.AccreditationTier tier = _boundTier(tierValue);
        
        // Create a valid expiry first (in the future)
        uint256 futureExpiry = block.timestamp + 1 days + (expiryOffset % 365 days);
        bytes32 identityHash = keccak256(abi.encodePacked(investor, "identity"));

        // Add investor with future expiry
        vm.prank(admin);
        registry.addInvestor(investor, tier, futureExpiry, identityHash);

        // Verify investor is verified when not expired
        assertTrue(registry.isVerified(investor), "Should be verified before expiry");

        // Warp time past expiry
        vm.warp(futureExpiry + 1);

        // Property: isVerified() SHALL return false for expired investors
        assertFalse(registry.isVerified(investor), "Should NOT be verified after expiry");

        // Verify the investor data still exists but is expired
        (bool verified, , uint256 expiry, ) = registry.getInvestorInfo(investor);
        assertTrue(verified, "Verified flag should still be true in storage");
        assertTrue(expiry <= block.timestamp, "Expiry should be in the past");
    }

    /// @dev Additional property test: Expiry at exact timestamp boundary
    function testProperty_ExpiryAtExactTimestamp(uint256 investorSeed, uint8 tierValue) public {
        address investor = _boundAddress(investorSeed);
        IKYCRegistry.AccreditationTier tier = _boundTier(tierValue);
        
        uint256 exactExpiry = block.timestamp + 1 days;
        bytes32 identityHash = keccak256(abi.encodePacked(investor, "identity"));

        vm.prank(admin);
        registry.addInvestor(investor, tier, exactExpiry, identityHash);

        // At exactly expiry timestamp, should NOT be verified (uses > not >=)
        vm.warp(exactExpiry);
        assertFalse(registry.isVerified(investor), "Should NOT be verified at exact expiry");

        // One second before should still be verified
        vm.warp(exactExpiry - 1);
        assertTrue(registry.isVerified(investor), "Should be verified 1 second before expiry");
    }

    /*//////////////////////////////////////////////////////////////
                PROPERTY 14: ACCREDITATION TIER CONSISTENCY
    //////////////////////////////////////////////////////////////*/

    /// @dev Feature: mantle-rwa-sdk, Property 14: Accreditation Tier Consistency
    /// For any investor added with a specific accreditation tier, querying their info SHALL
    /// return the same tier, and isAccredited() SHALL return true only for Accredited or
    /// Institutional tiers.
    function testProperty_AccreditationTierConsistency(
        uint256 investorSeed,
        uint8 tierValue,
        uint256 expiryOffset
    ) public {
        address investor = _boundAddress(investorSeed);
        IKYCRegistry.AccreditationTier tier = _boundTier(tierValue);
        uint256 expiry = block.timestamp + 1 days + (expiryOffset % 365 days);
        bytes32 identityHash = keccak256(abi.encodePacked(investor, "identity"));

        vm.prank(admin);
        registry.addInvestor(investor, tier, expiry, identityHash);

        // Property: Querying info SHALL return the same tier
        (, IKYCRegistry.AccreditationTier returnedTier, , ) = registry.getInvestorInfo(investor);
        assertEq(uint8(returnedTier), uint8(tier), "Returned tier should match input tier");

        // Property: isAccredited() SHALL return true only for Accredited or Institutional
        bool isAccredited = registry.isAccredited(investor);
        bool shouldBeAccredited = tier == IKYCRegistry.AccreditationTier.Accredited ||
            tier == IKYCRegistry.AccreditationTier.Institutional;

        assertEq(isAccredited, shouldBeAccredited, "isAccredited should match tier status");
    }

    /// @dev Property test: Tier update consistency
    function testProperty_TierUpdateConsistency(
        uint256 investorSeed,
        uint8 initialTierValue,
        uint8 newTierValue,
        uint256 expiryOffset
    ) public {
        address investor = _boundAddress(investorSeed);
        IKYCRegistry.AccreditationTier initialTier = _boundTier(initialTierValue);
        IKYCRegistry.AccreditationTier newTier = _boundTier(newTierValue);
        uint256 expiry = block.timestamp + 1 days + (expiryOffset % 365 days);
        uint256 newExpiry = expiry + 1 days;
        bytes32 identityHash = keccak256(abi.encodePacked(investor, "identity"));

        // Add investor
        vm.prank(admin);
        registry.addInvestor(investor, initialTier, expiry, identityHash);

        // Update tier
        vm.prank(admin);
        registry.updateInvestor(investor, newTier, newExpiry);

        // Property: After update, tier should be the new tier
        (, IKYCRegistry.AccreditationTier returnedTier, , ) = registry.getInvestorInfo(investor);
        assertEq(uint8(returnedTier), uint8(newTier), "Tier should be updated");

        // Property: isAccredited should reflect new tier
        bool isAccredited = registry.isAccredited(investor);
        bool shouldBeAccredited = newTier == IKYCRegistry.AccreditationTier.Accredited ||
            newTier == IKYCRegistry.AccreditationTier.Institutional;
        assertEq(isAccredited, shouldBeAccredited, "isAccredited should reflect new tier");
    }

    /*//////////////////////////////////////////////////////////////
                    PROPERTY 15: IDENTITY HASH PRIVACY
    //////////////////////////////////////////////////////////////*/

    /// @dev Feature: mantle-rwa-sdk, Property 15: Identity Hash Privacy
    /// For any investor in the KYC registry, the stored identity data SHALL be a 32-byte hash,
    /// not raw PII.
    function testProperty_IdentityHashPrivacy(
        uint256 investorSeed,
        uint8 tierValue,
        uint256 expiryOffset,
        string memory rawIdentityData
    ) public {
        // Bound inputs
        vm.assume(bytes(rawIdentityData).length > 0 && bytes(rawIdentityData).length < 1000);
        
        address investor = _boundAddress(investorSeed);
        IKYCRegistry.AccreditationTier tier = _boundTier(tierValue);
        uint256 expiry = block.timestamp + 1 days + (expiryOffset % 365 days);
        
        // Create identity hash from raw data (simulating off-chain hashing)
        bytes32 identityHash = keccak256(abi.encodePacked(rawIdentityData));

        vm.prank(admin);
        registry.addInvestor(investor, tier, expiry, identityHash);

        // Property: Stored data SHALL be a 32-byte hash
        (, , , bytes32 storedHash) = registry.getInvestorInfo(investor);
        
        // Verify it's exactly 32 bytes (bytes32 type guarantees this)
        assertEq(storedHash.length, 32, "Identity hash should be 32 bytes");
        
        // Verify the hash matches what we computed
        assertEq(storedHash, identityHash, "Stored hash should match input hash");
        
        // Verify we cannot recover the original data from the hash
        // (This is implicit in the hash function properties, but we verify the hash is non-zero)
        assertTrue(storedHash != bytes32(0), "Hash should not be zero for non-empty data");
    }

    /// @dev Property test: Different identity data produces different hashes
    function testProperty_IdentityHashUniqueness(
        uint256 investor1Seed,
        uint256 investor2Seed,
        string memory identity1,
        string memory identity2
    ) public {
        vm.assume(bytes(identity1).length > 0 && bytes(identity1).length < 100);
        vm.assume(bytes(identity2).length > 0 && bytes(identity2).length < 100);
        vm.assume(keccak256(bytes(identity1)) != keccak256(bytes(identity2)));
        
        address investor1 = _boundAddress(investor1Seed);
        address investor2 = _boundAddress(investor2Seed);
        vm.assume(investor1 != investor2);

        uint256 expiry = block.timestamp + 365 days;
        bytes32 hash1 = keccak256(abi.encodePacked(identity1));
        bytes32 hash2 = keccak256(abi.encodePacked(identity2));

        vm.startPrank(admin);
        registry.addInvestor(investor1, IKYCRegistry.AccreditationTier.Retail, expiry, hash1);
        registry.addInvestor(investor2, IKYCRegistry.AccreditationTier.Retail, expiry, hash2);
        vm.stopPrank();

        (, , , bytes32 storedHash1) = registry.getInvestorInfo(investor1);
        (, , , bytes32 storedHash2) = registry.getInvestorInfo(investor2);

        // Property: Different identity data should produce different hashes
        assertTrue(storedHash1 != storedHash2, "Different identities should have different hashes");
    }

    /*//////////////////////////////////////////////////////////////
                            HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _boundAddress(uint256 seed) internal pure returns (address) {
        // Ensure address is not zero and not a precompile
        address addr = address(uint160(bound(seed, 100, type(uint160).max)));
        return addr;
    }

    function _boundTier(uint8 tierValue) internal pure returns (IKYCRegistry.AccreditationTier) {
        return IKYCRegistry.AccreditationTier(tierValue % 4);
    }
}
