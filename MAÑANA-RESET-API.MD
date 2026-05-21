# Mañana — Pasos cuando se reseteen las 100 requests de API-Football 🗓️

## ⚠️ Límite: solo 100 requests/día — sync parcial hasta el jueves

Cada partido consume **3 requests** (statistics + players + events).
→ **33 partidos × 3 = 99 requests** es el máximo que podemos hacer por día.

### Hoy: sync de los primeros partidos

```bash
cd E:\Projects\cartola-mundialera\server
node scripts/syncMatchDetails.js --limit=33
```

o

```bash
npm run sync:match-details
```

**Consume:** ~99 requests (33 partidos × 3 endpoints).
**Tiempo estimado:** ~15 minutos (rate limit 9 req/min).
**Qué queda:** Faltarán ~31 partidos para el jueves.

### Siguiente sync (cuando se reseteen las 100 requests)

```bash
cd E:\Projects\cartola-mundialera\server
node scripts/syncMatchDetails.js --limit=33s
```

El script ahora **salta automáticamente los partidos que ya tienen `player_stats`** (usa `LEFT JOIN` + `WHERE NULL`). Cada vez que lo corras, agarrará los siguientes 33 partidos sin sincronizar.

No importa el orden ni cuándo se reseteen las requests — solo avanza sobre los que faltan.

### Sync completo (cuando el plan lo permita)

```bash
npm run sync:match-details:all
```

**Consume:** ~192 requests (64 partidos × 3).
**Tiempo estimado:** ~30 minutos.

---

## 2. Verificar Mi Cartola

1. Asegúrate de que el servidor esté corriendo:
   ```bash
   cd server && node src/index.js
   ```
2. Asegúrate de que el frontend esté corriendo:
   ```bash
   cd client && npm run dev
   ```
3. Abre `http://localhost:5173`
4. Haz click en **Sign In** (arriba a la derecha) e inicia sesión con Google
5. Haz click en **Mi Cartola** en la navegación

Si aún da error "Unauthorized", verifica las variables en `server/.env`:

- `CLERK_SECRET_KEY` — debe ser `sk_test_...`
- `CLERK_PUBLISHABLE_KEY` — debe ser `pk_test_...`
- `CLIENT_URL=http://localhost:5173`

---

## 3. Widgets de API-Football

Los widgets de equipo y jugador ahora se muestran automáticamente en sus páginas de detalle, utilizando la **misma API key** que los requests de statistics, players y events.

**Cómo funciona:**
- Click en cualquier **equipo** (en la lista de Teams) → se abre TeamDetail y muestra el widget del equipo
- Click en cualquier **jugador** (en la lista de Players) → se abre PlayerDetail y muestra el widget del jugador

Los widgets usan:
- La key de `client/.env` (`VITE_API_FOOTBALL_KEY`)
- El componente `ApiWidget` en `src/components/ApiWidget.jsx`
- Integrados en `TeamDetail.jsx` y `PlayerDetail.jsx`

✅ **Ventaja:** Se usa una sola key para todo, repartiendo el límite de 100 requests/día entre:
- Requests del servidor (statistics, players, events)
- Widgets del cliente (team/player details)
- **No generan requests nuevos**, simplemente usan la misma key para cargar los widgets interactivos de API-Sports

---

## 4. Próximos pasos (cuando todo funcione)

- Crear tu **Cartola** (equipo fantasy con 11 jugadores)
- Ver el **Ranking** global de cartolas
- Explorar las **Estadísticas Inteligentes** en `/intelligence`

---

## Variables de entorno requeridas

| Archivo       | Variable                     | Estado                         |
| ------------- | ---------------------------- | ------------------------------ |
| `server/.env` | `DATABASE_URL`               | ✅                             |
| `server/.env` | `CLERK_SECRET_KEY`           | ✅                             |
| `server/.env` | `CLERK_PUBLISHABLE_KEY`      | ✅                             |
| `server/.env` | `CLIENT_URL`                 | ✅                             |
| `server/.env` | `API_FOOTBALL_KEY`           | ✅ (compartida con widgets)    |
| `client/.env` | `VITE_CLERK_PUBLISHABLE_KEY` | ✅                             |
| `client/.env` | `VITE_API_URL`               | ✅                             |
| `client/.env` | `VITE_API_FOOTBALL_KEY`      | ✅ (misma del servidor)        |

revisa el archivo MAÑANA-RESET-API.md, ya hice todos los request para tener la
┃ informacion de statistics players y events, con la api correspondiente, ahora quiero
┃ usar esa misma api pero para cargar los widgets del paso 3 , ya que no se muestran
┃ en la pagina, solo se ve el spinner de carga
