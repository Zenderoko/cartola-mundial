const { createClerkClient } = require('@clerk/express');

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  apiUrl: 'https://api.clerk.com',
  jwtKey: process.env.CLERK_JWT_KEY,
});

module.exports = { clerkClient };
