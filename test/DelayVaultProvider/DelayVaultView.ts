import { delayVault } from './setupTests';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('DelayVaultProvider view tests', async () => {
  const params = [delayVault.tier2];

  before(async () => {
    await delayVault.initialize();
  });

  beforeEach(async () => {
    delayVault.poolId = await delayVault.lockDealNFT.totalSupply();
  });

  it('should return getWithdrawableAmount from created pool', async () => {
    const owner = delayVault.newOwner;
    await delayVault.token.connect(owner).approve(delayVault.delayVaultProvider.address, delayVault.tier2);
    await delayVault.delayVaultProvider.connect(owner).createNewDelayVault(owner.address, params);
    expect(await delayVault.delayVaultProvider.getWithdrawableAmount(delayVault.poolId)).to.be.equal(delayVault.tier2);
  });

  it('should return type of tier', async () => {
    expect(await delayVault.delayVaultProvider.theTypeOf(delayVault.tier1)).to.be.equal(0);
    expect(await delayVault.delayVaultProvider.theTypeOf(delayVault.tier2)).to.be.equal(1);
    expect(await delayVault.delayVaultProvider.theTypeOf(delayVault.tier3)).to.be.equal(2);
  });

  it('should return total user amount', async () => {
    const owner = delayVault.user1;
    await delayVault.token.connect(owner).approve(delayVault.delayVaultProvider.address, delayVault.tier3);
    await delayVault.delayVaultProvider.connect(owner).createNewDelayVault(owner.address, params);
    await delayVault.delayVaultProvider.connect(owner).createNewDelayVault(owner.address, params);
    expect(await delayVault.delayVaultProvider.getTotalAmount(owner.address)).to.be.equal(delayVault.tier2.mul(2));
  });

  it('should return user nft token balance', async () => {
    const count = 10;
    const owner = delayVault.user2;
    await delayVault.token.connect(owner).approve(delayVault.delayVaultProvider.address, delayVault.tier2.mul(count));
    // create 10 NFTs
    for (let i = 0; i < count; ++i) {
      await delayVault.delayVaultProvider.connect(owner).createNewDelayVault(owner.address, params);
    }
    expect(await delayVault.delayVaultProvider.balanceOf(owner.address)).to.be.equal(count);
  });

  it("should only return DelayVault NFT's balanceOf", async () => {
    // create dealProvider
    const owner = delayVault.user3;
    const currentNonce = await delayVault.vaultManager.nonces(owner.address);
    const dataToCheck = ethers.utils.solidityPack(['address', 'uint256'], [delayVault.token.address, delayVault.tier1]);
    const hash = ethers.utils.solidityKeccak256(['bytes', 'uint'], [dataToCheck, currentNonce]);
    const signature = await owner.signMessage(ethers.utils.arrayify(hash));
    await delayVault.token.connect(owner).approve(delayVault.vaultManager.address, delayVault.tier2);
    await delayVault.dealProvider.connect(owner).createNewPool([owner.address, delayVault.token.address], [delayVault.tier1], signature);
    // create 2 delayVault NFTs
    await delayVault.token.connect(owner).approve(delayVault.delayVaultProvider.address, delayVault.tier2.mul(2));
    await delayVault.delayVaultProvider.connect(owner).createNewDelayVault(owner.address, params);
    await delayVault.delayVaultProvider.connect(owner).createNewDelayVault(owner.address, params);
    expect(await delayVault.delayVaultProvider.balanceOf(owner.address)).to.be.equal(2);
  });

  it('should return users nft poolIds by indexes', async () => {
    const poolId = (await delayVault.lockDealNFT.totalSupply()).toNumber();
    const owner = delayVault.user4;
    await delayVault.token.connect(owner).approve(delayVault.delayVaultProvider.address, delayVault.tier2.mul(5));
    // create 5 NFTs and check their poolIds by indexes
    for (let i = 0; i < 5; ++i) {
      await delayVault.delayVaultProvider.connect(owner).createNewDelayVault(owner.address, params);
      expect(await delayVault.delayVaultProvider.tokenOfOwnerByIndex(owner.address, i)).to.be.equal(poolId + i);
    }
  });

  it('should revert invalid index in the tokenOfOwnerByIndex call', async () => {
    await expect(delayVault.delayVaultProvider.tokenOfOwnerByIndex(delayVault.receiver.address, 0)).to.be.revertedWith(
      'invalid index poolId',
    );
  });
});
