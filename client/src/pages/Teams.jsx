import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicFetch } from '../lib/api';

export default function Teams() {
  const { data, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => publicFetch('/api/teams?per_page=48'),
  });

  if (isLoading) return <div className="max-w-6xl mx-auto px-4 py-8"><div className="h-64 bg-gray-200 rounded-lg animate-pulse" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Equipos</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {data?.data?.map((team) => (
          <Link key={team.id} to={`/teams/${team.id}`} className="bg-white rounded-lg shadow p-4 flex items-center gap-4 hover:shadow-md transition">
            <img src={team.logo} alt="" className="w-12 h-12" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{team.name}</div>
              <div className="text-xs text-gray-500">
                {team.group_name ? `${team.group_name} ` : ''}
                {team.fifa_rank ? `· FIFA #${team.fifa_rank}` : ''}
              </div>
              {team.played > 0 && (
                <div className="text-xs text-gray-600 mt-1">
                  {team.played} PJ · {team.wins}V {team.draws}E {team.losses}D ·
                  GF {team.goals_for} · GC {team.goals_against}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
