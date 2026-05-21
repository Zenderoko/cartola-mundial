import { useQuery } from '@tanstack/react-query';
import { publicFetch } from '../lib/api';

export default function PredictionLeaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['prediction-leaderboard'],
    queryFn: () => publicFetch('/api/predictions/leaderboard'),
  });

  const entries = data?.data || [];

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-gray-200 rounded-lg animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Ranking de Pronósticos</h1>
      <p className="text-sm text-gray-500 mb-6">Usuarios con más puntos acumulados en pronósticos.</p>

      {entries.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Aún no hay pronósticos realizados.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left w-12">#</th>
                <th className="p-3 text-left">Usuario</th>
                <th className="p-3 text-right">Puntos</th>
                <th className="p-3 text-right hidden sm:table-cell">Aciertos</th>
                <th className="p-3 text-right hidden sm:table-cell">Precisión</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-bold text-gray-400">{i + 1}</td>
                  <td className="p-3 flex items-center gap-2">
                    {e.avatar_url ? (
                      <img src={e.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-bold">
                        {e.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <span className="font-medium">{e.name || 'Anónimo'}</span>
                  </td>
                  <td className="p-3 text-right font-bold text-blue-600">{e.total_points}</td>
                  <td className="p-3 text-right hidden sm:table-cell">
                    {e.correct_picks}/{e.total_picks}
                  </td>
                  <td className="p-3 text-right hidden sm:table-cell">
                    <span className={`font-medium ${e.accuracy >= 50 ? 'text-green-600' : e.accuracy >= 25 ? 'text-yellow-600' : 'text-gray-500'}`}>
                      {e.accuracy}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}