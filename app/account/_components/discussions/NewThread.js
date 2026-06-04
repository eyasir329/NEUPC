/**
 * @file New-thread composer for the Help Desk: title, category (role-scoped),
 *   optional bootcamp link and content.
 *
 * @module NewThread
 */

'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function NewThread({
  onBack,
  onSubmit,
  bootcamps = [],
  allowedCategories = ['Help', 'Discussion', 'Feature Request'],
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState(allowedCategories[0] || 'Help');
  const [bootcampId, setBootcampId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting) return;
    if (tag === 'Discussion' && !bootcampId) return;
    setIsSubmitting(true);
    await onSubmit({
      title: title.trim(),
      content: content.trim(),
      tag,
      bootcampId: tag === 'Discussion' ? bootcampId : null,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto flex max-w-3xl flex-col gap-6 duration-500">
      <button
        onClick={onBack}
        className="group flex w-fit items-center gap-2 text-sm text-gray-400 transition-colors hover:text-gray-200"
      >
        <ArrowLeft
          size={16}
          className="transition-transform group-hover:-translate-x-1"
        />
        Back to discussions
      </button>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-sm sm:p-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Create a new thread
        </h1>
        <p className="mb-8 text-sm text-gray-400">
          Start a new discussion, ask a question, or share something with the
          community.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How to structure a large React application?"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-gray-200 shadow-sm transition-all placeholder:text-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Category
            </label>
            <div className="mb-4 flex flex-wrap gap-3">
              {allowedCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTag(cat)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                    tag === cat
                      ? 'border-violet-500/50 bg-violet-500/20 text-violet-300'
                      : 'border-white/[0.08] bg-white/[0.02] text-gray-400 hover:border-gray-600 hover:text-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {tag === 'Discussion' && (
              <div className="animate-in fade-in slide-in-from-top-2 border-white/[0.14]/50 mt-4 rounded-xl border bg-gray-800/30 p-4 duration-300">
                <label
                  htmlFor="bootcamp"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Related Bootcamp
                </label>
                <select
                  id="bootcamp"
                  value={bootcampId}
                  onChange={(e) => setBootcampId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-gray-200 shadow-sm transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                >
                  <option value="">Select a bootcamp…</option>
                  {bootcamps.map((e) => {
                    const b = e.bootcamps || e;
                    if (!b || !b.id) return null;
                    return (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="content"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your issue or share your thoughts here..."
              rows={8}
              className="min-h-[150px] w-full resize-y rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-gray-200 shadow-sm transition-all placeholder:text-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
              required
            />
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-white/[0.06] pt-4">
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !title.trim() ||
                !content.trim() ||
                isSubmitting ||
                (tag === 'Discussion' && !bootcampId)
              }
              className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition-all hover:bg-violet-500 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0d1117] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Posting…' : 'Post Thread'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
