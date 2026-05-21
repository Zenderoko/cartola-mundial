# 🏆 Módulo de Equipos y Tabla de Posiciones — Cartola Mundialera

> API de equipos, plantillas y standings del Mundial FIFA 2026
> Basada en API-Football v3 (plan FREE: 100 req/día, 10 req/min)
> World Cup 2026: `league_id=1`, `season=2026`, 48 equipos

---

## 1. Endpoints

### Teams

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/teams` | Lista de equipos con filtros | Público |
| `GET` | `/api/teams/:id` | Detalle del equipo + plantilla | Público |
| `GET` | `/api/teams/:id/stats` | Estadísticas agregadas del equipo en el torneo | Público |

### Standings

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/standings` | Tabla de posiciones por grupo | Público |

---

## 2. Parámetros

### GET /api/teams

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `group` | string | — | Filtrar por grupo (ej: `Group A`) |
| `search` | string | — | Buscar por nombre de equipo |
| `page` | int | `1` | Número de página |
| `per_page` | int | `48` | Items por página (max 48) |

### GET /api/standings

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `group` | string | — | Filtrar por grupo específico |

---

## 3. Respuestas

### Lista de equipos

```json
{
  "success": true,
  "data": [
    {
      "id": 9,
      "name": "Brazil",
      "code": "BRA",
      "country": "Brazil",
      "logo": "https://media.api-sports.io/football/teams/9.png",
      "group_name": "Group A",
      "fifa_rank": 5
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 48,
    "total": 48,
    "total_pages": 1
  }
}
```

### Detalle del equipo + plantilla

```json
{
  "success": true,
  "data": {
    "id": 9,
    "name": "Brazil",
    "code": "BRA",
    "country": "Brazil",
    "logo": "https://...",
    "group_name": "Group A",
    "fifa_rank": 5,
    "squad": [
      {
        "id": 275,
        "name": "Vinicius Junior",
        "position": "Attacker",
        "age": 25,
        "nationality": "Brazil",
        "height": 176,
        "weight": 73,
        "photo": "https://...",
        "number": 7
      },
      {
        "id": 301,
        "name": "Alisson Becker",
        "position": "Goalkeeper",
        "age": 33,
        "nationality": "Brazil",
        "height": 193,
        "weight": 91,
        "photo": "https://...",
        "number": 1
      }
    ]
  },
  "meta": {
    "squad_size": 26
  }
}
```

### Estadísticas del equipo

```json
{
  "success": true,
  "data": {
    "team_id": 9,
    "team_name": "Brazil",
    "logo": "https://...",
    "played": 3,
    "wins": 2,
    "draws": 1,
    "losses": 0,
    "goals_for": 7,
    "goals_against": 2,
    "goal_difference": 5,
    "clean_sheets": 1,
    "top_scorer": {
      "player_id": 275,
      "name": "Vinicius Junior",
      "goals": 3
    },
    "top_assist": {
      "player_id": 310,
      "name": "Neymar",
      "assists": 2
    },
    "average_possession": 61.3,
    "average_rating": 7.2,
    "cards": {
      "yellow": 4,
      "red": 0
    }
  }
}
```

### Tabla de posiciones

```json
{
  "success": true,
  "data": [
    {
      "group_name": "Group A",
      "standings": [
        {
          "position": 1,
          "team_id": 9,
          "team_name": "Brazil",
          "logo": "https://...",
          "played": 3,
          "wins": 3,
          "draws": 0,
          "losses": 0,
          "goals_for": 9,
          "goals_against": 1,
          "goal_diff": 8,
          "points": 9,
          "form": "WWW"
        },
        {
          "position": 2,
          "team_id": 17,
          "team_name": "Serbia",
          "logo": "https://...",
          "played": 3,
          "wins": 1,
          "draws": 1,
          "losses": 1,
          "goals_for": 3,
          "goals_against": 4,
          "goal_diff": -1,
          "points": 4,
          "form": "WDL"
        }
      ]
    }
  ]
}
```

---

## 4. Estructura de Archivos

