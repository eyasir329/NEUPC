/**
 * @file Position modal component
 * @module PositionModal
 */

import { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { committeeAccent } from './accent';

export default function PositionModal({
  type,
  position,
  onClose,
  onCreate,
  onUpdate,
  isLoading,
  accent,
}) {
  const a = committeeAccent(accent);

  const [formData, setFormData] = useState({
    title: position?.title || '',
    category: position?.category || 'executive',
    rank: position?.rank || '',
    display_order: position?.display_order || '0',
    responsibilities: position?.responsibilities || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = new FormData();

    if (type === 'edit' && position?.id) {
      form.append('id', position.id);
      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, value);
      });
      onUpdate(form);
    } else {
      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, value);
      });
      onCreate(form);
    }
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="animate-in fade-in zoom-in-95 w-full max-w-md overflow-hidden rounded-2xl border border-white/8 bg-gray-900/90 shadow-2xl backdrop-blur-lg duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 bg-white/3 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white">
              {type === 'create'
                ? 'Create Committee Position'
                : 'Edit Position'}
            </h2>
            <p className={`mt-1 font-mono text-[11px] ${a.monoText}`}>
              {type === 'create'
                ? '// Add a new role definition'
                : `// Editing role: ${position?.title}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/6 bg-white/2 text-gray-400 transition-all hover:bg-white/8 hover:text-white active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400 uppercase select-none">
              Position Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., President, Tech Lead, Public Relations"
              className={`w-full rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 transition-all outline-none ${a.inputFocus}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400 uppercase select-none">
                Category <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full cursor-pointer appearance-none rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5 font-sans text-sm text-white transition-all outline-none ${a.selectFocus}`}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="executive">Executive</option>
                  <option value="mentor">Mentor</option>
                  <option value="advisor">Advisor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400 uppercase select-none">
                Rank Index
              </label>
              <input
                type="number"
                name="rank"
                value={formData.rank}
                onChange={handleChange}
                placeholder="Optional rank index"
                className={`w-full rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 transition-all outline-none ${a.inputFocus}`}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400 uppercase select-none">
              Display Sequence Order
            </label>
            <input
              type="number"
              name="display_order"
              value={formData.display_order}
              onChange={handleChange}
              placeholder="e.g. 0, 1, 2 for sorting"
              className={`w-full rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 transition-all outline-none ${a.inputFocus}`}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400 uppercase select-none">
              Role Responsibilities
            </label>
            <textarea
              name="responsibilities"
              value={formData.responsibilities}
              onChange={handleChange}
              rows={3}
              placeholder="Specify the key responsibilities of this role..."
              className={`w-full resize-none rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 transition-all outline-none ${a.inputFocus}`}
            />
          </div>

          {/* Actions */}
          <div className="mt-2 flex gap-3 border-t border-white/8 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/8 bg-white/5 py-2.5 text-xs font-semibold text-gray-300 transition-all hover:bg-white/10 hover:text-white active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl ${a.submitButton} py-2.5 text-xs font-semibold text-white transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50`}
            >
              {isLoading && <Loader className="h-3.5 w-3.5 animate-spin" />}
              {type === 'create' ? 'Create Position' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
