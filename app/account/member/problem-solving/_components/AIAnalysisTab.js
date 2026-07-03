/**
 * @file AI Analysis tab component
 * @module AIAnalysisTab
 */

'use client';
import { Sparkles, Bot, User, Send, Brain, Clock, MemoryStick, Lightbulb, AlertCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';

export default function AIAnalysisTab({ analysis, problem, onChat }) {
  const [prompt, setPrompt] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: analysis
        ? `I can see this problem has AI analysis in the database. Ask me anything about the approach, complexity, or edge cases!`
        : `Hi! Ask me anything about this problem — approach ideas, complexity analysis, edge cases, or hints.`,
    },
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || sending) return;
    const userMsg = prompt.trim();
    setPrompt('');
    const updated = [...messages, { role: 'user', content: userMsg }];
    setMessages(updated);
    setSending(true);
    try {
      const res = onChat ? await onChat(updated) : null;
      if (res?.success) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.content }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: res?.error || 'No LLM provider configured. Add GROQ_API_KEY or GEMINI_API_KEY to .env to enable AI chat.' },
        ]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error contacting AI service.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 lg:h-[calc(100vh-220px)] lg:min-h-130 lg:flex-row lg:items-stretch lg:overflow-hidden">
      {/* ── Left: analysis panel ────────────────────────────────────── */}
      <div className="min-w-0 flex-1 space-y-4">
        {analysis ? (
          <div className="space-y-4">
            {analysis.summary && (
              <div className="rounded-2xl border border-white/[0.07] bg-zinc-900/40 p-5">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  <Brain className="h-3.5 w-3.5 text-indigo-400" /> Summary
                </div>
                <p className="text-sm leading-relaxed text-zinc-300">{analysis.summary}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {analysis.time_complexity && (
                <div className="rounded-xl border border-white/[0.07] bg-zinc-900/50 p-4">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                    <Clock className="h-3 w-3 text-amber-400" /> Time
                  </div>
                  <code className="font-mono text-sm text-amber-300">{analysis.time_complexity}</code>
                </div>
              )}
              {analysis.space_complexity && (
                <div className="rounded-xl border border-white/[0.07] bg-zinc-900/50 p-4">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                    <MemoryStick className="h-3 w-3 text-violet-400" /> Space
                  </div>
                  <code className="font-mono text-sm text-violet-300">{analysis.space_complexity}</code>
                </div>
              )}
            </div>
            {analysis.key_concepts?.length > 0 && (
              <div className="rounded-xl border border-white/[0.07] bg-zinc-900/50 p-5">
                <div className="mb-3 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Key Concepts</div>
                <div className="flex flex-wrap gap-2">
                  {analysis.key_concepts.map((c) => (
                    <span key={c} className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-300">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {analysis.hints?.length > 0 && (
              <div className="space-y-2">
                {analysis.hints.map((hint, idx) => (
                  <details key={idx} className="group overflow-hidden rounded-xl border border-white/[0.07] bg-zinc-900/50 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer items-center justify-between p-4 text-[10px] font-bold tracking-widest text-zinc-400 uppercase select-none hover:text-zinc-200">
                      <span className="flex items-center gap-2"><Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Hint {idx + 1}</span>
                    </summary>
                    <div className="border-t border-white/[0.07] px-4 pt-3 pb-4 text-xs leading-relaxed text-zinc-400">
                      <Markdown>{hint}</Markdown>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-white/[0.07] bg-zinc-900/40 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
              <Sparkles className="h-6 w-6 text-indigo-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">No stored analysis</h3>
              <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
                This problem hasn't been analyzed yet. Use the chat to ask questions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: AI chat ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="w-full shrink-0 lg:h-full lg:w-96"
      >
        <div className="flex h-full max-h-150 flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-900/60 lg:max-h-none">
          <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.07] bg-zinc-950/50 px-4 py-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
              <Bot className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${onChat ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                <span className={`font-mono text-[10px] tracking-widest uppercase ${onChat ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {sending ? 'Thinking...' : onChat ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    msg.role === 'user'
                      ? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400'
                      : 'border-violet-500/20 bg-violet-500/10 text-violet-400'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="h-3 w-3" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                </div>
                <div
                  className={`max-w-[84%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-tr-sm border border-indigo-500/20 bg-indigo-500/10 text-zinc-200'
                      : 'rounded-tl-sm border border-white/[0.07] bg-zinc-800/60 text-zinc-300'
                  }`}
                >
                  <div className="prose prose-invert prose-xs max-w-none text-inherit [&_p]:mb-1.5 [&_p:last-child]:mb-0">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t border-white/[0.07] bg-zinc-950/50 p-3">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask about approach, complexity, edge cases..."
                className="min-w-0 flex-1 rounded-xl border border-white/[0.07] bg-zinc-900/80 px-3.5 py-2.5 text-xs text-zinc-200 transition-colors outline-none placeholder:text-zinc-600 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || sending}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-400 transition-all hover:border-violet-400/50 hover:bg-violet-500/20 disabled:pointer-events-none disabled:opacity-30"
              >
                <Send className={`h-3.5 w-3.5 ${sending ? 'animate-pulse' : ''}`} />
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
