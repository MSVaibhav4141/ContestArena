"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Monaco } from "@monaco-editor/react";
import { ProblemData, BoilerplateCode } from "@repo/types";
import CodeEditorPanel from "./CodeBuilder"; // Assuming you have this shared component
import { Play, Send } from "lucide-react";

interface UserWorkspaceProps {
  problem: ProblemData;
  initialCode?: BoilerplateCode; 
}

export default function ProblemWorkspace({ problem }: UserWorkspaceProps) {
    //Some prechecks

    if(!(problem.starterCodes[0])){
        alert("Default boilerplate for this problem is unavailable")
        return;
    }

  const [activeTab, setActiveTab] = useState<"description" | "submissions">("description");
  const codevale:BoilerplateCode[] = problem.starterCodes ;
  
  const [codeCurrent, setCodeCurrent] = useState({
    language: getLanguageFromId(problem.starterCodes[0]?.languageId ?? 1),
    code: problem.starterCodes[0].code ,
  });
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [consoleResult, setConsoleResult] = useState<any>(null);

  // --- RESIZE STATE & REFS (Reused from your logic) ---
  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const [leftPanelWidth, setLeftPanelWidth] = useState(45); // 45% for Description
  const [consoleHeight, setConsoleHeight] = useState(30);   // 30% for Console

  const [isDraggingH, setIsDraggingH] = useState(false);
  const [isDraggingV, setIsDraggingV] = useState(false);

  // --- Resize Handlers ---
  const onMouseDownH = useCallback(() => setIsDraggingH(true), []);
  const onMouseDownV = useCallback(() => setIsDraggingV(true), []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingH && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        if (newWidth > 20 && newWidth < 70) setLeftPanelWidth(newWidth);
      }

      if (isDraggingV && rightPanelRef.current) {
        const panelRect = rightPanelRef.current.getBoundingClientRect();
        const newHeight = ((panelRect.bottom - e.clientY) / panelRect.height) * 100;
        if (newHeight > 10 && newHeight < 80) setConsoleHeight(newHeight);
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

  // --- Actions ---
  const handleRunCode = async () => {
      setIsExecuting(true);
      // TODO: Call your user-execution API here (running against public test cases)
      console.log("Running code:", codeCurrent);
      setTimeout(() => setIsExecuting(false), 2000); // Mock delay
  };

  const handleSubmitCode = async () => {
      setIsExecuting(true);
      // TODO: Call your final submission API here (running against hidden test cases)
      console.log("Submitting code:", codeCurrent);
      setTimeout(() => setIsExecuting(false), 2000); // Mock delay
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
          [
            /\b(vector|string|map|set|queue|stack|list|deque|pair|unordered_map|unordered_set)\b/,
            "keyword",
          ],
          [
            /[a-zA-Z_]\w*/,
            { cases: { "@keywords": "keyword", "@default": "identifier" } },
          ],
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
        "int",
        "float",
        "while",
        "if",
        "else",
        "return",
        "class",
        "public",
        "private",
        "void",
        "bool",
        "true",
        "false",
        "struct",
        "const",
        "new",
        "delete",
        "using",
        "namespace",
        "typename",
        "template",
        "auto",
        "const_cast",
        "static_cast",
        "dynamic_cast",
        "reinterpret_cast",
      ],
    });
  };
  return (
      <div className="min-h-screen bg-gray-100 overflow-hidden flex flex-col pt-6 px-6 pb-6">
      
      {/* Main Layout Container */}
      <div 
        ref={containerRef} 
        className="flex w-full h-[calc(100vh-1rem)] relative"
      >
        
        {/* --- LEFT PANEL: Problem Description --- */}
        <div 
          style={{ width: `${leftPanelWidth}%` }} 
          className={`flex flex-col bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden ${!isDraggingH ? "transition-[width] duration-100" : ""}`}
        >
          {/* Tabs */}
          <div className="flex items-center h-10 border-b border-gray-800 bg-[#242424] px-2 gap-1">
             <button 
                onClick={() => setActiveTab('description')}
                className={`px-3 py-1 text-sm rounded-md transition ${activeTab === 'description' ? 'bg-gray-700 text-white font-medium' : 'text-gray-400 hover:bg-gray-800'}`}
             >
                📝 Description
             </button>
             <button 
                onClick={() => setActiveTab('submissions')}
                className={`px-3 py-1 text-sm rounded-md transition ${activeTab === 'submissions' ? 'bg-gray-700 text-white font-medium' : 'text-gray-400 hover:bg-gray-800'}`}
             >
                🕒 Submissions
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {activeTab === 'description' ? (
                  <div className="space-y-6">
                      <h1 className="text-2xl font-bold text-white">{problem.title}</h1>
                      {/* Render HTML Description safely */}
                      <div 
                          className="prose prose-invert max-w-none text-sm text-gray-300"
                          dangerouslySetInnerHTML={{ __html: problem.description }}
                      />
                  </div>
              ) : (
                  <div className="text-center text-gray-500 mt-10 text-sm">
                      Your past submissions will appear here.
                  </div>
              )}
          </div>
        </div>

        {/* --- HORIZONTAL RESIZER --- */}
        <div 
            className="w-4 flex justify-center items-center cursor-col-resize z-20 group -ml-2 mr-2" 
            onMouseDown={onMouseDownH}
        >
            <div className="w-1 h-12 bg-gray-700 rounded-full group-hover:bg-blue-500 transition-colors" />
        </div>

        {/* --- RIGHT PANEL: Editor & Console --- */}
        <div 
            ref={rightPanelRef} 
            style={{ width: `${100 - leftPanelWidth}%` }} 
            className="flex flex-col relative"
        >
          
          {/* TOP: Code Editor */}
          <div 
            style={{ height: `${100 - consoleHeight}%` }} 
            className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between h-10 border-b border-gray-800 bg-[#242424] px-3">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{codeCurrent.language}</span>
                 {/* Optional Reset Button */}
                 <button className="text-xs text-gray-500 hover:text-gray-300">Reset</button>
            </div>
            <div className="flex-1 relative">
                <CodeEditorPanel
                    code={codeCurrent.code}
                    language={codeCurrent.language}
                    onReset={() => {
                        const currentLanguage = codeCurrent.language ?? "cpp"
                        const codeIndex = currentLanguage === 'cpp' ? 0 : (currentLanguage === 'rust' ? 1 : 2)

                        
                        codevale && setCodeCurrent(
                            {
                                language:codeCurrent.language, 
                                code:codevale[codeIndex]?.code ?? ""
                            })}
                    }
                    beforeMount={handleEditorWillMount}
                    onChange={(newCode) => {
                      setCodeCurrent((prev) => {
                        if (!prev) return prev;

                        return {
                          ...prev,
                          code: newCode ?? "",
                        };
                      });
                    }}
                    onLanguageChange={(index) => {
                      if (!codevale) return;
                      const selected = codevale[index];
                      selected &&
                        setCodeCurrent({
                          language: getLanguageFromId(selected.languageId),
                          code: selected.code,
                        });
                    }}
                />
            </div>
          </div>

          {/* VERTICAL RESIZER */}
          <div 
            className="h-4 w-full cursor-row-resize z-20 flex items-center justify-center group -my-1" 
            onMouseDown={onMouseDownV}
          >
            <div className="h-1 w-12 bg-gray-700 rounded-full group-hover:bg-blue-500 transition-colors" />
          </div>

          {/* BOTTOM: Test Console & Actions */}
          <div 
            style={{ height: `${consoleHeight}%` }} 
            className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden flex flex-col"
          >
            <div className="flex items-center h-10 border-b border-gray-800 bg-[#242424] px-3">
                <span className="text-sm font-medium text-gray-300">Test Console</span>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                 <div className="text-sm text-gray-500 italic">
                     Run results and stdout will appear here...
                 </div>
            </div>

            {/* Action Buttons */}
            <div className="p-3 border-t border-gray-800 bg-[#1e1e1e] flex justify-end gap-3">
                <button 
                    onClick={handleRunCode}
                    disabled={isExecuting}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition disabled:opacity-50"
                >
                    <Play size={16} /> Run Code
                </button>
                <button 
                    onClick={handleSubmitCode}
                    disabled={isExecuting}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition shadow-lg disabled:opacity-50"
                >
                    <Send size={16} /> Submit
                </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Helper (You likely already have this in your utils)
const getLanguageFromId = (id: number): string => {
  switch (id) {
    case 1: return "cpp";
    case 2: return "rust";
    case 3: return "javascript";
    default: return "cpp";
  }
};