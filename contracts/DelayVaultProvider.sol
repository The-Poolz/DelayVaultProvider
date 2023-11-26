// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DelayVaultState.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@ironblocks/firewall-consumer/contracts/FirewallConsumer.sol";

/**
 * @title DelayVaultProvider
 * @dev Smart contract for locking ERC20 tokens with a delay and pairing with NFTs.
 */
contract DelayVaultProvider is DelayVaultState {
    /**
     * @dev Constructor to initialize the DelayVaultProvider contract.
     * @param _token Address of the ERC-20 token used within the DelayVault system.
     * @param _migrator Address of the migrator contract handling user migrations between DelayVaults.
     * @param _providersData Provider-specific data for different tier levels.
     */
    constructor(address _token, IMigrator _migrator, ProviderData[] memory _providersData) {
        require(address(_token) != address(0x0), "invalid address for token");
        require(address(_migrator) != address(0x0), "invalid address for migrator");
        require(_providersData.length <= 255, "too many providers");
        name = "DelayVaultProvider";
        token = _token;
        migrator = _migrator;
        lockDealNFT = _migrator.lockDealNFT();
        _finalize(_providersData);
    }

    /**
     * @dev Registers a new pool for the DelayVaultProvider.
     * @param poolId Identifier for the DelayVaultProvider NFT pool.
     * @param params Array of parameters including the amount of tokens stored in the pool.
     */
    function registerPool(
        uint256 poolId,
        uint256[] calldata params
    ) external override firewallProtected onlyProvider validProviderId(poolId) {
        require(params.length == currentParamsTargetLength(), "invalid params length");
        _registerPool(poolId, params);
    }

    /**
     * @dev Internal function to register a new pool.
     * @param poolId Identifier for the DelayVaultProvider NFT pool.
     * @param params Array of parameters including the amount of tokens stored in the pool.
     */
    function _registerPool(uint256 poolId, uint256[] calldata params)
        internal
        firewallProtectedCustom(abi.encodePacked(bytes4(0xdf3aac25)))
    {
        uint256 amount = params[0];
        address owner = lockDealNFT.ownerOf(poolId);
        _addHoldersSum(owner, amount, owner == msg.sender || msg.sender == address(migrator));
        poolIdToAmount[poolId] = amount;
    }

    /**
     * @dev Retrieves parameters associated with a DelayVaultProvider pool.
     * @param poolId Pool identifier.
     * @return params Array of parameters. The first element is the amount.
     */
    function getParams(uint256 poolId) external view override returns (uint256[] memory params) {
        params = new uint256[](1);
        params[0] = poolIdToAmount[poolId];
    }

    /**
     * @dev Retrieves the withdrawable amount for a specified pool.
     * @param poolId Pool identifier.
     * @return withdrawalAmount The withdrawal amount.
     */
    function getWithdrawableAmount(uint256 poolId) external view override returns (uint256 withdrawalAmount) {
        withdrawalAmount = poolIdToAmount[poolId];
    }

    /**
     * @dev Allows a user to upgrade their account type, subject to certain conditions.
     * @param newType The new account type.
     */
    function upgradeType(uint8 newType) external firewallProtected {
        uint8 oldType = userToType[msg.sender];
        uint256 amount = getTotalAmount(msg.sender);
        require(amount > 0, "amount must be bigger than 0");
        require(newType > oldType, "new type must be bigger than the old one");
        require(newType < typesCount, "new type must be smaller than the types count");
        userToType[msg.sender] = newType;
    }

    /**
     * @dev Creates a new delay vault, transferring tokens and minting a new NFT.
     * @param owner Owner of the new vault.
     * @param params Array with one parameter. params[0] - the amount of tokens stored in the pool.
     * @return poolId The created pool ID.
     */
    function createNewDelayVault(address owner, uint256[] calldata params) external firewallProtected returns (uint256 poolId) {
        require(params.length == currentParamsTargetLength(), "invalid params length");
        uint256 amount = params[0];
        IERC20(token).transferFrom(msg.sender, address(lockDealNFT), amount);
        poolId = lockDealNFT.mintAndTransfer(owner, token, amount, this);
        _registerPool(poolId, params);
    }

    /**
     * @dev Creates a new delay vault with a cryptographic signature.
     * @param owner Owner of the new vault.
     * @param params Array with one parameter. params[0] - the amount of tokens stored in the pool
     * @param signature Cryptographic signature.
     * @return poolId The created pool ID.
     */
    function createNewDelayVaultWithSignature(
        address owner,
        uint256[] calldata params,
        bytes calldata signature
    ) external firewallProtected returns (uint256 poolId) {
        require(params.length == currentParamsTargetLength(), "invalid params length");
        poolId = lockDealNFT.safeMintAndTransfer(owner, token, msg.sender, params[0], this, signature);
        _registerPool(poolId, params);
    }
}
