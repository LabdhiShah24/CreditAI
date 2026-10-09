import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRightIcon, SparklesIcon } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { SectionHeading } from '../components/ui/Card';
import { ButtonLink } from '../components/ui/Button';
import { ScoreHero } from '../components/credit/ScoreHero';
import { CreditProfileGrid } from '../components/credit/CreditProfileGrid';
import { RiskFactors } from '../components/credit/RiskFactors';
import { AssessmentList } from '../components/credit/AssessmentList';
import { ScoreDisclaimer } from '../components/credit/Disclosures';
import { useAuth } from '../contexts/AuthContext';
import { fetchApi, mapDjangoAssessment } from '../services/api';

export function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const isNewUser = location.state?.isNewUser || false;
  
  const [assessments, setAssessments] = useState<any[]>([]);
  const [latestAssessment, setLatestAssessment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchApi('/assessments/');
        const mapped = res.assessments.map(mapDjangoAssessment);
        setAssessments(mapped);
        if (res.assessments.length > 0) {
          setLatestAssessment(res.assessments[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <AppShell><div className="p-8 text-center text-slate-500">Loading...</div></AppShell>;
  }

  const nameToUse = user?.first_name 
    ? (user?.last_name ? `${user.first_name} ${user.last_name}` : user.first_name)
    : user?.username;

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 sm:mb-8">
        <div>
          <h1 className="font-display text-display-md font-extrabold text-navy-900">
            {isNewUser ? `Welcome to CreditAI, ${nameToUse}` : `Welcome back, ${nameToUse}`}
          </h1>
          <p className="mt-2 text-[1.08rem] text-navy-500">
            Here&rsquo;s your current credit picture.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink to="/assistant" variant="secondary" size="sm">
            <SparklesIcon size={17} aria-hidden="true" className="text-ai-600" />
            Ask CreditAI
          </ButtonLink>
          <ButtonLink to="/analyze" size="sm">
            Analyze Credit
            <ArrowRightIcon size={17} aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>

      {latestAssessment ? (
        <>
          <ScoreHero
            score={latestAssessment.creditai_score}
            paymentRisk={latestAssessment.calibrated_pd}
            date={new Date(latestAssessment.created_at).toLocaleDateString()} />

          <section className="mt-10" aria-labelledby="credit-profile">
            <SectionHeading
              title="Your Credit Profile"
              description="The details behind your most recent assessment." />
            
            <CreditProfileGrid fields={[
              { id: 'inc', label: "Monthly Income", value: `₹${latestAssessment.income_monthly.toLocaleString()}`, helper: 'Stated income', icon: 'income', accent: 'mint' },
              { id: 'loan', label: "Loan Amount", value: `₹${latestAssessment.loan_credit_amount.toLocaleString()}`, helper: 'Requested credit', icon: 'loan', accent: 'ai' },
              { id: 'emi', label: "Monthly EMI", value: `₹${latestAssessment.loan_annuity_emi.toLocaleString()}`, helper: 'Expected payment', icon: 'emi', accent: 'amber' },
              { id: 'emp', label: "Employment", value: `${latestAssessment.employment_years} yrs`, helper: 'Time at current job', icon: 'employment', accent: 'lavender' },
              { id: 'edu', label: "Education", value: latestAssessment.education_level, helper: 'Highest level completed', icon: 'ratio', accent: 'navy' }
            ]} className="mt-5" />
          </section>

          <section className="mt-10" aria-labelledby="risk-factors">
            <SectionHeading
              title="Your Risk Factors"
              description="These factors had the strongest influence on your CreditAI assessment." />
            
            <div className="mt-5">
              <RiskFactors factors={[
                ...(latestAssessment.shap_explanations?.risk_increasing || []).map((f: any, i: number) => ({
                  id: `inc-${i}`, label: f.name, detail: f.impact, influence: Math.max(0.1, 0.9 - (i * 0.2)), direction: 'higher' as const
                })),
                ...(latestAssessment.shap_explanations?.risk_reducing || []).map((f: any, i: number) => ({
                  id: `dec-${i}`, label: f.name, detail: f.impact, influence: Math.max(0.1, 0.9 - (i * 0.2)), direction: 'lower' as const
                }))
              ]} />
            </div>
          </section>
        </>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="mb-2 text-xl font-bold text-navy-900">No Assessments Yet</h2>
          <p className="mb-6 text-slate-500">Run your first credit analysis to see your score.</p>
          <ButtonLink to="/analyze">Analyze Credit Now</ButtonLink>
        </div>
      )}

      {assessments.length > 0 && (
        <section className="mt-10" aria-labelledby="recent-assessments">
          <SectionHeading
            title="Recent Assessments"
            description="Your three most recent CreditAI results."
            action={
            <Link
              to="/history"
              className="inline-flex items-center gap-1.5 rounded-pill px-3 py-2 text-[1rem] font-semibold text-ai-600 transition-colors duration-150 ease-out hover:bg-ai-50">
              
                View All History
                <ArrowRightIcon size={17} aria-hidden="true" />
              </Link>
            } />
          
          <div className="mt-5">
            <AssessmentList assessments={assessments.slice(0, 3)} />
          </div>
        </section>
      )}

      <div className="mt-10">
        <ScoreDisclaimer />
      </div>
    </AppShell>
  );
}