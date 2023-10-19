import axios from "axios";
import fs from "fs";
import AdmZip from "adm-zip";

async function downloadAndExtractZip(url: string, extractPath: string): Promise<void> {
    if (!fs.existsSync(extractPath)) {
        fs.mkdirSync(extractPath, { recursive: true });
    }

    const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
    });

    const zipPath = "./temp.zip";
    const writer = fs.createWriteStream(zipPath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on("finish", () => {
            const zip = new AdmZip(zipPath);
            // Extract the contents to the specified path
            zip.extractAllTo(extractPath, /*overwrite*/ true);

            // Get the name of the extracted folder (e.g., "LockDealNFT-master")
            const extractedFolderName = zip.getEntries()[0].entryName.split("/")[0];

            // Rename the extracted folder to remove the "master" word
            fs.renameSync(`${extractPath}${extractedFolderName}`, `${extractPath}${extractedFolderName.replace("-master", "")}`);

            fs.unlinkSync(zipPath);
            resolve();
        });
        writer.on("error", reject);
    });
}

export { downloadAndExtractZip };
