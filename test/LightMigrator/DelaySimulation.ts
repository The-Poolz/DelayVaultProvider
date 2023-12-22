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
import { utils } from "ethers"

describe('old DelayVault and LightMigrator integration', function () {
  let token: ERC20Token;
  let lockProvider: LockDealProvider;
  let dealProvider: DealProvider;
  let timedProvider: TimedDealProvider;
  let vaultManager: VaultManager;
  let delayVault: DelayVault;
  let delayVaultMigrator: DelayVaultMigrator;
  let delayVaultProvider: DelayVaultProvider;
  let lightMigrator: LightMigrator;
  let poolId: BigNumber;
  let lockDealNFT: LockDealNFT;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;
  let providerData: IDelayVaultProvider.ProviderDataStruct[];
  const tier1: BigNumber = utils.parseUnits('250', 18);
  const tier2: BigNumber = utils.parseUnits('3500', 18);
  const tier3: BigNumber = utils.parseUnits('20000', 18);
  const ONE_DAY = 86400;
  const tier1Timer = ONE_DAY * 10;
  const tier2Timer = ONE_DAY * 20;
  const tier3Timer = ONE_DAY * 30;

  before('Download and unzip contracts', async () => {
    [user1, user2, user3, user4] = await ethers.getSigners();
    const tier1 = utils.parseUnits("3499", 18)
    const tier2 = utils.parseUnits("19999", 18)
    const tier3 = utils.parseUnits("20000", 18)
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

    providerData = [
      { provider: lockProvider.address, params: [tier1Timer], limit: tier1 },
      { provider: lockProvider.address, params: [tier2Timer], limit: tier2 },
      { provider: lockProvider.address, params: [tier3Timer], limit: tier3 },
    ];
    const DelayVaultProvider = await ethers.getContractFactory('DelayVaultProvider');
    delayVaultProvider = await DelayVaultProvider.deploy(token.address, delayVaultMigrator.address, providerData);
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
    await lockDealNFT.setApprovedContract(delayVaultMigrator.address, true);
    await lockDealNFT.setApprovedContract(lightMigrator.address, true);
    await delayVaultMigrator.finalize(delayVaultProvider.address);
    await token.transfer(user1.address, tier3.mul(2));
    await token.transfer(user2.address, tier3.mul(2));
    await token.transfer(user3.address, tier3.mul(2));
    await token.transfer(user4.address, tier3.mul(2));
    await vaultManager.setTrustee(lockDealNFT.address);
    await vaultManager['createNewVault(address)'](token.address);
    await token.connect(user3).approve(delayVault.address, tier3);
    await token.connect(user1).approve(delayVault.address, tier3);
    await token.connect(user2).approve(delayVault.address, tier3);
    await token.connect(user4).approve(delayVault.address, tier3);
    await token.connect(user4).approve(delayVaultProvider.address, tier3);
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

  beforeEach(async () => {
    poolId = await lockDealNFT.totalSupply();
  });

  it('check time if user have tier 1 in old delay and then withdraw it', async () => {
    await delayVault.connect(user1).CreateVault(token.address, tier1, tier1Timer, 0, 0);
    await delayVault.connect(user1).Withdraw(token.address);
    const currentBlockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const data = await lockDealNFT.getData(poolId);
    expect(data.name).to.be.equal("LockDealProvider");
    expect(data.params[0]).to.be.equal(tier1);
    expect(data.params[1]).to.be.equal(currentBlockTimestamp + tier1Timer);
  });


  it('check time if user have tier 2 in old delay and then withdraw it', async () => {
    await delayVault.connect(user2).CreateVault(token.address, tier2, tier2Timer, 0, 0);
    await delayVault.connect(user2).Withdraw(token.address);
    const currentBlockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const data = await lockDealNFT.getData(poolId);
    expect(data.name).to.be.equal("LockDealProvider");
    expect(data.params[0]).to.be.equal(tier2);
    expect(data.params[1]).to.be.equal(currentBlockTimestamp + tier2Timer);
  });

  it('check time if user have tier 3 in old delay and then withdraw it', async () => {
    await delayVault.connect(user3).CreateVault(token.address, tier3, tier3Timer, 0, 0);
    await delayVault.connect(user3).Withdraw(token.address);
    const currentBlockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const data = await lockDealNFT.getData(poolId);
    expect(data.name).to.be.equal("LockDealProvider");
    expect(data.params[1]).to.be.equal(currentBlockTimestamp + tier3Timer);
  });

  it("user already have tier 1 in old delay and then create new vault", async () => {
    await delayVault.connect(user4).CreateVault(token.address, tier1, tier1Timer, 0, 0);
    await delayVaultProvider.connect(user4).createNewDelayVault(user4.address, [utils.parseUnits("3500", 18)]);
    await delayVault.connect(user4).Withdraw(token.address);
    const currentBlockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const poolId = await lockDealNFT.totalSupply() - 1;
    const data = await lockDealNFT.getData(poolId);
    expect(data.name).to.be.equal("LockDealProvider");
    expect(data.params[1]).to.be.equal(currentBlockTimestamp + tier2Timer);
  })
});
