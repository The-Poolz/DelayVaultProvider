// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./LockDealNFT/contracts/SimpleProviders/Provider/ProviderModifiers.sol";
import "./interfaces/IDelayVaultProvider.sol";
import "./interfaces/IMigrator.sol";

/**
 * @title HoldersSum
 * @dev Contract handling user balances, account types, and provider data for DelayVaultProvider.
 */
abstract contract HoldersSum is ProviderModifiers, IDelayVaultProvider {
    //this is only the delta
    //the amount is the amount of the pool
    // params[0] = startTimeDelta (empty for DealProvider)
    // params[1] = endTimeDelta (only for TimedLockDealProvider)
    mapping(address => uint256) public userToAmount; // Total amount held by each user
    mapping(address => uint8) public userToType; //Each user got type, can go up. when withdraw to 0, its reset
    mapping(uint8 => ProviderData) public typeToProviderData; // Provider data for each tier type; indexed by type
    uint8 public typesCount; // Maximum tier type + 1
    address public token; // ERC-20 token address
    IMigrator public migrator; // Migrator contract for user data migration

    event VaultValueChanged(address indexed token, address indexed owner, uint256 amount);

    /**
     * @dev Retrieves the total amount held by a user, including both DelayVault and V1 DelayVault balances.
     * @param user User address.
     * @return Total amount held by the user.
     */
    function getTotalAmount(address user) public view returns (uint256) {
        return userToAmount[user] + migrator.getUserV1Amount(user);
    }

    /**
     * @dev Determines the tier type based on the amount of tokens held.
     * @dev Better to use binary search if the number of types is more than ~6-7
     * @param amount Amount of ERC20 tokens.
     * @return theType The deterfmined tier type.
     */
    function theTypeOf(uint256 amount) public view returns (uint8 theType) {
        for (uint8 i = 0; i < typesCount; ++i) {
            if (amount <= typeToProviderData[i].limit) {
                theType = i;
                break;
            }
        }
    }

    /**
     * @dev Retrieves the balance (number of NFTs) owned by a user for the current provider.
     * @param user User address.
     * @return balance (number of NFTs) owned by the user for the current provider.
     */
    function balanceOf(address user) public view returns (uint256 balance) {
        uint256 fullBalanceOf = lockDealNFT.balanceOf(user);
        for (uint256 i = 0; i < fullBalanceOf; ++i) {
            if (this == lockDealNFT.poolIdToProvider(lockDealNFT.tokenOfOwnerByIndex(user, i))) {
                ++balance;
            }
        }
    }

    /**
     * @dev Retrieves the DelayVault NFT pool ID owned by a user at a specific index.
     * @param user User address.
     * @param index Index of the user NFT token.
     * @return poolId Pool ID of the DelayVault NFT owned by the user at the specified index.
     */
    function tokenOfOwnerByIndex(address user, uint256 index) public view returns (uint256 poolId) {
        uint256 length = balanceOf(user);
        require(index < length, "invalid index poolId");
        uint256 fullBalanceOf = lockDealNFT.balanceOf(user);
        uint256 j = 0;
        for (uint256 i = 0; i < fullBalanceOf; ++i) {
            poolId = lockDealNFT.tokenOfOwnerByIndex(user, i);
            if (this == lockDealNFT.poolIdToProvider(poolId) && j++ == index) {
                return poolId;
            }
        }
    }

    /**
     * @dev Internal function to add the specified amount to a user's total balance and update the tier type.
     * @param user User address.
     * @param amount Amount to be added.
     * @param allowTypeUpgrade Boolean indicating whether tier type upgrades are allowed.
     */
    function _addHoldersSum(address user, uint256 amount, bool allowTypeUpgrade) internal {
        uint256 newAmount = userToAmount[user] + amount;
        _setHoldersSum(user, newAmount, allowTypeUpgrade);
    }

    /**
     * @dev Internal function to subtract the specified amount from a user's total balance.
     * @param user User address.
     * @param amount Amount to be subtracted.
     */
    function _subHoldersSum(address user, uint256 amount) internal {
        uint256 oldAmount = userToAmount[user];
        require(oldAmount >= amount, "amount exceeded");
        uint256 newAmount = oldAmount - amount;
        _setHoldersSum(user, newAmount, false);
    }

    /**
     * @dev Internal function to set the total balance for a user and update the tier type.
     * @param user User address.
     * @param newAmount New total balance for the user.
     * @param allowTypeUpgrade Boolean indicating whether tier type upgrades are allowed.
     */
    function _setHoldersSum(address user, uint256 newAmount, bool allowTypeUpgrade) internal {
        uint8 newType = theTypeOf(migrator.getUserV1Amount(user) + newAmount);
        if (allowTypeUpgrade) {
            _upgradeUserTypeIfGreater(user, newType);
        } else {
            _upgradeUserTypeIfMatchesV1(user, newType, newAmount);
            // Ensure the type doesn't change if upgrades are not allowed
            require(newType <= userToType[user], "type must be the same or lower");
        }
        userToAmount[user] = newAmount;
        emit VaultValueChanged(token, user, newAmount);
    }

    /**
     * @dev Internal function to upgrade a user's tier type if the new type is greater.
     * @param user User address.
     * @param newType New tier type.
     */
    function _upgradeUserTypeIfGreater(address user, uint8 newType) internal {
        if (newType > userToType[user]) {
            userToType[user] = newType;
        }
    }

    /**
     * @dev Internal function to reset a user's tier type if the new amount is zero.
     * @param user User address.
     * @param newType New tier type.
     * @param newAmount New total balance for the user.
     */
    function _upgradeUserTypeIfMatchesV1(address user, uint8 newType, uint256 newAmount) internal {
        if (newAmount == 0) {
            userToType[user] = newType;
        }
    }

    /**
     * @dev Internal function to finalize the initialization of tier types and provider data.
     * @param _providersData Array of provider data for different tier types.
     */
    function _finilize(ProviderData[] memory _providersData) internal {
        typesCount = uint8(_providersData.length);
        uint256 limit = 0;
        for (uint8 i = 0; i < typesCount; ++i) {
            limit = _setTypeToProviderData(i, limit, _providersData[i]);
        }
    }

    /**
     * @dev Internal function to set provider data for a specific tier type.
     * @param theType Tier type.
     * @param lastLimit Last limit used for setting provider data.
     * @param item Provider data for the specified tier type.
     * @return limit Updated limit for the next provider data.
     */
    function _setTypeToProviderData(
        uint8 theType,
        uint256 lastLimit,
        ProviderData memory item
    ) internal returns (uint256 limit) {
        require(address(item.provider) != address(0x0), "invalid address");
        require(item.provider.currentParamsTargetLenght() == item.params.length + 1, "invalid params length");
        limit = item.limit;
        require(limit >= lastLimit, "limit must be bigger or equal than the previous on");
        typeToProviderData[theType] = item;
        if (theType == typesCount - 1) {
            typeToProviderData[theType].limit = type(uint256).max; //the last one is the max, token supply is out of the scope
        }
    }
}
