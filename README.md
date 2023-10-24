# DelayVaultProvider

[![Build and Test](https://github.com/The-Poolz/DelayVaultProvider/actions/workflows/node.js.yml/badge.svg)](https://github.com/The-Poolz/DelayVaultProvider/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/The-Poolz/DelayVaultProvider/branch/master/graph/badge.svg)](https://codecov.io/gh/The-Poolz/DelayVaultProvider)
[![CodeFactor](https://www.codefactor.io/repository/github/the-poolz/delayvaultprovider/badge)](https://www.codefactor.io/repository/github/the-poolz/delayvaultprovider)

A smart contract that locks **ERC20** tokens with a set delay. Upon withdrawal request, the tokens remain locked for the specified delay duration. Every lock is paired with an **NFT**, representing ownership of the locked amount.

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
![classDiagram](https://github.com/The-Poolz/DelayVaultProvider/assets/68740472/6581e0d0-da10-4ffa-828a-d3b328478a30)

## Functionality

## License
[The-Poolz](https://poolz.finance/) Contracts is released under the [MIT License](https://github.com/The-Poolz/DelayVaultProvider/blob/master/LICENSE).