"use client"
import { useState, useEffect, Dispatch, SetStateAction } from "react"
import { InputParam, TestCase } from "@repo/types"

// --- Types ---
interface TestCaseResult {
    identity: string;
    // Added PENDING to the type definition just in case
    status: "ACCEPTED" | "WRONG_ANSWER" | "TIME_LIMIT_EXCEEDED" | "RUNTIME_ERROR" | "COMPILATION_ERROR" | "PENDING";
    stdout?: string;
}

interface SubmissionResult {
    testCases: TestCaseResult[];
    submissionStatus: {
        status: string;
    };
}

interface Props {
  params: InputParam[],
  cases: TestCase[],
  tcResult: SubmissionResult | null,
  setCases: Dispatch<SetStateAction<TestCase[]>>,
  isEvaluating?: boolean 
}

export default function TestCaseManager({ params, cases, tcResult, setCases, isEvaluating = false }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [inputValues, setInputValues] = useState<string[]>([])
  const [output, setOutput] = useState("")
  const [isHidden, setIsHidden] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Sync inputs with params
  useEffect(() => {
    setInputValues(prev => {
        const newValues = [...prev];
        if (params.length > prev.length) {
            return [...newValues, ...new Array(params.length - prev.length).fill("")];
        }
        return newValues.slice(0, params.length);
    })
  }, [params.length])

  const reset = () => {
    setInputValues(new Array(params.length).fill(""))
    setOutput("")
    setIsHidden(false)
    setEditingId(null)
  }

  const handleSave = () => {
    if (inputValues.some(v => !v.trim()) || !output.trim()) {
        return alert("All input arguments and expected output are required.")
    }

    try {
        params.forEach((p, idx) => {
            const val = inputValues[idx] ?? "";
            if (p.type.includes("[]") || p.type === "TreeNode" || p.type === "ListNode") {
                JSON.parse(val);
            }
        })
    } catch (e) {
        return alert(`Invalid Format: Complex types must be valid JSON.`);
    }

    const finalInputString = inputValues.map(v => v.trim()).join('\n');

    const newCase: TestCase = {
      id: editingId ?? crypto.randomUUID(),
      input: finalInputString,
      output: output.trim(),
      isHidden
    }

    if (editingId) {
      setCases(prev => prev.map(c => c.id === editingId ? newCase : c))
    } else {
      setCases(prev => [...prev, newCase])
    }
    reset()
  }

  const handleEdit = (tc: TestCase) => {
    setEditingId(tc.id)
    const values = tc.input.split('\n');
    setInputValues(values);
    setOutput(tc.output)
    setIsHidden(tc.isHidden || false)
    setIsModalOpen(false) 
  }

  const handleDelete = (id: string) => {
    setCases(prev => prev.filter(c => c.id !== id))
  }

  // --- Status Logic ---
  const getResult = (id: string) => {
      if (!tcResult || !tcResult.testCases) return null;
      return tcResult.testCases.find(r => r.identity === id);
  }

  const getStatusConfig = (tc: TestCase) => {
      const result = getResult(tc.id);

      // 1. Result Available
      if (result) {
          // A. SUCCESS
          if (result.status === "ACCEPTED") {
              return {
                  style: "bg-green-50 border-green-200",
                  badge: "bg-green-100 text-green-700",
                  icon: "✅",
                  text: "Passed"
              };
          }

          // B. PENDING (Fixing the Red Cross Issue)
          if (result.status === "PENDING") {
              return {
                  style: "bg-yellow-50 border-yellow-200 animate-pulse", // Yellow Pulse
                  badge: "bg-yellow-100 text-yellow-800",
                  icon: null, // We will use the Spinner SVG in JSX
                  text: "Pending"
              };
          }

          // C. FAILURE
          return {
              style: "bg-red-50 border-red-200",
              badge: "bg-red-100 text-red-700",
              icon: "❌",
              text: result.status.replace(/_/g, " ")
          };
      }

      // 2. Evaluating State (Network Request in flight)
      if (isEvaluating) {
          return {
              style: "bg-yellow-50 border-yellow-200 animate-pulse",
              badge: "bg-yellow-100 text-yellow-800",
              icon: null,
              text: "Running..."
          };
      }

      // 3. Hidden State
      if (tc.isHidden) {
          return {
              style: "bg-purple-50 border-purple-100",
              badge: "bg-purple-100 text-purple-700",
              icon: "🔒",
              text: "Hidden"
          };
      }

      // 4. Default State (Idle)
      return {
          style: "bg-gray-50 border-gray-200 hover:border-blue-300 hover:shadow-sm",
          badge: null,
          icon: null,
          text: null
      };
  }

  const visibleCases = cases.slice(0, 3)

  return (
    <>
      <div className="bg-white rounded-xl shadow p-4 space-y-4 h-full flex flex-col">
        
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">🧪 Test Cases ({cases.length})</h2>
            {cases.length > 1 && (
                 <button 
                    onClick={() => setIsModalOpen(true)}
                    className="text-sm text-blue-600 font-medium hover:underline"
                 >
                    View All
                 </button>
            )}
        </div>

        {/* --- INPUT FORM --- */}
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            {params.length === 0 ? (
                <div className="text-sm text-gray-500 italic text-center py-2">
                    Define problem parameters first.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                    {params.map((param, idx) => (
                        <div key={param.id} className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                                <span>{param.name}</span>
                                <span className="text-gray-400 font-mono">{param.type}</span>
                            </label>
                            <input
                                placeholder={`Enter ${param.type}...`}
                                className="w-full border rounded px-2 py-1.5 font-mono text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                value={inputValues[idx] || ""}
                                onChange={(e) => {
                                    const newVals = [...inputValues];
                                    newVals[idx] = e.target.value;
                                    setInputValues(newVals);
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-col gap-1 pt-2 border-t border-gray-200">
                <label className="text-xs font-bold text-gray-500 uppercase">Expected Output</label>
                <textarea
                    placeholder="Result value"
                    className="w-full border rounded px-2 py-1.5 font-mono text-sm focus:ring-1 focus:ring-blue-500 outline-none h-10 resize-none"
                    value={output}
                    onChange={e => setOutput(e.target.value)}
                />
            </div>

            <div className="flex justify-between items-center pt-2">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        className="rounded text-blue-600 focus:ring-blue-500"
                        checked={isHidden}
                        onChange={e => setIsHidden(e.target.checked)}
                    />
                    Hidden Case
                </label>

                <button
                    onClick={handleSave}
                    disabled={params.length === 0 || isEvaluating} 
                    className="bg-blue-600 disabled:bg-gray-400 text-white px-5 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition shadow-sm font-medium"
                >
                    {editingId ? "Update Case" : "Add Case"}
                </button>
            </div>
        </div>
        
        {/* --- LIST PREVIEW --- */}
        <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar min-h-0 pt-2">
          {visibleCases.map((tc, index) => {
            const status = getStatusConfig(tc);
            return (
                <div key={tc.id} className={`border rounded-lg p-3 text-sm transition-all duration-300 ${status.style}`}>
                  <div className="flex justify-between items-start mb-2">
                     <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-gray-500">Case #{index + 1}</span>
                         {/* Status Badge */}
                         {status.badge && (
                             <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${status.badge}`}>
                                 {/* Spin animation for waiting/pending state */}
                                 {(status.text === "Running..." || status.text === "Pending") && (
                                    <svg className="animate-spin h-3 w-3 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                 )}
                                 {/* Normal Icon for Final States */}
                                 {(status.text !== "Running..." && status.text !== "Pending") && status.icon}
                                 {status.text}
                             </span>
                         )}
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-2 font-mono text-xs text-gray-600">
                     <div className="truncate bg-white border px-1.5 py-1 rounded opacity-80" title={tc.input.replace(/\n/g, ', ')}>
                        {tc.input.replace(/\n/g, ' | ')}
                     </div>
                     <span className="text-gray-400">➔</span>
                     <div className="truncate bg-white border px-1.5 py-1 rounded opacity-80" title={tc.output}>
                        {tc.output}
                     </div>
                  </div>

                  <div className="flex justify-end gap-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Disable Edit/Delete while running */}
                    {!isEvaluating && (
                        <>
                            <button onClick={() => handleEdit(tc)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                            <button onClick={() => handleDelete(tc.id)} className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                        </>
                    )}
                  </div>
                </div>
            );
          })}
           {cases.length === 0 && params.length > 0 && (
                <div className="text-center text-gray-400 text-sm py-4">No test cases added yet.</div>
           )}
        </div>
      </div>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-slide-in-up">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-800">All Test Cases</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 px-2">✕</button>
                </div>
                <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar">
                    {cases.map((tc, idx) => {
                        const status = getStatusConfig(tc);
                        return (
                            <div key={tc.id} className={`border rounded-lg p-3 transition-colors duration-300 ${status.style}`}>
                                 <div className="flex justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-500">Case #{idx + 1}</span>
                                        {status.badge && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${status.badge}`}>
                                                {(status.text === "Running..." || status.text === "Pending") && (
                                                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                )}
                                                {status.text}
                                            </span>
                                        )}
                                    </div>
                                 </div>
                                 {/* (Inputs/Outputs section same as before) */}
                                 <div className="space-y-2">
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase mb-1">Input</div>
                                        <div className="bg-white/60 border rounded p-2 font-mono text-sm">
                                            {tc.input.split('\n').map((line, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <span className="text-gray-400 select-none w-4 text-right">{i+1}:</span>
                                                    <span>{line}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase mb-1">Expected Output</div>
                                        <div className="bg-white/60 border rounded p-2 font-mono text-sm">{tc.output}</div>
                                    </div>
                                 </div>
                            </div>
                        );
                    })}
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Close</button>
                </div>
            </div>
        </div>
      )}
    </>
  )
}