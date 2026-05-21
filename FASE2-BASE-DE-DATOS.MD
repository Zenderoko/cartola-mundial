# 🗄️ Base de Datos — Cartola Mundialera

> PostgreSQL vía Supabase (solo como DB, sin Supabase Auth)
> Mundial FIFA 2026 — `league_id=1`, `season=2026`
> Autenticación: **Clerk** (clerk_user_id como identificador)

---

## 1. Convenciones

| Regla | Estándar |
|---|---|
| Naming | `snake_case` |
| IDs externos | Mismos IDs de API-Football (INT) en tablas core |
| IDs internos | `SERIAL` para tablas propias (users, fantasy, etc.) |
| Timestamps | `created_at`, `updated_at` en TODAS las tablas |
| Soft delete | `deleted_at TIMESTAMPTZ` donde aplique |
| Cache flag | `cache_until TIMESTAMPTZ` para control de frescura |
| Llaves foráneas | `ON DELETE CASCADE` para datos dependientes |
| Engine | `WITH (autovacuum_enabled = true)` |

---

## 2. Tablas Core (Datos del Mundial)

### `teams`

```sql
CREATE TABLE teams (
  id          INT PRIMARY KEY,            -- API-Football team_id
  name        TEXT NOT NULL,               -- "Brazil"
  code        TEXT,                        -- "BRA"
  country     TEXT,
  logo        TEXT,                        -- URL del escudo
  group_name  TEXT,                        -- "Group A", "Group B"...
  fifa_rank   INT,                         -- Ranking FIFA actual
  cache_until TIMESTAMPTZ,                 -- Control de frescura del cache
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_group ON teams(group_name);
CREATE INDEX idx_teams_code ON teams(code);
```

### `players`

```sql
CREATE TABLE players (
  id          INT PRIMARY KEY,            -- API-Football player_id
  team_id     INT NOT NULL REFERENCES teams(id),
  name        TEXT NOT NULL,
  position    TEXT,                        -- Goalkeeper, Defender, Midfielder, Attacker
  age         INT,
  nationality TEXT,
  height      INT,                         -- Altura en cm
  weight      INT,                         -- Peso en kg
  photo       TEXT,                        -- URL de la foto
  number      INT,                         -- Número de camiseta
  cache_until TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_players_name ON players(name);
```

### `fixtures`

```sql
CREATE TABLE fixtures (
  id            INT PRIMARY KEY,          -- API-Football fixture_id
  round         TEXT,                      -- "Group Stage - 1", "Round of 16"
  date          TIMESTAMPTZ,               -- Fecha/hora UTC del partido
  status        TEXT,                      -- scheduled, match finished, cancelled, postponed
  home_team_id  INT NOT NULL REFERENCES teams(id),
  away_team_id  INT NOT NULL REFERENCES teams(id),
  home_score    INT,                       -- NULL si no se jugó
  away_score    INT,                       -- NULL si no se jugó
  venue         TEXT,                      -- Estadio
  stage         TEXT,                      -- Group Stage, Round of 16, Quarter-finals...
  cache_until   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fixtures_date ON fixtures(date);
CREATE INDEX idx_fixtures_status ON fixtures(status);
CREATE INDEX idx_fixtures_round ON fixtures(round);
CREATE INDEX idx_fixtures_stage ON fixtures(stage);
CREATE INDEX idx_fixtures_home ON fixtures(home_team_id);
CREATE INDEX idx_fixtures_away ON fixtures(away_team_id);
-- Consulta típica: partidos de HOY
CREATE INDEX idx_fixtures_date_status ON fixtures(date, status);
-- Consulta típica: próximos partidos de un equipo
CREATE INDEX idx_fixtures_team_date ON fixtures(home_team_id, date);
```

### `standings`

