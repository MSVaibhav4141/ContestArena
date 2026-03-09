"use client";

import { Calendar, Users, Edit, Trash2 } from "lucide-react";

interface ContestTableProps {
  contests: any[];
  onEdit: (contest: any) => void;
  onDelete: (id: string) => void;
}

export default function ContestTable({ contests, onEdit, onDelete }: ContestTableProps) {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'text-emerald-500 bg-emerald-500/10';
      case 'UPCOMING': return 'text-blue-500 bg-blue-500/10';
      case 'ENDED': return 'text-gray-500 bg-gray-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
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
          {contests.map((c) => (
            <tr key={c.id} className="hover:bg-gray-800/30 transition-colors">
              <td className="px-6 py-4 font-bold text-gray-200">{c.title}</td>
              <td className="px-6 py-4">
                <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${getStatusColor(c.status)}`}>
                  {c.status}
                </span>
              </td>
              <td className="px-6 py-4 text-gray-400">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={12} /> {new Date(c.startTime).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 text-gray-400">
                <div className="flex items-center gap-2">
                  <Users size={14} /> {c.participants || 0}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-3">
                  <button 
                    onClick={() => onEdit(c)}
                    className="text-gray-400 hover:text-blue-400 transition-colors p-1.5 rounded-lg hover:bg-gray-800"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete(c.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
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
  );
}