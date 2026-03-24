"use client";

import { useState, useEffect } from "react";
import { Search, Edit, Trash2, CodeSquare, ChevronLeft, ChevronRight, X, Save } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { deleteProblem, updateProblem } from "../../../actions/action";

interface ProblemManagerProps {
  initialData: any[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export default function ProblemManager({ initialData, currentPage, totalPages, totalCount }: ProblemManagerProps) {
  const [problems, setProblems] = useState(initialData);
  const router = useRouter();
  const pathname = usePathname();

  const [editingProblem, setEditingProblem] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Keep state in sync when URL changes (pagination)
  useEffect(() => {
    setProblems(initialData);
  }, [initialData]);

  const handleSaveEdit = async () => {
    if (!editingProblem) return;
    setIsSubmitting(true);

    // 1. Call the Server Action
    const result = await updateProblem(editingProblem.id, {
      title: editingProblem.title,
      difficulty: editingProblem.difficulty,
      status: editingProblem.status
    });

    if (result.success) {
      // 2. Optimistic Update (Instantly reflect changes in the table)
      setProblems(prev => prev.map(p => 
        p.id === editingProblem.id ? { ...p, ...editingProblem } : p
      ));
      // 3. Close the drawer
      setEditingProblem(null);
    } else {
      alert(result.error);
    }
    
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this problem?")) return;

    // Optimistic Update
    const previous = [...problems];
    setProblems(prev => prev.filter(p => p.id !== id));

    const result = await deleteProblem(id);
    if (!result.success) {
      setProblems(previous); // Rollback
      alert(result.error);
    }
  };

  // Pagination Handler
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      // Updates the URL, which forces the Server Component to re-fetch!
      router.push(`${pathname}?page=${newPage}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search library" 
            className="bg-[#1a1a1a] border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none w-80" 
          />
        </div>
        <div className="text-sm font-medium text-gray-400">
          Total Library: <span className="text-white">{totalCount}</span> Problems
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden flex flex-col min-h-[500px]">
        <table className="w-full text-left text-sm flex-1">
          <thead className="bg-[#242424] text-gray-400 font-medium border-b border-gray-800">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Author</th>
              <th className="px-6 py-4">Difficulty</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {problems.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-500">
                  <CodeSquare size={32} className="mx-auto mb-3 opacity-20" />
                  No problems found on this page.
                </td>
              </tr>
            ) : (
              problems.map((p) => (
                <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-200">{p.title}</td>
                  <td className="px-6 py-4 text-gray-400">{p.author}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${
                      p.difficulty === 'EASY' ? 'text-emerald-500 bg-emerald-500/10' : 
                      p.difficulty === 'MEDIUM' ? 'text-yellow-500 bg-yellow-500/10' : 
                      'text-red-500 bg-red-500/10'
                    }`}>
                      {p.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-400 font-medium border border-gray-700 px-2 py-1 rounded">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                      onClick={() => setEditingProblem({ ...p })} // Pass a copy of the problem
                      className="text-gray-400 hover:text-blue-400 p-1.5 rounded hover:bg-gray-800"
                    >
                      <Edit size={16} />
                    </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="text-gray-400 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAGINATION CONTROLS */}
        <div className="p-4 border-t border-gray-800 bg-[#1a1a1a] flex items-center justify-between text-sm">
          <div className="text-gray-500">
            Showing Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages || 1}</span>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-700 bg-[#242424] text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-700 bg-[#242424] text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
        {editingProblem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-[450px] bg-[#1a1a1a] border-l border-gray-800 h-full flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
            
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#1a1a1a] shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">Edit Problem</h2>
                <p className="text-xs text-gray-500 mt-1">Update metadata and platform status.</p>
              </div>
              <button onClick={() => setEditingProblem(null)} className="p-2 text-gray-500 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
               <div>
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Problem Title</label>
                 <input 
                   type="text" 
                   value={editingProblem.title}
                   onChange={e => setEditingProblem({...editingProblem, title: e.target.value})}
                   className="w-full bg-[#242424] border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" 
                 />
               </div>

               <div>
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Difficulty</label>
                 <select 
                   value={editingProblem.difficulty}
                   onChange={e => setEditingProblem({...editingProblem, difficulty: e.target.value})}
                   className="w-full bg-[#242424] border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                 >
                   <option value="EASY">Easy</option>
                   <option value="MEDIUM">Medium</option>
                   <option value="HARD">Hard</option>
                 </select>
               </div>

               <div>
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Approval Status</label>
                 <select 
                   value={editingProblem.status}
                   onChange={e => setEditingProblem({...editingProblem, status: e.target.value})}
                   className="w-full bg-[#242424] border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                 >
                   <option value="PENDING">Pending Review</option>
                   <option value="ACCEPTED">Published (Accepted)</option>
                   <option value="REJECTED">Rejected</option>
                 </select>
               </div>
            </div>

            <div className="p-6 border-t border-gray-800 bg-[#1a1a1a] shrink-0">
               <button 
                 onClick={handleSaveEdit}
                 disabled={isSubmitting || !editingProblem.title}
                 className="w-full bg-blue-600 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
               >
                 {isSubmitting ? "Saving..." : <><Save size={18} /> Save Changes</>}
               </button>
            </div>

          </div>
        </div>
      )}
      </div>
    </div>
  );
}