import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { useApi, publicFetch, ApiError } from '../lib/api';
import { useNavigate } from 'react-router-dom';

function MarketCard({ market, onClick, signedIn }) {
  const my = market.my_prediction;
  const sel = my?.prediction || null;
  const wasCorrect = my?.settled ? my?.is_correct : market.was_correct;
  const [loading, setLoading] = useState(false);
  const isOverUnder = market.line !== null;

  const handleClick = async (opt) => {
    if (!signedIn) return;
    setLoading(true);
    await onClick(market.key, opt);
    setLoading(false);
  };

  return (
    <div className={`border rounded-lg p-3 transition ${wasCorrect === true ? 'bg-green-50 border-green-400' : wasCorrect === false ? 'bg-red-50 border-red-300' : wasCorrect === 'push' ? 'bg-gray-50 border-gray-300' : my ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
      <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
        <span>{market.icon}</span>
        <span className="font-medium">{market.label}</span>
        {market.line && <span className="font-mono text-gray-400">({market.line})</span>}
      </div>

      {market.result !== null && (
        <div className="text-sm font-bold text-center mb-2 text-gray-700">
          Real: {market.result}
        </div>
      )}

      {signedIn ? (
        isOverUnder ? (
          <div className="flex gap-1">
            {['over', 'exact', 'under'].map(opt => (
              <button key={opt} onClick={() => handleClick(opt)}
                className={`flex-1 text-xs py-1.5 rounded transition font-medium cursor-pointer
                  ${loading ? 'opacity-50' : ''}
                  ${sel === opt ? (wasCorrect === true ? 'bg-green-600 text-white' : wasCorrect === false ? 'bg-red-500 text-white' : 'bg-blue-600 text-white') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {loading ? '...' : opt === 'over' ? 'Más' : opt === 'exact' ? 'Igual' : 'Menos'}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-1">
            {['yes', 'no'].map(opt => (
              <button key={opt} onClick={() => handleClick(opt)}
                className={`flex-1 text-xs py-1.5 rounded transition font-medium cursor-pointer
                  ${loading ? 'opacity-50' : ''}
                  ${sel === opt ? (wasCorrect === true ? 'bg-green-600 text-white' : wasCorrect === false ? 'bg-red-500 text-white' : 'bg-blue-600 text-white') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {loading ? '...' : opt === 'yes' ? 'Sí' : 'No'}
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="text-xs text-gray-400 text-center py-2">
          <button onClick={() => window.location.href = '/sign-in'} className="text-blue-500 hover:underline">Inicia sesión</button> para pronosticar
        </div>
      )}

      {wasCorrect === true && <div className="text-xs text-green-600 text-center mt-1 font-bold">✓ +10 pts</div>}
      {wasCorrect === 'push' && <div className="text-xs text-gray-500 text-center mt-1">— Empate (0 pts)</div>}
      {wasCorrect === false && <div className="text-xs text-red-500 text-center mt-1">✗ 0 pts</div>}
      {wasCorrect === undefined && sel && <div className="text-xs text-blue-500 text-center mt-1">Pronosticado</div>}
    </div>
  );
}

function StatsRow({ stats, homeTeamId, awayTeamId }) {
  if (!stats || Object.keys(stats).length === 0) return null;
  const home = stats[homeTeamId];
  const away = stats[awayTeamId];
  if (!home && !away) return null;

  const rows = [
    { label: 'Posesión', home: home?.possession ? `${home.possession}%` : '-', away: away?.possession ? `${away.possession}%` : '-' },
    { label: 'Tiros', home: home?.shots ?? '-', away: away?.shots ?? '-' },
    { label: 'Tiros a puerta', home: home?.shots_on_target ?? '-', away: away?.shots_on_target ?? '-' },
    { label: 'Corners', home: home?.corners ?? '-', away: away?.corners ?? '-' },
    { label: 'Faltas', home: home?.fouls ?? '-', away: away?.fouls ?? '-' },
    { label: 'Tarjetas amarillas', home: home?.yellow_cards ?? '-', away: away?.yellow_cards ?? '-' },
    { label: 'Tarjetas rojas', home: home?.red_cards ?? '-', away: away?.red_cards ?? '-' },
    { label: 'Pases totales', home: home?.total_passes ?? '-', away: away?.total_passes ?? '-' },
  ];

  return (
    <div className="px-4 pb-3">
      <table className="w-full text-xs">
        <tbody>
          {rows.map(r => (
            <tr key={r.label} className="border-b border-gray-100">
              <td className="py-1 text-right w-[35%]">{r.home}</td>
              <td className="py-1 text-center text-gray-500 font-medium px-2">{r.label}</td>
              <td className="py-1 w-[35%]">{r.away}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchCard({ match, signedIn, onPredict, error }) {
  const date = new Date(match.date);
  const isLive = match.status === 'live';
  const [showStats, setShowStats] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
        <span>
          {(match.stage && match.stage !== 'unknown' ? match.stage : match.round) || `Partido #${match.id}`}
        </span>
        <span className={isLive ? 'text-green-600 font-bold animate-pulse' : ''}>
          {isLive ? '🔴 EN VIVO' : date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img src={match.home_team?.logo} alt="" className="w-8 h-8 object-contain" />
          <span className="text-sm font-medium truncate">{match.home_team?.name}</span>
        </div>

        <div className="mx-3 text-center min-w-16">
          {match.status === 'match finished' || isLive ? (
            <div>
              <span className="text-lg font-bold tabular-nums">{match.home_score ?? '-'} : {match.away_score ?? '-'}</span>
              {match.status === 'match finished' && <div className="text-[10px] text-gray-400 mt-0.5">Finalizado</div>}
            </div>
          ) : (
            <span className="text-xs text-gray-400">vs</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm font-medium truncate">{match.away_team?.name}</span>
          <img src={match.away_team?.logo} alt="" className="w-8 h-8 object-contain" />
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {match.markets?.map(market => (
            <MarketCard key={market.key} market={market} signedIn={signedIn}
              onClick={(key, value) => onPredict(match.id, key, market.line, value)} />
          ))}
        </div>
      </div>

      {match.stats && Object.keys(match.stats).length > 1 && (
        <div className="border-t border-gray-100">
          <button onClick={() => setShowStats(!showStats)}
            className="w-full px-4 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1">
            {showStats ? '▲ Ocultar stats' : '▼ Mostrar stats del partido'}
          </button>
          {showStats && (
            <StatsRow stats={match.stats} homeTeamId={match.home_team?.id} awayTeamId={match.away_team?.id} />
          )}
        </div>
      )}
    </div>
  );
}

export default function Predictions() {
  const { isSignedIn, isLoaded } = useAuth();
  const { fetchApi } = useApi();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['predictions-matches'],
    queryFn: () => publicFetch('/api/predictions/matches'),
  });

  const predictMutation = useMutation({
    mutationFn: ({ fixture_id, market, line, prediction }) =>
      fetchApi('/api/predictions', {
        method: 'POST',
        body: JSON.stringify({ fixture_id, market, line, prediction }),
      }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['predictions-matches'] });
    },
    onError: (err) => {
      setError(err.message || 'Error al guardar el pronóstico');
    },
  });

  const matches = data?.data || [];
  const filtered = filter === 'all' ? matches : filter === 'upcoming' ? matches.filter(m => m.status === 'scheduled') : matches.filter(m => m.status === 'match finished');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Pronósticos</h1>
      <p className="text-sm text-gray-500 mb-6">Pronostica estadísticas de cada partido. Cada acierto suma 10 puntos.</p>

      {!isSignedIn && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3 mb-4 text-sm">
          Necesitas <a href="/sign-in" className="font-bold underline">iniciar sesión</a> para hacer pronósticos.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
      )}

      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'upcoming', label: 'Próximos' },
          { key: 'finished', label: 'Finalizados' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${filter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="h-12 bg-gray-200 rounded mb-4" />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(j => <div key={j} className="h-16 bg-gray-200 rounded" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <p className="text-gray-500 text-center py-12">No hay partidos disponibles.</p>
      )}

      <div className="space-y-4">
        {filtered.map(match => (
          <MatchCard key={match.id} match={match} signedIn={isSignedIn} error={error}
            onPredict={(fixtureId, market, line, prediction) =>
              predictMutation.mutate({ fixture_id: fixtureId, market, line, prediction })} />
        ))}
      </div>
    </div>
  );
}
