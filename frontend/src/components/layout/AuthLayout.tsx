import React from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon } from 'lucide-react';
import { Logo } from '../ui/Logo';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  asideTitle: string;
  asidePoints: string[];
  footer: React.ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  asideTitle,
  asidePoints,
  footer
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-full w-full bg-canvas lg:grid-cols-[1fr_0.85fr]">
      <div className="flex flex-col px-4 py-8 sm:px-8 lg:px-14 lg:py-10">
        <Link to="/" aria-label="CreditAI home" className="self-start">
          <Logo size={34} />
        </Link>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-display-md font-extrabold text-navy-900">
            {title}
          </h1>
          <p className="mt-2 text-[1.08rem] leading-relaxed text-navy-500">
            {subtitle}
          </p>
          <div className="mt-8">{children}</div>
          <div className="mt-7 text-[1rem] text-navy-500">{footer}</div>
        </div>

        <p className="text-[0.92rem] text-navy-400">
          CreditAI Risk Score is an internal model-derived score and is not a
          CIBIL, FICO, or other bureau score.
        </p>
      </div>

      <aside className="relative hidden flex-col justify-between px-12 py-14 lg:flex" style={{ backgroundColor: '#0B1530' }}>
        <div>
          <span className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-4 py-1.5 text-[0.95rem] font-semibold text-ai-200">
            CreditAI
          </span>
          <h2 className="mt-6 max-w-sm font-display text-[2rem] font-extrabold leading-tight tracking-[-0.025em]" style={{ color: '#ffffff' }}>
            {asideTitle}
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {asidePoints.map((point) =>
            <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint-500/20 text-mint-200">
                  <CheckIcon size={14} aria-hidden="true" />
                </span>
                <span className="text-[1.05rem] leading-relaxed text-navy-200" style={{ color: '#C6CEDC' }}>
                  {point}
                </span>
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-card border border-white/10 bg-white/5 p-6">
          <p className="text-[0.92rem] font-semibold uppercase tracking-[0.14em]" style={{ color: '#93A3BC' }}>
            Sample assessment
          </p>
          <div className="mt-4 flex items-end gap-4">
            <span className="font-display text-[3rem] font-extrabold leading-none tracking-[-0.04em]" style={{ color: '#ffffff' }}>
              794
            </span>
            <span className="mb-1 inline-flex items-center gap-2 rounded-pill bg-mint-500/15 px-3 py-1 text-[0.95rem] font-semibold text-mint-200">
              <span className="h-2 w-2 rounded-full bg-mint-500" aria-hidden="true" />
              Very Low Risk
            </span>
          </div>
          <p className="mt-4 text-[0.98rem] leading-relaxed" style={{ color: '#93A3BC' }}>
            Payment risk 1.17% · estimated payment-difficulty probability.
          </p>
        </div>
      </aside>
    </div>);

}