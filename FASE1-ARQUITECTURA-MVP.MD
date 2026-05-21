# 🏆 Cartola Mundialera — Arquitectura MVP

> Aplicación Fantasy/Estadísticas del Mundial FIFA 2026
> Basada en API-Football v3 (plan FREE: 100 req/día, 10 req/min)
> World Cup 2026: `league_id=1`, `season=2026`, 104 partidos, ~30 días, 48 equipos

---

## 1. Restricciones del Plan FREE

| Límite | Valor |
|---|---|
| Requests por día | 100 |
| Requests por minuto | 10 |
| Competencias | Todas (free limitado a seasons recientes) |
| Endpoints | Todos disponibles |
| Live updates | Cada 15 seg (pero NO los usaremos) |

---

## 2. Estrategia de Requests (CRÍTICA)

### Presupuesto diario estimado

| Tipo request | Qty | Frecuencia |
|---|---|---|
| Fixtures del día | 0-1 | 1x al día (cache infinito) |
| Match stats + player ratings | 2 × N partidos | Por cada partido finalizado |
| Standings | 1 | Post matchday |
| Top scorers/asists | 2 | Post matchday |
| **Total pico (6 partidos/día)** | **~15-17 req** | ✅ **83% margen** |

### Reglas de oro

- **Cache infinito** para lo que no cambia (equipos, jugadores, fixtures programados)
- **Un solo request bulk** (`fixtures?league=1&season=2026`) trae TODOS los 104 partidos
- **48 squads** = 48 requests, pero se hace UNA SOLA VEZ pre-torneo y se cachea para siempre
- **Sincronización post-partido** only (nunca poll cada N segundos)
- **No live scoring** — solo resultados finalizados

### Simulación fase de grupos (5.5 partidos/día en ~13 días)

```
Día tipo con 6 partidos:
  06:00  GET fixtures del día           →  1 req
  13:00  POST-partido (1° tanda)       →  6 req  (2×3)
  20:00  POST-partido (2° tanda)       →  6 req  (2×3)
  22:00  standings + tops              →  3 req
  ──────────────────────────────────
  Total: 16 requests (84% margen)
```

---

## 3. Flujo de Datos

```
API-Football (v3.football.api-sports.io)
    │
    ▼
┌──────────────────────┐
│   Sync Service       │  ─── Cron programado + trigger manual
│   (Node/Express)     │
└──────┬───────────────┘
       │ escribe
       ▼
┌──────────────────────┐
│   PostgreSQL         │  ─── Única fuente de verdad
│   (Supabase SQL)     │       Frontend NUNCA toca API externa
└──────┬───────────────┘
       │ lee (REST)
       ▼
┌──────────────────────┐
│   Express API        │  ─── Endpoints internos /api/*
│   (tu backend)       │       Validación JWT via Clerk SDK
└──────┬───────────────┘
       │ JSON
       ▼
┌──────────────────────┐
│   React + Vite       │
│   Clerk React SDK    │
│   TailwindCSS        │
└──────────────────────┘
```

---

## 4. Autenticación con Clerk

### Visión general

| Aspecto | Implementación |
|---|---|
| Frontend | `<ClerkProvider>` wrap en App, `<SignInButton/>`, `<UserButton/>`, `<Protect/>` |
| Backend | Clerk SDK valida JWT en cada request protegido |
| Sesión | Clerk maneja sesión vía cookies/JWT automáticamente |
| DB users | Webhook `user.created` → Express crea registro en PostgreSQL |
| Premium futuro | Campo `tier` en tabla `users` + middleware `requirePremium` |

### Flujo de autenticación completo

