import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicFetch } from '../lib/api';
import ApiWidget from '../components/ApiWidget';
import { useEffect, useState } from 'react';

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => publicFetch(`/api/teams/${id}`),
    enabled: !!id,
  });

  const team = teamData?.data;

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['teamStats', id],
    queryFn: () => publicFetch(`/api/teams/${id}/stats`),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const stats = statsData?.data;
  const [showFallback, setShowFallback] = useState(true);

  const played = stats?.played ?? 0;
  const winRate = stats ? Math.round((stats.wins / Math.max(1, played)) * 100) : 0;
  const drawRate = stats ? Math.round((stats.draws / Math.max(1, played)) * 100) : 0;
  const lossRate = stats ? Math.max(0, 100 - winRate - drawRate) : 0;

  useEffect(() => {
    if (!team?.id) return;
    let mounted = true;
    // Wait for the external widget to initialise and populate content
    const check = () => {
      const el = document.querySelector(`api-sports-widget[data-type="team"][data-team-id="${team.id}"]`);
      if (el && el.innerHTML && el.innerHTML.trim().length > 0) {
        if (mounted) setShowFallback(false);
        return;
      }
      // retry a couple times
      setTimeout(() => {
        const el2 = document.querySelector(`api-sports-widget[data-type="team"][data-team-id="${team.id}"]`);
        if (el2 && el2.innerHTML && el2.innerHTML.trim().length > 0) {
          if (mounted) setShowFallback(false);
        }
      }, 800);
    };
    // Run after a short delay to give widgets.js time
    const timer = setTimeout(check, 300);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [team?.id]);

  if (teamLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="h-48 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link to="/teams" className="text-blue-600 hover:underline text-sm">&larr; Volver a equipos</Link>
        <p className="mt-8 text-gray-500">Equipo no encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/teams" className="text-blue-600 hover:underline text-sm">&larr; Volver a equipos</Link>

      <div className="mt-6 bg-white rounded-xl shadow p-6 flex items-center gap-6">
        <img src={team.logo} alt="" className="w-20 h-20" />
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <div className="text-gray-500 mt-1">
            {team.group_name && <span>{team.group_name}</span>}
            {team.fifa_rank && <span> · FIFA #{team.fifa_rank}</span>}
            {team.country && <span> · {team.country}</span>}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-3">Información del {team.name}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-bold text-lg mb-3">📊 Estadísticas del Equipo</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Cancha/Estadio:</span> {team.venue || 'No disponible'}</p>
              <p><span className="font-semibold">Grupo:</span> {team.group_name || 'N/A'}</p>
              <p><span className="font-semibold">Ranking FIFA:</span> #{team.fifa_rank || 'N/A'}</p>
              <p><span className="font-semibold">País:</span> {team.country || 'N/A'}</p>
              <p className="text-gray-500 pt-2 text-xs">Widget disponible con estadísticas completas de partidos, goles, posesión y más.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-bold text-lg mb-3">👥 Datos de Jugadores</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Total en plantilla:</span> {team.squad?.length || 0}</p>
              <p className="text-gray-500 pt-2">Al pinchar en un jugador verás:</p>
              <ul className="text-gray-600 list-disc list-inside space-y-1 text-xs pt-1">
                <li>Perfil personal</li>
                <li>Estadísticas de temporada</li>
                <li>Lesiones activas</li>
                <li>Apariciones, goles, asistencias</li>
                <li>Rating y métricas avanzadas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-3">Widget Detallado del {team.name}</h2>
        <p className="text-sm text-gray-500 mb-4">Explora las estadísticas completas, plantilla y detalles del estadio.</p>
        <div className="bg-white rounded-xl shadow p-6">
          {showFallback ? (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-5 text-white">
                    <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Estadio</div>
                    <div className="mt-3 text-lg font-semibold">{team.venue || 'Estadio principal'}</div>
                    <div className="mt-2 text-sm text-slate-300">{team.country || 'País no disponible'}</div>
                  </div>
                  <div className="bg-slate-950 p-5 text-white">
                    <div className="rounded-[32px] bg-slate-900 h-48 flex flex-col items-center justify-center text-center px-4">
                      <div className="text-base uppercase tracking-[0.2em] text-slate-500">Vista previa</div>
                      <div className="mt-4 text-2xl font-semibold">{team.name}</div>
                      <div className="mt-2 text-sm text-slate-400">{played} partidos · {stats?.goals_for ?? 0} goles</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-3xl border border-slate-200 p-4 text-center">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Win rate</div>
                      <div className="mt-3 text-2xl font-semibold text-emerald-600">{winRate}%</div>
                      <div className="mt-1 text-sm text-slate-500">{stats?.wins ?? 0} victorias</div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 p-4 text-center">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Posesión</div>
                      <div className="mt-3 text-2xl font-semibold text-sky-600">{stats?.average_possession ?? 0}%</div>
                      <div className="mt-1 text-sm text-slate-500">Promedio del equipo</div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 p-4 text-center">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Goles / partido</div>
                      <div className="mt-3 text-2xl font-semibold text-amber-600">{stats?.goals_for ? Math.round(stats.goals_for / Math.max(1, played)) : 0}</div>
                      <div className="mt-1 text-sm text-slate-500">{stats?.goals_for ?? 0} goles totales</div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between text-sm text-slate-500 uppercase tracking-[0.16em]">Rendimiento</div>
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs text-slate-500"><span>Victorias</span><span>{winRate}%</span></div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-1">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${winRate}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-slate-500"><span>Empates</span><span>{drawRate}%</span></div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-1">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: `${drawRate}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-slate-500"><span>Derrotas</span><span>{lossRate}%</span></div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-1">
                          <div className="h-full rounded-full bg-red-500" style={{ width: `${lossRate}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {statsLoading ? (
                <div className="py-12 flex justify-center"><div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" /></div>
              ) : stats ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 p-5">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Métricas claves</div>
                    <div className="mt-4 grid gap-3">
                      <div className="flex items-center justify-between text-sm text-slate-700"><span>Partidos jugados</span><span>{played}</span></div>
                      <div className="flex items-center justify-between text-sm text-slate-700"><span>Porteros CS</span><span>{stats.clean_sheets ?? 0}</span></div>
                      <div className="flex items-center justify-between text-sm text-slate-700"><span>Tarjetas</span><span>🟨 {stats.cards?.yellow ?? 0} · 🟥 {stats.cards?.red ?? 0}</span></div>
                      <div className="flex items-center justify-between text-sm text-slate-700"><span>Rating</span><span>{stats.average_rating ?? 'N/A'}</span></div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 p-5">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Top jugadores</div>
                    <div className="mt-4 space-y-3 text-sm text-slate-700">
                      <div>
                        <div className="font-semibold">{stats.top_scorer?.name ?? 'Sin datos'}</div>
                        <div className="text-slate-500">Goles: {stats.top_scorer?.goals ?? 0}</div>
                      </div>
                      <div>
                        <div className="font-semibold">{stats.top_assist?.name ?? 'Sin datos'}</div>
                        <div className="text-slate-500">Asistencias: {stats.top_assist?.assists ?? 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No hay estadísticas disponibles.</div>
              )}
            </div>
          ) : (
            <ApiWidget
              type="team"
              id={team.id}
              attrs={{
                'team-tab': 'statistics',
                'team-statistics': true,
                'team-squad': true,
                'team-squads': true,
              }}
            />
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-3">Fallback: Estadísticas del Equipo (local)</h2>
        {(!showFallback) ? (
          <div className="text-sm text-gray-500 mb-2">El widget externo ha cargado correctamente.</div>
        ) : statsLoading ? (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-48 bg-gray-200 rounded animate-pulse" />
          </div>
        ) : stats ? (
          <div className="bg-white rounded-xl shadow p-6 space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-3xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Juego</p>
                    <p className="mt-2 text-lg font-semibold">{team.name}</p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase text-slate-600">Local</div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase text-slate-500">Posesión</p>
                    <p className="mt-2 text-2xl font-semibold">{stats.average_possession ?? 0}%</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase text-slate-500">Rating</p>
                    <p className="mt-2 text-2xl font-semibold">{stats.average_rating ?? 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Puntos clave</p>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between"><span>Partidos</span><span>{played}</span></div>
                  <div className="flex justify-between"><span>Goles</span><span>{stats.goals_for ?? 0}</span></div>
                  <div className="flex justify-between"><span>CS</span><span>{stats.clean_sheets ?? 0}</span></div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Resultados</p>
                  <p className="mt-2 text-sm text-slate-700">Distribución de victorias, empates y derrotas</p>
                </div>
                <div className="text-xs text-slate-500">{stats.wins} - {stats.draws} - {stats.losses}</div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-500"><span>Victorias</span><span>{winRate}%</span></div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-1">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${winRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-500"><span>Empates</span><span>{drawRate}%</span></div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-1">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${drawRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-500"><span>Derrotas</span><span>{lossRate}%</span></div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-1">
                    <div className="h-full rounded-full bg-red-500" style={{ width: `${lossRate}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Top Goleador</p>
                <p className="mt-3 text-lg font-semibold">{stats.top_scorer?.name ?? 'Sin datos'}</p>
                <p className="text-sm text-slate-500">{stats.top_scorer?.goals ?? 0} goles</p>
              </div>
              <div className="rounded-3xl border border-slate-200 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Top Asistidor</p>
                <p className="mt-3 text-lg font-semibold">{stats.top_assist?.name ?? 'Sin datos'}</p>
                <p className="text-sm text-slate-500">{stats.top_assist?.assists ?? 0} asistencias</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-6 text-sm text-gray-500">No hay estadísticas disponibles.</div>
        )}
      </div>

      {team.squad?.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-3">Plantilla ({team.squad.length})</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {team.squad.map((p) => (
              <Link key={p.id} to={`/players/${p.id}`} className="bg-white rounded-lg shadow p-3 flex items-center gap-3 hover:shadow-md transition">
                <img src={p.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{p.name}</div>
                  <div className="text-xs text-gray-500">
                    {p.position}{p.number ? ` · #${p.number}` : ''}{p.age ? ` · ${p.age} años` : ''}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
