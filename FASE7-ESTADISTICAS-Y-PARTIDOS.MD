# 📊 Módulo de Estadísticas y Jugadores — Cartola Mundialera

> API de jugadores, estadísticas individuales, rankings del Mundial FIFA 2026
> Basada en API-Football v3 (plan FREE: 100 req/día, 10 req/min)
> 48 equipos, ~700 jugadores, 104 partidos

---

## 1. Endpoints

### Jugadores

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/players` | Lista de jugadores con filtros | Público |
| `GET` | `/api/players/top` | Rankings: goleadores, asistencias, ratings | Público |
| `GET` | `/api/players/:id` | Perfil del jugador + historial por partido | Público |

### Detalle de Partido (sub-endpoints, datos desde DB local)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/fixtures/:id` | Detalle completo (stats + jugadores + eventos) — desde DB | Público |
| `GET` | `/api/fixtures/:id/players` | Stats detalladas de todos los jugadores del partido | Público |
| `GET` | `/api/fixtures/:id/stats` | Estadísticas por equipo del partido | Público |
| `GET` | `/api/fixtures/:id/events` | Timeline completo de eventos | Público |

---

## 2. Parámetros

### GET /api/players

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | int | `1` | Número de página |
| `per_page` | int | `50` | Items por página (max 200) |
| `team_id` | int | — | Filtrar por equipo |
| `position` | enum | — | `Goalkeeper`, `Defender`, `Midfielder`, `Attacker` |
| `search` | string | — | Buscar por nombre |
| `sort` | enum | `name_asc` | `name_asc`, `name_desc`, `rating_desc`, `goals_desc`, `assists_desc` |

### GET /api/players/top

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `type` | enum | `goals` | `goals`, `assists`, `rating`, `cards`, `saves` |
| `limit` | int | `20` | Máximo a retornar (max 50) |
| `team_id` | int | — | Filtrar por equipo |

---

## 3. Respuestas

### Lista de jugadores

```json
{
  "success": true,
  "data": [
    {
      "id": 275,
      "name": "Vinicius Junior",
      "position": "Attacker",
      "age": 25,
      "nationality": "Brazil",
      "height": 176,
      "weight": 73,
      "photo": "https://media.api-sports.io/football/players/275.png",
      "number": 7,
      "team": {
        "id": 9,
        "name": "Brazil",
        "logo": "https://...",
        "code": "BRA"
      },
      "statistics": {
        "goals": 3,
        "assists": 2,
        "rating": 8.5,
        "appearances": 4
      }
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 50,
    "total": 704,
    "total_pages": 15
  }
}
```

### Top goleadores

```json
{
  "success": true,
  "data": [
    {
      "position": 1,
      "player_id": 275,
      "player_name": "Vinicius Junior",
      "team_name": "Brazil",
      "team_logo": "https://...",
      "photo": "https://...",
      "goals": 5,
      "appearances": 4,
      "goals_per_match": 1.25,
      "rating": 8.7
    },
    {
      "position": 2,
      "player_id": 310,
      "player_name": "Kylian Mbappé",
      "team_name": "France",
      "team_logo": "https://...",
      "photo": "https://...",
      "goals": 4,
      "appearances": 3,
      "goals_per_match": 1.33,
      "rating": 8.9
    }
  ],
  "meta": {
    "type": "goals",
    "limit": 20,
    "total": 48
  }
}
```

### Perfil del jugador + historial

```json
{
  "success": true,
  "data": {
    "id": 275,
    "name": "Vinicius Junior",
    "position": "Attacker",
    "age": 25,
    "nationality": "Brazil",
    "height": 176,
    "weight": 73,
    "photo": "https://...",
    "number": 7,
    "team": {
      "id": 9,
      "name": "Brazil",
      "logo": "https://..."
    },
    "totals": {
      "appearances": 5,
      "minutes_played": 435,
      "goals": 3,
      "assists": 2,
      "shots": 14,
      "shots_on_target": 8,
      "key_passes": 9,
      "passes": 198,
      "pass_accuracy": 86.4,
      "tackles": 6,
      "fouls": 4,
      "fouls_drawn": 11,
      "yellow_cards": 1,
      "red_cards": 0,
      "man_of_the_match": 2,
      "average_rating": 8.3
    },
    "match_history": [
      {
        "fixture_id": 1200001,
        "round": "Group Stage - 1",
        "date": "2026-06-11T21:00:00+00:00",
        "against": { "id": 17, "name": "Serbia", "logo": "..." },
        "rating": 8.9,
        "minutes_played": 90,
        "goals": 1,
        "assists": 1,
        "shots": 4,
        "key_passes": 3,
        "man_of_the_match": true
      }
    ]
  },
  "meta": {
    "matches_played": 5
  }
}
```

