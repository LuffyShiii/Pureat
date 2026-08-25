const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const svg = fs.readFileSync(
  path.join(__dirname, "../public/icons/icon.svg")
);

async function generate() {
  for (const size of [192, 512]) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, `../public/icons/icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }
}

generate().catch(console.error);
