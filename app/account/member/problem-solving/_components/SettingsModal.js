/**
 * @file Problem-solving settings modal.
 * @module SettingsModal
 */

'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';

function SettingsModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="w-full max-w-[500px] overflow-hidden rounded-2xl border border-[#222228] bg-[#111114] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#222228] bg-[#16161a] p-5">
          <h3 className="font-semibold text-white">Settings & Tweaks</h3>
          <button
            onClick={onClose}
            className="text-[#64748b] transition-colors hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex max-h-[60vh] flex-col gap-6 overflow-y-auto p-5">
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold tracking-widest text-[#64748b] uppercase">
              Display
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#e2e8f0]">
                Density
              </span>
              <div className="flex rounded-lg border border-[#222228] bg-[#0a0a0b] p-1">
                <button className="rounded-md bg-[#222228] px-3 py-1 text-xs font-semibold text-white">
                  Comfortable
                </button>
                <button className="rounded-md px-3 py-1 text-xs font-medium text-[#64748b] hover:text-[#e2e8f0]">
                  Compact
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold tracking-widest text-[#64748b] uppercase">
              Color
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#e2e8f0]">
                Heatmap palette
              </span>
              <select className="rounded-lg border border-[#222228] bg-[#0a0a0b] px-3 py-1.5 text-sm text-white outline-none focus:border-[#334155]">
                <option>Green</option>
                <option>Blue</option>
                <option>Warm</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// =====================================================================
// Difficulty donut
// =====================================================================

export { SettingsModal };
