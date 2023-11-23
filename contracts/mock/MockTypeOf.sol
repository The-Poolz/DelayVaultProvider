// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../LockDealNFT/contracts/interfaces/IProvider.sol";
import "hardhat/console.sol"; // look for gas measurement

contract MockTypeOf {
    // A UINT8 is an 8-bit unsigned integer (range: 0 through 255 decimal).
    uint8 public typesCount;
    mapping(uint8 => ProviderData) public typeToProviderData; // Provider data for each tier type; indexed by type

    struct ProviderData {
        IProvider provider;
        uint256[] params;
        uint256 limit;
    }

    // classic linear search
    function theTypeOf(uint256 amount) public view returns (uint8 theType) {
        uint256 gasBefore = gasleft();
        for (uint8 i = 0; i < typesCount; ++i) {
            if (amount <= typeToProviderData[i].limit) {
                theType = i;
                console.log(gasBefore - gasleft());
                break;
            }
        }
    }

    // binary search
    function binaryTypeOf(uint256 amount) public view returns (uint8 theType) {
        uint256 gasBefore = gasleft();
        uint8 low = 0;
        uint8 high = typesCount;
        while (low < high) {
            uint8 mid = low + (high - low) / 2;
            uint256 midLimit = typeToProviderData[mid].limit;
            if (amount <= midLimit) {
                high = mid;
                theType = mid; // Set the result, but continue the search in case there is a smaller match
            } else {
                low = mid + 1;
            }
        }
        console.log(gasBefore - gasleft());
    }

    function setTypeToProviderData(uint8 theType, ProviderData memory providerData) public {
        typeToProviderData[theType] = providerData;
        if (typesCount < 255) ++typesCount;
    }
}
