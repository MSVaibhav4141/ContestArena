"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Monaco } from "@monaco-editor/react";
import { ProblemData, BoilerplateCode } from "@repo/types";
import CodeEditorPanel from "./CodeBuilder";
import { Play, Send, ChevronRight, RotateCcw, Clock } from "lucide-react";
import { userSubmission } from "../../app/actions/action";
import { pollUser } from "./polling";

export interface UserWorkspaceProps {
  problem: ProblemData;
  initialCode?: BoilerplateCode;
  submission: {
    totalCorrectTc: number;
    totalRejectedTc: number;
    code: string;
    outputInline: any;
  }[];
  serverTimeOnLoad?: string;
  contestEndTime?: string;
  contestId?: string;
  isRegistered: boolean;
}

export default function ProblemWorkspace({
  problem,
  submission,
  serverTimeOnLoad,
  contestEndTime,
  contestId,
  isRegistered,
}: UserWorkspaceProps) {
  if (!problem.starterCodes[0]) {
    alert("Default boilerplate for this problem is unavailable");
    return;
  }

  const [timeLeft, setTimeLeft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "submissions">("description");
  const [codevale, setCodeVal] = useState(problem.starterCodes);
  const [submissions, setSubmission] = useState<UserWorkspaceProps["submission"]>(submission ?? []);
  const [codeCurrent, setCodeCurrent] = useState({
    language: getLanguageFromId(problem.starterCodes[0]?.languageId ?? 1),
    code: problem.starterCodes[0].code,
  });

  const [isExecuting, setIsExecuting] = useState(false);
  const [consoleResult, setConsoleResult] = useState<any>(null);
  const [submissionProgress, setProgress] = useState<number>(0);
  const [activeTestCase, setActiveTestCase] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const [leftPanelWidth, setLeftPanelWidth] = useState(45);
  const [consoleHeight, setConsoleHeight] = useState(30);
  const [isDraggingH, setIsDraggingH] = useState(false);
  const [isDraggingV, setIsDraggingV] = useState(false);

  const onMouseDownH = useCallback(() => setIsDraggingH(true), []);
  const onMouseDownV = useCallback(() => setIsDraggingV(true), []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingH && containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        const w = ((e.clientX - r.left) / r.width) * 100;
        if (w > 20 && w < 70) setLeftPanelWidth(w);
      }
      if (isDraggingV && rightPanelRef.current) {
        const r = rightPanelRef.current.getBoundingClientRect();
        const h = ((r.bottom - e.clientY) / r.height) * 100;
        if (h > 10 && h < 80) setConsoleHeight(h);
      }
    };
    const handleMouseUp = () => {
      setIsDraggingH(false);
      setIsDraggingV(false);
    };
    if (isDraggingH || isDraggingV) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = isDraggingH ? "col-resize" : "row-resize";
    } else {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingH, isDraggingV]);

  const handleRunCode = async () => {
    if (!isRegistered) return;
    setIsExecuting(true);
    setTimeout(() => setIsExecuting(false), 2000);
  };

  const handleSubmitCode = async () => {
    if (!isRegistered) return;
    setIsExecuting(true);
    const { subId, jobId } = await userSubmission({
      code: codeCurrent.code,
      problemId: problem.id,
      language: codeCurrent.language,
      inputs: problem.inputs,
      name: problem.title,
      output: problem.output,
      contestId,
    });
    if (!subId || !jobId) {
      alert("No ids received");
      return;
    }
    try {
      await pollUser({ id: subId, setSubmission, setConsoleResult, jobId, setProgress });
    } catch {
      alert("Some error occurred while polling");
    } finally {
      setProgress(100);
      setIsExecuting(false);
    }
  };

  useEffect(() => {
    if (!contestEndTime || !serverTimeOnLoad) return;
    const clientTimeOnLoad = Date.now();
    const serverTimeMs = new Date(serverTimeOnLoad).getTime();
    const clockOffset = serverTimeMs - clientTimeOnLoad;
    const target = new Date(contestEndTime).getTime();
    const interval = setInterval(async () => {
      const realNow = Date.now() + clockOffset;
      const diff = target - realNow;
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft("00:00:00");
        if (!isSubmitting) handleAutoSubmit();
        return;
      }
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [contestEndTime, serverTimeOnLoad]);

  const handleAutoSubmit = async () => {
    setIsSubmitting(true);
    alert("Time is up! Auto-submitting your code...");
    await handleSubmitCode();
    window.location.href = `/contests/${contestId}/leaderboard`;
  };

  const handleEditorWillMount = (monaco: Monaco) => {
    monaco.languages.register({ id: "cpp" });
    monaco.languages.setMonarchTokensProvider("cpp", {
      brackets: [
        { open: "{", close: "}", token: "delimiter.curly" },
        { open: "[", close: "]", token: "delimiter.square" },
        { open: "(", close: ")", token: "delimiter.parenthesis" },
        { open: "<", close: ">", token: "delimiter.angle" },
      ],
      tokenizer: {
        root: [
          [/\b(vector|string|map|set|queue|stack|list|deque|pair|unordered_map|unordered_set)\b/, "keyword"],
          [/[a-zA-Z_]\w*/, { cases: { "@keywords": "keyword", "@default": "identifier" } }],
          { include: "@whitespace" },
          [/[{}()\[\]]/, "@brackets"],
          [/[<>]/, "delimiter.angle"],
          [/\d+/, "number"],
        ],
        whitespace: [
          [/[ \t\r\n]+/, "white"],
          [/\/\/.*$/, "comment"],
          [/\/\*/, "comment", "@comment"],
        ],
        comment: [
          [/[^\/*]+/, "comment"],
          [/\*\//, "comment", "@pop"],
          [/[\/*]/, "comment"],
        ],
      },
      keywords: [
        "int", "float", "while", "if", "else", "return", "class", "public",
        "private", "void", "bool", "true", "false", "struct", "const", "new",
        "delete", "using", "namespace", "typename", "template", "auto",
        "const_cast", "static_cast", "dynamic_cast", "reinterpret_cast",
      ],
    });
  };

  const formatOutput = (rawStr: string) => {
    if (!rawStr) return "No output";
    try {
      const parsed = JSON.parse(rawStr);
      if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
        const rows = parsed.map((row) => `  [${row.map((cell: any) => `"${cell}"`).join(", ")}]`);
        return `[\n${rows.join(",\n")}\n]`;
      }
      return JSON.stringify(parsed, null, 2);
    } catch {
      return rawStr.trim();
    }
  };

  if (!isRegistered) {
    return (
      <div className="h-full bg-[#0f0f0f] p-6 flex justify-center" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
<div className="w-full max-w-4xl bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden flex flex-col shadow-2xl h-[calc(100vh-10rem)]">          <div className="flex items-center h-12 border-b border-gray-800 bg-[#242424] px-6">
            <span className="text-gray-300 font-bold text-sm tracking-tight">Problem Description</span>
          </div>
          <div className="flex-1 overflow-y-auto p-8">
            <h1 className="text-3xl font-black text-white mb-6 tracking-tight">{problem.title}</h1>
            <div
              className="prose prose-invert max-w-none text-base text-gray-400 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: problem.description }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#0f0f0f] overflow-hidden flex flex-col pt-4 px-4 pb-4"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      {contestEndTime && (
        <div className="flex items-center justify-center gap-2.5 bg-[#1a1a1a] border border-red-500/20 text-red-400 font-mono font-bold px-4 py-2.5 rounded-xl mb-3 text-sm w-fit mx-auto shadow-lg">
          <Clock size={14} className="shrink-0" />
          <span>{timeLeft || "Calculating..."}</span>
        </div>
      )}

<div ref={containerRef} className="flex w-full h-[calc(100vh-4rem-1.5rem)] relative gap-0">
        <div
          style={{ width: `${leftPanelWidth}%` }}
          className="flex flex-col bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden"
        >
          <div className="flex items-center h-11 border-b border-gray-800 bg-[#161616] px-2 gap-1 shrink-0">
            <button
              onClick={() => setActiveTab("description")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "description"
                  ? "bg-[#2a2a2a] text-white border border-gray-700"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab("submissions")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "submissions"
                  ? "bg-[#2a2a2a] text-white border border-gray-700"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Submissions
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "description" ? (
              <div className="space-y-5">
                <h1 className="text-2xl font-black text-white tracking-tight">{problem.title}</h1>
                <div
                  className="prose prose-invert max-w-none text-sm text-gray-400 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: problem.description }}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3 mt-1">
                {submissions.length > 0 ? (
                  submissions.map((item, index) => {
                    const isPassed = item.totalRejectedTc === 0;
                    const total = item.totalCorrectTc + item.totalRejectedTc;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setCodeCurrent({ code: submissions[index]?.code || "", language: "cpp" });
                          setConsoleResult({
                            input: submissions[index]?.outputInline.map((i: any) => i.stdin),
                            output: submissions[index]?.outputInline.map((i: any) => i.stdout),
                            statusId: submissions[index]?.outputInline.map((i: any) => i.status.id),
                          });
                        }}
                        className="group flex items-center justify-between p-4 bg-[#161616] hover:bg-[#1e1e1e] border border-gray-800 hover:border-gray-700 rounded-xl transition-all text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex items-center justify-center w-9 h-9 rounded-xl text-sm font-black ${
                              isPassed
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-500 border border-red-500/20"
                            }`}
                          >
                            {isPassed ? "✓" : "✕"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-sm ${isPassed ? "text-emerald-500" : "text-red-500"}`}>
                                {isPassed ? "Accepted" : "Wrong Answer"}
                              </span>
                              <span className="text-xs text-gray-600">·</span>
                              <span className="text-xs text-gray-500">#{submissions.length - index}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-5">
                          <div className="text-right">
                            <div className="text-sm font-mono font-bold text-gray-300">
                              {item.totalCorrectTc} / {total}
                            </div>
                            <div className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">Tests</div>
                          </div>
                          <ChevronRight size={15} className="text-gray-700 group-hover:text-gray-400 transition-colors" />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-800 rounded-2xl">
                    <div className="w-11 h-11 bg-[#242424] rounded-xl flex items-center justify-center mb-3 border border-gray-800">
                      <svg className="text-gray-600" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-400 font-semibold">No submissions yet</p>
                    <p className="text-xs text-gray-600 mt-1">Submit your code to see results here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className="w-4 flex justify-center items-center cursor-col-resize z-20 group"
          onMouseDown={onMouseDownH}
        >
          <div className="w-0.5 h-10 bg-gray-800 rounded-full group-hover:bg-blue-500/60 transition-colors" />
        </div>

        <div
          ref={rightPanelRef}
          style={{ width: `${100 - leftPanelWidth}%` }}
          className="flex flex-col relative gap-0"
        >
          <div
            style={{ height: `${100 - consoleHeight}%` }}
            className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between h-11 border-b border-gray-800 bg-[#161616] px-4 shrink-0">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{codeCurrent.language}</span>
              <button
                onClick={() => {
                  const lang = codeCurrent.language;
                  const idx = lang === "cpp" ? 0 : lang === "rust" ? 1 : 2;
                  codevale && setCodeCurrent({ language: lang, code: codevale[idx]?.code ?? "" });
                }}
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-300 transition-colors"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>
            <div className="flex-1 relative">
              <CodeEditorPanel
                progress={submissionProgress}
                code={codeCurrent.code}
                language={codeCurrent.language}
                onReset={() => {
                  const lang = codeCurrent.language ?? "cpp";
                  const idx = lang === "cpp" ? 0 : lang === "rust" ? 1 : 2;
                  codevale && setCodeCurrent({ language: lang, code: codevale[idx]?.code ?? "" });
                }}
                beforeMount={handleEditorWillMount}
                onChange={(newCode) =>
                  setCodeCurrent((prev) => ({ ...prev, code: newCode ?? "" }))
                }
                onLanguageChange={(index) => {
                  if (!codevale) return;
                  const selected = codevale[index];
                  selected && setCodeCurrent({ language: getLanguageFromId(selected.languageId), code: selected.code });
                }}
              />
            </div>
          </div>

          <div
            className="h-4 w-full cursor-row-resize z-20 flex items-center justify-center group"
            onMouseDown={onMouseDownV}
          >
            <div className="h-0.5 w-10 bg-gray-800 rounded-full group-hover:bg-blue-500/60 transition-colors" />
          </div>

          <div
            style={{ height: `${consoleHeight}%` }}
            className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden flex flex-col"
          >
            <div className="flex items-center h-11 border-b border-gray-800 bg-[#161616] px-4 shrink-0">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Console</span>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {!consoleResult?.input?.length ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-gray-600 italic">Run your code to see output here</p>
                </div>
              ) : (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="flex gap-2 px-4 py-3 border-b border-gray-800 overflow-x-auto shrink-0">
                    {consoleResult.input.map((_: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => setActiveTestCase(index)}
                        className={`px-3.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                          activeTestCase === index
                            ? consoleResult.statusId[index] === 3
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-red-500/15 text-red-400 border-red-500/30"
                            : consoleResult.statusId[index] === 3
                            ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/10 hover:border-emerald-500/20"
                            : "bg-red-500/5 text-red-700 border-red-500/10 hover:border-red-500/20"
                        }`}
                      >
                        Case {index + 1}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    <div>
                      <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2">Input</div>
                      <div className="bg-[#111] border border-gray-800 rounded-lg p-3">
                        <pre className="font-mono text-sm text-gray-300 overflow-x-auto">
                          {formatOutput(consoleResult.input[activeTestCase])}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2">Output</div>
                      <div className="bg-[#111] border border-gray-800 rounded-lg p-3">
                        <pre className="font-mono text-sm text-gray-300 overflow-x-auto">
                          {formatOutput(consoleResult.output[activeTestCase])}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-800 bg-[#161616] flex items-center justify-between shrink-0">
              <div className="text-xs text-gray-600 font-mono">
                {isExecuting && <span className="text-blue-500 animate-pulse">Running...</span>}
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={handleRunCode}
                  disabled={isExecuting || !isRegistered}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#242424] hover:bg-[#2a2a2a] border border-gray-700 hover:border-gray-600 text-gray-300 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play size={13} /> Run
                </button>
                <button
                  onClick={handleSubmitCode}
                  disabled={isExecuting || !isRegistered}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={13} /> Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const getLanguageFromId = (id: number): "cpp" | "rust" | "javascript" => {
  switch (id) {
    case 1: return "cpp";
    case 2: return "rust";
    case 3: return "javascript";
    default: return "cpp";
  }
};
