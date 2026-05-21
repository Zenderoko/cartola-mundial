# 🌐 FASE 4 — Servicio API-Football

> Cliente oficial para API-Football v3
> Plan FREE: 100 req/día, 10 req/min
> Mundial 2026: `league_id=1`, `season=2026`

---

## 1. Configuración Inicial

### `config/apiFootball.js`

```javascript
const axios = require("axios");

const apiClient = axios.create({
  baseURL:
    process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io",
  headers: {
    "x-rapidapi-key": process.env.API_FOOTBALL_KEY,
    "x-rapidapi-host": "v3.football.api-sports.io",
  },
  timeout: 15000,
});

module.exports = { apiClient };
```

### `.env`

```bash
API_FOOTBALL_KEY=74a2b7d26910d3f112db84a437f37b55
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
API_FOOTBALL_RATE_LIMIT=9
```

---

## 2. Rate Limiter Interno (Bottleneck)

Respetamos **10 req/min** del plan FREE. Usamos 9 para tener margen.

```javascript
// services/rateLimiter.js
const Bottleneck = require("bottleneck");

const RATE_LIMIT = parseInt(process.env.API_FOOTBALL_RATE_LIMIT || 9);

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: Math.ceil(60000 / RATE_LIMIT),
  reservoir: RATE_LIMIT,
  reservoirRefreshAmount: RATE_LIMIT,
  reservoirRefreshInterval: 60 * 1000,
});

limiter.on("depleted", () => {
  console.warn("API-Football rate limit reached, queue paused");
});

module.exports = { limiter };
```

---

## 3. footballApi.service.js (Completo)

```javascript
// services/footballApi.service.js
const { apiClient } = require("../config/apiFootball");
const { limiter } = require("./rateLimiter");
const logger = require("../utils/logger");
const requestLogRepo = require("../repositories/requestLogRepo");

const LEAGUE_ID = 1;
const SEASON = 2026;
const MAX_RETRIES = 2;

class FootballApiService {
  constructor() {
    this.budgetWarningSent = false;
  }

  // ── Método base: rate limit + retry + log ────────────────
  async _request(endpoint, params = {}) {
    return limiter.schedule(async () => {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const response = await apiClient.get(endpoint, { params });
          const remaining = parseInt(
            response.headers["x-ratelimit-requests-remaining"],
          );

          await requestLogRepo.log(endpoint, params, response.status);

          if (remaining <= 20 && !this.budgetWarningSent) {
            logger.warn({ remaining, endpoint }, "Budget API-Football bajo");
            this.budgetWarningSent = true;
          }
          if (remaining > 20) this.budgetWarningSent = false;

          return { data: response.data, remaining };
        } catch (err) {
          if (err.response?.status === 429) {
            logger.warn("Rate limited por API-Football, esperando 60s...");
            await new Promise((r) => setTimeout(r, 60000));
            continue;
          }
          if (attempt < MAX_RETRIES) {
            const wait = 2000 * (attempt + 1);
            logger.error(
              { err, endpoint, attempt },
              `Reintentando en ${wait}ms`,
            );
            await new Promise((r) => setTimeout(r, wait));
            continue;
          }
          throw err;
        }
      }
    });
  }

  // ── Fixtures ─────────────────────────────────────────────
  async getFixtures(params = {}) {
    return this._request("/fixtures", {
      league: LEAGUE_ID,
      season: SEASON,
      ...params,
    });
  }

  async getFixtureById(id) {
    return this._request("/fixtures", { id });
  }

  async getFixturesByDate(date) {
    return this._request("/fixtures", {
      league: LEAGUE_ID,
      season: SEASON,
      date,
    });
  }

  async getFixturesByRound(round) {
    return this._request("/fixtures", {
      league: LEAGUE_ID,
      season: SEASON,
      round,
    });
  }

  async getRounds() {
    return this._request("/fixtures/rounds", {
      league: LEAGUE_ID,
      season: SEASON,
    });
  }

  // ── Standings ─────────────────────────────────────────────
  async getStandings() {
    return this._request("/standings", {
      league: LEAGUE_ID,
      season: SEASON,
    });
  }

  // ── Teams ─────────────────────────────────────────────────
  async getAllTeams() {
    return this._request("/teams", {
      league: LEAGUE_ID,
      season: SEASON,
    });
  }

  async getTeamById(id) {
    return this._request("/teams", { id });
  }

  // ── Players / Squads ──────────────────────────────────────
  async getSquadByTeam(teamId) {
    return this._request("/players/squads", { team: teamId });
  }

  async getPlayerById(playerId) {
    return this._request("/players", {
      id: playerId,
      league: LEAGUE_ID,
      season: SEASON,
    });
  }

  // ── Match Details ─────────────────────────────────────────
  async getFixtureStatistics(fixtureId) {
    return this._request("/fixtures/statistics", { fixture: fixtureId });
  }

  async getFixturePlayerStats(fixtureId) {
    return this._request("/fixtures/players", { fixture: fixtureId });
  }

  async getFixtureEvents(fixtureId) {
    return this._request("/fixtures/events", { fixture: fixtureId });
  }

  // ── Top Scorers / Assists ─────────────────────────────────
  async getTopScorers() {
    return this._request("/players/topscorers", {
      league: LEAGUE_ID,
      season: SEASON,
    });
  }

  async getTopAssists() {
    return this._request("/players/topassists", {
      league: LEAGUE_ID,
      season: SEASON,
    });
  }
}

module.exports = new FootballApiService();
```

