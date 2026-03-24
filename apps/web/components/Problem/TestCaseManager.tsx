"use client"
import { useState, useEffect, Dispatch, SetStateAction, useRef, useMemo } from "react"
import { InputParam, TestCase } from "@repo/types"

// --- Types ---
interface TestCaseResult {
    identity: string;
    status: "ACCEPTED" | "WRONG_ANSWER" | "TIME_LIMIT_EXCEEDED" | "RUNTIME_ERROR" | "COMPILATION_ERROR" | "PENDING";
    stdout?: string;
}

interface GeneratedOutput {
    id:string,
    isErr:string| null,
    input: string;
    output: string;
    isHidden: boolean;
}

interface SubmissionResult {
    testCases?: TestCaseResult[];
    submissionStatus: {
        status: string;
    };
    outputInline?: GeneratedOutput[];
    error?: string; 
}

interface Props {
  params: InputParam[],
  cases: TestCase[],
  tcResult: SubmissionResult | null,
  setCases: Dispatch<SetStateAction<TestCase[]>>,
  isEvaluating?: boolean 
}

const ITEMS_PER_PAGE = 50;

export default function TestCaseManager({ params, cases, tcResult, setCases, isEvaluating = false }: Props) {
  // State for Form Inputs
  const [editingId, setEditingId] = useState<string | null>(null)
  const [inputValues, setInputValues] = useState<string[]>([])
  const [isHidden, setIsHidden] = useState(false)
  
  // State for Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false) 
  const [isListModalOpen, setIsListModalOpen] = useState(false)   
  const [isGeneratedModalOpen, setIsGeneratedModalOpen] = useState(false) 
  
  // Pagination & Tabs State
  const [listPage, setListPage] = useState(1);
  const [genPage, setGenPage] = useState(1);
  const [genTab, setGenTab] = useState<"all" | "errors">("all");

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInputValues(prev => {
        const newValues = [...prev];
        if (params.length > prev.length) {
            return [...newValues, ...new Array(params.length - prev.length).fill("")];
        }
        return newValues.slice(0, params.length);
    })
  }, [params.length])

  // --- ACTIONS ---
  const resetForm = () => {
    setInputValues(new Array(params.length).fill(""))
    setIsHidden(false)
    setEditingId(null)
  }

  const openAddModal = () => {
    resetForm();
    setIsEntryModalOpen(true);
  }

  const handleSaveManual = () => {
    if (inputValues.some(v => !v.trim())) {
        return alert("All input arguments are required.")
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
      output: "", 
      isHidden
    }

    if (editingId) {
      setCases(prev => prev.map(c => c.id === editingId ? newCase : c))
    } else {
      setCases(prev => [...prev, newCase])
    }
    
    resetForm();
    setIsEntryModalOpen(false); 
    setIsListModalOpen(true);   
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          const rawCases = text.split(/\n\s*\n/).filter(c => c.trim() !== "");
          
          const newCases: TestCase[] = rawCases.map((rc, idx) => ({
              id: crypto.randomUUID(),
              input: rc.trim(),
              output: "", 
              isHidden: cases.length + idx > 2 
          }));

          setCases(prev => [...prev, ...newCases]);
          if (fileInputRef.current) fileInputRef.current.value = "";
          
          setListPage(1); // Reset pagination on new import
          setIsListModalOpen(true); 
      };
      reader.readAsText(file);
  }

  const handleEdit = (tc: TestCase) => {
    setEditingId(tc.id)
    const values = tc.input.split('\n');
    setInputValues(values);
    setIsHidden(tc.isHidden || false)
    
    setIsListModalOpen(false); 
    setIsEntryModalOpen(true); 
  }

  const handleDelete = (id: string) => {
    setCases(prev => prev.filter(c => c.id !== id))
  }

  const handleAcceptOutputs = () => {
    if (!tcResult?.outputInline) return;

    if (cases.length !== tcResult.outputInline.length) {
        return alert("Mismatch Error: The number of generated outputs does not match the number of inputs.");
    }

    const updatedCases = cases.map((tc, index) => {
        // Safe mapping using absolute index, unaffected by pagination
        const generatedData = tcResult.outputInline![index] || {output : "void"}; 
        return { ...tc, output: generatedData.output };
    });

    setCases(updatedCases);
    setIsGeneratedModalOpen(false);
    setIsListModalOpen(true); 
  }

  // --- PAGINATION & FILTER LOGIC ---
  const hasGeneratedResults = tcResult?.outputInline && tcResult.outputInline.length > 0;
  const hasError = !!tcResult?.error;

  // List Modal Pagination
  const totalListPages = Math.ceil(cases.length / ITEMS_PER_PAGE);
  const paginatedCases = cases.slice((listPage - 1) * ITEMS_PER_PAGE, listPage * ITEMS_PER_PAGE);

  // Generated Results Logic (Memoized for performance)
  const { processedOutputs, errorCount } = useMemo(() => {
      if (!tcResult?.outputInline) return { processedOutputs: [], errorCount: 0 };
      
      let errors = 0;
      const processed = tcResult.outputInline?.map((genResult, idx) => {
          const isErr = genResult.isErr
          if (isErr) errors++;
          // Keep track of original index so the UI says "Test Case #999" even if it's #1 on the error tab
          return { ...genResult, originalIndex: idx, isError: isErr };
      });

      return { processedOutputs: processed, errorCount: errors };
  }, [tcResult?.outputInline]);

  const displayedOutputs = genTab === "errors" ? processedOutputs.filter(o => o.isError) : processedOutputs;
  const totalGenPages = Math.ceil(displayedOutputs.length / ITEMS_PER_PAGE);
  const paginatedOutputs = displayedOutputs.slice((genPage - 1) * ITEMS_PER_PAGE, genPage * ITEMS_PER_PAGE);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 h-full min-h-[300px]">
          {/* --- LEFT: MAIN MANAGER CARD --- */}
          <div className={`bg-white rounded-xl shadow p-6 flex flex-col justify-center items-center text-center space-y-6 transition-all duration-300 ${hasError ? 'w-full md:w-1/2' : 'w-full'}`}>
            <div>
                <h2 className="text-xl font-bold text-gray-800">🧪 Test Case Manager</h2>
                <p className="text-sm text-gray-500 mt-1">
                    {cases.length === 0 
                        ? "No test cases added yet." 
                        : `${cases.length} test cases defined.`}
                </p>
            </div>

            <div className="flex flex-col w-full max-w-xs gap-3">
                <button 
                    onClick={openAddModal}
                    disabled={params.length === 0}
                    className="w-full bg-blue-50 text-blue-700 border border-blue-200 py-3 rounded-lg font-medium hover:bg-blue-100 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ✍️ Add Manually
                </button>
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={params.length === 0}
                    className="w-full bg-gray-50 text-gray-700 border border-gray-200 py-3 rounded-lg font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    📁 Import .txt File
                </button>
                <input type="file" accept=".txt" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            </div>

            <div className="flex flex-col w-full max-w-xs gap-3 border-t pt-4">
                {cases.length > 0 && (
                    <button 
                        onClick={() => { setListPage(1); setIsListModalOpen(true); }}
                        className="w-full text-gray-600 hover:text-gray-900 font-medium text-sm underline decoration-gray-300 underline-offset-4"
                    >
                        View & Manage {cases.length} Cases
                    </button>
                )}

                {hasGeneratedResults && (
                    <button 
                        onClick={() => { setGenPage(1); setGenTab("all"); setIsGeneratedModalOpen(true); }}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition animate-pulse"
                    >
                        ✨ View Generated Results
                    </button>
                )}
            </div>
          </div>

          {/* --- RIGHT: TERMINAL ERROR DISPLAY --- */}
          {hasError && (
              <div className="w-full md:w-1/2 bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-700 flex flex-col overflow-hidden animate-fade-in">
                  <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-gray-700">
                      <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <span className="text-gray-400 text-xs font-mono ml-2">bash - execution_error.log</span>
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                      <pre className="font-mono text-xs md:text-sm text-red-400 whitespace-pre-wrap break-all leading-relaxed">
                          <span className="text-red-500 font-bold">Exception in thread "main": </span>
                          {tcResult?.error}
                      </pre>
                  </div>
              </div>
          )}
      </div>

      {/* --- MODAL 1: LIST / MANAGER (PAGINATED) --- */}
      {isListModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsListModalOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-in-up">
                
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">All Test Cases ({cases.length})</h3>
                    <div className="flex gap-2">
                         <button onClick={() => { setIsListModalOpen(false); openAddModal(); }} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
                            + Add New
                         </button>
                         <button onClick={() => setIsListModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-2">×</button>
                    </div>
                </div>

                <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar bg-gray-50/50 flex-1">
                    {cases.length === 0 && (
                        <div className="text-center py-10 text-gray-400 italic">No test cases found.</div>
                    )}
                    {paginatedCases.map((tc, index) => {
                        // Calculate absolute index for display
                        const absoluteIndex = ((listPage - 1) * ITEMS_PER_PAGE) + index;
                        return (
                            <div key={tc.id} className={`border rounded-lg p-3 bg-white shadow-sm transition-all ${tc.isHidden ? "border-purple-200 bg-purple-50/30" : "border-gray-200"}`}>
                                 <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-500">Case #{absoluteIndex + 1}</span>
                                        {tc.isHidden && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700">🔒 Hidden</span>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(tc)} className="text-xs font-medium text-blue-600 hover:text-blue-800">Edit</button>
                                        <button onClick={() => handleDelete(tc.id)} className="text-xs font-medium text-red-600 hover:text-red-800">Delete</button>
                                    </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Input</span>
                                        <div className="bg-gray-50 border px-2 py-1.5 rounded text-gray-700 break-words whitespace-pre-wrap max-h-20 overflow-y-auto">
                                            {tc.input}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Expected Output</span>
                                        <div className={`border px-2 py-1.5 rounded break-words whitespace-pre-wrap max-h-20 overflow-y-auto ${tc.output ? 'bg-gray-50 text-gray-700' : 'bg-yellow-50 text-yellow-600 italic'}`}>
                                            {tc.output || "Waiting for generation..."}
                                        </div>
                                    </div>
                                 </div>
                            </div>
                        )
                    })}
                </div>

                {/* Pagination Controls */}
                {totalListPages > 1 && (
                    <div className="p-3 border-t bg-white flex justify-between items-center text-sm">
                        <button 
                            disabled={listPage === 1} 
                            onClick={() => setListPage(p => p - 1)}
                            className="px-3 py-1.5 rounded bg-gray-100 disabled:opacity-50 hover:bg-gray-200 text-gray-700 font-medium"
                        >
                            Previous
                        </button>
                        <span className="text-gray-500">Page {listPage} of {totalListPages}</span>
                        <button 
                            disabled={listPage === totalListPages} 
                            onClick={() => setListPage(p => p + 1)}
                            className="px-3 py-1.5 rounded bg-gray-100 disabled:opacity-50 hover:bg-gray-200 text-gray-700 font-medium"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* --- MODAL 2: ENTRY FORM (Add/Edit) --- */}
      {/* (Remains identical to previous version) */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEntryModalOpen(false)} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-in">
                <div className="px-5 py-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">{editingId ? "Edit Test Case" : "Add New Test Case"}</h3>
                    <button onClick={() => setIsEntryModalOpen(false)} className="text-gray-400 hover:text-gray-600">Cancel</button>
                </div>
                <div className="p-5 space-y-4">
                    {params.length === 0 ? (
                         <div className="text-red-500 text-sm text-center">Please define problem parameters first.</div>
                    ) : (
                        <div className="space-y-3">
                            {params.map((param, idx) => (
                                <div key={param.id}>
                                    <label className="text-xs font-bold text-gray-500 uppercase flex justify-between mb-1">
                                        <span>{param.name}</span>
                                        <span className="text-gray-400 font-mono">{param.type}</span>
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder={`Enter value for ${param.name}...`}
                                        className="w-full border rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
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
                    <div className="pt-2 flex justify-between items-center">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                                checked={isHidden}
                                onChange={e => setIsHidden(e.target.checked)}
                            />
                            Mark as Hidden Case
                        </label>
                        <button
                            onClick={handleSaveManual}
                            disabled={params.length === 0}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition transform active:scale-95"
                        >
                            {editingId ? "Update Case" : "Save Case"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL 3: GENERATED RESULTS (TABS + PAGINATED) --- */}
      {isGeneratedModalOpen && tcResult?.outputInline && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsGeneratedModalOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-in-up">
                
                {/* Header & Tabs */}
                <div className="bg-gray-50 border-b">
                    <div className="p-5 pb-3 flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">✨ Generated Reference Outputs</h3>
                            <p className="text-xs text-gray-500 mt-1">Review outputs generated by your reference solution.</p>
                        </div>
                        <button onClick={() => setIsGeneratedModalOpen(false)} className="text-gray-500 hover:text-gray-700 px-2 text-xl">✕</button>
                    </div>
                    
                    <div className="flex px-5 gap-4 mt-2">
                        <button 
                            onClick={() => { setGenTab("all"); setGenPage(1); }}
                            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${genTab === "all" ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                        >
                            All Results ({processedOutputs.length})
                        </button>
                        <button 
                            onClick={() => { setGenTab("errors"); setGenPage(1); }}
                            className={`pb-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${genTab === "errors" ? "border-red-600 text-red-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                        >
                            Errors 
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${errorCount > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>
                                {errorCount}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar bg-gray-100 flex-1">
                    {paginatedOutputs.length === 0 && (
                        <div className="text-center text-gray-500 italic py-10">
                            {genTab === "errors" ? "🎉 No errors found! Your code is perfect." : "No results available."}
                        </div>
                    )}
                    
                    {paginatedOutputs.map((genResult) => {
                        return (
                            <div key={genResult.originalIndex} className={`border rounded-xl p-4 shadow-sm bg-white ${genResult.isError ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'}`}>
                                 <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-bold text-gray-700">Test Case #{genResult.originalIndex + 1}</span>
                                    <div className="flex gap-2">
                                        {genResult.isHidden && <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">Hidden</span>}
                                        {genResult.isError && <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">Error Detected</span>}
                                    </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-4">
                                     <div>
                                         <div className="text-xs text-gray-500 uppercase font-bold mb-1">Input Sent</div>
                                         <div className="bg-gray-50 border rounded p-2 font-mono text-xs max-h-32 overflow-y-auto custom-scrollbar break-all">
                                            {genResult.input}
                                         </div>
                                     </div>
                                     <div>
                                         <div className="text-xs text-gray-500 uppercase font-bold mb-1">Generated Output</div>
                                         <div className={`border rounded p-2 font-mono text-xs max-h-32 overflow-y-auto custom-scrollbar break-all ${genResult.isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`}>
                                            {genResult.output}
                                         </div>
                                     </div>
                                 </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination Controls for Generated Results */}
                {totalGenPages > 1 && (
                    <div className="p-3 bg-white border-t flex justify-between items-center text-sm">
                         <button 
                            disabled={genPage === 1} 
                            onClick={() => setGenPage(p => p - 1)}
                            className="px-3 py-1.5 rounded bg-gray-100 disabled:opacity-50 hover:bg-gray-200 text-gray-700 font-medium"
                        >
                            Previous
                        </button>
                        <span className="text-gray-500">Page {genPage} of {totalGenPages}</span>
                        <button 
                            disabled={genPage === totalGenPages} 
                            onClick={() => setGenPage(p => p + 1)}
                            className="px-3 py-1.5 rounded bg-gray-100 disabled:opacity-50 hover:bg-gray-200 text-gray-700 font-medium"
                        >
                            Next
                        </button>
                    </div>
                )}

                <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                    <span className="text-sm text-gray-500">Showing {displayedOutputs.length} Cases</span>
                    <div className="flex gap-3">
                        <button onClick={() => setIsGeneratedModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm">Cancel</button>
                        <button 
                            onClick={handleAcceptOutputs}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm text-sm"
                        >
                            Accept & Save Outputs
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  )
}