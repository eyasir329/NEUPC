/**
 * @file Ported verbatim from the Todoist reference app. Types stripped.
 * @module daily-activity/_todoist/TaskDetailPane
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Trash2, Archive, Calendar, Flag, FolderOpen, CheckSquare, Plus, MessageSquare, Send, GitPullRequest, User, RefreshCw, Paperclip,
} from 'lucide-react';
import { Priority, generateId, getFeedItemUrl } from './utils';

export default function TaskDetailPane({ task, onClose, projects, sections, labels, onUpdateTask, onDeleteTask, allTasks = [] }) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  if (!task) return null;

  const isReadOnly = task.readOnly || task.isContest || ['event', 'task', 'session'].includes(task.feedCategory);

  if (isReadOnly) {
    const totalSubs = task.subtasks?.length || 0;
    const completedSubs = task.subtasks?.filter((s) => s.completed).length || 0;
    const progressPercent = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;

    let themeColor = '#d97706'; // default Contest Amber
    let categoryLabel = '🏆 CONTEST';
    let bgGradient = 'from-amber-500/[0.08] to-yellow-500/[0.02] border-amber-500/20';

    if (task.feedCategory === 'event') {
      themeColor = '#10b981'; // Emerald
      categoryLabel = '📣 EVENT';
      bgGradient = 'from-emerald-500/[0.08] to-teal-500/[0.02] border-emerald-500/20';
    } else if (task.feedCategory === 'task') {
      themeColor = '#6366f1'; // Indigo
      categoryLabel = '📅 DEADLINE';
      bgGradient = 'from-indigo-500/[0.08] to-purple-500/[0.02] border-indigo-500/20';
    } else if (task.feedCategory === 'session') {
      themeColor = '#0ea5e9'; // Sky
      categoryLabel = '🎓 SESSION';
      bgGradient = 'from-sky-500/[0.08] to-blue-500/[0.02] border-sky-500/20';
    }

    return (
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%', transition: { duration: 0.2 } }}
        className="w-full md:w-[480px] bg-[#0e1017] border-l border-zinc-800/80 h-full flex flex-col shadow-2xl z-40 fixed right-0 top-0 select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#12141c] border-b border-zinc-800/80">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: themeColor }} />
            <span className="text-[10px] font-black font-mono tracking-widest text-zinc-400 uppercase">{categoryLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            {getFeedItemUrl(task) && (
              <a
                href={getFeedItemUrl(task)}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 text-[9px] font-black font-mono tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1 transition"
              >
                <span>VISIT PORTAL</span>
              </a>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-zinc-800/80 rounded-lg text-zinc-400 transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Header Banner */}
          <div className={`p-4 rounded-2xl border bg-gradient-to-br ${bgGradient}`}>
            <h2 className="text-sm font-extrabold text-white break-words leading-snug select-text">{task.title}</h2>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Details / Instructions</label>
            <div className="text-xs text-zinc-300 bg-[#12141c] border border-zinc-800/60 p-3.5 rounded-xl leading-relaxed select-text whitespace-pre-wrap">
              {task.description || <span className="italic text-zinc-650">No additional description or timeline details specified.</span>}
            </div>
          </div>

          {/* Properties Grid */}
          <div className="bg-[#12141c] p-3.5 rounded-xl border border-zinc-800/60 grid grid-cols-2 gap-4 text-[11px]">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Scheduled Date</span>
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{task.dueDate ? new Date(task.dueDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Continuous'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Assigned Priority</span>
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
                <Flag className={`w-3.5 h-3.5 ${task.priority === Priority.P1 ? 'text-red-500 fill-current' : task.priority === Priority.P2 ? 'text-amber-500 fill-current' : task.priority === Priority.P3 ? 'text-blue-500 fill-current' : 'text-slate-400'}`} />
                <span>{task.priority === Priority.P1 ? 'Critical (P1)' : task.priority === Priority.P2 ? 'High (P2)' : task.priority === Priority.P3 ? 'Medium (P3)' : 'Low (P4)'}</span>
              </div>
            </div>

            {task.bootcampTitle && (
              <div className="flex flex-col gap-1 col-span-2 border-t border-zinc-800/50 pt-2.5">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Associated Bootcamp/Track</span>
                <span className="text-indigo-300 font-extrabold">{task.bootcampTitle}</span>
              </div>
            )}

            {task.time && (
              <div className="flex flex-col gap-1 col-span-2 border-t border-zinc-800/50 pt-2.5">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Start Time</span>
                <span className="text-zinc-300 font-bold">🕒 {task.time}</span>
              </div>
            )}
          </div>

          {/* Attachments Section */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="bg-[#12141c] p-3.5 rounded-xl border border-zinc-800/60 space-y-2 text-[11px] w-full">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5 text-slate-400" /> Reference Resources ({task.attachments.length})
              </span>
              <div className="space-y-1.5 mt-2">
                {task.attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-2 rounded-lg bg-[#0e1017] border border-zinc-800/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-bold text-zinc-300">{att.name}</span>
                      <span className="text-[9px] text-slate-500 shrink-0 font-mono">({att.size})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtasks Section */}
          {totalSubs > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-black text-[9px] text-slate-500 uppercase tracking-wider">Progress Subgoals ({completedSubs}/{totalSubs})</span>
                <span className="text-[10px] font-mono text-indigo-400 font-bold">{progressPercent}% complete</span>
              </div>

              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="space-y-1">
                {task.subtasks.map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-[#12141c] border border-zinc-800/60">
                    <input type="checkbox" checked={s.completed} disabled className="rounded text-indigo-500 border-zinc-700 h-3.5 w-3.5 opacity-60 cursor-not-allowed" />
                    <span className={`text-xs text-zinc-300 truncate font-semibold ${s.completed ? 'line-through text-slate-500 font-medium' : ''}`}>{s.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Static Log / Comments Section */}
          {task.comments && task.comments.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-zinc-800/60">
              <span className="font-black text-[9px] text-slate-500 uppercase tracking-wider block">Activity Logs / System Notes ({task.comments.length})</span>
              <div className="space-y-2.5">
                {task.comments.map((c) => (
                  <div key={c.id} className="p-3 bg-[#12141c] rounded-xl border border-zinc-800/60 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-black text-zinc-400">{c.authorName}</span>
                      <span className="text-zinc-500 font-mono">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-zinc-300 break-words leading-relaxed">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  const activeProject = projects.find((p) => p.id === task.projectId) || projects[0];
  const activeSections = sections.filter((s) => s.projectId === task.projectId);
  const activeSection = sections.find((s) => s.id === task.sectionId);

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSub = { id: generateId(), title: newSubtaskTitle.trim(), completed: false, priority: Priority.P4 };
    onUpdateTask(task.id, { subtasks: [...task.subtasks, newSub] });
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subId) => {
    const updated = task.subtasks.map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s));
    onUpdateTask(task.id, { subtasks: updated });
  };

  const handleDeleteSubtask = (subId) => {
    const updated = task.subtasks.filter((s) => s.id !== subId);
    onUpdateTask(task.id, { subtasks: updated });
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment = {
      id: generateId(),
      authorName: 'You (eyaSIR329)',
      authorEmail: 'eyaSIR329@gmail.com',
      content: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };

    onUpdateTask(task.id, { comments: [...task.comments, newComment] });
    setNewCommentText('');
  };

  const handleDeleteComment = (commentId) => {
    const updated = task.comments.filter((c) => c.id !== commentId);
    onUpdateTask(task.id, { comments: updated });
  };

  const totalSubs = task.subtasks.length;
  const completedSubs = task.subtasks.filter((s) => s.completed).length;
  const progressPercent = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%', transition: { duration: 0.2 } }}
      className="w-full md:w-[480px] bg-[#141414] border-l border-zinc-800 h-full flex flex-col shadow-2xl z-40 fixed right-0 top-0 select-none"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-b border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: activeProject.color }} />
          <span className="text-xs font-semibold truncate text-zinc-400">{activeProject.name} {activeSection ? `/ ${activeSection.name}` : ''}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => { onUpdateTask(task.id, { isArchived: !task.isArchived }); onClose(); }}
            title={task.isArchived ? 'Unarchive task' : 'Archive task'}
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 cursor-pointer"
          >
            <Archive className="w-4 h-4" />
          </button>

          <button
            onClick={() => { if (confirm('Are you sure you want to delete this task?')) { onDeleteTask(task.id); onClose(); } }}
            title="Delete task"
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-red-400 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-6 bg-zinc-800 mx-1" />

          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div className="space-y-4">
          <textarea
            value={task.title}
            onChange={(e) => onUpdateTask(task.id, { title: e.target.value })}
            placeholder="Step Title"
            rows={2}
            className="w-full text-lg font-bold text-white bg-transparent border-none outline-none focus:ring-0 p-0 resize-none break-words"
          />

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Task Description</label>
            <textarea
              value={task.description}
              onChange={(e) => onUpdateTask(task.id, { description: e.target.value })}
              placeholder="Add more details, links, or instructions..."
              rows={4}
              className="w-full text-xs text-zinc-300 bg-[#1a1a1a] border border-zinc-800 p-2.5 rounded-lg focus:outline-none focus:border-rose-500 focus:bg-zinc-950 transition duration-150"
            />
          </div>
        </div>

        <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-zinc-800 grid grid-cols-2 gap-4 text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Due Date</span>
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input type="date" value={task.dueDate || ''} onChange={(e) => onUpdateTask(task.id, { dueDate: e.target.value || undefined })} className="bg-transparent border-none outline-none text-xs focus:ring-0 cursor-pointer p-0 w-full font-medium [color-scheme:dark]" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Priority</span>
            <div className="flex items-center gap-1.5 font-medium">
              <Flag className={`w-3.5 h-3.5 ${task.priority === Priority.P1 ? 'text-red-500 fill-current' : task.priority === Priority.P2 ? 'text-amber-500 fill-current' : task.priority === Priority.P3 ? 'text-blue-500 fill-current' : 'text-slate-400'}`} />
              <select value={task.priority} onChange={(e) => onUpdateTask(task.id, { priority: Number(e.target.value) })} className="bg-transparent border-none outline-none text-xs focus:ring-0 cursor-pointer p-0 font-medium text-zinc-300 w-full">
                <option value={Priority.P1} className="bg-zinc-900">P1 - Critical</option>
                <option value={Priority.P2} className="bg-zinc-900">P2 - High</option>
                <option value={Priority.P3} className="bg-zinc-900">P3 - Medium</option>
                <option value={Priority.P4} className="bg-zinc-900">P4 - Low</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Project</span>
            <div className="flex items-center gap-1.5 font-medium">
              <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
              <select value={task.projectId} onChange={(e) => onUpdateTask(task.id, { projectId: e.target.value, sectionId: undefined })} className="bg-transparent border-none outline-none text-xs focus:ring-0 cursor-pointer p-0 font-medium text-zinc-300 w-full truncate">
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Section</span>
            <div className="flex items-center gap-1.5 font-medium">
              <GitPullRequest className="w-3.5 h-3.5 text-slate-400" />
              <select value={task.sectionId || ''} onChange={(e) => onUpdateTask(task.id, { sectionId: e.target.value || undefined })} disabled={activeSections.length === 0} className="bg-transparent border-none outline-none text-xs focus:ring-0 cursor-pointer p-0 font-medium text-zinc-300 disabled:opacity-40 w-full">
                <option value="" className="bg-zinc-900">(None)</option>
                {activeSections.map((s) => (
                  <option key={s.id} value={s.id} className="bg-zinc-900">{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-span-2 border-t border-zinc-800 pt-2.5 flex flex-col gap-1.5">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Active Labels</span>
            <div className="flex flex-wrap gap-1.5">
              {labels.map((l) => {
                const isSelected = task.labels.includes(l.name);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      const updated = isSelected ? task.labels.filter((lbl) => lbl !== l.name) : [...task.labels, l.name];
                      onUpdateTask(task.id, { labels: updated });
                    }}
                    className={`px-2 py-1 rounded-md text-[10.5px] font-semibold border transition ${isSelected ? 'bg-rose-950/20 border-rose-300 text-rose-400' : 'bg-[#1a1a1a] border-zinc-800 text-zinc-400 hover:bg-zinc-800 cursor-pointer'}`}
                  >
                    #{l.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-zinc-800 space-y-4 text-xs font-sans">
          <span className="text-[10px] font-bold text-[#cc4b3e] uppercase tracking-wider block border-b border-zinc-800 pb-2">🤝 Collaboration & Productivity Details</span>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Assignee</span>
              <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <select value={task.assignee || ''} onChange={(e) => onUpdateTask(task.id, { assignee: e.target.value || undefined })} className="bg-transparent border-none outline-none text-xs focus:ring-0 cursor-pointer p-0 font-medium text-zinc-300 w-full">
                  <option value="" className="bg-zinc-900">(Unassigned)</option>
                  <option value="You (eyaSIR329)" className="bg-zinc-900">You (eyaSIR329)</option>
                  <option value="Sarah Jenkins" className="bg-zinc-900">Sarah Jenkins</option>
                  <option value="Alex Mercer" className="bg-zinc-900">Alex Mercer</option>
                  <option value="Diana Prince" className="bg-zinc-900">Diana Prince</option>
                  <option value="Michael Chang" className="bg-zinc-900">Michael Chang</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Recurrence</span>
              <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <select value={task.recurrence || 'none'} onChange={(e) => onUpdateTask(task.id, { recurrence: e.target.value === 'none' ? undefined : e.target.value })} className="bg-transparent border-none outline-none text-xs focus:ring-0 cursor-pointer p-0 font-medium text-zinc-300 w-full">
                  <option value="none" className="bg-zinc-900">No Recurrence</option>
                  <option value="daily" className="bg-zinc-900">Daily</option>
                  <option value="weekly" className="bg-zinc-900">Weekly</option>
                  <option value="monthly" className="bg-zinc-900">Monthly</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Set Email / Desktop Reminder</span>
              <div className="flex items-center gap-1.5 text-zinc-300 w-full font-medium">
                <select value={task.reminders || ''} onChange={(e) => onUpdateTask(task.id, { reminders: e.target.value || undefined })} className="bg-transparent border-none outline-none text-xs focus:ring-0 cursor-pointer p-0 font-medium text-zinc-300 w-full">
                  <option value="" className="bg-zinc-900">No Reminders Active</option>
                  <option value="09:00 AM" className="bg-zinc-900">09:00 AM (Morning Catch-up)</option>
                  <option value="12:00 PM" className="bg-zinc-900">12:00 PM (Lunch Break Reminder)</option>
                  <option value="02:00 PM" className="bg-zinc-900">02:00 PM (Afternoon Check-in)</option>
                  <option value="05:00 PM" className="bg-zinc-900">05:00 PM (EOD Wrap-up)</option>
                  <option value="09:00 PM" className="bg-zinc-900">09:00 PM (Night Review)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1 col-span-2 border-t border-zinc-800 pt-2.5">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Dependency Predecessor (Preceding Blocker)</span>
              <div className="flex items-center gap-1.5 text-zinc-300 w-full font-medium">
                <GitPullRequest className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={task.dependencies?.[0] || ''}
                  onChange={(e) => { const depVal = e.target.value; onUpdateTask(task.id, { dependencies: depVal ? [depVal] : [] }); }}
                  className="bg-transparent border-none outline-none text-xs focus:ring-0 cursor-pointer p-0 font-medium text-zinc-300 w-full truncate"
                >
                  <option value="" className="bg-zinc-900">No Active Blocker Reference</option>
                  {allTasks.filter((t) => t.id !== task.id && !t.completed).map((t) => (
                    <option key={t.id} value={t.id} className="bg-zinc-900">{t.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-zinc-800 space-y-3 text-xs w-full">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" /> File Attachments ({task.attachments?.length || 0})
            </span>
          </div>

          <div className="space-y-1.5">
            {task.attachments && task.attachments.length > 0 ? (
              task.attachments.map((att) => (
                <div key={att.id} className="flex items-center justify-between p-2 rounded-lg bg-[#141414] border border-zinc-850 group">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-xs truncate font-medium max-w-[200px] text-zinc-300">{att.name}</span>
                    <span className="text-[9.5px] text-slate-400 shrink-0 font-mono">({att.size})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { const updated = (task.attachments || []).filter((a) => a.id !== att.id); onUpdateTask(task.id, { attachments: updated }); }}
                    className="p-1 hover:bg-zinc-800 rounded text-slate-400 hover:text-red-500 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <span className="text-slate-400 text-[10px] block py-1.5 text-center">No uploaded documents. Secure upload is active.</span>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-1.5 border-t border-zinc-850">
            <div className="flex gap-1.5">
              <input
                type="text"
                id="attachment-name-input"
                placeholder="e.g. Migration_Blueprint.pdf..."
                className="flex-1 text-[11px] px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:border-rose-500 text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = e.currentTarget.value.trim();
                    if (!val) return;
                    const newAtt = { id: 'att_' + generateId(), name: val, url: '#', size: `${(Math.random() * 4.5 + 0.5).toFixed(1)} MB` };
                    onUpdateTask(task.id, { attachments: [...(task.attachments || []), newAtt] });
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const inputEl = document.getElementById('attachment-name-input');
                  if (inputEl && inputEl.value.trim()) {
                    const newAtt = { id: 'att_' + generateId(), name: inputEl.value.trim(), url: '#', size: `${(Math.random() * 4.5 + 0.5).toFixed(1)} MB` };
                    onUpdateTask(task.id, { attachments: [...(task.attachments || []), newAtt] });
                    inputEl.value = '';
                  }
                }}
                className="px-3 py-1.5 bg-[#cc4b3e] hover:bg-[#b03d32] text-white font-medium rounded-lg transition text-xs whitespace-nowrap cursor-pointer"
              >
                Upload File
              </button>
            </div>
            <p className="text-[9.5px] text-zinc-500 text-center">Supports PDF, PNGs, Figma or Keynote resources up to 25MB.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-zinc-500" />
              <span className="font-bold text-xs text-zinc-300 uppercase tracking-wider">Subtasks ({completedSubs}/{totalSubs})</span>
            </div>
            {totalSubs > 0 && <span className="text-[11px] font-mono text-slate-400">{progressPercent}% done</span>}
          </div>

          {totalSubs > 0 && (
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-[#cc4b3e] transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          )}

          <div className="space-y-1">
            {task.subtasks.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-[#191919] border border-zinc-850 group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <input type="checkbox" checked={s.completed} onChange={() => handleToggleSubtask(s.id)} className="rounded text-rose-500 border-zinc-700 focus:ring-rose-500 h-3.5 w-3.5 cursor-pointer" />
                  <span className={`text-xs text-zinc-300 truncate ${s.completed ? 'line-through text-slate-400' : ''}`}>{s.title}</span>
                </div>
                <button type="button" onClick={() => handleDeleteSubtask(s.id)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-zinc-800 rounded-md text-slate-400 hover:text-red-500 transition cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddSubtask} className="flex gap-2">
            <input type="text" value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} placeholder="Add list subtask..." className="flex-1 text-xs px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:border-rose-500 text-white" />
            <button type="submit" disabled={!newSubtaskTitle.trim()} className="px-3 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 disabled:opacity-40 rounded-md cursor-pointer transition text-zinc-200 flex items-center">
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="space-y-4 pt-3 border-t border-zinc-850">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-zinc-500" />
            <span className="font-bold text-xs text-zinc-300 uppercase tracking-wider">Timeline / Comments ({task.comments.length})</span>
          </div>

          <form onSubmit={handleAddComment} className="flex flex-col gap-2">
            <textarea value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} placeholder="Type message log or feedback note..." rows={2} className="w-full text-xs p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-rose-500 text-white resize-none" />
            <button type="submit" disabled={!newCommentText.trim()} className="self-end px-3.5 py-1.5 bg-[#cc4b3e] hover:bg-[#b03d32] text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm disabled:opacity-40 cursor-pointer transition">
              <span>Comment</span>
              <Send className="w-3 h-3" />
            </button>
          </form>

          <div className="space-y-3 pt-2">
            {task.comments.map((c) => (
              <div key={c.id} className="flex flex-col gap-1 p-3 bg-[#1a1a1a] rounded-xl border border-zinc-850 relative group/comment">
                <div className="flex justify-between items-center text-[10.5px]">
                  <span className="font-bold text-zinc-300 truncate max-w-36">{c.authorName}</span>
                  <div className="flex items-center gap-1 text-[#aaa]">
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    <button type="button" onClick={() => handleDeleteComment(c.id)} className="opacity-0 group-hover/comment:opacity-100 hover:text-red-500 p-0.5 transition rounded" title="Delete comment">
                      <X className="w-2.5 h-2.5 cursor-pointer" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 break-words leading-relaxed">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
