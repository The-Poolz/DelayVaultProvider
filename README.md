# DelayVaultProvider

[![Build and Test](https://github.com/The-Poolz/LockDealNFT.DelayVaultProvider/actions/workflows/node.js.yml/badge.svg)](https://github.com/The-Poolz/LockDealNFT.DelayVaultProvider/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/The-Poolz/LockDealNFT.DelayVaultProvider/branch/master/graph/badge.svg)](https://codecov.io/gh/The-Poolz/LockDealNFT.DelayVaultProvider)
[![CodeFactor](https://www.codefactor.io/repository/github/the-poolz/LockDealNFT.DelayVaultProvider/badge)](https://www.codefactor.io/repository/github/the-poolz/LockDealNFT.DelayVaultProvider)

A smart contract that locks **ERC20** tokens with a set delay. Upon withdrawal request, the tokens remain locked for the specified delay duration. Every lock is paired with an **NFT**, representing ownership of the locked amount.

### Audit report
The audit report is available here: [Audit Report](https://docs.google.com/document/d/18wc_ubSvvdZHUFyQuKjGpwSGjDzZz8mp33QShtAxjpQ/edit?tab=t.0#heading=h.5uoc4mfz7mn4)

### Navigation

- [Installation](#installation)
- [UML](#uml)
- [Functionality](#functionality)
- [License](#license)

## Installation
Install the packages:
```console
npm i
```
Or using the [Yarn](https://yarnpkg.com/) package manager:
```console
yarn
```
Download integration contracts:

```console
npx ts-node ./scripts/fileImport.ts
```
Compile contracts:
```console
npx hardhat compile
```
Run tests:
```console
npx hardhat test
``` 
Run coverage:
```console
npx hardhat coverage
```

## UML
`DelayVaultProvider` is linked with [LockDealNFT](https://github.com/The-Poolz/LockDealNFT) for working with **NFTs** and with [VaultManager](https://github.com/The-Poolz/VaultManager) for storing **ERC20** tokens.
![classDiagram](https://github.com/The-Poolz/LockDealNFT.DelayVaultProvider/assets/68740472/f5faceb8-276b-4bb8-a7f3-a5b828b78694)

## Functionality

### Constructor
```solidity
constructor(address _token, IMigrator _migrator, ProviderData[] memory _providersData)
```
 The constructor initializes the contract by setting essential parameters such as the token address, migrator contract, and provider data. It also checks the validity of these inputs.
* `address _token`: The _token parameter represents the Ethereum address of the ERC-20 token that will be used within the DelayVault system. This token will be employed for creating and managing pools, transferring assets, and performing various financial operations.

* `IMigrator _migrator`: The _migrator parameter corresponds to the address of the migrator contract (IMigrator) used for handling user migrations between different versions of the system. It plays a crucial role in transitioning user data and holdings during system upgrades.

* `ProviderData[] memory _providersData`: _providersData is an array that contains provider-specific data, including parameters and settings for different **tiers** levels. These parameters define how **tiers** are categorized and managed based on their type.

### registerPool
```solidity
function registerPool(uint256 poolId, uint256[] calldata params) public
```
 Providers can register a new pool with this function, associating a poolId and providing parameters for the pool.

* `uint256 poolId` - **DelayVaultProvider** NFT pool indentifier.
* `uint256[] calldata params` - an array of parameters. Contains the amount of tokens stored in a specific pool.

### getParams
```solidity
function getParams(uint256 poolId) external view override returns (uint256[] memory params)
```
 Allows users to retrieve parameters associated with a **DelayVaultProvider** pool.
* `uint256 poolId` - pool identifier.
* `returns` - An array of parameters.
### getWithdrawableAmount
```solidity
function getWithdrawableAmount(uint256 poolId) external view override returns (uint256 withdrawalAmount)
```
 Returns the withdrawable amount for a specified pool.
* `uint256 poolId` - pool identifier.
* `returns` - the withdrawal amount.
### upgradeType
```solidity
function upgradeType(uint8 newType) public
```
 Users can upgrade their account type, subject to certain conditions. The function checks the current account balance, the new type, and the current type to determine if the upgrade is allowed.
* `uint8 newType` - the new account type. Can't be higher than the maximum tier and can't be lower than the current one.
### createNewDelayVault
```solidity
function createNewDelayVault(address owner, uint256[] calldata params) external returns (uint256 poolId)
```
 Users can create a new delay vault by providing an owner address and parameters for the vault. Tokens are passed from the caller to the `LockDealNFT` contract and then to the `VaultManager` and a new vault is created.
* `address owner` - the owner of the new vault.
*  `uint256[] calldata params` - an array of parameters. Contains the amount of tokens stored in a specific pool.
* `returns` - The created pool ID.
### createNewDelayVaultWithSignature
```solidity
function createNewDelayVaultWithSignature(
        address owner,
        uint256[] calldata params,
        bytes calldata signature
    ) external returns (uint256 poolId)
```
 Similar to createNewDelayVault, but this function allows the creation of a vault with a cryptographic signature for enhanced security. Additionally, transfer tokens are moved to the VaultManager instead of making double transfer calls.
* `address owner` - the owner of the new vault.
* `uint256[] calldata params` - an array of parameters. Contains the amount of tokens stored in a specific pool.
* `bytes calldata signature` - a cryptographic signature.
* `returns` -  The created pool ID.

## License
[The-Poolz](https://poolz.finance/) Contracts is released under the [MIT License](https://github.com/The-Poolz/DelayVaultProvider/blob/master/LICENSE).