import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  port: Number(process.env.PORT ?? 4100),
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  /**
   * Visibility gates are off: every institution row is public.
   * Kept so existing call sites compile; do not re-enable publish/active filters
   * without an explicit product decision.
   */
  relaxPublicGates: true,
};