```
Usuario visita /sign-in
  │
  ▼
Clerk hosted UI o <SignInButton/>  ─── Clerk maneja todo
  │                                   (Google, GitHub, email)
  ▼
Clerk emite sesión JWT + cookies
  │
  ▼
React detecta sesión via useAuth() / useUser()
  │
  ▼
Frontend envía request a /api/* con Authorization: Bearer <JWT>
  │
  ▼
Express recibe request
  ├─ Extrae token del header
  ├─ Clerk.verifyToken(token) → { userId, sessionId, claims }
  ├─ Si inválido → 401
  ├─ Si válido → buscas user en DB por clerk_user_id
  │             (si no existe, 404 — el webhook debió crearlo)
  └─ req.user = { id, clerk_user_id, email, name, tier }
      → pasa al handler
```

### Clerk en Frontend (React)

```jsx
// App.jsx — setup
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <Layout>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/fixtures" element={<Fixtures />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/players" element={<Players />} />

            {/* Rutas protegidas — solo con sesión activa */}
            <Route path="/fantasy/create" element={
              <Protect><FantasyCreate /></Protect>
            } />
            <Route path="/my-team" element={
              <Protect><MyTeam /></Protect>
            } />
            <Route path="/rankings" element={<Rankings />} />
          </Routes>
        </Layout>
      </Router>
    </ClerkProvider>
  )
}
```

### Protección de rutas

| Ruta | Nivel protección | ¿Quién accede? |
|---|---|---|
| `/fixtures`, `/standings`, `/teams`, `/players` | Público | Todos |
| `/rankings` | Público (read) | Todos |
| `/fantasy/create` | `SignedIn` + `Protect` | Usuarios autenticados |
| `/my-team` | `SignedIn` + `Protect` | Usuarios autenticados |
| `/api/fantasy/*` | JWT válido + dueño del recurso | Solo el user owner |
| `/api/sync/*` | JWT válido + rol admin | Solo admin |

### Clerk Webhook — Sincronizar usuarios con PostgreSQL

Endpoint: `POST /api/auth/webhook` (protegido con Svix para verificar Clerk)

```
Clerk dispara webhook user.created
  │
  ▼
POST /api/auth/webhook
  ├─ Verificar firma Svix
  ├─ Extraer payload: { id, email_addresses, first_name, last_name, image_url }
  ├─ INSERT INTO users (clerk_user_id, email, name, avatar_url, tier)
  │   ON CONFLICT (clerk_user_id) DO UPDATE SET email = EXCLUDED.email
  └─ Responder 200
```

### Middleware de Autenticación en Express

```javascript
// middleware/auth.js
const { createClerkClient } = require('@clerk/backend')
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No token' })

  try {
    const payload = await clerkClient.verifyToken(token)
    const user = await db.query(
      'SELECT id, clerk_user_id, email, name, tier FROM users WHERE clerk_user_id = $1',
      [payload.sub]
    )
    if (!user.rows[0]) return res.status(404).json({ error: 'User not synced' })
    req.user = user.rows[0]
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Middleware para premium futuro
function requirePremium(req, res, next) {
  if (req.user.tier !== 'premium') {
    return res.status(403).json({ error: 'Premium required' })
  }
  next()
}
```

### Manejo de sesiones

| Aspecto | Cómo se maneja |
|---|---|
| Login/logout | Clerk `<SignInButton/>` / `<UserButton/>` |
| Token refresh | Clerk lo maneja automáticamente |
| Token en requests | Interceptor `api.js` agrega `Authorization: Bearer <token>` |
| Sesión expirada | Clerk redirige a `/sign-in` |
| Multi-sesión | Clerk la soporta nativamente |

### Hook custom para llamadas autenticadas

```javascript
// lib/api.js
import { useAuth } from '@clerk/clerk-react'

export function useAuthenticatedApi() {
  const { getToken } = useAuth()

  async function apiFetch(endpoint, options = {}) {
    const token = await getToken()
    const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })
    if (res.status === 401) throw new Error('Unauthorized')
    return res.json()
  }

  return { apiFetch }
}
```

---

## 5. Endpoints Internos (Express)

