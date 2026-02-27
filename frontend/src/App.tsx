import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWallet } from './hooks/useWallet';
import { useAdmin } from './hooks/useAdmin';
import { useQuery } from '@tanstack/react-query';
import { FounderView } from './components/FounderView';
import { AdminView } from './components/AdminView';
import { VCView } from './components/VCView';
import * as StellarSdk from '@stellar/stellar-sdk';
import { CONTRACT_ID, NETWORK_PASSPHRASE } from './config';
import { server } from './stellar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { wallet, connectWallet, disconnectWallet } = useWallet();
  const { data: adminAddress } = useAdmin();

  const { data: isVC } = useQuery({
    queryKey: ['isVC', wallet.publicKey],
    queryFn: async () => {
      if (!wallet.publicKey) return false;
      
      try {
        const contract = new StellarSdk.Contract(CONTRACT_ID);
        const sourceAccount = await server.getAccount(wallet.publicKey);
        
        const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
          fee: '100',
          networkPassphrase: NETWORK_PASSPHRASE,
        })
          .addOperation(
            contract.call(
              'is_vc',
              StellarSdk.Address.fromString(wallet.publicKey).toScVal()
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
        
        return false;
      } catch (error) {
        console.error('Error checking VC status:', error);
        return false;
      }
    },
    enabled: !!wallet.publicKey,
    refetchInterval: 30000,
  });

  const isAdmin = wallet.publicKey && adminAddress && wallet.publicKey === adminAddress;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="text-4xl">🚀</div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    DeCo
                  </h1>
                  <p className="text-xs text-gray-600">Decentralized Combinator</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {wallet.isConnected ? (
                <>
                  <div className="flex items-center space-x-3 bg-gray-100 rounded-xl px-4 py-2">
                    <div className="text-2xl">
                      {isAdmin ? '👑' : isVC ? '💼' : '🚀'}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Connected as</div>
                      <div className="text-sm font-mono font-semibold text-gray-800">
                        {wallet.publicKey?.slice(0, 6)}...{wallet.publicKey?.slice(-6)}
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs px-4 py-2 rounded-full font-bold shadow-lg">
                      👑 ADMIN
                    </span>
                  )}
                  {isVC && !isAdmin && (
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-4 py-2 rounded-full font-bold shadow-lg">
                      💼 VC
                    </span>
                  )}
                  <button
                    onClick={disconnectWallet}
                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-pink-600 font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  🔗 Connect Freighter
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!wallet.isConnected ? (
          <div className="text-center py-20">
            <div className="mb-8">
              <div className="text-8xl mb-6">🚀</div>
              <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Welcome to DeCo
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                The decentralized accelerator platform powered by Stellar blockchain. 
                Connect your wallet to apply for funding, manage investments, or oversee the accelerator.
              </p>
            </div>
            
            <button
              onClick={connectWallet}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-5 rounded-2xl hover:from-blue-700 hover:to-purple-700 text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
            >
              🔗 Connect Freighter Wallet
            </button>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-100 hover:border-blue-300 transition-all">
                <div className="text-5xl mb-4">🚀</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">For Founders</h3>
                <p className="text-gray-600">
                  Apply for funding and receive milestone-based investments directly to your wallet
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-100 hover:border-purple-300 transition-all">
                <div className="text-5xl mb-4">💼</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">For VCs</h3>
                <p className="text-gray-600">
                  Monitor portfolio companies and track funding progress in real-time on-chain
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-indigo-100 hover:border-indigo-300 transition-all">
                <div className="text-5xl mb-4">👑</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">For Admins</h3>
                <p className="text-gray-600">
                  Manage funding allocations, approve milestones, and oversee the entire platform
                </p>
              </div>
            </div>

            {/* Blockchain Badge */}
            <div className="mt-16 inline-flex items-center space-x-3 bg-white rounded-full px-8 py-4 shadow-lg border-2 border-gray-200">
              <span className="text-2xl">⛓️</span>
              <div className="text-left">
                <div className="text-xs text-gray-500">Powered by</div>
                <div className="text-sm font-bold text-gray-800">Stellar Blockchain</div>
              </div>
            </div>
          </div>
        ) : isAdmin ? (
          <AdminView publicKey={wallet.publicKey!} />
        ) : isVC ? (
          <VCView publicKey={wallet.publicKey!} />
        ) : (
          <FounderView publicKey={wallet.publicKey!} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="text-gray-600 text-sm">
              © 2024 DeCo - Decentralized Combinator. Built on Stellar Testnet.
            </div>
            <div className="flex items-center space-x-6">
              <a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600 text-sm">
                Stellar Network
              </a>
              <a href="https://soroban.stellar.org" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600 text-sm">
                Soroban Docs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
