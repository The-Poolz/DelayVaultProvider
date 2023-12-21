// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../LockDealNFT/contracts/interfaces/IProvider.sol";
import "../LockDealNFT/contracts/interfaces/ILockDealNFT.sol";

/**
 * @title IDelayVaultProvider
 * @dev Interface for the DelayVaultProvider contract, extending the IProvider interface.
 */
interface IDelayVaultProvider is IProvider {
    /**
     * @dev Structure representing provider-specific data.
     * @param provider The Simple provider contract address.
     * @param params An array of parameters: 0 params for DealProvider, 1 for LockProvider, 2 for TimedDealProvider.
     * @param limit The limit associated with the tier level.
     */
    struct ProviderData {
        IProvider provider;
        uint256[] params;
        uint256 limit;
    }

    /**
     * @dev Creates a new delay vault associated with the specified owner and parameters.
     * @param owner The address of the vault owner.
     * @param params An array of parameters for the new delay vault.
     * @return poolId The unique identifier of the newly created delay vault.
     */
    function createNewDelayVault(address owner, uint256[] memory params) external returns (uint256 poolId);

    /**
     * @dev Retrieves the address of the ERC-20 token associated with the DelayVaultProvider.
     * @return The address of the ERC-20 token.
     */
    function token() external view returns (address);

    /**
     * @dev Determines the tier type based on the specified amount of assets.
     * @param amount The amount of assets.
     * @return theType The determined tier type.
     */
    function theTypeOf(uint256 amount) external view returns (uint8 theType);

    /**
     * @dev Retrieves the total amount of assets owned by a specific user.
     * @param user The address of the user.
     * @return totalAmount The total amount of assets owned by the user.
     */
    function getTotalAmount(address user) external view returns (uint256);

    /**
     * @dev Retrieves provider-specific data based on the specified tier type.
     * @param theType The tier type.
     * @return providerData The provider data associated with the tier type.
     */
    function getTypeToProviderData(uint8 theType) external view returns (ProviderData memory providerData);

    /**
     * @dev Retrieves the parameters for withdrawing a specified amount from a pool associated with a certain tier type.
     * @param amount The amount to withdraw.
     * @param theType The tier type.
     * @return params The parameters for withdrawing the specified amount.
     */
    function getWithdrawPoolParams(uint256 amount, uint8 theType) external view returns (uint256[] memory params);

    /**
     * @dev Retrieves the amount of assets owned by a specific user.
     * @param user The address of the user.
     * @return amount The amount of assets owned by the user.
     */
    function userToAmount(address user) external view returns (uint256 amount);
}