```
┌───── PÚBLICOS (sin auth) ────────────────────────────────────┐
│ GET  /api/fixtures            Fixtures con filtros           │
│ GET  /api/fixtures/:id        Detalle + stats + ratings      │
│ GET  /api/standings           Tabla de grupos                │
│ GET  /api/teams               Todos los equipos              │
│ GET  /api/teams/:id           Equipo + squad                 │
│ GET  /api/teams/:id/stats     Estadísticas agregadas         │
│ GET  /api/players             Todos los jugadores            │
│ GET  /api/players/top         Goleadores/asistencias         │
│ GET  /api/players/:id         Perfil + stats por partido     │
│ GET  /api/rankings            Ranking general                │
├───── PROTEGIDOS (requireAuth) ───────────────────────────────┤
│ GET  /api/fantasy/team        Mi cartola                     │
│ POST /api/fantasy/team        Crear/editar cartola           │
├───── WEBHOOKS ───────────────────────────────────────────────┤
│ POST /api/auth/webhook        user.created desde Clerk       │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Sync Service — Estrategia de Cache

### Tabla de control `sync_log`

```sql
CREATE TABLE sync_log (
  entity     TEXT PRIMARY KEY,
  synced_at  TIMESTAMPTZ,
  status     TEXT,         -- 'pending' | 'synced' | 'failed'
  meta       JSONB
);
```

### Pipeline de sincronización

| Fase | Cuándo | Requests | Data |
|---|---|---|---|
| **Pre-seed** | 1x antes del torneo | ~55 | equipos (1), fixtures (1), rounds (1), squads (48), standings (1), tops (3) |
| **Diario** | 06:00 UTC | 1 | fixtures del día (confirmar cambios) |
| **Post-partido** | 5 min tras finalizar | 2×N | match stats + player ratings |
| **Post-matchday** | Al cerrar jornada | 3 | standings, top scorers, top assists |

### Ciclo de vida de un fixture según status

| Status API-Football | Acción |
|---|---|
| `scheduled` / `time-to-be-defined` | Sync 1x al día |
| `live` | **No sincronizar** (no tenemos live) |
| `match finished` | Sync 1x: eventos + stats + player ratings |
| `cancelled` / `postponed` | Marcar, no re-sync |

---

## 7. Modelo de Datos (PostgreSQL)

```sql
-- ▸ CORE
teams              (id INT PK, name, code, country, logo, group_name, fifa_rank)
players            (id INT PK, team_id FK, name, position, age, nationality, photo, number)
fixtures           (id INT PK, round, date, status, home_team_id FK, away_team_id FK,
                    home_score, away_score, venue, stage)
standings          (id SERIAL PK, group_name, team_id FK, played, wins, draws, losses,
                    gf, ga, gd, points)

-- ▸ MATCH DETAILS
match_stats        (fixture_id FK, team_id FK, shots, shots_on_target, possession,
                    passes, fouls, corners, offsides, yellow_cards, red_cards)
player_match_stats (fixture_id FK, player_id FK, rating, minutes_played, goals,
                    assists, shots, passes, tackles, fouls, cards)

-- ▸ FANTASY (con Clerk)
users              (id SERIAL PK, clerk_user_id TEXT UNIQUE NOT NULL, email TEXT,
                    name TEXT, avatar_url TEXT, tier TEXT DEFAULT 'free',
                    premium_since TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW())
fantasy_teams      (id SERIAL PK, clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id),
                    name, budget_spent DECIMAL, total_points INT DEFAULT 0)
fantasy_picks      (id SERIAL PK, fantasy_team_id FK, player_id FK,
                    position_slot INT, is_captain BOOL, is_vice_captain BOOL, round INT)
fantasy_points     (id SERIAL PK, player_id FK, fixture_id FK, points INT,
                    breakdown JSONB, round INT)
