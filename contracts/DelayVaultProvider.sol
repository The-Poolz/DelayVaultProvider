// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DelayVaultState.sol";
import "@spherex-xyz/openzeppelin-solidity/contracts/token/ERC20/IERC20.sol"; 
import {SphereXProtected} from "@spherex-xyz/contracts/src/SphereXProtected.sol";
 

contract DelayVaultProvider is DelayVaultState {
    constructor(address _token, IMigrator _migrator, ProviderData[] memory _providersData) {
        require(address(_token) != address(0x0), "invalid address");
        require(address(_migrator) != address(0x0), "invalid address");
        require(_providersData.length <= 255, "too many providers");
        name = "DelayVaultProvider";
        token = _token;
        migrator = _migrator;
        lockDealNFT = _migrator.lockDealNFT();
        _finilize(_providersData);
    }

    ///@param params[0] = amount
    function registerPool(
        uint256 poolId,
        uint256[] calldata params
    ) public override onlyProvider validProviderId(poolId) sphereXGuardPublic(0x952ef082, 0xe9a9fce2) {
        require(params.length == currentParamsTargetLenght(), "invalid params length");
        _registerPool(poolId, params);
    }

    function _registerPool(uint256 poolId, uint256[] calldata params) internal sphereXGuardInternal(0x1854fc37) {
        uint256 amount = params[0];
        address owner = lockDealNFT.ownerOf(poolId);
        _addHoldersSum(owner, amount, owner == msg.sender || msg.sender == address(migrator));
        poolIdToAmount[poolId] = amount;
    }

    function getParams(uint256 poolId) external view override returns (uint256[] memory params) {
        params = new uint256[](1);
        params[0] = poolIdToAmount[poolId];
    }

    function getWithdrawableAmount(uint256 poolId) external view override returns (uint256 withdrawalAmount) {
        withdrawalAmount = poolIdToAmount[poolId];
    }

    function upgradeType(uint8 newType) public sphereXGuardPublic(0x0aa2846a, 0x66b564bf) {
        uint8 oldType = userToType[msg.sender];
        uint256 amount = getTotalAmount(msg.sender);
        require(amount > 0, "amount must be bigger than 0");
        require(newType > oldType, "new type must be bigger than the old one");
        require(newType < typesCount, "new type must be smaller than the types count");
        userToType[msg.sender] = newType;
    }

    function createNewDelayVault(address owner, uint256[] calldata params) external sphereXGuardExternal(0x6ea2b58a) returns (uint256 poolId) {
        require(params.length == currentParamsTargetLenght(), "invalid params length");
        uint256 amount = params[0];
        IERC20(token).transferFrom(msg.sender, address(lockDealNFT), amount);
        poolId = lockDealNFT.mintAndTransfer(owner, token, amount, this);
        _registerPool(poolId, params);
    }

    function createNewDelayVaultWithSignature(
        address owner,
        uint256[] calldata params,
        bytes calldata signature
    ) external sphereXGuardExternal(0x7055b37f) returns (uint256 poolId) {
        require(params.length == currentParamsTargetLenght(), "invalid params length");
        poolId = lockDealNFT.safeMintAndTransfer(owner, token, msg.sender, params[0], this, signature);
        _registerPool(poolId, params);
    }
}
