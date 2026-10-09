import React, { useState, useEffect } from 'react';
import { getLoans, createLoan, getLoanDetail, markPaymentPaid, archiveLoan, getLoanSchedule } from '../../services/loans';
import { UserLoan, LoanDetailResponse, LoanPayment } from '../../types/loans';
import { formatINR, cx } from '../../utils/format';
import { AlertCircleIcon, Loader2Icon, LandmarkIcon, ChevronRightIcon, ArrowLeftIcon, PlusCircleIcon, CheckCircle2Icon, CalendarIcon, ClockIcon } from 'lucide-react';

export function LoanTracker() {
  const [loans, setLoans] = useState<UserLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);

  useEffect(() => {
    if (view === 'list') {
      fetchLoans();
    }
  }, [view]);

  async function fetchLoans() {
    setLoading(true);
    setError('');
    try {
      const data = await getLoans();
      setLoans(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  }

  if (view === 'list') {
    return (
      <div className="space-y-8 pb-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-navy-900">My Loans</h1>
          <p className="mt-3 text-lg text-navy-600">
            Keep track of upcoming payments, repayment progress, and payment history.
          </p>
        </div>

        {error && (
          <div className="mx-auto max-w-2xl flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-800">
            <AlertCircleIcon size={20} className="shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-navy-900">Your Tracked Loans</h2>
            <button
              onClick={() => setView('create')}
              className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
            >
              <PlusCircleIcon size={18} />
              Add a Loan
            </button>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-navy-100 bg-white">
              <Loader2Icon size={24} className="animate-spin text-navy-300" />
            </div>
          ) : loans.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-200 bg-navy-50/50 py-16 text-center">
              <LandmarkIcon size={48} className="text-navy-300 mb-4" />
              <h3 className="text-lg font-bold text-navy-900">No loans tracked yet</h3>
              <p className="mt-2 text-navy-600">Track your loans to manage your repayments easily.</p>
              <button
                onClick={() => setView('create')}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-coral-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-coral-700"
              >
                Add a Loan
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {loans.map((loan) => (
                <div
                  key={loan.id}
                  onClick={() => {
                    setSelectedLoanId(loan.id);
                    setView('detail');
                  }}
                  className="group cursor-pointer rounded-2xl border border-navy-100 bg-white p-6 shadow-sm transition-all hover:border-navy-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-navy-900">{loan.name}</h3>
                        <span className={cx(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          loan.status === 'ACTIVE' ? "bg-teal-100 text-teal-800" :
                          loan.status === 'PAID_OFF' ? "bg-navy-100 text-navy-800" :
                          "bg-gray-100 text-gray-800"
                        )}>
                          {loan.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-navy-500">
                        {formatINR(loan.outstanding_principal)} left to pay at {loan.annual_interest_rate}%
                      </p>
                    </div>
                    <ChevronRightIcon className="text-navy-300 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="mt-6 flex flex-wrap gap-x-12 gap-y-4 border-t border-navy-50 pt-4">
                    {loan.status === 'ACTIVE' && loan.reminders && loan.reminders.status !== 'NONE' && loan.reminders.due_date ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-navy-500">Next Payment</span>
                        <span className="mt-0.5 text-lg font-bold text-navy-900">{formatINR(loan.reminders.amount_due)}</span>
                        <span className="mt-0.5 text-sm font-medium text-navy-600">
                          Due {new Date(loan.reminders.due_date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        {loan.reminders.status === 'UPCOMING' && loan.reminders.days_until_due <= 5 && loan.reminders.days_until_due > 0 && (
                          <span className="mt-1.5 inline-flex w-fit items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                            Due {loan.reminders.days_until_due === 1 ? 'tomorrow' : `in ${loan.reminders.days_until_due} days`}
                          </span>
                        )}
                        {loan.reminders.status === 'DUE_TODAY' && (
                          <span className="mt-1.5 inline-flex w-fit items-center rounded-md bg-coral-100 px-2 py-0.5 text-xs font-semibold text-coral-800">
                            Due today
                          </span>
                        )}
                        {loan.reminders.status === 'OVERDUE' && (
                          <span className="mt-1.5 inline-flex w-fit items-center rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                            Overdue by {loan.reminders.days_overdue} day{loan.reminders.days_overdue === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-navy-500">Scheduled EMI</span>
                        <span className="mt-0.5 text-lg font-bold text-navy-900">{formatINR(loan.scheduled_payment_amount)}</span>
                      </div>
                    )}
                    
                    {loan.expected_payoff_date && (
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-navy-500">Expected Payoff</span>
                        <span className="mt-0.5 text-sm font-semibold text-navy-900">
                          {new Date(loan.expected_payoff_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'create') {
    return <LoanCreate onBack={() => setView('list')} onCreated={() => setView('list')} />;
  }

  if (view === 'detail' && selectedLoanId) {
    return <LoanDetail id={selectedLoanId} onBack={() => setView('list')} />;
  }

  return null;
}

function LoanCreate({ onBack, onCreated }: { onBack: () => void, onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    original_principal: '',
    annual_interest_rate: '',
    scheduled_payment_amount: '',
    tenure_months: '',
    start_date: '',
    first_payment_date: '',
    processing_fee: '0',
    other_fees: '0',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createLoan(formData);
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create loan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-navy-600 hover:text-navy-900">
        <ArrowLeftIcon size={16} /> Back to Loans
      </button>
      
      <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm">
        <div className="border-b border-navy-100 bg-navy-50/50 px-6 py-4">
          <h2 className="text-lg font-bold text-navy-900">Track a New Loan</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-800">
              <AlertCircleIcon size={20} className="shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-navy-900">Loan Name</label>
              <input type="text" required className="mt-2 block w-full rounded-xl border-navy-200 bg-white px-4 py-2.5 text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500 sm:text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Home Loan" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-navy-900">Loan Amount (₹)</label>
              <input type="number" min="1" step="0.01" required className="mt-2 block w-full rounded-xl border-navy-200 bg-white px-4 py-2.5 text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500 sm:text-sm" value={formData.original_principal} onChange={e => setFormData({...formData, original_principal: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-900">Annual Interest Rate (%)</label>
              <input type="number" min="0" step="0.01" required className="mt-2 block w-full rounded-xl border-navy-200 bg-white px-4 py-2.5 text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500 sm:text-sm" value={formData.annual_interest_rate} onChange={e => setFormData({...formData, annual_interest_rate: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-navy-900">EMI Amount (₹)</label>
              <input type="number" min="1" step="0.01" required className="mt-2 block w-full rounded-xl border-navy-200 bg-white px-4 py-2.5 text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500 sm:text-sm" value={formData.scheduled_payment_amount} onChange={e => setFormData({...formData, scheduled_payment_amount: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-900">Tenure (Months)</label>
              <input type="number" min="1" required className="mt-2 block w-full rounded-xl border-navy-200 bg-white px-4 py-2.5 text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500 sm:text-sm" value={formData.tenure_months} onChange={e => setFormData({...formData, tenure_months: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-navy-900">Start Date</label>
              <input type="date" required className="mt-2 block w-full rounded-xl border-navy-200 bg-white px-4 py-2.5 text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500 sm:text-sm" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-900">First Payment Date</label>
              <input type="date" required className="mt-2 block w-full rounded-xl border-navy-200 bg-white px-4 py-2.5 text-navy-900 shadow-sm focus:border-coral-500 focus:ring-coral-500 sm:text-sm" value={formData.first_payment_date} onChange={e => setFormData({...formData, first_payment_date: e.target.value})} />
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 py-3.5 text-lg font-semibold text-white transition hover:bg-navy-800 disabled:opacity-70">
            {loading && <Loader2Icon size={20} className="animate-spin" />}
            Save Tracked Loan
          </button>
        </form>
      </div>
    </div>
  );
}

function LoanDetail({ id, onBack }: { id: number, onBack: () => void }) {
  const [data, setData] = useState<LoanDetailResponse['loan'] | null>(null);
  const [schedule, setSchedule] = useState<LoanPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [payingId, setPayingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [detailRes, schedRes] = await Promise.all([
        getLoanDetail(id),
        getLoanSchedule(id)
      ]);
      setData(detailRes);
      setSchedule(schedRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handlePay = async (paymentId: number) => {
    if (!window.confirm("Mark this scheduled payment as Paid?")) return;
    setPayingId(paymentId);
    try {
      await markPaymentPaid(paymentId, {});
      await fetchData(); // Refresh all state
    } catch (err: any) {
      alert(err.message || 'Failed to mark as paid');
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2Icon className="animate-spin text-navy-300" size={32} /></div>;
  }
  if (error || !data) {
    return <div className="text-red-600">{error}</div>;
  }

  const { reminders } = data;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-navy-600 hover:text-navy-900">
        <ArrowLeftIcon size={16} /> Back to Loans
      </button>
      
      <div>
        <h1 className="text-3xl font-bold text-navy-900">{data.name}</h1>
        <p className="mt-1 text-navy-600">Track your repayment progress</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-bold text-navy-900">Loan Overview</h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-sm font-medium text-navy-500">Outstanding Balance</p>
                <p className="mt-1 text-2xl font-bold text-navy-900">{formatINR(data.outstanding_principal)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-navy-500">Original Amount</p>
                <p className="mt-1 text-xl font-bold text-navy-700">{formatINR(data.original_principal)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-navy-500">Interest Rate</p>
                <p className="mt-1 text-lg font-semibold text-navy-900">{data.annual_interest_rate}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-navy-500">Scheduled EMI</p>
                <p className="mt-1 text-lg font-semibold text-navy-900">{formatINR(data.scheduled_payment_amount)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {reminders?.has_overdue && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <div className="flex items-center gap-3 text-red-700 mb-2">
                <AlertCircleIcon size={24} />
                <h3 className="text-lg font-bold">Overdue Payments</h3>
              </div>
              <p className="text-red-800 font-medium">{reminders.overdue_count} payment(s) are overdue.</p>
            </div>
          )}
          
          <div className={cx(
            "rounded-2xl border p-6 shadow-sm",
            reminders?.status === 'OVERDUE' ? "border-red-200 bg-red-50" :
            reminders?.status === 'DUE_TODAY' ? "border-coral-200 bg-coral-50" :
            reminders?.status === 'UPCOMING' ? "border-amber-200 bg-amber-50" :
            "border-navy-100 bg-white"
          )}>
            <div className="flex items-center gap-3 mb-4">
              {reminders?.status === 'OVERDUE' ? (
                <AlertCircleIcon size={20} className="text-red-600" />
              ) : reminders?.status === 'DUE_TODAY' ? (
                <CalendarIcon size={20} className="text-coral-600" />
              ) : reminders?.status === 'UPCOMING' ? (
                <ClockIcon size={20} className="text-amber-600" />
              ) : (
                <CheckCircle2Icon size={20} className="text-teal-600" />
              )}
              <h3 className="text-lg font-bold text-navy-900">
                {reminders?.status === 'OVERDUE' ? 'Payment overdue' :
                 reminders?.status === 'DUE_TODAY' ? 'Payment due today' :
                 reminders?.status === 'UPCOMING' && reminders.days_until_due === 1 ? 'Payment due tomorrow' :
                 reminders?.status === 'UPCOMING' ? 'Upcoming payment' :
                 'Payment Status'}
              </h3>
            </div>
            
            {reminders?.status && reminders.status !== 'NONE' ? (
              <>
                <p className={cx("mt-1 text-xl font-bold", 
                  reminders.status === 'OVERDUE' ? "text-red-700" : 
                  reminders.status === 'DUE_TODAY' ? "text-coral-700" : 
                  "text-navy-900"
                )}>
                  {formatINR(reminders.amount_due)}{' '}
                  {reminders.status === 'OVERDUE' ? `was due ${reminders.days_overdue} day${reminders.days_overdue === 1 ? '' : 's'} ago` :
                   reminders.status === 'DUE_TODAY' ? 'is due today' :
                   reminders.days_until_due === 1 ? 'due tomorrow' :
                   `due in ${reminders.days_until_due} days`}
                </p>
                <p className="mt-2 text-sm font-medium text-navy-600">
                  Scheduled for {new Date(reminders.due_date!).toLocaleDateString()}
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2 text-teal-700">
                <span className="font-semibold">All caught up! No upcoming payments.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-navy-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-navy-100 bg-navy-50/50 px-6 py-4">
          <h3 className="text-lg font-bold text-navy-900">Payment Schedule & History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-navy-600 whitespace-nowrap">
            <thead className="bg-white text-navy-900 border-b border-navy-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Due Date</th>
                <th className="px-6 py-4 font-semibold text-right">Payment</th>
                <th className="px-6 py-4 font-semibold text-right">Principal</th>
                <th className="px-6 py-4 font-semibold text-right">Interest</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {schedule.map((s) => (
                <tr key={s.id} className="hover:bg-navy-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-navy-900">{new Date(s.due_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right font-medium text-navy-900">{formatINR(s.scheduled_payment)}</td>
                  <td className="px-6 py-4 text-right text-teal-700">{formatINR(s.principal_component)}</td>
                  <td className="px-6 py-4 text-right text-coral-700">{formatINR(s.interest_component)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={cx(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      s.status === 'PAID' ? "bg-teal-100 text-teal-800" :
                      s.status === 'OVERDUE' ? "bg-red-100 text-red-800" :
                      "bg-navy-100 text-navy-800"
                    )}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {s.status !== 'PAID' && (
                      <button
                        onClick={() => handlePay(s.id)}
                        disabled={payingId === s.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
                      >
                        {payingId === s.id ? <Loader2Icon size={14} className="animate-spin" /> : <CheckCircle2Icon size={14} />}
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
