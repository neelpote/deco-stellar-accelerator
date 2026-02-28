import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as StellarSdk from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { CONTRACT_ID, NETWORK_PASSPHRASE } from '../config';
import { server, getStartupStatus } from '../stellar';
import { verifyAdmin, EXPECTED_ADMIN } from '../adminTest';

interface AdminViewProps {
  publicKey: string;
}

export const AdminView = ({ publicKey }: AdminViewProps) => {
  const [approveAddress, setApproveAddress] = useState('');
  const [reviewAddress, setReviewAddress] = useState('');
  const [adminDebug, setAdminDebug] = useState<any>(null);

  // Debug function to verify admin status
  const checkAdminStatus = async () => {
    const result = await verifyAdmin(publicKey);
    setAdminDebug(result);
    
    if (!result.isAdmin) {
      alert(`❌ Admin Verification Failed!\n\nYour wallet: ${publicKey}\nExpected admin: ${result.adminAddress || EXPECTED_ADMIN.address}\n\nPlease import the admin secret key: ${EXPECTED_ADMIN.secret}`);
    } else {
      alert('✅ Admin verification successful!');
    }
  };

  // Fetch startup details for review
  const { data: reviewData } = useQuery({
    queryKey: ['reviewStartup', reviewAddress],
    queryFn: () => reviewAddress ? getStartupStatus(reviewAddress) : null,
    enabled: !!reviewAddress,
  });

  const approveApplicationMutation = useMutation({
    mutationFn: async (founder: string) => {
      // Validate founder address format
      if (!founder || founder.trim().length === 0) {
        throw new Error('Founder address is required');
      }
      
      try {
        StellarSdk.StrKey.decodeEd25519PublicKey(founder);
      } catch (error) {
        throw new Error('Invalid Stellar address format');
      }

      // Validate admin address format
      try {
        StellarSdk.StrKey.decodeEd25519PublicKey(publicKey);
      } catch (error) {
        throw new Error('Invalid admin address format');
      }

      // First check if the startup exists
      const startupStatus = await getStartupStatus(founder);
      if (!startupStatus) {
        throw new Error('Startup application not found. The founder must submit an application first.');
      }

      if (startupStatus.approved) {
        throw new Error('This application has already been approved.');
      }

      const sourceAccount = await server.getAccount(publicKey);
      const contract = new StellarSdk.Contract(CONTRACT_ID);

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'approve_application',
            StellarSdk.Address.fromString(publicKey).toScVal(),
            StellarSdk.Address.fromString(founder).toScVal()
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
        throw new Error(`Transaction failed: ${status.status}`);
      }
    },
    onSuccess: () => {
      setApproveAddress('');
      alert('🎉 Application approved successfully!');
    },
    onError: (error: unknown) => {
      console.error('Approval error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Failed to approve application: ${errorMessage}`);
    },
  });

  const handleApproveApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveAddress.trim()) {
      alert('Please enter founder address');
      return;
    }
    approveApplicationMutation.mutate(approveAddress);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="cyber-card p-8 mb-8 hover-glow">
        <h2 className="text-4xl font-bold cyber-title mb-2 glitch" data-text="Admin Dashboard">👑 Admin Dashboard</h2>
        <p className="text-cyber-text-dim text-lg">
          Manage funding allocations, approve milestones, and oversee the accelerator
        </p>
        
        {/* Admin Debug Section */}
        <div className="mt-6 p-4 bg-cyber-surface/50 rounded-lg border border-cyber-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-cyber-text-dim">Connected as:</div>
              <div className="text-sm font-mono text-cyber-primary">{publicKey}</div>
              {adminDebug && (
                <div className="text-xs text-cyber-text-dim mt-1">
                  Expected admin: {adminDebug.adminAddress || EXPECTED_ADMIN.address}
                </div>
              )}
            </div>
            <button
              onClick={checkAdminStatus}
              className="px-4 py-2 bg-cyber-warning/20 text-cyber-warning border border-cyber-warning rounded-lg hover:bg-cyber-warning/30 text-sm font-medium"
            >
              🔍 Verify Admin
            </button>
          </div>
        </div>
      </div>

      {/* Review & Approve Application */}
      <div className="cyber-card p-8 hover-glow">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-cyber-accent to-cyber-primary rounded-xl flex items-center justify-center mr-4">
            <span className="text-white text-xl">✅</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold cyber-subtitle">Review & Approve Application</h3>
            <p className="text-cyber-text-dim">Review the application details and community votes before approving</p>
          </div>
        </div>
        
        {/* Review Section */}
        <div className="mb-6">
          <label className="block cyber-subtitle font-medium mb-2">
            Review Application
          </label>
          <p className="text-sm text-cyber-text-dim mb-2">
            Enter founder's address to view application details
          </p>
          <div className="flex gap-4">
            <input
              type="text"
              value={reviewAddress}
              onChange={(e) => setReviewAddress(e.target.value)}
              className="cyber-input flex-1 font-mono text-sm"
              placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            />
            <button
              type="button"
              onClick={() => setReviewAddress('')}
              className="px-6 py-3 border border-cyber-border text-cyber-text-dim rounded-lg hover:bg-cyber-surface font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Application Details */}
        {reviewData && (
          <div className="cyber-card p-6 mb-6 space-y-4">
            <div>
              <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Project Name</div>
              <div className="text-xl font-bold text-cyber-primary">{reviewData.project_name}</div>
            </div>
            <div className="pt-4 border-t border-cyber-border">
              <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Description</div>
              <p className="text-cyber-text">{reviewData.description}</p>
            </div>
            <div className="pt-4 border-t border-cyber-border">
              <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Project URL</div>
              <a
                href={reviewData.project_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyber-primary hover:text-cyber-secondary font-semibold hover:underline neon-blue"
              >
                {reviewData.project_url} →
              </a>
            </div>
            <div className="pt-4 border-t border-cyber-border">
              <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Team</div>
              <p className="text-cyber-text">{reviewData.team_info}</p>
            </div>
            <div className="pt-4 border-t border-cyber-border">
              <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Funding Goal</div>
              <div className="text-2xl font-bold neon-green">
                {(Number(reviewData.funding_goal) / 1e7).toFixed(2)} XLM
              </div>
            </div>
            <div className="pt-4 border-t border-cyber-border">
              <div className="text-sm text-cyber-text-dim mb-1 cyber-subtitle">Community Votes</div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="neon-green">👍</span>
                  <span className="text-lg font-bold neon-green">{Number(reviewData.yes_votes)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="neon-pink">👎</span>
                  <span className="text-lg font-bold neon-pink">{Number(reviewData.no_votes)}</span>
                </div>
                <div className="ml-auto text-sm text-cyber-text-dim">
                  {Number(reviewData.yes_votes) + Number(reviewData.no_votes) > 0
                    ? `${Math.round((Number(reviewData.yes_votes) / (Number(reviewData.yes_votes) + Number(reviewData.no_votes))) * 100)}% approval`
                    : 'No votes yet'}
                </div>
              </div>
            </div>
            {reviewData.approved && (
              <div className="pt-4 border-t border-cyber-border">
                <span className="text-sm font-semibold neon-green">✅ Already Approved</span>
              </div>
            )}
          </div>
        )}

        {/* Approve Form */}
        <form onSubmit={handleApproveApplication} className="space-y-6">
          <div>
            <label className="block cyber-subtitle font-medium mb-2">
              Approve Founder's Address
            </label>
            <p className="text-sm text-cyber-text-dim mb-2">
              Enter the address to approve (or use the reviewed address above)
            </p>
            <input
              type="text"
              value={approveAddress}
              onChange={(e) => setApproveAddress(e.target.value)}
              className="cyber-input w-full font-mono text-sm"
              placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            />
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={approveApplicationMutation.isPending}
              className="cyber-btn flex-1 px-8 py-4 text-lg font-bold hover-lift"
            >
              {approveApplicationMutation.isPending ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="cyber-loading"></div>
                  <span>Approving...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>✅</span>
                  <span>Approve Application</span>
                </span>
              )}
            </button>
            {reviewAddress && (
              <button
                type="button"
                onClick={() => setApproveAddress(reviewAddress)}
                className="px-6 py-4 border border-cyber-primary/50 text-cyber-primary rounded-lg hover:bg-cyber-primary/20 font-medium"
              >
                Use Reviewed Address
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="cyber-card p-6 hover-glow hover-lift">
          <div className="text-4xl mb-3 neon-green">🗳️</div>
          <h4 className="text-lg font-bold cyber-subtitle mb-2">Community Driven</h4>
          <p className="text-cyber-text-dim text-sm">
            Approve applications based on community votes and project quality
          </p>
        </div>
        <div className="cyber-card p-6 hover-glow hover-lift">
          <div className="text-4xl mb-3 neon-blue">🔐</div>
          <h4 className="text-lg font-bold cyber-subtitle mb-2">Decentralized Funding</h4>
          <p className="text-cyber-text-dim text-sm">
            VCs invest directly - no admin control over funding
          </p>
        </div>
        <div className="cyber-card p-6 hover-glow hover-lift">
          <div className="text-4xl mb-3 neon-pink">📊</div>
          <h4 className="text-lg font-bold cyber-subtitle mb-2">Transparent Process</h4>
          <p className="text-cyber-text-dim text-sm">
            All approvals are recorded on the blockchain
          </p>
        </div>
      </div>
    </div>
  );
};
