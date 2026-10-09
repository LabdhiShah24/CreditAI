import React, { useEffect, useState } from 'react';
import { AppShell, PageHeader } from '../components/layout/AppShell';
import { ButtonLink } from '../components/ui/Button';
import { AssessmentList } from '../components/credit/AssessmentList';
import { ScoreDisclaimer } from '../components/credit/Disclosures';
import { fetchApi, mapDjangoAssessment } from '../services/api';

export function History() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchApi('/assessments/');
        setAssessments(res.assessments.map(mapDjangoAssessment));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Assessment History"
        subtitle="Review your previous CreditAI assessments."
        action={
        <ButtonLink to="/analyze" size="sm">
            New Assessment
          </ButtonLink>
        } />
      
      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading history...</div>
      ) : assessments.length > 0 ? (
        <AssessmentList assessments={assessments} showLoanAmount />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500">No assessments found.</p>
        </div>
      )}
      
      <div className="mt-8">
        <ScoreDisclaimer />
      </div>
    </AppShell>
  );
}