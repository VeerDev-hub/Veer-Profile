import { hashIp } from "@/lib/rateLimit";
import { clearLoginFailures, loginFailures, recordLoginFailure } from "@/lib/store";

const MAX_FAILURES = 3;
const WINDOW_MS = 15 * 60 * 1000;
// Backstop for attackers rotating IPs. It locks everyone, so it sits well above normal use.
const MAX_FAILURES_ALL_IPS = 20;

function locked(oldest) {
  const ms = Math.max(oldest + WINDOW_MS - Date.now(), 0);
  return { locked: true, minutes: Math.max(Math.ceil(ms / 60_000), 1) };
}

async function status(id) {
  const since = Date.now() - WINDOW_MS;
  const { count, oldest, total, oldestOverall } = await loginFailures(id, since);
  if (count >= MAX_FAILURES) return { count, ...locked(oldest) };
  if (total >= MAX_FAILURES_ALL_IPS) return { count, ...locked(oldestOverall) };
  return { count, locked: false };
}

// The failure is recorded before the password is checked, so parallel requests can't
// squeeze in extra guesses. A correct password clears it again.
export async function tryLogin(ip, isCorrect) {
  const id = hashIp(ip);
  const before = await status(id);
  if (before.locked) return before;

  await recordLoginFailure(id, Date.now() - WINDOW_MS);
  const { count } = await status(id);
  if (count > MAX_FAILURES) return status(id);

  if (isCorrect()) {
    await clearLoginFailures(id);
    return { ok: true };
  }
  if (count >= MAX_FAILURES) return status(id);
  return { attemptsLeft: MAX_FAILURES - count };
}