### Player Stats de un partido

```json
{
  "success": true,
  "data": [
    {
      "team_id": 9,
      "team_name": "Brazil",
      "players": [
        {
          "player_id": 275,
          "player_name": "Vinicius Junior",
          "position": "Attacker",
          "photo": "https://...",
          "rating": 8.9,
          "minutes_played": 90,
          "goals": 1,
          "assists": 1,
          "shots": 4,
          "shots_on_target": 3,
          "key_passes": 3,
          "passes": 42,
          "accurate_passes": 38,
          "tackles": 1,
          "interceptions": 0,
          "fouls": 1,
          "fouls_drawn": 3,
          "yellow_card": false,
          "red_card": false,
          "man_of_the_match": true
        }
      ]
    }
  ],
  "meta": {
    "fixture_id": 1200001,
    "total_players": 28
  }
}
```

---

## 4. Estructura de Archivos

```
server/src/
├── config/                    (ya existe)
├── middleware/                (ya existe)
│
├── routes/
│   ├── fixtures.js            (ya existe — se agregan sub-rutas)
│   └── players.js             Players routes
│
├── controllers/
│   ├── fixtureController.js   (ya existe — se agregan handlers)
│   └── playerController.js    Player handlers
│
├── services/
│   ├── apiFootball.js         (ya existe — se reusa)
│   ├── syncService.js         (ya existe — se extiende)
│   └── cacheService.js        (ya existe — se reusa)
│
├── repositories/
│   ├── fixtureRepo.js         (ya existe — se agregan queries)
│   └── playerRepo.js          Player DB queries
│
├── validators/
│   └── playerSchema.js        Zod schemas jugadores
│
├── jobs/
│   └── syncScheduler.js       (ya existe — se extiende)
│
└── utils/                     (ya existe)
```

---

## 5. Código Completo

### Validators

#### `server/src/validators/playerSchema.js`

```javascript
const { z } = require('zod');

const playerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(200).default(50),
  team_id: z.coerce.number().int().positive().optional(),
  position: z.enum(['Goalkeeper', 'Defender', 'Midfielder', 'Attacker']).optional(),
  search: z.string().max(100).optional(),
  sort: z.enum([
    'name_asc', 'name_desc',
    'rating_desc', 'goals_desc', 'assists_desc',
  ]).default('name_asc'),
});

const playerParamsSchema = z.object({
  id: z.coerce.number().int().positive('Player ID must be a positive integer'),
});

const topPlayersQuerySchema = z.object({
  type: z.enum(['goals', 'assists', 'rating', 'cards', 'saves']).default('goals'),
  limit: z.coerce.number().int().positive().max(50).default(20),
  team_id: z.coerce.number().int().positive().optional(),
});

module.exports = {
  playerQuerySchema,
  playerParamsSchema,
  topPlayersQuerySchema,
};
```

#### `server/src/validators/statsSchema.js`

```javascript
const { z } = require('zod');

const statsParamsSchema = z.object({
  id: z.coerce.number().int().positive('Fixture ID must be a positive integer'),
});

module.exports = { statsParamsSchema };
```

---

### Repositories

#### `server/src/repositories/playerRepo.js`

