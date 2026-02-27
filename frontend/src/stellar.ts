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

export const getAllStartups = async () => {
  try {
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const dummyAccount = await server.getAccount('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');
    
    const transaction = new StellarSdk.TransactionBuilder(dummyAccount, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('get_all_startups'))
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(transaction);
    
    if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
      const result = simulated.result?.retval;
      if (result) {
        const addresses = StellarSdk.scValToNative(result);
        return addresses || [];
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching all startups:', error);
    return [];
  }
};

export const getVCStakeRequired = async () => {
  try {
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const dummyAccount = await server.getAccount('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');
    
    const transaction = new StellarSdk.TransactionBuilder(dummyAccount, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('get_vc_stake_required'))
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(transaction);
    
    if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
      const result = simulated.result?.retval;
      if (result) {
        return StellarSdk.scValToNative(result);
      }
    }
    
    return '0';
  } catch (error) {
    console.error('Error fetching VC stake required:', error);
    return '0';
  }
};

export const getVCData = async (vcAddress: string) => {
  try {
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const dummyAccount = await server.getAccount('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');
    
    const transaction = new StellarSdk.TransactionBuilder(dummyAccount, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'get_vc_data',
          StellarSdk.Address.fromString(vcAddress).toScVal()
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
    console.error('Error fetching VC data:', error);
    return null;
  }
};

export const getAllVCs = async () => {
  try {
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const dummyAccount = await server.getAccount('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');
    
    const transaction = new StellarSdk.TransactionBuilder(dummyAccount, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('get_all_vcs'))
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(transaction);
    
    if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
      const result = simulated.result?.retval;
      if (result) {
        const addresses = StellarSdk.scValToNative(result);
        return addresses || [];
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching all VCs:', error);
    return [];
  }
};

export { server };
