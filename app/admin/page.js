import { connection } from "next/server";
import { Suspense } from "react";
import AdminPanel from "@/components/admin/AdminPanel";
import Login from "@/components/admin/Login";
import { adminEnabled, isAdmin } from "@/lib/auth";
import { getChatGaps, getContent, getKnowledge } from "@/lib/store";

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
  const [content, knowledge, gaps] = await Promise.all([getContent(), getKnowledge(), getChatGaps()]);
  return <AdminPanel initialContent={content} initialKnowledge={knowledge} initialGaps={gaps} />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="p-10 font-mono text-sm">Loading…</p>}>
      <Gate />
    </Suspense>
  );
}
