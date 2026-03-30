import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  
  // Uazapi (WhatsApp) - optional for local dev
  UAZAPI_URL: z.string().default('http://localhost:9999'),
  UAZAPI_KEY: z.string().default('dev-placeholder'),
  
  // Chatwoot (Handoff)
  CHATWOOT_URL: z.string().optional(),
  CHATWOOT_API_TOKEN: z.string().optional(),
  CHATWOOT_ACCOUNT_ID: z.string().optional(),
  
  // Intelligence
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  
  // Redis (Jobs)
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // Business Rules
  FOLLOW_UP_COOLDOWN_DAYS: z.coerce.number().default(7),
  MAX_DAILY_SENDS: z.coerce.number().default(50),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
