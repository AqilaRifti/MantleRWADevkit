// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IKYCRegistry} from "./interfaces/IKYCRegistry.sol";

/**
 * @title KYCRegistry
 * @notice On-chain registry for managing investor KYC verification status
 * @dev Implements role-based access control for KYC administrators
 *      Stores only hashes of identity data to protect PII
 */
contract KYCRegistry is Initializable, AccessControlUpgradeable, UUPSUpgradeable, IKYCRegistry {
    /// @notice Role identifier for KYC administrators
    bytes32 public constant KYC_ADMIN_ROLE = keccak256("KYC_ADMIN_ROLE");

    /// @notice Role identifier for contract upgraders
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /// @notice Struct to store investor verification data
    struct InvestorData {
        bool verified;
        AccreditationTier tier;
        uint256 expiryTimestamp;
        bytes32 identityHash;
    }

    /// @notice Mapping of investor addresses to their verification data
    mapping(address => InvestorData) private _investors;

    /// @notice Total count of verified investors
    uint256 public investorCount;

    /// @notice Custom errors for gas efficiency
    error InvalidAddress();
    error InvestorAlreadyExists(address investor);
    error InvestorNotFound(address investor);
    error InvalidExpiry(uint256 expiry);
    error ArrayLengthMismatch();
    error EmptyArray();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the KYC Registry
     * @param admin The address to grant admin roles
     */
    function initialize(address admin) external initializer {
        if (admin == address(0)) revert InvalidAddress();

        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(KYC_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
    }

    /**
     * @inheritdoc IKYCRegistry
     */
    function addInvestor(
        address investor,
        AccreditationTier tier,
        uint256 expiryTimestamp,
        bytes32 identityHash
    ) external onlyRole(KYC_ADMIN_ROLE) {
        _addInvestor(investor, tier, expiryTimestamp, identityHash);
    }

    /**
     * @inheritdoc IKYCRegistry
     */
    function updateInvestor(
        address investor,
        AccreditationTier tier,
        uint256 expiryTimestamp
    ) external onlyRole(KYC_ADMIN_ROLE) {
        if (investor == address(0)) revert InvalidAddress();
        if (!_investors[investor].verified) revert InvestorNotFound(investor);
        if (expiryTimestamp <= block.timestamp) revert InvalidExpiry(expiryTimestamp);

        _investors[investor].tier = tier;
        _investors[investor].expiryTimestamp = expiryTimestamp;

        emit InvestorUpdated(investor, tier, expiryTimestamp);
    }

    /**
     * @inheritdoc IKYCRegistry
     */
    function removeInvestor(address investor) external onlyRole(KYC_ADMIN_ROLE) {
        if (investor == address(0)) revert InvalidAddress();
        if (!_investors[investor].verified) revert InvestorNotFound(investor);

        delete _investors[investor];
        investorCount--;

        emit InvestorRemoved(investor);
    }

    /**
     * @inheritdoc IKYCRegistry
     */
    function batchAddInvestors(
        address[] calldata investors,
        AccreditationTier[] calldata tiers,
        uint256[] calldata expiries,
        bytes32[] calldata identityHashes
    ) external onlyRole(KYC_ADMIN_ROLE) {
        uint256 length = investors.length;
        if (length == 0) revert EmptyArray();
        if (length != tiers.length || length != expiries.length || length != identityHashes.length) {
            revert ArrayLengthMismatch();
        }

        for (uint256 i = 0; i < length; ) {
            _addInvestor(investors[i], tiers[i], expiries[i], identityHashes[i]);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @inheritdoc IKYCRegistry
     */
    function isVerified(address investor) external view returns (bool) {
        InvestorData storage data = _investors[investor];
        return data.verified && data.expiryTimestamp > block.timestamp;
    }

    /**
     * @inheritdoc IKYCRegistry
     */
    function getInvestorInfo(address investor)
        external
        view
        returns (bool verified, AccreditationTier tier, uint256 expiry, bytes32 identityHash)
    {
        InvestorData storage data = _investors[investor];
        return (data.verified, data.tier, data.expiryTimestamp, data.identityHash);
    }

    /**
     * @inheritdoc IKYCRegistry
     */
    function isAccredited(address investor) external view returns (bool) {
        InvestorData storage data = _investors[investor];
        if (!data.verified || data.expiryTimestamp <= block.timestamp) {
            return false;
        }
        return data.tier == AccreditationTier.Accredited || data.tier == AccreditationTier.Institutional;
    }

    /**
     * @notice Check if an investor's verification has expired
     * @param investor The address to check
     * @return True if the verification has expired
     */
    function isExpired(address investor) external view returns (bool) {
        InvestorData storage data = _investors[investor];
        return data.verified && data.expiryTimestamp <= block.timestamp;
    }

    /**
     * @notice Get the expiry timestamp for an investor
     * @param investor The address to query
     * @return The expiry timestamp (0 if not verified)
     */
    function getExpiry(address investor) external view returns (uint256) {
        return _investors[investor].expiryTimestamp;
    }

    /**
     * @notice Get the accreditation tier for an investor
     * @param investor The address to query
     * @return The accreditation tier
     */
    function getTier(address investor) external view returns (AccreditationTier) {
        return _investors[investor].tier;
    }

    /**
     * @dev Internal function to add an investor
     */
    function _addInvestor(
        address investor,
        AccreditationTier tier,
        uint256 expiryTimestamp,
        bytes32 identityHash
    ) internal {
        if (investor == address(0)) revert InvalidAddress();
        if (_investors[investor].verified) revert InvestorAlreadyExists(investor);
        if (expiryTimestamp <= block.timestamp) revert InvalidExpiry(expiryTimestamp);

        _investors[investor] = InvestorData({
            verified: true,
            tier: tier,
            expiryTimestamp: expiryTimestamp,
            identityHash: identityHash
        });

        investorCount++;

        emit InvestorVerified(investor, tier, expiryTimestamp);
    }

    /**
     * @dev Required override for UUPS upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
