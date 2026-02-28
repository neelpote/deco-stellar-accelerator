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
      <div className="cyber-card p-6 animate-pulse">
        <div className="h-6 bg-cyber-surface rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-cyber-surface rounded w-full mb-2"></div>
        <div className="h-4 bg-cyber-surface rounded w-2/3"></div>
      </div>
    );
  }

  const isVotingActive = Math.floor(Date.now() / 1000) < Number(startupData.voting_end_time);
  const totalVotes = Number(startupData.yes_votes) + Number(startupData.no_votes);
  const yesPercentage = totalVotes > 0 ? (Number(startupData.yes_votes) / totalVotes) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className="cyber-card p-6 hover-glow hover-lift text-left w-full transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-cyber-text-dim">#{index}</span>
            {metadataLoading ? (
              <div className="h-5 bg-cyber-surface rounded w-32 animate-pulse"></div>
            ) : metadata ? (
              <h4 className="text-lg font-bold text-cyber-primary truncate">{metadata.project_name}</h4>
            ) : (
              <h4 className="text-lg font-bold text-cyber-text-dim truncate">Loading...</h4>
            )}
          </div>
          {metadataLoading ? (
            <div className="space-y-2">
              <div className="h-3 bg-cyber-surface rounded w-full"></div>
              <div className="h-3 bg-cyber-surface rounded w-3/4"></div>
            </div>
          ) : metadata ? (
            <p className="text-sm text-cyber-text-dim line-clamp-2 mb-3">{metadata.description}</p>
          ) : (
            <p className="text-sm text-cyber-text-dim mb-3">Unable to load metadata</p>
          )}
        </div>
        <div className={`ml-4 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap uppercase tracking-wider ${
          isVotingActive ? 'bg-cyber-accent/20 text-cyber-accent border border-cyber-accent' : 'bg-cyber-secondary/20 text-cyber-secondary border border-cyber-secondary'
        }`}>
          {isVotingActive ? '🟢 OPEN' : '🔴 CLOSED'}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="neon-green">👍</span>
            <span className="font-semibold neon-green">{Number(startupData.yes_votes)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="neon-pink">👎</span>
            <span className="font-semibold neon-pink">{Number(startupData.no_votes)}</span>
          </div>
        </div>
        <div className="text-cyber-text-dim">
          {yesPercentage.toFixed(0)}% Yes
        </div>
      </div>

      {startupData.approved && (
        <div className="mt-3 pt-3 border-t border-cyber-border">
          <span className="text-xs font-semibold neon-green">✅ Approved by Admin</span>
        </div>
      )}
    </button>
  );
};
