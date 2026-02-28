import axios from 'axios';

// Pinata API configuration
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || '';
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY || '';
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || '';

// IPFS Gateway for reading
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export interface ProjectMetadata {
  project_name: string;
  description: string;
  project_url: string;
  team_info: string;
  timestamp: number;
}

/**
 * Upload project metadata to IPFS via Pinata
 */
export const uploadToIPFS = async (metadata: Omit<ProjectMetadata, 'timestamp'>): Promise<string> => {
  try {
    // Add timestamp
    const fullMetadata: ProjectMetadata = {
      ...metadata,
      timestamp: Date.now(),
    };

    // Use Pinata JWT if available, otherwise use API keys
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (PINATA_JWT) {
      headers['Authorization'] = `Bearer ${PINATA_JWT}`;
    } else if (PINATA_API_KEY && PINATA_SECRET_KEY) {
      headers['pinata_api_key'] = PINATA_API_KEY;
      headers['pinata_secret_api_key'] = PINATA_SECRET_KEY;
    } else {
      throw new Error('Pinata credentials not configured. Please set VITE_PINATA_JWT or VITE_PINATA_API_KEY/VITE_PINATA_SECRET_KEY in .env');
    }

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataContent: fullMetadata,
        pinataMetadata: {
          name: `DeCo-${metadata.project_name}-${Date.now()}`,
        },
      },
      { headers }
    );

    return response.data.IpfsHash;
  } catch (error) {
    console.error('IPFS upload error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    throw new Error('Failed to upload to IPFS. Please check your Pinata credentials.');
  }
};

/**
 * Fetch project metadata from IPFS
 */
export const fetchFromIPFS = async (cid: string): Promise<ProjectMetadata> => {
  try {
    const response = await axios.get(`${IPFS_GATEWAY}${cid}`);
    return response.data;
  } catch (error) {
    console.error('IPFS fetch error:', error);
    throw new Error('Failed to fetch from IPFS');
  }
};

/**
 * Get IPFS gateway URL for a CID
 */
export const getIPFSUrl = (cid: string): string => {
  return `${IPFS_GATEWAY}${cid}`;
};
