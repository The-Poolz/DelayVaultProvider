import { downloadAndExtractZip } from '../TestSetup';
import fs from 'fs';
import path from 'path';

async function downloadAndExtractZipAll() {
  try {
    await downloadAndExtractZip('https://github.com/The-Poolz/LockDealNFT/archive/refs/heads/ironblocks.zip', 'contracts/');
    await downloadAndExtractZip('https://github.com/The-Poolz/DelayVault/archive/refs/heads/master.zip', 'contracts/');
    await downloadAndExtractZip(
      'https://github.com/The-Poolz/VaultManager/archive/refs/heads/ironblocks.zip',
      'contracts/',
    );
    cleanUpFolders('contracts/DelayVault');
    cleanUpFolders('contracts/LockDealNFT');
    cleanUpFolders('contracts/VaultManager');
  } catch (error) {
    console.error('An error occurred during download and compile:', error);
  }
}

function cleanUpFolders(parentDir: string) {
  // Get a list of all files and subfolders in the parent directory
  const items = fs.readdirSync(parentDir);

  for (const item of items) {
    const itemPath = path.join(parentDir, item);

    // Check if it's a directory
    if (fs.lstatSync(itemPath).isDirectory()) {
      // If it's not named "contracts," delete it
      if (item !== 'contracts') {
        removeFolderRecursively(itemPath);
      }
    } else {
      // It's a file, so delete it
      fs.unlinkSync(itemPath);
    }
  }
}

function removeFolderRecursively(folderPath: string) {
  // Recursively delete the folder and its contents
  const items = fs.readdirSync(folderPath);

  for (const item of items) {
    const itemPath = path.join(folderPath, item);

    if (fs.lstatSync(itemPath).isDirectory()) {
      removeFolderRecursively(itemPath);
    } else {
      fs.unlinkSync(itemPath);
    }
  }

  // After all contents are deleted, remove the folder itself
  fs.rmdirSync(folderPath);
}

downloadAndExtractZipAll();
