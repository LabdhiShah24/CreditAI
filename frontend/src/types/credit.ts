export type RiskBandId =
'very-low' |
'low' |
'moderate' |
'elevated' |
'high' |
'very-high';

export interface RiskBand {
  id: RiskBandId;
  min: number;
  max: number;
  label: string;
  color: string;
  tint: string;
  text: string;
  border: string;
}

export interface RiskFactor {
  id: string;
  label: string;
  detail: string;
  /** Relative influence, 0–1. Direction is carried by `direction`. */
  influence: number;
  direction: 'higher' | 'lower';
}

export interface CreditProfileField {
  id: string;
  label: string;
  value: string;
  helper: string;
  icon: 'income' | 'loan' | 'emi' | 'employment' | 'term' | 'ratio';
  accent: 'mint' | 'ai' | 'amber' | 'lavender' | 'navy' | 'coral';
}

export interface AssessmentDetailField {
  label: string;
  value: string;
}

export interface Assessment {
  id: string;
  date: string;
  score: number;
  paymentRisk: number;
  loanAmount: string;
  details: AssessmentDetailField[];
  factors: RiskFactor[];
  limitedHistory: boolean;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  memberSince: string;
}

export interface ChatMessage {
  id: string;
  author: 'user' | 'assistant';
  text: string;
  usesAssessmentContext?: boolean;
}