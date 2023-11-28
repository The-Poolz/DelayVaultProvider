// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Lock Deal Version 2 Interface
 * @dev This interface outlines the function required to create a new pool in the Lock Deal system.
 */
interface ILockDealV2 {
    /**
     * @dev Create a new pool in the Lock Deal system.
     * @param _Token Address of the token to lock.
     * @param _StartTime Time when the pool will start.
     * @param _CliffTime Time before which tokens cannot be withdrawn.
     * @param _FinishTime Time until which the pool will be active.
     * @param _StartAmount Total amount of tokens to sell in the pool.
     * @param _Owner Address of the owner of the tokens.
     */
    function CreateNewPool(
        address _Token,
        uint256 _StartTime,
        uint256 _CliffTime,
        uint256 _FinishTime,
        uint256 _StartAmount,
        address _Owner
    ) external payable;
}
