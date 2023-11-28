// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Delay Vault Version 1 Interface
 * @dev Interface outlining functions for interacting with the Delay Vault Version 1.
 */
interface IDelayVaultV1 {
    /**
     * @dev Redeem tokens from the Delay Vault from a specific owner.
     * @param _token Address of the ERC-20 token to redeem.
     * @param _owner Address of the owner whose tokens are being redeemed.
     * @param _amount Amount of tokens to redeem.
     */
    function redeemTokensFromVault(address _token, address _owner, uint256 _amount) external;

    /**
     * @dev Check if the owner has authorized the use of their tokens in DelayVault.
     * @param _token Address of the ERC-20 token to check allowance for.
     * @param _owner Address of the owner to check allowance for.
     * @return Does the system have permission for owner tokens?
     */
    function Allowance(address _token, address _owner) external view returns (bool);

    /**
     * @dev Retrieve information from the Delay Vault map for a specific owner and token.
     * @param _token Address of the ERC-20 token in the vault map.
     * @param _owner Address of the owner in the vault map.
     * @return The vault map information including total, withdrawn, cliff, and start amounts.
     */
    function VaultMap(address _token, address _owner) external view returns (uint256, uint256, uint256, uint256);
}
