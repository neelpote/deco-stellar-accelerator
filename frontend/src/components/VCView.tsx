import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as StellarSdk from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { CONTRACT_ID, NETWORK_PASSPHRASE, TESTNET_XLM_CONTRACT, HORIZON_URL } from '../config';
import { server, getStartupStatus, getVCStakeRequired, getVCData, getAllStartups } from '../stellar';

const horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);

interface VCViewProps {
  publicKey: string;
}

export const VCView = ({ publicKey }: VCViewProps) => {
  const [searchAddress, setSearchAddress] = useState('');
  const [viewingAddress, setViewingAddress] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [investAmount, setInvestAmount] = useState('');
  const queryClient = useQueryClient();

  // Fetch VC stake requirement
  const { data: stakeRequired = '0' } = useQuery({
    queryKey: ['vcStakeRequired'],
    queryFn: getVCStakeRequired,
  });

  // Check if user is already a VC
  const { data: vcData, isLoading: vcLoading } = useQuery({
    queryKey: ['vcData', publicKey],
    queryFn: () => getVCData(publicKey),
    refetchInterval: 10000,
  });

  // Check XLM balance
  const { data: xlmBalance } = useQuery({
    queryKey: ['xlmBalance', publicKey],
    queryFn: async () => {
      try {
        const account = await horizonServer.loadAccount(publicKey);
        const balance = account.balances.find(balance => 
          balance.asset_type === 'native'
        );
        return balance && 'balance' in balance ? parseFloat(balance.balance) : 0;
      } catch (error) {
        console.error('Error fetching XLM balance:', error);
        return 0;
      }
    },
    refetchInterval: 10000,
  });

  // Fetch all startups for browsing
  const { data: allStartups = [] } = useQuery({
    queryKey: ['allStartups'],
    queryFn: getAllStartups,
    refetchInterval: 30000,
  });

  const { data: startupData } = useQuery({
    queryKey: ['vcViewStartup', viewingAddress],
    queryFn: () => viewingAddress ? getStartupStatus(viewingAddress) : null,
    enabled: !!viewingAddress,
  });

  // Stake to become VC
  const stakeMutation = useMutation({
    mutationFn: async (name: string) => {
      const sourceAccount = await server.getAccount(publicKey);
      const contract = new StellarSdk.Contract(CONTRACT_ID);
      
      // XLM token address
      const xlmAddress = new StellarSdk.Address(TESTNET_XLM_CONTRACT);

      // Check XLM balance
      const account = await horizonServer.loadAccount(publicKey);
      const xlmBalance = account.balances.find(balance => 
        balance.asset_type === 'native'
      );

      if (!xlmBalance || !('balance' in xlmBalance)) {
        throw new Error('XLM balance not found.');
      }

      const requiredAmount = Number(stakeRequired) / 1e7;
      const availableAmount = parseFloat(xlmBalance.balance);

      if (availableAmount < requiredAmount) {
        throw new Error(`Insufficient XLM balance. Required: ${requiredAmount} XLM, Available: ${availableAmount} XLM`);
      }

      // Proceed with staking
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'stake_to_become_vc',
            StellarSdk.Address.fromString(publicKey).toScVal(),
            StellarSdk.nativeToScVal(name, { type: 'string' }),
            xlmAddress.toScVal()
          )
        )
        .setTimeout(30)
        .build();

      const prepared = await server.prepareTransaction(transaction);
      const xdr = prepared.toXDR();
      const signedXdr = await signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(
        signedXdr,
        NETWORK_PASSPHRASE
      );

      const result = await server.sendTransaction(signedTx);
      
      let status = await server.getTransaction(result.hash);
      while (status.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        status = await server.getTransaction(result.hash);
      }

      if (status.status === 'SUCCESS') {
        return status;
      } else {
        throw new Error('Transaction failed');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vcData'] });
      setCompanyName('');
      alert('🎉 Successfully staked! You are now a verified VC.');
    },
    onError: (error) => {
      console.error('Stake error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Failed to stake: ${errorMessage}`);
    },
  });

  // Invest in startup
  const investMutation = useMutation({
    mutationFn: async ({ founder, amount }: { founder: string; amount: string }) => {
      const sourceAccount = await server.getAccount(publicKey);
      const contract = new StellarSdk.Contract(CONTRACT_ID);

      const amountInStroops = Math.floor(parseFloat(amount) * 1e7);
      
      // XLM token address
      const xlmAddress = new StellarSdk.Address(TESTNET_XLM_CONTRACT);

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'vc_invest',
            StellarSdk.Address.fromString(publicKey).toScVal(),
            StellarSdk.Address.fromString(founder).toScVal(),
            StellarSdk.nativeToScVal(BigInt(amountInStroops), { type: 'i128' }),
            xlmAddress.toScVal()
          )
        )
        .setTimeout(30)
        .build();

      const prepared = await server.prepareTransaction(transaction);
      const xdr = prepared.toXDR();
      const signedXdr = await signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(
        signedXdr,
        NETWORK_PASSPHRASE
      );

      const result = await server.sendTransaction(signedTx);
      
      let status = await server.getTransaction(result.hash);
      while (status.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        status = await server.getTransaction(result.hash);
      }

      if (status.status === 'SUCCESS') {
        return status;
      } else {
        throw new Error('Transaction failed');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vcViewStartup'] });
      queryClient.invalidateQueries({ queryKey: ['vcData'] });
      setInvestAmount('');
      alert('🎉 Investment successful!');
    },
    onError: (error) => {
      console.error('Investment error:', error);
      alert('❌ Failed to invest. Please try again.');
    },
  });

  const handleStake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      alert('Please enter your company name');
      return;
    }
    stakeMutation.mutate(companyName);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress.trim()) {
      setViewingAddress(searchAddress);
    }
  };

  const handleInvest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingAddress || !investAmount.trim()) {
      alert('Please enter investment amount');
      return;
    }
    investMutation.mutate({ founder: viewingAddress, amount: investAmount });
  };

  if (vcLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="cyber-loading w-16 h-16 mx-auto mb-4"></div>
          <p className="text-cyber-text-dim text-lg">Loading VC status...</p>
        </div>
      </div>
    );
  }

  // If not a VC, show staking interface
  if (!vcData) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="cyber-card p-8 mb-8 hover-glow">
          <h2 className="text-4xl font-bold cyber-title mb-2 glitch" data-text="Become a Venture Capitalist">💼 Become a Venture Capitalist</h2>
          <p className="text-cyber-text-dim text-lg">
            Stake testnet XLM tokens to become a verified VC and invest in approved startups
          </p>
          <div className="mt-4 p-3 bg-cyber-accent/10 border border-cyber-accent/30 rounded-lg">
            <div className="text-sm text-cyber-accent">
              💡 <strong>Testnet Mode:</strong> This uses testnet XLM tokens for testing. Everyone gets free testnet XLM automatically!
            </div>
          </div>
          <div className="mt-3 p-3 bg-cyber-primary/10 border border-cyber-primary/30 rounded-lg">
            <div className="text-sm text-cyber-primary">
              🚀 <strong>Easy Setup:</strong> No trustlines needed - XLM is the native token, ready to use immediately!
            </div>
          </div>
        </div>

        {/* Staking Card */}
        <div className="cyber-card p-8 hover-glow">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-cyber-secondary to-cyber-primary rounded-xl flex items-center justify-center mr-4">
              <span className="text-white text-xl">🔒</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold cyber-subtitle">Stake to Verify</h3>
              <p className="text-cyber-text-dim">Stake testnet XLM tokens to become a verified VC</p>
            </div>
          </div>

          <div className="cyber-card p-6 mb-6 bg-gradient-to-br from-cyber-secondary/10 to-cyber-primary/10 border-cyber-secondary">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Required Stake (Testnet XLM)</div>
                <div className="text-3xl font-bold neon-pink">
                  {(Number(stakeRequired) / 1e7).toFixed(2)} XLM
                </div>
              </div>
              <span className="text-5xl neon-pink">💰</span>
            </div>
          </div>

          <div className="cyber-card p-6 mb-6 bg-gradient-to-br from-cyber-accent/10 to-cyber-primary/10 border-cyber-accent">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Your XLM Balance</div>
                <div className={`text-2xl font-bold ${(xlmBalance || 0) >= (Number(stakeRequired) / 1e7) ? 'neon-green' : 'neon-pink'}`}>
                  {(xlmBalance || 0).toFixed(2)} XLM
                </div>
                {(xlmBalance || 0) < (Number(stakeRequired) / 1e7) && (
                  <div className="text-xs text-cyber-warning mt-1">
                    ⚠️ Insufficient balance for staking
                  </div>
                )}
              </div>
              <span className="text-4xl">{(xlmBalance || 0) >= (Number(stakeRequired) / 1e7) ? '✅' : '❌'}</span>
            </div>
          </div>

          <form onSubmit={handleStake} className="space-y-6">
            <div>
              <label className="block cyber-subtitle font-medium mb-2">
                Company/Fund Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="cyber-input w-full"
                placeholder="Your VC firm or investment company name"
              />
            </div>
            <button
              type="submit"
              disabled={stakeMutation.isPending || (xlmBalance || 0) < (Number(stakeRequired) / 1e7)}
              className="cyber-btn w-full px-8 py-4 text-lg font-bold hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {stakeMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <div className="cyber-loading mr-3"></div>
                  Setting up...
                </span>
              ) : (xlmBalance || 0) < (Number(stakeRequired) / 1e7) ? (
                <span className="flex items-center justify-center space-x-2">
                  <span>❌</span>
                  <span>Insufficient XLM Balance</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>🔒</span>
                  <span>Stake {(Number(stakeRequired) / 1e7).toFixed(2)} XLM</span>
                </span>
              )}
            </button>
            
            {/* Get XLM Help */}
            {(xlmBalance || 0) < (Number(stakeRequired) / 1e7) && (
              <div className="mt-6 p-4 bg-cyber-warning/10 border border-cyber-warning/30 rounded-lg">
                <div className="flex items-start">
                  <span className="text-2xl mr-3 mt-1">💡</span>
                  <div>
                    <div className="font-semibold text-cyber-warning mb-2">Need Testnet XLM?</div>
                    <div className="text-sm text-cyber-text-dim space-y-2">
                      <div>1. <strong>Stellar Laboratory:</strong> Use the account creator to get 10,000 XLM</div>
                      <div>2. <strong>Friendbot:</strong> Visit https://friendbot.stellar.org and enter your address</div>
                      <div>3. <strong>Testnet Faucet:</strong> Search for "Stellar testnet XLM faucet"</div>
                      <div className="pt-2 border-t border-cyber-warning/20">
                        <strong>Need:</strong> {(Number(stakeRequired) / 1e7).toFixed(2)} XLM | 
                        <strong> Have:</strong> {(xlmBalance || 0).toFixed(2)} XLM | 
                        <strong> Missing:</strong> {Math.max(0, (Number(stakeRequired) / 1e7) - (xlmBalance || 0)).toFixed(2)} XLM
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="cyber-card p-6 hover-glow hover-lift">
            <div className="text-4xl mb-3 neon-blue">🎯</div>
            <h4 className="text-lg font-bold cyber-subtitle mb-2">Direct Investment</h4>
            <p className="text-cyber-text-dim text-sm">
              Invest directly in approved startups without intermediaries
            </p>
          </div>
          <div className="cyber-card p-6 hover-glow hover-lift">
            <div className="text-4xl mb-3 neon-green">📊</div>
            <h4 className="text-lg font-bold cyber-subtitle mb-2">Portfolio Tracking</h4>
            <p className="text-cyber-text-dim text-sm">
              Monitor all your investments in real-time on the blockchain
            </p>
          </div>
          <div className="cyber-card p-6 hover-glow hover-lift">
            <div className="text-4xl mb-3 neon-pink">🔐</div>
            <h4 className="text-lg font-bold cyber-subtitle mb-2">Fully Decentralized</h4>
            <p className="text-cyber-text-dim text-sm">
              No admin approval needed - stake and start investing immediately
            </p>
          </div>
        </div>
      </div>
    );
  }

  // VC Dashboard
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="cyber-card p-8 mb-8 hover-glow">
        <h2 className="text-4xl font-bold cyber-title mb-2 glitch" data-text="VC Dashboard">💼 VC Dashboard</h2>
        <p className="text-cyber-text-dim text-lg">
          {vcData.company_name} - Invest in approved startups
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="cyber-card p-6 hover-glow hover-lift">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl neon-pink">🔒</div>
            <div className="bg-cyber-secondary/20 text-cyber-secondary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              STAKED
            </div>
          </div>
          <div className="text-cyber-text-dim text-sm font-medium mb-1 cyber-subtitle">Your Stake</div>
          <div className="text-3xl font-bold text-cyber-text">
            {(Number(vcData.stake_amount) / 1e7).toFixed(2)}
            <span className="text-lg text-cyber-text-dim ml-2">XLM</span>
          </div>
        </div>

        <div className="cyber-card p-6 hover-glow hover-lift">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl neon-green">💰</div>
            <div className="bg-cyber-accent/20 text-cyber-accent text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              DEPLOYED
            </div>
          </div>
          <div className="text-cyber-text-dim text-sm font-medium mb-1 cyber-subtitle">Total Invested</div>
          <div className="text-3xl font-bold text-cyber-text">
            {(Number(vcData.total_invested) / 1e7).toFixed(2)}
            <span className="text-lg text-cyber-text-dim ml-2">XLM</span>
          </div>
        </div>
      </div>

      {/* Browse Startups */}
      {allStartups.length > 0 && !viewingAddress && (
        <div className="cyber-card p-8 hover-glow">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-cyber-accent to-cyber-primary rounded-xl flex items-center justify-center mr-4">
              <span className="text-white text-xl">🚀</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold cyber-subtitle">Browse Startups</h3>
              <p className="text-cyber-text-dim">Click on any startup to view details and invest</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allStartups.slice(0, 6).map((address: string) => (
              <button
                key={address}
                onClick={() => setViewingAddress(address)}
                className="cyber-card p-6 hover-glow hover-lift text-left transition-all"
              >
                <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Founder Address</div>
                <div className="text-sm font-mono text-cyber-text truncate mb-3">{address}</div>
                <div className="text-cyber-primary font-semibold neon-blue">View Details →</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Startup */}
      <div className="cyber-card p-8 hover-glow">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-cyber-primary to-cyber-secondary rounded-xl flex items-center justify-center mr-4">
            <span className="text-white text-xl">🔍</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold cyber-subtitle">Search Startup</h3>
            <p className="text-cyber-text-dim">Enter founder's address to view their application</p>
          </div>
        </div>
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            className="cyber-input flex-1 font-mono"
            placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
          />
          <button
            type="submit"
            className="cyber-btn px-8 py-3"
          >
            Search
          </button>
        </form>
      </div>

      {/* Startup Details & Investment */}
      {viewingAddress && startupData && startupData.approved && (
        <div className="space-y-6">
          <div className="cyber-card p-8 hover-glow">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-cyber-accent to-cyber-primary rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-xl">🚀</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold cyber-subtitle">{startupData.project_name}</h3>
                <p className="text-cyber-text-dim">Approved startup ready for investment</p>
              </div>
            </div>
            <div className="cyber-card p-6 space-y-4">
              <div>
                <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Description</div>
                <p className="text-cyber-text">{startupData.description}</p>
              </div>
              <div className="pt-4 border-t border-cyber-border">
                <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Project URL</div>
                <a
                  href={startupData.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyber-primary hover:text-cyber-secondary font-semibold hover:underline neon-blue"
                >
                  {startupData.project_url} →
                </a>
              </div>
              <div className="pt-4 border-t border-cyber-border">
                <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Team</div>
                <p className="text-cyber-text">{startupData.team_info}</p>
              </div>
              <div className="pt-4 border-t border-cyber-border">
                <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Funding Goal</div>
                <div className="text-2xl font-bold neon-green">
                  {(Number(startupData.funding_goal) / 1e7).toFixed(2)} XLM
                </div>
              </div>
              <div className="pt-4 border-t border-cyber-border">
                <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Already Funded</div>
                <div className="text-xl font-bold text-cyber-text">
                  {(Number(startupData.total_allocated) / 1e7).toFixed(2)} XLM
                </div>
              </div>
            </div>
          </div>

          <div className="cyber-card p-8 hover-glow">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-cyber-accent to-cyber-primary rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-xl">💰</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold cyber-subtitle">Invest in this Startup</h3>
                <p className="text-cyber-text-dim">Enter your investment amount</p>
              </div>
            </div>
            <form onSubmit={handleInvest} className="space-y-6">
              <div>
                <label className="block cyber-subtitle font-medium mb-2">
                  Investment Amount (XLM)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  className="cyber-input w-full"
                  placeholder="1000.00"
                />
              </div>
              <button
                type="submit"
                disabled={investMutation.isPending}
                className="cyber-btn w-full px-8 py-4 text-lg font-bold hover-lift"
              >
                {investMutation.isPending ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="cyber-loading"></div>
                    <span>Investing...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <span>💰</span>
                    <span>Invest Now</span>
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Not Approved Message */}
      {viewingAddress && startupData && !startupData.approved && (
        <div className="cyber-card p-12 text-center bg-gradient-to-br from-cyber-warning/10 to-cyber-secondary/10 border-cyber-warning">
          <div className="text-6xl mb-4 neon-pink">⏳</div>
          <h3 className="text-2xl font-bold cyber-subtitle mb-2">Not Approved Yet</h3>
          <p className="text-cyber-text-dim">
            This startup hasn't been approved by the admin yet. Check back later.
          </p>
        </div>
      )}
    </div>
  );
};
