const { z } = require('zod');

const FORMATIONS = ['4-3-3', '4-4-2', '3-4-3', '4-5-1', '3-5-2', '5-3-2', '4-2-3-1'];

const POSITION_SLOTS = {
  '4-3-3':  ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'AT', 'AT', 'AT'],
  '4-4-2':  ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'AT', 'AT'],
  '3-4-3':  ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'AT', 'AT', 'AT'],
  '4-5-1':  ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'AT'],
  '3-5-2':  ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'AT', 'AT'],
  '5-3-2':  ['GK', 'DF', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'AT', 'AT'],
  '4-2-3-1': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'AT', 'AT', 'AT'],
};

const PICK_SCHEMA = z.object({
  player_id: z.number().int().positive(),
  position_slot: z.number().int().min(1).max(11),
  is_captain: z.boolean().default(false),
  is_vice_captain: z.boolean().default(false),
});

const createTeamSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(30, 'Name max 30 characters'),
  formation: z.enum(FORMATIONS).default('4-3-3'),
  picks: z.array(PICK_SCHEMA).length(11, 'Exactly 11 players required'),
}).refine((data) => {
  const captains = data.picks.filter((p) => p.is_captain).length;
  const viceCaptains = data.picks.filter((p) => p.is_vice_captain).length;
  return captains === 1 && viceCaptains <= 1;
}, { message: 'Exactly 1 captain and at most 1 vice-captain required' });

const updateTeamSchema = z.object({
  name: z.string().min(3).max(30).optional(),
  formation: z.enum(FORMATIONS).optional(),
  picks: z.array(PICK_SCHEMA).length(11).optional(),
});

const rankingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
});

module.exports = { createTeamSchema, updateTeamSchema, rankingQuerySchema, POSITION_SLOTS };
