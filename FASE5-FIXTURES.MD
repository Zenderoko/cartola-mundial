# ⚽ FASE 5 — Módulo de Fixtures

> CRUD completo de partidos del Mundial 2026
> API-Football v3 + Caché inteligente + Live updates
> Plan FREE: 100 req/día, 10 req/min

---

## 1. Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/fixtures` | — | Lista paginada con filtros |
| `GET` | `/api/fixtures/live` | — | Partidos en vivo (status=live) |
| `GET` | `/api/fixtures/:id` | — | Detalle completo + stats + eventos |
| `POST` | `/api/sync/fixtures` | Admin | Sync manual desde API-Football |
| `POST` | `/api/sync/fixtures/round/:round` | Admin | Sync una ronda específica |

---

## 2. Estructura de Archivos

```
server/src/
├── routes/
│   └── fixtures.js
├── controllers/
│   └── fixtureController.js
├── services/
│   ├── fixtureService.js
│   └── fixtureSyncService.js
├── repositories/
│   └── fixtureRepo.js
├── validators/
│   └── fixtureSchema.js
└── jobs/
    └── fixtureScheduler.js
```

---

## 3. Repositorio — `repositories/fixtureRepo.js`

```javascript
const { pool } = require('../config/database');

class FixtureRepo {
  async findAll({ page = 1, perPage = 20, date, teamId, round, status, search }) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (date) {
      conditions.push(`f.date::date = $${idx++}`);
      params.push(date);
    }
    if (teamId) {
      conditions.push(`(f.home_team_id = $${idx++} OR f.away_team_id = $${idx++})`);
      params.push(teamId, teamId);
    }
    if (round) {
      conditions.push(`f.round = $${idx++}`);
      params.push(round);
    }
    if (status) {
      conditions.push(`f.status = $${idx++}`);
      params.push(status);
    }
    if (search) {
      conditions.push(`(t_h.name ILIKE $${idx++} OR t_a.name ILIKE $${idx++})`);
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * perPage;

    const countResult = await pool.query(`
      SELECT COUNT(*) FROM fixtures f
      LEFT JOIN teams t_h ON t_h.id = f.home_team_id
      LEFT JOIN teams t_a ON t_a.id = f.away_team_id
      ${where}
    `, params);

    const dataResult = await pool.query(`
      SELECT
        f.id, f.round, f.date, f.status, f.venue,
        f.home_score, f.away_score, f.stage,
        f.cache_until, f.updated_at,
        jsonb_build_object(
          'id', t_h.id, 'name', t_h.name, 'logo', t_h.logo
        ) AS home_team,
        jsonb_build_object(
          'id', t_a.id, 'name', t_a.name, 'logo', t_a.logo
        ) AS away_team
      FROM fixtures f
      LEFT JOIN teams t_h ON t_h.id = f.home_team_id
      LEFT JOIN teams t_a ON t_a.id = f.away_team_id
      ${where}
      ORDER BY f.date ASC
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, perPage, offset]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      perPage,
    };
  }

  async findById(id) {
    const { rows } = await pool.query(`
      SELECT
        f.*,
        jsonb_build_object(
          'id', t_h.id, 'name', t_h.name, 'logo', t_h.logo
        ) AS home_team,
        jsonb_build_object(
          'id', t_a.id, 'name', t_a.name, 'logo', t_a.logo
        ) AS away_team,
        COALESCE(
          (SELECT jsonb_agg(fs.*) FROM fixture_stats fs WHERE fs.fixture_id = f.id),
          '[]'::jsonb
        ) AS statistics,
        COALESCE(
          (SELECT jsonb_agg(fe.* ORDER BY fe.minute) FROM fixture_events fe WHERE fe.fixture_id = f.id),
          '[]'::jsonb
        ) AS events,
        COALESCE(
          (SELECT jsonb_agg(ps.*) FROM player_stats ps WHERE ps.fixture_id = f.id),
          '[]'::jsonb
        ) AS player_stats
      FROM fixtures f
      LEFT JOIN teams t_h ON t_h.id = f.home_team_id
      LEFT JOIN teams t_a ON t_a.id = f.away_team_id
      WHERE f.id = $1
    `, [id]);

    return rows[0] || null;
  }

  async findLive() {
    const { rows } = await pool.query(`
      SELECT
        f.*,
        jsonb_build_object(
          'id', t_h.id, 'name', t_h.name, 'logo', t_h.logo
        ) AS home_team,
        jsonb_build_object(
          'id', t_a.id, 'name', t_a.name, 'logo', t_a.logo
        ) AS away_team
      FROM fixtures f
      LEFT JOIN teams t_h ON t_h.id = f.home_team_id
      LEFT JOIN teams t_a ON t_a.id = f.away_team_id
      WHERE f.status IN ('live', '1st Half', '2nd Half', 'Halftime', 'Extra Time', 'Penalties')
      ORDER BY f.date ASC
    `);

    return rows;
  }

  async upsert(fixture) {
    const f = fixture.fixture;
    const teams = fixture.teams;
    const goals = fixture.goals;
    const status = f.status?.short || 'scheduled';

    const ttl = status === 'match finished' ? '365 days'
               : status === 'cancelled' || status === 'postponed' ? '24 hours'
               : '6 hours';

    const { rows } = await pool.query(`
      INSERT INTO fixtures (
        id, round, date, status, home_team_id, away_team_id,
        home_score, away_score, venue, stage, cache_until
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                NOW() + INTERVAL '${ttl}')
      ON CONFLICT (id) DO UPDATE SET
        status      = EXCLUDED.status,
        home_score  = EXCLUDED.home_score,
        away_score  = EXCLUDED.away_score,
        date        = EXCLUDED.date,
        cache_until = EXCLUDED.cache_until,
        updated_at  = NOW()
      RETURNING *
    `, [
      f.id, f.round?.name || f.round, f.date, status,
      teams.home.id, teams.away.id,
      goals.home, goals.away,
      f.venue?.name || null, f.round?.name || null,
    ]);

    return rows[0];
  }

  async bulkUpsert(fixtures) {
    let inserted = 0, updated = 0;
    for (const f of fixtures) {
      const result = await this.upsert(f);
      if (result.created_at === result.updated_at) inserted++;
      else updated++;
    }
    return { inserted, updated, total: fixtures.length };
  }

  async cacheIsFresh(fixtureId) {
    const { rows } = await pool.query(
      'SELECT cache_until, status FROM fixtures WHERE id = $1',
      [fixtureId]
    );
    if (!rows[0]) return false;
    if (rows[0].status === 'match finished') return true;
    return new Date(rows[0].cache_until) > new Date();
  }
}

