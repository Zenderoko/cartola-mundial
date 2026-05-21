# 🧠 Módulo de Cartolas Intelligence — Cartola Mundialera

> Fantasy engine: creación de cartolas, selección de jugadores, cálculo de puntos
> Sistema de presupuesto, capitán/vice, rankings globales
> Mundial FIFA 2026 — 48 equipos, ~700 jugadores, 104 partidos

---

## 1. Endpoints

### Cartolas (protegidas con Clerk)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/fantasy/team` | Mi cartola actual + picks + puntos | `requireAuth` |
| `POST` | `/api/fantasy/team` | Crear/actualizar cartola con picks | `requireAuth` |
| `PUT` | `/api/fantasy/team/:id` | Actualizar cartola (nombre, formación, picks) | `requireAuth` |
| `GET` | `/api/fantasy/team/:id/points` | Desglose de puntos por ronda | `requireAuth` |
| `DELETE` | `/api/fantasy/team/:id/pick/:playerId` | Sacar un jugador de la cartola | `requireAuth` |

### Rankings (públicos)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/rankings` | Ranking global de cartolas | Público |
| `GET` | `/api/rankings/round/:round` | Ranking por ronda específica | Público |

### Precios de Jugadores (públicos)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/fantasy/prices` | Lista de jugadores con precio fantasy | Público |
| `GET` | `/api/fantasy/budget` | Reglas de presupuesto del torneo | Público |

---

## 2. Sistema de Presupuesto

### Reglas

| Concepto | Valor |
|----------|-------|
| Presupuesto inicial | $100.00M |
| Plantilla | 11 jugadores |
| Formaciones válidas | 4-3-3, 4-4-2, 3-4-3, 4-5-1, 3-5-2, 5-3-2, 4-2-3-1 |
| Capitán | 1 por cartola (puntos ×2) |
| Vice-capitán | 1 por cartola (puntos ×1.5) |
| Transferencias por ronda | Ilimitadas (sin costo) |
| Cambio de formación | Ilimitado (antes del cierre de la ronda) |

### Precios por posición

| Posición | Precio base | Rango |
|----------|-------------|-------|
| `Goalkeeper` | $5.0M | $4.0M – $7.0M |
| `Defender` | $5.0M | $3.5M – $7.5M |
| `Midfielder` | $6.0M | $4.5M – $9.0M |
| `Attacker` | $8.0M | $5.0M – $12.0M |

Los precios se asignan automáticamente según:
- Rating histórico en API-Football
- Posición del jugador
- Nivel del equipo (ranking FIFA)
- Variación dinámica post-partido (futuro)

---

## 3. Respuestas

### Mi cartola

```json
{
  "success": true,
  "data": {
    "id": 42,
    "name": "Los Magos de la Cancha",
    "formation": "4-3-3",
    "budget_spent": 87.5,
    "budget_remaining": 12.5,
    "total_points": 234,
    "round_points": 45,
    "points_per_round": [
      { "round": 1, "points": 45 },
      { "round": 2, "points": 52 },
      { "round": 3, "points": 38 }
    ],
    "picks": [
      {
        "position_slot": 1,
        "player_id": 301,
        "player_name": "Alisson Becker",
        "position": "Goalkeeper",
        "team_name": "Brazil",
        "team_logo": "https://...",
        "photo": "https://...",
        "price": 6.5,
        "is_captain": false,
        "is_vice_captain": false,
        "points_earned": 12
      },
      {
        "position_slot": 2,
        "player_id": 410,
        "player_name": "Marquinhos",
        "position": "Defender",
        "team_name": "Brazil",
        "team_logo": "https://...",
        "photo": "https://...",
        "price": 6.0,
        "is_captain": false,
        "is_vice_captain": false,
        "points_earned": 8
      },
      {
        "position_slot": 7,
        "player_id": 275,
        "player_name": "Vinicius Junior",
        "position": "Attacker",
        "team_name": "Brazil",
        "team_logo": "https://...",
        "photo": "https://...",
        "price": 10.5,
        "is_captain": true,
        "is_vice_captain": false,
        "points_earned": 24
      }
    ]
  },
  "meta": {
    "round": 3,
    "picks_count": 11
  }
}
```

### Ranking global

```json
{
  "success": true,
  "data": [
    {
      "position": 1,
      "fantasy_team_id": 10,
      "fantasy_team_name": "Los Crack",
      "user_name": "Juan Pérez",
      "avatar_url": "https://...",
      "total_points": 234,
      "round_points": 45,
      "formation": "4-3-3",
      "rounds_played": 3,
      "unique_players_used": 14
    },
    {
      "position": 2,
      "fantasy_team_id": 25,
      "fantasy_team_name": "Albiceleste Dream",
      "user_name": "María García",
      "total_points": 228,
      "round_points": 52,
      "formation": "3-4-3",
      "rounds_played": 3,
      "unique_players_used": 12
    }
  ],
  "meta": {
    "total_teams": 1250,
    "page": 1,
    "per_page": 20
  }
}
```

### Precios de jugadores

```json
{
  "success": true,
  "data": [
    {
      "player_id": 275,
      "player_name": "Vinicius Junior",
      "position": "Attacker",
      "team_name": "Brazil",
      "team_logo": "https://...",
      "photo": "https://...",
      "price": 10.5,
      "rating": 8.9,
      "goals": 3,
      "assists": 2,
      "selected_by": 45.2
    }
  ],
  "meta": {
    "budget": 100,
    "currency": "M",
    "updated_at": "2026-06-14T10:00:00Z"
  }
}
```

### Desglose de puntos por ronda

```json
{
  "success": true,
  "data": [
    {
      "round": 3,
      "total_points": 45,
      "players": [
        {
          "player_id": 275,
          "player_name": "Vinicius Junior",
          "photo": "https://...",
          "position_slot": 7,
          "is_captain": true,
          "base_points": 12,
          "captain_bonus": 12,
          "total_points": 24,
          "breakdown": {
            "goals": 8,
            "assists": 5,
            "man_of_match": 5,
            "rating_bonus": 4
          }
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
├── config/                    (ya existe)
├── middleware/
│   └── auth.js                requireAuth + requirePremium (FASE1)
│
├── routes/
│   ├── fantasy.js             Rutas de cartolas (protegidas)
│   └── rankings.js            Rutas de rankings (públicas)
│
├── controllers/
│   ├── fantasyController.js   Handlers de cartolas
│   └── rankingController.js   Handlers de rankings
│
├── services/
│   ├── fantasyEngine.js       Cálculo de puntos fantasy
│   ├── pricingService.js      Asignación de precios a jugadores
│   └── rankingService.js      Refresh de materialized views
│
├── repositories/
│   ├── fantasyRepo.js         DB queries de cartolas
│   └── rankingRepo.js         DB queries de rankings
│
├── validators/
│   └── fantasySchema.js       Zod schemas fantasy
│
├── jobs/
│   └── syncScheduler.js       (ya existe — se extiende)
│
└── utils/                     (ya existe)
```

