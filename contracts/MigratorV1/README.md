# Migrator
**The Migrator** is a smart contract that enables the transfer of [ERC20](https://ethereum.org/developers/docs/standards/tokens/erc-20/) tokens from a [DelayVault](https://github.com/The-Poolz/DelayVault) contract to a more recent system. Once granted **User** approval, **The Migrator** orchestrates the graceful transfer of tokens from the old **DelayVault** to the new one, meticulously preserving all the settings of the previous vault.

### Navigation

- [Why do we need a migrator?](#why-do-we-need-a-migrator)
- [UML](#uml)
- [Functionality](#functionality)
- [License](#license)

## Why do we need a migrator?

* **Memory leak issue:** the old **DelayVault** utilized an array that was refilled upon the addition of a new user, along with a cyclic search of these users. This approach ultimately escalated resource consumption when establishing a new vault facility. It would be imprudent to employ a system where an augmentation in the number of users results in heightened transaction costs.

* **New NFT system:** the new system is built upon the ERC-721 standard, providing the foundation for conferring the right to use a specific pool. This enhancement enhances the value of the pool by decoupling ownership from a single address, enabling it to be transferred when necessary.

* **More flexible solution:** the previous solution had limitations in its functionality. Users were unable to withdraw a portion of the tokens from the vault, and they couldn't split their pools into several parts. The new system addresses these constraints, enabling users to perform these actions and cater to emerging requirements.

## UML
![classDiagram](https://github.com/The-Poolz/LockDealNFT.DelayVaultProvider/assets/68740472/3e463f6c-7c04-4eca-82c3-dfdd045bf6f6)


## Functionality

### Full Migrate
```solidity
function fullMigrate() external afterInit
```
After user approval in the old **DelayValt**, we can make exactly the same copy of the vault but using the new system. The user receives an `DelayVaultProvider NFT` that will indicate the right to own the pool.

### Withdraw Tokens From V1Vault
```solidity
function withdrawTokensFromV1Vault() external afterInit
```
If the user has authorized the use of the new system but still wishes to withdraw tokens without utilizing the new **DelayVault NFT**, they can initiate a withdrawal option, triggering an automated withdrawal process. An unlocking period is then necessary, providing an opportunity to receive the tokens. The user will be granted one of the simple NFT providers, serving as proof of ownership for the temporarily locked amount.

### Create New NFT Pool 
```solidity
function CreateNewPool(
        address _Token, //token to lock address
        uint256, // Until what time the pool will start
        uint256, //Before CliffTime can't withdraw tokens
        uint256, //Until what time the pool will end
        uint256 _StartAmount, //Total amount of the tokens to sell in the pool
        address _Owner // Who the tokens belong to
    )
```
The capability to seamlessly transition to the new system when withdrawing funds from the old **DelayVault** is facilitated by substituting the **LockDealV2** contract address with the new system in the old **DelayVault**. When a withdrawal occurs in the old system, the user is automatically transferred to the new system, initiating the withdrawal process using the new system options. The user will be granted one of the simple NFT providers, serving as proof of ownership for the temporarily locked amount.

## License
[The-Poolz](https://poolz.finance/) Contracts is released under the [MIT License](https://github.com/The-Poolz/DelayVaultProvider/blob/master/LICENSE).