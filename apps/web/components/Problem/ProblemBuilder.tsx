"use client";

import { useState, useRef, useEffect, useCallback, use } from "react";
import { createProblemAction, getProblemById, submitProblem, submitTestCases } from "../../app/actions/action";
import { Monaco } from "@monaco-editor/react";
import {
  BaseType,
  BoilerplateCode,
  BolierPateResponse,
  ErrorResponse,
  InputParam,
  OutputParams,
  ProblemData,
  SpecialType,
  Structure,
  SubmissionData,
  TestCase,
} from "@repo/types";
import CodeEditorPanel from "./CodeBuilder";
import TestCaseManager from "./TestCaseManager";
import ProblemDetailsForm from "./ProblemDetailForm";
import { Loder } from "../Loder";
import { poll } from "./polling";
import { useRouter } from "next/navigation";

// --- Types ---
const baseTypes: BaseType[] = [
  "int",
  "long",
  "double",
  "bool",
  "char",
  "string",
];
const specialTypes: SpecialType[] = ["TreeNode", "ListNode"];

const getLanguageFromId = (id: number): string => {
  switch (id) {
    case 1:
      return "cpp";
    case 2:
      return "rust";
    case 3:
      return "javascript";
    default:
      return "cpp";
  }
};

export default function ProblemForm({problem, submissionData}:{problem?:ProblemData, submissionData:SubmissionData}) {
  // --- Business Logic State ---

  
  const [problemName, setProblemName] = useState(problem?.title || "");
  const [problemDesc, setProblemDesc] = useState(problem?.description || "");
  const [params, setParams] = useState<InputParam[]>(problem?.inputs || []);
  const [outputType, setOutputType] = useState<OutputParams>(problem?.output || "int");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [paramName, setParamName] = useState("");
  const [selectedBase, setSelectedBase] = useState<BaseType>("int");
  const [isArray, setIsArray] = useState(false);
  const [dimension, setDimension] = useState<1 | 2>(1);
  const [special, setSpecial] = useState<"" | SpecialType>("");
  const [problemId, setProblemId] = useState<null | string>(problem?.id||null);
  const [cases, setCases] = useState<TestCase[]>([]);
  const [codevale, setCode] = useState<BoilerplateCode[] | null>(problem?.starterCodes || null);
  const [tcResult, setResult] = useState<any>(null);

  const router = useRouter()
  const codeCurrent = {
      language: 'cpp',
      code:problem?.starterCodes[0]?.code || ""
    }

  const [codevaleCurrent, setCodeCurrent] = useState<{
    language: string;
    code: string;
  } | null>(submissionData || codeCurrent || null);
  const [isLoading, setIsLoading] = useState(false);

  // 🔥 NEW STATE: Track if we are currently running the tests
  const [isEvaluating, setIsEvaluating] = useState(false);

  // --- RESIZE STATE & REFS ---
  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Default percentages
  const [leftPanelWidth, setLeftPanelWidth] = useState(40); // 40%
  const [testCaseHeight, setTestCaseHeight] = useState(35); // 35%

  const [isDraggingH, setIsDraggingH] = useState(false); // Horizontal split (Left/Right)
  const [isDraggingV, setIsDraggingV] = useState(false); // Vertical split (Editor/TestCases)

  const showEditor = !!(codevale && codevaleCurrent);

  // --- Resize Handlers ---

  // 1. Handle Horizontal Drag (Left/Right Panel)
  const onMouseDownH = useCallback(() => setIsDraggingH(true), []);

  // 2. Handle Vertical Drag (Editor/TestCase Panel)
  const onMouseDownV = useCallback(() => setIsDraggingV(true), []);

  // 3. Global Mouse Move/Up Listener
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingH && containerRef.current) {
        // Calculate new width % for left panel
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth =
          ((e.clientX - containerRect.left) / containerRect.width) * 100;
        // Constraints: Min 20%, Max 70%
        if (newWidth > 20 && newWidth < 70) {
          setLeftPanelWidth(newWidth);
        }
      }

      if (isDraggingV && rightPanelRef.current) {
        // Calculate new height % for bottom panel (Test Cases)
        // We calculate from bottom up
        const panelRect = rightPanelRef.current.getBoundingClientRect();
        const newHeight =
          ((panelRect.bottom - e.clientY) / panelRect.height) * 100;

        // Constraints: Min 10%, Max 80%
        if (newHeight > 10 && newHeight < 80) {
          setTestCaseHeight(newHeight);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingH(false);
      setIsDraggingV(false);
    };

    if (isDraggingH || isDraggingV) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      // Prevent text selection while dragging
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

  // --- Monaco Config ---
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

  const resetForm = () => {
    setParamName("");
    setSelectedBase("int");
    setIsArray(false);
    setDimension(1);
    setSpecial("");
    setEditingId(null);
  };

  const buildType = (): OutputParams => {
    if (special) return special;
    if (!isArray) return selectedBase;
    return dimension === 1 ? `${selectedBase}[]` : `${selectedBase}[][]`;
  };

  const handleAddOrUpdate = () => {
    if (!paramName.trim()) return alert("Parameter name required");
    const newParam: InputParam = {
      id: editingId ?? crypto.randomUUID(),
      name: paramName,
      type: buildType(),
    };
    if (editingId) {
      setParams((prev) => prev.map((p) => (p.id === editingId ? newParam : p)));
    } else {
      setParams((prev) => [...prev, newParam]);
    }
    resetForm();
  };

  const handleEdit = (param: InputParam) => {
    setEditingId(param.id);
    setParamName(param.name);
    if (specialTypes.includes(param.type as SpecialType)) {
      setSpecial(param.type as SpecialType);
      setIsArray(false);
    } else if (param.type.includes("[]")) {
      const base = param.type.replace(/\[\]/g, "") as BaseType;
      const dims = (param.type.match(/\[\]/g) || []).length as 1 | 2;
      setSelectedBase(base);
      setIsArray(true);
      setDimension(dims);
      setSpecial("");
    } else {
      setSelectedBase(param.type as BaseType);
      setIsArray(false);
      setSpecial("");
    }
  };

  const handleDelete = (id: string) => {
    setParams((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const payload: Structure = {
      name: problemName,
      description: problemDesc,
      inputs: params,
      output: { type: outputType },
      problemId: problemId,
    };

    try {
      const response = (await createProblemAction(payload)) as
        | BolierPateResponse
        | ErrorResponse;

      if ("msg" in response) {
        alert(`Error: ${response.msg}`);
        setIsLoading(false);
        return;
      }
      const { startCode, problemId: pID } = response;

      router.push(`/create/problem/${pID}`)

      if (Array.isArray(startCode) && startCode.length > 0) {
        setTimeout(() => {
          setCode(startCode);
          const defaultIndex = 0;
          const selectedObj = startCode[defaultIndex];
          if (selectedObj) {
            setCodeCurrent({
              language: getLanguageFromId(selectedObj.languageId),
              code: selectedObj.code,
            });
            setProblemId(pID);
          }
          setIsLoading(false);
        }, 400);
      } else {
        setIsLoading(false);
      }
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!codevaleCurrent) return;

    // if(tcResult.submissionStatus.status === "ACCEPTED"){
    //   // await submitProblem()
    // }
    // 🔥 1. START LOADING & CLEAR OLD RESULTS
    // setIsEvaluating(true);
    setResult(null);
    let isPublic = 0;
    for (const tc of cases) {
      if (!tc.isHidden) isPublic++;
    }    
    const sortedTestCases = cases.sort((a, b) => Number(a.isHidden) - Number(b.isHidden));
    setCases(sortedTestCases)
    const languageId =
      codevaleCurrent.language === "cpp"
        ? 54
        : codevaleCurrent.language === "javascript"
        ? 63
        : 42;


    try {
      const timestart = Date.now()
      const subId = await submitTestCases({
        cases,
        params,
        problemName,
        outputType,
        codevaleCurrent,
        problemId,
        languageId,
        language: codevaleCurrent.language,
        isPublic
      });
      
      const timeend = Date.now()
      console.log((timeend-timestart)/1000.0)
        // 🔥 2. WAIT FOR RESULTS via Polling
        setIsEvaluating(true)
        if(subId && subId.jobId)
          await poll(subId.subId, setResult, subId.jobId);
        console.log("Finalize & Publish Complete");
        setIsEvaluating(false)
    } catch (error) {
        console.error("Submission failed", error);
        setIsEvaluating(false);
    } finally {
        // 🔥 3. STOP LOADING
        setIsEvaluating(false);
        console.log('stopped')
    }
  };

  const handleResetCode = () => {
    if (!codevale || !codevaleCurrent) return;

    // Find the original boilerplate object that matches the currently active language
    const originalBoilerplate = codevale.find(
      (bp) => getLanguageFromId(bp.languageId) === codevaleCurrent.language,
    );
    console.log(originalBoilerplate, "as");

    if (originalBoilerplate) {
      // Restore the code
      setCodeCurrent({
        language: codevaleCurrent.language, // Keep same language
        code: originalBoilerplate.code, // Reset code to original
      });
      console.log(codevaleCurrent);
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 overflow-hidden flex flex-col pt-6 px-6 pb-6">
        {/* Main Layout Container */}
        <div
          ref={containerRef}
          className={`
                        flex w-full mx-auto transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)] relative
                        ${
                          showEditor
                            ? "max-w-[1800px] justify-between h-[calc(100vh-3rem)]"
                            : "max-w-7xl justify-center items-start pt-10"
                        }
                    `}
        >
          {/* --- LEFT PANEL: Problem Details --- */}
          <div
            style={{ width: showEditor ? `${leftPanelWidth}%` : "100%" }}
            className={`
                            flex flex-col relative
                            ${showEditor ? "min-w-[300px]" : "max-w-2xl"}
                            /* Only animate width if we are NOT currently dragging */
                            ${!isDraggingH ? "transition-[width] duration-300" : ""}
                        `}
          >
            {isLoading && !showEditor && (
              <Loder title="Generating Boilerplate..." />
            )}

            <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
              <ProblemDetailsForm
                problemName={problemName}
                setProblemName={setProblemName}
                problemDesc={problemDesc}
                setProblemDesc={setProblemDesc}
                params={params}
                paramName={paramName}
                setParamName={setParamName}
                selectedBase={selectedBase}
                setSelectedBase={setSelectedBase}
                isArray={isArray}
                setIsArray={setIsArray}
                dimension={dimension}
                setDimension={setDimension}
                special={special}
                setSpecial={setSpecial}
                handleAddOrUpdate={handleAddOrUpdate}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                editingId={editingId}
                outputType={outputType}
                setOutputType={setOutputType}
                handleSubmit={handleSubmit}
                problemId={problemId}
                baseTypes={baseTypes}
                specialTypes={specialTypes}
              />
            </div>
          </div>

          {/* --- VERTICAL RESIZER (Left vs Right) --- */}
          {showEditor && (
            <div
              className="w-4 hover:w-4 flex justify-center items-center cursor-col-resize z-20 group -ml-2 mr-2"
              onMouseDown={onMouseDownH}
            >
              <div className="w-1 h-12 bg-gray-300 rounded-full group-hover:bg-blue-500 transition-colors" />
            </div>
          )}

          {/* --- RIGHT PANEL: Editor & Test Cases --- */}
          {showEditor && (
            <div
              ref={rightPanelRef}
              style={{ width: `${100 - leftPanelWidth}%` }}
              className="flex flex-col gap-0 animate-slide-in h-full relative"
            >
              <div
                className={`flex flex-col h-full ${
                  isDraggingV ? "pointer-events-none select-none" : ""
                }`}
              >
                {/* TOP: Editor Area */}
                <div
                  style={{ height: `${100 - testCaseHeight}%` }}
                  className="min-h-[20%] shadow-xl rounded-xl overflow-hidden ring-1 ring-gray-900/5 pb-2"
                >
                  <CodeEditorPanel
                    code={codevaleCurrent?.code || ""}
                    language={codevaleCurrent?.language || "cpp"}
                    beforeMount={handleEditorWillMount}
                    onReset={handleResetCode}
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

                {/* --- HORIZONTAL RESIZER (Editor vs TestCases) --- */}
                <div
                  className="h-4 w-full cursor-row-resize z-20 flex items-center justify-center group hover:bg-gray-100 -my-1"
                  onMouseDown={onMouseDownV}
                >
                  <div className="h-1 w-12 bg-gray-300 rounded-full group-hover:bg-blue-500 transition-colors" />
                </div>

                {/* BOTTOM: Test Cases Area */}
                <div
                  style={{ height: `${testCaseHeight}%` }}
                  className="flex flex-col min-h-[10%]"
                >
                  <div className="flex-1 overflow-hidden">
                    <TestCaseManager
                      params={params}
                      cases={cases}
                      setCases={setCases}
                      tcResult={tcResult?.submissionStatus}
                      isEvaluating={isEvaluating} // 🔥 PASSING THE PROP HERE
                    />
                  </div>

                  {/* Submit Action Bar */}
                  <div className="flex-shrink-0 flex justify-end pt-3">
                    <button
                      onClick={handleFinalSubmit}
                      disabled={isEvaluating} // 🔥 Disable while running
                      className={`
                        font-bold py-3 px-8 rounded-xl shadow-lg transform transition flex items-center gap-2
                        ${
                          isEvaluating
                            ? "bg-gray-400 cursor-not-allowed scale-100"
                            : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:scale-95 text-white"
                        }
                      `}
                    >
                      {isEvaluating ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Evaluating...
                        </>
                      ) : (
                        <>{tcResult?.submissionStatus.status === "ACCEPTED" ? "Submit Problem" : "Check Test Cases"}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}