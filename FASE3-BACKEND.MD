# ⚙️ Backend — Cartola Mundialera

> Node.js + Express + Clerk SDK + PostgreSQL (Supabase)
> Sync service + REST API interna + Fantasy engine

---

## 1. Convenciones

| Regla | Estándar |
|---|---|
| Lenguaje | Node.js 20+ |
| Framework | Express 4.x |
| Autenticación | Clerk Express SDK (`@clerk/express`) |
| Roles | Sistema basado en columna `tier` + `role` en tabla users |
| Base de datos | Supabase PostgreSQL vía `pg` o `@supabase/supabase-js` (solo SQL) |
| Cache | React Query frontend + `cache_until` en DB |
| Sincronización | `node-cron` + endpoints protegidos |
| Rate limiting | `express-rate-limit` (interno) |
| Validación | `zod` |
| Logging | `pino` (estructurado) |

---

## 2. Estructura del Proyecto

```
server/
├── src/
│   ├── index.js                      Entry point — Express app
│   ├── app.js                        Configuración Express (middlewares, rutas)
│   │
│   ├── config/
│   │   ├── env.js                    Variables de entorno validadas con zod
│   │   ├── clerk.js                  Clerk client `@clerk/express`
│   │   └── database.js               Pool de conexión PostgreSQL
│   │
│   ├── middleware/
│   │   ├── auth.js                   requireAuth (verifica JWT Clerk)
│   │   ├── premium.js                requirePremium (para futuro)
│   │   ├── rateLimiter.js            Rate limiting interno
│   │   ├── validate.js               Validador con zod
│   │   ├── errorHandler.js           Manejador global de errores
│   │   └── requestLogger.js          Logging de requests
│   │
│   ├── routes/
│   │   ├── index.js                  Agrupador de rutas
│   │   ├── fixtures.js               GET /api/fixtures, /api/fixtures/:id
│   │   ├── standings.js              GET /api/standings
│   │   ├── teams.js                  GET /api/teams, /api/teams/:id
│   │   ├── players.js                GET /api/players, /api/players/:id
│   │   ├── fantasy.js                CRUD cartolas (protegido)
│   │   ├── rankings.js               GET /api/rankings
│   │   ├── auth.js                   POST /api/auth/webhook (Clerk)
│   │   ├── favorites.js              CRUD favoritos (protegido)
│   │   └── sync.js                   POST /api/sync/* (admin, protegido)
│   │
│   ├── controllers/
│   │   ├── fixtureController.js
│   │   ├── standingController.js
│   │   ├── teamController.js
│   │   ├── playerController.js
│   │   ├── fantasyController.js
│   │   ├── rankingController.js
│   │   ├── authController.js
│   │   ├── favoriteController.js
│   │   └── syncController.js
│   │
│   ├── services/
│   │   ├── apiFootball.js            Cliente API-Football (rate limited)
│   │   ├── syncService.js            Orquestador de sincronización
│   │   ├── fantasyEngine.js          Cálculo de puntos fantasy
│   │   ├── cacheService.js           Cache manager (cache_until)
│   │   └── rankingService.js         Refresh de materialized views
│   │
│   ├── repositories/
│   │   ├── teamRepo.js
│   │   ├── playerRepo.js
│   │   ├── fixtureRepo.js
│   │   ├── standingRepo.js
│   │   ├── fantasyRepo.js
│   │   └── userRepo.js
│   │
│   ├── validators/
│   │   ├── fantasySchema.js          Schemas zod para fantasy
│   │   └── webhookSchema.js          Schema para webhook Clerk
│   │
│   ├── jobs/
│   │   ├── syncScheduler.js          Cron jobs de sincronización
│   │   └── budgetMonitor.js          Alerta de consumo de requests
│   │
│   └── utils/
│       ├── errorCodes.js             Códigos de error estandarizados
│       ├── response.js               Formato de respuesta uniforme
│       ├── logger.js                 Logger pino
│       └── dateHelpers.js            Utilidades de fecha/hora
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── .env.example
├── package.json
└── Dockerfile
```

---

## 3. Variables de Entorno

```bash
# .env.example

# ── Servidor ──────────────────────────────
PORT=3001
NODE_ENV=development

# ── Clerk (Autenticación) ─────────────────
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# ── Supabase (solo PostgreSQL) ────────────
DATABASE_URL=postgresql://postgres:password@host:6543/postgres
SUPABASE_URL=https://xxxxx.supabase.co

# ── API-Football ─────────────────────────
API_FOOTBALL_KEY=xxxxx
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
API_FOOTBALL_RATE_LIMIT=9           # requests/min (margen de 1 sobre el límite de 10)

# ── Sincronización ───────────────────────
SYNC_CRON_SCHEDULE=*/15 * * * *     # Cada 15 min en ventana de partidos
SYNC_ADMIN_KEY=xxxxx                 # Key para endpoints de sync manual

# ── Logging ───────────────────────────────
LOG_LEVEL=info
```

