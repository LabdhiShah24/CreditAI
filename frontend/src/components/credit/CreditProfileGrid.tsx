import React from 'react';
import {
  BriefcaseIcon,
  CalendarClockIcon,
  CreditCardIcon,
  PercentIcon,
  PiggyBankIcon,
  WalletIcon } from
'lucide-react';
import type { CreditProfileField } from '../../types/credit';
import { Card } from '../ui/Card';
import { cx } from '../../utils/format';

const icons = {
  income: PiggyBankIcon,
  loan: WalletIcon,
  emi: CreditCardIcon,
  employment: BriefcaseIcon,
  term: CalendarClockIcon,
  ratio: PercentIcon
} as const;

const accents: Record<CreditProfileField['accent'], string> = {
  mint: 'bg-mint-50 text-mint-700',
  ai: 'bg-ai-50 text-ai-700',
  amber: 'bg-amber-50 text-amber-700',
  lavender: 'bg-lavender-100 text-ai-700',
  navy: 'bg-navy-50 text-navy-700',
  coral: 'bg-coral-50 text-coral-700'
};

export function CreditProfileGrid({
  fields,
  className



}: {fields: CreditProfileField[];className?: string;}) {
  return (
    <ul
      className={cx(
        'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3',
        className
      )}>
      
      {fields.map((field) => {
        const Icon = icons[field.icon];
        return (
          <Card
            as="li"
            key={field.id}
            className="flex flex-col p-4 transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lift sm:p-5">
            
            <span
              className={cx(
                'flex h-9 w-9 items-center justify-center rounded-xl',
                accents[field.accent]
              )}
              aria-hidden="true">
              
              <Icon size={18} />
            </span>
            <span className="mt-4 text-[0.95rem] font-semibold text-navy-500">
              {field.label}
            </span>
            <span className="mt-1 font-display text-[1.5rem] font-extrabold tracking-[-0.03em] text-navy-900 sm:text-[1.65rem]">
              {field.value}
            </span>
            <span className="mt-auto pt-2 text-[0.9rem] leading-snug text-navy-400">
              {field.helper}
            </span>
          </Card>);

      })}
    </ul>);

}