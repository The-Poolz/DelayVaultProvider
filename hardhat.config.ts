import "@nomicfoundation/hardhat-toolbox"
import "@truffle/dashboard-hardhat-plugin"
import "hardhat-gas-reporter"
import { HardhatUserConfig } from "hardhat/config"
import "solidity-coverage"
import "hardhat-preprocessor";
import * as fs from 'fs';

function getRemappings() {
    return fs
      .readFileSync("remappings.txt", "utf8")
      .split("\n")
      .filter(Boolean) // remove empty lines
      .map((line) => line.trim().split("="));
  }

const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    solidity: {
        compilers: [
            {
                version: "0.8.0",
            },
            {
                version: "0.8.19",
            },
        ],
        settings: {
            evmVersion: "istanbul",
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true,
            blockGasLimit: 130_000_000,
        },
    },
    gasReporter: {
        enabled: true,
        showTimeSpent: true,
        showMethodSig: true,
        currency: "USD",
        token: "BNB",
        gasPriceApi:
            "https://api.bscscan.com/api?module=proxy&action=eth_gasPrice&apikey=" + process.env.BSCSCAN_API_KEY,
        coinmarketcap: process.env.CMC_API_KEY || "",
        noColors: true,
        outputFile: "gas-report.txt",
    },
    preprocess: {
        eachLine: (hre) => ({
          transform: (line: string) => {
            if (line.match(/^\s*import /i)) {
              for (const [from, to] of getRemappings()) {
                if (line.includes(from)) {
                  line = line.replace(from, to);
                  break;
                }
              }
            }
            return line;
          },
        }),
      },
}

export default config