```
server/src/
├── config/
│   ├── env.js                        (ya existe)
│   ├── database.js                   (ya existe)
│   └── apiFootball.js                (ya existe)
│
├── middleware/
│   ├── errorHandler.js               (ya existe)
│   ├── validate.js                   (ya existe)
│   └── rateLimiter.js                (ya existe)
│
├── routes/
│   ├── teams.js                      Teams routes
│   └── standings.js                  Standings routes
│
├── controllers/
│   ├── teamController.js             Team handlers
│   └── standingController.js         Standing handlers
│
├── services/
│   ├── apiFootball.js                (ya existe — se reusa)
│   ├── rateLimiter.js                (ya existe — se reusa)
│   ├── syncService.js                (ya existe — se extiende)
│   └── cacheService.js               (ya existe — se reusa)
│
├── repositories/
│   ├── teamRepo.js                   Team DB queries
│   └── standingRepo.js               Standing DB queries
│
├── validators/
│   ├── teamSchema.js                 Zod schemas equipos
│   └── standingSchema.js             Zod schemas standings
│
├── jobs/
│   ├── syncScheduler.js              (ya existe — se extiende)
│
└── utils/
    ├── response.js                   (ya existe)
    ├── logger.js                     (ya existe)
    └── dateHelpers.js                (ya existe)
```

---

## 5. Código Completo

### Validators

#### `server/src/validators/teamSchema.js`

```javascript
const { z } = require('zod');

const teamQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(48).default(48),
  group: z.string().optional(),
  search: z.string().max(100).optional(),
});

const teamParamsSchema = z.object({
  id: z.coerce.number().int().positive('Team ID must be a positive integer'),
});

module.exports = { teamQuerySchema, teamParamsSchema };
```

#### `server/src/validators/standingSchema.js`

```javascript
const { z } = require('zod');

const standingQuerySchema = z.object({
  group: z.string().optional(),
});

module.exports = { standingQuerySchema };
```

---

### Repositories

#### `server/src/repositories/teamRepo.js`

