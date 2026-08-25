export function validateEnv(): { valid: boolean; missing: string[] } {
  const required = ["DATABASE_URL"];
  const missing = required.filter((key) => !process.env[key]);

  return {
    valid: missing.length === 0,
    missing,
  };
}

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-");
}
