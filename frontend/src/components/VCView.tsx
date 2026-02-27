import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStartupStatus } from '../stellar';

interface VCViewProps {
  publicKey: string;
}

export const VCView = ({ publicKey: _publicKey }: VCViewProps) => {
  const [searchAddress, setSearchAddress] = useState('');
  const [viewingAddress, setViewingAddress] = useState<string | null>(null);

  const { data: startupData, isLoading } = useQuery({
    queryKey: ['vcViewStartup', viewingAddress],
    queryFn: () => viewingAddress ? getStartupStatus(viewingAddress) : null,
    enabled: !!viewingAddress,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress.trim()) {
      setViewingAddress(searchAddress);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold mb-2">💼 Venture Capitalist Dashboard</h2>
            <p className="text-purple-100 text-lg">
              Monitor and analyze startup investments on the blockchain
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
            <div className="text-sm text-purple-100">Your Role</div>
            <div className="text-2xl font-bold">VC Partner</div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-3xl mr-3">🔍</span>
          Search Startup Portfolio
        </h3>
        <p className="text-gray-600 mb-6">
          Enter a founder's Stellar address to view their funding status, milestones, and progress
        </p>
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
            View Portfolio
          </button>
        </form>
      </div>

      {/* Startup Details */}
      {viewingAddress && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading startup data...</p>
            </div>
          ) : startupData ? (
            <>
              {/* Project Info Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-8 border-2 border-blue-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <span className="text-3xl mr-3">🚀</span>
                  Project Information
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
                      {startupData.url_or_hash}
                    </a>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-gray-600 font-medium">Founder Address:</span>
                    <p className="text-gray-800 font-mono text-sm mt-1 break-all bg-gray-50 p-3 rounded-lg">
                      {viewingAddress}
                    </p>
                  </div>
                </div>
              </div>

              {/* Funding Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Allocated */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">💰</span>
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                      TOTAL
                    </span>
                  </div>
                  <div className="text-gray-600 text-sm font-medium mb-1">Total Allocated</div>
                  <div className="text-3xl font-bold text-gray-800">
                    {(Number(startupData.total_allocated) / 1e7).toFixed(2)}
                    <span className="text-lg text-gray-600 ml-2">USDC</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">Maximum funding approved</p>
                </div>

                {/* Unlocked */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6 border-2 border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">🔓</span>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                      UNLOCKED
                    </span>
                  </div>
                  <div className="text-gray-600 text-sm font-medium mb-1">Unlocked Balance</div>
                  <div className="text-3xl font-bold text-gray-800">
                    {(Number(startupData.unlocked_balance) / 1e7).toFixed(2)}
                    <span className="text-lg text-gray-600 ml-2">USDC</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">Available for claiming</p>
                </div>

                {/* Claimed */}
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
                  <p className="text-gray-500 text-xs mt-2">Funds withdrawn by founder</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <span className="text-2xl mr-3">📊</span>
                  Funding Progress
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Claimed Progress</span>
                      <span className="font-semibold">
                        {Number(startupData.total_allocated) > 0
                          ? ((Number(startupData.claimed_balance) / Number(startupData.total_allocated)) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 h-4 rounded-full transition-all duration-500"
                        style={{
                          width: `${Number(startupData.total_allocated) > 0
                            ? (Number(startupData.claimed_balance) / Number(startupData.total_allocated)) * 100
                            : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <div className="text-sm text-gray-600">Remaining to Unlock</div>
                      <div className="text-xl font-bold text-gray-800">
                        {((Number(startupData.total_allocated) - Number(startupData.unlocked_balance)) / 1e7).toFixed(2)} USDC
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Pending Claim</div>
                      <div className="text-xl font-bold text-gray-800">
                        {((Number(startupData.unlocked_balance) - Number(startupData.claimed_balance)) / 1e7).toFixed(2)} USDC
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6 border-2 border-blue-100">
            <span className="text-4xl mb-3 block">👀</span>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Monitor Investments</h4>
            <p className="text-gray-600 text-sm">
              Track real-time funding status and milestone progress for all portfolio companies
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-100">
            <span className="text-4xl mb-3 block">📈</span>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Transparent Data</h4>
            <p className="text-gray-600 text-sm">
              All funding data is stored on-chain, ensuring complete transparency and immutability
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-100">
            <span className="text-4xl mb-3 block">🔐</span>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Secure & Verified</h4>
            <p className="text-gray-600 text-sm">
              Smart contract-based milestone releases ensure funds are distributed as agreed
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