```

### Notas sobre la tabla `users`

| Columna | Propósito |
|---|---|
| `clerk_user_id` | Identificador único de Clerk (SUB del JWT) |
| `email` | Se sincroniza vía webhook |
| `name` | Nombre completo desde Clerk |
| `avatar_url` | Foto de perfil desde Clerk |
| `tier` | `'free'` por defecto, `'premium'` para futuro |
| `premium_since` | Fecha de upgrade (null si free) |

---

## 8. Cálculo de Puntos (Fantasy Engine)

| Acción | Puntos |
|---|---|
| Gol | +8 |
| Asistencia | +5 |
| Clean sheet (def/arq) | +6 |
| Cada 3 atajadas (arq) | +3 |
| 3+ pases clave | +3 |
| Tarjeta amarilla | -2 |
| Tarjeta roja | -5 |
| Gol en contra | -2 |
| Penal errado | -3 |
| Man of the Match | +5 |
| Rating ≥ 8.0 | +4 |
| Rating ≤ 5.0 | -3 |
| Gol del capitán | ×2 |
| Gol del vice-capitán | ×1.5 |

---

## 9. Estructura Frontend (React + Vite + TailwindCSS + Clerk)

```
src/
├── main.jsx                  ClerkProvider wrapper
├── App.jsx                   Router + rutas protegidas
│
├── pages/
│   ├── Fixtures.jsx          Calendario de partidos
│   ├── Standings.jsx         Tabla de grupos
│   ├── Teams.jsx             Listado de equipos
│   ├── TeamDetail.jsx        Detalle del equipo
│   ├── Players.jsx           Jugadores con filtros
│   ├── PlayerDetail.jsx      Perfil + stats acumuladas
│   ├── MatchDetail.jsx       Stats del partido + ratings
│   ├── FantasyCreate.jsx     Crear cartola (protegida)
│   ├── MyTeam.jsx            Mi cartola + puntos (protegida)
│   ├── Rankings.jsx          Ranking global
│   ├── SignInPage.jsx        Página login Clerk
│   └── SignUpPage.jsx        Página register Clerk
│
├── components/
│   ├── Layout.jsx            Navbar con <UserButton/> + <SignInButton/>
│   ├── Navbar.jsx
│   ├── FixtureCard.jsx
│   ├── PlayerCard.jsx
│   ├── TeamCrest.jsx
│   ├── StandingsTable.jsx
│   ├── FantasyPitch.jsx      Visual del equipo en cancha
│   └── LoadingSkeleton.jsx
│
├── hooks/
│   ├── useFixtures.js
│   ├── useStandings.js
│   └── usePlayers.js
│
├── lib/
│   ├── api.js                Fetch wrapper con Clerk token
│   └── constants.js
│
└── middleware/
    └── ProtectedRoute.jsx    Componente <Protect/> wrapper
```

---

## 10. Stack Técnico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS + TanStack Query |
| Autenticación frontend | Clerk React SDK (`@clerk/clerk-react`) |
| Backend | Node.js + Express |
| Autenticación backend | Clerk Backend SDK (`@clerk/backend`) + `requireAuth` middleware |
| Webhooks Clerk | Svix para verificar firmas |
| Base de datos | Supabase (solo PostgreSQL, sin Supabase Auth) |
| Cache HTTP | React Query (stale-while-revalidate) |
| Sincronización | node-cron + Express endpoints protegidos |
| Hosting sugerido | Vercel (frontend) + Railway/Render (backend) + Supabase (DB) |
| API externa | API-Football v3 (vía RapidAPI o directo) |

### Variables de entorno necesarias

```
# Frontend (.env)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
VITE_API_URL=https://api.cartolamundialera.com

# Backend (.env)
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
DATABASE_URL=postgresql://...
API_FOOTBALL_KEY=xxxxx
```

---

## 11. Sistema Premium Futuro

El campo `tier` en `users` permite preparar el upgrade sin migraciones:

```javascript
// middleware/premium.js
function requirePremium(req, res, next) {
  if (req.user.tier !== 'premium') {
    return res.status(403).json({
      error: 'Funcionalidad premium',
      code: 'PREMIUM_REQUIRED',
      upgrade_url: '/pricing'
    })
  }
  next()
}