---

## 4. Sistema de Roles

### Estructura de roles

```sql
-- En tabla users:
--   role: 'user' | 'admin'
--   tier: 'free' | 'premium'
--
-- Jerarquía:
--   admin  → bypass total (requirePremium, requireAdmin, etc.)
--   premium → acceso a features pagos
--   free   → funcionalidad base
```

### Middleware chain completa (orden de ejecución)

```javascript
// En cada ruta protegida, el orden de middlewares es:

// 1. Rate limiter (antes de cualquier lógica pesada)
router.use(rateLimiter)

// 2. Autenticación (valida JWT, upsert usuario, setea req.user)
router.use(requireAuth)

// 3. Validación del body (zod)
router.post('/team', validate(createTeamSchema), controller.create)

// 4. Autorización (roles)
router.put('/admin/sync', requireAdmin, controller.sync)

// 5. Handler (lógica de negocio)
router.get('/team', controller.getMyTeam)
```

### Mapa de protección por ruta

| Ruta | Middleware | Acceso |
|---|---|---|
| `GET /api/fixtures` | — | Público |
| `GET /api/standings` | — | Público |
| `GET /api/teams` | — | Público |
| `GET /api/players` | — | Público |
| `GET /api/players/top` | — | Público |
| `GET /api/rankings` | `optionalAuth` | Público + datos extra si auth |
| `GET /api/fantasy/team` | `requireAuth` | Solo dueño |
| `POST /api/fantasy/team` | `requireAuth` | Usuario autenticado |
| `PUT /api/fantasy/team/:id` | `requireAuth` | Solo dueño |
| `POST /api/favorites` | `requireAuth` | Solo dueño |
| `POST /api/sync/*` | `requireAuth` + `requireAdmin` | Solo admin |
| `POST /api/auth/webhook` | Svix verification | Clerk (sin JWT) |

## 5. Config Clerk

### `config/clerk.js`

```javascript
// config/clerk.js
// Singleton del cliente Clerk usando @clerk/express
// @clerk/express wrappea automáticamente @clerk/backend
// y provee middleware Express nativo.

const { createClerkClient } = require('@clerk/express')

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  apiUrl: 'https://api.clerk.com',        // Producción
  // apiVersion: '2024-10-01',             // Versión de API (opcional)
  jwtKey: process.env.CLERK_JWT_KEY,       // Clave pública PEM para verificación local
  // ⚡ Con jwtKey, Clerk verifica JWTs localmente (sin llamada HTTP externa)
  //    Sin jwtKey, Clerk llama a su API para verificar (lento, gasta request)
})

module.exports = { clerkClient }
```

### Variables de entorno Clerk

```bash
# Obligatorias
CLERK_SECRET_KEY=sk_live_xxxxx              # Backend: firmar/verificar tokens
CLERK_PUBLISHABLE_KEY=pk_live_xxxxx         # Frontend: inicializar Clerk

# Para verificación local de JWTs (recomendado)
CLERK_JWT_KEY=-----BEGIN PUBLIC KEY-----... # Evita llamadas HTTP a Clerk por cada request

# Webhooks
CLERK_WEBHOOK_SECRET=whsec_xxxxx            # Firmar requests del webhook

# Frontend
CLIENT_URL=https://cartolamundialera.com    # Validar authorizedParties
```

### Flujo de verificación de token

```
Request → Authorization: Bearer <JWT>
  │
  ├─ ¿Hay jwtKey en env?
  │   ├─ ✅ SÍ  → clerkClient.verifyToken() verifica localmente
  │   │            usando la clave pública PEM (rápido, 0 requests)
  │   └─ ❌ NO  → clerkClient.verifyToken() llama a Clerk API
  │                  (lento, consume request del rate limit de Clerk)
  │
  ├─ ¿Token expirado?        → 401 TOKEN_EXPIRED
  ├─ ¿Firma inválida?        → 401 TOKEN_INVALID
  ├─ ¿Audiencia no coincide? → 401 TOKEN_INVALID
  └─ ✅ Válido → payload.sub = clerk_user_id
                  → Upsert en PostgreSQL
                  → req.user = { id, clerk_user_id, email, name, tier, role }
```

### `auth.js` — requireAuth + requireRole

