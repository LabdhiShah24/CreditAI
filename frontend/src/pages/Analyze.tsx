import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BriefcaseIcon, SparklesIcon, UserIcon } from 'lucide-react';
import { AppShell, PageHeader } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SelectField, TextField } from '../components/ui/Field';
import { ScoreDisclaimer } from '../components/credit/Disclosures';

function FormSection({
  title,
  description,
  icon: Icon,
  children





}: {title: string;description: string;icon: typeof UserIcon;children: React.ReactNode;}) {
  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy-700"
          aria-hidden="true">
          
          <Icon size={19} />
        </span>
        <div>
          <h2 className="font-display text-[1.3rem] font-bold text-navy-900">
            {title}
          </h2>
          <p className="mt-1 text-[1rem] leading-snug text-navy-500">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">{children}</div>
    </Card>);

}

import { fetchApi } from '../services/api';

export function Analyze() {
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnalyzing(true);
    setError(null);
    
    const formData = new FormData(event.currentTarget);
    const data = {
      age_years: Number(formData.get('age')),
      education_level: formData.get('education'),
      family_member_count: Number(formData.get('family')),
      employment_years: Number(formData.get('employmentLength')),
      income_type: formData.get('incomeType'),
      income_monthly: Number(formData.get('income')),
      loan_credit_amount: Number(formData.get('loanAmount')),
      loan_annuity_emi: Number(formData.get('emi')),
      goods_price: Number(formData.get('goodsPrice')),
      bureau_total_loans_count: Number(formData.get('bureau_total_loans_count')),
      bureau_active_loans_count: Number(formData.get('bureau_active_loans_count')),
      bureau_total_debt_sum: Number(formData.get('bureau_total_debt_sum')),
      bureau_total_credit_limit: Number(formData.get('bureau_total_credit_limit')),
      bureau_credit_history_length_years: Number(formData.get('bureau_credit_history_length_years')),
      prev_app_refused_count: Number(formData.get('prev_app_refused_count'))
    };

    if (data.bureau_active_loans_count > data.bureau_total_loans_count) {
      setError('Active accounts cannot exceed total credit accounts.');
      setAnalyzing(false);
      return;
    }
    
    if (data.bureau_total_debt_sum > 0 && data.bureau_total_credit_limit === 0) {
      setError('Credit limit must be greater than 0 if you have outstanding debt.');
      setAnalyzing(false);
      return;
    }

    try {
      await fetchApi('/assessments/', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      navigate('/result');
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
      setAnalyzing(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Check Your Credit Health"
        subtitle="Enter your financial information and let CreditAI assess your profile." />
      

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormSection
          title="Personal Details"
          description="Basic information about you and your household."
          icon={UserIcon}>
          
          <TextField
            id="age"
            label="Age"
            type="number"
            min={18}
            max={100}
            placeholder="e.g. 35"
            suffix="years"
            required />
          
          <SelectField
            id="education"
            label="Education Level"
            placeholder="Select education level"
            required
            options={[
              'Secondary / secondary special',
              'Higher education',
              'Incomplete higher',
              'Lower secondary',
              'Academic degree'
            ]} />
          
          <TextField
            id="family"
            label="Family Members"
            type="number"
            min={1}
            max={15}
            placeholder="e.g. 3"
            suffix="members"
            required />
          
          <TextField
            id="employmentLength"
            label="Employment Length"
            type="number"
            step="0.1"
            min={0}
            placeholder="e.g. 5"
            suffix="years"
            helper="Total continuous time in your current type of work."
            required />
          
          <SelectField
            id="incomeType"
            label="Employment Status"
            placeholder="Select income type"
            required
            options={[
              'Working',
              'Commercial associate',
              'Pensioner',
              'State servant',
              'Unemployed',
              'Student',
              'Businessman',
              'Maternity leave'
            ]}
            wrapperClassName="sm:col-span-2 sm:max-w-[calc(50%-0.625rem)]" />
          
        </FormSection>

        <FormSection
          title="Financial Details"
          description="What you earn, what you want to borrow, and what you can repay."
          icon={BriefcaseIcon}>
          
          <TextField
            id="income"
            label="Monthly Income"
            type="number"
            min={0}
            placeholder="e.g. 50000"
            prefix="₹"
            helper="Take-home pay after deductions."
            required />
          
          <TextField
            id="loanAmount"
            label="Requested Loan Amount"
            type="number"
            min={0}
            placeholder="e.g. 200000"
            prefix="₹"
            required />
          
          <TextField
            id="emi"
            label="Monthly EMI"
            type="number"
            min={0}
            placeholder="e.g. 5000"
            prefix="₹"
            helper="The instalment you expect to pay each month."
            required />
          
          <TextField
            id="goodsPrice"
            label="Price of Goods"
            type="number"
            min={0}
            placeholder="e.g. 200000"
            prefix="₹"
            helper="The value of what the loan is for."
            required />
          
        </FormSection>

        <FormSection
          title="Credit History"
          description="Information about your past and present credit accounts."
          icon={BriefcaseIcon}>
          
          <TextField
            id="bureau_total_loans_count"
            label="Total Credit Accounts"
            type="number"
            min={0}
            step={1}
            placeholder="e.g. 2"
            helper="Total credit cards and loans (past & present)."
            required />
            
          <TextField
            id="bureau_active_loans_count"
            label="Active Credit Accounts"
            type="number"
            min={0}
            step={1}
            placeholder="e.g. 1"
            helper="Number of currently active credit accounts."
            required />

          <TextField
            id="bureau_total_debt_sum"
            label="Total Outstanding Debt"
            type="number"
            min={0}
            placeholder="e.g. 50000"
            prefix="₹"
            helper="Total remaining balance across all active loans."
            required />
            
          <TextField
            id="bureau_total_credit_limit"
            label="Total Credit Limit"
            type="number"
            min={0}
            placeholder="e.g. 100000"
            prefix="₹"
            helper="Total combined credit limit across all accounts."
            required />
            
          <TextField
            id="bureau_credit_history_length_years"
            label="Credit History Length"
            type="number"
            min={0}
            step={0.1}
            placeholder="e.g. 5.5"
            helper="Years since your first credit account was opened."
            required />
            
          <TextField
            id="prev_app_refused_count"
            label="Previous Refusals"
            type="number"
            min={0}
            step={1}
            placeholder="e.g. 0"
            helper="Number of times you have been refused credit."
            required />
            
        </FormSection>

        <Card className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-7">
          <div className="flex items-start gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ai-50 text-ai-600"
              aria-hidden="true">
              
              <SparklesIcon size={19} />
            </span>
            <p className="max-w-lg text-[1rem] leading-relaxed text-navy-500">
              CreditAI will return a score, a presentation risk band, an
              estimated payment-difficulty probability, and the factors that
              influenced the result.
            </p>
          </div>
          
          <div className="flex flex-col gap-2 items-end">
            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto"
              disabled={analyzing}>
              
              {analyzing ? 'Analyzing…' : 'Analyze My Credit'}
            </Button>
          </div>
        </Card>
      </form>

      <div className="mt-8">
        <ScoreDisclaimer />
      </div>
    </AppShell>);

}