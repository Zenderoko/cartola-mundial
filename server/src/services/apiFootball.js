const { apiClient } = require('../config/apiFootball');
const { limiter } = require('./rateLimiter');
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

const LEAGUE_ID = 1;
const SEASON = 2022;
const MAX_RETRIES = 2;

class FootballApiService {
  constructor() {
    this.budgetWarningSent = false;
  }

  async _request(endpoint, params = {}) {
    return limiter.schedule(async () => {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const response = await apiClient.get(endpoint, { params });
          const remaining = parseInt(response.headers['x-ratelimit-requests-remaining']) || 0;

          await this._logRequest(endpoint, params, response.status);

          if (remaining <= 20 && !this.budgetWarningSent) {
            logger.warn({ remaining, endpoint }, 'API-Football budget low');
            this.budgetWarningSent = true;
          }
          if (remaining > 20) this.budgetWarningSent = false;

          return { data: response.data, remaining };
        } catch (err) {
          if (err.response?.status === 429) {
            logger.warn('Rate limited by API-Football, waiting 60s...');
            await new Promise((r) => setTimeout(r, 60000));
            continue;
          }
          if (attempt < MAX_RETRIES) {
            const wait = 2000 * (attempt + 1);
            logger.warn({ err: err.message, endpoint, attempt, wait }, 'Retrying request');
            await new Promise((r) => setTimeout(r, wait));
            continue;
          }
          throw err;
        }
      }
    });
  }

  async _logRequest(endpoint, params, statusCode) {
    try {
      await pool.query(
        `INSERT INTO request_log (endpoint, params, status, date)
         VALUES ($1, $2, $3, CURRENT_DATE)`,
        [endpoint, JSON.stringify(params), statusCode]
      );
    } catch (err) {
      logger.error({ err }, 'Failed to log API request');
    }
  }

  async getFixtures(params = {}) {
    return this._request('/fixtures', { league: LEAGUE_ID, season: SEASON, ...params });
  }

  async getFixtureById(id) {
    return this._request('/fixtures', { id });
  }

  async getFixturesByDate(date) {
    return this._request('/fixtures', { league: LEAGUE_ID, season: SEASON, date });
  }

  async getFixturesByRound(round) {
    return this._request('/fixtures', { league: LEAGUE_ID, season: SEASON, round });
  }

  async getRounds() {
    return this._request('/fixtures/rounds', { league: LEAGUE_ID, season: SEASON });
  }

  async getFixtureStatistics(fixtureId) {
    return this._request('/fixtures/statistics', { fixture: fixtureId });
  }

  async getFixturePlayerStats(fixtureId) {
    return this._request('/fixtures/players', { fixture: fixtureId });
  }

  async getFixtureEvents(fixtureId) {
    return this._request('/fixtures/events', { fixture: fixtureId });
  }

  async getTeams() {
    return this._request('/teams', { league: LEAGUE_ID, season: SEASON });
  }

  async getTeamById(id) {
    return this._request('/teams', { id });
  }

  async getSquadByTeam(teamId) {
    return this._request('/players/squads', { team: teamId });
  }

  async getStandings() {
    return this._request('/standings', { league: LEAGUE_ID, season: SEASON });
  }

  async getTopScorers() {
    return this._request('/players/topscorers', { league: LEAGUE_ID, season: SEASON });
  }

  async getTopAssists() {
    return this._request('/players/topassists', { league: LEAGUE_ID, season: SEASON });
  }
}

module.exports = new FootballApiService();