```javascript
// middleware/auth.js
const { clerkClient } = require('@clerk/express')
const { pool } = require('../config/database')
const { logger } = require('../utils/logger')

// ── Extrae y valida token JWT ──────────────────────────────
async function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'Token de autenticación requerido' },
    })
  }

  const token = header.replace('Bearer ', '')

  try {
    // Clerk verifica el JWT automáticamente
    // Verifica: firma, expiración, issuer, audiencia
    const payload = await clerkClient.verifyToken(token, {
      jwtKey: process.env.CLERK_JWT_KEY,       // Opcional: PEM pública
      authorizedParties: [
        process.env.CLIENT_URL,
        'http://localhost:5173',
      ],
    })

    // Payload contiene: sub (clerk_user_id), sid (session_id), claims
    const clerkUserId = payload.sub

    // Upsert: busca al usuario o lo crea si el webhook aún no llegó
    const result = await pool.query(`
      INSERT INTO users (clerk_user_id, email, name, last_login_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (clerk_user_id)
      DO UPDATE SET
        last_login_at = NOW(),
        email         = COALESCE($2, users.email),
        name          = COALESCE($3, users.name)
      RETURNING id, clerk_user_id, email, name, tier, role, avatar_url, premium_since
    `, [
      clerkUserId,
      payload.email || null,
      payload.name || payload.username || null,
    ])

    req.user = result.rows[0]
    req.sessionId = payload.sid

    logger.debug({ clerkUserId, role: req.user.role }, 'Auth success')
    next()
  } catch (err) {
    // Clerk lanza errores específicos: TokenExpired, TokenInvalid, etc.
    const code =
      err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' :
      err.name === 'TokenInvalidError' ? 'TOKEN_INVALID' :
      'INVALID_TOKEN'

    return res.status(401).json({
      success: false,
      error: { code, message: 'Token inválido o expirado' },
    })
  }
}

// ── Protección por rol (para futuro) ───────────────────────
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'NO_AUTH', message: 'Autenticación requerida' },
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_ROLE',
          message: `Se requiere rol: ${roles.join(' o ')}`,
          required_roles: roles,
          current_role: req.user.role,
        },
      })
    }

    next()
  }
}

// ── Admin shortcut ─────────────────────────────────────────
const requireAdmin = requireRole('admin')

// ── Session refresh middleware ─────────────────────────────
async function optionalAuth(req, res, next) {
  // Similar a requireAuth pero no rechaza si no hay token
  // Útil para rutas que tienen contenido diferente para auth vs anonymous
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    req.user = null
    return next()
  }

  try {
    const token = header.replace('Bearer ', '')
    const payload = await clerkClient.verifyToken(token)
    const result = await pool.query(
      'SELECT id, clerk_user_id, email, name, tier, role FROM users WHERE clerk_user_id = $1',
      [payload.sub]
    )
    req.user = result.rows[0] || null
  } catch {
    req.user = null
  }
  next()
}

module.exports = { requireAuth, optionalAuth, requireRole, requireAdmin }
```

### `premium.js` — requirePremium (tier-based)

```javascript
// middleware/premium.js

// Sistema de roles para el futuro:
//   role:    'user' | 'admin'
//   tier:    'free' | 'premium'
//
// Combinaciones posibles:
//   role=user,  tier=free     → usuario gratuito
//   role=user,  tier=premium  → usuario premium
//   role=admin, tier=free     → admin (no paga, bypass)
//   role=admin, tier=premium  → admin premium

async function requirePremium(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_AUTH', message: 'Autenticación requerida' },
    })
  }

  // Admin bypass automático
  if (req.user.role === 'admin') return next()

  if (req.user.tier !== 'premium') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'PREMIUM_REQUIRED',
        message: 'Esta funcionalidad requiere cuenta premium',
        upgrade_url: '/pricing',
        features: [
          'Múltiples cartolas',
          'Estadísticas avanzadas',
          'Historial completo',
          'Sin anuncios',
        ],
      },
    })
  }

  next()
}

module.exports = { requirePremium }
```

## 6. Middleware

### `rateLimiter.js`

```javascript
const rateLimit = require('express-rate-limit')

// Límite general: 60 requests/min por IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Demasiadas solicitudes' },
  },
})

// Límite para sync endpoints (admin): 5 requests/min
const syncLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
})

module.exports = { generalLimiter, syncLimiter }
```

### `errorHandler.js`

```javascript
const { logger } = require('../utils/logger')

function errorHandler(err, req, res, _next) {
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error')

  const status = err.status || 500
  const code = err.code || 'INTERNAL_ERROR'
  const message = status === 500 ? 'Error interno del servidor' : err.message

  res.status(status).json({
    success: false,
    error: { code, message },
  })
}

module.exports = { errorHandler }
```

---

## 7. Formato de Respuesta Uniforme

### Éxito

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 104,
    "cache": {
      "fresh": true,
      "synced_at": "2026-06-14T10:00:00Z",
      "expires_at": "2026-06-14T11:00:00Z"
    }
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos inválidos",
    "details": [
      { "field": "name", "message": "El nombre es requerido" }
    ]
  }
}
```

---

## 8. Endpoints Internos

### Públicos (sin autenticación)

```
GET /api/fixtures
  Query: ?date=2026-06-14&team=1&round=Group+Stage+-+1&status=scheduled
  Response: fixtures[] + meta.cache

