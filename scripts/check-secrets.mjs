#!/usr/bin/env node
/**
 * Pre-push secret scan — blocks if sensitive files or patterns would be committed.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const FORBIDDEN_TRACKED = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
  "contracts/broadcast",
  "contracts/cache",
  "push-output.txt",
];

const SECRET_LINE_PATTERNS = [
  // .env-style assignments with real values (not code reading env vars)
  /^(?:DEPLOYER_PRIVATE_KEY|CDP_API_KEY_SECRET)\s*=\s*(?!["']?\s*$)\S+/,
];

/** Hardcoded 32-byte private key in source (not contract addresses). */
const PRIVATE_KEY_LITERAL = /\b0x[a-fA-F0-9]{64}\b/;

function lineLooksLikeCodeReference(line) {
  const t = line.trim();
  return (
    t.startsWith("//") ||
    t.startsWith("*") ||
    t.startsWith("#") ||
    /\b(env|process\.env)\./.test(t) ||
    /\b(const|let|var)\s+\w+\s*=\s*env\./.test(t)
  );
}

function scanContent(file, content) {
  if (file.endsWith(".example")) return;

  for (const line of content.split("\n")) {
    if (lineLooksLikeCodeReference(line)) continue;

    for (const pattern of SECRET_LINE_PATTERNS) {
      if (pattern.test(line.trim())) {
        fail(`Possible secret in tracked file: ${file}`);
      }
    }

    if (PRIVATE_KEY_LITERAL.test(line)) {
      fail(`Possible private key literal in tracked file: ${file}`);
    }
  }
}

function fail(msg) {
  console.error(`\n[SECURITY] ${msg}`);
  process.exit(1);
}

let tracked = [];
try {
  tracked = execSync("git ls-files", { cwd: root, encoding: "utf8" })
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
} catch {
  console.warn("[check-secrets] Not a git repo or git unavailable — skipping tracked scan.");
  process.exit(0);
}

for (const file of tracked) {
  for (const forbidden of FORBIDDEN_TRACKED) {
    if (file === forbidden || file.startsWith(`${forbidden}/`)) {
      fail(`Sensitive file is tracked by git: ${file}\nRun: git rm --cached "${file}"`);
    }
  }
}

for (const file of tracked) {
  if (!/\.(ts|tsx|js|mjs|json|md|example|env|sol|ps1)$/i.test(file)) continue;
  const full = join(root, file);
  if (!existsSync(full)) continue;
  const content = readFileSync(full, "utf8");
  scanContent(file, content);
}

// Staged files (about to be committed)
let staged = [];
try {
  staged = execSync("git diff --cached --name-only", { cwd: root, encoding: "utf8" })
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
} catch {
  staged = [];
}

for (const file of staged) {
  for (const forbidden of FORBIDDEN_TRACKED) {
    if (file === forbidden || file.startsWith(`${forbidden}/`)) {
      fail(`About to commit sensitive file: ${file}`);
    }
  }
}

console.log("[check-secrets] OK — no secrets in tracked or staged files.");
