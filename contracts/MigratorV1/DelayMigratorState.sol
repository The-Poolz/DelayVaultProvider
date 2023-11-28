// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IDelayVaultProvider.sol";
import "../interfaces/IDelayVaultV1.sol";
import "../interfaces/IMigrator.sol";
import "@poolzfinance/poolz-helper-v2/contracts/interfaces/IVaultManager.sol";
/**
 * @title Delay Migrator State
 * @dev Abstract contract serving as a base for delay vault migrator contract.
 * 
*/
abstract contract DelayMigratorState is IMigrator {
    /**
     * @dev The old version of the delay vault (IDelayVaultV1) from which data is migrated.
     */
    IDelayVaultV1 public oldVault;

    /**
     * @dev The new version of the delay vault provider (IDelayVaultProvider) where data is migrated.
     */
    IDelayVaultProvider public newVault;

    /**
     * @dev NFT contract representing lock deals in the migration process.
     */
    ILockDealNFT public lockDealNFT;

    /**
     * @dev Address of the ERC-20 token involved in the migration.
     */
    address public token;

    /**
     * @dev Address of the contract owner. Initialized at contract deployment.
     */
    address public owner = msg.sender;

    /**
     * @dev Modifier to enforce that certain functions are called only after the contract is initialized.
     * The `_afterInit` function checks whether the owner is still the zero address, indicating initialization.
     */
    modifier afterInit() {
        _afterInit();
        _;
    }

    /**
     * @dev Internal function to save gas by checking if the owner is not initialized.
     */
    function _afterInit() internal view {
        require(owner == address(0), "DelayVaultMigrator: not initialized");
    }
}