GET /api/fixtures/:id
  Response: fixture + fixture_stats[] + fixture_events[] + player_stats[]

GET /api/standings
  Query: ?group=Group+A
  Response: standings[] agrupados

GET /api/teams
  Query: ?group=Group+A
  Response: teams[]

GET /api/teams/:id
  Response: team + players[] (squad)

GET /api/teams/:id/stats
  Response: estadísticas agregadas del equipo en el torneo

GET /api/players
  Query: ?team=1&position=Attacker&search=neymar
  Response: players[]

GET /api/players/top
  Query: ?type=goals&limit=10
  Response: top goleadores, asistencias, tarjetas

GET /api/players/:id
  Response: player + stats acumuladas por partido

GET /api/rankings
  Query: ?round=1
  Response: ranking global o por ronda (desde materialized views)
```

### Protegidos (requireAuth)

```
GET /api/fantasy/team
  Response: fantasy_team + picks[] + points

POST /api/fantasy/team
  Body: { name, formation, picks: [{ player_id, position_slot, is_captain, is_vice_captain }] }
  Response: fantasy_team creado

PUT /api/fantasy/team/:id
  Body: { name, formation, picks[] }
  Response: fantasy_team actualizado

GET /api/fantasy/team/:id/points
  Response: desglose de puntos por ronda

GET /api/favorites
  Query: ?type=team
  Response: favorites[]

POST /api/favorites
  Body: { entity_type, entity_id }
  Response: favorite creado

DELETE /api/favorites/:id
  Response: 204

GET /api/user/history
  Query: ?action=team_created&limit=20
  Response: user_history[]
```

### Webhooks Clerk

```
POST /api/auth/webhook
  Headers: svix-id, svix-timestamp, svix-signature
  Body: { type: "user.created" | "user.updated" | "user.deleted", data: { id, ... } }
  Response: 200 OK

  Validación:
    1. Verificar firma Svix
    2. user.created → INSERT users
    3. user.updated → UPDATE users
    4. user.deleted → soft delete en users + cascade a fantasy_teams
```

### Sync (admin, protegido con clave)

```
POST /api/sync/fixtures
  Auth: x-admin-key
  Response: { synced: 104, requests_used: 1 }

POST /api/sync/standings
  Response: { synced: 12, requests_used: 1 }

POST /api/sync/squads
  Response: { teams_synced: 48, requests_used: 48 }

POST /api/sync/match/:fixtureId
  Response: { fixture_stats: true, player_stats: true, events: true, requests_used: 3 }

POST /api/sync/points/:fixtureId
  Response: recalcula fantasy_points para ese fixture

POST /api/sync/rankings
  Response: REFRESH MATERIALIZED VIEW
```

---

## 9. Servicios

### `apiFootball.js` — Cliente API-Football con rate limiting

```javascript
const axios = require('axios')
const Bottleneck = require('bottleneck')  // Rate limiter

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 60000 / parseInt(process.env.API_FOOTBALL_RATE_LIMIT || 9), // ~6.6s entre requests
  reservoir: parseInt(process.env.API_FOOTBALL_RATE_LIMIT || 9),
  reservoirRefreshAmount: 9,
  reservoirRefreshInterval: 60 * 1000,
})

const client = axios.create({
  baseURL: process.env.API_FOOTBALL_BASE_URL,
  headers: {
    'x-rapidapi-key': process.env.API_FOOTBALL_KEY,
    'x-rapidapi-host': 'v3.football.api-sports.io',
  },
  timeout: 15000,
})

async function get(endpoint, params = {}) {
  return limiter.schedule(async () => {
    const start = Date.now()
    try {
      const { data, headers } = await client.get(endpoint, { params })

      // Log para control de budget
      await logRequest(endpoint, params, headers['x-ratelimit-requests-remaining'])

      return data
    } catch (err) {
      if (err.response?.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED — esperar al próximo minuto')
      }
      throw err
    }
  })
}

async function logRequest(endpoint, params, remaining) {
  const { pool } = require('../config/database')
  await pool.query(
    `INSERT INTO request_log (endpoint, params, date) VALUES ($1, $2, CURRENT_DATE)`,
    [endpoint, JSON.stringify(params)]
  )

  if (remaining < 20) {
    logger.warn({ remaining, endpoint }, '⚠️ Budget bajo de API-Football')
  }
}

module.exports = { get }
```

### `syncService.js` — Orquestador de sincronización

```javascript
const apiFootball = require('./apiFootball')
const { pool } = require('../config/database')
const { logger } = require('../utils/logger')

