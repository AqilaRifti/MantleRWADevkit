// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AssetVault} from "../../src/AssetVault.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC20Mock} from "../mocks/ERC20Mock.sol";

/**
 * @title AssetVault Property Tests
 * @notice Property-based tests for AssetVault contract
 * @dev Feature: mantle-rwa-sdk, Properties 6-9
 */
contract AssetVaultPropertyTest is Test {
    AssetVault public vault;
    ERC20Mock public mockToken;
    address public admin;
    address public signer1;
    address public signer2;
    address public signer3;
    address public recipient;

    uint256 constant INITIAL_BALANCE = 1_000_000 ether;
    uint256 constant WITHDRAWAL_THRESHOLD = 100 ether;

    function setUp() public {
        admin = makeAddr("admin");
        signer1 = makeAddr("signer1");
        signer2 = makeAddr("signer2");
        signer3 = makeAddr("signer3");
        recipient = makeAddr("recipient");

        // Deploy mock token
        mockToken = new ERC20Mock("Mock Token", "MTK");

        // Deploy vault
        address[] memory signers = new address[](3);
        signers[0] = signer1;
        signers[1] = signer2;
        signers[2] = signer3;

        AssetVault vaultImpl = new AssetVault();
        bytes memory initData = abi.encodeWithSelector(
            AssetVault.initialize.selector,
            admin,
            signers,
            2, // threshold
            WITHDRAWAL_THRESHOLD
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(vaultImpl), initData);
        vault = AssetVault(payable(address(proxy)));

        // Fund vault
        mockToken.mint(address(vault), INITIAL_BALANCE);
        vm.deal(address(vault), INITIAL_BALANCE);
    }

    /*//////////////////////////////////////////////////////////////
            PROPERTY 6: MULTI-SIGNATURE WITHDRAWAL THRESHOLD
    //////////////////////////////////////////////////////////////*/

    /// @dev Feature: mantle-rwa-sdk, Property 6: Multi-Signature Withdrawal Threshold
    /// For any Asset Vault withdrawal above the configured threshold, the withdrawal SHALL only
    /// execute after receiving the required number of unique signer approvals.
    function testProperty_MultiSigThreshold(uint256 amount, uint8 approverCount) public {
        // Bound inputs
        amount = bound(amount, WITHDRAWAL_THRESHOLD + 1, INITIAL_BALANCE / 2);
        approverCount = uint8(bound(approverCount, 0, 3));

        // Propose withdrawal
        vm.prank(signer1);
        uint256 proposalId = vault.proposeWithdrawal(address(mockToken), amount, recipient);

        // Get initial state
        (, , , uint256 initialApprovals, bool initialExecuted, ) = vault.getProposal(proposalId);
        assertEq(initialApprovals, 1, "Proposer should auto-approve");
        assertFalse(initialExecuted, "Should not be executed yet");

        // Add approvals based on approverCount
        if (approverCount >= 1) {
            vm.prank(signer2);
            vault.approveWithdrawal(proposalId);
        }

        (, , , uint256 finalApprovals, bool finalExecuted, ) = vault.getProposal(proposalId);

        // Property: Withdrawal executes only when threshold is met
        if (finalApprovals >= 2) {
            assertTrue(finalExecuted, "Should execute when threshold met");
            assertEq(mockToken.balanceOf(recipient), amount, "Recipient should receive funds");
        } else {
            assertFalse(finalExecuted, "Should NOT execute below threshold");
            assertEq(mockToken.balanceOf(recipient), 0, "Recipient should not receive funds");
        }
    }

    /// @dev Property test: Unique signer approvals
    function testProperty_UniqueSignerApprovals(uint256 amount) public {
        amount = bound(amount, WITHDRAWAL_THRESHOLD + 1, INITIAL_BALANCE / 2);

        vm.prank(signer1);
        uint256 proposalId = vault.proposeWithdrawal(address(mockToken), amount, recipient);

        // Property: Same signer cannot approve twice
        vm.prank(signer1);
        vm.expectRevert(AssetVault.AlreadyApproved.selector);
        vault.approveWithdrawal(proposalId);
    }

    /// @dev Property test: Below threshold executes immediately
    function testProperty_BelowThresholdExecutesImmediately(uint256 amount) public {
        amount = bound(amount, 1, WITHDRAWAL_THRESHOLD);

        uint256 recipientBalanceBefore = mockToken.balanceOf(recipient);

        vm.prank(signer1);
        uint256 proposalId = vault.proposeWithdrawal(address(mockToken), amount, recipient);

        (, , , , bool executed, ) = vault.getProposal(proposalId);

        // Property: Below threshold should execute immediately
        assertTrue(executed, "Below threshold should execute immediately");
        assertEq(mockToken.balanceOf(recipient), recipientBalanceBefore + amount);
    }

    /*//////////////////////////////////////////////////////////////
                PROPERTY 7: EMERGENCY MODE BEHAVIOR
    //////////////////////////////////////////////////////////////*/

    /// @dev Feature: mantle-rwa-sdk, Property 7: Emergency Mode Behavior
    /// For any Asset Vault in emergency state, emergency withdrawal functions SHALL be enabled,
    /// and after emergency is resolved, normal operations SHALL resume.
    function testProperty_EmergencyModeEnablesWithdrawal(uint256 amount) public {
        amount = bound(amount, 1, INITIAL_BALANCE / 2);

        // Not in emergency - emergency withdraw should fail
        vm.prank(admin);
        vm.expectRevert(AssetVault.NotInEmergency.selector);
        vault.emergencyWithdraw(address(mockToken), recipient);

        // Declare emergency
        vm.prank(admin);
        vault.declareEmergency();
        assertTrue(vault.isEmergency(), "Should be in emergency mode");

        // Property: Emergency withdrawal SHALL be enabled in emergency mode
        uint256 vaultBalance = mockToken.balanceOf(address(vault));
        vm.prank(admin);
        vault.emergencyWithdraw(address(mockToken), recipient);
        assertEq(mockToken.balanceOf(recipient), vaultBalance, "Should withdraw all tokens");

        // Resolve emergency
        vm.prank(admin);
        vault.resolveEmergency();
        assertFalse(vault.isEmergency(), "Should not be in emergency mode");

        // Property: After resolution, emergency withdraw should fail again
        vm.prank(admin);
        vm.expectRevert(AssetVault.NotInEmergency.selector);
        vault.emergencyWithdraw(address(mockToken), recipient);
    }

    /// @dev Property test: Emergency mode for ETH
    function testProperty_EmergencyModeETH() public {
        uint256 ethBalance = address(vault).balance;

        vm.prank(admin);
        vault.declareEmergency();

        vm.prank(admin);
        vault.emergencyWithdraw(address(0), recipient);

        assertEq(recipient.balance, ethBalance, "Should withdraw all ETH");
    }

    /*//////////////////////////////////////////////////////////////
                PROPERTY 8: REENTRANCY PROTECTION
    //////////////////////////////////////////////////////////////*/

    /// @dev Feature: mantle-rwa-sdk, Property 8: Reentrancy Protection
    /// For any external call that transfers value from Asset Vault, a reentrant call to the
    /// same function SHALL revert.
    function testProperty_ReentrancyProtection() public {
        // Deploy malicious recipient
        ReentrantAttacker attacker = new ReentrantAttacker(address(vault));
        
        // Fund attacker to be a signer (for testing purposes, we'll use admin)
        vm.prank(admin);
        vault.addSigner(address(attacker));

        // Fund vault with ETH
        vm.deal(address(vault), 10 ether);

        // Attempt reentrancy attack
        vm.prank(address(attacker));
        vm.expectRevert(); // Should revert due to reentrancy guard
        vault.proposeWithdrawal(address(0), 1 ether, address(attacker));
    }

    /*//////////////////////////////////////////////////////////////
            PROPERTY 9: COLLATERALIZATION RATIO ACCURACY
    //////////////////////////////////////////////////////////////*/

    /// @dev Feature: mantle-rwa-sdk, Property 9: Collateralization Ratio Accuracy
    /// For any Asset Vault state, the collateralization ratio returned SHALL equal
    /// (total asset value / total token supply) calculated from current balances.
    function testProperty_CollateralizationRatioAccuracy(uint256 assetValue, uint256 tokenSupply) public {
        // Bound inputs to reasonable values
        assetValue = bound(assetValue, 1, type(uint128).max);
        tokenSupply = bound(tokenSupply, 1, type(uint128).max);

        // Deploy mock RWA token
        ERC20Mock rwaToken = new ERC20Mock("RWA Token", "RWA");
        rwaToken.mint(address(this), tokenSupply);

        // Set RWA token and asset value
        vm.prank(admin);
        vault.setRWAToken(address(rwaToken));

        vm.prank(signer1);
        vault.setTotalAssetValue(assetValue);

        // Calculate expected ratio
        uint256 expectedRatio = (assetValue * 10000) / tokenSupply;
        uint256 actualRatio = vault.getCollateralizationRatio();

        // Property: Ratio SHALL equal (assetValue * BASIS_POINTS) / tokenSupply
        assertEq(actualRatio, expectedRatio, "Collateralization ratio should match calculation");
    }

    /// @dev Property test: Backing verification
    function testProperty_BackingVerification(uint256 assetValue, uint256 tokenSupply) public {
        assetValue = bound(assetValue, 0, type(uint128).max);
        tokenSupply = bound(tokenSupply, 1, type(uint128).max);

        ERC20Mock rwaToken = new ERC20Mock("RWA Token", "RWA");
        rwaToken.mint(address(this), tokenSupply);

        vm.prank(admin);
        vault.setRWAToken(address(rwaToken));

        vm.prank(signer1);
        vault.setTotalAssetValue(assetValue);

        bool isVerified = vault.isBackingVerified();

        // Property: isBackingVerified returns true iff assetValue >= tokenSupply
        if (assetValue >= tokenSupply) {
            assertTrue(isVerified, "Should be verified when assets >= supply");
        } else {
            assertFalse(isVerified, "Should NOT be verified when assets < supply");
        }
    }
}

/**
 * @title ReentrantAttacker
 * @notice Contract that attempts reentrancy attack
 */
contract ReentrantAttacker {
    AssetVault public vault;
    bool public attacking;

    constructor(address _vault) {
        vault = AssetVault(payable(_vault));
    }

    receive() external payable {
        if (!attacking) {
            attacking = true;
            // Attempt reentrant call
            vault.proposeWithdrawal(address(0), 1 ether, address(this));
        }
    }
}
