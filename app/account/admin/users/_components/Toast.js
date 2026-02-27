import { X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Toast({ message, type, onClose }) {
  return (
    <div
      className={`fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl backdrop-blur-xl transition-all ${
        type === 'success'
          ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
          : 'border-red-500/30 bg-red-500/15 text-red-300'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle2 className="h-5 w-5 shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 shrink-0" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