const LEAGUE_ID = 1
const SEASON = 2026

class SyncService {

  async syncAllFixtures() {
    logger.info('Syncing all fixtures for WC 2026...')
    const data = await apiFootball.get('/fixtures', {
      league: LEAGUE_ID,
      season: SEASON,
    })

    let inserted = 0, updated = 0
    for (const fixture of data.response) {
      const f = fixture.fixture
      const teams = fixture.teams
      const goals = fixture.goals

      await pool.query(`
        INSERT INTO fixtures (id, round, date, status, home_team_id, away_team_id,
                              home_score, away_score, venue, stage, cache_until)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                NOW() + INTERVAL '6 hours')
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          home_score = EXCLUDED.home_score,
          away_score = EXCLUDED.away_score,
          updated_at = NOW()
      `, [
        f.id, f.round?.name, f.date, f.status?.short,
        teams.home.id, teams.away.id,
        goals.home, goals.away,
        f.venue?.name, f.round?.name,
      ])
      if (fixture._existing) updated++; else inserted++
    }

    await this._logSync('fixtures', 'synced', data.results)
    logger.info({ inserted, updated }, 'Fixtures synced')
  }

  async syncStandings() {
    const data = await apiFootball.get('/standings', {
      league: LEAGUE_ID,
      season: SEASON,
    })

    for (const group of data.response[0]?.league?.standings || []) {
      for (const row of group) {
        await pool.query(`
          INSERT INTO standings (group_name, team_id, position, played, wins, draws,
                                 losses, gf, ga, gd, points, form, cache_until)
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
        `, [
          row.group?.name || group[0]?.group, row.team.id,
          row.position, row.all?.played, row.all?.win,
          row.all?.draw, row.all?.lose, row.all?.goals?.for,
          row.all?.goals?.against, row.goalsDiff, row.points,
          row.form,
        ])
      }
    }

    await this._logSync('standings', 'synced', data.results)
  }

  async syncSquad(teamId) {
    const data = await apiFootball.get('/players/squads', { team: teamId })
    const squad = data.response[0]?.players || []

    for (const player of squad) {
      await pool.query(`
        INSERT INTO players (id, team_id, name, position, age, nationality, photo, number, cache_until)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '24 hours')
        ON CONFLICT (id) DO UPDATE SET
          team_id = EXCLUDED.team_id,
          number = EXCLUDED.number,
          updated_at = NOW()
      `, [player.id, teamId, player.name, player.position, player.age,
          player.nationality, player.photo, player.number])
    }

    await this._logSync(`squad:${teamId}`, 'synced', squad.length)
  }

