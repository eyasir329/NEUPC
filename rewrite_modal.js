const fs = require('fs');

const originalModal = fs.readFileSync('app/account/member/problem-solving/_components/ProblemDetailModal.js', 'utf8');

// Just grabbing the App.tsx content and converting it to the modal structure
const appJsx = `
'use client';
import { useState, useEffect } from 'react';
import { Sparkles, FileText, Clock, Lightbulb, StickyNote, Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProblemTab from './ProblemTab';
import NotesTab from './NotesTab';
import AIAnalysisTab from './AIAnalysisTab';
import SubmissionsTab from './SubmissionsTab';
import SimilarTab from './SimilarTab';

const TABS = [
  { id: 'Problem', icon: FileText, color: 'text-slate-400' },
  { id: 'Submissions', icon: Clock, color: 'text-emerald-400' },
  { id: 'AI Analysis', icon: Sparkles, color: 'text-indigo-400' },
  { id: 'Similar', icon: Lightbulb, color: 'text-amber-400' },
  { id: 'Notes', icon: StickyNote, color: 'text-purple-400' },
];

export default function ProblemDetailModal({ problem, onClose }) {
  const [activeTab, setActiveTab] = useState('Problem');

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // mapping problem to match the new UI's ProblemData interface approximately
  const mappedData = {
    difficulty: problem?.difficulty_tier || "Medium",
    difficultyRating: problem?.difficulty_rating || 0,
    id: problem?.id || "0",
    platform: problem?.platform || "leetcode",
    problemId: problem?.problem_id || "0",
    problemName: problem?.problem_name || "Unknown Problem",
    submittedAt: problem?.first_solved_at || new Date().toISOString(),
    tags: problem?.tags || [],
    verdict: "Accepted", // default for look
    description: problem?.problem_description || problem?.problem_notes || "No description available.",
    inputFormat: problem?.input_format || "",
    outputFormat: problem?.output_format || "",
    examples: problem?.examples || [],
    constraints: [problem?.constraints || ""],
    hints: [],
    companies: []
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-black/90 p-4 md:p-6 sm:p-2 overflow-hidden justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 20 }}
        className="w-full max-w-7xl bg-[#0a0a0f] text-slate-200 font-sans flex flex-col rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative"
      >
        <header className="shrink-0 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10 px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono tracking-widest uppercase text-slate-500">#{mappedData.problemId.split('-').pop()}</span>
              <h1 className="text-sm font-semibold tracking-wide text-slate-200">{mappedData.problemName}</h1>
            </div>
            
            <div className="hidden md:flex items-center gap-3 px-3 py-1 rounded bg-slate-900/50 border border-white/10">
              <span className="text-[10px] font-mono text-slate-400">R:{mappedData.difficultyRating}</span>
              <div className="w-px h-3 bg-slate-800" />
              <span className={\`text-[10px] uppercase tracking-widest \${mappedData.difficulty === 'Easy' ? 'text-emerald-400' : 'text-amber-400'}\`}>
                {mappedData.difficulty}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-white transition-colors">
              <Star className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors ml-4 bg-white/5 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="border-b border-white/5 bg-[#0a0a0f]/90 backdrop-blur-md px-6 shrink-0">
          <nav className="flex space-x-6 overflow-x-auto custom-scrollbar">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={\`flex items-center gap-2 py-4 text-xs font-medium tracking-wide uppercase transition-colors relative whitespace-nowrap \${
                    isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }\`}
                >
                  <Icon className={\`w-3.5 h-3.5 \${isActive ? 'text-white' : 'opacity-60'}\`} />
                  {tab.id}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <main className="flex-1 w-full overflow-y-auto custom-scrollbar relative bg-[#0a0a0f]">
          <div className="max-w-6xl mx-auto px-6 py-8 h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="min-h-full"
              >
                {activeTab === 'Problem' && <ProblemTab data={mappedData} />}
                {activeTab === 'Submissions' && <SubmissionsTab />}
                {activeTab === 'AI Analysis' && <AIAnalysisTab />}
                {activeTab === 'Similar' && <SimilarTab />}
                {activeTab === 'Notes' && <NotesTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </motion.div>
    </div>
  );
}
`;

fs.writeFileSync('app/account/member/problem-solving/_components/ProblemDetailModal.js', appJsx);
