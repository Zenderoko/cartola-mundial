const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { clerkMiddleware } = require('@clerk/express');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { logger } = require('./utils/logger');

const routes = require('./routes');

const app = express();

app.use('/api/football-proxy', createProxyMiddleware({
  target: 'https://v3.football.api-sports.io',
  changeOrigin: true,
  pathRewrite: { '^/api/football-proxy': '' },
  on: {
    proxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('x-rapidapi-key', process.env.API_FOOTBALL_KEY || process.env.API_FOOTBALL_WIDGET_KEY);
      proxyReq.setHeader('x-rapidapi-host', 'v3.football.api-sports.io');
    },
  },
}));

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(generalLimiter);
app.use(requestLogger);
app.use(clerkMiddleware({ secretKey: process.env.CLERK_SECRET_KEY }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
});

app.use(errorHandler);

module.exports = app;
