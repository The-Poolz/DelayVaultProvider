const fs = require('fs');

// Read the gas-report.txt file
fs.readFile('gas-report.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  // Initialize the Markdown content with the header
  let mdContent = '# Gas Test Report 📊\nThe gas test results are as follows:\n';
  let description =
    '\n| Contract | Method | Min | Max | Avg | # calls |\n|----------|--------|-----|-----|-----|---------|\n';

  let mdProvider = '## DelayVaultProvider' + description;
  let mdMigrator = '## DelayVaultMigrator' + description;
  let oldDelayVault = '## Old DelayVault' + description;

  // Add the Deployments table header
  let mdDeployments =
    '## Deployments\n| Contract | Min | Max | Avg | % of limit |\n|----------|-----|-----|-----|------------|\n';

  // Split the file into lines
  const lines = data.split('\n');

  // Flag to indicate if we are in the Deployments section
  let inDeploymentsSection = false;

  // Loop through each line to parse it
  lines.forEach(line => {
    if (line.includes('Deployments')) {
      inDeploymentsSection = true;
    }

    if (!inDeploymentsSection) {
      const match = line.match(
        /(\w+)\s+·\s+(.+?)\s+·\s+(\d+|-)\s+·\s+(\d+|-)\s+·\s+(\d+|-)\s+·\s+(\d+|-)\s+·\s+(-|\d+)/,
      );
      if (match) {
        const [, contract, method, min, max, avg, calls] = match;
        if (contract.includes('DelayVaultProvider')) {
          mdProvider += `| ${contract} | ${method} | ${min} | ${max} | ${avg} | ${calls} |\n`;
        } else if (contract.includes('DelayVaultMigrator')) {
          mdMigrator += `| ${contract} | ${method} | ${min} | ${max} | ${avg} | ${calls} |\n`;
        } else if (
          contract.includes('DelayVault') &&
          method == 'CreateVault(address,uint256,uint256,uint256,uint256)'
        ) {
          oldDelayVault += `| ${contract} | ${method} | ${min} | ${max} | ${avg} | ${calls} |\n`;
        } else if (contract.includes('DelayVault') && method == 'Withdraw(address)') {
          oldDelayVault += `| ${contract + " + DelayVaultMigrator"} | ${method} | ${min} | ${max} | ${avg} | ${calls} |\n`;
        }
      }
    } else {
      const match = line.match(/(\w+)\s+·\s+(\d+|-)\s+·\s+(\d+|-)\s+·\s+(\d+|-)\s+·\s+(\d+\.\s?\d+\s%)\s+·\s+(-|\d+)/);
      if (match) {
        const [, contract, min, max, avg, limit, usd] = match;
        if (contract.includes('DelayVaultProvider') || contract.includes('DelayVaultMigrator')) {
          mdDeployments += `| ${contract} | ${min} | ${max} | ${avg} | ${limit} | ${usd} |\n`;
        }
      }
    }
  });

  // Combine the parsed content
  mdContent += mdProvider += oldDelayVault += mdMigrator += mdDeployments;

  // Write to md_gas_report.txt
  fs.writeFile('md_gas_report.txt', mdContent, err => {
    if (err) {
      console.error('Error writing the file:', err);
    }
  });
});
