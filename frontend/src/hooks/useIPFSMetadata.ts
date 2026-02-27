import { useQuery } from '@tanstack/react-query';
import { fetchFromIPFS, ProjectMetadata } from '../ipfs';

export const useIPFSMetadata = (cid: string | undefined) => {
  return useQuery<ProjectMetadata | null>({
    queryKey: ['ipfsMetadata', cid],
    queryFn: async () => {
      if (!cid) return null;
      try {
        return await fetchFromIPFS(cid);
      } catch (error) {
        console.error('Failed to fetch IPFS metadata:', error);
        return null;
      }
    },
    enabled: !!cid,
    staleTime: 60000, // Cache for 1 minute
    retry: 3,
  });
};