```javascript
const { pool } = require('../config/database');

class TeamRepo {

  async findAll({ group, search, page = 1, perPage = 48 }) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (group) {
      conditions.push(`t.group_name = $${idx}`);
      params.push(group);
      idx++;
    }
    if (search) {
      conditions.push(`t.name ILIKE $${idx}`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const offset = (page - 1) * perPage;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM teams t ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT t.id, t.name, t.code, t.country, t.logo,
        t.group_name, t.fifa_rank
      FROM teams t
      ${where}
      ORDER BY t.group_name, t.name
      LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, perPage, offset]
    );

    return { rows: result.rows, total };
  }

  async findById(id) {
    const result = await pool.query(
      `SELECT * FROM teams WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getSquad(teamId) {
    const result = await pool.query(
      `SELECT id, name, position, age, nationality,
        height, weight, photo, number
      FROM players
      WHERE team_id = $1
      ORDER BY
        CASE position
          WHEN 'Goalkeeper' THEN 1
          WHEN 'Defender' THEN 2
          WHEN 'Midfielder' THEN 3
          WHEN 'Attacker' THEN 4
          ELSE 5
        END,
        number ASC NULLS LAST`,
      [teamId]
    );
    return result.rows;
  }

  async getTeamStats(teamId) {
    const result = await pool.query(
      `SELECT
        COUNT(DISTINCT f.id) AS played,
        COUNT(DISTINCT f.id) FILTER (
          WHERE (f.home_team_id = $1 AND f.home_score > f.away_score)
             OR (f.away_team_id = $1 AND f.away_score > f.home_score)
        ) AS wins,
        COUNT(DISTINCT f.id) FILTER (
          WHERE f.home_score = f.away_score
            AND (f.home_team_id = $1 OR f.away_team_id = $1)
        ) AS draws,
        COUNT(DISTINCT f.id) FILTER (
          WHERE (f.home_team_id = $1 AND f.home_score < f.away_score)
             OR (f.away_team_id = $1 AND f.away_score < f.home_score)
        ) AS losses,
        COALESCE(SUM(
          CASE WHEN f.home_team_id = $1 THEN f.home_score ELSE f.away_score END
        ), 0) AS goals_for,
        COALESCE(SUM(
          CASE WHEN f.home_team_id = $1 THEN f.away_score ELSE f.home_score END
        ), 0) AS goals_against,
        COUNT(DISTINCT f.id) FILTER (
          WHERE (f.home_team_id = $1 AND f.away_score = 0)
             OR (f.away_team_id = $1 AND f.home_score = 0)
        ) AS clean_sheets,
        COALESCE(AVG(fs.possession), 0) AS average_possession,
        COALESCE(AVG(ps.rating), 0) AS average_rating,
        COALESCE(SUM(fs.yellow_cards), 0) AS yellow_cards,
        COALESCE(SUM(fs.red_cards), 0) AS red_cards
      FROM fixtures f
      LEFT JOIN fixture_stats fs ON fs.fixture_id = f.id AND fs.team_id = $1
      LEFT JOIN player_stats ps ON ps.fixture_id = f.id AND ps.team_id = $1
      WHERE (f.home_team_id = $1 OR f.away_team_id = $1)
        AND f.status = 'match finished'`,
      [teamId]
    );

    const base = result.rows[0];
    if (!base || !base.played) return null;

    return {
      team_id: teamId,
      played: parseInt(base.played),
      wins: parseInt(base.wins),
      draws: parseInt(base.draws),
      losses: parseInt(base.losses),
      goals_for: parseInt(base.goals_for),
      goals_against: parseInt(base.goals_against),
      goal_difference: parseInt(base.goals_for) - parseInt(base.goals_against),
      clean_sheets: parseInt(base.clean_sheets),
      average_possession: parseFloat(base.average_possession).toFixed(1),
      average_rating: parseFloat(base.average_rating).toFixed(2),
      cards: {
        yellow: parseInt(base.yellow_cards),
        red: parseInt(base.red_cards),
      },
    };
  }

  async getTopScorer(teamId) {
    const result = await pool.query(
      `SELECT p.id AS player_id, p.name,
        COALESCE(SUM(ps.goals), 0) AS goals
      FROM players p
      JOIN player_stats ps ON ps.player_id = p.id
      JOIN fixtures f ON f.id = ps.fixture_id
      WHERE p.team_id = $1 AND f.status = 'match finished'
      GROUP BY p.id, p.name
      ORDER BY goals DESC
      LIMIT 1`,
      [teamId]
    );
    return result.rows[0] || null;
  }

  async getTopAssist(teamId) {
    const result = await pool.query(
      `SELECT p.id AS player_id, p.name,
        COALESCE(SUM(ps.assists), 0) AS assists
      FROM players p
      JOIN player_stats ps ON ps.player_id = p.id
      JOIN fixtures f ON f.id = ps.fixture_id
      WHERE p.team_id = $1 AND f.status = 'match finished'
      GROUP BY p.id, p.name
      ORDER BY assists DESC
      LIMIT 1`,
      [teamId]
    );
    return result.rows[0] || null;
  }

  async upsert(team) {
    const t = team.team || team;

    await pool.query(
      `INSERT INTO teams (id, name, code, country, logo, group_name, fifa_rank, cache_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '30 days')
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         code = EXCLUDED.code,
         country = EXCLUDED.country,
         logo = EXCLUDED.logo,
         group_name = EXCLUDED.group_name,
         fifa_rank = EXCLUDED.fifa_rank,
         updated_at = NOW()
       RETURNING (xmax = 0) AS inserted`,
      [
        t.id, t.name, t.code || null,
        t.country || null, t.logo || null,
        null, null,
      ]
    );
    return { action: result.rows[0]?.inserted ? 'inserted' : 'updated' };
  }

  async upsertMany(teams) {
    let inserted = 0, updated = 0;
    for (const team of teams) {
      const r = await this.upsert(team);
      if (r.action === 'inserted') inserted++;
      else updated++;
    }
    return { inserted, updated };
  }

  async saveSquad(teamId, players) {
    let inserted = 0, updated = 0;
    for (const player of players) {
      const result = await pool.query(
        `INSERT INTO players (id, team_id, name, position, age,
           nationality, height, weight, photo, number, cache_until)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                 NOW() + INTERVAL '30 days')
         ON CONFLICT (id) DO UPDATE SET
           team_id = EXCLUDED.team_id,
           number = EXCLUDED.number,
           updated_at = NOW()
         RETURNING (xmax = 0) AS inserted`,
        [
          player.id, teamId, player.name,
          player.position || null, player.age || null,
          player.nationality || null,
          player.height || null, player.weight || null,
          player.photo || null, player.number || null,
        ]
      );
      if (result.rows[0]?.inserted) inserted++;
      else updated++;
    }
    return { inserted, updated, total: players.length };
  }

  async getDistinctGroups() {
    const result = await pool.query(
      `SELECT DISTINCT group_name FROM teams
       WHERE group_name IS NOT NULL
       ORDER BY group_name`
    );
    return result.rows.map((r) => r.group_name);
  }

  async getTotalCount() {
    const result = await pool.query('SELECT COUNT(*) FROM teams');
    return parseInt(result.rows[0].count);
  }
}

