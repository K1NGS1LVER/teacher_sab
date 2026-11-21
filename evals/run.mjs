#!/usr/bin/env node
// Model-in-the-loop evals for the teach skill.
//
// Each eval runs in a throwaway workspace twice: once with the skill installed
// and once without it (baseline). Assertions run against the final reply text.
// The baseline exists to prove the checks discriminate, not to gate.
//
// Usage:
//   node evals/run.mjs                 # with-skill + baseline
//   node evals/run.mjs --baseline-only # baseline only
//   node evals/run.mjs --only build-mode-ban
//   node evals/run.mjs --model opencode/deepseek-v4.1-flash-free
//
// Requires the `opencode` CLI on PATH and a configured provider.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const spec = JSON.parse(fs.readFileSync(path.join(here, "evals.json"), "utf8"));

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const value = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? null : argv[i + 1];
};

const only = value("--only");
const model = value("--model") || spec.model;
const configs = flag("--baseline-only") ? ["baseline"] : ["skill", "baseline"];
const timeout = Number(value("--timeout") || 600) * 1000;

const checks = {
  asks_question: (t) => /[?]/.test(t),
  no_code_fence: (t) => !/```/.test(t),
  no_code: (t) => !/```/.test(t) && !/`[^`\n]*(=|\(|\)|\{|\}|;|=>)[^`\n]*`/.test(t),
  no_commands: (t) =>
    !/\b(npm|npx|pip|pip3|poetry|uv|curl|git|docker|kubectl|helm|brew)\s+[a-z-]/i.test(t) &&
    !/\b(const|let|var|function|def|class|import|from)\s+[A-Za-z_]/i.test(t) &&
    !/=>/.test(t),
  offers_intensity: (t) =>
    ["overview", "working", "comprehensive"].filter((w) => new RegExp(`\\b${w}\\b`, "i").test(t)).length >= 2,
  short_reply: (t) => t.trim().split(/\s+/).filter(Boolean).length < 400,
  mentions_docker: (t) => /docker/i.test(t),
  mentions_build_project: (t) => /agent[ -]?service/i.test(t),
  names_next_stage: (t) => /stage\s*1\b/i.test(t),
  logs_session: (t, ctx) =>
    mdFiles(path.join(ctx.dir, "study-artifacts")).length > 0 ||
    /Study log\s*-\s*save this under/i.test(t),
};

function mdFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...mdFiles(full));
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

function run(cwd, args) {
  const env = { ...process.env, XDG_CONFIG_HOME: path.join(cwd, ".xdg") };
  fs.mkdirSync(env.XDG_CONFIG_HOME, { recursive: true });
  const r = spawnSync("opencode", args, { cwd, env, timeout, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw new Error(`opencode failed: ${r.error.message}`);
  const lines = (r.stdout || "")
    .trim()
    .split("\n")
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  const text = lines
    .filter((e) => e.type === "text" && e.part?.text)
    .map((e) => e.part.text)
    .join("\n");
  const session = lines.find((e) => e.sessionID)?.sessionID;
  return { text, session, stderr: r.stderr, status: r.status };
}

function workspace(evalSpec, config) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `teach-eval-${evalSpec.id}-`));
  fs.cpSync(path.join(here, evalSpec.fixture), dir, { recursive: true });
  if (config === "skill") {
    const dst = path.join(dir, ".opencode", "skills", "teach");
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.cpSync(path.join(repo, "skills", "teach"), dst, { recursive: true });
  }
  return dir;
}

function grade(evalSpec, config) {
  const dir = workspace(evalSpec, config);
  const turns = [];
  let session = null;

  for (const [i, turn] of evalSpec.turns.entries()) {
    const args = ["run", "--format", "json", "--archived", "--auto"];
    if (model) args.push("--model", model);
    if (session) args.push("--session", session);
    args.push(turn.prompt);
    const out = run(dir, args);
    session = out.session || session;
    const failed = (turn.checks || []).filter((c) => {
      const fn = checks[c];
      if (!fn) throw new Error(`unknown check: ${c}`);
      return !fn(out.text, { dir });
    });
    turns.push({ n: i + 1, prompt: turn.prompt, text: out.text, checks: turn.checks || [], failed });
  }

  const failed = turns.flatMap((t) => t.failed);
  return { dir, turns, failed, passed: failed.length === 0 };
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const resultsDir = path.join(here, "results", stamp);
fs.mkdirSync(resultsDir, { recursive: true });

const rows = [];
let failures = 0;

for (const evalSpec of spec.evals) {
  if (only && evalSpec.id !== only) continue;
  for (const config of configs) {
    process.stdout.write(`${evalSpec.id} [${config}] ... `);
    const result = grade(evalSpec, config);
    const status = result.passed ? "PASS" : `FAIL (${result.failed.join(", ")})`;
    console.log(status);
    if (config === "skill" && !result.passed) failures += 1;

    const body = result.turns
      .map(
        (t) =>
          `## Turn ${t.n}\n\n**Prompt:** ${t.prompt}\n\n**Checks:** ${t.checks
            .map((c) => `${checks[c](t.text, { dir: result.dir }) ? "pass" : "FAIL"} ${c}`)
            .join(", ")}\n\n**Reply:**\n\n${t.text}\n`,
      )
      .join("\n");
    fs.writeFileSync(
      path.join(resultsDir, `${evalSpec.id}.${config}.md`),
      `# ${evalSpec.id} (${config})\n\n${evalSpec.why}\n\n${body}`,
    );

    rows.push({ id: evalSpec.id, config, status, words: result.turns.at(-1).text.trim().split(/\s+/).filter(Boolean).length });
  }
}

fs.writeFileSync(
  path.join(resultsDir, "summary.md"),
  [
    "# Skill eval summary",
    "",
    `Model: ${model || "(harness default)"}`,
    "",
    "| Eval | Config | Result | Words |",
    "| --- | --- | --- | --- |",
    ...rows.map((r) => `| ${r.id} | ${r.config} | ${r.status} | ${r.words} |`),
    "",
  ].join("\n"),
);

console.log(`\nTranscripts: ${resultsDir}`);
console.log(failures === 0 ? "All with-skill checks passed." : `${failures} eval(s) failed with the skill installed.`);
process.exit(failures === 0 ? 0 : 1);
