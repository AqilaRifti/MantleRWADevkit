// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC20PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import {ERC20SnapshotUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20SnapshotUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IRWAToken} from "./interfaces/IRWAToken.sol";
import {IKYCRegistry} from "./interfaces/IKYCRegistry.sol";
import {IComplianceModule} from "./interfaces/IComplianceModule.sol";

/**
 * @title RWAToken
 * @notice ERC-3643 compliant security token for Real-World Asset tokenization
 * @dev Implements transfer restrictions via KYC registry and modular compliance modules
 */
contract RWAToken is
    Initializable,
    ERC20Upgradeable,
    ERC20PausableUpgradeable,
    ERC20SnapshotUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    IRWAToken
{
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant COMPLIANCE_OFFICER_ROLE = keccak256("COMPLIANCE_OFFICER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    IKYCRegistry private _kycRegistry;
    EnumerableSet.AddressSet private _complianceModules;
    uint256[48] private __gap;

    error InvalidAddress();
    error NotVerified(address account);
    error TransferNotAllowed(string reason);
    error ModuleAlreadyExists(address module);
    error ModuleNotFound(address module);
    error KYCRegistryNotSet();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name_,
        string memory symbol_,
        address admin,
        address kycRegistry_
    ) external initializer {
        if (admin == address(0)) revert InvalidAddress();

        __ERC20_init(name_, symbol_);
        __ERC20Pausable_init();
        __ERC20Snapshot_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, admin);
        _grantRole(COMPLIANCE_OFFICER_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);

        if (kycRegistry_ != address(0)) {
            _kycRegistry = IKYCRegistry(kycRegistry_);
        }
    }

    function setKYCRegistry(address registry) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        if (registry == address(0)) revert InvalidAddress();
        address oldRegistry = address(_kycRegistry);
        _kycRegistry = IKYCRegistry(registry);
        emit KYCRegistryUpdated(oldRegistry, registry);
    }

    function addComplianceModule(address module) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        if (module == address(0)) revert InvalidAddress();
        if (!_complianceModules.add(module)) revert ModuleAlreadyExists(module);
        emit ComplianceModuleUpdated(module, true);
    }

    function removeComplianceModule(address module) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        if (!_complianceModules.remove(module)) revert ModuleNotFound(module);
        emit ComplianceModuleUpdated(module, false);
    }

    function isTransferAllowed(
        address from,
        address to,
        uint256 amount
    ) public view returns (bool allowed, string memory reason) {
        if (from == address(0) || to == address(0)) {
            return (true, "");
        }

        if (address(_kycRegistry) != address(0)) {
            if (!_kycRegistry.isVerified(from)) {
                return (false, "Sender not KYC verified");
            }
            if (!_kycRegistry.isVerified(to)) {
                return (false, "Recipient not KYC verified");
            }
        }

        uint256 moduleCount = _complianceModules.length();
        for (uint256 i = 0; i < moduleCount; ) {
            address module = _complianceModules.at(i);
            (bool compliant, string memory moduleReason) = IComplianceModule(module).checkCompliance(
                from,
                to,
                amount
            );
            if (!compliant) {
                return (false, moduleReason);
            }
            unchecked {
                ++i;
            }
        }

        return (true, "");
    }

    function mint(address to, uint256 amount) external onlyRole(ISSUER_ROLE) {
        if (to == address(0)) revert InvalidAddress();
        
        if (address(_kycRegistry) != address(0)) {
            if (!_kycRegistry.isVerified(to)) revert NotVerified(to);
        }

        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRole(ISSUER_ROLE) {
        if (from == address(0)) revert InvalidAddress();
        _burn(from, amount);
    }

    function pause() external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        _pause();
        emit TokensPaused(msg.sender);
    }

    function unpause() external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        _unpause();
        emit TokensUnpaused(msg.sender);
    }

    function snapshot() external onlyRole(ISSUER_ROLE) returns (uint256) {
        return _snapshot();
    }

    function grantIssuerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ISSUER_ROLE, account);
    }

    function grantComplianceOfficerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(COMPLIANCE_OFFICER_ROLE, account);
    }

    function revokeIssuerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(ISSUER_ROLE, account);
    }

    function revokeComplianceOfficerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(COMPLIANCE_OFFICER_ROLE, account);
    }

    function kycRegistry() external view returns (address) {
        return address(_kycRegistry);
    }

    function isComplianceModule(address module) external view returns (bool) {
        return _complianceModules.contains(module);
    }

    function getComplianceModules() external view returns (address[] memory) {
        return _complianceModules.values();
    }

    function balanceOfAt(address account, uint256 snapshotId) public view override returns (uint256) {
        return super.balanceOfAt(account, snapshotId);
    }

    function totalSupplyAt(uint256 snapshotId) public view override returns (uint256) {
        return super.totalSupplyAt(snapshotId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20PausableUpgradeable, ERC20SnapshotUpgradeable) {
        // Check transfer eligibility (skip for mint/burn)
        if (from != address(0) && to != address(0)) {
            (bool allowed, string memory reason) = isTransferAllowed(from, to, amount);
            if (!allowed) {
                emit TransferRestricted(from, to, amount, reason);
                revert TransferNotAllowed(reason);
            }
        }

        super._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._afterTokenTransfer(from, to, amount);

        // Notify compliance modules of successful transfer
        if (from != address(0) && to != address(0)) {
            uint256 moduleCount = _complianceModules.length();
            for (uint256 i = 0; i < moduleCount; ) {
                address module = _complianceModules.at(i);
                IComplianceModule(module).onTransfer(from, to, amount);
                unchecked {
                    ++i;
                }
            }
        }
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
