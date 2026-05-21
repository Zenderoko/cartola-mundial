# ⚽ Módulo de Fixtures — Cartola Mundialera

> API de partidos del Mundial FIFA 2026
> CRUD + Sync + Cache con API-Football v3
> Plan FREE: 100 req/día, 10 req/min

---

## 1. Endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/fixtures` | Lista paginada con filtros | Público |
| `GET` | `/api/fixtures/live` | Partidos en vivo + recientes | Público |
| `GET` | `/api/fixtures/rounds` | Lista de rondas disponibles | Público |
| `GET` | `/api/fixtures/daily-count` | Cantidad de partidos para una fecha | Público |
| `GET` | `/api/fixtures/:id` | Detalle completo (stats + jugadores + eventos) | Público |

### GET /api/fixtures — Query params

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | int | `1` | Número de página |
| `per_page` | int | `20` | Items por página (max 100) |
| `date` | string | — | Filtrar por fecha `YYYY-MM-DD` |
| `team_id` | int | — | Filtrar por equipo (local o visitante) |
| `round` | string | — | Filtrar por ronda (ej: `Group Stage - 1`) |
| `status` | enum | — | `scheduled`, `live`, `match finished`, `cancelled`, `postponed` |
| `stage` | string | — | Filtrar por etapa (ej: `Group Stage`) |
| `search` | string | — | Buscar por nombre de equipo |
| `sort` | enum | `date_asc` | `date_asc`, `date_desc`, `round_asc`, `round_desc` |

---

## 2. Respuestas

### Lista paginada

```json
{
  "success": true,
  "data": [
    {
      "id": 1200001,
      "round": "Group Stage - 1",
      "date": "2026-06-11T21:00:00+00:00",
      "status": "scheduled",
      "home_score": null,
      "away_score": null,
      "venue": "Estadio Azteca",
      "stage": "Group Stage",
      "home_team": { "id": 9, "name": "Brazil", "logo": "https://...", "code": "BRA" },
      "away_team": { "id": 17, "name": "Serbia", "logo": "https://...", "code": "SRB" }
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 104,
    "total_pages": 6
  }
}
```

### Detalle completo (`/api/fixtures/:id`)

```json
{
  "success": true,
  "data": {
    "id": 1200001,
    "round": "Group Stage - 1",
    "date": "2026-06-11T21:00:00+00:00",
    "status": "match finished",
    "home_score": 3,
    "away_score": 1,
    "venue": "Estadio Azteca",
    "stage": "Group Stage",
    "home_team": { "id": 9, "name": "Brazil", "logo": "...", "code": "BRA" },
    "away_team": { "id": 17, "name": "Serbia", "logo": "...", "code": "SRB" },
    "stats": [
      {
        "team_id": 9,
        "shots": 15,
        "possession": 63.0,
        "fouls": 8,
        "team": { "id": 9, "name": "Brazil", "logo": "..." }
      }
    ],
    "player_stats": [
      {
        "player_id": 275,
        "player_name": "Vinicius Junior",
        "position": "Attacker",
        "rating": 8.9,
        "goals": 1,
        "assists": 1,
        "photo": "...",
        "man_of_the_match": true
      }
    ],
    "events": [
      {
        "minute": 23,
        "event_type": "goal",
        "player_name": "Vinicius Junior",
        "team_name": "Brazil",
        "detail": "Normal Goal"
      }
    ]
  },
  "meta": {
    "cache": {
      "fresh": true,
      "synced_at": "2026-06-11T23:00:00Z"
    }
  }
}
```

### Live (`/api/fixtures/live`)

```json
{
  "success": true,
  "data": {
    "live": [ /* fixtures con status = live */ ],
    "recent": [ /* partidos finalizados en últimas 3h */ ],
    "updated_at": "2026-06-14T18:30:00Z"
  },
  "meta": {
    "live_count": 2,
    "recent_count": 4
  }
}
```

---

## 3. Estructura de Archivos

```
server/
├── src/
│   ├── index.js                          Entry point
│   ├── app.js                            Express setup
│   │
│   ├── config/
│   │   ├── env.js                        Zod env validation
│   │   ├── database.js                   PG pool
│   │   └── apiFootball.js                Axios client
│   │
│   ├── middleware/
│   │   ├── errorHandler.js               AppError + global handler
│   │   ├── validate.js                   Zod validation middleware
│   │   └── rateLimiter.js                Express rate limiter
│   │
│   ├── routes/
│   │   └── fixtures.js                   Router de fixtures
│   │
│   ├── controllers/
│   │   └── fixtureController.js          Handlers
│   │
│   ├── services/
│   │   ├── apiFootball.js                API-Football client
│   │   ├── rateLimiter.js                Bottleneck limiter
│   │   ├── syncService.js                Sync orchestrator
│   │   └── cacheService.js               Cache freshness
│   │
│   ├── repositories/
│   │   └── fixtureRepo.js                DB queries
│   │
│   ├── validators/
│   │   └── fixtureSchema.js              Zod schemas
│   │
│   ├── jobs/
│   │   └── syncScheduler.js              Cron jobs
│   │
│   └── utils/
│       ├── logger.js                     Pino logger
│       ├── response.js                   Formatos uniformes
│       └── dateHelpers.js                Date utilities
│
├── .env.example
└── package.json
```

