import { useQuery } from '@tanstack/react-query';
import { publicFetch } from '../lib/api';

export function usePlayers(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.team_id) queryParams.set('team_id', params.team_id);
  if (params.position) queryParams.set('position', params.position);
  if (params.search) queryParams.set('search', params.search);
  if (params.per_page) queryParams.set('per_page', params.per_page);
  queryParams.set('sort', params.sort || 'name_asc');

  return useQuery({
    queryKey: ['players', params],
    queryFn: () => publicFetch(`/api/players?${queryParams}`),
  });
}

export function usePlayer(id) {
  return useQuery({
    queryKey: ['player', id],
    queryFn: () => publicFetch(`/api/players/${id}`),
    enabled: !!id,
  });
}