module.exports = new FixtureRepo();
```

---

## 4. Validador — `validators/fixtureSchema.js`

```javascript
const { z } = require('zod');

const listFixturesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    per_page: z.coerce.number().int().positive().max(100).default(20),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').optional(),
    team_id: z.coerce.number().int().positive().optional(),
    round: z.string().optional(),
    status: z.enum([
      'scheduled', 'live', '1st Half', '2nd Half', 'Halftime',
      'Extra Time', 'Penalties', 'match finished', 'cancelled', 'postponed',
    ]).optional(),
    search: z.string().max(100).optional(),
  }),
});

const fixtureParamsSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

module.exports = { listFixturesSchema, fixtureParamsSchema };
```

---

## 5. Servicio — `services/fixtureService.js`

```javascript
const fixtureRepo = require('../repositories/fixtureRepo');

class FixtureService {
  async list(query) {
    const result = await fixtureRepo.findAll({
      page: query.page,
      perPage: query.per_page,
      date: query.date,
      teamId: query.team_id,
      round: query.round,
      status: query.status,
      search: query.search,
    });

    return {
      fixtures: result.data,
      meta: {
        page: result.page,
        per_page: result.perPage,
        total: result.total,
        total_pages: Math.ceil(result.total / result.perPage),
      },
    };
  }

  async getById(id) {
    const fixture = await fixtureRepo.findById(id);
    if (!fixture) return null;

    const fresh = await fixtureRepo.cacheIsFresh(id);

    return {
      ...fixture,
      _cache: { fresh },
    };
  }

  async getLive() {
    const fixtures = await fixtureRepo.findLive();
    return fixtures;
  }
}

module.exports = new FixtureService();
```

---

## 6. Servicio de Sincronización — `services/fixtureSyncService.js`

```javascript
const apiFootball = require('./apiFootball');
const fixtureRepo = require('../repositories/fixtureRepo');
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

const LEAGUE_ID = 1;
const SEASON = 2026;

