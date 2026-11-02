import { readFile, writeFile } from "node:fs/promises";
import { buildIndex } from "../lib/rag/build.js";

const index = await buildIndex(await readFile("knowledge/profile.md", "utf8"));
await writeFile("lib/rag/index.json", JSON.stringify(index));
console.log(`Indexed ${index.chunks.length} chunks with ${index.model}`);
