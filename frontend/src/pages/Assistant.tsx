import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SendHorizonalIcon, SparklesIcon, UserIcon } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { RiskBandBadge } from '../components/ui/Badge';
import { cx } from '../utils/format';
import type { ChatMessage } from '../types/credit';
import { WELCOME_MESSAGE } from '../data/assistant';
import { useAuth } from '../contexts/AuthContext';
import { fetchApi } from '../services/api';

function ContextChip() {
  return (
    <span className="mt-2 inline-flex items-center gap-1.5 rounded-pill border border-ai-200 bg-ai-50 px-3 py-1 text-[0.88rem] font-semibold text-ai-700">
      <SparklesIcon size={13} aria-hidden="true" />
      Using your latest CreditAI assessment
    </span>
  );
}

function MessageBubble({ message }: {message: ChatMessage;}) {
  const isUser = message.author === 'user';
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className={cx('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      
      <span
        aria-hidden="true"
        className={cx(
          'mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          isUser ? 'bg-navy-900 text-white' : 'bg-ai-600 text-white'
        )}>
        
        {isUser ? <UserIcon size={17} /> : <SparklesIcon size={17} />}
      </span>
      <div className={cx('max-w-[42rem]', isUser && 'text-right')}>
        <div
          className={cx(
            'inline-block rounded-2xl px-4 py-3 text-[1.03rem] leading-relaxed',
            isUser ?
            'rounded-tr-sm bg-navy-900 text-white' :
            'rounded-tl-sm border border-ai-100 bg-white text-navy-800'
          )}>
          
          {isUser ? (
            message.text
          ) : (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              className="space-y-3 [&_p]:leading-relaxed [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1.5 [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold"
            >
              {message.text}
            </ReactMarkdown>
          )}
        </div>
        {message.usesAssessmentContext ?
        <div>
            <ContextChip />
          </div> :
        null}
      </div>
    </motion.li>
  );
}

type AssistantMode = 'general' | 'personal' | 'explain';

const MODE_QUICK_ACTIONS: Record<AssistantMode, { id: string, label: string, personal: boolean }[]> = {
  general: [
    { id: 'q-g1', label: 'What is a credit score?', personal: false },
    { id: 'q-g2', label: 'What is EMI?', personal: false },
    { id: 'q-g3', label: 'What is credit utilization?', personal: false },
    { id: 'q-g4', label: 'What is loan tenure?', personal: false }
  ],
  personal: [
    { id: 'q-p1', label: 'Why is my score like this?', personal: true },
    { id: 'q-p2', label: 'What is affecting my assessment?', personal: true },
    { id: 'q-p3', label: 'What is my payment risk?', personal: true },
    { id: 'q-p4', label: 'What should I review?', personal: true }
  ],
  explain: [
    { id: 'q-e1', label: 'Explain my score', personal: true },
    { id: 'q-e2', label: 'Explain my risk factors', personal: true },
    { id: 'q-e3', label: 'Explain my payment risk', personal: true },
    { id: 'q-e4', label: 'Explain my assessment simply', personal: true }
  ]
};

export function Assistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AssistantMode>('general');
  const [thinking, setThinking] = useState(false);
  const [latestAssessment, setLatestAssessment] = useState<any | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadAssessment() {
      try {
        const res = await fetchApi('/assessments/latest/');
        setLatestAssessment(res.assessment);
      } catch (e) {
        // Ignore
      }
    }
    loadAssessment();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, thinking]);

  async function ask(question: string, actionId?: string) {
    const isPersonal = actionId ? 
      MODE_QUICK_ACTIONS[mode].find(a => a.id === actionId)?.personal : 
      (mode === 'personal' || mode === 'explain');
    
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, author: 'user', text: question }
    ]);
    setInput('');
    setThinking(true);
    
    try {
      const res = await fetchApi('/assistant/', {
        method: 'POST',
        body: JSON.stringify({ message: question, mode, actionId })
      });
      
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          author: 'assistant',
          text: res.response || res.error || "Sorry, I couldn't process that.",
          usesAssessmentContext: isPersonal || (res.response && res.response.includes('profile'))
        }
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          author: 'assistant',
          text: `Error: ${e.message}`,
          usesAssessmentContext: false
        }
      ]);
    } finally {
      setThinking(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || thinking) return;
    ask(trimmed);
  }

  return (
    <AppShell className="flex flex-col">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="max-w-2xl">
          <h1 className="flex items-center gap-3 font-display text-display-md font-extrabold text-navy-900">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ai-600 text-white shadow-ai"
              aria-hidden="true">
              <SparklesIcon size={22} />
            </span>
            CreditAI Assistant
          </h1>
          <p className="mt-2 text-[1.08rem] leading-relaxed text-navy-500">
            Ask me anything about credit, loans, or your CreditAI assessment.
          </p>
        </div>
        
        {latestAssessment && user && (
          <div className="flex items-center gap-3 rounded-card border border-navy-100 bg-white px-4 py-3">
            <div>
              <p className="text-[0.88rem] font-semibold text-navy-500">
                {user.first_name || user.username}&rsquo;s latest score
              </p>
              <p className="font-display text-[1.45rem] font-extrabold leading-tight text-navy-900">
                {latestAssessment.creditai_score}
              </p>
            </div>
            <RiskBandBadge score={latestAssessment.creditai_score} size="sm" />
          </div>
        )}
      </div>

      <Card className="flex min-h-[560px] flex-1 flex-col overflow-hidden bg-lavender-50/60">
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <ul className="flex flex-col gap-5">
            {messages.map((message) =>
              <MessageBubble key={message.id} message={message} />
            )}
            <AnimatePresence>
              {thinking ?
                <motion.li
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-ai-600 text-white">
                    <SparklesIcon size={17} />
                  </span>
                  <span className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-ai-100 bg-white px-4 py-3">
                    <span className="sr-only">CreditAI is typing</span>
                    {[0, 1, 2].map((dot) =>
                      <motion.span
                        key={dot}
                        className="h-2 w-2 rounded-full bg-ai-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 0.9,
                          repeat: Infinity,
                          delay: dot * 0.15,
                          ease: 'linear'
                        }} />
                    )}
                  </span>
                </motion.li> :
              null}
            </AnimatePresence>
          </ul>
          <div ref={endRef} />
        </div>

        <div className="border-t border-navy-100 bg-white px-4 py-4 sm:px-6">
          <p className="text-[0.92rem] font-semibold text-navy-500">
            Suggested questions
          </p>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {MODE_QUICK_ACTIONS[mode].map((action) =>
              <li key={action.id}>
                <button
                  type="button"
                  onClick={() => ask(action.label, action.id)}
                  disabled={thinking}
                  className={cx(
                    'inline-flex min-h-[40px] items-center gap-1.5 rounded-pill border px-4 text-[0.98rem] font-semibold',
                    'transition-[background-color,border-color,color] duration-150 ease-out disabled:opacity-50',
                    action.personal ?
                    'border-ai-200 bg-ai-50 text-ai-700 hover:bg-ai-100' :
                    'border-navy-200 bg-white text-navy-700 hover:bg-navy-50'
                  )}>
                  {action.personal ?
                    <SparklesIcon size={14} aria-hidden="true" /> :
                  null}
                  {action.label}
                </button>
              </li>
            )}
          </ul>

          <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-3">
            <div className="relative shrink-0">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as AssistantMode)}
                className="h-14 appearance-none rounded-pill border border-navy-200 bg-navy-50 pl-5 pr-10 text-[0.98rem] font-semibold text-navy-800 transition-[border-color,box-shadow,background-color] hover:bg-white hover:border-navy-300 focus:border-ai-500 focus:outline-none focus:ring-4 focus:ring-ai-100"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364789E' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center'
                }}
              >
                <option value="general" title="General questions about credit, loans and finance.">General</option>
                <option value="personal" title="Questions about your CreditAI assessment.">Personal</option>
                <option value="explain" title="Understand your score, risk and influencing factors.">Explain</option>
              </select>
            </div>
            
            <label htmlFor="assistant-input" className="sr-only">
              Ask CreditAI
            </label>
            <input
              id="assistant-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask CreditAI..."
              autoComplete="off"
              className="h-14 w-full rounded-pill border border-navy-200 bg-white px-5 text-[1.05rem] text-navy-900 placeholder:text-navy-300 transition-[border-color,box-shadow] duration-150 ease-out hover:border-navy-300 focus:border-ai-500 focus:outline-none focus:ring-4 focus:ring-ai-100" />
            
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              aria-label="Send message"
              className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ai-600 text-white shadow-ai transition-[background-color,transform] duration-150 ease-out hover:bg-ai-500 active:translate-y-px disabled:opacity-40">
              <SendHorizonalIcon size={20} aria-hidden="true" />
            </button>
          </form>
          <p className="mt-3 text-[0.9rem] leading-snug text-navy-400">
            Personal and Explain modes use your latest CreditAI
            assessment. CreditAI can make mistakes — check anything important.
          </p>
        </div>
      </Card>
    </AppShell>
  );
}