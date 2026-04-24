'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { sendChatbotQuery } from '../intelligence-api';
import { getApiErrorMessage } from '@/lib/api-errors';

type Msg = { role: 'user' | 'bot'; text: string };

const QUICK = ['my tasks', 'am i at risk', 'help'];

export function FieldAssistantChat({ bottomOffset }: { bottomOffset?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'bot', text: 'Hi — I’m your Field Assistant. Ask me anything in plain language (e.g. "What are my tasks?").' },
  ]);
  const [pending, setPending] = useState(false);
  const [actions, setActions] = useState<string[]>(QUICK);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, open]);

  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || !user?.id) return;
      setMsgs((m) => [...m, { role: 'user', text: t }]);
      setInput('');
      setPending(true);
      try {
        const res = await sendChatbotQuery(user.id, t);
        const tag = res.source === 'ai' ? 'AI response' : 'Rule fallback';
        setMsgs((m) => [...m, { role: 'bot', text: `${res.reply}\n\n— ${tag}` }]);
        if (res.actions?.length) setActions(res.actions);
      } catch (e) {
        setMsgs((m) => [...m, { role: 'bot', text: 'Server error. Try again.' }]);
      } finally {
        setPending(false);
      }
    },
    [user?.id],
  );

  const bottom = bottomOffset ?? '1.25rem';

  return (
    <>
      <button
        type="button"
        aria-label="Open field assistant"
        onClick={() => setOpen(true)}
        className="fixed z-[10002] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/25 ring-2 ring-white/90 transition hover:scale-105 active:scale-95"
        style={{ right: '1rem', bottom: bottom }}
      >
        <Sparkles className="h-6 w-6" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[10003] flex justify-end bg-black/35 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Field assistant"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="mt-auto mb-0 flex h-[min(560px,85vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-emerald-300" />
                <span className="font-extrabold tracking-tight">Field Assistant</span>
              </div>
              <button
                type="button"
                aria-label="Close"
                className="rounded-lg p-2 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-emerald-600 font-medium text-white'
                        : 'border border-violet-100 bg-violet-50/80 text-slate-800'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {pending ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs font-semibold">Thinking…</span>
                  </div>
                </div>
              ) : null}
              <div ref={endRef} />
            </div>

            <div className="border-t border-slate-100 px-3 py-2">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick actions</p>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {actions.slice(0, 6).map((a) => (
                  <button
                    key={a}
                    type="button"
                    disabled={pending}
                    onClick={() => void send(a)}
                    className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    {a}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                  placeholder="Ask in plain language..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none ring-emerald-500/30 focus:ring-2"
                />
                <button
                  type="button"
                  disabled={pending || !input.trim()}
                  onClick={() => void send(input)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
