-- Fix: transactions_type_check constraint was missing types from phases 1-4
-- Original constraint only had: reward, bid_escrow, bid_refund, penalty, bonus, registration
-- Missing: fee_burn, fee_treasury, fee_staker (phase 1), stake, unstake (phase 2),
--          referral_commission (phase 3), insurance_payout, settlement_*, dividend, token_*, subscription (phase 4)

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (
  type IN (
    'reward', 'bid_escrow', 'bid_refund', 'penalty', 'bonus', 'registration',
    'fee_burn', 'fee_treasury', 'fee_staker',
    'stake', 'unstake',
    'referral_commission',
    'insurance_payout', 'settlement_in', 'settlement_out',
    'dividend', 'token_buy', 'token_sell',
    'subscription'
  )
);