  async syncMatchDetails(fixtureId) {
    // 1. Estadísticas del partido
    const statsData = await apiFootball.get('/fixtures/statistics', { fixture: fixtureId })
    for (const teamStats of statsData.response) {
      const s = {}
      for (const stat of teamStats.statistics) {
        s[stat.type] = stat.value
      }
      await pool.query(`
        INSERT INTO fixture_stats (fixture_id, team_id, shots, shots_on_target, possession,
                                   total_passes, accurate_passes, fouls, corners, offsides,
                                   yellow_cards, red_cards, saves, cache_until)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                NOW() + INTERVAL '24 hours')
        ON CONFLICT (fixture_id, team_id) DO UPDATE SET
          shots = EXCLUDED.shots, shots_on_target = EXCLUDED.shots_on_target,
          updated_at = NOW()
      `, [
        fixtureId, teamStats.team.id,
        parseInt(s['Shots on Goal']) || 0, parseInt(s['Shots off Goal']) || 0,
        parseFloat(s['Ball Possession']) || 0,
        parseInt(s['Total passes']) || 0, parseInt(s['Passes accurate']) || 0,
        parseInt(s['Fouls']) || 0, parseInt(s['Corner Kicks']) || 0,
        parseInt(s['Offsides']) || 0, parseInt(s['Yellow Cards']) || 0,
        parseInt(s['Red Cards']) || 0, parseInt(s['Goalkeeper Saves']) || 0,
      ])
    }

    // 2. Estadísticas de jugadores
    const playerData = await apiFootball.get('/fixtures/players', { fixture: fixtureId })
    for (const teamPlayers of playerData.response) {
      for (const p of teamPlayers.players) {
        const ps = p.statistics[0]
        await pool.query(`
          INSERT INTO player_stats (fixture_id, player_id, team_id, rating, minutes_played,
            position, goals, assists, shots, shots_on_target, key_passes, passes,
            accurate_passes, tackles, interceptions, clearances, blocked_shots,
            fouls, fouls_drawn, offsides, yellow_card, red_card, saves,
            goals_conceded, penalties_saved, penalties_missed, man_of_the_match, cache_until)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
                  $21,$22,$23,$24,$25,$26,$27,NOW() + INTERVAL '24 hours')
          ON CONFLICT (fixture_id, player_id) DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW()
        `, [
          fixtureId, p.player.id, teamPlayers.team.id,
          parseFloat(ps.games?.rating) || null,
          ps.games?.minutes || 0, ps.games?.position || 'Unknown',
          ps.goals?.total || 0, ps.goals?.assists || 0,
          ps.shots?.total || 0, ps.shots?.on || 0,
          ps.passes?.key || 0, ps.passes?.total || 0,
          ps.passes?.accuracy || 0, ps.tackles?.total || 0,
          ps.tackles?.interceptions || 0, ps.duels?.total || 0,
          ps.duels?.won || 0,
          ps.fouls?.drawn || 0, ps.fouls?.committed || 0,
          ps.offsides || 0, ps.cards?.yellow ? true : false,
          ps.cards?.red ? true : false,
          ps.goals?.saves || 0, ps.goals?.conceded || 0,
          ps.penalty?.saved || 0, ps.penalty?.missed || 0,
          (parseFloat(ps.games?.rating) || 0) >= 9.0 ? true : false,
        ])
      }
    }

    // 3. Eventos del partido (goles, tarjetas, cambios)
    const eventsData = await apiFootball.get('/fixtures/events', { fixture: fixtureId })
    for (const event of eventsData.response) {
      await pool.query(`
        INSERT INTO fixture_events (fixture_id, team_id, player_id, assist_id,
                                    event_type, detail, minute, extra_minute, comments, cache_until)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() + INTERVAL '24 hours')
        ON CONFLICT (fixture_id, minute, extra_minute, event_type, player_id)
        DO UPDATE SET detail = EXCLUDED.detail
      `, [
        fixtureId, event.team.id, event.player?.id || null,
        event.assist?.id || null, event.type, event.detail,
        event.time?.elapsed || 0, event.time?.extra || 0,
        event.comments || null,
      ])
    }

    await this._logSync(`match:${fixtureId}`, 'synced', 3)
    logger.info({ fixtureId }, 'Match details synced')
  }

