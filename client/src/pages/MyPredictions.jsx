import { useQuery } from '@tanstack/react-query';
import { useApi } from '../lib/api';
import { Link } from 'react-router-dom';

const MARKET_LABELS = {
  goals: 'Goles totales',
  both_score: 'Ambos equipos anotan',
  corners: 'Corners totales',
  yellow_cards: 'Tarjetas amarillas',
  red_card: 'Tarjeta roja',
  fouls: 'Faltas totales',
};

function PredictionCard({ p }) {
  const date = new Date(p.date);
  const isFinished = p.status === 'match finished';

  return (
    <div className={`bg-white rounded-lg shadow p-4 flex items-start gap-4 ${isFinished ? (p.is_correct ? 'ring-2 ring-green-400' : 'ring-2 ring-red-200') : ''}`}>
      <div className="flex items-center gap-2 w-28 shrink-0">
        <img src={p.home_team?.logo} alt="" className="w-6 h-6 object-contain" />
        <span className="text-xs font-medium truncate">{p.home_team?.code}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 mb-1">
          {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} · Jornada {p.round}
        </div>
        <div className="text-sm font-medium mb-1">
          {MARKET_LABELS[p.market] || p.market}
          {p.line && <span className="text-gray-400 font-mono ml-1">({p.line})</span>}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className={`font-semibold ${p.prediction === 'yes' || p.prediction === 'over' ? 'text-blue-600' : p.prediction === 'exact' ? 'text-purple-600' : 'text-orange-600'}`}>
            {p.prediction === 'yes' ? 'Sí' : p.prediction === 'no' ? 'No' : p.prediction === 'over' ? 'Más' : p.prediction === 'exact' ? 'Igual' : 'Menos'}
          </span>
          {isFinished && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {p.is_correct ? `+${p.points} pts` : '0 pts'}
            </span>
          )}
          {!isFinished && <span className="text-xs text-gray-400">Pendiente</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 w-28 shrink-0 justify-end">
        <span className="text-xs font-medium truncate">{p.away_team?.code}</span>
        <img src={p.away_team?.logo} alt="" className="w-6 h-6 object-contain" />
      </div>

      {(p.home_score !== null || p.away_score !== null) && (
        <div className="text-sm font-bold tabular-nums shrink-0">
          {p.home_score ?? '-'}:{p.away_score ?? '-'}
        </div>
      )}
    </div>
  );
}

export default function MyPredictions() {
  const { fetchApi } = useApi();

  const { data, isLoading } = useQuery({
    queryKey: ['my-predictions'],
    queryFn: () => fetchApi('/api/predictions/my'),
  });

  const predictions = data?.data || [];
  const meta = data?.meta || {};
  const totalPoints = meta.points || 0;
  const correct = predictions.filter(p => p.is_correct).length;
  const total = predictions.filter(p => p.settled).length;

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />)}
      </div>
    </div>
  );

  if (predictions.length === 0) return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Mis Pronósticos</h1>
      <p className="text-gray-500 mb-6">Aún no has hecho ningún pronóstico.</p>
      <Link to="/predictions" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
        Ver partidos
      </Link>
    </div>
  );

  const pending = predictions.filter(p => !p.settled).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mis Pronósticos</h1>
        <Link to="/predictions" className="text-sm text-blue-600 hover:text-blue-800">+ Nuevo</Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{totalPoints}</div>
          <div className="text-xs text-gray-500">Puntos</div>
        </div>
        {total > 0 && (
          <>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{correct}/{total}</div>
              <div className="text-xs text-gray-500">Acertados</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{Math.round((correct / total) * 100)}%</div>
              <div className="text-xs text-gray-500">Precisión</div>
            </div>
          </>
        )}
        {total === 0 && (
          <>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{pending}</div>
              <div className="text-xs text-gray-500">Pendientes</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-gray-400">—</div>
              <div className="text-xs text-gray-500">Precisión</div>
            </div>
          </>
        )}
      </div>

      <div className="space-y-3">
        {predictions.map(p => <PredictionCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
