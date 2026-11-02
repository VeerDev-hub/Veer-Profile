import { connection } from "next/server";
import { readKey } from "@/lib/store";

export async function GET(request) {
  await connection();
  const resume = await readKey("resumeFile");
  if (!resume) return Response.redirect(new URL("/resume.pdf", request.url));

  return new Response(Buffer.from(resume.data, "base64"), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${resume.name}"`,
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
