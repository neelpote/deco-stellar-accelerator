import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as StellarSdk from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { CONTRACT_ID, NETWORK_PASSPHRASE } from '../config';
import { server, getStartupStatus, getAllStartups } from '../stellar';
import { useIPFSMetadata } from '../hooks/useIPFSMetadata';
import { StartupCard } from './StartupCard';

interface PublicVotingViewProps {
  publicKey: string;
}

export const PublicVotingView = ({ publicKey }: PublicVotingViewProps) => {
  const [searchAddress, setSearchAddress] = useState('');
  const [viewingAddress, setViewingAddress] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch all startups
  const { data: allStartups = [] } = useQuery({
    queryKey: ['allStartups'],
    queryFn: getAllStartups,
    refetchInterval: 30000,
  });

  const { data: startupData, isLoading } = useQuery({
    queryKey: ['votingStartup', viewingAddress],
    queryFn: () => viewingAddress ? getStartupStatus(viewingAddress) : null,
    enabled: !!viewingAddress,
    refetchInterval: 5000,
  });

  // Fetch IPFS metadata for viewing startup
  const { data: metadata, isLoading: metadataLoading } = useIPFSMetadata(startupData?.ipfs_cid);

  const { data: hasVoted } = useQuery({
    queryKey: ['hasVoted', publicKey, viewingAddress],
    queryFn: async () => {
      if (!viewingAddress) return false;
      
      try {
        const contract = new StellarSdk.Contract(CONTRACT_ID);
        const sourceAccount = await server.getAccount(publicKey);
        
        const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
          fee: '100',
          networkPassphrase: NETWORK_PASSPHRASE,
        })
          .addOperation(
            contract.call(
              'has_voted',
              StellarSdk.Address.fromString(publicKey).toScVal(),
              StellarSdk.Address.fromString(viewingAddress).toScVal()
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
        console.error('Error checking vote status:', error);
        return false;
      }
    },
    enabled: !!viewingAddress && !!publicKey,
  });

  const voteMutation = useMutation({
    mutationFn: async ({ founder, voteYes }: { founder: string; voteYes: boolean }) => {
      const sourceAccount = await server.getAccount(publicKey);
      const contract = new StellarSdk.Contract(CONTRACT_ID);

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'vote',
            StellarSdk.Address.fromString(publicKey).toScVal(),
            StellarSdk.Address.fromString(founder).toScVal(),
            StellarSdk.nativeToScVal(voteYes, { type: 'bool' })
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
      queryClient.invalidateQueries({ queryKey: ['votingStartup'] });
      queryClient.invalidateQueries({ queryKey: ['hasVoted'] });
      alert('🎉 Vote submitted successfully!');
    },
    onError: (error) => {
      console.error('Vote error:', error);
      alert('❌ Failed to submit vote. Please try again.');
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress.trim()) {
      setViewingAddress(searchAddress);
    }
  };

  const handleVote = (voteYes: boolean) => {
    if (!viewingAddress) return;
    voteMutation.mutate({ founder: viewingAddress, voteYes });
  };

  const getTimeRemaining = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = endTime - now;
    
    if (remaining <= 0) return 'Voting ended';
    
    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((remaining % (60 * 60)) / 60);
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const isVotingActive = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    return now < endTime;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold mb-2">🗳️ Public DAO Voting</h2>
            <p className="text-green-100 text-lg">
              Vote on startup applications and help shape the future of DeCo
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
            <div className="text-sm text-green-100">Your Power</div>
            <div className="text-2xl font-bold">1 Vote</div>
          </div>
        </div>
      </div>

      {/* All Applications List */}
      {allStartups.length > 0 && !viewingAddress && (
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-3xl mr-3">📋</span>
            All Applications ({allStartups.length})
          </h3>
          <p className="text-gray-600 mb-6">
            Browse all startup applications and click to view details and vote
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allStartups.map((address: string, index: number) => {
              const { data: startupData } = useQuery({
                queryKey: ['startupCard', address],
                queryFn: () => getStartupStatus(address),
                staleTime: 10000,
              });
              
              return (
                <StartupCard
                  key={address}
                  index={index + 1}
                  startupData={startupData || null}
                  onClick={() => setViewingAddress(address)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-3xl mr-3">🔍</span>
          Find Startup to Vote On
        </h3>
        <p className="text-gray-600 mb-6">
          Enter a founder's Stellar address to view their application and cast your vote
        </p>
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
            placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-teal-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {/* Voting Section */}
      {viewingAddress && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading application...</p>
            </div>
          ) : startupData ? (
            <>
              {/* Application Card */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-8 border-2 border-blue-100">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                      <span className="text-3xl mr-3">🚀</span>
                      Startup Application
                    </h3>
                    <p className="text-gray-600">Review the details and cast your vote</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                    isVotingActive(startupData.voting_end_time)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {isVotingActive(startupData.voting_end_time) ? '🟢 VOTING OPEN' : '🔴 VOTING CLOSED'}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 space-y-4">
                  {metadataLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ) : metadata ? (
                    <>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Project Name</div>
                        <div className="text-xl font-bold text-gray-800">{metadata.project_name}</div>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">Description</div>
                        <p className="text-gray-800">{metadata.description}</p>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">Project URL</div>
                        <a
                          href={metadata.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-semibold hover:underline text-lg"
                        >
                          {metadata.project_url}
                        </a>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">Team Information</div>
                        <p className="text-gray-800">{metadata.team_info}</p>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">Funding Goal</div>
                        <div className="text-2xl font-bold text-green-600">
                          {(Number(startupData.funding_goal) / 1e7).toFixed(2)} USDC
                        </div>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">Founder Address</div>
                        <p className="text-gray-800 font-mono text-sm break-all bg-gray-50 p-3 rounded-lg">
                          {viewingAddress}
                        </p>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">Voting Period</div>
                        <p className="text-lg font-semibold text-gray-800">
                          {getTimeRemaining(startupData.voting_end_time)}
                        </p>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">IPFS CID</div>
                        <p className="text-xs font-mono text-gray-600 break-all bg-gray-50 p-2 rounded">
                          {startupData.ipfs_cid}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                      <p className="text-gray-600">⚠️ Unable to load project metadata from IPFS</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vote Results */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <span className="text-3xl mr-3">📊</span>
                  Current Vote Results
                </h3>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-4xl">👍</span>
                      <span className="text-3xl font-bold text-green-600">{startupData.yes_votes}</span>
                    </div>
                    <div className="text-gray-700 font-semibold">Yes Votes</div>
                    <div className="text-sm text-gray-500">Support this application</div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border-2 border-red-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-4xl">👎</span>
                      <span className="text-3xl font-bold text-red-600">{startupData.no_votes}</span>
                    </div>
                    <div className="text-gray-700 font-semibold">No Votes</div>
                    <div className="text-sm text-gray-500">Reject this application</div>
                  </div>
                </div>

                {/* Vote Progress Bar */}
                <div className="mb-8">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Community Sentiment</span>
                    <span className="font-semibold">
                      {startupData.yes_votes + startupData.no_votes > 0
                        ? `${Math.round((startupData.yes_votes / (startupData.yes_votes + startupData.no_votes)) * 100)}% Yes`
                        : 'No votes yet'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden flex">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold"
                      style={{
                        width: `${startupData.yes_votes + startupData.no_votes > 0
                          ? (startupData.yes_votes / (startupData.yes_votes + startupData.no_votes)) * 100
                          : 50}%`
                      }}
                    >
                      {startupData.yes_votes > 0 && startupData.yes_votes}
                    </div>
                    <div
                      className="bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold"
                      style={{
                        width: `${startupData.yes_votes + startupData.no_votes > 0
                          ? (startupData.no_votes / (startupData.yes_votes + startupData.no_votes)) * 100
                          : 50}%`
                      }}
                    >
                      {startupData.no_votes > 0 && startupData.no_votes}
                    </div>
                  </div>
                </div>

                {/* Voting Buttons */}
                {isVotingActive(startupData.voting_end_time) ? (
                  hasVoted ? (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                      <span className="text-4xl mb-3 block">✅</span>
                      <h4 className="text-xl font-bold text-gray-800 mb-2">You've Already Voted</h4>
                      <p className="text-gray-600">Thank you for participating in the DAO!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleVote(true)}
                        disabled={voteMutation.isPending}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-6 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                      >
                        {voteMutation.isPending ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Voting...
                          </span>
                        ) : (
                          <>
                            <span className="text-3xl block mb-2">👍</span>
                            Vote YES
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleVote(false)}
                        disabled={voteMutation.isPending}
                        className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-6 rounded-xl hover:from-red-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                      >
                        {voteMutation.isPending ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Voting...
                          </span>
                        ) : (
                          <>
                            <span className="text-3xl block mb-2">👎</span>
                            Vote NO
                          </>
                        )}
                      </button>
                    </div>
                  )
                ) : (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                    <span className="text-4xl mb-3 block">⏰</span>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Voting Period Ended</h4>
                    <p className="text-gray-600">The admin will review the results and make a decision</p>
                  </div>
                )}
              </div>

              {/* Admin Status */}
              {startupData.approved && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-200">
                  <div className="flex items-center">
                    <span className="text-4xl mr-4">✅</span>
                    <div>
                      <h4 className="text-xl font-bold text-gray-800">Application Approved</h4>
                      <p className="text-gray-600">This startup has been approved by the admin for funding</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl shadow-lg p-12 text-center">
              <span className="text-6xl mb-4 block">⚠️</span>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No Application Found</h3>
              <p className="text-gray-600">
                This address hasn't submitted an application yet or the address is invalid.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info Cards */}
      {!viewingAddress && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-100">
            <span className="text-4xl mb-3 block">🗳️</span>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Democratic Voting</h4>
            <p className="text-gray-600 text-sm">
              Every wallet gets one vote to support or reject startup applications
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6 border-2 border-blue-100">
            <span className="text-4xl mb-3 block">⏰</span>
            <h4 className="text-lg font-bold text-gray-800 mb-2">7-Day Voting Period</h4>
            <p className="text-gray-600 text-sm">
              Each application has a 7-day voting window for community input
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-100">
            <span className="text-4xl mb-3 block">🔐</span>
            <h4 className="text-lg font-bold text-gray-800 mb-2">On-Chain Transparency</h4>
            <p className="text-gray-600 text-sm">
              All votes are recorded on the blockchain for complete transparency
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
