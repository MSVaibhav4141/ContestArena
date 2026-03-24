"use client";

import { useState } from "react";
import { registerForContest } from "../../../../actions/action";
import { CheckCircle } from "lucide-react";

export default function RegisterButton({ contestId, userId, isRegistered }: { contestId: string, userId: string, isRegistered: boolean }) {
  const [loading, setLoading] = useState(false);

  if (isRegistered) {
    return (
      <button disabled className="bg-[#1e1e1e] text-emerald-500 border border-emerald-500/20 px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed w-full shadow-inner">
        <CheckCircle size={18} /> Registered
      </button>
    );
  }

  const handleRegister = async () => {
    setLoading(true);
    const res = await registerForContest(contestId, userId);
    
    if (!res.success) {
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={handleRegister} 
      disabled={loading}
      className="relative overflow-hidden bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-500 transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 w-full group"
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Registering...
          </>
        ) : (
          "Register for Contest"
        )}
      </span>
    </button>
  );
}

export const dynamic = 'force-dynamic';