class FixtureSyncService {
  async syncAll() {
    logger.info('Syncing all fixtures from API-Football...');

    const { data } = await apiFootball.getFixtures({
      league: LEAGUE_ID,
      season: SEASON,
    });

    const fixtures = data.response || [];
    const result = await fixtureRepo.bulkUpsert(fixtures);

    await this._logSync('fixtures', 'synced', result.total);

    logger.info({ ...result }, 'Fixtures sync completed');
    return result;
  }

  async syncByRound(round) {
    logger.info({ round }, 'Syncing fixtures by round...');

    const { data } = await apiFootball.getFixturesByRound(round);

    const fixtures = data.response || [];
    const result = await fixtureRepo.bulkUpsert(fixtures);

    await this._logSync(`fixtures:round:${round}`, 'synced', result.total);

    logger.info({ round, ...result }, 'Round sync completed');
    return result;
  }

  async syncSingle(id) {
    logger.info({ fixtureId: id }, 'Syncing single fixture...');

    const { data } = await apiFootball.getFixtureById(id);
    const fixture = data.response?.[0];
    if (!fixture) throw new Error(`Fixture ${id} not found in API-Football`);

    const result = await fixtureRepo.upsert(fixture);

    await this._logSync(`fixture:${id}`, 'synced', 1);

    return result;
  }

  async checkForLiveUpdates() {
    const result = await pool.query(`
      SELECT id, date FROM fixtures
      WHERE date BETWEEN NOW() - INTERVAL '4 hours' AND NOW() + INTERVAL '10 minutes'
        AND status NOT IN ('match finished', 'cancelled', 'postponed')
    `);

    for (const row of result.rows) {
      try {
        const updated = await this.syncSingle(row.id);
        if (updated.status === 'match finished') {
          logger.info({ fixtureId: row.id }, 'Fixture finished, triggering fantasy calc');
          const fantasyEngine = require('./fantasyEngine');
          await fantasyEngine.calculatePoints(row.id);
        }
      } catch (err) {
        logger.error({ fixtureId: row.id, err }, 'Live sync failed');
      }
    }
  }

