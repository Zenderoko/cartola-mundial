import { useQuery } from '@tanstack/react-query';
import { publicFetch } from '../lib/api';

export function useStandings(group = '') {
  const params = group ? `?group=${encodeURIComponent(group)}` : '';
  return useQuery({
    queryKey: ['standings', group],
    queryFn: () => publicFetch(`/api/standings${params}`),
  });
}
