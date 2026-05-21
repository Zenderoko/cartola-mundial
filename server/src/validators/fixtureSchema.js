const { z } = require('zod');

const fixtureQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  team_id: z.coerce.number().int().positive().optional(),
  round: z.string().optional(),
  status: z.enum(['scheduled', 'live', 'match finished', 'cancelled', 'postponed', 'time-to-be-defined']).optional(),
  stage: z.string().optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(['date_asc', 'date_desc', 'round_asc', 'round_desc']).default('date_asc'),
});

const fixtureParamsSchema = z.object({
  id: z.coerce.number().int().positive('Fixture ID must be a positive integer'),
});

module.exports = { fixtureQuerySchema, fixtureParamsSchema };
