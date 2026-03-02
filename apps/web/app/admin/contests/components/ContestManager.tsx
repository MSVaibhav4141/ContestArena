"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Calendar, Users, Edit, X, Clock, GripVertical, Trash2 } from "lucide-react";
import { useDebounce } from "./debouncing";
import { createContest, searchProblems,deleteContest } from "../../../actions/action";

export default function ContestManager({ initialData }: { initialData: any[] }) {
  // ... (Keep your existing state for search and table here)
  const [contests, setContests] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const filteredContests = contests.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'text-emerald-500 bg-emerald-500/10';
      case 'UPCOMING': return 'text-blue-500 bg-blue-500/10';
      case 'ENDED': return 'text-gray-500 bg-gray-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };
  // --- NEW: FORM STATE ---
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    isPublic: true,
  });

  // --- NEW: PROBLEM SELECTOR STATE ---
  const [problemSearch, setProblemSearch] = useState("");
  const [selectedProblems, setSelectedProblems] = useState<any[]>([]);
  const [problems, setPorblem] = useState<{id:string, title:string, difficulty:string}[]>([])
  const debouncedSearch = useDebounce(problemSearch, 400);
  const availableToSelect = problems.filter(
    p => p.title.toLowerCase().includes(problemSearch.toLowerCase()) && 
         !selectedProblems.find(sp => sp.id === p.id)
  );

  const handleAddProblem = (problem: any) => {
    setSelectedProblems(prev => [...prev, { ...problem, points: 100 }]); // Default 100 points
    setProblemSearch(""); // Clear search
    console.log('heu')
  };

  const handleRemoveProblem = (id: string) => {
    setSelectedProblems(prev => prev.filter(p => p.id !== id));
  };

  const handlePointsChange = (id: string, points: number) => {
    setSelectedProblems(prev => prev.map(p => p.id === id ? { ...p, points } : p));
  };

  const handleSubmit = async () => {
    const payload = { ...formData, problems: selectedProblems };
    console.log("Submitting Contest Payload:", payload);
    await createContest(payload)
    // TODO: Pass this payload to your Next.js Server Action to save in Prisma
    alert("Check console for payload!");
  };

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedSearch.length < 2) {
        setPorblem([]);
        return;
      }

    
      const data = await searchProblems(debouncedSearch, 'ACCEPTED');
      setPorblem(data);
    };

    fetchResults();
  }, [debouncedSearch]);

  useEffect(() => {
    setContests(initialData)
  }, [initialData])

   const handleDelete = async (contestId: string) => {
    if (!confirm("Are you sure you want to delete this contest? All problem linkages will be lost.")) return;

    const previousContests = [...contests];
    setContests(prev => prev.filter(c => c.id !== contestId));

    const result = await deleteContest(contestId);

    if (!result.success) {
      setContests(previousContests);
      alert(result.error);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search contests..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#1a1a1a] border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none w-72" 
          />
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          <Plus size={16} /> Create Contest
        </button>
      </div>

      {/* Contest Table */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#242424] text-gray-400 font-medium border-b border-gray-800">
            <tr>
              <th className="px-6 py-4">Contest Title</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Schedule</th>
              <th className="px-6 py-4">Participants</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
  {filteredContests.map((c) => (
    <tr key={c.id} className="hover:bg-gray-800/30 transition-colors">
      <td className="px-6 py-4 font-bold text-gray-200">{c.title}</td>
      
      <td className="px-6 py-4">
        <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${getStatusColor(c.status)}`}>
          {c.status}
        </span>
      </td>
      
      <td className="px-6 py-4 text-gray-400">
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={12} /> {c.startTime}
        </div>
      </td>
      
      <td className="px-6 py-4 text-gray-400">
        <div className="flex items-center gap-2">
          <Users size={14} /> {c.participants}
        </div>
      </td>
      
      <td className="px-6 py-4 text-right">
        {/* Added a Flex container to align the action buttons nicely */}
        <div className="flex items-center justify-end gap-3">
          
          <button 
            className="text-gray-400 hover:text-blue-400 transition-colors p-1.5 rounded-lg hover:bg-gray-800"
            title="Edit Contest"
          >
            <Edit size={16} />
          </button>

          <button 
            onClick={() => handleDelete(c.id)}
            className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
            title="Delete Contest"
          >
            <Trash2 size={16} />
          </button>
          
        </div>
      </td>
    </tr>
  ))}
</tbody>
        </table>
      </div>


      {/* Expanded Slide-out Panel for Creating a Contest */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          {/* Increased width to 600px for a better form layout */}
          <div className="w-[600px] bg-[#1a1a1a] border-l border-gray-800 h-full flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#1a1a1a] shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">Draft New Contest</h2>
                <p className="text-xs text-gray-500 mt-1">Configure details, schedule, and problem set.</p>
              </div>
              <button onClick={() => setIsCreating(false)} className="p-2 text-gray-500 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {/* Scrollable Form Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
               
               {/* Section 1: Basic Details */}
               <div className="space-y-4">
                 <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">
                   1. Basic Details
                 </h3>
                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Contest Title</label>
                   <input 
                     type="text" 
                     value={formData.title}
                     onChange={e => setFormData({...formData, title: e.target.value})}
                     className="w-full bg-[#242424] border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors" 
                     placeholder="e.g. Weekly Coder Challenge #1" 
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Description / Rules</label>
                   <textarea 
                     rows={3}
                     value={formData.description}
                     onChange={e => setFormData({...formData, description: e.target.value})}
                     className="w-full bg-[#242424] border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none transition-colors" 
                     placeholder="Explain the rules, prizes, or theme..." 
                   />
                 </div>
               </div>

               {/* Section 2: Scheduling */}
               <div className="space-y-4">
                 <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">
                   2. Schedule
                 </h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Calendar size={14}/> Start Time</label>
                     {/* Using native datetime-local. Browsers style this automatically based on OS/Browser */}
                     <input 
                       type="datetime-local" 
                       value={formData.startTime}
                       onChange={e => setFormData({...formData, startTime: e.target.value})}
                       className="w-full bg-[#242424] border border-gray-700 rounded-lg p-2.5 text-gray-300 focus:text-white focus:border-blue-500 outline-none css-invert-calendar-icon" 
                     />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Clock size={14}/> End Time</label>
                     <input 
                       type="datetime-local" 
                       value={formData.endTime}
                       onChange={e => setFormData({...formData, endTime: e.target.value})}
                       className="w-full bg-[#242424] border border-gray-700 rounded-lg p-2.5 text-gray-300 focus:text-white focus:border-blue-500 outline-none css-invert-calendar-icon" 
                     />
                   </div>
                 </div>
               </div>

               {/* Section 3: Problem Selection Engine */}
               <div className="space-y-4">
                 <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">
                   3. Problem Set
                 </h3>
                 
                 {/* Problem Search Dropdown */}
                 <div className="relative">
                   <div className="relative">
                     <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                     <input 
                       type="text" 
                       value={problemSearch}
                       onChange={e => {setProblemSearch(e.target.value); 
                    }}
                       className="w-full bg-[#242424] border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none" 
                       placeholder="Search to add approved problems..." 
                     />
                   </div>
                   
                   {/* Search Results Popover */}
                   {problemSearch.length > 0 && availableToSelect.length > 0 && (
                     <div className="absolute z-10 mt-1 w-full bg-[#2a2a2a] border border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                       {availableToSelect.map(p => (
                         <button 
                           key={p.id}
                           onClick={() => handleAddProblem(p)}
                           className="w-full flex items-center justify-between p-3 hover:bg-blue-600/20 transition-colors border-b border-gray-700/50 last:border-0 text-left"
                         >
                           <span className="text-sm font-bold text-gray-200">{p.title}</span>
                           <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                             p.difficulty === 'EASY' ? 'bg-emerald-500/10 text-emerald-500' : 
                             p.difficulty === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500' : 
                             'bg-red-500/10 text-red-500'
                           }`}>{p.difficulty}</span>
                         </button>
                       ))}
                     </div>
                   )}
                 </div>

                 {/* Selected Problems List */}
                 <div className="space-y-2 mt-4">
                   {selectedProblems.length === 0 ? (
                     <div className="text-center p-6 border-2 border-dashed border-gray-800 rounded-xl text-gray-500 text-sm">
                       No problems added yet. Search above to build your contest.
                     </div>
                   ) : (
                     selectedProblems.map((p, index) => (
                       <div key={p.id} className="flex items-center gap-3 bg-[#242424] border border-gray-700 rounded-xl p-3 group">
                         <div className="text-gray-600 cursor-grab hover:text-gray-400"><GripVertical size={16} /></div>
                         <div className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">{index + 1}</div>
                         
                         <div className="flex-1">
                           <div className="text-sm font-bold text-gray-200">{p.title}</div>
                         </div>
                         
                         {/* Points Assigner */}
                         <div className="flex items-center gap-2">
                           <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Pts</span>
                           <input 
                             type="number" 
                             value={p.points}
                             onChange={(e) => handlePointsChange(p.id, parseInt(e.target.value) || 0)}
                             className="w-16 bg-[#1a1a1a] border border-gray-700 rounded p-1 text-center text-sm text-white outline-none focus:border-blue-500"
                           />
                         </div>

                         <button onClick={() => handleRemoveProblem(p.id)} className="text-gray-600 hover:text-red-400 p-1 transition-colors">
                           <Trash2 size={16} />
                         </button>
                       </div>
                     ))
                   )}
                 </div>
               </div>
            </div>

            {/* Footer / Submit Area */}
            <div className="p-6 border-t border-gray-800 bg-[#1a1a1a] shrink-0">
               <button 
                 onClick={handleSubmit}
                 disabled={selectedProblems.length === 0 || !formData.title}
                 className="w-full bg-blue-600 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors"
               >
                 Publish Contest
               </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}