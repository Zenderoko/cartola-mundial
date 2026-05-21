const { z } = require('zod');

const teamQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(48).default(48),
  group: z.string().optional(),
  search: z.string().max(100).optional(),
});

const teamParamsSchema = z.object({
  id: z.coerce.number().int().positive('Team ID must be a positive integer'),
});

module.exports = { teamQuerySchema, teamParamsSchema };
