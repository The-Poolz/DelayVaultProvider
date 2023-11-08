import "@nomicfoundation/hardhat-toolbox"
import "@truffle/dashboard-hardhat-plugin"
import "hardhat-gas-reporter"
import { HardhatUserConfig } from "hardhat/config"
import "solidity-coverage"

const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    solidity: {
      version: '0.8.19',
      settings: {
        evmVersion: 'istanbul',
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
}

export default config
