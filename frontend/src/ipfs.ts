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

    // Check if we're in development or production
    const isDevelopment = import.meta.env.DEV;
    
    console.log('Environment check:', {
      isDevelopment,
      hasJWT: !!PINATA_JWT,
      hasAPIKey: !!PINATA_API_KEY,
      jwtLength: PINATA_JWT?.length || 0
    });

    // For production demo without IPFS, create a mock CID
    if (!PINATA_JWT && !PINATA_API_KEY) {
      console.warn('No Pinata credentials found. Using mock IPFS for demo purposes.');
      
      // Create a deterministic mock CID based on project name
      const mockCid = `Qm${btoa(metadata.project_name + Date.now()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 44)}`;
      
      // Store in localStorage for demo purposes
      localStorage.setItem(`ipfs_${mockCid}`, JSON.stringify(fullMetadata));
      
      console.log('Mock IPFS CID created:', mockCid);
      return mockCid;
    }

    // Use Pinata JWT if available, otherwise use API keys
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (PINATA_JWT) {
      headers['Authorization'] = `Bearer ${PINATA_JWT}`;
      console.log('Using Pinata JWT authentication');
    } else if (PINATA_API_KEY && PINATA_SECRET_KEY) {
      headers['pinata_api_key'] = PINATA_API_KEY;
      headers['pinata_secret_api_key'] = PINATA_SECRET_KEY;
      console.log('Using Pinata API key authentication');
    }

    console.log('Uploading to IPFS...', { project_name: metadata.project_name });

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

    console.log('IPFS upload successful:', response.data.IpfsHash);
    return response.data.IpfsHash;
  } catch (error) {
    console.error('IPFS upload error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Provide specific error messages
      if (error.response?.status === 401) {
        throw new Error('Pinata authentication failed. Your JWT token may have expired.\n\nPlease get a new token from: https://app.pinata.cloud/developers/api-keys');
      } else if (error.response?.status === 403) {
        throw new Error('Pinata access forbidden. Please check your API key permissions.');
      } else if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
    }
    throw new Error('Failed to upload to IPFS. Please check the console for details and verify your Pinata credentials.');
  }
};

/**
 * Fetch project metadata from IPFS
 */
export const fetchFromIPFS = async (cid: string): Promise<ProjectMetadata> => {
  try {
    // Check if it's a mock CID (starts with QmQ, QmR, etc. - our mock pattern)
    const mockData = localStorage.getItem(`ipfs_${cid}`);
    if (mockData) {
      console.log('Loading mock IPFS data for CID:', cid);
      return JSON.parse(mockData);
    }

    // Try to fetch from IPFS gateway
    const response = await axios.get(`${IPFS_GATEWAY}${cid}`, {
      timeout: 10000, // 10 second timeout
    });
    return response.data;
  } catch (error) {
    console.error('IPFS fetch error:', error);
    
    // If IPFS fetch fails, try to return mock data or throw error
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      throw new Error('IPFS fetch timeout. The content may not be available yet.');
    }
    
    throw new Error('Failed to fetch from IPFS. The content may not be available.');
  }
};

/**
 * Get IPFS gateway URL for a CID
 */
export const getIPFSUrl = (cid: string): string => {
  return `${IPFS_GATEWAY}${cid}`;
};
