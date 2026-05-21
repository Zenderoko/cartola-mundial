import { useQuery } from '@tanstack/react-query';
import { publicFetch } from '../lib/api';

export default function Rankings() {
  const { data, isLoading } = useQuery({
    queryKey: ['rankings'],
    queryFn: () => publicFetch('/api/rankings'),
  });

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="h-64 bg-gray-200 rounded-lg animate-pulse" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Ranking Global</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Usuario</th>
              <th className="p-3 text-left">Cartola</th>
              <th className="p-3 text-right">Puntos totales</th>
              <th className="p-3 text-right">Ronda actual</th>
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((r) => (
              <tr key={r.fantasy_team_id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-bold">{r.position}</td>
                <td className="p-3">{r.user_name}</td>
                <td className="p-3">{r.fantasy_team_name}</td>
                <td className="p-3 text-right font-semibold">{r.total_points}</td>
                <td className="p-3 text-right">{r.round_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