```javascript
const { pool } = require('../config/database');

class PlayerRepo {

  async findAll({ team_id, position, search, sort, page = 1, perPage = 50 }) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (team_id) {
      conditions.push(`p.team_id = $${idx}`);
      params.push(team_id);
      idx++;
    }
    if (position) {
      conditions.push(`p.position = $${idx}`);
      params.push(position);
      idx++;
    }
    if (search) {
      conditions.push(`p.name ILIKE $${idx}`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const sortMap = {
      name_asc: 'p.name ASC',
      name_desc: 'p.name DESC',
      rating_desc: 'avg_rating DESC NULLS LAST',
      goals_desc: 'total_goals DESC',
      assists_desc: 'total_assists DESC',
    };

    const offset = (page - 1) * perPage;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM players p ${where}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT p.id, p.name, p.position, p.age, p.nationality,
        p.height, p.weight, p.photo, p.number,
        jsonb_build_object(
          'id', t.id, 'name', t.name, 'logo', t.logo, 'code', t.code
        ) AS team,
        COALESCE(tps.goals, 0) AS total_goals,
        COALESCE(tps.assists, 0) AS total_assists,
        COALESCE(tps.appearances, 0) AS appearances,
        tps.avg_rating
      FROM players p
      JOIN teams t ON t.id = p.team_id
      LEFT JOIN (
        SELECT ps.player_id,
          COUNT(DISTINCT ps.fixture_id) AS appearances,
          SUM(ps.goals) AS goals,
          SUM(ps.assists) AS assists,
          AVG(ps.rating) FILTER (WHERE ps.rating IS NOT NULL) AS avg_rating
        FROM player_stats ps
        JOIN fixtures f ON f.id = ps.fixture_id
        WHERE f.status = 'match finished'
        GROUP BY ps.player_id
      ) tps ON tps.player_id = p.id
      ${where}
      ORDER BY ${sortMap[sort] || sortMap.name_asc}
      LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, perPage, offset]
    );

    const rows = result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      position: r.position,
      age: r.age,
      nationality: r.nationality,
      height: r.height,
      weight: r.weight,
      photo: r.photo,
      number: r.number,
      team: r.team,
      statistics: {
        goals: parseInt(r.total_goals) || 0,
        assists: parseInt(r.total_assists) || 0,
        rating: r.avg_rating ? parseFloat(r.avg_rating).toFixed(2) : null,
        appearances: parseInt(r.appearances) || 0,
      },
    }));

    return { rows, total };
  }

  async findById(id) {
    const result = await pool.query(
      `SELECT p.*,
        jsonb_build_object(
          'id', t.id, 'name', t.name, 'logo', t.logo, 'code', t.code
        ) AS team
      FROM players p
      JOIN teams t ON t.id = p.team_id
      WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getMatchHistory(playerId) {
    const result = await pool.query(
      `SELECT ps.fixture_id, f.round, f.date,
        ps.rating, ps.minutes_played, ps.position,
        ps.goals, ps.assists, ps.shots, ps.shots_on_target,
        ps.key_passes, ps.passes, ps.accurate_passes,
        ps.tackles, ps.interceptions, ps.clearances,
        ps.fouls, ps.fouls_drawn, ps.offsides,
        ps.yellow_card, ps.red_card,
        ps.saves, ps.goals_conceded,
        ps.man_of_the_match,
        CASE WHEN f.home_team_id = ps.team_id
          THEN jsonb_build_object('id', at.id, 'name', at.name, 'logo', at.logo)
          ELSE jsonb_build_object('id', ht.id, 'name', ht.name, 'logo', ht.logo)
        END AS opponent,
        CASE WHEN ps.team_id = f.home_team_id THEN f.home_score ELSE f.away_score END AS team_score,
        CASE WHEN ps.team_id = f.home_team_id THEN f.away_score ELSE f.home_score END AS opponent_score
      FROM player_stats ps
      JOIN fixtures f ON f.id = ps.fixture_id
      LEFT JOIN teams ht ON ht.id = f.home_team_id
      LEFT JOIN teams at ON at.id = f.away_team_id
      WHERE ps.player_id = $1 AND f.status = 'match finished'
      ORDER BY f.date ASC`,
      [playerId]
    );
    return result.rows;
  }

  async getCareerTotals(playerId) {
    const result = await pool.query(
      `SELECT
        COUNT(DISTINCT ps.fixture_id) AS appearances,
        COALESCE(SUM(ps.minutes_played), 0) AS minutes_played,
        COALESCE(SUM(ps.goals), 0) AS goals,
        COALESCE(SUM(ps.assists), 0) AS assists,
        COALESCE(SUM(ps.shots), 0) AS shots,
        COALESCE(SUM(ps.shots_on_target), 0) AS shots_on_target,
        COALESCE(SUM(ps.key_passes), 0) AS key_passes,
        COALESCE(SUM(ps.passes), 0) AS passes,
        CASE WHEN SUM(ps.passes) > 0
          THEN ROUND(100.0 * SUM(ps.accurate_passes) / SUM(ps.passes), 1)
          ELSE 0
        END AS pass_accuracy,
        COALESCE(SUM(ps.tackles), 0) AS tackles,
        COALESCE(SUM(ps.interceptions), 0) AS interceptions,
        COALESCE(SUM(ps.clearances), 0) AS clearances,
        COALESCE(SUM(ps.fouls), 0) AS fouls,
        COALESCE(SUM(ps.fouls_drawn), 0) AS fouls_drawn,
        COALESCE(SUM(ps.offsides), 0) AS offsides,
        COALESCE(COUNT(*) FILTER (WHERE ps.yellow_card), 0) AS yellow_cards,
        COALESCE(COUNT(*) FILTER (WHERE ps.red_card), 0) AS red_cards,
        COALESCE(COUNT(*) FILTER (WHERE ps.man_of_the_match), 0) AS man_of_the_match,
        AVG(ps.rating) FILTER (WHERE ps.rating IS NOT NULL) AS average_rating,
        COALESCE(SUM(ps.saves), 0) AS saves,
        COALESCE(SUM(ps.goals_conceded), 0) AS goals_conceded
      FROM player_stats ps
      JOIN fixtures f ON f.id = ps.fixture_id
      WHERE ps.player_id = $1 AND f.status = 'match finished'`,
      [playerId]
    );
    return result.rows[0] || null;
  }

  async getTopByGoals(limit = 20, teamId = null) {
    const conditions = ['f.status = \'match finished\''];
    const params = [limit];
    let idx = 2;

    if (teamId) {
      conditions.push(`p.team_id = $${idx}`);
      params.push(teamId);
      idx++;
    }

    const where = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT
        ROW_NUMBER() OVER (ORDER BY SUM(ps.goals) DESC, AVG(ps.rating) DESC) AS position,
        p.id AS player_id, p.name AS player_name, p.photo,
        t.name AS team_name, t.logo AS team_logo,
        COALESCE(SUM(ps.goals), 0) AS goals,
        COUNT(DISTINCT ps.fixture_id) AS appearances,
        ROUND(CAST(COALESCE(SUM(ps.goals), 0) AS DECIMAL) /
          NULLIF(COUNT(DISTINCT ps.fixture_id), 0), 2) AS goals_per_match,
        AVG(ps.rating) AS avg_rating
      FROM player_stats ps
      JOIN players p ON p.id = ps.player_id
      JOIN teams t ON t.id = p.team_id
      JOIN fixtures f ON f.id = ps.fixture_id
      WHERE ${where}
      GROUP BY p.id, p.name, p.photo, t.name, t.logo
      HAVING SUM(ps.goals) > 0
      ORDER BY goals DESC, avg_rating DESC
      LIMIT $1`,
      params
    );
    return result.rows;
  }

  async getTopByAssists(limit = 20, teamId = null) {
    const conditions = ['f.status = \'match finished\''];
    const params = [limit];
    let idx = 2;

    if (teamId) {
      conditions.push(`p.team_id = $${idx}`);
      params.push(teamId);
      idx++;
    }

    const where = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT
        ROW_NUMBER() OVER (ORDER BY SUM(ps.assists) DESC, AVG(ps.rating) DESC) AS position,
        p.id AS player_id, p.name AS player_name, p.photo,
        t.name AS team_name, t.logo AS team_logo,
        COALESCE(SUM(ps.assists), 0) AS assists,
        COUNT(DISTINCT ps.fixture_id) AS appearances,
        ROUND(CAST(COALESCE(SUM(ps.assists), 0) AS DECIMAL) /
          NULLIF(COUNT(DISTINCT ps.fixture_id), 0), 2) AS assists_per_match,
        AVG(ps.rating) AS avg_rating
      FROM player_stats ps
      JOIN players p ON p.id = ps.player_id
      JOIN teams t ON t.id = p.team_id
      JOIN fixtures f ON f.id = ps.fixture_id
      WHERE ${where}
      GROUP BY p.id, p.name, p.photo, t.name, t.logo
      HAVING SUM(ps.assists) > 0
      ORDER BY assists DESC, avg_rating DESC
      LIMIT $1`,
      params
    );
    return result.rows;
  }

  async getTopByRating(limit = 20, teamId = null, minAppearances = 2) {
    const conditions = [
      'f.status = \'match finished\'',
      'ps.rating IS NOT NULL',
    ];
    const params = [limit, minAppearances];
    let idx = 3;

    if (teamId) {
      conditions.push(`p.team_id = $${idx}`);
      params.push(teamId);
      idx++;
    }

    const where = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT
        ROW_NUMBER() OVER (ORDER BY AVG(ps.rating) DESC) AS position,
        p.id AS player_id, p.name AS player_name, p.photo,
        t.name AS team_name, t.logo AS team_logo,
        ROUND(AVG(ps.rating)::DECIMAL, 2) AS avg_rating,
        COUNT(DISTINCT ps.fixture_id) AS appearances,
        COALESCE(SUM(ps.goals), 0) AS goals,
        COALESCE(SUM(ps.assists), 0) AS assists
      FROM player_stats ps
      JOIN players p ON p.id = ps.player_id
      JOIN teams t ON t.id = p.team_id
      JOIN fixtures f ON f.id = ps.fixture_id
      WHERE ${where}
      GROUP BY p.id, p.name, p.photo, t.name, t.logo
      HAVING COUNT(DISTINCT ps.fixture_id) >= $2
      ORDER BY avg_rating DESC
      LIMIT $1`,
      params
    );
    return result.rows;
  }

  async getTopBySaves(limit = 20, teamId = null) {
    const conditions = [
      'f.status = \'match finished\'',
      'p.position = \'Goalkeeper\'',
    ];
    const params = [limit];
    let idx = 2;

    if (teamId) {
      conditions.push(`p.team_id = $${idx}`);
      params.push(teamId);
      idx++;
    }

    const where = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT
        ROW_NUMBER() OVER (ORDER BY SUM(ps.saves) DESC) AS position,
        p.id AS player_id, p.name AS player_name, p.photo,
        t.name AS team_name, t.logo AS team_logo,
        COALESCE(SUM(ps.saves), 0) AS saves,
        COALESCE(SUM(ps.goals_conceded), 0) AS goals_conceded,
        COUNT(DISTINCT ps.fixture_id) AS appearances,
        ROUND(CAST(COALESCE(SUM(ps.saves), 0) AS DECIMAL) /
          NULLIF(COUNT(DISTINCT ps.fixture_id), 0), 2) AS saves_per_match
      FROM player_stats ps
      JOIN players p ON p.id = ps.player_id
      JOIN teams t ON t.id = p.team_id
      JOIN fixtures f ON f.id = ps.fixture_id
      WHERE ${where}
      GROUP BY p.id, p.name, p.photo, t.name, t.logo
      HAVING SUM(ps.saves) > 0
      ORDER BY saves DESC
      LIMIT $1`,
      params
    );
    return result.rows;
  }

  async getTopByCards(limit = 20, teamId = null) {
    const conditions = ['f.status = \'match finished\''];
    const params = [limit];
    let idx = 2;

    if (teamId) {
      conditions.push(`p.team_id = $${idx}`);
      params.push(teamId);
      idx++;
    }

    const where = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT
        ROW_NUMBER() OVER (
          ORDER BY
            COUNT(*) FILTER (WHERE ps.red_card) * 3 + COUNT(*) FILTER (WHERE ps.yellow_card) DESC
        ) AS position,
        p.id AS player_id, p.name AS player_name, p.photo,
        t.name AS team_name, t.logo AS team_logo,
        COUNT(*) FILTER (WHERE ps.yellow_card) AS yellow_cards,
        COUNT(*) FILTER (WHERE ps.red_card) AS red_cards,
        COUNT(DISTINCT ps.fixture_id) AS appearances
      FROM player_stats ps
      JOIN players p ON p.id = ps.player_id
      JOIN teams t ON t.id = p.team_id
      JOIN fixtures f ON f.id = ps.fixture_id
      WHERE ${where}
      GROUP BY p.id, p.name, p.photo, t.name, t.logo
      HAVING COUNT(*) FILTER (WHERE ps.yellow_card) > 0
         OR COUNT(*) FILTER (WHERE ps.red_card) > 0
      ORDER BY position ASC
      LIMIT $1`,
      params
    );
    return result.rows;
  }
}

module.exports = new PlayerRepo();
```

*(Los métodos de stats están integrados en `fixtureRepo.js` — no se necesita repositorio separado)*

---

### Controllers

#### `server/src/controllers/playerController.js`

```javascript
const playerRepo = require('../repositories/playerRepo');
const { success, paginated, error } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const { page, per_page, team_id, position, search, sort } = req.query;

    const { rows, total } = await playerRepo.findAll({
      team_id: team_id || undefined,
      position: position || undefined,
      search: search || undefined,
      sort,
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

    const player = await playerRepo.findById(id);
    if (!player) {
      return error(res, 404, 'NOT_FOUND', `Player ${id} not found`);
    }

    const [totals, matchHistory] = await Promise.all([
      playerRepo.getCareerTotals(id),
      playerRepo.getMatchHistory(id),
    ]);

    return success(res, {
      ...player,
      totals: totals ? {
        appearances: parseInt(totals.appearances),
        minutes_played: parseInt(totals.minutes_played),
        goals: parseInt(totals.goals),
        assists: parseInt(totals.assists),
        shots: parseInt(totals.shots),
        shots_on_target: parseInt(totals.shots_on_target),
        key_passes: parseInt(totals.key_passes),
        passes: parseInt(totals.passes),
        pass_accuracy: parseFloat(totals.pass_accuracy),
        tackles: parseInt(totals.tackles),
        fouls: parseInt(totals.fouls),
        fouls_drawn: parseInt(totals.fouls_drawn),
        yellow_cards: parseInt(totals.yellow_cards),
        red_cards: parseInt(totals.red_cards),
        man_of_the_match: parseInt(totals.man_of_the_match),
        average_rating: totals.average_rating
          ? parseFloat(totals.average_rating).toFixed(2)
          : null,
        saves: parseInt(totals.saves),
        goals_conceded: parseInt(totals.goals_conceded),
      } : null,
      match_history: matchHistory.map((m) => ({
        fixture_id: m.fixture_id,
        round: m.round,
        date: m.date,
        opponent: m.opponent,
        team_score: m.team_score,
        opponent_score: m.opponent_score,
        rating: m.rating,
        minutes_played: m.minutes_played,
        position: m.position,
        goals: m.goals,
        assists: m.assists,
        shots: m.shots,
        key_passes: m.key_passes,
        tackles: m.tackles,
        saves: m.saves,
        yellow_card: m.yellow_card,
        red_card: m.red_card,
        man_of_the_match: m.man_of_the_match,
      })),
    }, { matches_played: matchHistory.length });
  } catch (err) {
    next(err);
  }
}

async function getTop(req, res, next) {
  try {
    const { type, limit, team_id } = req.query;
    let data;

    switch (type) {
      case 'goals':
        data = await playerRepo.getTopByGoals(limit, team_id || undefined);
        break;
      case 'assists':
        data = await playerRepo.getTopByAssists(limit, team_id || undefined);
        break;
      case 'rating':
        data = await playerRepo.getTopByRating(limit, team_id || undefined);
        break;
      case 'saves':
        data = await playerRepo.getTopBySaves(limit, team_id || undefined);
        break;
      case 'cards':
        data = await playerRepo.getTopByCards(limit, team_id || undefined);
        break;
      default:
        data = await playerRepo.getTopByGoals(limit, team_id || undefined);
    }

    return success(res, data, { type, limit, total: data.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, getTop };
```

*(Los handlers de stats están en `fixtureController.js` como métodos `getPlayerStats`, `getFixtureStats`, `getEvents`)*

---

### Rutas

#### `server/src/routes/players.js`

```javascript
const { Router } = require('express');
const controller = require('../controllers/playerController');
const { validateQuery, validateParams } = require('../middleware/validate');
const { playerQuerySchema, playerParamsSchema, topPlayersQuerySchema } = require('../validators/playerSchema');

const router = Router();

router.get('/',        validateQuery(playerQuerySchema), controller.getAll);
router.get('/top',     validateQuery(topPlayersQuerySchema), controller.getTop);
router.get('/:id',     validateParams(playerParamsSchema), controller.getById);

module.exports = router;
```

*(Las rutas de stats están en `routes/fixtures.js` como sub-rutas de `/api/fixtures/:id/`)*

---

### Extensiones a servicios existentes

#### Agregar a `server/src/services/syncService.js`

```javascript
  // ── Sync top scorers ────────────────────────────────────────
  async syncTopScorers() {
    logger.info('Syncing top scorers...');
    const { data } = await apiFootball.getTopScorers();
    const scorers = data.response || [];

    for (const s of scorers) {
      const p = s.player;
      const ps = s.statistics[0];
      await pool.query(
        `INSERT INTO player_stats (fixture_id, player_id, team_id,
           goals, assists, shots, shots_on_target, key_passes,
           passes, accurate_passes, tackles, fouls, offsides,
           yellow_card, red_card, man_of_the_match)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (fixture_id, player_id) DO UPDATE SET
           goals = EXCLUDED.goals, assists = EXCLUDED.assists, updated_at = NOW()`,
        [
          ps.fixture?.id || 0, p.id, ps.team?.id || 0,
          ps.goals?.total || 0, ps.goals?.assists || 0,
          ps.shots?.total || 0, ps.shots?.on || 0,
          ps.passes?.key || 0, ps.passes?.total || 0,
          ps.passes?.accuracy || 0, ps.tackles?.total || 0,
          ps.fouls?.committed || 0, ps.offsides || 0,
          ps.cards?.yellow ? true : false,
          ps.cards?.red ? true : false,
          false,
        ]
      );
    }

    await this._logSync('topscorers', 'synced', scorers.length);
    logger.info({ total: scorers.length }, 'Top scorers synced');
    return { total: scorers.length };
  }

  // ── Sync top assists ────────────────────────────────────────
  async syncTopAssists() {
    logger.info('Syncing top assists...');
    const { data } = await apiFootball.getTopAssists();
    const assisters = data.response || [];

    await this._logSync('topassists', 'synced', assisters.length);
    logger.info({ total: assisters.length }, 'Top assists synced');
    return { total: assisters.length };
  }
```

#### Registrar rutas en `server/src/app.js`

```javascript
// Junto a los otros requires:
const playersRouter = require('./routes/players');

// Después de app.use('/api/standings', standingsRouter):
app.use('/api/players', playersRouter);
```

#### Agregar cron en `server/src/jobs/syncScheduler.js`

```javascript
// Junto a los otros cron jobs en start():
cron.schedule('0 22 * * *', async () => {
  logger.info('Cron: nightly tops sync...');
  try {
    await syncService.syncTopScorers();
    await syncService.syncTopAssists();
  } catch (err) {
    logger.error({ err }, 'Cron: tops sync failed');
  }
});
```

---

## 6. Sync Pipeline

### Diagrama de sincronización

```
Pre-seed (1x antes del torneo)
  ├── syncAllTeams()        → GET /teams              → 1 req  (FASE6)
  ├── syncAllFixtures()     → GET /fixtures            → 1 req  (FASE5)
  ├── syncStandings()       → GET /standings           → 1 req  (FASE6)
  ├── syncAllSquads()       → GET /players/squads ×48  → 48 req (FASE6)
  ├── syncTopScorers()      → GET /players/topscorers  → 1 req
  └── syncTopAssists()      → GET /players/topassists  → 1 req

Post-partido (c/15 min)
  └── syncFinishedMatches()
       └── Por cada partido finalizado:
            ├── GET /fixtures/statistics?fixture=X  → 1 req
            ├── GET /fixtures/players?fixture=X     → 1 req
            └── GET /fixtures/events?fixture=X      → 1 req

Post-matchday (22:00 UTC)
  ├── syncStandings()       → GET /standings          → 1 req
  ├── syncTopScorers()      → GET /players/topscorers → 1 req
  └── syncTopAssists()      → GET /players/topassists → 1 req
```

### Budget total por día

| Operación | Requests | Acumulado |
|-----------|----------|-----------|
| Fixtures diarios | 1 | 1 |
| 4 partidos finalizados (×3 c/u) | 12 | 13 |
| Standings | 1 | 14 |
| Tops | 2 | 16 |
| **Total día típico** | **~16** | **84% margen** |

---

## 7. Cache Strategy

| Entidad | TTL | Notas |
|---------|-----|-------|
| `players` (datos base) | 30 días | Solo cambia si hay reemplazos por lesión |
| `player_stats` | 24h | Se actualizan post-partido |
| `fixture_stats` | 24h | Por equipo por partido |
| `fixture_events` | 24h | Timeline del partido |
| `topscorers` / `topassists` | 6h | Se refrescan post-matchday |

Todos los datos de estadísticas se leen desde PostgreSQL (DB local como fuente principal). Las llamadas a API-Football solo ocurren durante las ventanas de sync programadas.

---

## 8. Consultas SQL de apoyo

### Vista materializada para top goleadores (opcional)

```sql
CREATE MATERIALIZED VIEW mv_top_scorers AS
SELECT
  ROW_NUMBER() OVER (ORDER BY SUM(ps.goals) DESC, AVG(ps.rating) DESC) AS position,
  p.id AS player_id,
  p.name AS player_name,
  p.photo,
  t.id AS team_id,
  t.name AS team_name,
  t.logo AS team_logo,
  COALESCE(SUM(ps.goals), 0) AS goals,
  COUNT(DISTINCT ps.fixture_id) AS appearances,
  AVG(ps.rating) AS avg_rating
FROM player_stats ps
JOIN players p ON p.id = ps.player_id
JOIN teams t ON t.id = p.team_id
JOIN fixtures f ON f.id = ps.fixture_id
WHERE f.status = 'match finished'
GROUP BY p.id, p.name, p.photo, t.id, t.name, t.logo
HAVING SUM(ps.goals) > 0
ORDER BY goals DESC;

CREATE UNIQUE INDEX idx_top_scorers_position ON mv_top_scorers(position);
```

### Índices recomendados para performance

```sql
-- Consulta de lista de jugadores con filtros
CREATE INDEX idx_players_team_position ON players(team_id, position);

-- Consulta de top goleadores
CREATE INDEX idx_player_stats_goals_fixture ON player_stats(goals DESC, fixture_id);

-- Consulta de historial por jugador
CREATE INDEX idx_player_stats_player_fixture ON player_stats(player_id, fixture_id);

-- Consulta de eventos por partido
CREATE INDEX idx_fixture_events_fixture_minute ON fixture_events(fixture_id, minute);
```

---

## 9. Ejemplos de Uso

### Listar jugadores con filtros

```bash
# Todos los jugadores
curl "http://localhost:3001/api/players"

# Delanteros de Brasil
curl "http://localhost:3001/api/players?team_id=9&position=Attacker"

# Buscar por nombre
curl "http://localhost:3001/api/players?search=vinicius"

# Ordenar por goles
curl "http://localhost:3001/api/players?sort=goals_desc&per_page=20"
```

### Rankings

```bash
# Top 20 goleadores
curl "http://localhost:3001/api/players/top?type=goals&limit=20"

# Top 10 asistencias
curl "http://localhost:3001/api/players/top?type=assists&limit=10"

# Top 10 mejores ratings (mín. 2 partidos)
curl "http://localhost:3001/api/players/top?type=rating&limit=10"

# Top arqueros por atajadas
curl "http://localhost:3001/api/players/top?type=saves&limit=10"

# Top tarjetas
curl "http://localhost:3001/api/players/top?type=cards&limit=10"

# Top goleadores de Brasil
curl "http://localhost:3001/api/players/top?type=goals&team_id=9"
```

### Perfil del jugador

```bash
curl "http://localhost:3001/api/players/275"
```

### Estadísticas detalladas de un partido (todo desde DB local)

```bash
# Stats de todos los jugadores del partido (agrupados por equipo)
curl "http://localhost:3001/api/fixtures/1200001/players"

# Estadísticas por equipo del partido
curl "http://localhost:3001/api/fixtures/1200001/stats"

# Timeline de eventos + man of the match
curl "http://localhost:3001/api/fixtures/1200001/events"
```
