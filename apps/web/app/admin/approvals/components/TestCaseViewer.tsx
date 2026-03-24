"use client";

import { useState } from 'react';
import { Eye, EyeOff, FileCode2 } from 'lucide-react';

// Define the shape of your test case data
interface TestCase {
  input: string | any;
  output: string | any;
  isHidden?: boolean; // Determines if it's a public or private case
}

interface TestCaseViewerProps {
  testCases: TestCase[];
}

export default function TestCaseViewer({ testCases }: TestCaseViewerProps) {
  const [showTestCases, setShowTestCases] = useState(false);

  // Helper to safely format JSON strings (like your Sudoku arrays)
  // so they look readable instead of a massive single line of text.
  const formatData = (data: any) => {
    if (!data) return "No data";
    if (typeof data !== 'string') return JSON.stringify(data, null, 2);
    
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return data; // Return as-is if it's just a normal string
    }
  };

  return (
    <div className="mt-8 space-y-4 animate-in fade-in duration-500">
      {/* --- HEADER & TOGGLE --- */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <FileCode2 size={20} className="text-blue-400" /> Test Cases Validation
        </h3>
        <button
          onClick={() => setShowTestCases(!showTestCases)}
          className="flex items-center gap-2 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
        >
          {showTestCases ? (
            <><EyeOff size={16} /> Hide Data</>
          ) : (
            <><Eye size={16} /> Reveal Data</>
          )}
        </button>
      </div>

      {/* --- VIEWER CONTAINER --- */}
      <div
        className={`relative border border-gray-800 rounded-lg overflow-hidden transition-all duration-300 ${
          showTestCases ? 'bg-[#242424]' : 'bg-[#1a1a1a]'
        }`}
      >
        {/* The "Blur/Hidden" Security Overlay */}
        {!showTestCases && (
          <div className="absolute inset-0 z-10 backdrop-blur-md bg-[#1a1a1a]/85 flex flex-col items-center justify-center">
            <EyeOff size={32} className="text-gray-500 mb-3" />
            <p className="text-gray-300 font-bold text-lg">Test Cases Hidden</p>
            <p className="text-gray-500 font-medium text-sm mt-1">
              Click 'Reveal Data' to view sensitive test inputs and outputs.
            </p>
          </div>
        )}

        {/* Test Case List */}
        <div className="p-4 space-y-5 max-h-[500px] overflow-y-auto custom-scrollbar">
          {testCases && testCases.length > 0 ? (
            testCases.map((tc, idx) => (
              <div key={idx} className="bg-black/40 p-4 rounded-xl border border-gray-800/80">
                {/* Case Header */}
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-800/50">
                  <span className="text-gray-400 font-bold flex items-center gap-3">
                    Case {idx + 1}
                    {tc.isHidden && (
                      <span className="bg-orange-500/10 text-orange-500 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-orange-500/20 font-bold">
                        Hidden Case
                      </span>
                    )}
                  </span>
                </div>
                
                {/* I/O Grids */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Input Block */}
                  <div>
                    <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                      Input
                    </div>
                    <div className="bg-[#1e1e1e] p-3 rounded-lg border border-gray-800">
                      <pre className="text-blue-300 font-mono text-[13px] whitespace-pre-wrap break-all custom-scrollbar overflow-x-auto max-h-[200px]">
                        {formatData(tc.input)}
                      </pre>
                    </div>
                  </div>
                  
                  {/* Output Block */}
                  <div>
                    <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                      Expected Output
                    </div>
                    <div className="bg-[#1e1e1e] p-3 rounded-lg border border-gray-800">
                      <pre className="text-emerald-300 font-mono text-[13px] whitespace-pre-wrap break-all custom-scrollbar overflow-x-auto max-h-[200px]">
                        {formatData(tc.output)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 italic">
              No test cases found for this problem.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}