/**
 * Admin verification utility
 * Run this to check if the current wallet is the admin
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { CONTRACT_ID, NETWORK_PASSPHRASE, SOROBAN_RPC_URL } from './config';

const server = new StellarSdk.SorobanRpc.Server(SOROBAN_RPC_URL);

export const verifyAdmin = async (walletAddress: string): Promise<{
  isAdmin: boolean;
  adminAddress: string | null;
  error?: string;
}> => {
  try {
    // Get the stored admin address from contract
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const dummyAccount = await server.getAccount('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');
    
    const transaction = new StellarSdk.TransactionBuilder(dummyAccount, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('get_admin'))
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(transaction);
    
    if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
      const result = simulated.result?.retval;
      if (result) {
        const adminAddress = StellarSdk.scValToNative(result);
        return {
          isAdmin: walletAddress === adminAddress,
          adminAddress,
        };
      }
    }
    
    return {
      isAdmin: false,
      adminAddress: null,
      error: 'Could not retrieve admin address from contract'
    };
  } catch (error) {
    return {
      isAdmin: false,
      adminAddress: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Expected admin details for reference
export const EXPECTED_ADMIN = {
  address: 'GAZ27SJ7YFLUGO2O4JCTOWLNNXQZ5C7H5A7WFWEBALT6F6JELKJKNV44',
  secret: 'SBWOC4AQIWYJOR7J3MZTDYVAUZP2XBW7WVH4EXKMLTGQEOZIURA5JAL2'
};