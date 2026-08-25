import "dotenv/config";
import { validateEnv } from "@/lib/env";

function main() {
  const { valid, missing } = validateEnv();

  if (!valid) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`  - ${key}`));
    process.exit(1);
  }

  console.log("✅ Environment variables are configured");
  console.log(`🤖 OpenAI: ${process.env.OPENAI_API_KEY?.startsWith("sk-") ? "configured" : "mock mode"}`);
  process.exit(0);
}

main();
