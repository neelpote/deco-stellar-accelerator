import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as StellarSdk from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { CONTRACT_ID, NETWORK_PASSPHRASE } from '../config';
import { server, getStartupStatus, getVCStakeRequired, getVCData, getAllStartups } from '../stellar';

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
      
      // USDC token address
      const usdcAddress = new StellarSdk.Address(
        StellarSdk.Asset.native().contractId(NETWORK_PASSPHRASE)
      );

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'stake_to_become_vc',
            StellarSdk.Address.fromString(publicKey).toScVal(),
            StellarSdk.nativeToScVal(name, { type: 'string' }),
            usdcAddress.toScVal()
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
      alert('❌ Failed to stake. Please try again.');
    },
  });

  // Invest in startup
  const investMutation = useMutation({
    mutationFn: async ({ founder, amount }: { founder: string; amount: string }) => {
      const sourceAccount = await server.getAccount(publicKey);
      const contract = new StellarSdk.Contract(CONTRACT_ID);

      const amountInStroops = Math.floor(parseFloat(amount) * 1e7).toString();
      
      // USDC token address
      const usdcAddress = new StellarSdk.Address(
        StellarSdk.Asset.native().contractId(NETWORK_PASSPHRASE)
      );

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'vc_invest',
            StellarSdk.Address.fromString(publicKey).toScVal(),
            StellarSdk.Address.fromString(founder).toScVal(),
            StellarSdk.nativeToScVal(amountInStroops, { type: 'i128' }),
            usdcAddress.toScVal()
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading VC status...</p>
        </div>
      </div>
    );
  }

  // If not a VC, show staking interface
  if (!vcData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <h2 className="text-4xl font-bold mb-2">💼 Become a Venture Capitalist</h2>
          <p className="text-purple-100 text-lg">
            Stake tokens to become a verified VC and invest in approved startups
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-3xl mr-3">🔒</span>
            Stake to Verify
          </h3>
          <p className="text-gray-600 mb-6">
            To become a verified VC on DeCo, you need to stake USDC tokens. This ensures commitment and aligns incentives in the ecosystem.
          </p>

          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 mb-6 border-2 border-purple-100">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600 mb-1">Required Stake</div>
                <div className="text-3xl font-bold text-purple-600">
                  {(Number(stakeRequired) / 1e7).toFixed(2)} USDC
                </div>
              </div>
              <span className="text-5xl">💰</span>
            </div>
          </div>

          <form onSubmit={handleStake}>
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Company/Fund Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                placeholder="Your VC firm or investment company name"
              />
            </div>
            <button
              type="submit"
              disabled={stakeMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              {stakeMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Staking...
                </span>
              ) : (
                `🔒 Stake ${(Number(stakeRequired) / 1e7).toFixed(2)} USDC & Become VC`
              )}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6 border-2 border-blue-100">
            <span className="text-4xl mb-3 block">🎯</span>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Direct Investment</h4>
            <p className="text-gray-600 text-sm">
              Invest directly in approved startups without intermediaries
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-100">
            <span className="text-4xl mb-3 block">📊</span>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Portfolio Tracking</h4>
            <p className="text-gray-600 text-sm">
              Monitor all your investments in real-time on the blockchain
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-100">
            <span className="text-4xl mb-3 block">🔐</span>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Fully Decentralized</h4>
            <p className="text-gray-600 text-sm">
              No admin approval needed - stake and start investing immediately
            </p>
          </div>
        </div>
      </div>
    );
  }

  // VC Dashboard - will continue in next part
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold mb-2">💼 VC Dashboard</h2>
            <p className="text-purple-100 text-lg">
              {vcData.company_name} - Invest in approved startups
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
            <div className="text-sm text-purple-100">Total Invested</div>
            <div className="text-2xl font-bold">
              {(Number(vcData.total_invested) / 1e7).toFixed(2)} USDC
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg p-6 border-2 border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-4xl">🔒</span>
            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">
              STAKED
            </span>
          </div>
          <div className="text-gray-600 text-sm font-medium mb-1">Your Stake</div>
          <div className="text-3xl font-bold text-gray-800">
            {(Number(vcData.stake_amount) / 1e7).toFixed(2)}
            <span className="text-lg text-gray-600 ml-2">USDC</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-4xl">💰</span>
            <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
              DEPLOYED
            </span>
          </div>
          <div className="text-gray-600 text-sm font-medium mb-1">Total Invested</div>
          <div className="text-3xl font-bold text-gray-800">
            {(Number(vcData.total_invested) / 1e7).toFixed(2)}
            <span className="text-lg text-gray-600 ml-2">USDC</span>
          </div>
        </div>
      </div>

      {allStartups.length > 0 && !viewingAddress && (
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-3xl mr-3">🚀</span>
            Browse Startups
          </h3>
          <p className="text-gray-600 mb-6">
            Click on any startup to view details and invest
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allStartups.slice(0, 6).map((address: string) => (
              <button
                key={address}
                onClick={() => setViewingAddress(address)}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all text-left"
              >
                <div className="text-sm text-gray-600 mb-1">Founder Address</div>
                <div className="text-sm font-mono text-gray-800 truncate mb-3">{address}</div>
                <div className="text-purple-600 font-semibold">View Details →</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-3xl mr-3">🔍</span>
          Search Startup
        </h3>
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
            placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {viewingAddress && startupData && startupData.approved && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-8 border-2 border-blue-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-3xl mr-3">🚀</span>
              {startupData.project_name}
            </h3>
            <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Description</div>
                <p className="text-gray-800">{startupData.description}</p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Project URL</div>
                <a
                  href={startupData.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                >
                  {startupData.project_url} →
                </a>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Team</div>
                <p className="text-gray-800">{startupData.team_info}</p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Funding Goal</div>
                <div className="text-2xl font-bold text-green-600">
                  {(Number(startupData.funding_goal) / 1e7).toFixed(2)} USDC
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Already Funded</div>
                <div className="text-xl font-bold text-gray-800">
                  {(Number(startupData.total_allocated) / 1e7).toFixed(2)} USDC
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-3xl mr-3">💰</span>
              Invest in this Startup
            </h3>
            <form onSubmit={handleInvest}>
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Investment Amount (USDC)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                  placeholder="1000.00"
                />
              </div>
              <button
                type="submit"
                disabled={investMutation.isPending}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                {investMutation.isPending ? 'Investing...' : '💰 Invest Now'}
              </button>
            </form>
          </div>
        </div>
      )}

      {viewingAddress && startupData && !startupData.approved && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl shadow-lg p-12 text-center">
          <span className="text-6xl mb-4 block">⏳</span>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Not Approved Yet</h3>
          <p className="text-gray-600">
            This startup hasn't been approved by the admin yet. Check back later.
          </p>
        </div>
      )}
    </div>
  );
};
