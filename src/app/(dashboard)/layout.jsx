import Sidebar from "@/components/Sidebar";
import { connectToDatabase } from "@/lib/mongoose";
import { Branch } from "@/models";
import {
  SESSION_COOKIE_NAME,
  validateSessionToken,
} from "@/server/utils/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }) {
  const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = sessionToken ? validateSessionToken(sessionToken) : null;

  if (!session) {
    redirect("/login");
  }

  await connectToDatabase();
  const hasBranches = await Branch.exists({});
  if (!hasBranches) {
    redirect("/setup/branch");
  }

  const displayName = session.username
    ? session.username.charAt(0).toUpperCase() + session.username.slice(1)
    : "Administrator";

  const todaysDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 10% 20%, rgba(37,99,235,0.18), transparent 45%), radial-gradient(circle at 90% 10%, rgba(14,165,233,0.16), transparent 40%), linear-gradient(180deg, #020617 0%, #0f172a 60%, #111827 100%)",
      }}
    >
      <Sidebar username={session.username} />
      <div
        style={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        <header
          style={{
            padding: "32px 40px",
            color: "white",
            background:
              "linear-gradient(135deg, rgba(37, 99, 235, 0.95) 0%, rgba(59, 130, 246, 0.88) 48%, rgba(14, 165, 233, 0.82) 100%)",
            borderBottom: "1px solid rgba(226, 232, 240, 0.18)",
            boxShadow: "0 28px 60px -40px rgba(37, 99, 235, 0.6)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span
                style={{
                  fontSize: "14px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(226, 232, 240, 0.82)",
                }}
              >
                {todaysDate}
              </span>
              <h1
                style={{
                  margin: 0,
                  fontSize: "28px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                Admin control centre
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: "15px",
                  color: "rgba(226, 232, 240, 0.85)",
                  maxWidth: "520px",
                }}
              >
                Welcome back, {displayName}. Monitor performance, fees, staff and transport
                insights from one streamlined workspace.
              </p>
            </div>
          </div>
        </header>

        <main
          style={{
            flexGrow: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "32px 40px 48px",
            minHeight: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              minHeight: "100%",
              backgroundColor: "rgba(15, 23, 42, 0.86)",
              borderRadius: "28px",
              padding: "32px",
              border: "1px solid rgba(148, 163, 184, 0.14)",
              boxShadow:
                "0 32px 70px -40px rgba(15, 23, 42, 0.75), inset 0 1px 0 rgba(148, 163, 184, 0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