module.exports = new TeamRepo();
```

#### `server/src/repositories/standingRepo.js`

```javascript
const { pool } = require('../config/database');

class StandingRepo {

  async findAll(groupFilter) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (groupFilter) {
      conditions.push(`s.group_name = $${idx}`);
      params.push(groupFilter);
      idx++;
    }

    const where = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const result = await pool.query(
      `SELECT s.id, s.group_name, s.position, s.played,
        s.wins, s.draws, s.losses, s.gf, s.ga, s.gd,
        s.points, s.form,
        t.id AS team_id, t.name AS team_name,
        t.logo, t.code
      FROM standings s
      JOIN teams t ON t.id = s.team_id
      ${where}
      ORDER BY s.group_name, s.position ASC`,
      params
    );

    const grouped = {};
    for (const row of result.rows) {
      if (!grouped[row.group_name]) {
        grouped[row.group_name] = [];
      }
      grouped[row.group_name].push({
        position: row.position,
        team_id: row.team_id,
        team_name: row.team_name,
        logo: row.logo,
        code: row.code,
        played: row.played,
        wins: row.wins,
        draws: row.draws,
        losses: row.losses,
        goals_for: row.gf,
        goals_against: row.ga,
        goal_diff: row.gd,
        points: row.points,
        form: row.form,
      });
    }

    return Object.entries(grouped).map(([group_name, standings]) => ({
      group_name,
      standings,
    }));
  }

  async findByTeam(teamId) {
    const result = await pool.query(
      `SELECT s.*, t.name AS team_name, t.logo, t.code
      FROM standings s
      JOIN teams t ON t.id = s.team_id
      WHERE s.team_id = $1`,
      [teamId]
    );
    return result.rows[0] || null;
  }

  async upsertMany(apiStandings) {
    let inserted = 0, updated = 0;
    for (const group of apiStandings) {
      for (const row of group) {
        const groupName = row.group?.name || group[0]?.group || 'Unknown';
        const result = await pool.query(
          `INSERT INTO standings (group_name, team_id, position, played,
             wins, draws, losses, gf, ga, gd, points, form, cache_until)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                   NOW() + INTERVAL '6 hours')
           ON CONFLICT (group_name, team_id) DO UPDATE SET
             position = EXCLUDED.position,
             played = EXCLUDED.played,
             wins = EXCLUDED.wins,
             draws = EXCLUDED.draws,
             losses = EXCLUDED.losses,
             gf = EXCLUDED.gf,
             ga = EXCLUDED.ga,
             gd = EXCLUDED.gd,
             points = EXCLUDED.points,
             form = EXCLUDED.form,
             updated_at = NOW()
           RETURNING (xmax = 0) AS inserted`,
          [
            groupName,
            row.team.id,
            row.position,
            row.all?.played || 0,
            row.all?.win || 0,
            row.all?.draw || 0,
            row.all?.lose || 0,
            row.all?.goals?.for || 0,
            row.all?.goals?.against || 0,
            row.goalsDiff || 0,
            row.points || 0,
            row.form || null,
          ]
        );
        if (result.rows[0]?.inserted) inserted++;
        else updated++;
      }
    }
    return { inserted, updated };
  }
}