```sql
CREATE TABLE standings (
  id          SERIAL PRIMARY KEY,
  group_name  TEXT NOT NULL,               -- "Group A", "Group B"...
  team_id     INT NOT NULL REFERENCES teams(id),
  position    INT,                         -- Posición en la tabla
  played      INT DEFAULT 0,
  wins        INT DEFAULT 0,
  draws       INT DEFAULT 0,
  losses      INT DEFAULT 0,
  gf          INT DEFAULT 0,              -- Goles a favor
  ga          INT DEFAULT 0,              -- Goles en contra
  gd          INT DEFAULT 0,              -- Diferencia de gol
  points      INT DEFAULT 0,
  form        TEXT,                        -- "WWDLW" (últimos 5 resultados)
  cache_until TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_name, team_id)
);

CREATE INDEX idx_standings_group ON standings(group_name);
CREATE INDEX idx_standings_points ON standings(points DESC);
CREATE INDEX idx_standings_team ON standings(team_id);
```

---

## 3. Tablas de Detalle por Partido

### `fixture_stats` (estadísticas generales del partido)

```sql
CREATE TABLE fixture_stats (
  id                SERIAL PRIMARY KEY,
  fixture_id        INT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  team_id           INT NOT NULL REFERENCES teams(id),
  shots             INT DEFAULT 0,
  shots_on_target   INT DEFAULT 0,
  possession        DECIMAL(5,1),          -- Porcentaje (ej: 54.3)
  total_passes      INT DEFAULT 0,
  accurate_passes   INT DEFAULT 0,
  pass_accuracy     DECIMAL(5,1),          -- Porcentaje
  fouls             INT DEFAULT 0,
  corners           INT DEFAULT 0,
  offsides          INT DEFAULT 0,
  yellow_cards      INT DEFAULT 0,
  red_cards         INT DEFAULT 0,
  saves             INT DEFAULT 0,          -- Atajadas del arquero del equipo
  expected_goals    DECIMAL(5,2),           -- xG (si disponible)
  cache_until       TIMESTAMPTZ,
  UNIQUE(fixture_id, team_id)
);

CREATE INDEX idx_fixture_stats_fixture ON fixture_stats(fixture_id);
CREATE INDEX idx_fixture_stats_team ON fixture_stats(team_id);
```

### `player_stats` (estadísticas individuales por partido)

```sql
CREATE TABLE player_stats (
  id                SERIAL PRIMARY KEY,
  fixture_id        INT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  player_id         INT NOT NULL REFERENCES players(id),
  team_id           INT NOT NULL REFERENCES teams(id),
  rating            DECIMAL(4,2),          -- Rating 0-10 (API-Football)
  minutes_played    INT DEFAULT 0,
  position          TEXT,                  -- Posición en que jugó este partido
  goals             INT DEFAULT 0,
  assists           INT DEFAULT 0,
  shots             INT DEFAULT 0,
  shots_on_target   INT DEFAULT 0,
  key_passes        INT DEFAULT 0,         -- Pases que generaron remate
  passes            INT DEFAULT 0,
  accurate_passes   INT DEFAULT 0,
  tackles           INT DEFAULT 0,
  interceptions     INT DEFAULT 0,
  clearances        INT DEFAULT 0,
  blocked_shots     INT DEFAULT 0,
  fouls             INT DEFAULT 0,
  fouls_drawn       INT DEFAULT 0,         -- Faltas recibidas
  offsides          INT DEFAULT 0,
  yellow_card       BOOLEAN DEFAULT FALSE,
  red_card          BOOLEAN DEFAULT FALSE,
  saves             INT DEFAULT 0,         -- Solo arqueros
  goals_conceded    INT DEFAULT 0,         -- Solo arqueros
  penalties_saved   INT DEFAULT 0,         -- Solo arqueros
  penalties_missed  INT DEFAULT 0,
  man_of_the_match  BOOLEAN DEFAULT FALSE,
  cache_until       TIMESTAMPTZ,
  UNIQUE(fixture_id, player_id)
);

CREATE INDEX idx_player_stats_fixture ON player_stats(fixture_id);
CREATE INDEX idx_player_stats_player ON player_stats(player_id);
CREATE INDEX idx_player_stats_rating ON player_stats(rating DESC);
-- Consulta típica: top goleadores del torneo
CREATE INDEX idx_player_stats_goals ON player_stats(goals DESC);
-- Consulta típica: mejores ratings del torneo
CREATE INDEX idx_player_stats_mom ON player_stats(man_of_the_match) WHERE man_of_the_match = TRUE;
```

### `fixture_events` (eventos minuto a minuto del partido)

