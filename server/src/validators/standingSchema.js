const { z } = require('zod');

const standingQuerySchema = z.object({
  group: z.string().optional(),
});

module.exports = { standingQuerySchema };
