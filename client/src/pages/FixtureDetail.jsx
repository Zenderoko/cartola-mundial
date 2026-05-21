import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicFetch } from '../lib/api';

const eventIcons = {
  Goal: '⚽',
  Card: '🟨',
  subst: '🔄',
  Var: '📺',
};

const posOrder = { Goalkeeper: 0, G: 0, Defender: 1, D: 1, Midfielder: 2, M: 2, Attacker: 3, F: 3 };
const rowLabels = ['Arquero', 'Defensa', 'Mediocampo', 'Ataque'];
const rowColors = ['#fbbf24', '#3b82f6', '#22c55e', '#ef4444'];

function Jersey({ player, color }) {
  const number = player.number || '?';
  const rating = player.rating ? Number(player.rating).toFixed(1) : null;

  return (
    <Link
      to={`/players/${player.player_id}`}
      className="flex flex-col items-center gap-0.5 group"
    >
      <div
        className="relative w-9 h-10 flex items-center justify-center rounded-b-lg shadow-md transition-transform hover:scale-110"
        style={{ backgroundColor: color }}
      >
        <span className="text-white font-bold text-sm leading-none">{number}</span>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: color }} />
      </div>
      {rating && (
        <span className="text-[10px] font-semibold bg-white/80 text-gray-800 rounded px-1 shadow-sm">
          {rating}{player.goals > 0 && ` ⚽${player.goals}`}
        </span>
      )}
    </Link>
  );
}

