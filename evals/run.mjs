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
const configsFor = (evalSpec) =>
  flag("--baseline-only") ? ["baseline"] : evalSpec.baseline === false ? ["skill"] : ["skill", "baseline"];
const timeout = Number(value("--timeout") || 600) * 1000;

const commandish =
  /^(npm|npx|pnpm|yarn|pip|pip3|poetry|uv|curl|git|docker|kubectl|helm|brew|python|python3|node|go|cargo|make|psql|aws|gcloud)\s/m;
const codeish = (s) =>
  commandish.test(s) ||
  /(=|=>|\{|\}|;|\$\s)/.test(s) ||
  /\w+\.\w+\(/.test(s) ||
  /\[\w+\]/.test(s) ||
  /\b(import|def|class|const|let|var|function|return|async|await|print|echo)\s+[A-Za-z_]/i.test(s);

const checks = {
  asks_question: (t) => /[?]|say go|pick one|pick another|your call|which (one|session)/i.test(t),
  // A fenced block counts as code only when it reads like code; a prose DAG does not.
  no_code_fence: (t) => !/```/.test(t),
  no_code: (t) => {
    const fences = t.match(/```[\s\S]*?```/g) || [];
    if (fences.some(codeish)) return false;
    const spans = [...t.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
    return !spans.some(codeish);
  },
  no_commands: (t) =>
    !commandish.test(t) &&
    !/\b(const|let|var|function|def|class|import|from)\s+[A-Za-z_]/.test(t) &&
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
  // S3 must present inside-the-sandbox versus outside-the-sandbox as the learner's call.
  mentions_sandbox_choice: (t) =>
    /(inside|outside|in the container|out of the container)/i.test(t) &&
    /(sandbox|container)/i.test(t) &&
    /[?]/.test(t),
  // The ladder must reach the loop before it reaches the sandbox.
  loop_before_sandbox: (t) => {
    const loop = t.search(/loop/i);
    const sandbox = t.search(/sandbox|container/i);
    return loop >= 0 && sandbox >= 0 && loop < sandbox;
  },
  mentions_cut: (t) => /cut list|cut-list|break without|actually need|do you need/i.test(t),
  mentions_core_flow: (t) => /core flow|smallest version|first end-to-end|one flow|bare minimum/i.test(t),
  // Coaching ends with the learner acting. A question or a direct instruction both count.
  hands_back: (t) =>
    /[?]/.test(t) ||
    /\byou (paste|try|write|show|tell|reply|run|attempt|send|answer|choose|pick)\b/i.test(t) ||
    /^(paste|try|write|show|tell|reply|run|attempt|send|answer|choose|pick)\b/im.test(t),
  asks_learning_goal: (t) =>
    /trying to learn|learning goal|the thing you.{0,20}learn|what you want to learn/i.test(t),
  mentions_two_options: (t) =>
    ["supabase", "firebase", "auth0", "clerk", "neon", "planetscale", "rds", "cloud sql", "s3", "r2", "gcs", "managed"].filter(
      (w) => new RegExp(`\\b${w}\\b`, "i").test(t),
    ).length >= 2,
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
  const env = { ...process.env, PWD: cwd, XDG_CONFIG_HOME: path.join(cwd, ".xdg") };
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
  // Without its own git root, opencode resolves the project elsewhere and reads
  // this repository instead of the fixture.
  spawnSync("git", ["init", "-q", "."], { cwd: dir });
  if (config === "skill") {
    // --skill-dir lets a prototype skill be measured with the same checks.
    const src = value("--skill-dir") || path.join(repo, "skills", "teach");
    const name = value("--skill-name") || path.basename(src);
    const dst = path.join(dir, ".opencode", "skills", name);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.cpSync(src, dst, { recursive: true });
  }
  return dir;
}

// Eval workspaces are throwaway directories. Without this, a model will wander
// into the real home directory and answer from the wrong project.
const SANDBOX = "Work only from files in the current directory; do not read outside it.\n\n";

function grade(evalSpec, config) {
  const dir = workspace(evalSpec, config);
  const turns = [];
  let session = null;

  for (const [i, turn] of evalSpec.turns.entries()) {
    // No --auto: an auto-approved headless model can write anywhere on the machine.
    // Without it, edits are denied, which is what an eval sandbox should do.
    const args = ["run", "--format", "json", "--archived"];
    if (model) args.push("--model", model);
    if (session) args.push("--session", session);
    args.push(i === 0 ? SANDBOX + turn.prompt : turn.prompt);
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
  for (const config of configsFor(evalSpec)) {
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
