// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {RWAToken} from "../../src/RWAToken.sol";
import {AssetVault} from "../../src/AssetVault.sol";
import {YieldDistributor} from "../../src/YieldDistributor.sol";
import {KYCRegistry} from "../../src/KYCRegistry.sol";
import {IKYCRegistry} from "../../src/interfaces/IKYCRegistry.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC20Mock} from "../mocks/ERC20Mock.sol";

/**
 * @title Event Emission Property Tests
 * @notice Property-based tests for event emission consistency across all contracts
 * @dev Feature: mantle-rwa-sdk, Property 5: Event Emission Consistency
 */
contract EventEmissionPropertyTest is Test {
    RWAToken public token;
    AssetVault public vault;
    YieldDistributor public distributor;
    KYCRegistry public kycRegistry;
    ERC20Mock public usdc;

    address public admin;
    address public issuer;
    address public investor1;
    address public investor2;

    uint256 constant DEFAULT_EXPIRY = 365 days;

    // Event signatures for verification
    event Transfer(address indexed from, address indexed to, uint256 value);
    event InvestorVerified(address indexed investor, IKYCRegistry.AccreditationTier tier, uint256 expiry);
    event InvestorRemoved(address indexed investor);
    event Deposited(address indexed token, uint256 amount, address indexed depositor);
    event Withdrawn(address indexed token, uint256 amount, address indexed recipient);
    event DistributionCreated(uint256 indexed distributionId, address indexed paymentToken, uint256 totalAmount, uint256 snapshotId);
    event YieldClaimed(uint256 indexed distributionId, address indexed claimant, uint256 amount);

    function setUp() public {
        admin = makeAddr("admin");
        issuer = makeAddr("issuer");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");

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

        // Deploy Asset Vault
        address[] memory signers = new address[](1);
        signers[0] = admin;
        AssetVault vaultImpl = new AssetVault();
        bytes memory vaultInitData = abi.encodeWithSelector(
            AssetVault.initialize.selector,
            admin,
            signers,
            1,
            0
        );
        ERC1967Proxy vaultProxy = new ERC1967Proxy(address(vaultImpl), vaultInitData);
        vault = AssetVault(payable(address(vaultProxy)));

        // Deploy Yield Distributor
        YieldDistributor distImpl = new YieldDistributor();
        bytes memory distInitData = abi.encodeWithSelector(
            YieldDistributor.initialize.selector,
            admin,
            address(token),
            admin
        );
        ERC1967Proxy distProxy = new ERC1967Proxy(address(distImpl), distInitData);
        distributor = YieldDistributor(address(distProxy));

        // Deploy USDC mock
        usdc = new ERC20Mock("USD Coin", "USDC");

        // Setup roles
        vm.startPrank(admin);
        token.grantIssuerRole(issuer);
        token.grantIssuerRole(address(distributor));
        vm.stopPrank();

        // Setup investors
        _setupInvestor(investor1);
        _setupInvestor(investor2);
    }

    /*//////////////////////////////////////////////////////////////
            PROPERTY 5: EVENT EMISSION CONSISTENCY
    //////////////////////////////////////////////////////////////*/

    /// @dev Feature: mantle-rwa-sdk, Property 5: Event Emission Consistency
    /// For any state-changing operation on any contract, the appropriate event SHALL be emitted
    /// with correct parameters matching the operation.

    /// @dev Test: Token transfer emits Transfer event with correct parameters
    function testProperty_TransferEmitsEvent(uint256 amount) public {
        amount = bound(amount, 1, 1_000_000 ether);

        // Mint tokens
        vm.prank(issuer);
        token.mint(investor1, amount);

        // Record logs
        vm.recordLogs();

        // Transfer
        vm.prank(investor1);
        token.transfer(investor2, amount);

        // Verify event
        Vm.Log[] memory logs = vm.getRecordedLogs();
        bool foundTransferEvent = false;

        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == keccak256("Transfer(address,address,uint256)")) {
                address from = address(uint160(uint256(logs[i].topics[1])));
                address to = address(uint160(uint256(logs[i].topics[2])));
                uint256 eventAmount = abi.decode(logs[i].data, (uint256));

                // Property: Event parameters SHALL match operation
                assertEq(from, investor1, "From should match sender");
                assertEq(to, investor2, "To should match recipient");
                assertEq(eventAmount, amount, "Amount should match transfer amount");
                foundTransferEvent = true;
                break;
            }
        }

        assertTrue(foundTransferEvent, "Transfer event should be emitted");
    }

    /// @dev Test: Mint emits Transfer event from zero address
    function testProperty_MintEmitsEvent(uint256 amount) public {
        amount = bound(amount, 1, 1_000_000 ether);

        vm.recordLogs();

        vm.prank(issuer);
        token.mint(investor1, amount);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bool foundMintEvent = false;

        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == keccak256("Transfer(address,address,uint256)")) {
                address from = address(uint160(uint256(logs[i].topics[1])));
                address to = address(uint160(uint256(logs[i].topics[2])));
                uint256 eventAmount = abi.decode(logs[i].data, (uint256));

                if (from == address(0)) {
                    assertEq(to, investor1, "To should match recipient");
                    assertEq(eventAmount, amount, "Amount should match mint amount");
                    foundMintEvent = true;
                    break;
                }
            }
        }

        assertTrue(foundMintEvent, "Mint event (Transfer from zero) should be emitted");
    }

    /// @dev Test: KYC operations emit correct events
    function testProperty_KYCEventsEmitted(uint8 tierValue) public {
        IKYCRegistry.AccreditationTier tier = IKYCRegistry.AccreditationTier(tierValue % 4);
        address newInvestor = makeAddr("newInvestor");
        uint256 expiry = block.timestamp + DEFAULT_EXPIRY;

        vm.recordLogs();

        vm.prank(admin);
        kycRegistry.addInvestor(newInvestor, tier, expiry, keccak256("identity"));

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bool foundEvent = false;

        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == keccak256("InvestorVerified(address,uint8,uint256)")) {
                address eventInvestor = address(uint160(uint256(logs[i].topics[1])));
                assertEq(eventInvestor, newInvestor, "Investor should match");
                foundEvent = true;
                break;
            }
        }

        assertTrue(foundEvent, "InvestorVerified event should be emitted");

        // Test removal event
        vm.recordLogs();

        vm.prank(admin);
        kycRegistry.removeInvestor(newInvestor);

        logs = vm.getRecordedLogs();
        foundEvent = false;

        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == keccak256("InvestorRemoved(address)")) {
                address eventInvestor = address(uint160(uint256(logs[i].topics[1])));
                assertEq(eventInvestor, newInvestor, "Investor should match");
                foundEvent = true;
                break;
            }
        }

        assertTrue(foundEvent, "InvestorRemoved event should be emitted");
    }

    /// @dev Test: Vault deposit emits Deposited event
    function testProperty_VaultDepositEmitsEvent(uint256 amount) public {
        amount = bound(amount, 1, 1_000_000 ether);

        usdc.mint(admin, amount);

        vm.startPrank(admin);
        usdc.approve(address(vault), amount);

        vm.recordLogs();
        vault.deposit(address(usdc), amount);
        vm.stopPrank();

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bool foundEvent = false;

        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == keccak256("Deposited(address,uint256,address)")) {
                address eventToken = address(uint160(uint256(logs[i].topics[1])));
                address eventDepositor = address(uint160(uint256(logs[i].topics[2])));
                uint256 eventAmount = abi.decode(logs[i].data, (uint256));

                assertEq(eventToken, address(usdc), "Token should match");
                assertEq(eventDepositor, admin, "Depositor should match");
                assertEq(eventAmount, amount, "Amount should match");
                foundEvent = true;
                break;
            }
        }

        assertTrue(foundEvent, "Deposited event should be emitted");
    }

    /// @dev Test: Yield distribution emits DistributionCreated event
    function testProperty_DistributionEmitsEvent(uint256 amount) public {
        amount = bound(amount, 1000, 1_000_000 * 1e6);

        // Mint tokens to investor
        vm.prank(issuer);
        token.mint(investor1, 1000 ether);

        usdc.mint(admin, amount);

        vm.startPrank(admin);
        usdc.approve(address(distributor), amount);

        vm.recordLogs();
        distributor.createDistribution(address(usdc), amount, 30);
        vm.stopPrank();

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bool foundEvent = false;

        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == keccak256("DistributionCreated(uint256,address,uint256,uint256)")) {
                address eventToken = address(uint160(uint256(logs[i].topics[2])));
                assertEq(eventToken, address(usdc), "Payment token should match");
                foundEvent = true;
                break;
            }
        }

        assertTrue(foundEvent, "DistributionCreated event should be emitted");
    }

    /// @dev Test: Yield claim emits YieldClaimed event
    function testProperty_ClaimEmitsEvent(uint256 amount) public {
        amount = bound(amount, 1000, 1_000_000 * 1e6);

        // Mint tokens to investor
        vm.prank(issuer);
        token.mint(investor1, 1000 ether);

        usdc.mint(admin, amount);

        vm.startPrank(admin);
        usdc.approve(address(distributor), amount);
        uint256 distId = distributor.createDistribution(address(usdc), amount, 30);
        vm.stopPrank();

        vm.recordLogs();

        vm.prank(investor1);
        distributor.claim(distId);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bool foundEvent = false;

        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == keccak256("YieldClaimed(uint256,address,uint256)")) {
                address eventClaimant = address(uint160(uint256(logs[i].topics[2])));
                assertEq(eventClaimant, investor1, "Claimant should match");
                foundEvent = true;
                break;
            }
        }

        assertTrue(foundEvent, "YieldClaimed event should be emitted");
    }

    /*//////////////////////////////////////////////////////////////
                            HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _setupInvestor(address investor) internal {
        uint256 expiry = block.timestamp + DEFAULT_EXPIRY;
        vm.prank(admin);
        kycRegistry.addInvestor(
            investor,
            IKYCRegistry.AccreditationTier.Retail,
            expiry,
            keccak256(abi.encodePacked(investor))
        );
    }
}
