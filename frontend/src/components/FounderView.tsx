import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as StellarSdk from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { CONTRACT_ID, NETWORK_PASSPHRASE } from '../config';
import { server } from '../stellar';
import { useStartupStatus } from '../hooks/useStartupStatus';

interface FounderViewProps {
  publicKey: string;
}

export const FounderView = ({ publicKey }: FounderViewProps) => {
  const [projectUrl, setProjectUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [requestingVC, setRequestingVC] = useState(false);
  const queryClient = useQueryClient();
  const { data: startupData, isLoading } = useStartupStatus(publicKey);

  const applyMutation = useMutation({
    mutationFn: async (url: string) => {
      const sourceAccount = await server.getAccount(publicKey);
      const contract = new StellarSdk.Contract(CONTRACT_ID);

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'apply',
            StellarSdk.Address.fromString(publicKey).toScVal(),
            StellarSdk.nativeToScVal(url, { type: 'string' })
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
      setProjectUrl('');
      alert('🎉 Application submitted successfully!');
    },
    onError: (error) => {
      console.error('Application error:', error);
      alert('❌ Failed to submit application. Please try again.');
    },
  });

  const vcRequestMutation = useMutation({
    mutationFn: async (name: string) => {
      const sourceAccount = await server.getAccount(publicKey);
      const contract = new StellarSdk.Contract(CONTRACT_ID);

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'request_vc',
            StellarSdk.Address.fromString(publicKey).toScVal(),
            StellarSdk.nativeToScVal(name, { type: 'string' })
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
      setRequestingVC(false);
      setCompanyName('');
      alert('🎉 VC request submitted! Waiting for admin approval.');
    },
    onError: (error) => {
      console.error('VC request error:', error);
      alert('❌ Failed to submit VC request. Please try again.');
    },
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const sourceAccount = await server.getAccount(publicKey);
      const contract = new StellarSdk.Contract(CONTRACT_ID);

      const usdcAddress = new StellarSdk.Address(
        StellarSdk.Asset.native().contractId(NETWORK_PASSPHRASE)
      );

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'claim_funds',
            StellarSdk.Address.fromString(publicKey).toScVal(),
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
      queryClient.invalidateQueries({ queryKey: ['startupStatus'] });
      alert('🎉 Funds claimed successfully!');
    },
    onError: (error) => {
      console.error('Claim error:', error);
      alert('❌ Failed to claim funds. Please try again.');
    },
  });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectUrl.trim()) {
      alert('Please enter a project URL');
      return;
    }
    applyMutation.mutate(projectUrl);
  };

  const handleVCRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      alert('Please enter your company name');
      return;
    }
    vcRequestMutation.mutate(companyName);
  };

  const handleClaim = () => {
    claimMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
        <h2 className="text-4xl font-bold mb-2">🚀 Founder Dashboard</h2>
        <p className="text-blue-100 text-lg">
          Apply for funding, track milestones, and claim your allocated funds
        </p>
      </div>

      {!startupData ? (
        <div className="space-y-6">
          {/* Application Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-3xl mr-3">📝</span>
              Apply to DeCo Accelerator
            </h3>
            <p className="text-gray-600 mb-6">
              Submit your startup for funding consideration. Share your project details and get access to milestone-based funding.
            </p>
            <form onSubmit={handleApply}>
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-3 text-lg">
                  Project URL
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Link to your GitHub repository, pitch deck, or project website
                </p>
                <input
                  type="text"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="https://github.com/yourproject or https://yourproject.com"
                />
              </div>
              <button
                type="submit"
                disabled={applyMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                {applyMutation.isPending ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting Application...
                  </span>
                ) : (
                  '🚀 Submit Application'
                )}
              </button>
            </form>
          </div>

          {/* VC Request Section */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-8 border-2 border-purple-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-3xl mr-3">💼</span>
              Become a Venture Capitalist
            </h3>
            <p className="text-gray-600 mb-6">
              Are you an investor? Request VC access to monitor and analyze startup portfolios on the platform.
            </p>
            {!requestingVC ? (
              <button
                onClick={() => setRequestingVC(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                💼 Request VC Access
              </button>
            ) : (
              <form onSubmit={handleVCRequest}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Company/Fund Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-6 py-4 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Your VC firm or investment company name"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={vcRequestMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 font-semibold"
                  >
                    {vcRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestingVC(false)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6 border-2 border-blue-100">
              <span className="text-4xl mb-3 block">⚡</span>
              <h4 className="text-lg font-bold text-gray-800 mb-2">Fast Application</h4>
              <p className="text-gray-600 text-sm">
                Submit your application in seconds using blockchain technology
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-100">
              <span className="text-4xl mb-3 block">🎯</span>
              <h4 className="text-lg font-bold text-gray-800 mb-2">Milestone-Based</h4>
              <p className="text-gray-600 text-sm">
                Receive funding progressively as you hit your milestones
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-100">
              <span className="text-4xl mb-3 block">🔐</span>
              <h4 className="text-lg font-bold text-gray-800 mb-2">Transparent & Secure</h4>
              <p className="text-gray-600 text-sm">
                All transactions are recorded on the Stellar blockchain
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Overview */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-8 border-2 border-green-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-3xl mr-3">✅</span>
              Application Status: Approved
            </h3>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Project URL:</span>
                <a
                  href={startupData.url_or_hash}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                >
                  View Project →
                </a>
              </div>
            </div>
          </div>

          {/* Funding Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6 border-2 border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">💰</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                  ALLOCATED
                </span>
              </div>
              <div className="text-gray-600 text-sm font-medium mb-1">Total Allocated</div>
              <div className="text-3xl font-bold text-gray-800">
                {(Number(startupData.total_allocated) / 1e7).toFixed(2)}
                <span className="text-lg text-gray-600 ml-2">USDC</span>
              </div>
              <p className="text-gray-500 text-xs mt-2">Your total funding pool</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">🔓</span>
                <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                  UNLOCKED
                </span>
              </div>
              <div className="text-gray-600 text-sm font-medium mb-1">Unlocked for Claiming</div>
              <div className="text-3xl font-bold text-green-600">
                {(Number(startupData.unlocked_balance) / 1e7).toFixed(2)}
                <span className="text-lg text-gray-600 ml-2">USDC</span>
              </div>
              <p className="text-gray-500 text-xs mt-2">Ready to withdraw</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">✅</span>
                <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">
                  CLAIMED
                </span>
              </div>
              <div className="text-gray-600 text-sm font-medium mb-1">Already Claimed</div>
              <div className="text-3xl font-bold text-gray-800">
                {(Number(startupData.claimed_balance) / 1e7).toFixed(2)}
                <span className="text-lg text-gray-600 ml-2">USDC</span>
              </div>
              <p className="text-gray-500 text-xs mt-2">Funds in your wallet</p>
            </div>
          </div>

          {/* Claim Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-3xl mr-3">💸</span>
              Claim Your Funds
            </h3>
            <p className="text-gray-600 mb-6">
              Withdraw your unlocked funds to your wallet. Funds are released as you complete milestones.
            </p>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border-2 border-green-100">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Available to Claim</div>
                  <div className="text-3xl font-bold text-green-600">
                    {(
                      (Number(startupData.unlocked_balance) -
                        Number(startupData.claimed_balance)) /
                      1e7
                    ).toFixed(2)}{' '}
                    USDC
                  </div>
                </div>
                <span className="text-5xl">💵</span>
              </div>
            </div>
            <button
              onClick={handleClaim}
              disabled={
                claimMutation.isPending ||
                Number(startupData.unlocked_balance) <=
                  Number(startupData.claimed_balance)
              }
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              {claimMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Claim...
                </span>
              ) : Number(startupData.unlocked_balance) <= Number(startupData.claimed_balance) ? (
                '⏳ No Funds Available to Claim'
              ) : (
                '💸 Claim Funds Now'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
