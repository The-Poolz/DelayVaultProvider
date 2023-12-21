import { LightMigrator, MockVaultManager } from '../../typechain-types';
import { DealProvider } from '../../typechain-types';
import { LockDealNFT } from '../../typechain-types';
import { LockDealProvider } from '../../typechain-types';
import { TimedDealProvider } from '../../typechain-types';
import { DelayVaultMigrator } from '../../typechain-types';
import { DelayVaultProvider } from '../../typechain-types';
import { IDelayVaultProvider } from '../../typechain-types';
import { DelayVault } from '../../typechain-types';
import { deployed, token } from '../helper';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber, constants } from 'ethers';
import { ethers } from 'hardhat';

describe('Delay Migrator tests', function () {
  let lockProvider: LockDealProvider;
  let dealProvider: DealProvider;
  let timedProvider: TimedDealProvider;
  let mockVaultManager: MockVaultManager;
  let delayVault: DelayVault;
  let delayVaultMigrator: DelayVaultMigrator;
  let lightMigrator: LightMigrator;
  let delayVaultProvider: DelayVaultProvider;
  let lockDealNFT: LockDealNFT;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let providerData: IDelayVaultProvider.ProviderDataStruct[];
  const tier1: BigNumber = ethers.BigNumber.from(250);
  const tier2: BigNumber = ethers.BigNumber.from(3500);
  const tier3: BigNumber = ethers.BigNumber.from(20000);
  let startTime: BigNumber, finishTime: BigNumber;
  const ONE_DAY = ethers.BigNumber.from(86400);

  before(async () => {
    [user1, user2, user3] = await ethers.getSigners();
    mockVaultManager = await deployed('MockVaultManager');
    lockDealNFT = await deployed('LockDealNFT', mockVaultManager.address, '');
    dealProvider = await deployed('DealProvider', lockDealNFT.address);
    lockProvider = await deployed('LockDealProvider', lockDealNFT.address, dealProvider.address);
    timedProvider = await deployed('TimedDealProvider', lockDealNFT.address, lockProvider.address);
    delayVault = await deployed('DelayVault');
    delayVaultMigrator = await deployed('DelayVaultMigrator', lockDealNFT.address, delayVault.address);
    const week = ONE_DAY.mul(7);
    startTime = week;
    finishTime = week.mul(4);
    providerData = [
      { provider: dealProvider.address, params: [], limit: tier1 },
      { provider: lockProvider.address, params: [startTime], limit: tier2 },
      { provider: timedProvider.address, params: [startTime, finishTime], limit: tier3 },
    ];
    const DelayVaultProvider = await ethers.getContractFactory('DelayVaultProvider');
    delayVaultProvider = await DelayVaultProvider.deploy(token, delayVaultMigrator.address, providerData);
    lightMigrator = await deployed(
      'LightMigrator',
      lockDealNFT.address,
      delayVault.address,
      delayVaultProvider.address,
    );
    await lockDealNFT.setApprovedContract(lockProvider.address, true);
    await lockDealNFT.setApprovedContract(dealProvider.address, true);
    await lockDealNFT.setApprovedContract(timedProvider.address, true);
    await lockDealNFT.setApprovedContract(lockDealNFT.address, true);
    await lockDealNFT.setApprovedContract(delayVaultProvider.address, true);
  });

  it('should revert invalid delayVaultProvider', async () => {
    await expect(delayVaultMigrator.finalize(delayVaultMigrator.address)).to.be.revertedWith(
      'DelayVaultMigrator: Invalid new delay vault contract',
    );
  });

  it('should revert invalid owner call', async () => {
    await expect(delayVaultMigrator.connect(user2).finalize(delayVaultProvider.address)).to.be.revertedWith(
      'DelayVaultMigrator: not owner',
    );
  });

  it('should revert not initialized migrate call', async () => {
    delayVaultMigrator = await deployed('DelayVaultMigrator', lockDealNFT.address, delayVault.address);
    await expect(delayVaultMigrator.fullMigrate()).to.be.revertedWith('DelayVaultMigrator: not initialized');
  });

  it('should finalize data', async () => {
    await delayVaultMigrator.finalize(delayVaultProvider.address);
    expect(await delayVaultMigrator.newVault()).to.be.equal(delayVaultProvider.address);
    expect(await delayVaultMigrator.token()).to.be.equal(token);
    expect(await delayVaultMigrator.owner()).to.be.equal(constants.AddressZero);
  });

  it('should revert not approved migrate call', async () => {
    await expect(delayVaultMigrator.fullMigrate()).to.be.revertedWith('DelayVaultMigrator: not allowed');
  });

  it('should revert not approved withdrawTokensFromV1Vault call', async () => {
    await expect(delayVaultMigrator.withdrawTokensFromV1Vault()).to.be.revertedWith('DelayVaultMigrator: not allowed');
  });
});
