import { useState, useEffect } from 'react';
import { isConnected, getPublicKey, setAllowed } from '@stellar/freighter-api';
import { WalletState } from '../types';

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    publicKey: null,
    isConnected: false,
  });

  const connectWallet = async () => {
    try {
      const connected = await isConnected();
      
      if (!connected) {
        alert('Please install Freighter wallet extension');
        return;
      }

      await setAllowed();
      const publicKey = await getPublicKey();
      
      setWallet({
        publicKey,
        isConnected: true,
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    setWallet({
      publicKey: null,
      isConnected: false,
    });
  };

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await isConnected();
        if (connected) {
          const publicKey = await getPublicKey();
          setWallet({
            publicKey,
            isConnected: true,
          });
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();
  }, []);

  return { wallet, connectWallet, disconnectWallet };
};
