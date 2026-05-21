const path = require('path');
const { z } = require('zod');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string(),

  API_FOOTBALL_KEY: z.string().min(1, 'API_FOOTBALL_KEY is required'),
  API_FOOTBALL_BASE_URL: z.string().url().default('https://v3.football.api-sports.io'),
  API_FOOTBALL_RATE_LIMIT: z.coerce.number().min(1).max(10).default(9),

  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  SYNC_CRON_SCHEDULE: z.string().default('*/15 * * * *'),
  SYNC_ADMIN_KEY: z.string().default('admin-secret'),

  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

const result = envSchema.safeParse(process.env);
if (!result.success) {
  console.error('❌ Invalid environment variables:');
  for (const issue of result.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const env = result.data;
module.exports = { env };
