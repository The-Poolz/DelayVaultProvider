import { DealProvider } from '../../typechain-types';
import { LockDealNFT } from '../../typechain-types';
import { LockDealProvider } from '../../typechain-types';
import { TimedDealProvider } from '../../typechain-types';
import { ERC20Token } from '../../typechain-types';
import { VaultManager } from '../../typechain-types';
import { DelayVaultMigrator, LightMigrator } from '../../typechain-types';
import { DelayVaultProvider } from '../../typechain-types';
import { IDelayVaultProvider } from '../../typechain-types';
import { DelayVault } from '../../typechain-types';
import { deployed } from '../helper';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

describe('DelayVault LightMigrator', function () {
  let token: ERC20Token;
  let lockProvider: LockDealProvider;
  let dealProvider: DealProvider;
  let timedProvider: TimedDealProvider;
  let vaultManager: VaultManager;
  let delayVault: DelayVault;
  let delayVaultMigrator: DelayVaultMigrator;
  let delayVaultProvider: DelayVaultProvider;
  let lightMigrator: LightMigrator;
  let lockDealNFT: LockDealNFT;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;
  let user5: SignerWithAddress;
  let providerData: IDelayVaultProvider.ProviderDataStruct[];
  const tier1: BigNumber = ethers.utils.parseUnits('250', 5);
  const tier2: BigNumber = ethers.utils.parseUnits('3500', 5);
  const tier3: BigNumber = ethers.utils.parseUnits('20000', 5);
  const name = 'LightMigrator';
  const version = '1.0.0';
  let startTime: number, finishTime: number;
  const amount: BigNumber = ethers.BigNumber.from('1000');

  before('Download and unzip contracts', async () => {
    [user1, user2, user3, user4, user5] = await ethers.getSigners();
    const tier1: BigNumber = ethers.utils.parseUnits('250', 5);
    const tier2: BigNumber = ethers.utils.parseUnits('3499', 5);
    const tier3: BigNumber = ethers.utils.parseUnits('19999', 5);
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
    lightMigrator = await deployed(
      'LightMigrator',
      lockDealNFT.address,
      delayVault.address,
      delayVaultProvider.address,
      name,
      version,
    );
    await lockDealNFT.setApprovedContract(lockProvider.address, true);
    await lockDealNFT.setApprovedContract(dealProvider.address, true);
    await lockDealNFT.setApprovedContract(timedProvider.address, true);
    await lockDealNFT.setApprovedContract(lockDealNFT.address, true);
    await lockDealNFT.setApprovedContract(delayVaultProvider.address, true);
    await lockDealNFT.setApprovedContract(delayVaultMigrator.address, true);
    await lockDealNFT.setApprovedContract(lightMigrator.address, true);
    await delayVaultMigrator.finalize(delayVaultProvider.address);
    await token.transfer(user1.address, tier3.mul(2));
    await token.transfer(user2.address, tier3.mul(2));
    await token.transfer(user3.address, tier3.mul(2));
    await token.transfer(user4.address, tier3.mul(2));
  });

  it("should return name", async () => {
    expect(await lightMigrator.name()).to.be.equal(name);
  })

  it("should return version", async () => {
    expect(await lightMigrator.version()).to.be.equal(version);
  });

  it('old delay setup', async () => {
    const amounts = [0, tier1, tier2, tier3];
    const startDelays = [864000, 864000, 1728000, 2592000];
    const cliffDelays = [0, 0, 0, 0];
    const finishDelays = [0, 0, 0, 0];
    await delayVault.setMinDelays(token.address, amounts, startDelays, cliffDelays, finishDelays);
    await delayVault.setTokenStatusFilter(token.address, true);
    await delayVault.setLockedDealAddress(lightMigrator.address);
  });

  it('vaultManager setup', async () => {
    await vaultManager.setTrustee(lockDealNFT.address);
    await vaultManager['createNewVault(address)'](token.address);
  });

  it('should CreateNew NFT Pool after old delay vault withdraw', async () => {
    // create vault in old delay vault
    await token.connect(user2).approve(delayVault.address, tier1);
    await delayVault.connect(user2).CreateVault(token.address, tier1, 864000, 0, 0);
    // withdraw from old delay vault
    await delayVault.connect(user2).Withdraw(token.address);
    expect(await lockDealNFT['balanceOf(address)'](user2.address)).to.be.equal(1);
  });

  it('should change type if totalAmount 0', async () => {
    // 1) create vault in old delay vault with 200 tokens
    const tokenAmount = ethers.utils.parseUnits('200', 5);
    await token.connect(user4).approve(delayVault.address, tier1);
    await delayVault.connect(user4).CreateVault(token.address, tokenAmount, 864000, 0, 0);
    // 2) create new vault with 200 tokens
    await token.connect(user4).approve(delayVaultProvider.address, tier1);
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

  it('should revert not DelayVaultV1 CreateNewPool call', async () => {
    await expect(lightMigrator.CreateNewPool(token.address, 0, 0, 0, 0, user1.address)).to.be.revertedWith(
      'LightMigrator: not DelayVaultV1',
    );
  });

  it('check time if user have tier 3 in old delay and then withdraw it', async () => {
    // 1) create vault in old delay vault with tier3 tokens
    const poolId = await lockDealNFT.totalSupply();
    await token.connect(user3).approve(delayVault.address, tier3);
    await delayVault.connect(user3).CreateVault(token.address, tier3, 2592000, 0, 0);
    // 2) withdraw tokens from old delay vault
    await delayVault.connect(user3).Withdraw(token.address);
    const currentBlockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const data = await lockDealNFT.getData(poolId);
    expect(data.params[1]).to.be.equal(currentBlockTimestamp + startTime);
    expect(data.params[2]).to.be.equal(currentBlockTimestamp + finishTime);
  });
});
