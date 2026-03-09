"use client";

import { useEffect, useState } from "react";
import { X, Calendar, Clock, Search, GripVertical, Trash2 } from "lucide-react";
import { useDebounce } from "./debouncing";
import { createContest, updateContest, searchProblems } from "../../../actions/action";

const formatDatetimeLocal = (dateString: string | Date) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

interface ContestFormPanelProps {
  isOpen: boolean;
  onClose: () => void;
  contestData: any | null; 
}

export default function ContestFormPanel({ isOpen, onClose, contestData }: ContestFormPanelProps) {
  const [formData, setFormData] = useState({
    title: "", description: "", startTime: "", endTime: "", isPublic: true,
  });
  
  const [problemSearch, setProblemSearch] = useState("");
  const [selectedProblems, setSelectedProblems] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  
  const debouncedSearch = useDebounce(problemSearch, 400);

  useEffect(() => {
    if (isOpen) {
      if (contestData) {
        setFormData({
          title: contestData.title,
          description: contestData.description,
          startTime: formatDatetimeLocal(contestData.startTime),
          endTime: formatDatetimeLocal(contestData.endTime),
          isPublic: contestData.isPublic ?? true,
        });
        
        const mapped = contestData.problems ? contestData.problems.map((linker: any) => ({
          id: linker.problem.id, title: linker.problem.title,
          difficulty: linker.problem.difficulty, points: linker.problemPoint || 100
        })) : [];
        setSelectedProblems(mapped);
      } else {
        setFormData({ title: "", description: "", startTime: "", endTime: "", isPublic: true });
        setSelectedProblems([]);
      }
      setProblemSearch("");
      setProblems([]);
    }
  }, [isOpen, contestData]);

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedSearch.length < 2) {
        setProblems([]);
        return;
      }
      const data = await searchProblems(debouncedSearch, 'ACCEPTED');
      setProblems(data);
    };
    fetchResults();
  }, [debouncedSearch]);

  if (!isOpen) return null;

  const availableToSelect = problems.filter(
    p => p.title.toLowerCase().includes(problemSearch.toLowerCase()) && 
         !selectedProblems.find(sp => sp.id === p.id)
  );

  const handleSubmit = async () => {
    const payload = { ...formData, problems: selectedProblems };
    if (contestData) {
      await updateContest(contestData.id, payload);
    } else {
      await createContest(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-[600px] bg-[#1a1a1a] border-l border-gray-800 h-full flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#1a1a1a] shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">{contestData ? "Edit Contest" : "Draft New Contest"}</h2>
            <p className="text-xs text-gray-500 mt-1">Configure details, schedule, and problem set.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
           <div className="space-y-4">
             <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">1. Basic Details</h3>
             <div>
               <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Contest Title</label>
               <input 
                 type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                 className="w-full bg-[#242424] border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors" 
               />
             </div>
             <div>
               <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Description / Rules</label>
               <textarea 
                 rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                 className="w-full bg-[#242424] border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none transition-colors" 
               />
             </div>
           </div>

           <div className="space-y-4">
             <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">2. Schedule</h3>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Calendar size={14}/> Start Time</label>
                 <input type="datetime-local" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full bg-[#242424] border border-gray-700 rounded-lg p-2.5 text-gray-300 focus:text-white focus:border-blue-500 outline-none css-invert-calendar-icon" />
               </div>
               <div>
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Clock size={14}/> End Time</label>
                 <input type="datetime-local" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full bg-[#242424] border border-gray-700 rounded-lg p-2.5 text-gray-300 focus:text-white focus:border-blue-500 outline-none css-invert-calendar-icon" />
               </div>
             </div>
           </div>

           <div className="space-y-4">
             <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">3. Problem Set</h3>
             <div className="relative">
               <div className="relative">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                 <input type="text" value={problemSearch} onChange={e => setProblemSearch(e.target.value)} className="w-full bg-[#242424] border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none" placeholder="Search problems..." />
               </div>
               {problemSearch.length > 0 && availableToSelect.length > 0 && (
                 <div className="absolute z-10 mt-1 w-full bg-[#2a2a2a] border border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                   {availableToSelect.map(p => (
                     <button key={p.id} onClick={() => { setSelectedProblems(prev => [...prev, { ...p, points: 100 }]); setProblemSearch(""); }} className="w-full flex items-center justify-between p-3 hover:bg-blue-600/20 transition-colors border-b border-gray-700/50 last:border-0 text-left">
                       <span className="text-sm font-bold text-gray-200">{p.title}</span>
                     </button>
                   ))}
                 </div>
               )}
             </div>

             <div className="space-y-2 mt-4">
               {selectedProblems.map((p, index) => (
                 <div key={p.id} className="flex items-center gap-3 bg-[#242424] border border-gray-700 rounded-xl p-3 group">
                   <div className="text-gray-600 cursor-grab hover:text-gray-400"><GripVertical size={16} /></div>
                   <div className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">{index + 1}</div>
                   <div className="flex-1"><div className="text-sm font-bold text-gray-200">{p.title}</div></div>
                   <div className="flex items-center gap-2">
                     <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Pts</span>
                     <input type="number" value={p.points} onChange={(e) => setSelectedProblems(prev => prev.map(item => item.id === p.id ? { ...item, points: parseInt(e.target.value) || 0 } : item))} className="w-16 bg-[#1a1a1a] border border-gray-700 rounded p-1 text-center text-sm text-white outline-none focus:border-blue-500" />
                   </div>
                   <button onClick={() => setSelectedProblems(prev => prev.filter(item => item.id !== p.id))} className="text-gray-600 hover:text-red-400 p-1 transition-colors"><Trash2 size={16} /></button>
                 </div>
               ))}
             </div>
           </div>
        </div>

        <div className="p-6 border-t border-gray-800 bg-[#1a1a1a] shrink-0">
           <button onClick={handleSubmit} disabled={selectedProblems.length === 0 || !formData.title} className="w-full bg-blue-600 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">
             {contestData ? "Save Changes" : "Publish Contest"}
           </button>
        </div>
      </div>
    </div>
  );
}