// Uso en rutas premium del futuro:
// router.get('/api/analytics/advanced', requireAuth, requirePremium, handler)
```

Premium podría habilitar en el futuro:

| Feature | Free | Premium |
|---|---|---|
| Crear cartola | ✅ 1 equipo | ✅ Ilimitado |
| Estadísticas básicas | ✅ | ✅ |
| Alertas de cambios | ❌ | ✅ |
| Historial completo torneo | Solo 2026 | Todos los mundiales |
| Exportar datos | ❌ | ✅ |
| Sin anuncios | ❌ | ✅ |

---

## 12. Recomendaciones Clave

1. **Pre-seed obligatorio** — todos los fixtures, equipos y squads antes del torneo
2. **Detectar fin de partido** vía `status=Match Finished` en el sync diario de fixtures, no por polling
3. **Botón manual "Sync Now"** en panel admin para emergencias
4. **Rate limiter interno** en sync service (máx 9 req/min para tener margen)
5. **Cache en 3 niveles**: PostgreSQL (persistente) → React Query (stale) → Componente (UI)
6. **No mostrar "live"** — solo resultados finales post-partido
7. **Budget de requests** — llevar contador en `sync_log` con alerta al llegar a 80/100
8. **Usar `withPlayerStats=1`** en el request de fixtures para obtener stats de jugadores embebidas y ahorrar requests
9. **Webhook Clerk** es crítico — si falla, el usuario no existe en DB aunque tenga JWT válido. Implementar retry + log.
10. **JWT verification** siempre en backend, nunca confiar solo en frontend

---

## 13. Diagrama de Secuencia (Sync Post-Partido)

```
Cron (c/15 min en ventana de partidos)
  │
  ├─ GET /api/sync/check-finished
  │     └─ Compara fixtures en DB (status=scheduled) vs API fixtures de hoy
  │        Si status cambió a "Match Finished" →
  │          ├─ GET /fixtures/statistics?fixture=X      1 req
  │          ├─ GET /fixtures/players?fixture=X         1 req
  │          ├─ Calcular fantasy_points (local, 0 req)
  │          ├─ Actualizar standings (1 req agrupado)
  │          └─ Actualizar tops (2 req agrupados)
  │
  └─ Budget check: loggear remaining, alertar si < 20
```

---

## 14. Diagrama de Navegación (Frontend)

```
Landing
  ├── /fixtures         ─→ /fixtures/:id   (MatchDetail)
  ├── /standings        ─→ (scroll grupos)
  ├── /teams            ─→ /teams/:id      (TeamDetail → Players/:id)
  ├── /players          ─→ /players/:id    (PlayerDetail)
  ├── /sign-in          ─→ Clerk SignIn page
  ├── /sign-up          ─→ Clerk SignUp page
  │
  ├── [Protegidas]
  │   ├── /fantasy/create  ─→ (seleccionar 11)
  │   ├── /my-team         ─→ (scoreboard por ronda)
  │   └── /rankings        ─→ (tabla global, pública pero con CTA a login si no auth)
```

---

## 15. Resumen de Archivos a Crear

### Frontend
```
src/main.jsx                          ClerkProvider + Router
src/App.jsx                           Routes + Protect wrapper
src/lib/api.js                        fetch con Clerk token
src/middleware/ProtectedRoute.jsx      wrapper <Protect/>
src/pages/SignInPage.jsx              Clerk <SignIn/>
src/pages/SignUpPage.jsx              Clerk <SignUp/>
```

### Backend
```
src/middleware/auth.js                 requireAuth (Clerk verifyToken)
src/middleware/premium.js              requirePremium
src/routes/auth.js                     POST /api/auth/webhook
src/services/clerk.js                  Clerk client singleton
```