```sql
CREATE TABLE fixture_events (
  id          SERIAL PRIMARY KEY,
  fixture_id  INT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  team_id     INT NOT NULL REFERENCES teams(id),
  player_id   INT REFERENCES players(id),  -- NULL si es evento del equipo
  assist_id   INT REFERENCES players(id),  -- NULL si no tuvo asistencia
  event_type  TEXT NOT NULL,               -- goal, card, substitution, var, penalty
  detail      TEXT,                        -- "Normal Goal", "Yellow Card", "Red Card"
  minute      INT NOT NULL,                -- Minuto del evento
  extra_minute INT,                        -- Minuto adicional (ej: 90+3)
  comments    TEXT,                        -- Descripción textual
  cache_until TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fixture_id, minute, extra_minute, event_type, player_id)
);

CREATE INDEX idx_fixture_events_fixture ON fixture_events(fixture_id);
CREATE INDEX idx_fixture_events_player ON fixture_events(player_id);
CREATE INDEX idx_fixture_events_type ON fixture_events(event_type);
CREATE INDEX idx_fixture_events_minute ON fixture_events(fixture_id, minute);
```

---

## 4. Tablas de Sistema (Cache y Sync)

### `sync_log` (control de sincronización)

```sql
CREATE TABLE sync_log (
  id            SERIAL PRIMARY KEY,
  entity        TEXT NOT NULL,             -- 'fixtures', 'standings', 'teams', etc.
  entity_id     INT,                       -- NULL si es bulk, ID específico si individual
  status        TEXT NOT NULL,             -- 'pending', 'synced', 'failed', 'skipped'
  http_status   INT,                       -- Status code de API-Football
  requests_used INT DEFAULT 1,             -- Requests consumidos
  rows_inserted INT DEFAULT 0,
  rows_updated  INT DEFAULT 0,
  error_message TEXT,
  meta          JSONB,                     -- Detalle adicional
  synced_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_log_entity ON sync_log(entity);
CREATE INDEX idx_sync_log_status ON sync_log(status);
CREATE INDEX idx_sync_log_date ON sync_log(synced_at);
```

### `request_log` (budget diario API-Football)

```sql
CREATE TABLE request_log (
  id            SERIAL PRIMARY KEY,
  endpoint      TEXT NOT NULL,             -- '/fixtures', '/standings', etc.
  params        TEXT,                      -- Query params usados
  status        INT,                       -- HTTP 200, 429, etc.
  response_ms   INT,                       -- Tiempo de respuesta
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_request_log_date ON request_log(date);
-- Vista de consumo diario
CREATE INDEX idx_request_log_endpoint ON request_log(endpoint);
```

---

## 5. Tablas de Usuario y Fantasy (Clerk)

### `users` (vinculada a Clerk)

```sql
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  clerk_user_id   TEXT UNIQUE NOT NULL,    -- ID de Clerk (SUB del JWT)
  email           TEXT,
  name            TEXT,
  avatar_url      TEXT,                    -- Foto de perfil Clerk
  tier            TEXT NOT NULL DEFAULT 'free', -- 'free' | 'premium'
  premium_since   TIMESTAMPTZ,             -- NULL si free
  preferences     JSONB DEFAULT '{}',      -- Preferencias del usuario

  -- Flags de estado
  is_active       BOOLEAN DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_clerk ON users(clerk_user_id);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;
```

### `favorites` (equipos/jugadores favoritos del usuario)

```sql
CREATE TABLE favorites (
  id            SERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  entity_type   TEXT NOT NULL,             -- 'team' | 'player'
  entity_id     INT NOT NULL,              -- team_id o player_id
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, entity_type, entity_id)
);

CREATE INDEX idx_favorites_user ON favorites(clerk_user_id);
CREATE INDEX idx_favorites_type ON favorites(entity_type);
```

### `fantasy_teams` (cartolas del usuario)

