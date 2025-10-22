import BranchOnboarding from "@/features/branches/BranchOnboarding";
import { connectToDatabase } from "@/lib/mongoose";
import { Branch } from "@/models";
import {
  SESSION_COOKIE_NAME,
  validateSessionToken,
} from "@/server/utils/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Create Branch • Humpty Dumpty Admin",
  description: "Set up your first branch to start using the admin dashboard.",
};

export default async function BranchSetupPage() {
  const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = sessionToken ? validateSessionToken(sessionToken) : null;

  if (!session) {
    redirect("/login");
  }

  await connectToDatabase();
  const hasBranches = await Branch.exists({});
  if (hasBranches) {
    redirect("/dashboard");
  }

  return <BranchOnboarding />;
}
