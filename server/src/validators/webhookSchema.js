const { z } = require('zod');

const clerkWebhookSchema = z.object({
  type: z.enum(['user.created', 'user.updated', 'user.deleted', 'session.created']),
  data: z.object({
    id: z.string(),
    email_addresses: z.array(z.object({ email_address: z.string() })).optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    image_url: z.string().optional(),
    user_id: z.string().optional(),
  }),
});

module.exports = { clerkWebhookSchema };
