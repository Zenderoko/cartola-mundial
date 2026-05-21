const axios = require('axios');
const { env } = require('./env');

const apiClient = axios.create({
  baseURL: env.API_FOOTBALL_BASE_URL,
  headers: {
    'x-rapidapi-key': env.API_FOOTBALL_KEY,
    'x-rapidapi-host': 'v3.football.api-sports.io',
  },
  timeout: 15000,
});

module.exports = { apiClient };
