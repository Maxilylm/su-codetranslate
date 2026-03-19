"use client";

import { useState, useCallback } from "react";

const LANGUAGES = [
  "Python",
  "JavaScript",
  "TypeScript",
  "Rust",
  "Go",
  "Java",
  "C++",
  "Ruby",
  "PHP",
  "Swift",
] as const;

type Lang = (typeof LANGUAGES)[number];

// ---------- basic regex syntax highlighter ----------
function highlight(code: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const escaped = esc(code);

  return (
    escaped
      // comments: // ... and # ...
      .replace(
        /(\/\/.*?$|#.*?$)/gm,
        '<span class="syntax-comment">$1</span>'
      )
      // multi-line comments /* ... */
      .replace(
        /(\/\*[\s\S]*?\*\/)/g,
        '<span class="syntax-comment">$1</span>'
      )
      // strings
      .replace(
        /(&quot;.*?&quot;|&#x27;.*?&#x27;|`.*?`|".*?"|'.*?')/g,
        '<span class="syntax-string">$1</span>'
      )
      // numbers
      .replace(
        /\b(\d+\.?\d*)\b/g,
        '<span class="syntax-number">$1</span>'
      )
      // keywords
      .replace(
        /\b(fn|func|function|def|class|struct|enum|impl|trait|interface|type|const|let|var|mut|pub|return|if|else|elif|for|while|loop|match|switch|case|break|continue|import|from|export|package|use|async|await|try|catch|except|finally|throw|raises?|yield|new|self|this|super|nil|null|None|true|false|True|False|void|int|float|double|string|bool|boolean|char|i32|i64|u32|u64|f32|f64|usize|Vec|String|Option|Result|Some|Ok|Err|println|print|fmt|console|Math|Array|Map|Set)\b/g,
        '<span class="syntax-keyword">$1</span>'
      )
      // function calls
      .replace(
        /\b([a-zA-Z_]\w*)\s*\(/g,
        '<span class="syntax-function">$1</span>('
      )
  );
}

// ---------- auto-detect language from code ----------
function detectLanguage(code: string): Lang {
  const patterns: [RegExp, Lang][] = [
    [/\bfn\s+\w+.*->/, "Rust"],
    [/\blet\s+mut\b/, "Rust"],
    [/\bimpl\s+\w+/, "Rust"],
    [/\bpackage\s+main\b/, "Go"],
    [/\bfunc\s+\w+\(/, "Go"],
    [/\bfmt\./, "Go"],
    [/\bdef\s+\w+.*:/, "Python"],
    [/\bprint\s*\(/, "Python"],
    [/\bimport\s+\w+/, "Python"],
    [/\bpublic\s+static\s+void\s+main/, "Java"],
    [/\bSystem\.out\./, "Java"],
    [/\bpublic\s+class\s+/, "Java"],
    [/:\s*(string|number|boolean)\b/, "TypeScript"],
    [/\binterface\s+\w+\s*\{/, "TypeScript"],
    [/<\w+>/, "TypeScript"],
    [/\bconsole\.log/, "JavaScript"],
    [/\bconst\s+\w+\s*=\s*\(/, "JavaScript"],
    [/=>\s*\{/, "JavaScript"],
    [/#include\s*</, "C++"],
    [/\bstd::/, "C++"],
    [/\bcout\s*<</, "C++"],
    [/\brequire\s+'/, "Ruby"],
    [/\bputs\s+/, "Ruby"],
    [/\bdo\s*\|/, "Ruby"],
    [/<\?php/, "PHP"],
    [/\$\w+\s*=/, "PHP"],
    [/\becho\s+/, "PHP"],
    [/\bfunc\s+\w+\(.*\)\s*->\s*/, "Swift"],
    [/\bguard\s+let\b/, "Swift"],
    [/\bvar\s+\w+\s*:\s*\w+/, "Swift"],
  ];

  for (const [re, lang] of patterns) {
    if (re.test(code)) return lang;
  }
  return "Python";
}

export default function Home() {
  const [sourceCode, setSourceCode] = useState("");
  const [translatedCode, setTranslatedCode] = useState("");
  const [sourceLang, setSourceLang] = useState<Lang>("Python");
  const [targetLang, setTargetLang] = useState<Lang>("JavaScript");
  const [detectedLang, setDetectedLang] = useState<Lang | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSourceChange = useCallback(
    (val: string) => {
      setSourceCode(val);
      if (val.trim().length > 20) {
        const detected = detectLanguage(val);
        setDetectedLang(detected);
        setSourceLang(detected);
      } else {
        setDetectedLang(null);
      }
    },
    []
  );

  const translate = useCallback(async () => {
    if (!sourceCode.trim()) return;
    setLoading(true);
    setError("");
    setTranslatedCode("");
    setNotes("");

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: sourceCode,
          sourceLang,
          targetLang,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Translation failed");
      } else {
        setTranslatedCode(data.translated);
        setNotes(data.notes || "");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }, [sourceCode, sourceLang, targetLang]);

  const swap = useCallback(() => {
    setSourceCode(translatedCode);
    setTranslatedCode("");
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setNotes("");
    setDetectedLang(null);
  }, [translatedCode, sourceLang, targetLang]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(translatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [translatedCode]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold">
              {"<>"}
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-violet-400">Code</span>
              <span className="text-zinc-100">Translate</span>
            </h1>
          </div>
          <p className="text-xs text-zinc-500 hidden sm:block">
            AI-powered code translation between 10 languages
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 md:p-6 gap-4">
        {/* Panels */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-4 min-h-0">
          {/* Source Panel */}
          <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Source
                </span>
                {detectedLang && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                    Auto-detected
                  </span>
                )}
              </div>
              <select
                value={sourceLang}
                onChange={(e) => {
                  setSourceLang(e.target.value as Lang);
                  setDetectedLang(null);
                }}
                className="bg-zinc-800 text-zinc-200 text-sm rounded-lg px-3 py-1.5 border border-zinc-700 focus:border-violet-500 focus:outline-none cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 relative">
              <textarea
                value={sourceCode}
                onChange={(e) => handleSourceChange(e.target.value)}
                placeholder="Paste your code here..."
                spellCheck={false}
                className="w-full h-full min-h-[300px] lg:min-h-0 resize-none bg-transparent p-4 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                maxLength={6000}
              />
              {sourceCode.length > 5500 && (
                <div className="absolute bottom-2 right-2 text-[10px] text-amber-400">
                  {sourceCode.length}/6000
                </div>
              )}
            </div>
          </div>

          {/* Center Controls */}
          <div className="flex lg:flex-col items-center justify-center gap-3 py-2">
            <button
              onClick={translate}
              disabled={loading || !sourceCode.trim()}
              className={`
                group relative px-6 py-3 rounded-xl font-bold text-sm
                transition-all duration-300
                ${
                  loading
                    ? "bg-violet-500/20 text-violet-300 cursor-wait"
                    : sourceCode.trim()
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/25 active:scale-95"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }
              `}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Translating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Translate
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              )}
            </button>

            {translatedCode && (
              <button
                onClick={swap}
                className="p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-violet-400 hover:border-violet-500/50 transition-all hover:scale-110 active:scale-90"
                title="Swap source and target"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Target Panel */}
          <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Target
              </span>
              <div className="flex items-center gap-2">
                {translatedCode && (
                  <button
                    onClick={copyToClipboard}
                    className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                )}
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value as Lang)}
                  className="bg-zinc-800 text-zinc-200 text-sm rounded-lg px-3 py-1.5 border border-zinc-700 focus:border-violet-500 focus:outline-none cursor-pointer"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex-1 relative min-h-[300px] lg:min-h-0">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 z-10">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                    <p className="text-xs text-zinc-400">
                      Translating to {targetLang}...
                    </p>
                  </div>
                </div>
              )}
              {error && (
                <div className="p-4">
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                </div>
              )}
              {translatedCode ? (
                <pre className="p-4 text-sm leading-relaxed overflow-auto h-full">
                  <code
                    dangerouslySetInnerHTML={{
                      __html: highlight(translatedCode),
                    }}
                  />
                </pre>
              ) : (
                !loading &&
                !error && (
                  <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                    Translated code will appear here
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Translation Notes */}
        {notes && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Translation Notes
              </span>
            </div>
            <div className="p-4 text-sm text-zinc-300 leading-relaxed prose prose-invert prose-sm max-w-none">
              {notes.split("\n").map((line, i) => (
                <p key={i} className={line.startsWith("-") || line.startsWith("*") ? "pl-2 border-l-2 border-violet-500/30 ml-1" : ""}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] text-zinc-600">
          <span>Powered by Groq + Llama 3.3</span>
          <span>10 languages supported</span>
        </div>
      </footer>
    </div>
  );
}
