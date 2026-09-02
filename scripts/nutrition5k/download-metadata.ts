/**
 * Download Nutrition5k dish metadata CSVs.
 *
 * Only downloads the small metadata files (~2.3 MB total), not the 181 GB
 * imagery tarball.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DOWNLOAD_DIR = path.resolve(import.meta.dirname, "downloads");

const FILES = [
  {
    name: "dish_metadata_cafe1.csv",
    url: "https://storage.googleapis.com/download/storage/v1/b/nutrition5k_dataset/o/nutrition5k_dataset%2Fmetadata%2Fdish_metadata_cafe1.csv?alt=media",
  },
  {
    name: "dish_metadata_cafe2.csv",
    url: "https://storage.googleapis.com/download/storage/v1/b/nutrition5k_dataset/o/nutrition5k_dataset%2Fmetadata%2Fdish_metadata_cafe2.csv?alt=media",
  },
];

function hasCommand(cmd: string): boolean {
  try {
    execSync(`command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function downloadWithCurl(url: string, dest: string): void {
  execSync(`curl -fsSL -o "${dest}" "${url}"`, { stdio: "inherit" });
}

function downloadWithWget(url: string, dest: string): void {
  execSync(`wget -q -O "${dest}" "${url}"`, { stdio: "inherit" });
}

export function getDownloadDir(): string {
  return DOWNLOAD_DIR;
}

export async function downloadMetadata(
  options: { force?: boolean } = {}
): Promise<string[]> {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

  const downloaded: string[] = [];
  const curlAvailable = hasCommand("curl");
  const wgetAvailable = hasCommand("wget");

  if (!curlAvailable && !wgetAvailable) {
    throw new Error(
      "Neither curl nor wget is available. Please install one of them to download Nutrition5k metadata."
    );
  }

  for (const file of FILES) {
    const dest = path.join(DOWNLOAD_DIR, file.name);

    if (fs.existsSync(dest) && !options.force) {
      console.log(`Already exists (skip): ${dest}`);
      downloaded.push(dest);
      continue;
    }

    console.log(`Downloading ${file.name}...`);
    try {
      if (curlAvailable) {
        downloadWithCurl(file.url, dest);
      } else {
        downloadWithWget(file.url, dest);
      }
    } catch (error) {
      throw new Error(
        `Failed to download ${file.name} from ${file.url}: ${error}`
      );
    }

    const stats = fs.statSync(dest);
    console.log(`Saved ${file.name} (${stats.size} bytes)`);
    downloaded.push(dest);
  }

  return downloaded;
}

async function main() {
  const force = process.argv.includes("--force");
  const paths = await downloadMetadata({ force });
  console.log("\nDownloaded files:");
  for (const p of paths) {
    console.log(`  ${p}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
