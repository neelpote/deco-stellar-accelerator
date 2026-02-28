import { useState, useEffect } from 'react';
import { isConnected, getPublicKey, setAllowed } from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';
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
      
      // Validate the public key is a valid Stellar address
      if (!publicKey) {
        throw new Error('No public key received from wallet');
      }

      try {
        StellarSdk.StrKey.decodeEd25519PublicKey(publicKey);
      } catch (error) {
        throw new Error('Invalid Stellar address format');
      }
      
      setWallet({
        publicKey,
        isConnected: true,
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          
          // Validate the public key
          if (publicKey) {
            try {
              StellarSdk.StrKey.decodeEd25519PublicKey(publicKey);
              setWallet({
                publicKey,
                isConnected: true,
              });
            } catch (error) {
              console.error('Invalid public key format:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();
  }, []);

  return { wallet, connectWallet, disconnectWallet };
};
