import { useIPFSMetadata } from '../hooks/useIPFSMetadata';
import { StartupData } from '../types';

interface StartupCardProps {
  index: number;
  startupData: StartupData | null;
  onClick: () => void;
}

export const StartupCard = ({ index, startupData, onClick }: StartupCardProps) => {
  const { data: metadata, isLoading: metadataLoading } = useIPFSMetadata(startupData?.ipfs_cid);

  if (!startupData) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  const isVotingActive = Math.floor(Date.now() / 1000) < startupData.voting_end_time;
  const totalVotes = startupData.yes_votes + startupData.no_votes;
  const yesPercentage = totalVotes > 0 ? (startupData.yes_votes / totalVotes) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-green-400 hover:shadow-lg transition-all text-left w-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-gray-400">#{index}</span>
            {metadataLoading ? (
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
            ) : metadata ? (
              <h4 className="text-lg font-bold text-gray-800 truncate">{metadata.project_name}</h4>
            ) : (
              <h4 className="text-lg font-bold text-gray-600 truncate">Loading...</h4>
            )}
          </div>
          {metadataLoading ? (
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : metadata ? (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{metadata.description}</p>
          ) : (
            <p className="text-sm text-gray-500 mb-3">Unable to load metadata</p>
          )}
        </div>
        <div className={`ml-4 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
          isVotingActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {isVotingActive ? '🟢 OPEN' : '🔴 CLOSED'}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span>👍</span>
            <span className="font-semibold text-green-600">{startupData.yes_votes}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>👎</span>
            <span className="font-semibold text-red-600">{startupData.no_votes}</span>
          </div>
        </div>
        <div className="text-gray-500">
          {yesPercentage.toFixed(0)}% Yes
        </div>
      </div>

      {startupData.approved && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="text-xs font-semibold text-green-600">✅ Approved by Admin</span>
        </div>
      )}
    </button>
  );
};
