import { useQuery } from '@tanstack/react-query';
import { publicFetch } from '../lib/api';

export default function Standings() {
  const { data, isLoading } = useQuery({
    queryKey: ['standings'],
    queryFn: () => publicFetch('/api/standings'),
  });

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="h-64 bg-gray-200 rounded-lg animate-pulse" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tabla de Posiciones</h1>
      <div className="grid gap-8 md:grid-cols-2">
        {data?.data?.map((group) => (
          <div key={group.group_name} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gray-800 text-white px-4 py-2 font-semibold">{group.group_name}</div>
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Equipo</th>
                  <th className="p-2">PJ</th>
                  <th className="p-2">G</th>
                  <th className="p-2">E</th>
                  <th className="p-2">P</th>
                  <th className="p-2">DG</th>
                  <th className="p-2 font-bold">Pts</th>
                </tr>
              </thead>
              <tbody>
                {group.standings?.map((s) => (
                  <tr key={s.team_id} className="border-t hover:bg-gray-50">
                    <td className="p-2 font-medium">{s.position}</td>
                    <td className="p-2 flex items-center gap-2">
                      <img src={s.logo} alt="" className="w-5 h-5" />
                      {s.team_name}
                    </td>
                    <td className="p-2 text-center">{s.played}</td>
                    <td className="p-2 text-center">{s.wins}</td>
                    <td className="p-2 text-center">{s.draws}</td>
                    <td className="p-2 text-center">{s.losses}</td>
                    <td className="p-2 text-center">{s.goal_diff > 0 ? `+${s.goal_diff}` : s.goal_diff}</td>
                    <td className="p-2 text-center font-bold">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
