import { auth } from "../../auth";
import Navbar from "../../components/Navbar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={session?.user || null} />
      
      <main className="flex-1 pt-16">
        {children}
      </main>
    </div>
  );
}