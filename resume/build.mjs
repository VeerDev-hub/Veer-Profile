// Builds public/resume.pdf from resume/resume.html with headless Chrome or Edge.
// Usage: node resume/build.mjs
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = path.join(root, "resume", "resume.html");
const output = path.join(root, "public", "resume.pdf");

const browsers = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const browser = browsers.find((b) => existsSync(b));
if (!browser) throw new Error("No Chrome or Edge found. Set CHROME_PATH.");

execFileSync(browser, [
  "--headless=new",
  "--disable-gpu",
  "--no-pdf-header-footer",
  `--print-to-pdf=${output}`,
  pathToFileURL(source).href,
], { stdio: "ignore" });
console.log(`Wrote ${path.relative(root, output)}`);
