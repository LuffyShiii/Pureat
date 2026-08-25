import { prisma } from "@/lib/db/prisma";
import type { ConfidenceLevel, FoodState, NormalizedFood } from "@/types";

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "").trim();
}

export async function normalizeFoodName(
  name: string
): Promise<NormalizedFood | null> {
  const normalized = normalizeName(name);

  // 1. Exact alias match
  const exactAlias = await prisma.foodAlias.findFirst({
    where: { alias: name },
    include: { food: true },
    orderBy: { priority: "desc" },
  });

  if (exactAlias) {
    return {
      food_id: exactAlias.food.id,
      canonical_name: exactAlias.food.canonical_name,
      state: exactAlias.food.state as FoodState,
      matched_alias: exactAlias.alias,
      confidence: "high",
    };
  }

  // 2. Normalized alias match
  const aliases = await prisma.foodAlias.findMany({
    include: { food: true },
  });

  const normalizedMatch = aliases.find(
    (a) => normalizeName(a.alias) === normalized
  );

  if (normalizedMatch) {
    return {
      food_id: normalizedMatch.food.id,
      canonical_name: normalizedMatch.food.canonical_name,
      state: normalizedMatch.food.state as FoodState,
      matched_alias: normalizedMatch.alias,
      confidence: "high",
    };
  }

  // 3. Fuzzy match using pg_trgm similarity
  const fuzzyMatches = await prisma.$queryRaw`
    SELECT
      fa.id as alias_id,
      fa.alias,
      fa.food_id,
      f.canonical_name,
      f.state,
      similarity(fa.alias, ${name}) as sml
    FROM food_aliases fa
    JOIN foods f ON f.id = fa.food_id
    WHERE fa.alias % ${name}
    ORDER BY sml DESC, fa.priority DESC
    LIMIT 1
  `;

  if (Array.isArray(fuzzyMatches) && fuzzyMatches.length > 0) {
    const match = fuzzyMatches[0] as {
      food_id: string;
      canonical_name: string;
      state: string;
      alias: string;
      sml: number;
    };

    const confidence: ConfidenceLevel =
      match.sml >= 0.7 ? "high" : match.sml >= 0.5 ? "medium" : "low";

    return {
      food_id: match.food_id,
      canonical_name: match.canonical_name,
      state: match.state as FoodState,
      matched_alias: match.alias,
      confidence,
    };
  }

  return null;
}
