import bundled from "./index.json";
import { readKey } from "@/lib/store";

function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function loadIndex() {
  return (await readKey("rag")) || bundled;
}

export function topChunks(index, queryEmbedding, k = 5) {
  return index.chunks
    .map((c) => ({ ...c, score: cosine(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
