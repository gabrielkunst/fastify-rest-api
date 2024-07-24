import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  PORT: z.coerce.number().default(3333),
  DATABASE_CLIENT: z.enum(["sqlite", "pg"]),
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Environment validation errors:", _env.error.format());

  throw new Error("Environment validation errors");
}

export const env = _env.data;