function PitchSide({ players, teamName, teamLogo }) {
  const sorted = [...(players || [])]
    .filter((p) => p.minutes_played > 0)
    .sort((a, b) => b.minutes_played - a.minutes_played);

  const starters = sorted.slice(0, 11);
  const subs = sorted.slice(11);

  const rows = [[], [], [], []];
  starters.forEach((p) => {
    const idx = posOrder[p.position] ?? 4;
    if (idx < 4) rows[idx].push(p);
  });

  return (
    <div className="bg-gradient-to-b from-emerald-100 via-green-50 to-emerald-100 rounded-xl p-4 shadow-inner border border-emerald-200 relative">
      <div className="text-center font-bold text-sm mb-4 flex items-center justify-center gap-2">
        <img src={teamLogo} alt="" className="w-5 h-5" /> {teamName}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none text-8xl font-bold">
          <svg viewBox="0 0 100 100" className="w-40 h-40">
            <ellipse cx="50" cy="50" rx="45" ry="55" fill="none" stroke="currentColor" strokeWidth="1" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="1" />
            <ellipse cx="50" cy="50" rx="16" ry="20" fill="none" stroke="currentColor" strokeWidth="1" />
            <rect x="0" y="20" width="6" height="60" fill="currentColor" />
            <rect x="94" y="20" width="6" height="60" fill="currentColor" />
          </svg>
        </div>

        <div className="relative space-y-2">
          {rows.map((row, ri) => (
            <div key={ri}>
              <div className="flex flex-wrap gap-2 justify-center">
                {row.map((p) => (
                  <Jersey key={p.player_id} player={p} color={rowColors[ri]} />
                ))}
              </div>
              {ri < rows.length - 1 && <div className="border-b border-emerald-200/50 my-1.5" />}
            </div>
          ))}
        </div>
      </div>

      {subs.length > 0 && (
        <div className="mt-3 pt-2 border-t border-emerald-200">
          <div className="text-[10px] text-emerald-700 font-medium mb-1.5">Suplentes</div>
          <div className="flex flex-wrap gap-1.5">
            {subs.map((p) => (
              <Link
                key={p.player_id}
                to={`/players/${p.player_id}`}
                className="flex items-center gap-1 bg-white/70 rounded px-1.5 py-0.5 text-xs text-gray-700 hover:bg-white transition shadow-sm"
              >
                <span className="font-semibold text-gray-500 text-[10px] min-w-[14px] text-right">
                  {p.number || '?'}
                </span>
                <span className="truncate max-w-[60px]">{p.player_name}</span>
                {p.goals > 0 && <span>⚽{p.goals}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FixtureDetail() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['fixture', id],
    queryFn: () => publicFetch(`/api/fixtures/${id}`),
    enabled: !!id,
  });

  const { data: playersData } = useQuery({
    queryKey: ['fixture-players', id],
    queryFn: () => publicFetch(`/api/fixtures/${id}/players`),
    enabled: !!id,
  });

  const fixture = data?.data;
  const playersByTeam = playersData?.data || [];

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="h-32 bg-gray-200 rounded-xl animate-pulse mb-6" />
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link to="/fixtures" className="text-blue-600 hover:underline text-sm">&larr; Volver a partidos</Link>
        <p className="mt-8 text-gray-500">Partido no encontrado</p>
      </div>
    );
  }

  const homePlayers = playersByTeam.find((t) => t.team_id === fixture.home_team?.id);
  const awayPlayers = playersByTeam.find((t) => t.team_id === fixture.away_team?.id);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/fixtures" className="text-blue-600 hover:underline text-sm">&larr; Volver a partidos</Link>

      <div className="mt-6 bg-white rounded-xl shadow p-6">
        <div className="text-center text-sm text-gray-500 mb-2">
          {fixture.stage && <span>{fixture.stage} · </span>}
          {fixture.round}
          {fixture.venue && <span> · {fixture.venue}</span>}
        </div>
        <div className="text-center text-xs text-gray-400 mb-4">
          {new Date(fixture.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-2 w-1/3">
            <img src={fixture.home_team?.logo} alt="" className="w-16 h-16" />
            <div className="font-bold text-lg text-center">{fixture.home_team?.name}</div>
          </div>
          <div className="text-center w-1/3">
            {fixture.status === 'match finished' ? (
              <div>
                <span className="text-4xl font-bold">{fixture.home_score} - {fixture.away_score}</span>
                <div className="text-xs text-gray-500 mt-1">Final</div>
              </div>
            ) : (
              <span className="text-xl text-gray-500">{fixture.status}</span>
            )}
          </div>
          <div className="flex flex-col items-center gap-2 w-1/3">
            <img src={fixture.away_team?.logo} alt="" className="w-16 h-16" />
            <div className="font-bold text-lg text-center">{fixture.away_team?.name}</div>
          </div>
        </div>
      </div>

      {(homePlayers || awayPlayers) && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <PitchSide players={homePlayers?.players} teamName={fixture.home_team?.name} teamLogo={fixture.home_team?.logo} />
          <PitchSide players={awayPlayers?.players} teamName={fixture.away_team?.name} teamLogo={fixture.away_team?.logo} />
        </div>
      )}

      {fixture.stats?.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold mb-4">Estadísticas del Partido</h2>
          <div className="space-y-3">
            {[
              { key: 'possession', label: 'Posesión', suffix: '%', decimals: 1 },
              { key: 'shots', label: 'Tiros' },
              { key: 'shots_on_target', label: 'Tiros al Arco' },
              { key: 'total_passes', label: 'Pases' },
              { key: 'pass_accuracy', label: 'Precisión Pases', suffix: '%', decimals: 1 },
              { key: 'fouls', label: 'Faltas' },
              { key: 'corners', label: 'Córners' },
              { key: 'offsides', label: 'Offsides' },
              { key: 'yellow_cards', label: 'Tarjetas Amarillas' },
              { key: 'red_cards', label: 'Tarjetas Rojas' },
              { key: 'saves', label: 'Atajadas' },
            ].map((stat) => {
              const homeVal = fixture.stats.find((s) => s.team_id === fixture.home_team?.id)?.[stat.key];
              const awayVal = fixture.stats.find((s) => s.team_id === fixture.away_team?.id)?.[stat.key];
              if (homeVal == null && awayVal == null) return null;
              const h = stat.decimals != null ? parseFloat(homeVal || 0).toFixed(stat.decimals) : homeVal || 0;
              const a = stat.decimals != null ? parseFloat(awayVal || 0).toFixed(stat.decimals) : awayVal || 0;
              const hPct = Math.min(100, (parseFloat(h) / (parseFloat(h) + parseFloat(a) || 1)) * 100);
              return (
                <div key={stat.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium w-16 text-right">{h}{stat.suffix || ''}</span>
                    <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
                    <span className="font-medium w-16">{a}{stat.suffix || ''}</span>
                  </div>
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-200">
                    <div className="bg-blue-600 transition-all" style={{ width: `${100 - hPct}%` }} />
                    <div className="bg-red-600 transition-all" style={{ width: `${hPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {fixture.events?.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold mb-4">Eventos</h2>
          <div className="space-y-2">
            {fixture.events.map((e, i) => {
              const home = e.team_id === fixture.home_team?.id;
              return (
                <div key={i} className={`flex items-center gap-3 text-sm ${home ? '' : 'flex-row-reverse'}`}>
                  <div className={`flex items-center gap-1.5 ${home ? 'flex-row' : 'flex-row-reverse'} flex-1`}>
                    <img src={e.team_logo} alt="" className="w-4 h-4" />
                    <span className={home ? 'text-right' : 'text-left'}>{e.team_name}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full text-xs font-medium min-w-[60px] justify-center">
                    <span>{eventIcons[e.event_type] || '•'}</span>
                    <span>{e.minute}'{e.extra_minute ? `+${e.extra_minute}` : ''}</span>
                    <span className="font-semibold">{e.player_name}</span>
                    {e.detail && e.detail !== 'Normal Goal' && <span className="text-gray-400 text-[10px]">({e.detail})</span>}
                    {e.assist_name && <span className="text-gray-400">asist. {e.assist_name}</span>}
                  </div>
                  <div className="flex-1" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {fixture.player_stats?.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold mb-4">Mejores Jugadores del Partido</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-2 text-left">Jugador</th>
                  <th className="p-2 text-left">Equipo</th>
                  <th className="p-2 text-center">Pos</th>
                  <th className="p-2 text-center">Rating</th>
                  <th className="p-2 text-center">Min</th>
                  <th className="p-2 text-center">G</th>
                  <th className="p-2 text-center">A</th>
                  <th className="p-2 text-center">PClave</th>
                  <th className="p-2 text-center">Atj</th>
                </tr>
              </thead>
              <tbody>
                {fixture.player_stats.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">
                      <Link to={`/players/${p.player_id}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                        <img src={p.photo} alt="" className="w-5 h-5 rounded-full" />
                        {p.player_name}
                      </Link>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <img src={p.team_logo} alt="" className="w-4 h-4" />
                        <span>{p.team_name}</span>
                      </div>
                    </td>
                    <td className="p-2 text-center">{p.position}</td>
                    <td className="p-2 text-center font-medium">{p.rating ?? '-'}</td>
                    <td className="p-2 text-center">{p.minutes_played}</td>
                    <td className="p-2 text-center">{p.goals}</td>
                    <td className="p-2 text-center">{p.assists}</td>
                    <td className="p-2 text-center">{p.key_passes}</td>
                    <td className="p-2 text-center">{p.saves}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
