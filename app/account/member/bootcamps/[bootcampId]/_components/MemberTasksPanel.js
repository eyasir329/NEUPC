/**
 * @file Member task list, submission form, and attachments.
 * @module MemberTasksPanel
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronRight, Download, Loader2, Paperclip, Send, Trash2, Upload } from 'lucide-react';
import { getMemberBootcampTasks, submitTaskAction, uploadTaskAttachmentAction } from '@/app/_lib/actions/bootcamp-actions';
import { MultiBlockEditor, PanelEmpty, PanelLoader, TaskDescriptionRenderer } from './learning-shared';

const DIFF_COLOR = {
  easy: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',
  hard: 'text-rose-400 bg-rose-500/10 ring-rose-500/20',
};

const STATUS_STYLE = {
  pending: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',
  completed: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
  accepted: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
  late: 'text-rose-400 bg-rose-500/10 ring-rose-500/20',
  'redo action required': 'text-orange-400 bg-orange-500/10 ring-orange-500/20',
  'bonus deserved': 'text-violet-400 bg-violet-500/10 ring-violet-500/20',
};

function formatBytes(b) {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function resolveAttachmentUrl(url) {
  if (!url) return url;
  const m = url.match(/^\/api\/image\/([a-zA-Z0-9_-]+)$/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/view`;
  return url;
}

function AttachmentList({ files, onRemove }) {
  if (!files?.length) return null;
  return (
    <ul className="space-y-1.5">
      {files.map((f, i) => (
        <li
          key={i}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5"
        >
          <Paperclip className="h-3 w-3 shrink-0 text-violet-400" />
          <a
            href={resolveAttachmentUrl(f.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate text-[12px] text-violet-300 hover:underline"
          >
            {f.name || `Attachment ${i + 1}`}
          </a>
          {f.size && (
            <span className="text-[10px] text-gray-500 tabular-nums">
              {formatBytes(f.size)}
            </span>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="rounded p-0.5 text-gray-500 hover:bg-white/5 hover:text-rose-400"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function TaskSubmitForm({ task, onSubmitted, isArchived = false }) {
  const [content, setContent] = useState(
    () =>
      task.mySubmission?.notes ||
      JSON.stringify([
        { id: crypto.randomUUID(), type: 'richText', content: '' },
      ])
  );
  const [attachments, setAttachments] = useState(() =>
    Array.isArray(task.mySubmission?.attachments)
      ? task.mySubmission.attachments
      : []
  );
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const isRedo = task.mySubmission?.status === 'redo action required';
  const canSubmit = (!task.mySubmission || isRedo) && !isArchived;

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setError('');
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadTaskAttachmentAction(fd);
      if (res.error) {
        setError(res.error);
        continue;
      }
      uploaded.push({
        url: res.url,
        name: res.name,
        size: res.size,
        type: res.type,
      });
    }
    setAttachments((prev) => [...prev, ...uploaded]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData();
    fd.set('task_id', task.id);
    fd.set('submission_url', '');
    fd.set('notes', content);
    fd.set('attachments', JSON.stringify(attachments));
    const result = await submitTaskAction(fd);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSubmitted(task.id, result.data);
  };

  if (!canSubmit) return null;

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3">
      <div>
        <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
          Your Submission
        </label>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <MultiBlockEditor value={content} onChange={setContent} />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
          Attachments
        </label>
        <AttachmentList
          files={attachments}
          onRemove={(i) =>
            setAttachments((prev) => prev.filter((_, j) => j !== i))
          }
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFiles(Array.from(e.target.files || []))}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mt-2 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-gray-300 transition hover:bg-white/10 disabled:opacity-40"
        >
          {uploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Upload className="h-3 w-3" />
          )}
          {uploading ? 'Uploading…' : 'Add files'}
        </button>
      </div>
      {error && <p className="text-[11px] text-rose-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || uploading}
        className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-1.5 text-[12px] font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40"
      >
        <Send className="h-3 w-3" />
        {loading ? 'Submitting…' : isRedo ? 'Resubmit' : 'Submit'}
      </button>
    </form>
  );
}

function MemberTasksPanel({ bootcampId, isArchived = false }) {
  const [tasks, setTasks] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!bootcampId) return;
    getMemberBootcampTasks(bootcampId)
      .then(setTasks)
      .catch(() => setTasks([]));
  }, [bootcampId]);

  const handleSubmitted = useCallback((taskId, submissionData) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, mySubmission: submissionData } : t
      )
    );
  }, []);

  if (tasks === null) return <PanelLoader />;
  if (tasks.length === 0)
    return <PanelEmpty message="No tasks assigned yet." />;

  return (
    <div className="space-y-2">
      {isArchived && (
        <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3 text-[12.5px] leading-normal font-medium text-amber-300 shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            This bootcamp is archived. Task submissions and modifications are
            disabled.
          </span>
        </div>
      )}
      {tasks.map((task) => {
        const sub = task.mySubmission;
        const isExpanded = expanded === task.id;
        const isPastDue = task.deadline && new Date(task.deadline) < new Date();

        return (
          <div
            key={task.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-lg shadow-black/20 backdrop-blur-xl transition-colors hover:border-white/20"
          >
            <button
              className="flex w-full items-center gap-3 p-4 text-left"
              onClick={() => setExpanded(isExpanded ? null : task.id)}
            >
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ${DIFF_COLOR[task.difficulty] ?? 'bg-white/5 text-gray-400 ring-white/10'}`}
              >
                {task.difficulty}
              </span>
              <span className="flex-1 truncate text-[13px] font-medium text-white">
                {task.title}
              </span>
              {task.points != null && (
                <span className="shrink-0 text-[10px] font-bold text-amber-400">
                  {task.points} pts
                </span>
              )}
              {task.deadline && (
                <span
                  className={`shrink-0 text-[11px] ${isPastDue && !sub ? 'text-rose-400' : 'text-gray-500'}`}
                >
                  {new Date(task.deadline).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
              {sub ? (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ${STATUS_STYLE[sub.status] ?? 'bg-white/5 text-gray-400 ring-white/10'}`}
                >
                  {sub.status}
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold text-gray-500 ring-1 ring-white/10">
                  not submitted
                </span>
              )}
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
              )}
            </button>

            {isExpanded && (
              <div className="space-y-3 border-t border-white/10 px-4 pt-3 pb-4">
                {task.description && (
                  <TaskDescriptionRenderer content={task.description} />
                )}
                {Array.isArray(task.problem_links) &&
                  task.problem_links.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {task.problem_links.map((link, i) => (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] text-violet-400 hover:bg-violet-500/20"
                        >
                          <Download className="h-3 w-3" />
                          Problem {i + 1}
                        </a>
                      ))}
                    </div>
                  )}

                {/* Existing submission status */}
                {sub && (
                  <div className="space-y-1.5 rounded-lg border border-white/10 bg-white/2 p-3">
                    <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                      Your Submission
                    </p>
                    {sub.notes && (
                      <TaskDescriptionRenderer content={sub.notes} />
                    )}
                    {Array.isArray(sub.attachments) &&
                      sub.attachments.length > 0 && (
                        <AttachmentList files={sub.attachments} />
                      )}
                    {sub.points_earned != null && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                          Points:
                        </span>
                        <span className="text-[12px] font-bold text-amber-300 tabular-nums">
                          {sub.points_earned}
                          {task.points != null ? ` / ${task.points}` : ''}
                        </span>
                      </div>
                    )}
                    {sub.feedback && (
                      <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-2">
                        <p className="mb-0.5 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                          Mentor Feedback
                        </p>
                        <p className="text-[12px] text-gray-300">
                          {sub.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {isArchived ? (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2.5 text-[12px] leading-relaxed font-medium text-amber-300">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <span>
                      This bootcamp is archived. Task submissions and edits are
                      disabled.
                    </span>
                  </div>
                ) : (
                  <TaskSubmitForm
                    task={task}
                    onSubmitted={handleSubmitted}
                    isArchived={isArchived}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


export { MemberTasksPanel, AttachmentList };
