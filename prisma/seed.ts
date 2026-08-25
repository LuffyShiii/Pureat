import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import foods from "./seed-data/foods.json";
import aliases from "./seed-data/aliases.json";
import rules from "./seed-data/rules.json";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding foods...");

  for (const food of foods) {
    await prisma.food.upsert({
      where: { id: food.id },
      update: {
        ...food,
        source_date: food.source_date ? new Date(food.source_date) : null,
      },
      create: {
        ...food,
        source_date: food.source_date ? new Date(food.source_date) : null,
      },
    });
  }

  console.log(`Seeded ${foods.length} foods.`);
  console.log("Seeding aliases...");

  for (const alias of aliases) {
    const existingFood = await prisma.food.findUnique({
      where: { id: alias.food_id },
    });

    if (!existingFood) {
      console.warn(`Skipping alias for missing food: ${alias.food_id}`);
      continue;
    }

    await prisma.foodAlias.upsert({
      where: { id: `${alias.food_id}_${alias.alias}` },
      update: {
        food_id: alias.food_id,
        alias: alias.alias,
        language: alias.language,
        priority: alias.priority,
      },
      create: {
        id: `${alias.food_id}_${alias.alias}`,
        food_id: alias.food_id,
        alias: alias.alias,
        language: alias.language,
        priority: alias.priority,
      },
    });
  }

  console.log(`Seeded ${aliases.length} aliases.`);
  console.log("Seeding recommendation rules...");

  for (const rule of rules) {
    await prisma.recommendationRule.upsert({
      where: {
        id: `${rule.rule_type}_${rule.priority}_${rule.recommendation.slice(0, 20)}`,
      },
      update: {
        ...rule,
        source_date: rule.source_date ? new Date(rule.source_date) : null,
      },
      create: {
        id: `${rule.rule_type}_${rule.priority}_${rule.recommendation.slice(0, 20)}`,
        ...rule,
        source_date: rule.source_date ? new Date(rule.source_date) : null,
      },
    });
  }

  console.log(`Seeded ${rules.length} rules.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