```sql
CREATE TABLE fantasy_teams (
  id              SERIAL PRIMARY KEY,
  clerk_user_id   TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  name            TEXT NOT NULL,           -- Nombre de la cartola
  formation       TEXT DEFAULT '4-3-3',    -- Formación táctica
  budget_spent    DECIMAL(10,2) DEFAULT 0, -- Presupuesto gastado
  total_points    INT DEFAULT 0,           -- Puntos totales acumulados
  round_points    INT DEFAULT 0,           -- Puntos en la ronda actual
  is_active       BOOLEAN DEFAULT TRUE,    -- Cartola activa para la ronda
  is_premium      BOOLEAN DEFAULT FALSE,   -- Si usa features premium

  -- Cache de puntos por ronda (evita recalcular)
  points_per_round JSONB DEFAULT '[]',     -- [{round: 1, points: 45}, ...]

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fantasy_user ON fantasy_teams(clerk_user_id);
CREATE INDEX idx_fantasy_points ON fantasy_teams(total_points DESC);
CREATE INDEX idx_fantasy_active ON fantasy_teams(is_active) WHERE is_active = TRUE;
```

### `fantasy_picks` (jugadores seleccionados en cada cartola por ronda)

```sql
CREATE TABLE fantasy_picks (
  id                SERIAL PRIMARY KEY,
  fantasy_team_id   INT NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
  player_id         INT NOT NULL REFERENCES players(id),
  round             INT NOT NULL,           -- Ronda del torneo
  position_slot     INT NOT NULL,           -- 1-11: posición en la formación
  is_captain        BOOLEAN DEFAULT FALSE,
  is_vice_captain   BOOLEAN DEFAULT FALSE,
  points_earned     INT DEFAULT 0,          -- Puntos que rindió este jugador en esta ronda
  substituted       BOOLEAN DEFAULT FALSE,  -- Fue sustituido por otro pick
  created_at        TIMESTAMPTZ DEFAULT NOW(),

  -- Solo un capitán y un vice por cartola por ronda
  UNIQUE(fantasy_team_id, round, position_slot)
);

CREATE INDEX idx_fantasy_picks_team ON fantasy_picks(fantasy_team_id);
CREATE INDEX idx_fantasy_picks_player ON fantasy_picks(player_id);
CREATE INDEX idx_fantasy_picks_round ON fantasy_picks(round);
-- Un jugador solo puede estar en un pick por ronda (por cartola)
CREATE UNIQUE INDEX idx_fantasy_picks_unique_player
  ON fantasy_picks(fantasy_team_id, player_id, round);
```

### `fantasy_points` (puntos calculados por jugador por partido)

```sql
CREATE TABLE fantasy_points (
  id            SERIAL PRIMARY KEY,
  player_id     INT NOT NULL REFERENCES players(id),
  fixture_id    INT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  round         INT,
  base_points   INT NOT NULL DEFAULT 0,    -- Puntos base sin multiplicadores
  captain_bonus INT DEFAULT 0,             -- Puntos extra si fue capitán
  vice_bonus    INT DEFAULT 0,             -- Puntos extra si fue vice
  total_points  INT NOT NULL DEFAULT 0,    -- base + captain_bonus + vice_bonus
  breakdown     JSONB NOT NULL DEFAULT '{}',
  -- breakdown: {
  --   goals: 8, assists: 5, clean_sheet: 6, saves: 3,
  --   yellow_card: -2, man_of_match: 5, rating_bonus: 4
  -- }
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, fixture_id)
);

CREATE INDEX idx_fantasy_points_player ON fantasy_points(player_id);
CREATE INDEX idx_fantasy_points_fixture ON fantasy_points(fixture_id);
CREATE INDEX idx_fantasy_points_round ON fantasy_points(round);
```

### `user_history` (historial de acciones del usuario)

```sql
CREATE TABLE user_history (
  id            SERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  action        TEXT NOT NULL,             -- 'team_created', 'player_swapped',
                                           -- 'captain_changed', 'lineup_submitted',
                                           -- 'premium_upgraded'
  details       JSONB DEFAULT '{}',        -- Detalles específicos de la acción
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_history_user ON user_history(clerk_user_id);
CREATE INDEX idx_user_history_action ON user_history(action);
CREATE INDEX idx_user_history_date ON user_history(created_at);
```

---

## 6. Rankings (vistas materializadas para performance)

### `mv_ranking_global`

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

