// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../LockDealNFT/contracts/interfaces/ILockDealNFT.sol";

/**
 * @title IMigrator
 * @dev Interface for the migrator contract used in the migration process between different versions of the DelayVault system.
 */
interface IMigrator {
    /**
     * @dev Retrieves the amount of assets associated with a user in version 1 of the DelayVault system.
     * @param user The address of the user.
     * @return amount The amount of assets owned by the user in version 1.
     */
    function getUserV1Amount(address user) external view returns (uint256 amount);

    /**
     * @dev Retrieves the address of the LockDealNFT contract.
     * @return lockDealNFT The address of the LockDealNFT contract.
     */
    function lockDealNFT() external view returns (ILockDealNFT);
}