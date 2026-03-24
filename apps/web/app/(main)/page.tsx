export const dynamic = "force-dynamic";

import { auth } from "../../auth";
import LandingClient from "../../components/LandingClient";

export default async function Home() {
  const session = await auth();

  return (
    <LandingClient
      isLoggedIn={!!session?.user}
      userName={session?.user?.name}
    />
  );
}
