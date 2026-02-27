import * as StellarSdk from '@stellar/stellar-sdk';
import { CONTRACT_ID, SOROBAN_RPC_URL, NETWORK_PASSPHRASE } from './config';

const server = new StellarSdk.SorobanRpc.Server(SOROBAN_RPC_URL);

export const getStartupStatus = async (founderAddress: string) => {
  try {
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const sourceAccount = await server.getAccount(founderAddress);
    
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'get_startup_status',
          StellarSdk.Address.fromString(founderAddress).toScVal()
        )
      )
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(transaction);
    
    if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
      const result = simulated.result?.retval;
      if (result) {
        return StellarSdk.scValToNative(result);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching startup status:', error);
    return null;
  }
};

export const getAdmin = async () => {
  try {
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
        const address = StellarSdk.scValToNative(result);
        return address;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching admin:', error);
    return null;
  }
};

export { server };
