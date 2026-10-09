import React from 'react';
import type { AssessmentDetailField } from '../../types/credit';
import { Card } from '../ui/Card';

export function CreditDetailsGrid({
  details


}: {details: AssessmentDetailField[];}) {
  return (
    <Card className="p-5 sm:p-6">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
        {details.map((item) =>
        <div key={item.label} className="flex flex-col">
            <dt className="text-[0.95rem] font-semibold text-navy-500">
              {item.label}
            </dt>
            <dd className="mt-1 font-display text-[1.25rem] font-bold tracking-[-0.02em] text-navy-900">
              {item.value}
            </dd>
          </div>
        )}
      </dl>
    </Card>);

}