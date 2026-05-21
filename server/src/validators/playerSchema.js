const { z } = require('zod');

const playerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(200).default(50),
  team_id: z.coerce.number().int().positive().optional(),
  position: z.enum(['Goalkeeper', 'Defender', 'Midfielder', 'Attacker']).optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(['name_asc', 'name_desc', 'rating_desc', 'goals_desc', 'assists_desc']).default('name_asc'),
});

const playerParamsSchema = z.object({
  id: z.coerce.number().int().positive('Player ID must be a positive integer'),
});

const topPlayersQuerySchema = z.object({
  type: z.enum(['goals', 'assists', 'rating', 'cards', 'saves']).default('goals'),
  limit: z.coerce.number().int().positive().max(50).default(20),
  team_id: z.coerce.number().int().positive().optional(),
});

module.exports = { playerQuerySchema, playerParamsSchema, topPlayersQuerySchema };