module.exports = new StandingRepo();
```

---

### Services

#### Extensiones a `server/src/services/syncService.js`

Agregar estos métodos al `SyncService` existente:

```javascript
  // ── Sync equipos ──────────────────────────────────────────
  async syncAllTeams() {
    logger.info('Syncing all teams for WC 2026...');
    const { data } = await apiFootball.getTeams();
    const teams = data.response || [];

    const { inserted, updated } = await teamRepo.upsertMany(teams);

    // Extraer group_name de la información de la liga
    const competition = data.response?.[0]?.team?.competition || null;
    if (competition?.groups) {
      for (const team of teams) {
        const groupName = competition.groups[team.team.id] || null;
        if (groupName) {
          await pool.query(
            'UPDATE teams SET group_name = $1 WHERE id = $2',
            [groupName, team.team.id]
          );
        }
      }
    }

    await this._logSync('teams', 'synced', teams.length);
    logger.info({ total: teams.length, inserted, updated }, 'Teams synced');
    return { total: teams.length, inserted, updated };
  }

  // ── Sync squad de un equipo ────────────────────────────────
  async syncSquad(teamId) {
    logger.info({ teamId }, 'Syncing squad');
    const { data } = await apiFootball.getSquadByTeam(teamId);
    const players = data.response?.[0]?.players || [];

    const result = await teamRepo.saveSquad(teamId, players);

    await this._logSync(`squad:${teamId}`, 'synced', players.length);
    logger.info({ teamId, ...result }, 'Squad synced');
    return { teamId, ...result };
  }

  // ── Sync todos los squads (48 equipos) ─────────────────────
  async syncAllSquads() {
    logger.info('Syncing all 48 squads...');
    const teams = await pool.query('SELECT id FROM teams');
    let total = 0, totalInserted = 0, totalUpdated = 0;

    for (const team of teams.rows) {
      try {
        const result = await this.syncSquad(team.id);
        total += result.total;
        totalInserted += result.inserted;
        totalUpdated += result.updated;
      } catch (err) {
        logger.error({ teamId: team.id, err: err.message }, 'Failed to sync squad');
      }
    }

    await this._logSync('squads:all', 'synced', total);
    logger.info({ teams: teams.rows.length, total, totalInserted, totalUpdated }, 'All squads synced');
    return { teams: teams.rows.length, total, totalInserted, totalUpdated };
  }

  // ── Sync tabla de posiciones ───────────────────────────────
  async syncStandings() {
    logger.info('Syncing standings...');
    const { data } = await apiFootball.getStandings();
    const leagueStandings = data.response?.[0]?.league?.standings || [];

    const { inserted, updated } = await standingRepo.upsertMany(leagueStandings);

    // Sincronizar group_name en teams si no existe
    for (const group of leagueStandings) {
      const groupName = group[0]?.group?.name || group[0]?.group || 'Unknown';
      for (const row of group) {
        await pool.query(
          `UPDATE teams SET group_name = COALESCE(group_name, $1)
           WHERE id = $2 AND group_name IS NULL`,
          [groupName, row.team.id]
        );
      }
    }

    await this._logSync('standings', 'synced', leagueStandings.length);
    logger.info({ groups: leagueStandings.length, inserted, updated }, 'Standings synced');
    return { groups: leagueStandings.length, inserted, updated };
  }

  // ── Sync completo pre-torneo ───────────────────────────────
  async syncPreSeed() {
    logger.info('=== PRE-SEED START ===');

    const teamsResult = await this.syncAllTeams();
    const standingsResult = await this.syncStandings();
    const squadsResult = await this.syncAllSquads();

    logger.info('=== PRE-SEED COMPLETE ===');
    return { teams: teamsResult, standings: standingsResult, squads: squadsResult };
  }
```

#### `server/src/services/rankingService.js`

```javascript
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