---

## 4. Código Completo

### `server/package.json`

```json
{
  "name": "cartola-mundialera-api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "axios": "^1.7.9",
    "bottleneck": "^2.19.5",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "express-rate-limit": "^7.5.0",
    "helmet": "^8.0.0",
    "node-cron": "^3.0.3",
    "pg": "^8.13.1",
    "pino": "^9.6.0",
    "pino-pretty": "^13.0.0",
    "zod": "^3.24.2"
  }
}
```

### `server/.env.example`

```bash
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/cartola_mundialera
API_FOOTBALL_KEY=74a2b7d26910d3f112db84a437f37b55
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
API_FOOTBALL_RATE_LIMIT=9
SYNC_CRON_SCHEDULE=*/15 * * * *
SYNC_ADMIN_KEY=admin-secret
LOG_LEVEL=info
```

---

### `server/src/config/env.js`

```javascript
const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  API_FOOTBALL_KEY: z.string().min(1, 'API_FOOTBALL_KEY is required'),
  API_FOOTBALL_BASE_URL: z.string().url().default('https://v3.football.api-sports.io'),
  API_FOOTBALL_RATE_LIMIT: z.coerce.number().min(1).max(10).default(9),
  SYNC_CRON_SCHEDULE: z.string().default('*/15 * * * *'),
  SYNC_ADMIN_KEY: z.string().default('admin-secret'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

const result = envSchema.safeParse(process.env);
if (!result.success) {
  console.error('❌ Invalid environment variables:');
  for (const issue of result.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

module.exports = { env: result.data };
```

### `server/src/config/database.js`

```javascript
const { Pool } = require('pg');
const { env } = require('./env');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (env.NODE_ENV === 'development') {
    console.log('Query:', { text: text.substring(0, 80), duration: `${duration}ms`, rows: result.rowCount });
  }
  return result;
}

module.exports = { pool, query };
```

### `server/src/config/apiFootball.js`

```javascript
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
```

---

### Middlewares

#### `server/src/middleware/errorHandler.js`

```javascript
const { logger } = require('../utils/logger');
const { error } = require('../utils/response');

class AppError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return error(res, err.status, err.code, err.message, err.details);
  }

  if (err.name === 'ZodError') {
    const details = err.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return error(res, 400, 'VALIDATION_ERROR', 'Invalid request data', details);
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  return error(
    res, 500, 'INTERNAL_ERROR',
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  );
}

module.exports = { errorHandler, AppError };
```

#### `server/src/middleware/validate.js`

```javascript
function validate(schema, source = 'query') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details },
      });
    }
    req[source] = result.data;
    next();
  };
}

const validateQuery = (schema) => validate(schema, 'query');
const validateParams = (schema) => validate(schema, 'params');

module.exports = { validate, validateQuery, validateParams };
```

#### `server/src/middleware/rateLimiter.js`

```javascript
const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, try again later' },
  },
});

const syncLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Sync endpoint rate limit exceeded' },
  },
});

module.exports = { generalLimiter, syncLimiter };
```

---

### Validators

#### `server/src/validators/fixtureSchema.js`

```javascript
const { z } = require('zod');

const fixtureQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  team_id: z.coerce.number().int().positive().optional(),
  round: z.string().optional(),
  status: z.enum([
    'scheduled', 'live', 'match finished', 'cancelled',
    'postponed', 'time-to-be-defined',
  ]).optional(),
  stage: z.string().optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(['date_asc', 'date_desc', 'round_asc', 'round_desc']).default('date_asc'),
});

const fixtureParamsSchema = z.object({
  id: z.coerce.number().int().positive('Fixture ID must be a positive integer'),
});

module.exports = { fixtureQuerySchema, fixtureParamsSchema };
```

---

### Servicios

#### `server/src/services/rateLimiter.js`

```javascript
const Bottleneck = require('bottleneck');
const { env } = require('../config/env');

const RATE_LIMIT = env.API_FOOTBALL_RATE_LIMIT;

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: Math.ceil(60000 / RATE_LIMIT),
  reservoir: RATE_LIMIT,
  reservoirRefreshAmount: RATE_LIMIT,
  reservoirRefreshInterval: 60 * 1000,
});

limiter.on('depleted', () => {
  console.warn('API-Football rate limit reservoir depleted, queue paused');
});

module.exports = { limiter };
```

#### `server/src/services/apiFootball.js` — Cliente API-Football

