'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CodePlayground from '@/app/_components/ui/CodePlayground';

// ── Starter templates per language ───────────────────────────────────────────
const STARTER_TEMPLATES = {
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n',
  python: '# Write your Python code here\nprint("Hello, World!")\n',
  javascript:
    '// Write your JavaScript code here\nconsole.log("Hello, World!");\n',
  typescript:
    '// Write your TypeScript code here\nconst greeting: string = "Hello, World!";\nconsole.log(greeting);\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n',
  rust: 'fn main() {\n    println!("Hello, World!");\n}\n',
  php: '<?php\necho "Hello, World!\\n";\n?>\n',
  csharp:
    'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}\n',
  ruby: '# Write your Ruby code here\nputs "Hello, World!"\n',
};

const EXECUTABLE_LANGUAGES = new Set([
  'c',
  'cpp',
  'csharp',
  'go',
  'java',
  'javascript',
  'php',
  'python',
  'ruby',
  'rust',
  'typescript',
]);

const LANGUAGE_LABELS = {
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  go: 'Go',
  java: 'Java',
  javascript: 'JavaScript',
  php: 'PHP',
  python: 'Python',
  ruby: 'Ruby',
  rust: 'Rust',
  typescript: 'TypeScript',
};

function normalizeCodeLanguage(language) {
  const normalized = String(language || '')
    .trim()
    .toLowerCase();
  const aliases = {
    c: 'c',
    cpp: 'cpp',
    'c++': 'cpp',
    cplusplus: 'cpp',
    csharp: 'csharp',
    cs: 'csharp',
    go: 'go',
    golang: 'go',
    java: 'java',
    javascript: 'javascript',
    js: 'javascript',
    php: 'php',
    py: 'python',
    python: 'python',
    rb: 'ruby',
    ruby: 'ruby',
    rs: 'rust',
    rust: 'rust',
    ts: 'typescript',
    typescript: 'typescript',
  };
  return aliases[normalized] || normalized;
}

function canExecuteLanguage(language) {
  return EXECUTABLE_LANGUAGES.has(normalizeCodeLanguage(language));
}

function getCodeLanguageLabel(language) {
  const normalized = normalizeCodeLanguage(language);
  return LANGUAGE_LABELS[normalized] || normalized || 'Code';
}

// ── localStorage helpers ─────────────────────────────────────────────────────
const STORAGE_KEY = 'neupc-code-runner';

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(language, code, stdin) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ language, code, stdin, ts: Date.now() })
    );
  } catch {
    /* quota exceeded — ignore */
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CodeRunnerClient({ isOpen = true, onClose }) {
  const router = useRouter();
  const saveTimer = useRef(null);

  // Initialise from localStorage or defaults
  const [runnerState, setRunnerState] = useState(() => {
    const saved = loadSaved();
    const lang = saved?.language || 'cpp';
    const code = saved?.code || STARTER_TEMPLATES[lang] || '';
    return {
      isOpen: false, // overridden dynamically by prop
      blockIndex: null,
      language: lang,
      originalCode: STARTER_TEMPLATES[lang] || '',
      draftCode: code,
      stdin: saved?.stdin || '',
    };
  });

  const [runnerResult, setRunnerResult] = useState(null);
  const [runnerError, setRunnerError] = useState('');
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatError, setFormatError] = useState('');
  const [execTime, setExecTime] = useState(null); // ms

  // ── Auto-save to localStorage (debounced) ──────────────────────────────────
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveState(runnerState.language, runnerState.draftCode, runnerState.stdin);
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [runnerState.language, runnerState.draftCode, runnerState.stdin]);

  // ── Close → navigate back ──────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      router.push('/account/member');
    }
  }, [router, onClose]);

  // ── Execute code ───────────────────────────────────────────────────────────
  const handleRunnerExecute = useCallback(async () => {
    const language = normalizeCodeLanguage(runnerState.language);
    if (!canExecuteLanguage(language)) {
      setRunnerError('This language is not supported by the online runner.');
      return;
    }
    if (!runnerState.draftCode.trim()) {
      setRunnerError('Add some code before running.');
      return;
    }
    setIsRunningCode(true);
    setRunnerError('');
    setRunnerResult(null);
    setExecTime(null);
    const t0 = performance.now();
    try {
      const response = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code: runnerState.draftCode,
          stdin: runnerState.stdin,
        }),
      });
      const data = await response.json();
      setExecTime(Math.round(performance.now() - t0));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to execute code.');
      }
      setRunnerResult(data?.result || null);
    } catch (error) {
      setExecTime(Math.round(performance.now() - t0));
      setRunnerError(error?.message || 'Failed to execute code.');
    } finally {
      setIsRunningCode(false);
    }
  }, [runnerState.draftCode, runnerState.language, runnerState.stdin]);

  // ── Format code ────────────────────────────────────────────────────────────
  const handleFormat = useCallback(async () => {
    if (!runnerState.draftCode.trim()) return;
    setIsFormatting(true);
    setFormatError('');
    try {
      const res = await fetch('/api/code/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: runnerState.draftCode,
          language: runnerState.language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Format failed.');
      }
      setRunnerState((prev) => ({ ...prev, draftCode: data.formatted }));
    } catch (err) {
      setFormatError(err?.message || 'Could not format code.');
    } finally {
      setIsFormatting(false);
    }
  }, [runnerState.draftCode, runnerState.language]);

  return (
    <CodePlayground
      state={{ ...runnerState, isOpen }}
      result={runnerResult}
      error={runnerError}
      formatError={formatError}
      isRunning={isRunningCode}
      isFormatting={isFormatting}
      execTime={execTime}
      onClose={handleClose}
      onRun={handleRunnerExecute}
      onFormat={handleFormat}
      onDraftChange={(value) =>
        setRunnerState((prev) => ({ ...prev, draftCode: value }))
      }
      onStdinChange={(value) =>
        setRunnerState((prev) => ({ ...prev, stdin: value }))
      }
      onReset={() => {
        setRunnerState((prev) => ({
          ...prev,
          draftCode: prev.originalCode,
          stdin: '',
        }));
        setRunnerResult(null);
        setRunnerError('');
        setExecTime(null);
      }}
      onLanguageChange={(lang) =>
        setRunnerState((prev) => {
          const template = STARTER_TEMPLATES[lang] || '';
          const currentTrimmed = prev.draftCode.trim();
          const originalTrimmed = prev.originalCode.trim();
          const shouldLoadTemplate =
            !currentTrimmed || currentTrimmed === originalTrimmed;
          return {
            ...prev,
            language: lang,
            originalCode: template,
            draftCode: shouldLoadTemplate ? template : prev.draftCode,
          };
        })
      }
      getLanguageLabel={getCodeLanguageLabel}
    />
  );
}
