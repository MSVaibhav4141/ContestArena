"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";

interface NavLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
}

export default function NavLink({ href, icon: Icon, label, badge }: NavLinkProps) {
  const pathname = usePathname();

  // Check if the current path matches the href. 
  // We also check if it starts with the href + '/' to keep the parent active 
  // when navigating to sub-pages (e.g., /admin/approvals/123)
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
        isActive
          ? "bg-blue-600/10 text-blue-400 font-bold"
          : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 font-medium"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={isActive ? "text-blue-400" : "text-gray-500"} />
        {label}
      </div>
      
      {/* Optional Notification Badge */}
      {badge !== undefined && badge > 0 && (
        <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}