```javascript
const { apiClient } = require('../config/apiFootball');
const { limiter } = require('./rateLimiter');
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

const LEAGUE_ID = 1;    // World Cup
const SEASON = 2026;
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
          const remaining = parseInt(
            response.headers['x-ratelimit-requests-remaining']
          ) || 0;

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
            logger.warn(
              { err: err.message, endpoint, attempt, wait },
              'Retrying request'
            );
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
    return this._request('/fixtures', {
      league: LEAGUE_ID, season: SEASON, ...params,
    });
  }

  async getFixtureById(id) {
    return this._request('/fixtures', { id });
  }

  async getFixturesByDate(date) {
    return this._request('/fixtures', {
      league: LEAGUE_ID, season: SEASON, date,
    });
  }

  async getRounds() {
    return this._request('/fixtures/rounds', {
      league: LEAGUE_ID, season: SEASON,
    });
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
}

module.exports = new FootballApiService();
```

#### `server/src/services/cacheService.js`

```javascript
const { pool } = require('../config/database');

class CacheService {
  async isFixtureFresh(fixtureId) {
    const result = await pool.query(
      'SELECT cache_until, status FROM fixtures WHERE id = $1',
      [fixtureId]
    );
    if (!result.rows[0]) return false;
    const { cache_until, status } = result.rows[0];

    if (status === 'match finished') return true;
    if (status === 'cancelled' || status === 'postponed') return false;
    if (!cache_until) return false;
    return new Date(cache_until) > new Date();
  }

  async setFixtureCache(fixtureId, ttlHours = 6) {
    await pool.query(
      'UPDATE fixtures SET cache_until = NOW() + INTERVAL \'$1 hours\' WHERE id = $2',
      [ttlHours, fixtureId]
    );
  }

  addCacheMeta(entity, syncedAt) {
    return {
      fresh: true,
      synced_at: syncedAt || new Date().toISOString(),
    };
  }
}

module.exports = new CacheService();
```

#### `server/src/services/syncService.js` — Orquestador

