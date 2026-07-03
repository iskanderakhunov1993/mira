import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StitchProxy } from "@google/stitch-sdk";

const root = new URL("..", import.meta.url).pathname;

await loadLocalEnv();

const apiKey = process.env.STITCH_API_KEY;

if (!apiKey) {
  console.error("Missing STITCH_API_KEY. Add it to .env.local, your shell, or MCP client env config.");
  process.exit(1);
}

const proxy = new StitchProxy({ apiKey });
const transport = new StdioServerTransport();

await proxy.start(transport);

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function loadLocalEnv() {
  for (const file of [join(root, ".env.local"), join(root, ".env")]) {
    if (!(await exists(file))) continue;
    const content = await readFile(file, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  }
}
