import { LockDealProvider } from '../../typechain-types';
import { TimedDealProvider } from '../../typechain-types';
import { LockDealNFT } from '../../typechain-types';
import { DealProvider } from '../../typechain-types';
import { MockProvider } from '../../typechain-types';
import { VaultManager } from '../../typechain-types';
import { DelayVaultProvider } from '../../typechain-types';
import { DelayVaultMigrator } from '../../typechain-types';
import { DelayVault } from '../../typechain-types';
import { ERC20Token } from '../../typechain-types';
import { IDelayVaultProvider } from '../../typechain-types/contracts/interfaces/IDelayVaultProvider';
import { deployed, MAX_RATIO, _createUsers, gasLimit } from '../helper';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber, Bytes } from 'ethers';
import { ethers } from 'hardhat';

export class DelaySetup {
  public signature: Bytes = ethers.utils.toUtf8Bytes('signature');
  public delayVaultProvider!: DelayVaultProvider;
  public lockDealNFT!: LockDealNFT;
  public timedDealProvider!: TimedDealProvider;
  public lockProvider!: LockDealProvider;
  public delayVaultMigrator!: DelayVaultMigrator;
  public delayVault!: DelayVault;
  public dealProvider!: DealProvider;
  public mockProvider!: MockProvider;
  public token!: ERC20Token;
  public vaultManager!: VaultManager;
  public poolId!: BigNumber;
  public vaultId!: BigNumber;
  public receiver!: SignerWithAddress;
  public user1!: SignerWithAddress;
  public user2!: SignerWithAddress;
  public user3!: SignerWithAddress;
  public user4!: SignerWithAddress;
  public newOwner!: SignerWithAddress;
  public startTime!: number;
  public finishTime!: number;
  public providerData!: IDelayVaultProvider.ProviderDataStruct[];
  public tier1: BigNumber = ethers.BigNumber.from(250);
  public tier2: BigNumber = ethers.BigNumber.from(3500);
  public tier3: BigNumber = ethers.BigNumber.from(20000);
  public ratio: BigNumber = MAX_RATIO.div(2);

  async initialize() {
    [this.receiver, this.newOwner, this.user1, this.user2, this.user3, this.user4] = await ethers.getSigners();
    this.vaultManager = await deployed('VaultManager');
    this.lockDealNFT = await deployed('LockDealNFT', this.vaultManager.address, '');
    this.dealProvider = await deployed('DealProvider', this.lockDealNFT.address);
    this.lockProvider = await deployed('LockDealProvider', this.lockDealNFT.address, this.dealProvider.address);
    this.timedDealProvider = await deployed('TimedDealProvider', this.lockDealNFT.address, this.lockProvider.address);
    this.mockProvider = await deployed('MockProvider', this.lockDealNFT.address, this.timedDealProvider.address);
    this.delayVault = await deployed('DelayVault');
    this.token = await deployed(
      '@poolzfinance/poolz-helper-v2/contracts/token/ERC20Token.sol:ERC20Token',
      'Token',
      'TKN',
    );
    this.delayVaultMigrator = await deployed('DelayVaultMigrator', this.lockDealNFT.address, this.delayVault.address);
    const DelayVaultProvider = await ethers.getContractFactory('DelayVaultProvider');
    const ONE_DAY = 86400;
    const week = ONE_DAY * 7;
    this.startTime = week;
    this.finishTime = week * 4;
    this.providerData = [
      { provider: this.dealProvider.address, params: [], limit: this.tier1 },
      { provider: this.lockProvider.address, params: [this.startTime], limit: this.tier2 },
      { provider: this.timedDealProvider.address, params: [this.startTime, this.finishTime], limit: this.tier3 },
    ];
    this.delayVaultProvider = await DelayVaultProvider.deploy(
      this.token.address,
      this.delayVaultMigrator.address,
      this.providerData,
      {
        gasLimit: gasLimit,
      },
    );
    await this.lockDealNFT.setApprovedContract(this.dealProvider.address, true);
    await this.lockDealNFT.setApprovedContract(this.lockProvider.address, true);
    await this.lockDealNFT.setApprovedContract(this.timedDealProvider.address, true);
    await this.lockDealNFT.setApprovedContract(this.mockProvider.address, true);
    await this.lockDealNFT.setApprovedContract(this.delayVaultProvider.address, true);
    await this.token.transfer(this.receiver.address, this.tier3.mul(3));
    await this.token.transfer(this.user1.address, this.tier3.mul(3));
    await this.token.transfer(this.user2.address, this.tier3.mul(3));
    await this.token.transfer(this.user3.address, this.tier3.mul(3));
    await this.token.transfer(this.user4.address, this.tier3.mul(3));
    await this.token.transfer(this.newOwner.address, this.tier3.mul(3));
    await this.vaultManager.setTrustee(this.lockDealNFT.address);
    await this.vaultManager['createNewVault(address)'](this.token.address);
  }
}

export const delayVault = new DelaySetup();
