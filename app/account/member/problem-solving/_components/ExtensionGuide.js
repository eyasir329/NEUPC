'use client';

import { useState, useEffect } from 'react';
import {
  Chrome,
  Download,
  Key,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

const SUPPORTED_PLATFORMS = [
  'LeetCode', 'SPOJ', 'Toph', 'CSES', 'HackerRank', 'Kattis',
  'UVa', 'LightOJ', 'VJudge', 'Codeforces', 'AtCoder', 'CodeChef', '+30 more',
];

const STEPS = [
  {
    id: 'install',
    label: 'Install',
    icon: Download,
    title: 'Load the Extension',
    chrome: [
      'Go to chrome://extensions/ in your browser',
      'Enable "Developer mode" (top-right toggle)',
      'Click "Load unpacked" and select the browser-extension folder',
      'The NEUPC icon should appear in your toolbar',
    ],
    firefox: [
      'Go to about:debugging#/runtime/this-firefox',
      'Click "Load Temporary Add-on…"',
      'Select the manifest.json inside the browser-extension folder',
      'The NEUPC icon should appear in your toolbar',
    ],
  },
  {
    id: 'configure',
    label: 'Configure',
    icon: Key,
    title: 'Connect Your Account',
    chrome: [
      'Click the NEUPC extension icon in your toolbar',
      'Set API Endpoint: http://localhost:3000',
      'Copy your Extension Token from below and paste it in',
      'Click "Save Settings" then "Test Connection"',
    ],
    firefox: [
      'Click the NEUPC extension icon in your toolbar',
      'Set API Endpoint: http://localhost:3000',
      'Copy your Extension Token from below and paste it in',
      'Click "Save Settings" then "Test Connection"',
    ],
  },
  {
    id: 'sync',
    label: 'Sync',
    icon: Zap,
    title: 'Start Capturing',
    chrome: [
      'Enable "Auto-sync on AC" in the extension popup',
      'Submit a solution on any supported platform',
      'On Accepted verdict, the extension syncs it automatically',
      'Use "Bulk Import" to pull all your past submissions',
    ],
    firefox: [
      'Enable "Auto-sync on AC" in the extension popup',
      'Submit a solution on any supported platform',
      'On Accepted verdict, the extension syncs it automatically',
      'Use "Bulk Import" to pull all your past submissions',
    ],
  },
];

export default function ExtensionGuide() {
  const [activeStep, setActiveStep] = useState(0);
  const [browser, setBrowser] = useState('chrome');
  const [token, setToken] = useState(null);
  const [showToken, setShowToken] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = (navigator?.userAgent || '').toLowerCase();
    if (ua.includes('firefox')) setBrowser('firefox');
    loadToken();
  }, []);

  async function loadToken() {
    try {
      setTokenLoading(true);
      const res = await fetch('/api/problem-solving/extension-token');
      const data = await res.json();
      if (data?.success && data?.data?.extensionToken) {
        setToken(data.data.extensionToken);
      }
    } catch {
      // silent
    } finally {
      setTokenLoading(false);
    }
  }

  async function generateToken() {
    try {
      setTokenLoading(true);
      setTokenError(null);
      const res = await fetch('/api/problem-solving/extension-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate: !!token }),
      });
      const data = await res.json();
      if (data?.success) {
        setToken(data.data.extensionToken);
        setShowToken(true);
      } else {
        setTokenError(data.error || 'Failed to generate token');
      }
    } catch {
      setTokenError('Network error');
    } finally {
      setTokenLoading(false);
    }
  }

  function copyToken() {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const step = STEPS[activeStep];
  const instructions = step[browser] || step.chrome;

  return (
    <div className="flex flex-col gap-5">
      {/* Browser toggle */}
      <div className="flex gap-1 rounded-xl border border-white/6 bg-white/2 p-1">
        {[
          { id: 'chrome', label: 'Chrome / Edge' },
          { id: 'firefox', label: 'Firefox' },
        ].map((b) => (
          <button
            key={b.id}
            onClick={() => setBrowser(b.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              browser === b.id
                ? 'bg-violet-500/20 text-violet-300 shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Chrome className="h-3.5 w-3.5" />
            {b.label}
          </button>
        ))}
      </div>

      {/* Step progress */}
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === activeStep;
          const isDone = i < activeStep;
          return (
            <div key={s.id} className="flex flex-1 items-center">
              <button
                onClick={() => setActiveStep(i)}
                className={`flex flex-1 flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 text-center transition-all ${
                  isActive ? 'bg-violet-500/10' : 'hover:bg-white/3'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                    isDone
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : isActive
                        ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                        : 'border-white/10 bg-white/3 text-gray-600'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    isActive
                      ? 'text-violet-300'
                      : isDone
                        ? 'text-emerald-400'
                        : 'text-gray-600'
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-4 shrink-0 transition-colors ${
                    i < activeStep ? 'bg-emerald-500/30' : 'bg-white/6'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-white/6 bg-white/2 p-4">
        <p className="mb-3 text-xs font-semibold text-gray-300">{step.title}</p>
        <ul className="space-y-2.5">
          {instructions.map((line, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[9px] font-bold text-violet-400">
                {i + 1}
              </span>
              <span className="text-xs leading-relaxed text-gray-400">{line}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-between">
          <button
            onClick={() => setActiveStep((p) => Math.max(0, p - 1))}
            disabled={activeStep === 0}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-white/4 hover:text-gray-300 disabled:opacity-30"
          >
            ← Back
          </button>
          {activeStep < STEPS.length - 1 ? (
            <button
              onClick={() => setActiveStep((p) => p + 1)}
              className="flex items-center gap-1 rounded-lg bg-violet-500/20 px-3 py-1.5 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/30"
            >
              Next <ChevronRight className="h-3 w-3" />
            </button>
          ) : (
            <span className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Done
            </span>
          )}
        </div>
      </div>

      {/* Token section */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="mb-2.5 flex items-center gap-2">
          <Key className="h-3.5 w-3.5 text-amber-400" />
          <p className="text-xs font-semibold text-amber-300">Extension Token</p>
          <span className="ml-auto text-[10px] text-gray-600">needed for Step 2</span>
        </div>

        {tokenError && (
          <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {tokenError}
          </div>
        )}

        {token ? (
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center rounded-lg border border-white/8 bg-black/30 px-3 py-2 font-mono text-xs">
              <span className="flex-1 overflow-hidden text-ellipsis text-gray-300">
                {showToken ? token : '••••••••••••••••••••••••••••••••'}
              </span>
            </div>
            <button
              onClick={() => setShowToken((v) => !v)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/3 text-gray-500 transition-colors hover:text-gray-300"
            >
              {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={copyToken}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/3 text-gray-500 transition-colors hover:text-gray-300"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={generateToken}
              disabled={tokenLoading}
              title="Regenerate token (invalidates current)"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/3 text-gray-500 transition-colors hover:text-red-400 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${tokenLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        ) : (
          <button
            onClick={generateToken}
            disabled={tokenLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500/15 py-2.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/25 disabled:opacity-50"
          >
            {tokenLoading ? (
              <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating…</>
            ) : (
              <><Key className="h-3.5 w-3.5" /> Generate Token</>
            )}
          </button>
        )}
      </div>

      {/* Supported platforms */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
          Supported Platforms
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SUPPORTED_PLATFORMS.map((p) => (
            <span
              key={p}
              className="rounded-full border border-white/6 bg-white/2 px-2.5 py-0.5 text-[10px] font-medium text-gray-500"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
