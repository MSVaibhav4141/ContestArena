"use client";

import { useState } from "react";
import { Search, MoreVertical, ShieldPlus, ShieldMinus, Trash2 } from "lucide-react";
import { updateUserRole, deleteUser } from "../../../actions/action";

export default function UserManager({ initialData }: { initialData: any[] }) {
  const [users, setUsers] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Track which user's action menu is currently open
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- HANDLERS ---

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    
    // 1. Optimistic UI Update (Instant feedback)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setOpenMenuId(null); // Close menu

    // 2. Call Server Action
    const result = await updateUserRole(userId, newRole);
    if (!result.success) {
      // Revert if it failed (Optional: show a toast notification here)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: currentRole } : u));
      alert("Failed to update user role.");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user? This cannot be undone.")) return;

    // 1. Optimistic UI Update
    const previousUsers = [...users];
    setUsers(prev => prev.filter(u => u.id !== userId));
    setOpenMenuId(null);

    // 2. Call Server Action
    const result = await deleteUser(userId);
    if (!result.success) {
      // Revert if failed
      setUsers(previousUsers);
      alert("Failed to delete user.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Invisible overlay to close dropdown when clicking outside */}
      {openMenuId && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
      )}

      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <div className="relative z-10">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#1a1a1a] border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none w-80" 
          />
        </div>
      </div>

      {/* User Table */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-visible">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#242424] text-gray-400 font-medium border-b border-gray-800">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Joined Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                
                {/* User Info Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                      {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <div className="font-bold text-gray-200">{u.name || 'Anonymous User'}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                
                {/* Role Column */}
                <td className="px-6 py-4">
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${
                    u.role === 'ADMIN' 
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                      : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}>
                    {u.role}
                  </span>
                </td>
                
                <td className="px-6 py-4 text-gray-400">{u.createdAt}</td>
                
                {/* Actions Column with Dropdown */}
                <td className="px-6 py-4 text-right relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                    className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-gray-800 relative z-50"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === u.id && (
                    <div className="absolute right-8 top-10 w-48 bg-[#242424] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      
                      {/* Toggle Role Button */}
                      <button 
                        onClick={() => handleRoleChange(u.id, u.role)}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors border-b border-gray-700/50"
                      >
                        {u.role === "ADMIN" ? (
                          <><ShieldMinus size={16} className="text-yellow-500" /> Revoke Admin</>
                        ) : (
                          <><ShieldPlus size={16} className="text-purple-400" /> Make Admin</>
                        )}
                      </button>

                      {/* Delete Button */}
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 size={16} /> Delete User
                      </button>
                      
                    </div>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}