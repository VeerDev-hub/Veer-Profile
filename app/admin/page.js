import { connection } from "next/server";
import { Suspense } from "react";
import AdminPanel from "@/components/admin/AdminPanel";
import Login from "@/components/admin/Login";
import { adminEnabled, isAdmin } from "@/lib/auth";
import { getAnalytics, getChatGaps, getContent, getKnowledge } from "@/lib/store";

const DEFAULT_ANALYTICS_DAYS = 30;

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

async function Gate() {
  await connection();
  if (!adminEnabled()) {
    return (
      <p className="p-10 font-mono text-sm">
        Admin is off. Set ADMIN_PASSWORD in the environment and restart the server.
      </p>
    );
  }
  if (!(await isAdmin())) return <Login />;
  const [content, knowledge, gaps, analytics] = await Promise.all([
    getContent(),
    getKnowledge(),
    getChatGaps(),
    getAnalytics(DEFAULT_ANALYTICS_DAYS).catch((err) => {
      console.error(err);
      return null; // Stats shouldn't lock the owner out of editing the site.
    }),
  ]);
  return <AdminPanel initialContent={content} initialKnowledge={knowledge} initialGaps={gaps} initialAnalytics={analytics} />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="p-10 font-mono text-sm">Loading…</p>}>
      <Gate />
    </Suspense>
  );
}
