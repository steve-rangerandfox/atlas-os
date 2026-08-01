import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export function nowIso() {
  return new Date().toISOString();
}

export function shortId(bytes = 5) {
  return randomBytes(bytes).toString("hex");
}

export function slugify(value, fallback = "mission") {
  const slug = String(value ?? "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 42);
  return slug || fallback;
}

export function clampInteger(value, min, max, fallback) {
  const number = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export function truncate(value, maxChars = 40_000) {
  const text = String(value ?? "");
  if (text.length <= maxChars) return text;
  const removed = text.length - maxChars;
  return `${text.slice(0, maxChars)}\n\n[truncated ${removed} characters]`;
}

export async function readJson(filePath, fallback = undefined) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error && error.code === "ENOENT" && fallback !== undefined) return fallback;
    throw error;
  }
}

export async function writeJsonAtomic(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const tempPath = `${filePath}.${process.pid}.${shortId(3)}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(tempPath, filePath);
}

export function ensureString(value, name, { min = 1, max = 20_000 } = {}) {
  if (typeof value !== "string") {
    throw new TypeError(`${name} must be a string`);
  }
  const text = value.trim();
  if (text.length < min) throw new TypeError(`${name} is required`);
  if (text.length > max) throw new TypeError(`${name} is too long (max ${max} characters)`);
  return text;
}

export function ensureStringArray(value, name, { maxItems = 30, itemMax = 2_000, required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new TypeError(`${name} is required`);
    return [];
  }
  if (!Array.isArray(value)) throw new TypeError(`${name} must be an array`);
  if (value.length > maxItems) throw new TypeError(`${name} has too many items (max ${maxItems})`);
  return value.map((item, index) => ensureString(item, `${name}[${index}]`, { max: itemMax }));
}

export function resolveInside(rootPath, candidate) {
  const root = path.resolve(rootPath);
  const target = path.resolve(root, candidate);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new TypeError("Path must stay inside the repository");
  }
  return target;
}

export async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