  async _logSync(entity, status, count) {
    await pool.query(
      `INSERT INTO sync_log (entity, status, rows_inserted, meta, synced_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [entity, status, count, JSON.stringify({ timestamp: new Date().toISOString() })]
    );
  }
}

module.exports = new FixtureSyncService();
```

---

## 7. Controlador — `controllers/fixtureController.js`

```javascript
const fixtureService = require('../services/fixtureService');
const fixtureSyncService = require('../services/fixtureSyncService');
const cacheService = require('../services/cacheService');

class FixtureController {
  async list(req, res, next) {
    try {
      const result = await fixtureService.list(req.query);

      res.json({
        success: true,
        data: result.fixtures,
        meta: {
          ...result.meta,
          cache: {
            fresh: await cacheService.isFresh('fixtures'),
            synced_at: new Date().toISOString(),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const fixture = await fixtureService.getById(parseInt(req.params.id));

      if (!fixture) {
        return res.status(404).json({
          success: false,
          error: { code: 'FIXTURE_NOT_FOUND', message: 'Partido no encontrado' },
        });
      }

      res.json({
        success: true,
        data: fixture,
        meta: {
          cache: {
            fresh: fixture._cache.fresh,
            synced_at: fixture.updated_at,
            expires_at: fixture.cache_until,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getLive(req, res, next) {
    try {
      const fixtures = await fixtureService.getLive();

      res.json({
        success: true,
        data: fixtures,
        meta: {
          count: fixtures.length,
          refreshed_at: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async syncFixtures(req, res, next) {
    try {
      const result = await fixtureSyncService.syncAll();
      res.json({
        success: true,
        data: result,
        meta: { synced_at: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }

  async syncRound(req, res, next) {
    try {
      const result = await fixtureSyncService.syncByRound(req.params.round);
      res.json({
        success: true,
        data: result,
        meta: { round: req.params.round, synced_at: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FixtureController();
```

---

## 8. Rutas — `routes/fixtures.js`

```javascript
const { Router } = require('express');
const controller = require('../controllers/fixtureController');
const { validate } = require('../middleware/validate');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { generalLimiter, syncLimiter } = require('../middleware/rateLimiter');
const { listFixturesSchema, fixtureParamsSchema } = require('../validators/fixtureSchema');

const router = Router();

// ── Públicas ──────────────────────────────────────────────
router.get(
  '/',
  generalLimiter,
  validate(listFixturesSchema),
  controller.list,
);

router.get(
  '/live',
  generalLimiter,
  controller.getLive,
);

router.get(
  '/:id',
  generalLimiter,
  validate(fixtureParamsSchema),
  controller.getById,
);

// ── Admin (Sync) ───────────────────────────────────────────
router.post(
  '/sync',
  requireAuth,
  requireAdmin,
  syncLimiter,
  controller.syncFixtures,
);

router.post(
  '/sync/round/:round',
  requireAuth,
  requireAdmin,
  syncLimiter,
  controller.syncRound,
);

module.exports = router;
```

### Registro en `routes/index.js`

```javascript
const fixturesRouter = require('./fixtures');
router.use('/api/fixtures', fixturesRouter);
```

---

## 9. Scheduler — `jobs/fixtureScheduler.js`

```javascript
const cron = require('node-cron');
const fixtureSyncService = require('../services/fixtureSyncService');
const { logger } = require('../utils/logger');

class FixtureScheduler {
  start() {
    // Cada 15 min: verificar actualizaciones de partidos en ventana activa
    cron.schedule('*/15 * * * *', async () => {
      logger.info('Cron: checking for live fixture updates...');
      try {
        await fixtureSyncService.checkForLiveUpdates();
      } catch (err) {
        logger.error({ err }, 'Live fixture update check failed');
      }
    });

    // Cada día 06:00 UTC: sync completo de fixtures
    cron.schedule('0 6 * * *', async () => {
      logger.info('Cron: daily full fixture sync...');
      try {
        await fixtureSyncService.syncAll();
      } catch (err) {
        logger.error({ err }, 'Daily fixture sync failed');
      }
    });

    logger.info('Fixture scheduler started');
  }
}

module.exports = new FixtureScheduler();
```

---

## 10. Política de Caché

| Estado del fixture | TTL | Comportamiento |
|---|---|---|
| `scheduled` | 6h | Se refresa en cada sync programado |
| `live` / `1st Half` / etc. | 15min | Se actualiza cada tick del scheduler |
| `match finished` | ∞ (permanente) | No se vuelve a consultar API |
| `cancelled` / `postponed` | 24h | Se reintenta al día siguiente |

---

## 11. Respuestas de Ejemplo

### `GET /api/fixtures?date=2026-06-14&page=1&per_page=2`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "round": "Group Stage - 1",
      "date": "2026-06-14T16:00:00+00:00",
      "status": "scheduled",
      "venue": "Estadio Azteca",
      "home_score": null,
      "away_score": null,
      "stage": "Group Stage - 1",
      "cache_until": "2026-06-14T22:00:00+00:00",
      "updated_at": "2026-06-13T06:00:00+00:00",
      "home_team": { "id": 1, "name": "México", "logo": "https://..." },
      "away_team": { "id": 2, "name": "Brasil", "logo": "https://..." }
    },
    {
      "id": 2,
      "round": "Group Stage - 1",
      "date": "2026-06-14T19:00:00+00:00",
      "status": "scheduled",
      "venue": "Estadio Monumental",
      "home_score": null,
      "away_score": null,
      "stage": "Group Stage - 1",
      "cache_until": "2026-06-14T22:00:00+00:00",
      "updated_at": "2026-06-13T06:00:00+00:00",
      "home_team": { "id": 3, "name": "Argentina", "logo": "https://..." },
      "away_team": { "id": 4, "name": "Uruguay", "logo": "https://..." }
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 2,
    "total": 104,
    "total_pages": 52,
    "cache": {
      "fresh": true,
      "synced_at": "2026-06-14T06:00:00.000Z"
    }
  }
}
```

### `GET /api/fixtures/live`

```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "round": "Group Stage - 3",
      "date": "2026-06-22T21:00:00+00:00",
      "status": "2nd Half",
      "venue": "Maracanã",
      "home_score": 2,
      "away_score": 1,
      "stage": "Group Stage - 3",
      "home_team": { "id": 10, "name": "España", "logo": "https://..." },
      "away_team": { "id": 12, "name": "Alemania", "logo": "https://..." }
    }
  ],
  "meta": {
    "count": 1,
    "refreshed_at": "2026-06-22T21:47:00.000Z"
  }
}
```

### `GET /api/fixtures/45`

```json
{
  "success": true,
  "data": {
    "id": 45,
    "round": "Group Stage - 3",
    "date": "2026-06-22T21:00:00+00:00",
    "status": "2nd Half",
    "venue": "Maracanã",
    "home_score": 2,
    "away_score": 1,
    "stage": "Group Stage - 3",
    "cache_until": "2026-06-23T03:00:00+00:00",
    "updated_at": "2026-06-22T21:47:00+00:00",
    "home_team": { "id": 10, "name": "España", "logo": "https://..." },
    "away_team": { "id": 12, "name": "Alemania", "logo": "https://..." },
    "statistics": [
      {
        "team_id": 10,
        "shots": 14,
        "shots_on_target": 6,
        "possession": 58,
        "total_passes": 520,
        "accurate_passes": 460,
        "fouls": 8,
        "corners": 7,
        "offsides": 2,
        "yellow_cards": 1,
        "red_cards": 0,
        "saves": 3
      },
      {
        "team_id": 12,
        "shots": 9,
        "shots_on_target": 4,
        "possession": 42,
        "total_passes": 380,
        "accurate_passes": 310,
        "fouls": 12,
        "corners": 4,
        "offsides": 3,
        "yellow_cards": 3,
        "red_cards": 0,
        "saves": 4
      }
    ],
    "events": [
      {
        "team_id": 10,
        "player_id": 101,
        "event_type": "Goal",
        "detail": "Left-footed shot",
        "minute": 23,
        "extra_minute": 0
      },
      {
        "team_id": 12,
        "player_id": 204,
        "event_type": "Goal",
        "detail": "Header",
        "minute": 41,
        "extra_minute": 0
      },
      {
        "team_id": 10,
        "player_id": 105,
        "event_type": "Goal",
        "detail": "Penalty",
        "minute": 67,
        "extra_minute": 0
      },
      {
        "team_id": 12,
        "player_id": 207,
        "event_type": "Card",
        "detail": "Yellow Card",
        "minute": 73,
        "extra_minute": 0
      }
    ],
    "player_stats": [
      {
        "player_id": 101,
        "team_id": 10,
        "rating": 8.2,
        "minutes_played": 90,
        "position": "Midfielder",
        "goals": 1,
        "assists": 0,
        "shots": 3,
        "key_passes": 4,
        "passes": 62,
        "tackles": 2,
        "fouls": 1
      }
    ],
    "_cache": { "fresh": false }
  },
  "meta": {
    "cache": {
      "fresh": false,
      "synced_at": "2026-06-22T21:47:00+00:00",
      "expires_at": "2026-06-23T03:00:00+00:00"
    }
  }
}
```

### `POST /api/sync/fixtures` (Admin)

```json
{
  "success": true,
  "data": {
    "inserted": 0,
    "updated": 104,
    "total": 104
  },
  "meta": {
    "synced_at": "2026-06-14T06:00:00.000Z"
  }
}
```

---

## 12. Filtros Disponibles

| Parámetro | Tipo | Ejemplo | Descripción |
|-----------|------|---------|-------------|
| `page` | number | `1` | Número de página (default: 1) |
| `per_page` | number | `20` | Items por página (max: 100) |
| `date` | string | `2026-06-14` | Filtra por fecha exacta |
| `team_id` | number | `10` | Partidos de un equipo específico |
| `round` | string | `Group Stage - 1` | Filtra por ronda |
| `status` | enum | `live` | `scheduled`, `live`, `match finished`, etc. |
| `search` | string | `Brasil` | Búsqueda por nombre de equipo |

---

## 13. Budget de Requests (Fixtures)

| Operación | Requests API | Frecuencia |
|-----------|-------------|------------|
| Sync completo (104 fixtures) | 1 | Diario 06:00 UTC |
| Sync por ronda | 1 | Bajo demanda (admin) |
| Sync single fixture | 1 | Cada 15 min si está en ventana activa |
| Check live (sin cambios) | 0 (solo DB) | Cada 15 min |
| Check live (1 partido vivo) | 1 | Cada 15 min |

**Consumo diario estimado (día con 4 partidos):** 1 (sync diario) + 4×4 (15min ticks) = ~17 requests
