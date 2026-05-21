import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicFetch } from '../lib/api';

export default function Players() {
  const [position, setPosition] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ per_page: '50', sort: 'rating_desc', page: String(page) });
  if (position) params.set('position', position);
  if (search) params.set('search', search);

  const { data, isLoading } = useQuery({
    queryKey: ['players', position, search, page],
    queryFn: () => publicFetch(`/api/players?${params}`),
  });

  const players = data?.data || [];
  const meta = data?.meta;
  const totalPages = meta?.total_pages || 1;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Jugadores</h1>
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar jugador..."
          className="border rounded-lg px-4 py-2 flex-1"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="border rounded-lg px-4 py-2"
          value={position}
          onChange={(e) => { setPosition(e.target.value); setPage(1); }}
        >
          <option value="">Todas las posiciones</option>
          <option value="Goalkeeper">Arquero</option>
          <option value="Defender">Defensor</option>
          <option value="Midfielder">Mediocampista</option>
          <option value="Attacker">Delantero</option>
        </select>
      </div>
      {isLoading ? (
        <div className="space-y-2">{[...Array(10)].map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />)}</div>
      ) : (
        <>
          <div className="text-sm text-gray-500 mb-3">
            {meta?.total || 0} jugadores encontrados · Página {meta?.page || 1} de {totalPages}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((p) => (
              <Link key={p.id} to={`/players/${p.id}`} className="bg-white rounded-lg shadow p-3 flex items-center gap-3 hover:shadow-md transition">
                <img src={p.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.position} · {p.team?.name}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold">{p.statistics?.goals || 0} goles</div>
                  <div className="text-gray-500">{p.statistics?.rating || '-'}</div>
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded border text-sm disabled:opacity-40 hover:bg-gray-100"
              >
                &larr; Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded border text-sm ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded border text-sm disabled:opacity-40 hover:bg-gray-100"
              >
                Siguiente &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
