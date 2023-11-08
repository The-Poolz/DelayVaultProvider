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
  let user4: SignerWithAddress;
  let user5: SignerWithAddress;
  let providerData: IDelayVaultProvider.ProviderDataStruct[];
  const tier1: BigNumber = ethers.BigNumber.from('250');
  const tier2: BigNumber = ethers.BigNumber.from('3500');
  const tier3: BigNumber = ethers.BigNumber.from('20000');
  let startTime: number, finishTime: number;
  const amount: BigNumber = ethers.BigNumber.from('1000');

  before('Download and unzip contracts', async () => {
    [user1, user2, user3, user4, user5] = await ethers.getSigners();
    token = await deployed(
      '@spherex-xyz/poolz-helper-v2/contracts/token/ERC20Token.sol:ERC20Token',
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
    await token.transfer(user2.address, amount.mul(10));
    await token.transfer(user3.address, amount.mul(10));
    await token.transfer(user4.address, amount.mul(10));
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

  it('should increase VaultManager token balance after full migrate', async () => {
    const oldBalance = await vaultManager.getAllVaultBalanceByToken(token.address, 0, 1);
    // create vault in old delay vault
    await token.connect(user1).approve(delayVault.address, amount);
    await delayVault.connect(user1).CreateVault(token.address, amount, 864000, 0, 0);
    // approve redemption
    await delayVault.connect(user1).approveTokenRedemption(token.address, true);
    // migrate token
    await delayVaultMigrator.connect(user1).fullMigrate();
    const newBalance = await vaultManager.getAllVaultBalanceByToken(token.address, 0, 1);
    expect(oldBalance.add(amount)).to.be.equal(newBalance);
  });

  it('should CreateNew NFT Pool after old delay vault withdraw', async () => {
    // create vault in old delay vault
    await token.connect(user2).approve(delayVault.address, amount);
    await delayVault.connect(user2).CreateVault(token.address, amount, 864000, 0, 0);
    // withdraw from old delay vault
    await delayVault.connect(user2).Withdraw(token.address);
    expect(await lockDealNFT['balanceOf(address)'](user2.address)).to.be.equal(1);
  });

  it('should change type if totalAmount 0', async () => {
    // 1) create vault in old delay vault with 200 tokens
    const tokenAmount = amount.div(5);
    await token.connect(user4).approve(delayVault.address, amount.mul(2));
    await delayVault.connect(user4).CreateVault(token.address, tokenAmount, 864000, 0, 0);
    // 2) create new vault with 200 tokens
    await token.connect(user4).approve(delayVaultProvider.address, amount.mul(2));
    const poolId = await lockDealNFT.totalSupply();
    await delayVaultProvider.connect(user4).createNewDelayVault(user4.address, [tokenAmount]);
    // The user type should be increased to 1
    expect(await delayVaultProvider.userToType(user4.address)).to.be.equal(1);

    // 3) User sends 200 tokens from new vault to another user
    await lockDealNFT.connect(user4).approvePoolTransfers(true);
    await lockDealNFT.connect(user4).transferFrom(user4.address, user5.address, poolId);

    // 4) Then do withdraw from old delay vault
    await delayVault.connect(user4).Withdraw(token.address);
    // The user type should be 0
    expect(await delayVaultProvider.userToType(user4.address)).to.be.equal(0);
  });

  it('should increase VaultManager token balance after old delay vault withdraw', async () => {
    const oldBalance = await vaultManager.getAllVaultBalanceByToken(token.address, 0, 1);
    await token.connect(user2).approve(delayVault.address, amount);
    await delayVault.connect(user2).CreateVault(token.address, amount, 864000, 0, 0);
    await delayVault.connect(user2).Withdraw(token.address);
    const newBalance = await vaultManager.getAllVaultBalanceByToken(token.address, 0, 1);
    expect(oldBalance.add(amount)).to.be.equal(newBalance);
  });

  it('should withdraw from old delay after reedeem', async () => {
    // create vault in old delay vault
    await token.connect(user3).approve(delayVault.address, amount);
    await delayVault.connect(user3).CreateVault(token.address, amount, 864000, 0, 0);
    // approve redemption
    await delayVault.connect(user3).approveTokenRedemption(token.address, true);
    // withdrawTokensFromV1Vault after redeem call
    await delayVaultMigrator.connect(user3).withdrawTokensFromV1Vault();
    const data = await delayVault.VaultMap(token.address, user3.address);
    expect(data.toString()).to.be.equal([0, 0, 0, 0].toString());
    expect(await lockDealNFT['balanceOf(address)'](user3.address)).to.be.equal(1);
  });

  it('should increase VaultManager token balance after withdrawTokensFromV1Vault call', async () => {
    const oldBalance = await vaultManager.getAllVaultBalanceByToken(token.address, 0, 1);
    // create vault in old delay vault
    await token.connect(user3).approve(delayVault.address, amount);
    await delayVault.connect(user3).CreateVault(token.address, amount, 864000, 0, 0);
    // approve redemption
    await delayVault.connect(user3).approveTokenRedemption(token.address, true);
    // withdrawTokensFromV1Vault after redeem call
    await delayVaultMigrator.connect(user3).withdrawTokensFromV1Vault();
    const newBalance = await vaultManager.getAllVaultBalanceByToken(token.address, 0, 1);
    expect(oldBalance.add(amount)).to.be.equal(newBalance);
  });
});
