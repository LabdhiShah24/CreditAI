import React from 'react';
import {
  ArrowRightIcon,
  BarChart3Icon,
  GaugeIcon,
  HistoryIcon,
  LineChartIcon,
  ListChecksIcon,
  LockIcon,
  SparklesIcon } from
'lucide-react';
import { PublicNav } from '../components/layout/PublicNav';
import { Footer } from '../components/layout/Footer';
import { ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { HeroVisual } from '../components/home/HeroVisual';

const features = [
{
  title: 'Understand Your Score',
  body: 'A single CreditAI Score from 300 to 900, shown on a colour-banded meter so you can see exactly where your profile sits.',
  icon: GaugeIcon,
  accent: 'bg-mint-50 text-mint-700'
},
{
  title: 'See Your Risk Factors',
  body: 'Every assessment lists what pushed your result higher and what pulled it lower, ranked by relative influence.',
  icon: ListChecksIcon,
  accent: 'bg-coral-50 text-coral-700'
},
{
  title: 'Ask CreditAI',
  body: 'An assistant that explains credit concepts and your own assessment in plain language, whenever you need it.',
  icon: SparklesIcon,
  accent: 'bg-ai-50 text-ai-700'
},
{
  title: 'Track Your Assessments',
  body: 'Keep a record of every assessment so you can see how your profile changes as your finances change.',
  icon: HistoryIcon,
  accent: 'bg-lavender-100 text-ai-700'
}];


const steps = [
{
  title: 'Your Information',
  body: 'Share a short set of personal and financial details — no documents, no bureau pull.',
  icon: BarChart3Icon
},
{
  title: 'CreditAI Analysis',
  body: 'The model evaluates your profile against patterns learned from historical lending data.',
  icon: SparklesIcon
},
{
  title: 'Risk Assessment',
  body: 'You get a CreditAI Score, a presentation risk band, and an estimated payment-difficulty probability.',
  icon: GaugeIcon
},
{
  title: 'Explainable Insights',
  body: 'Each result is broken down into the factors that influenced it most, in language you can act on.',
  icon: LineChartIcon
}];


export function Home() {
  return (
    <div className="flex min-h-full w-full flex-col bg-canvas">
      <PublicNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-shell px-4 pb-14 pt-10 sm:px-6 lg:pb-20 lg:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-pill border border-navy-200 bg-white px-4 py-1.5 text-[0.95rem] font-semibold text-navy-600">
                <LockIcon size={15} aria-hidden="true" className="text-mint-600" />
                Explainable credit assessment
              </span>
              <h1 className="mt-5 font-display text-display-xl font-extrabold text-navy-900">
                Understand your credit.
                <br />
                <span className="text-ai-600">Make smarter</span> financial
                decisions.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-[1.15rem] leading-relaxed text-navy-500 lg:mx-0">
                An AI-powered credit risk assessment system that evaluates
                financial profiles and provides transparent, explainable
                insights.
              </p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
                <ButtonLink to="/register" size="lg" variant="primary">
                  Check Your Credit
                  <ArrowRightIcon size={18} aria-hidden="true" />
                </ButtonLink>
                <ButtonLink to="/login" size="lg" variant="secondary">
                  Login
                </ButtonLink>
              </div>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 text-center lg:mx-0 lg:text-left">
                {[
                { k: '300–900', v: 'Score range' },
                { k: '6 bands', v: 'Risk presentation' },
                { k: '9 inputs', v: 'To get a result' }].
                map((stat) =>
                <div key={stat.k} className="mx-auto lg:mx-0">
                    <dt className="font-display text-[1.25rem] font-extrabold text-navy-900">
                      {stat.k}
                    </dt>
                    <dd className="text-[0.95rem] text-navy-500">{stat.v}</dd>
                  </div>
                )}
              </dl>
            </div>

            <HeroVisual />
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-navy-100 bg-white">
          <div className="mx-auto w-full max-w-shell px-4 py-14 sm:px-6 lg:py-20">
            <div className="max-w-2xl">
              <h2 className="font-display text-display-lg font-extrabold text-navy-900">
                Everything you need to read your own credit
              </h2>
              <p className="mt-3 text-[1.1rem] leading-relaxed text-navy-500">
                CreditAI turns a model output into something you can actually
                understand and act on.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-[0.8fr_1fr]">
              <Card className="flex flex-col justify-between p-6 sm:p-8">
                <div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy-900 text-white">
                    <GaugeIcon size={21} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-display text-[1.45rem] font-bold text-navy-900">
                    Six presentation bands
                  </h3>
                  <p className="mt-2 text-[1.02rem] leading-relaxed text-navy-500">
                    Every CreditAI Score maps onto a band, so the number always
                    comes with a meaning attached.
                  </p>
                </div>
                <ul className="mt-6 flex flex-col gap-2.5">
                  {[
                  ['750–900', 'Very Low Risk', '#0E9F6E'],
                  ['700–749', 'Low Risk', '#7BC98A'],
                  ['650–699', 'Moderate Risk', '#E3C22B'],
                  ['600–649', 'Elevated Risk', '#F5A524'],
                  ['500–599', 'High Risk', '#F2645A'],
                  ['300–499', 'Very High Risk', '#D9443C']].
                  map(([range, label, color]) =>
                  <li
                    key={range}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-canvas px-4 py-2.5 text-[1rem]">
                    
                      <span className="flex items-center gap-2.5 font-semibold text-navy-700">
                        <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                        aria-hidden="true" />
                      
                        {label}
                      </span>
                      <span className="font-semibold text-navy-400">
                        {range}
                      </span>
                    </li>
                  )}
                </ul>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                {features.map((feature) =>
                <Card key={feature.title} className="flex flex-col p-6 sm:p-7">
                    <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${feature.accent}`}
                    aria-hidden="true">
                    
                      <feature.icon size={21} />
                    </span>
                    <h3 className="mt-5 font-display text-[1.3rem] font-bold text-navy-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-[1.02rem] leading-relaxed text-navy-500">
                      {feature.body}
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto w-full max-w-shell px-4 py-14 sm:px-6 lg:py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-display-lg font-extrabold text-navy-900">
              How CreditAI Works
            </h2>
            <p className="mt-3 text-[1.1rem] leading-relaxed text-navy-500">
              Four steps from the details you enter to insights you can explain
              to someone else.
            </p>
          </div>

          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) =>
            <li key={step.title} className="relative">
                <Card className="flex h-full flex-col p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy-900 text-white">
                      <step.icon size={19} aria-hidden="true" />
                    </span>
                    <span className="font-display text-[1.6rem] font-extrabold text-navy-100">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-[1.2rem] font-bold text-navy-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[1rem] leading-relaxed text-navy-500">
                    {step.body}
                  </p>
                </Card>
                {index < steps.length - 1 ?
              <span
                aria-hidden="true"
                className="absolute -bottom-3 left-1/2 hidden h-6 w-6 -translate-x-1/2 items-center justify-center text-navy-300 md:flex lg:-right-5 lg:bottom-auto lg:left-auto lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0">
                
                    <ArrowRightIcon size={20} className="rotate-90 lg:rotate-0" />
                  </span> :
              null}
              </li>
            )}
          </ol>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-shell px-4 pb-16 sm:px-6 lg:pb-24">
          <div className="overflow-hidden rounded-card bg-navy-900 px-6 py-12 text-center sm:px-12 lg:py-16">
            <h2 className="mx-auto max-w-2xl font-display text-display-md font-extrabold text-white">
              See where your credit profile stands today
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[1.08rem] leading-relaxed text-navy-200">
              Create a CreditAI profile, enter nine details, and get an
              explainable assessment in seconds.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <ButtonLink to="/register" size="lg" variant="ai">
                Check Your Credit
                <ArrowRightIcon size={18} aria-hidden="true" />
              </ButtonLink>
              <ButtonLink
                to="/login"
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white">
                
                Login
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>);

}