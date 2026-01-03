// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IAssetVault} from "./interfaces/IAssetVault.sol";

/**
 * @title AssetVault
 * @notice Secure vault for managing collateral backing RWA tokens
 * @dev Implements multi-signature approval for withdrawals and emergency mechanisms
 *
 * Key features:
 * - Multi-sig withdrawals: Requires multiple approvals for large withdrawals
 * - Emergency mode: Enables rapid asset recovery in emergencies
 * - Reentrancy protection: Guards against reentrancy attacks
 * - Collateralization tracking: Monitors backing ratio
 */
contract AssetVault is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    IAssetVault
{
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Role for vault signers
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    /// @notice Role for emergency operators
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    /// @notice Role for contract upgraders
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /// @notice Basis points denominator (100%)
    uint256 public constant BASIS_POINTS = 10000;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Withdrawal proposal structure
    struct WithdrawalProposal {
        address token;
        uint256 amount;
        address recipient;
        uint256 approvalCount;
        bool executed;
        bool cancelled;
        uint256 createdAt;
    }

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Set of authorized signers
    EnumerableSet.AddressSet private _signers;

    /// @notice Required number of approvals for withdrawals
    uint256 public approvalThreshold;

    /// @notice Withdrawal amount threshold requiring multi-sig
    uint256 public withdrawalThreshold;

    /// @notice Whether emergency mode is active
    bool private _emergencyMode;

    /// @notice Counter for proposal IDs
    uint256 public proposalCount;

    /// @notice Mapping of proposal ID to proposal data
    mapping(uint256 => WithdrawalProposal) public proposals;

    /// @notice Mapping of proposal ID to signer approvals
    mapping(uint256 => mapping(address => bool)) public hasApproved;

    /// @notice Associated RWA token for collateralization calculation
    address public rwaToken;

    /// @notice Total value of assets (in base units, e.g., USD with 18 decimals)
    uint256 public totalAssetValue;

    /// @notice Gap for future storage variables
    uint256[44] private __gap;

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidAddress();
    error InvalidAmount();
    error InvalidThreshold();
    error InsufficientBalance();
    error ProposalNotFound();
    error ProposalAlreadyExecuted();
    error ProposalCancelled();
    error AlreadyApproved();
    error InsufficientApprovals();
    error NotInEmergency();
    error AlreadyInEmergency();
    error SignerAlreadyExists();
    error SignerNotFound();
    error TransferFailed();

    /*//////////////////////////////////////////////////////////////
                            INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the Asset Vault
     * @param admin The address to grant admin roles
     * @param signers_ Initial array of signers
     * @param threshold_ Required number of approvals
     * @param withdrawalThreshold_ Amount threshold requiring multi-sig
     */
    function initialize(
        address admin,
        address[] calldata signers_,
        uint256 threshold_,
        uint256 withdrawalThreshold_
    ) external initializer {
        if (admin == address(0)) revert InvalidAddress();
        if (signers_.length < threshold_) revert InvalidThreshold();
        if (threshold_ == 0) revert InvalidThreshold();

        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(EMERGENCY_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);

        for (uint256 i = 0; i < signers_.length; ) {
            if (signers_[i] == address(0)) revert InvalidAddress();
            _signers.add(signers_[i]);
            _grantRole(SIGNER_ROLE, signers_[i]);
            emit SignerAdded(signers_[i]);
            unchecked {
                ++i;
            }
        }

        approvalThreshold = threshold_;
        withdrawalThreshold = withdrawalThreshold_;
    }

    /*//////////////////////////////////////////////////////////////
                            DEPOSIT FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IAssetVault
    function deposit(address token, uint256 amount) external nonReentrant {
        if (token == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(token, amount, msg.sender);
    }

    /// @inheritdoc IAssetVault
    function depositETH() external payable nonReentrant {
        if (msg.value == 0) revert InvalidAmount();

        emit Deposited(address(0), msg.value, msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                        WITHDRAWAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IAssetVault
    function proposeWithdrawal(
        address token,
        uint256 amount,
        address recipient
    ) external onlyRole(SIGNER_ROLE) nonReentrant returns (uint256 proposalId) {
        if (recipient == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        // Check balance
        uint256 balance = token == address(0) ? address(this).balance : IERC20(token).balanceOf(address(this));
        if (balance < amount) revert InsufficientBalance();

        proposalId = proposalCount++;

        proposals[proposalId] = WithdrawalProposal({
            token: token,
            amount: amount,
            recipient: recipient,
            approvalCount: 1, // Proposer auto-approves
            executed: false,
            cancelled: false,
            createdAt: block.timestamp
        });

        hasApproved[proposalId][msg.sender] = true;

        emit WithdrawalProposed(proposalId, token, amount, recipient);
        emit WithdrawalApproved(proposalId, msg.sender);

        // If below threshold or single signer, execute immediately
        if (amount <= withdrawalThreshold || approvalThreshold == 1) {
            _executeWithdrawal(proposalId);
        }
    }

    /// @inheritdoc IAssetVault
    function approveWithdrawal(uint256 proposalId) external onlyRole(SIGNER_ROLE) nonReentrant {
        WithdrawalProposal storage proposal = proposals[proposalId];

        if (proposal.amount == 0) revert ProposalNotFound();
        if (proposal.executed) revert ProposalAlreadyExecuted();
        if (proposal.cancelled) revert ProposalCancelled();
        if (hasApproved[proposalId][msg.sender]) revert AlreadyApproved();

        hasApproved[proposalId][msg.sender] = true;
        proposal.approvalCount++;

        emit WithdrawalApproved(proposalId, msg.sender);

        // Auto-execute if threshold reached
        if (proposal.approvalCount >= approvalThreshold) {
            _executeWithdrawal(proposalId);
        }
    }

    /// @inheritdoc IAssetVault
    function executeWithdrawal(uint256 proposalId) external onlyRole(SIGNER_ROLE) nonReentrant {
        WithdrawalProposal storage proposal = proposals[proposalId];

        if (proposal.amount == 0) revert ProposalNotFound();
        if (proposal.executed) revert ProposalAlreadyExecuted();
        if (proposal.cancelled) revert ProposalCancelled();
        if (proposal.approvalCount < approvalThreshold) revert InsufficientApprovals();

        _executeWithdrawal(proposalId);
    }

    /*//////////////////////////////////////////////////////////////
                        EMERGENCY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IAssetVault
    function declareEmergency() external onlyRole(EMERGENCY_ROLE) {
        if (_emergencyMode) revert AlreadyInEmergency();
        _emergencyMode = true;
        emit EmergencyDeclared(msg.sender);
    }

    /// @inheritdoc IAssetVault
    function resolveEmergency() external onlyRole(EMERGENCY_ROLE) {
        if (!_emergencyMode) revert NotInEmergency();
        _emergencyMode = false;
        emit EmergencyResolved(msg.sender);
    }

    /// @inheritdoc IAssetVault
    function emergencyWithdraw(address token, address recipient) external onlyRole(EMERGENCY_ROLE) nonReentrant {
        if (!_emergencyMode) revert NotInEmergency();
        if (recipient == address(0)) revert InvalidAddress();

        uint256 amount;
        if (token == address(0)) {
            amount = address(this).balance;
            if (amount > 0) {
                (bool success, ) = recipient.call{value: amount}("");
                if (!success) revert TransferFailed();
            }
        } else {
            amount = IERC20(token).balanceOf(address(this));
            if (amount > 0) {
                IERC20(token).safeTransfer(recipient, amount);
            }
        }

        emit EmergencyWithdrawal(token, amount, recipient);
    }

    /*//////////////////////////////////////////////////////////////
                        SIGNER MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Add a new signer
     * @param signer The signer address to add
     */
    function addSigner(address signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (signer == address(0)) revert InvalidAddress();
        if (!_signers.add(signer)) revert SignerAlreadyExists();
        _grantRole(SIGNER_ROLE, signer);
        emit SignerAdded(signer);
    }

    /**
     * @notice Remove a signer
     * @param signer The signer address to remove
     */
    function removeSigner(address signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!_signers.remove(signer)) revert SignerNotFound();
        if (_signers.length() < approvalThreshold) revert InvalidThreshold();
        _revokeRole(SIGNER_ROLE, signer);
        emit SignerRemoved(signer);
    }

    /**
     * @notice Update the approval threshold
     * @param newThreshold The new threshold value
     */
    function setApprovalThreshold(uint256 newThreshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newThreshold == 0 || newThreshold > _signers.length()) revert InvalidThreshold();
        approvalThreshold = newThreshold;
        emit ThresholdUpdated(newThreshold);
    }

    /**
     * @notice Update the withdrawal threshold
     * @param newThreshold The new withdrawal threshold
     */
    function setWithdrawalThreshold(uint256 newThreshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        withdrawalThreshold = newThreshold;
    }

    /**
     * @notice Set the associated RWA token
     * @param token The RWA token address
     */
    function setRWAToken(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        rwaToken = token;
    }

    /**
     * @notice Update the total asset value (for collateralization calculation)
     * @param value The new total asset value
     */
    function setTotalAssetValue(uint256 value) external onlyRole(SIGNER_ROLE) {
        totalAssetValue = value;
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IAssetVault
    function getCollateralizationRatio() external view returns (uint256) {
        if (rwaToken == address(0)) return 0;

        uint256 tokenSupply = IERC20(rwaToken).totalSupply();
        if (tokenSupply == 0) return BASIS_POINTS; // 100% if no tokens

        // Return ratio as basis points (10000 = 100%)
        return (totalAssetValue * BASIS_POINTS) / tokenSupply;
    }

    /// @inheritdoc IAssetVault
    function getAssetBalance(address token) external view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance;
        }
        return IERC20(token).balanceOf(address(this));
    }

    /// @inheritdoc IAssetVault
    function isBackingVerified() external view returns (bool) {
        if (rwaToken == address(0)) return true;

        uint256 tokenSupply = IERC20(rwaToken).totalSupply();
        if (tokenSupply == 0) return true;

        return totalAssetValue >= tokenSupply;
    }

    /// @inheritdoc IAssetVault
    function isEmergency() external view returns (bool) {
        return _emergencyMode;
    }

    /**
     * @notice Get all signers
     * @return Array of signer addresses
     */
    function getSigners() external view returns (address[] memory) {
        return _signers.values();
    }

    /**
     * @notice Get the number of signers
     * @return The signer count
     */
    function getSignerCount() external view returns (uint256) {
        return _signers.length();
    }

    /**
     * @notice Check if an address is a signer
     * @param account The address to check
     * @return True if the address is a signer
     */
    function isSigner(address account) external view returns (bool) {
        return _signers.contains(account);
    }

    /**
     * @notice Get proposal details
     * @param proposalId The proposal ID
     * @return token The token address
     * @return amount The withdrawal amount
     * @return recipient The recipient address
     * @return approvalCount The number of approvals
     * @return executed Whether the proposal was executed
     * @return cancelled Whether the proposal was cancelled
     */
    function getProposal(uint256 proposalId)
        external
        view
        returns (
            address token,
            uint256 amount,
            address recipient,
            uint256 approvalCount,
            bool executed,
            bool cancelled
        )
    {
        WithdrawalProposal storage proposal = proposals[proposalId];
        return (
            proposal.token,
            proposal.amount,
            proposal.recipient,
            proposal.approvalCount,
            proposal.executed,
            proposal.cancelled
        );
    }

    /*//////////////////////////////////////////////////////////////
                            INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Execute a withdrawal proposal
     */
    function _executeWithdrawal(uint256 proposalId) internal {
        WithdrawalProposal storage proposal = proposals[proposalId];
        proposal.executed = true;

        if (proposal.token == address(0)) {
            (bool success, ) = proposal.recipient.call{value: proposal.amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(proposal.token).safeTransfer(proposal.recipient, proposal.amount);
        }

        emit Withdrawn(proposal.token, proposal.amount, proposal.recipient);
    }

    /**
     * @dev Required override for UUPS upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    /**
     * @dev Receive ETH
     */
    receive() external payable {
        emit Deposited(address(0), msg.value, msg.sender);
    }
}
