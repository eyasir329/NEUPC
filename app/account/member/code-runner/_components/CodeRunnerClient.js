'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import CodePlayground from '@/app/_components/ui/CodePlayground';

const STARTER_TEMPLATES = {
  c: `#include <stdio.h>\n\nint main() {\n    // Your first C program — try changing the message!\n    printf("Hello, World!\\n");\n    return 0;\n}\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your first C++ program — try changing the message!\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n`,
  python: `# Your first Python program — try changing the message!\nprint("Hello, World!")\n`,
  javascript: `// Your first JavaScript program — try changing the message!\nconsole.log("Hello, World!");\n`,
  typescript: `// Your first TypeScript program — try changing the message!\nconst greeting: string = "Hello, World!";\nconsole.log(greeting);\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        // Your first Java program — try changing the message!\n        System.out.println("Hello, World!");\n    }\n}\n`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    // Your first Go program — try changing the message!\n    fmt.Println("Hello, World!")\n}\n`,
  rust: `fn main() {\n    // Your first Rust program — try changing the message!\n    println!("Hello, World!");\n}\n`,
  php: `<?php\n// Your first PHP program — try changing the message!\necho "Hello, World!\\n";\n?>\n`,
  csharp: `using System;\n\nclass Program {\n    static void Main() {\n        // Your first C# program — try changing the message!\n        Console.WriteLine("Hello, World!");\n    }\n}\n`,
  ruby: `# Your first Ruby program — try changing the message!\nputs "Hello, World!"\n`,
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

export default function CodeRunnerClient() {
  const router = useRouter();

  const [runnerState, setRunnerState] = useState({
    isOpen: true,
    blockIndex: null,
    language: 'javascript',
    originalCode: STARTER_TEMPLATES.javascript,
    draftCode: STARTER_TEMPLATES.javascript,
    stdin: '',
  });

  const [runnerResult, setRunnerResult] = useState(null);
  const [runnerError, setRunnerError] = useState('');
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatError, setFormatError] = useState('');

  const handleClose = useCallback(() => {
    router.push('/account/member');
  }, [router]);

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
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to execute code.');
      }
      setRunnerResult(data?.result || null);
    } catch (error) {
      setRunnerError(error?.message || 'Failed to execute code.');
    } finally {
      setIsRunningCode(false);
    }
  }, [runnerState.draftCode, runnerState.language, runnerState.stdin]);

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
      state={runnerState}
      result={runnerResult}
      error={runnerError}
      formatError={formatError}
      isRunning={isRunningCode}
      isFormatting={isFormatting}
      onClose={handleClose}
      onRun={handleRunnerExecute}
      onFormat={handleFormat}
      onDraftChange={(value) =>
        setRunnerState((prev) => ({ ...prev, draftCode: value }))
      }
      onStdinChange={(value) =>
        setRunnerState((prev) => ({ ...prev, stdin: value }))
      }
      onReset={() =>
        setRunnerState((prev) => ({
          ...prev,
          draftCode: prev.originalCode,
          stdin: '',
        }))
      }
      onLanguageChange={(lang) =>
        setRunnerState((prev) => {
          const template = STARTER_TEMPLATES[lang] || '';
          const currentTrimmed = prev.draftCode.trim();
          const originalTrimmed = prev.originalCode.trim();
          const shouldLoadTemplate = !currentTrimmed || currentTrimmed === originalTrimmed;
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
