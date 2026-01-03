// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AssetVault} from "../../src/AssetVault.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC20Mock} from "../mocks/ERC20Mock.sol";

/**
 * @title AssetVault Unit Tests
 * @notice Unit tests for AssetVault contract
 * @dev Requirements: 2.1, 2.3
 */
contract AssetVaultTest is Test {
    AssetVault public vault;
    ERC20Mock public mockToken;
    address public admin;
    address public signer1;
    address public signer2;
    address public signer3;
    address public recipient;
    address public nonSigner;

    uint256 constant INITIAL_BALANCE = 1_000_000 ether;
    uint256 constant WITHDRAWAL_THRESHOLD = 100 ether;

    event Deposited(address indexed token, uint256 amount, address indexed depositor);
    event Withdrawn(address indexed token, uint256 amount, address indexed recipient);
    event EmergencyWithdrawal(address indexed token, uint256 amount, address indexed recipient);
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event ThresholdUpdated(uint256 newThreshold);
    event WithdrawalProposed(uint256 indexed proposalId, address indexed token, uint256 amount, address recipient);
    event WithdrawalApproved(uint256 indexed proposalId, address indexed approver);
    event EmergencyDeclared(address indexed declaredBy);
    event EmergencyResolved(address indexed resolvedBy);

    function setUp() public {
        admin = makeAddr("admin");
        signer1 = makeAddr("signer1");
        signer2 = makeAddr("signer2");
        signer3 = makeAddr("signer3");
        recipient = makeAddr("recipient");
        nonSigner = makeAddr("nonSigner");

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
                        INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Initialize() public view {
        assertEq(vault.approvalThreshold(), 2);
        assertEq(vault.withdrawalThreshold(), WITHDRAWAL_THRESHOLD);
        assertEq(vault.getSignerCount(), 3);
        assertTrue(vault.isSigner(signer1));
        assertTrue(vault.isSigner(signer2));
        assertTrue(vault.isSigner(signer3));
        assertFalse(vault.isEmergency());
    }

    function test_Initialize_RevertInvalidThreshold() public {
        address[] memory signers = new address[](2);
        signers[0] = signer1;
        signers[1] = signer2;

        AssetVault vaultImpl = new AssetVault();
        bytes memory initData = abi.encodeWithSelector(
            AssetVault.initialize.selector,
            admin,
            signers,
            3, // threshold > signers
            WITHDRAWAL_THRESHOLD
        );

        vm.expectRevert(AssetVault.InvalidThreshold.selector);
        new ERC1967Proxy(address(vaultImpl), initData);
    }

    /*//////////////////////////////////////////////////////////////
                        DEPOSIT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Deposit_ERC20() public {
        uint256 amount = 1000 ether;
        address depositor = makeAddr("depositor");
        mockToken.mint(depositor, amount);

        vm.startPrank(depositor);
        mockToken.approve(address(vault), amount);

        vm.expectEmit(true, true, false, true);
        emit Deposited(address(mockToken), amount, depositor);

        vault.deposit(address(mockToken), amount);
        vm.stopPrank();

        assertEq(mockToken.balanceOf(address(vault)), INITIAL_BALANCE + amount);
    }

    function test_Deposit_ETH() public {
        uint256 amount = 1 ether;
        address depositor = makeAddr("depositor");
        vm.deal(depositor, amount);

        vm.expectEmit(true, true, false, true);
        emit Deposited(address(0), amount, depositor);

        vm.prank(depositor);
        vault.depositETH{value: amount}();

        assertEq(address(vault).balance, INITIAL_BALANCE + amount);
    }

    function test_Deposit_RevertZeroAmount() public {
        vm.expectRevert(AssetVault.InvalidAmount.selector);
        vault.deposit(address(mockToken), 0);
    }

    /*//////////////////////////////////////////////////////////////
                        WITHDRAWAL TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ProposeWithdrawal_BelowThreshold() public {
        uint256 amount = WITHDRAWAL_THRESHOLD / 2;

        vm.expectEmit(true, true, false, true);
        emit WithdrawalProposed(0, address(mockToken), amount, recipient);

        vm.prank(signer1);
        uint256 proposalId = vault.proposeWithdrawal(address(mockToken), amount, recipient);

        (, , , , bool executed, ) = vault.getProposal(proposalId);
        assertTrue(executed, "Should execute immediately below threshold");
        assertEq(mockToken.balanceOf(recipient), amount);
    }

    function test_ProposeWithdrawal_AboveThreshold() public {
        uint256 amount = WITHDRAWAL_THRESHOLD * 2;

        vm.prank(signer1);
        uint256 proposalId = vault.proposeWithdrawal(address(mockToken), amount, recipient);

        (, , , uint256 approvalCount, bool executed, ) = vault.getProposal(proposalId);
        assertEq(approvalCount, 1);
        assertFalse(executed, "Should not execute above threshold with 1 approval");
    }

    function test_ApproveWithdrawal() public {
        uint256 amount = WITHDRAWAL_THRESHOLD * 2;

        vm.prank(signer1);
        uint256 proposalId = vault.proposeWithdrawal(address(mockToken), amount, recipient);

        vm.expectEmit(true, true, false, false);
        emit WithdrawalApproved(proposalId, signer2);

        vm.prank(signer2);
        vault.approveWithdrawal(proposalId);

        (, , , , bool executed, ) = vault.getProposal(proposalId);
        assertTrue(executed, "Should execute after reaching threshold");
        assertEq(mockToken.balanceOf(recipient), amount);
    }

    function test_ApproveWithdrawal_RevertAlreadyApproved() public {
        uint256 amount = WITHDRAWAL_THRESHOLD * 2;

        vm.prank(signer1);
        uint256 proposalId = vault.proposeWithdrawal(address(mockToken), amount, recipient);

        vm.prank(signer1);
        vm.expectRevert(AssetVault.AlreadyApproved.selector);
        vault.approveWithdrawal(proposalId);
    }

    function test_ApproveWithdrawal_RevertNonSigner() public {
        uint256 amount = WITHDRAWAL_THRESHOLD * 2;

        vm.prank(signer1);
        uint256 proposalId = vault.proposeWithdrawal(address(mockToken), amount, recipient);

        vm.prank(nonSigner);
        vm.expectRevert();
        vault.approveWithdrawal(proposalId);
    }

    function test_ExecuteWithdrawal_RevertInsufficientApprovals() public {
        uint256 amount = WITHDRAWAL_THRESHOLD * 2;

        vm.prank(signer1);
        uint256 proposalId = vault.proposeWithdrawal(address(mockToken), amount, recipient);

        vm.prank(signer1);
        vm.expectRevert(AssetVault.InsufficientApprovals.selector);
        vault.executeWithdrawal(proposalId);
    }

    function test_Withdrawal_ETH() public {
        uint256 amount = WITHDRAWAL_THRESHOLD / 2;

        vm.prank(signer1);
        vault.proposeWithdrawal(address(0), amount, recipient);

        assertEq(recipient.balance, amount);
    }

    /*//////////////////////////////////////////////////////////////
                        EMERGENCY TESTS
    //////////////////////////////////////////////////////////////*/

    function test_DeclareEmergency() public {
        vm.expectEmit(true, false, false, false);
        emit EmergencyDeclared(admin);

        vm.prank(admin);
        vault.declareEmergency();

        assertTrue(vault.isEmergency());
    }

    function test_DeclareEmergency_RevertAlreadyInEmergency() public {
        vm.prank(admin);
        vault.declareEmergency();

        vm.prank(admin);
        vm.expectRevert(AssetVault.AlreadyInEmergency.selector);
        vault.declareEmergency();
    }

    function test_ResolveEmergency() public {
        vm.prank(admin);
        vault.declareEmergency();

        vm.expectEmit(true, false, false, false);
        emit EmergencyResolved(admin);

        vm.prank(admin);
        vault.resolveEmergency();

        assertFalse(vault.isEmergency());
    }

    function test_ResolveEmergency_RevertNotInEmergency() public {
        vm.prank(admin);
        vm.expectRevert(AssetVault.NotInEmergency.selector);
        vault.resolveEmergency();
    }

    function test_EmergencyWithdraw() public {
        vm.prank(admin);
        vault.declareEmergency();

        uint256 vaultBalance = mockToken.balanceOf(address(vault));

        vm.expectEmit(true, false, true, true);
        emit EmergencyWithdrawal(address(mockToken), vaultBalance, recipient);

        vm.prank(admin);
        vault.emergencyWithdraw(address(mockToken), recipient);

        assertEq(mockToken.balanceOf(recipient), vaultBalance);
        assertEq(mockToken.balanceOf(address(vault)), 0);
    }

    function test_EmergencyWithdraw_RevertNotInEmergency() public {
        vm.prank(admin);
        vm.expectRevert(AssetVault.NotInEmergency.selector);
        vault.emergencyWithdraw(address(mockToken), recipient);
    }

    /*//////////////////////////////////////////////////////////////
                    SIGNER MANAGEMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_AddSigner() public {
        address newSigner = makeAddr("newSigner");

        vm.expectEmit(true, false, false, false);
        emit SignerAdded(newSigner);

        vm.prank(admin);
        vault.addSigner(newSigner);

        assertTrue(vault.isSigner(newSigner));
        assertEq(vault.getSignerCount(), 4);
    }

    function test_AddSigner_RevertDuplicate() public {
        vm.prank(admin);
        vm.expectRevert(AssetVault.SignerAlreadyExists.selector);
        vault.addSigner(signer1);
    }

    function test_RemoveSigner() public {
        vm.expectEmit(true, false, false, false);
        emit SignerRemoved(signer3);

        vm.prank(admin);
        vault.removeSigner(signer3);

        assertFalse(vault.isSigner(signer3));
        assertEq(vault.getSignerCount(), 2);
    }

    function test_RemoveSigner_RevertBelowThreshold() public {
        // Remove one signer first
        vm.prank(admin);
        vault.removeSigner(signer3);

        // Try to remove another (would go below threshold)
        vm.prank(admin);
        vm.expectRevert(AssetVault.InvalidThreshold.selector);
        vault.removeSigner(signer2);
    }

    function test_SetApprovalThreshold() public {
        vm.expectEmit(false, false, false, true);
        emit ThresholdUpdated(3);

        vm.prank(admin);
        vault.setApprovalThreshold(3);

        assertEq(vault.approvalThreshold(), 3);
    }

    function test_SetApprovalThreshold_RevertInvalid() public {
        vm.prank(admin);
        vm.expectRevert(AssetVault.InvalidThreshold.selector);
        vault.setApprovalThreshold(4); // More than signers

        vm.prank(admin);
        vm.expectRevert(AssetVault.InvalidThreshold.selector);
        vault.setApprovalThreshold(0);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetAssetBalance() public view {
        assertEq(vault.getAssetBalance(address(mockToken)), INITIAL_BALANCE);
        assertEq(vault.getAssetBalance(address(0)), INITIAL_BALANCE);
    }

    function test_GetSigners() public view {
        address[] memory signers = vault.getSigners();
        assertEq(signers.length, 3);
        assertTrue(signers[0] == signer1 || signers[1] == signer1 || signers[2] == signer1);
    }

    function test_GetProposal() public {
        uint256 amount = WITHDRAWAL_THRESHOLD * 2;

        vm.prank(signer1);
        uint256 proposalId = vault.proposeWithdrawal(address(mockToken), amount, recipient);

        (
            address token,
            uint256 proposalAmount,
            address proposalRecipient,
            uint256 approvalCount,
            bool executed,
            bool cancelled
        ) = vault.getProposal(proposalId);

        assertEq(token, address(mockToken));
        assertEq(proposalAmount, amount);
        assertEq(proposalRecipient, recipient);
        assertEq(approvalCount, 1);
        assertFalse(executed);
        assertFalse(cancelled);
    }

    /*//////////////////////////////////////////////////////////////
                        RECEIVE ETH TEST
    //////////////////////////////////////////////////////////////*/

    function test_ReceiveETH() public {
        address sender = makeAddr("sender");
        vm.deal(sender, 1 ether);

        vm.prank(sender);
        (bool success, ) = address(vault).call{value: 1 ether}("");
        assertTrue(success);

        assertEq(address(vault).balance, INITIAL_BALANCE + 1 ether);
    }
}
