export interface StartupData {
  project_name: string;
  description: string;
  project_url: string;
  team_info: string;
  funding_goal: string;
  total_allocated: string;
  unlocked_balance: string;
  claimed_balance: string;
  voting_end_time: number;
  yes_votes: number;
  no_votes: number;
  approved: boolean;
}

export interface VCData {
  vc_address: string;
  company_name: string;
  stake_amount: string;
  total_invested: string;
}

export interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
}