class RankingService {
  async refreshAll() {
    try {
      await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ranking_global');
      await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ranking_by_round');
      logger.info('Materialized views refreshed');
      return { success: true };
    } catch (err) {
      logger.error({ err }, 'Failed to refresh materialized views');
      throw err;
    }
  }
}

module.exports = new RankingService();
```

---

### Controllers

#### `server/src/controllers/teamController.js`

```javascript
const teamRepo = require('../repositories/teamRepo');
const { success, paginated, error } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const { page, per_page, group, search } = req.query;

    const { rows, total } = await teamRepo.findAll({
      group: group || undefined,
      search: search || undefined,
      page,
      perPage: per_page,
    });

    return paginated(res, rows, { page, perPage: per_page, total });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;

    const team = await teamRepo.findById(id);
    if (!team) {
      return error(res, 404, 'NOT_FOUND', `Team ${id} not found`);
    }

    const squad = await teamRepo.getSquad(id);

    return success(res, {
      ...team,
      squad,
    }, { squad_size: squad.length });
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const { id } = req.params;

    const team = await teamRepo.findById(id);
    if (!team) {
      return error(res, 404, 'NOT_FOUND', `Team ${id} not found`);
    }

    const [stats, topScorer, topAssist] = await Promise.all([
      teamRepo.getTeamStats(id),
      teamRepo.getTopScorer(id),
      teamRepo.getTopAssist(id),
    ]);

    if (!stats) {
      return success(res, {
        team_id: Number(id),
        team_name: team.name,
        logo: team.logo,
        played: 0,
        message: 'No matches played yet',
      });
    }

    return success(res, {
      ...stats,
      team_name: team.name,
      logo: team.logo,
      top_scorer: topScorer,
      top_assist: topAssist,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, getStats };
```

#### `server/src/controllers/standingController.js`

```javascript
const standingRepo = require('../repositories/standingRepo');
const { success } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const { group } = req.query;
    const standings = await standingRepo.findAll(group || undefined);
    return success(res, standings);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll };
```

---

### Rutas

#### `server/src/routes/teams.js`

```javascript
const { Router } = require('express');
const controller = require('../controllers/teamController');
const { validateQuery, validateParams } = require('../middleware/validate');
const { teamQuerySchema, teamParamsSchema } = require('../validators/teamSchema');

const router = Router();

router.get('/',        validateQuery(teamQuerySchema), controller.getAll);
router.get('/:id',     validateParams(teamParamsSchema), controller.getById);
router.get('/:id/stats', validateParams(teamParamsSchema), controller.getStats);

module.exports = router;
```

#### `server/src/routes/standings.js`

```javascript
const { Router } = require('express');
const controller = require('../controllers/standingController');
const { validateQuery } = require('../middleware/validate');
const { standingQuerySchema } = require('../validators/standingSchema');

const router = Router();

router.get('/', validateQuery(standingQuerySchema), controller.getAll);

module.exports = router;
```

---

### Registro de rutas en `app.js`

Agregar al archivo `server/src/app.js` existente:

```javascript
// Al inicio del archivo, junto a los otros requires:
const teamsRouter = require('./routes/teams');
const standingsRouter = require('./routes/standings');

// Después de app.use('/api/fixtures', fixturesRouter):
app.use('/api/teams', teamsRouter);
app.use('/api/standings', standingsRouter);
```

---

### Extensiones al Scheduler

Agregar al `server/src/jobs/syncScheduler.js` existente:

```javascript
// En el método start(), junto a los otros cron jobs:

// Cada día 06:00 UTC: sync standings post-matchday
cron.schedule('30 6 * * *', async () => {
  logger.info('Cron: daily standings sync...');
  try {
    await syncService.syncStandings();
  } catch (err) {
    logger.error({ err }, 'Cron: standings sync failed');
  }
});
```

---

## 6. Sync Pipeline

### Diagrama de sincronización

```
Pre-seed (1-2 días antes del torneo — ~53 requests)
  └─ syncPreSeed()
       ├─ syncAllTeams()      → GET /teams?league=1&season=2026       → 1 req
       ├─ syncStandings()     → GET /standings?league=1&season=2026   → 1 req
       └─ syncAllSquads()     → GET /players/squads?team=X  ×48      → 48 req