---

## 4. Request Log Repository

```javascript
// repositories/requestLogRepo.js
const { pool } = require("../config/database");

class RequestLogRepo {
  async log(endpoint, params, statusCode) {
    try {
      await pool.query(
        `INSERT INTO request_log (endpoint, params, status, date)
         VALUES ($1, $2, $3, CURRENT_DATE)`,
        [endpoint, JSON.stringify(params), statusCode],
      );
    } catch (err) {
      console.error("Failed to log request:", err.message);
    }
  }

  async getTodayCount() {
    const { rows } = await pool.query(
      `SELECT COUNT(*) as count FROM request_log WHERE date = CURRENT_DATE`,
    );
    return parseInt(rows[0].count);
  }

  async getDailyStats(days = 7) {
    const { rows } = await pool.query(`
      SELECT date, COUNT(*) as requests,
        COUNT(*) FILTER (WHERE status >= 400) as errors
      FROM request_log
      WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY date ORDER BY date DESC
    `);
    return rows;
  }
}

module.exports = new RequestLogRepo();
```

---

## 5. Mapa de Requests

| Endpoint                   | Parámetros              | Cache        | Frecuencia       | Prioridad |
| -------------------------- | ----------------------- | ------------ | ---------------- | --------- |
| `GET /fixtures`            | `league=1, season=2026` | 6h / ∞ si FT | 1x al día        | 🔴        |
| `GET /standings`           | `league=1, season=2026` | 6h           | Post-matchday    | 🔴        |
| `GET /teams`               | `league=1, season=2026` | 30d          | Pre-torneo (1x)  | 🟢        |
| `GET /players/squads`      | `team=X`                | 30d          | Pre-torneo (48x) | 🔴        |
| `GET /fixtures/statistics` | `fixture=X`             | 24h          | Post-partido     | 🔴        |
| `GET /fixtures/players`    | `fixture=X`             | 24h          | Post-partido     | 🔴        |
| `GET /players/topscorers`  | `league=1, season=2026` | 6h           | Post-matchday    | 🟡        |
| `GET /fixtures/events`     | `fixture=X`             | 24h          | Post-partido     | 🟡        |

---

## 6. Budget Diario (Simulación)

| Escenario           | Requests           | Restante |
| ------------------- | ------------------ | -------- |
| Día sin partidos    | 1 (fixtures)       | 99       |
| 4 partidos          | 1 + (4×2) + 1 = 10 | 90       |
| 6 partidos (pico)   | 1 + (6×2) + 1 = 14 | 86       |
| 6 partidos + extras | 1 + (6×3) + 3 = 22 | 78       |

---

## 7. Caché y Control de Frescura

| Estado del fixture | TTL de caché         |
| ------------------ | -------------------- |
| `scheduled`        | 6 horas              |
| `match finished`   | ∞ (cache permanente) |
| `cancelled`        | 24 horas             |

---

## 8. package.json (dependencias)

```json
{
  "dependencies": {
    "axios": "^1.7.0",
    "bottleneck": "^2.19.5"
  }
}
```
