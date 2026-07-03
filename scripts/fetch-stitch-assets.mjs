import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, extname, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
const defaultSourcesPath = join(root, "stitch/sources.json");
const forceSources = process.argv.includes("--sources");
const projectArg = getArgValue("--project");
const outArg = getArgValue("--out");
const ignoredValueIndexes = new Set(
  ["--project", "--out"]
    .map((name) => process.argv.indexOf(name))
    .filter((index) => index !== -1)
    .map((index) => index + 1)
);
const sourceArg = process.argv
  .slice(2)
  .find((arg, index) => !arg.startsWith("--") && !ignoredValueIndexes.has(index + 2));
const projectPath = projectArg ? join(process.cwd(), projectArg) : join(root, "stitch/project.json");
const defaultProjectSourcesPath = projectArg?.endsWith("project.ru.json")
  ? join(root, "stitch/sources.ru.json")
  : defaultSourcesPath;
const sourcesPath = sourceArg ? join(process.cwd(), sourceArg) : defaultProjectSourcesPath;
const outRoot = outArg ? join(process.cwd(), outArg) : join(root, "stitch");

await loadLocalEnv();

function getArgValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${name}`);
  }
  return value;
}

function assertHttpUrl(value, label) {
  if (!value) return;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} is not a valid URL: ${value}`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`${label} must be http(s): ${value}`);
  }
}

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

function extensionFromUrl(url, fallback) {
  const parsed = new URL(url);
  const ext = extname(parsed.pathname);
  return ext || fallback;
}

async function downloadWithFetch(url, outputPath) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, bytes);
}

async function download(url, outputPath) {
  await mkdir(dirname(outputPath), { recursive: true });

  const curl = spawnSync("curl", ["-L", "--fail", "--silent", "--show-error", "--output", outputPath, url], {
    encoding: "utf8",
  });
  if (curl.status === 0) return "curl";

  await downloadWithFetch(url, outputPath);
  return "fetch";
}

async function main() {
  const project = JSON.parse(await readFile(projectPath, "utf8"));
  let sources;

  if (!forceSources && process.env.STITCH_API_KEY) {
    sources = await getSourcesFromSdk(project);
  } else if (await exists(sourcesPath)) {
    sources = JSON.parse(await readFile(sourcesPath, "utf8"));
  } else {
    const examplePath = projectArg?.endsWith("project.ru.json")
      ? "stitch/sources.ru.example.json"
      : "stitch/sources.example.json";
    const localSourcesPath = sourcesPath.replace(root, "");
    throw new Error(
      `Missing STITCH_API_KEY and ${localSourcesPath}. Set STITCH_API_KEY for SDK import, or copy ${examplePath} to ${localSourcesPath} and replace example URLs with Stitch hosted URLs.`
    );
  }

  const sourceScreens = sources.screens ?? {};
  const manifest = {
    project: project.project,
    importedAt: new Date().toISOString(),
    screens: [],
  };

  for (const screen of project.screens) {
    const source = sourceScreens[screen.id] ?? {};
    const item = {
      ...screen,
      imageUrl: source.imageUrl ?? null,
      codeUrl: source.codeUrl ?? null,
      imagePath: null,
      codePath: null,
      skipped: [],
    };

    assertHttpUrl(source.imageUrl, `${screen.name} imageUrl`);
    assertHttpUrl(source.codeUrl, `${screen.name} codeUrl`);

    if (source.imageUrl) {
      const imageExt = extensionFromUrl(source.imageUrl, ".png");
      const imagePath = join(outRoot, "assets", `${screen.slug}${imageExt}`);
      const method = await download(source.imageUrl, imagePath);
      item.imagePath = imagePath.replace(root, "");
      item.imageDownloadMethod = method;
    } else {
      item.skipped.push("imageUrl");
    }

    if (source.codeUrl) {
      const codeExt = extensionFromUrl(source.codeUrl, ".tsx");
      const codePath = join(outRoot, "code", `${screen.slug}${codeExt}`);
      const method = await download(source.codeUrl, codePath);
      item.codePath = codePath.replace(root, "");
      item.codeDownloadMethod = method;
    } else {
      item.skipped.push("codeUrl");
    }

    manifest.screens.push(item);
  }

  await mkdir(join(outRoot, "meta"), { recursive: true });
  await writeFile(join(outRoot, "meta/manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  const downloaded = manifest.screens.filter((screen) => screen.imagePath || screen.codePath).length;
  console.log(`Imported Stitch project "${project.project.title}" (${downloaded}/${project.screens.length} screens had assets).`);
  console.log("Manifest: stitch/meta/manifest.json");
}

async function getSourcesFromSdk(projectConfig) {
  const { stitch } = await import("@google/stitch-sdk");
  const project = stitch.project(projectConfig.project.id);
  const screens = await project.screens();
  const byId = new Map(screens.map((screen) => [screen.screenId ?? screen.id, screen]));
  const sources = {
    projectId: projectConfig.project.id,
    screens: {},
  };

  for (const expected of projectConfig.screens) {
    const screen = byId.get(expected.id);
    if (!screen) {
      sources.screens[expected.id] = {};
      continue;
    }
    sources.screens[expected.id] = {
      imageUrl: await screen.getImage(),
      codeUrl: await screen.getHtml(),
    };
  }

  return sources;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