Post-matchday (22:00 UTC)
  └─ syncStandings()          → GET /standings?league=1&season=2026   → 1 req
  └─ REFRESH MATERIALIZED VIEW mv_ranking_global

Diario 06:00 UTC
  └─ syncAllFixtures()        (ya existente)
  └─ syncStandings()          → 1 req (confirmar cambios)

On-demand (admin)
  └─ POST /api/sync/teams     → syncAllTeams()
  └─ POST /api/sync/squads    → syncAllSquads()  (cuidado: 48 req!)
  └─ POST /api/sync/standings → syncStandings()
  └─ POST /api/sync/pre-seed  → syncPreSeed()
```

### Budget pre-seed

| Operación | Requests |
|-----------|----------|
| GET /teams | 1 |
| GET /standings | 1 |
| GET /players/squads (×48) | 48 |
| GET /fixtures | 1 |
| GET /fixtures/rounds | 1 |
| GET /players/topscorers | 1 |
| GET /players/topassists | 1 |
| **Total pre-seed** | **~53** |
| **Restante para el torneo** | **47** (de 100) |

---

## 7. Cache Strategy

| Entidad | TTL | Condición |
|---------|-----|-----------|
| `teams` | 30 días | Cambia solo si hay lesiones de última hora |
| `players` (squad) | 30 días | Idem, se sincroniza pre-torneo |
| `standings` | 6 horas | Se actualiza post-matchday |
| `fixtures` | 6h / ∞ | Programado: 6h / Finalizado: permanente |

---

## 8. Ejemplos de Uso

### Listar todos los equipos

```bash
curl "http://localhost:3001/api/teams"
```

### Equipos por grupo

```bash
curl "http://localhost:3001/api/teams?group=Group+A"
```

### Buscar equipo por nombre

```bash
curl "http://localhost:3001/api/teams?search=brazil"
```

### Detalle del equipo + plantilla

```bash
curl "http://localhost:3001/api/teams/9"
```

### Estadísticas agregadas del equipo

```bash
curl "http://localhost:3001/api/teams/9/stats"
```

### Tabla de posiciones completa

```bash
curl "http://localhost:3001/api/standings"
```

### Tabla de un grupo específico

```bash
curl "http://localhost:3001/api/standings?group=Group+A"
```

### Sync pre-seed (admin)

```bash
curl -X POST "http://localhost:3001/api/sync/pre-seed" \
  -H "x-admin-key: admin-secret"
```

### Sync equipos manual (admin)

```bash
curl -X POST "http://localhost:3001/api/sync/teams" \
  -H "x-admin-key: admin-secret"
```

### Sync standings manual (admin)

```bash
curl -X POST "http://localhost:3001/api/sync/standings" \
  -H "x-admin-key: admin-secret"
```

---

## 9. SQL para Teams (migración 001)

```sql
-- 001_teams.sql
CREATE TABLE teams (
  id          INT PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT,
  country     TEXT,
  logo        TEXT,
  group_name  TEXT,
  fifa_rank   INT,
  cache_until TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_group ON teams(group_name);
CREATE INDEX idx_teams_code ON teams(code);
CREATE INDEX idx_teams_name ON teams(name);
```

## 10. SQL para Standings (migración 004)

```sql
-- 004_standings.sql
CREATE TABLE standings (
  id          SERIAL PRIMARY KEY,
  group_name  TEXT NOT NULL,
  team_id     INT NOT NULL REFERENCES teams(id),
  position    INT,
  played      INT DEFAULT 0,
  wins        INT DEFAULT 0,
  draws       INT DEFAULT 0,
  losses      INT DEFAULT 0,
  gf          INT DEFAULT 0,
  ga          INT DEFAULT 0,
  gd          INT DEFAULT 0,
  points      INT DEFAULT 0,
  form        TEXT,
  cache_until TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_name, team_id)
);

CREATE INDEX idx_standings_group ON standings(group_name);
CREATE INDEX idx_standings_points ON standings(points DESC);
CREATE INDEX idx_standings_team ON standings(team_id);
```
