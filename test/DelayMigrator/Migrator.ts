import { DealProvider } from '../typechain-types';
import { LockDealNFT } from '../typechain-types';
import { LockDealProvider } from '../typechain-types';
import { TimedDealProvider } from '../typechain-types';
import { ERC20Token } from '../typechain-types/contracts/VaultManager-master/contracts/test/ERC20Token';
import { VaultManager } from '../typechain-types/contracts/VaultManager-master/contracts/VaultManager/VaultManager';
import { DelayVaultMigrator } from '../typechain-types';
import { DelayVaultProvider } from '../typechain-types';
import { IDelayVaultProvider } from '../typechain-types';
import { DelayVault } from '../typechain-types/contracts/DelayVault-master/contracts/DelayVault';
import { deployed } from '../helper';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber, constants } from 'ethers';
import { ethers } from 'hardhat';

describe('DelayVault Migrator', function () {
  let token: ERC20Token;
  let lockProvider: LockDealProvider;
  let dealProvider: DealProvider;
  let timedProvider: TimedDealProvider;
  let vaultManager: VaultManager;
  let delayVault: DelayVault;
  let delayVaultMigrator: DelayVaultMigrator;
  let delayVaultProvider: DelayVaultProvider;
  let lockDealNFT: LockDealNFT;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let providerData: IDelayVaultProvider.ProviderDataStruct[];
  const tier1: BigNumber = ethers.BigNumber.from('250');
  const tier2: BigNumber = ethers.BigNumber.from('3500');
  const tier3: BigNumber = ethers.BigNumber.from('20000');
  let startTime: number, finishTime: number;
  const amount: BigNumber = ethers.BigNumber.from('1000');
  const ONE_DAY = ethers.BigNumber.from(86400);
  const userVaults: Array<{
    Amount: BigNumber;
    StartDelay: BigNumber;
    CliffDelay: BigNumber;
    FinishDelay: BigNumber;
  }> = [
    {
      Amount: amount,
      StartDelay: ONE_DAY,
      CliffDelay: ethers.BigNumber.from(0),
      FinishDelay: ethers.BigNumber.from(0),
    },
    {
      Amount: amount.mul(2),
      StartDelay: ethers.BigNumber.from(0),
      CliffDelay: ethers.BigNumber.from(0),
      FinishDelay: ONE_DAY,
    },
    {
      Amount: amount.div(2),
      StartDelay: ethers.BigNumber.from(0),
      CliffDelay: ONE_DAY,
      FinishDelay: ethers.BigNumber.from(0),
    },
  ];

  before('Download and unzip contracts', async () => {
    [user1, user2, user3] = await ethers.getSigners();
    token = await deployed(
      '@poolzfinance/poolz-helper-v2/contracts/token/ERC20Token.sol:ERC20Token',
      'TestToken',
      'TEST',
    );
    vaultManager = await deployed('VaultManager');
    lockDealNFT = await deployed('LockDealNFT', vaultManager.address, '');
    dealProvider = await deployed('DealProvider', lockDealNFT.address);
    lockProvider = await deployed('LockDealProvider', lockDealNFT.address, dealProvider.address);
    timedProvider = await deployed('TimedDealProvider', lockDealNFT.address, lockProvider.address);
    delayVault = await deployed('DelayVault');
    delayVaultMigrator = await deployed('DelayVaultMigrator', lockDealNFT.address, delayVault.address);
    const week = 86400 * 7;
    startTime = week;
    finishTime = week * 4;
    providerData = [
      { provider: dealProvider.address, params: [], limit: tier1 },
      { provider: lockProvider.address, params: [startTime], limit: tier2 },
      { provider: timedProvider.address, params: [startTime, finishTime], limit: tier3 },
    ];
    const DelayVaultProvider = await ethers.getContractFactory('DelayVaultProvider');
    delayVaultProvider = await DelayVaultProvider.deploy(token.address, delayVaultMigrator.address, providerData);
    await lockDealNFT.setApprovedContract(lockProvider.address, true);
    await lockDealNFT.setApprovedContract(dealProvider.address, true);
    await lockDealNFT.setApprovedContract(timedProvider.address, true);
    await lockDealNFT.setApprovedContract(lockDealNFT.address, true);
    await lockDealNFT.setApprovedContract(delayVaultProvider.address, true);
    await lockDealNFT.setApprovedContract(delayVaultMigrator.address, true);
    await token.transfer(user1.address, amount.mul(10));
  });

  beforeEach(async () => {});

  it('old delay setup', async () => {
    const amounts = [0, '250', '3500', '20000'];
    const startDelays = [864000, 864000, 1728000, 2592000];
    const cliffDelays = [0, 0, 0, 0];
    const finishDelays = [0, 0, 0, 0];
    await delayVault.setMinDelays(token.address, amounts, startDelays, cliffDelays, finishDelays);
    await delayVault.setTokenStatusFilter(token.address, true);
    await delayVault.setLockedDealAddress(delayVaultMigrator.address);
    await delayVault.setGovernorContract(delayVaultMigrator.address);
  });

  it('vaultManager setup', async () => {
    await vaultManager.setTrustee(lockDealNFT.address);
    await vaultManager['createNewVault(address)'](token.address);
  });

  it('should finilaze migrator', async () => {
    await delayVaultMigrator.finilize(delayVaultProvider.address);
    expect(await delayVaultMigrator.newVault()).to.be.equal(delayVaultProvider.address);
    expect(await delayVaultMigrator.token()).to.be.equal(token.address);
    expect(await delayVaultMigrator.vaultManager()).to.be.equal(vaultManager.address);
    expect(await delayVaultMigrator.owner()).to.be.equal(constants.AddressZero);
  });

  it('should full migrate', async () => {
    // create vault in old delay vault
    await token.connect(user1).approve(delayVault.address, amount);
    await delayVault.connect(user1).CreateVault(token.address, amount, 864000, 0, 0);
    // approve redemption
    await delayVault.connect(user1).approveTokenRedemption(token.address, true);
    // migrate token
    await delayVaultMigrator.connect(user1).fullMigrate();
    const data = await delayVault.VaultMap(token.address, user1.address);
    expect(data.toString()).to.be.equal([0, 0, 0, 0].toString());
  });

  it('should CreateNew NFT Pool after old delay vault withdraw', async () => {
    // create vault in old delay vault
    await token.connect(user1).approve(delayVault.address, amount);
    await delayVault.connect(user1).CreateVault(token.address, amount, 864000, 0, 0);
    // withdraw from old delay vault
    await delayVault.connect(user1).Withdraw(token.address);
    expect(await lockDealNFT['balanceOf(address)'](user1.address)).to.be.equal(1);
  });
});
