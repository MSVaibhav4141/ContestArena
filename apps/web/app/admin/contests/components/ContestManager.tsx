"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { deleteContest } from "../../../actions/action";
import ContestTable from "./ContestTable";
import ContestFormPanel from "./ContestForm";
import { Contest } from "@repo/types";

// Define the types (you can also import these if you put them in a types file)



export default function ContestManager({ initialData }: { initialData: Contest[] }) {
  // Explicitly type the states using the Contest interface
  const [contests, setContests] = useState<Contest[]>(initialData);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingContest, setEditingContest] = useState<Contest | null>(null);

  useEffect(() => {
    setContests(initialData);
  }, [initialData]);

  const filteredContests = contests.filter((c) => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingContest(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (contest: Contest) => {
    setEditingContest(contest);
    setIsFormOpen(true);
  };

  const handleDelete = async (contestId: string) => {
    if (!confirm("Are you sure you want to delete this contest? All problem linkages will be lost.")) return;

    const previousContests = [...contests];
    setContests((prev) => prev.filter((c) => c.id !== contestId));

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
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          <Plus size={16} /> Create Contest
        </button>
      </div>

      <ContestTable 
        contests={filteredContests} 
        onEdit={handleEditClick} 
        onDelete={handleDelete} 
      />

      <ContestFormPanel 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        contestData={editingContest}
      />
    </div>
  );
}