```javascript
const apiFootball = require('./apiFootball');
const fixtureRepo = require('../repositories/fixtureRepo');
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

class SyncService {

  // ── Sync completo: todos los fixtures del Mundial ──────────
  async syncAllFixtures() {
    logger.info('Starting full fixture sync for WC 2026...');
    const { data } = await apiFootball.getFixtures();
    const fixtures = data.response || [];

    const { inserted, updated } = await fixtureRepo.upsertMany(fixtures);

    await this._logSync('fixtures', 'synced', fixtures.length);
    logger.info({ total: fixtures.length, inserted, updated }, 'Fixtures sync completed');
    return { total: fixtures.length, inserted, updated };
  }

  // ── Sync por fecha ─────────────────────────────────────────
  async syncFixturesByDate(date) {
    const { data } = await apiFootball.getFixturesByDate(date);
    const fixtures = data.response || [];
    const { inserted, updated } = await fixtureRepo.upsertMany(fixtures);
    await this._logSync(`fixtures:${date}`, 'synced', fixtures.length);
    return { date, total: fixtures.length, inserted, updated };
  }

  // ── Sync detalle de un partido (stats + jugadores + eventos) ─
  async syncMatchDetails(fixtureId) {
    logger.info({ fixtureId }, 'Syncing match details');

    const [statsRes, playersRes, eventsRes] = await Promise.all([
      apiFootball.getFixtureStatistics(fixtureId),
      apiFootball.getFixturePlayerStats(fixtureId),
      apiFootball.getFixtureEvents(fixtureId),
    ]);

    // 1. Estadísticas del partido por equipo
    for (const teamStats of statsRes.data.response || []) {
      const s = this._parseStats(teamStats.statistics);
      await pool.query(
        `INSERT INTO fixture_stats (fixture_id, team_id,
          shots, shots_on_target, possession, total_passes, accurate_passes,
          fouls, corners, offsides, yellow_cards, red_cards, saves)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (fixture_id, team_id) DO UPDATE SET
          shots = EXCLUDED.shots, shots_on_target = EXCLUDED.shots_on_target,
          possession = EXCLUDED.possession, updated_at = NOW()`,
        [
          fixtureId, teamStats.team.id,
          this._int(s['Shots on Goal']), this._int(s['Shots off Goal']),
          this._float(s['Ball Possession']),
          this._int(s['Total passes']), this._int(s['Passes accurate']),
          this._int(s['Fouls']), this._int(s['Corner Kicks']),
          this._int(s['Offsides']), this._int(s['Yellow Cards']),
          this._int(s['Red Cards']), this._int(s['Goalkeeper Saves']),
        ]
      );
    }

    // 2. Estadísticas individuales por jugador
    for (const teamPlayers of playersRes.data.response || []) {
      for (const p of teamPlayers.players) {
        const ps = p.statistics[0];
        await pool.query(
          `INSERT INTO player_stats (fixture_id, player_id, team_id,
            rating, minutes_played, position, goals, assists, shots,
            shots_on_target, key_passes, passes, accurate_passes,
            tackles, interceptions, clearances, blocked_shots,
            fouls, fouls_drawn, offsides, yellow_card, red_card,
            saves, goals_conceded, penalties_saved, penalties_missed,
            man_of_the_match)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
                   $16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
           ON CONFLICT (fixture_id, player_id) DO UPDATE SET
            rating = EXCLUDED.rating, updated_at = NOW()`,
          [
            fixtureId, p.player.id, teamPlayers.team.id,
            this._float(ps.games?.rating), this._int(ps.games?.minutes),
            ps.games?.position || 'Unknown',
            this._int(ps.goals?.total), this._int(ps.goals?.assists),
            this._int(ps.shots?.total), this._int(ps.shots?.on),
            this._int(ps.passes?.key), this._int(ps.passes?.total),
            this._int(ps.passes?.accuracy),
            this._int(ps.tackles?.total), this._int(ps.tackles?.interceptions),
            this._int(ps.duels?.total), this._int(ps.duels?.won),
            this._int(ps.fouls?.drawn), this._int(ps.fouls?.committed),
            this._int(ps.offsides),
            ps.cards?.yellow ? true : false,
            ps.cards?.red ? true : false,
            this._int(ps.goals?.saves), this._int(ps.goals?.conceded),
            this._int(ps.penalty?.saved), this._int(ps.penalty?.missed),
            (this._float(ps.games?.rating) || 0) >= 9.0,
          ]
        );
      }
    }

    // 3. Eventos del partido (goles, tarjetas, cambios)
    for (const event of eventsRes.data.response || []) {
      await pool.query(
        `INSERT INTO fixture_events (fixture_id, team_id, player_id, assist_id,
           event_type, detail, minute, extra_minute, comments)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (fixture_id, minute, extra_minute, event_type, player_id)
         DO UPDATE SET detail = EXCLUDED.detail`,
        [
          fixtureId, event.team.id, event.player?.id || null,
          event.assist?.id || null, event.type, event.detail,
          event.time?.elapsed || 0, event.time?.extra || 0,
          event.comments || null,
        ]
      );
    }

    await this._logSync(`match:${fixtureId}`, 'synced', 3);
    logger.info(
      { fixtureId,
        stats: statsRes.data.response?.length || 0,
        players: playersRes.data.response?.length || 0,
        events: eventsRes.data.response?.length || 0,
      },
      'Match details synced'
    );
    return { fixtureId, synced: true };
  }

  // ── Detectar partidos finalizados ──────────────────────────
  async syncFinishedMatches() {
    const scheduled = await fixtureRepo.findScheduledBefore(new Date());
    logger.info({ total: scheduled.length }, 'Checking for finished matches');

    let synced = 0;
    let updatedStatus = 0;

    for (const fixture of scheduled) {
      try {
        const { data } = await apiFootball.getFixtureById(fixture.id);
        const apiFixture = data.response?.[0];
        if (!apiFixture) continue;

        const apiStatus = apiFixture.fixture.status.short;

        if (['FT', 'AET', 'PEN'].includes(apiStatus)) {
          await fixtureRepo.upsert(apiFixture);
          await this.syncMatchDetails(fixture.id);
          synced++;
        } else if (['LIVE', '1H', '2H', 'HT', 'ET'].includes(apiStatus)) {
          await fixtureRepo.updateStatus(fixture.id, 'live');
          updatedStatus++;
        }
      } catch (err) {
        logger.error(
          { fixtureId: fixture.id, err: err.message },
          'Failed to sync finished match'
        );
      }
    }

    logger.info(
      { checked: scheduled.length, synced, updatedStatus },
      'Finished matches sync completed'
    );
    return { checked: scheduled.length, synced, updatedStatus };
  }

  // ── Helpers ────────────────────────────────────────────────
  _parseStats(statistics) {
    const map = {};
    for (const s of statistics || []) map[s.type] = s.value;
    return map;
  }

  _int(val) {
    const n = parseInt(val);
    return isNaN(n) ? 0 : n;
  }

  _float(val) {
    if (val === null || val === undefined || val === '') return null;
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  }

  async _logSync(entity, status, count) {
    try {
      await pool.query(
        `INSERT INTO sync_log (entity, status, rows_inserted, meta)
         VALUES ($1, $2, $3, $4)`,
        [entity, status, count,
         JSON.stringify({ timestamp: new Date().toISOString() })]
      );
    } catch (err) {
      logger.error({ err }, 'Failed to log sync');
    }
  }
}

module.exports = new SyncService();
```

---

### Repository

#### `server/src/repositories/fixtureRepo.js`

