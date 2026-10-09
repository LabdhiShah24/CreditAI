import React from 'react';
import { InfoIcon, ShieldAlertIcon } from 'lucide-react';

export function LimitedHistoryNotice() {
  return (
    <div className="flex gap-3 rounded-card border border-amber-200 bg-amber-50 p-4 sm:p-5">
      <InfoIcon
        size={20}
        className="mt-0.5 shrink-0 text-amber-600"
        aria-hidden="true" />
      
      <div>
        <h3 className="text-[1.02rem] font-bold text-amber-700">
          Limited credit history
        </h3>
        <p className="mt-1 text-[0.98rem] leading-relaxed text-amber-700/90">
          Some historical credit information was unavailable for this assessment
          and was handled using the model&rsquo;s trained imputation process.
        </p>
      </div>
    </div>);

}

export function ScoreDisclaimer() {
  return (
    <div className="flex gap-3 rounded-card border border-navy-100 bg-navy-50 p-4 sm:p-5">
      <ShieldAlertIcon
        size={20}
        className="mt-0.5 shrink-0 text-navy-400"
        aria-hidden="true" />
      
      <p className="text-[0.98rem] leading-relaxed text-navy-500">
        The CreditAI Risk Score is an internal model-derived score and is not a
        CIBIL, FICO, or other bureau score. It reflects modelled relationships
        in the information you provided, not a statement of cause.
      </p>
    </div>);

}