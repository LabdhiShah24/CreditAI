import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';
import type { Assessment } from '../../types/credit';
import { Card } from '../ui/Card';
import { RiskBandBadge } from '../ui/Badge';
import { cx } from '../../utils/format';

interface AssessmentListProps {
  assessments: Assessment[];
  /** Show the loan amount column (history page) */
  showLoanAmount?: boolean;
}

export function AssessmentList({
  assessments,
  showLoanAmount = false
}: AssessmentListProps) {
  return (
    <>
      {/* Desktop table */}
      <Card className="hidden overflow-hidden md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Previous CreditAI assessments</caption>
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50/60">
              <th scope="col" className="px-6 py-4 text-[0.95rem] font-semibold text-navy-600">
                Date
              </th>
              <th scope="col" className="px-6 py-4 text-[0.95rem] font-semibold text-navy-600">
                CreditAI Score
              </th>
              <th scope="col" className="px-6 py-4 text-[0.95rem] font-semibold text-navy-600">
                Payment Risk
              </th>
              <th scope="col" className="px-6 py-4 text-[0.95rem] font-semibold text-navy-600">
                Risk Band
              </th>
              {showLoanAmount ?
              <th scope="col" className="px-6 py-4 text-[0.95rem] font-semibold text-navy-600">
                  Loan Amount
                </th> :
              null}
              <th scope="col" className="px-6 py-4 text-right text-[0.95rem] font-semibold text-navy-600">
                {showLoanAmount ? 'View Details' : 'View'}
              </th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((item) =>
            <tr
              key={item.id}
              className="border-b border-navy-100 transition-colors duration-150 ease-out last:border-0 hover:bg-navy-50/50">
              
                <td className="px-6 py-4 text-[1rem] font-medium text-navy-700">
                  {item.date}
                </td>
                <td className="px-6 py-4">
                  <span className="font-display text-[1.3rem] font-extrabold tracking-[-0.02em] text-navy-900">
                    {item.score}
                  </span>
                </td>
                <td className="px-6 py-4 text-[1rem] font-medium text-navy-700">
                  {item.paymentRisk.toFixed(2)}%
                </td>
                <td className="px-6 py-4">
                  <RiskBandBadge score={item.score} size="sm" />
                </td>
                {showLoanAmount ?
              <td className="px-6 py-4 text-[1rem] font-medium text-navy-700">
                    {item.loanAmount}
                  </td> :
              null}
                <td className="px-6 py-4 text-right">
                  <Link
                  to={`/history/${item.id}`}
                  className="inline-flex items-center gap-1 rounded-pill px-3 py-1.5 text-[0.98rem] font-semibold text-ai-600 transition-colors duration-150 ease-out hover:bg-ai-50">
                  
                    View
                    <ChevronRightIcon size={16} aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Mobile cards */}
      <ul className="flex flex-col gap-3 md:hidden">
        {assessments.map((item) =>
        <Card as="li" key={item.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-display text-[2rem] font-extrabold leading-none tracking-[-0.03em] text-navy-900">
                  {item.score}
                </span>
                <p className="mt-1 text-[0.95rem] text-navy-400">{item.date}</p>
              </div>
              <RiskBandBadge score={item.score} size="sm" />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-navy-50 px-3 py-2.5">
                <dt className="text-[0.88rem] font-medium text-navy-500">
                  Payment Risk
                </dt>
                <dd className="text-[1.1rem] font-bold text-navy-900">
                  {item.paymentRisk.toFixed(2)}%
                </dd>
              </div>
              <div className="rounded-2xl bg-navy-50 px-3 py-2.5">
                <dt className="text-[0.88rem] font-medium text-navy-500">
                  Loan Amount
                </dt>
                <dd className="text-[1.1rem] font-bold text-navy-900">
                  {item.loanAmount}
                </dd>
              </div>
            </dl>
            <Link
            to={`/history/${item.id}`}
            className={cx(
              'mt-4 flex min-h-[48px] w-full items-center justify-center rounded-pill',
              'border border-navy-200 text-[1rem] font-semibold text-navy-900',
              'transition-colors duration-150 ease-out hover:bg-navy-50'
            )}>
            
              View Details
            </Link>
          </Card>
        )}
      </ul>
    </>);

}