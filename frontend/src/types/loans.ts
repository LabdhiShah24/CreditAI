export interface AmortizationPeriod {
  period: number;
  due_date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface AffordabilityInfo {
  monthly_income: number;
  proposed_payment: number;
  payment_to_income_ratio: number;
  income_remaining: number;
}

export interface PlannerCalculateResponse {
  principal: number;
  emi: number;
  tenure_months: number;
  total_interest: number;
  total_repayment: number;
  processing_fee: number;
  other_fees: number;
  total_cost: number;
  affordability_info: AffordabilityInfo | null;
  amortization_schedule: AmortizationPeriod[];
}

export interface PlannerHandoffResponse {
  loan_amount: number | null;
  emi: number | null;
  monthly_income: number | null;
  goods_price: number | null;
  existing_debt_sum: number | null;
}

export interface UserLoan {
  id: number;
  name: string;
  original_principal: number;
  outstanding_principal: number;
  annual_interest_rate: number;
  interest_type: string;
  repayment_frequency: string;
  scheduled_payment_amount: number;
  start_date: string;
  first_payment_date: string;
  expected_payoff_date: string | null;
  processing_fee: number;
  other_fees: number;
  status: string;
  created_at: string;
  reminders?: LoanReminders;
}

export interface LoanPayment {
  id: number;
  loan_id: number;
  due_date: string;
  scheduled_payment: number;
  principal_component: number;
  interest_component: number;
  remaining_balance: number;
  status: string;
  actual_paid_date: string | null;
  actual_paid_amount: number | null;
}

export interface LoanReminders {
  status: 'UPCOMING' | 'DUE_TODAY' | 'OVERDUE' | 'NONE';
  days_until_due: number;
  days_overdue: number;
  amount_due: number;
  due_date: string | null;
  has_overdue: boolean;
  overdue_count: number;
}

export interface LoanDetailResponse {
  loan: UserLoan & { reminders?: LoanReminders };
}
