import LoginForm from "@/components/LoginForm";
import {
  SESSION_COOKIE_NAME,
  validateSessionToken,
} from "@/server/utils/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function LoginPage() {
  const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken && validateSessionToken(sessionToken)) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
