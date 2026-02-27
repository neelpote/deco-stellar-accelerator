export interface StartupData {
  url_or_hash: string;
  total_allocated: string;
  unlocked_balance: string;
  claimed_balance: string;
  voting_end_time: number;
  yes_votes: number;
  no_votes: number;
  approved: boolean;
}

export interface VCRequest {
  vc_address: string;
  company_name: string;
  approved: boolean;
}

export interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
}