-- Refresh cada vez que se actualicen puntos
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ranking_global;
```

### `mv_ranking_by_round`

```sql
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
JOIN fantasy_points fpt ON fpt.player_id = fp.player_id
  AND fpt.round = fp.round
WHERE ft.is_active = TRUE
GROUP BY fp.round, ft.id, ft.name, u.name, u.clerk_user_id
ORDER BY fp.round, round_points DESC;

CREATE INDEX idx_ranking_round ON mv_ranking_by_round(round);
```

---

## 7. Resumen de Índices

| Tabla | Índice | Tipo | Consulta que acelera |
|---|---|---|---|
| `teams` | `group_name` | B-tree | Filtrar equipos por grupo |
| `players` | `team_id` | B-tree | Squad de un equipo |
| `players` | `position` | B-tree | Filtrar por posición |
| `players` | `name` | B-tree | Búsqueda de jugador |
| `fixtures` | `(date, status)` | Composite B-tree | Partidos de hoy |
| `fixtures` | `(home_team_id, date)` | Composite B-tree | Próximos partidos de un equipo |
| `fixtures` | `status` | B-tree | Partidos finalizados vs programados |
| `standings` | `(group_name, points DESC)` | Composite B-tree | Tabla de posiciones por grupo |
| `fixture_stats` | `fixture_id` | B-tree | Stats de un partido |
| `player_stats` | `(goals DESC)` | B-tree | Goleadores |
| `player_stats` | `(rating DESC)` | B-tree | Mejores ratings |
| `fixture_events` | `(fixture_id, minute)` | Composite B-tree | Timeline del partido |
| `sync_log` | `(entity, status)` | Composite B-tree | Último sync de cada entidad |
| `request_log` | `date` | B-tree | Budget diario |
| `users` | `clerk_user_id` | B-tree | Lookup por Clerk ID |
| `fantasy_teams` | `(total_points DESC)` | B-tree | Ranking global |
| `fantasy_picks` | `(fantasy_team_id, round)` | Composite B-tree | Picks de una ronda |
| `fantasy_points` | `(player_id, fixture_id)` | Composite | Puntos por partido |
| `user_history` | `(clerk_user_id, created_at)` | Composite | Historial del usuario |

---

## 8. Diagrama de Relaciones

```
teams ─────< players
  │            │
  │            │
  ├───< fixtures (home_team_id)
  │         │
  ├───< fixtures (away_team_id)
  │         │
  ├───< standings
  │         ├───< fixture_stats
  │         ├───< player_stats
  │         ├───< fixture_events
  │         └───< fantasy_points
  │
  └───< favorites


users (clerk_user_id)
  │
  ├───< fantasy_teams ───< fantasy_picks ───< players
  │         │
  ├───< favorites
  │
  └───< user_history
```

---

## 9. Orden de Migraciones

```
migrations/
├── 001_teams.sql
├── 002_players.sql
├── 003_fixtures.sql
├── 004_standings.sql
├── 005_fixture_stats.sql
├── 006_player_stats.sql
├── 007_fixture_events.sql
├── 008_sync_log.sql
├── 009_request_log.sql
├── 010_users.sql
├── 011_favorites.sql
├── 012_fantasy_teams.sql
├── 013_fantasy_picks.sql
├── 014_fantasy_points.sql
├── 015_user_history.sql
├── 016_views.sql
└── 017_materialized_views.sql
```

---

## 10. Notas de Performance

1. **Materialized views** para ranking — se refrescan post-partido, no en cada request
2. **Índices compuestos** en lugar de múltiples individuales para consultas frecuentes
3. **`cache_until`** permite al backend saber cuándo debe re-sincronizar sin consultar sync_log
4. **`ON DELETE CASCADE`** asegura limpieza al borrar usuarios (Clerk webhook `user.deleted`)
5. **`request_log`** se consulta vía `COUNT(*) WHERE date = CURRENT_DATE` — agregar índice cubriente si es lento
6. **`JSONB breakdown`** evita tablas extra para desglose de puntos; se puede consultar con `->>` si es necesario
7. **Particionado futuro**: `fixture_events` y `player_stats` podrían particionarse por `fixture_id` si el volumen crece
8. **`user_history`** puede rotarse (archivar registros > 1 año) vía cron si es necesario
