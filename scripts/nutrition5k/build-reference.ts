/**
 * Build a lightweight Nutrition5k weight reference from dish metadata CSVs.
 *
 * Usage:
 *   npm run nutrition5k:build          # use already-downloaded CSVs
 *   npm run nutrition5k:sync           # download then build
 *   tsx scripts/nutrition5k/build-reference.ts --download --iqr
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { downloadMetadata, getDownloadDir } from "./download-metadata";
import {
  Category,
  CATEGORIES,
  mapIngredientToCategory,
} from "./category-map";
import { aggregateAllCategories } from "./aggregate";
import {
  FALLBACK_NUTRITION5K_REFERENCES,
} from "../../src/lib/nutrition5k/fallback-reference";
import { WeightReference } from "../../src/lib/nutrition5k/reference";

const OUTPUT_PATH = path.resolve(
  import.meta.dirname,
  "../../src/lib/nutrition5k/generated-reference.json"
);

const INGREDIENT_BLOCK_COLUMNS = 7;
const INGREDIENT_NAME_INDEX = 1;
const INGREDIENT_GRAMS_INDEX = 2;

interface ParseResult {
  categoryGrams: Record<Category, number[]>;
  unmappedCounts: Record<string, number>;
  excludedCounts: Record<string, number>;
  totalIngredients: number;
}

function parseDishMetadataFile(filePath: string): ParseResult {
  const content = fs.readFileSync(filePath, "utf-8");
  const rows = parse(content, {
    columns: false,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  }) as string[][];

  const categoryGrams = Object.fromEntries(
    CATEGORIES.map((c) => [c, [] as number[]])
  ) as Record<Category, number[]>;

  const unmappedCounts: Record<string, number> = {};
  const excludedCounts: Record<string, number> = {};
  let totalIngredients = 0;

  for (const row of rows) {
    if (row.length < 6 + INGREDIENT_BLOCK_COLUMNS) continue;

    const ingredientColumns = row.slice(6);
    const blockCount = Math.floor(
      ingredientColumns.length / INGREDIENT_BLOCK_COLUMNS
    );

    for (let i = 0; i < blockCount; i++) {
      const offset = i * INGREDIENT_BLOCK_COLUMNS;
      const name = ingredientColumns[offset + INGREDIENT_NAME_INDEX];
      const gramsRaw = ingredientColumns[offset + INGREDIENT_GRAMS_INDEX];

      if (!name || !gramsRaw) continue;

      const grams = parseFloat(gramsRaw);
      if (!Number.isFinite(grams) || grams <= 0 || grams > 5000) continue;

      totalIngredients++;
      const category = mapIngredientToCategory(name);

      if (category === "excluded") {
        excludedCounts[name] = (excludedCounts[name] || 0) + 1;
        continue;
      }

      if (!category) {
        unmappedCounts[name] = (unmappedCounts[name] || 0) + 1;
        continue;
      }

      categoryGrams[category].push(grams);
    }
  }

  return { categoryGrams, unmappedCounts, excludedCounts, totalIngredients };
}

function mergeParseResults(results: ParseResult[]): ParseResult {
  const categoryGrams = Object.fromEntries(
    CATEGORIES.map((c) => [c, [] as number[]])
  ) as Record<Category, number[]>;
  const unmappedCounts: Record<string, number> = {};
  const excludedCounts: Record<string, number> = {};
  let totalIngredients = 0;

  for (const result of results) {
    for (const category of CATEGORIES) {
      categoryGrams[category].push(...result.categoryGrams[category]);
    }
    for (const [name, count] of Object.entries(result.unmappedCounts)) {
      unmappedCounts[name] = (unmappedCounts[name] || 0) + count;
    }
    for (const [name, count] of Object.entries(result.excludedCounts)) {
      excludedCounts[name] = (excludedCounts[name] || 0) + count;
    }
    totalIngredients += result.totalIngredients;
  }

  return { categoryGrams, unmappedCounts, excludedCounts, totalIngredients };
}

function buildReference(
  categoryGrams: Record<Category, number[]>,
  enableIqrFilter: boolean
): Record<string, WeightReference> {
  const aggregated = aggregateAllCategories(categoryGrams, {
    enableIqrFilter,
  });

  const references: Record<string, WeightReference> = {};

  for (const category of CATEGORIES) {
    const agg = aggregated[category];
    if (agg) {
      references[category] = agg;
    } else {
      console.warn(
        `${category}: using fallback reference because real data is insufficient`
      );
      references[category] = FALLBACK_NUTRITION5K_REFERENCES[category];
    }
  }

  return references;
}

function logTop(
  label: string,
  counts: Record<string, number>,
  limit = 20
): void {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    console.log(`  none`);
    return;
  }
  for (const [name, count] of sorted.slice(0, limit)) {
    console.log(`  ${name}: ${count}`);
  }
  if (sorted.length > limit) {
    console.log(`  ... and ${sorted.length - limit} more`);
  }
}

async function main() {
  const shouldDownload = process.argv.includes("--download");
  const enableIqrFilter = !process.argv.includes("--no-iqr");

  if (shouldDownload) {
    await downloadMetadata();
  }

  const downloadDir = getDownloadDir();
  const files = ["dish_metadata_cafe1.csv", "dish_metadata_cafe2.csv"].map(
    (name) => path.join(downloadDir, name)
  );

  const missing = files.filter((f) => !fs.existsSync(f));
  if (missing.length > 0) {
    console.error("Missing metadata files:");
    for (const f of missing) {
      console.error(`  ${f}`);
    }
    console.error("Run with --download or run npm run nutrition5k:download");
    process.exit(1);
  }

  console.log("Parsing Nutrition5k dish metadata...");
  const parseResults = files.map(parseDishMetadataFile);
  const merged = mergeParseResults(parseResults);

  console.log(`\nTotal mapped ingredient instances: ${merged.totalIngredients}`);
  console.log("\nSamples per category:");
  for (const category of CATEGORIES) {
    console.log(`  ${category}: ${merged.categoryGrams[category].length}`);
  }

  console.log("\nExcluded ingredients (top):");
  logTop("excluded", merged.excludedCounts);

  console.log("\nUnmapped ingredients (top):");
  logTop("unmapped", merged.unmappedCounts);

  console.log("\nBuilding reference...");
  const references = buildReference(merged.categoryGrams, enableIqrFilter);

  const output = {
    version: "1.0.0",
    generated_at: new Date().toISOString(),
    source:
      "Nutrition5k dataset (dish_metadata_cafe1.csv + dish_metadata_cafe2.csv)",
    references,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log(`\nWrote ${OUTPUT_PATH}`);
  console.log(
    `Categories with real data: ${
      CATEGORIES.filter((c) => references[c] !== FALLBACK_NUTRITION5K_REFERENCES[c])
        .length
    } / ${CATEGORIES.length}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
