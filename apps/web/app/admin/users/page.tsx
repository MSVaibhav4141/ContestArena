export const dynamic = 'force-dynamic';
import { prisma } from "@repo/db/prisma";
import UserManager from "./components/UserManager";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true, // Assuming you have an ADMIN / USER role enum
      createdAt: true,
    }
  });

  const formattedUsers = users.map(u => ({
    ...u,
    createdAt: u.createdAt.toLocaleDateString(),
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white">User Directory</h1>
        <p className="text-gray-500 mt-1">Manage platform access, roles, and profiles.</p>
      </div>

      <UserManager initialData={formattedUsers} />
    </div>
  );
}