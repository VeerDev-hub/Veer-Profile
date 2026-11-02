"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/admin/actions";

export default function Login() {
  const router = useRouter();
  const [state, action, pending] = useActionState(login, null);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <form action={action} className="w-full max-w-xs space-y-4">
        <h1 className="text-3xl font-medium tracking-tight">Admin</h1>
        <input
          name="password"
          type="password"
          required
          autoFocus
          disabled={state?.locked}
          autoComplete="current-password"
          aria-label="Password"
          placeholder="Password"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-accent"
        />
        {state?.error && <p role="alert" className="text-sm text-accent">{state.error}</p>}
        <button disabled={pending || state?.locked} className="w-full rounded-xl bg-accent px-4 py-3 text-white disabled:opacity-50">
          {pending ? "Checking…" : "Log in"}
        </button>
      </form>
    </main>
  );
}
