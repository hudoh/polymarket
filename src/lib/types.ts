export interface Market {
  id: string;
  question: string;
  description: string | null;
  outcomes: string[];
  close_date: string;
  resolved: boolean;
  winning_outcome: number | null;
  volume: number;
  liquidity: number;
  created_by: string;
  created_at: string;
}

export interface Position {
  id: string;
  user_id: string;
  market_id: string;
  outcome_index: number;
  shares: number;
  avg_price: number;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fake_balance: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'bet' | 'payout' | 'deposit' | 'initial';
  amount: number;
  market_id: string | null;
  shares: number | null;
  outcome_index: number | null;
  created_at: string;
}
