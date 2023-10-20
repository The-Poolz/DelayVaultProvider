import { token } from '../helper';
import { delayVault } from './setupTests';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

describe('delayVault withdraw', async () => {
  before(async () => {
    await delayVault.initialize();
  });

  beforeEach(async () => {
    delayVault.poolId = await delayVault.lockDealNFT.totalSupply();
  });

  async function withdraw(user: SignerWithAddress, params: BigNumber[]) {
    await delayVault.token.connect(user).approve(delayVault.delayVaultProvider.address, params[0]);
    await delayVault.delayVaultProvider.connect(user).createNewDelayVault(user.address, params);
    await delayVault.lockDealNFT
      .connect(user)
      ['safeTransferFrom(address,address,uint256)'](user.address, delayVault.lockDealNFT.address, delayVault.poolId);
  }

  it('should withdraw from delayVault with tier 1', async () => {
    await withdraw(delayVault.user3, [delayVault.tier1]);
    const newAmount = await delayVault.delayVaultProvider.userToAmount(delayVault.user3.address);
    const type = await delayVault.delayVaultProvider.userToType(delayVault.user3.address);
    expect(newAmount).to.equal(0);
    expect(type).to.equal(0);
  });

  it('should withdraw from delayVault with tier 2', async () => {
    await withdraw(delayVault.user3, [delayVault.tier2]);
    const newAmount = await delayVault.delayVaultProvider.userToAmount(delayVault.user3.address);
    const type = await delayVault.delayVaultProvider.userToType(delayVault.user3.address);
    expect(newAmount).to.equal(0);
    expect(type).to.equal(0);
  });

  it('should withdraw from delayVault with tier 3', async () => {
    await withdraw(delayVault.user3, [delayVault.tier3]);
    const newAmount = await delayVault.delayVaultProvider.userToAmount(delayVault.user3.address);
    const type = await delayVault.delayVaultProvider.userToType(delayVault.user3.address);
    expect(newAmount).to.equal(0);
    expect(type).to.equal(0);
  });

  it('should create new deal provider nft after withdraw with first tier', async () => {
    await withdraw(delayVault.user3, [delayVault.tier1]);
    delayVault.vaultId = await delayVault.vaultManager.vaultIdToVault(delayVault.poolId.add(1));
    const simpleNFTdata = await delayVault.lockDealNFT.getData(delayVault.poolId.add(1));
    expect(simpleNFTdata.provider).to.equal(delayVault.dealProvider.address);
    expect(simpleNFTdata.owner).to.equal(delayVault.user3.address);
    expect(simpleNFTdata.token).to.equal(delayVault.token.address);
    expect(simpleNFTdata.vaultId).to.equal(delayVault.vaultId);
    expect(simpleNFTdata.params).to.deep.equal([delayVault.tier1]);
  });

  it('should create new lock provider nft after withdraw with second tier', async () => {
    await withdraw(delayVault.user3, [delayVault.tier2]);
    const time = await ethers.provider.getBlock('latest').then(block => block.timestamp);
    delayVault.vaultId = await delayVault.vaultManager.vaultIdToVault(delayVault.poolId.add(1));
    const simpleNFTdata = await delayVault.lockDealNFT.getData(delayVault.poolId.add(1));
    expect(simpleNFTdata.provider).to.equal(delayVault.lockProvider.address);
    expect(simpleNFTdata.owner).to.equal(delayVault.user3.address);
    expect(simpleNFTdata.token).to.equal(delayVault.token.address);
    expect(simpleNFTdata.vaultId).to.equal(delayVault.vaultId);
    expect(simpleNFTdata.params).to.deep.equal([delayVault.tier2, time + delayVault.startTime]);
  });

  it('should create new timed provider nft after withdraw with third tier', async () => {
    await withdraw(delayVault.user3, [delayVault.tier3]);
    const time = await ethers.provider.getBlock('latest').then(block => block.timestamp);
    delayVault.vaultId = await delayVault.vaultManager.vaultIdToVault(delayVault.poolId.add(1));
    const simpleNFTdata = await delayVault.lockDealNFT.getData(delayVault.poolId.add(1));
    expect(simpleNFTdata.provider).to.equal(delayVault.timedDealProvider.address);
    expect(simpleNFTdata.owner).to.equal(delayVault.user3.address);
    expect(simpleNFTdata.token).to.equal(delayVault.token.address);
    expect(simpleNFTdata.vaultId).to.equal(delayVault.vaultId);
    expect(simpleNFTdata.params).to.deep.equal([
      delayVault.tier3,
      time + delayVault.startTime,
      time + delayVault.finishTime,
      delayVault.tier3,
    ]);
  });

  it("can't deacrease tier level after user withdraw half amount", async () => {
    const params = [delayVault.tier1];
    const user = delayVault.user3;
    await delayVault.token.connect(user).approve(delayVault.delayVaultProvider.address, delayVault.tier2);
    await delayVault.delayVaultProvider.connect(user).createNewDelayVault(user.address, params);
    await delayVault.delayVaultProvider.connect(user).createNewDelayVault(user.address, params);
    expect(await delayVault.delayVaultProvider.userToType(user.address)).to.equal(1);
    await delayVault.lockDealNFT
      .connect(user)
      ['safeTransferFrom(address,address,uint256)'](user.address, delayVault.lockDealNFT.address, delayVault.poolId);
    expect(await delayVault.delayVaultProvider.userToType(user.address)).to.equal(1);
  });
});
