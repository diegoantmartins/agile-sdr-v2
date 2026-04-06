import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3030),
  DATABASE_URL: z.string(),
  
  // Uazapi (WhatsApp) - optional for local dev
  UAZAPI_URL: z.string().default('http://localhost:9999'),
  UAZAPI_KEY: z.string().default('dev-placeholder'),
  UAZAPI_WEBHOOK_SECRET: z.string().optional(),
  
  // Chatwoot (Handoff)
  CHATWOOT_URL: z.string().optional(),
  CHATWOOT_API_TOKEN: z.string().optional(),
  CHATWOOT_ACCOUNT_ID: z.string().optional(),
  CHATWOOT_WEBHOOK_SECRET: z.string().optional(),
  
  // Intelligence
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  
  // Redis (Jobs)
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // Business Rules
  FOLLOW_UP_COOLDOWN_DAYS: z.coerce.number().default(7),
  MAX_DAILY_SENDS: z.coerce.number().default(50),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Integrations (all optional)
  INTEGRATION_ALLOWED_HOSTS: z.string().optional(),
  CALCOM_API_KEY: z.string().optional(),
  CALCOM_API_URL: z.string().optional(),
  GOOGLE_CALENDAR_API_URL: z.string().optional(),
  GOOGLE_CALENDAR_TOKEN: z.string().optional(),
  GOOGLE_SHEETS_API_URL: z.string().optional(),
  GOOGLE_SHEETS_TOKEN: z.string().optional(),
  RD_STATION_API_URL: z.string().optional(),
  RD_STATION_TOKEN: z.string().optional(),
  META_API_URL: z.string().optional(),
  META_API_TOKEN: z.string().optional(),

  // Admin Console
  ADMIN_CONFIG_TOKEN: z.string().optional(),
  INTEGRATION_KEY: z.string().optional(),
  ENABLE_TEST_ENDPOINTS: z.coerce.boolean().default(false),

  // Agent Persona / Config
  AGENT_CONFIG_PATH: z.string().default('./data/agent-config.json'),
  AGENT_COMPANY_NAME: z.string().default('Sua Empresa'),
  AGENT_OBJECTIVE: z.string().default('Qualificar leads e avançar para reunião ou proposta.'),
  AGENT_TONE: z.string().default('consultivo e cordial'),
  AGENT_LANGUAGE: z.string().default('português do Brasil'),
  AGENT_MAX_REPLY_CHARS: z.coerce.number().default(420),
});

export const env = envSchema.parse(process.env);
export const config = env; // alias for files that import { config }
export type Env = z.infer<typeof envSchema>;