import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';

const columns = [
{
  title: 'Product',
  links: [
  { label: 'Check your credit', to: '/register' },
  { label: 'AI Assistant', to: '/register' },
  { label: 'Assessment history', to: '/register' }]

},
{
  title: 'Learn',
  links: [
  { label: 'What is a credit score?', to: '/register' },
  { label: 'Understanding EMI', to: '/register' },
  { label: 'Credit utilization', to: '/register' }]

},
{
  title: 'Account',
  links: [
  { label: 'Login', to: '/login' },
  { label: 'Create account', to: '/register' }]

}];


export function Footer() {
  return (
    <footer className="border-t border-navy-100 bg-white">
      <div className="mx-auto max-w-shell px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <Logo size={34} />
            <p className="mt-4 text-[1rem] leading-relaxed text-navy-500">
              CreditAI helps you understand your credit profile with
              transparent, explainable assessments and a financial assistant
              that answers in plain language.
            </p>
          </div>
          {columns.map((column) =>
          <div key={column.title}>
              <h3 className="font-display text-[1.05rem] font-bold text-navy-900">
                {column.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((link) =>
              <li key={link.label}>
                    <Link
                  to={link.to}
                  className="text-[1rem] text-navy-500 transition-colors duration-150 ease-out hover:text-navy-900">
                  
                      {link.label}
                    </Link>
                  </li>
              )}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-12 border-t border-navy-100 pt-6">
          <p className="text-[0.95rem] leading-relaxed text-navy-400">
            The CreditAI Risk Score is an internal model-derived score and is not
            a CIBIL, FICO, or other bureau score. Figures shown in this product
            preview are sample values.
          </p>
          <p className="mt-3 text-[0.95rem] text-navy-400">
            © 2026 CreditAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>);

}