```javascript
const { pool } = require('../config/database');

class FixtureRepo {

  // ── Listar con filtros + paginación ────────────────────────
  async findAll({
    date, team_id, round, status, stage, search,
    page = 1, perPage = 20, sort = 'date_asc',
  }) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (date) {
      conditions.push(`DATE(f.date AT TIME ZONE 'UTC') = DATE($${idx})`);
      params.push(date); idx++;
    }
    if (team_id) {
      conditions.push(
        `(f.home_team_id = $${idx} OR f.away_team_id = $${idx})`
      );
      params.push(team_id); idx++;
    }
    if (round) {
      conditions.push(`f.round = $${idx}`);
      params.push(round); idx++;
    }
    if (status) {
      conditions.push(`f.status = $${idx}`);
      params.push(status); idx++;
    }
    if (stage) {
      conditions.push(`f.stage = $${idx}`);
      params.push(stage); idx++;
    }
    if (search) {
      conditions.push(
        `(ht.name ILIKE $${idx} OR at.name ILIKE $${idx})`
      );
      params.push(`%${search}%`); idx++;
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const orderMap = {
      date_asc: 'f.date ASC',
      date_desc: 'f.date DESC',
      round_asc: 'f.round ASC, f.date ASC',
      round_desc: 'f.round DESC, f.date DESC',
    };

    const offset = (page - 1) * perPage;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM fixtures f
       LEFT JOIN teams ht ON ht.id = f.home_team_id
       LEFT JOIN teams at ON at.id = f.away_team_id ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT f.id, f.round, f.date, f.status,
        f.home_score, f.away_score, f.venue, f.stage,
        jsonb_build_object(
          'id', ht.id, 'name', ht.name, 'logo', ht.logo, 'code', ht.code
        ) AS home_team,
        jsonb_build_object(
          'id', at.id, 'name', at.name, 'logo', at.logo, 'code', at.code
        ) AS away_team
      FROM fixtures f
      LEFT JOIN teams ht ON ht.id = f.home_team_id
      LEFT JOIN teams at ON at.id = f.away_team_id
      ${where}
      ORDER BY ${orderMap[sort] || orderMap.date_asc}
      LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, perPage, offset]
    );

    return { rows: result.rows, total };
  }

  // ── Detalle ────────────────────────────────────────────────
  async findById(id) {
    const result = await pool.query(
      `SELECT f.*,
        jsonb_build_object('id', ht.id, 'name', ht.name,
          'logo', ht.logo, 'code', ht.code, 'group_name', ht.group_name
        ) AS home_team,
        jsonb_build_object('id', at.id, 'name', at.name,
          'logo', at.logo, 'code', at.code, 'group_name', at.group_name
        ) AS away_team
      FROM fixtures f
      LEFT JOIN teams ht ON ht.id = f.home_team_id
      LEFT JOIN teams at ON at.id = f.away_team_id
      WHERE f.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  // ── Partidos en vivo ───────────────────────────────────────
  async findLive() {
    const result = await pool.query(
      `SELECT f.*,
        jsonb_build_object('id', ht.id, 'name', ht.name,
          'logo', ht.logo, 'code', ht.code) AS home_team,
        jsonb_build_object('id', at.id, 'name', at.name,
          'logo', at.logo, 'code', at.code) AS away_team
      FROM fixtures f
      LEFT JOIN teams ht ON ht.id = f.home_team_id
      LEFT JOIN teams at ON at.id = f.away_team_id
      WHERE f.status IN ('live','1H','2H','HT','ET','PEN','LIVE')
      ORDER BY f.date ASC`
    );
    return result.rows;
  }

  // ── Partidos finalizados recientes ─────────────────────────
  async findRecentFinished(hours = 3) {
    const result = await pool.query(
      `SELECT f.*,
        jsonb_build_object('id', ht.id, 'name', ht.name,
          'logo', ht.logo, 'code', ht.code) AS home_team,
        jsonb_build_object('id', at.id, 'name', at.name,
          'logo', at.logo, 'code', at.code) AS away_team
      FROM fixtures f
      LEFT JOIN teams ht ON ht.id = f.home_team_id
      LEFT JOIN teams at ON at.id = f.away_team_id
      WHERE f.status = 'match finished'
        AND f.updated_at >= NOW() - INTERVAL '${hours} hours'
      ORDER BY f.date DESC`
    );
    return result.rows;
  }

  // ── Programados con fecha vencida ──────────────────────────
  async findScheduledBefore(date) {
    const result = await pool.query(
      `SELECT id, status FROM fixtures
       WHERE status IN ('scheduled', 'time-to-be-defined')
         AND date <= $1
       ORDER BY date ASC`,
      [date.toISOString()]
    );
    return result.rows;
  }

  // ── Upsert individual ──────────────────────────────────────
  async upsert(fixture) {
    const f = fixture.fixture;
    const teams = fixture.teams;
    const goals = fixture.goals;

    const statusMap = {
      'TBD': 'time-to-be-defined', 'NS': 'scheduled',
      '1H': '1H', 'HT': 'HT', '2H': '2H', 'ET': 'ET',
      'P': 'PEN',
      'FT': 'match finished', 'AET': 'match finished',
      'PEN': 'match finished',
      'CANC': 'cancelled', 'ABD': 'abandoned',
      'LIVE': 'live',
    };

    const apiStatus = f.status?.short || 'NS';
    const mappedStatus = statusMap[apiStatus]
      || apiStatus?.toLowerCase()
      || 'scheduled';

    const ttl = mappedStatus === 'match finished'
      ? "'30 days'" : "'6 hours'";

    const result = await pool.query(
      `INSERT INTO fixtures (id, round, date, status,
         home_team_id, away_team_id, home_score, away_score,
         venue, stage, cache_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
               NOW() + INTERVAL ${ttl})
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         home_score = EXCLUDED.home_score,
         away_score = EXCLUDED.away_score,
         updated_at = NOW()
       RETURNING (xmax = 0) AS inserted`,
      [
        f.id, f.round?.name, f.date, mappedStatus,
        teams.home.id, teams.away.id,
        goals.home, goals.away,
        f.venue?.name, f.round?.name,
      ]
    );
    return {
      action: result.rows[0]?.inserted ? 'inserted' : 'updated',
    };
  }

  // ── Upsert múltiple ────────────────────────────────────────
  async upsertMany(fixtures) {
    let inserted = 0, updated = 0;
    for (const fixture of fixtures) {
      const r = await this.upsert(fixture);
      if (r.action === 'inserted') inserted++;
      else updated++;
    }
    return { inserted, updated };
  }

  // ── Actualizar status ──────────────────────────────────────
  async updateStatus(id, status) {
    await pool.query(
      'UPDATE fixtures SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );
  }

  // ── Estadísticas por equipo del partido ────────────────────
  async getFixtureStats(id) {
    const result = await pool.query(
      `SELECT fs.*,
        jsonb_build_object('id', t.id, 'name', t.name,
          'logo', t.logo) AS team
      FROM fixture_stats fs
      JOIN teams t ON t.id = fs.team_id
      WHERE fs.fixture_id = $1
      ORDER BY fs.team_id`,
      [id]
    );
    return result.rows;
  }

  // ── Stats de jugadores del partido ─────────────────────────
  async getPlayerStats(id, limit = 30) {
    const result = await pool.query(
      `SELECT ps.player_id, ps.team_id, ps.rating,
        ps.minutes_played, ps.goals, ps.assists,
        ps.shots, ps.key_passes, ps.tackles, ps.saves,
        ps.man_of_the_match, ps.yellow_card, ps.red_card,
        p.name AS player_name, p.position, p.photo, p.number,
        t.name AS team_name, t.logo AS team_logo
      FROM player_stats ps
      JOIN players p ON p.id = ps.player_id
      JOIN teams t ON t.id = ps.team_id
      WHERE ps.fixture_id = $1
      ORDER BY ps.rating DESC NULLS LAST
      LIMIT $2`,
      [id, limit]
    );
    return result.rows;
  }

  // ── Eventos del partido ────────────────────────────────────
  async getFixtureEvents(id) {
    const result = await pool.query(
      `SELECT fe.minute, fe.extra_minute, fe.event_type,
        fe.detail, fe.comments,
        p.name AS player_name,
        a.name AS assist_name,
        t.name AS team_name, t.logo AS team_logo
      FROM fixture_events fe
      LEFT JOIN players p ON p.id = fe.player_id
      LEFT JOIN players a ON a.id = fe.assist_id
      JOIN teams t ON t.id = fe.team_id
      WHERE fe.fixture_id = $1
      ORDER BY fe.minute ASC, fe.extra_minute ASC`,
      [id]
    );
    return result.rows;
  }

  // ── Utilidades ─────────────────────────────────────────────
  async getDistinctRounds() {
    const result = await pool.query(
      `SELECT DISTINCT round FROM fixtures
       WHERE round IS NOT NULL ORDER BY round`
    );
    return result.rows.map((r) => r.round);
  }

  async getDailyFixtureCount(date) {
    const result = await pool.query(
      `SELECT COUNT(*) FROM fixtures
       WHERE DATE(date AT TIME ZONE 'UTC') = DATE($1)`,
      [date]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = new FixtureRepo();
```

---

### Controller

#### `server/src/controllers/fixtureController.js`

```javascript
const fixtureRepo = require('../repositories/fixtureRepo');
const syncService = require('../services/syncService');
const cacheService = require('../services/cacheService');
const { success, paginated, error } = require('../utils/response');
const { getDateString } = require('../utils/dateHelpers');

async function getAll(req, res, next) {
  try {
    const { page, per_page, date, team_id, round, status, stage, search, sort } = req.query;

    const { rows, total } = await fixtureRepo.findAll({
      date: date || undefined,
      team_id: team_id || undefined,
      round: round || undefined,
      status: status || undefined,
      stage: stage || undefined,
      search: search || undefined,
      page,
      perPage: per_page,
      sort,
    });

    return paginated(res, rows, { page, perPage: per_page, total });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;

    const fixture = await fixtureRepo.findById(id);
    if (!fixture) {
      return error(res, 404, 'NOT_FOUND', `Fixture ${id} not found`);
    }

    const [fixtureStats, playerStats, fixtureEvents] = await Promise.all([
      fixtureRepo.getFixtureStats(id),
      fixtureRepo.getPlayerStats(id, 30),
      fixtureRepo.getFixtureEvents(id),
    ]);

    const fresh = await cacheService.isFixtureFresh(id);
    const cacheMeta = cacheService.addCacheMeta(
      `fixture:${id}`,
      fixture.cache_until || fixture.updated_at
    );

    return success(res, {
      ...fixture,
      stats: fixtureStats,
      player_stats: playerStats,
      events: fixtureEvents,
    }, { cache: cacheMeta });
  } catch (err) {
    next(err);
  }
}

async function getLive(req, res, next) {
  try {
    const [liveFixtures, recentFinished] = await Promise.all([
      fixtureRepo.findLive(),
      fixtureRepo.findRecentFinished(3),
    ]);

    return success(res, {
      live: liveFixtures,
      recent: recentFinished,
      updated_at: new Date().toISOString(),
    }, {
      live_count: liveFixtures.length,
      recent_count: recentFinished.length,
    });
  } catch (err) {
    next(err);
  }
}

async function syncAll(req, res, next) {
  try {
    const result = await syncService.syncAllFixtures();
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function syncMatch(req, res, next) {
  try {
    const { id } = req.params;
    const result = await syncService.syncMatchDetails(Number(id));
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function syncFinished(req, res, next) {
  try {
    const result = await syncService.syncFinishedMatches();
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function getRounds(req, res, next) {
  try {
    const rounds = await fixtureRepo.getDistinctRounds();
    return success(res, rounds);
  } catch (err) {
    next(err);
  }
}

async function getDailyCount(req, res, next) {
  try {
    const date = req.query.date || getDateString();
    const count = await fixtureRepo.getDailyFixtureCount(date);
    return success(res, { date, fixture_count: count });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAll, getById, getLive,
  syncAll, syncMatch, syncFinished,
  getRounds, getDailyCount,
};
```

---

### Rutas

#### `server/src/routes/fixtures.js`

```javascript
const { Router } = require('express');
const controller = require('../controllers/fixtureController');
const { validateQuery, validateParams } = require('../middleware/validate');
const {
  fixtureQuerySchema,
  fixtureParamsSchema,
} = require('../validators/fixtureSchema');

const router = Router();

router.get('/',        validateQuery(fixtureQuerySchema), controller.getAll);
router.get('/live',    controller.getLive);
router.get('/rounds',  controller.getRounds);
router.get('/daily-count', controller.getDailyCount);
router.get('/:id',     validateParams(fixtureParamsSchema), controller.getById);

module.exports = router;
```

---

### App e Entry Point

#### `server/src/app.js`

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

const fixturesRouter = require('./routes/fixtures');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(generalLimiter);

app.use((req, res, next) => {
  logger.debug({ method: req.method, path: req.path, query: req.query }, 'Request');
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
});

app.use('/api/fixtures', fixturesRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
});

app.use(errorHandler);

module.exports = app;
```

#### `server/src/index.js`

```javascript
const app = require('./app');
const { env } = require('./config/env');
const { pool } = require('./config/database');
const { logger } = require('./utils/logger');
const syncScheduler = require('./jobs/syncScheduler');

async function main() {
  try {
    await pool.query('SELECT 1');
    logger.info('Database connected');
  } catch (err) {
    logger.fatal({ err }, 'Database connection failed');
    process.exit(1);
  }

  syncScheduler.start();

  app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`);
    logger.info(`Fixtures API: http://localhost:${env.PORT}/api/fixtures`);
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
```

---

### Scheduler (Cron)

#### `server/src/jobs/syncScheduler.js`

```javascript
const cron = require('node-cron');
const syncService = require('../services/syncService');
const { logger } = require('../utils/logger');
const { pool } = require('../config/database');

class SyncScheduler {
  start() {
    // Cada 15 min: detectar partidos finalizados
    cron.schedule('*/15 * * * *', async () => {
      logger.info('Cron: checking for finished matches...');
      try {
        await syncService.syncFinishedMatches();
      } catch (err) {
        logger.error({ err }, 'Cron: finished matches check failed');
      }
    });

    // Cada día 06:00 UTC: sync completo de fixtures
    cron.schedule('0 6 * * *', async () => {
      logger.info('Cron: daily fixture sync...');
      try {
        await syncService.syncAllFixtures();
      } catch (err) {
        logger.error({ err }, 'Cron: daily fixture sync failed');
      }
    });

    // Cada día 22:00 UTC: refresh rankings
    cron.schedule('0 22 * * *', async () => {
      logger.info('Cron: nightly rankings refresh...');
      try {
        await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY IF EXISTS mv_ranking_global');
        await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY IF EXISTS mv_ranking_by_round');
      } catch {
        // Views pueden no existir aún
      }
    });

    logger.info('Sync scheduler started');
  }
}

module.exports = new SyncScheduler();
```

---

### Utils

#### `server/src/utils/response.js`

```javascript
function success(res, data, meta = {}) {
  return res.status(200).json({ success: true, data, meta });
}

function paginated(res, data, { page, perPage, total }) {
  return res.status(200).json({
    success: true,
    data,
    meta: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.ceil(total / perPage),
    },
  });
}

function created(res, data) {
  return res.status(201).json({ success: true, data });
}

function noContent(res) {
  return res.status(204).end();
}

function error(res, status, code, message, details = null) {
  const body = { success: false, error: { code, message } };
  if (details) body.error.details = details;
  return res.status(status).json(body);
}

module.exports = { success, paginated, created, noContent, error };
```

#### `server/src/utils/logger.js`

```javascript
const pino = require('pino');
const { env } = require('../config/env');

const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
    : undefined,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie'],
    censor: '[REDACTED]',
  },
});

module.exports = { logger };
```

#### `server/src/utils/dateHelpers.js`

```javascript
function toUTC(date) {
  return new Date(date).toISOString();
}

function isToday(date) {
  const d = new Date(date);
  const now = new Date();
  return d.getUTCFullYear() === now.getUTCFullYear()
    && d.getUTCMonth() === now.getUTCMonth()
    && d.getUTCDate() === now.getUTCDate();
}

function getDateString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

module.exports = { toUTC, isToday, getDateString };
```

---

## 5. Sync Pipeline

### Diagrama de sincronización

```
Pre-seed (1x antes del torneo)
  └─ syncAllFixtures() → GET /fixtures?league=1&season=2026 → 1 request

Cada 15 min durante el torneo
  └─ syncFinishedMatches()
       ├─ DB: busca fixtures 'scheduled' con date <= NOW()
       ├─ Por cada uno: GET /fixtures?id=X → 1 request c/u
       │   ├─ Si FT/AET/PEN → upsert fixture + syncMatchDetails
       │   └─ Si LIVE/1H/2H  → update status a 'live'
       └─ syncMatchDetails(id)
            ├─ GET /fixtures/statistics?fixture=X   → 1 req
            ├─ GET /fixtures/players?fixture=X      → 1 req
            └─ GET /fixtures/events?fixture=X       → 1 req

Diario 06:00 UTC
  └─ syncAllFixtures() → refresh todos los fixtures
```

### Budget por escenario

| Escenario | Requests | Restante (de 100) |
|-----------|----------|--------------------|
| Día sin partidos | 1 (diario) | 99 |
| 3 partidos | 1 + (3×3) = 10 | 90 |
| 6 partidos (pico) | 1 + (6×3) = 19 | 81 |
| 6 partidos + extras | 1 + (6×3) + 3 = 22 | 78 |

### Mapeo de estados API-Football → DB

| API-Football `status.short` | DB `status` |
|-----------------------------|-------------|
| `TBD` | `time-to-be-defined` |
| `NS` | `scheduled` |
| `1H`, `2H`, `HT`, `ET`, `LIVE` | `live` |
| `FT`, `AET`, `PEN` | `match finished` |
| `CANC`, `ABD` | `cancelled` |
| `SUSP`, `INT` | `postponed` |

---

## 6. Cache Strategy

| Estado fixture | TTL cache | Comportamiento |
|----------------|-----------|----------------|
| `scheduled` | 6 horas | Se re-sincroniza en el próximo ciclo diario |
| `match finished` | 30 días (∞ práctico) | No se vuelve a consultar a la API |
| `live` | Sin cache | Se actualiza en cada ciclo de 15 min |
| `cancelled` | 24 horas | Se re-verifica al día siguiente |

El cache se controla con la columna `cache_until` en la tabla `fixtures`. El servicio `cacheService.js` expone `isFixtureFresh(id)` que los controllers usan para decidir si retornar datos frescos o forzar sync.

---

## 7. Ejemplos de Uso

### Listar partidos del día con paginación

```bash
curl "http://localhost:3001/api/fixtures?date=2026-06-14&page=1&per_page=10"
```

### Buscar partidos de Brasil

```bash
curl "http://localhost:3001/api/fixtures?team_id=9&sort=date_asc"
```

### Partidos de una ronda específica

```bash
curl "http://localhost:3001/api/fixtures?round=Group+Stage+-+1&status=scheduled"
```

### Detalle completo de un partido

```bash
curl "http://localhost:3001/api/fixtures/1200001"
```

### Partidos en vivo ahora

```bash
curl "http://localhost:3001/api/fixtures/live"
```

### Ver rondas disponibles

```bash
curl "http://localhost:3001/api/fixtures/rounds"
```

### Health check

```bash
curl "http://localhost:3001/api/health"
```
