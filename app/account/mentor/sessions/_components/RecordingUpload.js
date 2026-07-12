/**
 * @file Session recording upload widget.
 * @module RecordingUpload
 */

'use client';

import { uploadSessionRecordingAction } from '@/app/_lib/actions/mentor-actions';
import { ExternalLink, Film, Loader2, Upload } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

function RecordingUpload({
  sessionId,
  initialUrl,
  onUploaded,
  readOnly = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState(initialUrl || null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.set('sessionId', sessionId);
    fd.set('recording', file);
    const result = await uploadSessionRecordingAction(fd);
    if (result?.error) {
      toast.error(result.error);
    } else {
      setRecordingUrl(result.recordingUrl);
      onUploaded?.(result.recordingUrl);
      toast.success('Recording archived to Drive successfully!');
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {recordingUrl ? (
        <a
          href={recordingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-violet-650 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white shadow-md shadow-violet-500/15 transition-all hover:scale-102 hover:bg-violet-600"
        >
          <Film className="h-3.5 w-3.5" />
          View Recording
          <ExternalLink className="h-3 w-3 opacity-70" />
        </a>
      ) : readOnly ? (
        <span className="text-gray-555 text-[10px] italic">
          No recording uploaded
        </span>
      ) : null}
      {!readOnly && (
        <label
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors ${
            uploading
              ? 'cursor-not-allowed border-white/10 bg-white/2 text-gray-500'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" />
              {recordingUrl ? 'Replace video' : 'Upload MP4'}
            </>
          )}
          <input
            type="file"
            accept="video/*"
            className="sr-only"
            disabled={uploading}
            onChange={handleFile}
          />
        </label>
      )}
    </div>
  );
}

export { RecordingUpload };
