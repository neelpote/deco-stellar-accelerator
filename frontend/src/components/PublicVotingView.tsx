import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as StellarSdk from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { CONTRACT_ID, NETWORK_PASSPHRASE } from '../config';
import { server, getStartupStatus, getAllStartups } from '../stellar';
import { useIPFSMetadata } from '../hooks/useIPFSMetadata';
import { StartupCard } from './StartupCard';

// Component to handle individual startup card data fetching
const StartupCardWithData = ({ address, index, onClick }: { 
  address: string; 
  index: number; 
  onClick: () => void; 
}) => {
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
      onClick={onClick}
    />
  );
};

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
            StellarSdk.xdr.ScVal.scvBool(voteYes)
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

  const getTimeRemaining = (endTime: number | bigint) => {
    const now = Math.floor(Date.now() / 1000);
    // Convert BigInt to number for calculations
    const endTimeNum = typeof endTime === 'bigint' ? Number(endTime) : endTime;
    const remaining = endTimeNum - now;
    
    if (remaining <= 0) return 'Voting ended';
    
    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((remaining % (60 * 60)) / 60);
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const isVotingActive = (endTime: number | bigint) => {
    const now = Math.floor(Date.now() / 1000);
    // Convert BigInt to number for comparison
    const endTimeNum = typeof endTime === 'bigint' ? Number(endTime) : endTime;
    return now < endTimeNum;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="cyber-card p-8 mb-8 hover-glow">
        <h2 className="text-4xl font-bold cyber-title mb-2 glitch" data-text="Public DAO Voting">🗳️ Public DAO Voting</h2>
        <p className="text-cyber-text-dim text-lg">
          Vote on startup applications and help shape the future of DeCo
        </p>
      </div>

      {/* All Applications List */}
      {allStartups.length > 0 && !viewingAddress && (
        <div className="cyber-card p-8 hover-glow">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-cyber-accent to-cyber-primary rounded-xl flex items-center justify-center mr-4">
              <span className="text-white text-xl">📋</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold cyber-subtitle">All Applications ({allStartups.length})</h3>
              <p className="text-cyber-text-dim">Browse all startup applications and click to view details and vote</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allStartups.map((address: string, index: number) => (
              <StartupCardWithData
                key={address}
                address={address}
                index={index}
                onClick={() => setViewingAddress(address)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="cyber-card p-8 hover-glow">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-cyber-primary to-cyber-secondary rounded-xl flex items-center justify-center mr-4">
            <span className="text-white text-xl">🔍</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold cyber-subtitle">Find Startup to Vote On</h3>
            <p className="text-cyber-text-dim">Enter a founder's Stellar address to view their application and cast your vote</p>
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

      {/* Voting Section */}
      {viewingAddress && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="cyber-card p-12 text-center hover-glow">
              <div className="cyber-loading w-16 h-16 mx-auto mb-4"></div>
              <p className="text-cyber-text-dim text-lg">Loading application...</p>
            </div>
          ) : startupData ? (
            <>
              {/* Application Card */}
              <div className="cyber-card p-8 hover-glow">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyber-accent to-cyber-primary rounded-xl flex items-center justify-center mr-4">
                      <span className="text-white text-xl">🚀</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold cyber-subtitle">Startup Application</h3>
                      <p className="text-cyber-text-dim">Review the details and cast your vote</p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wider ${
                    isVotingActive(startupData.voting_end_time)
                      ? 'bg-cyber-accent/20 text-cyber-accent border border-cyber-accent'
                      : 'bg-cyber-secondary/20 text-cyber-secondary border border-cyber-secondary'
                  }`}>
                    {isVotingActive(startupData.voting_end_time) ? '🟢 VOTING OPEN' : '🔴 VOTING CLOSED'}
                  </div>
                </div>

                <div className="cyber-card p-6 space-y-4">
                  {metadataLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 bg-cyber-surface rounded w-3/4"></div>
                      <div className="h-4 bg-cyber-surface rounded w-full"></div>
                      <div className="h-4 bg-cyber-surface rounded w-2/3"></div>
                    </div>
                  ) : metadata ? (
                    <>
                      <div>
                        <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Project Name</div>
                        <div className="text-xl font-bold text-cyber-primary">{metadata.project_name}</div>
                      </div>
                      <div className="pt-4 border-t border-cyber-border">
                        <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Description</div>
                        <p className="text-cyber-text">{metadata.description}</p>
                      </div>
                      <div className="pt-4 border-t border-cyber-border">
                        <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Project URL</div>
                        <a
                          href={metadata.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyber-primary hover:text-cyber-secondary font-semibold hover:underline text-lg neon-blue"
                        >
                          {metadata.project_url}
                        </a>
                      </div>
                      <div className="pt-4 border-t border-cyber-border">
                        <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Team Information</div>
                        <p className="text-cyber-text">{metadata.team_info}</p>
                      </div>
                      <div className="pt-4 border-t border-cyber-border">
                        <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Funding Goal</div>
                        <div className="text-2xl font-bold neon-green">
                          {(Number(startupData.funding_goal) / 1e7).toFixed(2)} XLM
                        </div>
                      </div>
                      <div className="pt-4 border-t border-cyber-border">
                        <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Founder Address</div>
                        <p className="text-cyber-text font-mono text-sm break-all bg-cyber-surface p-3 rounded-lg">
                          {viewingAddress}
                        </p>
                      </div>
                      <div className="pt-4 border-t border-cyber-border">
                        <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Voting Period</div>
                        <p className="text-lg font-semibold text-cyber-text">
                          {getTimeRemaining(startupData.voting_end_time)}
                        </p>
                      </div>
                      <div className="pt-4 border-t border-cyber-border">
                        <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">IPFS CID</div>
                        <p className="text-xs font-mono text-cyber-text-dim break-all bg-cyber-surface p-2 rounded">
                          {startupData.ipfs_cid}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="bg-cyber-warning/20 border border-cyber-warning/50 rounded-xl p-6">
                      <p className="text-cyber-warning">⚠️ Unable to load project metadata from IPFS</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vote Results */}
              <div className="cyber-card p-8 hover-glow">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyber-primary to-cyber-secondary rounded-xl flex items-center justify-center mr-4">
                    <span className="text-white text-xl">📊</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold cyber-subtitle">Current Vote Results</h3>
                    <p className="text-cyber-text-dim">Community sentiment on this application</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="cyber-card p-6 bg-gradient-to-br from-cyber-accent/10 to-cyber-primary/10 border-cyber-accent hover-glow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-4xl neon-green">👍</span>
                      <span className="text-3xl font-bold neon-green">{Number(startupData.yes_votes)}</span>
                    </div>
                    <div className="cyber-subtitle font-semibold">Yes Votes</div>
                    <div className="text-sm text-cyber-text-dim">Support this application</div>
                  </div>

                  <div className="cyber-card p-6 bg-gradient-to-br from-cyber-secondary/10 to-cyber-warning/10 border-cyber-secondary hover-glow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-4xl neon-pink">👎</span>
                      <span className="text-3xl font-bold neon-pink">{Number(startupData.no_votes)}</span>
                    </div>
                    <div className="cyber-subtitle font-semibold">No Votes</div>
                    <div className="text-sm text-cyber-text-dim">Reject this application</div>
                  </div>
                </div>

                {/* Vote Progress Bar */}
                <div className="mb-8">
                  <div className="flex justify-between text-sm text-cyber-text-dim mb-2">
                    <span className="cyber-subtitle">Community Sentiment</span>
                    <span className="font-semibold">
                      {Number(startupData.yes_votes) + Number(startupData.no_votes) > 0
                        ? `${Math.round((Number(startupData.yes_votes) / (Number(startupData.yes_votes) + Number(startupData.no_votes))) * 100)}% Yes`
                        : 'No votes yet'}
                    </span>
                  </div>
                  <div className="cyber-progress h-6 flex">
                    <div
                      className="cyber-progress-bar flex items-center justify-center text-white text-xs font-bold"
                      style={{
                        width: `${Number(startupData.yes_votes) + Number(startupData.no_votes) > 0
                          ? (Number(startupData.yes_votes) / (Number(startupData.yes_votes) + Number(startupData.no_votes))) * 100
                          : 50}%`
                      }}
                    >
                      {Number(startupData.yes_votes) > 0 && Number(startupData.yes_votes)}
                    </div>
                    <div
                      className="bg-gradient-to-r from-cyber-secondary to-cyber-warning flex items-center justify-center text-white text-xs font-bold rounded-r-lg"
                      style={{
                        width: `${Number(startupData.yes_votes) + Number(startupData.no_votes) > 0
                          ? (Number(startupData.no_votes) / (Number(startupData.yes_votes) + Number(startupData.no_votes))) * 100
                          : 50}%`
                      }}
                    >
                      {Number(startupData.no_votes) > 0 && Number(startupData.no_votes)}
                    </div>
                  </div>
                </div>

                {/* Voting Buttons */}
                {isVotingActive(startupData.voting_end_time) ? (
                  hasVoted ? (
                    <div className="cyber-card p-6 text-center bg-gradient-to-br from-cyber-primary/10 to-cyber-secondary/10 border-cyber-primary">
                      <span className="text-4xl mb-3 block neon-blue">✅</span>
                      <h4 className="text-xl font-bold cyber-subtitle mb-2">You've Already Voted</h4>
                      <p className="text-cyber-text-dim">Thank you for participating in the DAO!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleVote(true)}
                        disabled={voteMutation.isPending}
                        className="cyber-btn px-8 py-6 text-lg font-medium flex flex-col items-center justify-center space-y-2 hover-lift"
                      >
                        {voteMutation.isPending ? (
                          <>
                            <div className="cyber-loading"></div>
                            <span>Voting...</span>
                          </>
                        ) : (
                          <>
                            <span className="text-3xl neon-green">👍</span>
                            <span>Vote YES</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleVote(false)}
                        disabled={voteMutation.isPending}
                        className="bg-gradient-to-r from-cyber-secondary to-cyber-warning hover:from-cyber-secondary/80 hover:to-cyber-warning/80 disabled:bg-gray-500 text-white px-8 py-6 rounded-xl font-medium text-lg transition-all flex flex-col items-center justify-center space-y-2 hover-lift"
                      >
                        {voteMutation.isPending ? (
                          <>
                            <div className="cyber-loading"></div>
                            <span>Voting...</span>
                          </>
                        ) : (
                          <>
                            <span className="text-3xl neon-pink">👎</span>
                            <span>Vote NO</span>
                          </>
                        )}
                      </button>
                    </div>
                  )
                ) : (
                  <div className="cyber-card p-6 text-center bg-gradient-to-br from-cyber-secondary/10 to-cyber-warning/10 border-cyber-secondary">
                    <span className="text-4xl mb-3 block neon-pink">⏰</span>
                    <h4 className="text-xl font-bold cyber-subtitle mb-2">Voting Period Ended</h4>
                    <p className="text-cyber-text-dim">The admin will review the results and make a decision</p>
                  </div>
                )}
              </div>

              {/* Admin Status */}
              {startupData.approved && (
                <div className="cyber-card p-6 bg-gradient-to-br from-cyber-accent/10 to-cyber-primary/10 border-cyber-accent">
                  <div className="flex items-center">
                    <span className="text-4xl mr-4 neon-green">✅</span>
                    <div>
                      <h4 className="text-xl font-bold cyber-subtitle">Application Approved</h4>
                      <p className="text-cyber-text-dim">This startup has been approved by the admin for funding</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="cyber-card p-12 text-center bg-gradient-to-br from-cyber-warning/10 to-cyber-secondary/10 border-cyber-warning">
              <span className="text-6xl mb-4 block neon-pink">⚠️</span>
              <h3 className="text-2xl font-bold cyber-subtitle mb-2">No Application Found</h3>
              <p className="text-cyber-text-dim">
                This address hasn't submitted an application yet or the address is invalid.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info Cards */}
      {!viewingAddress && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="cyber-card p-6 hover-glow hover-lift">
            <div className="text-4xl mb-3 neon-green">🗳️</div>
            <h4 className="text-lg font-bold cyber-subtitle mb-2">Democratic Voting</h4>
            <p className="text-cyber-text-dim text-sm">
              Every wallet gets one vote to support or reject startup applications
            </p>
          </div>
          <div className="cyber-card p-6 hover-glow hover-lift">
            <div className="text-4xl mb-3 neon-blue">⏰</div>
            <h4 className="text-lg font-bold cyber-subtitle mb-2">7-Day Voting Period</h4>
            <p className="text-cyber-text-dim text-sm">
              Each application has a 7-day voting window for community input
            </p>
          </div>
          <div className="cyber-card p-6 hover-glow hover-lift">
            <div className="text-4xl mb-3 neon-pink">🔐</div>
            <h4 className="text-lg font-bold cyber-subtitle mb-2">On-Chain Transparency</h4>
            <p className="text-cyber-text-dim text-sm">
              All votes are recorded on the blockchain for complete transparency
            </p>
          </div>
          <div className="cyber-card p-6 hover-glow hover-lift cursor-pointer bg-gradient-to-br from-cyber-secondary/10 to-cyber-primary/10 border-cyber-secondary" 
               onClick={() => {
                 const event = new CustomEvent('navigate-to-vc');
                 window.dispatchEvent(event);
               }}>
            <div className="text-4xl mb-3 neon-secondary">💼</div>
            <h4 className="text-lg font-bold cyber-subtitle mb-2">Become a VC</h4>
            <p className="text-cyber-text-dim text-sm">
              Stake tokens and invest in approved startups →
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