---

## 5. Código Completo

### Validators

#### `server/src/validators/fantasySchema.js`

```javascript
const { z } = require('zod');

const FORMATIONS = ['4-3-3', '4-4-2', '3-4-3', '4-5-1', '3-5-2', '5-3-2', '4-2-3-1'];

const POSITION_SLOTS = {
  '4-3-3':  ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'AT', 'AT', 'AT'],
  '4-4-2':  ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'AT', 'AT'],
  '3-4-3':  ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'AT', 'AT', 'AT'],
  '4-5-1':  ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'AT'],
  '3-5-2':  ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'AT', 'AT'],
  '5-3-2':  ['GK', 'DF', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'AT', 'AT'],
  '4-2-3-1': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'AT', 'AT', 'AT'],
};

const PICK_SCHEMA = z.object({
  player_id: z.number().int().positive(),
  position_slot: z.number().int().min(1).max(11),
  is_captain: z.boolean().default(false),
  is_vice_captain: z.boolean().default(false),
});

const createTeamSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(30, 'Name max 30 characters'),
  formation: z.enum(FORMATIONS).default('4-3-3'),
  picks: z.array(PICK_SCHEMA).length(11, 'Exactly 11 players required'),
}).refine((data) => {
  const captains = data.picks.filter((p) => p.is_captain).length;
  const viceCaptains = data.picks.filter((p) => p.is_vice_captain).length;
  return captains === 1 && viceCaptains <= 1;
}, { message: 'Exactly 1 captain and at most 1 vice-captain required' });

const updateTeamSchema = z.object({
  name: z.string().min(3).max(30).optional(),
  formation: z.enum(FORMATIONS).optional(),
  picks: z.array(PICK_SCHEMA).length(11).optional(),
});

const rankingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
});

module.exports = { createTeamSchema, updateTeamSchema, rankingQuerySchema, POSITION_SLOTS };
```

---

### Repositories

#### `server/src/repositories/fantasyRepo.js`

