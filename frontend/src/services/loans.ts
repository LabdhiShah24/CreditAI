import { fetchApi } from './api';
import {
  PlannerCalculateResponse,
  PlannerHandoffResponse,
  UserLoan,
  LoanPayment,
  LoanDetailResponse
} from '../types/loans';

export async function calculatePlanner(payload: any): Promise<PlannerCalculateResponse> {
  const res = await fetchApi('/loans/planner/calculate/', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return res;
}

export async function getPlannerHandoff(): Promise<PlannerHandoffResponse | null> {
  try {
    const res = await fetchApi('/loans/planner/handoff/', { method: 'GET' });
    return res;
  } catch (error: any) {
    // If it's a 404 handled inside fetchApi, it throws. Let's just catch and return null.
    return null;
  }
}

export async function getLoans(): Promise<UserLoan[]> {
  const data = await fetchApi('/loans/', { method: 'GET' });
  return data.loans;
}

export async function createLoan(payload: any): Promise<UserLoan> {
  const data = await fetchApi('/loans/', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return data.loan;
}

export async function getLoanDetail(id: number): Promise<LoanDetailResponse['loan']> {
  const data = await fetchApi(`/loans/${id}/`, { method: 'GET' });
  return data.loan;
}

export async function archiveLoan(id: number): Promise<void> {
  await fetchApi(`/loans/${id}/`, { method: 'DELETE' });
}

export async function getLoanSchedule(id: number): Promise<LoanPayment[]> {
  const data = await fetchApi(`/loans/${id}/schedule/`, { method: 'GET' });
  return data.schedule;
}

export async function markPaymentPaid(paymentId: number, payload: any): Promise<LoanPayment> {
  const data = await fetchApi(`/loans/payments/${paymentId}/pay/`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return data.payment;
}
