"use client"
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, FileCode2 } from 'lucide-react';
import TestCaseViewer from './TestCaseViewer'; // Another client component
import { updatePorblemStatus } from '../../../actions/action';
// import { approveProblemAction } from '../actions'; // Server Action

export default function ReviewManager({ initialData }: { initialData: any[] }) {
  const [problems, setProblems] = useState(initialData);
  const [reviewing, setReviewing] = useState<any | null>(null);

  const handleAction = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    // 1. Call your Next.js Server Action
    // await approveProblemAction(id, status);
    await updatePorblemStatus({problemId:id, status})
    
    setProblems(prev => prev.filter(p => p.id !== id));
    setReviewing(null);
  };

  useEffect(()=> {
    setProblems(initialData)
  },[initialData])
  
  if (reviewing) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-300">
        <button onClick={() => setReviewing(null)} className="text-gray-500 hover:text-white text-sm mb-6">
          &larr; Back to Queue
        </button>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8">
          <div className="flex justify-between items-start mb-8 border-b border-gray-800 pb-6">
            <div>
              <h2 className="text-3xl font-bold text-white">{reviewing.title}</h2>
              <p className="text-gray-400 mt-2">By {reviewing.author}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleAction(reviewing.id, 'REJECTED')} className="px-4 py-2 rounded-lg border border-red-500/30 text-red-500 font-bold">
                Reject
              </button>
              <button onClick={() => handleAction(reviewing.id, 'ACCEPTED')} className="px-6 py-2 rounded-lg bg-emerald-600 text-white font-bold">
                Approve & Publish
              </button>
            </div>
          </div>

          {/* Extract the complex hide/reveal logic to its own component */}
          <TestCaseViewer testCases={reviewing.testCases} />
        </div>
      </div>
    );
  }

  // Otherwise, show the Table
  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full text-left text-sm">
        {/* ... Table Headers ... */}
        <tbody className="divide-y divide-gray-800">
          {problems.map((p) => (
            <tr key={p.id} className="hover:bg-gray-800/30">
              <td className="px-6 py-4 text-white">{p.title}</td>
              <td className="px-6 py-4 text-gray-400">{p.author}</td>
              <td className="px-6 py-4 text-right">
                <button onClick={() => setReviewing(p)} className="text-blue-400">Review &rarr;</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}