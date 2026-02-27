import { useQuery } from '@tanstack/react-query';
import { getAdmin } from '../stellar';

export const useAdmin = () => {
  return useQuery<string | null>({
    queryKey: ['admin'],
    queryFn: getAdmin,
    staleTime: 60000, // Admin rarely changes
    refetchInterval: 30000,
  });
};
