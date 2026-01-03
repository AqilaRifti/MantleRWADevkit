// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IYieldDistributor} from "./interfaces/IYieldDistributor.sol";
import {RWAToken} from "./RWAToken.sol";

/**
 * @title YieldDistributor
 * @notice Distributes yield/dividends to RWA token holders based on snapshots
 * @dev Uses ERC-20 snapshot functionality for proportional distribution
 *
 * Key features:
 * - Snapshot-based distribution: Uses token snapshots for fair distribution
 * - Multi-token support: Supports USDC, USDT, MNT, and other ERC-20 tokens
 * - Claim windows: Configurable time windows for claiming
 * - Unclaimed fund handling: Configurable policy for expired claims
 */
contract YieldDistributor is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    IYieldDistributor
{
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Role for distribution managers
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    /// @notice Role for contract upgraders
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /// @notice Precision for calculations
    uint256 public constant PRECISION = 1e18;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Distribution data structure
    struct Distribution {
        address paymentToken;
        uint256 totalAmount;
        uint256 snapshotId;
        uint256 claimDeadline;
        uint256 claimedAmount;
        uint256 totalSupplyAtSnapshot;
        bool unclaimedHandled;
    }

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice The RWA token contract
    RWAToken public rwaToken;

    /// @notice Counter for distribution IDs
    uint256 public distributionCount;

    /// @notice Mapping of distribution ID to distribution data
    mapping(uint256 => Distribution) public distributions;

    /// @notice Mapping of distribution ID to account to claimed status
    mapping(uint256 => mapping(address => bool)) private _claimed;

    /// @notice Recipient for unclaimed funds
    address public unclaimedFundsRecipient;

    /// @notice Gap for future storage variables
    uint256[45] private __gap;

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidAddress();
    error InvalidAmount();
    error InvalidClaimWindow();
    error DistributionNotFound();
    error AlreadyClaimed();
    error ClaimWindowExpired();
    error ClaimWindowNotExpired();
    error UnclaimedAlreadyHandled();
    error NothingToClaim();
    error InsufficientBalance();

    /*//////////////////////////////////////////////////////////////
                            INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the Yield Distributor
     * @param admin The address to grant admin roles
     * @param rwaToken_ The RWA token contract address
     * @param unclaimedRecipient The initial recipient for unclaimed funds
     */
    function initialize(address admin, address rwaToken_, address unclaimedRecipient) external initializer {
        if (admin == address(0)) revert InvalidAddress();
        if (rwaToken_ == address(0)) revert InvalidAddress();

        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(DISTRIBUTOR_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);

        rwaToken = RWAToken(rwaToken_);
        unclaimedFundsRecipient = unclaimedRecipient != address(0) ? unclaimedRecipient : admin;
    }

    /*//////////////////////////////////////////////////////////////
                        DISTRIBUTION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IYieldDistributor
    function createDistribution(
        address paymentToken,
        uint256 totalAmount,
        uint256 claimWindowDays
    ) external onlyRole(DISTRIBUTOR_ROLE) nonReentrant returns (uint256 distributionId) {
        if (paymentToken == address(0)) revert InvalidAddress();
        if (totalAmount == 0) revert InvalidAmount();
        if (claimWindowDays == 0) revert InvalidClaimWindow();

        // Transfer payment tokens to this contract
        IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), totalAmount);

        // Create snapshot on RWA token
        uint256 snapshotId = rwaToken.snapshot();
        uint256 totalSupply = rwaToken.totalSupplyAt(snapshotId);

        if (totalSupply == 0) revert InvalidAmount();

        distributionId = distributionCount++;

        distributions[distributionId] = Distribution({
            paymentToken: paymentToken,
            totalAmount: totalAmount,
            snapshotId: snapshotId,
            claimDeadline: block.timestamp + (claimWindowDays * 1 days),
            claimedAmount: 0,
            totalSupplyAtSnapshot: totalSupply,
            unclaimedHandled: false
        });

        emit DistributionCreated(distributionId, paymentToken, totalAmount, snapshotId);
    }

    /// @inheritdoc IYieldDistributor
    function claim(uint256 distributionId) external nonReentrant {
        _claim(distributionId, msg.sender);
    }

    /// @inheritdoc IYieldDistributor
    function claimMultiple(uint256[] calldata distributionIds) external nonReentrant {
        for (uint256 i = 0; i < distributionIds.length; ) {
            _claim(distributionIds[i], msg.sender);
            unchecked {
                ++i;
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IYieldDistributor
    function handleUnclaimedFunds(uint256 distributionId) external onlyRole(DISTRIBUTOR_ROLE) nonReentrant {
        Distribution storage dist = distributions[distributionId];

        if (dist.totalAmount == 0) revert DistributionNotFound();
        if (block.timestamp <= dist.claimDeadline) revert ClaimWindowNotExpired();
        if (dist.unclaimedHandled) revert UnclaimedAlreadyHandled();

        uint256 unclaimedAmount = dist.totalAmount - dist.claimedAmount;
        dist.unclaimedHandled = true;

        if (unclaimedAmount > 0) {
            IERC20(dist.paymentToken).safeTransfer(unclaimedFundsRecipient, unclaimedAmount);
            emit UnclaimedFundsHandled(distributionId, unclaimedAmount, unclaimedFundsRecipient);
        }
    }

    /// @inheritdoc IYieldDistributor
    function setUnclaimedFundsRecipient(address recipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (recipient == address(0)) revert InvalidAddress();
        unclaimedFundsRecipient = recipient;
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IYieldDistributor
    function getClaimableAmount(uint256 distributionId, address account) public view returns (uint256) {
        Distribution storage dist = distributions[distributionId];

        if (dist.totalAmount == 0) return 0;
        if (_claimed[distributionId][account]) return 0;
        if (block.timestamp > dist.claimDeadline) return 0;

        uint256 holderBalance = rwaToken.balanceOfAt(account, dist.snapshotId);
        if (holderBalance == 0) return 0;

        // Calculate proportional share: (holderBalance * totalAmount) / totalSupply
        return (holderBalance * dist.totalAmount) / dist.totalSupplyAtSnapshot;
    }

    /// @inheritdoc IYieldDistributor
    function getDistributionInfo(uint256 distributionId)
        external
        view
        returns (
            address paymentToken,
            uint256 totalAmount,
            uint256 snapshotId,
            uint256 claimDeadline,
            uint256 claimedAmount
        )
    {
        Distribution storage dist = distributions[distributionId];
        return (dist.paymentToken, dist.totalAmount, dist.snapshotId, dist.claimDeadline, dist.claimedAmount);
    }

    /// @inheritdoc IYieldDistributor
    function hasClaimed(uint256 distributionId, address account) external view returns (bool) {
        return _claimed[distributionId][account];
    }

    /**
     * @notice Get the total supply at a distribution's snapshot
     * @param distributionId The distribution ID
     * @return The total supply at snapshot
     */
    function getTotalSupplyAtSnapshot(uint256 distributionId) external view returns (uint256) {
        return distributions[distributionId].totalSupplyAtSnapshot;
    }

    /**
     * @notice Check if unclaimed funds have been handled
     * @param distributionId The distribution ID
     * @return True if unclaimed funds have been handled
     */
    function isUnclaimedHandled(uint256 distributionId) external view returns (bool) {
        return distributions[distributionId].unclaimedHandled;
    }

    /**
     * @notice Get the remaining unclaimed amount for a distribution
     * @param distributionId The distribution ID
     * @return The unclaimed amount
     */
    function getUnclaimedAmount(uint256 distributionId) external view returns (uint256) {
        Distribution storage dist = distributions[distributionId];
        return dist.totalAmount - dist.claimedAmount;
    }

    /*//////////////////////////////////////////////////////////////
                            INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Internal claim function
     */
    function _claim(uint256 distributionId, address account) internal {
        Distribution storage dist = distributions[distributionId];

        if (dist.totalAmount == 0) revert DistributionNotFound();
        if (_claimed[distributionId][account]) revert AlreadyClaimed();
        if (block.timestamp > dist.claimDeadline) revert ClaimWindowExpired();

        uint256 claimAmount = getClaimableAmount(distributionId, account);
        if (claimAmount == 0) revert NothingToClaim();

        _claimed[distributionId][account] = true;
        dist.claimedAmount += claimAmount;

        IERC20(dist.paymentToken).safeTransfer(account, claimAmount);

        emit YieldClaimed(distributionId, account, claimAmount);
    }

    /**
     * @dev Required override for UUPS upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