```javascript
const { pool } = require('../config/database');

class FantasyRepo {

  async getTeam(clerkUserId) {
    const result = await pool.query(
      `SELECT * FROM fantasy_teams
       WHERE clerk_user_id = $1 AND is_active = true
       ORDER BY created_at DESC LIMIT 1`,
      [clerkUserId]
    );
    return result.rows[0] || null;
  }

  async getTeamWithPicks(teamId, round = null) {
    const team = await pool.query(
      `SELECT * FROM fantasy_teams WHERE id = $1`,
      [teamId]
    );
    if (!team.rows[0]) return null;

    let roundCondition = '';
    const params = [teamId];
    if (round) {
      roundCondition = 'AND fp.round = $2';
      params.push(round);
    } else {
      roundCondition = 'AND fp.round = (SELECT MAX(round) FROM fantasy_picks WHERE fantasy_team_id = $1)';
    }

    const picks = await pool.query(
      `SELECT fp.position_slot, fp.player_id, fp.is_captain, fp.is_vice_captain,
        fp.points_earned, fp.round,
        p.name AS player_name, p.position, p.photo, p.number,
        t.id AS team_id, t.name AS team_name, t.logo AS team_logo
      FROM fantasy_picks fp
      JOIN players p ON p.id = fp.player_id
      JOIN teams t ON t.id = p.team_id
      WHERE fp.fantasy_team_id = $1 ${roundCondition}
      ORDER BY fp.position_slot ASC`,
      params
    );

    return { ...team.rows[0], picks: picks.rows };
  }

  async create(clerkUserId, name, formation) {
    const result = await pool.query(
      `INSERT INTO fantasy_teams (clerk_user_id, name, formation)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [clerkUserId, name, formation]
    );
    return result.rows[0];
  }

  async update(teamId, clerkUserId, data) {
    const fields = [];
    const params = [];
    let idx = 1;

    if (data.name) { fields.push(`name = $${idx}`); params.push(data.name); idx++; }
    if (data.formation) { fields.push(`formation = $${idx}`); params.push(data.formation); idx++; }

    if (fields.length === 0) return null;

    params.push(teamId, clerkUserId);
    const result = await pool.query(
      `UPDATE fantasy_teams SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${idx} AND clerk_user_id = $${idx + 1}
       RETURNING *`,
      params
    );
    return result.rows[0] || null;
  }

  async savePicks(teamId, round, picks) {
    await pool.query(
      'DELETE FROM fantasy_picks WHERE fantasy_team_id = $1 AND round = $2',
      [teamId, round]
    );

    let captainCount = 0, viceCount = 0;
    for (const pick of picks) {
      if (pick.is_captain) captainCount++;
      if (pick.is_vice_captain) viceCount++;
      await pool.query(
        `INSERT INTO fantasy_picks (fantasy_team_id, player_id, round, position_slot, is_captain, is_vice_captain)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [teamId, pick.player_id, round, pick.position_slot, pick.is_captain || false, pick.is_vice_captain || false]
      );
    }
    return { picks_saved: picks.length, captain: captainCount, vice: viceCount };
  }

  async deactivateOtherTeams(clerkUserId, keepTeamId) {
    await pool.query(
      `UPDATE fantasy_teams SET is_active = false
       WHERE clerk_user_id = $1 AND id != $2 AND is_active = true`,
      [clerkUserId, keepTeamId]
    );
  }

  async getPointsBreakdown(teamId) {
    const result = await pool.query(
      `SELECT fp.round,
        jsonb_agg(
          jsonb_build_object(
            'player_id', fp.player_id,
            'player_name', p.name,
            'photo', p.photo,
            'position_slot', fp.position_slot,
            'is_captain', fp.is_captain,
            'is_vice_captain', fp.is_vice_captain,
            'base_points', fpt.base_points,
            'captain_bonus', fpt.captain_bonus,
            'vice_bonus', fpt.vice_bonus,
            'total_points', COALESCE(fpt.total_points, fp.points_earned),
            'breakdown', fpt.breakdown
          ) ORDER BY fp.position_slot
        ) AS players
      FROM fantasy_picks fp
      JOIN players p ON p.id = fp.player_id
      LEFT JOIN fantasy_points fpt ON fpt.player_id = fp.player_id AND fpt.round = fp.round
      WHERE fp.fantasy_team_id = $1
      GROUP BY fp.round
      ORDER BY fp.round DESC`,
      [teamId]
    );

    return result.rows.map((r) => ({
      round: r.round,
      total_points: r.players.reduce((sum, p) => sum + (p.total_points || 0), 0),
      players: r.players,
    }));
  }

  async getUserTeamCount(clerkUserId) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM fantasy_teams WHERE clerk_user_id = $1',
      [clerkUserId]
    );
    return parseInt(result.rows[0].count);
  }

  async removePick(teamId, playerId, round) {
    const result = await pool.query(
      `DELETE FROM fantasy_picks
       WHERE fantasy_team_id = $1 AND player_id = $2 AND round = $3
       RETURNING *`,
      [teamId, playerId, round]
    );
    return result.rows[0] || null;
  }

  async getCurrentRound() {
    const result = await pool.query(
      `SELECT DISTINCT round FROM fixtures
       WHERE status IN ('scheduled', 'live', '1H', '2H', 'HT', 'ET')
       ORDER BY round ASC LIMIT 1`
    );
    if (result.rows[0]) return result.rows[0].round;

    const lastResult = await pool.query(
      `SELECT round FROM fixtures
       WHERE status = 'match finished'
       ORDER BY date DESC LIMIT 1`
    );
    return lastResult.rows[0]?.round || 1;
  }
}

module.exports = new FantasyRepo();
```

#### `server/src/repositories/rankingRepo.js`

```javascript
const { pool } = require('../config/database');

class RankingRepo {

  async getGlobalRanking(page = 1, perPage = 20) {
    const offset = (page - 1) * perPage;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM fantasy_teams WHERE is_active = true`
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT
        ROW_NUMBER() OVER (ORDER BY ft.total_points DESC) AS position,
        ft.id AS fantasy_team_id,
        ft.name AS fantasy_team_name,
        u.name AS user_name,
        u.avatar_url,
        ft.total_points,
        ft.round_points,
        ft.formation,
        COUNT(DISTINCT fp.round) AS rounds_played,
        COUNT(DISTINCT fp.player_id) AS unique_players_used
      FROM fantasy_teams ft
      JOIN users u ON u.clerk_user_id = ft.clerk_user_id
      LEFT JOIN fantasy_picks fp ON fp.fantasy_team_id = ft.id
      WHERE ft.is_active = true
      GROUP BY ft.id, ft.name, u.name, u.avatar_url, ft.total_points, ft.round_points, ft.formation
      ORDER BY ft.total_points DESC
      LIMIT $1 OFFSET $2`,
      [perPage, offset]
    );

    return { rows: result.rows, total };
  }

  async getRoundRanking(round, page = 1, perPage = 20) {
    const offset = (page - 1) * perPage;

    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT ft.id)
       FROM fantasy_teams ft
       JOIN fantasy_picks fp ON fp.fantasy_team_id = ft.id
       WHERE ft.is_active = true AND fp.round = $1`,
      [round]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT
        ROW_NUMBER() OVER (ORDER BY SUM(fpt.total_points) DESC) AS position,
        ft.id AS fantasy_team_id,
        ft.name AS fantasy_team_name,
        u.name AS user_name,
        u.avatar_url,
        COALESCE(SUM(fpt.total_points), 0) AS round_points
      FROM fantasy_picks fp
      JOIN fantasy_teams ft ON ft.id = fp.fantasy_team_id
      JOIN users u ON u.clerk_user_id = ft.clerk_user_id
      LEFT JOIN fantasy_points fpt ON fpt.player_id = fp.player_id AND fpt.round = fp.round
      WHERE ft.is_active = true AND fp.round = $1
      GROUP BY ft.id, ft.name, u.name, u.avatar_url
      ORDER BY round_points DESC
      LIMIT $2 OFFSET $3`,
      [round, perPage, offset]
    );

    return { rows: result.rows, total };
  }

  async getUserPosition(clerkUserId) {
    const result = await pool.query(
      `SELECT position FROM (
        SELECT ft.id, ROW_NUMBER() OVER (ORDER BY ft.total_points DESC) AS position
        FROM fantasy_teams ft
        WHERE ft.is_active = true
      ) ranked
      JOIN fantasy_teams ft ON ft.id = ranked.id
      WHERE ft.clerk_user_id = $1`,
      [clerkUserId]
    );
    return result.rows[0]?.position || null;
  }
}

module.exports = new RankingRepo();
```

---

### Services

#### `server/src/services/fantasyEngine.js`

```javascript
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

class FantasyEngine {

  RULES = {
    goals:              8,
    assists:            5,
    clean_sheet:        6,
    every_3_saves:      3,
    key_passes_3plus:   3,
    yellow_card:       -2,
    red_card:          -5,
    goal_conceded:     -2,
    missed_penalty:    -3,
    man_of_match:       5,
    rating_ge_8:        4,
    rating_le_5:       -3,
    captain_mult:       2,
    vice_mult:          1.5,
  };

  async calculatePoints(fixtureId) {
    const fixture = await pool.query(
      'SELECT id, round FROM fixtures WHERE id = $1', [fixtureId]
    );
    if (!fixture.rows[0]) throw new Error('Fixture not found');
    const round = fixture.rows[0].round;

    const players = await pool.query(
      `SELECT ps.*, p.position
      FROM player_stats ps
      JOIN players p ON p.id = ps.player_id
      WHERE ps.fixture_id = $1`,
      [fixtureId]
    );

    for (const player of players.rows) {
      const breakdown = {};
      let basePoints = 0;

      if (player.goals > 0) {
        const pts = player.goals * this.RULES.goals;
        basePoints += pts;
        breakdown.goals = pts;
      }

      if (player.assists > 0) {
        const pts = player.assists * this.RULES.assists;
        basePoints += pts;
        breakdown.assists = pts;
      }

      if (player.minutes_played >= 60
          && ['Goalkeeper', 'Defender'].includes(player.position)
          && player.goals_conceded === 0) {
        basePoints += this.RULES.clean_sheet;
        breakdown.clean_sheet = this.RULES.clean_sheet;
      }

      if (player.position === 'Goalkeeper' && player.saves >= 3) {
        const pts = Math.floor(player.saves / 3) * this.RULES.every_3_saves;
        basePoints += pts;
        breakdown.saves = pts;
      }

      if (player.key_passes >= 3) {
        basePoints += this.RULES.key_passes_3plus;
        breakdown.key_passes_bonus = this.RULES.key_passes_3plus;
      }

      if (player.yellow_card) {
        basePoints += this.RULES.yellow_card;
        breakdown.yellow_card = this.RULES.yellow_card;
      }
      if (player.red_card) {
        basePoints += this.RULES.red_card;
        breakdown.red_card = this.RULES.red_card;
      }

      if (['Goalkeeper', 'Defender'].includes(player.position) && player.goals_conceded > 0) {
        const pts = player.goals_conceded * this.RULES.goal_conceded;
        basePoints += pts;
        breakdown.goals_conceded = pts;
      }

      if (player.penalties_missed > 0) {
        const pts = player.penalties_missed * this.RULES.missed_penalty;
        basePoints += pts;
        breakdown.missed_penalty = pts;
      }

      if (player.man_of_the_match) {
        basePoints += this.RULES.man_of_match;
        breakdown.man_of_match = this.RULES.man_of_match;
      }

      if (player.rating >= 8.0) {
        basePoints += this.RULES.rating_ge_8;
        breakdown.rating_bonus = this.RULES.rating_ge_8;
      } else if (player.rating <= 5.0 && player.rating > 0) {
        basePoints += this.RULES.rating_le_5;
        breakdown.rating_penalty = this.RULES.rating_le_5;
      }

      await pool.query(
        `INSERT INTO fantasy_points (player_id, fixture_id, round, base_points, breakdown)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (player_id, fixture_id) DO UPDATE SET
           base_points = EXCLUDED.base_points,
           breakdown = EXCLUDED.breakdown,
           calculated_at = NOW()`,
        [player.player_id, fixtureId, round, basePoints, JSON.stringify(breakdown)]
      );
    }

    await this._applyCaptainMultipliers(fixtureId, round);
    await this._updateTeamTotals(round);

    logger.info({ fixtureId, round, players: players.rows.length }, 'Fantasy points calculated');
    return { fixtureId, round, players: players.rows.length };
  }

  async _applyCaptainMultipliers(fixtureId, round) {
    await pool.query(
      `UPDATE fantasy_points fp
      SET
        captain_bonus = CASE WHEN fp2.is_captain
          THEN fp.base_points * ($1 - 1) ELSE 0 END,
        vice_bonus = CASE WHEN fp2.is_vice_captain AND NOT fp2.is_captain
          THEN fp.base_points * ($2 - 1) ELSE 0 END,
        total_points = fp.base_points
          + CASE WHEN fp2.is_captain THEN fp.base_points * ($1 - 1) ELSE 0 END
          + CASE WHEN fp2.is_vice_captain AND NOT fp2.is_captain
              THEN fp.base_points * ($2 - 1) ELSE 0 END
      FROM fantasy_picks fp2
      WHERE fp2.player_id = fp.player_id
        AND fp2.round = fp.round
        AND fp.fixture_id = $3
        AND fp.round = $4`,
      [this.RULES.captain_mult, this.RULES.vice_mult, fixtureId, round]
    );
  }

  async _updateTeamTotals(round) {
    await pool.query(
      `UPDATE fantasy_teams ft
      SET
        total_points = (
          SELECT COALESCE(SUM(fp.total_points), 0)
          FROM fantasy_picks fpk
          JOIN fantasy_points fp ON fp.player_id = fpk.player_id AND fp.round = fpk.round
          WHERE fpk.fantasy_team_id = ft.id
        ),
        round_points = (
          SELECT COALESCE(SUM(fp.total_points), 0)
          FROM fantasy_picks fpk
          JOIN fantasy_points fp ON fp.player_id = fpk.player_id AND fp.round = fpk.round
          WHERE fpk.fantasy_team_id = ft.id AND fp.round = $1
        ),
        points_per_round = (
          SELECT jsonb_agg(jsonb_build_object('round', sub.round, 'points', sub.points))
          FROM (
            SELECT fp.round, COALESCE(SUM(fpt.total_points), 0) AS points
            FROM fantasy_picks fp
            LEFT JOIN fantasy_points fpt ON fpt.player_id = fp.player_id AND fpt.round = fp.round
            WHERE fp.fantasy_team_id = ft.id
            GROUP BY fp.round ORDER BY fp.round
          ) sub
        ),
        updated_at = NOW()`,
      [round]
    );

    await pool.query(
      `UPDATE fantasy_picks fpk
      SET points_earned = (
        SELECT COALESCE(fp.total_points, 0)
        FROM fantasy_points fp
        WHERE fp.player_id = fpk.player_id AND fp.round = fpk.round
      )
      WHERE fpk.round = $1`,
      [round]
    );
  }
}

module.exports = new FantasyEngine();
```

#### `server/src/services/pricingService.js`

```javascript
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

const BASE_PRICES = {
  Goalkeeper: 5.0,
  Defender:   5.0,
  Midfielder: 6.0,
  Attacker:   8.0,
};

const PRICE_RANGES = {
  Goalkeeper: { min: 4.0, max: 7.0 },
  Defender:   { min: 3.5, max: 7.5 },
  Midfielder: { min: 4.5, max: 9.0 },
  Attacker:   { min: 5.0, max: 12.0 },
};

class PricingService {

  async calculatePrice(playerId) {
    const player = await pool.query(
      `SELECT p.position, p.id,
        COALESCE(AVG(ps.rating), 0) AS avg_rating,
        COALESCE(SUM(ps.goals), 0) AS total_goals,
        COALESCE(SUM(ps.assists), 0) AS total_assists,
        COALESCE(COUNT(ps.id), 0) AS matches_played
      FROM players p
      LEFT JOIN player_stats ps ON ps.player_id = p.id
      JOIN fixtures f ON f.id = ps.fixture_id AND f.status = 'match finished'
      WHERE p.id = $1
      GROUP BY p.id, p.position`,
      [playerId]
    );
    if (!player.rows[0]) return BASE_PRICES[player.position] || 5.0;

    const { position, avg_rating, total_goals, total_assists, matches_played } = player.rows[0];
    const base = BASE_PRICES[position] || 5.0;
    const range = PRICE_RANGES[position] || { min: 3.0, max: 10.0 };

    let ratingBonus = 0;
    if (matches_played > 0 && avg_rating > 0) {
      ratingBonus = ((avg_rating - 6.5) / 1.5) * 1.5;
    }

    let statsBonus = 0;
    if (position === 'Attacker' || position === 'Midfielder') {
      statsBonus = (total_goals * 0.5 + total_assists * 0.3);
    } else if (position === 'Goalkeeper') {
      statsBonus = matches_played > 0 ? (matches_played * 0.2) : 0;
    }

    let price = base + ratingBonus + statsBonus;
    price = Math.round(Math.max(range.min, Math.min(range.max, price)) * 10) / 10;

    return price;
  }

  async updateAllPrices() {
    const players = await pool.query('SELECT id, position FROM players');
    let updated = 0;

    for (const player of players.rows) {
      const price = await this.calculatePrice(player.id);
      await pool.query(
        `INSERT INTO player_prices (player_id, price, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (player_id) DO UPDATE SET price = $2, updated_at = NOW()`,
        [player.id, price]
      );
      updated++;
    }

    logger.info({ updated }, 'Player prices updated');
    return { updated };
  }

  async getPlayerPrices(teamId = null) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (teamId) {
      conditions.push(`p.team_id = $${idx}`);
      params.push(teamId);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT p.id AS player_id, p.name AS player_name, p.position, p.photo,
        t.name AS team_name, t.logo AS team_logo,
        COALESCE(pp.price, 5.0) AS price,
        COALESCE(tps.goals, 0) AS goals,
        COALESCE(tps.assists, 0) AS assists,
        tps.avg_rating AS rating
      FROM players p
      JOIN teams t ON t.id = p.team_id
      LEFT JOIN player_prices pp ON pp.player_id = p.id
      LEFT JOIN (
        SELECT ps.player_id,
          SUM(ps.goals) AS goals, SUM(ps.assists) AS assists,
          AVG(ps.rating) FILTER (WHERE ps.rating IS NOT NULL) AS avg_rating
        FROM player_stats ps
        JOIN fixtures f ON f.id = ps.fixture_id
        WHERE f.status = 'match finished'
        GROUP BY ps.player_id
      ) tps ON tps.player_id = p.id
      ${where}
      ORDER BY price DESC, p.name ASC`,
      params
    );
    return result.rows;
  }
}

module.exports = new PricingService();
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

#### `server/src/controllers/fantasyController.js`

```javascript
const fantasyRepo = require('../repositories/fantasyRepo');
const pricingService = require('../services/pricingService');
const { success, error, paginated } = require('../utils/response');

async function getMyTeam(req, res, next) {
  try {
    const team = await fantasyRepo.getTeam(req.user.clerk_user_id);
    if (!team) return error(res, 404, 'NO_TEAM', 'You have not created a fantasy team yet');

    const teamWithPicks = await fantasyRepo.getTeamWithPicks(team.id);
    if (!teamWithPicks) return error(res, 404, 'NOT_FOUND', 'Team not found');

    const totalSpent = teamWithPicks.picks.reduce((sum, p) => sum + (p.price || 5.0), 0);

    return success(res, {
      ...teamWithPicks,
      budget_spent: totalSpent,
      budget_remaining: Math.round((100.0 - totalSpent) * 10) / 10,
    }, { picks_count: teamWithPicks.picks.length });
  } catch (err) {
    next(err);
  }
}

async function createTeam(req, res, next) {
  try {
    const { name, formation, picks } = req.body;
    const clerkUserId = req.user.clerk_user_id;

    const existingTeam = await fantasyRepo.getTeam(clerkUserId);
    if (existingTeam) {
      return error(res, 409, 'TEAM_EXISTS', 'You already have an active team. Update it instead.');
    }

    const currentRound = await fantasyRepo.getCurrentRound();

    const team = await fantasyRepo.create(clerkUserId, name, formation);
    await fantasyRepo.savePicks(team.id, currentRound, picks);
    await fantasyRepo.deactivateOtherTeams(clerkUserId, team.id);

    const teamWithPicks = await fantasyRepo.getTeamWithPicks(team.id, currentRound);
    return success(res, teamWithPicks, { round: currentRound });
  } catch (err) {
    next(err);
  }
}

async function updateTeam(req, res, next) {
  try {
    const { id } = req.params;
    const { name, formation, picks } = req.body;
    const clerkUserId = req.user.clerk_user_id;

    const team = await fantasyRepo.update(id, clerkUserId, { name, formation });
    if (!team) return error(res, 404, 'NOT_FOUND', 'Team not found or not yours');

    if (picks) {
      const currentRound = await fantasyRepo.getCurrentRound();
      await fantasyRepo.savePicks(id, currentRound, picks);
    }

    const teamWithPicks = await fantasyRepo.getTeamWithPicks(id);
    return success(res, teamWithPicks);
  } catch (err) {
    next(err);
  }
}

async function getPointsBreakdown(req, res, next) {
  try {
    const { id } = req.params;
    const clerkUserId = req.user.clerk_user_id;

    const team = await fantasyRepo.getTeam(clerkUserId);
    if (!team || team.id !== parseInt(id)) {
      return error(res, 403, 'FORBIDDEN', 'This team does not belong to you');
    }

    const breakdown = await fantasyRepo.getPointsBreakdown(id);
    return success(res, breakdown);
  } catch (err) {
    next(err);
  }
}

async function removePick(req, res, next) {
  try {
    const { id, playerId } = req.params;
    const clerkUserId = req.user.clerk_user_id;

    const team = await fantasyRepo.getTeam(clerkUserId);
    if (!team || team.id !== parseInt(id)) {
      return error(res, 403, 'FORBIDDEN', 'This team does not belong to you');
    }

    const currentRound = await fantasyRepo.getCurrentRound();
    const removed = await fantasyRepo.removePick(id, parseInt(playerId), currentRound);
    if (!removed) return error(res, 404, 'NOT_FOUND', 'Pick not found');

    return success(res, { removed: true });
  } catch (err) {
    next(err);
  }
}

async function getPrices(req, res, next) {
  try {
    const teamId = req.query.team_id ? parseInt(req.query.team_id) : null;
    const prices = await pricingService.getPlayerPrices(teamId);

    return success(res, prices, {
      budget: 100,
      currency: 'M',
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

async function getBudgetRules(req, res, next) {
  try {
    return success(res, {
      budget: 100,
      currency: 'M',
      squad_size: 11,
      formations: ['4-3-3', '4-4-2', '3-4-3', '4-5-1', '3-5-2', '5-3-2', '4-2-3-1'],
      price_ranges: {
        Goalkeeper: { min: 4.0, max: 7.0, base: 5.0 },
        Defender:   { min: 3.5, max: 7.5, base: 5.0 },
        Midfielder: { min: 4.5, max: 9.0, base: 6.0 },
        Attacker:   { min: 5.0, max: 12.0, base: 8.0 },
      },
      multipliers: {
        captain: 2.0,
        vice_captain: 1.5,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyTeam, createTeam, updateTeam,
  getPointsBreakdown, removePick,
  getPrices, getBudgetRules,
};
```

#### `server/src/controllers/rankingController.js`

```javascript
const rankingRepo = require('../repositories/rankingRepo');
const { success, paginated, error } = require('../utils/response');

async function getGlobal(req, res, next) {
  try {
    const { page, per_page } = req.query;

    if (req.user) {
      const userPosition = await rankingRepo.getUserPosition(req.user.clerk_user_id);
      const { rows, total } = await rankingRepo.getGlobalRanking(page, per_page);
      return paginated(res, rows, { page, perPage: per_page, total, user_position: userPosition });
    }

    const { rows, total } = await rankingRepo.getGlobalRanking(page, per_page);
    return paginated(res, rows, { page, perPage: per_page, total });
  } catch (err) {
    next(err);
  }
}

async function getByRound(req, res, next) {
  try {
    const { round } = req.params;
    const page = parseInt(req.query.page) || 1;
    const per_page = parseInt(req.query.per_page) || 20;

    const { rows, total } = await rankingRepo.getRoundRanking(parseInt(round), page, per_page);
    return paginated(res, rows, { page, perPage: per_page, total });
  } catch (err) {
    next(err);
  }
}

module.exports = { getGlobal, getByRound };
```

---

### Rutas

#### `server/src/routes/fantasy.js`

```javascript
const { Router } = require('express');
const controller = require('../controllers/fantasyController');
const { validateBody, validateQuery } = require('../middleware/validate');
const { createTeamSchema, updateTeamSchema } = require('../validators/fantasySchema');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.get('/team',        requireAuth, controller.getMyTeam);
router.post('/team',       requireAuth, validateBody(createTeamSchema), controller.createTeam);
router.put('/team/:id',    requireAuth, validateBody(updateTeamSchema), controller.updateTeam);
router.get('/team/:id/points', requireAuth, controller.getPointsBreakdown);
router.delete('/team/:id/pick/:playerId', requireAuth, controller.removePick);

router.get('/prices',      controller.getPrices);
router.get('/budget',      controller.getBudgetRules);

module.exports = router;
```

#### `server/src/routes/rankings.js`

```javascript
const { Router } = require('express');
const controller = require('../controllers/rankingController');
const { optionalAuth } = require('../middleware/auth');

const router = Router();

router.get('/',            optionalAuth, controller.getGlobal);
router.get('/round/:round', controller.getByRound);

module.exports = router;
```

---

### Registrar rutas en `server/src/app.js`

```javascript
// Junto a los otros requires:
const fantasyRouter = require('./routes/fantasy');
const rankingsRouter = require('./routes/rankings');

// Después de app.use('/api/players', playersRouter):
app.use('/api/fantasy', fantasyRouter);
app.use('/api/rankings', rankingsRouter);
```

---

## 6. Integración con el Sync Pipeline

### Cálculo de puntos post-partido

El `syncScheduler` cada 15 min ejecuta `syncFinishedMatches()` que:
1. Detecta partidos finalizados
2. Sincroniza `fixture_stats`, `player_stats`, `fixture_events`
3. **Dispara `fantasyEngine.calculatePoints(fixtureId)`**
4. Actualiza `fantasy_points`, `fantasy_picks.points_earned`, `fantasy_teams.total_points`
5. Refresca materialized views de ranking

### Extensión al scheduler

```javascript
// En server/src/jobs/syncScheduler.js — dentro del cron de syncFinishedMatches:

// Después de syncMatchDetails:
await fantasyEngine.calculatePoints(fixture.id);

// En el cron de las 22:00, después de standings:
await rankingService.refreshAll();
```

### Flujo completo post-partido

```
syncFinishedMatches()
  │
  ├─ syncMatchDetails(fixtureId)
  │   ├─ GET /fixtures/statistics  → fixture_stats
  │   ├─ GET /fixtures/players     → player_stats
  │   └─ GET /fixtures/events      → fixture_events
  │
  ├─ fantasyEngine.calculatePoints(fixtureId)
  │   ├─ Por cada player_stats:
  │   │   ├─ Calcular base_points según RULES
  │   │   ├─ Aplicar captain_mult (×2)
  │   │   ├─ Aplicar vice_mult (×1.5)
  │   │   └─ INSERT fantasy_points
  │   ├─ _applyCaptainMultipliers()
  │   └─ _updateTeamTotals()
  │       ├─ SUM total_points por fantasy_team
  │       └─ UPDATE points_earned en fantasy_picks
  │
  ├─ Mark fixture as 'match finished'
  │
  └─ (Nightly 22:00) refresh rankings MV
```

---

## 7. Sistema de Puntos (Fantasy Engine)

| Acción | Puntos | Aplica a |
|--------|--------|----------|
| Gol | +8 | Todos |
| Asistencia | +5 | Todos |
| Clean sheet | +6 | Arqueros y defensas (mín. 60 min) |
| Cada 3 atajadas | +3 | Arqueros |
| 3+ pases clave | +3 | Todos |
| Tarjeta amarilla | -2 | Todos |
| Tarjeta roja | -5 | Todos |
| Gol en contra | -2 | Arqueros y defensas |
| Penal errado | -3 | Todos |
| Man of the Match | +5 | Todos |
| Rating ≥ 8.0 | +4 | Todos |
| Rating ≤ 5.0 | -3 | Todos |
| Gol del capitán | ×2 | Capitán |
| Gol del vice | ×1.5 | Vice-capitán |

---

## 8. SQL para tablas fantasy

### Tabla `player_prices`

```sql
CREATE TABLE player_prices (
  player_id   INT PRIMARY KEY REFERENCES players(id),
  price       DECIMAL(4,1) NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_player_prices_price ON player_prices(price DESC);
```

### Vistas materializadas

```sql
CREATE MATERIALIZED VIEW mv_ranking_global AS
SELECT
  ROW_NUMBER() OVER (ORDER BY ft.total_points DESC) AS position,
  ft.id AS fantasy_team_id,
  ft.name AS fantasy_team_name,
  u.name AS user_name,
  u.avatar_url,
  u.clerk_user_id,
  ft.total_points,
  ft.round_points,
  ft.formation,
  COUNT(DISTINCT fp.round) AS rounds_played,
  COUNT(DISTINCT fp.player_id) AS unique_players_used
FROM fantasy_teams ft
JOIN users u ON u.clerk_user_id = ft.clerk_user_id
LEFT JOIN fantasy_picks fp ON fp.fantasy_team_id = ft.id
WHERE ft.is_active = TRUE
GROUP BY ft.id, ft.name, u.name, u.avatar_url, u.clerk_user_id,
         ft.total_points, ft.round_points, ft.formation
ORDER BY ft.total_points DESC;

CREATE UNIQUE INDEX idx_ranking_position ON mv_ranking_global(position);

CREATE MATERIALIZED VIEW mv_ranking_by_round AS
SELECT
  fp.round,
  ROW_NUMBER() OVER (PARTITION BY fp.round ORDER BY SUM(fpt.total_points) DESC) AS position,
  ft.id AS fantasy_team_id,
  ft.name AS fantasy_team_name,
  u.name AS user_name,
  u.clerk_user_id,
  SUM(fpt.total_points) AS round_points
FROM fantasy_picks fp
JOIN fantasy_teams ft ON ft.id = fp.fantasy_team_id
JOIN users u ON u.clerk_user_id = ft.clerk_user_id
JOIN fantasy_points fpt ON fpt.player_id = fp.player_id AND fpt.round = fp.round
WHERE ft.is_active = TRUE
GROUP BY fp.round, ft.id, ft.name, u.name, u.clerk_user_id
ORDER BY fp.round, round_points DESC;

CREATE INDEX idx_ranking_round ON mv_ranking_by_round(round);
```

---

## 9. Ejemplos de Uso

### Crear cartola (requiere JWT)

```bash
curl -X POST "http://localhost:3001/api/fantasy/team" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Los Magos de la Cancha",
    "formation": "4-3-3",
    "picks": [
      { "player_id": 301, "position_slot": 1, "is_captain": false, "is_vice_captain": false },
      { "player_id": 410, "position_slot": 2, "is_captain": false, "is_vice_captain": false },
      { "player_id": 420, "position_slot": 3, "is_captain": false, "is_vice_captain": false },
      { "player_id": 430, "position_slot": 4, "is_captain": false, "is_vice_captain": false },
      { "player_id": 510, "position_slot": 5, "is_captain": false, "is_vice_captain": false },
      { "player_id": 520, "position_slot": 6, "is_captain": false, "is_vice_captain": false },
      { "player_id": 530, "position_slot": 7, "is_captain": true, "is_vice_captain": false },
      { "player_id": 275, "position_slot": 8, "is_captain": false, "is_vice_captain": false },
      { "player_id": 285, "position_slot": 9, "is_captain": false, "is_vice_captain": false },
      { "player_id": 310, "position_slot": 10, "is_captain": false, "is_vice_captain": true },
      { "player_id": 320, "position_slot": 11, "is_captain": false, "is_vice_captain": false }
    ]
  }'
```

### Ver mi cartola

```bash
curl -H "Authorization: Bearer <jwt_token>" \
  "http://localhost:3001/api/fantasy/team"
```

### Precios de jugadores

```bash
# Todos los jugadores con precio
curl "http://localhost:3001/api/fantasy/prices"

# Solo de un equipo
curl "http://localhost:3001/api/fantasy/prices?team_id=9"
```

### Reglas de presupuesto

```bash
curl "http://localhost:3001/api/fantasy/budget"
```

### Ranking global

```bash
curl "http://localhost:3001/api/rankings"
```

### Ranking por ronda

```bash
curl "http://localhost:3001/api/rankings/round/1"
```

### Desglose de puntos

```bash
curl -H "Authorization: Bearer <jwt_token>" \
  "http://localhost:3001/api/fantasy/team/42/points"
```

---

## 10. Intelligence Stats — Algoritmos de Análisis

> Todos los cálculos usan exclusivamente datos almacenados en DB local
> (fixture_stats, player_stats, fixtures). Cero llamadas a API externa.

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/cartola/team/:id/analysis` | Análisis completo de un equipo |
| `GET` | `/api/cartola/player/:id/analysis` | Análisis e intelligence score de un jugador |
| `GET` | `/api/cartola/teams/top` | Top equipos por score global |
| `GET` | `/api/cartola/players/top` | Top jugadores por intelligence score |
| `GET` | `/api/cartola/predictions?home=X&away=Y` | Predicción de partido |
| `GET` | `/api/cartola/snapshot` | Snapshot global del torneo |

### Fórmulas y Algoritmos

#### 1. Análisis de Equipo

| Métrica | Fórmula | Fuente |
|---------|---------|--------|
| Avg goles | `SUM(goles_favor) / played` | `fixtures.home_score/away_score` |
| Avg corners | `AVG(corners)` | `fixture_stats.corners` |
| Avg tiros arco | `AVG(shots_on_target)` | `fixture_stats.shots_on_target` |
| Posesión | `AVG(possession)` | `fixture_stats.possession` |
| Avg tarjetas | `AVG(yellow + red)` | `fixture_stats` |
| Clean sheet % | `(CS / played) × 100` | `fixtures.away_score=0 \| home_score=0` |
| BTTS % | `(BTTS / played) × 100` | Ambos equipos anotaron |
| Over 2.5 % | `(Over2.5 / played) × 100` | Total goles > 2 |

#### 2. Índices

**Índice Ofensivo** (peso en ranking global: 35%)

```
offensiveIndex = (avgGoalsFor × 12) + (avgShotsOT × 1.5) + (avgPossession / 8) + (avgCorners × 0.8)
```

| Componente | Peso | Justificación |
|------------|------|---------------|
| Goles por partido | ×12 | Máximo impacto ofensivo |
| Tiros al arco | ×1.5 | Refleja peligro generado |
| Posesión | /8 | Control de partido |
| Corners | ×0.8 | Presión ofensiva |

**Índice Defensivo** (peso en ranking global: 30%)

```
defensiveIndex = (csPct × 0.8) + (max(0, 2 - avgGoalsAgainst) × 15) + (CS / wins × 10)
```

| Componente | Peso | Justificación |
|------------|------|---------------|
| Clean sheet % | ×0.8 | Capacidad de mantener cero |
| Goles recibidos | ×15 | Inverso: menos goles = más puntos |
| CS por victoria | ×10 | Consistencia defensiva |

**Índice de Forma** (peso en ranking global: 25%)

```
formIndex = avg(
  Victoria → 20pts | Empate → 10pts | Derrota → 2pts
  + goles_favor × 2
  + clean_sheet_bonus → 5pts
) / last5matches
```

Evaluación ponderada de últimos 5 partidos:

| Resultado | Puntos base |
|-----------|-------------|
| Victoria | 20 |
| Empate | 10 |
| Derrota | 2 |
| Gol anotado | +2 c/u |
| Clean sheet | +5 |

**Score Global** (ranking de equipos)

```
globalScore = offensiveIndex × 0.35 + defensiveIndex × 0.30 + formIndex × 0.25 + winPct × 0.10
```

#### 3. Intelligence Score de Jugador

Fórmula adaptada por posición:

**Arquero:**
```
score = (avgRating × 8) + (savesPer90 × 3) + (motm × 5) - (goalsConcededPer90 × 2)
```

**Defensa:**
```
score = (avgRating × 8) + (tacklesPer90 × 2) + (clearancesPer90 × 1.5) + (motm × 5)
        - (yellowCards × 3) - (redCards × 8)
```

**Mediocampista:**
```
score = (avgRating × 8) + (goalsPer90 × 10) + (assistsPer90 × 6) + (keyPassesPer90 × 3)
        + (tacklesPer90 × 2) + (motm × 5)
```

**Delantero:**
```
score = (avgRating × 8) + (goalsPer90 × 12) + (assistsPer90 × 7) + (shotsOTPer90 × 3) + (motm × 5)
```

#### 4. Predicción de Partido

```
homeScore = home.offensive + home.form + 5(home_advantage) - away.defensive
awayScore = away.offensive + away.form - home.defensive

homeWin% = homeScore / (homeScore + awayScore) × 100
awayWin% = awayScore / (homeScore + awayScore) × 100
draw% = 100 - homeWin% - awayWin%
```

Probabilidades adicionales:
- **BTTS**: `(home.btts% + away.btts%) / 2`
- **Over 2.5**: `(home.over25% + away.over25%) / 2`
- **Goles esperados**: `(home.avgGoalsFor + away.avgGoalsFor) / 2`

### Respuesta del análisis de equipo

```json
{
  "success": true,
  "data": {
    "team_id": 9,
    "stats": {
      "played": 3, "wins": 3, "draws": 0, "losses": 0,
      "goals_for": 9, "goals_against": 1, "goal_difference": 8
    },
    "averages": {
      "goals_for": 3.0,
      "goals_against": 0.33,
      "corners": 6.7,
      "shots_on_target": 5.3,
      "possession": 61.3,
      "cards": 1.33
    },
    "percentages": {
      "wins": 100.0,
      "clean_sheets": 66.7,
      "btts": 33.3,
      "over_2_5": 66.7
    },
    "indexes": {
      "offensive": 48.2,
      "defensive": 72.5,
      "form": 85.0
    }
  }
}
```

### Respuesta del análisis de jugador

```json
{
  "success": true,
  "data": {
    "player_id": 275,
    "position": "Attacker",
    "appearances": 3,
    "per_game": {
      "rating": 8.7,
      "goals": 1.0,
      "assists": 0.67,
      "shots_on_target": 2.0,
      "key_passes": 2.33,
      "tackles": 0.33
    },
    "totals": {
      "goals": 3, "assists": 2, "shots_on_target": 6,
      "key_passes": 7, "tackles": 1,
      "saves": 0, "man_of_the_match": 2,
      "yellow_cards": 0, "red_cards": 0
    },
    "intelligence_score": 91.5
  }
}
```

### Predicción

```json
{
  "success": true,
  "data": {
    "home_team_id": 9,
    "away_team_id": 17,
    "prediction": {
      "home_win": 72.4,
      "draw": 15.2,
      "away_win": 12.4,
      "likely_result": "1"
    },
    "probabilities": {
      "btts": 45.0,
      "over_2_5": 58.3,
      "expected_goals": 2.75
    },
    "analysis": {
      "home": { ... },
      "away": { ... },
      "head_to_head": {
        "matches": 2,
        "team_a_wins": 2,
        "team_b_wins": 0,
        "draws": 0,
        "recent": [...]
      }
    }
  }
}
```

### Snapshot del torneo

```json
{
  "success": true,
  "data": {
    "tournament": {
      "matches_played": 48,
      "total_goals": 142,
      "avg_goals_per_match": 2.96,
      "total_cards": 156
    },
    "top_scoring_team": {
      "id": 9,
      "name": "Brazil",
      "logo": "https://...",
      "goals": 15
    },
    "generated_at": "2026-06-20T22:00:00Z"
  }
}
```

### Archivos de implementación

#### `server/src/services/statsIntelligence.js`

Ver archivo completo en `server/src/services/statsIntelligence.js` que contiene:
- `getTeamAnalysis()` — query agregada con 12 métricas + 3 índices
- `getPlayerAnalysis()` — score por posición (GK/DF/MF/AT)
- `getMatchPrediction()` — predicción con head-to-head
- `getTopTeamsByIndex()` — ranking con score global
- `getTopPlayersByScore()` — top jugadores por intelligence
- `getTournamentSnapshot()` — estadísticas globales del torneo

#### `server/src/controllers/intelligenceController.js`

Handlers: `getTeamAnalysis`, `getPlayerAnalysis`, `getMatchPrediction`, `getTopTeams`, `getTopPlayers`, `getTournamentSnapshot`

#### `server/src/routes/intelligence.js`

```javascript
const { Router } = require('express');
const controller = require('../controllers/intelligenceController');

const router = Router();
router.get('/teams/top', controller.getTopTeams);
router.get('/team/:id/analysis', controller.getTeamAnalysis);
router.get('/players/top', controller.getTopPlayers);
router.get('/player/:id/analysis', controller.getPlayerAnalysis);
router.get('/predictions', controller.getMatchPrediction);
router.get('/snapshot', controller.getTournamentSnapshot);

module.exports = router;
```

Registrar en `app.js`:
```javascript
app.use('/api/cartola', intelligenceRouter);
```

### Ejemplos de uso

```bash
# Análisis de un equipo
curl "http://localhost:3001/api/cartola/team/9/analysis"

# Análisis de un jugador
curl "http://localhost:3001/api/cartola/player/275/analysis"

# Top 10 equipos del torneo
curl "http://localhost:3001/api/cartola/teams/top?limit=10"

# Top 20 jugadores por intelligence score
curl "http://localhost:3001/api/cartola/players/top?limit=20"

# Top delanteros
curl "http://localhost:3001/api/cartola/players/top?position=Attacker"

# Predicción Brasil vs Serbia
curl "http://localhost:3001/api/cartola/predictions?home=9&away=17"

# Snapshot global del torneo
curl "http://localhost:3001/api/cartola/snapshot"
```
