import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import * as StellarSdk from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { CONTRACT_ID, NETWORK_PASSPHRASE } from '../config';
import { server, getStartupStatus } from '../stellar';

interface AdminViewProps {
  publicKey: string;
}

export const AdminView = ({ publicKey }: AdminViewProps) => {
  const [founderAddress, setFounderAddress] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [unlockAmount, setUnlockAmount] = useState('');
  const [vcAddress, setVcAddress] = useState('');
  const [approveAddress, setApproveAddress] = useState('');
  const [reviewAddress, setReviewAddress] = useState('');
  const queryClient = useQueryClient();

  // Fetch startup details for review
  const { data: reviewData } = useQuery({
    queryKey: ['reviewStartup', reviewAddress],
    queryFn: () => reviewAddress ? getStartupStatus(reviewAddress) : null,
    enabled: !!reviewAddress,
  });

  const fundMutation = useMutation({
    mutationFn: async ({ founder, amount }: { founder: string; amount: string }) => {
      const sourceAccount = await server.getAccount(publicKey);
      const contract = new StellarSdk.Contract(CONTRACT_ID);

      const amountInStroops = Math.floor(parseFloat(amount) * 1e7).toString();

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'fund_startup',
            StellarSdk.Address.fromString(publicKey).toScVal(),
            StellarSdk.Address.fromString(founder).toScVal(),
            StellarSdk.nativeToScVal(amountInStroops, { type: 'i128' })
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
      queryClient.invalidateQueries({ queryKey: ['startupStatus'] });
      setFounderAddress('');
      setFundAmount('');
      alert('🎉 Funding allocated successfully!');
    },
    onError: (error) => {
      console.error('Funding error:', error);
      alert('❌ Failed to allocate funding. Please try again.');
    },
  });

  const unlockMutation = useMutation({
    mutationFn: async ({ founder, amount }: { founder: string; amount: string }) => {
      const sourceAccount = await server.getAccount(publicKey);
      const contract = new StellarSdk.Contract(CONTRACT_ID);

      const amountInStroops = Math.floor(parseFloat(amount) * 1e7).toString();

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'unlock_milestone',
            StellarSdk.Address.fromString(publicKey).toScVal(),
            StellarSdk.Address.fromString(founder).toScVal(),
            StellarSdk.nativeToScVal(amountInStroops, { type: 'i128' })
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
      queryClient.invalidateQueries({ queryKey: ['startupStatus'] });
      setFounderAddress('');
      setUnlockAmount('');
      alert('🎉 Milestone unlocked successfully!');
    },
    onError: (error) => {
      console.error('Unlock error:', error);
      alert('❌ Failed to unlock milestone. Please try again.');
    },
  });

  const approveVCMutation = useMutation({
    mutationFn: async (vc: string) => {
      const sourceAccount = await server.getAccount(publicKey);
      const contract = new StellarSdk.Contract(CONTRACT_ID);

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'approve_vc',
            StellarSdk.Address.fromString(publicKey).toScVal(),
            StellarSdk.Address.fromString(vc).toScVal()
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
      setVcAddress('');
      alert('🎉 VC approved successfully!');
    },
    onError: (error) => {
      console.error('VC approval error:', error);
      alert('❌ Failed to approve VC. Please try again.');
    },
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
    onError: (error) => {
      console.error('Approval error:', error);
      alert('❌ Failed to approve application. Please try again.');
    },
  });

  const handleFund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!founderAddress.trim() || !fundAmount.trim()) {
      alert('Please fill in all fields');
      return;
    }
    fundMutation.mutate({ founder: founderAddress, amount: fundAmount });
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!founderAddress.trim() || !unlockAmount.trim()) {
      alert('Please fill in all fields');
      return;
    }
    unlockMutation.mutate({ founder: founderAddress, amount: unlockAmount });
  };

  const handleApproveVC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vcAddress.trim()) {
      alert('Please enter VC address');
      return;
    }
    approveVCMutation.mutate(vcAddress);
  };

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

        {/* Allocate Funding */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-3xl mr-3">💰</span>
            Allocate Funding
          </h3>
          <p className="text-gray-600 mb-6">
            Set the total USDC funding pool for a startup. This is the maximum amount they can receive through milestone unlocks.
          </p>
          <form onSubmit={handleFund}>
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Founder's Stellar Address
              </label>
              <p className="text-sm text-gray-500 mb-2">
                The public key of the founder who submitted the application
              </p>
              <input
                type="text"
                value={founderAddress}
                onChange={(e) => setFounderAddress(e.target.value)}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Total Funding Amount (USDC)
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Total amount to allocate across all milestones (e.g., 10000 for $10,000)
              </p>
              <input
                type="number"
                step="0.01"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="10000.00"
              />
            </div>
            <button
              type="submit"
              disabled={fundMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              {fundMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Allocating Funding...
                </span>
              ) : (
                '💰 Allocate Funding'
              )}
            </button>
          </form>
        </div>

        {/* Unlock Milestone */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-3xl mr-3">🔓</span>
            Unlock Milestone
          </h3>
          <p className="text-gray-600 mb-6">
            Release funds for a completed milestone. The founder can then claim these unlocked funds.
          </p>
          <form onSubmit={handleUnlock}>
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Founder's Stellar Address
              </label>
              <p className="text-sm text-gray-500 mb-2">
                The same address used when allocating funding
              </p>
              <input
                type="text"
                value={founderAddress}
                onChange={(e) => setFounderAddress(e.target.value)}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Amount to Unlock (USDC)
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Amount to release for this milestone (e.g., 2500 for $2,500)
              </p>
              <input
                type="number"
                step="0.01"
                value={unlockAmount}
                onChange={(e) => setUnlockAmount(e.target.value)}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                placeholder="2500.00"
              />
            </div>
            <button
              type="submit"
              disabled={unlockMutation.isPending}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              {unlockMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Unlocking Milestone...
                </span>
              ) : (
                '🔓 Unlock Milestone'
              )}
            </button>
          </form>
        </div>

        {/* Approve VC */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-8 border-2 border-purple-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-3xl mr-3">💼</span>
            Approve Venture Capitalist
          </h3>
          <p className="text-gray-600 mb-6">
            Grant VC access to users who have requested it. VCs can monitor and analyze startup portfolios.
          </p>
          <form onSubmit={handleApproveVC}>
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                VC's Stellar Address
              </label>
              <p className="text-sm text-gray-500 mb-2">
                The address of the user requesting VC access
              </p>
              <input
                type="text"
                value={vcAddress}
                onChange={(e) => setVcAddress(e.target.value)}
                className="w-full px-6 py-4 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              />
            </div>
            <button
              type="submit"
              disabled={approveVCMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              {approveVCMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Approving VC...
                </span>
              ) : (
                '💼 Approve VC Access'
              )}
            </button>
          </form>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6 border-2 border-blue-100">
            <span className="text-4xl mb-3 block">⚡</span>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Instant Execution</h4>
            <p className="text-gray-600 text-sm">
              All actions are executed immediately on the blockchain
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-100">
            <span className="text-4xl mb-3 block">🔐</span>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Secure & Transparent</h4>
            <p className="text-gray-600 text-sm">
              All transactions are recorded on the Stellar blockchain
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-100">
            <span className="text-4xl mb-3 block">📊</span>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Full Control</h4>
            <p className="text-gray-600 text-sm">
              Manage funding allocations and milestone approvals with ease
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
