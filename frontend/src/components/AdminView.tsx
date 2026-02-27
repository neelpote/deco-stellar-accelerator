import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as StellarSdk from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { CONTRACT_ID, NETWORK_PASSPHRASE } from '../config';
import { server, getStartupStatus } from '../stellar';

interface AdminViewProps {
  publicKey: string;
}

export const AdminView = ({ publicKey }: AdminViewProps) => {
  const [approveAddress, setApproveAddress] = useState('');
  const [reviewAddress, setReviewAddress] = useState('');

  // Fetch startup details for review
  const { data: reviewData } = useQuery({
    queryKey: ['reviewStartup', reviewAddress],
    queryFn: () => reviewAddress ? getStartupStatus(reviewAddress) : null,
    enabled: !!reviewAddress,
  });

  const approveApplicationMutation = useMutation({
    mutationFn: async (founder: string) => {
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
        throw new Error('Transaction failed');
      }
    },
    onSuccess: () => {
      setApproveAddress('');
      alert('🎉 Application approved successfully!');
    },
    onError: (error: unknown) => {
      console.error('Approval error:', error);
      alert('❌ Failed to approve application. Please try again.');
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
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold mb-2">👑 Admin Dashboard</h2>
            <p className="text-indigo-100 text-lg">
              Manage funding allocations, approve milestones, and oversee the accelerator
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
            <div className="text-sm text-indigo-100">Your Role</div>
            <div className="text-2xl font-bold">Administrator</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Review & Approve Application */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-8 border-2 border-green-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-3xl mr-3">✅</span>
            Review & Approve Application
          </h3>
          <p className="text-gray-600 mb-6">
            Review the application details and community votes before approving.
          </p>
          
          {/* Review Section */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Review Application
            </label>
            <p className="text-sm text-gray-500 mb-2">
              Enter founder's address to view application details
            </p>
            <div className="flex gap-4">
              <input
                type="text"
                value={reviewAddress}
                onChange={(e) => setReviewAddress(e.target.value)}
                className="flex-1 px-6 py-4 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              />
              <button
                type="button"
                onClick={() => setReviewAddress('')}
                className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Application Details */}
          {reviewData && (
            <div className="bg-white rounded-xl p-6 mb-6 space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Project Name</div>
                <div className="text-xl font-bold text-gray-800">{reviewData.project_name}</div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Description</div>
                <p className="text-gray-800">{reviewData.description}</p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Project URL</div>
                <a
                  href={reviewData.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                >
                  {reviewData.project_url} →
                </a>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Team</div>
                <p className="text-gray-800">{reviewData.team_info}</p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Funding Goal</div>
                <div className="text-2xl font-bold text-green-600">
                  {(Number(reviewData.funding_goal) / 1e7).toFixed(2)} USDC
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Community Votes</div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span>👍</span>
                    <span className="text-lg font-bold text-green-600">{reviewData.yes_votes}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👎</span>
                    <span className="text-lg font-bold text-red-600">{reviewData.no_votes}</span>
                  </div>
                  <div className="ml-auto text-sm text-gray-600">
                    {reviewData.yes_votes + reviewData.no_votes > 0
                      ? `${Math.round((reviewData.yes_votes / (reviewData.yes_votes + reviewData.no_votes)) * 100)}% approval`
                      : 'No votes yet'}
                  </div>
                </div>
              </div>
              {reviewData.approved && (
                <div className="pt-4 border-t border-gray-200">
                  <span className="text-sm font-semibold text-green-600">✅ Already Approved</span>
                </div>
              )}
            </div>
          )}

          {/* Approve Form */}
          <form onSubmit={handleApproveApplication}>
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Approve Founder's Address
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Enter the address to approve (or use the reviewed address above)
              </p>
              <input
                type="text"
                value={approveAddress}
                onChange={(e) => setApproveAddress(e.target.value)}
                className="w-full px-6 py-4 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={approveApplicationMutation.isPending}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                {approveApplicationMutation.isPending ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Approving...
                  </span>
                ) : (
                  '✅ Approve Application'
                )}
              </button>
              {reviewAddress && (
                <button
                  type="button"
                  onClick={() => setApproveAddress(reviewAddress)}
                  className="px-6 py-4 border-2 border-green-300 text-green-700 rounded-xl hover:bg-green-50 font-semibold"
                >
                  Use Reviewed Address
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6 border-2 border-blue-100">
            <span className="text-4xl mb-3 block">🗳️</span>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Community Driven</h4>
            <p className="text-gray-600 text-sm">
              Approve applications based on community votes and project quality
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-100">
            <span className="text-4xl mb-3 block">🔐</span>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Decentralized Funding</h4>
            <p className="text-gray-600 text-sm">
              VCs invest directly - no admin control over funding
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-100">
            <span className="text-4xl mb-3 block">📊</span>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Transparent Process</h4>
            <p className="text-gray-600 text-sm">
              All approvals are recorded on the blockchain
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
