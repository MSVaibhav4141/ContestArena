"use client"
import { useState, useEffect, Dispatch, SetStateAction } from "react"
import { InputParam, TestCase } from "@repo/types"

interface Props {
  params: InputParam[] ,
  cases:TestCase[],
  setCases:Dispatch<SetStateAction<TestCase[]>> // <--- Now receives the schema
}

export default function TestCaseManager({ params, cases, setCases }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // State for individual input arguments
  // We store them as an array of strings, matching the order of 'params'
  const [inputValues, setInputValues] = useState<string[]>([])
  
  const [output, setOutput] = useState("")
  const [isHidden, setIsHidden] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Sync state length when params change (e.g. user adds a new parameter)
  useEffect(() => {
    setInputValues(prev => {
        const newValues = [...prev];
        // If params grew, fill with empty strings
        if (params.length > prev.length) {
            return [...newValues, ...new Array(params.length - prev.length).fill("")];
        }
        // If params shrank, slice the array
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
    // 1. Validate all inputs are filled
    if (inputValues.some(v => !v.trim()) || !output.trim()) {
        return alert("All input arguments and expected output are required.")
    }

    // 2. Validate JSON format for complex types (Arrays/Objects)
    // We treat everything as JSON for consistency in the "Serialized" approach
    try {
        params.forEach((p, idx) => {
            const val = inputValues[idx] ?? "";
            // Simple heuristic: if it looks like an array/object, try to parse it
            if (p.type.includes("[]") || p.type === "TreeNode" || p.type === "ListNode") {
                JSON.parse(val); // Will throw if invalid
            }
        })
    } catch (e) {
        return alert(`Invalid Format: Complex types (arrays/lists) must be valid JSON.\nExample: [1,2,3] or [[1,2],[3,4]]`);
    }

    // 3. Serialize: Join with newlines (One arg per line)
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
    
    // De-serialize: Split by newline to fill the individual boxes
    const values = tc.input.split('\n');
    setInputValues(values);
    
    setOutput(tc.output)
    setIsHidden(tc.isHidden || false)
    setIsModalOpen(false) 
  }

  const handleDelete = (id: string) => {
    setCases(prev => prev.filter(c => c.id !== id))
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

        {/* --- DYNAMIC INPUT FORM --- */}
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            {params.length === 0 ? (
                <div className="text-sm text-gray-500 italic text-center py-2">
                    Define problem parameters on the left to add test cases.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                    {/* Map over defined parameters to create inputs */}
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
                    disabled={params.length === 0}
                    className="bg-blue-600 disabled:bg-gray-400 text-white px-5 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition shadow-sm font-medium"
                >
                    {editingId ? "Update Case" : "Add Case"}
                </button>
            </div>
        </div>
        
        {/* --- LIST PREVIEW --- */}
        <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar min-h-0 pt-2">
          {visibleCases.map((tc, index) => (
            <div key={tc.id} className={`border rounded-lg p-3 text-sm transition-colors ${tc.isHidden ? 'bg-purple-50 border-purple-100' : 'bg-gray-50 hover:bg-white hover:shadow-sm'}`}>
              <div className="flex justify-between items-start mb-2">
                 <span className="text-xs font-bold text-gray-400">Case #{index + 1}</span>
                 {tc.isHidden && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">HIDDEN</span>}
              </div>
              
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-2 font-mono text-xs text-gray-600">
                 <div className="truncate bg-white border px-1.5 py-1 rounded" title={tc.input.replace(/\n/g, ', ')}>
                    {tc.input.replace(/\n/g, ' | ')}
                 </div>
                 <span className="text-gray-400">➔</span>
                 <div className="truncate bg-white border px-1.5 py-1 rounded" title={tc.output}>
                    {tc.output}
                 </div>
              </div>

              <div className="flex justify-end gap-3 text-xs">
                <button onClick={() => handleEdit(tc)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                <button onClick={() => handleDelete(tc.id)} className="text-red-600 hover:text-red-800 font-medium">Delete</button>
              </div>
            </div>
          ))}
           {cases.length === 0 && params.length > 0 && (
                <div className="text-center text-gray-400 text-sm py-4">No test cases added yet.</div>
           )}
        </div>
      </div>

      {/* --- MODAL (Unchanged Logic, just using params length for nice display if needed) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-slide-in-up">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-800">All Test Cases</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 px-2">✕</button>
                </div>
                <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar">
                    {cases.map((tc, idx) => (
                        <div key={tc.id} className="border rounded-lg p-3 bg-gray-50">
                             <div className="flex justify-between mb-2">
                                <span className="text-xs font-bold text-gray-400">Case #{idx + 1}</span>
                                {tc.isHidden && <span className="text-xs bg-purple-100 text-purple-700 px-2 rounded-full">Hidden</span>}
                             </div>
                             <div className="space-y-2">
                                <div>
                                    <div className="text-xs text-gray-500 uppercase mb-1">Input (Args: {params.length})</div>
                                    {/* Display inputs nicely separated */}
                                    <div className="bg-white border rounded p-2 font-mono text-sm">
                                        {tc.input.split('\n').map((line, i) => (
                                            <div key={i} className="flex gap-2">
                                                <span className="text-gray-300 select-none w-4 text-right">{i+1}:</span>
                                                <span>{line}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase mb-1">Expected Output</div>
                                    <div className="bg-white border rounded p-2 font-mono text-sm">{tc.output}</div>
                                </div>
                             </div>
                        </div>
                    ))}
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