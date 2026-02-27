export interface StartupData {
  url_or_hash: string;
  total_allocated: string;
  unlocked_balance: string;
  claimed_balance: string;
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
