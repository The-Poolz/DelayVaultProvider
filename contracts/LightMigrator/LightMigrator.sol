// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/ILockDealV2.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "../interfaces/IDelayVaultV1.sol";
import "../interfaces/IDelayVaultProvider.sol";

contract LightMigrator is ILockDealV2 {
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
     * @dev Constructor to initialize the LightMigrator with the LockDealNFT and the old DelayVault contract.
     * @param _nft Address of the LockDealNFT contract.
     * @param _oldVault Address of the old DelayVault (IDelayVaultV1) contract.
     */
    constructor(ILockDealNFT _nft, IDelayVaultV1 _oldVault, IDelayVaultProvider _newVault) {
        require(address(_oldVault) != address(0), "LightMigrator: Invalid old delay vault contract");
        require(address(_nft) != address(0), "LightMigrator: Invalid lock deal nft contract");
        require(address(_newVault) != address(0), "LightMigrator: Invalid new delay vault contract");
        newVault = _newVault;
        token = newVault.token();
        oldVault = _oldVault;
        lockDealNFT = _nft;
    }

    /**
     * @dev Create a new pool using the LockDealNFT (v3) when withdrawing from the old DelayVault.
     * The function can only be called by the old DelayVault (DelayVaultV1).
     * @param _Token Token address to lock.
     * @param _StartAmount Total amount of tokens.
     * @param _Owner Address of the owner of the tokens.
     */
    function CreateNewPool(
        address _Token,
        uint256,
        uint256,
        uint256,
        uint256 _StartAmount,
        address _Owner
    ) external payable override {
        require(msg.sender == address(oldVault), "LightMigrator: not DelayVaultV1");
        uint8 theType = newVault.theTypeOf(newVault.userToAmount(_Owner) + _StartAmount);
        IDelayVaultProvider.ProviderData memory providerData = newVault.getTypeToProviderData(theType);
        IERC20(token).transferFrom(msg.sender, address(this), _StartAmount);
        IERC20(token).transfer(address(lockDealNFT), _StartAmount);
        uint256 newPoolId = lockDealNFT.mintAndTransfer(_Owner, _Token, _StartAmount, providerData.provider);
        uint256[] memory params = newVault.getWithdrawPoolParams(_StartAmount, theType);
        providerData.provider.registerPool(newPoolId, params);
    }
}
