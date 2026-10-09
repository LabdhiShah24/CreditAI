import React, { useState, useEffect } from 'react';
import { LandmarkIcon, CheckCircle2Icon, InfoIcon, AlertCircleIcon, Loader2Icon } from 'lucide-react';
import { calculatePlanner, getPlannerHandoff } from '../../services/loans';
import { PlannerCalculateResponse, PlannerHandoffResponse } from '../../types/loans';
import { formatINR, cx } from '../../utils/format';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface LoanPlannerProps {
  onSaveLoan: () => void;
}

export function LoanPlanner({ onSaveLoan }: LoanPlannerProps) {
  const [mode, setMode] = useState<'calc_emi' | 'calc_tenure'>('calc_emi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PlannerCalculateResponse | null>(null);

  const [formData, setFormData] = useState({
    principal: '',
    annualRate: '',
    tenureMonths: '',
    emi: '',
    processingFee: '',
    otherFees: '',
    monthlyIncome: '',
    firstPaymentDate: '',
  });

  const [handoffUsed, setHandoffUsed] = useState(false);

  const location = useLocation();
  const { user } = useAuth();
  const storageKey = user?.username ? `creditai_loan_planner_${user.username}` : null;

  useEffect(() => {
    const isHandoff = new URLSearchParams(location.search).get('handoff') === 'true';
    let restored = false;

    if (storageKey) {
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          
          if (isHandoff && parsed.locationKey !== location.key) {
            sessionStorage.removeItem(storageKey);
          } else if (parsed.formData && parsed.result) {
            setMode(parsed.mode || 'calc_emi');
            setFormData(parsed.formData);
            setResult(parsed.result);
            restored = true;
          }
        }
      } catch (e) {
        sessionStorage.removeItem(storageKey);
      }
    }

    if (isHandoff && !restored) {
      async function fetchHandoff() {
        try {
          const handoff = await getPlannerHandoff();
          if (handoff && handoff.loan_amount) {
            setFormData((prev) => ({
              ...prev,
              principal: handoff.loan_amount ? String(handoff.loan_amount) : prev.principal,
              emi: handoff.emi ? String(handoff.emi) : prev.emi,
              monthlyIncome: handoff.monthly_income ? String(handoff.monthly_income) : prev.monthlyIncome,
            }));
            setHandoffUsed(true);
          }
        } catch (err) {
          // Handoff is optional, suppress error
        }
      }
      fetchHandoff();
    }
  }, [location, storageKey]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setResult(null);
    if (storageKey) sessionStorage.removeItem(storageKey);
  };

  const handleModeChange = (newMode: 'calc_emi' | 'calc_tenure') => {
    setMode(newMode);
    setResult(null);
    if (storageKey) sessionStorage.removeItem(storageKey);
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const payload: any = {
        principal: parseFloat(formData.principal) || 0,
        annual_rate: parseFloat(formData.annualRate) || 0,
        processing_fee: parseFloat(formData.processingFee) || 0,
        other_fees: parseFloat(formData.otherFees) || 0,
        monthly_income: parseFloat(formData.monthlyIncome) || 0,
        first_payment_date: formData.firstPaymentDate,
      };

      if (mode === 'calc_emi') {
        payload.tenure_months = parseInt(formData.tenureMonths, 10) || 0;
      } else {
        payload.emi = parseFloat(formData.emi) || 0;
      }

      const res = await calculatePlanner(payload);
      setResult(res);
      if (storageKey) {
        sessionStorage.setItem(storageKey, JSON.stringify({
          mode,
          formData,
          result: res,
          locationKey: location.key
        }));
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during calculation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900">Plan Your Loan</h1>
        <p className="mt-3 text-lg text-navy-600">
          Understand your monthly payment, total repayment, interest cost, and repayment timeline before taking a loan.
        </p>
      </div>

      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm">
        <div className="border-b border-navy-100 bg-navy-50/50 p-6">
          <div className="flex rounded-lg bg-navy-100/50 p-1">
            <button
              type="button"
              onClick={() => handleModeChange('calc_emi')}
              className={cx(
                'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                mode === 'calc_emi' ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-600 hover:text-navy-900'
              )}
            >
              Calculate EMI from Tenure
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('calc_tenure')}
              className={cx(
                'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                mode === 'calc_tenure' ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-600 hover:text-navy-900'
              )}
            >
              Estimate Tenure from EMI
            </button>
          </div>
        </div>

        <form onSubmit={handleCalculate} className="space-y-6 p-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-navy-900">Loan Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="mt-2 block w-full rounded-xl border-navy-200 bg-white px-4 py-2.5 text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500 sm:text-sm"
                value={formData.principal}
                onChange={(e) => handleInputChange('principal', e.target.value)}
                placeholder="e.g. 500000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-900">Annual Interest Rate (%)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="mt-2 block w-full rounded-xl border-navy-200 bg-white px-4 py-2.5 text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500 sm:text-sm"
                value={formData.annualRate}
                onChange={(e) => handleInputChange('annualRate', e.target.value)}
                placeholder="e.g. 10.5"
              />
            </div>

            {mode === 'calc_emi' ? (
              <div>
                <label className="block text-sm font-semibold text-navy-900">Tenure (Months)</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="mt-2 block w-full rounded-xl border-navy-200 bg-white px-4 py-2.5 text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500 sm:text-sm"
                  value={formData.tenureMonths}
                  onChange={(e) => handleInputChange('tenureMonths', e.target.value)}
                  placeholder="e.g. 36"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-navy-900">Target EMI (₹)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  className="mt-2 block w-full rounded-xl border-navy-200 bg-white px-4 py-2.5 text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500 sm:text-sm"
                  value={formData.emi}
                  onChange={(e) => handleInputChange('emi', e.target.value)}
                  placeholder="e.g. 15000"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-navy-900">Monthly Income (₹) <span className="font-normal text-navy-500">(Optional)</span></label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="mt-2 block w-full rounded-xl border-navy-200 bg-white px-4 py-2.5 text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500 sm:text-sm"
                value={formData.monthlyIncome}
                onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                placeholder="e.g. 60000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy-900">Processing Fee (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="mt-2 block w-full rounded-xl border-navy-200 bg-white px-4 py-2.5 text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500 sm:text-sm"
                value={formData.processingFee}
                onChange={(e) => handleInputChange('processingFee', e.target.value)}
                placeholder="e.g. 5000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-900">Other Fees (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="mt-2 block w-full rounded-xl border-navy-200 bg-white px-4 py-2.5 text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500 sm:text-sm"
                value={formData.otherFees}
                onChange={(e) => handleInputChange('otherFees', e.target.value)}
                placeholder="e.g. 1000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-900">First Payment Date</label>
              <input
                type="date"
                required
                className="mt-2 block w-full rounded-xl border-navy-200 bg-white px-4 py-2.5 text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500 sm:text-sm"
                value={formData.firstPaymentDate}
                onChange={(e) => handleInputChange('firstPaymentDate', e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-800">
              <AlertCircleIcon size={20} className="shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 py-3.5 text-[1.05rem] font-semibold text-white shadow-md transition-all hover:bg-navy-800 focus:ring-4 focus:ring-navy-100 disabled:opacity-70"
            >
              {loading && <Loader2Icon size={20} className="animate-spin" />}
              Calculate Plan
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
          {/* Loan Snapshot */}
          <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm">
            <div className="border-b border-navy-100 bg-navy-50/50 px-6 py-4">
              <h3 className="text-lg font-bold text-navy-900">Loan Snapshot</h3>
            </div>
            <div className="grid grid-cols-2 gap-px bg-navy-100 sm:grid-cols-4">
              <div className="bg-white p-6">
                <p className="text-sm font-medium text-navy-500">Loan Amount</p>
                <p className="mt-2 text-2xl font-bold text-navy-900">{formatINR(result.principal)}</p>
              </div>
              <div className="bg-white p-6">
                <p className="text-sm font-medium text-navy-500">Monthly EMI</p>
                <p className="mt-2 text-2xl font-bold text-coral-600">{formatINR(result.emi)}</p>
              </div>
              <div className="bg-white p-6">
                <p className="text-sm font-medium text-navy-500">Estimated Tenure</p>
                <p className="mt-2 text-2xl font-bold text-navy-900">{result.tenure_months} months</p>
              </div>
              <div className="bg-white p-6">
                <p className="text-sm font-medium text-navy-500">Total Interest</p>
                <p className="mt-2 text-2xl font-bold text-navy-900">{formatINR(result.total_interest)}</p>
              </div>
            </div>
          </div>

          {/* Repayment Breakdown & Affordability */}
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-bold text-navy-900">Repayment Breakdown</h3>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-navy-50 pb-4">
                  <span className="text-navy-600">Total Principal</span>
                  <span className="font-semibold text-navy-900">{formatINR(result.principal)}</span>
                </div>
                <div className="flex justify-between border-b border-navy-50 pb-4">
                  <span className="text-navy-600">Total Interest</span>
                  <span className="font-semibold text-navy-900">{formatINR(result.total_interest)}</span>
                </div>
                <div className="flex justify-between border-b border-navy-50 pb-4">
                  <span className="text-navy-600">Processing Fees</span>
                  <span className="font-semibold text-navy-900">{formatINR(result.processing_fee)}</span>
                </div>
                <div className="flex justify-between border-b border-navy-50 pb-4">
                  <span className="text-navy-600">Other Fees</span>
                  <span className="font-semibold text-navy-900">{formatINR(result.other_fees)}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-lg font-bold text-navy-900">Total Cost</span>
                  <span className="text-lg font-bold text-coral-600">{formatINR(result.total_cost)}</span>
                </div>
              </div>
            </div>

            {result.affordability_info && (
              <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-lg font-bold text-navy-900">Repayment Snapshot</h3>
                <div className="flex items-start gap-4 rounded-xl bg-blue-50 p-4 text-blue-900">
                  <InfoIcon className="mt-0.5 shrink-0 text-blue-500" size={20} />
                  <div>
                    <p className="text-sm font-medium leading-relaxed">
                      Your proposed EMI would represent approximately{' '}
                      <span className="font-bold">{Math.round(result.affordability_info.payment_to_income_ratio * 100)}%</span>{' '}
                      of the monthly income you provided.
                    </p>
                    <p className="mt-2 text-xs text-blue-700/80">
                      This is an informational estimate based on the values you entered.
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between border-b border-navy-50 pb-4">
                    <span className="text-navy-600">Monthly Income</span>
                    <span className="font-semibold text-navy-900">{formatINR(result.affordability_info.monthly_income)}</span>
                  </div>
                  <div className="flex justify-between border-b border-navy-50 pb-4">
                    <span className="text-navy-600">Proposed EMI</span>
                    <span className="font-semibold text-navy-900">{formatINR(result.affordability_info.proposed_payment)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-medium text-navy-600">Estimated Income Remaining</span>
                    <span className="font-bold text-teal-600">{formatINR(result.affordability_info.income_remaining)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Amortization Schedule */}
          <div className="rounded-2xl border border-navy-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-navy-100 bg-navy-50/50 px-6 py-4">
              <h3 className="text-lg font-bold text-navy-900">Amortization Schedule</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-navy-600 whitespace-nowrap">
                <thead className="bg-white text-navy-900 border-b border-navy-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Payment #</th>
                    <th className="px-6 py-4 font-semibold">Due Date</th>
                    <th className="px-6 py-4 font-semibold text-right">Payment</th>
                    <th className="px-6 py-4 font-semibold text-right">Principal</th>
                    <th className="px-6 py-4 font-semibold text-right">Interest</th>
                    <th className="px-6 py-4 font-semibold text-right">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50">
                  {result.amortization_schedule.map((s) => (
                    <tr key={s.period} className="hover:bg-navy-50/50 transition-colors">
                      <td className="px-6 py-4">{s.period}</td>
                      <td className="px-6 py-4">{new Date(s.due_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right font-medium text-navy-900">{formatINR(s.payment)}</td>
                      <td className="px-6 py-4 text-right text-teal-700">{formatINR(s.principal)}</td>
                      <td className="px-6 py-4 text-right text-coral-700">{formatINR(s.interest)}</td>
                      <td className="px-6 py-4 text-right font-medium text-navy-900">{formatINR(s.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
