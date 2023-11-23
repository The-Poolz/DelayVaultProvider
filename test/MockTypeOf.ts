// Import necessary modules and types
import { MockTypeOf } from '../typechain-types/contracts/mock/MockTypeOf';
import { ethers } from 'hardhat';

describe('Mock TheTypeOf gas tests', function () {
  let theTypeOfContract: MockTypeOf;
  // mock data
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const params = [1, 2, 3];
  let limit = 100;

  beforeEach(async () => {
    const TheTypeOf = await ethers.getContractFactory('MockTypeOf');
    theTypeOfContract = await TheTypeOf.deploy();
    await theTypeOfContract.deployed();
    limit = 100;
  });

  it('gas cost for theTypeOf to find last index', async () => {
    const maxTier = 15;
    console.log('Gas usage per iteration to find last index for theTypeOf:');
    for (let i = 0; i <= maxTier; i++) {
      limit += 100;
      const providerData = {
        provider: ZERO_ADDRESS,
        params: params,
        limit: limit,
      };
      await theTypeOfContract.setTypeToProviderData(i, providerData);

      await theTypeOfContract.theTypeOf(limit);
      console.log(`Tier ${i} theTypeOf: `);
    }
  });

  it('gas cost binaryTypeOf to find last index', async () => {
    const maxTier = 15;
    console.log('\nGas usage per iteration to find last index for binaryTypeOf:');
    for (let i = 0; i <= maxTier; i++) {
      limit += 100;
      const providerData = {
        provider: ZERO_ADDRESS,
        params: params,
        limit: limit,
      };
      await theTypeOfContract.setTypeToProviderData(i, providerData);
      await theTypeOfContract.binaryTypeOf(limit);
      console.log(`Tier ${i} binaryTypeOf: `);
    }
  });

  it('gas cost binaryTypeOf to find first index in 15 tiers', async () => {
    const maxTier = 15;
    const find = 100;
    for (let i = 0; i < maxTier; i++) {
      limit += 100;
      const providerData = {
        provider: ZERO_ADDRESS,
        params: params,
        limit: limit,
      };
      await theTypeOfContract.setTypeToProviderData(i, providerData);
    }
    console.log(`Tier ${maxTier} binaryTypeOf: `);
    await theTypeOfContract.binaryTypeOf(find);
  });

  it('gas cost binaryTypeOf to find first index in 4 tiers', async () => {
    const maxTier = 4;
    const find = 100;
    for (let i = 0; i < maxTier; i++) {
      limit += 100;
      const providerData = {
        provider: ZERO_ADDRESS,
        params: params,
        limit: limit,
      };
      await theTypeOfContract.setTypeToProviderData(i, providerData);
    }
    console.log(`Tier ${maxTier} binaryTypeOf: `);
    await theTypeOfContract.binaryTypeOf(find);
  });

  it('gas cost binaryTypeOf to find first index in 3 tiers', async () => {
    const maxTier = 3;
    const find = 100;
    for (let i = 0; i < maxTier; i++) {
      limit += 100;
      const providerData = {
        provider: ZERO_ADDRESS,
        params: params,
        limit: limit,
      };
      await theTypeOfContract.setTypeToProviderData(i, providerData);
    }
    console.log(`Tier ${maxTier} binaryTypeOf: `);
    await theTypeOfContract.binaryTypeOf(find);
  });
});
