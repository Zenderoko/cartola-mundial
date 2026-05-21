import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePlayer } from '../hooks/usePlayers';
import ApiWidget from '../components/ApiWidget';

export default function PlayerDetail() {
  const season = import.meta.env.VITE_API_FOOTBALL_SEASON || '2022';
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = usePlayer(id);
  const player = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="h-48 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/players" className="text-blue-600 hover:underline text-sm">&larr; Volver a jugadores</Link>
        <p className="mt-8 text-gray-500">Jugador no encontrado</p>
      </div>
    );
  }

  const t = player.totals;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/players" className="text-blue-600 hover:underline text-sm">&larr; Volver a jugadores</Link>

      <div className="mt-6 bg-white rounded-xl shadow p-6 flex items-center gap-6">
        <img src={player.photo} alt="" className="w-24 h-24 rounded-full object-cover" />
        <div>
          <h1 className="text-2xl font-bold">{player.name}</h1>
          <div className="text-gray-500 mt-1">
            {player.position} · {player.team?.name}
            {player.number && <span> · #{player.number}</span>}
            {player.nationality && <span> · {player.nationality}</span>}
            {player.age && <span> · {player.age} años</span>}
          </div>
        </div>
      </div>

      {t && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Partidos', value: t.appearances },
            { label: 'Goles', value: t.goals },
            { label: 'Asistencias', value: t.assists },
            { label: 'Rating Prom.', value: t.average_rating || '-' },
            { label: 'Minutos', value: t.minutes_played },
            { label: 'Tiros', value: t.shots },
            { label: 'Tiros al Arco', value: t.shots_on_target },
            { label: 'Pases Clave', value: t.key_passes },
            { label: 'Pases', value: t.passes },
            { label: '% Pases', value: t.pass_accuracy ? t.pass_accuracy + '%' : '-' },
            { label: 'Faltas', value: t.fouls },
            { label: 'Faltas Recibidas', value: t.fouls_drawn },
            { label: 'Amarillas', value: t.yellow_cards },
            { label: 'Rojas', value: t.red_cards },
            { label: 'Atajadas', value: t.saves },
            { label: 'Goles Recibidos', value: t.goals_conceded },
            { label: 'MVP', value: t.man_of_the_match },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg shadow p-3 text-center">
              <div className="text-lg font-bold">{s.value ?? 0}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {player.match_history?.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-3">Historial de Partidos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white rounded-xl shadow">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-2 text-left">Fecha</th>
                  <th className="p-2 text-left">Rival</th>
                  <th className="p-2 text-center">Resultado</th>
                  <th className="p-2 text-center">Rating</th>
                  <th className="p-2 text-center">Min</th>
                  <th className="p-2 text-center">G</th>
                  <th className="p-2 text-center">A</th>
                  <th className="p-2 text-center">PClave</th>
                  <th className="p-2 text-center">Atj</th>
                </tr>
              </thead>
              <tbody>
                {player.match_history.map((m) => (
                  <tr
                    key={m.fixture_id}
                    className="border-t hover:bg-blue-50 cursor-pointer transition"
                    onClick={() => navigate(`/fixtures/${m.fixture_id}`)}
                  >
                    <td className="p-2 whitespace-nowrap">{new Date(m.date).toLocaleDateString()}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-1.5">
                        <img src={m.opponent?.logo} alt="" className="w-4 h-4" />
                        <span>{m.opponent?.name}</span>
                      </div>
                    </td>
                    <td className="p-2 text-center font-medium">{m.team_score}-{m.opponent_score}</td>
                    <td className="p-2 text-center">{m.rating ?? '-'}</td>
                    <td className="p-2 text-center">{m.minutes_played}</td>
                    <td className="p-2 text-center">{m.goals}</td>
                    <td className="p-2 text-center">{m.assists}</td>
                    <td className="p-2 text-center">{m.key_passes}</td>
                    <td className="p-2 text-center">{m.saves}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-3">Widget del Jugador - API Sports</h2>
        <div className="bg-white rounded-xl shadow p-6">
          <ApiWidget
            type="player"
            id={player.id}
            attrs={{
              season,
              'player-statistics': true,
              'player-injuries': true,
              'player-trophies': true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
