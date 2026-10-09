import React from 'react';
import { Card } from '../ui/Card';
import { ScoreGauge } from './ScoreGauge';
import { PaymentRiskCard } from './PaymentRiskCard';

interface ScoreHeroProps {
  score: number;
  paymentRisk: number;
  date?: string;
  caption?: string;
}

/**
 * The dominant score experience shared by Dashboard, Result and Details:
 * an oversized gauge paired with the payment-risk ring.
 */
export function ScoreHero({
  score,
  paymentRisk,
  date,
  caption = 'Your CreditAI Score'
}: ScoreHeroProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
      <Card className="flex flex-col items-center px-4 py-7 sm:px-8 sm:py-9">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-[1.25rem] font-bold text-navy-900">
            {caption}
          </h2>
          {date ?
          <span className="text-[0.95rem] font-medium text-navy-400">
              Assessed {date}
            </span> :
          null}
        </div>
        <ScoreGauge score={score} caption={caption} className="mt-2" width={460} />
      </Card>
      <PaymentRiskCard risk={paymentRisk} />
    </div>);

}