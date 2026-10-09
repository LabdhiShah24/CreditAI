import React from 'react';
import type { Assessment } from '../../types/credit';
import { SectionHeading } from '../ui/Card';
import { ScoreHero } from './ScoreHero';
import { CreditDetailsGrid } from './CreditDetailsGrid';
import { RiskFactors } from './RiskFactors';
import { LimitedHistoryNotice, ScoreDisclaimer } from './Disclosures';

export function AssessmentView({ assessment }: {assessment: Assessment;}) {
  return (
    <>
      <ScoreHero
        score={assessment.score}
        paymentRisk={assessment.paymentRisk}
        date={assessment.date} />
      

      <section className="mt-10" aria-label="Your credit details">
        <SectionHeading
          title="Your Credit Details"
          description="The information this assessment was based on." />
        
        <div className="mt-5">
          <CreditDetailsGrid details={assessment.details} />
        </div>
      </section>

      <section className="mt-10" aria-label="Your risk factors">
        <SectionHeading
          title="Your Risk Factors"
          description="These factors had the strongest influence on your CreditAI assessment." />
        
        <div className="mt-5">
          <RiskFactors factors={assessment.factors} />
        </div>
      </section>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {assessment.limitedHistory ? <LimitedHistoryNotice /> : null}
        <ScoreDisclaimer />
      </div>
    </>);

}