"use client";

import { LayoutDashboard, FileCode2, Trophy, Users,Code } from 'lucide-react';
import NavLink from './NavLink';

export default function SidebarNav() {
  return (
    <nav className="flex-1 px-4 space-y-2 mt-4">
      <NavLink href="/admin" icon={LayoutDashboard} label="Dashboard" />
      <NavLink href="/admin/approvals" icon={FileCode2} label="Approvals" badge={14} />
      <NavLink href="/admin/contests" icon={Trophy} label="Contests" />
      <NavLink href="/admin/users" icon={Users} label="Users" />
      <NavLink href="/admin/problems" icon={Code} label="Problems" />
    </nav>
  );
}