  async _logSync(entity, status, count) {
    await pool.query(
      `INSERT INTO sync_log (entity, status, rows_inserted, meta, synced_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [entity, status, count, JSON.stringify({ timestamp: new Date().toISOString() })]
    )
  }
}

module.exports = new SyncService()
```

### `fantasyEngine.js` — Cálculo de puntos

```javascript
const { pool } = require('../config/database')
const { logger } = require('../utils/logger')

class FantasyEngine {

  // Reglas de puntuación
  RULES = {
    goals:              8,
    assists:            5,
    clean_sheet:        6,    // defensas y arqueros
    every_3_saves:      3,    // arqueros
    key_passes_3plus:   3,    // 3+ pases clave
    yellow_card:       -2,
    red_card:          -5,
    goal_conceded:     -2,    // arqueros y defensas
    missed_penalty:    -3,
    man_of_match:       5,
    rating_ge_8:        4,    // rating >= 8.0
    rating_le_5:       -3,    // rating <= 5.0
    captain_mult:       2,    // ×2
    vice_mult:          1.5,  // ×1.5
  }

  async calculatePoints(fixtureId) {
    const fixture = await pool.query(
      'SELECT id, round FROM fixtures WHERE id = $1', [fixtureId]
    )
    if (!fixture.rows[0]) throw new Error('Fixture not found')
    const round = fixture.rows[0].round

    const players = await pool.query(`
      SELECT ps.*, p.position
      FROM player_stats ps
      JOIN players p ON p.id = ps.player_id
      WHERE ps.fixture_id = $1
    `, [fixtureId])

    for (const player of players.rows) {
      const breakdown = {}
      let basePoints = 0

      // Goles
      if (player.goals > 0) {
        const pts = player.goals * this.RULES.goals
        basePoints += pts
        breakdown.goals = pts
      }

      // Asistencias
      if (player.assists > 0) {
        const pts = player.assists * this.RULES.assists
        basePoints += pts
        breakdown.assists = pts
      }

      // Clean sheet (defensas y arqueros, mínimo 60 min jugados)
      if (player.minutes_played >= 60
          && (player.position === 'Goalkeeper' || player.position === 'Defender')
          && player.goals_conceded === 0) {
        basePoints += this.RULES.clean_sheet
        breakdown.clean_sheet = this.RULES.clean_sheet
      }

      // Atajadas (arqueros)
      if (player.position === 'Goalkeeper' && player.saves >= 3) {
        const pts = Math.floor(player.saves / 3) * this.RULES.every_3_saves
        basePoints += pts
        breakdown.saves = pts
      }

      // Pases clave
      if (player.key_passes >= 3) {
        basePoints += this.RULES.key_passes_3plus
        breakdown.key_passes_bonus = this.RULES.key_passes_3plus
      }

      // Tarjetas
      if (player.yellow_card) {
        basePoints += this.RULES.yellow_card
        breakdown.yellow_card = this.RULES.yellow_card
      }
      if (player.red_card) {
        basePoints += this.RULES.red_card
        breakdown.red_card = this.RULES.red_card
      }

      // Goles en contra
      if ((player.position === 'Goalkeeper' || player.position === 'Defender')
          && player.goals_conceded > 0) {
        const pts = player.goals_conceded * this.RULES.goal_conceded
        basePoints += pts
        breakdown.goals_conceded = pts
      }

      // Penales errados
      if (player.penalties_missed > 0) {
        const pts = player.penalties_missed * this.RULES.missed_penalty
        basePoints += pts
        breakdown.missed_penalty = pts
      }

      // Man of the match
      if (player.man_of_the_match) {
        basePoints += this.RULES.man_of_match
        breakdown.man_of_match = this.RULES.man_of_match
      }

      // Rating bonus
      if (player.rating >= 8.0) {
        basePoints += this.RULES.rating_ge_8
        breakdown.rating_bonus = this.RULES.rating_ge_8
      } else if (player.rating <= 5.0 && player.rating > 0) {
        basePoints += this.RULES.rating_le_5
        breakdown.rating_penalty = this.RULES.rating_le_5
      }

      // Guardar puntos base
      await pool.query(`
        INSERT INTO fantasy_points (player_id, fixture_id, round, base_points, breakdown)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (player_id, fixture_id)
        DO UPDATE SET base_points = EXCLUDED.base_points, breakdown = EXCLUDED.breakdown,
                      calculated_at = NOW()
      `, [player.player_id, fixtureId, round, basePoints, JSON.stringify(breakdown)])
    }

    // Aplicar multiplicadores de capitán/vice y actualizar totales
    await this._applyCaptainMultipliers(fixtureId, round)
    await this._updateTeamTotals(round)

    logger.info({ fixtureId, round, players: players.rows.length }, 'Fantasy points calculated')
  }

  async _applyCaptainMultipliers(fixtureId, round) {
    // Capitán: ×2, Vice: ×1.5 sobre base_points
    await pool.query(`
      UPDATE fantasy_points fp
      SET
        captain_bonus = CASE WHEN fp2.is_captain
          THEN fp.base_points * $1 ELSE 0 END,
        vice_bonus = CASE WHEN fp2.is_vice_captain AND NOT fp2.is_captain
          THEN fp.base_points * $2 ELSE 0 END,
        total_points = fp.base_points
          + CASE WHEN fp2.is_captain THEN fp.base_points * $1 ELSE 0 END
          + CASE WHEN fp2.is_vice_captain AND NOT fp2.is_captain
              THEN fp.base_points * $2 ELSE 0 END
      FROM fantasy_picks fp2
      WHERE fp2.player_id = fp.player_id
        AND fp2.round = fp.round
        AND fp.fixture_id = $3
        AND fp.round = $4
    `, [this.RULES.captain_mult - 1, this.RULES.vice_mult - 1, fixtureId, round])
  }

  async _updateTeamTotals(round) {
    // Actualizar total_points en fantasy_teams y points_earned en fantasy_picks
    await pool.query(`
      UPDATE fantasy_teams ft
      SET total_points = (
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
      updated_at = NOW()
    `, [round])

    await pool.query(`
      UPDATE fantasy_picks fpk
      SET points_earned = (
        SELECT COALESCE(fp.total_points, 0)
        FROM fantasy_points fp
        WHERE fp.player_id = fpk.player_id AND fp.round = fpk.round
      )
      WHERE fpk.round = $1
    `, [round])
  }
}

module.exports = new FantasyEngine()
```

### `cacheService.js` — Cache manager

```javascript
const { pool } = require('../config/database')

class CacheService {

  // ¿El cache de una entidad sigue fresco?
  async isFresh(entity) {
    const result = await pool.query(
      `SELECT cache_until FROM sync_log WHERE entity = $1 AND status = 'synced'`,
      [entity]
    )
    if (!result.rows[0]) return false
    return new Date(result.rows[0].cache_until) > new Date()
  }

  // Actualizar cache_until en lote para una tabla
  async refreshEntity(table, ids, ttlHours = 6) {
    if (!ids || ids.length === 0) return
    await pool.query(`
      UPDATE ${table}
      SET cache_until = NOW() + INTERVAL '${ttlHours} hours'
      WHERE id = ANY($1::int[])
    `, [ids])
  }

  // Cache individual
  async isFixtureFresh(fixtureId) {
    const result = await pool.query(
      'SELECT cache_until FROM fixtures WHERE id = $1', [fixtureId]
    )
    if (!result.rows[0]?.cache_until) return false

    // Si el partido ya terminó, el cache es permanente
    const status = await pool.query(
      'SELECT status FROM fixtures WHERE id = $1', [fixtureId]
    )
    if (status.rows[0]?.status === 'match finished') return true

    // Si está programado, cache por 6 horas
    return new Date(result.rows[0].cache_until) > new Date()
  }
}

module.exports = new CacheService()
```

---

## 10. Scheduler (Cron Jobs)

### `syncScheduler.js`

```javascript
const cron = require('node-cron')
const syncService = require('../services/syncService')
const fantasyEngine = require('../services/fantasyEngine')
const { logger } = require('../utils/logger')
const { pool } = require('../config/database')

class SyncScheduler {

  start() {
    // Cada 15 min durante el torneo: verificar partidos finalizados
    cron.schedule('*/15 * * * *', async () => {
      logger.info('Cron: checking for finished matches...')
      await this.checkFinishedMatches()
    })

    // Cada día a las 06:00 UTC: sync fixtures del día
    cron.schedule('0 6 * * *', async () => {
      logger.info('Cron: daily fixture sync...')
      await syncService.syncAllFixtures()
    })

    // Después del último partido del día (~22:00 UTC): standings + tops
    cron.schedule('0 22 * * *', async () => {
      logger.info('Cron: nightly standings sync...')
      await syncService.syncStandings()

      // Refrescar rankings
      const { pool } = require('../config/database')
      await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ranking_global')
      await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ranking_by_round')
    })

    logger.info('Sync scheduler started')
  }

  async checkFinishedMatches() {
    // Buscar fixtures en DB que están 'scheduled' pero que API-Football marca como finalizados
    const result = await pool.query(`
      SELECT id FROM fixtures
      WHERE status = 'scheduled'
        AND date <= NOW()
    `)

    for (const row of result.rows) {
      try {
        // Sync completo del partido
        await syncService.syncMatchDetails(row.id)
        // Calcular puntos fantasy
        await fantasyEngine.calculatePoints(row.id)
        // Marcar como finalizado en fixtures
        await pool.query(
          "UPDATE fixtures SET status = 'match finished', updated_at = NOW() WHERE id = $1",
          [row.id]
        )
        logger.info({ fixtureId: row.id }, 'Match completed and synced')
      } catch (err) {
        logger.error({ fixtureId: row.id, err }, 'Failed to sync match')
      }
    }
  }
}

module.exports = new SyncScheduler()
```

---

## 11. Cronograma de Sincronización

```
Pre-torneo (1-2 días antes)
├── teams.sql       → 1 request (bulk)
├── players/squads  → 48 requests (1 por equipo)
├── fixtures        → 1 request (todos los 104 partidos)
├── standings       → 1 request (initial)
├── topscorers      → 1 request
└── topassists      → 1 request
Total: ~53 requests

Día de partidos (c/15 min)
├── checkFinished   → 0 requests (compara local)
└── Si hay partido finalizado:
    ├── fixture_stats    → 1 request
    ├── player_stats     → 1 request
    ├── fixture_events   → 1 request
    └── fantasy_points   → 0 requests (cálculo local)
    Total por partido: 3 requests

Post-matchday (22:00 UTC)
├── standings      → 1 request
├── refresh mv_ranking_global  → 0 requests
└── refresh mv_ranking_by_round → 0 requests
Total: 1 request
```

---

## 12. Budget Diario (Simulación)

| Escenario | Requests | Budget restante |
|---|---|---|
| Sin partidos (off-day) | 1 (fixtures diarios) | 99 |
| 4 partidos | 1 + (4 × 3) + 1 = 14 | 86 |
| 6 partidos (pico grupos) | 1 + (6 × 3) + 1 = 20 | 80 |
| 8 partidos (máximo teórico) | 1 + (8 × 3) + 1 = 26 | 74 |

---

## 13. package.json

```json
{
  "name": "cartola-mundialera-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "sync:fixtures": "node scripts/syncFixtures.js",
    "sync:squads": "node scripts/syncSquads.js",
    "sync:standings": "node scripts/syncStandings.js",
    "test": "vitest",
    "lint": "eslint src/"
  },
  "dependencies": {
    "@clerk/express": "^1.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "axios": "^1.7.0",
    "bottleneck": "^2.19.5",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "express": "^4.19.0",
    "express-rate-limit": "^7.0.0",
    "helmet": "^7.1.0",
    "node-cron": "^3.0.3",
    "pino": "^9.0.0",
    "pg": "^8.12.0",
    "svix": "^1.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "vitest": "^1.6.0"
  }
}
```
