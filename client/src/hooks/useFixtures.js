import { useQuery } from '@tanstack/react-query';
import { publicFetch } from '../lib/api';

export function useFixtures(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.date) queryParams.set('date', params.date);
  if (params.team_id) queryParams.set('team_id', params.team_id);
  if (params.round) queryParams.set('round', params.round);
  if (params.status) queryParams.set('status', params.status);
  if (params.per_page) queryParams.set('per_page', params.per_page);
  queryParams.set('sort', params.sort || 'date_asc');

  return useQuery({
    queryKey: ['fixtures', params],
    queryFn: () => publicFetch(`/api/fixtures?${queryParams}`),
  });
}

export function useFixture(id) {
  return useQuery({
    queryKey: ['fixture', id],
    queryFn: () => publicFetch(`/api/fixtures/${id}`),
    enabled: !!id,
  });
}
