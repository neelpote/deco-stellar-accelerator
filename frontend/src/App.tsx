import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useWallet } from './hooks/useWallet';
import { useAdmin } from './hooks/useAdmin';
import { useQuery } from '@tanstack/react-query';
import { FounderView } from './components/FounderView';
import { AdminView } from './components/AdminView';
import { VCView } from './components/VCView';
import { PublicVotingView } from './components/PublicVotingView';
import { CyberBackground } from './components/CyberBackground';
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

type ViewMode = 'founder' | 'vc' | 'voting' | 'admin';

function AppContent() {
  const { wallet, connectWallet, disconnectWallet } = useWallet();
  const { data: adminAddress, isLoading: adminLoading } = useAdmin();
  const [viewMode, setViewMode] = useState<ViewMode>('founder');

  // Listen for navigation events
  useEffect(() => {
    const handleNavigateToVC = () => setViewMode('vc');
    window.addEventListener('navigate-to-vc', handleNavigateToVC);
    return () => window.removeEventListener('navigate-to-vc', handleNavigateToVC);
  }, []);

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

  const isAdmin = wallet.publicKey && adminAddress && !adminLoading && wallet.publicKey === adminAddress;

  const renderView = () => {
    if (!wallet.isConnected || !wallet.publicKey) return null;
    
    // Only allow admin view if user is actually the admin
    if (viewMode === 'admin' && isAdmin && adminAddress === wallet.publicKey) {
      return <AdminView publicKey={wallet.publicKey} />;
    }
    
    // If someone tries to access admin view but isn't admin, redirect to founder view
    if (viewMode === 'admin' && (!isAdmin || adminAddress !== wallet.publicKey)) {
      setViewMode('founder');
      return <FounderView publicKey={wallet.publicKey} />;
    }
    
    switch (viewMode) {
      case 'vc':
        return <VCView publicKey={wallet.publicKey} />;
      case 'voting':
        return <PublicVotingView publicKey={wallet.publicKey} />;
      case 'founder':
      default:
        return <FounderView publicKey={wallet.publicKey} />;
    }
  };

  return (
    <div className="min-h-screen relative">
      <CyberBackground />
      
      {/* Navigation */}
      <nav className="cyber-card border-0 border-b border-cyber-primary/30 backdrop-blur-xl relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="text-4xl">🚀</div>
                <div>
                  <h1 className="text-3xl font-bold cyber-title glitch" data-text="DeCo">
                    DeCo
                  </h1>
                  <p className="text-xs text-cyber-dim uppercase tracking-wider">Decentralized Combinator</p>
                </div>
              </div>
              
              {/* Navigation Tabs */}
              {wallet.isConnected && !adminLoading && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('founder')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all uppercase tracking-wide ${
                      viewMode === 'founder'
                        ? 'bg-cyber-primary/20 text-cyber-primary border border-cyber-primary'
                        : 'text-cyber-text-dim hover:text-cyber-primary hover:bg-cyber-primary/10'
                    }`}
                  >
                    🚀 Founder
                  </button>
                  {isVC && (
                    <button
                      onClick={() => setViewMode('vc')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all uppercase tracking-wide ${
                        viewMode === 'vc'
                          ? 'bg-cyber-secondary/20 text-cyber-secondary border border-cyber-secondary'
                          : 'text-cyber-text-dim hover:text-cyber-secondary hover:bg-cyber-secondary/10'
                      }`}
                    >
                      💼 VC
                    </button>
                  )}
                  <button
                    onClick={() => setViewMode('voting')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all uppercase tracking-wide ${
                      viewMode === 'voting'
                        ? 'bg-cyber-accent/20 text-cyber-accent border border-cyber-accent'
                        : 'text-cyber-text-dim hover:text-cyber-accent hover:bg-cyber-accent/10'
                    }`}
                  >
                    🗳️ Vote
                  </button>
                  {!isVC && (
                    <button
                      onClick={() => setViewMode('vc')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all uppercase tracking-wide ${
                        viewMode === 'vc'
                          ? 'bg-cyber-secondary/20 text-cyber-secondary border border-cyber-secondary'
                          : 'text-cyber-text-dim hover:text-cyber-secondary hover:bg-cyber-secondary/10'
                      }`}
                    >
                      💼 Become VC
                    </button>
                  )}
                  {isAdmin && adminAddress === wallet.publicKey && (
                    <button
                      onClick={() => setViewMode('admin')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all uppercase tracking-wide ${
                        viewMode === 'admin'
                          ? 'bg-cyber-warning/20 text-cyber-warning border border-cyber-warning'
                          : 'text-cyber-text-dim hover:text-cyber-warning hover:bg-cyber-warning/10'
                      }`}
                    >
                      👑 Admin
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {wallet.isConnected && wallet.publicKey ? (
                <>
                  <div className="flex items-center space-x-3 cyber-card px-4 py-2">
                    <div className="text-2xl">
                      {isAdmin && adminAddress === wallet.publicKey ? '👑' : isVC ? '💼' : '🚀'}
                    </div>
                    <div>
                      <div className="text-xs text-cyber-dim uppercase tracking-wider">Connected</div>
                      <div className="text-sm font-mono font-semibold text-cyber-primary">
                        {wallet.publicKey?.slice(0, 6)}...{wallet.publicKey?.slice(-6)}
                      </div>
                    </div>
                  </div>
                  {isAdmin && adminAddress === wallet.publicKey && (
                    <span className="bg-gradient-to-r from-cyber-warning to-cyber-secondary text-black text-xs px-4 py-2 rounded-full font-bold shadow-lg neon-glow uppercase tracking-wider">
                      👑 ADMIN
                    </span>
                  )}
                  {isVC && !isAdmin && (
                    <span className="bg-gradient-to-r from-cyber-secondary to-cyber-primary text-white text-xs px-4 py-2 rounded-full font-bold shadow-lg neon-glow uppercase tracking-wider">
                      💼 VC
                    </span>
                  )}
                  <button
                    onClick={disconnectWallet}
                    className="cyber-btn px-6 py-3 text-sm"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={connectWallet}
                  className="cyber-btn px-8 py-3 text-lg font-bold"
                >
                  🔗 Connect Freighter
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {!wallet.isConnected || !wallet.publicKey ? (
          <div className="text-center py-20">
            <div className="mb-8">
              <div className="text-8xl mb-6 animate-pulse">🚀</div>
              <h2 className="text-6xl font-bold cyber-title mb-4 glitch" data-text="Welcome to DeCo">
                Welcome to DeCo
              </h2>
              <p className="text-xl text-cyber-text-dim mb-8 max-w-2xl mx-auto leading-relaxed">
                The <span className="neon-blue">decentralized accelerator</span> platform powered by{' '}
                <span className="neon-green">Stellar blockchain</span>. 
                Connect your wallet to apply for funding, manage investments, or oversee the accelerator.
              </p>
            </div>
            
            <button
              onClick={connectWallet}
              className="cyber-btn px-12 py-6 text-2xl font-bold mb-20 hover-lift"
            >
              🔗 Connect Freighter Wallet
            </button>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
              <div className="cyber-card p-8 hover-glow hover-lift">
                <div className="text-5xl mb-4 neon-blue">🚀</div>
                <h3 className="text-xl font-bold cyber-subtitle mb-3">For Founders</h3>
                <p className="text-cyber-text-dim">
                  Apply for funding and receive milestone-based investments directly to your wallet
                </p>
              </div>
              <div className="cyber-card p-8 hover-glow hover-lift">
                <div className="text-5xl mb-4 neon-pink">💼</div>
                <h3 className="text-xl font-bold cyber-subtitle mb-3">For VCs</h3>
                <p className="text-cyber-text-dim">
                  Stake tokens to verify, then invest directly in approved startups
                </p>
              </div>
              <div className="cyber-card p-8 hover-glow hover-lift">
                <div className="text-5xl mb-4 neon-green">🗳️</div>
                <h3 className="text-xl font-bold cyber-subtitle mb-3">For Community</h3>
                <p className="text-cyber-text-dim">
                  Vote on startup applications and help shape the future of DeCo
                </p>
              </div>
            </div>

            {/* Blockchain Badge */}
            <div className="mt-16 inline-flex items-center space-x-3 cyber-card px-8 py-4">
              <span className="text-2xl neon-blue">⛓️</span>
              <div className="text-left">
                <div className="text-xs text-cyber-dim uppercase tracking-wider">Powered by</div>
                <div className="text-sm font-bold neon-blue">Stellar Blockchain</div>
              </div>
            </div>
          </div>
        ) : (
          renderView()
        )}
      </main>

      {/* Footer */}
      <footer className="cyber-card border-0 border-t border-cyber-primary/30 backdrop-blur-xl mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="text-cyber-text-dim text-sm">
              © 2024 DeCo - Decentralized Combinator. Built on <span className="neon-blue">Stellar Testnet</span>.
            </div>
            <div className="flex items-center space-x-6">
              <a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="text-cyber-text-dim hover:text-cyber-primary text-sm transition-colors">
                Stellar Network
              </a>
              <a href="https://soroban.stellar.org" target="_blank" rel="noopener noreferrer" className="text-cyber-text-dim hover:text-cyber-primary text-sm transition-colors">
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
