import { useQuery } from '@tanstack/react-query';
import { useAuth, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useApi, ApiError } from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';

export default function MyTeam() {
  const { fetchApi } = useApi();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-team'],
    queryFn: () => fetchApi('/api/fantasy/team'),
    retry: false,
  });

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="h-64 bg-gray-200 rounded-lg animate-pulse" /></div>;

  if (error instanceof ApiError && error.status === 401) return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Mi Cartola</h1>
      <p className="text-gray-500 mb-4">Tu sesión ha expirado. Vuelve a iniciar sesión para ver tu cartola.</p>
      <SignedIn>
        <button
          onClick={() => signOut().then(() => navigate('/'))}
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Iniciar sesión
        </button>
      </SignedIn>
      <SignedOut>
        <Link to="/sign-in" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Iniciar sesión
        </Link>
      </SignedOut>
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Mi Cartola</h1>
      <p className="text-gray-500 mb-6">Aún no has creado tu cartola. ¡Crea una ahora!</p>
      <Link to="/fantasy/create" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Crear cartola</Link>
    </div>
  );

  if (!data?.data) return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Mi Cartola</h1>
      <p className="text-gray-500 mb-6">Aún no has creado tu cartola. ¡Crea una ahora!</p>
      <Link to="/fantasy/create" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Crear cartola</Link>
    </div>
  );

  const team = data.data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <p className="text-gray-500">Formación: {team.formation} · Puntos: {team.total_points}</p>
        </div>
        <Link to="/fantasy/create" className="text-sm text-blue-600 hover:text-blue-800">Editar cartola</Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {team.picks?.map((pick) => (
          <div key={pick.id} className="bg-white rounded-lg shadow p-3 text-center">
            <img src={pick.photo} alt="" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" />
            <div className="text-sm font-medium truncate">{pick.player_name}</div>
            <div className="text-xs text-gray-500">{pick.position}</div>
            {pick.is_captain && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Capitán</span>}
            {pick.is_vice_captain && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Vice</span>}
            <div className="text-sm font-semibold mt-1">{pick.points_earned} pts</div>
          </div>
        ))}
      </div>
    </div>
  );
}
