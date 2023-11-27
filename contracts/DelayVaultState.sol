// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./LockDealNFT/contracts/SimpleProviders/DealProvider/DealProviderState.sol";
import "./LockDealNFT/contracts/util/CalcUtils.sol";
import "./LastPoolOwnerState.sol";
import "./HoldersSum.sol";

/**
 * @title DelayVaultState
 * @dev Abstract contract containing common state and functions for DelayVaultProvider.
 */
abstract contract DelayVaultState is DealProviderState, LastPoolOwnerState, HoldersSum {
    using CalcUtils for uint256;

    /**
     * @dev Executes before a transfer, updating state based on the transfer details.
     * @param from Sender address.
     * @param to Receiver address.
     * @param poolId Pool identifier.
     */
    function beforeTransfer(address from, address to, uint256 poolId) external override firewallProtected onlyNFT {
        if (to == address(lockDealNFT))
            // this means it will be withdraw or split
            lastPoolOwner[poolId] = from; //this is the only way to know the owner of the pool
        else if (from != address(0) && !lockDealNFT.approvedContracts(from)) {
            _handleTransfer(from, to, poolId);
        }
    }

    /**
     * @dev Internal function to handle transfers and update state.
     * @param from Sender address.
     * @param to Receiver address.
     * @param poolId Pool identifier.
     * @return amount The transferred amount.
     */
    function _handleTransfer(address from, address to, uint256 poolId)
        internal
        firewallProtectedSig(0x87ac3d6b)
        returns (uint256 amount)
    {
        amount = poolIdToAmount[poolId];
        _subHoldersSum(from, amount);
        _addHoldersSum(to, amount, false);
    }

    /**
     * @dev Retrieves parameters for withdrawing a specified amount from a pool.
     * @param amount Amount to be withdrawn.
     * @param theType The account type.
     * @return params Array of withdrawal parameters.
     */
    function getWithdrawPoolParams(uint256 amount, uint8 theType) public view returns (uint256[] memory params) {
        uint256[] memory settings = typeToProviderData[theType].params;
        params = _getWithdrawPoolParams(amount, settings);
    }

    /**
     * @dev Internal function to retrieve withdrawal parameters.
     * @param amount Amount to be withdrawn.
     * @param settings Provider settings for withdrawal.
     * @return params Array of withdrawal parameters.
     */
    function _getWithdrawPoolParams(
        uint256 amount,
        uint256[] memory settings
    ) internal view returns (uint256[] memory params) {
        uint256 length = settings.length + 1;
        params = new uint256[](length);
        params[0] = amount;
        for (uint256 i = 0; i < settings.length; i++) {
            params[i + 1] = block.timestamp + settings[i];
        }
    }

    /**
     * @dev Function to be called to handle the withdrawal of assets from a DelayVaultProvider pool.
     * @param tokenId Identifier of the NFT representing ownership of the pool.
     * @return withdrawnAmount The amount of assets withdrawn.
     * @return isFinal A boolean indicating whether the withdrawal is final.
     */
    function withdraw(uint256 tokenId) external override firewallProtected onlyNFT returns (uint256 withdrawnAmount, bool isFinal) {
        address owner = lastPoolOwner[tokenId];
        uint8 theType = userToType[owner];
        uint256 amount = poolIdToAmount[tokenId];
        _createLockNFT(owner, amount, theType, tokenId);
        isFinal = true;
        withdrawnAmount = poolIdToAmount[tokenId] = 0;
        _subHoldersSum(owner, amount);
        _resetTypeIfEmpty(owner);
    }

    /**
     * @dev Internal function to create a new LockNFT and associated pool.
     * @param owner Owner of the new pool.
     * @param amount Amount of tokens in the pool.
     * @param theType Account type of the owner.
     * @param tokenId Identifier for the new pool.
     */
    function _createLockNFT(address owner, uint256 amount, uint8 theType, uint tokenId)
        internal
        firewallProtectedSig(0x41d49551)
    {
        ProviderData memory providerData = typeToProviderData[theType];
        uint256 newPoolId = lockDealNFT.mintForProvider(owner, providerData.provider);
        lockDealNFT.cloneVaultId(newPoolId, tokenId);
        uint256[] memory params = getWithdrawPoolParams(amount, theType);
        providerData.provider.registerPool(newPoolId, params);
    }

    /**
     * @dev Splits a pool, transferring a specified ratio to a new pool.
     * @param oldPoolId Identifier for the existing pool.
     * @param newPoolId Identifier for the new pool.
     * @param ratio Ratio of the amount to be transferred to the new pool.
     */
    function split(uint256 oldPoolId, uint256 newPoolId, uint256 ratio) external override firewallProtected onlyNFT {
        address oldOwner = lastPoolOwner[oldPoolId];
        address newOwner = lockDealNFT.ownerOf(newPoolId);
        uint256 amount = poolIdToAmount[oldPoolId].calcAmount(ratio);
        poolIdToAmount[oldPoolId] -= amount;
        poolIdToAmount[newPoolId] = amount;
        if (newOwner != oldOwner) {
            _handleTransfer(oldOwner, newOwner, newPoolId);
        }
    }

    /**
     * @dev Resets the account type if the user's total amount becomes zero.
     * @param user User address.
     */
    function _resetTypeIfEmpty(address user) internal firewallProtectedSig(0x646db9f5) {
        if (getTotalAmount(user) == 0) {
            userToType[user] = 0; //reset the type
        }
    }

    /**
     * @dev Retrieves provider data for a specific account type.
     * @param theType Account type.
     * @return providerData Provider data for the specified account type.
     */
    function getTypeToProviderData(uint8 theType) public view virtual returns (ProviderData memory providerData) {
        providerData = typeToProviderData[theType];
    }

    /**
     * @dev Checks if the contract supports the specified interface.
     * @param interfaceId Interface identifier.
     * @return true if the contract supports the interface, false otherwise.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IDelayVaultProvider).interfaceId || super.supportsInterface(interfaceId);
    }
}
